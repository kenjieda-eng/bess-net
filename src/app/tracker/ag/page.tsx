/**
 * /tracker/ag — 事業者トラッカー (依頼BF-3、Aggregator)
 *
 * 設計:
 *   - SSR で getAllOperators 1回 → ISR 1時間
 *   - updatedAt 降順
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import TrackerTimeline, { type TimelineItem } from '@/components/TrackerTimeline';
import { getAllOperators } from '@/lib/microcms';
import { isExcludedOperator } from '@/lib/operators-excluded';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '事業者トラッカー (蓄電所事業者 540+ 更新タイムライン)',
  description: '事業者ナビ (540+社) の追加・更新を時系列で表示。カテゴリ別フィルタ可能。当サイト独自の事業者トラッカー、無料公開・登録不要。',
  alternates: { canonical: '/tracker/ag' },
  openGraph: {
    title: '事業者トラッカー (蓄電所事業者 540+)',
    description: '事業者エントリの追加/更新を時系列で一覧',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default async function OperatorTrackerPage() {
  let operators: Awaited<ReturnType<typeof getAllOperators>> = [];
  // 2026-08-23: 抽出断片（301元）は件数・タイムラインから除外
  try { operators = (await getAllOperators()).filter((o) => !isExcludedOperator(o.slug)); } catch { /* graceful */ }

  const items: TimelineItem[] = operators.map((o) => ({
    id: o.id,
    title: o.name,
    href: `/operators/${o.slug}`,
    updatedAt: o.updatedAt,
    category: (o.category && o.category.length > 0) ? o.category[0] : '事業者',
    description: o.description,
    tags: o.listedMarket ? [o.listedMarket] : undefined,
  }));

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '業界トラッカー', item: 'https://bess-net.jp/tracker' },
      { '@type': 'ListItem', position: 3, name: '事業者トラッカー', item: 'https://bess-net.jp/tracker/ag' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        {/* Tier 2/3 UI 統一: max-w 1320 */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/tracker">業界トラッカー</Link> / 事業者トラッカー
          </p>
          <div className="section-label">当サイト独自 · 事業者 更新タイムライン</div>
          <h1 className="section-title">事業者トラッカー</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            事業者ナビ (蓄電所関連事業者) の追加・更新を<strong>タイムライン</strong>表示。
            全 <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{operators.length}</span> 件、更新日時降順。
          </p>
          <p className="page-meta" style={{ fontSize: 15, color: 'var(--color-muted)', marginBottom: 24 }}>
            データ更新は 1 時間ごと (ISR)。全件は <Link href="/operators">事業者ナビ</Link>、業界構造は <Link href="/map/industry-chaos">業界カオスマップ</Link> から。
          </p>

          <TrackerTimeline items={items} limit={100} />

          <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/operators">事業者ナビ (全件)</Link></li>
              <li><Link href="/map/industry-chaos">業界カオスマップ (当サイト独自)</Link></li>
              <li><Link href="/tracker">業界トラッカー (4軸)</Link></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
