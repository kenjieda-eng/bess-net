/**
 * /tools/balancing-revenue — 需給調整 収益シナリオ（蓄電池）Phase 1
 *
 * 設計:
 *  - microCMS リクエストなし → 落とし穴 #95 #98 と無関係
 *  - 単価は catalog JSON から直読み（precompute 済み, 自動更新対応）
 *  - 外部 API アクセスなし（L-EIC-018 / CLAUDE.md 鉄則 #2 #4）
 *  - revalidate = 86400（catalog 更新に追従）
 *  - 出典: EPRX（電力需給調整力取引所）+ 加工した旨を明記
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {
  BalancingRevenueEstimator,
  type ProductKey,
} from '@/components/BalancingRevenueEstimator';
import { siteConfig } from '@/lib/site-config';

// ─── catalog JSON 直読み（server only） ────────────────────────────────────────
import primaryData      from '@/data/eic/balancing-price-primary-battery.json';
import secondary1Data   from '@/data/eic/balancing-price-secondary-1-battery.json';
import secondary2Data   from '@/data/eic/balancing-price-secondary-2-battery.json';
import tertiary1Data    from '@/data/eic/balancing-price-tertiary-1-battery.json';
import tertiary2Data    from '@/data/eic/balancing-price-tertiary-2-battery.json';
import compositeData    from '@/data/eic/balancing-price-composite-battery.json';

export const revalidate = 86400; // 24h

export const metadata: Metadata = {
  title: '需給調整 収益シナリオ（蓄電池）',
  description:
    '需給調整市場 6 商品（一次〜三次②・複合）の蓄電池落札単価（EPRX 実績）に落札率・容量・コマ数を掛けた概算年間収益を試算。単価は約定時水準（L-EIC-018）。前提次第で大きく変わる感応度ツールです。',
  alternates: { canonical: '/tools/balancing-revenue' },
  openGraph: {
    title: '需給調整 収益シナリオ（蓄電池）| 蓄電所ネット',
    description:
      'EPRX 蓄電池単価ベースの概算収益シナリオ。単価は約定時水準（L-EIC-018）。落札率・容量を動かして感応度を確認。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

// ─── 最新 FY 値を catalog points から抽出 ─────────────────────────────────────

type CatalogData = {
  points: { date: string; value: number }[];
};

function latestValue(data: CatalogData): number | null {
  if (!data.points || data.points.length === 0) return null;
  // date 降順ソートして最新値を返す
  const sorted = [...data.points].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0].value;
}

function latestDate(data: CatalogData): string | null {
  if (!data.points || data.points.length === 0) return null;
  const sorted = [...data.points].sort((a, b) => b.date.localeCompare(a.date));
  return sorted[0].date;
}

function dateToFyLabel(date: string): string {
  // "2024-04-01" → "FY2024", "2025-04-01" → "FY2025 上期(暫定)"
  const year = parseInt(date.slice(0, 4), 10);
  const month = parseInt(date.slice(5, 7), 10);
  const fy = month >= 4 ? year : year - 1;
  // observation_cutoff が上期のみなら暫定表示
  // 現時点では FY2025 は 4〜9 月のみ（meta.notes より）
  if (fy === 2025) return `FY2025 上期(暫定)`;
  return `FY${fy}`;
}

export default function BalancingRevenuePage() {
  // 最新 FY 単価を各 catalog から取得
  const sources: { key: ProductKey; data: CatalogData }[] = [
    { key: 'primary',     data: primaryData as CatalogData },
    { key: 'secondary-1', data: secondary1Data as CatalogData },
    { key: 'secondary-2', data: secondary2Data as CatalogData },
    { key: 'tertiary-1',  data: tertiary1Data as CatalogData },
    { key: 'tertiary-2',  data: tertiary2Data as CatalogData },
    { key: 'composite',   data: compositeData as CatalogData },
  ];

  // prices: 取得できない場合は undefined → コンポーネント fallback
  const prices = Object.fromEntries(
    sources
      .map(({ key, data }) => [key, latestValue(data)])
      .filter(([, v]) => v !== null)
  ) as Partial<Record<ProductKey, number>>;

  // fyLabel: primary の最新 date を代表として使用
  const repDate = latestDate(primaryData as CatalogData);
  const fyLabel = repDate ? dateToFyLabel(repDate) : 'FY2024';

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
      { '@type': 'ListItem', position: 1, name: 'トップ',   item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'ツール',   item: 'https://bess-net.jp/tools' },
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
          <h1 className="section-title">
            需給調整 収益シナリオ（蓄電池）
          </h1>
          <p
            className="section-desc text-base lg:text-lg"
            style={{ marginBottom: 8, lineHeight: 1.7 }}
          >
            需給調整市場 6 商品（一次・二次①②・三次①②・複合）の
            <strong>蓄電池落札単価（EPRX 実績、{fyLabel}）</strong>に
            落札率・容量・年間コマ数を掛けた<strong>概算年間収益</strong>を試算します。
          </p>
          <p
            style={{
              fontSize: 13,
              color: '#6b7280',
              marginBottom: 24,
              lineHeight: 1.6,
            }}
          >
            単価は「蓄電池が約定したときの水準」（volume 非加重、L-EIC-018）です。
            前提次第で結果が大きく変わる<strong>感応度ツール</strong>としてご活用ください。
            Phase 2 で実落札量（volume）対応予定。
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
              prices={Object.keys(prices).length > 0 ? (prices as Record<ProductKey, number>) : undefined}
              fyLabel={fyLabel}
            />
          </div>

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
            ・データ加工・提供:{' '}
            <a
              href="https://data.eic-jp.org"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent)' }}
            >
              data.eic-jp.org
            </a>{' '}
            （{siteConfig.organization.name}、catalog {fyLabel}）。
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
