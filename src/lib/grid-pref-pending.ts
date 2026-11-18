/**
 * src/lib/grid-pref-pending.ts — 県が「確認中」の変電所の表示（九州の県の直し便・2026-11-18）
 *
 * 九州の変電所は microCMS の全件に収録の県がある。県の導出（normalizeSubstationPlace・kyushu-prefecture.ts）の後に
 * 「県も設備区分も無い」九州の行は、県を確認中にしたもの（対応表の pending）だけ。一覧の部品はこの判定で「確認中」と出す。
 * ★対応表は読まない（ブラウザの部品からも import してよい・正規化済みの値に掛け直さない＝#119）。
 */

/** 一覧の「都道府県」の欄・詳細の「都道府県」の欄 */
export const PREF_PENDING_CELL = '確認中';

/** /grid/kyushu の県別の表の行 */
export const PREF_PENDING_ROW = '県は確認中';

/** 正規化済みの値（prefecture・facility_class）とエリアから、県が確認中かどうか */
export function isPrefPending(
  area: string | null | undefined,
  prefecture: string | null | undefined,
  facilityClass: string | null | undefined
): boolean {
  return (area ?? '').trim() === '九州' && !prefecture && !facilityClass;
}
