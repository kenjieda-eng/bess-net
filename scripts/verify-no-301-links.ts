#!/usr/bin/env tsx
/**
 * scripts/verify-no-301-links.ts — 「サイト内リンクが 301 元を指していない」機械検査（金曜#6 追修便 ■4・2026-09-11）
 *
 * 背景: /glossary 一覧が表示除外（1 件）しか見ておらず、GLOSSARY_301 の元 slug 143 件中 142 件へ直接リンクしていた。
 *   Pj2-G ■3.5 の近隣プロジェクトカード（301元・案件性なしが候補に残っていた）と同型の欠陥で、
 *   「リンクを並べる面」ごとに除外の配線が抜けると静かに再発する。面ごとに別々の検査を持つと追加漏れが起きるため、
 *   ビルド成果物（built HTML）を 1 本の検査で全面走査する形に寄せた。
 *
 * 検査（書込なし）:
 *   軸1（配線・静的）: 一覧系の実装が除外関数を呼んでいるか（退行検知）
 *       /glossary 一覧 → isGlossaryListExcluded(   ／ sitemap → GLOSSARY_301_SOURCE_SLUGS・LIST_EXCLUDED_PROJECT_SLUGS
 *       /projects 一覧 → LIST_EXCLUDED_PROJECT_SLUGS ／ 近隣プロジェクトカード → isListExcludedProject(（verify:nearby-cards と同じ窓）
 *   軸2（built HTML・全面）: .next/server/app 配下の全 .html と sitemap.xml.body を走査し、
 *       /glossary/<GLOSSARY_301 の元>・/projects/<PROJECTS_301 の元>・next.config の静的 redirect 元 へのリンクを数える。
 *       一覧・sitemap は 0 が必須（FAIL）。それ以外（詳細ページの関連カード・パンくず・本文）は件数と内訳を出す
 *       （--strict を付けると詳細ページも 0 必須）。
 *   ※ オンデマンド ISR でビルド時に生成されないページは走査対象外（built HTML に無い）。
 *
 * 実行: npm run build の後に `npx tsx scripts/verify-no-301-links.ts [--strict]`（npm run verify:no-301-links）
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { GLOSSARY_301_SOURCE_SLUGS, canonicalGlossarySlug } from '../src/lib/glossary-301';
import { PROJECTS_301_SOURCE_SLUGS } from '../src/lib/projects-301';
import { GRID_PAGE_RELATED_TERMS } from '../src/app/grid/[slug]/related-terms';

const STRICT = process.argv.includes('--strict');
const APP = '.next/server/app';
let fail = 0;

// ── 軸1: 配線
function wired(file: string, re: RegExp, anchor?: [string, string]): boolean {
  const src = readFileSync(file, 'utf8');
  if (!anchor) return re.test(src);
  const a = src.indexOf(anchor[0]);
  const b = src.indexOf(anchor[1], a + 1);
  return a >= 0 && re.test(src.slice(a, b > a ? b : a + 4000));
}
const WIRES: Array<[string, string, RegExp, [string, string]?]> = [
  ['/glossary 一覧', 'src/app/glossary/page.tsx', /isGlossaryListExcluded\s*\(/],
  ['sitemap（glossary）', 'src/app/sitemap.ts', /GLOSSARY_301_SOURCE_SLUGS\.has\(/],
  ['sitemap（projects）', 'src/app/sitemap.ts', /LIST_EXCLUDED_PROJECT_SLUGS|isListExcludedProject\s*\(/],
  ['/projects 一覧', 'src/app/projects/page.tsx', /LIST_EXCLUDED_PROJECT_SLUGS\.has\(/],
  ['近隣プロジェクトカード', 'src/lib/related-cards.ts', /isListExcludedProject\s*\(/, ['export async function getNearbyProjects', 'export async function getNearbySubstations']],
];
console.log('[verify:no-301-links] 軸1: 一覧系の除外配線');
for (const [label, file, re, anchor] of WIRES) {
  const ok = existsSync(file) && wired(file, re, anchor);
  console.log(`   ${ok ? '✓' : '✗ 未配線'} ${label}（${file}）`);
  if (!ok) fail++;
}
// 軸1b（追修便② ■7(b)）: キュレーション済みの固定リンクは「除外」でなく「301 の宛先へ差し替え」。301 元が残っていれば FAIL
const gridHits = GRID_PAGE_RELATED_TERMS.filter((t) => GLOSSARY_301_SOURCE_SLUGS.has(t.slug));
console.log(`   ${gridHits.length === 0 ? '✓' : '✗'} /grid 関連用語の固定リンク（src/app/grid/[slug]/related-terms.ts）: 301 元 ${gridHits.length}${gridHits.length ? `（${gridHits.map((t) => `${t.term}=${t.slug}→${canonicalGlossarySlug(t.slug)}`).join('・')}）` : ''}・${GRID_PAGE_RELATED_TERMS.length} 語`);
if (gridHits.length) fail++;

// ── 軸2: built HTML 全面走査
const nextCfg = existsSync('next.config.js') ? readFileSync('next.config.js', 'utf8') : '';
const staticRedirects = new Set([...nextCfg.matchAll(/source:\s*'([^']+)'/g)].map((m) => m[1]).filter((s) => !s.includes(':')));
const is301 = (path: string): string | null => {
  const p = path.replace(/^https?:\/\/[^/]+/, '').replace(/[?#].*$/, '').replace(/\/$/, '');
  let m = /^\/glossary\/([^/]+)$/.exec(p);
  if (m && GLOSSARY_301_SOURCE_SLUGS.has(decodeURIComponent(m[1]))) return 'glossary';
  m = /^\/projects\/([^/]+)$/.exec(p);
  if (m && PROJECTS_301_SOURCE_SLUGS.has(decodeURIComponent(m[1]))) return 'projects';
  if (staticRedirects.has(p)) return 'static';
  return null;
};
function walk(dir: string, out: string[]): string[] {
  for (const n of readdirSync(dir)) {
    const f = join(dir, n);
    if (statSync(f).isDirectory()) walk(f, out);
    else if (n.endsWith('.html') || n === 'sitemap.xml.body') out.push(f);
  }
  return out;
}
if (!existsSync(APP)) {
  console.log(`\n軸2: ${APP} が無い（未ビルド）→ スキップ。npm run build の後に実行する`);
} else {
  // 301元のページ自体（middleware が 301 するため利用者には配信されない）の中のリンクは数えない
  const servedFile = (f: string): boolean => {
    const m = /[\\/](glossary|projects)[\\/]([^\\/]+)\.html$/.exec(f);
    if (!m) return true;
    return m[1] === 'glossary' ? !GLOSSARY_301_SOURCE_SLUGS.has(m[2]) : !PROJECTS_301_SOURCE_SLUGS.has(m[2]);
  };
  const files = walk(APP, []).filter(servedFile);
  const LIST_FILES = new Set(['glossary.html', 'projects.html', 'sitemap.xml.body', 'index.html']);
  const byFile = new Map<string, { n: number; kinds: Record<string, number>; samples: Set<string> }>();
  for (const f of files) {
    const s = readFileSync(f, 'utf8');
    const urls = [...s.matchAll(/href="([^"]+)"/g), ...s.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    for (const u of urls) {
      if (!(u.startsWith('/') || u.startsWith('https://bess-net.jp/'))) continue;
      const k = is301(u);
      if (!k) continue;
      const rel = relative(APP, f).replace(/\\/g, '/');
      const e = byFile.get(rel) ?? { n: 0, kinds: {}, samples: new Set<string>() };
      e.n++; e.kinds[k] = (e.kinds[k] ?? 0) + 1; if (e.samples.size < 4) e.samples.add(u);
      byFile.set(rel, e);
    }
  }
  const listHits = [...byFile.entries()].filter(([f]) => LIST_FILES.has(f));
  const detailHits = [...byFile.entries()].filter(([f]) => !LIST_FILES.has(f));
  const total = (xs: typeof listHits) => xs.reduce((a, [, e]) => a + e.n, 0);
  console.log(`\n軸2: built HTML ${files.length} ファイルを走査（301元: glossary ${GLOSSARY_301_SOURCE_SLUGS.size}・projects ${PROJECTS_301_SOURCE_SLUGS.size}・静的 ${staticRedirects.size}）`);
  for (const f of ['glossary.html', 'projects.html', 'sitemap.xml.body', 'index.html']) {
    const e = byFile.get(f);
    console.log(`   ${e ? '✗' : '✓'} ${f}: 301元リンク ${e?.n ?? 0}${e ? `（${JSON.stringify(e.kinds)} 例: ${[...e.samples].join(' ')}）` : ''}`);
  }
  if (total(listHits) > 0) fail++;

  // 軸3（追修便② ■7(a)）: 一覧から外した 301 元は「重複の解消」であって「語の消失」ではないことを担保する。
  //   一覧に出ていない 301 元それぞれについて、301 の最終宛先（チェーンは canonicalGlossarySlug で解決）が一覧に出ていること。
  //   宛先が一覧に無ければ、その語は一覧から消えている（FAIL・slug を列挙）。
  const glossaryHtml = existsSync(join(APP, 'glossary.html')) ? readFileSync(join(APP, 'glossary.html'), 'utf8') : '';
  const shown = new Set([...glossaryHtml.matchAll(/href="\/glossary\/([^"#?]+)"/g)].map((m) => decodeURIComponent(m[1])));
  const sources = [...GLOSSARY_301_SOURCE_SLUGS];
  const missing = sources
    .filter((s) => !shown.has(s))
    .map((s) => ({ s, to: canonicalGlossarySlug(s) }))
    .filter(({ to }) => !shown.has(to));
  console.log(`\n軸3: /glossary 一覧の 301 元 ${sources.length} 件 → 宛先の掲載（一覧の語数 ${shown.size}）`);
  console.log(`   ${missing.length === 0 ? '✓' : '✗'} 宛先が一覧に無い 301 元: ${missing.length}${missing.length ? `（${missing.map(({ s, to }) => `${s}→${to}`).join(' ')}）` : '（除外はすべて重複の解消＝語の消失なし）'}`);
  if (!glossaryHtml) { console.log('   ✗ glossary.html が無い'); fail++; }
  if (missing.length) fail++;
  console.log(`   詳細ページ等: 301元リンクを含むファイル ${detailHits.length} 件・計 ${total(detailHits)} 本${STRICT ? '（--strict: 0 必須）' : '（参考）'}`);
  const byType = new Map<string, number>();
  for (const [f, e] of detailHits) { const t = f.split('/')[0]; byType.set(t, (byType.get(t) ?? 0) + e.n); }
  for (const [t, n] of [...byType.entries()].sort((a, b) => b[1] - a[1])) console.log(`      /${t}/…: ${n} 本`);
  for (const [f, e] of detailHits.sort((a, b) => b[1].n - a[1].n).slice(0, 12)) console.log(`      ${f}: ${e.n}（例: ${[...e.samples].slice(0, 2).join(' ')}）`);
  if (STRICT && total(detailHits) > 0) fail++;
}

console.log(`\n[verify:no-301-links] ${fail === 0 ? 'All checks passed. ✓' : `FAIL ${fail}`}`);
if (fail) process.exit(1);
export {};
