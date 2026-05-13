// /grid/prefecture — 都道府県インデックス（v25）
// 全都道府県を件数の多い順にリスト表示。
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getPrefectureCountMap } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  // layout.tsx titleTemplate が自動付与（落とし穴 #86）
  title: '都道府県別 変電所一覧 ｜ 系統空き容量データベース',
  description:
    '全国9送配電事業者の変電所を都道府県別に一覧。各都道府県の件数・空容量・N-1電制適用可否を一画面で。蓄電所連系検討の地域絞り込みに。',
  alternates: { canonical: '/grid/prefecture' },
  openGraph: {
    title: '都道府県別 変電所一覧｜系統空き容量データベース',
    description: '全国9社・約30都道府県別の変電所件数を一覧表示',
    type: 'website',
  },
};

export default async function PrefectureIndexPage() {
  const map = await getPrefectureCountMap();
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  const total = sorted.reduce((acc, [, n]) => acc + n, 0);

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
            <Link href="/grid">系統空き容量</Link> / 都道府県別
          </p>

          <h1 className="page-title">都道府県別 変電所一覧</h1>
          <p className="page-lead">
            データのある {sorted.length} 都道府県・合計 {total.toLocaleString()}{' '}
            変電所を一覧表示。各都道府県をクリックすると該当変電所の一覧へ遷移します。
          </p>

          <section className="grid-section">
            <h2 className="grid-section-h2">都道府県一覧（件数の多い順）</h2>
            <ul className="grid-prefecture-grid">
              {sorted.map(([pref, count]) => (
                <li key={pref} className="grid-prefecture-cell">
                  <Link
                    href={`/grid/prefecture/${encodeURIComponent(pref)}`}
                    className="grid-prefecture-link"
                  >
                    <strong>{pref}</strong>
                    <span className="grid-prefecture-count">
                      {count.toLocaleString()} 件
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <p className="grid-source-note">
            データソース: {siteConfig.organization.name}{' '}
            編集部が、9送配電事業者の公開情報を整理。地区を跨ぐ変電所は最初にマッチした都道府県を採用。
          </p>

          <p className="back-link">
            <Link href="/grid">← 系統空き容量データベースへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
