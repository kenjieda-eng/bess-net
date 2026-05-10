/**
 * linkify.ts (依頼W.5 改修版)
 *
 * 依頼W で発生した HTML <a> ネスト問題を根本修正：
 * - 同 name で複数候補がある場合は comparePriority で 1 件のみ採用
 * - text 位置ベースの linkedRanges で初出管理（同 token 内で重複範囲をスキップ）
 * - <a> / <script> / <style> 内のテキストは触らない
 * - NG_TERMS と最小文字数フィルタで汎用語を除外
 *
 * 後方互換: linkifyTerms(html, terms) は維持（内部で linkifyHTML を呼ぶ）
 */

export type LinkTarget = {
  text: string;
  url: string;
  type: 'operator' | 'project' | 'glossary';
  /**
   * 主名フラグ（依頼Z）。operator の正式 name はこれが true。
   * suffix-strip / parenAlias / aliases[] の派生候補は false（または未設定）。
   */
  isPrimary?: boolean;
  /**
   * aliases[] 由来フラグ（依頼Z）。明示登録された略称を示す。
   * 同 type の他候補と衝突したとき suffix-strip 由来の派生より優先される。
   * また min length フィルタを 2字以上に緩和する条件として参照される。
   */
  isAlias?: boolean;
};

export type LinkifyOptions = {
  /** true = 同 url は記事内で初出のみリンク化 (default: true) */
  firstOnly?: boolean;
  /** 自身のページ url。targets から自エンティティを除外 */
  selfUrl?: string;
};

/**
 * NG_TERMS — 過剰リンクの温床になる汎用語。
 * 実機検証で over-match を確認したものを順次追加。
 * （依頼W.5 §4-2 A）
 */
const NG_TERMS = new Set<string>([
  // 汎用エネルギー語（蓄電所ネットの主題そのもの）
  '蓄電所',
  '蓄電池',
  '系統用蓄電池',
  '系統用蓄電所',
  '系統蓄電所',
  '次世代蓄電池',
  '日本蓄電池',
  // 容量・出力単位
  'BESS',
  'PCS',
  'MW',
  'MWh',
  'kW',
  'kWh',
  // 一般語
  'リース',
  'リユース',
  // 市場制度関連の汎用語（タイトル直撃しがち）
  '需給調整市場',
  '容量市場',
  // 地域名 + 蓄電所のような形式
  '低圧系統用蓄電池',
  '系統用蓄電',
  // PR TIMES タイトル由来の頻出語
  'プロジェクト',
  '系統用',
  '低圧',
  '太陽光',
  '再エネ',
  '電力',
  '受電',
  '発電',
  // 発見次第追加
]);

/** type 別の最小文字数（依頼W.5 §4-2 B） */
const MIN_LENGTH: Record<LinkTarget['type'], number> = {
  operator: 4,
  project: 5,
  glossary: 5,
};

/** type 優先順位（依頼W.5 §4-2 C） */
const TYPE_RANK: Record<LinkTarget['type'], number> = {
  project: 3,
  operator: 2,
  glossary: 1,
};

/**
 * 同 text の複数候補に対し優先 target を1件選ぶ:
 *   project > operator > glossary
 *   同 type なら:
 *     isPrimary（正式 name）> isAlias（aliases[] 由来）> その他派生（suffix-strip 等）
 *     ↑ 依頼Z 追加: 「東急」が tokyu-fudosan の suffix-strip ではなく
 *       tokyu の aliases[] にマッチするよう確定的に決める
 *   それも同じなら slug が長い方（より具体的）
 *   それも同じなら slug アルファベット順
 *  返り値 > 0 なら a を採用
 */
function comparePriority(a: LinkTarget, b: LinkTarget): number {
  if (TYPE_RANK[a.type] !== TYPE_RANK[b.type]) {
    return TYPE_RANK[a.type] - TYPE_RANK[b.type];
  }
  // 依頼Z: 同 type の場合、明示登録の優先順位
  // primary > alias > その他派生
  const rankA = a.isPrimary ? 2 : a.isAlias ? 1 : 0;
  const rankB = b.isPrimary ? 2 : b.isAlias ? 1 : 0;
  if (rankA !== rankB) return rankA - rankB;

  if (a.url.length !== b.url.length) {
    return a.url.length - b.url.length;
  }
  return a.url < b.url ? 1 : a.url > b.url ? -1 : 0;
}

/**
 * メイン関数: HTML 中の text に対し targets を適用してリンク化。
 * - <a>...</a>, <script>, <style>, タグ属性内は触らない
 * - 同 text の複数候補は1件にまとめる（comparePriority）
 * - 初出のみ（firstOnly）— url ベースに加え、token 内 linkedRanges でも重複防止
 */
export function linkifyHTML(
  html: string,
  targets: LinkTarget[],
  options: LinkifyOptions = {}
): string {
  if (!html) return html;
  const firstOnly = options.firstOnly !== false;

  // 1. selfUrl 除外
  const filtered: LinkTarget[] = (
    options.selfUrl
      ? targets.filter((t) => t.url !== options.selfUrl)
      : targets
  )
    // 2. NG_TERMS と最小文字数フィルタ
    //    依頼Z: isAlias=true の候補は明示登録なので min length=2 まで許容
    //    （「東急」「東芝」等の3字以下略称を救う）
    .filter((t) => {
      if (!t.text || !t.url) return false;
      if (NG_TERMS.has(t.text)) return false;
      const min = t.isAlias ? 2 : (MIN_LENGTH[t.type] ?? 5);
      return t.text.length >= min;
    });

  if (filtered.length === 0) return html;

  // 3. 同 text の複数候補を comparePriority で1件にまとめる
  const byText = new Map<string, LinkTarget>();
  for (const t of filtered) {
    const cur = byText.get(t.text);
    if (!cur || comparePriority(t, cur) > 0) {
      byText.set(t.text, t);
    }
  }
  const deduped = Array.from(byText.values());

  // 4. 長い text 優先でソート（部分マッチ防止）
  deduped.sort((a, b) => {
    if (b.text.length !== a.text.length) return b.text.length - a.text.length;
    return TYPE_RANK[b.type] - TYPE_RANK[a.type];
  });

  // 5. 初出済み url を記事横断で追跡（firstOnly）
  const linkedUrls = new Set<string>();

  // 6. HTML を「タグ」「テキスト」トークンに分解（<a>/<script>/<style> 内はタグ扱い）
  const tokens = splitHtmlTokens(html);

  const out = tokens
    .map((tk) => {
      if (tk.kind === 'tag') return tk.value;
      return linkifyTextNode(tk.value, deduped, linkedUrls, firstOnly);
    })
    .join('');

  return out;
}

/* =============================================================
   後方互換: 既存 linkifyTerms (glossary 用語のみ) の API
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

/* ----------------------------- 内部実装 ----------------------------- */

/**
 * 1つのテキストノードに対してリンク化を行う:
 *  - 各 target を長い順に試す
 *  - マッチ位置が既存 linkedRanges と重複したらスキップ
 *  - 重複しなければ linkedRanges に登録（次の target はそこを避ける）
 *  - firstOnly が true で linkedUrls に既登録の url はスキップ
 *  - 最後に linkedRanges を順序通りに展開して <a> で囲んだ HTML を生成
 */
function linkifyTextNode(
  text: string,
  targets: LinkTarget[],
  linkedUrls: Set<string>,
  firstOnly: boolean
): string {
  // ranges: this token 内でリンクすべき範囲 [start, end, target]（start 昇順管理）
  const ranges: Array<{ start: number; end: number; target: LinkTarget }> = [];

  for (const t of targets) {
    if (firstOnly && linkedUrls.has(t.url)) continue;
    const idx = findNonOverlappingMatch(text, t.text, ranges);
    if (idx < 0) continue;
    // 範囲を sorted 位置に挿入
    insertRange(ranges, { start: idx, end: idx + t.text.length, target: t });
    linkedUrls.add(t.url);
  }

  if (ranges.length === 0) return text;

  // ranges から HTML を組み立て（start 昇順）
  let cursor = 0;
  const out: string[] = [];
  for (const r of ranges) {
    if (r.start > cursor) out.push(text.slice(cursor, r.start));
    const matched = text.slice(r.start, r.end);
    out.push(buildAnchor(r.target, matched));
    cursor = r.end;
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out.join('');
}

/** 既登録 ranges と重複しない最初の出現位置を返す（無ければ -1） */
function findNonOverlappingMatch(
  text: string,
  needle: string,
  ranges: Array<{ start: number; end: number }>
): number {
  let from = 0;
  while (true) {
    const idx = text.indexOf(needle, from);
    if (idx < 0) return -1;
    const end = idx + needle.length;
    // ranges のいずれかと重複か
    const overlap = ranges.some(
      (r) => !(end <= r.start || idx >= r.end)
    );
    if (!overlap) return idx;
    // 次の候補探索を進める
    from = idx + 1;
  }
}

/** ranges に start 昇順で insert */
function insertRange(
  ranges: Array<{ start: number; end: number; target: LinkTarget }>,
  range: { start: number; end: number; target: LinkTarget }
): void {
  let i = 0;
  while (i < ranges.length && ranges[i].start < range.start) i++;
  ranges.splice(i, 0, range);
}

function buildAnchor(t: LinkTarget, matchedText: string): string {
  const cls = `auto-link auto-link-${t.type}`;
  return (
    `<a href="${t.url}" class="${cls}" data-link-type="${t.type}">` +
    escapeHtml(matchedText) +
    '</a>'
  );
}

/**
 * HTML を「タグ」「テキスト」トークンに分解。
 * - <a>...</a> 内のテキストは tag 扱い（リンク対象外）
 * - <script>...</script>, <style>...</style> 内のテキストも tag 扱い
 */
function splitHtmlTokens(
  html: string
): Array<{ kind: 'tag' | 'text'; value: string }> {
  const tokens: Array<{ kind: 'tag' | 'text'; value: string }> = [];
  let i = 0;
  let buffer = '';
  let mode: 'text' | 'tag' = 'text';
  let inAnchor = false;
  let inScript = false;
  let inStyle = false;

  const isInert = () => inAnchor || inScript || inStyle;

  while (i < html.length) {
    const ch = html[i];
    if (mode === 'text') {
      if (ch === '<') {
        if (buffer) {
          tokens.push({ kind: isInert() ? 'tag' : 'text', value: buffer });
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
        else if (/^<\/a\s*>/i.test(buffer)) inAnchor = false;
        else if (/^<script[\s>]/i.test(buffer)) inScript = true;
        else if (/^<\/script\s*>/i.test(buffer)) inScript = false;
        else if (/^<style[\s>]/i.test(buffer)) inStyle = true;
        else if (/^<\/style\s*>/i.test(buffer)) inStyle = false;
        tokens.push({ kind: 'tag', value: buffer });
        buffer = '';
        mode = 'text';
      }
    }
    i++;
  }
  if (buffer) {
    tokens.push({ kind: mode === 'tag' || isInert() ? 'tag' : 'text', value: buffer });
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
