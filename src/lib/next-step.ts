/**
 * src/lib/next-step.ts — 「運営元からのご案内」（NextStepBox）を置くかどうかの判定（次の一歩便・2026-10-17）
 *
 * 便 §3 の理由: EPRX は商用目的の利用に事前の契約を求めており、当サイトが当たるかを照会中。
 * そのため、EPRX の資料の数値（需給調整市場の約定・上限価格などの具体の数）の真横に、費用が生じうる相談への案内を置かない。
 *   - ページの文（題・導入文・本文・出典など）に EPRX の数値がある解説・ニュース・案件には置かない（§2）。
 *   - 文に無くても、同じページの関連カード（関連解説・この解説の先へ）の題・導入文に数値が出るなら置かない
 *     （下調べで 16 本のニュースと解説 1 本、レビューで案件 14 本が該当。§0「迷う所は置かずに報告へ」）。
 * 判定はビルド時・描画時の文字だけで行う（runtime の microCMS を足さない）。ISR で描き直すたびに同じ判定が走る。
 * 書き方の試験: npm run verify:next-step（scripts/verify-next-step.ts）
 */
import { NEXT_STEP_EXPLAINERS, NEXT_STEP_HELD } from '@/data/next-step-explainers';

export type NextStepVariant = 'introduce' | 'asset' | 'sell' | 'operate' | 'land' | 'buy';

type PageText = string | null | undefined;
type Card = { title?: string | null; lead?: string | null };

const ENTITY: Record<string, string> = {
  nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", Delta: 'Δ', rarr: '→', rArr: '⇒',
};

/** 判定の前に文字を整える: タグを空白に・実体参照を戻す・NFKC（全角の英数字と記号を半角に） */
function toCheckText(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/&(#x[0-9a-fA-F]+|#\d+|[A-Za-z]+);/g, (m, e: string) => {
      if (e[0] === '#') {
        const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(cp) ? String.fromCodePoint(cp) : m;
      }
      return ENTITY[e] ?? m;
    })
    .normalize('NFKC');
}

/**
 * EPRX の資料の数値とみなす書き方（整えた後の文に当てる）。
 *   円/ΔkW・ΔkW・30分（Δ は ∆ U+2206・⊿ U+22BF も。この 2 つは NFKC で Δ にならない）・Δ の無い「円/kW・30分」、
 *   「19.51円→15円」「19.51→15円」「15円から10円」「15円⇒10円」の推移、EPRX の後の「…円」。
 * 当たりすぎ（FIT・電気代の「40円→36円」など）は「置かない」側に倒れるので許す。JEPX の円/kWh には当てない。
 */
const EPRX_NUMBER_RE = new RegExp(
  [
    String.raw`円\s*/\s*[Δ∆⊿]?\s*kW\s*[・･]\s*30\s*分`,
    String.raw`円\s*/\s*[Δ∆⊿]\s*kW`,
    String.raw`[Δ∆⊿]\s*kW\s*[・･]\s*30\s*分`,
    String.raw`\d+(?:\.\d+)?\s*円\s*(?:→|⇒|から)\s*\d`,
    String.raw`\d+(?:\.\d+)?\s*(?:→|⇒)\s*\d+(?:\.\d+)?\s*円`,
    String.raw`EPRX[^。]{0,40}?\d+(?:\.\d+)?\s*円`,
  ].join('|'),
  'i',
);

export function hasEprxNumbers(text: PageText): boolean {
  return !!text && EPRX_NUMBER_RE.test(toCheckText(text));
}

function anyHasEprxNumbers(pageTexts: PageText[], cards: Card[] | undefined): boolean {
  return (
    pageTexts.some((t) => hasEprxNumbers(t)) ||
    (cards ?? []).some((c) => hasEprxNumbers(c.title) || hasEprxNumbers(c.lead))
  );
}

/**
 * /explainer/[slug]: 表（src/data/next-step-explainers.ts）にある slug だけ。
 * pageTexts は題・導入文・本文・出典など、同じページに出る文。relatedCards は「この解説の先へ」に実際に出す行。
 */
export function explainerNextStep(
  slug: string,
  pageTexts: PageText[],
  relatedCards: Card[] | undefined,
): NextStepVariant | null {
  const v = NEXT_STEP_EXPLAINERS[slug];
  if (!v) return null;
  if (NEXT_STEP_HELD[slug]) return null;
  if (anyHasEprxNumbers(pageTexts, relatedCards)) return null;
  return v;
}

/**
 * /news/[slug]: category（配列）に「投資」または「開発計画」を含むものだけ（introduce・他社の案件）。
 * サイト自身のお知らせ（category に「編集部」）・noindex の記事（news-excluded）は置かない（下調べで保留を提案された型）。
 */
export function newsNextStep(
  slug: string,
  category: string[] | null | undefined,
  pageTexts: PageText[],
  relatedCards: Card[] | undefined,
  excluded: boolean,
): NextStepVariant | null {
  const cats = category ?? [];
  if (!cats.includes('投資') && !cats.includes('開発計画')) return null;
  if (cats.includes('編集部') || excluded) return null;
  if (NEXT_STEP_HELD[slug]) return null;
  if (anyHasEprxNumbers(pageTexts, relatedCards)) return null;
  return 'introduce';
}

/**
 * /projects/[slug]: 稼働中（isCodRealized）なら introduce、それ以外は land（他社の案件）。
 * noindex の除外案件（EXCLUDED_PROJECT_SLUGS）と、文・関連解説のカードに EPRX の数値があるページには置かない。
 */
export function projectNextStep(
  realized: boolean,
  pageTexts: PageText[],
  relatedCards: Card[] | undefined,
  excluded: boolean,
): NextStepVariant | null {
  if (excluded) return null;
  if (anyHasEprxNumbers(pageTexts, relatedCards)) return null;
  return realized ? 'introduce' : 'land';
}
