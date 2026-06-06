/**
 * /dashboard/market — マーケットデータダッシュボード (EIC Data 統合)
 *
 * 設計 (CLAUDE.md §0 鉄則完全準拠):
 *   - 鉄則 #2 SSR 外部 API 0: build 時 precompute 済 src/data/eic/*.json を import のみ
 *   - 鉄則 #3 単一ページ
 *   - 鉄則 #4 ピーク負荷: ランタイム 0 req/分
 *   - L-JEPX-UI-002 section-inner 上書き (maxWidth 1320)
 *
 * 構成 (3 セクション、計 29 系列):
 *   - 電源構成: METI 12 (発電 8 + 需要 3 + 再エネ比率 1)
 *   - 燃料価格: Fuel 7 (LNG/原油 3/石炭/ガス 2)
 *   - 金融指標: JGB 2 + US Treasury 4 + USD/JPY 4 = 10
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import MarketDataPanel from '@/components/dashboard/MarketDataPanel';
import { getIndicatorsByIdPrefix, getSeriesMany } from '@/lib/eic-data';
import { EIC_DATA_DISCLAIMER } from '@/lib/cite-helpers';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 86400; // 24h ISR

export const metadata: Metadata = {
  title: 'マーケットデータダッシュボード (電源構成 × 燃料 × 金融)',
  description:
    '日本電源構成 (METI 12 系列) + 国際燃料価格 (Fuel 7 系列) + 金融指標 (JGB/US Treasury/USD-JPY 10 系列) を EIC Data 経由で一元可視化。引用可能 (APA/BibTeX/Chicago)。業界レポート2026 の引用基盤、無料公開・登録不要。',
  alternates: { canonical: '/dashboard/market' },
  openGraph: {
    title: 'マーケットデータダッシュボード (電源構成 × 燃料 × 金融)',
    description: 'METI 12 + Fuel 7 + Finance 10 = 29 系列を EIC Data 経由で統合',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default async function MarketDashboardPage() {
  // 電源構成 (METI 12 系列)
  const metiIndicators = await getIndicatorsByIdPrefix('meti-');
  const metiSeries = await getSeriesMany(metiIndicators.map((i) => i.id));

  // 燃料 7 系列
  const fuelIndicators = await getIndicatorsByIdPrefix('fuel-');
  const fuelSeries = await getSeriesMany(fuelIndicators.map((i) => i.id));

  // 金融 (JGB + US Treasury + FX = 10 系列)
  const jgbIndicators = await getIndicatorsByIdPrefix('jgb-');
  const usTreasuryIndicators = await getIndicatorsByIdPrefix('us-treasury-');
  const fxIndicators = await getIndicatorsByIdPrefix('fx-');
  const financeSeries = await getSeriesMany([
    ...jgbIndicators.map((i) => i.id),
    ...usTreasuryIndicators.map((i) => i.id),
    ...fxIndicators.map((i) => i.id),
  ]);

  // 最終更新日 (fuel の updated_at を代表値)
  const latestUpdate =
    fuelSeries[0]?.meta.updated_at?.slice(0, 10) ??
    metiSeries[0]?.meta.updated_at?.slice(0, 10) ??
    new Date().toISOString().slice(0, 10);

  // 業界レポート 2026 で参照されるカバレッジ
  const totalSeries = metiSeries.length + fuelSeries.length + financeSeries.length;

  // JSON-LD Dataset schema × 3
  const datasetSchemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: '日本電源構成データ (月次、12 系列)',
      description: '経済産業省 電力調査統計に基づく日本の電源構成の月次データセット。発電源別8系列・需要3系列・再エネ比率1系列を収録し、系統用蓄電池事業の市場環境分析に活用できる。',
      url: 'https://bess-net.jp/dashboard/market#power',
      isBasedOn: {
        '@type': 'Dataset',
        name: 'EIC Data METI 12 系列',
        url: 'https://data.eic-jp.org/catalog?domain=power',
        description: '一般社団法人エネルギー情報センターのデータ基盤「EIC Data」が提供する経済産業省 電力調査統計由来の月次12系列（発電源別8・需要3・再エネ比率1）。日本の電源構成の推移を構造化。',
        creator: { '@type': 'Organization', name: 'EIC Data（一般社団法人エネルギー情報センター）', url: 'https://data.eic-jp.org/' },
        license: 'https://data.eic-jp.org/citation-policy',
      },
      publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
      creator: { '@type': 'Organization', name: '経済産業省', url: 'https://www.enecho.meti.go.jp/' },
      license: 'https://www.meti.go.jp/main/rules.html',
      isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: '国際燃料価格 (月次、7 系列)',
      description: 'World Bank Pink Sheet 月次公表値。LNG/原油 (Brent/Dubai/WTI)/石炭/天然ガス (Henry Hub/TTF)',
      url: 'https://bess-net.jp/dashboard/market#fuel',
      isBasedOn: {
        '@type': 'Dataset',
        name: 'EIC Data Fuel 7 系列',
        url: 'https://data.eic-jp.org/catalog?domain=fuel',
        description: '「EIC Data」が提供する国際燃料価格の月次7系列。World Bank Pink Sheet由来のLNG・原油・石炭・天然ガス価格を収録し、蓄電池事業の市場環境分析に利用できる。',
        creator: { '@type': 'Organization', name: 'EIC Data（一般社団法人エネルギー情報センター）', url: 'https://data.eic-jp.org/' },
        license: 'https://data.eic-jp.org/citation-policy',
      },
      publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
      creator: { '@type': 'Organization', name: 'World Bank', url: 'https://www.worldbank.org/' },
      license: 'https://www.worldbank.org/en/about/legal/terms-and-conditions',
      isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Dataset',
      name: '金融指標 (日次/月次、10 系列)',
      description: 'JGB 利回り 2 系列 + US Treasury 4 系列 + USD/JPY 4 系列。蓄電池 IRR シミュレーターの割引率連動 + マクロ要因分析の基礎',
      url: 'https://bess-net.jp/dashboard/market#finance',
      isBasedOn: {
        '@type': 'Dataset',
        name: 'EIC Data Finance 10 系列',
        url: 'https://data.eic-jp.org/catalog?domain=finance',
        description: '「EIC Data」が提供する金融・マクロの月次10系列。為替・金利・米国指標など、系統用蓄電池事業の経済性評価に関わる基礎データを収録。',
        creator: { '@type': 'Organization', name: 'EIC Data（一般社団法人エネルギー情報センター）', url: 'https://data.eic-jp.org/' },
        license: 'https://data.eic-jp.org/citation-policy',
      },
      publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
      creator: { '@type': 'Organization', name: '財務省 + 日本銀行 + FRED', url: 'https://www.mof.go.jp/jgbs/' },
      license: 'https://www.mof.go.jp/copyright/index.htm',
      isAccessibleForFree: true,
    },
  ];

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'マーケットデータ', item: 'https://bess-net.jp/dashboard/market' },
    ],
  };

  return (
    <>
      {datasetSchemas.map((schema, idx) => (
        <script
          key={idx}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        {/* Tier 1 UI 統一: max-w 1320 (L-JEPX-UI-002) */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / マーケットデータ
          </p>
          <div className="section-label">業界唯一 · マーケットデータハブ</div>
          <h1 className="section-title">マーケットデータダッシュボード</h1>
          {/* Tier 1 UI 統一: text-base lg:text-lg */}
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            日本の<strong>電源構成</strong> ({metiSeries.length} 系列) + <strong>国際燃料価格</strong> ({fuelSeries.length} 系列) +{' '}
            <strong>金融指標</strong> ({financeSeries.length} 系列) = <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{totalSeries}</span> 系列を一元可視化。
            データは <a href="https://data.eic-jp.org/" target="_blank" rel="noopener noreferrer">EIC Data (data.eic-jp.org)</a> 経由で取得、引用可能 (APA / BibTeX / Chicago)。
            業界レポート2026 (5/24 公開予定) の引用基盤、無料公開・登録不要。
          </p>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 32 }}>
            最終更新: {latestUpdate} (毎朝 JST 8:00 自動取得 / build 時の precompute で正規化)
          </p>

          {/* セクション 1: 電源構成 */}
          <MarketDataPanel
            anchorId="power"
            title="電源構成 (METI 電力調査統計)"
            description="日本国内の電源別発電量・需要・再エネ比率の月次データ。エネルギー基本計画 2030 年再エネ比率 36-38% 目標との比較が可能。"
            series={metiSeries}
            defaultUnit="GWh"
            sourceUrl="https://www.enecho.meti.go.jp/statistics/electric_power/ep002/results.html"
            sourceName="経済産業省 電力調査統計"
            csvDir="enecho-power"
          />

          {/* セクション 2: 燃料価格 */}
          <MarketDataPanel
            anchorId="fuel"
            title="国際燃料価格 (World Bank Pink Sheet)"
            description="LNG・原油 (Brent/Dubai/WTI)・石炭・天然ガスの月次価格。業界レポート2026 第 2 章「マクロ要因」の基礎データ。"
            series={fuelSeries}
            defaultUnit="$"
            sourceUrl="https://www.worldbank.org/en/research/commodity-markets"
            sourceName="World Bank Pink Sheet"
            csvDir="fuel"
          />

          {/* セクション 3: 金融指標 */}
          <MarketDataPanel
            anchorId="finance"
            title="金融指標 (JGB + US Treasury + USD/JPY)"
            description="日本国債 (JGB 10y/30y) + 米国債 (Treasury 2y/5y/10y/30y) + 為替 (USD/JPY 月中平均/末/高/安)。蓄電池 IRR の割引率連動 + マクロ要因分析の基礎データ。"
            series={financeSeries}
            defaultUnit="%"
            sourceUrl="https://www.mof.go.jp/jgbs/reference/interest_rate/"
            sourceName="財務省 国債金利情報 + FRED + 日本銀行"
            csvDir="finance"
          />

          <section style={{
            marginTop: 32, padding: 16,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)', borderRadius: 6,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連 (業界唯一機能)</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/market/jepx">JEPX スポット価格ハブ</Link> — 10 系列 × 5,158 日次レコード</li>
              <li><Link href="/tools/irr-simulator">蓄電池 IRR シミュレーター</Link> — 割引率の参考に金融指標を活用</li>
              <li><Link href="/reports/2026">業界レポート2026 (プレビュー)</Link> — 5/24 本編公開予定</li>
              <li><Link href="/industry">業界分析ハブ</Link> — 4 機能集約</li>
              <li><a href="https://data.eic-jp.org/" target="_blank" rel="noopener noreferrer">EIC Data (一次データソース)</a></li>
            </ul>
          </section>

          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 16, lineHeight: 1.7 }}>
            {EIC_DATA_DISCLAIMER}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
