#!/usr/bin/env tsx
/**
 * scripts/test-eic-date.ts — src/lib/eic-date.ts の単体テスト（Ck-1a ■2-12）
 * 実行: npx tsx scripts/test-eic-date.ts
 */
import { clampToRunDateJst, lastValidPointAsOf, pointsAsOf, todayJst } from '../src/lib/eic-date';
export {};

let pass = 0, fail = 0;
const eq = (name: string, got: unknown, want: unknown) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  ok ? pass++ : fail++;
  console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : ` — got ${JSON.stringify(got)} want ${JSON.stringify(want)}`}`);
};

// 実行日（JST）: UTC 2026-09-22 01:36 は JST 10:36（同日）、UTC 15:30 は JST 翌日 00:30
eq('todayJst: UTC 01:36 → JST 同日', todayJst(new Date('2026-09-22T01:36:25Z')), '2026-09-22');
eq('todayJst: UTC 15:30 → JST 翌日', todayJst(new Date('2026-09-22T15:30:00Z')), '2026-09-23');

// 頭打ち
eq('clamp: 明日 → 実行日', clampToRunDateJst('2026-09-23', '2026-09-22'), '2026-09-22');
eq('clamp: 昨日 → そのまま', clampToRunDateJst('2026-09-21', '2026-09-22'), '2026-09-21');
eq('clamp: 当日 → そのまま', clampToRunDateJst('2026-09-22', '2026-09-22'), '2026-09-22');
eq('clamp: 時刻付き', clampToRunDateJst('2026-09-23T00:00:00+09:00', '2026-09-22'), '2026-09-22');
eq('clamp: 容量市場の対象実需給年度（引用の取得日として使う場合）', clampToRunDateJst('2029-04-01', '2026-09-22'), '2026-09-22');
eq('clamp: null', clampToRunDateJst(null, '2026-09-22'), null);
eq('clamp: undefined', clampToRunDateJst(undefined, '2026-09-22'), null);

// 日付と値の組を崩さない（2026-09-22 実測の jepx-spot-system 末尾 2 点）
const pts = [
  { date: '2026-09-21', value: 12.5 },
  { date: '2026-09-22', value: 16.317916666666665 },
  { date: '2026-09-23', value: 17.97875 },
];
eq('lastValidPointAsOf: 明日の点を飛ばして当日の点', lastValidPointAsOf(pts, '2026-09-22'), { date: '2026-09-22', value: 16.317916666666665 });
eq('lastValidPointAsOf: 翌日になれば明日だった点', lastValidPointAsOf(pts, '2026-09-23'), { date: '2026-09-23', value: 17.97875 });
eq('lastValidPointAsOf: null を飛ばす', lastValidPointAsOf([{ date: '2026-09-21', value: 1 }, { date: '2026-09-22', value: null }], '2026-09-22'), { date: '2026-09-21', value: 1 });
eq('lastValidPointAsOf: 全部未来 → null', lastValidPointAsOf([{ date: '2026-09-23', value: 1 }], '2026-09-22'), null);
eq('pointsAsOf: スパークラインから明日の点を外す', pointsAsOf(pts, '2026-09-22').map((p) => p.date), ['2026-09-21', '2026-09-22']);

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
