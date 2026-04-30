import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllNews, type News } from '@/lib/microcms';

export const revalidate = 300; // 5分ごと

export const metadata: Metadata = {
  title: 'ニュース',
  description:
    '系統用蓄電池および低圧リソース事業の業界ニュース。新規連系・補助金採択・制度改正・市場動向・人事・投資情報を継続的に発信します。',
};

export default async function NewsListPage() {
  let items: News[] = [];
  try {
    items = await getAllNews();
  } catch {
    // API未設定時は空表示
  }

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / ニュース
          </p>
          <div className="section-label">News</div>
          <h1 className="section-title">ニュース</h1>
          <p className="section-desc" style={{ marginBottom: 32 }}>
            業界の新規連系・補助金採択・制度改正・市場動向を、編集部発で発信しています。
          </p>

          {items.length === 0 ? (
            <div className="empty-state">
              <p>ニュース記事はまだ準備中です。</p>
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--color-muted)' }}>
                Sprint 1終了までに、編集部発信記事3〜5本＋週1〜3本ペースの取材記事の公開を予定しています。
              </p>
            </div>
          ) : (
            <ul className="article-list">
              {items.map((article) => (
                <li key={article.id} className="article-item">
                  <Link href={`/news/${article.slug}`} className="article-link">
                    {article.category && article.category[0] && (
                      <span className="article-category">{article.category[0]}</span>
                    )}
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
