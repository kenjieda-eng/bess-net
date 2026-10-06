/**
 * EIC Data 統合用型定義
 * data.eic-jp.org の D-011 19 項目スキーマに準拠
 */

export type EicDomain = 'power' | 'weather' | 'fuel' | 'finance' | 'economy' | 'international';
export type EicFrequency = '30min' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';

export interface Indicator {
  id: string;
  name: string;
  domain: EicDomain;
  frequency: EicFrequency;
  unit: string;
  source_name: string;
  source_url: string;
  license: string;
  license_url?: string;
  license_notice?: string;
  tz?: string;
  observation_cutoff: string; // ISO 8601 date (YYYY-MM-DD)
  updated_at: string; // ISO 8601 datetime
  freshness_sla_days?: number;
  missing_policy?: string;
  publisher?: string;
  aggregation?: string;
  notes?: string;
  depends_on?: string[]; // 派生系列の依存先 ID
  backfill_start?: string;
  /**
   * D-017 ADR (2026-05-17/18 リン側完成): catalog 自己記述による csv 配置パス
   * 例: 'data/processed/fuel/fuel-coal-au.csv'
   * これにより bess-net 側 DIR_MAP マッピング不要、catalog 直読み化
   * 未設定の場合は DIR_MAP fallback (後方互換)
   */
  csv_path?: string;
  /** 'active' | 'retired'（2026-10-06 catalog: active 710・retired 15） */
  status?: string;
  /**
   * 更新予定（eic-data-pipeline の宣言・R-28 §6-2）。2026-10-06 catalog（generated_at 2026-10-06T12:03:32+09:00）で 725/725 に付与:
   * window 182（months 162・next_expected 20）・interval 543（days はすべて 7）。
   * 判定は src/lib/eic-date.ts の nextUpdateWindow 1 か所（#121）。
   */
  update_schedule?: UpdateSchedule;
}

/** catalog の update_schedule（R-28 §6-2・Ck2h §8） */
export interface UpdateSchedule {
  /** 'window' | 'interval'。JSON import の推論型（string）と互換にするため string。未知の値は「窓なし」扱い */
  kind: string;
  /** interval の間隔（日） */
  days?: number;
  /** window の月（1〜12）。連続する月（[4,5]）は 1 つの窓 */
  months?: number[];
  /** window の猶予（日）。★Indicator 直下の grace_days とは別物（capacity-main は直下 45・ここ 90 で食い違う）。判定はこちら */
  grace_days?: number;
  /** window の次回予定日（YYYY-MM-DD）。あれば months より優先（この形の 20 件は months を持たない） */
  next_expected?: string;
}

export interface DataPoint {
  date: string; // ISO 8601 (YYYY-MM-DD)
  value: number | null; // null = 欠損
}

export interface SeriesData {
  id: string;
  meta: Indicator;
  points: DataPoint[];
}

export interface Catalog {
  version?: number;
  schema?: string;
  generated_at?: string;
  indicator_count?: number;
  indicators: Indicator[];
}
