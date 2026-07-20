'use client';

// /glossary 階層フィルタ UI (依頼AH Phase C)
// - category タブ (12項目 + すべて) と subcategory セレクタの連動
// - URL パラメータ (cat / sub / q) で状態保持、ブックマーク可
// - リセットボタン + 選択中フィルタチップ
// - a11y: ARIA tablist/tab、キーボード、:focus-visible
// - モバイル: 横スクロール / アコーディオン
// - "_一般" subcategory は「未分類（一般）」と表示

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import type { Glossary } from '@/lib/microcms';

// useSearchParams を使わない理由: SSR 時に Suspense fallback が描画され
// SEO 上 1,516 用語が初期 HTML に含まれなくなるため。
// 代わりに mount 時の window.location.search から URL params を CSR で復元する。

// 既存 schema 12項目の正準順序 (依頼AB 設定)
const CATEGORY_ORDER = [
  '基礎',
  '市場制度',
  '技術',
  '系統連系',
  '事業',
  'EPC',
  'O&M',
  '補助金',
  '法務',
  '安全',
  '低圧',
  'その他',
] as const;

const CATEGORY_COLORS: Record<string, string> = {
  基礎: '#666666',
  市場制度: '#0066cc',
  技術: '#006666',
  系統連系: '#cc6600',
  事業: '#cc0066',
  EPC: '#6600cc',
  'O&M': '#00cc66',
  補助金: '#cc00cc',
  法務: '#993333',
  安全: '#cc3300',
  低圧: '#339933',
  その他: '#888888',
};

type Props = {
  items: Glossary[];
};

function firstOf(arr: string[] | string | undefined): string {
  if (Array.isArray(arr)) return arr[0] ?? '';
  return arr ?? '';
}

/**
 * subcategory ラベル表示 (UI 表示用)
 * - `XXX_一般` → 「未分類（一般）」
 * - その他 → そのまま
 */
function subcategoryLabel(sub: string): string {
  if (!sub) return '';
  if (sub.endsWith('_一般')) return '未分類（一般）';
  return sub;
}

export default function GlossaryBrowser({ items }: Props) {
  // SSR 時はデフォルト「すべて」で全件描画 (SEO 上重要)
  const [category, setCategory] = useState<string>('すべて');
  const [subcategory, setSubcategory] = useState<string>('すべて');
  const [query, setQuery] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);

  // mount 時に URL params から初期値を復元 (CSR のみ)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const cat = sp.get('cat');
    const sub = sp.get('sub');
    const q = sp.get('q');
    if (cat) setCategory(cat);
    if (sub) setSubcategory(sub);
    if (q) setQuery(q);
    setHydrated(true);
  }, []);

  // state → URL replace (history 汚染なし、hydration 完了後のみ)
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (category && category !== 'すべて') params.set('cat', category);
    if (subcategory && subcategory !== 'すべて') params.set('sub', subcategory);
    if (query.trim()) params.set('q', query.trim());
    const qs = params.toString();
    const newUrl = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [category, subcategory, query, hydrated]);

  // ① category 件数 (12項目 + すべて)
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { すべて: items.length };
    for (const it of items) {
      const cats = Array.isArray(it.category) ? it.category : [];
      // 1 用語が複数 category に属する場合は各 category にカウント
      for (const c of cats) {
        counts[c] = (counts[c] || 0) + 1;
      }
    }
    return counts;
  }, [items]);

  // ② category 別 subcategory 件数 (連動セレクタ用)
  const subcategoryCountsByCategory = useMemo(() => {
    // key: category 名 → Map<subcategory, count>
    const map: Record<string, Map<string, number>> = {};
    for (const c of CATEGORY_ORDER) map[c] = new Map();
    map['すべて'] = new Map();
    for (const it of items) {
      const sub = it.subcategory || '';
      if (!sub) continue;
      // 「すべて」用
      map['すべて'].set(sub, (map['すべて'].get(sub) || 0) + 1);
      const cats = Array.isArray(it.category) ? it.category : [];
      for (const c of cats) {
        if (!map[c]) map[c] = new Map();
        map[c].set(sub, (map[c].get(sub) || 0) + 1);
      }
    }
    return map;
  }, [items]);

  // ③ 現在 category 配下の subcategory 一覧
  // Sprint 2.5 改善 2: 明確な subcategory 上位、「_一般」系は末尾に集約
  // → UX 上、ユーザーが具体的な subcategory を発見しやすい
  const subcategoriesForCurrentCategory = useMemo(() => {
    const m = subcategoryCountsByCategory[category] || new Map();
    return Array.from(m.entries()).sort((a, b) => {
      // 「_一般」系は末尾へ
      const aGeneric = a[0].endsWith('_一般');
      const bGeneric = b[0].endsWith('_一般');
      if (aGeneric !== bGeneric) return aGeneric ? 1 : -1;
      // 同じグループ内では件数降順
      return b[1] - a[1];
    });
  }, [category, subcategoryCountsByCategory]);

  // ④ フィルタ後のアイテム
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      // category フィルタ
      if (category !== 'すべて') {
        const cats = Array.isArray(it.category) ? it.category : [];
        if (!cats.includes(category)) return false;
      }
      // subcategory フィルタ
      if (subcategory !== 'すべて') {
        if (it.subcategory !== subcategory) return false;
      }
      // 検索 (term / english / reading / shortDef AND)
      if (q) {
        const hay = [it.term, it.reading, it.english, it.shortDef]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, category, subcategory, query]);

  // ⑤ category 切替時、subcategory をリセット (subcategory が現 category 配下にあるなら維持)
  const handleCategoryChange = useCallback(
    (newCat: string) => {
      setCategory(newCat);
      // 新 category 配下に subcategory が無ければリセット
      if (subcategory !== 'すべて') {
        const subs = subcategoryCountsByCategory[newCat] || new Map();
        if (!subs.has(subcategory)) {
          setSubcategory('すべて');
        }
      }
    },
    [subcategory, subcategoryCountsByCategory]
  );

  const handleReset = useCallback(() => {
    setCategory('すべて');
    setSubcategory('すべて');
    setQuery('');
  }, []);

  const hasFilters =
    category !== 'すべて' || subcategory !== 'すべて' || query.trim() !== '';

  // a11y: tab キーボード操作
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const allCategories = useMemo(() => ['すべて', ...CATEGORY_ORDER], []);
  const onTabKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const dir = e.key === 'ArrowRight' ? 1 : -1;
      const next = (idx + dir + allCategories.length) % allCategories.length;
      tabRefs.current[next]?.focus();
    }
  };

  return (
    <div>
      {/* 検索 + 統計 + リセット */}
      <div className="glossary-search-bar" style={{ position: 'relative' }}>
        <input
          type="search"
          placeholder="用語名・読み・英語・定義で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="glossary-search-input"
          aria-label="用語検索"
        />
        <div className="glossary-search-stats">
          {filtered.length === items.length
            ? `${items.length}語`
            : `${filtered.length} / ${items.length}語`}
        </div>
        {hasFilters && (
          <button
            type="button"
            onClick={handleReset}
            aria-label="フィルタをリセット"
            style={{
              marginLeft: 12,
              padding: '6px 14px',
              fontSize: 15,
              fontWeight: 600,
              background: 'transparent',
              color: 'var(--color-muted)',
              border: '1px solid var(--color-line)',
              borderRadius: 6,
              cursor: 'pointer',
            }}
          >
            ✕ リセット
          </button>
        )}
      </div>

      {/* category タブ (13個、横スクロール可) */}
      <div
        role="tablist"
        aria-label="大カテゴリで絞り込み"
        style={{
          display: 'flex',
          gap: 6,
          flexWrap: 'wrap',
          marginBottom: 12,
          paddingBottom: 4,
          overflowX: 'auto',
          borderBottom: '2px solid var(--color-line)',
        }}
      >
        {allCategories.map((c, idx) => {
          const isActive = category === c;
          const count = categoryCounts[c] || 0;
          const color = CATEGORY_COLORS[c] || '#0066cc';
          return (
            <button
              key={c}
              ref={(el) => {
                tabRefs.current[idx] = el;
              }}
              type="button"
              role="tab"
              aria-selected={isActive}
              tabIndex={isActive ? 0 : -1}
              onClick={() => handleCategoryChange(c)}
              onKeyDown={(e) => onTabKeyDown(e, idx)}
              style={{
                padding: '8px 14px',
                fontSize: 15,
                fontWeight: 600,
                background: isActive ? color : '#fff',
                color: isActive ? '#fff' : 'var(--color-text, #222)',
                border: `1px solid ${isActive ? color : 'var(--color-line)'}`,
                borderRadius: 6,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                minHeight: 36,
              }}
            >
              {c}（{count}）
            </button>
          );
        })}
      </div>

      {/* subcategory セレクタ (category 連動、すべて選択中も表示するが項目数多い) */}
      {subcategoriesForCurrentCategory.length > 0 && (
        <div
          role="tablist"
          aria-label="サブカテゴリで絞り込み"
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            marginBottom: 16,
            paddingBottom: 12,
            borderBottom: '1px dashed var(--color-line)',
          }}
        >
          <button
            type="button"
            role="tab"
            aria-selected={subcategory === 'すべて'}
            onClick={() => setSubcategory('すべて')}
            style={{
              padding: '4px 12px',
              fontSize: 15,
              fontWeight: 600,
              background: subcategory === 'すべて' ? '#333' : '#fff',
              color: subcategory === 'すべて' ? '#fff' : 'var(--color-muted)',
              border: '1px solid var(--color-line)',
              borderRadius: 999,
              cursor: 'pointer',
              minHeight: 28,
            }}
          >
            すべて
          </button>
          {subcategoriesForCurrentCategory.map(([sub, cnt]) => {
            const isActive = subcategory === sub;
            return (
              <button
                key={sub}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setSubcategory(sub)}
                style={{
                  padding: '4px 12px',
                  fontSize: 15,
                  fontWeight: 500,
                  background: isActive ? 'var(--color-accent, #0066cc)' : '#fff',
                  color: isActive ? '#fff' : 'var(--color-muted)',
                  border: '1px solid var(--color-line)',
                  borderRadius: 999,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  minHeight: 28,
                }}
              >
                {subcategoryLabel(sub)}（{cnt}）
              </button>
            );
          })}
        </div>
      )}

      {/* 選択中フィルタチップ */}
      {hasFilters && (
        <div
          aria-live="polite"
          style={{
            display: 'flex',
            gap: 6,
            flexWrap: 'wrap',
            marginBottom: 16,
            alignItems: 'center',
            fontSize: 13,
            color: 'var(--color-muted)',
          }}
        >
          <span>選択中: </span>
          {category !== 'すべて' && (
            <FilterChip
              label={`category=${category}`}
              onRemove={() => setCategory('すべて')}
            />
          )}
          {subcategory !== 'すべて' && (
            <FilterChip
              label={`subcategory=${subcategoryLabel(subcategory)}`}
              onRemove={() => setSubcategory('すべて')}
            />
          )}
          {query.trim() && (
            <FilterChip
              label={`q=${query.trim()}`}
              onRemove={() => setQuery('')}
            />
          )}
          <span style={{ marginLeft: 8 }}>結果 {filtered.length}件</span>
        </div>
      )}

      {/* 結果リスト */}
      {filtered.length === 0 ? (
        <p
          style={{
            padding: 32,
            textAlign: 'center',
            color: 'var(--color-muted)',
          }}
        >
          条件に合う用語が見つかりませんでした。
        </p>
      ) : (
        <ul className="glossary-list">
          {filtered.map((item) => (
            <li key={item.id}>
              <Link href={`/glossary/${item.slug}`} className="glossary-card">
                <div className="glossary-card-term">{item.term}</div>
                {item.reading && (
                  <div className="glossary-card-reading">{item.reading}</div>
                )}
                <div className="glossary-card-def">{item.shortDef}</div>
                {(firstOf(item.category) || item.subcategory) && (
                  <div
                    style={{
                      display: 'flex',
                      gap: 4,
                      flexWrap: 'wrap',
                      marginTop: 8,
                    }}
                  >
                    {firstOf(item.category) && (
                      <span
                        style={{
                          fontSize: 12,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background:
                            CATEGORY_COLORS[firstOf(item.category)] || '#666',
                          color: '#fff',
                          fontWeight: 600,
                        }}
                      >
                        {firstOf(item.category)}
                      </span>
                    )}
                    {item.subcategory && (
                      <span
                        style={{
                          fontSize: 12,
                          padding: '2px 6px',
                          borderRadius: 4,
                          background: 'var(--color-bg)',
                          color: 'var(--color-muted)',
                          border: '1px solid var(--color-line)',
                        }}
                      >
                        {subcategoryLabel(item.subcategory)}
                      </span>
                    )}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* 「_一般」存在時のヒント */}
      {category !== 'すべて' &&
        subcategoriesForCurrentCategory.some(([s]) => s.endsWith('_一般')) && (
          <p
            style={{
              marginTop: 24,
              fontSize: 15,
              color: 'var(--color-muted)',
              fontStyle: 'italic',
            }}
          >
            ※「未分類（一般）」は、自動分類で明確な subcategory に
            割り当てられなかった用語群です（依頼AH Phase A v3.1 ヒューリスティクス）。
          </p>
        )}
    </div>
  );
}

function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        background: 'var(--color-bg)',
        border: '1px solid var(--color-line)',
        borderRadius: 999,
        fontSize: 12,
        color: 'var(--color-text, #222)',
      }}
    >
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`${label} を解除`}
        style={{
          marginLeft: 2,
          padding: 0,
          background: 'transparent',
          border: 'none',
          color: 'var(--color-muted)',
          fontSize: 15,
          cursor: 'pointer',
          lineHeight: 1,
        }}
      >
        ×
      </button>
    </span>
  );
}
