#!/usr/bin/env tsx
/**
 * scripts/verify-grid-avail.ts — 空容量の表示値の検査（小さな直し便・2026-11-07・src/lib/grid-avail.ts）
 *
 * 関西電力送配電の公表 CSV で空容量の欄が空の行は、当サイトが同社の算定式「運用容量値 − |予想潮流値|」で算出している。
 * 予想潮流の絶対値が運用容量を上回ると負になるので、表示・並べ替え・絞り込みは 0 として扱う（データは変えない）。
 *
 * 1. （FAIL）負の空容量（当該設備・上位系）は、すべて「関西の算出値」（grid-avail.ts の negativeCalcOf）で説明がつく。
 *    説明のつかない負＝公表元が負の値をそのまま公表している行が現れたら落とす（公表の値の見せ方は別に決める・2026-11-07 便 §2）。
 * 2. （FAIL）表示に使う値（shownAvailMw・shownAvailUpperMw）に負が無い（一覧・詳細の全件）。
 * 3. （FAIL）一覧の行は予想潮流を持っている（落とすと一覧だけ負のまま出る＝#118 と同じ型）。一覧と詳細で同じ行が同じ判定になる。
 * 4. （FAIL）空容量を画面に出す部品が grid-avail.ts を通っている。通らずに生の cap_avail_mw を出してよいのは、
 *    関西の行が来ない部品か、空容量プラスの行だけを出す部品（下の RAW_OK・理由つき）。
 *
 * microCMS へのアクセスなし（precompute の静的データだけ）。prebuild に入れている。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { negativeCalcOf, shownAvailMw, shownAvailUpperMw } from '../src/lib/grid-avail';
export {};

type Rec = Record<string, unknown> & { slug: string; area?: unknown };
const problems: string[] = [];
const num = (v: unknown): number | null => (typeof v === 'number' ? v : null);

// 詳細（凍結も含む全件）
const detailDir = 'src/lib/generated/grid-detail';
const detail = new Map<string, Rec>();
for (const f of fs.readdirSync(detailDir).filter((f) => f.endsWith('.json'))) {
  for (const [slug, r] of Object.entries(JSON.parse(fs.readFileSync(path.join(detailDir, f), 'utf8')) as Record<string, Rec>)) detail.set(slug, r);
}
const areaOf = (r: Rec): string => (Array.isArray(r.area) ? String(r.area[0] ?? '') : String(r.area ?? '')) || '(不明)';

const table = new Map<string, { calc: number; published: number; upperCalc: number; upperPublished: number }>();
const calcSlugs: string[] = [];
for (const r of detail.values()) {
  const area = areaOf(r);
  const row = table.get(area) ?? { calc: 0, published: 0, upperCalc: 0, upperPublished: 0 };
  const v = num(r.cap_avail_mw);
  const u = num(r.cap_avail_upper_mw);
  const input = { area: r.area as string[], cap_avail_mw: v, cap_avail_upper_mw: u, cap_operational_mw: num(r.cap_operational_mw), forecast_flow_mw: num(r.forecast_flow_mw) };
  if (v !== null && v < 0) {
    if (negativeCalcOf(v, input)) { row.calc++; calcSlugs.push(r.slug); }
    else { row.published++; problems.push(`${r.slug}（${area}）: 空容量 ${v} は関西の算定式で説明がつかない負の値（公表の負？）`); }
  }
  if (u !== null && u < 0) {
    if (negativeCalcOf(u, input)) row.upperCalc++;
    else { row.upperPublished++; problems.push(`${r.slug}（${area}）: 空容量（上位系）${u} は関西の算定式で説明がつかない負の値`); }
  }
  const sv = shownAvailMw(input);
  const su = shownAvailUpperMw(input);
  if ((sv !== null && sv < 0) || (su !== null && su < 0)) problems.push(`${r.slug}: 表示の値が負（${sv}／${su}）`);
  table.set(area, row);
}

// 一覧（凍結を除く）: 予想潮流を持ち、詳細と同じ判定になる
const lists = JSON.parse(fs.readFileSync('src/lib/generated/grid-area-lists.json', 'utf8')) as { by_area: Record<string, Rec[]> };
let listCalc = 0;
for (const rows of Object.values(lists.by_area)) {
  for (const s of rows) {
    if (!('forecast_flow_mw' in s)) { problems.push(`${s.slug}: 一覧の行に forecast_flow_mw が無い（#118）`); continue; }
    const shown = shownAvailMw(s as never);
    if (shown !== null && shown < 0) problems.push(`${s.slug}: 一覧の表示の値が負（${shown}）`);
    const neg = negativeCalcOf(num(s.cap_avail_mw), s as never) !== null;
    if (neg) listCalc++;
    const d = detail.get(s.slug);
    if (d && neg !== (negativeCalcOf(num(d.cap_avail_mw), { area: d.area as string[], cap_operational_mw: num(d.cap_operational_mw), forecast_flow_mw: num(d.forecast_flow_mw) }) !== null)) {
      problems.push(`${s.slug}: 一覧と詳細で「算出値が負」の判定が違う`);
    }
  }
}

// 画面に空容量を出す部品
const MUST_USE = [
  'src/app/grid/[slug]/page.tsx',
  'src/app/grid/[slug]/AreaPage.tsx',
  'src/components/SubstationsBrowser.tsx',
  'src/app/grid/prefecture/[prefecture]/page.tsx',
  'src/app/grid/search/page.tsx',
  'src/lib/grid-search-core.ts',
  'src/components/GridConnectionChecker.tsx',
  'src/lib/grid-connection-checker.ts',
  'src/app/tracker/grid/page.tsx',
  'scripts/precompute-substations.ts',
];
for (const f of MUST_USE) {
  if (!/from '(?:@\/lib|\.\.?\/(?:\.\.\/)*(?:src\/)?lib|\.)\/grid-avail'/.test(fs.readFileSync(f, 'utf8'))) problems.push(`${f}: grid-avail.ts を通っていない`);
}
/** 生の cap_avail_mw を画面に出してよい所（理由つき） */
const RAW_OK: Record<string, string> = {
  'src/app/grid/page.tsx': '注目変電所＝空容量プラス × N-1 可の行だけ',
  'src/app/grid/chubu/map/page.tsx': '中部だけ（座標は中部だけ）',
  'src/components/ChubuMap.tsx': '中部だけ',
  'src/app/projects/[slug]/page.tsx': '接続変電所候補＝座標のある変電所（中部だけ）',
  'src/app/grid/prefecture/[prefecture]/page.tsx': '冒頭の上位＝gridFacts（空容量プラスの行だけ）',
  'src/app/grid/[slug]/AreaPage.tsx': '空容量プラス TOP20（プラスの行だけ）',
};
const rawShown: string[] = [];
const walk = (dir: string): string[] => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name).replace(/\\/g, '/');
  if (e.isDirectory()) return p.includes('/generated') ? [] : walk(p);
  return /\.tsx?$/.test(e.name) ? [p] : [];
});
for (const f of [...walk('src/app'), ...walk('src/components')]) {
  const src = fs.readFileSync(f, 'utf8');
  // 画面に出す形（テンプレートの ${x.cap_avail_mw} と JSX の {x.cap_avail_mw ...}）
  const hits = src.split('\n').filter((l) => /\$\{\s*\w+\.cap_avail_mw\b|\{\s*(?:fmt\()?\w+\.cap_avail_mw\b/.test(l) && !/^\s*(?:\/\/|\*)/.test(l));
  if (hits.length && !RAW_OK[f]) problems.push(`${f}: 生の cap_avail_mw を画面に出している（grid-avail.ts の shownAvailMw を通す）: ${hits[0].trim().slice(0, 80)}`);
  if (hits.length) rawShown.push(`${f}（${hits.length} 行・${RAW_OK[f] ?? '—'}）`);
}

const rows = [...table.entries()].filter(([, r]) => r.calc + r.published + r.upperCalc + r.upperPublished > 0);
console.log(`[verify:grid-avail] 負の空容量（詳細 ${detail.size.toLocaleString()} 件・凍結を含む）: ${rows.length ? rows.map(([a, r]) => `${a} 算出 ${r.calc}・公表 ${r.published}（上位系 算出 ${r.upperCalc}・公表 ${r.upperPublished}）`).join('／') : '0 件'}`);
console.log(`[verify:grid-avail] 一覧で 0 と表示する行 ${listCalc} 件・生の値を出してよい所 ${rawShown.length} か所`);
if (problems.length) {
  console.error(`[verify:grid-avail] ★NG ${problems.length} 件`);
  problems.slice(0, 40).forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log('[verify:grid-avail] ok   負の空容量はすべて関西の算出値・表示の値に負 0・一覧は予想潮流を持つ');
