/**
 * linkify.ts (依頼W Phase 1)
 *
 * 既存 term-linker.ts の `linkifyTerms` を拡張し、
 * news / projects / operators / glossary の3種を本文HTML中で自動リンク化する。
 *
 * 設計方針：
 * - 既存リンク (`<a>...</a>`) 内のテキストは置換しない
 * - HTML タグ内のテキストは置換しない
 * - 1記事内で同じ url 先は最初の1回のみリンク化（読者疲弊防止）
 * - 長いテキストから先にマッチさせる（部分文字列誤マッチ回避）
 * - 同位置で複数 target がマッチした場合は登録順（呼び出し側で project > operator > glossary 順に並べる想定）
 */

export type LinkTarget = {
  text: string; // マッチ対象（社名、案件名、用語）
  url: string; // /operators/{slug}, /projects/{slug}, /glossary/{slug}
  type: 'operator' | 'project' | 'glossary';
};

export type LinkifyOptions = {
  /** true = 同じ url 先は1記事内で最初の1回のみリンク化 (default: true) */
  firstOnly?: boolean;
  /** 自身のページ slug。targets から自エンティティを除外する用 */
  selfUrl?: string;
};

/**
 * HTML 文字列に対し targets を適用してリンク化。
 * - HTML タグ内・既存 <a>...</a> 内のテキストは触らない
 * - 同 url は記事内で初出のみ
 * - 長い text 優先（部分マッチ防止）
 */
export function linkifyHTML(
  html: string,
  targets: LinkTarget[],
  options: LinkifyOptions = {}
): string {
  if (!html) return html;
  const firstOnly = options.firstOnly !== false;

  // self-url 除外
  const filtered = options.selfUrl
    ? targets.filter((t) => t.url !== options.selfUrl)
    : targets;

  // 重複 (text, url) を除外し、空・短すぎる text を除外
  const seen = new Set<string>();
  const cleaned: LinkTarget[] = [];
  for (const t of filtered) {
    if (!t.text || !t.url) continue;
    if (t.text.length < 2) continue; // 1文字は誤マッチを生むので除外
    const key = `${t.text}|${t.url}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cleaned.push(t);
  }
  if (cleaned.length === 0) return html;

  // 長さ降順 → 同長は type 優先順 (project > operator > glossary)
  const TYPE_PRIORITY: Record<LinkTarget['type'], number> = {
    project: 0,
    operator: 1,
    glossary: 2,
  };
  const sorted = [...cleaned].sort((a, b) => {
    if (b.text.length !== a.text.length) return b.text.length - a.text.length;
    return TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
  });

  // url 単位で初出フラグを管理（同じ url が text バリエーションで複数登録されているケースに対応）
  const linkedUrls = new Set<string>();

  // タグ・テキストにトークン分解
  const tokens = splitHtmlTokens(html);
  const out = tokens
    .map((tk) => {
      if (tk.kind === 'tag') return tk.value;
      // テキストノードに対し各 target を順に適用
      let s = tk.value;
      for (const t of sorted) {
        if (firstOnly && linkedUrls.has(t.url)) continue;
        const idx = s.indexOf(t.text);
        if (idx < 0) continue;
        const before = s.slice(0, idx);
        const after = s.slice(idx + t.text.length);
        const cls = `auto-link auto-link-${t.type}`;
        const linked =
          `<a href="${t.url}" class="${cls}" data-link-type="${t.type}">` +
          escapeHtml(t.text) +
          '</a>';
        s = before + linked + after;
        linkedUrls.add(t.url);
      }
      return s;
    })
    .join('');

  return out;
}

/* =============================================================
   後方互換: 既存 linkifyTerms の API を維持
   - news / explainer などの既存呼び出しは glossary のみのため
     新しい linkifyHTML を呼び出すラッパーとして実装
   ============================================================= */

type TermLike = { term: string; slug: string };

export function linkifyTerms(html: string, terms: TermLike[]): string {
  if (!html || !terms || terms.length === 0) return html;
  const targets: LinkTarget[] = terms
    .filter((t) => t.term && t.slug)
    .map((t) => ({
      text: t.term,
      url: `/glossary/${t.slug}`,
      type: 'glossary' as const,
    }));
  return linkifyHTML(html, targets, { firstOnly: true });
}

/* ----------------------------- 内部ユーティリティ ----------------------------- */

/** HTML を「タグ」と「テキスト」のトークンに分解。<a>...</a> 内のテキストはタグ扱いにし置換対象外に。 */
function splitHtmlTokens(
  html: string
): Array<{ kind: 'tag' | 'text'; value: string }> {
  const tokens: Array<{ kind: 'tag' | 'text'; value: string }> = [];
  let i = 0;
  let buffer = '';
  let mode: 'text' | 'tag' = 'text';
  let inAnchor = false;

  while (i < html.length) {
    const ch = html[i];
    if (mode === 'text') {
      if (ch === '<') {
        if (buffer) {
          // <a> 内のテキストは tag 扱いにして置換対象外
          tokens.push({ kind: inAnchor ? 'tag' : 'text', value: buffer });
          buffer = '';
        }
        mode = 'tag';
        buffer = ch;
      } else {
        buffer += ch;
      }
    } else {
      buffer += ch;
      if (ch === '>') {
        if (/^<a[\s>]/i.test(buffer)) inAnchor = true;
        if (/^<\/a\s*>/i.test(buffer)) inAnchor = false;
        tokens.push({ kind: 'tag', value: buffer });
        buffer = '';
        mode = 'text';
      }
    }
    i++;
  }
  if (buffer) {
    tokens.push({ kind: mode === 'tag' ? 'tag' : 'text', value: buffer });
  }
  return tokens;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
