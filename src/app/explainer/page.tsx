import Link from 'next/link';
import type { Metadata } from 'next';
import { getExplainerList } from '@/lib/microcms';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const revalidate = 60; // 60秒ごとに再生成

export const metadata: Metadata = {
  title: '解説記事',
  description:
    '系統用蓄電池・低圧リソース事業の制度・市場・技術を、業界の実務担当者向けに解説する記事一覧。容量市場、需給調整市場、JEPX、補助金、参入手順など。',
};

export default async function ExplainerListPage() {
  const data = await getExplainerList({ limit: 100 });

  return (
    <>
      <SiteHeader />

      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 解説記事
          </p>
          <div className="section-label">Explainer</div>
          <h1 className="section-title">解説記事</h1>

          {data.contents.length === 0 ? (
            <p>記事はまだありません。準備中です。</p>
          ) : (
            <ul className="article-list">
              {data.contents.map((article) => (
                <li key={article.id} className="article-item">
                  <Link
                    href={`/explainer/${article.slug}`}
                    className="article-link"
                  >
                    <span className="article-category">{article.category}</span>
                    <h2 className="article-title">{article.title}</h2>
                    <p className="article-lead">{article.lead}</p>
                    <span className="article-date">
                      {new Date(article.publishedAt).toLocaleDateString('ja-JP')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
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
