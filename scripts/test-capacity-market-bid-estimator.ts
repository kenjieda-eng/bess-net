#!/usr/bin/env tsx
/**
 * scripts/test-capacity-market-bid-estimator.ts
 *
 * 容量市場応札試算の単体テスト（依頼AT → Nv-0b ■2 で実データ経路に書き直し・2026-09-21）
 *
 * ★何が変わったか
 *   旧版はモック（src/data/capacity-market-history.ts）の値を期待値として固定していた:
 *     - 「HISTORY = 54 件」「東京既設 area_avg ≈ (8,500×12,500＋8,000×13,000)/25,500」
 *     - 「新設 mid > 既設 mid（業界一般）」
 *   最後のものは**一次に反する関係をテストで強制していた**。OCCTO の約定価格はエリア単位で区分非依存で、
 *   区分別の約定価格という指標自体が一次に存在しない。モックの値を守るテストは、モックの誤りを守る。
 *   → 期待値は固定値でなく、カタログ（OCCTO 公表値）から独立に計算して突き合わせる形にした。
 *     カタログが改訂されてもテストは壊れず、試算ロジックの誤りだけを検出する。
 *
 * 実行: npx tsx scripts/test-capacity-market-bid-estimator.ts
 *   ★src/data/eic は prebuild（npm run precompute-eic-data）が生成する。未生成なら失敗として止まる。
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { estimateBidWithHistory, type BidEstimateInput } from '../src/lib/capacity-market-bid-estimator';
import type { Area, CapacityMarketRecord } from '../src/lib/capacity-market-types';
export {};

const EIC_DIR = path.join(process.cwd(), 'src', 'data', 'eic');
const AREAS: Area[] = ['hokkaido', 'tohoku', 'tokyo', 'chubu', 'hokuriku', 'kansai', 'chugoku', 'shikoku', 'kyushu'];

type Series = { points?: { date: string; value: number | null }[] };

function readSeries(id: string): Series | null {
  const p = path.join(EIC_DIR, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8')) as Series;
}

/**
 * カタログから CapacityMarketRecord[] を組み立てる（page.tsx の buildLiveHistory と同じ意味）。
 * ★page の関数を import できない（App Router の page.tsx は既定以外の export を持てない）ため、
 *   テスト用に最小限を書く。date は対象実需給年度の開始日（cutoff_semantics: "delivery"）。
 */
function buildFromCatalog(): CapacityMarketRecord[] {
  const out: CapacityMarketRecord[] = [];
  for (const area of AREAS) {
    const price = readSeries(`capacity-main-auction-price-${area}`);
    const volume = readSeries(`capacity-main-auction-volume-${area}`);
    if (!price || !volume) continue;
    for (const pt of price.points ?? []) {
      if (pt.value === null) continue;
      const vol = volume.points?.find((v) => v.date === pt.date)?.value;
      if (vol === null || vol === undefined) continue;
      out.push({
        fiscal_year: Number(pt.date.slice(0, 4)),
        area,
        clearing_price_yen_per_kw_year: pt.value,
        cleared_capacity_mw: vol / 1000,
      });
    }
  }
  return out;
}

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

const HISTORY = buildFromCatalog();
if (HISTORY.length === 0) {
  console.error('[中止] カタログ（src/data/eic/capacity-main-auction-*.json）が無い。npm run precompute-eic-data を先に実行する。');
  process.exit(1);
}

const base = (over: Partial<BidEstimateInput> = {}): BidEstimateInput => ({
  area: 'tokyo',
  capacity_mw: 50,
  target_fiscal_year: 2026,
  cost_yen_per_kw_year: 6_000,
  ...over,
});

/** 独立計算: エリアの約定容量加重平均（試算ロジックと同じ定義を、別に書いて突き合わせる） */
function weightedAvg(area: Area): number {
  const rs = HISTORY.filter((r) => r.area === area);
  const cap = rs.reduce((a, r) => a + r.cleared_capacity_mw, 0);
  return cap > 0 ? rs.reduce((a, r) => a + r.clearing_price_yen_per_kw_year * r.cleared_capacity_mw, 0) / cap : 0;
}

console.log('━━━ Group 1: データ（カタログ＝OCCTO 公表値）━━━');

// Test 1: 9 エリアすべてにレコードがある
{
  const areasWithData = new Set(HISTORY.map((r) => r.area));
  assert(`9 エリアすべてにデータ`, areasWithData.size === 9, `actual=${areasWithData.size}`);
}

// Test 2: ★区分の軸が無い — 同じエリア・同じ対象実需給年度のレコードは 1 件だけ
//   （旧モックは区分ごとに 3 件あった。一次の約定価格は区分非依存）
{
  const keys = HISTORY.map((r) => `${r.area}|${r.fiscal_year}`);
  const dup = keys.length - new Set(keys).size;
  assert(`エリア × 対象実需給年度で重複なし（区分の軸が無い）`, dup === 0, `重複 ${dup} 件`);
}

// Test 3: 全レコード price > 0
assert(`全レコード price > 0`, HISTORY.every((r) => r.clearing_price_yen_per_kw_year > 0));

console.log('\n━━━ Group 2: 試算ロジック ━━━');

// Test 4: 基本試算が結果を返す・サンプル数 = 東京の年度数
{
  const r = estimateBidWithHistory(base(), HISTORY);
  const n = HISTORY.filter((x) => x.area === 'tokyo').length;
  assert(`基本試算 結果オブジェクト`, r.recommended_bid_mid > 0, `mid=${r.recommended_bid_mid}`);
  assert(`sample_size = 東京の年度数（${n}）`, r.historical_context.sample_size === n, `actual=${r.historical_context.sample_size}`);
}

// Test 5: area_avg = 約定容量加重平均（独立計算と一致）
{
  const r = estimateBidWithHistory(base(), HISTORY);
  const expected = Math.round(weightedAvg('tokyo'));
  assert(
    `東京 area_avg = 約定容量加重平均（${expected}）`,
    r.historical_context.area_avg === expected,
    `actual=${r.historical_context.area_avg}`,
  );
}

// Test 6: trend は直近 2 年度の変化から（±5% の閾値）
{
  const r = estimateBidWithHistory(base(), HISTORY);
  const t = HISTORY.filter((x) => x.area === 'tokyo').sort((a, b) => b.fiscal_year - a.fiscal_year);
  const ratio = (t[0].clearing_price_yen_per_kw_year - t[1].clearing_price_yen_per_kw_year) / t[1].clearing_price_yen_per_kw_year;
  const expected = ratio > 0.05 ? 'rising' : ratio < -0.05 ? 'falling' : 'flat';
  assert(
    `東京 trend = ${expected}（直近 2 年度の変化 ${(ratio * 100).toFixed(1)}%）`,
    r.historical_context.area_trend === expected,
    `actual=${r.historical_context.area_trend}`,
  );
}

// Test 7: 推奨価格 low ≤ mid ≤ high
{
  const r = estimateBidWithHistory(base(), HISTORY);
  assert(`low ≤ mid ≤ high`, r.recommended_bid_low <= r.recommended_bid_mid && r.recommended_bid_mid <= r.recommended_bid_high);
}

console.log('\n━━━ Group 3: 落札確率近似（モデル仮定）━━━');

// Test 8: 低い応札ほど確率が高い
{
  const r = estimateBidWithHistory(base({ cost_yen_per_kw_year: 0 }), HISTORY);
  const p = r.cleared_probability;
  assert(`low_bid > mid_bid > high_bid 確率`, p.low_bid > p.mid_bid && p.mid_bid > p.high_bid, `low=${p.low_bid}, mid=${p.mid_bid}, high=${p.high_bid}`);
}

// Test 9: 確率は 0-100
{
  const p = estimateBidWithHistory(base(), HISTORY).cleared_probability;
  assert(`確率 ∈ [0, 100]`, [p.low_bid, p.mid_bid, p.high_bid].every((v) => v >= 0 && v <= 100));
}

console.log('\n━━━ Group 4: 警告ロジック ━━━');

// Test 10: 自社コストが過去平均×1.5 超 → 採算性の警告
{
  const cost = Math.ceil(weightedAvg('tokyo') * 1.5) + 1;
  const r = estimateBidWithHistory(base({ cost_yen_per_kw_year: cost }), HISTORY);
  assert(`自社コスト超過（${cost}）で採算性の警告`, r.warnings.some((w) => w.includes('採算性')));
}

// Test 11: 一般注意（OCCTO 公式情報の確認）は常に出る。★旧版の「モック版 disclaimer」は出ない
{
  const r = estimateBidWithHistory(base(), HISTORY);
  assert(`OCCTO 公式情報の確認を促す注意あり`, r.warnings.some((w) => w.includes('OCCTO 公式情報')));
  assert(`「モック」という警告は出ない`, !r.warnings.some((w) => w.includes('モック')));
}

console.log('\n━━━ Group 5: エリア別差異 ━━━');

// Test 12: エリアで過去平均が変わる（北海道と東京は実需給 2025 年度の約定価格が違う）
{
  const t = estimateBidWithHistory(base({ area: 'tokyo' }), HISTORY).historical_context.area_avg;
  const h = estimateBidWithHistory(base({ area: 'hokkaido' }), HISTORY).historical_context.area_avg;
  assert(`東京 area_avg ≠ 北海道 area_avg`, t !== h, `tokyo=${t}, hokkaido=${h}`);
}

console.log('\n━━━ Group 6: 収入試算 ━━━');

// Test 13: 想定収入 = 応札容量 × mid × 1000 / 1e8（億円）
{
  const r = estimateBidWithHistory(base({ capacity_mw: 100 }), HISTORY);
  const expected = (100 * 1000 * r.recommended_bid_mid) / 1e8;
  assert(`収入試算 = capacity × mid / 1e5`, Math.abs(r.estimated_annual_revenue_oku - expected) < 0.01, `actual=${r.estimated_annual_revenue_oku.toFixed(2)}, expected=${expected.toFixed(2)}`);
}

console.log(`\n━━━ 結果: ${pass}/${pass + fail} PASS ━━━`);
if (fail > 0) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
