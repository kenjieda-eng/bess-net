/**
 * src/lib/source-links.ts — 平文の出典欄の URL を <a> にする（Ck2e M07・本実行便 2026-10-22）
 *
 * explainer.sources は textArea で、多くは平文（URL が書いてあるだけでリンクになっていない）。
 * 出典欄を描く 2 か所（/explainer/[slug]・/lv/invest/[slug]）が同じ規則になるよう、ここ 1 か所に置く（#119）。
 *
 * 規則:
 * - 欄に <a が既にあるもの（HTML で書いた出典）は触らない。
 * - URL の終端: 空白・改行・全角の括弧（「」『』（）【】［］）・全角スラッシュ「／」・読点「、」・句点「。」・< > " '。
 * - 取り出した URL の末尾の半角「)」は、URL 内に対応する半角「(」が無い間は 1 文字ずつ外し、外した文字はリンクの外に残す
 *   （GFM の autolink と同じ扱い。平文の出典は「(URL)」の書き方が多数派）。末尾の半角「.」「,」「;」「:」も同じく外す。
 * - href と表示テキストは normalizeSourceLinkHref を通す（JEPX・EPRX はトップへ。/policy-calendar と同じ）。
 * - 平文の他の文字はエスケープし直さない（従来も HTML として描画している＝&amp; 等の二重エスケープを避ける）。
 */
import { normalizeSourceLinkHref } from '@/lib/eic-license';

const URL_RE = /https?:\/\/[^\s「」『』（）【】［］／、。<>"']+/g;

/** 末尾の半角の閉じ括弧・句読点を URL から外す（外した分は tail に返す） */
export function splitTrailing(m: string): { url: string; tail: string } {
  let url = m;
  let tail = '';
  while (/[).,;:]$/.test(url)) {
    if (url.endsWith(')') && url.split('(').length >= url.split(')').length) break;
    tail = url.slice(-1) + tail;
    url = url.slice(0, -1);
  }
  return { url, tail };
}

/** 出典欄の HTML／平文を受け取り、平文のときだけ URL を <a> にして返す */
export function linkifyPlainSources(sources: string): string {
  if (!sources || /<a[\s>]/i.test(sources)) return sources;
  return sources.replace(URL_RE, (m) => {
    const { url, tail } = splitTrailing(m);
    if (!/^https?:\/\/[^/]+/.test(url)) return m;
    const href = normalizeSourceLinkHref(url) ?? url;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer" style="word-break:break-all">${href}</a>${tail}`;
  });
}
