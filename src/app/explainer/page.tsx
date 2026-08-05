// /explainer 一覧ページ (Server Component)
// - microCMS から全記事を取得
// - クライアントの ExplainerBrowser に渡してフィルタ/検索/ソート
// - SSG + revalidate でビルドコストとSEOを両立

import Link from 'next/link';
import type { Metadata } from 'next';
import { getAllExplainer } from '@/lib/microcms';
import { isLvInvestExplainer } from '@/lib/lv-invest';
import {
  EXPLAINER_HUB_GROUPS,
  countByGroupUnion,
} from '@/lib/explainer-utils';
import { EXPLAINER_TOP10_SLUGS } from '@/lib/explainer-next-step';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ExplainerCategoryNav from '@/components/ExplainerCategoryNav';
import ExplainerBrowser from './ExplainerBrowser';

export const revalidate = 300; // 5分ごとに再生成

export const metadata: Metadata = {
  title: '解説記事一覧 — 蓄電池・蓄電所事業の実務解説',
  description:
    '系統用蓄電池(BESS)・低圧リソース事業の制度・市場・技術を実務担当者向けに体系化した解説記事。容量市場、需給調整市場、JEPX、長期脱炭素オークション、補助金、参入手順、安全・法務まで網羅。カテゴリ・キーワードで素早く絞り込み可能。',
  alternates: { canonical: '/explainer' },
};

export default async function ExplainerListPage() {
  // 低圧投資家ガイド（category:低圧投資）は /lv/invest 専用routeで表示＝/explainer には混ぜない（W2）
  const articles = (await getAllExplainer()).filter((a) => !isLvInvestExplainer(a));

  // カテゴリ別SSRハブへのクロスリンク（件数>0のみ・クローラが辿れる実<a>。client filterは維持）
  const hubCounts = countByGroupUnion(articles);
  const hubGroups = EXPLAINER_HUB_GROUPS.filter(
    (g) => (hubCounts[g] || 0) > 0
  ).map((g) => ({ name: g, count: hubCounts[g] || 0 }));

  // E2: よく読まれている解説（2026年7月GA4実測TOP10・定数順。四半期ごとに explainer-next-step.ts を手動更新）
  const bySlug = new Map(articles.map((a) => [a.slug, a]));
  const topArticles = EXPLAINER_TOP10_SLUGS.map((s) => bySlug.get(s)).filter(
    (a): a is NonNullable<typeof a> => Boolean(a)
  );

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
            <>
              {/* E2 第1層: よく読まれている解説（GA4実測TOP10） */}
              {topArticles.length > 0 && (
                <section className="page-section news-shelf">
                  <h2 className="news-shelf-title">よく読まれている解説</h2>
                  <ul className="lv-invest-rows">
                    {topArticles.map((a) => (
                      <li key={a.slug}>
                        <Link href={`/explainer/${a.slug}`}>{a.title}</Link>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {/* E2 第2層: テーマから探す（実在カテゴリ6グループ・記事数つき） */}
              <section className="page-section">
                <h2 className="news-shelf-title">テーマから探す</h2>
                <ExplainerCategoryNav groups={hubGroups} />
              </section>

              {/* E2 第3層: 新着（現行の時系列ブラウザ＝全件到達性維持） */}
              <section className="page-section">
                <h2 className="news-shelf-title">新着・全記事</h2>
                <ExplainerBrowser items={articles} />
              </section>
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
