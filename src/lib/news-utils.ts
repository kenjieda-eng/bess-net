// ニュース一覧用ユーティリティ
import type { News } from './microcms';

/** 表示順のカテゴリ一覧（13個・「すべて」含む） */
export const NEWS_CATEGORY_ORDER = [
  'すべて',
  '連系',
  '投資',
  '開発計画',
  '制度',
  'オークション',
  '補助金',
  '技術',
  '事故',
  '人事',
  '海外',
  '市場統計',
  '地域自治体',
];

/** カテゴリ別バッジ色 */
export const NEWS_CATEGORY_COLOR: Record<string, string> = {
  連系: 'bg-blue-50 text-blue-700',
  投資: 'bg-emerald-50 text-emerald-700',
  開発計画: 'bg-teal-50 text-teal-700',
  制度: 'bg-violet-50 text-violet-700',
  オークション: 'bg-fuchsia-50 text-fuchsia-700',
  補助金: 'bg-amber-50 text-amber-700',
  技術: 'bg-cyan-50 text-cyan-700',
  事故: 'bg-rose-50 text-rose-700',
  人事: 'bg-stone-50 text-stone-700',
  海外: 'bg-orange-50 text-orange-700',
  市場統計: 'bg-yellow-50 text-yellow-700',
  地域自治体: 'bg-lime-50 text-lime-700',
  編集部: 'bg-slate-100 text-slate-700',
};

/** タグ文字列(カンマ区切り)を配列化 */
export function parseTags(s: string | null | undefined): string[] {
  if (!s) return [];
  return String(s)
    .split(/[、,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** 年だけ抽出 */
export function getYear(iso: string): string {
  return (iso || '').slice(0, 4);
}

/** YYYY-MM-DD で整形 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ja-JP');
}

/** カテゴリ別件数 */
export function newsCountByCategory(items: News[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const n of items) {
    for (const c of n.category || []) {
      counts[c] = (counts[c] || 0) + 1;
    }
  }
  return counts;
}

/** 年別件数（降順の年配列で返す） */
export function newsYearList(items: News[]): { year: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const n of items) {
    const y = getYear(n.publishedAt);
    if (y) map[y] = (map[y] || 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => (b[0] > a[0] ? 1 : -1))
    .map(([year, count]) => ({ year, count }));
}
