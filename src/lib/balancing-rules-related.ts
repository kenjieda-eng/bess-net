/**
 * src/lib/balancing-rules-related.ts — 制度変更トラッカーの関連リンク（裁定 T8-R7）。ページ（ビルド時）と verify の両方が使う。
 *
 * - 表示中の解説・政策イベントだけを返す（explainer-excluded・events-excluded で外したものは返さない）。外部 API 0（ビルド時のコードの一覧だけ）。
 * - 政策イベントの詳細ページは POLICY_DETAIL_SLUGS の 9 件だけ（dynamicParams=false＝それ以外の /policy-calendar/<slug> は 404）なので、
 *   ほかは /policy-calendar（一覧）へ結ぶ。
 * - クライアントのバンドルに除外の一覧を入れないよう、表示用の純関数（src/lib/balancing-rules.ts）とは分けている。
 */
import type { BalancingRule } from '@/data/balancing-rules';
import { isExcludedExplainer } from './explainer-excluded';
import { isExcludedEvent } from './events-excluded';
import { POLICY_DETAIL_SLUG_SET } from './policy-utils';

export type VisibleRelated = {
  explainers: { slug: string; title: string }[];
  policyEvents: { slug: string; title: string; href: string }[];
};

export function visibleRelated(r: Pick<BalancingRule, 'related'>): VisibleRelated {
  return {
    explainers: r.related.explainer.filter((e) => !isExcludedExplainer(e.slug)),
    policyEvents: r.related.policyEvent
      .filter((e) => !isExcludedEvent(e.slug))
      .map((e) => ({ ...e, href: POLICY_DETAIL_SLUG_SET.has(e.slug) ? `/policy-calendar/${e.slug}` : '/policy-calendar' })),
  };
}
