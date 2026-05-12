// /faq 業界用語FAQ 一覧ページ（依頼AD Phase C）
// - microCMS の faq エンドポイントから全件取得
// - アコーディオン UI + カテゴリタブはクライアントコンポーネントで実装
// - JSON-LD FAQPage 出力（SEO リッチリザルト狙い）
// - schema 未作成時 / API エラー時は空配列で graceful fallback
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllFaq, type Faq } from '@/lib/microcms';
import FaqClient from './FaqClient';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 600; // 10分

export const metadata: Metadata = {
  title: '業界用語よくある質問（FAQ）｜蓄電所ネット',
  description:
    '系統用蓄電池・再エネ業界に関する50件の Q&A。系統用蓄電池とは？容量市場の仕組みは？事業参入手順は？補助金は？等の頻出質問を制度・技術・事業・補助金・その他の5カテゴリで体系化。',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: '業界用語よくある質問（FAQ）｜蓄電所ネット',
    description:
      '系統用蓄電池業界のよくある質問 50件を制度・技術・事業・補助金・その他カテゴリで整理。',
    type: 'website',
  },
};

function stripHtml(text: string): string {
  return text.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export default async function FaqPage() {
  let items: Faq[] = [];
  try {
    items = await getAllFaq();
  } catch {
    // graceful fallback
  }

  // JSON-LD FAQPage (SEO リッチリザルト対応)
  const faqPageJsonLd =
    items.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: items.map((it) => ({
            '@type': 'Question',
            name: it.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: stripHtml(it.answer),
            },
          })),
        }
      : null;

  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '業界用語FAQ',
    description:
      '系統用蓄電池業界のよくある質問 50件を制度・技術・事業・補助金・その他カテゴリで整理。',
    url: 'https://bess-net.jp/faq',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      {faqPageJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqPageJsonLd) }}
        />
      )}
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 業界用語FAQ
          </p>
          <div className="section-label">FAQ — Frequently Asked Questions</div>
          <h1 className="section-title">業界用語よくある質問（FAQ）</h1>
          <p className="section-desc" style={{ marginBottom: 24 }}>
            系統用蓄電池・再エネ業界に関する <strong>50件のよくある質問</strong> を、制度・技術・事業・補助金・その他の
            5カテゴリで整理しています。新規参入者・既存事業者の双方に役立つエントリーポイントとして、関連用語集・関連解説へのリンクも含めています。
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
            ※ 各 FAQ の出典は経済産業省・OCCTO・SII 等の公式情報源を明記しています。
            ※ より詳細な解説は{' '}
            <Link href="/explainer">解説記事</Link> / 用語集（{' '}
            <Link href="/glossary">/glossary</Link> ）も併せてご参照ください。
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
                業界用語FAQ のデータは準備中です。
              </p>
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13,
                  color: 'var(--color-muted)',
                }}
              >
                microCMS の faq エンドポイント設定完了後、初期データ 50件を投入予定です。
              </p>
            </div>
          ) : (
            <FaqClient items={items} />
          )}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
