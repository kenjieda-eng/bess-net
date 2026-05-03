// /explainer 一覧ページ (Server Component)
// - microCMS から全記事を取得
// - クライアントの ExplainerBrowser に渡してフィルタ/検索/ソート
// - SSG + revalidate でビルドコストとSEOを両立

import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllExplainer } from '@/lib/microcms';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ExplainerBrowser from './ExplainerBrowser';

export const revalidate = 300; // 5分ごとに再生成

export const metadata: Metadata = {
  title: '解説記事一覧',
  description:
    '系統用蓄電池(BESS)・低圧リソース事業の制度・市場・技術を実務担当者向けに体系化した解説記事。容量市場、需給調整市場、JEPX、長期脱炭素オークション、補助金、参入手順、安全・法務まで網羅。カテゴリ・キーワードで素早く絞り込み可能。',
  alternates: { canonical: '/explainer' },
};

export default async function ExplainerListPage() {
  const articles = await getAllExplainer();

  // 構造化データ：CollectionPage + 内包するArticleの一覧
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '解説記事一覧',
    description:
      '系統用蓄電池・低圧リソース事業の制度・市場・技術解説記事一覧',
    numberOfItems: articles.length,
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
            <Link href="/">トップ</Link> / 解説記事
          </p>
          <div className="section-label">Explainer</div>
          <h1 className="section-title">解説記事</h1>
          <p className="section-description">
            系統用蓄電池(BESS)・低圧リソース事業の制度・市場・技術を、
            業界の実務担当者向けに体系化しています。カテゴリ・キーワードで絞り込みできます。
          </p>

          {articles.length === 0 ? (
            <p>記事はまだありません。準備中です。</p>
          ) : (
            <Suspense fallback={<div className="explainer-loading">読み込み中...</div>}>
              <ExplainerBrowser items={articles} />
            </Suspense>
          )}

          <p className="back-link">
            <Link href="/">← トップへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
