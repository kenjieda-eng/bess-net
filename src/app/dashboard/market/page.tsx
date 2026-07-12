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
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '電源構成・燃料価格・金利 — 蓄電池事業のマクロ指標ダッシュボード',
  description:
    '日本電源構成 (METI 12 系列) + 国際燃料価格 (Fuel 7 系列) + 金融指標 (JGB/US Treasury/USD-JPY 10 系列) を EIC Data 経由で一元可視化。引用可能 (APA/BibTeX/Chicago)。業界レポート2026 の引用基盤、無料公開・登録不要。',
  alternates: { canonical: '/dashboard/market' },
  openGraph: {
    title: '電源構成・燃料価格・金利 — 蓄電池事業のマクロ指標ダッシュボード',
    description: 'METI 12 + Fuel 7 + Finance 10 = 29 系列を EIC Data 経由で統合',
    type: 'website',
    images: ['/og-image.png'],
  },
};

// ─── 鮮度・サマリー導出ヘルパ（実データからコード導出・焼き込み禁止 L-EIC-027） ───
import type { SeriesData } from '@/types/eic';

/** セクション内全系列の非 null 最新データ月（YYYY-MM） */
function latestDataMonthOf(series: SeriesData[]): string | undefined {
  let max = '';
  for (const s of series) {
    for (const p of s.points) {
      if (p.value != null && p.date > max) max = p.date;
    }
  }
  return max ? max.slice(0, 7) : undefined;
}

/** 系列の末尾2つの非 null 点（最新値＋前回値） */
function lastTwoValid(s: SeriesData | undefined): { last?: { date: string; value: number }; prev?: { date: string; value: number } } {
  if (!s) return {};
  const pts = s.points.filter((p): p is { date: string; value: number } => p.value != null);
  return { last: pts[pts.length - 1], prev: pts[pts.length - 2] };
}

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

  // 業界レポート 2026 で参照されるカバレッジ
  const totalSeries = metiSeries.length + fuelSeries.length + financeSeries.length;

  // P1b: セクション毎のデータ最新月（系列実値からコード導出）
  const metiLatestMonth = latestDataMonthOf(metiSeries);
  const fuelLatestMonth = latestDataMonthOf(fuelSeries);
  const financeLatestMonth = latestDataMonthOf(financeSeries);
  // P1c 燃料注記の月表記も実データ導出（焼き込み禁止。供給元復旧時は自動追従し、注記撤去は別タスク）
  const fuelLatestMonthJa = fuelLatestMonth
    ? `${fuelLatestMonth.slice(0, 4)}年${Number(fuelLatestMonth.slice(5, 7))}月`
    : undefined;

  // P2a: 蓄電所事業者向けサマリー3指標（既存ロードデータからコード導出・追加取得なし）
  const summaryItems = [
    {
      label: '日本 LNG 輸入価格（CIF）',
      ...lastTwoValid(fuelSeries.find((s) => s.id === 'fuel-lng-jp-cif')),
      unit: '$/MMBtu',
      deltaLabel: '前月比',
      deltaUnit: '$',
      digits: 2,
    },
    {
      label: 'JGB 10年金利（新発）',
      ...lastTwoValid(financeSeries.find((s) => s.id === 'jgb-10y-yield')),
      unit: '%',
      deltaLabel: '前日比',
      deltaUnit: 'pt',
      digits: 3,
    },
    {
      label: '再エネ比率（発電ベース）',
      ...lastTwoValid(metiSeries.find((s) => s.id === 'meti-renewables-share')),
      unit: '%',
      deltaLabel: '前月比',
      deltaUnit: 'pt',
      digits: 1,
    },
  ].filter((it) => it.last);

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
          <div className="section-label">当サイト独自 · マーケットデータハブ</div>
          <h1 className="section-title">電源構成・燃料価格・金利 — 蓄電池事業のマクロ指標ダッシュボード</h1>
          {/* Tier 1 UI 統一: text-base lg:text-lg */}
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            日本の<strong>電源構成</strong> ({metiSeries.length} 系列) + <strong>国際燃料価格</strong> ({fuelSeries.length} 系列) +{' '}
            <strong>金融指標</strong> ({financeSeries.length} 系列) = <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>{totalSeries}</span> 系列を一元可視化。
            蓄電所事業の判断材料に。
            データは <a href="https://data.eic-jp.org/" target="_blank" rel="noopener noreferrer">EIC Data (data.eic-jp.org)</a> 経由で取得、引用可能 (APA / BibTeX / Chicago)。
            業界レポート2026 の引用基盤、無料公開・登録不要。
          </p>
          {/* P1a: 取得ジョブ日とデータ鮮度の混同を解消（dashboard-market分析2026-07-12） */}
          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 20 }}>
            データ取得: 毎朝 8:00 JST（系列により公表ラグ・更新停止があります。各セクションにデータ最新月を表示）
          </p>

          {/* P2a: 蓄電所事業者向けサマリー（既存ロードデータからコード導出・追加取得なし） */}
          {summaryItems.length > 0 && (
            <section
              aria-label="蓄電所事業者向けサマリー"
              style={{
                marginBottom: 32,
                padding: 16,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
                蓄電所事業者向けサマリー
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
                {summaryItems.map((it) => {
                  const delta = it.last && it.prev ? it.last.value - it.prev.value : null;
                  return (
                    <div
                      key={it.label}
                      style={{
                        padding: '10px 14px',
                        background: 'var(--color-bg-card, #fff)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 6,
                      }}
                    >
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>{it.label}</div>
                      <div className="tabular-nums" style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                        {it.last!.value.toFixed(it.digits)} <span style={{ fontSize: 13, fontWeight: 500 }}>{it.unit}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 2 }}>
                        {delta !== null && (
                          <span style={{ color: delta > 0 ? '#b91c1c' : delta < 0 ? '#15803d' : 'var(--color-muted)', fontWeight: 600 }}>
                            {it.deltaLabel} {delta > 0 ? '+' : ''}{delta.toFixed(it.digits)} {it.deltaUnit}
                          </span>
                        )}
                        <span style={{ marginLeft: 6 }}>（{it.last!.date.slice(0, 7)} 時点）</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p style={{ fontSize: 13, marginTop: 10, marginBottom: 0 }}>
                金利は蓄電池投資の割引率の前提になります →{' '}
                <Link href="/tools/irr-simulator">蓄電池 IRR シミュレーターで事業性を試算</Link>
              </p>
            </section>
          )}

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
            latestDataMonth={metiLatestMonth}
            readingGuide="再エネ比率の上昇は出力制御・価格変動の増加要因であり、蓄電池の裁定機会と調整力需要の背景データです。"
            freshnessNote="※ 出典（METI 電力調査統計）の公表は4〜6ヶ月遅れのため、最新月が過去になります（構造的なもので正常です）。"
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
            latestDataMonth={fuelLatestMonth}
            readingGuide="燃料価格は卸電力（JEPX）価格の主要ドライバーで、蓄電池の充放電スプレッドに影響します。"
            freshnessNote={fuelLatestMonthJa ? `※ 現在 ${fuelLatestMonthJa}分までの掲載です（データ供給元の公表状況を確認中）。` : undefined}
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
            latestDataMonth={financeLatestMonth}
            readingGuide="金利は蓄電池投資の割引率・資金調達コストの前提です。IRR シミュレーターの割引率設定の参考にどうぞ。"
          />

          <section style={{
            marginTop: 32, padding: 16,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)', borderRadius: 6,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連 (当サイト独自機能)</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/market/jepx">JEPX スポット価格ハブ</Link> — 10 系列 × 5,158 日次レコード</li>
              <li><Link href="/tools/irr-simulator">蓄電池 IRR シミュレーター</Link> — 割引率の参考に金融指標を活用</li>
              <li><Link href="/reports/2026">業界レポート2026</Link> — 本編公開中（全10章）</li>
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
