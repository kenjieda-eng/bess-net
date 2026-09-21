/**
 * src/lib/irr-defaults.ts
 *
 * 蓄電池IRRシミュレーター デフォルト値 (依頼AM → Nv-0c で出所を是正・2026-09-21)
 *
 * ★経緯（Nv-0c）
 *   容量市場 8,000・需給調整 1,500 の出所は 2026-05-14 の議論メモ（計画フォルダ
 *   02_計画・運営/AM_デフォルト値最新化_議論_2026-05-14.md）だった。メモには
 *   「2026 年度容量市場 約定価格（OCCTO 2026年3月公表）: 全国平均 約 7,500 …」
 *   「2026年4月 需給調整市場 平均約定価格（OCCTO 速報）: 一次調整力 約 1,800-2,200 円/kW/月」とあるが、
 *   どちらも一次に対応が無い。容量市場の数値は OCCTO の約定結果のどの年度・エリアとも一致せず、
 *   需給調整市場の約定価格を公表しているのは OCCTO ではなく EPRX で、単位も円/ΔkW・30分（円/kW/月ではない）。
 *   ＝議論の中で実在の機関名を付けた数値が作られ、それが既定値になっていた。
 *   ★恒久ルール: 一次で埋まらない値は既定値に置かない。置く場合は「当サイトの想定」と明記する。
 *
 * ★設計意図と実際の結果のずれ（未解決・Nv1 で扱う）
 *   同メモは「標準シナリオ IRR 4-7% 想定」としていたが、旧既定値での標準 IRR は 25.35%。
 *   原因は同じ出力（12.5MW）を裁定・容量市場・需給調整に全量で同時計上している収益モデル
 *   （irr-calculator.ts annualCashflowYen の単純な足し算）。画面にはこの点を注記している（IRRSimulator）。
 *
 * 各値の出所（2026-09-21 時点）:
 *   - 容量市場: ★カタログ参照（src/lib/capacity-market-defaults.ts）。
 *       OCCTO「容量市場メインオークション約定結果」を data.eic-jp.org がエリア値から約定容量で加重平均した全国値。
 *       標準＝全観測値（対象実需給年度）の中央値／楽観＝最大／悲観＝最小。
 *       ※ JEPX は容量市場の公表主体ではない（旧記載「JEPX/OCCTO 公表」は誤り）。
 *       ※ 年度は必ず「対象実需給年度」か「実施年度」で書く。カタログの date は対象実需給年度。
 *   - 需給調整市場: ★既定値を置かない（0）。一次に対応が無く単位も違うため。利用者が入力する。
 *   - スポット価格: 当サイトの想定値（標準 23/9 ＝ 価差 14 円/kWh）。
 *       一次と照合できる: JEPX の 30 分値から算出した日内スプレッド（カタログ jepx-spread-top8-system・
 *       上位 8 コマ − 下位 8 コマ＝4 時間相当）の 2025 年度平均は 8.10 円/kWh、日内最大 − 最小（理論上限）は 10.24 円/kWh。
 *       既定の価差 14 円はどちらも上回る＝裁定収益は過大方向。画面では src/lib/spot-spread-reference.ts から動的に示す。
 *       ★以前「JEPX の公表系列に日内高安は無い」「23 は日平均 5.43〜19.30 の範囲外」と書いていたが、
 *         前者は誤り（30 分値から出せる）、後者は違う指標同士の比較で成り立たなかった（Nv-0c レビューで是正）。
 *   - CAPEX: 当サイトの想定値（26 / 22 / 32 億円）。NREL ATB の参考値は IRRSimulator の Step 2 で別途提示。
 *   - 補助率: 大規模の標準 33% は、SII 系統用蓄電システム等導入支援事業（令和7年度補正）公募要領 1-10 で
 *       リチウムイオン電池の 1,000kW以上10,000kW未満・10,000kW以上30,000kW未満がいずれも 1/3 以内（補助対象経費に対する率・
 *       上限額あり）であることを 33% で近似したもの。本試算は CAPEX 全額に掛けている（近似）。
 *       ★鉤括弧で逐語引用のように書かない（上の記述は 2 行を要約したもの）。
 *       大規模の楽観 40%・悲観 0%、高圧プリセットの 50/40/20% は当サイトの想定。
 */

import type { IRRInput } from './irr-calculator';
// Nv-0c ■1: 容量市場の既定値はカタログ（OCCTO 約定結果の全国加重平均）から導出する
import { CAPACITY_MARKET_SCENARIO_DEFAULTS as CM } from './capacity-market-defaults';

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
    capacity_market_yen_per_kw_year: CM.optimistic, // national の最大（カタログ）
    ancillary_yen_per_kw_month: 0, // Nv-0c ■2: 既定値を置かない（一次に対応が無く単位も違う）
    capex_oku: 22, // 中国LFP + コスト最適化
    subsidy_rate: 40, // SII + 自治体併用
  },
  standard: {
    spot_high: 23,
    spot_low: 9,
    capacity_market_yen_per_kw_year: CM.standard, // national の中央値（カタログ）
    ancillary_yen_per_kw_month: 0, // Nv-0c ■2: 既定値を置かない
    capex_oku: 26,
    subsidy_rate: 33,
  },
  pessimistic: {
    spot_high: 19,
    spot_low: 12,
    capacity_market_yen_per_kw_year: CM.pessimistic, // national の最小（カタログ）
    ancillary_yen_per_kw_month: 0, // Nv-0c ■2: 既定値を置かない
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
  // ★Nv-0c: 評価語（「事業性が確保できる最良ケース」等）と、一次に対応の無い数値（「容量市場 ¥8,000 (2025年度実績)」）を外した。
  //   何を上側・下側に置いたかだけを書く。容量市場の数値は画面の Step 3 にカタログ値と年度つきで出している。
  // ★補助率・CAPEX の具体値は書かない（プリセットで変わり、説明文と入力値が食い違うため・Nv-0c レビュー）
  optimistic:
    '容量市場は全国値の過去最大（対象実需給年度）。スポット価差は大きめ、補助率は高め、CAPEX は低め（いずれも当サイトの想定）。',
  standard:
    '容量市場は全国値の中央値（対象実需給年度）。スポット価差・補助率・CAPEX は当サイトの想定の中位。',
  pessimistic:
    '容量市場は全国値の過去最小（対象実需給年度）。スポット価差は小さめ、補助なし、CAPEX は高め（いずれも当サイトの想定）。',
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
    // ★Nv-0c: 「高圧需要家標準」「SII 補助金 + 自治体併用前提」を外した（根拠の無い一般化・補助率を SII 由来に見せる書き方）
    description: '2 MW / 8 MWh・4 時間放電。CAPEX・補助率は当サイトの想定',
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
    description: '12.5 MW / 50 MWh・4 時間放電（当サイトの既定）',
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
