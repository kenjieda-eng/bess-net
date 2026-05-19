/**
 * LandingPageLayout — Sprint X1 LandingPage 共通ラッパー
 *
 * 設計:
 *   - Server Component (内部子 component すべて Server Component)
 *   - L-JEPX-UI-007: 1 ファイル → 8 ページ反映
 *   - L-JEPX-UI-010: 3 層深掘り (page + Layout + 子セクション)
 *   - SiteHeader/SiteFooter で既存サイト統一感
 */

import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import type { LandingPageConfig } from '@/data/landing-page-configs';
import LandingPageHero from './LandingPageHero';
import LandingPagePainPoints from './LandingPagePainPoints';
import LandingPageDataSection from './LandingPageDataSection';
import LandingPageToolsLinks from './LandingPageToolsLinks';
import LandingPageInsightCarousel from './LandingPageInsightCarousel';
import LandingPageFAQ from './LandingPageFAQ';
import LandingPageCTA from './LandingPageCTA';

export default function LandingPageLayout({ config }: { config: LandingPageConfig }) {
  return (
    <>
      <SiteHeader />
      <main>
        <LandingPageHero config={config} />
        <LandingPagePainPoints painPoints={config.painPoints} />
        <LandingPageDataSection title={config.dataSectionTitle} references={config.dataReferences} />
        <LandingPageToolsLinks tools={config.tools} />
        <LandingPageInsightCarousel insightSlugs={config.insightSlugs} />
        <LandingPageFAQ faqs={config.faqs} />
        <LandingPageCTA primary={config.ctaPrimary} secondary={config.ctaSecondary} />
      </main>
      <SiteFooter />
    </>
  );
}
