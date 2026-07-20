/**
 * /global — 海外5市場ハブ (依頼BC、業界唯一性 +1)
 *
 * 設計 (CLAUDE.md §0 鉄則完全準拠):
 *   - 鉄則 #2: SSR 外部 API 0 (静的データ)
 *   - 鉄則 #3: 単一 URL
 *   - 鉄則 #4: ピーク負荷 0 req/分
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import { GLOBAL_MARKETS, COUNTRY_ORDER } from '@/data/global-markets';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '海外5市場ハブ (米国/EU/中国/インド/豪州 蓄電池市場比較)',
  description: '世界の蓄電池市場を5地域 (米国/EU/中国/インド/豪州) で一覧比較。市場規模/政策/主要プレイヤー/価格動向/日本との比較。当サイト独自の海外市場ハブ、無料公開・登録不要。',
  alternates: { canonical: '/global' },
  openGraph: {
    title: '海外5市場ハブ (米国/EU/中国/インド/豪州)',
    description: '5地域 × 市場規模/政策/主要プレイヤー/日本との比較',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function GlobalHubPage() {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '海外5市場 蓄電池市場ハブ',
    description: '米国/EU/中国/インド/豪州 の蓄電池市場概況',
    numberOfItems: COUNTRY_ORDER.length,
    itemListElement: COUNTRY_ORDER.map((key, idx) => {
      const m = GLOBAL_MARKETS[key];
      return {
        '@type': 'ListItem',
        position: idx + 1,
        name: `${m.name} 蓄電池市場`,
        description: m.overview,
        url: `https://bess-net.jp/global/${key}`,
      };
    }),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '海外5市場ハブ', item: 'https://bess-net.jp/global' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        {/* Tier 1 UI 統一: max-w 1320 */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 海外5市場ハブ
          </p>
          <div className="section-label">当サイト独自 · 海外市場ハブ</div>
          <h1 className="section-title">海外5市場ハブ (蓄電池市場比較)</h1>
          {/* Tier 1 UI 統一 #1: text-base lg:text-lg */}
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            世界の蓄電池市場を<strong>5地域 (米国/EU/中国/インド/豪州)</strong> で一覧比較。
            市場規模・主要政策・主要プレイヤー・価格動向・<strong>日本との比較</strong>を1ページに集約。
            当サイト独自の海外市場ハブ、無料公開・登録不要。
          </p>
          <p className="page-meta" style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 0, marginBottom: 24 }}>
            ※ 編集部が IEA / BloombergNEF / SolarPower Europe / 各国政府発表 等の公開情報に基づき作成 (2026年上半期 時点)。
            最新は各種一次情報を参照。
          </p>

          {/* 比較マトリクス */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>市場規模 比較マトリクス</h2>
            <div style={{ overflowX: 'auto' }}>
              {/* Tier 1 UI 統一: fontSize 13 → 16、py-2 → py-3、数値は tabular-nums */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 16 }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg)' }}>
                    <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>市場</th>
                    <th style={{ padding: 12, textAlign: 'right', border: '1px solid var(--color-border)', fontWeight: 600 }}>2025累積 (GWh)</th>
                    <th style={{ padding: 12, textAlign: 'right', border: '1px solid var(--color-border)', fontWeight: 600 }}>2030予測 (GWh)</th>
                    <th style={{ padding: 12, textAlign: 'right', border: '1px solid var(--color-border)', fontWeight: 600 }}>CAGR</th>
                    <th style={{ padding: 12, textAlign: 'left', border: '1px solid var(--color-border)', fontWeight: 600 }}>詳細</th>
                  </tr>
                </thead>
                <tbody>
                  {COUNTRY_ORDER.map((key) => {
                    const m = GLOBAL_MARKETS[key];
                    return (
                      <tr key={key}>
                        <td style={{ padding: 12, border: '1px solid var(--color-border)' }}>{m.flag} {m.name}</td>
                        <td className="tabular-nums" style={{ padding: 12, textAlign: 'right', border: '1px solid var(--color-border)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{m.marketSizeGWh2025}</td>
                        <td className="tabular-nums" style={{ padding: 12, textAlign: 'right', border: '1px solid var(--color-border)', fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{m.marketSizeGWh2030}</td>
                        <td className="tabular-nums" style={{ padding: 12, textAlign: 'right', border: '1px solid var(--color-border)', fontVariantNumeric: 'tabular-nums' }}>{m.cagr}</td>
                        <td style={{ padding: 12, border: '1px solid var(--color-border)' }}>
                          <Link href={`/global/${key}`} style={{ color: 'var(--color-accent)' }}>詳細を見る →</Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 8 }}>
              ※ 日本は2025累積 4GWh、2030予測 14GWh (経産省 第7次エネ基本計画ベース)。
              米国は日本の約20倍、中国は約50倍の規模。
            </p>
          </section>

          {/* 国別カード */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>各市場の概況</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {COUNTRY_ORDER.map((key) => {
                const m = GLOBAL_MARKETS[key];
                return (
                  <Link key={key} href={`/global/${key}`} style={{
                    display: 'block', padding: 16, border: '1px solid var(--color-border)',
                    borderRadius: 8, textDecoration: 'none', color: 'inherit', background: 'white',
                  }}>
                    <div style={{ fontSize: 24, marginBottom: 4 }}>{m.flag} <strong style={{ fontSize: 18 }}>{m.name}</strong></div>
                    <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 8 }}>{m.nameEn}</div>
                    <p style={{ fontSize: 15, lineHeight: 1.6, margin: '8px 0' }}>{m.overview.slice(0, 100)}…</p>
                    <ul style={{ fontSize: 15, lineHeight: 1.6, paddingLeft: 18, margin: '8px 0' }}>
                      {m.highlights.slice(0, 2).map((h, i) => (<li key={i}>{h}</li>))}
                    </ul>
                    <div style={{ fontSize: 13, color: 'var(--color-accent)', marginTop: 8 }}>詳細を見る →</div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/map/industry-chaos">業界カオスマップ (国内主要事業者)</Link></li>
              <li><Link href="/market/jepx">JEPX ハブ (国内スポット市場)</Link></li>
              <li><Link href="/operators">事業者ナビ (国内544社)</Link></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
