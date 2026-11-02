#!/usr/bin/env tsx
/**
 * scripts/verify-grid-pages.ts — 県のページの並びと、変電所の詳細の題名の重なりの検査（小さな直し便・2026-11-02）
 *
 * 1. 県のページの一覧（getPrefectureSubstationsStatic）が全県で空容量の降順・件数が pref_meta と同じ。
 *    沖縄県だけ名前順の一覧を返していた（/grid/prefecture/沖縄県 の「空容量大きい順」が逆転）。
 * 2. 同じエリアの中で、変電所の詳細の title と h1 が重ならない。
 * 3. 見分ける語は同じエリアに同名がある変電所だけに付く（ほかの題名は変えない）。
 *
 * microCMS へのアクセスなし（precompute の静的データだけ）。問題があれば exit 1＝ビルドで落ちる。prebuild に入れている。
 */
import substationsIndex from '../src/data/substations/index.json';
import { buildSubstationTitle } from '../src/lib/grid-meta';
import { getAreaSubstationsStatic, getPrefectureSubstationsStatic, nameQualifiers } from '../src/lib/grid-static-lists';
export {};

const index = substationsIndex as unknown as {
  area_dates: Record<string, unknown>;
  pref_meta: Record<string, { count: number }>;
};
const problems: string[] = [];

const prefs = Object.keys(index.pref_meta).filter((p) => p !== 'unknown');
for (const pref of prefs) {
  const list = getPrefectureSubstationsStatic(pref);
  if (list.length !== index.pref_meta[pref].count) problems.push(`${pref}: 一覧 ${list.length} 件・pref_meta ${index.pref_meta[pref].count} 件`);
  const inversions = list.filter((s, i) => i > 0 && (s.cap_avail_mw ?? -1) > (list[i - 1].cap_avail_mw ?? -1)).length;
  if (inversions) problems.push(`${pref}: 空容量の降順でない所が ${inversions} か所（先頭 ${list[0]?.name} ${list[0]?.cap_avail_mw}MW）`);
}

const perArea: string[] = [];
let groupsTotal = 0;
let membersTotal = 0;
for (const area of Object.keys(index.area_dates)) {
  const rows = getAreaSubstationsStatic(area);
  const qualifiers = nameQualifiers(rows);
  const byName = new Map<string, number>();
  for (const s of rows) byName.set(s.name, (byName.get(s.name) ?? 0) + 1);
  const groups = [...byName.values()].filter((n) => n > 1);
  perArea.push(`${area} ${groups.length}`);
  groupsTotal += groups.length;
  membersTotal += groups.reduce((a, b) => a + b, 0);

  for (const s of rows) {
    const same = (byName.get(s.name) ?? 0) > 1;
    if (same !== qualifiers.has(s.slug)) problems.push(`${s.slug} ${s.name}: 同名 ${same} なのに見分ける語が ${qualifiers.get(s.slug) ?? 'なし'}`);
    if (same && !qualifiers.get(s.slug)) problems.push(`${s.slug} ${s.name}: 見分ける語が空`);
  }
  const seen = new Map<string, string>();
  const check = (kind: string, value: string, slug: string) => {
    const key = `${kind}:${value}`;
    if (seen.has(key)) problems.push(`${area}: ${kind}が重なる「${value}」（${seen.get(key)}・${slug}）`);
    seen.set(key, slug);
  };
  for (const s of rows) {
    const q = qualifiers.get(s.slug) ?? null;
    check('title', buildSubstationTitle(s.name, s.prefecture, s.operator ?? '', q), s.slug);
    check('h1', q ? `${s.name}（${q}）` : s.name, s.slug);
  }
}

console.log(`[verify:grid-pages] 県 ${prefs.length}・同じエリアで同名の組 ${groupsTotal}（${membersTotal} 件）: ${perArea.join('・')}`);
if (problems.length) {
  console.error(`[verify:grid-pages] ★NG ${problems.length} 件`);
  problems.slice(0, 40).forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log('[verify:grid-pages] ok   県の一覧は降順・同じエリアで title と h1 の重なり 0');
