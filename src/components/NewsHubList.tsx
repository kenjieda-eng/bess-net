// /news カテゴリ・年ハブの記事リスト（Server Component）
// #103方式: 先頭 N 本を記事カードで可視、残りは <details> 折りたたみ。
// 折りたたみ側も <a href> は SSR HTML に含まれるため全記事がクロール可能（SEO維持）。
// 'use client' 不使用＝hydration/JS なしの純SSR。
import Link from 'next/link';
import type { News } from '@/lib/microcms';
import { NEWS_CATEGORY_COLOR, parseTags, formatDate } from '@/lib/news-utils';

const DEFAULT_VISIBLE = 40;

type Props = { items: News[]; visibleN?: number };

export default function NewsHubList({ items, visibleN = DEFAULT_VISIBLE }: Props) {
  const head = items.slice(0, visibleN);
  const rest = items.slice(visibleN);

  return (
    <div className="news-hub-list">
      <ul className="news-grid">
        {head.map((article) => {
          const cats = article.category || [];
          const primary = cats[0] || 'その他';
          const colorCls =
            NEWS_CATEGORY_COLOR[primary] || NEWS_CATEGORY_COLOR['編集部'];
          const tags = parseTags(article.tags).slice(0, 3);
          const isOriginal = !article.sourceName;
          return (
            <li key={article.id} className="news-card">
              <Link href={`/news/${article.slug}`} className="news-card-link">
                <div className="news-card-meta-top">
                  <span className={`news-card-badge ${colorCls}`}>{primary}</span>
                  {cats.length > 1 && (
                    <span className="news-card-badge-sub">+{cats.length - 1}</span>
                  )}
                  {isOriginal && (
                    <span className="news-card-badge-original">編集部</span>
                  )}
                  <span className="news-card-date">
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
                <h2 className="news-card-title">{article.title}</h2>
                <p className="news-card-lead">{article.lead}</p>
                {tags.length > 0 && (
                  <ul className="news-card-tags">
                    {tags.map((t) => (
                      <li key={t} className="news-card-tag">
                        #{t}
                      </li>
                    ))}
                  </ul>
                )}
                {article.sourceName && (
                  <p className="news-card-source">出典: {article.sourceName}</p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {rest.length > 0 && (
        <details className="news-hub-more">
          <summary className="news-hub-more-summary">
            残り {rest.length} 件の記事を表示
          </summary>
          <ul className="news-hub-rest">
            {rest.map((article) => (
              <li key={article.id} className="news-hub-rest-item">
                <Link
                  href={`/news/${article.slug}`}
                  className="news-hub-rest-link"
                >
                  <span className="news-hub-rest-date">
                    {formatDate(article.publishedAt)}
                  </span>
                  <span className="news-hub-rest-title">{article.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
