/**
 * src/lib/contact-link.ts — 相談のリンク（EIC のお問い合わせフォーム）を作る唯一の関数
 *
 * 入口の掃除と計測便（2026-10-17）: 相談のリンクに UTM を付ける所を 1 か所にまとめた。
 *   - 返す形: https://eic-jp.org/contact?utm_source=bess-net&utm_medium=<medium>&utm_campaign=<campaign>&utm_content=<position>
 *   - medium は既定 'referral'。/anken だけは従来どおり 'anken'（AnkenContactCTA）。
 *   - 既にある campaign 名は変えない（GA の履歴を切らないため）:
 *     funnel_buy・funnel_sell・funnel_partner・operating_bess_intro・funnel_lv_buy・funnel_lv_entry・funnel_lv_invest・anken_*
 *   - ご指摘・情報提供のリンクは position を 'feedback' にして、相談と分けて数えられるようにする。
 *   - 画面に URL を文字のまま出す所は CONTACT_DISPLAY_URL（UTM なし）を表示し、href だけを contactUrl() にする。
 *   - クリックは root layout の ContactClickTracker が GA4 の contact_click（cta_campaign・cta_position・link_url）で数える。
 * 検査: npm run verify:contact-links（src にこの関数の外の生の URL が無いこと・ビルド後の HTML の href が全部 UTM つき）。
 */

/** フォームの URL（UTM なし）。画面に文字で出すときはこれを使う */
export const CONTACT_DISPLAY_URL = 'https://eic-jp.org/contact';

export type ContactLinkOptions = {
  /** ページの種類が分かる短い英小文字（例 site_footer・lp_investor・funnel_buy） */
  campaign: string;
  /** ページの中の位置（例 hero・cta・footer）。ご指摘・情報提供は 'feedback' */
  position: string;
  /** 既定 'referral'。/anken だけ 'anken' */
  medium?: string;
};

export function contactUrl({ campaign, position, medium = 'referral' }: ContactLinkOptions): string {
  const params = new URLSearchParams({
    utm_source: 'bess-net',
    utm_medium: medium,
    utm_campaign: campaign,
    utm_content: position,
  });
  return `${CONTACT_DISPLAY_URL}?${params.toString()}`;
}

/**
 * microCMS の本文（HTML の文字列）にある、UTM の無い相談のリンクの href だけに UTM を足す。
 * 本文の書き換え（microCMS の PATCH）はしない。表示の文字（リンクの中の URL の文字）はそのまま。
 * 当たるのは href="https://eic-jp.org/contact"（末尾の / は可・クエリ無し）だけ。既に UTM のある href は触らない。
 * 使う所: /news/[slug]・/info/[slug] の本文（2026-10-17 時点で news の 2 レコードの body にある）。
 */
export function addContactUtmToHtml(html: string, opts: ContactLinkOptions): string {
  if (!html.includes('eic-jp.org/contact')) return html;
  const href = contactUrl(opts).replace(/&/g, '&amp;');
  return html.replace(/href=(["'])https?:\/\/(?:www\.)?eic-jp\.org\/contact\/?\1/g, (_m, q: string) => `href=${q}${href}${q}`);
}

/** href がこのフォームへのリンクか（ContactClickTracker と検査で使う） */
export function isContactHref(href: string): boolean {
  return /^https?:\/\/(www\.)?eic-jp\.org\/contact\/?(?:[?#]|$)/.test(href);
}
