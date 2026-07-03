// /explainer カテゴリハブの記事リスト（Server Component）
// #103方式: 先頭 N 本を記事カードで可視、残りは <details> 折りたたみ。
// 折りたたみ側も <a href> は SSR HTML に含まれるため全記事がクロール可能（SEO維持）。
// NewsHubList（/news ハブ・commit a20958d）の explainer 版。'use client' 不使用＝純SSR。
// 折りたたみ部は /news ハブで追加済みの汎用スタイル（news-hub-*）を再利用する。
import Link from 'next/link';
import type { Explainer } from '@/lib/microcms';
import {
  GROUP_COLOR,
  toGroup,
  pickCategory,
  readMinutes,
  parseTags,
  formatDate,
} from '@/lib/explainer-utils';

const DEFAULT_VISIBLE = 40;

type Props = { items: Explainer[]; visibleN?: number };

export default function ExplainerHubList({ items, visibleN = DEFAULT_VISIBLE }: Props) {
  const head = items.slice(0, visibleN);
  const rest = items.slice(visibleN);

  return (
    <div className="explainer-hub-list">
      <ul className="explainer-grid">
        {head.map((article) => {
          const group = toGroup(article.category);
          const colorCls = GROUP_COLOR[group] || GROUP_COLOR['その他'];
          const minutes = readMinutes(article.body);
          const tags = parseTags(article.relatedTerms).slice(0, 3);
          const badgeLabel = pickCategory(article.category) || group;
          return (
            <li key={article.id} className="explainer-card">
              <Link
                href={`/explainer/${article.slug}`}
                className="explainer-card-link"
              >
                <div className="explainer-card-meta-top">
                  <span className={`explainer-card-badge ${colorCls}`}>
                    {badgeLabel}
                  </span>
                  <span className="explainer-card-read">
                    約 {minutes} 分で読める
                  </span>
                </div>
                <h2 className="explainer-card-title">{article.title}</h2>
                <p className="explainer-card-lead">{article.lead}</p>
                {tags.length > 0 && (
                  <ul className="explainer-card-tags">
                    {tags.map((t) => (
                      <li key={t} className="explainer-card-tag">
                        #{t}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="explainer-card-date">
                  {formatDate(article.publishedAt)}
                </p>
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
                  href={`/explainer/${article.slug}`}
                  className="news-hub-rest-link"
                >
                  <span className="news-hub-rest-date">
                    {formatDate(article.publishedAt)}
                  </span>
                  <span className="news-hub-rest-title">
                    {article.title}（約{readMinutes(article.body)}分）
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}
