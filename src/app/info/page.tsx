import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getSiteInfo, type News } from '@/lib/microcms';

export const revalidate = 300; // 5分ごと

export const metadata: Metadata = {
  title: 'お知らせ',
  description:
    '蓄電所ネット運営からのお知らせ・サイト更新情報・編集後記。業界ニュースは「ニュース」、市場制度や技術の解説は「解説」をご覧ください。',
};

export default async function InfoListPage() {
  let items: News[] = [];
  try {
    items = await getSiteInfo();
  } catch {
    // API未設定時は空表示
  }

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / お知らせ
          </p>
          <div className="section-label">Info</div>
          <h1 className="section-title">お知らせ</h1>
          <p className="section-desc" style={{ marginBottom: 32 }}>
            蓄電所ネット運営からのお知らせ・サイト更新情報・編集後記をお届けします。
            業界の速報は<Link href="/news">ニュース</Link>、
            市場制度や技術の解説は<Link href="/explainer">解説</Link>をご覧ください。
          </p>

          {items.length === 0 ? (
            <div className="empty-state">
              <p>お知らせはまだありません。</p>
            </div>
          ) : (
            <ul className="article-list">
              {items.map((article) => (
                <li key={article.id} className="article-item">
                  <Link href={`/info/${article.slug}`} className="article-link">
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
