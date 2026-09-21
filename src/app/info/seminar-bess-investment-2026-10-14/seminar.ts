/**
 * 10/14 セミナー案内ページの定数（An-1・2026-09-21）
 *
 * page.tsx は App Router の制約で既定以外の export を持てないため、テスト
 * （scripts/test-site-announcements.ts）から読む値はここに置く。
 * 一次: https://pps-net.org/seminar/165196（2026-09-21 取得）
 */
export const SEMINAR_SLUG = 'seminar-bess-investment-2026-10-14';
export const PPS_PAGE = 'https://pps-net.org/seminar/165196';
/** utm は前例（seminar_seetel_20260727・operating_bess_intro）の形式に揃える */
export const PPS_URL = `${PPS_PAGE}?utm_source=bess-net&utm_medium=referral&utm_campaign=seminar_bess_investment_20261014`;
export const STARTS_AT = '2026-10-14T13:00:00+09:00';
/** 開催終了時刻。これ以降は「開催は終了しました」に切り替え、申込の案内を外す */
export const ENDS_AT = '2026-10-14T14:00:00+09:00';
