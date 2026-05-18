/**
 * /milestones — 達成記念ページ一覧
 *
 * 設計:
 *   - Server Component、静的 import のみ (鉄則 #2 SSR 外部 API 0)
 *   - L-029: 先回り起草対応、追加 milestone は src/data/milestones.ts に追記
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAchievedMilestones, getUpcomingMilestones } from '@/data/milestones';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '達成記念ページ一覧 - 蓄電所ネット',
  description:
    '蓄電所ネット (bess-net) の達成記念ページ一覧。機能完全形達成、業界レポート公開、業界唯一性達成等の主要マイルストーン。一般社団法人エネルギー情報センターが業界中立で運営。',
  alternates: { canonical: '/milestones' },
};

function formatDateJa(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  return `${year}年${month}月${day}日`;
}

export default function MilestonesIndexPage() {
  const achieved = getAchievedMilestones();
  const upcoming = getUpcomingMilestones();

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '達成記念', item: 'https://bess-net.jp/milestones' },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        {/* L-JEPX-UI-002: max-w 1320 inline 上書き */}
        <div className="section-inner" style={{ maxWidth: 1024 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 達成記念
          </p>
          <h1 className="section-title">達成記念ページ一覧</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 32, lineHeight: 1.7 }}>
            蓄電所ネット (bess-net) の主要マイルストーンの達成記念ページを一覧表示します。業界唯一性達成過程、業界レポート公開、データベース連携等の節目を継続的に蓄積していきます。
          </p>

          {achieved.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#0f172a' }}>
                達成済 (<span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{achieved.length}</span> 件)
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {achieved.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/milestones/${m.slug}`}
                      style={{
                        display: 'block',
                        padding: 20,
                        background: '#f8fafc',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#1d4ed8', fontVariantNumeric: 'tabular-nums' }} className="tabular-nums">
                        {formatDateJa(m.date)}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4, lineHeight: 1.5 }}>
                        {m.heroTitle}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {upcoming.length > 0 && (
            <section style={{ marginBottom: 48 }}>
              <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 16, color: '#0f172a' }}>
                今後の達成予定 (<span className="tabular-nums" style={{ fontVariantNumeric: 'tabular-nums' }}>{upcoming.length}</span> 件)
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.map((m) => (
                  <li key={m.slug}>
                    <Link
                      href={`/milestones/${m.slug}`}
                      style={{
                        display: 'block',
                        padding: 20,
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 8,
                        textDecoration: 'none',
                        color: 'inherit',
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#d97706', fontVariantNumeric: 'tabular-nums' }} className="tabular-nums">
                        {formatDateJa(m.date)}
                        {m.status === 'upcoming' && ' (公開待ち)'}
                        {m.status === 'planned' && ' (予定)'}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginTop: 4, lineHeight: 1.5 }}>
                        {m.heroTitle}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
