/**
 * src/lib/lcoe-lcos.ts
 *
 * LCOS（均等化蓄電原価）/ LCOE（均等化発電原価）計算ロジック（66番）。
 * 純関数のみ（'use client' 不要）。client component から import。
 *
 * 出典前提（L-EIC-019/055）:
 *  - 蓄電池CAPEX = NREL ATB 2024（$/kW÷4h、USD/JPY換算、米国前提）。
 *  - 電源別 CAPEX/LCOE参考 = NREL ATB 2024。CF代表値・充電単価は概数（編集可）。
 *  - low/high は感度レンジ（mid±20%）＝当サイトの仮定で NREL の予測値そのものではない。
 *
 * 検証ワーク例（既定値）: 放電328.5/年・充電費¥3,865・O&M¥1,660・annuity(5%,15)=10.38
 *   → 分子140,344 / 分母3,409.7 → LCOS ≈ ¥41/kWh（≈$260/MWh）。
 */

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
/** LCOS 既定値（編集可・出典付き。CAPEX は page.tsx から NREL ATB 実値で上書き） */
export const LCOS_DEFAULTS: Omit<LcosInput, 'capexJpyPerKwh'> = {
  rte: 0.85,                // 往復効率 85%（概数）
  cyclesPerYear: 365,       // 年1サイクル/日
  dod: 0.90,                // 放電深度 90%
  chargePriceJpyPerKwh: 10, // JEPXスポット平均の概数（¥/kWh）
  omRate: 0.02,             // O&M 2%/年（CAPEX比）
  discountRate: 0.05,       // 割引率 5%
  projectYears: 15,         // 事業年数
  cycleLife: 6000,          // サイクル寿命（LFP概数）
};

/** 電源別 LCOE の代表値（CF・出典は spec 準拠。CAPEX/LCOE参考は NREL ATB 実値を page.tsx で注入） */
export interface PowerSourceMeta {
  key: string;
  label: string;
  cfDefault: number;        // 代表 CF 0–1（概数・編集可）
}
export const POWER_SOURCES: PowerSourceMeta[] = [
  { key: 'utility-pv',     label: '太陽光（事業用）', cfDefault: 0.17 },
  { key: 'onshore-wind',   label: '陸上風力',         cfDefault: 0.30 },
  { key: 'offshore-wind',  label: '洋上風力',         cfDefault: 0.40 },
  { key: 'nuclear',        label: '原子力',           cfDefault: 0.85 },
  { key: 'geothermal',     label: '地熱',             cfDefault: 0.80 },
  { key: 'hydro',          label: '水力',             cfDefault: 0.45 },
];

/** LCOE 既定（編集可・概数） */
export const LCOE_DEFAULTS = {
  omRate: 0.02,        // O&M 2%/年（概数）
  fuelJpyPerKwh: 0,    // 燃料費（再エネ=0、原子力等は概数で別途）
  discountRate: 0.05,  // 割引率 5%
  lifeYears: 25,       // 設備寿命（概数）
};
