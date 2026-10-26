#!/usr/bin/env tsx
/**
 * scripts/verify-site-history.ts — 更新履歴（src/data/site-history.ts・/milestones）の検査（サイトの歩み便 第 2 版・2026-10-26）
 *
 * prebuild（警告のみ・ビルドは止めない。--strict で WARN があれば exit 1）。
 *   1. 日付: YYYY-MM-DD・未来の日付 0（JST の今日）・並びが新しい順・id が一意。
 *   2. 鮮度: 最新の件が 60 日より古ければ WARN（新しいページを公開する便が 1 件足すのを忘れていないか）。
 *   3. 漏れ: src/app/tools/*・src/app/tracker/*・src/app/reports/* のページで、どの項目の links にも無いものを WARN（一覧）。
 *   4. 禁止語: 自称の最上級・社内の語・達成の演出・未来の予定の語が、題・文・リンクの名前に 0。
 *   5. 内部リンクのパスが実在（src/app のルート。[slug] などの動的セグメントは何にでも合う）。
 * 実行: npm run verify:site-history [-- --strict]
 */
import fs from 'node:fs';
import path from 'node:path';
import { SITE_HISTORY, SITE_HISTORY_CATEGORIES } from '../src/data/site-history';

export {};

const TAG = '[verify:site-history]';
const ROOT = process.cwd();
const APP = path.join(ROOT, 'src', 'app');
const STRICT = process.argv.includes('--strict');
const warns: string[] = [];
let checks = 0;
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) warns.push(msg);
};

const todayJst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const daysBetween = (a: string, b: string) => Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86400000);

// 1. 日付・並び・id
const ids = new Set<string>();
SITE_HISTORY.forEach((it, i) => {
  ok(/^\d{4}-\d{2}-\d{2}$/.test(it.date) && !Number.isNaN(Date.parse(it.date)), `${it.id}: date が YYYY-MM-DD でない（${it.date}）`);
  ok(it.date <= todayJst, `${it.id}: 未来の日付（${it.date}・今日 ${todayJst}）`);
  ok(!ids.has(it.id), `${it.id}: id が重複`);
  ids.add(it.id);
  ok((SITE_HISTORY_CATEGORIES as readonly string[]).includes(it.category), `${it.id}: 区分が既定のどれでもない（${it.category}）`);
  ok(!!it.title.trim() && !!it.summary.trim() && it.links.length > 0, `${it.id}: 題・文・リンクのどれかが空`);
  if (i > 0) ok(SITE_HISTORY[i - 1].date >= it.date, `${it.id}: 新しい順になっていない（前の件 ${SITE_HISTORY[i - 1].date}）`);
});

// 2. 鮮度
const latest = SITE_HISTORY[0]?.date ?? '1970-01-01';
const age = daysBetween(latest, todayJst);
ok(age <= 60, `最新の件（${latest}）が ${age} 日前。新しく公開したページ・データベース・ツールがあれば src/data/site-history.ts に足す`);

// 5. ルートの一覧（page.tsx のあるディレクトリ）
type Route = string[];
const routes: Route[] = [];
function walk(dir: string, segs: string[]) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) {
      const s = e.name;
      if (s.startsWith('(') && s.endsWith(')')) walk(path.join(dir, s), segs); // ルートグループは URL に出ない
      else if (!s.startsWith('_') && !s.startsWith('@')) walk(path.join(dir, s), [...segs, s]);
    } else if (/^page\.(tsx|ts|jsx|js)$/.test(e.name)) routes.push(segs);
  }
}
walk(APP, []);
function routeExists(urlPath: string): boolean {
  const p = decodeURI(urlPath.split('#')[0].split('?')[0]).replace(/\/$/, '');
  const segs = p === '' ? [] : p.slice(1).split('/');
  return routes.some((r) => {
    if (r.some((s) => s.startsWith('[...') || s.startsWith('[[...'))) {
      const fixed = r.findIndex((s) => s.startsWith('[...') || s.startsWith('[[...'));
      const optional = r[fixed].startsWith('[[...');
      return (optional ? segs.length >= fixed : segs.length > fixed) && r.slice(0, fixed).every((s, i) => (s.startsWith('[') ? true : s === segs[i]));
    }
    return r.length === segs.length && r.every((s, i) => (s.startsWith('[') ? true : s === segs[i]));
  });
}
const linked = new Set<string>();
for (const it of SITE_HISTORY) {
  for (const l of it.links) {
    ok(!!l.label.trim(), `${it.id}: リンクの名前が空（${l.url}）`);
    if (/^https?:\/\//.test(l.url)) continue;
    ok(l.url.startsWith('/'), `${it.id}: リンクが「/」から始まらない（${l.url}）`);
    ok(routeExists(l.url), `${it.id}: リンク先のルートが無い（${l.url}）`);
    linked.add(decodeURI(l.url.split('#')[0]).replace(/\/$/, '') || '/');
  }
}

// 3. 漏れ（tools・tracker・reports の直下のページ）
const missing: string[] = [];
for (const base of ['tools', 'tracker', 'reports']) {
  const dir = path.join(APP, base);
  if (!fs.existsSync(dir)) continue;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (!e.isDirectory() || e.name.startsWith('[')) continue;
    if (!fs.existsSync(path.join(dir, e.name, 'page.tsx'))) continue;
    const p = `/${base}/${e.name}`;
    if (!linked.has(p)) missing.push(p);
  }
}
ok(missing.length === 0, `更新履歴のリンクに無いページ ${missing.length} 本: ${missing.join('・')}`);

// 4. 禁止語（画面に出る題・文・リンクの名前）
const FORBIDDEN: [RegExp, string][] = [
  [/唯一|日本一|圧倒的|業界初|国内初|世界初|No\.?\s*1|ナンバーワン|最高峰|最先端/, '自称の最上級・比較'],
  [/Sprint|(?<!郵)便(?!利|乗|箋|宜|益|器|所)|依頼[A-Z]{1,3}\b|依頼書|\bL-\d|\bD-\d|\bAJ\b|VIP|\bCC\b|ユウ|(?<![ァ-ヶー])リン(?![ァ-ヶー酸])|裁定/, '社内の語'],
  [/🎊|✨|🎉|完全達成|達成記念/, '達成の演出'],
  // 当サイト自身の予定の言い方だけを拾う（「オークションの予定と結果を一覧」のように中身としての「予定」は拾わない）
  [/公開予定|予定です|予定しています|する予定|今後公開|近日公開|準備中|順次公開|今後追加/, '未来の予定の語'],
];
for (const it of SITE_HISTORY) {
  const text = [it.title, it.summary, ...it.links.map((l) => l.label)].join(' ');
  for (const [re, kind] of FORBIDDEN) {
    const m = text.match(re);
    ok(!m, `${it.id}: ${kind}「${m?.[0]}」`);
  }
}

console.log(`${TAG} 検査 ${checks} 件・項目 ${SITE_HISTORY.length} 件（最新 ${latest}・${age} 日前）・ルート ${routes.length} 本`);
if (warns.length === 0) console.log(`${TAG} ok   日付・鮮度・漏れ・禁止語・リンク先`);
else {
  console.warn(`${TAG} WARN ${warns.length} 件`);
  warns.slice(0, 40).forEach((w) => console.warn(`   - ${w}`));
}
if (STRICT && warns.length) process.exit(1);
process.exit(0);
