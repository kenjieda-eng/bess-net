/**
 * LandingPageLayout — Sprint X1 LandingPage 共通ラッパー
 *
 * 設計:
 *   - Server Component (内部子 component すべて Server Component)
 *   - L-JEPX-UI-007: 1 ファイル → 8 ページ反映
 *   - L-JEPX-UI-010: 3 層深掘り (page + Layout + 子セクション)
 *   - SiteHeader/SiteFooter で既存サイト統一感
 */

import Link from 'next/link';
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

/** 入口再設計2026-07-15 変更4: 各LP冒頭の受け皿バンドの誘導先（意図ベース3分岐） */
function startFunnelHref(config: LandingPageConfig): string {
  if (config.slug === 'seller/developer') return '/start/sell'; // 売り手文脈（/start/sell の深掘り先）
  return config.type === 'buyer' ? '/start/buy' : '/start/partner';
}

export default function LandingPageLayout({ config }: { config: LandingPageConfig }) {
  return (
    <>
      <SiteHeader />
      {/* 変更4: はじめての方向けの1行案内バンド（既存8ページの受け皿化・降格後の逆導線） */}
      <div
        style={{
          background: '#eff6ff',
          borderBottom: '1px solid #dbeafe',
          padding: '8px 16px',
          fontSize: 15,
          textAlign: 'center',
        }}
      >
        はじめての方はこちら →{' '}
        <Link href={startFunnelHref(config)} style={{ fontWeight: 700, color: '#1e40af' }}>
          あなたに合った入口
        </Link>
      </div>
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
