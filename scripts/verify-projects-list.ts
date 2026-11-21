#!/usr/bin/env tsx
/**
 * scripts/verify-projects-list.ts — 蓄電所一覧（/projects）の絞り込み・並べ替え・URL・CSV の検査（蓄電所一覧の検索便・2026-11-21）
 *
 * 軸 1（関数）: src/lib/projects-list.ts の都道府県・地方・出力の帯・運転開始の年と並べ替えの鍵・キーワード・並べ替え・URL・CSV。
 * 軸 2（ソース）: page.tsx が searchParams を受け取らない・src/app/projects/** に検索パラメータの hook が無い・metadata と revalidate が前と同じ・
 *   ブラウザの部品とその lib が、禁じたファイル（microcms・grid-prefecture・projects-excluded・page-dates）を値で import していない。
 * 軸 3（--html <dir>・ビルドの後に手で）: 事前生成された /projects の HTML の表・件数・ボタンと select の件数。
 * 軸 4（--live・microCMS を GET で読むだけ・手で 1 回）: 県ごとの件数が projects-pref-count.json と同じ・条件なしの CSV の行・合計・slug。
 *   埋まっている欄の件数と、公開日の日ごとの件数を数えて出す。--sample <path> で条件なしの CSV の先頭 8 行を書く。
 *
 * 問題があれば exit 1。prebuild では軸 1・2 だけ（microCMS へのアクセスなし）。
 * 実行: npm run verify:projects-list   …   npm run verify:projects-list -- --html .next/server/app
 *       set -a && . ./.env.local && set +a && npm run verify:projects-list -- --live --sample reports/projects-list-sample-2026-11-21.csv
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  type ListRow,
  type ListState,
  EMPTY_STATE,
  PREFECTURES,
  REGIONS,
  CSV_HEADER,
  buildCsv,
  codSortKey,
  codYear,
  csvText,
  filterRows,
  fmtMW,
  fmtMWh,
  groupByStatus,
  groupRows,
  isInvestigating,
  jstStamp,
  matchKeyword,
  mwBand,
  parseState,
  prefOf,
  reliableCount,
  serializeState,
  sortRows,
  statusLabel,
  sumReliable,
  toListRow,
  tokens,
} from '../src/lib/projects-list';
import { REAL_PREFECTURES } from '../src/lib/grid-prefecture';
import { codCellText } from '../src/lib/projects-cod';

const TAG = '[verify:projects-list]';
const args = process.argv.slice(2);
const argVal = (k: string) => {
  const i = args.indexOf(k);
  return i >= 0 ? args[i + 1] : undefined;
};
const problems: string[] = [];
const ng = (msg: string) => problems.push(msg);
const eq = (label: string, got: unknown, want: unknown) => {
  const g = JSON.stringify(got), w = JSON.stringify(want);
  if (g !== w) ng(`${label}: ${g}（期待 ${w}）`);
};

const row = (o: Partial<ListRow> & { s: string; n: string }): ListRow => ({
  st: '', p: '', c: '', mw: null, mwh: null, op: '', epc: '', cod: '', src: '', pd: '', rd: '', ...o,
});
const codText = (r: ListRow) => codCellText({ status: r.st, cod: r.cod });

// ───────────── 軸 1（関数） ─────────────
function axis1(): void {
  // 都道府県
  eq('prefOf 福岡県', prefOf('福岡県'), '福岡県');
  eq('prefOf 北海道', prefOf('北海道'), '北海道');
  eq('prefOf 京都府', prefOf('京都府'), '京都府');
  eq('prefOf 前後の空白', prefOf(' 福岡県 '), '福岡県');
  eq('prefOf 複数の県', prefOf('東京都・兵庫県'), null);
  eq('prefOf 空', prefOf(''), null);
  eq('prefOf undefined', prefOf(undefined), null);
  eq('prefOf 文の切れ端', prefOf('【野村'), null);
  eq('prefOf 市', prefOf('仙台市'), null);
  // 47 都道府県が REAL_PREFECTURES と同じ集合・同じ順
  eq('47 都道府県の並び', [...PREFECTURES], [...REAL_PREFECTURES]);
  eq('47 都道府県の数', PREFECTURES.length, 47);
  const inRegions = REGIONS.flatMap((r) => r.prefs);
  eq('地方 8 つ', REGIONS.length, 8);
  eq('地方の県は 47 が 1 回ずつ', [...inRegions].sort(), [...PREFECTURES].sort());
  eq('地方の県に重なりが無い', new Set(inRegions).size, inRegions.length);
  // 出力の帯
  const bands: Array<[number | null, string]> = [[2, 'le2'], [1.999, 'le2'], [2.01, '2-10'], [9.99, '2-10'], [10, '10-50'], [49.9, '10-50'], [50, 'ge50'], [0, 'na'], [null, 'na']];
  for (const [v, want] of bands) eq(`mwBand ${v}`, mwBand(v), want);
  // 運転開始の年
  const years: Array<[string, number | null]> = [['2026-04-08', 2026], ['2025年12月', 2025], ['2028年度（予定）', 2028], ['2027年（予定）', 2027], ['2027年1月末頃（予定）', 2027], ['', null]];
  for (const [v, want] of years) eq(`codYear ${v || '空'}`, codYear(v), want);
  // 並べ替えの鍵
  const keys: Array<[string, string | null]> = [['2026-04-08', '2026-04-08'], ['2025年12月', '2025-12-31'], ['2028年度（予定）', '2029-03-31'], ['2027年（予定）', '2027-12-31'], ['', null]];
  for (const [v, want] of keys) eq(`codSortKey ${v || '空'}`, codSortKey(v), want);
  // 調査中
  eq('isInvestigating 0 MW', isInvestigating(0, 10), true);
  eq('isInvestigating 0 MWh', isInvestigating(1, 0), true);
  eq('isInvestigating 空', isInvestigating(null, undefined), false);
  // 数字の書式（ロケール固定・今と同じ文字）
  eq('fmtMW 1234.5', fmtMW(1234.5), '1,234.5 MW');
  eq('fmtMW 4.8876', fmtMW(4.8876), '4.888 MW');
  eq('fmtMW 0', fmtMW(0), '調査中');
  eq('fmtMWh 空', fmtMWh(null), '—');

  // キーワード
  const jfe = row({ s: 'a', n: 'テスト蓄電所', op: 'JFEエンジニアリング株式会社' });
  eq('キーワード ｊｆｅ', matchKeyword(jfe, tokens('ｊｆｅ')).hit, true);
  const renova1 = row({ s: 'b', n: '姫路蓄電所', op: '株式会社レノバ' });
  const renova2 = row({ s: 'c', n: '千葉蓄電所', op: '株式会社レノバ' });
  eq('キーワード AND（両方ある行）', matchKeyword(renova1, tokens('レノバ 姫路')).hit, true);
  eq('キーワード AND（片方だけの行）', matchKeyword(renova2, tokens('レノバ 姫路')).hit, false);
  const epcRow = row({ s: 'd', n: '某蓄電所', op: '某社', epc: '東芝エネルギーシステムズ' });
  eq('キーワード EPC にだけある語', matchKeyword(epcRow, tokens('東芝')), { hit: true, epcOnly: true });
  eq('キーワード 名前に当たれば EPC の印なし', matchKeyword(epcRow, tokens('某')), { hit: true, epcOnly: false });
  eq('キーワード slug には当てない', matchKeyword(row({ s: 'tagawa-130mwh', n: 'x' }), tokens('tagawa')).hit, false);

  // 並べ替え
  const sample = [
    row({ s: 'z1', n: 'い', mw: 0, cod: '' }),
    row({ s: 'z2', n: 'あ', mw: 10, cod: '2026-01-01', pd: '2026-11-01' }),
    row({ s: 'z3', n: 'う', mw: null, cod: '2027年（予定）', pd: '2026-11-03' }),
    row({ s: 'z4', n: 'あ', mw: 10, cod: '2025年12月', pd: '' }),
    row({ s: 'z0', n: 'あ', mw: 20, cod: 'わからない', pd: '2026-11-02' }),
  ];
  eq('並べ替え 出力の大きい順（空と 0 は最後・同着は名前 → slug）', sortRows(sample, 'mw').map((r) => r.s), ['z0', 'z2', 'z4', 'z1', 'z3']);
  eq('並べ替え 運転開始の新しい順（読めない・空は最後）', sortRows(sample, 'cod-desc').map((r) => r.s), ['z3', 'z2', 'z4', 'z0', 'z1']);
  eq('並べ替え 運転開始の古い順（読めない・空は最後）', sortRows(sample, 'cod-asc').map((r) => r.s), ['z4', 'z2', 'z3', 'z0', 'z1']);
  eq('並べ替え 新しく載った順（空は最後）', sortRows(sample, 'new').map((r) => r.s), ['z3', 'z0', 'z2', 'z4', 'z1']);
  eq('並べ替え 状態ごと＝渡した順のまま', sortRows(sample, '').map((r) => r.s), sample.map((r) => r.s));
  const same = sortRows(sample, '');
  if (same !== sample) ng('並べ替え 状態ごと: 配列を作り直している（渡した順をそのまま使う）');

  // 状態のまとまり（サーバーの並び・語・URL の鍵）
  const grouped = groupRows([
    row({ s: 'g1', n: 'a', st: '稼働中' }), row({ s: 'g2', n: 'b', st: '' }), row({ s: 'g3', n: 'c', st: '稼働中' }), row({ s: 'g4', n: 'd', st: '休止中' }),
  ]);
  eq('状態のまとまり', grouped.map((g) => [g.status, g.key, g.rows.map((r) => r.s)]), [['稼働中', 'operating', ['g1', 'g3']], ['その他', 'other', ['g2']], ['休止中', '3', ['g4']]]);
  eq('statusLabel 空', statusLabel(''), 'その他');
  const gs = groupByStatus([
    { slug: 'a', status: ['計画中'], outputMw: 5, capacityMwh: 10 },
    { slug: 'b', status: ['稼働中'], outputMw: 0, capacityMwh: 10 },
    { slug: 'c', status: ['稼働中'], outputMw: 2, capacityMwh: 4 },
    { slug: 'd', status: [], outputMw: 1, capacityMwh: 1 },
  ]);
  eq('groupByStatus の並び（状態の順・調査中を最後）', gs.map((g) => [g.status, g.items.map((i) => i.slug)]), [['稼働中', ['c', 'b']], ['計画中', ['a']], ['その他', ['d']]]);

  // URL
  const keysAll = ['operating', 'construction', 'planned', 'other'];
  const st1: ListState = { ...EMPTY_STATE, q: 'レノバ 姫路', pref: '福岡県', status: ['operating', 'planned'], mw: ['10-50', 'ge50'], year: '2026', inv: 'exclude', sort: 'mw' };
  const qs1 = serializeState(st1);
  eq('URL 鍵の並びは固定', [...new URLSearchParams(qs1).keys()], ['q', 'pref', 'status', 'mw', 'year', 'inv', 'sort']);
  eq('URL 読んで書くと同じ文字', serializeState(parseState(qs1, keysAll)), qs1);
  eq('URL 読んで書くと同じ文字（地方）', serializeState(parseState('region=kyushu&sort=cod-asc', keysAll)), 'region=kyushu&sort=cod-asc');
  eq('URL 初めの値は書かない', serializeState(EMPTY_STATE), '');
  eq('URL 状態の並びはボタンの並び（カンマはそのまま）', serializeState(parseState('status=planned,operating', keysAll)), 'status=operating,planned');
  eq('URL 県の名前', serializeState({ ...EMPTY_STATE, pref: '福岡県', status: ['operating'], sort: 'mw' }), `pref=${encodeURIComponent('福岡県')}&status=operating&sort=mw`);
  eq('URL 知らない鍵と値は捨てる', serializeState(parseState('foo=1&pref=火星&region=x&status=zzz&mw=99&year=20x6&inv=all&sort=random', keysAll)), '');
  eq('URL pref があれば region は使わない', serializeState(parseState('pref=福岡県&region=kanto', keysAll)), serializeState({ ...EMPTY_STATE, pref: '福岡県' }));
  eq('URL pref=none', parseState('pref=none', keysAll).pref, 'none');
  eq('URL year=none', parseState('year=none', keysAll).year, 'none');
  eq('URL データに無い年は捨てる', parseState('year=1999', keysAll, ['2026']).year, '');
  eq('URL q は 100 字まで', parseState(`q=${'あ'.repeat(150)}`, keysAll).q.length, 100);
  for (const bad of ['%E0%A4%A', '?q=%', 'q=%ZZ&pref=%E7%A6', '%%%', '&&&==', '\u0000']) {
    try {
      parseState(bad, keysAll);
    } catch (e) {
      ng(`URL 壊れた文字列で例外: ${JSON.stringify(bad)} ${(e as Error).message}`);
    }
  }

  // 絞り込み
  const fr = [
    row({ s: 'f1', n: 'A', st: '稼働中', p: '福岡県', mw: 30, cod: '2026-03-01' }),
    row({ s: 'f2', n: 'B', st: '計画中', p: '佐賀県', mw: 0, mwh: 10, cod: '2028年度（予定）' }),
    row({ s: 'f3', n: 'C', st: '稼働中', p: '東京都・兵庫県', mw: 1 }),
  ];
  const keyOf = (r: ListRow) => (r.st === '稼働中' ? 'operating' : 'planned');
  eq('絞り込み 県', filterRows(fr, { ...EMPTY_STATE, pref: '福岡県' }, keyOf).map((r) => r.s), ['f1']);
  eq('絞り込み 地方', filterRows(fr, { ...EMPTY_STATE, region: 'kyushu' }, keyOf).map((r) => r.s), ['f1', 'f2']);
  eq('絞り込み 所在地が未記載・確認中', filterRows(fr, { ...EMPTY_STATE, pref: 'none' }, keyOf).map((r) => r.s), ['f3']);
  eq('絞り込み 状態', filterRows(fr, { ...EMPTY_STATE, status: ['operating'] }, keyOf).map((r) => r.s), ['f1', 'f3']);
  eq('絞り込み 出力', filterRows(fr, { ...EMPTY_STATE, mw: ['le2', 'na'] }, keyOf).map((r) => r.s), ['f2', 'f3']);
  eq('絞り込み 年', filterRows(fr, { ...EMPTY_STATE, year: '2028' }, keyOf).map((r) => r.s), ['f2']);
  eq('絞り込み 年 記載なし', filterRows(fr, { ...EMPTY_STATE, year: 'none' }, keyOf).map((r) => r.s), ['f3']);
  eq('絞り込み 調査中だけ', filterRows(fr, { ...EMPTY_STATE, inv: 'only' }, keyOf).map((r) => r.s), ['f2']);
  eq('絞り込み 調査中を除く', filterRows(fr, { ...EMPTY_STATE, inv: 'exclude' }, keyOf).map((r) => r.s), ['f1', 'f3']);
  eq('合計（0 と空は数えない）', [sumReliable([1.5, 0, null, 2]), reliableCount([1.5, 0, null, 2])], [3.5, 2]);

  // CSV
  const cr = [
    row({ s: 'c1', n: '名前に"引用"と,カンマ', st: '稼働中', p: '福岡県', c: '田川市', mw: 1234.5, mwh: 0, op: '=SUM(A1)', epc: '+x', cod: '2026-04-08', src: 'https://example.com/a', pd: '2026-11-15', rd: '2026-11-20' }),
    row({ s: 'c2', n: '改行\nあり', st: '', mw: null, mwh: 8.25, op: '-y', epc: '@z', cod: '2027年度', pd: '2026-01-02' }),
  ];
  const csv = buildCsv(cr, { ...EMPTY_STATE, pref: '福岡県', status: ['operating'], sort: 'mw' }, 304, '2026-11-22 10:15', (k) => (k === 'operating' ? '稼働中' : k), codText);
  if (!csv.endsWith('\r\n')) ng('CSV: 末尾が CRLF でない');
  const recs = parseCsv(csv);
  eq('CSV 1 行目', recs[0]?.[0], '出典: 蓄電所ネット bess-net.jp（取得日時: 2026-11-22 10:15）');
  if (!recs[1]?.[0]?.startsWith('注意: ')) ng('CSV 2 行目が「注意:」で始まらない');
  eq('CSV 3 行目（条件）', recs[2]?.[0], '条件: 地域=福岡県／状態=稼働中／並べ替え=出力の大きい順（該当 2 件）');
  eq('CSV 見出しの 13 列', recs[3], CSV_HEADER.split(','));
  eq('CSV 行の数＝渡した行の数', recs.length - 4, cr.length);
  eq('CSV 1 行目の欄', recs[4], ['名前に"引用"と,カンマ', '稼働中', '福岡県', '田川市', '1234.5', '', "'=SUM(A1)", "'+x", '2026-04-08', 'https://example.com/a', 'https://bess-net.jp/projects/c1', '2026-11-15', '2026-11-20']);
  eq('CSV 2 行目の欄（空の状態は「その他」・改行・空と 0 は空欄・先頭の - と @）', recs[5], ['改行\nあり', 'その他', '', '', '', '8.25', "'-y", "'@z", '2027年度（予定）', '', 'https://bess-net.jp/projects/c2', '2026-01-02', '']);
  for (const r of recs.slice(4)) for (const i of [4, 5]) if (/[^0-9.]/.test(r[i] ?? '')) ng(`CSV 数字の欄に単位か桁区切り: ${r[i]}`);
  eq('csvText の囲み', csvText('a"b'), '"a""b"');
  const none = buildCsv(cr, EMPTY_STATE, 2, '2026-11-22 10:15', (k) => k, codText).split('\r\n');
  eq('CSV 条件なしの 3 行目', none[2], '条件: なし（全 2 件）');
}

/** CSV を読む（" の囲み・"" ・囲みの中の改行に対応） */
function parseCsv(text: string): string[][] {
  const out: string[][] = [];
  let rec: string[] = [], cur = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) {
      if (ch === '"' && text[i + 1] === '"') { cur += '"'; i++; } else if (ch === '"') q = false; else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { rec.push(cur); cur = ''; }
    else if (ch === '\r' && text[i + 1] === '\n') { rec.push(cur); out.push(rec); rec = []; cur = ''; i++; }
    else cur += ch;
  }
  if (cur || rec.length) { rec.push(cur); out.push(rec); }
  return out;
}

// ───────────── 軸 2（ソース） ─────────────
const stripComments = (src: string) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
function axis2(): void {
  const page = fs.readFileSync('src/app/projects/page.tsx', 'utf8');
  const pageCode = stripComments(page);
  if (/searchParams/.test(pageCode)) ng('page.tsx が searchParams を受け取っている（ページが静的でなくなる）');
  const walk = (d: string): string[] => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
  for (const f of walk('src/app/projects').filter((f) => /\.(tsx?|jsx?)$/.test(f))) {
    if (/useSearchParams/.test(stripComments(fs.readFileSync(f, 'utf8')))) ng(`${f} が useSearchParams を使っている（#92）`);
  }
  for (const s of [
    "title: '全国の蓄電所プロジェクト一覧（容量・事業者・稼働状況）',",
    "'国内の系統用蓄電池プロジェクトを公開情報ベースで一元管理。容量・所在地・事業者・ステータス・運転開始時期・市場参加形態を構造化して提供します。',",
    "alternates: { canonical: 'https://bess-net.jp/projects' },",
    'export const revalidate = 600;',
    'LIST_EXCLUDED_PROJECT_SLUGS.has(',
  ]) if (!page.includes(s)) ng(`page.tsx に前と同じ文字が無い: ${s}`);
  // ブラウザの部品と lib の import（型だけの import は可）
  const allowed: Record<string, string[]> = {
    'src/app/projects/ProjectsBrowser.tsx': ['react', 'next/link', '@/lib/projects-list', '@/lib/projects-cod'],
    'src/lib/projects-list.ts': ['./projects-cod'],
    'src/lib/projects-cod.ts': [],
  };
  for (const [f, ok] of Object.entries(allowed)) {
    const src = fs.readFileSync(f, 'utf8');
    for (const m of src.matchAll(/^\s*import\s+(type\s+)?[\s\S]*?\sfrom\s+['"]([^'"]+)['"]/gm)) {
      if (m[1]) continue; // import type
      if (!ok.includes(m[2])) ng(`${f} が ${m[2]} を import している（使ってよいのは ${ok.join('・') || 'なし'}）`);
    }
    if (/from\s+['"][^'"]*(microcms|grid-prefecture|projects-excluded|page-dates)['"]/.test(src.replace(/^\s*import\s+type\s[^\n]*\n/gm, ''))) ng(`${f} が禁じたファイルを import している`);
  }
}

// ───────────── 軸 3（--html） ─────────────
const vis = (h: string) => h.replace(/<!-- -->/g, '');
function axis3(dir: string): void {
  const f = path.join(dir, 'projects.html');
  if (!fs.existsSync(f)) { ng(`--html: ${f} が無い`); return; }
  const html = vis(fs.readFileSync(f, 'utf8'));
  const total = Number((/data-list-total="(\d+)"/.exec(html) ?? [])[1]);
  const statNum = Number((/<div class="stat-num">(\d+)<\/div>/.exec(html) ?? [])[1]);
  const heads = [...html.matchAll(/<h2 id="status-([a-z0-9-]+)"[^>]*>([^<（]+)（(\d+)件）<\/h2>/g)].map((m) => ({ key: m[1], label: m[2], n: Number(m[3]) }));
  const tables = (html.match(/<table class="subsidy-table projects-table">/g) ?? []).length;
  const trs = (html.match(/<tr data-slug="/g) ?? []).length;
  eq('HTML 表の数＝見出しの数', tables, heads.length);
  eq('HTML 行の数の合計＝data-list-total', trs, total);
  eq('HTML data-list-total＝件数の箱', total, statNum);
  eq('HTML 見出しの件数の合計＝全件', heads.reduce((s, h) => s + h.n, 0), total);
  const btns = [...html.matchAll(/<button[^>]*data-key="([^"]+)"[^>]*data-count="(\d+)"[^>]*>([^<]*)<\/button>/g)].map((m) => ({ key: m[1], n: Number(m[2]), text: m[3] }));
  const statusBtns = btns.filter((b) => heads.some((h) => h.key === b.key));
  eq('HTML 状態のボタン＝見出し（鍵・件数・語）', statusBtns.map((b) => [b.key, b.n, b.text]), heads.map((h) => [h.key, h.n, `${h.label}（${h.n}）`]));
  const mwBtns = btns.filter((b) => ['le2', '2-10', '10-50', 'ge50', 'na'].includes(b.key));
  eq('HTML 出力のボタン 5 つ', mwBtns.length, 5);
  eq('HTML 出力のボタンの件数の合計＝全件', mwBtns.reduce((s, b) => s + b.n, 0), total);
  const prefOpts = [...html.matchAll(/<option value="pref:([^"]+)">[^<]*（(\d+)）<\/option>/g)].map((m) => ({ v: m[1], n: Number(m[2]) }));
  eq('HTML 地域の select の県 47＋未記載', prefOpts.length, 48);
  eq('HTML 地域の select の件数の合計＝全件', prefOpts.reduce((s, o) => s + o.n, 0), total);
  eq('HTML 地域の select の県の並び', prefOpts.filter((o) => o.v !== 'none').map((o) => o.v), [...PREFECTURES]);
  const yearSel = (/<select id="pl-year"[\s\S]*?<\/select>/.exec(html) ?? [''])[0];
  const yearOpts = [...yearSel.matchAll(/<option value="(\d{4}|none)">[^<]*（(\d+)）<\/option>/g)].map((m) => ({ v: m[1], n: Number(m[2]) }));
  eq('HTML 年の件数＋記載なし＝全件', yearOpts.reduce((s, o) => s + o.n, 0), total);
  eq('HTML 年は古い順', yearOpts.filter((o) => o.v !== 'none').map((o) => o.v), yearOpts.filter((o) => o.v !== 'none').map((o) => o.v).sort());
  if (/projects-table-flat|<th>状態<\/th>/.test(html)) ng('HTML 初めの HTML に「状態」の列のある表がある');
  console.log(`${TAG} 軸 3: 表 ${tables}・行 ${trs}・data-list-total ${total}・見出し ${heads.map((h) => `${h.label} ${h.n}`).join('／')}・出力 ${mwBtns.map((b) => `${b.key} ${b.n}`).join('／')}・年 ${yearOpts.map((o) => `${o.v} ${o.n}`).join('／')}`);
}

// ───────────── 軸 4（--live） ─────────────
type P = {
  slug: string; name: string; status?: string[]; prefecture?: string; city?: string; outputMw?: number; capacityMwh?: number; operator?: string; epc?: string;
  cod?: string; sourceUrl?: string; marketParticipation?: string[]; publishedAt?: string; revisedAt?: string;
};
async function axis4(samplePath?: string): Promise<void> {
  const D = process.env.MICROCMS_SERVICE_DOMAIN, K = process.env.MICROCMS_API_KEY;
  if (!D || !K) { ng('--live: MICROCMS の環境変数が無い'); return; }
  const { LIST_EXCLUDED_PROJECT_SLUGS } = await import('../src/lib/projects-excluded');
  const { jstDay } = await import('../src/lib/page-dates');
  const fields = 'slug,name,status,prefecture,city,outputMw,capacityMwh,operator,epc,cod,sourceUrl,marketParticipation,publishedAt,revisedAt';
  const all: P[] = [];
  for (let offset = 0; offset < 2000; offset += 100) {
    const r = await fetch(`https://${D}.microcms.io/api/v1/projects?limit=100&offset=${offset}&orders=-publishedAt&fields=${fields}`, { headers: { 'X-MICROCMS-API-KEY': K } });
    if (!r.ok) throw new Error(`GET projects → HTTP ${r.status}`);
    const d = (await r.json()) as { totalCount: number; contents: P[] };
    all.push(...d.contents);
    if (all.length >= d.totalCount || d.contents.length < 100) break;
  }
  const items = all.filter((p) => !LIST_EXCLUDED_PROJECT_SLUGS.has(p.slug));
  const rows = groupByStatus(items).flatMap((g) => g.items.map((p) => toListRow(p, jstDay)));
  const groups = groupRows(rows);
  const keyBySlug = new Map(groups.flatMap((g) => g.rows.map((r) => [r.s, g.key] as const)));
  const keyOf = (r: ListRow) => keyBySlug.get(r.s) ?? '';
  // 県ごとの件数＝projects-pref-count.json
  const prefCount: Record<string, number> = {};
  for (const r of rows) { const p = prefOf(r.p); if (p) prefCount[p] = (prefCount[p] ?? 0) + 1; }
  const gen = JSON.parse(fs.readFileSync('src/lib/generated/projects-pref-count.json', 'utf8')) as Record<string, number>;
  eq('軸 4 県ごとの件数＝projects-pref-count.json', Object.fromEntries(Object.entries(prefCount).sort(([a], [b]) => (a < b ? -1 : 1))), Object.fromEntries(Object.entries(gen).sort(([a], [b]) => (a < b ? -1 : 1))));
  // 条件なしの CSV
  const csv = buildCsv(rows, EMPTY_STATE, rows.length, jstStamp().stamp, (k) => groups.find((g) => g.key === k)?.status ?? k, codText);
  const recs = parseCsv(csv).slice(4);
  eq('軸 4 条件なしの CSV の行の数＝掲載件数', recs.length, items.length);
  const r3 = (n: number) => Math.round(n * 1000) / 1000;
  const csvMw = recs.reduce((s, r) => s + (r[4] ? Number(r[4]) : 0), 0);
  const csvMwh = recs.reduce((s, r) => s + (r[5] ? Number(r[5]) : 0), 0);
  eq('軸 4 CSV の出力の合計＝ページの合計（小数 3 桁）', r3(csvMw), r3(sumReliable(items.map((i) => i.outputMw))));
  eq('軸 4 CSV の容量の合計＝ページの合計（小数 3 桁）', r3(csvMwh), r3(sumReliable(items.map((i) => i.capacityMwh))));
  eq('軸 4 CSV の slug の集合＝表', recs.map((r) => r[10].replace('https://bess-net.jp/projects/', '')).sort(), items.map((i) => i.slug).sort());
  const htmlDir = argVal('--html');
  if (htmlDir && fs.existsSync(path.join(htmlDir, 'projects.html'))) {
    const html = fs.readFileSync(path.join(htmlDir, 'projects.html'), 'utf8');
    const htmlSlugs = [...html.matchAll(/<tr data-slug="([^"]+)"/g)].map((m) => m[1]);
    eq('軸 4 CSV の slug の並び＝ビルドの HTML の表の並び', recs.map((r) => r[10].replace('https://bess-net.jp/projects/', '')), htmlSlugs);
  }
  // 数える（報告用）
  const filled = (k: keyof P) => items.filter((p) => { const v = p[k]; return Array.isArray(v) ? v.length > 0 : v != null && String(v).trim() !== ''; }).length;
  console.log(`${TAG} 軸 4: 掲載 ${items.length}（GET ${all.length}）・埋まっている件数 epc ${filled('epc')}／sourceUrl ${filled('sourceUrl')}／marketParticipation ${filled('marketParticipation')}／cod ${filled('cod')}／prefecture ${filled('prefecture')}／status ${filled('status')}`);
  const byDay = new Map<string, number>();
  for (const r of rows) if (r.pd) byDay.set(r.pd, (byDay.get(r.pd) ?? 0) + 1);
  console.log(`${TAG} 軸 4: 公開日の日ごとの件数（多い順に 5 つ）${[...byDay.entries()].sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? 1 : -1)).slice(0, 5).map(([d, n]) => `${d} ${n}`).join('／')}`);
  // §7 の参考の数を数え直す
  const show = (label: string, s: ListState) => {
    const f = sortRows(filterRows(rows, s, keyOf), s.sort);
    const mw = f.map((r) => r.mw), mwh = f.map((r) => r.mwh);
    console.log(`${TAG} 参考: ${label} → ${f.length} 件・合計出力 ${r3(sumReliable(mw))}（${reliableCount(mw)}）・合計容量 ${r3(sumReliable(mwh))}（${reliableCount(mwh)}）`);
    return f;
  };
  show('なし', EMPTY_STATE);
  show('地域＝福岡県', { ...EMPTY_STATE, pref: '福岡県' });
  show('地域＝九州・沖縄 全体', { ...EMPTY_STATE, region: 'kyushu' });
  show('地域＝所在地が未記載・確認中', { ...EMPTY_STATE, pref: 'none' });
  show('状態＝稼働中', { ...EMPTY_STATE, status: ['operating'] });
  show('状態＝稼働中＋出力＝10〜50MW・50MW 以上', { ...EMPTY_STATE, status: ['operating'], mw: ['10-50', 'ge50'] });
  console.log(`${TAG} 参考: 出力の帯 ${['le2', '2-10', '10-50', 'ge50', 'na'].map((b) => `${b} ${rows.filter((r) => mwBand(r.mw) === b).length}`).join('／')}`);
  show('運転開始の年＝2026', { ...EMPTY_STATE, year: '2026' });
  const yc = new Map<string, number>();
  for (const r of rows) { const y = codYear(r.cod); const k = y == null ? '記載なし' : String(y); yc.set(k, (yc.get(k) ?? 0) + 1); }
  console.log(`${TAG} 参考: 年の件数 ${[...yc.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, n]) => `${k} ${n}`).join('／')}`);
  show('調査中だけ', { ...EMPTY_STATE, inv: 'only' });
  const top = show('出力の大きい順', { ...EMPTY_STATE, sort: 'mw' }).slice(0, 4);
  console.log(`${TAG} 参考: 出力の大きい順の上から 4 行 ${top.map((r) => `${r.n}（${r.mw}）`).join('・')}`);
  if (samplePath) {
    fs.writeFileSync(samplePath, '﻿' + csv.split('\r\n').slice(0, 8).join('\r\n') + '\r\n');
    console.log(`${TAG} 条件なしの CSV の先頭 8 行 → ${samplePath}`);
  }
}

async function main(): Promise<void> {
  axis1();
  axis2();
  const htmlDir = argVal('--html');
  if (htmlDir) axis3(htmlDir);
  if (args.includes('--live')) await axis4(argVal('--sample'));
  if (problems.length) {
    for (const p of problems) console.log(`${TAG} NG: ${p}`);
    console.log(`${TAG} NG ${problems.length} 件`);
    process.exit(1);
  }
  console.log(`${TAG} ok（軸 1・2${htmlDir ? '・3' : ''}${args.includes('--live') ? '・4' : ''}）`);
}
main().catch((e) => { console.error(`${TAG} FATAL:`, e); process.exit(1); });

export {};
