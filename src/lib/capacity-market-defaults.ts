/**
 * src/lib/capacity-market-defaults.ts
 *
 * IRR シミュレータの容量市場既定値をカタログから導出する（Nv-0c ■1・2026-09-21）
 *
 * ★なぜ要るか
 *   旧既定値 8,000（標準）/ 12,000（楽観）/ 5,000（悲観）は一次に対応が無かった。
 *   出所は 2026-05-14 の議論メモ「2026 年度容量市場 約定価格（OCCTO 2026年3月公表）: 全国平均 約 7,500 …」で、
 *   この数値はカタログ（OCCTO の約定結果）のどの年度・エリアとも一致しない。実在の機関名を付けた数値が作られ、
 *   それが既定値になっていた。
 *
 * ★定義（依頼者裁定）
 *   - 対象は national（全国加重平均）。エリアの端値は混ぜない（標準と粒度を揃える）
 *   - 標準 = national の全観測値（対象実需給年度）の中央値
 *   - 楽観 / 悲観 = national の最大 / 最小（年度ラベルつきで画面に出す）
 *   - 参考 = 直近の実施回（＝最大の対象実需給年度）の national
 *   「直近の終了した年度（R1）」は採らない: 過去 6 年度で全国最低の年を標準にすると偏るため。
 *
 * ★中央値の注意
 *   観測値が偶数個のときの中央値は、中央 2 値の平均になり、カタログに存在しない値になる
 *   （2026-09-21 時点: 6 年度 → (8,991.59 + 12,209.51)/2 = 10,600.55）。
 *   対象実需給年度が 1 年度増えて奇数個になれば、中央値は観測値そのものになる。
 *   画面では「中央値（6 年度の中央 2 値の平均）」のように計算方法を併記する。
 *
 * ★出所の書き方
 *   national は data.eic-jp.org が OCCTO のエリア値から約定容量で加重平均した値（カタログ notes に明記）。
 *   「OCCTO が公表した全国値」とは書かない（OCCTO が全国値を公表しているかは未確認）。
 *
 * ★相対 import（@/ ではない）。scripts/test-irr-calculator.ts からも tsx で読まれるため。
 */
import nationalData from '../data/eic/capacity-main-auction-price-national.json';

type Point = { date: string; value: number | null };
type Series = { points?: Point[]; meta?: { updated_at?: string; source_name?: string } };

const SERIES = nationalData as unknown as Series;

export type NationalObservation = {
  /** 対象実需給年度（例 2025 ＝ 2025 年 4 月〜2026 年 3 月） */
  deliveryFy: number;
  /** 約定価格（全国加重平均・円/kW） */
  value: number;
};

/** カタログの national 観測値（対象実需給年度の昇順） */
export const NATIONAL_OBSERVATIONS: NationalObservation[] = (SERIES.points ?? [])
  .filter((p): p is { date: string; value: number } => typeof p.value === 'number')
  .map((p) => ({ deliveryFy: Number(p.date.slice(0, 4)), value: p.value }))
  .sort((a, b) => a.deliveryFy - b.deliveryFy);

function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const n = s.length;
  return n % 2 === 1 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}

const values = NATIONAL_OBSERVATIONS.map((o) => o.value);
const minObs = NATIONAL_OBSERVATIONS.reduce<NationalObservation | null>(
  (a, b) => (a === null || b.value < a.value ? b : a),
  null,
);
const maxObs = NATIONAL_OBSERVATIONS.reduce<NationalObservation | null>(
  (a, b) => (a === null || b.value > a.value ? b : a),
  null,
);
const latestObs = NATIONAL_OBSERVATIONS.length ? NATIONAL_OBSERVATIONS[NATIONAL_OBSERVATIONS.length - 1] : null;

export const CAPACITY_MARKET_NATIONAL = {
  observations: NATIONAL_OBSERVATIONS,
  count: NATIONAL_OBSERVATIONS.length,
  /** 中央値。偶数個のときは中央 2 値の平均（観測値ではない） */
  median: median(values),
  medianIsObserved: NATIONAL_OBSERVATIONS.length % 2 === 1,
  min: minObs,
  max: maxObs,
  /** 直近の実施回（最大の対象実需給年度） */
  latest: latestObs,
  firstFy: NATIONAL_OBSERVATIONS[0]?.deliveryFy ?? null,
  lastFy: latestObs?.deliveryFy ?? null,
  updatedAt: SERIES.meta?.updated_at ?? null,
} as const;

/**
 * シナリオ別の容量市場既定値（円/kW/年）。
 * カタログが読めないときは 0（丸い数字を置かない。読者に手入力を促す）。
 */
export const CAPACITY_MARKET_SCENARIO_DEFAULTS = {
  optimistic: CAPACITY_MARKET_NATIONAL.max?.value ?? 0,
  standard: CAPACITY_MARKET_NATIONAL.median ?? 0,
  pessimistic: CAPACITY_MARKET_NATIONAL.min?.value ?? 0,
} as const;

/** 画面の出所表記（逐語で揃えるため 1 箇所に置く・#119） */
export const CAPACITY_MARKET_SOURCE_TEXT =
  'OCCTO「容量市場メインオークション約定結果」を data.eic-jp.org がエリア値から約定容量で加重平均した全国値';

/** 円表記（小数は 2 桁まで・整数はそのまま） */
export function yenLabel(v: number | null | undefined): string {
  if (typeof v !== 'number') return '—';
  return v.toLocaleString('ja-JP', { maximumFractionDigits: 2 });
}
