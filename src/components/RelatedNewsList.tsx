/**
 * RelatedNewsList.tsx
 * 関連ニュースのコンパクト一覧（カード or リスト）。
 *
 * 入力：news = News[] / title? = '関連ニュース'
 */
import Link from 'next/link';
import type { News } from '@/lib/microcms';

export default function RelatedNewsList({
  news,
  title = '関連ニュース',
  emptyText,
}: {
  news: News[];
  title?: string;
  emptyText?: string;
}) {
  if (!news || news.length === 0) {
    return emptyText ? (
      <section className="related-news-section">
        <h3 className="related-h3">{title}</h3>
        <p className="related-empty">{emptyText}</p>
      </section>
    ) : null;
  }
  return (
    <section className="related-news-section">
      <h3 className="related-h3">{title}</h3>
      <ul className="related-news-list">
        {news.map((n) => {
          const dateStr = n.publishedAt
            ? new Date(n.publishedAt).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
              })
            : '';
          const cat =
            (n.category && n.category[0]) || '';
          return (
            <li key={n.id} className="related-news-item">
              <Link href={`/news/${n.slug}`}>
                <span className="related-news-meta">
                  {cat && <span className="related-news-cat">{cat}</span>}
                  <span className="related-news-date">{dateStr}</span>
                </span>
                <span className="related-news-title">{n.title}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
