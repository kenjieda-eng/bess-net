/**
 * src/lib/irr-calculator.ts
 *
 * 蓄電池IRRシミュレーター 計算ロジック (依頼AM)
 *
 * 純粋関数のみ。React 依存なし、Next.js 依存なし → 単体テスト容易。
 *
 * 計算モデル:
 *   - 年次キャッシュフロー = arbitrage + capacity_market + ancillary - opex
 *   - 初期投資 = capex × (1 - subsidy_rate/100)
 *   - degradation: 年 1% 容量低下 (20年で 80%)、arbitrage のみ影響
 *   - IRR: Newton-Raphson 法 (NPV(r) = 0 を解く)
 *   - NPV: 標準 DCF
 *   - Payback: 累積CFが初期投資を超えるまでの年数 (線形補間)
 *
 * 落とし穴 #92 対応: 副作用なし、React state 操作なし、純粋関数。
 */

export interface IRRInput {
  /** 定格容量 (MWh) */
  capacity_mwh: number;
  /** 定格出力 (MW) */
  output_mw: number;
  /** 充放電効率 (%) e.g., 88 */
  efficiency: number;
  /** 設備耐用年数 (年) e.g., 20 */
  lifespan_years: number;
  /** 年間サイクル数 e.g., 365 */
  cycles_per_year: number;
  /** 放電深度 (%) e.g., 85 */
  dod: number;
  /** 初期投資 (億円) */
  capex_oku: number;
  /** 年間運用費 (円/MW/年) e.g., 5,000,000 */
  opex_yen_per_mw_year: number;
  /** 補助金率 (%) e.g., 33 */
  subsidy_rate: number;
  /** スポット高値 (円/kWh) */
  spot_high: number;
  /** スポット低値 (円/kWh) */
  spot_low: number;
  /** 容量市場収入 (円/kW/年) */
  capacity_market_yen_per_kw_year: number;
  /** 需給調整対価 (円/kW/月) */
  ancillary_yen_per_kw_month: number;
  /** 割引率 (NPV 計算用、%) e.g., 5 */
  discount_rate?: number;
}

export interface CashflowYear {
  year: number;
  /** 累積キャッシュフロー (億円) */
  cumulative: number;
  /** 年次キャッシュフロー (億円) */
  yearly: number;
  /** その年の劣化後容量 (MWh) */
  effective_capacity_mwh: number;
}

export interface IRRResult {
  /** IRR (%) e.g., 6.5 */
  irr: number | null;
  /** NPV (億円) */
  npv: number;
  /** ペイバック (年、未達なら null) */
  payback_years: number | null;
  /** 補助金控除後の初期投資 (億円) */
  initial_investment_oku: number;
  /** 累積CF推移 */
  cashflow: CashflowYear[];
  /** デバッグ用: 年間平均収益内訳 (1年目、億円/年) */
  revenue_breakdown_yr1: {
    arbitrage: number;
    capacity_market: number;
    ancillary: number;
    opex: number;
  };
}

export interface SensitivityResult {
  baseline_irr: number | null;
  spot_price_plus_10pct_irr: number | null;
  spot_price_minus_10pct_irr: number | null;
  capacity_market_plus_10pct_irr: number | null;
  capacity_market_minus_10pct_irr: number | null;
}

// ──────────────────────────────────────────
// 1 年あたり収益計算
// ──────────────────────────────────────────

/**
 * arbitrage (アービトラージ) 収益 (円/年)
 *
 * arbitrage_kwh_per_year = cycles × capacity_mwh × 1000 × (DoD/100) × (efficiency/100)
 * arbitrage_yen_per_year = arbitrage_kwh × (spot_high - spot_low)
 *
 * 注: charge 時に spot_low で買い、discharge 時に spot_high で売る前提。
 *     往復効率を考慮 (charge した分だけ discharge できる)
 */
export function arbitrageRevenueYen(input: IRRInput, degradation_factor = 1): number {
  const usable_kwh_per_cycle =
    input.capacity_mwh * 1000 * (input.dod / 100) * (input.efficiency / 100) * degradation_factor;
  const arbitrage_kwh_per_year = input.cycles_per_year * usable_kwh_per_cycle;
  const profit_per_kwh = Math.max(0, input.spot_high - input.spot_low);
  return arbitrage_kwh_per_year * profit_per_kwh;
}

/** 容量市場収益 (円/年) */
export function capacityMarketRevenueYen(input: IRRInput): number {
  const kw = input.output_mw * 1000;
  return kw * input.capacity_market_yen_per_kw_year;
}

/** 需給調整収益 (円/年、月額 × 12) */
export function ancillaryRevenueYen(input: IRRInput): number {
  const kw = input.output_mw * 1000;
  return kw * input.ancillary_yen_per_kw_month * 12;
}

/** 年間 OPEX (円/年) */
export function opexYen(input: IRRInput): number {
  return input.opex_yen_per_mw_year * input.output_mw;
}

/**
 * 劣化係数 (1年目=1.0、以降 1% ずつ低下、下限 0.7)
 * arbitrage 収益にのみ適用 (capacity 市場・ancillary は契約上の名目容量で固定とする)
 */
export function degradationFactor(year: number): number {
  // year=1 → 1.0、year=2 → 0.99、...、year=20 → 0.81
  const f = Math.max(0.7, 1 - 0.01 * Math.max(0, year - 1));
  return f;
}

/**
 * 年次キャッシュフロー (円/年、補助金 + 初期投資は含まない)
 */
export function annualCashflowYen(input: IRRInput, year: number): number {
  const deg = degradationFactor(year);
  const arbitrage = arbitrageRevenueYen(input, deg);
  const cap_market = capacityMarketRevenueYen(input);
  const ancillary = ancillaryRevenueYen(input);
  const opex = opexYen(input);
  return arbitrage + cap_market + ancillary - opex;
}

// ──────────────────────────────────────────
// IRR / NPV / Payback
// ──────────────────────────────────────────

/**
 * NPV (Net Present Value、億円)
 * 入力 r: 割引率 (decimal、e.g., 0.05 for 5%)
 */
export function calcNPV(input: IRRInput, r: number): number {
  const initial_investment_yen = input.capex_oku * 1e8 * (1 - input.subsidy_rate / 100);
  let npv_yen = -initial_investment_yen;
  for (let t = 1; t <= input.lifespan_years; t++) {
    const cf = annualCashflowYen(input, t);
    npv_yen += cf / Math.pow(1 + r, t);
  }
  return npv_yen / 1e8; // 円 → 億円
}

/**
 * IRR (Internal Rate of Return、%)
 * Newton-Raphson 法で NPV(r) = 0 を解く。
 * 収束しない or 解なし時は null を返す。
 *
 * 戦略: bisection (二分法) で粗く [-50%, +200%] の範囲を探索 → 解見つかれば
 *       Newton-Raphson で精度向上。bisection が pure な robust 解法。
 */
export function calcIRR(input: IRRInput): number | null {
  // f(r) = NPV(input, r) (in oku)
  const f = (r: number): number => calcNPV(input, r);

  // NPV(0) が負の場合、IRR は存在しない (利益ゼロ以下) → null
  // NPV(0) > 0、NPV(2.0) < 0 のような区間で二分法
  // 探索範囲: -50% to +200%
  const lo_init = -0.5;
  const hi_init = 2.0;
  const f_lo = f(lo_init);
  const f_hi = f(hi_init);

  // 区間内に符号変化がない場合 IRR 解なし
  if (f_lo * f_hi > 0) {
    // 試しに -0.99 to +5.0 まで広げる
    const f_extra_lo = f(-0.99);
    const f_extra_hi = f(5.0);
    if (f_extra_lo * f_extra_hi > 0) return null;
    return bisection(f, -0.99, 5.0);
  }
  return bisection(f, lo_init, hi_init);
}

/**
 * Bisection 法 (二分法)
 * f(lo) と f(hi) が異符号であることが前提
 * 100 回反復で 1e-6 精度を確保
 */
function bisection(f: (r: number) => number, lo: number, hi: number): number {
  let a = lo;
  let b = hi;
  let fa = f(a);
  for (let i = 0; i < 100; i++) {
    const mid = (a + b) / 2;
    const fm = f(mid);
    if (Math.abs(fm) < 1e-6) return mid * 100; // 円換算精度 1e-6 oku = 100円程度で十分
    if (fa * fm < 0) {
      b = mid;
    } else {
      a = mid;
      fa = fm;
    }
    if (Math.abs(b - a) < 1e-8) break;
  }
  return ((a + b) / 2) * 100;
}

/**
 * Payback 期間 (年、累積CFが初期投資を超える年、線形補間)
 * 未達なら null
 */
export function calcPayback(input: IRRInput): number | null {
  const initial_investment_oku = input.capex_oku * (1 - input.subsidy_rate / 100);
  let cumulative_oku = -initial_investment_oku;
  let prev_cumulative = cumulative_oku;
  for (let t = 1; t <= input.lifespan_years; t++) {
    const cf_yen = annualCashflowYen(input, t);
    const cf_oku = cf_yen / 1e8;
    prev_cumulative = cumulative_oku;
    cumulative_oku += cf_oku;
    if (cumulative_oku >= 0) {
      // 線形補間: prev_cumulative (< 0) から cumulative (>= 0) で 0 を跨ぐ点
      const fraction = -prev_cumulative / cf_oku;
      return (t - 1) + fraction;
    }
  }
  return null; // 未達
}

/**
 * すべての結果を一括計算
 */
export function calculateAll(input: IRRInput): IRRResult {
  const initial_investment_oku = input.capex_oku * (1 - input.subsidy_rate / 100);
  const discount_rate = (input.discount_rate ?? 5) / 100;

  const irr = calcIRR(input);
  const npv = calcNPV(input, discount_rate);
  const payback_years = calcPayback(input);

  // 年次キャッシュフロー
  let cumulative_oku = -initial_investment_oku;
  const cashflow: CashflowYear[] = [
    {
      year: 0,
      cumulative: cumulative_oku,
      yearly: -initial_investment_oku,
      effective_capacity_mwh: input.capacity_mwh,
    },
  ];
  for (let t = 1; t <= input.lifespan_years; t++) {
    const cf_oku = annualCashflowYen(input, t) / 1e8;
    cumulative_oku += cf_oku;
    cashflow.push({
      year: t,
      cumulative: cumulative_oku,
      yearly: cf_oku,
      effective_capacity_mwh: input.capacity_mwh * degradationFactor(t),
    });
  }

  // 1年目内訳
  const yr1_arbitrage = arbitrageRevenueYen(input, degradationFactor(1)) / 1e8;
  const yr1_cap = capacityMarketRevenueYen(input) / 1e8;
  const yr1_anc = ancillaryRevenueYen(input) / 1e8;
  const yr1_opex = opexYen(input) / 1e8;

  return {
    irr,
    npv,
    payback_years,
    initial_investment_oku,
    cashflow,
    revenue_breakdown_yr1: {
      arbitrage: yr1_arbitrage,
      capacity_market: yr1_cap,
      ancillary: yr1_anc,
      opex: yr1_opex,
    },
  };
}

/**
 * 感応度分析: スポット価格 ±10% / 容量市場 ±10% で IRR がどう変わるか
 */
export function calculateSensitivity(input: IRRInput): SensitivityResult {
  const baseline_irr = calcIRR(input);

  // スポット価格 ±10%
  const spot_diff = input.spot_high - input.spot_low;
  const spot_plus: IRRInput = {
    ...input,
    spot_high: input.spot_low + spot_diff * 1.1,
  };
  const spot_minus: IRRInput = {
    ...input,
    spot_high: input.spot_low + spot_diff * 0.9,
  };

  // 容量市場 ±10%
  const cap_plus: IRRInput = {
    ...input,
    capacity_market_yen_per_kw_year: input.capacity_market_yen_per_kw_year * 1.1,
  };
  const cap_minus: IRRInput = {
    ...input,
    capacity_market_yen_per_kw_year: input.capacity_market_yen_per_kw_year * 0.9,
  };

  return {
    baseline_irr,
    spot_price_plus_10pct_irr: calcIRR(spot_plus),
    spot_price_minus_10pct_irr: calcIRR(spot_minus),
    capacity_market_plus_10pct_irr: calcIRR(cap_plus),
    capacity_market_minus_10pct_irr: calcIRR(cap_minus),
  };
}
