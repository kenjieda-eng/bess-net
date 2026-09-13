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
 * 分離（金曜#6 追修便④ ■1・2026-09-13）: 判定語・判定関数は生成物に依存しない news-topic-patterns.ts へ移し、
 *   ここは生成物（除外 slug 集合）を読む部分だけを持つ。既存の import 先を変えないため再エクスポートする。
 *   このファイルは生成物を import するので、prebuild では build:news-topic-gate を先頭で走らせる
 *   （microcms.ts 経由でこのファイルを読む他の precompute より前に出力を作る）。
 */

import topicExclusions from './generated/news-topic-exclusions.json';
import { NEWS_TOPIC_ALLOWLIST } from './news-topic-patterns';

export {
  TOPIC_PATTERNS,
  NEWS_TOPIC_ALLOWLIST,
  isOnTopicNewsText,
  isOnTopicNewsArticle,
} from './news-topic-patterns';

const EXCLUDED_SET: ReadonlySet<string> = new Set(
  (topicExclusions as { excludedSlugs: string[] }).excludedSlugs.filter(
    (s) => !NEWS_TOPIC_ALLOWLIST.includes(s)
  )
);

/** prebuild 計算済みの主題不適合 slug か（一覧・カテゴリ・年別・トップ・sitemap・generateStaticParams 用） */
export function isTopicExcludedNews(slug: string): boolean {
  return EXCLUDED_SET.has(slug);
}
