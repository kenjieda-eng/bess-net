// /faq 業界用語FAQ 一覧ページ（依頼AD Phase C）
// - microCMS の faq エンドポイントから全件取得
// - アコーディオン UI + カテゴリタブはクライアントコンポーネントで実装
// - JSON-LD FAQPage 出力（SEO リッチリザルト狙い）
// - schema 未作成時 / API エラー時は空配列で graceful fallback
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllFaq, getGlossaryLiteList, type Faq } from '@/lib/microcms';
import FaqClient from './FaqClient';
import { siteConfig } from '@/lib/site-config';
import { GLOSSARY_301_SOURCE_SLUGS, canonicalGlossarySlug } from '@/lib/glossary-301';
import { linkifyTerms } from '@/lib/linkify';

// 依頼BG: HTML エスケープ (FAQ answer は plain text なので HTML 化前に必要)
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const revalidate = 600; // 10分

export const metadata: Metadata = {
  // layout.tsx の titleTemplate `%s | 蓄電所ネット` が自動でサフィックスを付与するため、
  // page 側では「蓄電所ネット」を含めない（重複防止 / 落とし穴 #86）
  title: '業界用語よくある質問（FAQ）',
  description:
    '系統用蓄電池・再エネ業界に関する50件の Q&A。系統用蓄電池とは？容量市場の仕組みは？事業参入手順は？補助金は？等の頻出質問を制度・技術・事業・補助金・その他の5カテゴリで体系化。',
  alternates: { canonical: '/faq' },
  openGraph: {
    title: '業界用語よくある質問（FAQ）',
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

  // 依頼BG: FAQ answer に glossary 用語の auto-link を適用 (既存 W シリーズ NG_TERMS 継承)
  // server-side で linkify 済 HTML を生成して FaqClient に props 経由で渡す
  // (glossaryLite 1,516件を client bundle に同梱しないため)
  let glossaryLite: { term: string; slug: string; english?: string }[] = [];
  try {
    // P4 B-3: 301元エントリの term は canonical slug へ解決して auto-link（L-EIC-022・B-1 除外の昇格）
    glossaryLite = (await getGlossaryLiteList()).map((g) =>
      GLOSSARY_301_SOURCE_SLUGS.has(g.slug)
        ? { ...g, slug: canonicalGlossarySlug(g.slug) }
        : g
    );
  } catch {
    // graceful fallback (linkify なしで描画)
  }
  const itemsWithLinkify = items.map((it) => ({
    ...it,
    // escapeHtml で安全な HTML 化 → linkifyTerms で <a> 付与
    answerHtml: glossaryLite.length > 0 ? linkifyTerms(escapeHtml(it.answer), glossaryLite) : undefined,
  }));

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
            <FaqClient items={itemsWithLinkify} />
          )}

          {/* 内部リンク網状ハブ — FAQ から各コーナーへの導線（各 FAQ の relatedGlossary/relatedExplainer は FaqClient 内で /glossary/{slug} /explainer/{slug} に自動リンク化）*/}
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
              より深く理解するための関連リソース。各 FAQ 内の「関連用語」「関連解説」リンクも併せてご活用ください:
            </p>
            <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li>
                <Link href="/glossary">業界用語集（1,500+語）</Link> — 用語の詳細定義・読み・関連語
              </li>
              <li>
                <Link href="/explainer">解説記事（125本）</Link> — 市場制度・参入手順・補助金の体系解説
              </li>
              <li>
                <Link href="/policy-calendar">政策・法制度カレンダー</Link> — 制度改正・パブコメの時系列
              </li>
              <li>
                <Link href="/events">業界イベント・展示会カレンダー</Link> — 学習機会の一覧
              </li>
              <li>
                <Link href="/subsidies">補助金カレンダー</Link> — 公募・採択のトラッキング
              </li>
              <li>
                <Link href="/operators">事業者ナビ（86社）</Link> — 業界プレイヤー検索
              </li>
              <li>
                <Link href="/grid/chubu/map">中部地方 変電所マップ</Link> — 業界唯一の地図ベース系統情報DB
              </li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
