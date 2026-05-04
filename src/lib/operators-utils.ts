// 事業者ナビ用ユーティリティ
import type { Operator } from './microcms';

/** 表示順のカテゴリ一覧（21個・「すべて」含む） */
export const OPERATOR_CATEGORY_ORDER = [
  'すべて',
  '電池メーカー',
  'PCS',
  'EPC',
  'O&M',
  '開発事業者',
  'アグリゲーター',
  '送配電',
  '電力会社',
  '商社',
  '金融',
  '保険',
  '法務',
  '監視',
  '消防',
  '電気主任',
  '土地',
  'コンサル',
  '研究機関',
  '業界団体',
  '自治体',
];

/** カテゴリ別バッジ色（Tailwind 互換クラス） */
export const OPERATOR_CATEGORY_COLOR: Record<string, string> = {
  電池メーカー: 'bg-emerald-50 text-emerald-700',
  PCS: 'bg-cyan-50 text-cyan-700',
  EPC: 'bg-blue-50 text-blue-700',
  'O&M': 'bg-teal-50 text-teal-700',
  開発事業者: 'bg-indigo-50 text-indigo-700',
  アグリゲーター: 'bg-violet-50 text-violet-700',
  送配電: 'bg-sky-50 text-sky-700',
  電力会社: 'bg-fuchsia-50 text-fuchsia-700',
  商社: 'bg-amber-50 text-amber-700',
  金融: 'bg-yellow-50 text-yellow-700',
  保険: 'bg-orange-50 text-orange-700',
  法務: 'bg-rose-50 text-rose-700',
  監視: 'bg-stone-50 text-stone-700',
  消防: 'bg-red-50 text-red-700',
  電気主任: 'bg-slate-100 text-slate-700',
  土地: 'bg-lime-50 text-lime-700',
  コンサル: 'bg-purple-50 text-purple-700',
  研究機関: 'bg-pink-50 text-pink-700',
  業界団体: 'bg-gray-100 text-gray-700',
  自治体: 'bg-green-50 text-green-700',
};

/** 製品文字列（カンマ区切り）を配列化 */
export function parseProducts(s: string | null | undefined): string[] {
  if (!s) return [];
  return String(s)
    .split(/[、,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** カテゴリ別件数を集計 */
export function operatorCountByCategory(
  items: Operator[]
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const o of items) {
    for (const c of o.category || []) {
      counts[c] = (counts[c] || 0) + 1;
    }
  }
  return counts;
}

/** 都道府県リスト（出現順・件数付き） */
export function operatorPrefList(
  items: Operator[]
): { pref: string; count: number }[] {
  const map: Record<string, number> = {};
  for (const o of items) {
    if (o.prefecture) map[o.prefecture] = (map[o.prefecture] || 0) + 1;
  }
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([pref, count]) => ({ pref, count }));
}

/** 上場/非上場ラベル */
export function listedLabel(o: Operator): string {
  if (!o.listedMarket) return '';
  if (o.listedMarket === '非上場') return '非上場';
  return o.listedMarket + (o.ticker ? `（${o.ticker}）` : '');
}

/** 設立年表示 */
export function foundedLabel(year: number | undefined): string {
  if (!year) return '';
  return `${year}年設立`;
}
