/**
 * src/lib/news-next-step.ts — /news 記事末尾「このニュースの先へ」文脈誘導の分類ロジック（N1・2026-07-30）。
 *
 * GA4分析: 全news でキーイベント0＝読後の行き先が無い。記事の既存データ（title＋本文＋タグ）から
 * キーワードで受け皿カテゴリを「上から先勝ち」で判定し、サイト内の実在ページへ内部リンクする。
 * 追加fetchなし・runtime microCMS 0（判定は build/ISR 生成時に完結）。リンクは内部のみ（UTM不要）。
 */
export type NextStepLink = { href: string; label: string };
export type NextStepGroup = { key: string; heading: string; test: RegExp; links: NextStepLink[] };

/** 先勝ち順（上のルールが優先）。すべて実在ページ。 */
export const NEWS_NEXT_STEP_GROUPS: NextStepGroup[] = [
  {
    key: 'lv',
    heading: '低圧蓄電所への投資を検討中の方へ',
    test: /低圧|50kW/,
    links: [
      { href: '/lv/invest', label: '投資家のための低圧蓄電所ガイド' },
      { href: '/lv/invest/3min-guide', label: '3分でわかる低圧系統用蓄電池投資' },
    ],
  },
  {
    key: 'subsidy',
    heading: '関連する補助金情報',
    test: /補助金|交付|公募/,
    links: [
      { href: '/subsidies', label: '蓄電池補助金データベース' },
      { href: '/policy-calendar', label: '政策・法制度カレンダー' },
    ],
  },
  {
    key: 'market',
    heading: '市場の仕組みを理解する',
    test: /需給調整|容量市場|JEPX|アグリゲー/,
    links: [
      { href: '/market/jepx', label: 'JEPXハブ' },
      { href: '/buyer/balancing-market', label: '需給調整市場の収益解説' },
    ],
  },
  {
    key: 'project',
    heading: '事業・案件の動きを追う',
    test: /出資|建設|MW|連系/,
    links: [
      { href: '/projects', label: 'プロジェクトDB' },
      { href: '/anken', label: '流通案件' },
    ],
  },
];

/** どのルールにも当たらない場合の受け皿（蓄電池事業の基礎）。 */
export const NEWS_NEXT_STEP_FALLBACK: NextStepGroup = {
  key: 'basics',
  heading: '蓄電池事業の基礎',
  test: /(?!)/,
  links: [
    { href: '/lv', label: '低圧蓄電所 総合ガイド' },
    { href: '/explainer', label: '解説記事一覧' },
  ],
};

/** title＋本文＋タグを結合したテキストから受け皿グループを1つ返す（先勝ち・fallback付き）。 */
export function classifyNewsNextStep(text: string): NextStepGroup {
  for (const g of NEWS_NEXT_STEP_GROUPS) {
    if (g.test.test(text)) return g;
  }
  return NEWS_NEXT_STEP_FALLBACK;
}
