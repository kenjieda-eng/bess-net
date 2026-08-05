/**
 * src/lib/explainer-next-step.ts — 解説記事末尾「この解説の先へ」ルーティング（E1・2026-08-05）
 *
 * NewsNextStepBlock（news-next-step.ts）の実装資産を流用した先勝ち5系統。
 * 判定テキストは取得済みの title＋category＋lead＋body（追加フェッチ 0・SSG）。
 * ⑤技術・設備（フォールバック）は同カテゴリの関連解説2本（build時 precompute・自己除外）＋/glossary。
 * ※ explainer に tags フィールドは存在しない（2026-08-05 実査）→「同タグ」は category で実装。
 */

export type ExplainerNextStepLink = { href: string; label: string };

export type ExplainerNextStepGroup = {
  key: 'seido' | 'market' | 'business' | 'lv' | 'tech';
  lead: string;
  links: ExplainerNextStepLink[];
};

/** ①〜④の先勝ちルール（⑤はフォールバック）。「投資」は④のみ（③は事業開発系に限定） */
const RULES: { key: ExplainerNextStepGroup['key']; pattern: RegExp; lead: string; links: ExplainerNextStepLink[] }[] = [
  {
    key: 'seido',
    pattern: /補助金|補助率|補助事業|政策|制度改正|法改正|省エネ法|電気事業法|規制|パブコメ|認定|申請手続/,
    lead: '制度・補助金の最新動向は、公募情報と政策イベントの時系列でフォローできます。',
    links: [
      { href: '/subsidies', label: '蓄電池 補助金カレンダー（公募中の一覧）' },
      { href: '/policy-calendar', label: '政策・法制度カレンダー（パブコメ・法改正・オークション日程）' },
    ],
  },
  {
    key: 'market',
    pattern: /JEPX|需給調整|容量市場|市場価格|卸電力|スポット市場|アービトラージ|長期脱炭素|約定|入札/,
    lead: '市場の仕組みは、実データと収益構造の解説でさらに具体化できます。',
    links: [
      { href: '/market/jepx', label: 'JEPXハブ（スポット価格・市場データ）' },
      { href: '/buyer/balancing-market', label: '需給調整市場の収益解説' },
    ],
  },
  {
    key: 'business',
    pattern: /案件|事業計画|開発|出資|ファイナンス|SPC|IRR|デベロッパ|用地|EPC選定/,
    lead: '実際の案件動向は、全国プロジェクトDBと流通案件で確認できます。',
    links: [
      { href: '/projects', label: '全国の蓄電所プロジェクトDB' },
      { href: '/anken', label: '流通案件（売買・連系枠確保済）' },
    ],
  },
  {
    key: 'lv',
    pattern: /低圧|50\s?kW|小規模蓄電|投資/,
    lead: '低圧クラスの蓄電所投資は、専用ガイドで仕組みから収益まで整理しています。',
    links: [
      { href: '/lv/invest', label: '投資家のための低圧蓄電所ガイド' },
      { href: '/lv/invest/3min-guide', label: '3分でわかる低圧蓄電所投資' },
    ],
  },
];

export type RelatedExplainerEntry = { slug: string; title: string };

/**
 * 先勝ち分類。①〜④に非該当なら ⑤tech（同カテゴリ関連2本＋/glossary）。
 * related は precompute 済みマップ（explainer-related-map.json）の当該 slug 分。
 */
export function classifyExplainerNextStep(
  text: string,
  related: RelatedExplainerEntry[]
): ExplainerNextStepGroup {
  for (const r of RULES) {
    if (r.pattern.test(text)) return { key: r.key, lead: r.lead, links: [...r.links] };
  }
  const links: ExplainerNextStepLink[] = related
    .slice(0, 2)
    .map((r) => ({ href: `/explainer/${r.slug}`, label: r.title }));
  links.push({ href: '/glossary', label: '用語集（1,500語超・技術用語の基礎）' });
  return {
    key: 'tech',
    lead: '関連する解説と用語集で、技術・設備の理解を深められます。',
    links,
  };
}

/**
 * E4 スターCTA（TOP10・2026年7月GA4実測）: 1記事1本の文脈導線。
 * render 側で E1 ブロック・既存CTA（/grid・ツール・政策カレンダー）と href 重複時は自動省略。
 */
export const EXPLAINER_STAR_CTAS: Record<string, ExplainerNextStepLink> = {
  'grid-capacity-map-reading': { href: '/grid', label: '変電所別 系統空き容量ツールで実データを確認する' },
  'battery-passport-2027-implementation': { href: '/policy-calendar', label: '政策・法制度カレンダーで施行スケジュールを追う' },
  'grid-scale-bess': { href: '/lv/invest', label: '低圧から始める蓄電所投資ガイドを見る' },
  'national-battery-supply-plan': { href: '/projects', label: '全国の蓄電所プロジェクトDBで開発状況を見る' },
  'capacity-market-advanced': { href: '/tools/capacity-market-bid', label: '容量市場応札試算ツールで水準を確認する' },
  'chief-electrical-engineer': { href: '/lv/invest', label: '低圧蓄電所の実務ガイド（保安体制含む）を見る' },
  'environmental-assessment-bess': { href: '/policy-calendar', label: '政策カレンダーでアセス関連の制度動向を追う' },
  'pcs-selection-guide': { href: '/operators', label: '事業者ナビでPCS・機器メーカーを探す' },
  'long-term-decarbonization-auction': { href: '/policy-calendar', label: '政策カレンダーでオークション日程を追う' },
  'jepx-arbitrage': { href: '/dashboard/market', label: 'マーケットダッシュボードで実データを見る' },
};

/**
 * E2 「よく読まれている解説」TOP10（2026年7月 GA4実測・表示順=実測順）。
 * 四半期ごとに GA4 上位を手動更新する運用（次回更新目安: 2026-10）。
 */
export const EXPLAINER_TOP10_SLUGS: string[] = [
  'battery-passport-2027-implementation',
  'grid-capacity-map-reading',
  'national-battery-supply-plan',
  'grid-scale-bess',
  'capacity-market-advanced',
  'chief-electrical-engineer',
  'environmental-assessment-bess',
  'pcs-selection-guide',
  'long-term-decarbonization-auction',
  'jepx-arbitrage',
];
