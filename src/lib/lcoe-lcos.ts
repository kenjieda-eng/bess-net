/**
 * src/lib/lcoe-lcos.ts
 *
 * LCOS（均等化蓄電原価）/ LCOE（均等化発電原価）計算ロジック（66番）。
 * 純関数のみ（'use client' 不要）。client component から import。
 *
 * 出典前提（L-EIC-019/055）:
 *  - 蓄電池CAPEX = NREL ATB（$/kW÷4h、USD/JPY換算、米国前提）。版と為替の月は nrel-atb-reference.ts / fx-reference.ts が出す。
 *  - 電源別 CAPEX・CF・LCOE参考 = NREL ATB（カタログ）。充電単価は概数（編集可）。
 *  - low/high は感度レンジ（mid±20%）＝当サイトの仮定で NREL の予測値そのものではない。
 *
 * 検証ワーク例（既定値）: 放電328.5/年・充電費¥3,865・O&M¥1,660・annuity(5%,15)=10.38
 *   → 分子140,344 / 分母3,409.7 → LCOS ≈ ¥41/kWh（≈$260/MWh）。
 */

import { DEPTH_OF_DISCHARGE, PROJECT_LIFETIME_YEARS, ROUND_TRIP_EFFICIENCY } from './storage-assumptions';

/** 年金現価係数 Σ_{t=1..N} 1/(1+r)^t（r=0 は N、N は実数可） */
export function annuityFactor(rate: number, years: number): number {
  if (years <= 0) return 0;
  if (rate === 0) return years;
  return (1 - Math.pow(1 + rate, -years)) / rate;
}

// ───────────────────────── LCOS ─────────────────────────
export interface LcosInput {
  capexJpyPerKwh: number;       // 蓄電容量1kWhあたり初期投資（¥/kWh）
  rte: number;                  // 往復効率 0–1
  cyclesPerYear: number;        // 年間サイクル数
  dod: number;                  // 放電深度 0–1
  chargePriceJpyPerKwh: number; // 充電単価（¥/kWh）
  omRate: number;               // 年間O&M（CAPEX比） 0–1
  discountRate: number;         // 割引率 0–1
  projectYears: number;         // 事業年数
  cycleLife: number;            // サイクル寿命（総サイクル数）
}

export interface LcosResult {
  lcosJpyPerKwh: number;
  lcosJpyPerMwh: number;
  lcosUsdPerMwh: number;
  n: number;                    // 実効年数 = min(projectYears, cycleLife/cyclesPerYear)
  annuity: number;
  dischargePerYear: number;     // kWh/年（容量1kWhあたり）
  chargeCostPerYear: number;
  omPerYear: number;
  // 内訳（¥/kWh・寄与%）
  capexContrib: number; omContrib: number; chargeContrib: number;
  capexPct: number; omPct: number; chargePct: number;
}

export function computeLCOS(inp: LcosInput, fxJpyPerUsd: number): LcosResult {
  const n = Math.min(inp.projectYears, inp.cyclesPerYear > 0 ? inp.cycleLife / inp.cyclesPerYear : inp.projectYears);
  const annuity = annuityFactor(inp.discountRate, n);
  const dischargePerYear = inp.cyclesPerYear * inp.dod;                     // kWh/年
  const chargeCostPerYear = inp.rte > 0 ? (dischargePerYear / inp.rte) * inp.chargePriceJpyPerKwh : 0;
  const omPerYear = inp.omRate * inp.capexJpyPerKwh;

  const denom = dischargePerYear * annuity;                                // 放電量の現在価値合計
  const capexContrib = denom > 0 ? inp.capexJpyPerKwh / denom : 0;
  const omContrib = denom > 0 ? (omPerYear * annuity) / denom : 0;
  const chargeContrib = denom > 0 ? (chargeCostPerYear * annuity) / denom : 0;
  const lcosJpyPerKwh = capexContrib + omContrib + chargeContrib;
  const pct = (x: number) => (lcosJpyPerKwh > 0 ? (x / lcosJpyPerKwh) * 100 : 0);

  return {
    lcosJpyPerKwh,
    lcosJpyPerMwh: lcosJpyPerKwh * 1000,
    lcosUsdPerMwh: fxJpyPerUsd > 0 ? (lcosJpyPerKwh * 1000) / fxJpyPerUsd : 0,
    n, annuity, dischargePerYear, chargeCostPerYear, omPerYear,
    capexContrib, omContrib, chargeContrib,
    capexPct: pct(capexContrib), omPct: pct(omContrib), chargePct: pct(chargeContrib),
  };
}

// ───────────────────────── LCOE ─────────────────────────
export interface LcoeInput {
  capexJpyPerKw: number;        // 発電設備CAPEX（¥/kW）
  cf: number;                   // 設備利用率 0–1
  omRate: number;               // 年間O&M（CAPEX比） 0–1
  fuelJpyPerKwh: number;        // 燃料費（¥/kWh、再エネ=0）
  discountRate: number;
  lifeYears: number;
}

export interface LcoeResult {
  lcoeJpyPerKwh: number;
  lcoeUsdPerMwh: number;
  annuity: number;
  energyPerYear: number;        // kWh/年（1kWあたり）= CF×8760
}

export function computeLCOE(inp: LcoeInput, fxJpyPerUsd: number): LcoeResult {
  const annuity = annuityFactor(inp.discountRate, inp.lifeYears);
  const energyPerYear = inp.cf * 8760;                                     // kWh/年/kW
  const omPerYear = inp.omRate * inp.capexJpyPerKw;
  const fuelPerYear = inp.fuelJpyPerKwh * energyPerYear;
  const numerator = inp.capexJpyPerKw + (omPerYear + fuelPerYear) * annuity;
  const denom = energyPerYear * annuity;
  const lcoeJpyPerKwh = denom > 0 ? numerator / denom : 0;
  return {
    lcoeJpyPerKwh,
    lcoeUsdPerMwh: fxJpyPerUsd > 0 ? (lcoeJpyPerKwh * 1000) / fxJpyPerUsd : 0,
    annuity, energyPerYear,
  };
}

// ───────────────────────── 既定値 ─────────────────────────
/**
 * LCOS 既定値（編集可。CAPEX は page.tsx から NREL ATB 実値で上書き）
 * ★Ck-1 A9: 往復効率・放電深度・事業年数は storage-assumptions.ts の 1 箇所に寄せた（IRR シミュレーターと同じ値）。
 */
export const LCOS_DEFAULTS: Omit<LcosInput, 'capexJpyPerKwh'> = {
  rte: ROUND_TRIP_EFFICIENCY.value,        // NREL ATB 2024 年版
  cyclesPerYear: 365,                      // 年1サイクル/日
  dod: DEPTH_OF_DISCHARGE.value,           // 当サイトの前提値（出所なし）
  chargePriceJpyPerKwh: 10,                // JEPXスポット平均の概数（¥/kWh）
  omRate: 0.02,                            // O&M 2%/年（CAPEX比）
  discountRate: 0.05,                      // 割引率 5%
  projectYears: PROJECT_LIFETIME_YEARS.value, // NREL ATB 2024 年版の寿命
  cycleLife: 6000,                         // サイクル寿命（LFP概数）
};

/*
 * 電源別の一覧と既定の設備利用率（CF）は src/lib/nrel-atb-reference.ts（POWER_SOURCE_REFS）へ移した（Ck-1 A8・2026-09-21）。
 * ★旧版はここに CF の概数を焼き込んでいた（太陽光 0.17・陸上風力 0.30・洋上風力 0.40・原子力 0.85・地熱 0.80・水力 0.45）。
 *   同じ画面で CAPEX と LCOE 参考値はカタログ（NREL ATB）を読んでいたため前提が混在し、
 *   ATB の CF（太陽光 26.3%・陸上風力 44.8%・洋上風力 45.3%・原子力 92.7%・地熱 90%・水力 33%）と食い違っていた。
 *   CF もカタログから出す。値を焼き込まない。
 */
/**
 * 簡易 LCOE 表に出さない電源（Ck-1a ■2-8・2026-09-22）。
 * 本ツールの簡易 LCOE は燃料費を 0 として計算する（LCOE_DEFAULTS.fuelJpyPerKwh）。燃料を使う電源に当てはめると
 * 実態より安い値が出るため、行ごと出さない。火力は NREL ATB に LCOE 系列が無く、もともと試算していない。
 */
export const LCOE_EXCLUDED_SOURCE_KEYS: ReadonlySet<string> = new Set(['nuclear']);
/** 画面に出す理由（1 行・表の直下と計算ロジック欄で同じ文を使う） */
export const LCOE_EXCLUDED_NOTE =
  '火力・原子力は燃料費がかかる電源で、燃料費を 0 とする本ツールの簡易計算では実際より安い値になるため、表に載せていません。';

/** LCOE 既定（編集可・概数） */
export const LCOE_DEFAULTS = {
  omRate: 0.02,        // O&M 2%/年（概数）
  fuelJpyPerKwh: 0,    // 燃料費（燃料を使う電源は LCOE_EXCLUDED_SOURCE_KEYS で表から外す）
  discountRate: 0.05,  // 割引率 5%
  lifeYears: 25,       // 設備寿命（概数）
};
