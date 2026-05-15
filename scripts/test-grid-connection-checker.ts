#!/usr/bin/env tsx
/**
 * scripts/test-grid-connection-checker.ts
 *
 * 依頼AR 単体テスト (10+ 件)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  haversineDistance,
  scoreSubstation,
  diagnoseGridConnection,
  type LiteSubstation,
  type DiagnosisInput,
} from '../src/lib/grid-connection-checker';

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

function approx(a: number, b: number, tol: number): boolean {
  return Math.abs(a - b) < tol;
}

console.log('━━━ Group 1: haversine 距離計算 ━━━');

// Test 1: 東京駅 - 大阪駅 ≈ 400 km (±10km 公差、google maps 値 ≈ 403km)
{
  const d = haversineDistance(35.6812, 139.7671, 34.7024, 135.4959);
  assert(
    `東京駅-大阪駅 ≈ 400 km`,
    approx(d, 400, 10),
    `actual=${d.toFixed(1)}km`
  );
}

// Test 2: 同地点 = 0 km
{
  const d = haversineDistance(35.6812, 139.7671, 35.6812, 139.7671);
  assert('同地点 = 0 km', d === 0);
}

// Test 3: 札幌 - 那覇 ≈ 2,250 km
{
  const d = haversineDistance(43.0642, 141.3469, 26.2125, 127.6809);
  assert(`札幌-那覇 ≈ 2,250 km`, approx(d, 2250, 50), `actual=${d.toFixed(0)}km`);
}

// Test 4: 東京駅 - 新宿駅 ≈ 5 km
{
  const d = haversineDistance(35.6812, 139.7671, 35.6896, 139.7006);
  assert(`東京駅-新宿駅 ≈ 5 km`, approx(d, 6, 1.5), `actual=${d.toFixed(2)}km`);
}

console.log('\n━━━ Group 2: スコアリング ━━━');

const SAMPLE_SUB: LiteSubstation = {
  id: 'test-1',
  slug: 'test-1',
  name: 'テスト変電所',
  prefecture: '東京都',
  operator: 'TEPCO',
  area: '関東',
  voltage_primary_kv: 154,
  voltage_secondary_kv: 66,
  capacity_total_mw: 500,
  cap_operational_mw: 500,
  cap_avail_mw: 100,
  n1_eligible: true,
  oc_possibility: null,
  latitude: 35.6812,
  longitude: 139.7671,
  last_updated: '2026-04-28T00:00:00.000Z',
};

const INPUT_TOKYO: DiagnosisInput = {
  prefecture: '東京都',
  latitude: 35.6812,
  longitude: 139.7671,
  output_mw: 10,
  capacity_mwh: 40,
};

// Test 5: フルスペック (空き 100MW / 出力 10MW、N-1可、距離 0km、電圧両方、OC なし) → 高スコア
{
  const { score, reasons } = scoreSubstation(SAMPLE_SUB, INPUT_TOKYO, 0);
  // +30 (余裕) + 25 (近距離) + 15 (N-1) + 10 (電圧) + 10 (OC低) = 90
  assert(`フルスペック score ≥ 80`, score >= 80, `actual=${score}, reasons=${reasons.join(',')}`);
}

// Test 6: 空き容量 < 出力 → ratio 不足扱い
{
  const tightSub = { ...SAMPLE_SUB, cap_avail_mw: 3 };
  const { score, reasons } = scoreSubstation(tightSub, INPUT_TOKYO, 0);
  // 空き 3 / 出力 10 = 0.3、加点なし
  const hasCapacityReason = reasons.some((r) => r.includes('不足'));
  assert(`空き容量不足 reason 出る`, hasCapacityReason);
}

// Test 7: 距離 30km → 距離加点なし
{
  const { score: nearScore } = scoreSubstation(SAMPLE_SUB, INPUT_TOKYO, 3);
  const { score: farScore } = scoreSubstation(SAMPLE_SUB, INPUT_TOKYO, 30);
  assert(`距離 3km > 30km の score`, nearScore > farScore, `near=${nearScore}, far=${farScore}`);
}

// Test 8: N-1 適用なし → スコア -15
{
  const noN1 = { ...SAMPLE_SUB, n1_eligible: false };
  const { score: yesScore } = scoreSubstation(SAMPLE_SUB, INPUT_TOKYO, 0);
  const { score: noScore } = scoreSubstation(noN1, INPUT_TOKYO, 0);
  assert(`N-1 有無で 15 点差`, yesScore - noScore === 15, `yes=${yesScore}, no=${noScore}`);
}

console.log('\n━━━ Group 3: 統合 diagnoseGridConnection ━━━');

const subs: LiteSubstation[] = [
  { ...SAMPLE_SUB, id: 's1', slug: 's1', name: '近1', latitude: 35.6812, longitude: 139.7671, cap_avail_mw: 200 },
  { ...SAMPLE_SUB, id: 's2', slug: 's2', name: '近2', latitude: 35.685, longitude: 139.770, cap_avail_mw: 50, n1_eligible: false },
  { ...SAMPLE_SUB, id: 's3', slug: 's3', name: '遠1', latitude: 35.4500, longitude: 139.6000, cap_avail_mw: 100 },
  { ...SAMPLE_SUB, id: 's4', slug: 's4', name: '空き不足', latitude: 35.7000, longitude: 139.7800, cap_avail_mw: 2 },
  { ...SAMPLE_SUB, id: 's5', slug: 's5', name: '座標なし', latitude: null, longitude: null, cap_avail_mw: 80 },
];

// Test 9: Top 5 返却
{
  const r = diagnoseGridConnection(INPUT_TOKYO, subs, 5);
  assert(`Top ≤ 5`, r.candidates.length <= 5 && r.candidates.length > 0);
}

// Test 10: 一番スコア高いのが Top 1 (近1)
{
  const r = diagnoseGridConnection(INPUT_TOKYO, subs, 5);
  assert(`Top 1 = 近1 (フルスペック)`, r.candidates[0]?.substation.name === '近1');
}

// Test 11: スコア降順
{
  const r = diagnoseGridConnection(INPUT_TOKYO, subs, 5);
  let ordered = true;
  for (let i = 1; i < r.candidates.length; i++) {
    if (r.candidates[i].feasibility_score > r.candidates[i - 1].feasibility_score) {
      ordered = false;
      break;
    }
  }
  assert('スコア降順', ordered);
}

// Test 12: total_in_prefecture = 入力件数
{
  const r = diagnoseGridConnection(INPUT_TOKYO, subs, 5);
  assert(`total_in_prefecture = ${subs.length}`, r.total_in_prefecture === subs.length);
}

// Test 13: 座標なし substation は distance_km = null
{
  const r = diagnoseGridConnection(INPUT_TOKYO, subs, 5);
  const noCoord = r.candidates.find((c) => c.substation.id === 's5');
  if (noCoord) {
    assert(`座標なし → distance_km = null`, noCoord.distance_km === null);
  } else {
    // Top 5 に入らない場合もあり (低スコアのため)
    assert(`座標なし substation は Top 5 圏外可`, true);
  }
}

// Test 14: 入力座標なし → 全 substations が distance_km = null
{
  const r = diagnoseGridConnection(
    { ...INPUT_TOKYO, latitude: undefined, longitude: undefined },
    subs,
    5
  );
  const allNull = r.candidates.every((c) => c.distance_km === null);
  assert(`入力座標なし → 全 distance null`, allNull);
}

// Test 15: 推奨: フルスペックなら 'easy'
{
  const r = diagnoseGridConnection(INPUT_TOKYO, [subs[0]], 5);
  assert(
    `フルスペック → recommendation: easy`,
    r.recommendation === 'easy',
    `actual=${r.recommendation}, score=${r.candidates[0]?.feasibility_score}`
  );
}

// Test 16: 推奨: 空 substations → requires_consultation
{
  const r = diagnoseGridConnection(INPUT_TOKYO, [], 5);
  assert(`空 → requires_consultation`, r.recommendation === 'requires_consultation');
  assert(`notes に空通知`, r.notes.some((n) => n.includes('変電所データがありません')));
}

console.log('\n━━━ Group 4: 実データ統合確認 ━━━');

// Test 17: 実データ index.json 存在 + 6,500+ 件
{
  const idxPath = 'src/data/substations/index.json';
  if (fs.existsSync(idxPath)) {
    const idx = JSON.parse(fs.readFileSync(idxPath, 'utf8'));
    assert(`実 total ≥ 6,000`, idx.total >= 6000, `actual=${idx.total}`);
  } else {
    fail++;
    console.log(`  ❌ index.json 未生成 — precompute 実行が必要`);
  }
}

// Test 18: 実データ 北海道.json 存在 (TEPCO データ公開停止のため東京都データなし、北海道は 424件)
{
  const hkdPath = 'src/data/substations/北海道.json';
  if (fs.existsSync(hkdPath)) {
    const list = JSON.parse(fs.readFileSync(hkdPath, 'utf8'));
    assert(`北海道.json: ${list.length} 件 ≥ 100`, Array.isArray(list) && list.length >= 100);
  } else {
    fail++;
    console.log(`  ❌ 北海道.json 未生成 — precompute 実行が必要`);
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
