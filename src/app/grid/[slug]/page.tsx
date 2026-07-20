// /grid/[slug] 個別変電所 + エリアページの統合ルート — Phase 5
// slug の値で分岐:
//   - 'tohoku' / 'hokuriku' / 'shikoku' → エリアページ (AreaPage コンポーネント)
//   - それ以外 → 変電所詳細ページ
// データ提供元の明記は落とし穴45対応。
// Next.js は同階層に2つの動的ルート ([area] と [slug]) を共存させられないため、
// 既存 [slug] にエリア用ロジックを集約しています。
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import RelatedOperatorBadges from '@/components/RelatedOperatorBadges';
import RelatedNewsList from '@/components/RelatedNewsList';
import RelatedTermBadges from '@/components/RelatedTermBadges';
import HazardRiskCard from '@/components/HazardRiskCard';
import AreaPage from './AreaPage';
import { AREA_META, AREA_JP_TO_SLUG } from './area-meta';
import { GRID_PAGE_RELATED_TERMS } from './related-terms';
import {
  getSubstationBySlug,
  getSubstationSlugsWithCoords,
  getRelatedOperatorsForSubstation,
  getRelatedNewsForSubstation,
} from '@/lib/microcms';
import { getNearbyProjects } from '@/lib/related-cards';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600; // 1時間

// 落とし穴 #79 対策: 全 6,516 件 pre-build すると Vercel 45min timeout に
// 引っかかるため、緯度経度ありの substations（~1,081件、中部エリア）+ AREA_META
// のみを pre-build する。残りの substations は dynamicParams=true (Next.js default)
// により初回アクセス時に ISR on-demand で生成される。
export const dynamicParams = true;

export async function generateStaticParams() {
  // 'tokyo' は静的セグメント /grid/tokyo/page.tsx が担当（落とし穴 #57）。
  // ここで生成すると静的ルートと衝突するため除外する。
  const areaParams = Object.keys(AREA_META)
    .filter((slug) => slug !== 'tokyo')
    .map((slug) => ({ slug }));
  try {
    const subs = await getSubstationSlugsWithCoords();
    return [...areaParams, ...subs];
  } catch {
    return areaParams;
  }
}

/** 数値整形（小数1桁、null 時 "情報なし"） */
function fmtNum(v: number | undefined | null, unit = ''): string {
  if (v === undefined || v === null || Number.isNaN(v)) return '情報なし';
  const n = typeof v === 'number' ? v : Number(v);
  if (Number.isNaN(n)) return '情報なし';
  // 整数なら整数、小数なら小数1桁
  const formatted = Number.isInteger(n) ? n.toString() : n.toFixed(1);
  return `${formatted}${unit}`;
}

/** 文字列フィールド（null/空 → "情報なし"） */
function fmtStr(v: string | undefined | null, fallback = '情報なし'): string {
  if (!v) return fallback;
  const s = String(v).trim();
  return s.length > 0 ? s : fallback;
}

/** 日付 ISO → YYYY-MM-DD */
function fmtDate(iso: string | undefined | null): string {
  if (!iso) return '情報なし';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '情報なし';
  return d.toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });
}

/** N-1電制適用可否のラベル */
function fmtN1(v: boolean | undefined | null): string {
  if (v === true) return '可';
  if (v === false) return '不可';
  return '情報なし';
}

/** 一次セレクトを文字列で取り出す（select 系は配列） */
function firstOf(arr: string[] | undefined): string | undefined {
  return arr && arr.length > 0 ? arr[0] : undefined;
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  // エリアページ用メタデータ
  const area = AREA_META[params.slug];
  if (area) {
    return {
      // layout.tsx titleTemplate が自動付与（落とし穴 #86）
      title: `${area.areaJp}エリア｜蓄電池 系統空き容量DB`,
      description: area.description.substring(0, 160),
      alternates: { canonical: `/grid/${area.slug}` },
      openGraph: {
        title: `${area.areaJp}エリア｜蓄電池 系統空き容量DB`,
        description: area.description.substring(0, 160),
        type: 'website',
        images: ['/og-image.png'],
      },
    };
  }

  const sub = await getSubstationBySlug(params.slug);
  if (!sub) return {};
  const operator = firstOf(sub.operator) || '';
  const vc = firstOf(sub.voltage_class) || '';
  const avail = sub.cap_avail_mw;
  const availStr = avail !== undefined && avail !== null ? `${avail}MW` : '情報なし';
  const desc = `${sub.name}（${operator}・${vc}）の系統空き容量・連系条件・出力制御情報。空容量${availStr}。出典・最終更新日明記、蓄電所事業の検討材料に。`;
  return {
    // layout.tsx titleTemplate が自動付与（落とし穴 #86）
    title: `${sub.name}の系統空き容量・蓄電池連系条件`,
    description: desc.substring(0, 160),
    alternates: { canonical: `/grid/${sub.slug}` },
    openGraph: {
      title: `${sub.name}の系統空き容量・蓄電池連系条件`,
      description: desc.substring(0, 160),
      type: 'article',
      images: ['/og-image.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${sub.name}の系統空き容量・蓄電池連系条件`,
      description: desc.substring(0, 160),
    },
  };
}

// 関連用語の固定リンク → ./related-terms.ts に集約（落とし穴 #59 対応：実在slug 検証済み）
const FIXED_RELATED_TERMS = GRID_PAGE_RELATED_TERMS;

export default async function GridSlugPage({
  params,
}: {
  params: { slug: string };
}) {
  // slug がエリアスラグなら AreaPage へディスパッチ
  const area = AREA_META[params.slug];
  if (area) {
    return <AreaPage meta={area} />;
  }

  const sub = await getSubstationBySlug(params.slug);
  if (!sub) notFound();

  const operatorName = firstOf(sub.operator);
  const areaName = firstOf(sub.area);
  const voltageClass = firstOf(sub.voltage_class);
  const ocPossibility = firstOf(sub.oc_possibility);
  const areaSlug = areaName ? AREA_JP_TO_SLUG[areaName] : undefined;

  // 関連連携を並列取得
  const [relatedOps, relatedNews, nearbyProjects] = await Promise.all([
    operatorName
      ? getRelatedOperatorsForSubstation(operatorName, 5).catch(() => [])
      : Promise.resolve([]),
    getRelatedNewsForSubstation(
      sub.prefecture || sub.name || '',
      5
    ).catch(() => []),
    // 依頼AA Phase 4: 半径10km以内の projects（緯度経度なし substation は早期return で空配列）
    getNearbyProjects({
      origin: { latitude: sub.latitude, longitude: sub.longitude },
      radiusKm: 10,
      limit: 5,
    }).catch(() => []),
  ]);

  const relatedOpsBadges = relatedOps.map((o) => ({
    name: o.name,
    slug: o.slug,
  }));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: sub.name,
    description: `${operatorName ?? ''} ${voltageClass ?? ''} 変電所`.trim(),
    address: sub.prefecture
      ? {
          '@type': 'PostalAddress',
          addressRegion: sub.prefecture,
          addressCountry: 'JP',
        }
      : undefined,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    isAccessibleForFree: true,
    license: sub.source_url,
  };

  // BreadcrumbList JSON-LD: トップ > 系統空き容量 > {エリア}エリア > {都道府県} > {変電所名}
  const breadcrumbItems: { name: string; item: string }[] = [
    { name: 'トップ', item: 'https://bess-net.jp/' },
    { name: '系統空き容量', item: 'https://bess-net.jp/grid' },
  ];
  if (areaName && areaSlug) {
    breadcrumbItems.push({
      name: `${areaName}エリア`,
      item: `https://bess-net.jp/grid/${areaSlug}`,
    });
  }
  if (sub.prefecture) {
    breadcrumbItems.push({
      name: sub.prefecture,
      item: `https://bess-net.jp/grid/${sub.slug}`,
    });
  }
  breadcrumbItems.push({
    name: sub.name,
    item: `https://bess-net.jp/grid/${sub.slug}`,
  });
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbItems.map((b, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: b.name,
      item: b.item,
    })),
  };

  // 数値の表示用
  const capTotal = fmtNum(sub.capacity_total_mw, ' MW');
  const capOp = fmtNum(sub.cap_operational_mw, ' MW');
  const flow = fmtNum(sub.forecast_flow_mw, ' MW');
  const capAvail = fmtNum(sub.cap_avail_mw, ' MW');
  const capAvailUpper = fmtNum(sub.cap_avail_upper_mw, ' MW');
  const n1Cap = fmtNum(sub.n1_capacity_mw, ' MW');
  const v1 = fmtNum(sub.voltage_primary_kv, ' kV');
  const v2 = fmtNum(sub.voltage_secondary_kv, ' kV');
  const units = fmtNum(sub.units, ' 台');

  const lastUpdated = fmtDate(sub.last_updated);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/grid">系統空き容量</Link>
            {areaName && (
              <>
                {' / '}
                {areaSlug ? (
                  <Link href={`/grid/${areaSlug}`}>{areaName}エリア</Link>
                ) : (
                  `${areaName}エリア`
                )}
              </>
            )}
            {sub.prefecture && ` / ${sub.prefecture}`}
          </p>

          {/* ヘッダー */}
          <div className="grid-detail-header">
            <div className="grid-detail-tags">
              {operatorName && (
                <span className="grid-tag grid-tag-operator">{operatorName}</span>
              )}
              {areaName && (
                <span className="grid-tag grid-tag-area">{areaName}エリア</span>
              )}
              {voltageClass && (
                <span className="grid-tag grid-tag-voltage">{voltageClass}</span>
              )}
            </div>
            <h1 className="article-title">{sub.name}</h1>
            <p className="grid-detail-lead">
              {operatorName ?? '事業者情報なし'} 管内
              {sub.prefecture ? `・${sub.prefecture}` : ''} の{voltageClass ?? '変電所'}
              。系統空き容量・出力制御の可能性・N-1電制適用可否などの公表情報を整理しています。
            </p>
            {/* 鮮度の明示 */}
            <p style={{ fontSize: '15px', color: 'var(--color-muted)', margin: '4px 0 0', textAlign: 'right' }}>
              データ最終更新：<strong>{lastUpdated}</strong>
              <span style={{ margin: '0 6px', opacity: 0.4 }}>|</span>
              <Link href="/tracker/grid" style={{ color: 'inherit', textDecoration: 'underline' }}>
                更新タイムライン
              </Link>
            </p>
          </div>

          {/* Phase 4-pre: 中部 cb-* で緯度経度ありの場合、地図リンク (v21: ?focus= でマーカー自動センター) */}
          {sub.slug.startsWith('cb-') &&
            typeof sub.latitude === 'number' &&
            typeof sub.longitude === 'number' && (
              <div className="grid-map-cta" style={{ margin: '12px 0 20px' }}>
                <Link
                  href={`/grid/chubu/map?focus=${encodeURIComponent(sub.slug)}`}
                  className="grid-area-link"
                  style={{
                    display: 'inline-block',
                    padding: '8px 14px',
                    background: '#f0f9ff',
                    color: '#0066cc',
                    textDecoration: 'none',
                    borderRadius: '6px',
                    border: '1px solid #bfdbfe',
                    fontSize: '15px',
                  }}
                >
                  🗺 中部マップで位置を確認
                </Link>
              </div>
            )}

          {/* (a) 基本情報 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">基本情報</h2>
            <dl className="grid-info-table">
              <dt>変電所名</dt>
              <dd>{fmtStr(sub.name)}</dd>
              <dt>送配電事業者</dt>
              <dd>{fmtStr(operatorName)}</dd>
              <dt>エリア</dt>
              <dd>{fmtStr(areaName)}</dd>
              <dt>都道府県</dt>
              <dd>{fmtStr(sub.prefecture)}</dd>
              <dt>電圧（一次）</dt>
              <dd>{v1}</dd>
              <dt>電圧（二次）</dt>
              <dd>{v2}</dd>
              <dt>電圧階級</dt>
              <dd>{fmtStr(voltageClass)}</dd>
              <dt>変圧器台数</dt>
              <dd>{units}</dd>
              {sub.external_id && (
                <>
                  <dt>公式変電所No</dt>
                  <dd>{sub.external_id}</dd>
                </>
              )}
            </dl>
          </section>

          {/* (b) 系統空き容量 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">系統空き容量</h2>
            <dl className="grid-info-table">
              <dt>設備容量（100%×台数）</dt>
              <dd>{capTotal}</dd>
              <dt>運用容量</dt>
              <dd>{capOp}</dd>
              <dt>運用容量制約要因</dt>
              <dd>{fmtStr(sub.op_constraint)}</dd>
              <dt>予想潮流</dt>
              <dd>
                {flow}
                {sub.forecast_flow_mw !== undefined &&
                sub.forecast_flow_mw !== null &&
                sub.forecast_flow_mw < 0 ? (
                  <span className="grid-note">（負＝逆潮流）</span>
                ) : null}
              </dd>
              <dt>空容量（当該設備）</dt>
              <dd>
                <strong>{capAvail}</strong>
              </dd>
              <dt>空容量（上位系考慮）</dt>
              <dd>{capAvailUpper}</dd>
            </dl>
          </section>

          {/* (c) 出力制御 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">出力制御</h2>
            <dl className="grid-info-table">
              <dt>平常時出力制御の可能性</dt>
              <dd>
                {ocPossibility ? (
                  <span
                    className={`grid-badge ${
                      ocPossibility === '有り'
                        ? 'grid-badge-warn'
                        : 'grid-badge-info'
                    }`}
                  >
                    {ocPossibility}
                  </span>
                ) : (
                  '情報なし'
                )}
              </dd>
              <dt>対象設備（当該設備）</dt>
              <dd>{fmtStr(sub.oc_target_self)}</dd>
              <dt>対象設備（上位系）</dt>
              <dd>{fmtStr(sub.oc_target_upper)}</dd>
            </dl>
          </section>

          {/* (d) ノンファーム接続 / N-1電制 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">ノンファーム接続・N-1電制</h2>
            <dl className="grid-info-table">
              <dt>N-1電制適用可</dt>
              <dd>
                <span
                  className={`grid-badge ${
                    sub.n1_eligible === true
                      ? 'grid-badge-ok'
                      : sub.n1_eligible === false
                      ? 'grid-badge-info'
                      : ''
                  }`}
                >
                  {fmtN1(sub.n1_eligible)}
                </span>
              </dd>
              <dt>N-1電制適用可能量</dt>
              <dd>{n1Cap}</dd>
              <dt>ノンファーム接続適用可否</dt>
              <dd>
                <span
                  className={`grid-badge ${
                    sub.non_firm_eligible === true
                      ? 'grid-badge-ok'
                      : 'grid-badge-info'
                  }`}
                >
                  {sub.non_firm_eligible === true
                    ? '対象'
                    : sub.non_firm_eligible === false
                    ? '対象外'
                    : '情報なし'}
                </span>
              </dd>
            </dl>
          </section>

          {/* (e) 系統増強計画 */}
          {sub.reinforcement_plan && sub.reinforcement_plan.trim() && (
            <section className="grid-section">
              <h2 className="grid-section-h2">系統増強計画</h2>
              <p className="grid-prose">{sub.reinforcement_plan}</p>
            </section>
          )}

          {/* 備考 */}
          {sub.notes && sub.notes.trim() && (
            <section className="grid-section">
              <h2 className="grid-section-h2">備考</h2>
              <p className="grid-prose">{sub.notes}</p>
            </section>
          )}

          {/* 災害リスク参考情報（67番 Phase 3 / reinfolib JSON 参照、SSRリクエスト追加なし） */}
          <HazardRiskCard slug={params.slug} />

          {/* (g) 関連事業者 */}
          {relatedOpsBadges.length > 0 && (
            <RelatedOperatorBadges
              operators={relatedOpsBadges}
              title={`${operatorName ?? ''} 関連事業者`.trim() || '関連事業者'}
            />
          )}

          {/* (h) 関連ニュース */}
          {relatedNews.length > 0 && (
            <RelatedNewsList
              news={relatedNews}
              title={`${sub.prefecture ?? sub.name} 関連ニュース`}
            />
          )}

          {/* (h-2) 依頼AA Phase 4: 周辺の蓄電所案件（半径10km、最大5件）
              緯度経度なし substation の場合は nearbyProjects が空 → h3 ごと非表示 */}
          {nearbyProjects.length > 0 && (
            <section className="grid-section">
              <h3 className="related-h3">この変電所周辺の蓄電所案件</h3>
              <p style={{ fontSize: 15, color: 'var(--color-muted)', marginBottom: 12 }}>
                {sub.name} の半径 10km 以内に位置する系統用蓄電池プロジェクト（距離が近い順、最大 5件）
              </p>
              <ul className="related-project-list">
                {nearbyProjects.map((p) => {
                  const meta: string[] = [];
                  if (p.outputMw != null) meta.push(`${p.outputMw}MW`);
                  if (p.capacityMwh != null) meta.push(`${p.capacityMwh}MWh`);
                  if (p.prefecture) meta.push(p.prefecture);
                  if (p.status) meta.push(p.status);
                  return (
                    <li key={p.slug} className="related-project-item">
                      <Link href={`/projects/${p.slug}`}>
                        <span className="related-project-name">{p.name}</span>
                        <span className="related-project-meta">
                          約 {p.distanceKm.toFixed(1)}km
                          {meta.length > 0 ? ' / ' + meta.join(' / ') : ''}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* (i) 関連用語（固定） */}
          <RelatedTermBadges
            terms={FIXED_RELATED_TERMS}
            title="関連用語（用語集）"
          />

          {/* (j) v24: 位置情報のご提供セクション (latitude=null の変電所のみ)
              v26: Google Forms 実装前のため、当面はお問い合わせページ (eic-jp.org/contact) 経由で受付 */}
          {(typeof sub.latitude !== 'number' || Number.isNaN(sub.latitude)) && (
            <section className="grid-section grid-location-tips">
              <h2 className="grid-section-h2">📍 位置情報のご提供をお願いします</h2>
              <p>
                この変電所の正確な位置情報（住所・緯度経度）をお持ちですか？
                業界事業者・電力会社のみなさまからのご提供は、業界全体の連系検討プロセス効率化に貢献します。
              </p>
              <p>
                <a
                  href={siteConfig.organization.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid-location-tips-button"
                >
                  🔗 お問い合わせから位置情報を提供する
                </a>
              </p>
              <p className="grid-source-note">
                ※提供情報は蓄電所ネット 編集部が確認後、データベースに反映します。匿名でのご提供も歓迎です。
              </p>
            </section>
          )}

          {/* 系統連系診断CTA（出典セクション直前） */}
          <section style={{
            margin: '24px 0',
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
                ⚡ この変電所で系統連系を診断する
              </p>
              <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', lineHeight: 1.5 }}>
                連系候補変電所の特定・N-1電制の可否・接続コスト概算（平均エンゲージ92秒）
              </p>
            </div>
            <Link
              href={`/tools/grid-connection-check?substation=${encodeURIComponent(sub.slug)}`}
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

          {/* (f) 一次ソース・データ提供元（落とし穴45：明記必須） */}
          <section className="grid-section grid-source-section">
            <h2 className="grid-section-h2">出典・データ提供元</h2>
            <dl className="grid-info-table">
              <dt>データ提供</dt>
              <dd>{fmtStr(operatorName)}</dd>
              <dt>データソース形式</dt>
              <dd>{firstOf(sub.data_source_format) ?? 'CSV'}</dd>
              <dt>データ最終更新日</dt>
              <dd>{lastUpdated}</dd>
              <dt>蓄電所ネット取得日</dt>
              <dd>{fmtDate(sub.fetched_at)}</dd>
              <dt>一次ソースURL</dt>
              <dd>
                <a
                  href={sub.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid-source-link"
                >
                  {sub.source_url}
                </a>
              </dd>
            </dl>
            <p className="grid-source-note">
              ※ 本ページの数値は{' '}
              <strong>{operatorName ?? '送配電事業者'}</strong>{' '}
              が公表する予想潮流等情報に基づいています。最新情報は{' '}
              <a
                href={sub.source_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                公式サイト
              </a>{' '}
              でご確認ください。データの利用条件・免責事項は各事業者の利用規約に従います。
            </p>
            <p className="grid-source-note">
              <Link href="/tracker/grid" className="grid-area-link">📋 変電所データの更新タイムラインを見る（/tracker/grid）→</Link>
            </p>
          </section>

          <p className="back-link">
            {areaSlug && areaName ? (
              <Link href={`/grid/${areaSlug}`}>
                ← {areaName}エリア一覧へ戻る
              </Link>
            ) : (
              <Link href="/grid">← 系統空き容量データベースへ戻る</Link>
            )}
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
