/**
 * src/lib/announcement-schedule.ts
 *
 * 全ページ告知バナーの「今日どれを出すか」の判定（An-1・2026-09-21 に AnnouncementBanner から切り出し）
 *
 * ★判定規則（従来どおり・変えていない）
 *   - 日付は JST の暦日（YYYY-MM-DD）で比較する。startAt・endAt とも「その日を含む」
 *   - enabled かつ startAt <= 今日 <= endAt のうち、priority が最大の 1 件だけを出す
 *   - 同 priority のときは配列の先頭が勝つ（Array.prototype.sort は安定ソート）
 *
 * ★なぜ切り出したか
 *   バナーはクライアント部品だが、HTML はページの描画時点（静的ページはビルド時）に焼かれる。
 *   サーバが描画した日と閲覧した日が違うと（例: 10/14 にビルド・10/15 に閲覧）、初回のクライアント描画が
 *   サーバの HTML と食い違い、hydration が失敗する。これを避けるため、初回描画はサーバが描画した日で選び、
 *   マウント後に閲覧日で選び直す（AnnouncementBanner）。そのために判定を日付を引数に取る純関数にした。
 *   単体テスト: scripts/test-site-announcements.ts
 *
 * ★相対 import（@/ ではない）。scripts から tsx で読むため。
 */
import type { SiteAnnouncement } from '../data/site-announcements';

/** 日時 → JST の暦日（YYYY-MM-DD） */
export function toJstDate(d: Date): string {
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

/** その JST 暦日に出す告知（無ければ null） */
export function selectActiveAnnouncement(
  list: readonly SiteAnnouncement[],
  jstDate: string,
): SiteAnnouncement | null {
  const active = list
    .filter((a) => a.enabled && a.startAt <= jstDate && jstDate <= a.endAt)
    .sort((a, b) => b.priority - a.priority);
  return active[0] ?? null;
}
