/**
 * /tracker/subsidy — 補助金トラッカー (依頼BF-1)
 *
 * 設計:
 *   - Ck2g §3（2026-10-06）: データ源を precompute 済みの subsidies.json に変更（runtime microCMS 0・鉄則 #3）。
 *     旧実装は getAllSubsidies の runtime 取得で生 status をそのままタグに出しており、締切超過・公募予定・期日なしの
 *     紹介ページにも「公募中」が付いていた（L-EIC-027）。タグは一覧・詳細と同じ displaySubsidyStatus で導出する（#121）。
 *   - ISR 1時間は残す（導出の today が進むため・/subsidies の日次 ISR と同じ考え方）
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import TrackerTimeline, { type TimelineItem } from '@/components/TrackerTimeline';
import subsidiesData from '@/data/subsidies.json';
import type { PrecomputedSubsidy } from '../../../../scripts/precompute-subsidies';
import { getTodayJST, displaySubsidyStatus, subsidyDisplayName } from '@/lib/subsidies-meta';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '補助金トラッカー (蓄電池関連 補助金 更新タイムライン)',
  description: '蓄電池関連の補助金・公募情報の最新更新をタイムライン表示。当サイト独自の補助金トラッカー、無料公開・登録不要。',
  alternates: { canonical: '/tracker/subsidy' },
  openGraph: {
    title: '補助金トラッカー (蓄電池関連 更新タイムライン)',
    description: '補助金エントリの追加/更新を時系列で一覧',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default async function SubsidyTrackerPage() {
  const subsidies = subsidiesData as PrecomputedSubsidy[];
  const todayISO = getTodayJST();

  const items: TimelineItem[] = subsidies.map((s) => {
    const status = displaySubsidyStatus(s, todayISO);
    return {
      id: s.id,
      title: subsidyDisplayName(s.slug, s.name),
      href: `/subsidies/${s.slug}`,
      updatedAt: s.updatedAt || '',
      category: s.organization || '補助金',
      description: s.scheme,
      tags: status ? [status] : [],
    };
  });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '業界トラッカー', item: 'https://bess-net.jp/tracker' },
      { '@type': 'ListItem', position: 3, name: '補助金トラッカー', item: 'https://bess-net.jp/tracker/subsidy' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        {/* Tier 1 UI 統一: max-w 1320 */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/tracker">業界トラッカー</Link> / 補助金トラッカー
          </p>
          <div className="section-label">当サイト独自 · 補助金 更新タイムライン</div>
          <h1 className="section-title">補助金トラッカー</h1>
          {/* Tier 1 UI 統一 #1: text-base lg:text-lg */}
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            蓄電池関連の補助金・公募情報の最新更新を<strong>タイムライン</strong>表示。
            全 <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{subsidies.length}</span> 件、更新日時降順。
          </p>
          <p className="page-meta" style={{ fontSize: 15, color: 'var(--color-muted)', marginBottom: 24 }}>
            データ更新は 1 時間ごと (ISR)。全件一覧は <Link href="/subsidies">補助金一覧</Link> から。
          </p>

          <TrackerTimeline items={items} limit={100} />

          <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/subsidies">補助金一覧</Link></li>
              <li><Link href="/tools/subsidy-match">補助金マッチング (無料・登録不要)</Link></li>
              <li><Link href="/tracker">業界トラッカー (4軸)</Link></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
