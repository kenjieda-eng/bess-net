/**
 * src/lib/fx-reference.ts
 *
 * 円換算に使う USD/JPY をカタログから 1 箇所で出す（Ck-1 A9・2026-09-21）
 *
 * ★なぜ要るか（#119/#121）
 *   /tools/irr-simulator・/tools/lcoe-lcos はそれぞれ fx-usdjpy-monthly-avg を読み、カタログが空のときの
 *   代替値 158.34 を焼き込んでいた。/tools/balancing-revenue は本文に「USD/JPY 158.34」を直書きしていた。
 *   158.34 はある時点の月中平均で、カタログの最新（2026-08 月中平均 158.81）と既にずれていた。
 *   同じ意味の値を 3 箇所で別々に持たない。代替値も置かない（カタログが無ければ円換算の数値を出さない）。
 *
 * ★相対 import（@/ ではない）。scripts から tsx で読めるように。
 */
import fxUsdJpyData from '../data/eic/fx-usdjpy-monthly-avg.json';

type Series = {
  points?: { date: string; value: number | null }[];
  meta?: { source_name?: string; source_url?: string; notes?: string };
};
const SERIES = fxUsdJpyData as unknown as Series;
const pts = (SERIES.points ?? []).filter((p): p is { date: string; value: number } => typeof p.value === 'number');
const last = pts.length ? pts[pts.length - 1] : null;

export type FxReference = {
  /** 円/ドル（月中平均） */
  value: number;
  /** 対象月 YYYY-MM */
  month: string;
  /** 画面表記用「2026年8月」 */
  monthLabel: string;
  sourceName: string;
};

/** 最新の USD/JPY 月中平均。カタログが空なら null（画面では円換算の数値を出さない） */
export const FX_USDJPY: FxReference | null = last
  ? {
      value: last.value,
      month: last.date.slice(0, 7),
      monthLabel: `${Number(last.date.slice(0, 4))}年${Number(last.date.slice(5, 7))}月`,
      sourceName: '日本銀行 時系列統計データ（外国為替市況）',
    }
  : null;

/** 画面表記「USD/JPY 158.81（2026年8月の月中平均・日本銀行）」 */
export function fxLabel(fx: FxReference | null = FX_USDJPY): string {
  return fx ? `USD/JPY ${fx.value.toFixed(2)}（${fx.monthLabel}の月中平均・日本銀行）` : 'USD/JPY（カタログ未取得）';
}
