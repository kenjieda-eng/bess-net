/**
 * src/lib/balancing-benchmark-calc.ts — 需給調整 入札ベンチマークの計算（T1 実装便・2026-10-08）
 *
 * 仕様は reports/tool-balancing-benchmark-plan-2026-10-08.md（設計書）(2) と T1 実装便の裁定 R1〜R9。
 * #119: 画面（src/components/BalancingBenchmark.tsx）と検査（scripts/verify-balancing-benchmark.ts）が同じ関数を使う。
 * ★JSON を import しない（クライアントから値で import してよい）。市場の月次・上限はサーバ（page.tsx）が組み立てて渡す。
 *
 * 計算（記号は設計書 2-2）:
 *   K_m ＝ 日数×48、Rev(u, C, K, r) ＝ balancingRevenueYen（/tools/balancing-revenue と同じ関数＝R7）
 *   実績 A ＝ Rev(自分の単価, 容量, K, 約定率)、全電源ベンチ ＝ Rev(全電源の月次平均, …)、蓄電池ベンチ ＝ Rev(蓄電池の月次平均, …)
 *   約定率（容量ベース・R8）＝ 約定量 ÷（提供容量 × 月のコマ数）。この定義で、単価がその月の約定量で加重した平均なら
 *   A は ΔkW の約定収益（単価 × 約定量）と一致する（加重でない平均なら一致しない）。
 *   差 ＝ A − ベンチ、差 % ＝ 差 ÷ ベンチ（ベンチが 0 なら null）。
 *   上限比 ＝ 市場平均 ÷ その月の上限（月内に改定がある月は日数加重＝R4）。印は蓄電池・一次／二次①／複合だけ（R2・R3 案 a）。
 * 空欄と 0 を分ける: 空欄＝null（計算から外す）、0 は 0。単価・約定率・容量のどれかが欠けた月は「不完全」で外す。
 */
import { balancingRevenueYen, blocksInMonth } from './balancing-revenue-calc';

export type BenchProductKey = 'primary' | 'secondary-1' | 'secondary-2' | 'tertiary-1' | 'tertiary-2' | 'composite';
export const BENCH_PRODUCTS: readonly BenchProductKey[] = ['primary', 'secondary-1', 'secondary-2', 'tertiary-1', 'tertiary-2', 'composite'];

/** 上限付近の印の閾値（R1・θ＝0.90。「張り付き」とは呼ばない） */
export const CAP_NEAR_RATIO = 0.9;
/** 印を付ける商品（R2: 蓄電池だけ・R3 案 a: 二次②・三次①は印なし・三次②は上限なし） */
export const NEAR_CAP_PRODUCTS: readonly BenchProductKey[] = ['primary', 'secondary-1', 'composite'];
/**
 * 上限の列に「単独／複合」を並べる商品（R3 案 a）。蓄電池の月次平均が単独応札の上限を超える月がある。
 * EPRX の上限価格表の注記は「単独応札に適用。複合応札には複合商品の上限価格が適用」。月次平均に複合応札がどれだけ含まれるかの
 * 内訳は資料に無い（推測しない）ので、印は付けずに単独と複合の上限を並べる。
 */
export const SINGLE_AND_COMPOSITE_CAP_PRODUCTS: readonly BenchProductKey[] = ['secondary-2', 'tertiary-1'];

/** その月の上限（月内に改定があれば start と end が違い、effective は日数加重＝R4。changeCount は月内の改定の回数） */
export type MonthCap = { start: number; end: number; changedOn: string | null; effective: number; changeCount?: number };

/** サーバが組み立てる 1 か月分の市場データ */
export type BenchMonth = {
  ym: string;
  all: Record<BenchProductKey, number | null>;
  battery: Record<BenchProductKey, number | null>;
  /** 商品の上限（三次②は null） */
  cap: Record<BenchProductKey, MonthCap | null>;
};

/** 利用者の 1 か月分の入力（文字列のまま持つ＝空欄と 0 を分ける） */
export type RowInput = { price: string; rate: string; cap: string };
export const EMPTY_ROW: RowInput = { price: '', rate: '', cap: '' };

type Parsed = { value: number | null; invalid: boolean };

/** 数として受ける形（3 桁区切りのカンマだけ可。「12,34」「1,2,3」のような位置のカンマは不正） */
/** 数の形: 整数部は 3 桁区切り（先頭の組は 0 で始めない＝'0,500' は不正）か区切りなし。'.5'・'5.' も受ける */
const NUMBER_BODY = String.raw`(([1-9]\d{0,2}(,\d{3})+|\d+)(\.\d*)?|\.\d+)`;
const NUMBER_RE = new RegExp(`^-?${NUMBER_BODY}$`);

/** 数値の文字列を読む。空欄は null（不正ではない）。全角数字と 3 桁区切りのカンマは受ける。有限でない値・カンマや空白だけは不正 */
export function parseNumberText(text: string): Parsed {
  const t = text.normalize('NFKC').trim();
  if (t === '') return { value: null, invalid: false };
  if (!NUMBER_RE.test(t)) return { value: null, invalid: true };
  const v = Number(t.replace(/,/g, ''));
  if (!Number.isFinite(v)) return { value: null, invalid: true };
  return { value: v === 0 ? 0 : v, invalid: false }; // -0 は 0 に
}

/**
 * MW の文字列 → kW。小数点を 3 桁ずらして読む（2.0005×1000＝2000.5000000000002 のような浮動小数のずれを避ける）。
 * 不正なら null。
 */
export function mwTextToKw(text: string): number | null {
  const raw = text.normalize('NFKC').trim();
  if (!new RegExp(`^${NUMBER_BODY}$`).test(raw)) return null;
  const t = raw.replace(/,/g, '');
  const m = t.match(/^(\d*)(?:\.(\d*))?$/);
  if (!m) return null;
  const frac = (m[2] ?? '').padEnd(3, '0');
  return Number(`${m[1] || '0'}${frac.slice(0, 3)}${frac.length > 3 ? `.${frac.slice(3)}` : ''}`);
}

/** 契約容量の入力（単位つき）→ kW。空欄は null・不正は NaN */
export function capacityKwOf(text: string, unit: 'kW' | 'MW'): number | null {
  if (text.trim() === '') return null;
  if (unit === 'MW') {
    const kw = mwTextToKw(text);
    return kw === null ? NaN : kw;
  }
  const p = parseNumberText(text);
  return p.invalid || p.value === null || p.value < 0 ? NaN : p.value;
}

/** 上限比（cap が無い・0 なら null） */
export function capRatio(price: number | null, cap: MonthCap | null): number | null {
  if (price === null || !cap || !(cap.effective > 0)) return null;
  return price / cap.effective;
}

/** 印の判定（閾値ちょうどで付く＝>=） */
export function isNearCap(ratio: number | null, threshold: number = CAP_NEAR_RATIO): boolean {
  return ratio !== null && ratio >= threshold;
}

/** 上限の表示（例: 19.51／月内の改定は「19.51→15.00（3/14〜）」） */
export function formatCap(cap: MonthCap | null): string {
  if (!cap) return '上限なし';
  if (!cap.changedOn) return cap.start.toFixed(2);
  const m = Number(cap.changedOn.slice(5, 7));
  const d = Number(cap.changedOn.slice(8, 10));
  // 月内に 2 回以上の改定がある月は途中を省いて示す（verify:balancing-benchmark が WARN を出す＝表示の見直しの合図）
  const more = (cap.changeCount ?? 1) > 1 ? 'ほか' : '';
  return `${cap.start.toFixed(2)}→${cap.end.toFixed(2)}（${m}/${d}〜${more}）`;
}

export type MonthResult = {
  ym: string;
  blocks: number;
  /** 単価・約定率・容量がそろい、範囲内の値 */
  complete: boolean;
  /** 何か入力があるのに不完全・範囲外（印を付けて外す） */
  incomplete: boolean;
  /** 範囲外・数値でない入力の項目名 */
  invalidFields: string[];
  price: number | null;
  rate: number | null;
  capacityKw: number | null;
  marketAll: number | null;
  marketBattery: number | null;
  actual: number | null;
  benchAll: number | null;
  benchBattery: number | null;
  diffAll: number | null;
  diffAllPct: number | null;
  diffBattery: number | null;
  diffBatteryPct: number | null;
  cap: MonthCap | null;
  /** R3 案 a の商品だけ: 複合の上限 */
  compositeCap: MonthCap | null;
  ratioAll: number | null;
  ratioBattery: number | null;
  /** R3 案 a の商品だけ: 複合の上限に対する比 */
  ratioAllComposite: number | null;
  ratioBatteryComposite: number | null;
  nearCap: boolean;
};

const pct = (diff: number | null, base: number | null): number | null =>
  diff === null || base === null || base === 0 ? null : diff / base;

/** 1 か月分の計算 */
export function computeMonth(
  product: BenchProductKey,
  month: BenchMonth,
  input: RowInput,
  contractKw: number | null,
): MonthResult {
  const blocks = blocksInMonth(month.ym);
  const invalidFields: string[] = [];
  const pPrice = parseNumberText(input.price);
  const pRate = parseNumberText(input.rate);
  const pCap = parseNumberText(input.cap);
  let price = pPrice.value;
  let rate = pRate.value;
  if (pPrice.invalid || (price !== null && price < 0)) { invalidFields.push('単価'); price = null; }
  if (pRate.invalid || (rate !== null && (rate < 0 || rate > 100))) { invalidFields.push('約定率'); rate = null; }
  let capacityKw: number | null;
  if (pCap.invalid || (pCap.value !== null && pCap.value < 0)) { invalidFields.push('容量'); capacityKw = null; }
  else if (pCap.value !== null) capacityKw = pCap.value;
  else capacityKw = contractKw !== null && Number.isFinite(contractKw) && contractKw >= 0 ? contractKw : null;

  const anyInput = input.price.trim() !== '' || input.rate.trim() !== '' || input.cap.trim() !== '';
  const complete = price !== null && rate !== null && capacityKw !== null && invalidFields.length === 0;
  const marketAll = month.all[product];
  const marketBattery = month.battery[product];
  const actual = complete ? balancingRevenueYen(price as number, capacityKw as number, blocks, rate as number) : null;
  const benchAll = complete && marketAll !== null ? balancingRevenueYen(marketAll, capacityKw as number, blocks, rate as number) : null;
  const benchBattery = complete && marketBattery !== null ? balancingRevenueYen(marketBattery, capacityKw as number, blocks, rate as number) : null;
  const diffAll = actual !== null && benchAll !== null ? actual - benchAll : null;
  const diffBattery = actual !== null && benchBattery !== null ? actual - benchBattery : null;

  const cap = month.cap[product];
  const showComposite = SINGLE_AND_COMPOSITE_CAP_PRODUCTS.includes(product);
  const compositeCap = showComposite ? month.cap.composite : null;
  const ratioBattery = capRatio(marketBattery, cap);
  return {
    ym: month.ym,
    blocks,
    complete,
    incomplete: anyInput && !complete,
    invalidFields,
    price,
    rate,
    capacityKw,
    marketAll,
    marketBattery,
    actual,
    benchAll,
    benchBattery,
    diffAll,
    diffAllPct: pct(diffAll, benchAll),
    diffBattery,
    diffBatteryPct: pct(diffBattery, benchBattery),
    cap,
    compositeCap,
    ratioAll: capRatio(marketAll, cap),
    ratioBattery,
    ratioAllComposite: showComposite ? capRatio(marketAll, compositeCap) : null,
    ratioBatteryComposite: showComposite ? capRatio(marketBattery, compositeCap) : null,
    nearCap: NEAR_CAP_PRODUCTS.includes(product) && isNearCap(ratioBattery),
  };
}

export type Sum = { sum: number | null; months: number };
export type DiffSum = { actual: number | null; bench: number | null; diff: number | null; pct: number | null; months: number };
export type Totals = { actual: Sum; benchAll: Sum; benchBattery: Sum; diffAll: DiffSum; diffBattery: DiffSum; incompleteMonths: number };

function sumOf(values: (number | null)[]): Sum {
  const xs = values.filter((v): v is number => v !== null);
  return { sum: xs.length ? xs.reduce((a, b) => a + b, 0) : null, months: xs.length };
}

/** 差の合計は、実績と比べる側の両方がある月だけで取る（設計書 2-2・その月だけの実績の小計も返す） */
function diffSumOf(rows: MonthResult[], bench: (r: MonthResult) => number | null): DiffSum {
  const pairs = rows.filter((r) => r.actual !== null && bench(r) !== null);
  if (pairs.length === 0) return { actual: null, bench: null, diff: null, pct: null, months: 0 };
  const a = pairs.reduce((s, r) => s + (r.actual as number), 0);
  const b = pairs.reduce((s, r) => s + (bench(r) as number), 0);
  return { actual: a, bench: b, diff: a - b, pct: b === 0 ? null : (a - b) / b, months: pairs.length };
}

export function computeTotals(rows: MonthResult[]): Totals {
  return {
    actual: sumOf(rows.map((r) => r.actual)),
    benchAll: sumOf(rows.map((r) => r.benchAll)),
    benchBattery: sumOf(rows.map((r) => r.benchBattery)),
    diffAll: diffSumOf(rows, (r) => r.benchAll),
    diffBattery: diffSumOf(rows, (r) => r.benchBattery),
    incompleteMonths: rows.filter((r) => r.incomplete).length,
  };
}

/** 範囲の年月（昇順）のうち start〜end */
export function monthsInRange(allYms: readonly string[], start: string, end: string): string[] {
  return allYms.filter((ym) => ym >= start && ym <= end);
}

/** 既定の期間＝範囲の最後から 12 か月（範囲が短ければ全部） */
export function defaultPeriod(allYms: readonly string[]): { start: string; end: string } {
  const end = allYms[allYms.length - 1];
  const start = allYms[Math.max(0, allYms.length - 12)];
  return { start, end };
}

/** 期間の検査（null＝問題なし）。範囲の外は選べない・開始 > 終了はエラー・1 か月は通す */
export function periodError(allYms: readonly string[], start: string, end: string): string | null {
  if (!allYms.includes(start) || !allYms.includes(end)) return `期間は ${allYms[0]}〜${allYms[allYms.length - 1]} の範囲で選んでください`;
  if (start > end) return '開始の年月が終了より後になっています';
  return null;
}

// ─── CSV（R6: サーバへ送らない・ブラウザの保存領域に置かない。利用者が自分の端末に保存する） ───

export const CSV_HEADER = ['年月', '単価(円/ΔkW・30分)', '約定率(容量ベース・%)', '容量の上書き(kW)'] as const;
/** 保存ボタンの名前（ページ本文の案内も同じ文字列を使う＝ボタン名と案内がずれない） */
export const CSV_SAVE_LABEL = '月別の入力を CSV で保存';
/** 読み込みボタンの名前 */
export const CSV_LOAD_LABEL = 'CSV を読み込む';

const csvCell = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);

/** 月別の入力を CSV に（列は固定の 4 つだけ・空欄は空のセル・0 は「0」） */
export function serializeCsv(yms: readonly string[], rows: Record<string, RowInput>): string {
  const lines = [CSV_HEADER.join(',')];
  for (const ym of yms) {
    const r = rows[ym] ?? EMPTY_ROW;
    lines.push([ym, r.price.trim(), r.rate.trim(), r.cap.trim()].map(csvCell).join(','));
  }
  return lines.join('\n');
}

function splitCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let q = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (q) {
      if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
      else if (ch === '"') q = false;
      else cur += ch;
    } else if (ch === '"') q = true;
    else if (ch === ',') { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

export type CsvParseResult = { rows: Record<string, RowInput>; accepted: number; rejected: { line: number; reason: string }[] };

/**
 * CSV を読む。範囲外の年月・同じ年月の重複・数値でない値・範囲外の値（負の単価・100 超の約定率・負の容量）の行は拒否し、
 * 行番号と理由を返す（黙って捨てない）。5 列目以降の列は無視する（事業者名・自由記述は読まない）。
 */
export function parseCsv(text: string, allowedYms: readonly string[]): CsvParseResult {
  const rows: Record<string, RowInput> = {};
  const rejected: { line: number; reason: string }[] = [];
  // 改行は CRLF・LF・CR のどれでも（CR だけのファイルを 1 行と見なして黙って捨てない）
  const lines = text.replace(/^﻿/, '').split(/\r\n|\r|\n/);
  let accepted = 0;
  let seenFirst = false;
  lines.forEach((raw, i) => {
    const lineNo = i + 1;
    if (raw.trim() === '') return;
    const cells = splitCsvLine(raw).map((c) => c.trim());
    const isFirst = !seenFirst;
    seenFirst = true;
    if (isFirst && cells[0] === CSV_HEADER[0]) return; // 見出し（最初の空でない行）
    // 年月は YYYY-MM／YYYY/M／YYYY/M/D（表計算ソフトで保存し直した形）を受けて YYYY-MM に直す
    const mm = (cells[0] ?? '').normalize('NFKC').match(/^(\d{4})[-/](\d{1,2})(?:[-/]\d{1,2})?$/);
    const ym = mm ? `${mm[1]}-${mm[2].padStart(2, '0')}` : '';
    if (!ym || !allowedYms.includes(ym)) {
      rejected.push({ line: lineNo, reason: `年月「${cells[0] ?? ''}」が範囲外か形式違い（YYYY-MM で）` });
      return;
    }
    if (rows[ym]) {
      rejected.push({ line: lineNo, reason: `年月 ${ym} が重複` });
      return;
    }
    const [price = '', rate = '', cap = ''] = cells.slice(1, 4);
    const pp = parseNumberText(price);
    const pr = parseNumberText(rate);
    const pc = parseNumberText(cap);
    if (pp.invalid || pr.invalid || pc.invalid) {
      rejected.push({ line: lineNo, reason: `${ym}: 数値でない値` });
      return;
    }
    if ((pp.value !== null && pp.value < 0) || (pr.value !== null && (pr.value < 0 || pr.value > 100)) || (pc.value !== null && pc.value < 0)) {
      rejected.push({ line: lineNo, reason: `${ym}: 範囲外の値（単価・容量は 0 以上、約定率は 0〜100）` });
      return;
    }
    rows[ym] = { price, rate, cap };
    accepted++;
  });
  return { rows, accepted, rejected };
}
