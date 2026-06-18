'use client';

// 落とし穴#92対応: useSearchParams を廃止し window.location + history.replaceState 方式に変更
// SSR 初期 HTML に記事一覧が含まれるようになる（クローラビリティ改善）
import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { News } from '@/lib/microcms';
import {
  NEWS_CATEGORY_ORDER,
  NEWS_CATEGORY_COLOR,
  parseTags,
  formatDate,
  getYear,
  newsCountByCategory,
  newsYearList,
} from '@/lib/news-utils';

const PAGE_SIZE = 12;
type SortKey = 'newest' | 'oldest';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: '新着順' },
  { key: 'oldest', label: '古い順' },
];

type Props = { items: News[] };

export default function NewsBrowser({ items }: Props) {
  // SSR 時はデフォルト値で全記事を描画、hydration 後に URL params で上書き
  const [activeCategory, setActiveCategory] = useState('すべて');
  const [activeYear, setActiveYear] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [mounted, setMounted] = useState(false);

  // CSR: URL パラメータ復元（window.location.search、落とし穴#92 window.location 方式）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get('c');
    const y = sp.get('y');
    const q = sp.get('q');
    const s = sp.get('s') as SortKey | null;
    if (c) setActiveCategory(c);
    if (y) setActiveYear(y);
    if (q) setQuery(q);
    if (s === 'oldest') setSort('oldest');
    setMounted(true);
  }, []);

  // URL 更新（history.replaceState — useSearchParams / router.replace 禁止 #92）
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams();
    if (activeCategory !== 'すべて') params.set('c', activeCategory);
    if (activeYear !== 'all') params.set('y', activeYear);
    if (query) params.set('q', query);
    if (sort !== 'newest') params.set('s', sort);
    const qs = params.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }, [activeCategory, activeYear, query, sort, mounted]);

  const catCounts = useMemo(() => newsCountByCategory(items), [items]);
  const years = useMemo(() => newsYearList(items), [items]);
  const availableCategories = useMemo(
    () => NEWS_CATEGORY_ORDER.filter((c) => c === 'すべて' || (catCounts[c] || 0) > 0),
    [catCounts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = items.filter((n) => {
      if (activeCategory !== 'すべて') {
        if (!(n.category || []).includes(activeCategory)) return false;
      }
      if (activeYear !== 'all' && getYear(n.publishedAt) !== activeYear) return false;
      if (q) {
        const hay = [
          n.title,
          n.lead,
          (n.category || []).join(' '),
          n.tags || '',
          n.sourceName || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    result = [...result].sort((a, b) => {
      const da = new Date(a.publishedAt).getTime();
      const db = new Date(b.publishedAt).getTime();
      return sort === 'oldest' ? da - db : db - da;
    });
    return result;
  }, [items, activeCategory, activeYear, query, sort]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [activeCategory, activeYear, query, sort]);

  const visibleItems = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const onClickMore = useCallback(() => setVisible((v) => v + PAGE_SIZE), []);

  return (
    <div className="news-browser">
      {/* コントロール */}
      <div className="news-controls">
        <input
          className="news-search"
          type="search"
          placeholder="記事を検索（タイトル・リード・タグ・出典）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="ニュースを検索"
        />
        <select
          className="news-year"
          value={activeYear}
          onChange={(e) => setActiveYear(e.target.value)}
          aria-label="年で絞り込み"
        >
          <option value="all">全期間</option>
          {years.map((y) => (
            <option key={y.year} value={y.year}>
              {y.year}年（{y.count}本）
            </option>
          ))}
        </select>
        <select
          className="news-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="並び順"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.key} value={o.key}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* カテゴリタブ */}
      <nav className="news-tabs" aria-label="カテゴリ">
        {availableCategories.map((c) => {
          const count = c === 'すべて' ? items.length : catCounts[c] || 0;
          const isActive = c === activeCategory;
          return (
            <button
              key={c}
              type="button"
              className={`news-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(c)}
              aria-pressed={isActive}
            >
              <span>{c}</span>
              <span className="news-tab-count">{count}</span>
            </button>
          );
        })}
      </nav>

      {/* 結果サマリ */}
      <p className="news-result-summary">
        {filtered.length === 0
          ? '該当するニュースがありません。条件を変更してください。'
          : `${filtered.length}件中 ${Math.min(visible, filtered.length)}件を表示`}
      </p>

      {/* グリッド */}
      {filtered.length > 0 && (
        <ul className="news-grid">
          {visibleItems.map((article) => {
            const cats = article.category || [];
            const primary = cats[0] || 'その他';
            const colorCls = NEWS_CATEGORY_COLOR[primary] || NEWS_CATEGORY_COLOR['編集部'];
            const tags = parseTags(article.tags).slice(0, 3);
            // 出典なし = 編集部オリジナル記事（深掘り）
            const isOriginal = !article.sourceName;
            return (
              <li key={article.id} className="news-card">
                <Link href={`/news/${article.slug}`} className="news-card-link">
                  <div className="news-card-meta-top">
                    <span className={`news-card-badge ${colorCls}`}>
                      {primary}
                    </span>
                    {cats.length > 1 && (
                      <span className="news-card-badge-sub">+{cats.length - 1}</span>
                    )}
                    {isOriginal && (
                      <span className="news-card-badge-original">編集部</span>
                    )}
                    <span className="news-card-date">{formatDate(article.publishedAt)}</span>
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
      )}

      {hasMore && (
        <div className="news-more">
          <button type="button" className="news-more-button" onClick={onClickMore}>
            もっと見る（残り {filtered.length - visible} 件）
          </button>
        </div>
      )}
    </div>
  );
}
