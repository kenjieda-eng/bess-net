#!/usr/bin/env tsx
/**
 * scripts/verify-balancing-rules.ts — 需給調整市場 制度変更トラッカー（/tracker/balancing-rules・T8 実装便 2026-10-14）の否定テスト
 *
 * prebuild で走る（警告のみ・--strict で失敗終了）。外部アクセスは --urls のときだけ。
 *   1. 生成一致: src/data/balancing-rules.ts が data.json＋追補 JSON からの生成結果と同じ（gen --check）・行数（49＋R3 の 1＝50・
 *      うちタイムライン 48・予定 2）・watch 1・裁定 T8-R1（揚水随契 12 行の group と areas）・R2（C-9／B-28／D-4b の status と逐語）
 *   2. 日付（R4）: 形式 YYYY-MM-DD・announcedOn がいずれかの sources[].date と一致（例外は DATE_EXCEPTIONS の行だけ）・
 *      dateBasis が全行にあり、添字の出典の日付と announcedOn が一致・effectiveFrom がある行は dateBasis.effective もある・
 *      公表日 > 適用日は DATE_EXCEPTIONS の行だけ
 *   3. 上限価格（R5）: 区分 A の行の after に、適用日のカタログの値（capAt）がある・カタログの値の変わり目に A の行がある
 *      前後の窓（R6）: 月の途中の改定月を前後どちらにも入れない・月初の改定はその月から後・リンクは前後とも月次の範囲内の行だけ
 *   4. 関連（R7）: 非表示の解説（isExcludedExplainer）・政策イベント（isExcludedEvent）は画面で外れる（--html でリンク 0 も見る）・
 *      政策イベントの詳細リンクは POLICY_DETAIL_SLUGS の 9 件だけ（他は 404 になる）
 *   5. 禁止語: title・batteryNote・dateException に評価語・因果の語・内側の語（本便・反証役 等）が無い・title に略称（三次② 等）が無い・
 *      商品は公式呼称 6 つのキーだけ・ページとコンポーネントの文（コメントを除く）に評価語が無い
 *   6. 出典: 全行に一次 1 本以上・ホストが一次の許可リスト・当サイトや報道の URL が無い・資料名が台帳 src/data/source-documents.json にある
 *   7. --html <path>: 初期 DOM（冒頭 1 行・全行の title・公表日／適用日の列名・一次の資料名・「予定・検討中・注視」の欄・評価語 0（一次の逐語の中は数えて別に出す）・
 *      非表示の解説・政策イベントへのリンク 0・範囲外の月のベンチマークリンク 0）
 *   8. --urls: 出典の URL を取り直して HTTP を見る（手で回す。meti・egc の 202／403 は bot 判定＝「不明」で失敗にしない）
 *
 * 実行: npx tsx scripts/verify-balancing-rules.ts [--html .next/server/app/tracker/balancing-rules.html] [--urls] [--strict]
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { BALANCING_RULES, BALANCING_RULES_PENDING, type BalancingRule } from '../src/data/balancing-rules';
import { PRODUCT_ORDER, PUMPED_HYDRO_GROUP, benchmarkLinkOf, buildTimelineItems, fiscalYearOf, sortDate } from '../src/lib/balancing-rules';
import { CAP_PRODUCT_KEYS, capAt, capTimeline, type CapProductKey } from '../src/lib/balancing-cap';
import { monthlyCoverageYms } from '../src/lib/eprx-monthly';
import { isExcludedExplainer } from '../src/lib/explainer-excluded';
import { isExcludedEvent } from '../src/lib/events-excluded';
import { POLICY_DETAIL_SLUG_SET } from '../src/lib/policy-utils';
import { visibleRelated } from '../src/lib/balancing-rules-related';

export {};

const ROOT = process.cwd();
const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const URLS = args.includes('--urls');
const htmlIdx = args.indexOf('--html');
const HTML = htmlIdx >= 0 ? args[htmlIdx + 1] : null;
/** 故障注入用: 検査する定義を差し替える（--rules <path.json>＝BALANCING_RULES と PENDING の写しを JSON で） */
const rulesIdx = args.indexOf('--rules');
const RULES_OVERRIDE = rulesIdx >= 0 ? args[rulesIdx + 1] : null;
const SKIP_GEN = args.includes('--skip-gen');

let checks = 0;
const problems: string[] = [];
const notes: string[] = [];
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) problems.push(msg);
};

const loaded = RULES_OVERRIDE
  ? (JSON.parse(fs.readFileSync(RULES_OVERRIDE, 'utf8')) as { timeline: BalancingRule[]; pending: BalancingRule[] })
  : { timeline: [...BALANCING_RULES], pending: [...BALANCING_RULES_PENDING] };
const TL = loaded.timeline;
const PD = loaded.pending;
const ALL = [...TL, ...PD];

// ─── 裁定の期待値（便の文の写し） ───
/** 裁定 T8-R1: 揚水発電機の随意契約の 12 行とエリア（公式の呼び方） */
const R1_AREAS: Record<string, string> = {
  'B-5': '中部エリア', 'B-9': '中部エリア', 'B-10': '東北エリア', 'B-13': '関西エリア', 'B-14': '北海道エリア', 'B-15': '東京エリア',
  'B-21': '中部エリア', 'B-22': '東北エリア', 'B-23': '関西エリア', 'B-24': '東京エリア', 'B-25': '中国エリア', 'B-26': '中国エリア',
};
/** 裁定 T8-R2: 予定・未決定・注視の行と、一次の書きぶり（便の文の逐語） */
const R2: Record<string, { status: BalancingRule['status']; quote: string }> = {
  'C-9': { status: 'undecided', quote: '我が国において同時市場が実現可能であると判断された場合には、同時市場の導入を最終決定することとしたい。' },
  'B-28': { status: 'scheduled', quote: '二次調整力①について、2027年度以降は広域調達を開始する' },
  'D-4b': { status: 'watch', quote: '以下のとおり監視を行うこととしたい' },
};
/**
 * 裁定 T8-R4 の例外: announcedOn が sources[].date のどれとも一致しない行・公表日 > 適用日の行。理由つき（便 R4 の例＋実装便で確かめたもの）。
 * ★ここに足すときは報告の例外一覧にも書く。
 */
const DATE_EXCEPTIONS: Record<string, { reason: string; announcedAfterEffective?: boolean; announcedNotInSources?: boolean }> = {
  'B-9': { reason: '期中公表（中部電力パワーグリッドの告知 2025-10-31・適用は 2025-04-01 受渡分から）', announcedAfterEffective: true },
};

// 1. 生成一致・行数・裁定
if (!RULES_OVERRIDE && !SKIP_GEN) {
  try {
    execFileSync(process.execPath, [path.join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs'), path.join(ROOT, 'scripts', 'gen-balancing-rules.ts'), '--check'], { stdio: 'pipe' });
    ok(true, '');
  } catch (e) {
    ok(false, `生成一致: src/data/balancing-rules.ts が data.json＋追補 JSON からの生成結果と違う（${String((e as { stderr?: Buffer }).stderr ?? e).trim().slice(0, 200)}）`);
  }
}
const nonWatch = ALL.filter((r) => r.status !== 'watch');
ok(nonWatch.length === 50, `行数が 50（研究便 49＋R3 の 1）でない（${nonWatch.length}）`);
ok(TL.length === 48, `タイムラインの行が 48 でない（${TL.length}）`);
ok(ALL.filter((r) => r.status === 'watch').length === 1, 'watch の行が 1 でない');
ok(new Set(ALL.map((r) => r.id)).size === ALL.length, 'id が重複している');
ok(TL.every((r) => r.status === 'effective'), 'タイムラインに effective 以外の行がある');
ok(PD.every((r) => r.status !== 'effective'), '予定などの欄に effective の行がある');
for (const [id, area] of Object.entries(R1_AREAS)) {
  const r = ALL.find((x) => x.id === id);
  ok(!!r && r.group === PUMPED_HYDRO_GROUP && r.areas.length === 1 && r.areas[0] === area, `R1: ${id} の group／areas が「${area}」でない`);
}
const grouped = ALL.filter((r) => r.group === PUMPED_HYDRO_GROUP).map((r) => r.id);
ok(grouped.length === 12 && grouped.every((id) => id in R1_AREAS), `R1: 揚水随契の行が 12 でない／一覧に無い行がある（${grouped.join('・')}）`);
ok(ALL.filter((r) => r.areas.length > 0).every((r) => r.group === PUMPED_HYDRO_GROUP), 'R1: areas を持つ行が揚水随契の行だけでない');
for (const [id, want] of Object.entries(R2)) {
  const r = ALL.find((x) => x.id === id);
  ok(!!r && r.status === want.status, `R2: ${id} の status が ${want.status} でない`);
  ok(!!r && r.pendingQuote === want.quote, `R2: ${id} の一次の書きぶりが便の逐語と違う（${r?.pendingQuote ?? '無し'}）`);
  ok(!!r && PD.includes(r), `R2: ${id} が「予定・検討中・注視」の欄に無い`);
  const src = r && r.pendingQuoteSource !== null ? r.sources[r.pendingQuoteSource] : undefined;
  ok(!!src && src.quote.includes(want.quote), `R2: ${id} の一次の書きぶりが、指している出典の逐語に含まれない`);
}
// 統合（E-1〜E-3 → C-6・C-5・C-8）と落とした候補（出力制御指令との重複の整理）が行に無い
for (const id of ['E-1', 'E-2', 'E-3']) ok(!ALL.some((r) => r.id === id), `統合した ${id} が行に残っている`);
ok(!ALL.some((r) => r.title.includes('出力制御')), '落とした候補（出力制御指令との重複の整理）が行になっている');
const c10 = ALL.find((r) => r.id === 'C-10');
ok(!!c10 && c10.kind === 'product' && c10.announcedOn === '2024-07-30' && !!c10.batteryNote, 'R3: C-10（一次調整力の供出可能量の考え方の見直し）が区分 C・公表日 2024-07-30・batteryNote ありで無い');
ok(!!c10 && (c10.effectiveFrom === null || c10.effectiveFrom === '2025-03-14'), 'R3: C-10 の適用日が 2025-03-14 か null でない');
const fyGroups = buildTimelineItems(TL).filter((i) => i.type === 'group');
notes.push(`揚水随契の開閉欄 ${fyGroups.map((g) => (g.type === 'group' ? `${g.fiscalYear}年度 ${g.rows.length} 件` : '')).join('・')}`);
for (const g of fyGroups) if (g.type === 'group') ok(g.rows.every((r) => fiscalYearOf(sortDate(r)) === g.fiscalYear), `R1: ${g.fiscalYear}年度の開閉欄に別の年度の行がある`);

// 2. 日付（R4）
const YMD = /^\d{4}-\d{2}-\d{2}$/;
const validYmd = (s: string) => YMD.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s;
for (const r of ALL) {
  ok(validYmd(r.announcedOn), `${r.id}: announcedOn「${r.announcedOn}」が実在の YYYY-MM-DD でない`);
  if (r.effectiveFrom !== null) ok(validYmd(r.effectiveFrom), `${r.id}: effectiveFrom「${r.effectiveFrom}」が実在の YYYY-MM-DD でない`);
  for (const s of r.sources) if (s.date) ok(validYmd(s.date), `${r.id}: 出典の日付「${s.date}」が YYYY-MM-DD でない`);
  const ex = DATE_EXCEPTIONS[r.id];
  const inSources = r.sources.some((s) => s.date === r.announcedOn);
  ok(inSources || !!ex?.announcedNotInSources, `${r.id}: announcedOn ${r.announcedOn} がどの出典の資料の日付とも一致しない（例外の一覧にも無い）`);
  ok(!!r.dateBasis, `${r.id}: dateBasis が無い`);
  if (r.dateBasis) {
    const a = r.dateBasis.announced;
    const src = r.sources[a.source];
    ok(!!src, `${r.id}: dateBasis.announced の添字 ${a.source} の出典が無い`);
    ok(!!src && (src.date === r.announcedOn || !!ex?.announcedNotInSources), `${r.id}: dateBasis.announced の出典の日付 ${src?.date} が announcedOn ${r.announcedOn} と違う`);
    ok(a.quote.trim().length > 0, `${r.id}: dateBasis.announced の逐語が空`);
    if (r.effectiveFrom) {
      ok(!!r.dateBasis.effective && !!r.sources[r.dateBasis.effective.source] && r.dateBasis.effective.quote.trim().length > 0, `${r.id}: 適用日があるのに dateBasis.effective が無い／添字が無い／逐語が空`);
    }
  }
  if (r.effectiveFrom && r.announcedOn > r.effectiveFrom) ok(!!ex?.announcedAfterEffective, `${r.id}: 公表日 ${r.announcedOn} > 適用日 ${r.effectiveFrom} が例外の一覧に無い`);
  if (r.status === 'effective') ok(true, '');
  else ok(!!r.pendingQuote, `${r.id}: 予定などの行に一次の書きぶり（pendingQuote）が無い`);
}
for (const id of Object.keys(DATE_EXCEPTIONS)) ok(ALL.some((r) => r.id === id), `例外の一覧の ${id} が行に無い（古い例外）`);

// 3. 上限価格（R5）と前後の窓（R6）
const capRows = ALL.filter((r) => r.kind === 'cap');
for (const r of capRows) {
  if (!r.effectiveFrom) continue;
  for (const p of CAP_PRODUCT_KEYS) {
    if (!(r.products as string[]).includes(p)) continue;
    const v = capAt(p, r.effectiveFrom);
    if (r.id === 'A-2') continue; // 適用期間の改定（値は不変）＝after は期間の逐語
    ok(v !== null && r.after.includes(v.toFixed(2)), `R5: ${r.id} の after に ${p} の ${r.effectiveFrom} のカタログの値 ${v?.toFixed(2)} が無い`);
    // title に出る数値もカタログと照合する（ページの「題名と変更後の欄の数値は…カタログの値と一致することを確かめています」）
    ok(v !== null && r.title.includes(v.toFixed(2)), `R5: ${r.id} の title に ${p} の ${r.effectiveFrom} のカタログの値 ${v?.toFixed(2)} が無い`);
    const prevDay = new Date(Date.parse(`${r.effectiveFrom}T00:00:00Z`) - 86400000).toISOString().slice(0, 10);
    const pv = capAt(p, prevDay);
    if (pv !== null && pv !== v) ok(r.title.includes(pv.toFixed(2)), `R5: ${r.id} の title に ${p} の変更前（${prevDay}）のカタログの値 ${pv.toFixed(2)} が無い`);
  }
  // title・after にある「数字.数字2桁」は、その行の商品のカタログの値（適用日・前日）のどれか
  const allowed = new Set<string>();
  for (const p of CAP_PRODUCT_KEYS) {
    if (!(r.products as string[]).includes(p)) continue;
    for (const d of [r.effectiveFrom, new Date(Date.parse(`${r.effectiveFrom}T00:00:00Z`) - 86400000).toISOString().slice(0, 10)]) {
      const x = capAt(p, d);
      if (x !== null) allowed.add(x.toFixed(2));
    }
  }
  for (const m of r.title.match(/\d+\.\d{2}/g) ?? []) ok(allowed.has(m), `R5: ${r.id} の title の値 ${m} がカタログに無い`);
}
for (const p of CAP_PRODUCT_KEYS as CapProductKey[]) {
  let prev: number | null = null;
  for (const pt of capTimeline(p)) {
    if (pt.value !== prev) {
      ok(capRows.some((r) => r.effectiveFrom === pt.date && (r.products as string[]).includes(p)), `R5: カタログの ${p} が ${pt.date} に ${prev ?? '—'}→${pt.value} と変わるのに、区分 A の行が無い（改定の取りこぼしの合図）`);
    }
    prev = pt.value;
  }
}
const coverage = monthlyCoverageYms();
const ymOf = (d: string) => d.slice(0, 7);
const addMonths = (ym: string, n: number) => {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7)) - 1 + n;
  return `${y + Math.floor(m / 12)}-${String(((m % 12) + 12) % 12 + 1).padStart(2, '0')}`;
};
let links = 0;
for (const r of ALL) {
  const w = r.benchmarkWindow;
  if (!w) continue;
  ok(w.products.every((p) => (PRODUCT_ORDER as readonly string[]).includes(p)), `R6: ${r.id} の窓の商品に公式のキー以外がある`);
  if (r.effectiveFrom) {
    const em = ymOf(r.effectiveFrom);
    const midMonth = r.effectiveFrom.slice(8, 10) !== '01';
    ok(w.before[1] < em, `R6: ${r.id} の前の期間（〜${w.before[1]}）が改定月 ${em} 以後を含む`);
    ok(midMonth ? w.after[0] > em : w.after[0] === em, `R6: ${r.id} の後の期間の始まり ${w.after[0]} が${midMonth ? '月の途中の改定月を含む' : '改定月でない'}`);
    ok(w.before[1] === addMonths(em, -1) && w.before[0] === addMonths(em, -3), `R6: ${r.id} の前の期間が改定月の直前 3 か月でない（${w.before.join('〜')}）`);
  }
  const b = benchmarkLinkOf(r, coverage);
  if (b.kind === 'link') {
    links++;
    const from = new URL(b.href, 'https://x').searchParams.get('from') ?? '';
    const to = new URL(b.href, 'https://x').searchParams.get('to') ?? '';
    ok(coverage.includes(from) && coverage.includes(to), `R6: ${r.id} のリンクの期間 ${from}〜${to} が月次の範囲（${coverage[0]}〜${coverage[coverage.length - 1]}）の外`);
    ok(from === w.before[0] && to === w.after[1], `R6: ${r.id} のリンクの期間が窓と違う`);
  }
}
notes.push(`前後比較のリンク ${links} 行（月次 ${coverage[0]}〜${coverage[coverage.length - 1]}）`);

// 4. 関連（R7）
let relCount = 0;
for (const r of ALL) {
  // データ側: 生成の時点で非表示を外している。残っていたら（生成後に非表示が増えた・故障）WARN＝再生成の合図
  for (const e of r.related.explainer) {
    relCount++;
    ok(e.title.trim().length > 0, `R7: ${r.id} の関連の解説 ${e.slug} の題名が空`);
    ok(!isExcludedExplainer(e.slug), `R7: ${r.id} の関連に非表示の解説 ${e.slug} がある（gen-balancing-rules で再生成する）`);
  }
  for (const e of r.related.policyEvent) {
    relCount++;
    ok(e.title.trim().length > 0, `R7: ${r.id} の関連の政策イベント ${e.slug} の題名が空`);
    ok(!isExcludedEvent(e.slug), `R7: ${r.id} の関連に非表示の政策イベント ${e.slug} がある（gen-balancing-rules で再生成する）`);
  }
  // 画面側: ページが使う関数の出力に非表示が 0・詳細ページの無い政策イベントは一覧へ
  const v = visibleRelated(r);
  ok(v.explainers.every((e) => !isExcludedExplainer(e.slug)) && v.policyEvents.every((e) => !isExcludedEvent(e.slug)), `R7: ${r.id} の画面の関連に非表示が残る`);
  ok(v.policyEvents.every((e) => e.href === '/policy-calendar' || POLICY_DETAIL_SLUG_SET.has(e.href.replace('/policy-calendar/', ''))), `R7: ${r.id} の政策イベントのリンク先が詳細ページの無い slug`);
}
notes.push(`関連 ${relCount} 本`);

// 5. 禁止語・公式呼称
const EVAL = ['有利', '不利', '追い風', '逆風', '打撃', '良い', '悪い', '好機', '朗報', '痛手', '恩恵', 'チャンス'];
const CAUSAL = ['のため', 'ため、', 'により', 'によって', 'が原因', 'の影響で', 'の結果'];
const INNER = ['本便', '研究便', '実装便', '反証役', '調べ役', 'ユウ', '便 I', '★', 'sha256', '統合）', 'announcedOn', 'effectiveFrom'];
const ABBR = /[一二三]次[①②]|[一二三]次[～〜・、]|メインオークション(?!（)/;
for (const r of ALL) {
  const own: [string, string | null][] = [['title', r.title], ['batteryNote', r.batteryNote], ['dateException', r.dateException]];
  for (const [k, v] of own) {
    if (!v) continue;
    for (const w of EVAL) ok(!v.includes(w), `${r.id}: ${k} に評価語「${w}」`);
    for (const w of INNER) ok(!v.includes(w), `${r.id}: ${k} に内側の語「${w}」`);
    if (k !== 'dateException') for (const w of CAUSAL) ok(!v.includes(w), `${r.id}: ${k} に因果の語「${w}」`);
  }
  ok(!ABBR.test(r.title), `${r.id}: title に略称（${r.title.match(ABBR)?.[0]}）`);
  // 逐語の欄（変更前・変更後・理由・出典の逐語と該当箇所）に作業の語・編集の注記が混ざっていない（当サイトの補足は〔〕で）
  const quoteFields: [string, string | null][] = [['before', r.before], ['after', r.after], ['reasonQuote', r.reasonQuote], ...r.sources.flatMap((s, i) => [[`sources[${i}].quote`, s.quote], [`sources[${i}].where`, s.where]] as [string, string][])];
  for (const [k, v] of quoteFields) {
    if (!v) continue;
    const outside = v.replace(/〔[^〕]*〕/g, '');
    for (const w of [...INNER, 'before', 'after', '一次の逐語', '原文ママ。', '（一次に', '本行']) ok(!outside.includes(w), `${r.id}: ${k} に作業の語・編集の注記「${w}」（当サイトの補足は〔〕で）`);
    ok(!/\b\d{2}_\d{2}\b/.test(outside), `${r.id}: ${k} にファイル名の略記（${outside.match(/\b\d{2}_\d{2}\b/)?.[0]}）`);
  }
  ok(r.products.length > 0 && r.products.every((p) => (PRODUCT_ORDER as readonly string[]).includes(p)), `${r.id}: 商品に公式のキー以外がある／空`);
}
const stripComments = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
for (const f of ['src/app/tracker/balancing-rules/page.tsx', 'src/components/BalancingRulesTimeline.tsx', 'src/lib/balancing-rules.ts']) {
  const body = stripComments(fs.readFileSync(path.join(ROOT, f), 'utf8'));
  for (const w of EVAL) ok(!body.includes(w), `${f}: 文に評価語「${w}」`);
  for (const w of ['本便', '研究便', '実装便', '反証役', '調べ役']) ok(!body.includes(w), `${f}: 文に内側の語「${w}」`);
}

// 6. 出典
const HOSTS = [
  'eprx.or.jp', 'occto.or.jp', 'meti.go.jp', 'jftc.go.jp', 'e-gov.go.jp',
  // 一般送配電事業者 10 社
  'hepco.co.jp', 'tohoku-epco.co.jp', 'tepco.co.jp', 'chuden.co.jp', 'rikuden.co.jp', 'kansai-td.co.jp', 'energia.co.jp', 'yonden.co.jp', 'kyuden.co.jp', 'okiden.co.jp',
];
const hostOk = (u: string) => {
  try {
    const h = new URL(u).hostname;
    return HOSTS.some((x) => h === x || h.endsWith(`.${x}`));
  } catch {
    return false;
  }
};
const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'source-documents.json'), 'utf8')) as { documents: { name: string; url: string; aliases?: string[] }[] };
const norm = (s: string) => s.normalize('NFKC').replace(/\s+/g, '');
const ledgerNames = new Set(ledger.documents.flatMap((d) => [d.name, ...(d.aliases ?? [])]).map(norm));
let noDate = 0;
for (const r of ALL) {
  ok(r.sources.length > 0, `${r.id}: 一次が 0 本`);
  for (const s of r.sources) {
    ok(/^https:\/\//.test(s.url) && hostOk(s.url), `${r.id}: 出典のホストが一次の許可リストに無い（${s.url}）`);
    ok(!/bess-net\.jp/.test(s.url), `${r.id}: 出典に当サイトの URL`);
    ok(ledgerNames.has(norm(s.name)), `${r.id}: 資料名「${s.name}」が台帳に無い`);
    ok(s.name.trim().length > 0 && s.publisher.trim().length > 0 && s.quote.trim().length > 0, `${r.id}: 出典の資料名・発行者・逐語のどれかが空（${s.url}）`);
    ok(!/sha256|bytes|台帳/.test(s.where), `${r.id}: 該当箇所に照合の記録（sha256 等）が残る（${s.where.slice(0, 40)}）`);
    if (!s.date) noDate++;
  }
}
notes.push(`資料の日付が無い出典 ${noDate} 本（日付の無い一覧ページ）`);

// 7. 初期 DOM
if (HTML) {
  const raw = fs.readFileSync(HTML, 'utf8');
  const main = (raw.match(/<main[\s\S]*<\/main>/) ?? [raw])[0];
  const text = main.replace(/<!-- -->/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  const LEAD = '一次が取れた改定だけを載せています（網羅ではありません）。日付は公表日（一次の日付）と適用日（実需給日）を分けています。当サイトは改定の良し悪しや収益への影響を評価しません。';
  ok(text.split(LEAD).length - 1 === 1, `初期 DOM に冒頭の 1 行がちょうど 1 回でない（${text.split(LEAD).length - 1}）`);
  const missingTitle = ALL.filter((r) => !text.includes(r.title));
  ok(missingTitle.length === 0, `初期 DOM に無い title: ${missingTitle.map((r) => r.id).join('・')}`);
  const nAnn = text.split('公表日（一次の日付）').length - 1;
  const nEff = text.split('適用日（実需給日）').length - 1;
  ok(nAnn >= ALL.length && nEff >= ALL.length, `初期 DOM の列名が行数より少ない（公表日 ${nAnn}・適用日 ${nEff}・行 ${ALL.length}）`);
  const missingSrc = [...new Set(ALL.flatMap((r) => r.sources.map((s) => s.name)))].filter((n) => !text.includes(n));
  ok(missingSrc.length === 0, `初期 DOM に無い一次の資料名: ${missingSrc.slice(0, 5).join('・')}`);
  ok(text.split('予定・検討中・注視（改定ではないもの）').length - 1 === 1, '初期 DOM に「予定・検討中・注視」の欄がちょうど 1 つでない');
  // 評価語: 一次の逐語の中にあるものは別に数える（当サイトの文には 0）
  const quotes = ALL.flatMap((r) => [r.before, r.after, r.reasonQuote ?? '', r.pendingQuote ?? '', ...r.sources.map((s) => s.quote), ...r.sources.map((s) => s.where)]);
  let inQuotes = 0;
  let outside = text;
  for (const q of quotes.filter(Boolean).sort((a, b) => b.length - a.length)) {
    if (EVAL.some((w) => q.includes(w))) inQuotes += outside.split(q).length - 1;
    outside = outside.split(q).join('');
  }
  for (const w of EVAL) ok(!outside.includes(w), `初期 DOM（一次の逐語の外）に評価語「${w}」`);
  notes.push(`評価語を含む一次の逐語の表示 ${inQuotes} か所（逐語のまま）`);
  const hrefs = [...main.matchAll(/href="([^"]+)"/g)].map((m) => m[1].replace(/&amp;/g, '&'));
  const badEx = hrefs.filter((h) => h.startsWith('/explainer/') && isExcludedExplainer(h.slice('/explainer/'.length)));
  ok(badEx.length === 0, `初期 DOM に非表示の解説へのリンク: ${badEx.join('・')}`);
  const badPe = hrefs.filter((h) => h.startsWith('/policy-calendar/') && !POLICY_DETAIL_SLUG_SET.has(h.slice('/policy-calendar/'.length)));
  ok(badPe.length === 0, `初期 DOM に詳細ページの無い政策イベントへのリンク（404）: ${badPe.join('・')}`);
  const badBench = hrefs.filter((h) => h.startsWith('/tools/balancing-benchmark?')).filter((h) => {
    const sp = new URL(h, 'https://x').searchParams;
    return !coverage.includes(sp.get('from') ?? '') || !coverage.includes(sp.get('to') ?? '');
  });
  ok(badBench.length === 0, `初期 DOM に範囲外の月のベンチマークリンク: ${badBench.join('・')}`);
  ok(!main.includes('/explainer/integrated-market-2026'), '初期 DOM に /explainer/integrated-market-2026 へのリンク');
  // 非表示の関連（解説・政策イベント）の題名が本文に出ていない（政策イベントの多くは一覧 /policy-calendar へのリンクなので、href ではなく題名で見る）
  //   非表示のものは生成で外れてデータに無いので、題名は追補の relatedTitles（研究便が拾った関連の全部）から取る
  const rt = (JSON.parse(fs.readFileSync(path.join(ROOT, 'reports', 'tool-balancing-rules-2026-10-13.addendum.json'), 'utf8')) as {
    relatedTitles: { explainer: Record<string, string>; policyEvent: Record<string, { title: string }> };
  }).relatedTitles;
  const hiddenTitles = [
    ...Object.entries(rt.explainer).filter(([s]) => isExcludedExplainer(s)).map(([slug, title]) => ({ slug, title })),
    ...Object.entries(rt.policyEvent).filter(([s]) => isExcludedEvent(s)).map(([slug, v]) => ({ slug, title: v.title })),
  ];
  ok(hiddenTitles.length > 0, '非表示の関連の題名が 1 件も無い（照合の前提が崩れている）');
  for (const e of hiddenTitles) ok(!text.includes(e.title), `初期 DOM に非表示の関連「${e.slug}」の題名が出ている`);
  notes.push(`初期 DOM: title ${ALL.length - missingTitle.length}/${ALL.length}・資料名の欠け ${missingSrc.length}・ベンチマークリンク ${hrefs.filter((h) => h.startsWith('/tools/balancing-benchmark?')).length}`);
}

// 8. 出典の URL（手で回す）
async function urlChecks() {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
  const urls = [...new Set(ALL.flatMap((r) => r.sources.map((s) => s.url)))];
  const res: Record<string, number> = {};
  const unknown: string[] = [];
  for (const u of urls) {
    let st = 0;
    try {
      const r = await fetch(u, { method: 'GET', headers: { 'User-Agent': UA }, redirect: 'follow' });
      st = r.status;
      await r.body?.cancel();
    } catch {
      st = -1;
    }
    res[st] = (res[st] ?? 0) + 1;
    const h = new URL(u).hostname;
    if ((st === 202 || st === 403) && h.endsWith('meti.go.jp')) unknown.push(`${u}（${st}）`);
    else ok(st === 200, `--urls: ${u} が HTTP ${st}`);
  }
  notes.push(`--urls: ${urls.length} 本 ${Object.entries(res).map(([k, v]) => `${k}=${v}`).join('・')}${unknown.length ? `・不明（bot 判定）${unknown.length}` : ''}`);
}

(async () => {
  if (URLS) await urlChecks();
  console.log(`[verify:balancing-rules] 検査 ${checks} 件${notes.length ? '・' + notes.join('・') : ''}`);
  if (problems.length) {
    console.warn(`[verify:balancing-rules] WARN 問題 ${problems.length} 件`);
    problems.slice(0, 60).forEach((p) => console.warn(`   - ${p}`));
    if (STRICT) process.exit(1);
  } else {
    console.log('[verify:balancing-rules] ok   生成一致・裁定 R1〜R7・日付の根拠・上限価格・前後の窓・関連・禁止語・出典');
  }
})();
