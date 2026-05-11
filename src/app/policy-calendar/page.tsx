// /policy-calendar 政策・法制度カレンダー一覧ページ（依頼AB Phase C）
// - microCMS の policy-events エンドポイントから全件取得
// - フィルタ機能はクライアントコンポーネントで実装
// - schema 未作成時 / API エラー時は空配列で graceful fallback
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllPolicyEvents, type PolicyEvent } from '@/lib/microcms';
import PolicyCalendarClient from './PolicyCalendarClient';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600; // 10分

export const metadata: Metadata = {
  title: '政策・法制度カレンダー｜蓄電所ネット',
  description:
    '系統用蓄電池業界の法改正・パブコメ募集・重要会議・補助金公募・オークション等を時系列で一覧表示。経済産業省・OCCTO・環境省・NEDO・SII の主要政策イベントを継続トラック。',
  alternates: { canonical: '/policy-calendar' },
  openGraph: {
    title: '政策・法制度カレンダー｜蓄電所ネット',
    description:
      '系統用蓄電池業界の主要政策イベントを時系列で一覧表示。法改正・パブコメ・重要会議・オークション・補助金等。',
    type: 'website',
  },
};

export default async function PolicyCalendarPage() {
  let items: PolicyEvent[] = [];
  try {
    items = await getAllPolicyEvents();
  } catch {
    // graceful fallback
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '政策・法制度カレンダー',
    description:
      '系統用蓄電池業界の主要政策イベントを時系列で一覧表示。',
    url: 'https://bess-net.jp/policy-calendar',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    numberOfItems: items.length,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 政策・法制度カレンダー
          </p>
          <div className="section-label">Policy & Regulation Calendar</div>
          <h1 className="section-title">政策・法制度カレンダー</h1>
          <p className="section-desc" style={{ marginBottom: 24 }}>
            系統用蓄電池業界の <strong>法改正・パブリックコメント・重要会議・オークション・補助金公募</strong> 等を時系列で一覧表示しています。
            事業者の制度動向把握、新規参入時の論点理解、業界カレンダー的活用にご利用ください。
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
            ※ 各イベントの公式情報は出典 URL（経済産業省・OCCTO・環境省・NEDO・SII 等）をご参照ください。
            ※ 当サイトは公開情報を整理した第三者発信であり、各機関の公式情報とは独立しています。
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
                政策・法制度カレンダーのデータは準備中です。
              </p>
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: 'var(--color-muted)',
                }}
              >
                microCMS の policy-events エンドポイント設定完了後、初期データ 26件を投入予定です。
              </p>
            </div>
          ) : (
            <PolicyCalendarClient items={items} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
