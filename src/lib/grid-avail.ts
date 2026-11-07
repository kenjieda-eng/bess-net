/**
 * src/lib/grid-avail.ts — 空容量の表示値（小さな直し便・2026-11-07）
 *
 * 関西電力送配電の公表 CSV は、空容量の欄が空の行がある。当サイトはその行を同社の算定式
 * 「運用容量値 − 予想潮流値の絶対値」で算出している（2026-08-19 から・scripts/experimental/kansai/parse_kansai_csv*.py）。
 * 予想潮流の絶対値が運用容量を上回ると、計算値は負になる（2026-11-07 時点で 18 件・東大阪 −130MW・北摂 −1,176MW など）。
 * 負の空容量は「使える容量が負」と読めて意味が通らないので、表示・並べ替え・絞り込みは 0 として扱い、計算値は一文で示す。
 *
 * ★データ（microCMS・precompute の JSON）は変えない。値を 0 に読み替えるのは、ここの関数を通した表示だけ（#121・#119: 1 か所）。
 * ★対象は「関西 かつ 値が算定式どおり（運用容量 − |予想潮流|）かつ負」だけ。公表元が欄に書いた値（直読）は対象外。
 *   2026-11-07 時点で、負の空容量は全国で関西の算出値の 18 件だけ（公表の値に負は 0 件）。
 *   公表の値に負が現れたら verify:grid-avail が落ちる（公表の値の見せ方は別に決める）。
 * ブラウザの部品（SubstationsBrowser・GridConnectionChecker）からも読むので、生成物や大きな JSON を import しない。
 */

export type AvailInput = {
  area?: string | readonly string[] | null;
  cap_avail_mw?: number | null;
  cap_avail_upper_mw?: number | null;
  cap_operational_mw?: number | null;
  forecast_flow_mw?: number | null;
};

/** 算定式で負になった計算の中身 */
export type NegativeAvailCalc = {
  /** 計算値（負） */
  computed: number;
  /** 運用容量 */
  operational: number;
  /** 予想潮流の絶対値 */
  flowAbs: number;
};

/** 当サイトが算定式で空容量を算出しているエリア（関西電力送配電） */
const CALC_AREA = '関西';
/** 算定式の持ち主（文の中で名前を出す） */
export const CALC_OPERATOR = '関西電力送配電';

function areaOf(s: AvailInput): string | null {
  const a = s.area;
  if (Array.isArray(a)) return a[0] ?? null;
  return (a as string | null | undefined) ?? null;
}

/** value が「関西の算定式で当サイトが算出した負の値」なら、計算の中身を返す（それ以外は null） */
export function negativeCalcOf(value: number | null | undefined, s: AvailInput): NegativeAvailCalc | null {
  if (areaOf(s) !== CALC_AREA) return null;
  if (typeof value !== 'number' || !(value < 0)) return null;
  const op = s.cap_operational_mw;
  const flow = s.forecast_flow_mw;
  if (typeof op !== 'number' || typeof flow !== 'number') return null;
  // 算定式どおりの値だけ（parse_kansai_csv は小数 3 桁で丸めている）
  if (Math.abs(op - Math.abs(flow) - value) > 1e-3) return null;
  return { computed: value, operational: op, flowAbs: Math.abs(flow) };
}

/** 空容量（当該設備）が算定式で負になったか */
export function negativeAvailCalc(s: AvailInput): NegativeAvailCalc | null {
  return negativeCalcOf(s.cap_avail_mw, s);
}

/** 表示・並べ替え・絞り込みに使う空容量（当該設備）。関西の算出値が負なら 0、ほかは値のまま（未公表は null） */
export function shownAvailMw(s: AvailInput): number | null {
  if (negativeAvailCalc(s)) return 0;
  return typeof s.cap_avail_mw === 'number' ? s.cap_avail_mw : null;
}

/** 表示に使う空容量（上位系考慮）。算出の行は当該設備と同じ値を入れている（同じ規則で 0） */
export function shownAvailUpperMw(s: AvailInput): number | null {
  if (negativeCalcOf(s.cap_avail_upper_mw, s)) return 0;
  return typeof s.cap_avail_upper_mw === 'number' ? s.cap_avail_upper_mw : null;
}

function mw(v: number): string {
  return Math.abs(v).toLocaleString('ja-JP', { maximumFractionDigits: 3 });
}

/**
 * 詳細の「空容量」のすぐ下に添える一文。
 * 予想潮流は負（逆潮流）の値で公表されているので、運用容量と比べるのは絶対値（算定式も絶対値を引く）。
 */
export function negativeAvailNote(c: NegativeAvailCalc): string {
  return `予想潮流の絶対値（${mw(c.flowAbs)} MW）が運用容量（${mw(c.operational)} MW）を上回っています。`
    + `${CALC_OPERATOR}の算定式（運用容量値 − 予想潮流値の絶対値）による計算値は −${mw(c.computed)} MW です。`;
}

/** 一覧（エリア・県・検索・連系チェッカー）で 0 と表示した行に付ける印と、その注記 */
export const NEGATIVE_AVAIL_MARK = '※';
export const NEGATIVE_AVAIL_LIST_NOTE =
  `※ 予想潮流が運用容量を上回り、${CALC_OPERATOR}の算定式（運用容量値 − 予想潮流値の絶対値）による計算値が負になる変電所は、`
  + '空容量を 0 MW と表示しています（計算値は各変電所のページに記載）。';
