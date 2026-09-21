/**
 * src/lib/storage-assumptions.ts
 *
 * 蓄電池の性能前提（往復効率・事業年数・放電深度）をサイト内で 1 箇所に定義する（Ck-1 A9・2026-09-21・#119/#121）
 *
 * ★なぜ要るか
 *   同じ意味の値がツールごとに不揃いだった:
 *     /tools/irr-simulator（irr-defaults.ts）: 往復効率 88% / 放電深度 85% / 耐用年数 20 年
 *     /tools/lcoe-lcos（lcoe-lcos.ts）      : 往復効率 85% / 放電深度 90% / 事業年数 15 年
 *     /market/jepx の裁定試算（JEPXDashboard）: 往復効率 85%
 *   どれも出所の記載が無かった（「概数」とだけ書かれていた）。
 *
 * ★方針（依頼 Ck-1 A9）: 一次があるものは一次に揃える。無いものは「前提値（出所なし・変更可）」と明示する。
 *   NREL ATB の往復効率・寿命はカタログ（data.eic-jp.org）に系列が無いため、ATB 本文の記述を一次として
 *   ここに定数で持つ（確認日つき）。カタログに系列ができたら差し替える。
 *
 * ★一次（2026-09-21 に実機で取得・逐語）
 *   URL  : https://atb.nlr.gov/electricity/2024/utility-scale_battery_storage
 *   title: 「Utility-Scale Battery Storage | Electricity | 2024 | ATB | NLR」
 *   ※ NREL の ATB サイトは atb.nrel.gov から atb.nlr.gov に移っている（atb.nrel.gov は 8.8.8.8 でも名前解決できない）。
 *   往復効率: "the 2024 ATB assumes a round-trip efficiency of 85%."
 *   寿命    : "…enables the system to operate at its rated capacity throughout its 15-year lifetime."
 *   サイクル: "…based on an assumption of approximately one cycle per day."
 *   放電深度: ATB は DoD の百分率を置いていない（図の注記で容量を「usable（使用可能）」の MWh で表すだけ）。
 *            → 一次なし。当サイトの前提値として置く。
 */

export type AssumptionSource =
  | { kind: 'primary'; label: string; url: string; titleVerbatim: string; quote: string; checkedOn: string }
  | { kind: 'assumption'; label: string };

export type StorageAssumption = { value: number; unit: string; source: AssumptionSource };

const ATB_2024_BATTERY = {
  label: 'NREL ATB 2024 年版「Utility-Scale Battery Storage」',
  url: 'https://atb.nlr.gov/electricity/2024/utility-scale_battery_storage',
  titleVerbatim: 'Utility-Scale Battery Storage | Electricity | 2024 | ATB | NLR',
  checkedOn: '2026-09-21',
} as const;

/** 往復効率（0–1） */
export const ROUND_TRIP_EFFICIENCY: StorageAssumption = {
  value: 0.85,
  unit: '',
  source: { kind: 'primary', ...ATB_2024_BATTERY, quote: 'the 2024 ATB assumes a round-trip efficiency of 85%.' },
};

/** 事業年数・設備寿命（年） */
export const PROJECT_LIFETIME_YEARS: StorageAssumption = {
  value: 15,
  unit: '年',
  source: { kind: 'primary', ...ATB_2024_BATTERY, quote: 'throughout its 15-year lifetime' },
};

/**
 * 放電深度（0–1）。★一次なし＝当サイトの前提値。
 * 旧値は IRR 85%・LCOS 90% で不揃いだった。LCOS 側の 90% に寄せた（どちらにも出所は無い）。
 */
export const DEPTH_OF_DISCHARGE: StorageAssumption = {
  value: 0.9,
  unit: '',
  source: { kind: 'assumption', label: '前提値（出所なし・変更可）' },
};

/** 画面の注記用「往復効率 85%（NREL ATB 2024 年版「Utility-Scale Battery Storage」）」 */
export function assumptionNote(a: StorageAssumption, name: string, display: string): string {
  return `${name} ${display}（${a.source.label}）`;
}
