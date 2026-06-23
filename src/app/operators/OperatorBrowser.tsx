'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Operator } from '@/lib/microcms';
import {
  OPERATOR_CATEGORY_ORDER,
  OPERATOR_CATEGORY_COLOR,
  operatorCountByCategory,
  operatorPrefList,
} from '@/lib/operators-utils';

const PAGE_SIZE = 24;
type SortKey = 'name' | 'founded' | 'foundedAsc';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'name', label: '名称順' },
  { key: 'founded', label: '設立年（新→旧）' },
  { key: 'foundedAsc', label: '設立年（旧→新）' },
];

type Props = { items: Operator[] };

export default function OperatorBrowser({ items }: Props) {
  // 落とし穴 #92 回避: useSearchParams は使わない（Suspense fallback で初期 SSR が
  // 描画されず SEO 致命傷）。URL 状態は window.location + history.replaceState で扱う
  // （CLAUDE.md §3-1 の OK パターン）。初期 state はデフォルト = SSR は全件描画 → SEO 維持。
  const [activeCategory, setActiveCategory] = useState('すべて');
  const [activePref, setActivePref] = useState('all');
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('name');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [hydrated, setHydrated] = useState(false);

  // マウント後に URL クエリから状態を復元（client-only。SSR では実行されず default のまま）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const c = sp.get('c');
    const p = sp.get('p');
    const q = sp.get('q');
    const s = sp.get('s') as SortKey | null;
    if (c) setActiveCategory(c);
    if (p) setActivePref(p);
    if (q) setQuery(q);
    if (s) setSort(s);
    setHydrated(true);
  }, []);

  // 状態変化を URL に反映（復元完了後のみ。replaceState で履歴を汚さない）
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (activeCategory !== 'すべて') params.set('c', activeCategory);
    if (activePref !== 'all') params.set('p', activePref);
    if (query) params.set('q', query);
    if (sort !== 'name') params.set('s', sort);
    const qs = params.toString();
    const url = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    window.history.replaceState(null, '', url);
  }, [activeCategory, activePref, query, sort, hydrated]);

  const catCounts = useMemo(() => operatorCountByCategory(items), [items]);
  const prefs = useMemo(() => operatorPrefList(items), [items]);
  const availableCategories = useMemo(
    () =>
      OPERATOR_CATEGORY_ORDER.filter(
        (c) => c === 'すべて' || (catCounts[c] || 0) > 0
      ),
    [catCounts]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = items.filter((o) => {
      if (activeCategory !== 'すべて') {
        if (!(o.category || []).includes(activeCategory)) return false;
      }
      if (activePref !== 'all' && o.prefecture !== activePref) return false;
      if (q) {
        const hay = [
          o.name,
          o.nameEn || '',
          (o.category || []).join(' '),
          o.description || '',
          o.bessRelation || '',
          o.products || '',
          o.prefecture || '',
          o.city || '',
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    result = [...result].sort((a, b) => {
      if (sort === 'name') {
        return a.name.localeCompare(b.name, 'ja');
      }
      const ya = a.foundedYear || 0;
      const yb = b.foundedYear || 0;
      return sort === 'foundedAsc' ? ya - yb : yb - ya;
    });
    return result;
  }, [items, activeCategory, activePref, query, sort]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [activeCategory, activePref, query, sort]);

  // SEO: 全 operator を SSR の DOM に出す（初期HTMLに全社リンクが載る）。
  // 表示は visible 件までで、超過分は hidden 属性で隠す（「もっと見る」で開示）。
  const hasMore = visible < filtered.length;

  const onClickMore = useCallback(
    () => setVisible((v) => v + PAGE_SIZE),
    []
  );

  return (
    <div className="op-browser">
      {/* コントロール */}
      <div className="op-controls">
        <input
          className="op-search"
          type="search"
          placeholder="事業者を検索（名称・英名・取扱製品・所在地）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="事業者を検索"
        />
        <select
          className="op-pref"
          value={activePref}
          onChange={(e) => setActivePref(e.target.value)}
          aria-label="都道府県で絞り込み"
        >
          <option value="all">全国</option>
          {prefs.map((p) => (
            <option key={p.pref} value={p.pref}>
              {p.pref}（{p.count}社）
            </option>
          ))}
        </select>
        <select
          className="op-sort"
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
      <nav className="op-tabs" aria-label="カテゴリ">
        {availableCategories.map((c) => {
          const count = c === 'すべて' ? items.length : catCounts[c] || 0;
          const isActive = c === activeCategory;
          return (
            <button
              key={c}
              type="button"
              className={`op-tab ${isActive ? 'is-active' : ''}`}
              onClick={() => setActiveCategory(c)}
              aria-pressed={isActive}
            >
              <span>{c}</span>
              <span className="op-tab-count">{count}</span>
            </button>
          );
        })}
      </nav>

      {/* 結果サマリ */}
      <p className="op-result-summary">
        {filtered.length === 0
          ? '該当する事業者がありません。条件を変更してください。'
          : `${filtered.length}件中 ${Math.min(visible, filtered.length)}件を表示`}
      </p>

      {/* グリッド */}
      {filtered.length > 0 && (
        <ul className="op-grid">
          {filtered.map((operator, idx) => {
            const cats = operator.category || [];
            const primary = cats[0] || 'その他';
            const colorCls =
              OPERATOR_CATEGORY_COLOR[primary] || 'bg-gray-100 text-gray-700';
            return (
              <li key={operator.id} className="op-card" hidden={idx >= visible}>
                <Link
                  href={`/operators/${operator.slug}`}
                  className="op-card-link"
                >
                  <div className="op-card-meta-top">
                    <span className={`op-card-badge ${colorCls}`}>
                      {primary}
                    </span>
                    {cats.length > 1 && (
                      <span className="op-card-badge-sub">
                        +{cats.length - 1}
                      </span>
                    )}
                  </div>
                  <h2 className="op-card-title">{operator.name}</h2>
                  {operator.nameEn && (
                    <p className="op-card-en">{operator.nameEn}</p>
                  )}
                  <p className="op-card-desc">{operator.description}</p>
                  <div className="op-card-meta-bottom">
                    {operator.prefecture && (
                      <span className="op-card-pref">
                        📍 {operator.prefecture}
                        {operator.city ? ` ${operator.city}` : ''}
                      </span>
                    )}
                    {operator.foundedYear && (
                      <span className="op-card-founded">
                        {operator.foundedYear}年
                      </span>
                    )}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <div className="op-more">
          <button
            type="button"
            className="op-more-button"
            onClick={onClickMore}
          >
            もっと見る（残り {filtered.length - visible} 件）
          </button>
        </div>
      )}
    </div>
  );
}
