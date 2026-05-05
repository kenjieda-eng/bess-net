/**
 * term-linker.ts
 *
 * 本文HTML中の業界用語を /glossary/[slug] へのリンクに自動変換するユーティリティ。
 *
 * 使用方法（Server Component内）:
 *   import { linkifyTerms } from '@/lib/term-linker';
 *   import type { Glossary } from '@/lib/microcms';
 *
 *   const html = linkifyTerms(news.body, news.relatedTerms ?? []);
 *   <div dangerouslySetInnerHTML={{ __html: html }} />
 *
 * 設計方針：
 *   - 既存のリンク・属性内テキストは置換しない（誤動作防止）
 *   - 長い用語から先にマッチさせる（部分文字列誤マッチ回避）
 *   - 1記事内で同じ用語は最初の1回のみリンク化（読者を疲弊させない）
 */

type TermLike = { term: string; slug: string };

/**
 * HTML文字列を「タグ／非タグ」に分割し、非タグ部分のみ用語リンク変換を適用。
 */
export function linkifyTerms(html: string, terms: TermLike[]): string {
  if (!html || !terms || terms.length === 0) return html;

  // 用語を長さ降順で並べる（「需給調整市場」が「市場」より先にマッチ）
  const sorted = [...terms]
    .filter((t) => t.term && t.term.length >= 2 && t.slug)
    .sort((a, b) => b.term.length - a.term.length);

  if (sorted.length === 0) return html;

  // 1記事内で各用語のリンク化済みフラグ（最初の1回のみリンク）
  const linkedSet = new Set<string>();

  // タグと非タグを交互に分解
  // 簡易パーサ: タグ "<...>" or テキスト
  const parts = splitHtmlTokens(html);
  const result = parts
    .map((p) => {
      if (p.kind === 'tag') return p.value;
      // 非タグテキストに用語リンクを適用
      let s = p.value;
      for (const t of sorted) {
        if (linkedSet.has(t.slug)) continue;
        const escapedTerm = escapeRegex(t.term);
        const re = new RegExp(escapedTerm);
        const match = s.match(re);
        if (match && match.index !== undefined) {
          const before = s.slice(0, match.index);
          const after = s.slice(match.index + t.term.length);
          const linked = `<a href="/glossary/${t.slug}" class="term-link">${escapeHtml(t.term)}</a>`;
          s = before + linked + after;
          linkedSet.add(t.slug);
        }
      }
      return s;
    })
    .join('');

  return result;
}

/** HTML を「タグ」と「テキスト」のトークンに分解 */
function splitHtmlTokens(
  html: string
): Array<{ kind: 'tag' | 'text'; value: string }> {
  const tokens: Array<{ kind: 'tag' | 'text'; value: string }> = [];
  let i = 0;
  let buffer = '';
  let mode: 'text' | 'tag' = 'text';
  // a タグ内ネスト：既存リンク内では用語リンク変換を抑制
  let inAnchor = false;

  while (i < html.length) {
    const ch = html[i];
    if (mode === 'text') {
      if (ch === '<') {
        // テキスト終了
        if (buffer) {
          if (!inAnchor) {
            tokens.push({ kind: 'text', value: buffer });
          } else {
            tokens.push({ kind: 'tag', value: buffer });
          }
          buffer = '';
        }
        mode = 'tag';
        buffer = ch;
      } else {
        buffer += ch;
      }
    } else {
      // タグモード
      buffer += ch;
      if (ch === '>') {
        // タグ終了
        // <a> 開始 / </a> 終了 を検出
        if (/^<a[\s>]/i.test(buffer)) inAnchor = true;
        if (/^<\/a\s*>/i.test(buffer)) inAnchor = false;
        tokens.push({ kind: 'tag', value: buffer });
        buffer = '';
        mode = 'text';
      }
    }
    i++;
  }
  // 残り
  if (buffer) tokens.push({ kind: mode === 'tag' ? 'tag' : 'text', value: buffer });

  return tokens;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Explainer の relatedTerms（CSV文字列） を Glossary[] 形式に変換
 * 引数: terms = "FRT,LVRT,HVRT,..." / glossaryAll = 全glossary（mapping用）
 */
export function csvTermsToTermList(
  csv: string | undefined,
  termSlugMap: Map<string, string>
): TermLike[] {
  if (!csv) return [];
  return csv
    .split(',')
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .map((term) => ({
      term,
      slug: termSlugMap.get(term) ?? '',
    }))
    .filter((t) => t.slug.length > 0);
}
