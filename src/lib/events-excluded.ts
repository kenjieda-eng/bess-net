/**
 * src/lib/events-excluded.ts
 *
 * policy-events（/events・/policy-calendar の共通 API）から表示を外すレコードの単一情報源（SSOT）。
 * links-excluded.ts・info-excluded.ts と同方式（Ck-1 A4・2026-09-21）。
 *
 * 非破壊: microCMS のレコードは削除しない（DELETE しない）。policy-events のスキーマに非表示用の欄は無いため
 * コード側で外す。取得の共通関数 getAllEventsRaw（src/lib/microcms.ts）で外すので、
 * /events・/policy-calendar・トップ・sitemap のどれにも同時に効く（#118/#119: 一部の経路だけ外れる事態を防ぐ）。
 *
 * 判定（2026-09-21・Ck-1 A4・依頼の指示「実在しなければ非表示フラグ」）:
 *   jepx-capacity-market-explain-2026-06 … 「JEPX 容量市場 第8回 メインオークション 説明会」（2026-06-15・Zoom）。
 *     一次で実在を確認できない。JEPX は容量市場を運営しておらず、jepx.jp の 2026 年のお知らせに容量市場の説明会は 0 件。
 *     OCCTO の容量市場お知らせ（399 件）の 2026-06-15 は業務マニュアル更新予定の告知 1 件だけ。
 *     対象実需給年度 2030 年度のメインオークションの説明会として実在するのは OCCTO 主催・Webex の
 *     7/8 制度説明会（/news/012517.html）と 7/31 実務説明会（/news/012671.html）で、日付・主催・形式が合わない。
 *     2026 年度実施のメインオークションは 7 回目で「第8回」も誤り（OCCTO は回次番号を使わない）。
 *     由来は依頼AC Phase A の初期データ（commit 1afdba9・2026-05-12）で、sourceUrl は当初からドメイン誤記の
 *     https://www.jepx.org/（HTTPS は接続拒否）だった。
 */
export const EVENTS_EXCLUDED_SLUGS: ReadonlySet<string> = new Set<string>([
  'jepx-capacity-market-explain-2026-06',
]);

/** policy-events のレコードを表示から外すか（slug 完全一致） */
export function isExcludedEvent(slug: string | undefined | null): boolean {
  return !!slug && EVENTS_EXCLUDED_SLUGS.has(slug);
}
