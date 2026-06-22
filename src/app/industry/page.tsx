/**
 * /industry — 業界分析ハブ (Sprint 4 後半 4 ハブの集約 index)
 *
 * 設計:
 *   - Server Component、静的データのみ
 *   - 業界カオスマップ / JEPX ハブ / 海外5市場ハブ / 業界トラッカー の入口
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '業界分析ハブ (業界カオスマップ × JEPX × 海外5市場 × 業界トラッカー × Top50)',
  description: '蓄電所事業の業界分析5機能を一覧。業界カオスマップ・JEPXハブ・海外5市場ハブ・業界トラッカー・事業者Top50ランキング。業界唯一の構造可視化基盤、無料公開・登録不要。',
  alternates: { canonical: '/industry' },
  openGraph: {
    title: '業界分析ハブ (5機能)',
    description: '業界構造 × スポット市場 × 海外比較 × 更新トラッカー × Top50ランキング',
    type: 'website',
    images: ['/og-image.png'],
  },
};

const HUBS = [
  {
    href: '/map/industry-chaos',
    title: '業界カオスマップ',
    desc: '主要50+社を11カテゴリで整理 + 35件の関係 (出資/EPC/セル供給/オフテイク等) で業界構造を可視化。Matrix view + Force graph。',
    tag: '構造',
  },
  {
    href: '/market/jepx',
    title: 'JEPX ハブ',
    desc: '9エリア × 過去30日 × 30分単位 = 12,960データポイント。ヒートマップ + アービトラージ計算機 + 月次推移 + 9エリア比較。',
    tag: '市場',
  },
  {
    href: '/global',
    title: '海外5市場ハブ',
    desc: '米国/EU/中国/インド/豪州の蓄電池市場概況。市場規模 (2025累積〜2030予測) × 主要政策 × 主要プレイヤー × 日本との比較。',
    tag: '海外',
  },
  {
    href: '/tracker',
    title: '業界トラッカー (4軸)',
    desc: '補助金・系統 (変電所8,200+)・事業者 (540+)・プロジェクトDB の更新を時系列タイムラインで一望。',
    tag: '時系列',
  },
  {
    href: '/industry/top50',
    title: '事業者 Top50 ランキング',
    desc: '国内 BESS 事業者を総蓄電容量（MWh）で順位付け。bess-net プロジェクトDB（約263件）の build 時集計。容量・件数・展開都道府県数を一覧。',
    tag: 'ランキング',
  },
];

export default function IndustryHubPage() {
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '蓄電所業界 業界分析ハブ',
    description: '業界カオスマップ・JEPXハブ・海外5市場ハブ・業界トラッカー・Top50ランキングの5機能',
    numberOfItems: HUBS.length,
    itemListElement: HUBS.map((h, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: h.title,
      description: h.desc,
      url: `https://bess-net.jp${h.href}`,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '業界分析', item: 'https://bess-net.jp/industry' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        {/* Tier 1 UI 統一: max-w 1320 (data.eic-jp.org Phase B-C 規約) */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 業界分析
          </p>
          <div className="section-label">業界唯一 · 業界分析5機能</div>
          <h1 className="section-title">業界分析ハブ</h1>
          {/* Tier 1 UI 統一 #1: 本文 text-base lg:text-lg (16-18px) */}
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 24, lineHeight: 1.7 }}>
            蓄電所業界の<strong>構造・市場・海外・時系列・ランキング</strong>を 5 機能で可視化。
            業界カオスマップ・JEPXハブ・海外5市場ハブ・業界トラッカー・Top50ランキングへの入口です。
            すべて無料公開・登録不要。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
            {HUBS.map((h) => (
              <Link key={h.href} href={h.href} style={{
                display: 'block', padding: 16, border: '1px solid var(--color-border)',
                borderRadius: 8, textDecoration: 'none', color: 'inherit', background: 'white',
              }}>
                <div style={{
                  fontSize: 10, display: 'inline-block', padding: '1px 6px',
                  background: '#d6e4ff', color: '#346', borderRadius: 3, marginBottom: 4,
                }}>{h.tag}</div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: '4px 0 8px' }}>{h.title}</h2>
                <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: 'var(--color-text)' }}>{h.desc}</p>
                <div style={{ fontSize: 12, color: 'var(--color-accent)', marginTop: 8 }}>開く →</div>
              </Link>
            ))}
          </div>

          <section style={{ padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>ツール (実務支援5機能)</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/tools/irr-simulator">蓄電池 IRR シミュレーター</Link></li>
              <li><Link href="/tools/subsidy-match">補助金マッチング</Link></li>
              <li><Link href="/tools/grid-connection-check">系統連系診断</Link></li>
              <li><Link href="/tools/fire-risk-check">火災リスク自己診断</Link></li>
              <li><Link href="/tools/capacity-market-bid">容量市場応札試算</Link></li>
              <li><Link href="/tools">ツール一覧</Link></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
