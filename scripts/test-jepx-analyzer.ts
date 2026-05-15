/**
 * JEPX アービトラージ ロジック ユニットテスト
 * 実行: npx tsx scripts/test-jepx-analyzer.ts
 */

import { calcArbitrage, calcAvgArbitrage, compareAreas, findDailyRecord } from '../src/lib/jepx-analyzer';
import { DAILY_DATA, MONTHLY_DATA, AREAS, computePrice } from '../src/data/jepx-history';

let pass = 0, fail = 0;
function test(name: string, fn: () => void) {
  try { fn(); console.log(`✓ ${name}`); pass++; }
  catch (e) { console.error(`✗ ${name}\n  ${(e as Error).message}`); fail++; }
}
function assert(cond: boolean, msg: string) { if (!cond) throw new Error(msg); }

test('1. DAILY_DATA は 30日 × 9エリア = 270件', () => {
  assert(DAILY_DATA.length === 270, `expected 270, got ${DAILY_DATA.length}`);
});

test('2. 各レコードは 48 slot', () => {
  for (const rec of DAILY_DATA) {
    assert(rec.slots.length === 48, `${rec.dateStr} ${rec.area}: ${rec.slots.length} slots`);
  }
});

test('3. MONTHLY_DATA は 12ヶ月 × 9エリア = 108件', () => {
  assert(MONTHLY_DATA.length === 108, `expected 108, got ${MONTHLY_DATA.length}`);
});

test('4. 全価格は正の値', () => {
  for (const rec of DAILY_DATA) {
    for (const p of rec.slots) {
      assert(p > 0, `negative price found: ${p}`);
    }
  }
});

test('5. 夕方ピーク (18-20時、slot 36-40) は深夜 (slot 0-8) より高い', () => {
  const rec = DAILY_DATA.find((r) => r.daysAgo === 0 && r.area === 'tokyo')!;
  const eveningAvg = rec.slots.slice(36, 40).reduce((a, b) => a + b, 0) / 4;
  const nightAvg = rec.slots.slice(0, 8).reduce((a, b) => a + b, 0) / 8;
  assert(eveningAvg > nightAvg, `evening ${eveningAvg} should > night ${nightAvg}`);
});

test('6. 九州の昼間 (slot 24-30) は東京より安い傾向', () => {
  const tokyoRec = DAILY_DATA.find((r) => r.daysAgo === 0 && r.area === 'tokyo')!;
  const kyushuRec = DAILY_DATA.find((r) => r.daysAgo === 0 && r.area === 'kyushu')!;
  const tokyoDay = tokyoRec.slots.slice(24, 30).reduce((a, b) => a + b, 0) / 6;
  const kyushuDay = kyushuRec.slots.slice(24, 30).reduce((a, b) => a + b, 0) / 6;
  assert(kyushuDay < tokyoDay, `kyushu ${kyushuDay} should < tokyo ${tokyoDay}`);
});

test('7. findDailyRecord — 存在するレコードを取得', () => {
  const rec = findDailyRecord('tokyo', 0);
  assert(rec !== null, 'tokyo daysAgo=0 should exist');
  assert(rec!.area === 'tokyo' && rec!.daysAgo === 0, 'matches input');
});

test('8. findDailyRecord — 範囲外は null', () => {
  assert(findDailyRecord('tokyo', 999) === null, 'daysAgo=999 should be null');
});

test('9. calcArbitrage — 基本動作 (10MWh, 効率85%, 1サイクル)', () => {
  const result = calcArbitrage({ area: 'tokyo', daysAgo: 0, capacityMWh: 10, roundTripEfficiency: 0.85, cycles: 1 });
  assert(result !== null, 'should return result');
  assert(result!.buySlots.length === 8, `buy slots: 8 expected, got ${result!.buySlots.length}`);
  assert(result!.sellSlots.length === 8, `sell slots: 8 expected, got ${result!.sellSlots.length}`);
  assert(result!.avgSellPrice > result!.avgBuyPrice, 'sell > buy');
  assert(result!.spread > 0, 'spread > 0');
});

test('10. calcArbitrage — 2サイクルで売買 slot 数倍化', () => {
  const r1 = calcArbitrage({ area: 'tokyo', daysAgo: 0, capacityMWh: 10, roundTripEfficiency: 0.85, cycles: 1 });
  const r2 = calcArbitrage({ area: 'tokyo', daysAgo: 0, capacityMWh: 10, roundTripEfficiency: 0.85, cycles: 2 });
  assert(r2!.buySlots.length === 16, `2 cycles: 16 slots expected, got ${r2!.buySlots.length}`);
  assert(r2!.sellSlots.length === 16, '2 cycles: 16 sell slots');
  // 売上は概ね倍
  assert(r2!.netRevenue > r1!.netRevenue, '2 cycles revenue > 1 cycle');
});

test('11. calcArbitrage — 効率 100%/85% で grossRevenue 比較', () => {
  const r100 = calcArbitrage({ area: 'tokyo', daysAgo: 0, capacityMWh: 10, roundTripEfficiency: 1.0, cycles: 1 });
  const r85 = calcArbitrage({ area: 'tokyo', daysAgo: 0, capacityMWh: 10, roundTripEfficiency: 0.85, cycles: 1 });
  assert(r100!.netRevenue > r85!.netRevenue, `100% (${r100!.netRevenue}) > 85% (${r85!.netRevenue})`);
});

test('12. calcAvgArbitrage — 30日平均、bestDay 存在', () => {
  const result = calcAvgArbitrage('tokyo', 30, 10, 0.85, 1);
  assert(result.bestDay !== null && result.worstDay !== null, 'best/worst non-null');
  assert(result.bestDay!.netRevenue >= result.worstDay!.netRevenue, 'best >= worst');
});

test('13. compareAreas — 9エリア比較', () => {
  const result = compareAreas(30, 10, 0.85, 1);
  assert(result.length === 9, `9 entries, got ${result.length}`);
  // 降順ソート確認
  for (let i = 1; i < result.length; i++) {
    assert(result[i - 1].avgNetRevenue >= result[i].avgNetRevenue, 'sorted desc');
  }
});

test('14. computePrice — 同 input なら同値 (決定論)', () => {
  const p1 = computePrice(5, 30, 'tokyo');
  const p2 = computePrice(5, 30, 'tokyo');
  assert(p1 === p2, `deterministic: ${p1} === ${p2}`);
});

test('15. 月次データ avg は max と min の中間', () => {
  for (const m of MONTHLY_DATA) {
    assert(m.avg >= m.min && m.avg <= m.max, `${m.yearMonth} ${m.area}: avg ${m.avg} not in [${m.min}, ${m.max}]`);
  }
});

test('16. capacityMWh が倍なら売上ほぼ倍', () => {
  const r1 = calcArbitrage({ area: 'tokyo', daysAgo: 0, capacityMWh: 10, roundTripEfficiency: 0.85, cycles: 1 });
  const r2 = calcArbitrage({ area: 'tokyo', daysAgo: 0, capacityMWh: 20, roundTripEfficiency: 0.85, cycles: 1 });
  const ratio = r2!.netRevenue / r1!.netRevenue;
  assert(ratio > 1.95 && ratio < 2.05, `ratio ${ratio} should ~= 2`);
});

console.log(`\nResult: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
