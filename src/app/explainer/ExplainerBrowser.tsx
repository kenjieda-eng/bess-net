'use client';

// 落とし穴#92対応: useSearchParams を廃止し window.location + history.replaceState 方式に変更
// news 63f4750 と同パターン。SSR初期HTMLに記事リスト含まれるようになる。
import { useMemo, useState, useCallback, useEffect } from 'react';
import Link from 'next/link';
import type { Explainer } from '@/lib/microcms';
import {
  GROUP_ORDER,
  GROUP_COLOR,
  toGroup,
  pickCategory,
  readMinutes,
  parseTags,
  formatDate,
  countByGroup,
} from '@/lib/explainer-utils';

const PAGE_SIZE = 12;

type SortKey = 'newest' | 'oldest' | 'longest' | 'shortest';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: '新着順' },
  { key: 'oldest', label: '古い順' },
  { key: 'longest', label: '読み応え順' },
  { key: 'shortest', label: '短時間で読める順' },
];

type Props = {
  items: Explainer[];
};

export default function ExplainerBrowser({ items }: Props) {
  // SSR 時はデフォルト値で全記事を描画、hydration 後に URL params で上書き
  const [activeGroup, setActiveGroup] = useState<string>('すべて');
  const [query, setQuery] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [visible, setVisible] = useState<number>(PAGE_SIZE);
  const [mounted, setMounted] = useState(false);

  // CSR: URL パラメータ復元（window.location.search、落とし穴#92 window.location 方式）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const g = sp.get('g');
    const q = sp.get('q');
    const s = sp.get('s') as SortKey | null;
    if (g) setActiveGroup(g);
    if (q) setQuery(q);
    if (s && ['newest', 'oldest', 'longest', 'shortest'].includes(s)) setSort(s);
    setMounted(true);
  }, []);

  // URL 更新（history.replaceState — useSearchParams / router.replace 禁止 #92）
  useEffect(() => {
    if (!mounted) return;
    const params = new URLSearchParams();
    if (activeGroup !== 'すべて') params.set('g', activeGroup);
    if (query) params.set('q', query);
    if (sort !== 'newest') params.set('s', sort);
    const qs = params.toString();
    window.history.replaceState(
      null,
      '',
      qs ? `${window.location.pathname}?${qs}` : window.location.pathname
    );
  }, [activeGroup, query, sort, mounted]);

  // 全件のグループ別件数(タブ表示用、フィルタ前)
  const groupCounts = useMemo(() => countByGroup(items), [items]);
  // 表示するグループ(実在するもの＋すべて)
  const availableGroups = useMemo(() => {
    return GROUP_ORDER.filter(
      (g) => g === 'すべて' || (groupCounts[g] || 0) > 0
    );
  }, [groupCounts]);

  // フィルタ＋検索＋ソート
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = items.filter((a) => {
      if (activeGroup !== 'すべて') {
        if (toGroup(a.category) !== activeGroup) return false;
      }
      if (q) {
        const categoryText = Array.isArray(a.category)
          ? a.category.join(' ')
          : a.category || '';
        const hay = [
          a.title,
          a.lead,
          categoryText,
          a.relatedTerms || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    // ソート
    result = [...result].sort((a, b) => {
      switch (sort) {
        case 'oldest':
          return (
            new Date(a.publishedAt).getTime() -
            new Date(b.publishedAt).getTime()
          );
        case 'longest':
          return readMinutes(b.body) - readMinutes(a.body);
        case 'shortest':
          return readMinutes(a.body) - readMinutes(b.body);
        case 'newest':
        default:
          return (
            new Date(b.publishedAt).getTime() -
            new Date(a.publishedAt).getTime()
          );
      }
    });
    return result;
  }, [items, activeGroup, query, sort]);

  // フィルタ条件が変わったらページ位置をリセット
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [activeGroup, query, sort]);

  const visibleItems = filtered.slice(0, visible);
  const hasMore = visible < filtered.length;

  const onClickMore = useCallback(() => {
    setVisible((v) => v + PAGE_SIZE);
  }, []);

  return (
    <div className="explainer-browser">
      {/* ===== コントロールバー ===== */}
      <div className="explainer-controls">
        <input
          className="explainer-search"
          type="search"
          placeholder="記事を検索（タイトル・要約・関連用語）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="記事を検索"
        />
        <select
          className="explainer-sort"
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

      {/* ===== カテゴリタブ ===== */}
      <nav className="explainer-tabs" aria-label="カテゴリ">
        {availableGroups.map((g) => {
          const count =
            g === 'すべて'
              ? items.length
              : groupCounts[g] || 0;
          const isActive = g === activeGroup;
          return (
            <button
              key={g}
              type="button"
              className={`explainer-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveGroup(g)}
              aria-pressed={isActive}
            >
              <span>{g}</span>
              <span className="explainer-tab-count">{count}</span>
            </button>
          );
        })}
      </nav>

      {/* ===== 結果サマリ ===== */}
      <p className="explainer-result-summary">
        {filtered.length === 0
          ? '該当する記事がありません。検索条件を変更してください。'
          : `${filtered.length}件中 ${Math.min(visible, filtered.length)}件を表示`}
      </p>

      {/* ===== カードグリッド ===== */}
      {filtered.length > 0 && (
        <ul className="explainer-grid">
          {visibleItems.map((article) => {
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
                    <span
                      className={`explainer-card-badge ${colorCls}`}
                    >
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
      )}

      {/* ===== もっと見る ===== */}
      {hasMore && (
        <div className="explainer-more">
          <button
            type="button"
            className="explainer-more-button"
            onClick={onClickMore}
          >
            もっと見る（残り {filtered.length - visible} 件）
          </button>
        </div>
      )}
    </div>
  );
}
