import Link from 'next/link';
import type { Metadata } from 'next';
import { getExplainerList } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

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
      <header className="site-header">
        <div className="site-header-inner">
          <Link href="/" className="brand">
            <span className="brand-mark"></span>
            蓄電所ネット
            <span className="brand-en">BESS NET / bess-net.jp</span>
          </Link>
        </div>
      </header>

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

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>© 2026 {siteConfig.name}（bess-net.jp）</div>
          <div className="site-footer-meta">
            本サイトは2026年順次公開予定です。
          </div>
        </div>
      </footer>
    </>
  );
}
