/**
 * src/lib/eic-date.ts — EIC 系列の日付を「実行日（JST）」で頭打ちにする（Ck-1a ■2-12・2026-09-22）
 *
 * ★なぜ要るか: JEPX スポットは受渡日の前日 10 時ごろに約定・公表される。上流（eic-data-pipeline）が
 *   JST 10:30 以降に走ると、coverage.last・observation_cutoff・系列の末尾点が「明日」の日付になる
 *   （catalog: cutoff_semantics="delivery", delivery_horizon_days=1）。
 *   2026-09-22 実測: /market/jepx の「最新日」10 行すべてが 2026-09-23、/industry のチップが「（09-23）」。
 *   基準日・最新日・取得日として、実行日より後の日付は出さない。
 * ★約束:
 *   (1) 基準日・最新日・取得日・アクセス日として出す日付は必ずここを通す（#121: 同じ意味の値を二箇所で作らない）。
 *   (2) 日付と値を組で出す箇所は lastValidPointAsOf で「実行日以前の最後の点」を選ぶ。
 *       日付だけ頭打ちにして値は明日の価格のまま出すと、明日の価格を今日の値として見せることになる。
 *   (3) クランプしない: 容量市場の対象実需給年度（coverage.last=2029-04-01 は設計どおり）・年度ラベル類。
 *   (4) runDate はページ（サーバ）で 1 回だけ決めて props で渡す。クライアント部品の中で new Date() しない
 *       （ビルド日と閲覧日が違うと hydration が食い違う。announcement-schedule.ts と同じ理由）。
 * ★ISR（revalidate 86400）の再生成で runDate は進むので、翌日には明日だった点が自然に出る。再デプロイは不要。
 * ★相対 import（scripts から tsx で読めるように）。
 */
import { toJstDate } from './announcement-schedule';

/** 実行日（JST の暦日 YYYY-MM-DD）。ビルド時／ISR 再生成時に評価される */
export function todayJst(now: Date = new Date()): string {
  return toJstDate(now);
}

/** min(dateIso, runDate)。時刻付きは先頭 10 文字で比較する。値が無ければ null */
export function clampToRunDateJst(dateIso: string | null | undefined, runDate: string = todayJst()): string | null {
  if (!dateIso) return null;
  const d = dateIso.slice(0, 10);
  return d > runDate ? runDate : d;
}

/** 実行日以前の最後の非 null 点（日付と値の組を崩さない） */
export function lastValidPointAsOf<P extends { date: string; value: number | null }>(
  points: readonly P[],
  runDate: string = todayJst(),
): (P & { value: number }) | null {
  for (let i = points.length - 1; i >= 0; i--) {
    const p = points[i];
    if (p.value !== null && p.date.slice(0, 10) <= runDate) return p as P & { value: number };
  }
  return null;
}

/** 実行日以前の点だけ（スパークライン等） */
export function pointsAsOf<P extends { date: string }>(points: readonly P[], runDate: string = todayJst()): P[] {
  return points.filter((p) => p.date.slice(0, 10) <= runDate);
}
