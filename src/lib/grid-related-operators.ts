/**
 * src/lib/grid-related-operators.ts — 送配電事業者の関連事業者（バッジ）をビルド時の表から返す（変電所の詳細をビルド時の JSON から読む便・2026-11-04）
 *
 * 変電所の詳細とエリアのページ（/grid/[slug]・/grid/tokyo）が使う。詳細の JSON（エリアごと）は読まない＝エリアのページの関数に載せない。
 * 表は precompute-substations が事業者ごとに 1 回 microCMS から取る（name[contains]・上位 5 件・非表示の事業者を除く）。実行時の microCMS 0。
 */
import detailIndex from './generated/grid-detail-index.json';

const RELATED = (detailIndex as unknown as { related_operators: Record<string, Array<{ name: string; slug: string }>> }).related_operators;

export function relatedOperatorsStatic(operatorName: string | null | undefined): Array<{ name: string; slug: string }> {
  return operatorName ? RELATED[operatorName] ?? [] : [];
}
