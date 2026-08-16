/**
 * src/lib/substations-frozen.ts — 更新停止（凍結）変電所の一元管理
 *
 * フェーズ1裁定（2026-08-16）: tpg-1623 湯船は、2026年7月10日公表の最新CSVに掲載がなく、
 * 廃止の事実も確認できないため「凍結」とする。
 *   - データは 2026/04/23 時点のまま保持・ページ維持（URL保全・削除/301しない）
 *   - 空容量プラス集計・TOP20・検索の連系候補からは除外する
 *     （4月時点の値を「空きあり」候補として出し続けないため）
 *   - 詳細ページには下記の注記を初期DOMで表示する（落とし穴 #107）
 */

export const FROZEN_SUBSTATION_SLUGS: ReadonlySet<string> = new Set<string>([
  'tpg-1623', // 湯船（静岡県・154kV）— 2026-07-10公表CSVに不掲載。凍結（2026-08-16裁定）
]);

/** 凍結注記（裁定で確定した文言。原因を推測した表現を足さない） */
export const FROZEN_SUBSTATION_NOTE =
  'このデータは 2026年4月23日公表時点のものです。2026年7月10日公表の最新データには当設備の掲載がないため、更新を停止しています。最新の連系可否は東京電力パワーグリッドの事前相談窓口でご確認ください。';

export function isFrozenSubstation(slug: string | undefined | null): boolean {
  return !!slug && FROZEN_SUBSTATION_SLUGS.has(slug);
}
