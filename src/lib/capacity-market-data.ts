/**
 * src/lib/capacity-market-data.ts
 *
 * 容量市場データの参照口（依頼AT → Nv-0b ■2 で実データ専用に整理・2026-09-21）
 *
 * ★モックを参照ゼロにした
 *   以前はここが src/data/capacity-market-history.ts（モック）の唯一の入口で、
 *   getHistory / filterHistory / getForecast2026 / getDataSourceLabel がモックを返していた。
 *   実データ（EIC カタログ＝OCCTO 公表値）は /tools/capacity-market-bid の page.tsx が
 *   buildLiveHistory() で組み立てて props で渡しており、モックはカタログが欠けたときの fallback にだけ使われていた。
 *   そのモックは「AM/AO で 2025 標準 8,000 円採用と整合」（history.ts:80）と書かれ、既定値に合わせて作られ、
 *   しかも本文（「東京 8,500→8,000」）の出典にまでなっていた（循環）。
 *   → fallback は「数値を出さない」に変え、モックへの参照をすべて外した。
 *     モックのファイル自体の削除は次便（rm を伴うため）。
 */

import type { Area, CapacityMarketRecord } from './capacity-market-types';

export type { Area, CapacityMarketRecord };
export { AREA_LABELS } from './capacity-market-types';

/**
 * エリアのみでフィルタ（区分非依存）
 * OCCTO メインオークションの約定価格はエリア単位で決まり、区分（新設/既設/経過措置）によって変わらない。
 */
export function filterHistoryByArea(
  records: CapacityMarketRecord[],
  area: Area
): CapacityMarketRecord[] {
  return records.filter((r) => r.area === area);
}
