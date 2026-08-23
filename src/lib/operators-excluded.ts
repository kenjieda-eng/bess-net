/**
 * src/lib/operators-excluded.ts
 *
 * /operators から「一覧・件数・集計・sitemap・detail-index」を除外する slug の単一情報源。
 * projects-excluded.ts と同方式。非破壊（microCMS は削除しない）。
 *
 * 現状の中身は OPERATORS_301_SOURCE_SLUGS（301 元＝抽出断片）のみ。
 * 断片ページは middleware が正エントリへ 301 するため、除外しても 404 は生まれない。
 *
 * ★突合（operator-match）でも除外する必要がある。断片名は既存社と別文字列のため、
 *   除外しないと同一案件が「断片」と「正」の両方に計上され重複計上になる
 *   （2026-08-23 実測: kepco-eflow-aso-chikugo が e-flow-unyo と agg-e-flow-3766 の双方に計上）。
 */
import { OPERATORS_301_SOURCE_SLUGS } from './operators-301';

/** 追加の個別除外（301 を伴わないもの）。現状なし */
const EXTRA_EXCLUDED_OPERATOR_SLUGS: ReadonlySet<string> = new Set<string>([]);

export const EXCLUDED_OPERATOR_SLUGS: ReadonlySet<string> = new Set<string>([
  ...OPERATORS_301_SOURCE_SLUGS,
  ...EXTRA_EXCLUDED_OPERATOR_SLUGS,
]);

export function isExcludedOperator(slug: string | undefined | null): boolean {
  return !!slug && EXCLUDED_OPERATOR_SLUGS.has(slug);
}
