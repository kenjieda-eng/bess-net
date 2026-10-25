/**
 * src/lib/page-dates.ts — 詳細ページの「公開日・更新日」の日付（日付表示便・2026-10-25）
 *
 * - 日付は microCMS の publishedAt（公開日）と revisedAt（更新日）から作る。updatedAt は下書きの保存でも動くので使わない。
 * - 日は日本時間（JST）で切る（UTC のまま切ると朝 9 時前の更新が前の日になる）。
 * - 更新日の日が公開日と同じなら更新日は出さない。値が無い項目は出さない。
 * 表示は src/components/PageDates.tsx。検査は scripts/verify-page-dates.ts。
 */
import { toJstDate } from '@/lib/announcement-schedule';

/** ISO 8601 の日時 → JST の暦日（YYYY-MM-DD）。値が無い・読めないときは null */
export function jstDay(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : toJstDate(new Date(t));
}

/** YYYY-MM-DD → 「2026年4月30日」 */
export function jaDayLabel(day: string): string {
  const [y, m, d] = day.split('-').map(Number);
  return `${y}年${m}月${d}日`;
}

/** 表示する 2 つの日（JST の暦日）。更新日は公開日と同じ日なら null */
export function pageDateDays(publishedAt?: string | null, revisedAt?: string | null): { published: string | null; revised: string | null } {
  const published = jstDay(publishedAt);
  const revised = jstDay(revisedAt);
  return { published, revised: revised && revised !== published ? revised : null };
}
