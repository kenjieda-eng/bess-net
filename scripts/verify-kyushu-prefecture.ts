#!/usr/bin/env tsx
/**
 * scripts/verify-kyushu-prefecture.ts — 九州の県の検査（九州の県の直し便・2026-11-18・prebuild。落ちたらビルドを止める）
 *
 * 対応表 src/data/kyushu-prefecture-map.json（verified＝供給余力マップで確かめた県・pending＝確認中）と、
 * precompute の出力（一覧の静的データ src/lib/generated/grid-area-lists.json・県別の src/data/substations/<県>.json・index.json）を見る。
 *  1. 表の slug が九州の一覧に実在し、表の external_id がその行の external_id と同じ（No. の振り直しで external_id が変わったら表を作り直す）。
 *  2. 確かめたもの（verified）と確認中（pending）が重ならない。件数が EXPECT と同じ。
 *  3. 確認中の各行: 一覧の県も設備区分も null。どの県の JSON（県のページ）にも入っていない。index の県別・県の行にも数えられていない。
 *  4. 確かめたものの県が表のとおり（違っていた 4 件＝武雄 3 件は佐賀県・南宮崎は宮崎県）。
 *  5. 九州の一覧の県別（確認中を含む）が EXPECT と同じで、合計が九州の件数（884）。index の by_prefecture の 7 県も同じ数。
 *  6. ブラウザの部品（'use client'）が kyushu-prefecture を import していない（対応表をブラウザに送らない）。
 *  7. 否定テスト: 確認中の 1 件を元の県に戻した一覧・確かめた 1 件を元の県に戻した一覧で、1〜5 の検査が落ちること。
 * 表を作り直して数が変わったら、報告とここ（EXPECT）を一緒に直す。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

const EXPECT = {
  records: 884,
  verified: 105,
  pending: 70,
  corrections: { 'kyu-299': '佐賀県', 'kyu-300': '佐賀県', 'kyu-301': '佐賀県', 'kyu-640': '宮崎県' } as Record<string, string>,
  by_pref: { 福岡県: 232, 鹿児島県: 130, 長崎県: 129, 熊本県: 121, 大分県: 107, 宮崎県: 56, 佐賀県: 39, 確認中: 70 } as Record<string, number>,
};
const KYUSHU_PREFS = ['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県'];

type Row = { slug: string; external_id: string | null; prefecture: string | null; facility_class: string | null };
type Table = { verified: Record<string, { eid: string; p: string; was: string }>; pending: Record<string, { eid: string; was: string }> };

const table = JSON.parse(fs.readFileSync('src/data/kyushu-prefecture-map.json', 'utf8')) as Table;
const lists = JSON.parse(fs.readFileSync('src/lib/generated/grid-area-lists.json', 'utf8')) as { by_area: Record<string, Row[]> };
const index = JSON.parse(fs.readFileSync('src/data/substations/index.json', 'utf8')) as {
  by_pref: Record<string, number>; summary: { by_prefecture: Record<string, number> };
};
const prefFiles: Record<string, Row[]> = Object.fromEntries(
  KYUSHU_PREFS.map((p) => [p, JSON.parse(fs.readFileSync(path.join('src/data/substations', `${p}.json`), 'utf8')) as Row[]])
);

function check(rows: Row[], files: Record<string, Row[]>, idx: typeof index): string[] {
  const problems: string[] = [];
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  const v = Object.keys(table.verified);
  const pd = Object.keys(table.pending);
  // 1
  for (const [s, e] of [...Object.entries(table.verified), ...Object.entries(table.pending)]) {
    const r = bySlug.get(s);
    if (!r) { problems.push(`${s}: 表にあるが九州の一覧に無い`); continue; }
    if ((r.external_id ?? '').normalize('NFKC') !== e.eid.normalize('NFKC')) problems.push(`${s}: external_id が表（${e.eid}）と一覧（${r.external_id}）で違う＝表を作り直す`);
  }
  // 2
  for (const s of v) if (s in table.pending) problems.push(`${s}: 確かめたものと確認中の両方にある`);
  if (v.length !== EXPECT.verified) problems.push(`確かめたもの ${v.length}（期待 ${EXPECT.verified}）`);
  if (pd.length !== EXPECT.pending) problems.push(`確認中 ${pd.length}（期待 ${EXPECT.pending}）`);
  // 3
  const inPrefFiles = new Set(Object.values(files).flat().map((r) => r.slug));
  for (const s of pd) {
    const r = bySlug.get(s);
    if (r && (r.prefecture !== null || r.facility_class !== null)) problems.push(`${s}: 確認中なのに一覧の県 ${r.prefecture}・設備区分 ${r.facility_class}`);
    if (inPrefFiles.has(s)) problems.push(`${s}: 確認中なのに県のページの一覧（県の JSON）に入っている`);
  }
  // 4
  for (const [s, e] of Object.entries(table.verified)) {
    const r = bySlug.get(s);
    if (r && r.prefecture !== e.p) problems.push(`${s}: 確かめた県 ${e.p}・一覧 ${r.prefecture}`);
  }
  for (const [s, p] of Object.entries(EXPECT.corrections)) {
    if (table.verified[s]?.p !== p) problems.push(`${s}: 表の県 ${table.verified[s]?.p}（期待 ${p}）`);
    if (bySlug.get(s)?.prefecture !== p) problems.push(`${s}: 一覧の県 ${bySlug.get(s)?.prefecture}（期待 ${p}）`);
  }
  // 5
  const cnt: Record<string, number> = {};
  for (const r of rows) {
    const k = r.prefecture ?? (r.facility_class ? `設備区分:${r.facility_class}` : '確認中');
    cnt[k] = (cnt[k] ?? 0) + 1;
  }
  if (rows.length !== EXPECT.records) problems.push(`九州の一覧 ${rows.length} 件（期待 ${EXPECT.records}）`);
  for (const k of new Set([...Object.keys(cnt), ...Object.keys(EXPECT.by_pref)])) {
    if ((cnt[k] ?? 0) !== (EXPECT.by_pref[k] ?? 0)) problems.push(`県別 ${k}: ${cnt[k] ?? 0}（期待 ${EXPECT.by_pref[k] ?? 0}）`);
  }
  for (const p of KYUSHU_PREFS) {
    const n = files[p].filter((r) => bySlug.has(r.slug)).length;
    if (n !== EXPECT.by_pref[p]) problems.push(`県の JSON ${p}: 九州の行 ${n}（期待 ${EXPECT.by_pref[p]}）`);
    if (idx.summary.by_prefecture[p] !== EXPECT.by_pref[p]) problems.push(`index summary.by_prefecture ${p}: ${idx.summary.by_prefecture[p]}（期待 ${EXPECT.by_pref[p]}）`);
    if (idx.by_pref[p] !== EXPECT.by_pref[p]) problems.push(`index by_pref ${p}: ${idx.by_pref[p]}（期待 ${EXPECT.by_pref[p]}）`);
  }
  return problems;
}

const rows = lists.by_area['九州'] ?? [];
const problems = check(rows, prefFiles, index);

// 6
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(tsx?|jsx?)$/.test(e.name) ? [path.join(d, e.name)] : []));
for (const f of [...walk('src/components'), ...walk('src/app')]) {
  const t = fs.readFileSync(f, 'utf8');
  if (/^['"]use client['"]/m.test(t) && /from ['"][^'"]*kyushu-prefecture['"]/.test(t)) problems.push(`${f}: ブラウザの部品が kyushu-prefecture を import している（対応表がブラウザに送られる）`);
}

// 7 否定テスト（メモリ上で一覧を書き換えて、検査が落ちることを確かめる）
const negatives: Array<[string, () => string[]]> = [
  ['確認中の 1 件を元の県に戻す', () => {
    const [s, e] = Object.entries(table.pending)[0];
    const rs = rows.map((r) => (r.slug === s ? { ...r, prefecture: e.was } : r));
    const fs2 = { ...prefFiles, [e.was]: [...prefFiles[e.was], { ...rows.find((r) => r.slug === s)!, prefecture: e.was }] };
    return check(rs, fs2, index);
  }],
  ['武雄（kyu-299）を元の県（長崎県）に戻す', () => check(rows.map((r) => (r.slug === 'kyu-299' ? { ...r, prefecture: '長崎県' } : r)), prefFiles, index)],
  ['確認中の 1 件の external_id を変える（振り直し）', () => {
    const s = Object.keys(table.pending)[0];
    return check(rows.map((r) => (r.slug === s ? { ...r, external_id: `${r.external_id}(9)` } : r)), prefFiles, index);
  }],
];
for (const [label, run] of negatives) {
  const p = run();
  if (p.length === 0) problems.push(`否定テスト「${label}」で検査が落ちない`);
  else console.log(`[verify:kyushu-prefecture] 否定テスト「${label}」→ 落ちる（${p.length} 件・例: ${p[0]}）`);
}

const cnt: Record<string, number> = {};
for (const r of rows) { const k = r.prefecture ?? '確認中'; cnt[k] = (cnt[k] ?? 0) + 1; }
console.log(`[verify:kyushu-prefecture] 九州 ${rows.length} 件・確かめた ${Object.keys(table.verified).length}・確認中 ${Object.keys(table.pending).length}・県別 ${JSON.stringify(cnt)}`);
if (problems.length) {
  console.error(`[verify:kyushu-prefecture] NG ${problems.length}`);
  for (const p of problems.slice(0, 30)) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('[verify:kyushu-prefecture] ok   表の slug と external_id は一覧と同じ・確かめたものと確認中は重ならない・確認中は県のページに無い・4 件は一次の県・県別の数は期待どおり・ブラウザの部品は対応表を読まない・否定テスト 3 本とも落ちる');
