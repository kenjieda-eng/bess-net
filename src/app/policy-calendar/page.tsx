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
import { POLICY_DETAIL_SLUG_SET } from '@/lib/policy-utils';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600; // 10分

export const metadata: Metadata = {
  // layout.tsx titleTemplate が自動付与（落とし穴 #86）→「… | 蓄電所ネット」（P3 SEO基礎）
  title: '蓄電池・BESS 政策・法制度カレンダー',
  description:
    '系統用蓄電池業界の法改正・パブコメ募集・重要会議・補助金公募・オークション等を時系列で一覧表示。経済産業省・OCCTO・環境省・NEDO・SII の主要政策イベントを継続トラック。',
  alternates: { canonical: '/policy-calendar' },
  openGraph: {
    title: '蓄電池・BESS 政策・法制度カレンダー',
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
  // P3: ItemList JSON-LD（全件。詳細ページのある9件のみ url 付与）
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '蓄電池・BESS 政策・法制度カレンダー',
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.title,
      ...(POLICY_DETAIL_SLUG_SET.has(it.slug)
        ? { url: `${siteConfig.url}/policy-calendar/${it.slug}` }
        : {}),
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
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

          {/* 内部リンク網状ハブ — 制度・解説・関連コーナーへの導線 */}
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
              政策・制度の理解を深めるための関連リソース:
            </p>
            <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li>
                <Link href="/explainer/grid-scale-bess">系統用蓄電池とは — 基礎解説</Link>
              </li>
              <li>
                <Link href="/explainer/balancing-market">需給調整市場の解説</Link>
              </li>
              <li>
                <Link href="/glossary">業界用語集（1,500+語）</Link>
              </li>
              <li>
                <Link href="/subsidies">補助金カレンダー（公募・採択トラッキング）</Link>
              </li>
              <li>
                <Link href="/events">業界イベント・展示会カレンダー</Link>
              </li>
              <li>
                <Link href="/faq">業界用語よくある質問（FAQ 50件）</Link>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
