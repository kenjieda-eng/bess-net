// 解説記事ユーティリティ
// - カテゴリのグルーピング定義
// - 読了時間計算
// microCMS の Explainer.category は string[]（multi-select）。
// 表示・グルーピングでは先頭要素を採用する前提で扱う。

import type { Explainer } from './microcms';

/**
 * 個別カテゴリ名 → 表示用グループ名のマッピング
 * 既存35本で実際に出現するカテゴリ:
 *  市場制度(10) / 技術(7) / 基礎(3) / 補助金(2) / 低圧(2) / 法務(2) / 安全(1) / 空(6)
 */
export const CATEGORY_GROUP_MAP: Record<string, string> = {
  市場制度: '制度・市場',
  補助金: '制度・市場',
  技術: '技術',
  基礎: '基礎・入門',
  低圧: '低圧・分散',
  安全: '安全・法務',
  法務: '安全・法務',
};

/** UIで表示するグループの順序 */
export const GROUP_ORDER = [
  'すべて',
  '制度・市場',
  '技術',
  '基礎・入門',
  '低圧・分散',
  '安全・法務',
  'その他',
];

/** 表示用バッジの色 (Tailwindクラス) */
export const GROUP_COLOR: Record<string, string> = {
  '制度・市場': 'bg-blue-50 text-blue-700',
  技術: 'bg-emerald-50 text-emerald-700',
  '基礎・入門': 'bg-amber-50 text-amber-700',
  '低圧・分散': 'bg-purple-50 text-purple-700',
  '安全・法務': 'bg-rose-50 text-rose-700',
  その他: 'bg-gray-100 text-gray-700',
};

/** Explainer.category（string[] / string / null）の先頭値を取り出す */
export function pickCategory(
  category: string[] | string | null | undefined
): string | undefined {
  if (!category) return undefined;
  if (Array.isArray(category)) return category[0];
  return category;
}

/** 個別カテゴリ → グループ名 (空・未定義は「その他」) */
export function toGroup(
  category: string[] | string | null | undefined
): string {
  const c = pickCategory(category);
  if (!c) return 'その他';
  return CATEGORY_GROUP_MAP[c] || 'その他';
}

/** body(HTML) から読了時間(分)を概算。日本語 500 字/分。 */
export function readMinutes(body: string | null | undefined): number {
  if (!body) return 1;
  const text = String(body).replace(/<[^>]*>/g, '').replace(/\s+/g, '');
  return Math.max(1, Math.round(text.length / 500));
}

/** タグ文字列(カンマ・読点区切り) → 配列 */
export function parseTags(s: string | null | undefined): string[] {
  if (!s) return [];
  return String(s)
    .split(/[、,，]/)
    .map((t) => t.trim())
    .filter(Boolean);
}

/** 公開日を YYYY-MM-DD で表示 */
export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ja-JP');
}

/** カテゴリグループ別に件数を集計 */
export function countByGroup(items: Explainer[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const it of items) {
    const g = toGroup(it.category);
    counts[g] = (counts[g] || 0) + 1;
  }
  return counts;
}
