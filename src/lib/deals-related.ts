/**
 * src/lib/deals-related.ts — 売買・出資の公表事例（/tracker/deals）から当サイトの記事・プロジェクトDB へ結ぶときの「表示中か」の判定
 * （売買事例の一覧便・2026-11-10。設計 3-12 の 4。画面と scripts/verify-deals.ts が同じ関数を使う）
 *
 * - ニュース: 主題ゲートの除外（生成物）・除外リスト・旧 news-2026-NNN-* の 410（middleware と同じ allowlist）に当たらないもの。
 * - プロジェクト: 除外リストと 301 の元に当たらないもの。
 * - 生成物（news-topic-exclusions.json）を読むので、prebuild では build:news-topic-gate の後に使う（verify-deals は後段）。
 */
import { isTopicExcludedNews } from '@/lib/news-topic-gate';
import { isExcludedNews } from '@/lib/news-excluded';
import { isExcludedProject } from '@/lib/projects-excluded';
import { PROJECTS_301_SOURCE_SLUGS } from '@/lib/projects-301';
import legacyAllowlist from '@/data/legacy-news-allowlist.json';

const LEGACY = new Set(legacyAllowlist as string[]);

/** middleware の 410（/news/news-2026-{数字}-…・allowlist に無いもの）に当たるか */
function isGoneNews(slug: string): boolean {
  return /^news-2026-\d+-.+$/.test(slug) && !LEGACY.has(slug);
}

export function isVisibleNewsSlug(slug: string | null): slug is string {
  if (!slug) return false;
  return !isTopicExcludedNews(slug) && !isExcludedNews(slug) && !isGoneNews(slug);
}

export function isVisibleProjectSlug(slug: string): boolean {
  return !isExcludedProject(slug) && !PROJECTS_301_SOURCE_SLUGS.has(slug);
}
