/**
 * src/lib/news-topic-patterns.ts — news 主題キーワードゲートの判定語・判定関数（生成物に依存しない部分）
 *
 * news-topic-gate.ts から分離（金曜#6 追修便④ ■1・2026-09-13）。
 * news-topic-gate.ts は prebuild の出力 generated/news-topic-exclusions.json を import する。その出力を
 * 作る scripts/precompute-news-topic-gate.ts が news-topic-gate.ts を読むと、生成物の無い新規クローン
 * （Vercel・src/lib/generated を git 追跡から外した後）では自分の出力がまだ無いため起動時に落ちる
 * （MODULE_NOT_FOUND・2026-09-13 実測）。判定語と判定関数は生成物に依存しないのでここに一箇所だけ置き、
 * news-topic-gate.ts は再エクスポートする（#119 定義は一箇所）。
 */

/** 主題キーワード（title または本文のいずれかに含めば適合。ESS のみ英単語境界＝Business等の誤ヒット防止） */
export const TOPIC_PATTERNS: RegExp[] = [
  /蓄電/,        // 蓄電池・蓄電所・蓄電施設を包含
  /BESS/,
  /系統用/,
  /需給調整/,
  /容量市場/,
  /アグリゲー/,  // アグリゲーター / アグリゲーション
  /VPP/,
  /バッテリ/,
  /JEPX/,
  /電力市場/,
  /長期脱炭素/,
  /\bESS\b/,
];

/**
 * 誤除外復帰用 allowlist（slug を1行追加→次 build で一覧・詳細とも復帰。microCMS 変更不要）
 * 例: 'pr-2026-01-01-example-1',
 */
export const NEWS_TOPIC_ALLOWLIST: string[] = [];

/** テキスト（title＋本文等の連結）が主題適合か */
export function isOnTopicNewsText(text: string): boolean {
  return TOPIC_PATTERNS.some((re) => re.test(text));
}

/**
 * 記事全文での適合判定（/news/[slug] 詳細ページ用・取得済みデータのみ＝追加フェッチなし）。
 * 判定テキストは precompute（title＋lead＋tags＋body）と完全同一にする。
 * ここが狭いと「一覧に出るが詳細404」の壊れリンクが生じる（2026-08-03 実証: キーワードが
 * lead のみの2記事が該当。pr-2023-11-27-co37124-28 / pr-2024-01-26-co73738-105）。
 */
export function isOnTopicNewsArticle(article: {
  slug: string;
  title?: string;
  lead?: string;
  tags?: string;
  body?: string;
}): boolean {
  if (NEWS_TOPIC_ALLOWLIST.includes(article.slug)) return true;
  return isOnTopicNewsText(
    `${article.title ?? ''}\n${article.lead ?? ''}\n${article.tags ?? ''}\n${article.body ?? ''}`
  );
}
