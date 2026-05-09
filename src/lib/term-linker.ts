/**
 * term-linker.ts
 *
 * 後方互換ラッパー (依頼W で linkify.ts に集約)
 * - linkifyTerms: 既存呼び出し (news/explainer) を維持。内部で linkify.ts を呼ぶ。
 * - csvTermsToTermList: CSV 文字列の用語リストを TermLike[] に変換（変更なし）
 */

import { linkifyTerms as _linkifyTermsImpl } from './linkify';

export type TermLike = { term: string; slug: string };

/** 既存 API 互換: HTML 中の glossary 用語のみを自動リンク化 */
export function linkifyTerms(html: string, terms: TermLike[]): string {
  return _linkifyTermsImpl(html, terms);
}

/**
 * Explainer の relatedTerms（CSV文字列） を Glossary[] 形式に変換
 * 引数: terms = "FRT,LVRT,HVRT,..." / glossaryAll = 全glossary（mapping用）
 */
export function csvTermsToTermList(
  csv: string | undefined,
  termSlugMap: Map<string, string>
): TermLike[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((term) => ({
      term,
      slug: termSlugMap.get(term) ?? '',
    }))
    .filter((t) => t.slug.length > 0);
}
