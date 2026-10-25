#!/usr/bin/env tsx
/**
 * scripts/verify-page-dates.ts — 詳細ページの「公開日・更新日」の日付の自己検査（日付表示便・2026-10-25）
 * 合成の値だけで動く（microCMS に触れない）。JST の境目・同じ日の扱い・値が無いとき・ラベルの形を見る。
 * 実行: npx tsx scripts/verify-page-dates.ts
 */
import { jaDayLabel, jstDay, pageDateDays } from '../src/lib/page-dates';

export {};

let checks = 0;
const fails: string[] = [];
const eq = (got: unknown, want: unknown, msg: string) => { checks++; if (JSON.stringify(got) !== JSON.stringify(want)) fails.push(`${msg}: ${JSON.stringify(got)}（期待 ${JSON.stringify(want)}）`); };

// JST の境目: UTC 14:59 は JST 23:59（同じ日）、UTC 15:00 は JST 翌日 0:00
eq(jstDay('2026-10-20T14:59:59.999Z'), '2026-10-20', 'JST 23:59');
eq(jstDay('2026-10-20T15:00:00.000Z'), '2026-10-21', 'JST 翌日 0:00');
// 朝 9 時前の JST（UTC では前日）
eq(jstDay('2026-10-21T23:30:00.000Z'), '2026-10-22', 'JST 8:30 は UTC の前日');
eq(jstDay('2026-10-22T00:00:00.000Z'), '2026-10-22', 'JST 9:00');
// 値が無い・読めない
eq(jstDay(undefined), null, 'undefined');
eq(jstDay(''), null, '空文字');
eq(jstDay('not-a-date'), null, '読めない値');
// ラベル
eq(jaDayLabel('2026-04-30'), '2026年4月30日', 'ラベル（月日のゼロを付けない）');
eq(jaDayLabel('2026-10-05'), '2026年10月5日', 'ラベル 10 月');
// 同じ日（JST）なら更新日を出さない／UTC では同じ日でも JST で別の日なら出す
eq(pageDateDays('2026-04-30T01:00:00.000Z', '2026-04-30T10:00:00.000Z'), { published: '2026-04-30', revised: null }, '同じ JST 日');
eq(pageDateDays('2026-04-30T01:00:00.000Z', '2026-04-30T16:00:00.000Z'), { published: '2026-04-30', revised: '2026-05-01' }, 'UTC は同じ日・JST は翌日');
eq(pageDateDays('2026-04-29T16:00:00.000Z', '2026-04-30T10:00:00.000Z'), { published: '2026-04-30', revised: null }, 'UTC は別の日・JST は同じ日');
eq(pageDateDays('2026-04-30T01:00:00.000Z', '2026-10-22T03:58:00.000Z'), { published: '2026-04-30', revised: '2026-10-22' }, '別の日');
eq(pageDateDays('2026-04-30T01:00:00.000Z', undefined), { published: '2026-04-30', revised: null }, '更新日なし');
eq(pageDateDays(undefined, '2026-10-22T03:58:00.000Z'), { published: null, revised: '2026-10-22' }, '公開日なし');
eq(pageDateDays(null, null), { published: null, revised: null }, 'どちらも無し');

console.log(`[verify:page-dates] 検査 ${checks} 件`);
if (fails.length) {
  console.error(`[verify:page-dates] NG ${fails.length} 件`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('[verify:page-dates] ok   JST の境目・同じ日の扱い・値が無いとき・ラベル');
