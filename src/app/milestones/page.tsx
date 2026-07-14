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
import { siteConfig } from '@/lib/site-config';
import type { RoadmapStatus } from '@/lib/site-config';
import substationsIndex from '@/data/substations/index.json';

export const revalidate = 86400;

// トップから移設（top分析2026-07-12・削除ではなく移設の大原則）: 公開ロードマップ＋公開予定コンテンツ
const ROADMAP_BADGE: Record<RoadmapStatus, { label: string; className: string }> = {
  done: { label: '✅ 公開済', className: 'roadmap-badge roadmap-badge-done' },
  'in-progress': { label: '🚧 開発中', className: 'roadmap-badge roadmap-badge-in-progress' },
  planned: { label: '📅 計画中', className: 'roadmap-badge roadmap-badge-planned' },
};

// 変電所数はローカル JSON（本ページは静的 import のみの設計＝鉄則 #2 を維持）
const SUBSTATIONS_STR = (substationsIndex as { total: number }).total.toLocaleString('en-US');

const upcomingFeatures = [
  {
    num: '01',
    title: '業界レポート2026',
    body:
      '当サイト独自機能で蓄積したデータ (補助金/系統/事業者/案件/JEPX/海外5市場) を編集統合した年次レポートを公開予定。',
    status: 'Sprint 5',
  },
  {
    num: '02',
    title: '火災・トラブル事例DB',
    body:
      '国内外の蓄電池トラブル事例（火災・性能低下・系統影響）を公開資料に基づき体系化。業界の安全文化向上に資する情報基盤を構築。',
    status: 'Sprint 5',
  },
  {
    num: '03',
    title: '日本の蓄電所マップ全国展開',
    body:
      '中部電力PG 1,081箇所を先行公開（地図対応は現状この1社のみ）。残る9社（北海道・東北・東京・北陸・関西・中国・四国・九州・沖縄）の緯度経度補完を進めつつ、Leaflet レイヤーへ順次展開予定。',
    status: 'Sprint 5〜6',
  },
];

export const metadata: Metadata = {
  // #88: 手書き「- 蓄電所ネット」を除去（template が自動付与・本番二重を実測し修正 2026-07-15）
  title: '達成記念ページ一覧',
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

          {/* ── トップから移設: 公開予定の主要コンテンツ（本文不変） ── */}
          <section className="features" style={{ marginBottom: 48 }}>
            <div className="section-label">Coming · 順次公開</div>
            <h2 className="section-title" style={{ fontSize: 24 }}>公開予定の主要コンテンツ</h2>
            <div className="feature-grid">
              {upcomingFeatures.map((f) => (
                <div key={f.num} className="feature">
                  <div className="feature-num">
                    {f.num}
                    <span className="feature-status">{f.status}</span>
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── トップから移設: 公開ロードマップ（Sprint 1〜5・本文不変） ── */}
          <section className="roadmap" style={{ marginBottom: 48 }}>
            <div className="section-label">Roadmap</div>
            <h2 className="section-title" style={{ fontSize: 24 }}>公開ロードマップ</h2>
            <div className="roadmap-list">
              {siteConfig.roadmap.map((r, i) => {
                const badge = ROADMAP_BADGE[r.status];
                const description = r.description.replace('{substations}', SUBSTATIONS_STR);
                return (
                  <div
                    key={i}
                    className={`roadmap-item${r.isCurrent ? ' is-current' : ''}`}
                  >
                    <div className="roadmap-when">
                      {r.phase}
                      <small>{r.period}</small>
                    </div>
                    <div className="roadmap-content">
                      <h4>
                        {r.title}
                        <span className={badge.className}>{badge.label}</span>
                      </h4>
                      <p>{description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
