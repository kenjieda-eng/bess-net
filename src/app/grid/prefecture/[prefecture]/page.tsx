// /grid/prefecture/[prefecture] — 都道府県別変電所一覧（v25）
// generateStaticParams で全都道府県（約30件）を SSG。空容量大きい順にソート。
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {
  getAvailablePrefectures,
  getSubstationsByPrefecture,
} from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';
import { formatDataDateLabelForAreas } from '@/lib/grid-data-date';
// 落とし穴 #116 の恒久策(2026-08-16): 県一覧も build 時 precompute の静的データを使う
import { getPrefectureSubstationsStatic } from '@/lib/grid-static-lists';
import substationsIndex from '@/data/substations/index.json';
import {
  buildPrefTitle,
  buildPrefDescription,
  operatorLabelMulti,
  subsidyCountForPref,
} from '@/lib/grid-meta';

// Gr6/Gr8(2026-08-09): 県 → 件数・管轄エリア・事業者（precompute・runtime fetch 0）
type PrefMeta = { count: number; areas: string[]; operators: string[] };
const PREF_META: Record<string, PrefMeta> =
  (substationsIndex as { pref_meta?: Record<string, PrefMeta> }).pref_meta ?? {};

import projectsPrefCount from '@/lib/generated/projects-pref-count.json';

// Gr4(2026-08-08): 県別プロジェクト件数（precompute・runtime 0・0件の県は非表示）
const PREF_PROJECT_COUNT = projectsPrefCount as Record<string, number>;

export const revalidate = 3600;

type PageParams = { params: { prefecture: string } };

export async function generateStaticParams(): Promise<{ prefecture: string }[]> {
  try {
    const prefs = await getAvailablePrefectures();
    // ★ 生（デコード済み）の都道府県名を返す。Next.js が静的パス生成時に
    //   自動でエンコードするため、ここで encodeURIComponent すると二重
    //   エンコードになりルート不一致 → 直リンク 404（全47都道府県）。
    //   ページ側は decodeURIComponent(params.prefecture) で受ける。
    return prefs.map((p) => ({ prefecture: p }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const decoded = decodeURIComponent(params.prefecture);
  // Gr6(2026-08-09): 管轄する一般送配電事業者名と件数を title/description に出す。
  // ※47県の title は従来すべて同一テンプレートで、CTR差（三重3.16% vs 静岡0.82%）は
  //   title では説明できない（順位も 6.57 vs 6.56 でほぼ同一）。本変更は
  //   「◯◯電力 空き容量」という検索語への当たり判定を増やすためのもの。
  const meta = PREF_META[decoded];
  const operators = meta?.operators ?? [];
  const count = meta?.count ?? null;
  const title = buildPrefTitle(decoded, operators, count);
  const description = buildPrefDescription(
    decoded,
    operators,
    count,
    formatDataDateLabelForAreas(meta?.areas ?? [])
  );
  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `/grid/prefecture/${encodeURIComponent(decoded)}` },
    openGraph: { title, description, type: 'website' },
  };
}

export default async function PrefecturePage({ params }: PageParams) {
  const decoded = decodeURIComponent(params.prefecture);
  const subs = getPrefectureSubstationsStatic(decoded);
  if (subs.length === 0) notFound();

  // Gr6/Gr8: 管轄エリア・事業者（precompute の pref_meta）
  const prefMeta = PREF_META[decoded];
  const prefOperators = prefMeta?.operators ?? [];

  const positive = subs.filter((s) => (s.cap_avail_mw ?? 0) > 0).length;
  const n1 = subs.filter((s) => s.n1_eligible === true).length;
  const totalCap = subs.reduce(
    (sum, s) => sum + (typeof s.cap_avail_mw === 'number' ? s.cap_avail_mw : 0),
    0
  );


  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: '系統空き容量',
        item: 'https://bess-net.jp/grid',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: '都道府県別',
        item: 'https://bess-net.jp/grid/prefecture',
      },
      {
        '@type': 'ListItem',
        position: 4,
        name: decoded,
        item: `https://bess-net.jp/grid/prefecture/${encodeURIComponent(decoded)}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/grid">系統空き容量</Link> /{' '}
            <Link href="/grid/prefecture">都道府県別</Link> / {decoded}
          </p>

          <h1 className="page-title">{decoded}の変電所一覧（{subs.length}件）</h1>
          <p className="page-lead">
            蓄電所ネット 統合データベースから {decoded} の変電所{' '}
            {subs.length}件を空容量大きい順に一覧表示しています。連系検討の初期スクリーニングに。
          </p>

          {/* データ基準日: microCMS 実値（precompute area_dates）から供給（Gr2是正・2026-08-08） */}
          {formatDataDateLabelForAreas(subs.map((s) => s.area || '')) && (
            <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '-8px 0 16px' }}>
              データ基準日: {formatDataDateLabelForAreas(subs.map((s) => s.area || ''))}
            </p>
          )}

          {/* Gr3+Gr4(2026-08-08): 逆ブリッジ＋県内案件リンク（ゼロfetch） */}
          <section className="page-section news-shelf" style={{ marginBottom: 20 }}>
            <h2 className="news-shelf-title" style={{ fontSize: 16 }}>このデータの読み方・関連</h2>
            <ul className="lv-invest-rows">
              <li><Link href="/explainer/grid-capacity-map-reading">解説: 空き容量マップの読み方</Link></li>
              <li><Link href="/glossary/grid-available-capacity">用語: 系統空き容量とは</Link></li>
              {PREF_PROJECT_COUNT[decoded] ? (
                <li>
                  <Link href="/projects">この県の蓄電所案件 {PREF_PROJECT_COUNT[decoded]}件 → プロジェクトDB</Link>
                </li>
              ) : null}
              {/* Gr8(2026-08-09): この県で使える補助金（applicable_prefs 由来・0件は非表示） */}
              {subsidyCountForPref(decoded) > 0 ? (
                <li>
                  <Link href="/subsidies">
                    この県で使える補助金 {subsidyCountForPref(decoded)}件 → 補助金カレンダー
                  </Link>
                </li>
              ) : null}
              <li>
                <Link href="/tools/grid-connection-check">系統連系診断（事業条件から可否の目安を確認）</Link>
              </li>
              <li>
                {/* Gr11-①(2026-08-25): データに県の区分がある県は prefecture= を引き継いで検索を開く。
                    区分が無い県（関西の2府4県など）は従来どおりエリアで開く */}
                {subs.length > 0 && subs.some((x) => x.prefecture === decoded) ? (
                  <Link href={`/grid/search?prefecture=${encodeURIComponent(decoded)}&cap_avail_min=10`}>
                    {decoded}内で空容量10MW以上を検索（条件で絞り込む）
                  </Link>
                ) : (
                  <Link
                    href={`/grid/search?area=${encodeURIComponent(prefMeta?.areas?.[0] ?? '')}&cap_min=10`}
                  >
                    {operatorLabelMulti(prefOperators)}管内で空容量10MW以上を検索
                  </Link>
                )}
              </li>
            </ul>
          </section>

          <section className="grid-section">
            <h2 className="grid-section-h2">サマリ統計</h2>
            <div className="grid-stats">
              <div className="grid-stat-card">
                <div className="grid-stat-num">{subs.length}</div>
                <div className="grid-stat-label">変電所件数</div>
              </div>
              <div className="grid-stat-card">
                <div className="grid-stat-num">{positive}</div>
                <div className="grid-stat-label">
                  空容量プラス（{Math.round((positive / subs.length) * 100)}%）
                </div>
              </div>
              <div className="grid-stat-card">
                <div className="grid-stat-num">{n1}</div>
                <div className="grid-stat-label">
                  N-1電制適用可（{Math.round((n1 / subs.length) * 100)}%）
                </div>
              </div>
              <div className="grid-stat-card">
                <div className="grid-stat-num">{totalCap.toFixed(1)}</div>
                <div className="grid-stat-label">合計空容量 (MW)</div>
              </div>
            </div>
          </section>

          {/* 系統連系診断CTA */}
          <section style={{
            margin: '8px 0 24px',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '2px solid #2563eb',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#1e40af' }}>
                ⚡ {decoded}の変電所で系統連系を診断する
              </p>
              <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', lineHeight: 1.5 }}>
                連系候補変電所の特定・N-1電制の可否・接続コスト概算（平均エンゲージ92秒）
              </p>
            </div>
            <Link
              href={`/tools/grid-connection-check?prefecture=${encodeURIComponent(decoded)}`}
              style={{
                padding: '10px 20px',
                background: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '15px',
                whiteSpace: 'nowrap',
              }}
            >
              系統連系診断を始める →
            </Link>
          </section>

          <section className="grid-section">
            <h2 className="grid-section-h2">変電所一覧（空容量大きい順）</h2>
            <ul className="grid-search-list">
              {subs.map((s) => (
                <li key={s.slug} className="grid-search-item">
                  <Link href={`/grid/${s.slug}`} className="grid-search-link">
                    <strong>{s.name}</strong>
                    <span className="grid-search-meta">
                      {s.operator}
                      {' ／ '}
                      {s.area}エリア
                      {s.voltage_primary_kv != null &&
                        ` ／ ${s.voltage_primary_kv}kV`}
                      {s.cap_avail_mw != null
                        ? ` ／ 空容量 ${s.cap_avail_mw}MW`
                        : ' ／ 空容量 —'}
                      {s.n1_eligible && ' ／ N-1電制可'}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="grid-source-note">
            データソース: {siteConfig.organization.name}{' '}
            編集部が、10送配電事業者の公開情報を整理。最新情報は各社の公式サイトをご確認ください。
            <Link href="/tracker/grid" className="grid-area-link" style={{ marginLeft: 8 }}>更新タイムライン →</Link>
          </p>

          <p className="back-link">
            <Link href="/grid/prefecture">← 都道府県別一覧へ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
