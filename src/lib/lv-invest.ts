/**
 * src/lib/lv-invest.ts — 低圧投資家ガイド（W2・2026-07-25）の共有定義。
 *
 * 記事は microCMS explainer に category:["低圧投資"] で投入し、/lv/invest/[slug] 専用routeで表示する
 * （Stage 0 診断の採用案(a)）。/explainer 系には混ぜない（isLvInvestExplainer で除外）。
 * SEO title / meta description は explainer スキーマに専用fieldが無いため、6記事はここでコード管理する。
 * ハブ /lv/invest 分岐①の記事リンクも順序込みでここに集約し、週次投入で追記していく。
 */
import type { Explainer } from './microcms';

export const LV_INVEST_CATEGORY = '低圧投資';

/** その記事が低圧投資家ガイド所属か（category multi-select に「低圧投資」を含む）。 */
export function isLvInvestExplainer(exp: Pick<Explainer, 'category'>): boolean {
  return (exp.category ?? []).includes(LV_INVEST_CATEGORY);
}

/**
 * 6記事の SEO メタ（titleタグは layout が「 | 蓄電所ネット」を自動付与するため、ここでは
 * サフィックスを除いた形で持つ・#88 二重回避）。ハブ分岐①のリンク順もこの配列順。
 */
export type LvInvestArticle = { slug: string; hubLabel: string; seoTitle: string; meta: string };

export const LV_INVEST_ARTICLES: LvInvestArticle[] = [
  {
    slug: '3min-guide',
    hubLabel: '3分でわかる低圧系統用蓄電池投資',
    seoTitle: '3分でわかる低圧系統用蓄電池投資（低圧蓄電所）',
    meta: '低圧蓄電所投資の全体像を3分で。何を買い、どう収益が生まれ、誰が関わり、何を確認すべきか。これから検討を始める方の最初の1本です。',
  },
  {
    slug: 'what-you-invest-in',
    hubLabel: '低圧蓄電所とは、結局何に投資するものですか？',
    seoTitle: '低圧蓄電所とは、結局何に投資するもの？（低圧系統用蓄電池）',
    meta: '低圧蓄電所投資の対象は「設備の所有」と「運用契約」のセット。発電しない蓄電池がなぜ収益を生むのか、投資対象の本質を解説します。',
  },
  {
    slug: 'what-20m-yen-buys',
    hubLabel: '2,000万円で何を買うのか — 価格の内訳の考え方',
    seoTitle: '低圧蓄電所の2,000万円は何の値段？内訳の考え方',
    meta: '低圧蓄電所の販売価格の内訳を分解。機器・工事・連系・土地・利益はどう構成されるか、内訳開示を求めるときの聞き方まで解説します。',
  },
  {
    slug: 'vs-solar',
    hubLabel: '低圧太陽光投資と何が違うのか',
    seoTitle: '低圧太陽光と低圧蓄電所投資の違い（蓄電池投資）',
    meta: '低圧太陽光の経験者向けに、低圧蓄電所投資との違いを整理。FITと市場連動、収益の決まり方、実績の厚み、O&Mの中身の差を解説。',
  },
  {
    slug: 'vs-real-estate',
    hubLabel: '不動産投資と低圧蓄電所投資の違い',
    seoTitle: '不動産投資と低圧蓄電所（蓄電池）投資の違い',
    meta: 'ワンルームやアパート経営と低圧蓄電所投資はどう違うか。空室と価格変動、流動性、融資、修繕と劣化——判断軸の対応表で解説します。',
  },
  {
    slug: 'vs-high-voltage',
    hubLabel: '高圧蓄電所と低圧蓄電所、初心者にはどちらが近い？',
    seoTitle: '高圧と低圧の蓄電所投資の違い（系統用蓄電池）',
    meta: '高圧・特別高圧の蓄電所と低圧蓄電所は投資としてどう違うか。規模・手続き・保安体制・市場の違いと、個人に低圧が選ばれやすい理由。',
  },
];

export const LV_INVEST_SEO_MAP: Record<string, LvInvestArticle> = Object.fromEntries(
  LV_INVEST_ARTICLES.map((a) => [a.slug, a])
);
