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
import type { UpdateSchedule } from '../types/eic';

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
 * ★設計: 「停止を確認した系列 ID（前方一致）」AND「updated_at が閾値より古い」
 *   AND「catalog の update_schedule が kind: window の系列は、次の窓＋grace_days を過ぎている」（Ck2h §8・R-28 §6-2）。
 *   上流が復旧すれば updated_at が新しくなるので、下の表から消し忘れても注記は自動で消える。
 * ★表示する値そのものは変えない。
 * ★bot 判定（202・本文 0 バイト）は「ページが死んだ証拠」ではないので「終了」とは書かない。回避もしない。
 */
export const FEED_STALL_THRESHOLD_DAYS = 7;

export interface StalledSeriesEntry {
  prefix: string;
  reason: string;
  confirmedOn: string;
}

/** 取得が止まっていると確認済みの系列（前方一致）。理由と確認日を必ず添える */
export const STALLED_SERIES: readonly StalledSeriesEntry[] = [
  // 2026-10-07（Ck2h §8）: fit-price- の行を外した。上流は 2026-09-23（eic-data-pipeline #56）に FIT を nightly から
  // 年次 workflow（3〜5 月の月曜）へ移しており、updated_at（2026-09-05）が来年 3 月まで進まないのは
  // 「取得停止」ではなく「年 1 回の窓待ち」（catalog の update_schedule {kind: window, months: [3], grace_days: 45}・R-28 §6-2）。
  // 外した行: { prefix: 'fit-price-', reason: '上流の取得元が bot 判定で取得停止（R-17）', confirmedOn: '2026-09-23' }
];

/** updated_at から実行日までの経過日数（JST 暦日ベース）。値が無ければ null */
export function daysSinceUpdatedAt(updatedAt: string | null | undefined, runDate: string = todayJst()): number | null {
  if (!updatedAt) return null;
  const d = Date.parse(`${updatedAt.slice(0, 10)}T00:00:00+09:00`);
  const r = Date.parse(`${runDate}T00:00:00+09:00`);
  if (Number.isNaN(d) || Number.isNaN(r)) return null;
  return Math.floor((r - d) / 86_400_000);
}

const addDaysIso = (iso: string, days: number): string =>
  new Date(Date.parse(`${iso}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);
const monthEndIso = (y: number, m: number): string =>
  `${y}-${String(m).padStart(2, '0')}-${String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0')}`;

/**
 * kind: window の系列の「次の窓」と期限（Ck2h §8・R-28 §6-2）。
 * ★基準は updated_at（最後に取得できた日）。今日（runDate）から「次の到来月」を取ると期限が常に未来になり、
 *   窓を逃しても永遠に鳴らない。R-28「3 月の窓 + 猶予 45 日 = 5 月中旬までに更新が無ければ鳴る」は updated_at 基準。
 * - next_expected があればその日が窓（updated_at がその日以降なら窓は満たした＝null。次は上流が宣言し直す）。
 * - 無ければ months のうち「updated_at より後に始まる最初の窓」。連続する月（[4,5]）は 1 つの窓として末月の月末まで
 *   （窓の 1 か月目に取れた系列を 2 か月目の月末で鳴らさないため）。
 * - 期限 = 窓の末日 + update_schedule.grace_days（Indicator 直下の grace_days ではない）。
 */
export function nextUpdateWindow(
  schedule: UpdateSchedule | null | undefined,
  updatedAt: string | null | undefined,
): { month: string; windowEnd: string; deadline: string } | null {
  if (!schedule || schedule.kind !== 'window' || !updatedAt) return null;
  const anchor = updatedAt.slice(0, 10);
  const grace = schedule.grace_days ?? 0;
  if (schedule.next_expected) {
    const ne = schedule.next_expected.slice(0, 10);
    if (anchor >= ne) return null;
    return { month: ne.slice(0, 7), windowEnd: ne, deadline: addDaysIso(ne, grace) };
  }
  const set = new Set((schedule.months ?? []).filter((m) => Number.isInteger(m) && m >= 1 && m <= 12));
  if (set.size === 0) return null;
  const prev = (m: number) => (m === 1 ? 12 : m - 1);
  const next = (m: number) => (m === 12 ? 1 : m + 1);
  // updated_at の翌月から、窓の始まりの月（前の月が窓でない月。12 か月すべてが窓ならその翌月）を探す
  let y = Number(anchor.slice(0, 4));
  let m = Number(anchor.slice(5, 7));
  for (let k = 0; k < 24; k++) {
    m = next(m);
    if (m === 1) y++;
    if (set.has(m) && (set.size === 12 || !set.has(prev(m)))) break;
  }
  const month = `${y}-${String(m).padStart(2, '0')}`;
  let ey = y;
  let em = m;
  for (let k = 1; k < set.size; k++) {
    const nm = next(em);
    if (!set.has(nm)) break;
    if (nm === 1) ey++;
    em = nm;
  }
  const windowEnd = monthEndIso(ey, em);
  return { month, windowEnd, deadline: addDaysIso(windowEnd, grace) };
}

/** 窓待ちの注記。runDate が「次の窓＋grace_days」以内なら「窓待ち（次回 YYYY-MM）」、窓なし・期限超過は null */
export function windowWaitNote(
  schedule: UpdateSchedule | null | undefined,
  updatedAt: string | null | undefined,
  runDate: string = todayJst(),
): string | null {
  const w = nextUpdateWindow(schedule, updatedAt);
  if (!w || runDate > w.deadline) return null;
  return `窓待ち（次回 ${w.month}）`;
}

/**
 * 取得停止中か（確認済みの系列 AND 閾値超え AND window なら窓＋猶予を過ぎている）。該当すれば注記文、そうでなければ null。
 * registry はテスト用（既定は STALLED_SERIES。空でも AND 条件を単体テストで確かめられるように）。
 */
export function stalledNote(
  id: string,
  updatedAt: string | null | undefined,
  runDate: string = todayJst(),
  schedule?: UpdateSchedule | null,
  registry: readonly StalledSeriesEntry[] = STALLED_SERIES,
): { note: string; reason: string; days: number } | null {
  const hit = registry.find((s) => id.startsWith(s.prefix));
  if (!hit) return null;
  const days = daysSinceUpdatedAt(updatedAt, runDate);
  if (days === null || days < FEED_STALL_THRESHOLD_DAYS) return null;
  // Ck2h §8: kind: window の系列は「次の窓＋grace_days」までは停止扱いにしない。
  // next_expected を満たした（updated_at ≥ next_expected）window 系列も停止扱いにしない（窓は満たした・次の窓は上流が宣言し直すまで不明。
  // 閾値だけに戻すと、期日どおり取れた系列が 7 日後に「取得停止中」と出てしまう）
  if (schedule?.kind === 'window') {
    if (windowWaitNote(schedule, updatedAt, runDate) !== null) return null;
    if (schedule.next_expected && updatedAt && updatedAt.slice(0, 10) >= schedule.next_expected.slice(0, 10)) return null;
  }
  return { note: `取得停止中（${(updatedAt ?? '').slice(0, 10)} 時点）`, reason: hit.reason, days };
}
