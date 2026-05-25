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
 * v2 (2026-05-24): FY2024 既定 + FY2025 上期(暫定) トグル（リン回答反映）
 *  - FY2024 = date "2024-04-01"（通年・確定）を既定表示
 *  - FY2025H1 = date "2025-04-01"（上期のみ・暫定）をトグル補助
 *
 * v3 (2026-05-25): 電源種別比較（蓄電池 vs VPP vs 揚水）二極構造追加
 *  - catalog170: battery 6 + vpp 4 + pumped 6 = 16 系列
 *  - BalancingSourceComparison コンポーネント追加（収益計算機の下）
 *  - VPP 約定月数注記・L-EIC-018 注記を含む
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

// ─── catalog JSON 直読み（server only） ────────────────────────────────────────
// battery (6 系列)
import primaryBatteryData    from '@/data/eic/balancing-price-primary-battery.json';
import secondary1BatteryData from '@/data/eic/balancing-price-secondary-1-battery.json';
import secondary2BatteryData from '@/data/eic/balancing-price-secondary-2-battery.json';
import tertiary1BatteryData  from '@/data/eic/balancing-price-tertiary-1-battery.json';
import tertiary2BatteryData  from '@/data/eic/balancing-price-tertiary-2-battery.json';
import compositeBatteryData  from '@/data/eic/balancing-price-composite-battery.json';
// vpp (4 系列：二次①②は系列なし)
import primaryVppData    from '@/data/eic/balancing-price-primary-vpp.json';
import tertiary1VppData  from '@/data/eic/balancing-price-tertiary-1-vpp.json';
import tertiary2VppData  from '@/data/eic/balancing-price-tertiary-2-vpp.json';
import compositeVppData  from '@/data/eic/balancing-price-composite-vpp.json';
// pumped (6 系列)
import primaryPumpedData    from '@/data/eic/balancing-price-primary-pumped.json';
import secondary1PumpedData from '@/data/eic/balancing-price-secondary-1-pumped.json';
import secondary2PumpedData from '@/data/eic/balancing-price-secondary-2-pumped.json';
import tertiary1PumpedData  from '@/data/eic/balancing-price-tertiary-1-pumped.json';
import tertiary2PumpedData  from '@/data/eic/balancing-price-tertiary-2-pumped.json';
import compositePumpedData  from '@/data/eic/balancing-price-composite-pumped.json';

export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  title: '需給調整 収益シナリオ（蓄電池）',
  description:
    '需給調整市場 6 商品（一次〜三次②・複合）の蓄電池落札単価（EPRX 実績）に落札率・容量・コマ数を掛けた概算年間収益を試算。蓄電池・VPP・揚水の需給調整 落札単価比較（二極構造）も掲載。単価は約定時水準（L-EIC-018）。FY2024 通年確定値を既定表示。',
  alternates: { canonical: '/tools/balancing-revenue' },
  openGraph: {
    title: '需給調整 収益シナリオ（蓄電池）| 蓄電所ネット',
    description:
      'EPRX 蓄電池単価ベースの概算収益シナリオ。蓄電池・VPP・揚水の電源種別比較（二極構造）も収録。FY2024（通年・確定）を既定、FY2025 上期(暫定)もトグルで確認可能。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

// ─── catalog helpers ──────────────────────────────────────────────────────────

type CatalogData = {
  points: { date: string; value: number }[];
};

/** 指定 date の値を返す（見つからなければ null） */
function valueAtDate(data: CatalogData, isoDate: string): number | null {
  const pt = data.points?.find((p) => p.date === isoDate);
  return pt?.value ?? null;
}

/** FY2024 = 2024-04-01（通年・確定） / FY2025H1 = 2025-04-01（上期・暫定） */
const DATE_MAP: Record<FyKey, string> = {
  FY2024:   '2024-04-01',
  FY2025H1: '2025-04-01',
};

/** FY2024 / FY2025H1 の fallback 単価（catalog が読めない場合） */
const FALLBACK_BY_FY: Record<FyKey, Record<ProductKey, number>> = {
  FY2024: {
    'primary':     15.99,
    'secondary-1':  7.71,
    'secondary-2': 12.61,
    'tertiary-1':  10.60,
    'tertiary-2': 109.43,
    'composite':   15.80,
  },
  FY2025H1: {
    'primary':     11.41,
    'secondary-1': 14.13,
    'secondary-2': 14.33,
    'tertiary-1':  13.83,
    'tertiary-2':  33.52,
    'composite':   11.39,
  },
};

export default function BalancingRevenuePage() {
  const productSources: { key: ProductKey; data: CatalogData }[] = [
    { key: 'primary',     data: primaryBatteryData    as CatalogData },
    { key: 'secondary-1', data: secondary1BatteryData as CatalogData },
    { key: 'secondary-2', data: secondary2BatteryData as CatalogData },
    { key: 'tertiary-1',  data: tertiary1BatteryData  as CatalogData },
    { key: 'tertiary-2',  data: tertiary2BatteryData  as CatalogData },
    { key: 'composite',   data: compositeBatteryData  as CatalogData },
  ];

  // FY2024 と FY2025H1 の単価マップを catalog から構築（読めなければ fallback）
  const pricesByFy: Record<FyKey, Record<ProductKey, number>> = {
    FY2024:   { ...FALLBACK_BY_FY.FY2024 },
    FY2025H1: { ...FALLBACK_BY_FY.FY2025H1 },
  };

  for (const fyKey of ['FY2024', 'FY2025H1'] as FyKey[]) {
    for (const { key, data } of productSources) {
      const v = valueAtDate(data, DATE_MAP[fyKey]);
      if (v !== null) pricesByFy[fyKey][key] = v;
    }
  }

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
  const sourceSeries: Record<CompSource, SourceSeries> = {
    battery: batterySeries,
    vpp:     vppSeries,
    pumped:  pumpedSeries,
  };

  const pricesBySourceFy: PricesBySourceFy = {
    battery: { FY2024: {}, FY2025H1: {} },
    vpp:     { FY2024: {}, FY2025H1: {} },
    pumped:  { FY2024: {}, FY2025H1: {} },
  };
  for (const src of ['battery', 'vpp', 'pumped'] as CompSource[]) {
    for (const { product, data: d } of sourceSeries[src]) {
      for (const fyKey of ['FY2024', 'FY2025H1'] as CompFyKey[]) {
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

          <div className="section-label">業界唯一 · 無料・登録不要</div>
          <h1 className="section-title">需給調整 収益シナリオ（蓄電池）</h1>
          <p
            className="section-desc text-base lg:text-lg"
            style={{ marginBottom: 8, lineHeight: 1.7 }}
          >
            需給調整市場 6 商品（一次・二次①②・三次①②・複合）の
            <strong>蓄電池落札単価（EPRX 実績）</strong>に
            落札率・容量・年間コマ数を掛けた<strong>概算年間収益</strong>を試算します。
          </p>
          <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 24, lineHeight: 1.6 }}>
            単価は「蓄電池が約定したときの水準」（volume 非加重、L-EIC-018）です。
            既定は <strong>FY2024（通年・確定）</strong>。FY2025 上期(暫定) もトグルで切替可能。
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
              defaultFy="FY2024"
            />
          </div>

          {/* ─── 電源種別比較（蓄電池 vs VPP vs 揚水）二極構造 ─── */}
          <section style={{ marginBottom: 24 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: 'var(--color-navy)',
                marginBottom: 6,
              }}
            >
              電源種別 比較（蓄電池 vs VPP vs 揚水）
            </h2>
            <p
              style={{
                fontSize: 13,
                color: '#6b7280',
                marginBottom: 16,
                lineHeight: 1.6,
              }}
            >
              需給調整市場における「二極構造」——蓄電池・VPP は上限価格付近、揚水は 1〜4 円の基準線——を電源種別で比較します。
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

          {/* ─── 出典・免責 ─── */}
          <section
            style={{
              padding: '14px 16px',
              background: 'var(--color-bg, #f9fafb)',
              border: '1px solid var(--color-border, #e5e7eb)',
              borderRadius: 8,
              fontSize: 12,
              color: '#6b7280',
              lineHeight: 1.8,
            }}
          >
            <strong style={{ color: '#374151', fontSize: 13 }}>出典・免責</strong>
            <br />
            ・単価データ出典:{' '}
            <a
              href="https://www.eprx.or.jp/information/summary.php"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent)' }}
            >
              一般社団法人 電力需給調整力取引所（EPRX）「取引実績の取りまとめ結果」
            </a>
            より転記・編集（加工した旨を明記）。EPRX 利用規約 §4 に従い非商用・出典明示で利用。
            <br />
            ・FY2024 は通年確定値（EPRX 2025年3月公表）。FY2025 は上期のみ（2025/4〜9、EPRX 2025年12月公表）。FY2025 通年は 2026 年 6 月頃 EPRX 公表後に更新予定。
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
            （{siteConfig.organization.name}、catalog 2026-05-24）。
            <br />
            ・本ツールは断定的な収益予測ではありません。投資判断には一次資料および専門家への確認を推奨します。
            <br />
            ・Phase 2 で実落札量（volume-weighted 単価・実落札率）対応予定。
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
