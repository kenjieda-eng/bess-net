// /news/category/[category] — カテゴリ別ニュース SSR ハブ（crawl 可能アーカイブ）
// 設計: 鉄則#2/#98（runtime microCMS 抑制）・#92（useSearchParams 不使用）・
//       #101（非ASCII は generateStaticParams で生値返却＋decodeURIComponent 受け）・
//       #103（先頭N可視＋残り折りたたみ、全<a>がSSR HTMLに含まれSEO維持）。
// カテゴリは固定 enum（NEWS_HUB_CATEGORIES）＋件数>0 のみ生成、dynamicParams=false で範囲限定。
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NewsHubList from '@/components/NewsHubList';
import NewsArchiveNav from '@/components/NewsArchiveNav';
import { getIndustryNews } from '@/lib/microcms';
import {
  NEWS_HUB_CATEGORIES,
  newsCountByCategory,
  newsYearList,
} from '@/lib/news-utils';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ category: string }[]> {
  try {
    const items = await getIndustryNews();
    const counts = newsCountByCategory(items);
    // ★ 生値（未エンコード）を返す（落とし穴#101: Next が静的パス生成時に内部で1回
    //   エンコードする。ここで encodeURIComponent すると二重エンコードで全件404）。
    return NEWS_HUB_CATEGORIES.filter((c) => (counts[c] || 0) > 0).map((c) => ({
      category: c,
    }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { category: string };
}): Promise<Metadata> {
  const cat = decodeURIComponent(params.category);
  return {
    // layout.tsx titleTemplate `%s | 蓄電所ネット` が自動付与（落とし穴#88: 手動で付けない）
    title: `${cat}のニュース一覧｜蓄電池業界ニュース`,
    description: `系統用蓄電池(BESS)業界の「${cat}」に関する最新ニュースをまとめて掲載。蓄電所ネット編集部が新規連系・運転開始・制度改正・市場動向などを継続収集しています。`,
    alternates: { canonical: `/news/category/${encodeURIComponent(cat)}` },
    openGraph: {
      title: `${cat}のニュース一覧｜蓄電池業界ニュース`,
      description: `系統用蓄電池業界の「${cat}」関連ニュースアーカイブ`,
      type: 'website',
    },
  };
}

export default async function NewsCategoryPage({
  params,
}: {
  params: { category: string };
}) {
  const cat = decodeURIComponent(params.category);
  if (!NEWS_HUB_CATEGORIES.includes(cat)) notFound();

  const all = await getIndustryNews();
  const items = all
    .filter((n) => (n.category || []).includes(cat))
    .sort(
      (a, b) =>
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  if (items.length === 0) notFound();

  const counts = newsCountByCategory(all);
  const years = newsYearList(all);
  const categories = NEWS_HUB_CATEGORIES.filter((c) => (counts[c] || 0) > 0).map(
    (c) => ({ name: c, count: counts[c] || 0 })
  );

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: `${siteConfig.url}/` },
      { '@type': 'ListItem', position: 2, name: 'ニュース', item: `${siteConfig.url}/news` },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${cat}`,
        item: `${siteConfig.url}/news/category/${encodeURIComponent(cat)}`,
      },
    ],
  };
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${cat}のニュース一覧`,
    description: `系統用蓄電池業界の「${cat}」関連ニュース ${items.length}本`,
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
            <Link href="/">トップ</Link> / <Link href="/news">ニュース</Link> /{' '}
            {cat}
          </p>
          <div className="section-label">News / {cat}</div>
          <h1 className="section-title">
            {cat}のニュース（{items.length}本）
          </h1>
          <p className="section-description">
            系統用蓄電池(BESS)・低圧リソース事業の「{cat}」に関する業界ニュースを、
            新着順にまとめています。蓄電所ネット編集部が継続的に収集・整理しています。
          </p>

          <NewsArchiveNav
            categories={categories}
            years={years}
            currentCategory={cat}
          />

          <NewsHubList items={items} />

          <p className="back-link">
            <Link href="/news">← ニュース一覧へ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
