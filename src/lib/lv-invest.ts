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
// group: 'A' = 「まず知りたい」（分岐①）／'B' = 「買うか迷っている」（分岐②）／'G' = 運営・相談（分岐⑤）
export type LvInvestArticle = { slug: string; group: 'A' | 'B' | 'G'; hubLabel: string; seoTitle: string; meta: string };

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
  // B2（2026-07-25）: B群前半9本（分岐②「買うか迷っている」前半・本丸前編）
  {
    slug: 'five-year-payback',
    group: 'B',
    hubLabel: '「5年で投資回収」とは、どういう意味ですか？',
    seoTitle: '低圧蓄電所の「5年で投資回収」の意味と確認点（蓄電池投資）',
    meta: '「5年で回収」は多くの場合、販売価格を年間想定収益で割った単純計算です。分子・分母の定義、含まれていない費用、確認の仕方を解説。',
  },
  {
    slug: 'ten-year-view',
    group: 'B',
    hubLabel: '5年回収と言われた案件を10年目線で考える',
    seoTitle: '低圧蓄電所投資を10年目線で考える（蓄電池の回収と長期収支）',
    meta: '回収後の5年こそ差がつく期間。劣化・保証切れ・市場変化・修繕と撤去まで、低圧蓄電所を10年の収支表で考える方法を解説します。',
  },
  {
    slug: 'yield-vs-take-home',
    group: 'B',
    hubLabel: '想定利回りと実際の手取りは何が違う？',
    seoTitle: '低圧蓄電所の表面利回りと手取りの違い（蓄電池投資）',
    meta: '表面利回りは売上÷価格の単純計算。手取りは費用と税を引いた後。低圧蓄電所投資で両者がどれだけ離れるか、手順で確認する方法。',
  },
  {
    slug: 'revenue-400-math',
    group: 'B',
    hubLabel: '年間400万円の売上なら、手元にいくら残る？',
    seoTitle: '低圧蓄電所の売上400万円の手取り計算手順（蓄電池投資）',
    meta: '年間売上400万円の低圧蓄電所で手元に残る金額の計算手順。費目の一覧と埋め方、慎重ケースのやり方まで。金額の断定はせず手順を提供。',
  },
  {
    slug: 'is-2000man-expensive',
    group: 'B',
    hubLabel: '販売価格2,000万円は高いのか、安いのか',
    seoTitle: '低圧蓄電所の価格2,000万円は高い？安い？比べ方（蓄電池投資）',
    meta: '低圧蓄電所の価格の高い安いは単価・含まれる範囲・条件の3点で決まる。相場の断定ではなく、正しく比較する手順を解説します。',
  },
  {
    slug: 'is-it-profitable',
    group: 'B',
    hubLabel: '低圧蓄電所は本当に儲かるのか',
    seoTitle: '低圧蓄電所投資は本当に儲かるのか — 正直な答え（蓄電池）',
    meta: '「儲かるのか」への正直な答えは「条件次第で、誰にも保証できない」。何が成否を分けるのか、4つの要素と確認の順番を解説します。',
  },
  {
    slug: 'feels-suspicious',
    group: 'B',
    hubLabel: '低圧蓄電所投資が怪しいと感じたときに確認すること',
    seoTitle: '低圧蓄電所投資は怪しい？と感じたときの確認手順（蓄電池）',
    meta: '「怪しい」という感覚は大切なセンサー。会社・案件・説明・契約の4点を順に確認する手順と、「怪しい」と「新しい」の見分け方。',
  },
  {
    slug: 'five-numbers-to-check',
    group: 'B',
    hubLabel: '「高利回り」と言われたときに見る5つの数字',
    seoTitle: '蓄電池投資で「高利回り」と言われたら見る5つの数字（低圧蓄電所）',
    meta: '「高利回り」という言葉自体は何も保証しません。分母分子の定義・前提単価と稼働率・劣化と保証・年間費用・慎重ケースの5つを確認。',
  },
  {
    slug: 'yield-guarantee-check',
    group: 'B',
    hubLabel: '「利回り保証」と言われたら何を確認する？',
    seoTitle: '蓄電池投資の「利回り保証」の確認点 — 保証の中身を分解（低圧蓄電所）',
    meta: '「利回り保証」は誰が・何を・何年・どの原資で保証するかで意味が全く違う。保証の分解手順と、「元本保証」という説明への注意点。',
  },
  // B3（2026-07-25）: B群後半9本（分岐②「買うか迷っている」完結・本丸完結編）
  {
    slug: 'tax-first-decision',
    group: 'B',
    hubLabel: '即時償却だけで購入を決めてよいですか？',
    seoTitle: '蓄電池投資の即時償却・税メリットだけで決めてよい？（低圧蓄電所）',
    meta: '税制優遇を入口に低圧蓄電所を検討する方へ。繰延と減税の区別、2年目以降と出口の課税、税効果を除いた素の収支で判断する原則を解説。',
  },
  {
    slug: 'loan-approved-safe',
    group: 'B',
    hubLabel: '融資がつく案件なら安心ですか？',
    seoTitle: '融資がつく低圧蓄電所案件は安心？銀行審査の意味（蓄電池投資）',
    meta: '「銀行が貸すなら大丈夫」は誤解になり得ます。融資審査が見ているもの、金利と期間の影響、借入で変わるリスクの質を解説します。',
  },
  {
    slug: 'pressured-to-buy',
    group: 'B',
    hubLabel: '営業担当者に購入を急かされたときの考え方',
    seoTitle: '低圧蓄電所の営業に急かされたら — 期限の見分け方（蓄電池投資）',
    meta: '「本日中に」「次の方が待っている」— 急かしへの対処法。本物の期限と作られた期限の見分け方、即断しないルール、断り方の文例。',
  },
  {
    slug: 'buy-wait-or-pass',
    group: 'B',
    hubLabel: '今すぐ買う、少し待つ、買わないの3つを比較する',
    seoTitle: '低圧蓄電所投資 — 買う・待つ・買わないの判断フレーム（蓄電池）',
    meta: '二択で悩まず三択で考える。買う条件、待つことで得るものと失うもの、待つ場合の期限の切り方まで、判断のフレームを提供します。',
  },
  {
    slug: 'when-not-to-buy',
    group: 'B',
    hubLabel: '低圧蓄電所を買わない方がよいケース',
    seoTitle: '低圧蓄電所を買わない方がよいケース — 案件と状況の危険信号',
    meta: '案件側の危険信号（内訳非開示・慎重ケース拒否・書面化拒否）と、あなた側の状況（資金・家族・借入）。ひとつでも該当したら立ち止まる。',
  },
  {
    slug: 'worst-case',
    group: 'B',
    hubLabel: '最悪の場合、どこまで損をする可能性がある？',
    seoTitle: '低圧蓄電所投資の最悪ケース — 損失の構造を正直に（蓄電池）',
    meta: '目を背けずに最悪を見る。現実的な下振れから複合的な最悪ケースまで損失の構造を整理し、損失を限定する4つの設計を解説します。',
  },
  {
    slug: 'capital-recovery',
    group: 'B',
    hubLabel: '投資元本はどのように回収されるのか',
    seoTitle: '低圧蓄電所投資の元本回収の仕組み（蓄電池・回収の実像）',
    meta: '元本回収は毎年の手取りの積み上げ＋最後の残存価値。名目と実質、借入返済との混同、回収を早める唯一の確実な要素を解説します。',
  },
  {
    slug: 'residual-value',
    group: 'B',
    hubLabel: '低圧蓄電所に残存価値はあるのか',
    seoTitle: '低圧蓄電所の残存価値 — 継続・売却・処分の実際（蓄電池）',
    meta: '残存価値は「続ける価値」「売る価値」「処分の価値」の3つ。中古市場の現状、簿価と市場価値の違い、残存価値に頼らない設計を解説。',
  },
  {
    slug: 'ten-years-later',
    group: 'B',
    hubLabel: '10年後、この蓄電所はどうなるのか',
    seoTitle: '低圧蓄電所の10年後 — 機器・市場・選択肢の変化（蓄電池投資）',
    meta: '10年後を正確に予測できる人はいません。機器・市場・制度がどう変わり得るか、幅で考える方法と「選び直せる契約」の重要性を解説。',
  },
];

/** 「まず知りたい」A群（分岐①・表示順） */
export const LV_INVEST_ARTICLES_A = LV_INVEST_ARTICLES.filter((a) => a.group === 'A');
/** 「買うか迷っている」B群（分岐②・表示順） */
export const LV_INVEST_ARTICLES_B = LV_INVEST_ARTICLES.filter((a) => a.group === 'B');
/** 運営・相談 G群（分岐⑤） */
export const LV_INVEST_ARTICLES_G = LV_INVEST_ARTICLES.filter((a) => a.group === 'G');

export const LV_INVEST_SEO_MAP: Record<string, LvInvestArticle> = Object.fromEntries(
  LV_INVEST_ARTICLES.map((a) => [a.slug, a])
);
