/**
 * 国別市場ページ 共通コンポーネント
 * (依頼BC、5カ国共通テンプレート)
 *
 * Server Component (静的データのみ)
 */

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { GLOBAL_MARKETS, type CountryKey } from '@/data/global-markets';
import { siteConfig } from '@/lib/site-config';

export default function CountryMarketPage({ countryKey }: { countryKey: CountryKey }) {
  const m = GLOBAL_MARKETS[countryKey];

  // JSON-LD Article
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${m.name} 蓄電池市場概況`,
    description: m.overview,
    author: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    datePublished: '2026-05-15',
    dateModified: '2026-05-15',
    mainEntityOfPage: `https://bess-net.jp/global/${countryKey}`,
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '海外5市場ハブ', item: 'https://bess-net.jp/global' },
      { '@type': 'ListItem', position: 3, name: `${m.name} 市場`, item: `https://bess-net.jp/global/${countryKey}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/global">海外5市場ハブ</Link> / {m.name}
          </p>
          <div className="section-label">海外市場 · {m.nameEn}</div>
          <h1 className="section-title">{m.flag} {m.name} 蓄電池市場概況</h1>
          <p className="section-desc" style={{ marginBottom: 24 }}>{m.overview}</p>

          {/* 主要指標カード */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
            <Card label="2025 累積導入" value={`${m.marketSizeGWh2025} GWh`} accent />
            <Card label="2030 予測" value={`${m.marketSizeGWh2030} GWh`} accent />
            <Card label="CAGR" value={m.cagr} />
            <Card label="主要プレイヤー数" value={`${m.keyPlayers.length}社`} />
          </section>

          {/* ハイライト */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>ハイライト</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
              {m.highlights.map((h, i) => (<li key={i}>{h}</li>))}
            </ul>
          </section>

          {/* 主要政策 */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>主要政策</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
              {m.topPolicies.map((p, i) => (<li key={i}>{p}</li>))}
            </ul>
          </section>

          {/* 主要プレイヤー */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>主要プレイヤー</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
              {m.keyPlayers.map((p, i) => (<li key={i}>{p}</li>))}
            </ul>
          </section>

          {/* 価格動向 */}
          <section style={{ marginBottom: 24, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>価格動向</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{m.priceTrend}</p>
          </section>

          {/* 日本との比較 */}
          <section style={{ marginBottom: 24, padding: 16, background: 'rgba(0, 102, 204, 0.05)', border: '1px solid var(--color-accent)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>日本市場との比較</h2>
            <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0 }}>{m.japanComparison}</p>
          </section>

          {/* 備考 */}
          {m.notes && (
            <section style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>備考</h2>
              <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--color-muted)' }}>{m.notes}</p>
            </section>
          )}

          {/* 他国へのナビ */}
          <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>他の海外市場</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              {(['us', 'eu', 'cn', 'in', 'au'] as CountryKey[]).filter((k) => k !== countryKey).map((k) => (
                <li key={k}>
                  <Link href={`/global/${k}`}>{GLOBAL_MARKETS[k].flag} {GLOBAL_MARKETS[k].name} 蓄電池市場概況</Link>
                </li>
              ))}
              <li><Link href="/global">海外5市場ハブ (一覧)</Link></li>
            </ul>
          </section>

          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 16, lineHeight: 1.7 }}>
            ※ 編集部が IEA / BloombergNEF / 各国政府発表 等の公開情報に基づき作成 (2025-2026 時点)。
            最新は各種一次情報を参照。
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      padding: 12, border: '1px solid var(--color-border)', borderRadius: 6,
      background: accent ? 'rgba(0, 102, 204, 0.06)' : 'transparent',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
