/**
 * src/lib/capacity-market-data.ts
 *
 * 容量市場データソース 抽象化レイヤー (依頼AT)
 *
 * AT (モック版): src/data/capacity-market-history.ts 静的 import
 * AU (5/29 公開) 後: microCMS の事前計算 JSON 経由に切替 (鉄則 #2 #3 遵守)
 *
 * インターフェイス安定性:
 *   getHistory() / getForecast() のシグネチャは固定。
 *   AU 切替時は本ファイルの実装のみ差し替え (UI/lib 側は変更なし)。
 */

import {
  HISTORY,
  FORECAST_2026,
  DATA_SOURCE_LABEL,
  type CapacityMarketRecord,
  type Area,
  type Category,
} from '@/data/capacity-market-history';

export type { CapacityMarketRecord, Area, Category };
export { AREA_LABELS, CATEGORY_LABELS, CATEGORY_DESCRIPTIONS } from '@/data/capacity-market-history';

/** バージョンマーカー: 'mock' (AT) → 'live' (AU 連携後) */
export const DATA_VERSION: 'mock' | 'live' = 'mock';

/**
 * 過去約定価格データ取得 (全件)
 * 9 エリア × 3 区分 × 2 年度 = 54 件
 */
export function getHistory(): CapacityMarketRecord[] {
  return HISTORY;
}

/** 2026年度予測値 取得 */
export function getForecast2026(): typeof FORECAST_2026 {
  return FORECAST_2026;
}

/** データソース表記 */
export function getDataSourceLabel(): string {
  return DATA_SOURCE_LABEL;
}

/**
 * エリア × 区分 で履歴をフィルタ
 */
export function filterHistory(
  area: Area,
  category: Category
): CapacityMarketRecord[] {
  return HISTORY.filter((r) => r.area === area && r.category === category);
}
