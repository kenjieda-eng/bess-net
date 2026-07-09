/**
 * src/lib/tools-cta.ts — 解説記事末尾の文脈ツールCTA（tools分析2026-07-09 変更4）
 *
 * grid-connection-check の勝ちパターン（GRID_RELATED_EXPLAINER_SLUGS 方式＝POLICY_DETAIL_SLUGS 型）を
 * 他ツールへ横展開。対象 slug は「title/slug 機械マッチ・各ツール最大5」で選定（2026-07-09 実データ照合）。
 * microCMS 本文は書き換えない＝テンプレート側の追加のみ（負荷 0 req）。
 */

export interface ToolCta {
  href: string;
  /** CTA 見出し */
  label: string;
  /** 説明文（事実記述のみ・L-EIC-019） */
  text: string;
  /** ボタン文言（「→」はテンプレート側で付与） */
  button: string;
  /** CTA を表示する explainer slug（機械選定・最大5） */
  explainerSlugs: Set<string>;
}

export const TOOL_CTAS: ToolCta[] = [
  {
    href: '/tools/capacity-market-bid',
    label: '容量市場の応札水準を実データで試算する',
    text: '本記事に関連して、容量市場メインオークションの約定実績（9エリア・FY2024-FY2029、OCCTO 公表値）から推奨応札レンジ・落札確率・想定収入を無料で試算できます。',
    button: '容量市場応札試算ツールを使う',
    // 選定ルール: title「容量市場」or slug capacity-market（LTDC 専門記事は対象外）・最大5
    explainerSlugs: new Set([
      'capacity-market',
      'capacity-market-main-vs-additional',
      'capacity-market-penalty-calc',
      'capacity-market-advanced',
      'capacity-market-transitional',
    ]),
  },
  {
    href: '/tools/balancing-revenue',
    label: '需給調整市場の収益シナリオを試算する',
    text: '需給調整市場 6 商品の蓄電池落札単価（EPRX 実績）に落札率・容量を掛けた概算年間収益を無料で試算できます（前提次第で大きく変わる感応度ツール）。',
    button: '需給調整 収益シナリオツールを使う',
    // 選定ルール: title「需給調整」or slug balancing（セルバランス等の技術記事は文脈外のため除外）・最大5
    explainerSlugs: new Set([
      'balancing-market',
      'balancing-market-practical',
      'tertiary-reserve-1-detail',
      'tertiary-reserve-2-strategy',
      'balancing-market-fcr-detail',
    ]),
  },
  {
    href: '/tools/subsidy-match',
    label: '条件に合う補助金を即マッチングする',
    text: '所在地・用途・容量・事業者種別から、SII・自治体・民間ローン横断の補助金DBで条件適合 Top 10 を無料抽出できます。',
    button: '蓄電池補助金マッチングを使う',
    // 選定ルール: 「補助金」ガイド系 explainer（/subsidies 一覧の関連枠は既存リンクあり）
    explainerSlugs: new Set(['subsidies-guide', 'storage-parity-aggregation']),
  },
  {
    href: '/tools/lcoe-lcos',
    label: 'LCOE・LCOSを前提条件から試算する',
    text: 'NREL ATB 2024 を基準に、蓄電池 LCOS（均等化蓄電原価）と電源別 LCOE を効率・サイクル・割引率などの前提から無料で試算できます。',
    button: 'LCOE・LCOS計算機を使う',
    // 選定ルール: title「LCOE/LCOS/経済性/IRR」or slug lcoe/economics/irr（リサイクル・米国税制は文脈外のため除外）・最大5
    explainerSlugs: new Set([
      'lcoe-and-power-mix',
      'lcoe-and-bess-economics',
      'bess-irr-sensitivity',
      'bess-revenue-simulation',
      'round-trip-efficiency',
    ]),
  },
];
