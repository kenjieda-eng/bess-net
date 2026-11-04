#!/usr/bin/env tsx
/**
 * scripts/verify-grid-detail-static.ts — 変電所の詳細（/grid/[slug]）が実行時に microCMS を読まないことの検査
 * （変電所の詳細をビルド時の JSON から読む便・2026-11-04）
 *
 * 1. /grid/[slug] のページ（と同じ関数に入る layout・not-found）から読み込み先（@/… と相対）をたどり、microcms.ts と
 *    microcms-js-sdk を値として import していない（import type は可・require も見る）。読み込めば実行時に microCMS を呼べてしまう
 *    ＝429 で 404 に置き換わる穴が戻る。
 * 2. 詳細の JSON（src/lib/generated/grid-detail/*.json）が、一覧の全件と凍結の全件を持つ。
 * 3. 詳細の府県（生のレコードを normalizeSubstationPlace に 1 回通した値）が一覧の値と同じ（#119）。主な数値も一覧と同じ。
 * 4. page.tsx が読む `sub.〇〇` の欄がすべて GRID_DETAIL_FIELDS にある（#118）。
 * 5. 関連事業者の表に、エリアのページと全レコードの事業者が入っていて、空でない。近くの案件の表が空でない（黙って空にならない）。
 * 6. 大きさ: エリアの 1 本は 4MB 以下・合計 16MB 以下（関数の大きさに余裕を持たせる）。
 *
 * microCMS へのアクセスなし。問題があれば exit 1＝ビルドで落ちる。prebuild に入れている。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import lists from '../src/lib/generated/grid-area-lists.json';
import detailIndex from '../src/lib/generated/grid-detail-index.json';
import { GRID_DETAIL_FIELDS } from '../src/lib/grid-detail-fields';
import { normalizeSubstationPlace } from '../src/lib/grid-prefecture';
import { FROZEN_SUBSTATION_SLUGS } from '../src/lib/substations-frozen';
import { AREA_META } from '../src/app/grid/[slug]/area-meta';
export {};

const ROOT = process.cwd();
const problems: string[] = [];

// ── 1. 読み込み先をたどる ─────────────────────────────────────────
const START = path.join(ROOT, 'src', 'app', 'grid', '[slug]', 'page.tsx');
const STARTS = [START, path.join(ROOT, 'src', 'app', 'layout.tsx'), path.join(ROOT, 'src', 'app', 'not-found.tsx')].filter((f) => fs.existsSync(f));
const FORBIDDEN_FILE = path.join(ROOT, 'src', 'lib', 'microcms.ts');
const resolveLocal = (from: string, spec: string): string | null => {
  let base: string;
  if (spec.startsWith('@/')) base = path.join(ROOT, 'src', spec.slice(2));
  else if (spec.startsWith('.')) base = path.resolve(path.dirname(from), spec);
  else return null;
  for (const ext of ['', '.ts', '.tsx', '/index.ts', '/index.tsx']) {
    const f = base + ext;
    if (fs.existsSync(f) && fs.statSync(f).isFile()) return f;
  }
  return null;
};
/** import 句が型だけか（import type X／import { type A, type B }） */
const isTypeOnly = (clause: string): boolean => {
  const c = clause.trim();
  if (/^type\s/.test(c)) return true;
  const m = /^\{([\s\S]*)\}$/.exec(c);
  return !!m && m[1].split(',').map((s) => s.trim()).filter(Boolean).every((s) => /^type\s/.test(s));
};
const seen = new Set<string>();
const parent = new Map<string, string>();
const queue = [...STARTS];
while (queue.length) {
  const file = queue.shift()!;
  if (seen.has(file)) continue;
  seen.add(file);
  if (!/\.(ts|tsx)$/.test(file)) continue;
  const src = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const specs: Array<{ spec: string; typeOnly: boolean }> = [];
  // 句の形を限る（`export type X = …` のような from の無い文から次の from まで伸びて、値の import を「型だけ」と見誤らない）
  const CLAUSE = String.raw`(?:type\s+)?(?:[\w$]+\s*,\s*)?(?:\{[^}]*\}|\*\s+as\s+[\w$]+|\*|[\w$]+)`;
  for (const m of src.matchAll(new RegExp(String.raw`^\s*(?:import|export)\s+(${CLAUSE})\s*from\s+['"]([^'"]+)['"]`, 'gm'))) {
    specs.push({ spec: m[2], typeOnly: isTypeOnly(m[1]) });
  }
  for (const m of src.matchAll(/\brequire\(\s*['"]([^'"]+)['"]\s*\)/g)) specs.push({ spec: m[1], typeOnly: false });
  for (const m of src.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) specs.push({ spec: m[1], typeOnly: false });
  for (const m of src.matchAll(/import\(\s*['"`]([^'"`$]+)/g)) specs.push({ spec: m[1], typeOnly: false });
  for (const { spec, typeOnly } of specs) {
    if (typeOnly) continue;
    if (spec === 'microcms-js-sdk') problems.push(`${path.relative(ROOT, file)} が microcms-js-sdk を import している`);
    const target = resolveLocal(file, spec);
    if (!target) continue;
    if (target === FORBIDDEN_FILE) {
      const via: string[] = [path.relative(ROOT, file)];
      let cur = file;
      while (parent.has(cur)) { cur = parent.get(cur)!; via.unshift(path.relative(ROOT, cur)); }
      problems.push(`microcms.ts を値として import している: ${via.join(' → ')} → src/lib/microcms.ts`);
      continue;
    }
    if (!seen.has(target) && !parent.has(target) && !STARTS.includes(target)) parent.set(target, file);
    queue.push(target);
  }
}

// ── 2〜6. データ ───────────────────────────────────────────────
type Rec = Record<string, unknown> & { slug: string; area?: string[]; operator?: string[]; prefecture?: string | null };
const IDX = detailIndex as unknown as {
  count: number; shard_of: Record<string, string>; with_coords: string[];
  related_operators: Record<string, unknown[]>; shard_sizes_bytes: Record<string, number>;
  nearby_projects: Record<string, unknown[]>; project_geo_count: number;
};
const detailDir = path.join(ROOT, 'src', 'lib', 'generated', 'grid-detail');
const detail = new Map<string, Rec>();
for (const shard of new Set(Object.values(IDX.shard_of))) {
  const recs = JSON.parse(fs.readFileSync(path.join(detailDir, `${shard}.json`), 'utf8')) as Record<string, Rec>;
  for (const [slug, r] of Object.entries(recs)) {
    if (IDX.shard_of[slug] !== shard) problems.push(`${slug}: 索引の分け先 ${IDX.shard_of[slug]} と置き場 ${shard} が違う`);
    detail.set(slug, r);
  }
}
if (detail.size !== IDX.count) problems.push(`詳細の件数 ${detail.size}・索引 ${IDX.count}`);

const listRows = Object.values((lists as unknown as { by_area: Record<string, Rec[]> }).by_area).flat();
for (const s of listRows) {
  const r = detail.get(s.slug);
  if (!r) { problems.push(`${s.slug}: 一覧にあるのに詳細の JSON に無い`); continue; }
  const place = normalizeSubstationPlace(r.prefecture ?? null, Array.isArray(r.area) ? r.area[0] : null);
  if (place.prefecture !== s.prefecture || place.facilityClass !== s.facility_class) {
    problems.push(`${s.slug}: 府県が一覧と違う（詳細 ${place.prefecture}/${place.facilityClass}・一覧 ${s.prefecture}/${s.facility_class}）`);
  }
  for (const k of ['name', 'cap_avail_mw', 'cap_operational_mw', 'capacity_total_mw', 'units', 'voltage_primary_kv', 'voltage_secondary_kv', 'n1_capacity_mw', 'last_updated', 'external_id', 'latitude', 'longitude']) {
    if ((r[k] ?? null) !== (s[k] ?? null)) problems.push(`${s.slug}: ${k} が一覧と違う（詳細 ${r[k]}・一覧 ${s[k]}）`);
  }
}
for (const slug of FROZEN_SUBSTATION_SLUGS) {
  if (!detail.has(slug)) problems.push(`${slug}: 凍結の変電所が詳細の JSON に無い（詳細は 200 のまま残す）`);
}
if (detail.size !== listRows.length + FROZEN_SUBSTATION_SLUGS.size) {
  problems.push(`詳細 ${detail.size} 件・一覧 ${listRows.length}＋凍結 ${FROZEN_SUBSTATION_SLUGS.size}`);
}
const withCoords = [...detail.values()].filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number').length;
if (IDX.with_coords.length !== withCoords) problems.push(`事前生成の座標あり ${IDX.with_coords.length}・詳細の座標あり ${withCoords}`);

const pageSrc = fs.readFileSync(START, 'utf8');
const used = new Set([...pageSrc.matchAll(/\bsub\.([a-z_0-9]+)/g)].map((m) => m[1]));
const allowed = new Set<string>(GRID_DETAIL_FIELDS);
for (const k of used) {
  if (!allowed.has(k)) problems.push(`page.tsx の sub.${k} が GRID_DETAIL_FIELDS に無い（#118: 黙って「情報なし」になる）`);
}

const ops = new Set<string>([
  ...Object.values(AREA_META).map((m) => m.operator),
  ...[...detail.values()].map((r) => (Array.isArray(r.operator) ? r.operator[0] : '')).filter(Boolean),
]);
for (const op of ops) if (!(op in IDX.related_operators)) problems.push(`関連事業者の表に「${op}」が無い`);
// 黙って空にならない: エリアのページの事業者は今 10 社とも 1 件ずつある。0 件になったら取得の欄名・事業者名の変化を疑う
for (const m of Object.values(AREA_META)) {
  if ((IDX.related_operators[m.operator] ?? []).length === 0) problems.push(`関連事業者の表で「${m.operator}」が 0 件（以前は 1 件以上）`);
}
if (IDX.with_coords.length > 0 && (IDX.project_geo_count === 0 || Object.keys(IDX.nearby_projects).length === 0)) {
  problems.push(`近くの案件の表が空（座標のある案件 ${IDX.project_geo_count}・近くの案件のある変電所 ${Object.keys(IDX.nearby_projects).length}）`);
}

const sizes = Object.entries(IDX.shard_sizes_bytes);
const total = sizes.reduce((a, [, b]) => a + b, 0);
for (const [shard, b] of sizes) {
  if (b > 4 * 1024 * 1024) problems.push(`詳細の JSON ${shard}.json が ${(b / 1048576).toFixed(1)}MB（4MB 以下に分ける）`);
}
if (total > 16 * 1024 * 1024) problems.push(`詳細の JSON の合計 ${(total / 1048576).toFixed(1)}MB（16MB 以下）`);

console.log(
  `[verify:grid-detail-static] 読み込み先 ${seen.size} 本・詳細 ${detail.size} 件（一覧 ${listRows.length}＋凍結 ${FROZEN_SUBSTATION_SLUGS.size}）・座標あり ${withCoords}`
  + `・事業者 ${Object.keys(IDX.related_operators).length}・JSON ${sizes.length} 本 計 ${(total / 1048576).toFixed(2)}MB（最大 ${(Math.max(...sizes.map(([, b]) => b)) / 1048576).toFixed(2)}MB）`,
);
if (problems.length) {
  console.error(`[verify:grid-detail-static] ★NG ${problems.length} 件`);
  problems.slice(0, 40).forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log('[verify:grid-detail-static] ok   /grid/[slug] は microCMS を読み込まない・詳細の JSON は一覧と凍結の全件・府県と数値は一覧と同じ');
