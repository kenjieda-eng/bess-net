/**
 * src/data/capacity-market-history.ts
 *
 * 容量市場 メインオークション 過去約定価格 (依頼AT モック版)
 *
 * ⚠️ 本データはモック値です。OCCTO 公表値を参考にした業界予測中央値ベース。
 * 実値は 5/29 公開予定の AU 容量市場約定価格DB と連動し、microCMS から取得に切替予定。
 * AT 完成時点では capacity-market-data.ts の getHistory() のみを差し替える設計。
 *
 * 構成: 9 エリア × 3 区分 (新設/既設/経過措置) × 2 年度 (2024/2025) = 54 件
 *
 * 参考:
 *   - OCCTO 容量市場メインオークション約定結果 (2024-2025年度)
 *   - エリア別差分は混雑系統補正・実需要を反映
 */

export type Area =
  | 'hokkaido'
  | 'tohoku'
  | 'tokyo'
  | 'chubu'
  | 'hokuriku'
  | 'kansai'
  | 'chugoku'
  | 'shikoku'
  | 'kyushu';

export type Category = 'new' | 'existing' | 'transition';

export interface CapacityMarketRecord {
  fiscal_year: number;
  area: Area;
  category: Category;
  clearing_price_yen_per_kw_year: number;
  cleared_capacity_mw: number;
  note?: string;
}

export const AREA_LABELS: Record<Area, string> = {
  hokkaido: '北海道',
  tohoku: '東北',
  tokyo: '東京',
  chubu: '中部',
  hokuriku: '北陸',
  kansai: '関西',
  chugoku: '中国',
  shikoku: '四国',
  kyushu: '九州',
};

export const CATEGORY_LABELS: Record<Category, string> = {
  new: '新設電源',
  existing: '既設電源',
  transition: '経過措置電源',
};

export const CATEGORY_DESCRIPTIONS: Record<Category, string> = {
  new: 'メインオークション 4年後実需要向け、長期脱炭素オークション (LTDC) と独立',
  existing: '既設既存電源、毎年の応札・落札。容量市場の主流',
  transition: '経過措置 (~2028年度) 後に新設・既設に統合予定',
};

// ─────────────────────────────────────
// モックデータ (2024 + 2025 年度、9 エリア × 3 区分)
// ─────────────────────────────────────

// 2024年度実績 (前年度、業界予測ベース)
const Y2024: Array<[Area, Category, number, number]> = [
  ['hokkaido', 'new', 14_500, 350], ['hokkaido', 'existing', 7_500, 1_800], ['hokkaido', 'transition', 5_000, 600],
  ['tohoku', 'new', 14_800, 600], ['tohoku', 'existing', 7_800, 3_200], ['tohoku', 'transition', 5_200, 900],
  ['tokyo', 'new', 16_200, 2_400], ['tokyo', 'existing', 8_500, 12_500], ['tokyo', 'transition', 5_800, 3_500],
  ['chubu', 'new', 15_500, 1_500], ['chubu', 'existing', 8_100, 6_800], ['chubu', 'transition', 5_500, 1_900],
  ['hokuriku', 'new', 13_800, 280], ['hokuriku', 'existing', 7_200, 1_400], ['hokuriku', 'transition', 4_800, 450],
  ['kansai', 'new', 15_800, 1_800], ['kansai', 'existing', 8_300, 8_900], ['kansai', 'transition', 5_700, 2_700],
  ['chugoku', 'new', 14_200, 720], ['chugoku', 'existing', 7_500, 3_500], ['chugoku', 'transition', 5_100, 1_100],
  ['shikoku', 'new', 13_500, 220], ['shikoku', 'existing', 7_000, 1_100], ['shikoku', 'transition', 4_700, 350],
  ['kyushu', 'new', 14_600, 950], ['kyushu', 'existing', 7_700, 4_200], ['kyushu', 'transition', 5_300, 1_400],
];

// 2025年度実績 (容量市場価格 大幅下落の業界予測反映、AM/AO で 2025 標準 8,000 円採用と整合)
const Y2025: Array<[Area, Category, number, number]> = [
  ['hokkaido', 'new', 11_200, 400], ['hokkaido', 'existing', 5_800, 1_900], ['hokkaido', 'transition', 4_200, 550],
  ['tohoku', 'new', 11_500, 680], ['tohoku', 'existing', 6_000, 3_400], ['tohoku', 'transition', 4_400, 850],
  ['tokyo', 'new', 12_800, 2_600], ['tokyo', 'existing', 8_000, 13_000], ['tokyo', 'transition', 5_200, 3_300],
  ['chubu', 'new', 12_200, 1_650], ['chubu', 'existing', 7_500, 7_100], ['chubu', 'transition', 4_900, 1_800],
  ['hokuriku', 'new', 10_500, 310], ['hokuriku', 'existing', 5_500, 1_500], ['hokuriku', 'transition', 4_000, 420],
  ['kansai', 'new', 12_500, 1_900], ['kansai', 'existing', 7_700, 9_300], ['kansai', 'transition', 5_100, 2_500],
  ['chugoku', 'new', 11_000, 800], ['chugoku', 'existing', 5_700, 3_700], ['chugoku', 'transition', 4_300, 1_050],
  ['shikoku', 'new', 10_200, 250], ['shikoku', 'existing', 5_300, 1_200], ['shikoku', 'transition', 3_900, 320],
  ['kyushu', 'new', 11_300, 1_050], ['kyushu', 'existing', 5_900, 4_400], ['kyushu', 'transition', 4_500, 1_300],
];

function expandYear(
  records: Array<[Area, Category, number, number]>,
  fiscal_year: number
): CapacityMarketRecord[] {
  return records.map(([area, category, price, capacity]) => ({
    fiscal_year,
    area,
    category,
    clearing_price_yen_per_kw_year: price,
    cleared_capacity_mw: capacity,
  }));
}

export const HISTORY: CapacityMarketRecord[] = [
  ...expandYear(Y2024, 2024),
  ...expandYear(Y2025, 2025),
];

// 2026年度予測（実データ FY2026 が catalog に含まれるため参考のみ）
export const FORECAST_2026 = {
  base_price_existing: 7_000, // 業界予測 中央値（参考）
  base_price_new: 11_000,
  range_factor: 0.35, // ±35% で範囲表示
  note: '実データ (FY2026-FY2029) は data.eic-jp.org 連携済。本フォールバック予測値は参考用。',
};

// データソース表記（フォールバック時の表記）
export const DATA_SOURCE_LABEL = '出典: OCCTO 容量市場メインオークション約定結果 (業界予測値ベース、フォールバック)。実データは data.eic-jp.org 連携済。';
