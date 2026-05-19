/**
 * /seller/manufacturer — Sprint X1 Day 3 Seller Landing
 * セル・PCS・統合システムメーカー向け
 */

import type { Metadata } from 'next';
import LandingPageLayout from '@/components/LandingPage/LandingPageLayout';
import { LANDING_PAGE_CONFIGS } from '@/data/landing-page-configs';

export const revalidate = 86400;

const config = LANDING_PAGE_CONFIGS['seller/manufacturer'];

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  alternates: { canonical: '/seller/manufacturer' },
  openGraph: {
    title: config.title,
    description: config.description,
    type: 'website',
    images: config.ogImage ? [config.ogImage] : ['/og-image.png'],
  },
};

export default function SellerManufacturerPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '蓄電池業界の事業者の方へ', item: 'https://bess-net.jp/seller/manufacturer' },
      { '@type': 'ListItem', position: 3, name: 'メーカー向け', item: 'https://bess-net.jp/seller/manufacturer' },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <LandingPageLayout config={config} />
    </>
  );
}
