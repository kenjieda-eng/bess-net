/**
 * src/lib/balancing-benchmark-data.ts — 入札ベンチマークの市場データの組み立て（サーバ専用・T1 実装便・2026-10-08）
 *
 * #119: /tools/balancing-benchmark（page.tsx）と scripts/verify-balancing-benchmark.ts が同じ組み立てを使う。
 * ★カタログ JSON を読む lib（eprx-monthly・balancing-cap）を import するので、クライアントからは import しない（型だけ可）。
 * ★相対 import（scripts から tsx で読まれる）。
 */
import { getMonthlyPoints, monthlyCoverageYms, productJaOf } from './eprx-monthly';
import { capForMonth, CAP_PRODUCT_KEYS, type CapProductKey } from './balancing-cap';
import { BENCH_PRODUCTS, type BenchMonth, type BenchProductKey } from './balancing-benchmark-calc';

const isCapProduct = (p: BenchProductKey): p is CapProductKey => (CAP_PRODUCT_KEYS as readonly string[]).includes(p);

/** 年月 → 年度キー（4〜翌 3 月。例 2025-03 → FY2024） */
export function fiscalYearOfYm(ym: string): string {
  const y = Number(ym.slice(0, 4));
  return `FY${Number(ym.slice(5, 7)) >= 4 ? y : y - 1}`;
}

/** 範囲（全電源・蓄電池の月次 12 本に共通する年月）の各月の市場平均と上限 */
export function buildBenchMonths(): BenchMonth[] {
  const yms = monthlyCoverageYms();
  const all = Object.fromEntries(BENCH_PRODUCTS.map((p) => [p, new Map(getMonthlyPoints('all', p).map((x) => [x.ym, x.value]))])) as Record<
    BenchProductKey,
    Map<string, number | null>
  >;
  const battery = Object.fromEntries(
    BENCH_PRODUCTS.map((p) => [p, new Map(getMonthlyPoints('battery', p).map((x) => [x.ym, x.value]))]),
  ) as Record<BenchProductKey, Map<string, number | null>>;
  return yms.map((ym) => ({
    ym,
    all: Object.fromEntries(BENCH_PRODUCTS.map((p) => [p, all[p].get(ym) ?? null])) as BenchMonth['all'],
    battery: Object.fromEntries(BENCH_PRODUCTS.map((p) => [p, battery[p].get(ym) ?? null])) as BenchMonth['battery'],
    cap: Object.fromEntries(BENCH_PRODUCTS.map((p) => [p, isCapProduct(p) ? capForMonth(p, ym) : null])) as BenchMonth['cap'],
  }));
}

const FALLBACK_LABELS: Record<BenchProductKey, string> = {
  primary: '一次調整力',
  'secondary-1': '二次調整力①',
  'secondary-2': '二次調整力②',
  'tertiary-1': '三次調整力①',
  'tertiary-2': '三次調整力②',
  composite: '複合商品',
};

/** 商品名（カタログの蓄電池月次の name から。読めなければ固定の名前） */
export function benchLabels(fy: string): Record<BenchProductKey, string> {
  return Object.fromEntries(BENCH_PRODUCTS.map((p) => [p, productJaOf(fy, p) ?? FALLBACK_LABELS[p]])) as Record<BenchProductKey, string>;
}
