/**
 * src/lib/info-excluded.ts
 *
 * /info（お知らせ＝news の '編集部' カテゴリ）に混入した BESS/エネルギー無関係PRの
 * 一覧除外＋noindex の単一情報源（SSOT）。src/lib/projects-excluded.ts と同方式。
 *
 * 非破壊: microCMS データは削除しない。/info 一覧から除外し、各 /info/[slug] 詳細ページは
 * 残したまま noindex（robots index:false）にする＝404を作らない・既存URLは200維持。
 *
 * 判定（2026-06-30・info分析）: パン屋(ぱんやSUN)／瀬戸内産業芸術祭／CMCのEV・水素・化学セミナー／
 * 旧周辺ハードPR（東芝出展・東芝レビュー・保護継電器K2・スマエコハウス）の14件。
 * ★ 残す（エネルギー/BESS関連・運営お知らせ）は対象外＝完全一致(Set.has)のため影響なし。
 */
export const INFO_EXCLUDED_SLUGS: ReadonlySet<string> = new Set<string>([
  // パン屋 ぱんやSUN（co111579）
  'pr-2026-04-02-co111579-13',
  'pr-2026-03-18-co111579-12',
  'pr-2026-03-04-co111579-11',
  // 瀬戸内産業芸術祭（co109041）
  'pr-2025-01-29-co109041-129',
  // CMC（シーエムシー・リサーチ）EV/水素/化学 セミナー
  'pr-2023-01-27-cmc-2227',
  'pr-2021-09-17-cmc-1472',
  'pr-2021-08-25-cmc-1416',
  'pr-2021-08-25-cmc-1416-2',
  'pr-2020-11-20-cmc-940',
  'pr-2020-03-26-cmc-654',
  // 旧周辺ハードPR
  'pr-2019-02-14-co32322-34', // 東芝 スマートエネルギーWeek 出展
  'pr-2019-01-23-co32322-31', // 東芝レビュー Vol.74
  'pr-2016-12-07-co765-42',   // 保護継電器K2シリーズ
  'pr-2010-06-23-co2296-3',   // スマエコハウス（家庭用リチウムイオン蓄電池付き住宅展示場）
]);

/** /info 一覧・件数からの除外＋詳細ページ noindex 対象（完全一致） */
export function isExcludedInfo(slug: string): boolean {
  return INFO_EXCLUDED_SLUGS.has(slug);
}
