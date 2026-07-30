// /news 一覧ページ (Server Component)
// - microCMS から業界ニュース全件取得（編集部以外）
// - クライアントの NewsBrowser でフィルタ/検索/年絞り/ソート/ページング

import Link from 'next/link';
import type { Metadata } from 'next';
import { getIndustryNews } from '@/lib/microcms';
import {
  NEWS_HUB_CATEGORIES,
  newsCountByCategory,
  newsYearList,
} from '@/lib/news-utils';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NewsArchiveNav from '@/components/NewsArchiveNav';
import NewsBrowser from './NewsBrowser';

export const revalidate = 300;

export const metadata: Metadata = {
  title: '蓄電池業界ニュース',
  description:
    '系統用蓄電池(BESS)・低圧リソース事業の業界ニュース。新規連系・運転開始・補助金・PF組成・制度改正・市場動向・人事・海外動向まで網羅。カテゴリ・年・キーワードで絞り込み可能。',
  alternates: { canonical: '/news' },
};

export default async function NewsListPage() {
  const items = await getIndustryNews();

  // N3: 既取得 items から導出（追加fetch/新規クライアント配布なし＝負荷中立）
  const byNewest = (a: { publishedAt: string }, b: { publishedAt: string }) =>
    new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  // 編集部の深掘り = slug が news-（news-weekly- を除く）。最新5本。
  const editorialPicks = items
    .filter((n) => n.slug.startsWith('news-') && !n.slug.startsWith('news-weekly-'))
    .sort(byNewest)
    .slice(0, 5);
  // 今週のまとめ = slug が news-weekly-。最新1本・無ければ枠ごと非表示（8/1〜運用予定）。
  const weeklyRoundup = items
    .filter((n) => n.slug.startsWith('news-weekly-'))
    .sort(byNewest)[0];

  // カテゴリ別・年別 SSRハブへのクロスリンク導線（件数>0 のみ）
  const catCounts = newsCountByCategory(items);
  const archiveCategories = NEWS_HUB_CATEGORIES.filter(
    (c) => (catCounts[c] || 0) > 0
  ).map((c) => ({ name: c, count: catCounts[c] || 0 }));
  const archiveYears = newsYearList(items);

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
            <>
              {/* N3: 今週のまとめ（予約枠・記事未存在なら非表示・日付は焼かない） */}
              {weeklyRoundup && (
                <section className="page-section news-shelf">
                  <h2 className="news-shelf-title">今週のまとめ</h2>
                  <ul className="lv-invest-rows">
                    <li>
                      <Link href={`/news/${weeklyRoundup.slug}`}>{weeklyRoundup.title}</Link>
                    </li>
                  </ul>
                </section>
              )}

              {/* N3: 編集部の深掘り 固定枠（news- 最新5本・pr-除外） */}
              {editorialPicks.length > 0 && (
                <section className="page-section news-shelf">
                  <h2 className="news-shelf-title">編集部の深掘り</h2>
                  <ul className="lv-invest-rows">
                    {editorialPicks.map((n) => (
                      <li key={n.id}>
                        <Link href={`/news/${n.slug}`}>{n.title}</Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              <NewsArchiveNav
                categories={archiveCategories}
                years={archiveYears}
              />
              <NewsBrowser items={items} />
            </>
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
