#!/usr/bin/env tsx
/**
 * scripts/test-fire-risk-checker.ts
 *
 * 依頼AS 単体テスト (10+ 件)
 */

import { calculateFireRisk, type FireRiskInput } from '../src/lib/fire-risk-checker';
import { CHECKLIST, validateChecklist } from '../src/data/fire-risk-checklist';

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

console.log('━━━ Group 1: チェックリスト構造検証 ━━━');

// Test 1: 25 問存在
assert(`CHECKLIST: 25 問`, CHECKLIST.length === 25, `actual=${CHECKLIST.length}`);

// Test 2: 各カテゴリ 5 問
assert(`各カテゴリ 5 問`, validateChecklist());

// Test 3: 各問に最善 (max score ≥ 8) 選択肢あり
{
  const allHaveBest = CHECKLIST.every((item) => {
    const maxScore = Math.max(...item.options.map((o) => o.score));
    return maxScore >= 8;
  });
  assert(`各問に最善 (max score ≥ 8) 選択肢あり`, allHaveBest);
}

// 最善 option index を取得するヘルパ
function bestIdxOf(opts: { score: number }[]): number {
  let bi = 0;
  for (let i = 1; i < opts.length; i++) if (opts[i].score > opts[bi].score) bi = i;
  return bi;
}

// Test 4: 各問の weight は 1-3 範囲
{
  const allWeightOk = CHECKLIST.every((item) => item.weight >= 1 && item.weight <= 3);
  assert(`weight ∈ [1,3]`, allWeightOk);
}

console.log('\n━━━ Group 2: 全回答パターン ━━━');

// Test 5: 全問 最善 (score=10) → 100 / low
{
  const answers: Record<string, number> = {};
  for (const item of CHECKLIST) {
    answers[item.id] = bestIdxOf(item.options);
  }
  const r = calculateFireRisk({ answers });
  assert(`全問最善 → 100 / low`, r.total_score === 100 && r.risk_level === 'low',
    `score=${r.total_score}, risk=${r.risk_level}`);
}

// Test 6: 全問 最悪 (score=1 or 最低) → 低スコア / critical
{
  const answers: Record<string, number> = {};
  for (const item of CHECKLIST) {
    // 最低 score を持つ option を選択
    const worstIdx = item.options.reduce(
      (acc, opt, idx) => (opt.score < item.options[acc].score ? idx : acc),
      0
    );
    answers[item.id] = worstIdx;
  }
  const r = calculateFireRisk({ answers });
  assert(`全問最悪 → critical`, r.risk_level === 'critical' && r.total_score < 40,
    `score=${r.total_score}, risk=${r.risk_level}`);
}

// Test 7: 中間値 (各問 中央 option index = floor(options.length/2))
{
  const answers: Record<string, number> = {};
  for (const item of CHECKLIST) {
    answers[item.id] = Math.floor(item.options.length / 2);
  }
  const r = calculateFireRisk({ answers });
  // 中間 → moderate / high の境界帯
  assert(`中間回答 score ∈ [30, 75]`, r.total_score >= 30 && r.total_score <= 75,
    `actual=${r.total_score}`);
}

console.log('\n━━━ Group 3: 部分回答・カテゴリ別 ━━━');

// Test 8: 0 件回答 → 全カテゴリ 0、total 0
{
  const r = calculateFireRisk({ answers: {} });
  assert(`0 件回答 → answered_count=0`, r.answered_count === 0);
  assert(`0 件回答 → total_score=0`, r.total_score === 0);
}

// Test 9: cell カテゴリのみ完答 (5問) → cell.score > 0
{
  const answers: Record<string, number> = {};
  for (const item of CHECKLIST.filter((i) => i.category === 'cell')) {
    answers[item.id] = bestIdxOf(item.options);
  }
  const r = calculateFireRisk({ answers });
  const cell = r.by_category.find((c) => c.category === 'cell')!;
  const pcs = r.by_category.find((c) => c.category === 'pcs')!;
  // cell-3 (メーカー) の最高 score = 9 なので、5 問最善でも 100 にならず ≥ 95 が期待
  assert(`cell 5 問完答 → cell.score ≥ 90`, cell.score >= 90, `actual=${cell.score}`);
  assert(`pcs 未回答 → pcs.score = 0`, pcs.score === 0);
  assert(`cell.answered_count = 5`, cell.answered_count === 5);
}

console.log('\n━━━ Group 4: リスクレベル境界値 ━━━');

// Test 10-13: 境界値判定
{
  // score 80 ちょうど → low
  const itemsCell5 = CHECKLIST.filter((i) => i.category === 'cell').slice(0, 1);
  // 簡易: 全問 score=8 (option があれば) で 80% → low (or 境界)
  // 直接 deriveRiskLevel は private、calculateFireRisk 経由でテスト
  const ans1: Record<string, number> = {};
  for (const item of CHECKLIST) {
    // 8 点の選択肢を探す、なければ 7 / 9 にフォールバック
    let idx = item.options.findIndex((o) => o.score === 8);
    if (idx < 0) idx = item.options.findIndex((o) => o.score === 9);
    if (idx < 0) idx = item.options.findIndex((o) => o.score === 7);
    if (idx < 0) idx = item.options.findIndex((o) => o.score === 10);
    if (idx < 0) idx = 0;
    ans1[item.id] = idx;
  }
  const r1 = calculateFireRisk({ answers: ans1 });
  assert(`高得点回答 ⇒ low or moderate`, r1.risk_level === 'low' || r1.risk_level === 'moderate',
    `score=${r1.total_score}, risk=${r1.risk_level}`);
}

console.log('\n━━━ Group 5: priority_actions ━━━');

// Test 14: 全問最悪回答時、priority_actions が 5 件
{
  const answers: Record<string, number> = {};
  for (const item of CHECKLIST) {
    const worstIdx = item.options.reduce(
      (acc, opt, idx) => (opt.score < item.options[acc].score ? idx : acc),
      0
    );
    answers[item.id] = worstIdx;
  }
  const r = calculateFireRisk({ answers });
  assert(`priority_actions = 5 件`, r.priority_actions.length === 5);
  // 全て severity が critical or high
  const allSerious = r.priority_actions.every(
    (a) => a.severity === 'critical' || a.severity === 'high'
  );
  assert(`全問最悪時 severity 高優先`, allSerious);
}

// Test 15: weight 3 の項目が priority_actions の先頭に来る
{
  const answers: Record<string, number> = {};
  for (const item of CHECKLIST) {
    const worstIdx = item.options.reduce(
      (acc, opt, idx) => (opt.score < item.options[acc].score ? idx : acc),
      0
    );
    answers[item.id] = worstIdx;
  }
  const r = calculateFireRisk({ answers });
  const firstWeight = r.priority_actions[0]?.weight ?? 0;
  assert(`Top priority weight = 3`, firstWeight === 3,
    `actual weight=${firstWeight}`);
}

// Test 16: 全問最善回答 → priority_actions = 0
{
  const answers: Record<string, number> = {};
  for (const item of CHECKLIST) {
    answers[item.id] = bestIdxOf(item.options);
  }
  const r = calculateFireRisk({ answers });
  assert(`全問最善 → priority_actions = 0`, r.priority_actions.length === 0);
}

console.log('\n━━━ Group 6: カテゴリスコア独立性 ━━━');

// Test 17: total_count = 5 各カテゴリ
{
  const r = calculateFireRisk({ answers: {} });
  for (const cat of r.by_category) {
    assert(`${cat.category_label} total_count = 5`, cat.total_count === 5);
  }
}

// 結果
console.log(`\n━━━ 結果: ${pass}/${pass + fail} PASS ━━━`);
if (fail > 0) {
  console.log('Failures:');
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
process.exit(0);
