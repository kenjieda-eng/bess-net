/**
 * src/lib/balancing-fallback.ts
 *
 * 需給調整市場の「蓄電池 年平均落札単価」fallback の単一情報源（SSOT）。
 *
 * ★2026-08-24 に新設。従来は同じ意味の値が
 *     src/app/tools/balancing-revenue/page.tsx（FALLBACK_BY_FY）
 *     src/components/BalancingRevenueEstimator.tsx（FALLBACK_BY_FY）
 *   の2箇所で別々に定義されており、片方だけ古くなる二重管理だった（落とし穴 #121）。
 *   両方から本モジュールを参照する形に寄せた。
 *
 * ★これは EPRX の「約定実績の年平均」であって ΔkW 上限価格ではない。
 *   上限価格は 2026/8/31 実需給分まで 15.00 円、2026/9/1 実需給分から 10.00 円
 *   （EPRX 2026-07-30 公表）。実績値を上限値に書き換えないこと。
 *
 * ★catalog（src/data/eic/balancing-price-*-battery.json）が読めた場合は page.tsx が
 *   実データで上書きするため、ここは保険値。値を更新するときは catalog の実値と一致させる。
 *
 * 値の出所: data.eic-jp.org catalog 2026-08-24（indicator_count 609）
 *   FY2024 = 2024-04-01（通年・確定）
 *   FY2025 = 2025-04-01（通年・確定。2026-06-18 公表の確報。旧・上期暫定値から改訂）
 */
export type BalancingProductKey =
  | 'primary'
  | 'secondary-1'
  | 'secondary-2'
  | 'tertiary-1'
  | 'tertiary-2'
  | 'composite';

export type BalancingFyKey = 'FY2024' | 'FY2025';

/** FY キー → catalog の date（年度開始日。通年/上期のどちらでも同じ日付になる点に注意） */
export const BALANCING_FY_DATE: Record<BalancingFyKey, string> = {
  FY2024: '2024-04-01',
  FY2025: '2025-04-01',
};

/** 蓄電池の年平均落札単価 fallback（円/ΔkW・30分） */
export const BALANCING_BATTERY_FALLBACK: Record<BalancingFyKey, Record<BalancingProductKey, number>> = {
  FY2024: {
    'primary': 15.99,
    'secondary-1': 7.71,
    'secondary-2': 12.61,
    'tertiary-1': 10.60,
    'tertiary-2': 109.43,
    'composite': 15.80,
  },
  FY2025: {
    'primary': 11.52,
    'secondary-1': 12.51,
    'secondary-2': 12.81,
    'tertiary-1': 12.28,
    'tertiary-2': 19.31,
    'composite': 11.50,
  },
};

/** FY セレクタの表示ラベル・注記（表示側で二重に書かないよう SSOT 化） */
export const BALANCING_FY_META: Record<BalancingFyKey, { label: string; note: string; badge: string }> = {
  FY2024: {
    label: 'FY2024（通年・確定）',
    note: '2024/4〜2025/3 通年 — EPRX 2025年3月公表',
    badge: '既定',
  },
  FY2025: {
    label: 'FY2025（通年・確定）',
    note: '2025/4〜2026/3 通年 — EPRX 2026年6月18日公表（旧・上期暫定値から改訂）',
    badge: '通年・確定',
  },
};
