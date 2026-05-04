// /operators 一覧ページ (Server Component)
// - microCMS から事業者全件取得（403件想定）
// - クライアントの OperatorBrowser でカテゴリタブ/検索/都道府県絞り/ページング

import { Suspense } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllOperators } from '@/lib/microcms';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import OperatorBrowser from './OperatorBrowser';

export const revalidate = 600;

export const metadata: Metadata = {
  title: '事業者ナビ',
  description:
    '系統用蓄電池(BESS)・低圧リソース事業に関わる主要事業者を 20カテゴリ・400社超で網羅。電池メーカー / PCS / EPC / O&M / 開発事業者 / アグリゲーター / 送配電 / 電力会社 / 商社 / 金融 / 法務 等から検索・絞り込み可能。',
  alternates: { canonical: '/operators' },
};

export default async function OperatorListPage() {
  const items = await getAllOperators();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '事業者ナビ',
    description:
      '系統用蓄電池(BESS)・低圧リソース事業に関わる主要事業者一覧',
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
            <Link href="/">トップ</Link> / 事業者ナビ
          </p>
          <div className="section-label">Operators</div>
          <h1 className="section-title">事業者ナビ</h1>
          <p className="section-description">
            系統用蓄電池(BESS)・低圧リソース事業に関わる主要事業者を 20カテゴリ・
            {items.length}社で網羅。カテゴリ・キーワード・都道府県で絞り込み可能です。
          </p>

          {items.length === 0 ? (
            <div className="empty-state">
              <p>事業者情報はまだ準備中です。</p>
            </div>
          ) : (
            <Suspense
              fallback={<div className="news-loading">読み込み中...</div>}
            >
              <OperatorBrowser items={items} />
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
