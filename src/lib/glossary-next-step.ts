/**
 * src/lib/glossary-next-step.ts — 用語ページ「この用語の先へ」（G1/G2/G4・2026-08-05）
 *
 * E1/N1 の実装資産を流用。データは既存 precompute（glossary-detail-index.json の
 * curated relatedTerms / sameCategoryTerms）を合成＝新規 precompute・追加フェッチ 0。
 * 文脈ルーティングは実在12カテゴリ（市場制度/技術/事業/法務/安全/系統連系/補助金/低圧/基礎/その他/O&M/EPC）
 * の先頭値→5系統写像。
 */

export type GlossaryNextStepLink = { href: string; label: string };

/** カテゴリ→文脈ルーティング1系統（行き先は全て実在確認済 2026-08-05） */
const ROUTE_BY_GROUP: Record<string, { lead: string; links: GlossaryNextStepLink[] }> = {
  market: {
    lead: '市場の実データと収益構造は、ハブと解説でさらに深掘りできます。',
    links: [
      { href: '/market/jepx', label: 'JEPXハブ（スポット価格・市場データ）' },
      { href: '/explainer/jepx-arbitrage', label: '解説: JEPXアービトラージ' },
    ],
  },
  invest: {
    lead: '低圧クラスの蓄電所投資は、専用ガイドで仕組みから収益まで整理しています。',
    links: [
      { href: '/lv/invest', label: '投資家のための低圧蓄電所ガイド' },
      { href: '/lv/invest/3min-guide', label: '3分でわかる低圧蓄電所投資' },
    ],
  },
  business: {
    lead: '実際の案件動向は、全国プロジェクトDBと流通案件で確認できます。',
    links: [
      { href: '/projects', label: '全国の蓄電所プロジェクトDB' },
      { href: '/anken', label: '流通案件（売買・連系枠確保済）' },
    ],
  },
  seido: {
    lead: '制度・補助金の最新動向は、公募情報と政策イベントの時系列でフォローできます。',
    links: [
      { href: '/subsidies', label: '蓄電池 補助金カレンダー（公募中の一覧）' },
      { href: '/policy-calendar', label: '政策・法制度カレンダー' },
    ],
  },
  tech: {
    lead: '技術・設備の理解は、解説記事でさらに深められます。',
    links: [{ href: '/explainer', label: '解説記事一覧（制度・市場・技術の実務解説）' }],
  },
};

const CATEGORY_TO_GROUP: Record<string, keyof typeof ROUTE_BY_GROUP> = {
  市場制度: 'market',
  低圧: 'invest',
  事業: 'business',
  EPC: 'business',
  'O&M': 'business',
  補助金: 'seido',
  法務: 'seido',
  技術: 'tech',
  安全: 'tech',
  系統連系: 'tech',
  基礎: 'tech',
  その他: 'tech',
};

export function glossaryRouteFor(
  category: string[] | undefined,
  firstExplainer?: { slug: string; title: string }
): { lead: string; links: GlossaryNextStepLink[] } {
  const group = CATEGORY_TO_GROUP[(category && category[0]) || ''] || 'tech';
  const route = ROUTE_BY_GROUP[group];
  if (group === 'tech' && firstExplainer) {
    // 技術系: 関連解説1本（precompute済 relatedExplainers 先頭）＋/explainer
    return {
      lead: route.lead,
      links: [
        { href: `/explainer/${firstExplainer.slug}`, label: `解説: ${firstExplainer.title}` },
        ...route.links,
      ],
    };
  }
  return route;
}

/**
 * G2 「よく引かれる用語」TOP20。
 * 1〜15 = 2026年7月 GA4 実測（依頼指定）。16〜20 = GA4 直接参照が不可のため
 * 「関連コンテンツ密度（news+解説+事業者+projects 連結数）上位の核心語」で補完（2026-08-05 実査値）。
 * 四半期ごとに GA4 上位で手動更新する運用（次回更新目安: 2026-10）。
 */
export const GLOSSARY_TOP20_SLUGS: string[] = [
  'full-merchant',
  'dispatch-command-source',
  'aggregator',
  'gwh-gigawatt-hour',
  'iec-62619-standard',
  'general-transmission-distribution',
  'offtake-agreement',
  'sat-site-acceptance',
  '66kv',
  'grid-available-capacity',
  'wood-mackenzie',
  'fid-final-investment',
  'battery-energy-storage-system',
  'gw-gigawatt',
  'extra-high-voltage',
  // ── 補完5（関連密度上位・核心語） ──
  'capacity-market',
  'grid-scale-battery',
  'virtual-power-plant',
  'balancing-market',
  'japan-electric-power-exchange',
];

/**
 * G4 スターCTA（投資・収益文脈の語 → /lv/invest の該当記事・全て実在確認済）。
 * render 側で G1 ルーティングと href 重複時は自動省略。
 */
export const GLOSSARY_STAR_CTAS: Record<string, GlossaryNextStepLink> = {
  'full-merchant': { href: '/lv/invest/revenue-400-math', label: 'フルマーチャント収益の数理を低圧投資ガイドで見る' },
  aggregator: { href: '/lv/invest/aggregator-role', label: 'アグリゲーターの役割を低圧投資ガイドで見る' },
  'offtake-agreement': { href: '/lv/invest/contract-clauses', label: '契約条項の要点を低圧投資ガイドで見る' },
  'dispatch-command-source': { href: '/lv/invest/aggregator-day', label: 'アグリゲーターの運用実務（指令の1日）を見る' },
  'fid-final-investment': { href: '/lv/invest', label: '投資判断の進め方を低圧蓄電所ガイドで見る' },
};
