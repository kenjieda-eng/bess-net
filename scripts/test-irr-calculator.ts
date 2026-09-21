#!/usr/bin/env tsx
/**
 * scripts/test-irr-calculator.ts
 *
 * 依頼AM 単体テスト (10+ 件、純粋関数の正確性検証)
 *
 * 実行: npx tsx scripts/test-irr-calculator.ts
 */

import {
  arbitrageRevenueYen,
  capacityMarketRevenueYen,
  ancillaryRevenueYen,
  opexYen,
  degradationFactor,
  annualCashflowYen,
  calcNPV,
  calcIRR,
  calcPayback,
  calculateAll,
  calculateSensitivity,
  type IRRInput,
} from '../src/lib/irr-calculator';
import { getScenarioInput, SCENARIO_DEFAULTS } from '../src/lib/irr-defaults';
import { CAPACITY_MARKET_NATIONAL } from '../src/lib/capacity-market-defaults';
import * as fs from 'node:fs';
import * as path from 'node:path';

let pass = 0;
let fail = 0;
const failures: string[] = [];

function assert(label: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    failures.push(`${label}${detail ? ` — ${detail}` : ''}`);
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}

function approx(a: number | null, b: number, tol: number): boolean {
  if (a === null) return false;
  return Math.abs(a - b) < tol;
}

// 標準シナリオを基準入力とする
const STD = getScenarioInput('standard');

console.log('━━━ Group 1: 基本収益計算 ━━━');

// Test 1: arbitrage 収益 (劣化なし、1年目想定)
{
  // 50 MWh × 1000 (kWh) × 0.85 (DoD) × 0.88 (eff) = 37,400 kWh/cycle
  // 365 cycles × 37,400 = 13,651,000 kWh/year
  // (23-9) ¥/kWh × 13,651,000 = ¥191,114,000 ≈ ¥191.11M
  const result = arbitrageRevenueYen(STD, 1);
  assert(
    'arbitrage 標準 1 年目: ~¥191M',
    approx(result, 191_114_000, 2_000_000),
    `actual=¥${Math.round(result / 1e6)}M`
  );
}

// Test 2: 容量市場 収益（★Nv-0c: 既定値はカタログの national 中央値。旧 8,000 は一次に対応が無かった）
{
  // 12.5 MW × 1000 kW × national 中央値
  const expected = 12.5 * 1000 * (CAPACITY_MARKET_NATIONAL.median ?? NaN);
  const result = capacityMarketRevenueYen(STD);
  assert(
    `容量市場 標準: ¥${Math.round(expected / 1e6)}M（12.5MW × national 中央値 ${CAPACITY_MARKET_NATIONAL.median}）`,
    approx(result, expected, 1),
    `actual=¥${result}`
  );
}

// Test 2b: ★既定値がカタログ由来であること（落ちるべきときに落ちる形）
//   カタログの JSON を別経路で読み、中央値・最大・最小を独立に計算して、3 シナリオの既定値と突き合わせる。
{
  const raw = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'src/data/eic/capacity-main-auction-price-national.json'), 'utf8'),
  ) as { points: { date: string; value: number | null }[] };
  const vals = raw.points.map((p) => p.value).filter((v): v is number => typeof v === 'number').sort((a, b) => a - b);
  const n = vals.length;
  const med = n % 2 ? vals[(n - 1) / 2] : (vals[n / 2 - 1] + vals[n / 2]) / 2;
  assert(`national の観測値が 1 件以上（${n} 件）`, n > 0);
  assert(`標準 = national 中央値（${med}）`, SCENARIO_DEFAULTS.standard.capacity_market_yen_per_kw_year === med,
    `actual=${SCENARIO_DEFAULTS.standard.capacity_market_yen_per_kw_year}`);
  assert(`楽観 = national 最大（${vals[n - 1]}）`, SCENARIO_DEFAULTS.optimistic.capacity_market_yen_per_kw_year === vals[n - 1],
    `actual=${SCENARIO_DEFAULTS.optimistic.capacity_market_yen_per_kw_year}`);
  assert(`悲観 = national 最小（${vals[0]}）`, SCENARIO_DEFAULTS.pessimistic.capacity_market_yen_per_kw_year === vals[0],
    `actual=${SCENARIO_DEFAULTS.pessimistic.capacity_market_yen_per_kw_year}`);
  assert('旧既定値 8,000 / 12,000 / 5,000 はどのシナリオにも残っていない',
    !(['optimistic', 'standard', 'pessimistic'] as const).some((k) =>
      [8_000, 12_000, 5_000].includes(SCENARIO_DEFAULTS[k].capacity_market_yen_per_kw_year)));
}

// Test 3: 需給調整 収益（★Nv-0c: 既定値を置かない＝0。式は手入力値で検査する）
{
  assert('需給調整 既定値: 3 シナリオとも 0',
    (['optimistic', 'standard', 'pessimistic'] as const).every((k) => SCENARIO_DEFAULTS[k].ancillary_yen_per_kw_month === 0));
  // 式の検査: 12.5 MW × 1000 kW × ¥1,000/月 × 12 = ¥150M（入力値はテスト用の任意値）
  const result = ancillaryRevenueYen({ ...STD, ancillary_yen_per_kw_month: 1_000 });
  assert('需給調整 式: 12.5MW × ¥1,000/月 × 12 = ¥150M', approx(result, 150_000_000, 1), `actual=¥${result}`);
}

// Test 4: OPEX
{
  // 12.5 MW × ¥5M = ¥62.5M
  const result = opexYen(STD);
  assert('OPEX 標準: ¥62.5M', approx(result, 62_500_000, 1));
}

console.log('\n━━━ Group 2: 劣化係数 ━━━');

// Test 5: 1年目は劣化なし
assert('劣化係数 1 年目: 1.0', degradationFactor(1) === 1.0);

// Test 6: 2 年目で 1% 低下
assert('劣化係数 2 年目: 0.99', Math.abs(degradationFactor(2) - 0.99) < 1e-9);

// Test 7: 20 年目で 81%
assert(
  '劣化係数 20 年目: 0.81',
  Math.abs(degradationFactor(20) - 0.81) < 1e-9,
  `actual=${degradationFactor(20)}`
);

// Test 8: 100 年目でも下限 0.7 でクリップ
assert(
  '劣化係数 下限 0.7 でクリップ',
  degradationFactor(100) === 0.7
);

console.log('\n━━━ Group 3: 年次キャッシュフロー ━━━');

// Test 9: 1年目 CF = revenue - opex（各項目を独立に足して突き合わせる）
{
  const cf = annualCashflowYen(STD, 1);
  const expected =
    arbitrageRevenueYen(STD, 1) + capacityMarketRevenueYen(STD) + ancillaryRevenueYen(STD) - opexYen(STD);
  assert(
    `1年目 CF 標準 = 裁定 + 容量 + 需給 − OPEX（¥${Math.round(expected / 1e6)}M）`,
    approx(cf, expected, 1),
    `actual=¥${Math.round(cf / 1e6)}M`
  );
}

console.log('\n━━━ Group 4: NPV / IRR / Payback (標準シナリオ) ━━━');

// Test 10: 標準シナリオ IRR が現実的範囲 (3-30%、マルチユース併用前提の単純加算モデル)
{
  const irr = calcIRR(STD);
  // 注: ロジック上「容量市場/需給調整/アービトラージ」を全て加算する単純モデル。
  // 現実はマルチユース時間配分で trade-off が発生するため、本シミュレーターは
  // 「全市場併用が可能な前提での理論上限」を示す。UI 側で disclaimer 明記。
  assert(
    `標準 IRR ∈ [3%, 30%] (全市場併用前提)`,
    irr !== null && irr >= 3 && irr <= 30,
    `actual=${irr?.toFixed(2)}%`
  );
}

// Test 11: 楽観 IRR > 標準 IRR > 悲観 IRR
{
  const opt_irr = calcIRR(getScenarioInput('optimistic'));
  const std_irr = calcIRR(getScenarioInput('standard'));
  const pes_irr = calcIRR(getScenarioInput('pessimistic'));
  assert(
    '楽観 IRR > 標準 IRR > 悲観 IRR',
    opt_irr !== null &&
      std_irr !== null &&
      pes_irr !== null &&
      opt_irr > std_irr &&
      std_irr > pes_irr,
    `opt=${opt_irr?.toFixed(1)}%, std=${std_irr?.toFixed(1)}%, pes=${pes_irr?.toFixed(1)}%`
  );
}

// Test 12: NPV 標準シナリオ (5% 割引、ライフサイクル 20 年)
{
  const npv = calcNPV(STD, 0.05);
  // 規模は既定値に依存するため固定しない（Nv-0c で既定値をカタログ由来に変更。2026-09-21 時点の実測は年 CF 約 2.61 億・NPV 約 13.24 億）
  assert(
    '標準 NPV @5%: 正の値',
    npv > 0,
    `actual=${npv.toFixed(2)}億円`
  );
}

// Test 13: Payback 期間 (標準で 5-20 年に収まる)
{
  const pb = calcPayback(STD);
  assert(
    `標準 Payback ∈ [3, 20] 年`,
    pb !== null && pb >= 3 && pb <= 20,
    `actual=${pb?.toFixed(2)}年`
  );
}

console.log('\n━━━ Group 5: エッジケース ━━━');

// Test 14: spot_high < spot_low → arbitrage = 0
{
  const bad: IRRInput = { ...STD, spot_high: 5, spot_low: 10 };
  const result = arbitrageRevenueYen(bad, 1);
  assert('arbitrage spot_high<spot_low: 0', result === 0);
}

// Test 15: 補助金 100% で initial_investment = 0、IRR = ∞ (実装上は high value or null)
{
  const free: IRRInput = { ...STD, subsidy_rate: 100 };
  const irr = calcIRR(free);
  // initial = 0 で全 CF が正、IRR は理論上 ∞ → 上限 200% を返すか null
  assert(
    '補助金 100% で IRR 大幅高 or null',
    irr === null || irr > 50,
    `actual=${irr}`
  );
}

// Test 16: 悲観シナリオでも payback < lifespan ならビジネスとして成立 (情報のみ)
{
  const pes = getScenarioInput('pessimistic');
  const pb = calcPayback(pes);
  console.log(`  ℹ️ 悲観シナリオ payback: ${pb !== null ? pb.toFixed(1) + '年' : '未達'} (情報)`);
  pass++; // 純粋情報、必ず PASS
}

console.log('\n━━━ Group 6: 統合 calculateAll / Sensitivity ━━━');

// Test 17: calculateAll が cashflow を lifespan+1 件返す (year 0..lifespan)
{
  const r = calculateAll(STD);
  assert(
    `calculateAll: cashflow 件数 = lifespan+1 (${STD.lifespan_years + 1})`,
    r.cashflow.length === STD.lifespan_years + 1
  );
}

// Test 18: cashflow.year=0 は initial investment 反映
{
  const r = calculateAll(STD);
  const cf0 = r.cashflow[0];
  const expected = -STD.capex_oku * (1 - STD.subsidy_rate / 100);
  assert(
    `cashflow[0].cumulative = -initial (${expected.toFixed(2)}億円)`,
    Math.abs(cf0.cumulative - expected) < 0.01
  );
}

// Test 19: Sensitivity: spot_high +10% で IRR 上昇
{
  const s = calculateSensitivity(STD);
  assert(
    'Sensitivity spot+10% > baseline',
    s.baseline_irr !== null &&
      s.spot_price_plus_10pct_irr !== null &&
      s.spot_price_plus_10pct_irr > s.baseline_irr,
    `base=${s.baseline_irr?.toFixed(2)}, +10%=${s.spot_price_plus_10pct_irr?.toFixed(2)}`
  );
}

// Test 20: Sensitivity: capacity_market -10% で IRR 低下
{
  const s = calculateSensitivity(STD);
  assert(
    'Sensitivity cap_market-10% < baseline',
    s.baseline_irr !== null &&
      s.capacity_market_minus_10pct_irr !== null &&
      s.capacity_market_minus_10pct_irr < s.baseline_irr,
    `base=${s.baseline_irr?.toFixed(2)}, -10%=${s.capacity_market_minus_10pct_irr?.toFixed(2)}`
  );
}

// ──────────────────────────────────────
// 結果
// ──────────────────────────────────────
console.log(`\n━━━ 結果: ${pass}/${pass + fail} PASS ━━━`);
if (fail > 0) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
