/**
 * LandingPageHero — ヒーローセクション (Server Component で OK、interactive 不要)
 *
 * L-JEPX-UI-001: inline style + Tailwind className 併用
 * L-JEPX-UI-006: fontSize 16-18px 業界事業者向け
 */

import Link from 'next/link';
import type { LandingPageConfig } from '@/data/landing-page-configs';

export default function LandingPageHero({ config }: { config: LandingPageConfig }) {
  const badgeText =
    config.type === 'buyer' ? '蓄電池を導入したい方へ' : '蓄電池業界の事業者の方へ';
  const badgeColor = config.type === 'buyer' ? '#1e40af' : '#a16207';
  const badgeBg = config.type === 'buyer' ? '#dbeafe' : '#fef3c7';
  return (
    <section
      style={{
        paddingTop: 64,
        paddingBottom: 64,
        background: 'linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)',
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: '0 auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 48,
          alignItems: 'center',
        }}
        className="lg:grid-cols-2"
      >
        <div>
          <span
            style={{
              display: 'inline-block',
              padding: '4px 12px',
              background: badgeBg,
              color: badgeColor,
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {badgeText}
          </span>
          <h1
            style={{
              fontSize: 32,
              lineHeight: 1.3,
              fontWeight: 700,
              color: '#0f172a',
              marginBottom: 20,
              marginTop: 0,
            }}
            className="text-3xl lg:text-4xl"
          >
            {config.heroH1}
          </h1>
          <p
            style={{
              fontSize: 18,
              lineHeight: 1.7,
              color: '#334155',
              marginBottom: 28,
            }}
            className="text-base lg:text-lg"
          >
            {config.heroSubcopy}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <Link
              href={config.heroCtaUrl}
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: '#1d4ed8',
                color: 'white',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              {config.heroCtaLabel}
            </Link>
            <a
              href="#data-section"
              style={{
                display: 'inline-block',
                padding: '14px 28px',
                background: 'white',
                color: '#334155',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                textDecoration: 'none',
                border: '2px solid #cbd5e1',
              }}
            >
              業界データを見る
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
