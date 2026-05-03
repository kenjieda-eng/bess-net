// /news 一覧ページ (Server Component)
// - microCMS から業界ニュース全件取得（編集部以外）
// - クライアントの NewsBrowser でフィルタ/検索/年絞り/ソート/ページング

import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getIndustryNews } from '@/lib/microcms';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NewsBrowser from './NewsBrowser';

export const revalidate = 300;

export const metadata: Metadata = {
  title: 'ニュース',
  description:
    '系統用蓄電池(BESS)・低圧リソース事業の業界ニュース。新規連系・運転開始・補助金・PF組成・制度改正・市場動向・人事・海外動向まで網羅。カテゴリ・年・キーワードで絞り込み可能。',
  alternates: { canonical: '/news' },
};

export default async function NewsListPage() {
  const items = await getIndustryNews();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '業界ニュース一覧',
    description:
      '系統用蓄電池(BESS)・低圧リソース事業の業界ニュース一覧',
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
            <Link href="/">トップ</Link> / ニュース
          </p>
          <div className="section-label">News</div>
          <h1 className="section-title">業界ニュース</h1>
          <p className="section-description">
            系統用蓄電池(BESS)・低圧リソース事業の業界ニュースを、編集部発で発信しています。
            カテゴリ・年・キーワードで絞り込み可能です。
          </p>

          {items.length === 0 ? (
            <div className="empty-state">
              <p>ニュース記事はまだ準備中です。</p>
            </div>
          ) : (
            <Suspense fallback={<div className="news-loading">読み込み中...</div>}>
              <NewsBrowser items={items} />
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
