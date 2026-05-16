/**
 * /tracker/pf — プロジェクトトラッカー (依頼BF-4、Project Finance/案件)
 *
 * 設計:
 *   - SSR で getAllProjects 1回 → ISR 1時間
 *   - updatedAt 降順
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import TrackerTimeline, { type TimelineItem } from '@/components/TrackerTimeline';
import { getAllProjects } from '@/lib/microcms';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'プロジェクトトラッカー (蓄電所案件 更新タイムライン)',
  description: '国内蓄電所プロジェクトDBの追加・更新を時系列で表示。発電容量・蓄電容量・運転開始予定等で絞り込み可。業界唯一の案件トラッカー、無料公開・登録不要。',
  alternates: { canonical: '/tracker/pf' },
  openGraph: {
    title: 'プロジェクトトラッカー (蓄電所案件)',
    description: 'プロジェクト DB の追加/更新を時系列で一覧',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default async function ProjectTrackerPage() {
  let projects: Awaited<ReturnType<typeof getAllProjects>> = [];
  try { projects = await getAllProjects(); } catch { /* graceful */ }

  const items: TimelineItem[] = projects.map((p) => ({
    id: p.id,
    title: p.name,
    href: `/projects/${p.slug}`,
    updatedAt: p.updatedAt,
    category: (p.status && p.status.length > 0) ? p.status[0] : 'プロジェクト',
    description: [
      p.prefecture,
      p.outputMw ? `出力 ${p.outputMw} MW` : '',
      p.capacityMwh ? `容量 ${p.capacityMwh} MWh` : '',
      p.cod ? `COD ${p.cod}` : '',
      p.operator ? `事業者 ${p.operator}` : '',
    ].filter(Boolean).join(' / '),
    tags: p.marketParticipation,
  }));

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '業界トラッカー', item: 'https://bess-net.jp/tracker' },
      { '@type': 'ListItem', position: 3, name: 'プロジェクトトラッカー', item: 'https://bess-net.jp/tracker/pf' },
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
            <Link href="/">トップ</Link> / <Link href="/tracker">業界トラッカー</Link> / プロジェクトトラッカー
          </p>
          <div className="section-label">業界唯一 · 案件 更新タイムライン</div>
          <h1 className="section-title">プロジェクトトラッカー</h1>
          {/* Tier 1 UI 統一 #1: text-base lg:text-lg */}
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            国内蓄電所プロジェクトDBの追加・更新を<strong>タイムライン</strong>表示。
            全 <span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{projects.length}</span> 件、更新日時降順。
          </p>
          <p className="page-meta" style={{ fontSize: 14, color: 'var(--color-muted)', marginBottom: 24 }}>
            データ更新は 1 時間ごと (ISR)。全件は <Link href="/projects">プロジェクトDB</Link>、IRR シムは <Link href="/tools/irr-simulator">IRRシミュレーター</Link> から。
          </p>

          <TrackerTimeline items={items} limit={100} />

          <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/projects">プロジェクトDB (全件)</Link></li>
              <li><Link href="/tools/irr-simulator">蓄電池 IRR シミュレーター (業界唯一)</Link></li>
              <li><Link href="/tools/capacity-market-bid">容量市場応札試算 (モック)</Link></li>
              <li><Link href="/tracker">業界トラッカー (4軸)</Link></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
