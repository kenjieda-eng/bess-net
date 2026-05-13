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

export const revalidate = 3600;

type PageParams = { params: { prefecture: string } };

export async function generateStaticParams(): Promise<{ prefecture: string }[]> {
  try {
    const prefs = await getAvailablePrefectures();
    return prefs.map((p) => ({ prefecture: encodeURIComponent(p) }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const decoded = decodeURIComponent(params.prefecture);
  return {
    // layout.tsx titleTemplate が自動付与（落とし穴 #86）
    title: `${decoded}の変電所一覧 ｜ 系統空き容量データベース`,
    description: `${decoded}の変電所を空容量大きい順に一覧表示。連系検討の初期スクリーニングに。9送配電事業者の公開データを編集部で整理。`,
    alternates: { canonical: `/grid/prefecture/${encodeURIComponent(decoded)}` },
    openGraph: {
      title: `${decoded}の変電所一覧｜系統空き容量データベース`,
      description: `${decoded}の変電所を空容量大きい順に一覧表示`,
      type: 'website',
    },
  };
}

export default async function PrefecturePage({ params }: PageParams) {
  const decoded = decodeURIComponent(params.prefecture);
  const subs = await getSubstationsByPrefecture(decoded);
  if (subs.length === 0) notFound();

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
            編集部が、9送配電事業者の公開情報を整理。最新情報は各社の公式サイトをご確認ください。
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
