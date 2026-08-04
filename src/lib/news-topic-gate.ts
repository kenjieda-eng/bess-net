/**
 * src/lib/news-topic-gate.ts — news 主題キーワードゲート（news分析2026-07-18 P0）
 *
 * 目的: 企業単位のPR自動取込で混入する「蓄電池と無関係」なリリースを表示系から一貫除外する。
 * 方式: 「title・lead・tags・本文のいずれかに主題キーワードを含めば適合」。一覧フローは body 非取得
 *   （ISRサイズ抑制の既存設計）のため、判定は prebuild（scripts/precompute-news-topic-gate.ts）で
 *   全件 body 込みで実行し、除外 slug を src/lib/generated/news-topic-exclusions.json に出力→runtime は
 *   Set 照合のみ（#102 precompute 整合・負荷ゼロ）。詳細ページのライブ判定も同一4フィールドで行い、
 *   両ゲートの判定テキストを常に一致させる（乖離すると一覧表示×詳細404の壊れリンクが生じる）。
 * 可逆性: microCMS は一切変更しない。誤除外は NEWS_TOPIC_ALLOWLIST に slug を1行追加すれば
 *   次 build から復帰する（precompute・詳細ページゲートの両方が allowlist を尊重）。
 */

import topicExclusions from './generated/news-topic-exclusions.json';

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

const EXCLUDED_SET: ReadonlySet<string> = new Set(
  (topicExclusions as { excludedSlugs: string[] }).excludedSlugs.filter(
    (s) => !NEWS_TOPIC_ALLOWLIST.includes(s)
  )
);

/** prebuild 計算済みの主題不適合 slug か（一覧・カテゴリ・年別・トップ・sitemap・generateStaticParams 用） */
export function isTopicExcludedNews(slug: string): boolean {
  return EXCLUDED_SET.has(slug);
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
