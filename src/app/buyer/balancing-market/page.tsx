/**
 * /buyer/balancing-market — Sprint X1 Day 2 Buyer Landing
 * 需給調整市場参加者向け
 */

import type { Metadata } from 'next';
import LandingPageLayout from '@/components/LandingPage/LandingPageLayout';
import { LANDING_PAGE_CONFIGS } from '@/data/landing-page-configs';

export const revalidate = 86400;

const config = LANDING_PAGE_CONFIGS['buyer/balancing-market'];

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  alternates: { canonical: '/buyer/balancing-market' },
  openGraph: {
    title: config.title,
    description: config.description,
    type: 'website',
    images: config.ogImage ? [config.ogImage] : ['/og-image.png'],
  },
};

export default function BuyerBalancingMarketPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '蓄電池を導入したい方へ', item: 'https://bess-net.jp/buyer/factory-commercial' },
      { '@type': 'ListItem', position: 3, name: '需給調整市場参加検討', item: 'https://bess-net.jp/buyer/balancing-market' },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <LandingPageLayout config={config} />
    </>
  );
}
