/**
 * /market/jepx — JEPX ハブ (依頼AN + EIC Data 統合 R7-1)
 *
 * 設計 (CLAUDE.md §0 鉄則完全準拠):
 *   - 鉄則 #2: SSR 外部 API 0
 *       実データは src/data/eic/*.json (build 時 precompute) を import
 *       既存ダッシュボードは src/data/jepx-history (静的) を使用
 *   - 鉄則 #3: 単一 URL
 *   - 鉄則 #4: ピーク負荷 0 req/分
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import JEPXDashboard from '@/components/JEPXDashboard';
import JepxRealData from '@/components/JepxRealData';
import { siteConfig } from '@/lib/site-config';
import { DAILY_DATA, MONTHLY_DATA, AREAS } from '@/data/jepx-history';
import { getIndicatorsByIdPrefix, getSeriesMany } from '@/lib/eic-data';
import { EIC_DATA_DISCLAIMER } from '@/lib/cite-helpers';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'JEPX ハブ (スポット価格 日次10系列 × ヒートマップ × アービトラージ)',
  description:
    'JEPX スポット価格の業界唯一ハブ。9エリア + システムプライスの日次データを EIC Data (data.eic-jp.org) 経由で取得。ヒートマップ、アービトラージ計算機、引用機能つき。無料公開・登録不要。',
  alternates: { canonical: '/market/jepx' },
  openGraph: {
    title: 'JEPX ハブ (スポット価格 × ヒートマップ × 蓄電池アービトラージ)',
    description: 'JEPX 10 系列 日次 + 既存 30分単位デモ + アービトラージ計算機',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default async function JEPXHubPage() {
  // EIC Data の JEPX 10 系列を build 時データから読込 (SSR 外部 fetch 0)
  const indicators = await getIndicatorsByIdPrefix('jepx-');
  const series = await getSeriesMany(indicators.map((ind) => ind.id));
  const latestUpdate = series[0]?.meta.updated_at?.slice(0, 10) ?? new Date().toISOString().slice(0, 10);

  // JSON-LD Dataset (EIC Data 経由の実データを明示)
  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: 'JEPX スポット価格 (日次、10 系列)',
    description:
      '日本卸電力取引所 (JEPX) のスポット市場日次平均価格、9 エリア + システムプライス。EIC Data (data.eic-jp.org) 経由で配信。',
    url: 'https://bess-net.jp/market/jepx',
    isBasedOn: {
      '@type': 'Dataset',
      name: 'EIC Data JEPX 10 系列',
      url: 'https://data.eic-jp.org/catalog?domain=power',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    creator: {
      '@type': 'Organization',
      name: '日本卸電力取引所 (JEPX)',
      url: 'https://www.jepx.jp/',
    },
    license: 'https://www.jepx.jp/electricpower/index.html',
    keywords: ['JEPX', 'スポット価格', '電力市場', 'アービトラージ', '蓄電池'],
    temporalCoverage: `2012-04-01/${latestUpdate}`,
    isAccessibleForFree: true,
  };

  // JSON-LD SoftwareApplication (アービトラージ計算機)
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'JEPX アービトラージ計算機',
    applicationCategory: 'FinanceApplication',
    operatingSystem: 'Web',
    description: '過去 30日の JEPX スポット価格から蓄電池アービトラージ粗利益を試算',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    url: 'https://bess-net.jp/market/jepx',
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'JEPX ハブ', item: 'https://bess-net.jp/market/jepx' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(appJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / JEPX ハブ
          </p>
          <div className="section-label">業界唯一 · スポット市場ハブ</div>
          <h1 className="section-title">JEPX スポット価格 ハブ</h1>
          <p className="section-desc" style={{ marginBottom: 16 }}>
            JEPX スポット市場を <strong>9 エリア + システムプライス</strong> の日次データ ({series.length > 0 ? `${series.length} 系列、約 ${series[0]?.points.length.toLocaleString()} pt × 系列` : '集計中'}) で可視化。
            データは <strong><a href="https://data.eic-jp.org/catalog?domain=power" target="_blank" rel="noopener noreferrer">EIC Data</a></strong> 経由で取得、引用可能 (APA / BibTeX / Chicago)。
            業界唯一のスポット価格ハブ、無料公開・登録不要。
          </p>

          {/* 実データセクション (EIC Data) */}
          <JepxRealData series={series} />

          {/* 既存ダッシュボード (30分単位デモ、アービトラージ計算機) */}
          <section style={{ marginTop: 32, marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>🔬 30 分単位デモ + アービトラージ計算機</h2>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 0, marginBottom: 16 }}>
              ※ 以下は <strong>30 分単位の構造に基づくデモデータ</strong>です (実データは上の表、現在 JEPX の 30 分単位データは EIC Data でも整備中)。
              ヒートマップとアービトラージ計算機の UX 確認用にお使いください。実値は上の表または{' '}
              <a href="https://www.jepx.jp/electricpower/market-data/spot/" target="_blank" rel="noopener noreferrer">JEPX 公式</a>
              {' '}を参照。
            </p>
          </section>
          <JEPXDashboard />

          <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/tools/irr-simulator">蓄電池 IRR シミュレーター</Link></li>
              <li><Link href="/tools/capacity-market-bid">容量市場応札試算 (モック)</Link></li>
              <li><Link href="/explainer/spot-market">解説: スポット市場とは</Link></li>
              <li><Link href="/glossary/jepx">用語集: JEPX</Link></li>
              <li><a href="https://data.eic-jp.org/" target="_blank" rel="noopener noreferrer">EIC Data (一次データソース)</a></li>
            </ul>
          </section>

          <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 16, lineHeight: 1.6 }}>
            {EIC_DATA_DISCLAIMER}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
