/**
 * src/lib/operator-count.ts — 事業者ナビの社数（静的に出す・入口の掃除と計測便・2026-10-17）
 *
 * /operators の本文と同じ数（getAllOperators() から非表示・301 元を除いた数）を、runtime の microCMS を足さずに出す。
 * 出どころは prebuild の build:operators-detail（scripts/precompute-operators-detail.ts）が作る
 * src/lib/generated/operators-category-index.json の件数（/operators/makers・/aggregators・/epc・/pref が既に使っている）。
 * 書式は実数のまま（「〜社超」などの丸めは作らない）。
 *
 * ★prebuild のスクリプトから読まれるモジュール（src/data/landing-page-configs.ts など）では import しない
 *   （生成物は prebuild の途中で作られる。生成物ゼロからの起動を壊さない）。ページと部品の側でだけ使う。
 */
import categoryIndex from '@/lib/generated/operators-category-index.json';

export const OPERATOR_COUNT: number = (categoryIndex as unknown[]).length;
