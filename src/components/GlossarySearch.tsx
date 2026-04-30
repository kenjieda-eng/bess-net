'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Glossary } from '@/lib/microcms';

const CATEGORY_ORDER = [
  'すべて',
  '基礎',
  '市場制度',
  '系統連系',
  '技術',
  'EPC',
  'O&M',
  '事業',
  '土地',
  '安全',
  '法務',
  '補助金',
  '海外',
  '低圧',
  'その他',
];

type Props = {
  items: Glossary[];
};

export default function GlossarySearch({ items }: Props) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('すべて');

  // 実際に存在するカテゴリのみ
  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) {
      const c = (it.category && it.category[0]) || 'その他';
      set.add(c);
    }
    return CATEGORY_ORDER.filter(
      (c) => c === 'すべて' || set.has(c)
    );
  }, [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      // カテゴリフィルタ
      if (category !== 'すべて') {
        const c = (it.category && it.category[0]) || 'その他';
        if (c !== category) return false;
      }
      // 検索フィルタ（用語名・読み・英語・一言定義から検索）
      if (q) {
        const hay = [
          it.term,
          it.reading,
          it.english,
          it.shortDef,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [items, query, category]);

  // カテゴリ別にグルーピング
  const grouped = useMemo(() => {
    const groups: Record<string, Glossary[]> = {};
    for (const item of filtered) {
      const cat = (item.category && item.category[0]) || 'その他';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(item);
    }
    const ordered: Array<{ category: string; items: Glossary[] }> = [];
    for (const cat of CATEGORY_ORDER) {
      if (cat === 'すべて') continue;
      if (groups[cat]) {
        ordered.push({ category: cat, items: groups[cat] });
        delete groups[cat];
      }
    }
    for (const cat of Object.keys(groups)) {
      ordered.push({ category: cat, items: groups[cat] });
    }
    return ordered;
  }, [filtered]);

  return (
    <div>
      <div className="glossary-search-bar">
        <input
          type="search"
          placeholder="用語名・読み・英語で検索..."
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
      </div>

      <div className="glossary-category-filters">
        {availableCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`glossary-cat-btn${category === cat ? ' is-active' : ''}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ padding: 32, textAlign: 'center', color: 'var(--color-muted)' }}>
          条件に合う用語が見つかりませんでした。
        </p>
      ) : category === 'すべて' ? (
        // すべて表示時はカテゴリ別グルーピング
        grouped.map((g) => (
          <section
            key={g.category}
            id={`cat-${encodeURIComponent(g.category)}`}
            className="glossary-category-section"
          >
            <h2 className="glossary-category-title">
              {g.category}（{g.items.length}）
            </h2>
            <ul className="glossary-list">
              {g.items.map((item) => (
                <GlossaryCardItem key={item.id} item={item} />
              ))}
            </ul>
          </section>
        ))
      ) : (
        // 単一カテゴリ時はフラットリスト
        <ul className="glossary-list">
          {filtered.map((item) => (
            <GlossaryCardItem key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function GlossaryCardItem({ item }: { item: Glossary }) {
  return (
    <li>
      <Link href={`/glossary/${item.slug}`} className="glossary-card">
        <div className="glossary-card-term">{item.term}</div>
        {item.reading && (
          <div className="glossary-card-reading">{item.reading}</div>
        )}
        <div className="glossary-card-def">{item.shortDef}</div>
      </Link>
    </li>
  );
}
