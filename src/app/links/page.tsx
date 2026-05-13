// /links 一覧ページ - patch_v13
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import LinksBrowser from '@/components/LinksBrowser';
import { getAllLinks } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600;

export const metadata: Metadata = {
  // layout.tsx titleTemplate が自動付与（落とし穴 #86）
  title: 'お役立ちサイト一覧',
  description:
    '系統用蓄電池・再エネ・脱炭素関連の業界関係者が日々ブックマークしておきたい外部サイトを、ジャンル×重要度×国別に厳選。国・行政・業界団体・補助金・研究機関・専門メディア・海外政府機関・国際機関・データソース・ESG等。',
  alternates: { canonical: '/links' },
  openGraph: {
    title: 'お役立ちサイト一覧',
    description:
      '系統用蓄電池業界関係者向けの外部サイト総合ガイド。約200サイトをジャンル別に厳選。',
    type: 'website',
  },
};

export default async function LinksIndexPage() {
  const links = await getAllLinks();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'お役立ちサイト一覧',
    description: '系統用蓄電池業界関係者向けの外部サイト総合ガイド',
    url: 'https://bess-net.jp/links',
    isPartOf: {
      '@type': 'WebSite',
      name: '蓄電所ネット',
      url: 'https://bess-net.jp',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: links.length,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / お役立ちサイト一覧
          </p>
          <h1 className="page-title">お役立ちサイト一覧</h1>
          <p className="page-lead">
            系統用蓄電池・再エネ・脱炭素分野の業界関係者が日々ブックマークしておきたい
            <strong>{links.length}サイト</strong>を、12カテゴリ別に厳選。
            国・行政、規制機関・系統運用、業界団体、補助金、研究機関、メディア、
            海外政府機関、国際機関、データソース、ESG・ファイナンス分野を網羅しています。
          </p>
          <LinksBrowser items={links} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
