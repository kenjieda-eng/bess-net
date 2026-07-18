/**
 * src/lib/edu-links.ts — EIC Data 教材クラスタ13本へのリンク網（リン共有2026-07-18・tools-cta.ts 方式）
 *
 * - 同一ファミリーサイト data.eic-jp.org（CC BY 4.0・リン運営）の「仕組み・読み方」教材への外部リンク対応表。
 * - ラベルは各教材ページの実タイトル主要部（2026-07-18 に全13 URL curl 200＋<title>実測・捏造なし L-EIC-019）。
 * - 表示は「制度の仕組み（EIC Data 教材）」枠・1ページ最大2本・rel="noopener"。
 * - glossary は precompute 基盤（#102）に整合: build 時の静的マップ結合のみ＝runtime microCMS 0・負荷ゼロ。
 * - 対応 glossary 用語が実在しない教材（electricity-bill-structure・fuel-cost-adjustment・
 *   how-to-read-eic-metrics・fuel-chain-overview）は無理に張らない（依頼方針）。
 */

export interface EduLink {
  href: string;
  label: string;
}

const BASE = 'https://data.eic-jp.org/insight/';
const UTM = '?utm_source=bess-net&utm_medium=referral&utm_campaign=edu_cluster';

const edu = (slug: string, label: string): EduLink => ({ href: `${BASE}${slug}${UTM}`, label });

/** 教材13本（#番号はユウ起案2026-07-18の呼称） */
export const EDU_MATERIALS = {
  threeLayers: edu('jp-power-markets-three-layers', '電力市場の3層：スポット・容量・需給調整の読み方'), // #1
  capacityMarket: edu('how-to-read-capacity-market', '容量市場の読み方：4年先の「kW」を確保する仕組み'), // #3
  balancingMarket: edu('how-to-read-balancing-market', '需給調整市場の読み方：5つの「調整力」と円/ΔkW・30分'), // #4
  wheeling: edu('wheeling-charge-structure', '託送料金の仕組み'), // #9
  imbalance: edu('imbalance-charge-structure', 'インバランス料金の仕組み'), // #10
  areaPrices: edu('how-to-read-area-prices', 'エリアプライスと市場分断の読み方'), // #11
  reserveMargin: edu('how-to-read-reserve-margin', '予備率と需給ひっ迫の読み方'), // #12
  nonFossil: edu('how-to-read-nonfossil-certificates', '非化石証書の読み方'), // #13
  fitFip: edu('how-to-read-fit-fip', 'FIT/FIPの読み方：買取価格・再エネ賦課金・入札の仕組み'), // #5-8群
} as const;

/** glossary slug → 教材リンク（最大2本／語。slug は glossary-detail-index で実在確認済み 2026-07-18） */
export const GLOSSARY_EDU_LINKS: Record<string, EduLink[]> = {
  // 容量市場系（#3・#1）
  'capacity-market': [EDU_MATERIALS.capacityMarket, EDU_MATERIALS.threeLayers],
  'capacity-market-settlement': [EDU_MATERIALS.capacityMarket],
  // 需給調整市場系（#4・#1）
  'balancing-market': [EDU_MATERIALS.balancingMarket, EDU_MATERIALS.threeLayers],
  // 卸電力市場（#1）
  'wholesale-electricity-market': [EDU_MATERIALS.threeLayers],
  // インバランス系（#10）
  'imbalance': [EDU_MATERIALS.imbalance],
  'imbalance-charge': [EDU_MATERIALS.imbalance],
  // エリアプライス（#11）
  'area-price': [EDU_MATERIALS.areaPrices],
  // 予備率・需給ひっ迫（#12）
  'reserve-margin': [EDU_MATERIALS.reserveMargin],
  'tightness-warning': [EDU_MATERIALS.reserveMargin],
  // 託送料金系（#9）
  'wheeling-charge': [EDU_MATERIALS.wheeling],
  'wheeling': [EDU_MATERIALS.wheeling],
  // 非化石証書系（#13）
  'non-fossil-certificate-market': [EDU_MATERIALS.nonFossil],
  'non-fossil-certificate': [EDU_MATERIALS.nonFossil],
  // FIT/FIP（#5-8群）
  'fit-feed-in-tariff': [EDU_MATERIALS.fitFip],
  'feed-in-premium': [EDU_MATERIALS.fitFip],
};

/** explainer slug → 教材リンク（tools-cta と同一の容量5本・balancing5本＋reserve-margin 1本） */
export const EXPLAINER_EDU_LINKS: Record<string, EduLink[]> = {
  'capacity-market': [EDU_MATERIALS.capacityMarket],
  'capacity-market-main-vs-additional': [EDU_MATERIALS.capacityMarket],
  'capacity-market-penalty-calc': [EDU_MATERIALS.capacityMarket],
  'capacity-market-advanced': [EDU_MATERIALS.capacityMarket, EDU_MATERIALS.reserveMargin],
  'capacity-market-transitional': [EDU_MATERIALS.capacityMarket],
  'balancing-market': [EDU_MATERIALS.balancingMarket],
  'balancing-market-practical': [EDU_MATERIALS.balancingMarket],
  'tertiary-reserve-1-detail': [EDU_MATERIALS.balancingMarket],
  'tertiary-reserve-2-strategy': [EDU_MATERIALS.balancingMarket],
  'balancing-market-fcr-detail': [EDU_MATERIALS.balancingMarket],
};
