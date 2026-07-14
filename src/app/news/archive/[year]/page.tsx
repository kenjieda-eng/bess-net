// /news/archive/[year] — 年別ニュース SSR ハブ（crawl 可能アーカイブ）
// ※ /news/[slug] と同階層に第2の動的セグメントは置けないため、静的セグメント archive/ 配下に設置。
// 設計: 鉄則#2/#98・#92（useSearchParams 不使用）・#103（先頭N可視＋残り折りたたみ、全<a>がSSR HTML）。
// year は ASCII（2011-2026）のため encode 不要。件数>0 の年のみ生成、dynamicParams=false で範囲限定。
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
  getYear,
} from '@/lib/news-utils';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;
export const dynamicParams = false;

export async function generateStaticParams(): Promise<{ year: string }[]> {
  try {
    const items = await getIndustryNews();
    return newsYearList(items).map((y) => ({ year: y.year }));
  } catch {
    return [];
  }
}

export async function generateMetadata({
  params,
}: {
  params: { year: string };
}): Promise<Metadata> {
  const { year } = params;
  return {
    title: `${year}年のニュース一覧｜蓄電池業界ニュース`,
    description: `${year}年に配信した系統用蓄電池(BESS)業界ニュースの年別アーカイブ。新規連系・運転開始・制度改正・投資・市場動向を新着順に掲載。`,
    alternates: { canonical: `/news/archive/${year}` },
    openGraph: {
      title: `${year}年のニュース一覧｜蓄電池業界ニュース`,
      description: `${year}年の系統用蓄電池業界ニュース アーカイブ`,
      type: 'website',
    },
  };
}

export default async function NewsYearPage({
  params,
}: {
  params: { year: string };
}) {
  const { year } = params;
  if (!/^\d{4}$/.test(year)) notFound();

  const all = await getIndustryNews();
  const items = all
    .filter((n) => getYear(n.publishedAt) === year)
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
        name: `${year}年`,
        item: `${siteConfig.url}/news/archive/${year}`,
      },
    ],
  };
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${year}年のニュース一覧`,
    description: `${year}年に配信した系統用蓄電池業界ニュース ${items.length}本`,
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
            {year}年
          </p>
          <div className="section-label">News / {year}</div>
          <h1 className="section-title">
            {year}年のニュース（{items.length}本）
          </h1>
          <p className="section-description">
            {year}年に配信した系統用蓄電池(BESS)・低圧リソース事業の業界ニュースを、
            新着順にまとめた年別アーカイブです。
          </p>

          <NewsArchiveNav
            categories={categories}
            years={years}
            currentYear={year}
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
