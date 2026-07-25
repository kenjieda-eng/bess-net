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
// group: 'A' = 「まず知りたい」（分岐①に列挙）／'G' = 運営・相談（分岐⑤に列挙）
export type LvInvestArticle = { slug: string; group: 'A' | 'G'; hubLabel: string; seoTitle: string; meta: string };

export const LV_INVEST_ARTICLES: LvInvestArticle[] = [
  {
    slug: '3min-guide',
    group: 'A',
    hubLabel: '3分でわかる低圧系統用蓄電池投資',
    seoTitle: '3分でわかる低圧系統用蓄電池投資（低圧蓄電所）',
    meta: '低圧蓄電所投資の全体像を3分で。何を買い、どう収益が生まれ、誰が関わり、何を確認すべきか。これから検討を始める方の最初の1本です。',
  },
  {
    slug: 'what-you-invest-in',
    group: 'A',
    hubLabel: '低圧蓄電所とは、結局何に投資するものですか？',
    seoTitle: '低圧蓄電所とは、結局何に投資するもの？（低圧系統用蓄電池）',
    meta: '低圧蓄電所投資の対象は「設備の所有」と「運用契約」のセット。発電しない蓄電池がなぜ収益を生むのか、投資対象の本質を解説します。',
  },
  {
    slug: 'what-20m-yen-buys',
    group: 'A',
    hubLabel: '2,000万円で何を買うのか — 価格の内訳の考え方',
    seoTitle: '低圧蓄電所の2,000万円は何の値段？内訳の考え方',
    meta: '低圧蓄電所の販売価格の内訳を分解。機器・工事・連系・土地・利益はどう構成されるか、内訳開示を求めるときの聞き方まで解説します。',
  },
  {
    slug: 'vs-solar',
    group: 'A',
    hubLabel: '低圧太陽光投資と何が違うのか',
    seoTitle: '低圧太陽光と低圧蓄電所投資の違い（蓄電池投資）',
    meta: '低圧太陽光の経験者向けに、低圧蓄電所投資との違いを整理。FITと市場連動、収益の決まり方、実績の厚み、O&Mの中身の差を解説。',
  },
  {
    slug: 'vs-real-estate',
    group: 'A',
    hubLabel: '不動産投資と低圧蓄電所投資の違い',
    seoTitle: '不動産投資と低圧蓄電所（蓄電池）投資の違い',
    meta: 'ワンルームやアパート経営と低圧蓄電所投資はどう違うか。空室と価格変動、流動性、融資、修繕と劣化——判断軸の対応表で解説します。',
  },
  {
    slug: 'vs-high-voltage',
    group: 'A',
    hubLabel: '高圧蓄電所と低圧蓄電所、初心者にはどちらが近い？',
    seoTitle: '高圧と低圧の蓄電所投資の違い（系統用蓄電池）',
    meta: '高圧・特別高圧の蓄電所と低圧蓄電所は投資としてどう違うか。規模・手続き・保安体制・市場の違いと、個人に低圧が選ばれやすい理由。',
  },
  // B1（2026-07-25・Wave1完成）: A群後半6本＋運営(G)3本
  {
    slug: 'can-individuals-buy',
    group: 'A',
    hubLabel: '個人でも低圧蓄電所を購入できますか？',
    seoTitle: '個人でも低圧蓄電所（低圧系統用蓄電池）を購入できる？',
    meta: '低圧蓄電所は個人でも購入できます。個人と法人での違い、融資の現実、購入前に整理しておきたい資金・体制の考え方を解説します。',
  },
  {
    slug: 'who-considers',
    group: 'A',
    hubLabel: 'どのような人が低圧蓄電所の購入を検討しているのか',
    seoTitle: '低圧蓄電所（蓄電池投資）を検討しているのはどんな人？',
    meta: '低圧蓄電所投資の検討層を類型で紹介。太陽光オーナー、経営者の余剰資金、将来に備えたい会社員など、動機と確認ポイントが分かります。',
  },
  {
    slug: 'who-should-not',
    group: 'A',
    hubLabel: '低圧蓄電所投資が向いている人・向いていない人',
    seoTitle: '低圧蓄電所投資（蓄電池）が向いている人・向いていない人',
    meta: '低圧蓄電所投資に向くのは長期資金で変動を許容できる人。向かないのは短期回収前提・保証がないと不安な人。判断基準を正直に解説。',
  },
  {
    slug: 'one-or-multiple',
    group: 'A',
    hubLabel: '1基だけ持つ場合と複数基持つ場合の違い',
    seoTitle: '低圧蓄電所は1基か複数基か — 違いと考え方（蓄電池投資）',
    meta: '低圧蓄電所を1基持つ場合と複数基持つ場合の違いを解説。収入の分散、管理の手間、資金の集中、はじめての1基の考え方まで。',
  },
  {
    slug: 'explain-to-family',
    group: 'A',
    hubLabel: '家族に説明するための低圧蓄電所投資入門',
    seoTitle: '家族に説明する低圧蓄電所投資（蓄電池）— 反対されたときの整理',
    meta: '低圧蓄電所投資を家族にどう説明するか。1枚資料の使い方、よくある反対理由への向き合い方、家族の質問が投資判断に役立つ理由。',
  },
  {
    slug: 'explain-to-advisors',
    group: 'A',
    hubLabel: '税理士・金融機関に説明するときの基本資料',
    seoTitle: '税理士・銀行に低圧蓄電所投資（蓄電池）を説明する準備',
    meta: '低圧蓄電所投資を税理士や金融機関に相談するとき、何を持参しどう説明するか。専門家が最初に確認したがる項目を先回りで整理。',
  },
  {
    slug: 'free-consultation-scope',
    group: 'G',
    hubLabel: '無料相談でできること・できないこと',
    seoTitle: '低圧蓄電所の無料相談でできること・できないこと',
    meta: '蓄電所ネットの無料相談の範囲を先に明示。資料の読み方の整理・質問リスト作りはできる、個別案件の推奨や税務判断はできない。',
  },
  {
    slug: 'how-we-earn',
    group: 'G',
    hubLabel: '蓄電所ネットは誰から報酬を受け取るのか',
    seoTitle: '蓄電所ネットの運営と報酬の透明性（低圧蓄電所ガイド）',
    meta: '中立をうたうサイトこそ収益構造の説明責任があります。蓄電所ネットの運営主体と報酬の考え方、利益相反への向き合い方を明示します。',
  },
  {
    slug: 'not-buying-is-fine',
    group: 'G',
    hubLabel: '「今は買わない」という判断も支援します',
    seoTitle: '低圧蓄電所を「買わない」判断も支援します（蓄電池投資）',
    meta: '見送りは失敗ではなく判断です。低圧蓄電所投資を見送る合理的な理由、再検討のタイミング、見送り相談の使い方を解説します。',
  },
];

/** 「まず知りたい」A群（分岐①・表示順） */
export const LV_INVEST_ARTICLES_A = LV_INVEST_ARTICLES.filter((a) => a.group === 'A');
/** 運営・相談 G群（分岐⑤） */
export const LV_INVEST_ARTICLES_G = LV_INVEST_ARTICLES.filter((a) => a.group === 'G');

export const LV_INVEST_SEO_MAP: Record<string, LvInvestArticle> = Object.fromEntries(
  LV_INVEST_ARTICLES.map((a) => [a.slug, a])
);
