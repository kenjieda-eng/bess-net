#!/usr/bin/env tsx
/**
 * scripts/verify-jst-today.ts — 「今日」を JST で出しているかの検査（毎朝の再ビルド便の追加確認・2026-11-04）
 *
 * 毎朝の再ビルドは 00:10 JST（UTC では前日 15:10）に走る。「今日」を UTC の日付で出すと、ビルドの時点では前日になり、
 * 前日締切の補助金が「本日締切」のまま 1 日残る。2026-11-04T15:15:00Z（JST 11/5 00:15）に時計を合わせて、
 * 補助金の一覧・詳細・トラッカー（getTodayJST）・トップと政策カレンダー（policy-utils）・案件（projects-cod）・
 * お知らせバナーと EIC（announcement-schedule / eic-date）・補助金マッチング（subsidy-matcher）の判定を確かめる。
 * UTC のままの判定に戻すと、11/4 締切が「本日締切」「申込可」になって落ちる。
 *
 * 補助金の一覧（/subsidies）の作り直しの間隔も見る（補助金の一覧の作り直しの間隔便・2026-11-10）:
 *   GitHub の定時の実行は毎日 数時間 遅れて始まる（00:10 の分が 04:23〜08:45 JST）。一覧は毎朝の再ビルドに頼らず、
 *   revalidate 600（10 分）で自分で作り直し、日付が変わって 10 分ほどで今日の表示になる。10 分ごとに作り直すので、
 *   ページ（と root の layout）から microcms.ts・microcms-js-sdk を値として読み込んだり、fetch( を持ったりしたら落とす
 *   （作り直しのたびに外部を読みに行く形にしない・鉄則 #3／#102）。
 *
 * microCMS へのアクセスなし。問題があれば exit 1＝ビルドで落ちる。prebuild に入れている。
 */
import { getTodayJST, deriveSubsidyStatus, deadlineCountdown, displaySubsidyStatus } from '../src/lib/subsidies-meta';
import { jstTodayISO as policyToday, jstDateOf, deriveDisplayStatus } from '../src/lib/policy-utils';
import { jstTodayISO as projectsToday } from '../src/lib/projects-cod';
import { toJstDate } from '../src/lib/announcement-schedule';
import { todayJst } from '../src/lib/eic-date';
import { matchTargetDate, defaultInstallTargetDate, isClosedForApplication } from '../src/lib/subsidy-matcher';
import * as fs from 'node:fs';
import * as path from 'node:path';
import type { PrecomputedSubsidy } from './precompute-subsidies';
import { walkValueImports, stripComments } from './lib/import-graph';
export {};

const problems: string[] = [];
const eq = (label: string, got: unknown, want: unknown) => {
  if (got !== want) problems.push(`${label}: 期待「${want}」・実際「${got}」`);
};

const realNow = Date.now;
const at = (iso: string, fn: () => void) => {
  const fixed = Date.parse(iso);
  Date.now = () => fixed;
  try { fn(); } finally { Date.now = realNow; }
};

const facts = (deadline: string) => ({ status: ['公募中'], deadline_iso: deadline, start_iso: null, is_rolling: false });
const subsidy = (deadline: string) => ({ ...facts(deadline), no_schedule: false }) as unknown as PrecomputedSubsidy;

// 毎朝の再ビルドの時刻: 2026-11-04T15:15:00Z ＝ JST 11/5 00:15
at('2026-11-04T15:15:00Z', () => {
  const today = getTodayJST();
  eq('getTodayJST（補助金の一覧・詳細・トラッカー）', today, '2026-11-05');
  eq('policy-utils の jstTodayISO（トップ・政策カレンダー・イベント）', policyToday(), '2026-11-05');
  eq('projects-cod の jstTodayISO（案件の予定日超過）', projectsToday(), '2026-11-05');
  eq('toJstDate（お知らせバナー）', toJstDate(new Date(Date.now())), '2026-11-05');
  eq('eic-date の todayJst', todayJst(new Date(Date.now())), '2026-11-05');

  eq('11/4 締切の状態', deriveSubsidyStatus(facts('2026-11-04'), today), '受付終了');
  eq('11/4 締切の表示する状態', displaySubsidyStatus(facts('2026-11-04'), today), '受付終了');
  eq('11/4 締切のカウントダウン', deadlineCountdown(facts('2026-11-04'), today), '締切済');
  eq('11/5 締切のカウントダウン', deadlineCountdown(facts('2026-11-05'), today), '本日締切');
  eq('11/6 締切のカウントダウン', deadlineCountdown(facts('2026-11-06'), today), 'あと1日');

  eq('補助金マッチングの基準日（入力なし）', matchTargetDate({ install_target_date: '' }), '2026-11-05');
  eq('補助金マッチング: 11/4 締切は申込不可', isClosedForApplication(subsidy('2026-11-04'), matchTargetDate({ install_target_date: '' })), true);
  eq('補助金マッチング: 11/5 締切は申込可', isClosedForApplication(subsidy('2026-11-05'), matchTargetDate({ install_target_date: '' })), false);
  eq('補助金マッチング: 設置希望日の初期値', defaultInstallTargetDate(), '2027-06-01');

  // 政策イベントは microCMS に 2026-11-04T00:00:00.000Z の形で入っている（JST の暦日がそのまま日付の部分）
  eq('jstDateOf（政策イベントの日付）', jstDateOf('2026-11-04T00:00:00.000Z'), '2026-11-04');
  eq('11/4 開催の予定は終了', deriveDisplayStatus({ eventDate: '2026-11-04T00:00:00.000Z', status: ['予定'] }), '終了');
  eq('11/5 開催の予定は予定のまま', deriveDisplayStatus({ eventDate: '2026-11-05T00:00:00.000Z', status: ['予定'] }), '予定');
});

// 境目の前: 2026-11-04T14:59:59Z ＝ JST 11/4 23:59:59 は、まだ 11/4
at('2026-11-04T14:59:59Z', () => {
  const today = getTodayJST();
  eq('JST 11/4 23:59 の getTodayJST', today, '2026-11-04');
  eq('JST 11/4 23:59 の 11/4 締切', deadlineCountdown(facts('2026-11-04'), today), '本日締切');
  eq('JST 11/4 23:59 の補助金マッチング: 11/4 締切は申込可', isClosedForApplication(subsidy('2026-11-04'), matchTargetDate({ install_target_date: '' })), false);
});

// 補助金の一覧の作り直しの間隔（2026-11-10）: revalidate は 600・実行時に外部を読まない
const ROOT = process.cwd();
const SUBSIDIES_PAGE = path.join(ROOT, 'src', 'app', 'subsidies', 'page.tsx');
const SUBSIDIES_REVALIDATE = '600';
const subsidiesSrc = stripComments(fs.readFileSync(SUBSIDIES_PAGE, 'utf8'));
const revalidates = [...subsidiesSrc.matchAll(/^\s*export\s+const\s+revalidate\s*=\s*([^;\n]+)/gm)].map((m) => m[1].trim());
if (revalidates.length !== 1 || revalidates[0] !== SUBSIDIES_REVALIDATE) {
  problems.push(`src/app/subsidies/page.tsx の revalidate: 期待「${SUBSIDIES_REVALIDATE}」・実際「${revalidates.join('／') || '（無い）'}」（一覧は 10 分ごとに作り直して日付を今日にする）`);
}
const subsidiesWalk = walkValueImports(ROOT, [SUBSIDIES_PAGE, path.join(ROOT, 'src', 'app', 'layout.tsx')]);
problems.push(...subsidiesWalk.problems.map((p) => `/subsidies: ${p}`));
const subsidiesCode = [...subsidiesWalk.seen].filter((f) => /\.(ts|tsx)$/.test(f));
for (const f of subsidiesCode) {
  if (/\bfetch\s*\(/.test(stripComments(fs.readFileSync(f, 'utf8')))) {
    problems.push(`/subsidies: ${path.relative(ROOT, f)} に fetch( がある（一覧は 10 分ごとに作り直す。実行時に外部を読まない）`);
  }
}

if (problems.length) {
  console.error(`[verify:jst-today] ★NG ${problems.length} 件`);
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log('[verify:jst-today] ok   2026-11-04T15:15:00Z（JST 11/5 00:15）で今日は 11/5・11/4 締切は受付終了／締切済／申込不可');
console.log(`[verify:jst-today] ok   /subsidies は revalidate ${SUBSIDIES_REVALIDATE}・読み込み先 ${subsidiesCode.length} 本に microCMS の import と fetch( が無い`);
