/**
 * src/lib/events-excluded.ts
 *
 * policy-events（/events・/policy-calendar の共通 API）から表示を外すレコードの単一情報源（SSOT）。
 * links-excluded.ts・info-excluded.ts と同方式（Ck-1 A4・2026-09-21／Ck-1a ■1-4・2026-09-22）。
 *
 * 非破壊: microCMS のレコードは削除しない（DELETE しない）。policy-events のスキーマに非表示用の欄は無いため
 * コード側で外す。取得の共通関数 getAllEventsRaw（src/lib/microcms.ts）で外すので、
 * /events・/policy-calendar（一覧・詳細・JSON-LD）・トップ・sitemap のどれにも同時に効く
 * （#118/#119: 一部の経路だけ外れる事態を防ぐ）。
 *
 * 理由の row は reports/ck1-approval-2026-09-21.md の行 id（§0-4・A11・B0・B3 の各表）。
 * 作り直す（実在のイベントに付け替える）かは Ck-2 で個別に裁定する。
 */
export type ExcludedEvent = { slug: string; row: string; reason: string };

export const EVENTS_EXCLUDED: readonly ExcludedEvent[] = [
  // ── Ck-1 A4（2026-09-21）
  {
    slug: 'jepx-capacity-market-explain-2026-06',
    row: 'Ck-1 A4',
    // 「JEPX 容量市場 第8回 メインオークション 説明会」（2026-06-15・Zoom）。JEPX は容量市場を運営しておらず、
    // jepx.jp の 2026 年のお知らせに容量市場の説明会は 0 件。OCCTO の容量市場お知らせ（399 件）の 2026-06-15 は
    // 業務マニュアル更新予定の告知 1 件だけ。実在するのは OCCTO 主催・Webex の 7/8 制度説明会（/news/012517.html）と
    // 7/31 実務説明会（/news/012671.html）で、日付・主催・形式が合わない。2026 年度実施のメインオークションは 7 回目。
    // sourceUrl は当初からドメイン誤記の https://www.jepx.org/（HTTPS は接続拒否）。
    reason: '一次で実在を確認できない（JEPX は容量市場を運営していない・日付/主催/形式が実在の説明会と不一致）',
  },

  // ── Ck-1a ■1-4 (a) 承認表で実在を確認できなかった 19 件
  { slug: 'n1-control-bess-2024-04', row: '§0-4 policy-events/n1-control-bess-2024-04', reason: 'OCCTO のガイドライン改定履歴に 2024 年 4 月の改定も蓄電所向け指針もない' },
  { slug: 'occto-non-firm-pubcomm-2025-09', row: '§0-4 policy-events/occto-non-firm-pubcomm-2025-09', reason: 'OCCTO の意見募集一覧（145 件）に 2025 年のノンファーム関連案件なし' },
  { slug: 'non-firm-bess-extension-2025-04', row: '§0-4 policy-events/occto-non-firm-pubcomm-2025-09（同行の 2 件目）', reason: '2025 年 4 月の蓄電所への本格適用を裏付ける一次なし（系統用蓄電池は暫定対策の記述のみ）' },
  { slug: 'occto-balancing-market-explain-2025-12', row: '§0-4・A11-2-19', reason: 'OCCTO 新着（2,585 件）の 2025-11-15〜2026-01-10 に OCCTO 主催の需給調整市場説明会は 0 件' },
  { slug: 'balancing-market-tertiary-2-2025-04', row: 'A11-2-20', reason: '三次調整力②の開始は 2021 年 4 月で、記録の仕様も誤り' },
  { slug: 'balancing-market-q1-2026', row: 'A11-2-21', reason: '需給調整市場に「四半期商品」は存在しない。仕様も誤り' },
  { slug: 'occto-balancing-market-review-2026', row: 'A11-2-22', reason: '「2026 年 3 月に制度見直し議論を本格開始」を裏付ける一次なし' },
  { slug: 'balancing-market-secondary-2026-04', row: 'A11-2-23', reason: 'issuer を OCCTO とするのは誤り（市場運営者は EPRX）。記述の一部も裏付けなし' },
  { slug: 'catl-energy-storage-japan-2026', row: 'B0 policy-events/catl-energy-storage-japan-2026', reason: 'イベントに言及する情報は本サイトの /events だけで循環。CATL 公式に記載なし' },
  { slug: 'japa-bess-seminar-2025-11', row: 'B0 policy-events/japa-bess-seminar-2025-11', reason: '協議会（BBA）は 2025-11-18 登記・第 1 回セミナーは 2026-08-31 で、記録と矛盾' },
  { slug: 'japa-annual-2026', row: 'B0 policy-events/japa-bess-seminar-2025-11（同行）・§0-4 AC Phase A', reason: '総会は実際には 6 月 25 日で日付が異なる' },
  { slug: 'japa-bess-seminar-2026-05', row: 'B0 policy-events/japa-bess-seminar-2025-11（同行）', reason: '第 3 回（2026 年 5 月）の記録は一次と矛盾（第 1 回が 2026-08-31）' },
  { slug: 'world-energy-storage-china-2026', row: 'B0 policy-events/world-energy-storage-china-2026', reason: '名称・主催・日程・会場が一致するイベントなし' },
  { slug: 'kansai-energy-expo-2026', row: 'B0 policy-events/kansai-energy-expo-2026', reason: '「関西エネルギーEXPO」という名称のイベントなし' },
  { slug: 're-expo-osaka-2026', row: 'B0 policy-events/re-expo-osaka-2026', reason: '「再エネEXPO」という名称のイベントを確認できない' },
  { slug: 're-expo-tokyo-2026', row: 'B0 policy-events/re-expo-osaka-2026（同行）', reason: '「再エネEXPO」という名称のイベントを確認できない' },
  { slug: 'battery-supply-plan-approved-2024-09', row: 'B3 https://www.meti.go.jp/press/2024/09/20240901001/20240901001.html', reason: 'sourceUrl の METI プレスは存在しない（403＋「指定されたページまたはファイルは存在しません」）' },
  {
    slug: 'energy-basic-plan-7-2024-12',
    row: 'B3 https://www.meti.go.jp/press/2024/12/20241226002/20241226002.html',
    // 一次: METI 2025-02-18「第7次エネルギー基本計画が閣議決定されました」
    //   https://www.meti.go.jp/press/2024/02/20250218001/20250218001.html （2026-09-22 ブラウザで 200・本文「2025年2月18日」
    //   「昨年12月17日に原案を提示しました。その後、パブリックコメント等を踏まえて、本日、閣議決定されました。」）
    reason: '閣議決定は 2025-02-18（原案提示は 2024-12-17）。記録の 2024-12-26・sourceUrl ともに一次と合わない',
  },
  { slug: 'meti-bess-industry-strategy-2024-11', row: 'B3 https://www.meti.go.jp/shingikai/sankoshin/sangyo_gijutsu/chikudenchi/', reason: 'sourceUrl の審議会ページは存在しない（403＋「指定されたページまたはファイルは存在しません」）' },

  // ── Ck-1a ■1-4 (b) 依頼AC Phase A 初期データ（commit 1afdba9・2026-05-12・scripts/ac-industry-events-drafts.json）のうち、
  //    現在も sourceUrl がドメインのトップだけのもの（(a) と重複する 9 件・Ck-1 A4 の 1 件を除く）。承認表 §0-4 最終行。
  //    ★energy-storage-summit-eu-2026 も機械抽出には該当するが、■3-1（B0）で公式サイトへの差し替えが承認済み
  //      （一次で 2026-02-24〜25・InterContinental London を確認）のため非表示にしない。
  ...([
    'smart-energy-week-spring-2026',
    'smart-energy-week-autumn-2026',
    'pv-expo-2026',
    'battery-japan-2026',
    'battery-japan-autumn-2026',
    'japan-energy-summit-2026',
    'occto-non-firm-explain-2026-04',
    'meti-bess-roadmap-seminar-2026-06',
    'jpea-annual-2026',
    'jwpa-annual-2026',
    'iee-annual-2026',
    'jser-symposium-2026',
    'nedo-battery-tech-2026',
    'jses-symposium-2026',
    'fluence-japan-launch-2026',
    're-plus-usa-2026',
    'kyushu-renewable-expo-2026',
    'tohoku-energy-expo-2026',
    'occto-long-term-decarbonization-explain-2026-09',
    'jeric-grid-stability-2026',
    'biomass-expo-2026',
    'hydrogen-fc-expo-2026',
    'occto-area-supply-plan-2027',
  ].map((slug) => ({
    slug,
    row: '§0-4 policy-events（依頼AC Phase A 初期データ）',
    reason: 'AC Phase A の生成データ由来。sourceUrl がドメインのトップだけで、日付・主催・会場の一次の裏付けがない',
  }))),
];

export const EVENTS_EXCLUDED_SLUGS: ReadonlySet<string> = new Set<string>(EVENTS_EXCLUDED.map((e) => e.slug));

/** policy-events のレコードを表示から外すか（slug 完全一致） */
export function isExcludedEvent(slug: string | undefined | null): boolean {
  return !!slug && EVENTS_EXCLUDED_SLUGS.has(slug);
}
