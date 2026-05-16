/**
 * src/lib/irr-defaults.ts
 *
 * 蓄電池IRRシミュレーター デフォルト値 (依頼AM、2026年5月最新版)
 *
 * 編集方針:
 *   - 加藤+石田+中村 監修 (AM_デフォルト値最新化_議論_2026-05-14.md 準拠)
 *   - 標準値は業界一般的な事業性ライン (IRR 4-7% 想定)
 *   - 楽観/悲観は事業性レンジの境界を示す
 *
 * 出典:
 *   - 容量市場: JEPX/OCCTO 公表 2025年度オークション結果 (2024年度比 大幅下落反映)
 *   - 需給調整市場: OCCTO 2024年度 三次調整力 実績
 *   - スポット価格: JEPX 2024年度実績
 *   - CAPEX: 業界 EPC 公表値中央値 (中国LFP / 国産混在)
 *   - SII 補助金: 系統用蓄電池 等導入支援事業 採択実績
 */

import type { IRRInput } from './irr-calculator';

/** シナリオキー */
export type ScenarioKey = 'optimistic' | 'standard' | 'pessimistic';

/** 設備系の共通デフォルト (3 シナリオ共通) */
export const COMMON_DEFAULTS = {
  capacity_mwh: 50,
  output_mw: 12.5, // 4 時間放電
  efficiency: 88,
  lifespan_years: 20,
  cycles_per_year: 365,
  dod: 85,
  opex_yen_per_mw_year: 5_000_000,
  discount_rate: 5, // NPV 計算用、業界一般的な水準
} as const;

/** シナリオ別デフォルト (CAPEX/補助金/市場価格) */
export const SCENARIO_DEFAULTS: Record<ScenarioKey, Omit<IRRInput, keyof typeof COMMON_DEFAULTS>> = {
  optimistic: {
    spot_high: 28,
    spot_low: 6,
    capacity_market_yen_per_kw_year: 12_000,
    ancillary_yen_per_kw_month: 2_200,
    capex_oku: 22, // 中国LFP + コスト最適化
    subsidy_rate: 40, // SII + 自治体併用
  },
  standard: {
    spot_high: 23,
    spot_low: 9,
    capacity_market_yen_per_kw_year: 8_000, // 2025年度大幅下落反映
    ancillary_yen_per_kw_month: 1_500,
    capex_oku: 26,
    subsidy_rate: 33,
  },
  pessimistic: {
    spot_high: 19,
    spot_low: 12,
    capacity_market_yen_per_kw_year: 5_000,
    ancillary_yen_per_kw_month: 800,
    capex_oku: 32,
    subsidy_rate: 0,
  },
};

/** ScenarioKey から完全な IRRInput を生成 */
export function getScenarioInput(scenario: ScenarioKey): IRRInput {
  return {
    ...COMMON_DEFAULTS,
    ...SCENARIO_DEFAULTS[scenario],
  };
}

/** 標準シナリオを起点に user override を merge する用途 */
export function buildInput(
  base: ScenarioKey,
  overrides: Partial<IRRInput> = {}
): IRRInput {
  return {
    ...getScenarioInput(base),
    ...overrides,
  };
}

/** UI 表示用 ラベル */
export const SCENARIO_LABELS: Record<ScenarioKey, string> = {
  optimistic: '楽観',
  standard: '標準',
  pessimistic: '悲観',
};

/** UI 表示用 説明 */
export const SCENARIO_DESCRIPTIONS: Record<ScenarioKey, string> = {
  optimistic:
    'スポット価格高位 + 容量市場高水準 + 補助金併用 + 中国LFP低 CAPEX。事業性が確保できる最良ケース。',
  standard:
    '業界一般的な事業性ライン。スポット価格 ¥23/9、容量市場 ¥8,000/kW/年 (2025年度実績)、SII補助金 33%。',
  pessimistic:
    'スポット価格圧縮 + 容量市場縮小 + 補助金なし + CAPEX高位。事業性が厳しい下振れケース。',
};

/** UI 表示用 カラー (3 シナリオの統一カラーリング) */
export const SCENARIO_COLORS: Record<ScenarioKey, string> = {
  optimistic: '#0066cc',
  standard: '#006666',
  pessimistic: '#cc6600',
};

/**
 * プリセット (C 案、依頼36)
 * - 高圧: 2 MW / 8 MWh (高圧需要家、補助金活用前提)
 * - 大規模: 12.5 MW / 50 MWh (系統用 BESS 標準、既存デフォルトと一致)
 *
 * CAPEX/補助金は スケール連動で calibrate (約 75 万円/kWh ベース)
 */
export type PresetKey = 'high-voltage' | 'large-scale';

interface PresetCapex {
  optimistic: number; // 億円
  standard: number;
  pessimistic: number;
}

interface PresetSubsidy {
  optimistic: number; // %
  standard: number;
  pessimistic: number;
}

export interface PresetSpec {
  key: PresetKey;
  label: string;
  description: string;
  capacity_mwh: number;
  output_mw: number;
  capex: PresetCapex; // シナリオ別 CAPEX
  subsidy: PresetSubsidy; // シナリオ別 補助金率
}

export const PRESETS: Record<PresetKey, PresetSpec> = {
  'high-voltage': {
    key: 'high-voltage',
    label: '高圧 (2 MW / 8 MWh)',
    description: '高圧需要家標準、4 時間放電。SII 補助金 + 自治体併用前提',
    capacity_mwh: 8,
    output_mw: 2,
    capex: {
      // 8 MWh × ~50 万円/kWh = ~4 億円ベース (中規模スケール価格)
      optimistic: 3.5,
      standard: 4.2,
      pessimistic: 5.5,
    },
    subsidy: {
      // 高圧クラスは SII + 自治体併用で補助金率高め
      optimistic: 50,
      standard: 40,
      pessimistic: 20,
    },
  },
  'large-scale': {
    key: 'large-scale',
    label: '大規模 (12.5 MW / 50 MWh)',
    description: '系統用 BESS 標準、容量市場・需給調整市場応札規格 (既存デフォルト)',
    capacity_mwh: 50,
    output_mw: 12.5,
    capex: {
      // 既存 SCENARIO_DEFAULTS の値そのまま
      optimistic: 22,
      standard: 26,
      pessimistic: 32,
    },
    subsidy: {
      // 既存 SCENARIO_DEFAULTS の値そのまま
      optimistic: 40,
      standard: 33,
      pessimistic: 0,
    },
  },
};

/**
 * プリセット適用後の IRRInput 3 シナリオを返す
 * (他フィールドは getScenarioInput の既定値を流用)
 */
export function applyPreset(presetKey: PresetKey): Record<ScenarioKey, IRRInput> {
  const p = PRESETS[presetKey];
  const scenarios: ScenarioKey[] = ['optimistic', 'standard', 'pessimistic'];
  const result = {} as Record<ScenarioKey, IRRInput>;
  for (const s of scenarios) {
    const base = getScenarioInput(s);
    result[s] = {
      ...base,
      capacity_mwh: p.capacity_mwh,
      output_mw: p.output_mw,
      capex_oku: p.capex[s],
      subsidy_rate: p.subsidy[s],
    };
  }
  return result;
}
