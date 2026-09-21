/**
 * src/lib/spot-spread-reference.ts
 *
 * JEPX スポットの日内スプレッド（システムプライス）の参照値をカタログから出す（Nv-0c・2026-09-21）
 *
 * ★なぜ要るか
 *   IRR シミュレータの裁定収益は「スポット高値 − スポット低値」の価差で決まる（標準 23 − 9 ＝ 14 円/kWh）。
 *   この価差は当サイトの想定値で、一次の公表値ではない。一方、JEPX は 30 分単位（48 コマ）の約定価格を公表しており、
 *   日内の価差はそこから算出できる。カタログにはその系列が既にある:
 *     jepx-spread-top8-system  … 上位 8 コマ平均 − 下位 8 コマ平均（4 時間充放電に相当）
 *     jepx-spread-range-system … 日内最大 − 日内最小（理論上限・実運用では取り切れない）
 *   既定の価差がこれらと比べてどの位置にあるかを画面に出し、裁定収益が過大になりうる方向を読者に見せる。
 *
 * ★以前の誤り（Nv-0c のレビューで指摘・是正）
 *   「JEPX の公表系列に日内の高値・安値は無い」と書いていたが誤り（30 分値から出せる）。
 *   また「日内高値の想定 23」を「日平均の範囲 5.43〜19.30」と比べて「範囲外」としていたが、
 *   違う指標同士の比較で成り立たない。比べるなら日内の価差同士で比べる。
 *
 * ★相対 import（@/ ではない）。スクリプトからも読めるように。
 */
import top8Data from '../data/eic/jepx-spread-top8-system.json';
import rangeData from '../data/eic/jepx-spread-range-system.json';

type Series = { points?: { date: string; value: number | null }[] };

/** 会計年度（4 月始まり）ごとの平均。点が 360 以上ある年度だけを「揃った年度」とみなす */
function fiscalYearAverages(series: Series): { fy: number; avg: number; n: number }[] {
  const byFy = new Map<number, number[]>();
  for (const p of series.points ?? []) {
    if (typeof p.value !== 'number') continue;
    const y = Number(p.date.slice(0, 4));
    const m = Number(p.date.slice(5, 7));
    const fy = m >= 4 ? y : y - 1;
    const arr = byFy.get(fy) ?? [];
    arr.push(p.value);
    byFy.set(fy, arr);
  }
  return [...byFy.entries()]
    .filter(([, v]) => v.length >= 360)
    .map(([fy, v]) => ({ fy, avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length }))
    .sort((a, b) => a.fy - b.fy);
}

const top8 = fiscalYearAverages(top8Data as unknown as Series);
const range = fiscalYearAverages(rangeData as unknown as Series);
const latestTop8 = top8.length ? top8[top8.length - 1] : null;
const rangeSameFy = latestTop8 ? range.find((r) => r.fy === latestTop8.fy) ?? null : null;

/**
 * 直近の揃った年度の日内スプレッド（システムプライス・円/kWh）。
 * カタログが欠けていれば null（画面では数値を出さない）。
 */
export const SPOT_SPREAD_REFERENCE = {
  /** 年度（4 月始まり） */
  fy: latestTop8?.fy ?? null,
  /** 4 時間相当（上位 8 コマ平均 − 下位 8 コマ平均）の年度平均 */
  top8Avg: latestTop8?.avg ?? null,
  /** 日内最大 − 日内最小の年度平均（理論上限） */
  rangeAvg: rangeSameFy?.avg ?? null,
  days: latestTop8?.n ?? null,
} as const;

/** 小数 2 桁の表記 */
export function spreadLabel(v: number | null | undefined): string {
  return typeof v === 'number' ? v.toFixed(2) : '—';
}
