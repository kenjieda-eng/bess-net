/**
 * src/lib/site-counts.ts — 入口ページなどに出す件数の出どころ（入口の掃除と計測便・2026-10-17）
 *
 * 件数を手書きしない（#121）。変電所の件数と送配電の会社数は、Ck2f で統一した
 * src/data/substations/index.json の summary から出す（凍結除外・prebuild の build:substations が毎ビルド作り直す）。
 *   - SUBSTATION_TOTAL: summary.total（/grid・トップ・/anken と同じ）
 *   - GRID_COMPANY_COUNT: summary.by_area_slug で 0 件より多いエリアの数（/reports/2026 の SUBSTATION_AREA_COUNT と同じ式）
 * 書式は toLocaleString('en-US')（既存の表示と同じ・新しい丸めは作らない）。
 *
 * ★事業者ナビの社数はこのファイルに置かない（src/lib/operator-count.ts）。
 *   こちらは prebuild の検査（scripts/verify-corrections.ts → landing-page-configs.ts）からも読まれるので、
 *   prebuild の途中で作られる src/lib/generated の JSON を import しない（生成物ゼロからの起動・verify:generated と同じ考え）。
 */
import substationsIndex from '@/data/substations/index.json';

const SUMMARY = (substationsIndex as unknown as { summary: { total: number; by_area_slug: Record<string, number> } }).summary;

export const SUBSTATION_TOTAL: number = SUMMARY.total;
export const SUBSTATION_TOTAL_STR: string = SUBSTATION_TOTAL.toLocaleString('en-US');
export const GRID_COMPANY_COUNT: number = Object.values(SUMMARY.by_area_slug).filter((n) => n > 0).length;
