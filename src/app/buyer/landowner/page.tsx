/**
 * /buyer/landowner — 土地保有者・地主 向け系統用蓄電池用地活用
 * プレイヤー別 Buyer Landing (2026-05-25)
 */

import type { Metadata } from 'next';
import LandingPageLayout from '@/components/LandingPage/LandingPageLayout';
import { LANDING_PAGE_CONFIGS } from '@/data/landing-page-configs';

export const revalidate = 86400;

const config = LANDING_PAGE_CONFIGS['buyer/landowner'];

export const metadata: Metadata = {
  title: config.title,
  description: config.description,
  alternates: { canonical: '/buyer/landowner' },
  openGraph: {
    title: config.title,
    description: config.description,
    type: 'website',
    images: config.ogImage ? [config.ogImage] : ['/og-image.png'],
  },
};

export default function BuyerLandownerPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '蓄電池を導入したい方へ', item: 'https://bess-net.jp/buyer/factory-commercial' },
      { '@type': 'ListItem', position: 3, name: '土地保有者・地主', item: 'https://bess-net.jp/buyer/landowner' },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <LandingPageLayout config={config} />
    </>
  );
}
