import type { Metadata } from 'next';
import CountryMarketPage from '@/components/CountryMarketPage';
import { GLOBAL_MARKETS } from '@/data/global-markets';

export const revalidate = 86400;

const m = GLOBAL_MARKETS.eu;

export const metadata: Metadata = {
  title: `${m.flag} ${m.name} 蓄電池市場概況 (${m.nameEn})`,
  description: m.overview,
  alternates: { canonical: '/global/eu' },
  openGraph: {
    title: `${m.name} 蓄電池市場概況`,
    description: m.overview,
    type: 'article',
    images: ['/og-image.png'],
  },
};

export default function Page() {
  return <CountryMarketPage countryKey="eu" />;
}
