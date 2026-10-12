#!/usr/bin/env tsx
/**
 * scripts/verify-noise-check.ts — 騒音・離隔の目安チェッカー（/tools/noise-check・T5 騒音便 2026-10-12）の否定テスト
 *
 * prebuild で走る（警告のみ・--strict で失敗終了）。外部アクセスは --fetch のときだけ。
 *   1. 計算: 倍距離で −6.02 dB／同じ 2 台で +3.01 dB／合成の順序不変／減衰量 0 と空欄が同じ／必要距離の逆算が往復で一致／
 *      NaN・Infinity を出さない（d ≤ 0・d < r0・0 台・小数の台数・負の減衰量・桁あふれする極端値）
 *   2. 告示の範囲の定数: 2026-10-12 に環境省のページから機械的に抜いた 12 セルの写し（位置順）と一致・漢数字と数字の一致・
 *      ただし書の扱い・区分の境目（0.1 dB の丸め）・定数が凍結されている
 *   3. 特定施設の注記: 全状態（出力の空欄・7.49・7.5・11・負）・「」内が施行令 別表第一 第二号の逐語・断定の語を使わない
 *   4. 出典欄の資料名が台帳 src/data/source-documents.json にある
 *   5. 禁止語（合格・適合・違反）がソースの全文（コメントを除く）・注記・区分のラベルに無い・入力を保存／送信する API を使っていない
 *   6. --html <path>: ビルド出力の初期 DOM（冒頭 1 行・保存しない旨・告示の範囲の表 12/12（位置順）・3 区分の意味・出典・第21条・禁止語なし）
 *   7. --fetch: 一次を取り直して、告示の表（見出し・12 セル）・区域の定義・備考1・ただし書・第二条、施行令 別表第一 第二号、
 *      法 第2条第2項・第4条第2項・第5条・第6条第1項・第8条第1項・第21条第1項 の逐語と照合（手で回す）
 *
 * 実行: npx tsx scripts/verify-noise-check.ts [--html .next/server/app/tools/noise-check.html] [--fetch] [--strict]
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  INPUT_LIMITS,
  ITEM2_COMPRESSOR_VERBATIM,
  ITEM2_FAN_VERBATIM,
  NOISE_SOURCES,
  NOTICE_PERIODS,
  NOTICE_RANGES,
  NOTICE_ZONES,
  RANGE_BAND_LABEL,
  RANGE_BAND_MEANING,
  SCHOOL_PROVISO_DB,
  SPECIFIED_FACILITY_MOTOR_KW,
  barrierValue,
  classifyAgainstRange,
  combineLevels,
  distanceForLevel,
  insideMeasurementDistance,
  isUsableRow,
  levelAtDistance,
  levelForCount,
  maxMeasurementDistance,
  noticeRange,
  receiverLevel,
  specifiedFacilityNotes,
  type NoiseSourceRow,
} from '../src/lib/noise-check';

export {};

const ROOT = process.cwd();
const args = process.argv.slice(2);
const STRICT = args.includes('--strict');
const FETCH = args.includes('--fetch');
const htmlIdx = args.indexOf('--html');
const HTML = htmlIdx >= 0 ? args[htmlIdx + 1] : null;

let checks = 0;
const problems: string[] = [];
const notes: string[] = [];
const ok = (cond: boolean, msg: string) => {
  checks++;
  if (!cond) problems.push(msg);
};
const near = (a: number | null, b: number, eps = 1e-9) => a !== null && Number.isFinite(a) && Math.abs(a - b) <= eps;
const finiteOrNull = (v: number | null) => v === null || Number.isFinite(v);

const row = (p: Partial<NoiseSourceRow>): NoiseSourceRow => ({ kind: 'pcs', count: 1, level: 80, r0: 1, motorKw: null, ...p });

/**
 * 告示 第一条第1項の表の写し（2026-10-12 16:14 JST に https://www.env.go.jp/hourei/07/000052.html から HTML を機械的に解析したもの・
 * 行＝第一種〜第四種区域、列＝昼間・朝・夕・夜間）。lib の定数を書き換えても、この写しと位置ごとに食い違えば検出する。
 */
const NOTICE_TABLE_SNAPSHOT: readonly (readonly string[])[] = [
  ['四十五デシベル以上／五十デシベル以下', '四十デシベル以上／四十五デシベル以下', '四十デシベル以上／四十五デシベル以下'],
  ['五十デシベル以上／六十デシベル以下', '四十五デシベル以上／五十デシベル以下', '四十デシベル以上／五十デシベル以下'],
  ['六十デシベル以上／六十五デシベル以下', '五十五デシベル以上／六十五デシベル以下', '五十デシベル以上／五十五デシベル以下'],
  ['六十五デシベル以上／七十デシベル以下', '六十デシベル以上／七十デシベル以下', '五十五デシベル以上／六十五デシベル以下'],
];
const NOTICE_TABLE_HEAD = ['時間の区分／区域の区分', '昼間', '朝・夕', '夜間'];
/** 施行令 別表第一 第二号の写し（2026-10-12 16:14 JST に e-Gov API 343CO0000000324 から取得）。lib の定数を書き換えても検出する */
const ITEM2_SNAPSHOT = '空気圧縮機（一定の限度を超える大きさの騒音を発生しないものとして環境大臣が指定するものを除き、原動機の定格出力が七・五キロワット以上のものに限る。）及び送風機（原動機の定格出力が七・五キロワット以上のものに限る。）';
const ZONE_LABELS = ['第一種区域', '第二種区域', '第三種区域', '第四種区域'];

// 1. 計算
{
  const d1 = levelAtDistance(80, 1, 10);
  const d2 = levelAtDistance(80, 1, 20);
  ok(near(d1 - d2, 20 * Math.log10(2)) && Math.abs(d1 - d2 - 6.0206) < 1e-4, `倍距離の差が −6.02 dB でない（${d1 - d2}）`);
  ok(near(levelAtDistance(70, 5, 5), 70), '測定距離ちょうどで仕様の値に戻らない');
  ok(Math.abs(levelForCount(60, 2) - 60 - 3.0103) < 1e-4, '同じ 2 台で +3.01 dB にならない');
  ok(near(levelForCount(60, 10), 70), '同じ 10 台で +10 dB にならない');
  ok(near(combineLevels([60, 60]), levelForCount(60, 2)), '合成の式と台数の式が一致しない');
  ok(Math.abs((combineLevels([60, 50]) as number) - 60.4139) < 1e-4, '60 dB と 50 dB の合成が 60.4 dB にならない（宮城県「騒音の尺度」の例）');
  ok(Math.abs(levelAtDistance(90, 1, 30) - 60.4576) < 1e-4, '90 dB@1m の 30m が 60.5 dB にならない（宮城県「騒音の尺度」の例）');
  ok(Math.abs((combineLevels([60, 60]) as number) - 63.0103) < 1e-4, '60 dB の 2 台が 63 dB にならない（宮城県「騒音の尺度」の例 1）');
  const ls = [72.3, 55, 61.8, 40];
  ok(near(combineLevels(ls), combineLevels([...ls].reverse()) as number, 1e-12), '合成が順序で変わる');
  ok(combineLevels([]) === null && combineLevels([Number.NaN]) === null && combineLevels([Number.POSITIVE_INFINITY]) === null, '空・NaN・Infinity の合成が null でない');
  ok(near(combineLevels([400, 400]), 400 + 10 * Math.log10(2), 1e-9), '大きな値の合成が桁あふれする');

  const rows = [row({ level: 75, r0: 1, count: 2 }), row({ kind: 'aircon', level: 62, r0: 3, count: 4 }), row({ kind: 'transformer', level: 58, r0: 2, count: 1 })];
  const a = receiverLevel(rows, 40, null);
  const b = receiverLevel(rows, 40, 0);
  ok(a !== null && a === b, '減衰量の空欄と 0 で結果が違う');
  const c = receiverLevel(rows, 40, 10);
  ok(near((a as number) - (c as number), 10, 1e-9), '減衰量 10 dB がそのまま引かれない');
  ok(receiverLevel(rows, 40, -10) === a && !barrierValue(-10).usable, '負の減衰量が計算に入る（0 として扱わない）');
  ok(receiverLevel(rows, 40, 4000) === a && !barrierValue(4000).usable, '範囲外の減衰量が計算に入る');
  const manual = combineLevels(rows.map((r) => levelForCount(levelAtDistance(r.level as number, r.r0 as number, 40), r.count as number)));
  ok(near(a, manual as number, 1e-9), '受音点のレベルが行ごとの計算の合成と一致しない');
  ok(near(receiverLevel([...rows].reverse(), 40, null), a as number, 1e-9), '行の順序で結果が変わる');
  for (const target of [35, 45, 50.5, 60, 70, 80]) {
    const dd = distanceForLevel(rows, 3, target);
    ok(dd !== null && near(receiverLevel(rows, dd, 3), target, 1e-9), `必要距離の逆算が往復で一致しない（target ${target}）`);
  }
  // 計算に入れない入力
  ok(!isUsableRow(row({ count: 1.5 })) && !isUsableRow(row({ count: 0 })) && !isUsableRow(row({ count: -1 })), '小数・0・負の台数が計算に入る');
  ok(!isUsableRow(row({ level: 3100 })) && !isUsableRow(row({ level: -1 })) && !isUsableRow(row({ r0: 1e-300 })) && !isUsableRow(row({ count: 1e308 })), '範囲外の騒音レベル・測定距離・台数が計算に入る');
  // NaN・Infinity を出さない
  const bad: [string, number | null][] = [
    ['d=0', receiverLevel(rows, 0, null)],
    ['d<0', receiverLevel(rows, -5, null)],
    ['d=null', receiverLevel(rows, null, null)],
    ['d=1e308', receiverLevel(rows, 1e308, null)],
    ['0 台', receiverLevel([row({ count: 0 })], 10, null)],
    ['台数 null', receiverLevel([row({ count: null })], 10, null)],
    ['r0=0', receiverLevel([row({ r0: 0 })], 10, null)],
    ['r0=1e-300', receiverLevel([row({ r0: 1e-300 })], 10, null)],
    ['L=null', receiverLevel([row({ level: null })], 10, null)],
    ['L=3100', receiverLevel([row({ level: 3100 })], 10, null)],
    ['台数 1e308', receiverLevel([row({ count: 1e308 })], 10, null)],
    ['減衰 1e308', receiverLevel(rows, 10, 1e308)],
    ['行なし', receiverLevel([], 10, null)],
    ['距離 行なし', distanceForLevel([], null, 50)],
    ['距離 0 台', distanceForLevel([row({ count: 0 })], null, 50)],
    ['d<r0', receiverLevel([row({ r0: 10 })], 3, null)],
    ['NaN 入力', receiverLevel([row({ level: Number.NaN })], 10, null)],
    ['Infinity 入力', receiverLevel([row({ level: Number.POSITIVE_INFINITY })], 10, null)],
  ];
  for (const [label, v] of bad) ok(finiteOrNull(v), `${label} で NaN／Infinity が出る（${v}）`);
  ok(receiverLevel(rows, 0, null) === null && receiverLevel([row({ count: 0 })], 10, null) === null, 'd=0・0 台が null でない');
  ok(insideMeasurementDistance([row({ r0: 10 })], 3) && !insideMeasurementDistance([row({ r0: 10 })], 30), '測定距離より内側の判定が違う');
  ok(!insideMeasurementDistance([row({ r0: 10 })], 0) && !insideMeasurementDistance([row({ r0: 10 })], -1), 'd ≤ 0 で「測定距離より内側」になる');
  ok(maxMeasurementDistance([row({ r0: 2 }), row({ r0: 5 }), row({ r0: 9, count: 0 })]) === 5, '最大の測定距離に計算に入れない行が入る');
  ok(near(receiverLevel([row({ count: 0 }), row({ level: 70, r0: 1 })], 10, null), 50, 1e-9), '0 台の行が合成に入っている');
  ok(classifyAgainstRange(Number.NaN, { min: 40, max: 50 }) === null && classifyAgainstRange(Number.POSITIVE_INFINITY, { min: 40, max: 50 }) === null, '有限でない値に区分が付く');
}

// 2. 告示の範囲の定数
{
  const KAN: Record<string, number> = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
  const kan2int = (s: string): number => {
    const m = s.match(/^([一二三四五六七八九]?)十([一二三四五六七八九]?)$/);
    if (m) return (m[1] ? KAN[m[1]] : 1) * 10 + (m[2] ? KAN[m[2]] : 0);
    return NaN;
  };
  ok(NOTICE_ZONES.map((z) => z.label).join() === ZONE_LABELS.join(), '区域の並びが告示の表と違う');
  ok(['昼間', '朝・夕', '夜間'].join() === NOTICE_PERIODS.map((p) => p.label).join(), '時間の区分の並びが告示の表と違う');
  let cells = 0;
  NOTICE_ZONES.forEach((z, zi) => {
    NOTICE_PERIODS.forEach((p, pi) => {
      const c = NOTICE_RANGES[z.key][p.key];
      cells++;
      ok(c.verbatim === NOTICE_TABLE_SNAPSHOT[zi][pi], `${z.label}×${p.label}: 定数の逐語「${c.verbatim}」が表の写し「${NOTICE_TABLE_SNAPSHOT[zi][pi]}」と違う`);
      const m = c.verbatim.match(/^(.+?)デシベル以上／(.+?)デシベル以下$/);
      ok(!!m, `${z.label}×${p.label}: 逐語の形が「…デシベル以上／…デシベル以下」でない`);
      if (m) {
        ok(kan2int(m[1]) === c.min, `${z.label}×${p.label}: 下限の逐語「${m[1]}」と数字 ${c.min} が違う`);
        ok(kan2int(m[2]) === c.max, `${z.label}×${p.label}: 上限の逐語「${m[2]}」と数字 ${c.max} が違う`);
      }
      ok(c.min < c.max, `${z.label}×${p.label}: 下限 < 上限 でない`);
      const r = noticeRange(z.key, p.key, true);
      const expectMin = z.key === 'zone1' ? c.min : c.min - SCHOOL_PROVISO_DB;
      ok(r.min === expectMin && r.max === c.max && r.provisoApplied === (z.key !== 'zone1'), `${z.label}×${p.label}: ただし書の範囲が違う`);
      const r0 = noticeRange(z.key, p.key, false);
      ok(r0.min === c.min && r0.max === c.max && !r0.provisoApplied, `${z.label}×${p.label}: ただし書なしの範囲が違う`);
      ok(classifyAgainstRange(c.max, c) === 'withinRange' && classifyAgainstRange(c.max + 0.04, c) === 'withinRange' && classifyAgainstRange(c.max + 0.05, c) === 'aboveMax', `${z.label}×${p.label}: 上限の境目の扱いが違う`);
      ok(classifyAgainstRange(c.min, c) === 'withinRange' && classifyAgainstRange(c.min - 0.06, c) === 'belowMin', `${z.label}×${p.label}: 下限の境目の扱いが違う`);
    });
  });
  ok(cells === 12, `告示の範囲が 12 セルでない（${cells}）`);
  ok(Object.isFrozen(NOTICE_RANGES) && Object.isFrozen(NOTICE_RANGES.zone2) && Object.isFrozen(NOTICE_RANGES.zone2.day), '告示の範囲の定数が凍結されていない');
  // ページの「告示の範囲は、どの区域でも夜間が昼間より低く、朝・夕と比べても同じか低い範囲です」
  for (const z of NOTICE_ZONES) {
    const { night: n, day, morningEvening: me } = NOTICE_RANGES[z.key];
    ok(n.min < day.min && n.max < day.max, `${z.label}: 夜間が昼間より低くない（ページの文と食い違う）`);
    ok(n.min <= me.min && n.max <= me.max, `${z.label}: 夜間が朝・夕より高いところがある（ページの文と食い違う）`);
  }
}

// 3. 特定施設の注記
const ALL_NOTE_TEXTS: string[] = [];
{
  const n = (p: Partial<NoiseSourceRow>) => specifiedFacilityNotes([row(p)])[0];
  ok(SPECIFIED_FACILITY_MOTOR_KW === 7.5, '特定施設の出力要件が 7.5kW でない');
  ok(`${ITEM2_COMPRESSOR_VERBATIM}及び${ITEM2_FAN_VERBATIM}` === ITEM2_SNAPSHOT, '施行令 別表第一 第二号の定数が取得時の写しと違う');
  ok(n({ kind: 'fan', motorKw: 1e21 })?.status === 'needKw', '受け付ける範囲を超える出力が「出力を入れる」にならない');
  ok(/環境大臣が指定するもの（一定の限度を超える大きさの騒音を発生しないもの）に当たるかは/.test(n({ kind: 'compressor', motorKw: 11 })?.text ?? ''), '空気圧縮機の注記に環境大臣の指定の除外を確かめる旨が無い');
  ok(ITEM2_COMPRESSOR_VERBATIM.includes('七・五キロワット以上') && ITEM2_FAN_VERBATIM.includes('七・五キロワット以上') && ITEM2_COMPRESSOR_VERBATIM.includes('環境大臣が指定するものを除き'), '第二号の逐語に 7.5kW の要件・環境大臣の指定の除外が無い');
  ok(n({ kind: 'fan', motorKw: 7.5 })?.status === 'possible', '送風機 7.5kW が「当たりうる」にならない');
  ok(n({ kind: 'fan', motorKw: 7.49 })?.status === 'belowKw', '送風機 7.49kW が「出力要件を満たさない」にならない');
  ok(n({ kind: 'compressor', motorKw: 11 })?.status === 'possible', '空気圧縮機 11kW が「当たりうる」にならない');
  ok(n({ kind: 'compressor', motorKw: null })?.status === 'needKw', '空気圧縮機の出力が空欄で「出力を入れる」にならない');
  ok(n({ kind: 'fan', motorKw: -5 })?.status === 'needKw' && n({ kind: 'fan', motorKw: 0 })?.status === 'needKw', '出力 0・負が「出力を入れる」にならない');
  ok(n({ kind: 'pcs' })?.status === 'notListed' && /別表第一に無い/.test(n({ kind: 'pcs' })?.text ?? '') && /冷却ファン/.test(n({ kind: 'pcs' })?.text ?? ''), 'PCS の注記が「別表第一に無い」と冷却ファンの扱いを書いていない');
  ok(n({ kind: 'transformer' })?.status === 'notListed', '変圧器が「別表第一に無い」にならない');
  ok(n({ kind: 'aircon' })?.status === 'unclear', '空調が「語だけでは決まらない」にならない');
  ok(specifiedFacilityNotes([row({ count: 0, kind: 'fan', motorKw: 10 })]).length === 0 && specifiedFacilityNotes([row({ count: 1.5, kind: 'fan', motorKw: 10 })]).length === 0, '0 台・小数の台数の行に注記が出る');
  ok(specifiedFacilityNotes([{ kind: 'pcs', count: 1, level: null, r0: null, motorKw: null }]).length === 0, '何も入れていない行に注記が出る');
  // 全種類 × 出力（空欄・負・7.49・7.5・11）の注記
  const kinds: NoiseSourceRow['kind'][] = ['pcs', 'transformer', 'aircon', 'fan', 'compressor', 'other'];
  const statuses = new Set<string>();
  for (const k of kinds) for (const kw of [null, -5, 7.49, 7.5, 11]) {
    const x = n({ kind: k, motorKw: kw });
    if (!x) continue;
    statuses.add(x.status);
    ALL_NOTE_TEXTS.push(x.text);
    ok(/^音源 1（/.test(x.text), `注記の呼び名が「音源 N」でない: ${x.text.slice(0, 20)}`);
    ok(!/特定施設です|特定施設ではありません|特定施設に当たります|特定施設に当たりません/.test(x.text), `注記が特定施設と断定している: ${x.text.slice(0, 40)}`);
    // 「」の中で原動機の出力に触れるものは、施行令 別表第一 第二号の逐語の部分文字列であること
    for (const q of x.text.matchAll(/「([^「」]+)」/g)) {
      if (/原動機/.test(q[1])) ok(`${ITEM2_COMPRESSOR_VERBATIM}及び${ITEM2_FAN_VERBATIM}`.includes(q[1]), `注記の「${q[1].slice(0, 20)}…」が施行令 別表第一 第二号の逐語でない`);
    }
  }
  ok(['possible', 'needKw', 'belowKw', 'notListed', 'unclear'].every((s) => statuses.has(s)), `注記の状態が全部出ていない（${[...statuses].join(',')}）`);
}

// 4. 出典欄の資料名が台帳にある
{
  const ledger = JSON.parse(fs.readFileSync(path.join(ROOT, 'src', 'data', 'source-documents.json'), 'utf8')) as { documents: { name: string; aliases?: string[] }[] };
  const norm = (s: string) => s.normalize('NFKC').replace(/\s+/g, '');
  const known = new Set<string>();
  for (const d of ledger.documents) {
    known.add(norm(d.name));
    for (const a of d.aliases ?? []) known.add(norm(a));
  }
  for (const s of NOISE_SOURCES) ok(known.has(norm(s.name)), `出典欄の資料名「${s.name}」が台帳に無い`);
  ok(new Set(NOISE_SOURCES.map((s) => s.name)).size === NOISE_SOURCES.length, '出典欄の資料名が重複している');
  ok(NOISE_SOURCES.every((s) => /^https:\/\//.test(s.href)), '出典欄の URL が https でない');
  notes.push(`出典 ${NOISE_SOURCES.length} 種`);
}

// 5. 禁止語・保存／送信の API
const BANNED = ['合格', '適合', '違反'];
{
  const files = ['src/lib/noise-check.ts', 'src/components/NoiseChecker.tsx', 'src/app/tools/noise-check/page.tsx'];
  const RE = /localStorage|sessionStorage|indexedDB|document\.cookie|\bfetch\s*\(|sendBeacon|XMLHttpRequest|useSearchParams|history\.(pushState|replaceState)|navigator\.clipboard/;
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{\/\*[\s\S]*?\*\/\}/g, '');
  for (const f of files) {
    const src = strip(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    ok(!RE.test(src), `${f}: 入力を保存・送信しうる API を使っている（${(src.match(RE) ?? [''])[0]}）`);
    for (const w of BANNED) ok(!src.includes(w), `${f}: 禁止語「${w}」（コメントを除いたソース全文）`);
  }
  // /tools のカード（noise-check の項）
  const tools = strip(fs.readFileSync(path.join(ROOT, 'src', 'app', 'tools', 'page.tsx'), 'utf8'));
  const i = tools.indexOf("slug: 'noise-check'");
  ok(i >= 0, '/tools に noise-check のカードが無い');
  const card = i >= 0 ? tools.slice(i, tools.indexOf('},', i)) : '';
  for (const w of BANNED) ok(!card.includes(w), `/tools のカードに禁止語「${w}」`);
  for (const t of [...ALL_NOTE_TEXTS, ...Object.values(RANGE_BAND_LABEL), ...Object.values(RANGE_BAND_MEANING)]) for (const w of BANNED) ok(!t.includes(w), `注記・区分の文に禁止語「${w}」: ${t.slice(0, 30)}`);
  ok(INPUT_LIMITS.barrier.min === 0, '減衰量の下限が 0 でない');
}

// 6. 初期 DOM（ビルド出力を渡したときだけ）
if (HTML) {
  const h = fs.readFileSync(HTML, 'utf8').replace(/<!-- -->/g, '');
  const main = (h.match(/<main[\s\S]*?<\/main>/) ?? [''])[0].replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/g, '');
  const unesc = (s: string) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'");
  const flat = unesc(main.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, '');
  const f = (s: string) => s.replace(/\s+/g, '');
  ok(flat.includes(f('簡易な距離減衰の計算と、騒音規制法の規制基準の範囲を並べる目安です。実際の値は地形・反射・気象・機器の特性で変わります。設計・測定・自治体への確認の代わりにはなりません。')), '初期 DOM に冒頭 1 行が無い');
  ok(flat.includes(f('入力はこの画面の中だけで使い、保存も送信もしません。')), '初期 DOM に「保存も送信もしません」が無い');
  // 告示の表（caption で特定）を位置順に 12/12
  const tbl = (main.match(/<table[\s\S]*?<\/table>/g) ?? []).find((t) => t.includes('告示 第一条第1項の表')) ?? '';
  const trs = (tbl.match(/<tr[\s\S]*?<\/tr>/g) ?? []).slice(1);
  let pos = 0;
  trs.forEach((tr, zi) => {
    const cs = (tr.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/g) ?? []).map((c) => unesc(c.replace(/<[^>]+>/g, '')).replace(/\s+/g, ''));
    NOTICE_PERIODS.forEach((p, pi) => {
      const z = NOTICE_ZONES[zi];
      if (z && cs[0] === z.label && cs[pi + 1] === f(`${NOTICE_RANGES[z.key][p.key].min}〜${NOTICE_RANGES[z.key][p.key].max} デシベル`)) pos++;
    });
  });
  ok(pos === 12, `初期 DOM の告示の範囲の表が位置順に 12/12 でない（${pos}）`);
  ok(flat.includes(f('受音点の合成レベル')) && flat.includes(f('告示の範囲との位置')), '初期 DOM に結果の欄が無い');
  for (const m of Object.values(RANGE_BAND_MEANING)) ok(flat.includes(f(m)), `初期 DOM に 3 区分の意味「${m.slice(0, 16)}…」が無い`);
  const missingSrc = NOISE_SOURCES.filter((s) => !flat.includes(f(`「${s.name}」`)));
  ok(missingSrc.length === 0, `初期 DOM の出典欄に無い資料名: ${missingSrc.map((s) => s.name).join('・')}`);
  ok(/class="article-sources"/.test(main), '初期 DOM に出典欄（article-sources）が無い');
  ok(flat.includes(f('騒音規制法第21条第1項')), '初期 DOM に第21条（電気工作物）の注記が無い');
  ok(!flat.includes('同法第'), '初期 DOM に「同法第…」（どの法か読み違えうる参照）がある');
  for (const w of BANNED) ok(!flat.includes(w), `初期 DOM（main）に禁止語「${w}」`);
  notes.push(`初期 DOM: 告示の表 ${pos}/12（位置順）・出典 ${NOISE_SOURCES.length - missingSrc.length}/${NOISE_SOURCES.length}`);
}

// 7. 一次の取り直し（手で回す）
async function fetchChecks() {
  const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
  const get = async (u: string) => {
    const r = await fetch(u, { headers: { 'User-Agent': UA } });
    return { status: r.status, text: await r.text() };
  };
  const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, '').replace(/\s+/g, '');
  // 告示（環境省）
  const k = await get('https://www.env.go.jp/hourei/07/000052.html');
  ok(k.status === 200, `告示のページが HTTP ${k.status}`);
  const table = (k.text.match(/<table[\s\S]*?<\/table>/g) ?? []).find((t) => t.includes('デシベル以上')) ?? '';
  const trs = table.match(/<tr[\s\S]*?<\/tr>/g) ?? [];
  const cellsOf = (r: string) => (r.match(/<t[hd][^>]*>[\s\S]*?<\/t[hd]>/g) ?? []).map((c) => strip(c.replace(/<\/div>\s*<div[^>]*>/g, '／')));
  ok(cellsOf(trs[0] ?? '').join() === NOTICE_TABLE_HEAD.join(), `告示の表の見出しが「${cellsOf(trs[0] ?? '').join('｜')}」`);
  ok(trs.length === 5, `告示の表の行が見出し＋4 でない（${trs.length}）`);
  trs.slice(1).forEach((r, i) => {
    const cs = cellsOf(r);
    ok(cs[0] === ZONE_LABELS[i], `告示の表 ${i + 1} 行目の区域が「${cs[0]}」`);
    NOTICE_PERIODS.forEach((p, j) => {
      ok(cs[j + 1] === NOTICE_TABLE_SNAPSHOT[i][j], `告示の表 ${ZONE_LABELS[i]}×${p.label} が「${cs[j + 1]}」（写し ${NOTICE_TABLE_SNAPSHOT[i][j]}）`);
      ok(cs[j + 1] === NOTICE_RANGES[NOTICE_ZONES[i].key][p.key].verbatim, `告示の表 ${ZONE_LABELS[i]}×${p.label} が定数と違う`);
    });
  });
  const kf = strip(k.text);
  for (const z of NOTICE_ZONES) ok(kf.includes(strip(z.definition)), `告示に区域の定義「${z.definition.slice(0, 20)}…」が無い`);
  ok(kf.includes(strip('昼間とは、午前七時又は八時から午後六時、七時又は八時までとし、朝とは、午前五時又は六時から午前七時又は八時までとし、夕とは、午後六時、七時又は八時から午後九時、十時又は十一時までとし、夜間とは、午後九時、十時又は十一時から翌日の午前五時又は六時までとする。')), '告示の備考1の逐語が一致しない');
  ok(kf.includes(strip('の敷地の周囲おおむね五十メートルの区域内における当該基準は、都道府県知事（市の区域内の区域については、市長。）が規制基準として同表の時間の区分及び区域の区分に応じて定める値以下当該値から五デシベルを減じた値以上とすることができる。')), '告示のただし書の逐語が一致しない');
  ok(kf.includes(strip('同表に掲げる第二種区域、第三種区域又は第四種区域の区域内に所在する')), '告示のただし書の対象区域（第二種〜第四種）が一致しない');
  ok(kf.includes(strip('前条第一項に定める時間の区分及び区域の区分ごとの基準の下限値以上とする。')), '告示 第二条の逐語が一致しない');
  // 施行令 別表第一 第二号
  const o = await get('https://laws.e-gov.go.jp/api/1/lawdata/343CO0000000324');
  ok(o.status === 200, `施行令の API が HTTP ${o.status}`);
  const of = strip(o.text);
  ok(of.includes(`${ITEM2_COMPRESSOR_VERBATIM}及び${ITEM2_FAN_VERBATIM}`), '施行令 別表第一 第二号の逐語（定数 ITEM2_*_VERBATIM）が一致しない');
  for (const w of ['変圧器', 'パワーコンディショナ', '空気調和', '冷凍機', '蓄電池']) ok(!of.includes(w), `施行令に「${w}」がある（ページの「語はありません」と食い違う）`);
  // 法
  const l = await get('https://laws.e-gov.go.jp/api/1/lawdata/343AC0000000098');
  ok(l.status === 200, `騒音規制法の API が HTTP ${l.status}`);
  const lf = strip(l.text);
  const LAW: [string, string][] = [
    ['第2条第2項', 'この法律において「規制基準」とは、特定施設を設置する工場又は事業場（以下「特定工場等」という。）において発生する騒音の特定工場等の敷地の境界線における大きさの許容限度をいう。'],
    ['第4条第2項', '当該地域の自然的、社会的条件に特別の事情があるため、前項の規定により定められた規制基準によつては当該地域の住民の生活環境を保全することが十分でないと認めるときは、条例で、環境大臣の定める範囲内において、同項の規制基準に代えて適用すべき規制基準を定めることができる。'],
    ['第5条', '指定地域内に特定工場等を設置している者は、当該特定工場等に係る規制基準を遵守しなければならない。'],
    ['第6条第1項', '指定地域内において工場又は事業場（特定施設が設置されていないものに限る。）に特定施設を設置しようとする者は、その特定施設の設置の工事の開始の日の三十日前までに、環境省令で定めるところにより、次の事項を市町村長に届け出なければならない。'],
    ['第8条第1項', 'その届出に係る第六条第一項第三号又は第四号に掲げる事項の変更をしようとするときは、当該事項の変更に係る工事の開始の日の三十日前までに'],
    ['第21条第1項', 'である特定施設を設置する者については、第六条から第十一条までの規定並びに第十二条第二項及び第十三条の規定（第九条に係る部分に限る。）を適用せず、電気事業法、ガス事業法又は鉱山保安法の相当規定の定めるところによる。'],
  ];
  for (const [label, s] of LAW) ok(lf.includes(strip(s)), `法 ${label} の逐語が一致しない`);
  notes.push('一次の取り直し（告示・施行令・法）');
}

(async () => {
  if (FETCH) await fetchChecks();
  console.log(`[verify:noise-check] 検査 ${checks} 件${notes.length ? '・' + notes.join('・') : ''}`);
  if (problems.length) {
    console.warn(`[verify:noise-check] WARN 問題 ${problems.length} 件`);
    problems.slice(0, 40).forEach((p) => console.warn(`   - ${p}`));
    if (STRICT) process.exit(1);
  } else {
    console.log('[verify:noise-check] ok   計算・告示の範囲・特定施設の注記・出典・禁止語・保存なし');
  }
})();
