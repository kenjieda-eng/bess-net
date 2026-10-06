#!/usr/bin/env tsx
/**
 * scripts/test-eic-date.ts — src/lib/eic-date.ts の単体テスト（Ck-1a ■2-12）
 * 実行: npx tsx scripts/test-eic-date.ts
 */
import {
  clampToRunDateJst, lastValidPointAsOf, pointsAsOf, todayJst,
  daysSinceUpdatedAt, stalledNote, FEED_STALL_THRESHOLD_DAYS,
  nextUpdateWindow, windowWaitNote, STALLED_SERIES,
} from '../src/lib/eic-date';
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

// Ck-1b §7 → Ck2h §8: 取得停止の注記（「確認済みの系列」AND「閾値」AND「window なら次の窓＋猶予を過ぎている」）
const REG = [{ prefix: 'fit-price-', reason: 'テスト用の登録', confirmedOn: '2026-09-23' }];
const FIT = { kind: 'window', months: [3], grace_days: 45 };
const FIT_UPD = '2026-09-05T09:50:19+09:00';
eq('daysSinceUpdatedAt', daysSinceUpdatedAt(FIT_UPD, '2026-09-23'), 18);
eq('daysSinceUpdatedAt: 値なし', daysSinceUpdatedAt(null, '2026-09-23'), null);
eq('STALLED_SERIES は空（fit-price- は R-28 §6-2 で窓待ちと判明・設計は残す）', STALLED_SERIES.length, 0);
eq('stalled: 既定の登録（空）では fit-price も注記なし', stalledNote('fit-price-solar-business', FIT_UPD, '2026-10-07', FIT), null);
eq('stalled: 登録済み・interval は従来どおり注記あり', stalledNote('fit-price-solar-business', FIT_UPD, '2026-09-23', { kind: 'interval', days: 7 }, REG)?.note, '取得停止中（2026-09-05 時点）');
eq('stalled: 登録済みでも window の窓＋猶予の内なら注記なし', stalledNote('fit-price-solar-business', FIT_UPD, '2026-10-07', FIT, REG), null);
eq('stalled: window の窓＋猶予を過ぎたら注記あり', stalledNote('fit-price-solar-business', FIT_UPD, '2027-05-16', FIT, REG)?.note, '取得停止中（2026-09-05 時点）');
eq('stalled: 同じだけ古くても未登録の系列は注記なし（正常に古い年次系列を巻き込まない）', stalledNote('edinet-revenue-total', '2026-05-21T00:00:00+09:00', '2026-09-23', undefined, REG), null);
eq('stalled: 登録済みでも閾値未満なら注記なし（上流復旧で自動的に消える）', stalledNote('fit-price-solar-business', '2026-09-22T09:00:00+09:00', '2026-09-23', undefined, REG), null);
eq('閾値', FEED_STALL_THRESHOLD_DAYS, 7);
eq('window: fit（3 月・猶予 45）', nextUpdateWindow(FIT, FIT_UPD), { month: '2027-03', windowEnd: '2027-03-31', deadline: '2027-05-15' });
eq('window: 窓の中で取れたら翌年の窓', nextUpdateWindow(FIT, '2027-03-20T09:00:00+09:00'), { month: '2028-03', windowEnd: '2028-03-31', deadline: '2028-05-15' });
eq('window: ltdc（4〜5 月は 1 つの窓）', nextUpdateWindow({ kind: 'window', months: [4, 5], grace_days: 45 }, '2026-09-19T00:00:00+09:00'), { month: '2027-04', windowEnd: '2027-05-31', deadline: '2027-07-15' });
eq('window: ltdc は 4 月に取れたら 5 月末で鳴らさない', nextUpdateWindow({ kind: 'window', months: [4, 5], grace_days: 45 }, '2027-04-20T00:00:00+09:00'), { month: '2028-04', windowEnd: '2028-05-31', deadline: '2028-07-15' });
eq('window: capacity（next_expected・猶予 90）', nextUpdateWindow({ kind: 'window', next_expected: '2026-12-15', grace_days: 90 }, '2026-09-27T00:00:00+09:00'), { month: '2026-12', windowEnd: '2026-12-15', deadline: '2027-03-15' });
eq('window: next_expected 以降に取れていれば null', nextUpdateWindow({ kind: 'window', next_expected: '2026-12-15', grace_days: 90 }, '2026-12-20T00:00:00+09:00'), null);
eq('window: interval は null', nextUpdateWindow({ kind: 'interval', days: 7 }, '2026-09-27'), null);
eq('window: 年を跨ぐ窓（12〜1 月）', nextUpdateWindow({ kind: 'window', months: [12, 1], grace_days: 10 }, '2026-10-01'), { month: '2026-12', windowEnd: '2027-01-31', deadline: '2027-02-10' });
eq('window: 閏年の 2 月末', nextUpdateWindow({ kind: 'window', months: [2], grace_days: 0 }, '2027-10-01'), { month: '2028-02', windowEnd: '2028-02-29', deadline: '2028-02-29' });
eq('窓待ち注記: 期限当日までは出る', windowWaitNote(FIT, FIT_UPD, '2027-05-15'), '窓待ち（次回 2027-03）');
eq('窓待ち注記: 期限の翌日は出ない', windowWaitNote(FIT, FIT_UPD, '2027-05-16'), null);

console.log(`\n${pass}/${pass + fail} PASS`);
process.exit(fail ? 1 : 0);
