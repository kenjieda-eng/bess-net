#!/usr/bin/env tsx
/**
 * scripts/verify-kansai-prefecture.ts — 関西の府県の割り当ての検査（関西の府県の割り当て便・2026-11-07・prebuild）
 *
 * 1. 対応表（src/data/kansai-prefecture-map.json）の府県は 6 府県＋福井・三重の 8 つだけ。根拠は「図」「図＋住所」「住所」だけ。
 * 2. 割り当ての件数が報告（reports/kansai-prefecture-assign-2026-11-07.md）の数と同じ。図を作り直して数が変わったら、報告とここを一緒に直す。
 * 3. 割り当てない区分（2 府県以上・関ケ原・頭の字が合わない・組み立て・見つからない）の No. が対応表に入っていない。
 * 4. 二重の正規化が無い（#119）:
 *    - 一覧の静的データ（precompute の grid-area-lists）の関西の各行の府県が、対応表を生の external_id で 1 回引いた値と同じ。
 *      設備区分（関西ローカル系・基幹系統）は消えていない。
 *    - ブラウザの部品（'use client'）が grid-prefecture／kansai-prefecture を import していない（対応表をブラウザに送らない・
 *      正規化済みの値に掛け直さない）。
 * 5. 対応表の項目は、どれも当サイトの関西のレコードの external_id にある（古い No. が残っていない）。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { kansaiPrefectureEntries, kansaiPrefectureOf } from '../src/lib/kansai-prefecture';
export {};

const ALLOWED = new Set(['大阪府', '京都府', '兵庫県', '奈良県', '滋賀県', '和歌山県', '福井県', '三重県']);
// 2 の数（報告の (2)・(5)）。行の数（同じ No. の電圧面違いを含む）
const EXPECT = {
  local_assigned_records: 1332,
  kikan_assigned_records: 7,
  entries: 1120,
  by_pref_records: { 兵庫県: 452, 大阪府: 323, 京都府: 189, 滋賀県: 152, 和歌山県: 112, 奈良県: 93, 福井県: 12, 三重県: 6 } as Record<string, number>,
  excluded_records: { '2府県以上': 54, 関ケ原: 6, 頭の字が合わない: 5, 組み立て: 71, 見つからない: 106 } as Record<string, number>,
};

const problems: string[] = [];
const map = JSON.parse(fs.readFileSync('src/data/kansai-prefecture-map.json', 'utf8')) as {
  counts: { local_assigned_records: number; kikan_assigned_records: number; entries: number; by_pref_records: Record<string, number>; by_category_records: Record<string, number> };
  excluded: Record<string, string[]>;
};
const entries = kansaiPrefectureEntries();

// 1
for (const [k, e] of Object.entries(entries)) {
  if (!ALLOWED.has(e.p)) problems.push(`${k}: 府県が 8 つの外「${e.p}」`);
  if (!['図', '図＋住所', '住所'].includes(e.b)) problems.push(`${k}: 根拠が想定の外「${e.b}」`);
  if (e.b === '住所' && !k.startsWith('kansai_kikan_')) problems.push(`${k}: 住所の根拠は基幹系統だけのはず`);
}
// 2
if (map.counts.local_assigned_records !== EXPECT.local_assigned_records) problems.push(`ローカル系の割り当て ${map.counts.local_assigned_records}（報告 ${EXPECT.local_assigned_records}）`);
if (map.counts.kikan_assigned_records !== EXPECT.kikan_assigned_records) problems.push(`基幹系統の割り当て ${map.counts.kikan_assigned_records}（報告 ${EXPECT.kikan_assigned_records}）`);
if (Object.keys(entries).length !== EXPECT.entries || map.counts.entries !== EXPECT.entries) problems.push(`対応表の項目 ${Object.keys(entries).length}（報告 ${EXPECT.entries}）`);
for (const [p, n] of Object.entries(EXPECT.by_pref_records)) {
  if ((map.counts.by_pref_records[p] ?? 0) !== n) problems.push(`${p}: ${map.counts.by_pref_records[p] ?? 0} 行（報告 ${n}）`);
}
for (const [c, n] of Object.entries(EXPECT.excluded_records)) {
  if ((map.counts.by_category_records[c] ?? 0) !== n) problems.push(`割り当てない「${c}」: ${map.counts.by_category_records[c] ?? 0} 行（報告 ${n}）`);
}
// 3
for (const [cat, nos] of Object.entries(map.excluded)) {
  for (const no of nos) {
    if (`kansai_local_${no}`.normalize('NFKC') in entries) problems.push(`割り当てない「${cat}」の ${no} が対応表にある`);
  }
}
// 4・5: 一覧の静的データ（prebuild の build:substations の出力）
type Row = { slug: string; external_id: string | null; prefecture: string | null; facility_class: string | null };
const lists = JSON.parse(fs.readFileSync('src/lib/generated/grid-area-lists.json', 'utf8')) as { by_area: Record<string, Row[]> };
const kansai = lists.by_area['関西'] ?? [];
if (kansai.length < 1500) problems.push(`一覧の関西が ${kansai.length} 件（少なすぎる）`);
const seen = new Set<string>();
let withPref = 0;
for (const r of kansai) {
  const want = kansaiPrefectureOf(r.external_id)?.prefecture ?? null;
  if (r.prefecture !== want) problems.push(`${r.slug}: 一覧の府県 ${r.prefecture}・対応表 ${want}`);
  if (r.prefecture) withPref++;
  const kind = (r.external_id ?? '').includes('_kikan_') ? '基幹系統' : '関西ローカル系';
  if (r.facility_class !== kind) problems.push(`${r.slug}: 設備区分が ${r.facility_class}（${kind} のはず）`);
  if (r.external_id) seen.add(r.external_id.normalize('NFKC'));
}
for (const k of Object.keys(entries)) if (!seen.has(k)) problems.push(`対応表の ${k} が当サイトの関西の一覧に無い`);
// ブラウザの部品が府県の導出を import していない
const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : /\.(tsx?|jsx?)$/.test(e.name) ? [path.join(d, e.name)] : []));
for (const f of [...walk('src/components'), ...walk('src/app')]) {
  const t = fs.readFileSync(f, 'utf8');
  if (/^['"]use client['"]/m.test(t) && /from ['"][^'"]*(grid-prefecture|kansai-prefecture)['"]/.test(t)) {
    problems.push(`${f}: ブラウザの部品が府県の導出を import している（二重の正規化・対応表がブラウザに送られる）`);
  }
}

console.log(`[verify:kansai-prefecture] 対応表 ${Object.keys(entries).length} 項目・一覧の関西 ${kansai.length} 件のうち府県あり ${withPref} 件・府県別 ${JSON.stringify(map.counts.by_pref_records)}`);
if (problems.length) {
  console.error(`[verify:kansai-prefecture] NG ${problems.length}`);
  for (const p of problems.slice(0, 30)) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('[verify:kansai-prefecture] ok   府県は 8 つだけ・件数は報告どおり・割り当てない区分は表に無い・一覧の府県は対応表と同じ（1 回だけ導出）・ブラウザの部品は府県の導出を読まない');
