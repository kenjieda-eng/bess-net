#!/usr/bin/env tsx
/**
 * scripts/verify-corrections.ts — 訂正履歴のデータと画面の検査（訂正履歴便・2026-10-16）
 *
 * prebuild（警告のみ・--strict で exit 1）。
 *   1. 全件: id が一意・date（YYYY-MM-DD）が 2026-09-21 以降で未来でない・kind が 3 種のどれか・path が「/」から・before／after・targetTitle が空でない・
 *      basis 1 本以上（name・publisher・http(s) の url）・internalRef が空でない。
 *      例外: 一次（開催告知・公表資料）が見つからないことを理由に表示を止めたもの（表示の停止）と、出典欄の資料を発行元で確認できず
 *      その行を外した訂正は basis 0 本を許す（不在は一次で示せない。理由・直した後の文で確かめる）。
 *   2. kind「表示の停止」の対象は今も表示されていない（除外の一覧に在る）。kind「訂正」「表示の再開」の対象は表示中。
 *      同じ対象に後の記録（再開・停止）があれば、最後の記録で判定する。
 *   3. 画面に出る語（targetTitle・before・after・basis の名前）に社内の語が 0（便・CC・Ck・裁定・ユウ・リン・order・row・R 番号・Sprint・依頼 等）。
 *   4. internalRef の報告（reports/…）が実在する。
 *   5. --html <dir>（例 .next/server/app）: /corrections の件数＝データの件数・冒頭 1 行。記事末の「訂正履歴」が見本ページ（用語集・解説・政策カレンダー・補助金の詳細と fire-risk-check）に出る
 *      （ビルドで事前生成されたページだけ。事前生成されないページは本番の curl で見る）。
 * 実行: npx tsx scripts/verify-corrections.ts [--html .next/server/app] [--strict]
 */
import fs from 'node:fs';
import path from 'node:path';
import { CORRECTIONS, CORRECTIONS_SINCE, CORRECTION_KINDS, compareCorrectionIds, isRecordHidden, targetOf, type Correction } from '../src/lib/corrections';
import { LANDING_PAGE_CONFIGS } from '../src/data/landing-page-configs';
import { AREA_META } from '../src/app/grid/[slug]/area-meta';
import { POLICY_DETAIL_SLUGS } from '../src/lib/policy-utils';
import { GLOBAL_MARKETS } from '../src/data/global-markets';

export {};

const ROOT = process.cwd();
const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const htmlIdx = args.indexOf('--html');
const HTML = htmlIdx >= 0 ? args[htmlIdx + 1] : null;

let checks = 0;
const problems: string[] = [];
const notes: string[] = [];
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) problems.push(msg);
};

/** 画面に出してはいけない社内の語（「リンク」「便利」「郵便」などを誤検出しない形にする） */
const INTERNAL: [RegExp, string][] = [
  // 「〜便」全般（直し便・週次便・訂正履歴便 等）。郵便・便利・便乗・便箋・便宜・便益・便器・便所は除く
  [/(?<!郵)便(?!利|乗|箋|宜|益|器|所)|調べ役|検証役|反証役|見直し役/, '便・役の名前'],
  [/\bCC\b/, 'CC'],
  [/Ck-?\d|Ck2[a-z]?/, 'Ck'],
  [/裁定/, '裁定'],
  [/ユウ/, 'ユウ'],
  [/(?<![ァ-ヶー])リン(?![ァ-ヶー酸])/, 'リン'], // 「リンク」「プリンス」「ベルリン」「リン酸鉄」は除く（前後がカタカナでない単独の「リン」だけ）
  [/\border\s*\d/i, 'order'],
  [/\brow[_\s-]?(id)?\b/i, 'row'],
  [/\bR\d{1,2}\b(?![年補])/, 'R 番号'], // 「R8年度」「R7補正」（令和の略・正式名の一部）は除く
  [/Sprint/i, 'Sprint'],
  [/依頼書|依頼[A-Z]{1,3}\b/, '依頼'],
];

const todayJst = new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
const ids = new Set<string>();
const byTarget = new Map<string, Correction[]>();
for (const c of CORRECTIONS) {
  ok(!ids.has(c.id), `id の重複: ${c.id}`);
  ids.add(c.id);
  ok(/^\d{4}-\d{2}-\d{2}$/.test(c.date) && !Number.isNaN(Date.parse(c.date)), `${c.id}: date の形 ${c.date}`);
  ok(c.date >= CORRECTIONS_SINCE, `${c.id}: date ${c.date} が ${CORRECTIONS_SINCE} より前`);
  ok(c.date <= todayJst, `${c.id}: date ${c.date} が未来（今日 ${todayJst}）`);
  ok((CORRECTION_KINDS as readonly string[]).includes(c.kind), `${c.id}: kind ${c.kind}`);
  ok(c.path.startsWith('/'), `${c.id}: path ${c.path}`);
  for (const k of ['targetTitle', 'before', 'after', 'internalRef'] as const) ok(!!c[k] && c[k].trim().length > 0, `${c.id}: ${k} が空`);
  // before／after の改行は箇条の区切り（1 件にまとめた記録）。空の箇条を作らない。題名は 1 行
  for (const k of ['before', 'after'] as const) ok(c[k].split('\n').every((s) => s.trim().length > 0), `${c.id}: ${k} に空の箇条（改行の重なり・前後の改行）`);
  ok(!c.targetTitle.includes('\n'), `${c.id}: targetTitle に改行`);
  // basis 0 本を許すのは 2 型だけ（画面は「一次: 確認できませんでした」）。それ以外は 1 本以上（便 §3）。
  //   a. 一次が見つからないことを理由に表示を止めたもの（表示の停止）— 止めた理由が一次の不在であることを after の語で確かめる
  //   b. 出典欄の資料を発行元で確認できず、その行を外した訂正 — 不在は一次で示せない（before が出典、after が確認できない旨）
  if (c.kind === '表示の停止' && (c.basis ?? []).length === 0) {
    ok(/確認できな|見つから|一次が無|一次は無|一次に無|示されていな|裏付け|裏づけ/.test(c.after), `${c.id}: basis 0 本の表示の停止だが、理由が一次の不在になっていない`);
  } else if (c.kind === '訂正' && (c.basis ?? []).length === 0) {
    ok(/出典/.test(c.before) && /確認でき|特定でき|見当たら/.test(c.after), `${c.id}: basis が 0 本（出典の行を外した訂正でもない）`);
  } else {
    ok(Array.isArray(c.basis) && c.basis.length >= 1, `${c.id}: basis が 0 本`);
  }
  for (const b of c.basis ?? []) {
    ok(!!b.name && !!b.publisher && /^https?:\/\//.test(b.url), `${c.id}: basis の欠け（${b.name}／${b.publisher}／${b.url}）`);
  }
  const visible = [c.targetTitle, c.before, c.after, ...c.basis.map((b) => `${b.publisher} ${b.name}`)].join(' ');
  for (const [re, label] of INTERNAL) ok(!re.test(visible), `${c.id}: 社内の語（${label}）「${(visible.match(re) ?? [''])[0]}」`);
  const ref = c.internalRef.split(/[#:（ ]/)[0];
  ok(fs.existsSync(path.join(ROOT, ref)), `${c.id}: internalRef の報告が無い ${ref}`);
  const key = c.record ?? c.path;
  byTarget.set(key, [...(byTarget.get(key) ?? []), c]);
}
// 2. 表示中かどうか（同じ対象の最後の記録で判定）
for (const [key, list] of byTarget) {
  const last = [...list].sort((a, b) => (a.date === b.date ? compareCorrectionIds(a.id, b.id) : a.date.localeCompare(b.date)))[list.length - 1];
  if (!last.record) continue; // コードのページ（除外の一覧で止めるものではない。/incidents の事例は record＝incidents/<id> で見る）
  const hidden = isRecordHidden(last.record);
  if (last.kind === '表示の停止') ok(hidden, `${last.id}: 表示の停止なのに ${key} が表示中（除外の一覧に無い）`);
  else ok(!hidden, `${last.id}: ${last.kind}なのに ${key} が除外の一覧に在る`);
}

// 4b. 記事末の部品の差し込み: 表示中の記録（訂正・表示の再開）のパスに、<CorrectionHistory path=…> を出すページがあるか（ソースで突き合わせる）。
//     一覧のページ（/events・/policy-calendar・/subsidies）は記事末を持たない＝/corrections にだけ載る。
//     変数の部分は、ページが実在する値の集合に展開する（.+ で置くと、どのパスにも一致して検査が素通りになる）:
//       ${config.slug} → 着地ページの設定の slug・/grid/${meta.slug} → エリア（変電所の詳細は記事末を持たない）・
//       /policy-calendar/${params.slug} → 詳細を持つ slug（それ以外は 404）・/global/${countryKey} → 国のキー。
//     その他の ${params.slug}（microCMS の詳細ページ）は 1 階層の任意の slug（表示中かどうかは 2 で見る）。
const LIST_PAGES = new Set(['/events', '/policy-calendar', '/subsidies']);
const EXPAND: [RegExp, string[]][] = [
  [/^\/\$\{config\.slug\}$/, Object.values(LANDING_PAGE_CONFIGS).map((x) => `/${x.slug}`)],
  [/^\/grid\/\$\{meta\.slug\}$/, Object.keys(AREA_META).map((s) => `/grid/${s}`)],
  [/^\/policy-calendar\/\$\{[^}]+\}$/, POLICY_DETAIL_SLUGS.map((s) => `/policy-calendar/${s}`)],
  [/^\/global\/\$\{countryKey\}$/, Object.keys(GLOBAL_MARKETS).map((s) => `/global/${s}`)],
];
const exactPaths = new Set<string>();
const templates: RegExp[] = [];
const walk = (dir: string) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const f = path.join(dir, e.name);
    if (e.isDirectory()) walk(f);
    else if (/\.tsx$/.test(e.name)) {
      const s = fs.readFileSync(f, 'utf8');
      for (const m of s.matchAll(/<CorrectionHistory path=\{?["`]([^"`]+)["`]\}?/g)) {
        const t = m[1];
        const ex = EXPAND.find(([re]) => re.test(t));
        if (ex) ex[1].forEach((p) => exactPaths.add(p));
        else if (!t.includes('${')) exactPaths.add(t);
        else if (/^\/[a-z-]+\/\$\{params\.slug\}$/.test(t)) templates.push(new RegExp(`^${t.replace(/\$\{params\.slug\}$/, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^/]+$`));
        else ok(false, `${path.relative(ROOT, f)}: <CorrectionHistory path=${t}> の変数を展開できない（EXPAND に足す）`);
      }
    }
  }
};
walk(path.join(ROOT, 'src'));
ok(exactPaths.size + templates.length > 0, '<CorrectionHistory> の差し込みが 0');
for (const c of CORRECTIONS) {
  if (c.kind === '表示の停止' || LIST_PAGES.has(c.path)) continue;
  ok(exactPaths.has(c.path) || templates.some((re) => re.test(c.path)), `${c.id}: ${c.path} に記事末の「訂正履歴」を出すページが無い`);
}

// 5. 初期 DOM
if (HTML) {
  const read = (p: string) => {
    const f = path.join(ROOT, HTML, `${p.replace(/^\//, '')}.html`);
    return fs.existsSync(f) ? fs.readFileSync(f, 'utf8').replace(/<!-- -->/g, '') : null;
  };
  const list = read('/corrections');
  ok(list !== null, '/corrections の HTML が無い');
  if (list) {
    const n = (list.match(/id="correction-[^"]+"/g) ?? []).length;
    ok(n === CORRECTIONS.length, `/corrections の件数 ${n} ≠ データ ${CORRECTIONS.length}`);
    ok(list.includes('当サイトの編集方針にもとづき、事実と異なる記述を訂正したもの・表示を止めたものを記録しています（2026年9月21日以降）。'), '/corrections の冒頭 1 行が無い');
  }
  const samples: string[] = [];
  // 便 §3 の見本 5 ページ: 用語集・解説・政策カレンダー・補助金の詳細（表示中の記録のある最初の 1 件）と /tools/fire-risk-check
  for (const t of ['用語集', '解説', '政策カレンダー', '補助金'] as const) {
    const c = CORRECTIONS.find((x) => targetOf(x.path) === t && x.path.split('/').length === 3 && x.kind !== '表示の停止' && !isRecordHidden(x.record));
    if (c) samples.push(c.path);
  }
  ok(CORRECTIONS.some((x) => x.path === '/tools/fire-risk-check'), '見本 /tools/fire-risk-check の記録が無い');
  samples.push('/tools/fire-risk-check');
  for (const p of samples) {
    const h = read(p);
    if (h === null) { notes.push(`見本 ${p} は事前生成されていない（本番の curl で見る）`); continue; }
    const want = CORRECTIONS.filter((c) => c.path === p);
    ok(h.includes('訂正履歴'), `見本 ${p}: 記事末の「訂正履歴」が無い`);
    for (const c of want) ok(h.includes(`id="correction-${c.id}"`), `見本 ${p}: ${c.id} が記事末に無い`);
  }
  notes.push(`初期 DOM の見本: ${samples.join('・') || 'なし'}`);
}

const kindCount = CORRECTION_KINDS.map((k) => `${k} ${CORRECTIONS.filter((c) => c.kind === k).length}`).join('・');
console.log(`[verify:corrections] 検査 ${checks} 件・記録 ${CORRECTIONS.length} 件（${kindCount}）${notes.length ? `・${notes.join('／')}` : ''}`);
if (problems.length) {
  console.warn(`[verify:corrections] WARN ${problems.length} 件`);
  for (const p of problems) console.warn(`  - ${p}`);
  if (STRICT) process.exit(1);
} else {
  console.log('[verify:corrections] ok   日付・種類・一次・社内の語・表示の状態・報告の実在');
}
