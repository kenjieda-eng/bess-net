/**
 * /tracker/grid — 系統トラッカー (依頼BF-2)
 *
 * 設計:
 *   - SSR で getAllSubstations 1回 → ISR 1時間
 *   - last_updated 降順
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import TrackerTimeline, { type TimelineItem } from '@/components/TrackerTimeline';
import { getAllSubstations } from '@/lib/microcms';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '系統トラッカー (変電所空き容量 更新タイムライン)',
  description: '変電所空き容量データの最新更新を時系列で表示。10電力会社・8,200+ 変電所をカバー。業界唯一の系統データトラッカー、無料公開・登録不要。',
  alternates: { canonical: '/tracker/grid' },
  openGraph: {
    title: '系統トラッカー (変電所空き容量 更新タイムライン)',
    description: '変電所データの追加/更新を時系列で一覧',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default async function GridTrackerPage() {
  let substations: Awaited<ReturnType<typeof getAllSubstations>> = [];
  try { substations = await getAllSubstations(); } catch { /* graceful */ }

  const items: TimelineItem[] = substations
    .filter((s) => s.last_updated || (s as { updatedAt?: string }).updatedAt)
    .map((s) => {
      const areaStr = Array.isArray(s.area) && s.area.length > 0 ? s.area[0] : '';
      const opStr = Array.isArray(s.operator) && s.operator.length > 0 ? s.operator[0] : '';
      const vcStr = Array.isArray(s.voltage_class) && s.voltage_class.length > 0 ? s.voltage_class[0] : '';
      return {
        id: s.id,
        title: s.name,
        href: `/grid/${s.slug}`,
        updatedAt: s.last_updated || (s as { updatedAt?: string }).updatedAt || '',
        category: areaStr || opStr || '系統',
        description: `${s.prefecture ?? ''} ${vcStr} / 空き容量 ${s.cap_avail_mw ?? '-'} MW`,
        tags: [
          ...(s.n1_eligible ? ['N-1可'] : []),
          ...(s.non_firm_eligible ? ['ノンファーム可'] : []),
        ],
      };
    });

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '業界トラッカー', item: 'https://bess-net.jp/tracker' },
      { '@type': 'ListItem', position: 3, name: '系統トラッカー', item: 'https://bess-net.jp/tracker/grid' },
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
            <Link href="/">トップ</Link> / <Link href="/tracker">業界トラッカー</Link> / 系統トラッカー
          </p>
          <div className="section-label">業界唯一 · 系統データ 更新タイムライン</div>
          <h1 className="section-title">系統トラッカー (変電所空き容量)</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            変電所空き容量データの最新更新を<strong>タイムライン</strong>表示。
            全 <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{substations.length}</span> 件、 last_updated 降順。
          </p>
          <p className="page-meta" style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 24 }}>
            データ更新は 1 時間ごと (ISR)。全件は <Link href="/grid">系統空き容量</Link>、地図検索は <Link href="/grid/chubu/map">中部マップ</Link> から。
          </p>

          <TrackerTimeline items={items} limit={100} />

          <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/grid">系統空き容量 (全社一覧)</Link></li>
              <li><Link href="/grid/chubu/map">中部 Leaflet 地図 (緯度経度付き)</Link></li>
              <li><Link href="/tools/grid-connection-check">系統連系診断 (業界唯一)</Link></li>
              <li><Link href="/tracker">業界トラッカー (4軸)</Link></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
