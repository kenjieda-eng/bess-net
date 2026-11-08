#!/usr/bin/env tsx
/**
 * scripts/verify-projects-labels.ts — projects の詳細の欄の名前（運転開始の欄・市場の欄）の検査（小さな直し便・2026-11-08）
 *
 * 決まり（2026-11-08）: 稼働中は市場の欄に実績の市場だけ／計画中・建設中は、一次がその蓄電所について名指しする予定の市場も入れてよい。
 * 欄の名前をこれに合わせて分ける: 稼働中は「市場参加」、それ以外は「参加予定の市場」（運転開始の欄の「運転開始」「運転開始予定」と同じ判定）。
 *
 *   軸1（関数）: marketLabel と codLabel が同じ判定（status＝稼働中）で分かれる。status の形（配列・文字列・空・null）を問わない。
 *   軸2（ソース）: 詳細ページの市場の欄が marketLabel を通る。欄の名前の文字列を直書きしている所が src に無い。
 *   軸3（--html <dir>・ビルド後）: 事前生成された詳細の HTML で、稼働中でないページに「市場参加」の欄が 0、
 *        稼働中のページに「参加予定の市場」の欄が 0。
 *
 * microCMS へのアクセスなし。問題があれば exit 1。prebuild には軸1・軸2 で入れる（軸3 はビルドの後に手で回す）。
 * 実行: npx tsx scripts/verify-projects-labels.ts [--html .next/server/app]
 */
import fs from 'node:fs';
import path from 'node:path';
import { codLabel, marketLabel } from '../src/lib/projects-cod';

export {};

const ROOT = process.cwd();
const args = process.argv.slice(2);
const htmlIdx = args.indexOf('--html');
const HTML = htmlIdx >= 0 ? args[htmlIdx + 1] : null;
const problems: string[] = [];
const notes: string[] = [];

// ─── 軸1: 関数 ───
const CASES: [unknown, '市場参加' | '参加予定の市場'][] = [
  [['稼働中'], '市場参加'],
  ['稼働中', '市場参加'],
  [['建設中'], '参加予定の市場'],
  [['計画中'], '参加予定の市場'],
  [['その他'], '参加予定の市場'],
  [[], '参加予定の市場'],
  [null, '参加予定の市場'],
  [undefined, '参加予定の市場'],
];
for (const [status, want] of CASES) {
  const p = { status } as { status?: string[] | string | null };
  const got = marketLabel(p);
  if (got !== want) problems.push(`marketLabel(${JSON.stringify(status)}) = ${got}（${want} のはず）`);
  const realizedByCod = codLabel(p) === '運転開始';
  const realizedByMarket = got === '市場参加';
  if (realizedByCod !== realizedByMarket) problems.push(`status ${JSON.stringify(status)}: 運転開始の欄「${codLabel(p)}」と市場の欄「${got}」で判定が食い違う`);
}

// ─── 軸2: ソース ───
const PAGE = 'src/app/projects/[slug]/page.tsx';
const pageSrc = fs.readFileSync(path.join(ROOT, PAGE), 'utf8');
if (!/<dt>\{marketLabel\(item\)\}<\/dt>/.test(pageSrc)) problems.push(`${PAGE}: 市場の欄の名前が marketLabel(item) を通っていない`);
if (!/<dt>\{codLabel\(item\)\}<\/dt>/.test(pageSrc)) problems.push(`${PAGE}: 運転開始の欄の名前が codLabel(item) を通っていない`);
const walk = (dir: string, out: string[] = []): string[] => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'generated') walk(f, out); } else if (/\.tsx?$/.test(e.name)) out.push(f);
  }
  return out;
};
for (const f of walk(path.join(ROOT, 'src'))) {
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  if (rel === 'src/lib/projects-cod.ts') continue;
  const s = fs.readFileSync(f, 'utf8');
  if (/<dt>\s*市場参加\s*<\/dt>/.test(s)) problems.push(`${rel}: 「市場参加」の欄の名前を直書きしている（marketLabel を通す）`);
  // 文字列・JSX のテキストとして書いたものだけ（コメントの「」の中は数えない）
  if (/['"`>]\s*参加予定の市場\s*['"`<]/.test(s)) problems.push(`${rel}: 「参加予定の市場」を直書きしている（marketLabel を通す）`);
}

// ─── 軸3: ビルドの HTML ───
if (HTML) {
  const dir = path.join(ROOT, HTML, 'projects');
  if (!fs.existsSync(dir)) problems.push(`${dir} が無い（ビルドの後に回す）`);
  else {
    let pages = 0;
    let noBadge = 0;
    const count = { 市場参加: 0, 参加予定の市場: 0 };
    for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.html'))) {
      const h = fs.readFileSync(path.join(dir, name), 'utf8').replace(/<!-- -->/g, '');
      const badge = /class="badge badge-status-[a-z]+">([^<]+)</.exec(h);
      if (!badge) { noBadge++; continue; }
      pages++;
      const status = badge[1].trim();
      const has = { 市場参加: h.includes('<dt>市場参加</dt>'), 参加予定の市場: h.includes('<dt>参加予定の市場</dt>') };
      if (has.市場参加) count.市場参加++;
      if (has.参加予定の市場) count.参加予定の市場++;
      if (status === '稼働中' && has.参加予定の市場) problems.push(`${name}: 稼働中なのに「参加予定の市場」`);
      if (status !== '稼働中' && has.市場参加) problems.push(`${name}: ${status}なのに「市場参加」`);
    }
    if (pages === 0) problems.push('詳細の HTML が 0 件');
    notes.push(`HTML ${pages} 件（状態のバッジ無し ${noBadge}）・市場の欄 「市場参加」${count.市場参加} 件／「参加予定の市場」${count.参加予定の市場} 件`);
  }
}

console.log(`[verify:projects-labels] 関数 ${CASES.length} 例・ソース・${notes.join('・') || 'HTML は見ていない（--html で見る）'}`);
if (problems.length) {
  console.error(`[verify:projects-labels] ★NG ${problems.length} 件`);
  problems.slice(0, 40).forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log('[verify:projects-labels] ok   稼働中は「市場参加」・それ以外は「参加予定の市場」（運転開始の欄と同じ判定）');
