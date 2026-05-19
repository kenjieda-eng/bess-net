/**
 * /buyer/factory-commercial — Sprint X1 Day 1 Buyer 1 ページ完成例
 *
 * 設計 (CLAUDE.md §0 鉄則完全準拠):
 *   - 鉄則 #2 SSR 外部 API 0: LandingPage は静的データのみ (config 経由)
 *   - 鉄則 #3 単一ページ
 *   - 鉄則 #4 ピーク負荷 0 req/分
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import LandingPageLayout from '@/components/LandingPage/LandingPageLayout';
import { LANDING_PAGE_CONFIGS } from '@/data/landing-page-configs';

export const revalidate = 86400;

const config = LANDING_PAGE_CONFIGS['buyer/factory-commercial'];

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  alternates: { canonical: '/buyer/factory-commercial' },
  openGraph: {
    title: config.title,
    description: config.description,
    type: 'website',
    images: config.ogImage ? [config.ogImage] : ['/og-image.png'],
  },
};

export default function BuyerFactoryCommercialPage() {
  // JSON-LD BreadcrumbList (Buyer LandingPage SEO)
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '蓄電池を導入したい方へ', item: 'https://bess-net.jp/buyer/factory-commercial' },
      { '@type': 'ListItem', position: 3, name: '工場・商業施設', item: 'https://bess-net.jp/buyer/factory-commercial' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <LandingPageLayout config={config} />
      {/* breadcrumb (LandingPageLayout 外、最後に sectional として) - 非表示でも JSON-LD は出力 */}
      <nav aria-label="breadcrumb" style={{ display: 'none' }}>
        <Link href="/">トップ</Link> / 工場・商業施設
      </nav>
    </>
  );
}
