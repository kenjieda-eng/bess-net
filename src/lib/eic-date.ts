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

/**
 * ─── 取得停止の注記（Ck-1b §7・2026-09-23） ─────────────────────────────────
 * ★なぜ「updated_at が N 日以上前」だけで判定してはいけないか:
 *   catalog には取得が止まったことを表すフィールドが無い（status は止まっても "active" のまま、
 *   updated_at は「最後に成功した取得の時刻」）。年次・四半期の系列は古いのが正常で、
 *   2026-09-23 実測では updated_at が 7 日以上前の系列が 116/688 件あり、うち 111 件
 *   （balancing-price 46・edinet 45・capacity 20）は正常。閾値だけだとその 111 件にも
 *   「取得停止中」と書くことになる（/tools/balancing-revenue・/tools/capacity-market-bid が表示中）。
 * ★設計: 「停止を確認した系列 ID（前方一致）」AND「updated_at が閾値より古い」。
 *   上流が復旧すれば updated_at が新しくなるので、下の表から消し忘れても注記は自動で消える。
 * ★表示する値そのものは変えない（FIT 価格は年度で決まる値。5 系列中 4 件は FY2026 まで取得済み）。
 * ★bot 判定（202・本文 0 バイト）は「ページが死んだ証拠」ではないので「終了」とは書かない。回避もしない。
 */
export const FEED_STALL_THRESHOLD_DAYS = 7;

/** 取得が止まっていると確認済みの系列（前方一致）。理由と確認日を必ず添える */
export const STALLED_SERIES: readonly { prefix: string; reason: string; confirmedOn: string }[] = [
  // 2026-09-05 を最後に更新が止まっている。2026-09-23 に上流の取得元
  // （www.enecho.meti.go.jp/category/saving_and_new/saiene/kaitori/ 配下）を確認したところ
  // curl に 202・本文 0 バイト（AWS WAF の bot 判定）。回避はしない（R-17）。
  { prefix: 'fit-price-', reason: '上流の取得元が bot 判定で取得停止（R-17）', confirmedOn: '2026-09-23' },
];

/** updated_at から実行日までの経過日数（JST 暦日ベース）。値が無ければ null */
export function daysSinceUpdatedAt(updatedAt: string | null | undefined, runDate: string = todayJst()): number | null {
  if (!updatedAt) return null;
  const d = Date.parse(`${updatedAt.slice(0, 10)}T00:00:00+09:00`);
  const r = Date.parse(`${runDate}T00:00:00+09:00`);
  if (Number.isNaN(d) || Number.isNaN(r)) return null;
  return Math.floor((r - d) / 86_400_000);
}

/** 取得停止中か（確認済みの系列 AND 閾値超え）。該当すれば注記文、そうでなければ null */
export function stalledNote(
  id: string,
  updatedAt: string | null | undefined,
  runDate: string = todayJst(),
): { note: string; reason: string; days: number } | null {
  const hit = STALLED_SERIES.find((s) => id.startsWith(s.prefix));
  if (!hit) return null;
  const days = daysSinceUpdatedAt(updatedAt, runDate);
  if (days === null || days < FEED_STALL_THRESHOLD_DAYS) return null;
  return { note: `取得停止中（${(updatedAt ?? '').slice(0, 10)} 時点）`, reason: hit.reason, days };
}
