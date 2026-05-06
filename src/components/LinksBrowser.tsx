'use client';
// LinksBrowser - お役立ちサイト一覧のクライアント側フィルタリング
import { useMemo, useState } from 'react';
import type { LinkSiteLite } from '@/lib/microcms';

const ALL_CATEGORIES = [
  '国・行政（日本）',
  '規制機関・系統運用',
  '業界団体',
  '補助金・支援制度',
  '研究機関・大学',
  '専門メディア（国内）',
  'プレスリリース',
  '海外政府機関',
  '国際機関・調査',
  '海外メディア',
  'データソース',
  'ESG・ファイナンス',
];

const ALL_IMPORTANCES = ['★★★必読', '★★推奨', '★参考'];
const ALL_COUNTRIES = ['日本', '米国', 'EU・欧州', '英国', '豪州', '中国', '韓国', 'ASEAN', '国際機関', 'その他'];

export default function LinksBrowser({ items }: { items: LinkSiteLite[] }) {
  const [activeCategory, setActiveCategory] = useState<string>('すべて');
  const [activeImportance, setActiveImportance] = useState<string>('すべて');
  const [activeCountry, setActiveCountry] = useState<string>('すべて');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (activeCategory !== 'すべて' && !(it.category || []).includes(activeCategory)) return false;
      if (activeImportance !== 'すべて' && !(it.importance || []).includes(activeImportance)) return false;
      if (activeCountry !== 'すべて' && !(it.country || []).includes(activeCountry)) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${it.title} ${it.description} ${it.tags || ''}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [items, activeCategory, activeImportance, activeCountry, search]);

  // カテゴリ別グルーピング
  const grouped = useMemo(() => {
    const map = new Map<string, LinkSiteLite[]>();
    for (const item of filtered) {
      for (const cat of item.category || []) {
        if (activeCategory !== 'すべて' && cat !== activeCategory) continue;
        if (!map.has(cat)) map.set(cat, []);
        map.get(cat)!.push(item);
      }
      if (activeCategory === 'すべて' && (!item.category || item.category.length === 0)) {
        if (!map.has('その他')) map.set('その他', []);
        map.get('その他')!.push(item);
      }
    }
    // 表示順
    return Array.from(map.entries()).sort((a, b) => {
      const ai = ALL_CATEGORIES.indexOf(a[0]);
      const bi = ALL_CATEGORIES.indexOf(b[0]);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [filtered, activeCategory]);

  return (
    <div className="links-browser">
      <div className="links-filters">
        <div className="links-filter-row">
          <label>カテゴリ:</label>
          <select value={activeCategory} onChange={(e) => setActiveCategory(e.target.value)}>
            <option value="すべて">すべて</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="links-filter-row">
          <label>重要度:</label>
          <select value={activeImportance} onChange={(e) => setActiveImportance(e.target.value)}>
            <option value="すべて">すべて</option>
            {ALL_IMPORTANCES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="links-filter-row">
          <label>国・地域:</label>
          <select value={activeCountry} onChange={(e) => setActiveCountry(e.target.value)}>
            <option value="すべて">すべて</option>
            {ALL_COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div className="links-filter-row">
          <label>検索:</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="サイト名・説明・タグで検索"
          />
        </div>
        <p className="links-count">該当 {filtered.length} 件 / 全 {items.length} 件</p>
      </div>

      {grouped.map(([cat, links]) => (
        <section key={cat} className="links-category-section">
          <h2 className="links-category-h2">{cat}（{links.length}件）</h2>
          <ul className="links-grid">
            {links.map((link) => (
              <li key={link.id} className="links-card">
                <a href={`/links/${link.slug}`} className="links-card-inner">
                  <div className="links-card-header">
                    <span className="links-card-title">{link.title}</span>
                    {link.importance && link.importance.length > 0 && (
                      <span className={`links-card-imp imp-${link.importance[0].length}`}>
                        {link.importance[0]}
                      </span>
                    )}
                  </div>
                  <p className="links-card-desc">{link.description.substring(0, 100)}{link.description.length > 100 ? '…' : ''}</p>
                  <div className="links-card-meta">
                    {link.country && link.country.length > 0 && (
                      <span className="links-card-country">{link.country[0]}</span>
                    )}
                    {(link.contentTypes || []).slice(0, 3).map((t) => (
                      <span key={t} className="links-card-tag">{t}</span>
                    ))}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}

      {grouped.length === 0 && (
        <p className="links-empty">該当するサイトがありません。フィルタを調整してください。</p>
      )}
    </div>
  );
}
