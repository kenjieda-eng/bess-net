// /events 業界イベント・展示会カレンダー（依頼AC Phase C）
// - microCMS の industry-events エンドポイントから全件取得
// - フィルタ機能はクライアントコンポーネントで実装
// - schema 未作成時 / API エラー時は空配列で graceful fallback
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllIndustryEvents, type IndustryEvent } from '@/lib/microcms';
import EventsCalendarClient from './EventsCalendarClient';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600; // 10分

export const metadata: Metadata = {
  title: '業界イベント・展示会カレンダー｜蓄電所ネット',
  description:
    '系統用蓄電池・再エネ業界の展示会・セミナー・学会・業界団体総会を時系列で一覧表示。スマートエネルギーWeek・PV EXPO・Energy Storage Japan・OCCTO/JEPX 説明会等の主要イベントを継続トラック。',
  alternates: { canonical: '/events' },
  openGraph: {
    title: '業界イベント・展示会カレンダー｜蓄電所ネット',
    description:
      '系統用蓄電池・再エネ業界の展示会・セミナー・学会を時系列で一覧表示。大型展示会・OCCTO/JEPX 説明会・学会シンポジウム等。',
    type: 'website',
  },
};

export default async function EventsCalendarPage() {
  let items: IndustryEvent[] = [];
  try {
    items = await getAllIndustryEvents();
  } catch {
    // graceful fallback
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '業界イベント・展示会カレンダー',
    description: '系統用蓄電池・再エネ業界の展示会・セミナー・学会を時系列で一覧。',
    url: 'https://bess-net.jp/events',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    numberOfItems: items.length,
  };

  // Build Event-level JSON-LD for upcoming events (status=予定 のみ、最大10件)
  const upcomingEvents = items
    .filter((it) => Array.isArray(it.status) && it.status.includes('予定'))
    .slice(0, 10);
  const eventListJsonLd = upcomingEvents.map((it) => ({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: it.title,
    startDate: it.eventDate,
    endDate: it.endDate || it.eventDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: it.venue && it.venue.includes('オンライン')
      ? 'https://schema.org/OnlineEventAttendanceMode'
      : 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': it.venue && it.venue.includes('オンライン') ? 'VirtualLocation' : 'Place',
      name: it.venue || it.location || '',
      ...(it.location && !it.venue?.includes('オンライン')
        ? { address: it.location }
        : {}),
    },
    organizer: { '@type': 'Organization', name: it.organizer },
    description: it.description || '',
    ...(it.officialUrl ? { url: it.officialUrl } : {}),
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {eventListJsonLd.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventListJsonLd) }}
        />
      )}
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 業界イベント・展示会カレンダー
          </p>
          <div className="section-label">Industry Events Calendar</div>
          <h1 className="section-title">業界イベント・展示会カレンダー</h1>
          <p className="section-desc" style={{ marginBottom: 24 }}>
            系統用蓄電池・再エネ業界の <strong>展示会・セミナー・学会・業界団体総会</strong> を時系列で一覧表示しています。
            事業者の情報収集・営業活動・最新動向把握の起点としてご活用ください。
          </p>
          <p
            className="page-meta"
            style={{
              marginTop: 0,
              marginBottom: 32,
              paddingTop: 0,
              borderTop: 'none',
            }}
          >
            ※ 各イベントの最新詳細・申込状況は主催者公式サイトをご参照ください。
            ※ 当サイトは公開情報を整理した第三者発信であり、各主催者の公式情報とは独立しています。
          </p>

          {items.length === 0 ? (
            <div
              className="empty-state"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
                padding: 24,
                textAlign: 'center',
              }}
            >
              <p style={{ margin: 0, fontSize: 15 }}>
                業界イベント・展示会カレンダーのデータは準備中です。
              </p>
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: 'var(--color-muted)',
                }}
              >
                microCMS の industry-events エンドポイント設定完了後、初期データ 40件を投入予定です。
              </p>
            </div>
          ) : (
            <EventsCalendarClient items={items} />
          )}

          {/* 内部リンク網状ハブ — 事業者・展示会参加準備の関連コーナー */}
          <section
            style={{
              marginTop: 48,
              padding: 20,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              関連コンテンツ
            </h2>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12 }}>
              展示会参加・営業活動・業界研究を深めるための関連リソース:
            </p>
            <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li>
                <Link href="/operators">事業者ナビ（EPC・O&M・PCS・電池メーカー等 86社）</Link>
              </li>
              <li>
                <Link href="/projects">プロジェクトデータベース（国内蓄電所事例）</Link>
              </li>
              <li>
                <Link href="/policy-calendar">政策・法制度カレンダー（パブコメ・重要会議）</Link>
              </li>
              <li>
                <Link href="/explainer">解説記事（市場制度・参入手順 125本）</Link>
              </li>
              <li>
                <Link href="/faq">業界用語よくある質問（FAQ 50件）</Link>
              </li>
              <li>
                <Link href="/links">お役立ちサイト（業界団体・公的機関 210件）</Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
