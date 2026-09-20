/**
 * /tools/balancing-revenue — 需給調整 収益シナリオ（蓄電池）Phase 1
 *
 * 設計:
 *  - microCMS リクエストなし → 落とし穴 #95 #98 と無関係
 *  - 単価は catalog JSON から直読み（precompute 済み, 自動更新対応）
 *  - 外部 API アクセスなし（L-EIC-018 / CLAUDE.md 鉄則 #2 #4）
 *  - revalidate = 86400（catalog 更新に追従）
 *  - 出典: EPRX（電力需給調整力取引所）+ 加工した旨を明記
 *
 * v2 (2026-05-24): FY2024 既定 + FY2025 トグル（リン回答反映）
 * v5 (2026-08-24): FY2025 を通年確報へ差し替え／水力・揚水の合算系列 6本と二次②VPP を追加
 *  - FY2024 = date "2024-04-01"（通年・確定）を既定表示
 *  - FY2025 = date "2025-04-01"（通年・確定。2026-08-24 に上期暫定から差し替え）をトグル補助
 *
 * v3 (2026-05-25): 電源種別比較（蓄電池 vs VPP vs 揚水）二極構造追加
 *  - catalog170: battery 6 + vpp 4 + pumped 6 = 16 系列
 *  - BalancingSourceComparison コンポーネント追加（収益計算機の下）
 *  - VPP 約定月数注記・L-EIC-018 注記を含む
 *
 * v4 (2026-05-26): 電源種別比較 5種完結（+火力6+水力5）
 *  - catalog 2026-05-26（balancing 系 39）
 *  - thermal 6 + hydro 5 (三次②なし) 追加 → BalancingSourceComparison に注入
 *  - 二極構造: 新型（蓄電池・VPP）vs 従来型（火力・水力・揚水）
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {
  BalancingRevenueEstimator,
  type ProductKey,
  type FyKey,
} from '@/components/BalancingRevenueEstimator';
import {
  BalancingSourceComparison,
  type PricesBySourceFy,
  type CompFyKey,
  type CompProduct,
  type CompSource,
} from '@/components/BalancingSourceComparison';
import { siteConfig } from '@/lib/site-config';
import { BALANCING_BATTERY_FALLBACK, BALANCING_FY_DATE } from '@/lib/balancing-fallback';

// Lc-1(2026-09-20): ライセンス表記の逐語表示と、カタログに残る 404 license_url の正規化
import { licenseNoticeLines, normalizeLicenseUrl, EPRX_TOP } from '@/lib/eic-license';
// Lc-2 ■4: 年度内の幅（月次 min〜max）。カタログは年平均しか持たないため EPRX 年次 PDF からの転記を使う
import { getVerifiedMonthlyStats, getMonthlyStats, pdfFileNameOf } from '@/lib/eprx-monthly';

/**
 * 幅の転記元を出典欄に書くための文字列（Lc-2 ■4(d)）。
 * ファイル名とページ番号をデータ側から組み立てるので、年度を足しても書き換え漏れが起きない。
 */
const MONTHLY_PDF_SOURCE = (['FY2024', 'FY2025'] as const)
  .map((fy) => {
    const file = pdfFileNameOf(fy);
    if (!file) return null;
    const pages = [...new Set(
      (['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'tertiary-2', 'composite'] as const)
        .map((p) => getMonthlyStats(fy, p)?.pdfPage)
        .filter((n): n is number => typeof n === 'number'),
    )].sort((a, b) => a - b);
    return `${fy} は ${file} の p${pages.join('・p')}`;
  })
  .filter((s): s is string => s !== null)
  .join(' ／ ');

// ─── catalog JSON 直読み（server only） ────────────────────────────────────────
// battery (6 系列)
import primaryBatteryData    from '@/data/eic/balancing-price-primary-battery.json';
import secondary1BatteryData from '@/data/eic/balancing-price-secondary-1-battery.json';
import secondary2BatteryData from '@/data/eic/balancing-price-secondary-2-battery.json';
import tertiary1BatteryData  from '@/data/eic/balancing-price-tertiary-1-battery.json';
import tertiary2BatteryData  from '@/data/eic/balancing-price-tertiary-2-battery.json';
import compositeBatteryData  from '@/data/eic/balancing-price-composite-battery.json';
// vpp (5 系列：二次①は系列なし。二次②は 2026-08-24 に新設)
import primaryVppData    from '@/data/eic/balancing-price-primary-vpp.json';
import tertiary1VppData  from '@/data/eic/balancing-price-tertiary-1-vpp.json';
import secondary2VppData from '@/data/eic/balancing-price-secondary-2-vpp.json'; // 2026-08-24 新設（FY2025 は3月のみ落札）
import tertiary2VppData  from '@/data/eic/balancing-price-tertiary-2-vpp.json';
import compositeVppData  from '@/data/eic/balancing-price-composite-vpp.json';
// pumped (6 系列)
import primaryPumpedData    from '@/data/eic/balancing-price-primary-pumped.json';
import secondary1PumpedData from '@/data/eic/balancing-price-secondary-1-pumped.json';
import secondary2PumpedData from '@/data/eic/balancing-price-secondary-2-pumped.json';
import tertiary1PumpedData  from '@/data/eic/balancing-price-tertiary-1-pumped.json';
import tertiary2PumpedData  from '@/data/eic/balancing-price-tertiary-2-pumped.json';
import compositePumpedData  from '@/data/eic/balancing-price-composite-pumped.json';
// hydro-pumped (6 系列・FY2025 のみ。2026-08-24 に EPRX が水力と揚水を合算公表に変更)
import primaryHydroPumpedData    from '@/data/eic/balancing-price-primary-hydro-pumped.json';
import secondary1HydroPumpedData from '@/data/eic/balancing-price-secondary-1-hydro-pumped.json';
import secondary2HydroPumpedData from '@/data/eic/balancing-price-secondary-2-hydro-pumped.json';
import tertiary1HydroPumpedData  from '@/data/eic/balancing-price-tertiary-1-hydro-pumped.json';
import tertiary2HydroPumpedData  from '@/data/eic/balancing-price-tertiary-2-hydro-pumped.json';
import compositeHydroPumpedData  from '@/data/eic/balancing-price-composite-hydro-pumped.json';
// thermal (6 系列)
import primaryThermalData    from '@/data/eic/balancing-price-primary-thermal.json';
import secondary1ThermalData from '@/data/eic/balancing-price-secondary-1-thermal.json';
import secondary2ThermalData from '@/data/eic/balancing-price-secondary-2-thermal.json';
import tertiary1ThermalData  from '@/data/eic/balancing-price-tertiary-1-thermal.json';
import tertiary2ThermalData  from '@/data/eic/balancing-price-tertiary-2-thermal.json';
import compositeThermalData  from '@/data/eic/balancing-price-composite-thermal.json';
// hydro (5 系列：三次②は系列なし)
import primaryHydroData    from '@/data/eic/balancing-price-primary-hydro.json';
import secondary1HydroData from '@/data/eic/balancing-price-secondary-1-hydro.json';
import secondary2HydroData from '@/data/eic/balancing-price-secondary-2-hydro.json';
import tertiary1HydroData  from '@/data/eic/balancing-price-tertiary-1-hydro.json';
import compositeHydroData  from '@/data/eic/balancing-price-composite-hydro.json';

export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  title: '需給調整 収益シナリオ（蓄電池）',
  description:
    '需給調整市場 6 商品（一次〜三次②・複合）の蓄電池落札単価（EPRX 実績）に落札率・容量・コマ数を掛けた概算年間収益を試算。蓄電池・VPP・揚水・火力・水力の5種完結 落札単価比較（二極構造）も掲載。単価は約定時水準（L-EIC-018）。FY2024 通年確定値を既定表示。',
  alternates: { canonical: '/tools/balancing-revenue' },
  openGraph: {
    title: '需給調整 収益シナリオ（蓄電池）| 蓄電所ネット',
    description:
      'EPRX 蓄電池単価ベースの概算収益シナリオ。蓄電池・VPP・揚水・火力・水力 5種完結の電源種別比較（二極構造）も収録。FY2024（通年・確定）を既定、FY2025（通年・確定）もトグルで確認可能。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

// ─── Lc-1 ■4: ライセンス表記は逐語で出す（要約しない・2026-09-20） ─────────────
// 表示中の EPRX 系列 46 本は license_notice が全て同一・空は 0 本（実測）。代表として 1 本から読む。
// ★license_notice の 2 行目「EPRX 利用規約 §4 に従い、非商用・出典明示で利用可。…商用利用は事前契約…」は
//   EPRX 条文に無い当社データ基盤側の判断で、EDAさんが EPRX へ照会中（Lc-1 ■1）。判定が返るまで表示しない。
//   → 逐語で出すのは出典行のみ。照会結果が出たら上流カタログを直し、ここで全行を出す。
const EPRX_META = primaryBatteryData.meta as unknown as { license_notice?: string; license_url?: string };
const EPRX_NOTICE_LINES = licenseNoticeLines(EPRX_META.license_notice);
const EPRX_SOURCE_LINE = EPRX_NOTICE_LINES[0] ?? '';
const EPRX_LICENSE_URL = normalizeLicenseUrl(EPRX_META.license_url) ?? 'https://www.eprx.or.jp/terms/';

// ─── catalog helpers ──────────────────────────────────────────────────────────

type CatalogData = {
  points: { date: string; value: number }[];
};

/** 指定 date の値を返す（見つからなければ null） */
function valueAtDate(data: CatalogData, isoDate: string): number | null {
  const pt = data.points?.find((p) => p.date === isoDate);
  return pt?.value ?? null;
}

/** FY キー → catalog の date は SSOT（balancing-fallback.ts）を参照 */
const DATE_MAP: Record<FyKey, string> = BALANCING_FY_DATE;

/**
 * fallback は src/lib/balancing-fallback.ts（SSOT）を参照する。
 * ★2026-08-24: 従来は本ファイルと BalancingRevenueEstimator.tsx の2箇所で同じ値を別々に持つ
 *   二重管理だった（落とし穴 #121）。両方を SSOT 参照に寄せた。
 * ★EPRX の約定実績 年平均であって ΔkW 上限価格ではない（上限は 2026/8/31 実需給分まで 15.00 円、
 *   2026/9/1 実需給分から 10.00 円。EPRX 2026-07-30 公表）。実績値を上限値に書き換えないこと。
 */
const FALLBACK_BY_FY: Record<FyKey, Record<ProductKey, number>> = BALANCING_BATTERY_FALLBACK;

export default function BalancingRevenuePage() {
  const productSources: { key: ProductKey; data: CatalogData }[] = [
    { key: 'primary',     data: primaryBatteryData    as CatalogData },
    { key: 'secondary-1', data: secondary1BatteryData as CatalogData },
    { key: 'secondary-2', data: secondary2BatteryData as CatalogData },
    { key: 'tertiary-1',  data: tertiary1BatteryData  as CatalogData },
    { key: 'tertiary-2',  data: tertiary2BatteryData  as CatalogData },
    { key: 'composite',   data: compositeBatteryData  as CatalogData },
  ];

  // FY2024 と FY2025 の単価マップを catalog から構築（読めなければ fallback）
  const pricesByFy: Record<FyKey, Record<ProductKey, number>> = {
    FY2024:   { ...FALLBACK_BY_FY.FY2024 },
    FY2025: { ...FALLBACK_BY_FY.FY2025 },
  };

  for (const fyKey of ['FY2024', 'FY2025'] as FyKey[]) {
    for (const { key, data } of productSources) {
      const v = valueAtDate(data, DATE_MAP[fyKey]);
      if (v !== null) pricesByFy[fyKey][key] = v;
    }
  }

  // ─── Lc-2 ■4: 年度内の幅（月次の最小〜最大）────────────────────────────────
  // 年平均だけを出すと「その水準が年間続く」と読まれる。三次②は FY2024 で 9.81〜234.89（24 倍）動く。
  // 月次はカタログに無い（frequency: annual）ため、EPRX 年次 PDF からの転記（src/data/eprx-monthly-battery.json）を使う。
  // ★getVerifiedMonthlyStats は「月次平均（丸め）＝表示中の年平均」が成り立つときだけ値を返す。
  //   出所の違う 2 つの数値を並べるので、ずれたら幅を出さずに縮退する（scripts/verify-eprx-monthly.ts が build で警告）。
  const rangesByFy: Record<FyKey, Partial<Record<ProductKey, { min: number; max: number; awardedMonths: number }>>> = {
    FY2024: {},
    FY2025: {},
  };
  for (const fyKey of ['FY2024', 'FY2025'] as FyKey[]) {
    for (const { key } of productSources) {
      const stats = getVerifiedMonthlyStats(fyKey, key, pricesByFy[fyKey][key]);
      if (stats) {
        rangesByFy[fyKey][key] = { min: stats.min, max: stats.max, awardedMonths: stats.awardedMonths };
      }
    }
  }
  const tertiary2Fy2024 = rangesByFy.FY2024['tertiary-2'];

  // ─── pricesBySourceFy（電源種別比較用） ────────────────────────────────────
  type SourceSeries = { product: CompProduct; data: CatalogData }[];
  const batterySeries: SourceSeries = [
    { product: '一次',  data: primaryBatteryData    as CatalogData },
    { product: '二次①', data: secondary1BatteryData as CatalogData },
    { product: '二次②', data: secondary2BatteryData as CatalogData },
    { product: '三次①', data: tertiary1BatteryData  as CatalogData },
    { product: '三次②', data: tertiary2BatteryData  as CatalogData },
    { product: '複合',  data: compositeBatteryData  as CatalogData },
  ];
  const vppSeries: SourceSeries = [
    // 二次①②は系列なし（VPP は約定ゼロ）
    { product: '一次',  data: primaryVppData   as CatalogData },
    { product: '三次①', data: tertiary1VppData as CatalogData },
    { product: '三次②', data: tertiary2VppData as CatalogData },
    { product: '二次②', data: secondary2VppData as CatalogData },
    { product: '複合',  data: compositeVppData as CatalogData },
  ];
  const pumpedSeries: SourceSeries = [
    { product: '一次',  data: primaryPumpedData    as CatalogData },
    { product: '二次①', data: secondary1PumpedData as CatalogData },
    { product: '二次②', data: secondary2PumpedData as CatalogData },
    { product: '三次①', data: tertiary1PumpedData  as CatalogData },
    { product: '三次②', data: tertiary2PumpedData  as CatalogData },
    { product: '複合',  data: compositePumpedData  as CatalogData },
  ];
  const thermalSeries: SourceSeries = [
    { product: '一次',  data: primaryThermalData    as CatalogData },
    { product: '二次①', data: secondary1ThermalData as CatalogData },
    { product: '二次②', data: secondary2ThermalData as CatalogData },
    { product: '三次①', data: tertiary1ThermalData  as CatalogData },
    { product: '三次②', data: tertiary2ThermalData  as CatalogData },
    { product: '複合',  data: compositeThermalData  as CatalogData },
  ];
  const hydroSeries: SourceSeries = [
    // 三次②は系列なし（水力は三次②約定ゼロ）
    { product: '一次',  data: primaryHydroData    as CatalogData },
    { product: '二次①', data: secondary1HydroData as CatalogData },
    { product: '二次②', data: secondary2HydroData as CatalogData },
    { product: '三次①', data: tertiary1HydroData  as CatalogData },
    { product: '複合',  data: compositeHydroData  as CatalogData },
  ];
  // 2026-08-24: FY2025 から水力・揚水は合算系列（hydro / pumped は FY2024 で終端）
  const hydroPumpedSeries: SourceSeries = [
    { product: '一次',  data: primaryHydroPumpedData    as CatalogData },
    { product: '二次①', data: secondary1HydroPumpedData as CatalogData },
    { product: '二次②', data: secondary2HydroPumpedData as CatalogData },
    { product: '三次①', data: tertiary1HydroPumpedData  as CatalogData },
    { product: '三次②', data: tertiary2HydroPumpedData  as CatalogData },
    { product: '複合',  data: compositeHydroPumpedData  as CatalogData },
  ];
  const sourceSeries: Record<CompSource, SourceSeries> = {
    battery: batterySeries,
    vpp:     vppSeries,
    pumped:  pumpedSeries,
    thermal: thermalSeries,
    hydro:   hydroSeries,
    hydroPumped: hydroPumpedSeries,
  };

  const pricesBySourceFy: PricesBySourceFy = {
    battery:     { FY2024: {}, FY2025: {} },
    vpp:         { FY2024: {}, FY2025: {} },
    pumped:      { FY2024: {}, FY2025: {} },
    thermal:     { FY2024: {}, FY2025: {} },
    hydro:       { FY2024: {}, FY2025: {} },
    hydroPumped: { FY2024: {}, FY2025: {} },
  };
  for (const src of ['battery', 'vpp', 'pumped', 'thermal', 'hydro', 'hydroPumped'] as CompSource[]) {
    for (const { product, data: d } of sourceSeries[src]) {
      for (const fyKey of ['FY2024', 'FY2025'] as CompFyKey[]) {
        const v = valueAtDate(d, DATE_MAP[fyKey as FyKey]);
        if (v !== null) pricesBySourceFy[src][fyKey][product] = v;
      }
    }
  }

  // JSON-LD
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '需給調整 収益シナリオ（蓄電池）',
    description:
      '需給調整市場 6 商品の蓄電池落札単価（EPRX 実績）に落札率・容量・コマ数を掛けた概算年間収益を試算するツール。',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    url: 'https://bess-net.jp/tools/balancing-revenue',
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ',          item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'ツール',          item: 'https://bess-net.jp/tools' },
      { '@type': 'ListItem', position: 3, name: '需給調整 収益シナリオ', item: 'https://bess-net.jp/tools/balancing-revenue' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          {/* パンくず */}
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/tools">ツール</Link> /{' '}
            需給調整 収益シナリオ（蓄電池）
          </p>

          <div className="section-label">EPRX 実約定価格・6商品 · 無料・登録不要</div>
          <h1 className="section-title">需給調整 収益シナリオ（蓄電池）</h1>
          <p
            className="section-desc text-base lg:text-lg"
            style={{ marginBottom: 8, lineHeight: 1.7 }}
          >
            需給調整市場 6 商品（一次・二次①②・三次①②・複合）の
            <strong>蓄電池落札単価（EPRX 実績）</strong>に
            落札率・容量・年間コマ数を掛けた<strong>概算年間収益</strong>を試算します。
          </p>
          <p style={{ fontSize: 15, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
            単価は「蓄電池が約定したときの水準」（volume 非加重、L-EIC-018）です。
            既定は <strong>FY2024（通年・確定）</strong>。<strong>FY2025（通年・確定）</strong> もトグルで切替可能（FY2025 は EPRX 2026年6月18日公表の通年確報）。
            前提次第で結果が大きく変わる<strong>感応度ツール</strong>としてご活用ください。
          </p>

          {/* ─── メインツール ─── */}
          <div
            style={{
              background: '#fff',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 8,
              padding: '24px 20px',
              marginBottom: 24,
            }}
          >
            <BalancingRevenueEstimator
              pricesByFy={pricesByFy}
              rangesByFy={rangesByFy}
              defaultFy="FY2024"
            />
          </div>

          {/* ─── 電源種別比較（5種完結）二極構造 ─── */}
          <section style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-navy)',
                marginBottom: 6,
              }}
            >
              蓄電池・VPP・揚水・火力・水力／5種完結
            </h2>
            <p
              style={{
                fontSize: 15,
                color: '#6b7280',
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              需給調整市場における「二極構造」——新型（蓄電池・VPP）は各年度当時の上限価格付近、従来型（火力・水力・揚水）は 1〜5 円の基準線——を5電源種別で比較します。
            </p>
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--color-border, #e5e7eb)',
                borderRadius: 8,
                padding: '24px 20px',
              }}
            >
              <BalancingSourceComparison
                pricesBySourceFy={pricesBySourceFy}
                defaultFy="FY2024"
              />
            </div>
          </section>

          {/* ─── 蓄電池コストが収益に与える影響（感度解説）Phase C-1 ─── */}
          <section style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 8 }}>
              蓄電池コストが収益に与える影響（事業性の感度）
            </h2>
            <div style={{
              background: '#fff',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 8,
              padding: '20px 20px',
            }}>
              <p style={{ fontSize: 15, lineHeight: 1.8, margin: '0 0 12px' }}>
                {/* ★Lc-2 ■4(b): 109.43 を本文に焼き込んでいた（CLAUDE.md「数値は焼き込まず動的参照」違反）。
                    カタログ参照に変え、同時に年度内の幅を併記する（■4(e) 年平均と幅を同じ視野に）。 */}
                需給調整 三次②で蓄電池が約定する単価（FY2024 年平均{' '}
                {pricesByFy.FY2024['tertiary-2'].toFixed(2)} 円/ΔkW・30分
                {tertiary2Fy2024
                  ? `、月次では ${tertiary2Fy2024.min.toFixed(2)}〜${tertiary2Fy2024.max.toFixed(2)}・約定 ${tertiary2Fy2024.awardedMonths} か月`
                  : ''}
                ）に対し、
                蓄電池の設備コストが下がるほど IRR は上振れします。系統用蓄電池のCAPEXは
                <a href="https://atb.nrel.gov/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>NREL ATB 2024版</a>で
                約 ¥83,000/kWh（米国前提・4時間構成・USD/JPY 158.34）。
                コストが ±20% 動くと事業性がどう変わるかは{' '}
                <Link href="/tools/irr-simulator" style={{ color: 'var(--color-accent)' }}>IRR シミュレーター</Link>の
                3シナリオ（楽観/実データ/保守）で試算できます。
              </p>
              <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0 }}>
                背景は解説{' '}
                <Link href="/explainer/lcoe-and-bess-economics" style={{ color: 'var(--color-accent)' }}>「LCOEと蓄電池の経済性」</Link>
                を参照。「再エネ大量導入時代に蓄電池がなぜ経済性を持つか」を、コスト（LCOS）と
                複数市場の収益から解説しています。
              </p>
            </div>
          </section>

          {/* ─── 出典・免責 ─── */}
          <section
            style={{
              padding: '14px 16px',
              background: 'var(--color-bg, #f9fafb)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 8,
              fontSize: 13,
              color: '#6b7280',
              lineHeight: 1.8,
            }}
          >
            <strong style={{ color: '#374151', fontSize: 15 }}>出典・免責</strong>
            <br />
            {/* ★Lc-2 ■3: EPRX 利用規約 §3「本サイトへのリンクは原則としてトップページ…」に従い、
                リンク先はトップ・出所（資料名）は地の文で明示する。JEPX と同じ扱い（src/lib/eic-license.ts の方針表）。 */}
            ・単価データ出典:{' '}
            <a
              href={EPRX_TOP}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent)' }}
            >
              一般社団法人 電力需給調整力取引所（EPRX）
            </a>
            「取引実績の取りまとめ結果」より転記・編集。
            <br />
            {/* ★Lc-2 ■2: 「§4 が何を定めているか」（条文の説明・正しい）と
                「当サイトが非商用か」（自己判定・未確定）を分けて書く。当サイトを非商用と名乗らない。 */}
            ・EPRX 利用規約 §4 に従い、出典と加工した旨を明記しています。§4 は商用目的での利用に EPRX との事前契約を求めており、
            当サイトの利用が該当するかは EPRX に照会中です。
            <br />
            ・ライセンス表記（EIC カタログ license_notice の逐語）:「{EPRX_SOURCE_LINE}」 ／ 規約:{' '}
            <a
              href={EPRX_LICENSE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent)' }}
            >
              EPRX 利用規約
            </a>
            <br />
            {/* ★Lc-2 ■4(d): 幅は年平均と出所が違う（カタログではなく PDF からの転記）。
                読者にも依頼者にも、どの資料の何ページから来た数値かが分かる形にする。 */}
            ・上表の「月次 …〜…」は年度内の幅で、出所は{' '}
            <a href={EPRX_TOP} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>
              EPRX
            </a>
            「取引実績の取りまとめ結果」の年次 PDF（{MONTHLY_PDF_SOURCE}）です。未約定の月は幅に含めません（「約定 N か月」がその月数）。
            月次の単純平均が上の年平均と一致することを毎ビルド検査しています（一致しない場合は幅を表示しません）。
            <br />
            ・FY2024・FY2025 とも通年の確定値です（FY2024 は EPRX 2025年3月公表、FY2025 は EPRX 2026年6月18日公表の通年確報で旧・上期暫定値から改訂）。FY2025 は水力と揚水が EPRX 側で合算公表に変わったため、電源種別比較の FY2025 は「水力・揚水（合算）」の1行で表示しています。
            <br />
            ・データ加工・提供:{' '}
            <a
              href="https://data.eic-jp.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent)' }}
            >
              data.eic-jp.org
            </a>{' '}
            （{siteConfig.organization.name}、catalog 2026-05-26（balancing 系 39））。
            <br />
            ・本ツールは断定的な収益予測ではありません。投資判断には一次資料および専門家への確認を推奨します。
            <br />
            ・落札量（volume）は EPRX が図のみ・数値非公開のため系列化せず、不足率を調達逼迫度の代理として併用。市場規模は必要時にグラフ目視の概算（注釈付き・精度限定）。
            <br />
            ・感度解説内の蓄電池CAPEX参考値は{' '}
            <a href="https://atb.nrel.gov/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>NREL Annual Technology Baseline (ATB) 2024</a>
            （米国前提・CC BY 4.0）、為替換算は{' '}
            <a href="https://data.eic-jp.org/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-accent)' }}>EIC Data</a>
            の fx-usdjpy-monthly-avg による。low/high は当サイトの感度レンジ仮定（mid±20%）であり、NREL の予測値ではありません。
            詳細は解説{' '}
            <Link href="/explainer/lcoe-and-bess-economics" style={{ color: 'var(--color-accent)' }}>「LCOEと蓄電池の経済性」</Link>
            を参照。
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
