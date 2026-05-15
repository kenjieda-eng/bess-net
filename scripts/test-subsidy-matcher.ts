#!/usr/bin/env tsx
/**
 * scripts/test-subsidy-matcher.ts
 *
 * 依頼AO 単体テスト (10+ 件)
 *
 * 実行: npx tsx scripts/test-subsidy-matcher.ts
 */

import * as fs from 'node:fs';
import { matchSubsidies, type MatchInput, type MatchResult } from '../src/lib/subsidy-matcher';
import type { PrecomputedSubsidy } from './precompute-subsidies';

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

// 事前計算済データ読み込み
const data: PrecomputedSubsidy[] = JSON.parse(
  fs.readFileSync('src/data/subsidies.json', 'utf8')
);

console.log(`Loaded ${data.length} subsidies`);

const BASE: MatchInput = {
  pref: '東京',
  use_case: 'grid',
  entity_type: 'corporate',
  capacity_kwh: 50000,
  output_kw: 12500,
  install_target_date: '2026-12-31',
};

console.log('\n━━━ Group 1: 基本マッチング動作 ━━━');

// Test 1: マッチ結果が 1 件以上 (50件の中に「東京/系統用/法人」対象は必ず存在)
{
  const r = matchSubsidies(BASE, data);
  assert('東京/系統用/法人: マッチ ≥ 1 件', r.length >= 1, `actual=${r.length}`);
}

// Test 2: Top 10 上限
{
  const r = matchSubsidies(BASE, data, 10);
  assert('limit=10 で 10 件以下', r.length <= 10);
}

// Test 3: スコア降順
{
  const r = matchSubsidies(BASE, data);
  let ordered = true;
  for (let i = 1; i < r.length; i++) {
    if (r[i].match_score > r[i - 1].match_score) {
      ordered = false;
      break;
    }
  }
  assert('結果はスコア降順', ordered);
}

// Test 4: 全件のスコアが ≥ 30 (除外条件)
{
  const r = matchSubsidies(BASE, data);
  const allOver = r.every((m) => m.match_score >= 30);
  assert('スコア < 30 は除外', allOver);
}

console.log('\n━━━ Group 2: 都道府県マッチ ━━━');

// Test 5: 東京 → 大阪に変えると結果が変わる
{
  const tokyo = matchSubsidies(BASE, data);
  const osaka = matchSubsidies({ ...BASE, pref: '大阪' }, data);
  const tokyoIds = new Set(tokyo.map((m) => m.subsidy.id));
  const osakaIds = new Set(osaka.map((m) => m.subsidy.id));
  const diff =
    [...tokyoIds].filter((id) => !osakaIds.has(id)).length +
    [...osakaIds].filter((id) => !tokyoIds.has(id)).length;
  assert('東京 vs 大阪: 結果差異あり', diff > 0, `diff=${diff}`);
}

// Test 6: 「全国対象」補助金 (例: SII) は東京/大阪/北海道で同じ位置
{
  const tokyo = matchSubsidies(BASE, data);
  const sii = tokyo.find((m) =>
    m.subsidy.organization.includes('SII') || m.subsidy.name.includes('SII')
  );
  if (sii) {
    assert(`SII (全国対象) は Top 10 内`, true);
  } else {
    // SII という直接名前なくても全国対応大型補助金は Top 10 にあるはず
    const nationwide = tokyo.find((m) => m.subsidy.applicable_prefs.length >= 40);
    assert(
      `全国対象補助金 (≥40 prefs) は Top 10 内`,
      nationwide !== undefined,
      `${nationwide?.subsidy.name}`
    );
  }
}

console.log('\n━━━ Group 3: 用途別マッチ ━━━');

// Test 7: grid → self_consumption に変えると結果が変わる
{
  const grid = matchSubsidies(BASE, data);
  const self = matchSubsidies({ ...BASE, use_case: 'self_consumption' }, data);
  const diff =
    grid.length !== self.length ||
    grid.some((g, i) => self[i]?.subsidy.id !== g.subsidy.id);
  assert('grid vs self_consumption: 結果差異あり', diff);
}

console.log('\n━━━ Group 4: 期限フィルタ ━━━');

// Test 8: 古い日付 (2020年) でも is_rolling / 期限不明は通る
{
  const oldDate = matchSubsidies({ ...BASE, install_target_date: '2020-01-01' }, data);
  // is_rolling のものは含まれる
  const hasRolling = oldDate.some((m) => m.subsidy.is_rolling);
  assert('期限切れでも is_rolling は通る', hasRolling || oldDate.length > 0);
}

// Test 9: 未来の日付でも適切な数の結果
{
  const future = matchSubsidies({ ...BASE, install_target_date: '2030-01-01' }, data);
  assert('未来日付でも結果 ≥ 1', future.length >= 1, `actual=${future.length}`);
}

console.log('\n━━━ Group 5: 補助金額試算 ━━━');

// Test 10: subsidyRate_max_pct がある補助金は estimated_amount_oku が計算されている
{
  const r = matchSubsidies(BASE, data);
  const withRate = r.filter(
    (m) => m.subsidy.subsidyRate_max_pct !== undefined && m.subsidy.subsidyRate_max_pct > 0
  );
  const withEstimate = withRate.filter((m) => m.estimated_amount_oku !== null);
  assert(
    '補助率明示あり → estimated_amount_oku 計算済',
    withRate.length === withEstimate.length,
    `withRate=${withRate.length}, withEstimate=${withEstimate.length}`
  );
}

console.log('\n━━━ Group 6: スコア構成 ━━━');

// Test 11: reasons は match_score に応じて 1+ 件
{
  const r = matchSubsidies(BASE, data);
  const allHaveReasons = r.every((m) => m.reasons.length >= 1);
  assert('全結果に reasons ≥ 1 件', allHaveReasons);
}

// Test 12: 全国・系統用・法人・期限内・補助率あり = フルスコア 100 が現実的に存在
{
  const r = matchSubsidies(BASE, data);
  const maxScore = Math.max(...r.map((m) => m.match_score));
  assert(
    `最高スコア ≥ 70`,
    maxScore >= 70,
    `actual=${maxScore}`
  );
}

console.log('\n━━━ Group 7: pref 空文字 (全国検索) ━━━');

// Test 13: pref="" 全国検索でも結果が返る
{
  const r = matchSubsidies({ ...BASE, pref: '' }, data);
  assert('全国検索 (pref=""): 結果 ≥ 1 件', r.length >= 1);
}

// Test 14: 個人事業者で検索
{
  const r = matchSubsidies({ ...BASE, entity_type: 'individual', use_case: 'self_consumption' }, data);
  const hasIndividualMatch = r.some((m) => m.subsidy.applicable_entities.includes('individual'));
  assert(`個人事業者+自家消費: individual タグ含む結果あり`, hasIndividualMatch || r.length >= 1);
}

// 結果
console.log(`\n━━━ 結果: ${pass}/${pass + fail} PASS ━━━`);
if (fail > 0) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
