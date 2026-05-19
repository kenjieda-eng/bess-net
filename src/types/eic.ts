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
