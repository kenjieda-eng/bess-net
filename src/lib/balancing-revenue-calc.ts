/**
 * src/lib/balancing-revenue-calc.ts — 需給調整の収益の式とコマ数（T1 実装便・裁定 R7・2026-10-08）
 *
 * #119（定義は一箇所）: /tools/balancing-revenue（BalancingRevenueEstimator）と /tools/balancing-benchmark
 * （BalancingBenchmark・src/lib/balancing-benchmark-calc.ts）が同じ式・同じコマ数を使う。
 * ★JSON を import しない（クライアントのコンポーネントから値で import してよい）。
 */

/** 1 日のコマ数（30 分×48） */
export const BLOCKS_PER_DAY = 48;
/** 1 年のコマ数（365 日。/tools/balancing-revenue の既定値＝17,520） */
export const BLOCKS_PER_YEAR = 365 * BLOCKS_PER_DAY;

/** 年月（YYYY-MM）の日数（うるう年は暦どおり） */
export function daysInMonth(ym: string): number {
  const y = Number(ym.slice(0, 4));
  const m = Number(ym.slice(5, 7));
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** 年月（YYYY-MM）のコマ数＝日数×48 */
export function blocksInMonth(ym: string): number {
  return daysInMonth(ym) * BLOCKS_PER_DAY;
}

/**
 * 収益（円）＝ 単価[円/ΔkW・30分] × 容量[kW] × コマ数 × (率[%] ÷ 100)。容量の kW をそのまま ΔkW として単価に掛ける。
 * ★掛け算の並びは /tools/balancing-revenue の従来の式（price * capacityKw * blocks * (rate / 100)）と同じ。
 *   並びを変えると浮動小数の丸めが変わり、恒等式（単価に市場平均を入れると差 0）がビット一致しなくなる。
 */
export function balancingRevenueYen(price: number, capacityKw: number, blocks: number, ratePct: number): number {
  return price * capacityKw * blocks * (ratePct / 100);
}
