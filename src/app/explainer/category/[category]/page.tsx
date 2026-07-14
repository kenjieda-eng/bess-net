// /explainer/category/[category] — カテゴリ別解説記事 SSR ハブ（crawl 可能アーカイブ）
// /news/category/[category]（commit a20958d）の横展開。設計:
//   #103（先頭N可視＋残り<details>、全<a>がSSR HTMLに含まれSEO維持）
//   #101（非ASCII は generateStaticParams で生値返却＋decodeURIComponent 受け）
//   #92（useSearchParams 不使用・純Server Component）
//   #98/#1（getAllExplainer 1スキャン＋メモリ内フィルタ・contains不使用）
//   #100（取得失敗は空縮退→notFound・500を作らない）
// カテゴリ＝表示グループ（explainer-utils）。複数カテゴリ記事は toGroups(union) で各ハブに出る。
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ExplainerHubList from '@/components/ExplainerHubList';
import ExplainerCategoryNav from '@/components/ExplainerCategoryNav';
import { getAllExplainer, type Explainer } from '@/lib/microcms';
import {
  EXPLAINER_HUB_GROUPS,
  toGroups,
  countByGroupUnion,
} from '@/lib/explainer-utils';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;
export const dynamicParams = false;

async function safeGetAll(): Promise<Explainer[]> {
  try {
    return await getAllExplainer();
  } catch {
    return []; // 429等は空縮退（#100）。generateStaticParams は空、page は notFound。
  }
}

export async function generateStaticParams(): Promise<{ category: string }[]> {
  const items = await safeGetAll();
  const counts = countByGroupUnion(items);
  // ★ 生値（未エンコード）を返す（落とし穴#101: Next が静的パス生成時に内部で1回
  //   エンコードする。ここで encodeURIComponent すると二重エンコードで全件404）。
  return EXPLAINER_HUB_GROUPS.filter((g) => (counts[g] || 0) > 0).map((g) => ({
    category: g,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const cat = decodeURIComponent(params.category);
  return {
    // layout.tsx titleTemplate `%s | 蓄電所ネット` が自動付与（落とし穴#88: 手動で付けない）
    title: `${cat}の解説記事一覧（蓄電池・蓄電所）`,
    description: `系統用蓄電池(BESS)・低圧リソース事業の「${cat}」に関する解説記事アーカイブ。容量市場・需給調整市場・系統連系・技術・安全法務などを実務担当者向けに体系化した記事を一覧で読めます。`,
    alternates: { canonical: `/explainer/category/${encodeURIComponent(cat)}` },
    openGraph: {
      title: `${cat}の解説記事一覧（蓄電池・蓄電所）`,
      description: `系統用蓄電池業界の「${cat}」解説記事アーカイブ`,
      type: 'website',
    },
  };
}

export default async function ExplainerCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const cat = decodeURIComponent(params.category);
  if (!EXPLAINER_HUB_GROUPS.includes(cat)) notFound();

  const all = await safeGetAll();
  const items = all
    .filter((a) => toGroups(a.category).includes(cat))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  if (items.length === 0) notFound();

  const counts = countByGroupUnion(all);
  const groups = EXPLAINER_HUB_GROUPS.filter((g) => (counts[g] || 0) > 0).map(
    (g) => ({ name: g, count: counts[g] || 0 })
  );

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: `${siteConfig.url}/` },
      { '@type': 'ListItem', position: 2, name: '解説記事', item: `${siteConfig.url}/explainer` },
      {
        '@type': 'ListItem',
        position: 3,
        name: cat,
        item: `${siteConfig.url}/explainer/category/${encodeURIComponent(cat)}`,
      },
    ],
  };
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cat}の解説記事一覧（蓄電池・蓄電所）`,
    description: `系統用蓄電池業界の「${cat}」解説記事 ${items.length}本`,
    numberOfItems: items.length,
    isPartOf: { '@type': 'WebSite', name: siteConfig.name, url: siteConfig.url },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/explainer">解説記事</Link> / {cat}
          </p>
          <div className="section-label">Explainer / {cat}</div>
          <h1 className="section-title">
            {cat}の解説記事（{items.length}本）
          </h1>
          <p className="section-description">
            系統用蓄電池(BESS)・低圧リソース事業の「{cat}」に関する解説記事を、
            新着順にまとめています。業界の実務担当者向けに体系化しています。
          </p>

          <ExplainerCategoryNav groups={groups} currentGroup={cat} />

          <ExplainerHubList items={items} />

          <p className="back-link">
            <Link href="/explainer">← 解説記事一覧へ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
