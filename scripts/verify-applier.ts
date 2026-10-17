#!/usr/bin/env tsx
/**
 * scripts/verify-applier.ts — scripts/lib/microcms-applier.ts の判定の自己検査（Ck2e 第 5 版便・2026-10-17）
 *
 * 合成のレコードだけで動く（microCMS に触れない）。改修の内容:
 *   (1) 正規化テキスト（plain）で区別できない op（空白・全角半角・タグだけの変更）は、生の文字列だけで適用済みを判定する。
 *       expect_final（plain の sha）が一致していても、そういう op が生でまだ当たっていなければレコードを skip しない。
 *   (3) dry run の最後に、送る値と「計画を生の文字列で当てた値」を突き合わせる（rawMismatches）。
 * 検査:
 *   (a) 見えない差の op が当たる（applyOps の payload と、expect_final で skip しないこと）
 *   (b) 当てた後の再実行で skip になる（already・payload 空・expect_final で skip）
 *   (c) 置換・追記・空にする・配列（JSON 値モード）・中止の判定が、改修前の applyOps（下に逐語で写した legacyApplyOps）と同じ
 *   (d) 改修前の判定（見えない差の op を適用済みにする）を rawMismatches が不一致として検出する／改修後は不一致 0
 * 実行: npx tsx scripts/verify-applier.ts
 */
import { applyOps, canSkipByExpectFinal, digest, isInvisibleOp, plain, rawMismatches, type Op, type Patch } from './lib/microcms-applier';

export {};

type Rec = Record<string, unknown> & { id: string; slug: string };
let checks = 0;
const fails: string[] = [];
const ok = (cond: boolean, msg: string) => { checks++; if (!cond) fails.push(msg); };
const J = (v: unknown) => JSON.stringify(v);
const op = (field: string, old: string, nw: string, note?: string): Op => ({ field, old, new: nw, row_ids: ['T'], ...(note ? { note } : {}) });
const rec = (o: Record<string, unknown>): Rec => ({ id: 'x', slug: 'x', ...o });

// ---- 改修前の applyOps（2026-10-16 の HEAD・逐語）。(c) の基準 ----
const norm = (v: unknown) => JSON.stringify(v === undefined || v === '' ? null : v);
const isArrayField = (v: unknown) => Array.isArray(v);
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);
function legacyApplyOps(rec: Rec, ops: Op[]): { payload: Record<string, unknown>; already: number; problems: string[] } {
  const cur: Record<string, unknown> = {};
  const problems: string[] = [];
  let already = 0;
  for (const op of ops) {
    const base = op.field in cur ? cur[op.field] : rec[op.field];
    if (isArrayField(base) || op.note?.includes('配列')) {
      const want = JSON.parse(op.new);
      if (norm(base) === norm(want)) { already++; continue; }
      if (norm(base) !== norm(JSON.parse(op.old))) { problems.push(`${op.field}: 配列の現在値 ${norm(base)} が old と不一致`); continue; }
      cur[op.field] = want;
      continue;
    }
    const s = typeof base === 'string' ? base : base == null ? '' : String(base);
    const n = count(s, op.old);
    const oldP = plain(op.old), newP = plain(op.new);
    const appendType = op.new !== '' && (op.new.includes(op.old) || (oldP !== '' && newP.includes(oldP)));
    const newPresent = op.new !== '' && (s.includes(op.new) || (newP.length >= 6 && plain(s).includes(newP)));
    if (appendType && newPresent) { already++; continue; }
    if (n === 1) { cur[op.field] = s.replace(op.old, () => op.new); continue; }
    if (n === 0) {
      const done = op.new === '' ? (oldP === '' || !plain(s).includes(oldP)) : (newPresent && (oldP === '' || !plain(s).includes(oldP) || newP.includes(oldP)));
      if (done) { already++; continue; }
      problems.push(`${op.field}: old が 0 回（rows ${op.row_ids.join(',')}）`);
      continue;
    }
    problems.push(`${op.field}: old が ${n} 回（一意でない・rows ${op.row_ids.join(',')}）`);
  }
  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(cur)) if (norm(v) !== norm(rec[k])) payload[k] = v;
  return { payload, already, problems };
}

// ---- (a)(b) 見えない差の op ----
const INVIS: { name: string; before: string; ops: Op[]; after: string }[] = [
  { name: '半角の閉じ括弧→全角', before: '<p>（6)技術相談・コンサルティング</p>', ops: [op('detail', '（6)技術相談', '（6）技術相談')], after: '<p>（6）技術相談・コンサルティング</p>' },
  // 改修前の applyOps は正規化テキストが 6 字以上のときだけ plain で「new が在る」とみなす（短い例は改修前でも当たる）。実際に当たらなかったのは 6 字以上の型
  { name: '空白だけ（連続空白を 1 つに）', before: '<p>系統用蓄電池  の解説です</p>', ops: [op('body', '系統用蓄電池  の解説', '系統用蓄電池 の解説')], after: '<p>系統用蓄電池 の解説です</p>' },
  { name: 'タグだけ（平文の URL を a で包む）', before: '<p>出典 https://example.jp/x </p>', ops: [op('sources', 'https://example.jp/x', '<a href="https://example.jp/x">https://example.jp/x</a>')], after: '<p>出典 <a href="https://example.jp/x">https://example.jp/x</a> </p>' },
  { name: '改行だけ（区切りの空白を改行に）', before: '資料A（2026年）　資料B（2025年）', ops: [op('sources', '資料A（2026年）　資料B（2025年）', '資料A（2026年）\n資料B（2025年）')], after: '資料A（2026年）\n資料B（2025年）' },
];
for (const c of INVIS) {
  const field = c.ops[0].field;
  ok(c.ops.every(isInvisibleOp), `(a) ${c.name}: isInvisibleOp が真でない`);
  const r0 = rec({ [field]: c.before });
  const a = applyOps(r0, c.ops);
  ok(a.problems.length === 0 && a.payload[field] === c.after, `(a) ${c.name}: 当たらない（payload ${J(a.payload)} problems ${J(a.problems)}）`);
  const legacy = legacyApplyOps(r0, c.ops);
  ok(!(field in legacy.payload), `(a) ${c.name}: 改修前は当たらないはず（前提の確認）`);
  const p: Patch = { ep: 'e', slug: 'x', order: 1, ops: c.ops, expect_final: { [field]: digest(c.after) } };
  ok(!canSkipByExpectFinal(r0, p), `(a) ${c.name}: expect_final が一致しても、未適用なら skip しない`);
  ok(rawMismatches(r0, c.ops, a.payload).length === 0, `(d) ${c.name}: 改修後の送信値が生の文字列の計画と一致しない`);
  ok(rawMismatches(r0, c.ops, legacy.payload).length === 1, `(d) ${c.name}: 改修前の判定（当たらない）を生の文字列の突き合わせが検出しない`);
  // (b) 当てた後の再実行
  const r1 = rec({ [field]: c.after });
  const b = applyOps(r1, c.ops);
  ok(b.problems.length === 0 && Object.keys(b.payload).length === 0 && b.already === c.ops.length, `(b) ${c.name}: 再実行で skip にならない（${J(b)}）`);
  ok(canSkipByExpectFinal(r1, p), `(b) ${c.name}: 当てた後は expect_final で skip する`);
  ok(rawMismatches(r1, c.ops, b.payload).length === 0, `(b) ${c.name}: 再実行で生の文字列の突き合わせが不一致`);
}

// ---- (c) それ以外の op は改修前と同じ判定 ----
const CASES: { name: string; r: Record<string, unknown>; ops: Op[] }[] = [
  { name: '置換（1 回）', r: { body: '<p>旧い文。</p>' }, ops: [op('body', '旧い文', '新しい文')] },
  { name: '置換（再実行・old 0 回で new あり）', r: { body: '<p>新しい文。</p>' }, ops: [op('body', '旧い文', '新しい文')] },
  { name: '追記型（初回）', r: { body: '<p>A。</p>' }, ops: [op('body', 'A。', 'A。B。')] },
  { name: '追記型（再実行）', r: { body: '<p>A。B。</p>' }, ops: [op('body', 'A。', 'A。B。')] },
  { name: '追記型（richEditor の &apos; 正規化後の再実行）', r: { body: '<p>A。It&apos;s B。</p>' }, ops: [op('body', 'A。', "A。It's B。")] },
  { name: '空にする（初回）', r: { body: '<p>X</p><p>削る段落</p>' }, ops: [op('body', '<p>削る段落</p>', '')] },
  { name: '空にする（再実行）', r: { body: '<p>X</p>' }, ops: [op('body', '<p>削る段落</p>', '')] },
  { name: '欄ごと空にする', r: { applicationStart: '二次募集' }, ops: [op('applicationStart', '二次募集', '')] },
  { name: '配列（JSON 値モード・初回）', r: { eventTopics: ['省エネ', 'BESS', '自家消費'] }, ops: [op('eventTopics', '["省エネ","BESS","自家消費"]', '["省エネ","BESS"]')] },
  { name: '配列（再実行）', r: { eventTopics: ['省エネ', 'BESS'] }, ops: [op('eventTopics', '["省エネ","BESS","自家消費"]', '["省エネ","BESS"]')] },
  { name: 'null 欄に配列（note に「配列」）', r: { tags: null }, ops: [op('tags', 'null', '["a"]', '配列の値を入れる')] },
  { name: '中止（old 0 回・new も無い）', r: { body: '<p>別の文</p>' }, ops: [op('body', '旧い文', '新しい文')] },
  { name: '中止（old 2 回）', r: { body: '<p>同じ。同じ。</p>' }, ops: [op('body', '同じ', '違う')] },
  { name: '同じ欄に 2 op（順に当たる）', r: { body: '<p>A と B</p>' }, ops: [op('body', 'A', 'A2'), op('body', 'B', 'B2')] },
  { name: '置換＋見えない差でない全角化（文字が変わる）', r: { title: '2026年度 上限' }, ops: [op('title', '2026年度', '2026年3月')] },
];
for (const c of CASES) {
  const r = rec(c.r);
  ok(!c.ops.some(isInvisibleOp), `(c) ${c.name}: 見えない差の op と判定された`);
  const now = applyOps(r, c.ops), was = legacyApplyOps(r, c.ops);
  ok(J(now) === J(was), `(c) ${c.name}: 改修前と判定が違う（今 ${J(now)} ／ 前 ${J(was)}）`);
  if (!now.problems.length) ok(rawMismatches(r, c.ops, now.payload).length === 0, `(c) ${c.name}: 生の文字列の突き合わせが不一致（誤検出）`);
}

console.log(`[verify:applier] 検査 ${checks} 件（見えない差 ${INVIS.length} 型・その他 ${CASES.length} 型）`);
if (fails.length) {
  console.error(`[verify:applier] NG ${fails.length} 件`);
  for (const f of fails) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('[verify:applier] ok   見えない差の op が当たる・再実行で skip・その他の判定は改修前と同じ・生の文字列の突き合わせ');
