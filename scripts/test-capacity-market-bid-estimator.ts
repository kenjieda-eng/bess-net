#!/usr/bin/env tsx
/**
 * scripts/test-capacity-market-bid-estimator.ts
 *
 * 依頼AT 単体テスト (10+ 件)
 */

import { estimateBid, TREND_LABELS } from '../src/lib/capacity-market-bid-estimator';
import { getHistory, filterHistory } from '../src/lib/capacity-market-data';
import { HISTORY, AREA_LABELS, CATEGORY_LABELS } from '../src/data/capacity-market-history';

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

console.log('━━━ Group 1: データ層検証 ━━━');

// Test 1: HISTORY 件数 = 9 エリア × 3 区分 × 2 年度 = 54
assert(`HISTORY = 54 件`, HISTORY.length === 54, `actual=${HISTORY.length}`);

// Test 2: getHistory() 全件返却
assert(`getHistory() = 54 件`, getHistory().length === 54);

// Test 3: filterHistory(tokyo, existing) は 2 件 (2024 + 2025)
{
  const r = filterHistory('tokyo', 'existing');
  assert(`filterHistory(tokyo, existing) = 2 件`, r.length === 2, `actual=${r.length}`);
}

// Test 4: 全レコードに price > 0
{
  const allPositive = HISTORY.every((r) => r.clearing_price_yen_per_kw_year > 0);
  assert(`全レコード price > 0`, allPositive);
}

console.log('\n━━━ Group 2: 試算ロジック ━━━');

// Test 5: 東京/既設/50MW/2026/コスト 6000 円 → エラーなく結果返却
{
  const r = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  assert(`基本試算 結果オブジェクト`, r.recommended_bid_mid > 0, `mid=${r.recommended_bid_mid}`);
  assert(`historical sample_size = 2`, r.historical_context.sample_size === 2);
}

// Test 6: 東京/既設 area_avg は 8,200 前後 (8,500/2024 + 8,000/2025 の加重平均)
{
  const r = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  // 8,500 × 12,500 + 8,000 × 13,000 = 209,250,000、合計 capacity 25,500 → 加重平均 ~ 8,206
  const expected_avg = (8_500 * 12_500 + 8_000 * 13_000) / 25_500;
  assert(
    `東京既設 area_avg ≈ ${expected_avg.toFixed(0)}`,
    Math.abs(r.historical_context.area_avg - expected_avg) < 10,
    `actual=${r.historical_context.area_avg}, expected=${expected_avg.toFixed(0)}`
  );
}

// Test 7: 東京/既設 trend = falling (8500 → 8000、-5.9%)
{
  const r = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  assert(
    `東京既設 trend = falling`,
    r.historical_context.area_trend === 'falling',
    `actual=${r.historical_context.area_trend}, latest=${r.historical_context.latest_price}, prior=${r.historical_context.prior_price}`
  );
}

// Test 8: 推奨価格 low ≤ mid ≤ high
{
  const r = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  assert(
    `low ≤ mid ≤ high`,
    r.recommended_bid_low <= r.recommended_bid_mid &&
      r.recommended_bid_mid <= r.recommended_bid_high
  );
}

console.log('\n━━━ Group 3: 落札確率近似 ━━━');

// Test 9: 低価格応札 (低限) で確率高い、高価格 (上限) で確率低い
{
  const r = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  assert(
    `low_bid > mid_bid > high_bid 確率`,
    r.cleared_probability.low_bid > r.cleared_probability.mid_bid &&
      r.cleared_probability.mid_bid > r.cleared_probability.high_bid,
    `low=${r.cleared_probability.low_bid}, mid=${r.cleared_probability.mid_bid}, high=${r.cleared_probability.high_bid}`
  );
}

// Test 10: 確率は 0-100 範囲
{
  const r = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  const probs = [
    r.cleared_probability.low_bid,
    r.cleared_probability.mid_bid,
    r.cleared_probability.high_bid,
  ];
  const allInRange = probs.every((p) => p >= 0 && p <= 100);
  assert(`確率 ∈ [0, 100]`, allInRange);
}

console.log('\n━━━ Group 4: 警告ロジック ━━━');

// Test 11: 自社コストが過去平均×1.5超 → 警告
{
  const r = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 15_000, // 過去平均 8,200 の 1.5 倍超
  });
  const hasWarn = r.warnings.some((w) => w.includes('採算性'));
  assert(`自社コスト超過 警告あり`, hasWarn);
}

// Test 12: 2027 年度応札 → 不確実性警告
{
  const r = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2027,
    cost_yen_per_kw_year: 6_000,
  });
  const hasWarn = r.warnings.some((w) => w.includes('不確実性'));
  assert(`2027 年度応札 不確実性警告あり`, hasWarn);
}

// Test 13: モック版 disclaimer 警告は常にあり
{
  const r = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  const hasMockWarn = r.warnings.some((w) => w.includes('モック版'));
  assert(`モック版 disclaimer 警告`, hasMockWarn);
}

console.log('\n━━━ Group 5: エリア別差異 ━━━');

// Test 14: 北海道 vs 東京の既設価格差異あり
{
  const tokyo = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  const hokkaido = estimateBid({
    area: 'hokkaido',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  assert(
    `東京 area_avg ≠ 北海道 area_avg`,
    tokyo.historical_context.area_avg !== hokkaido.historical_context.area_avg,
    `tokyo=${tokyo.historical_context.area_avg}, hokkaido=${hokkaido.historical_context.area_avg}`
  );
}

// Test 15: 新設 vs 既設の価格差 (新設 > 既設、業界一般)
{
  const newR = estimateBid({
    area: 'tokyo',
    category: 'new',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  const exR = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 50,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  assert(
    `新設 mid > 既設 mid`,
    newR.recommended_bid_mid > exR.recommended_bid_mid,
    `new=${newR.recommended_bid_mid}, existing=${exR.recommended_bid_mid}`
  );
}

console.log('\n━━━ Group 6: 収入試算 ━━━');

// Test 16: capacity_mw × mid × 1000 / 1e8 = 億円
{
  const r = estimateBid({
    area: 'tokyo',
    category: 'existing',
    capacity_mw: 100,
    target_fiscal_year: 2026,
    cost_yen_per_kw_year: 6_000,
  });
  const expected = (100 * 1000 * r.recommended_bid_mid) / 1e8;
  assert(
    `収入試算 = capacity × mid / 1e5`,
    Math.abs(r.estimated_annual_revenue_oku - expected) < 0.01,
    `actual=${r.estimated_annual_revenue_oku.toFixed(2)}, expected=${expected.toFixed(2)}`
  );
}

console.log(`\n━━━ 結果: ${pass}/${pass + fail} PASS ━━━`);
if (fail > 0) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
