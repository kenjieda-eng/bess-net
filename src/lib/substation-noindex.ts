/**
 * src/lib/substation-noindex.ts — 変電所の詳細を noindex にするか（小さな直し便・2026-11-07）
 *
 * noindex にするのは 2 種類だけ。ほかの詳細は index のまま。
 *   1. 名称非公開（substation-undisclosed.ts・23 件）: 名前で探されず、題名に公表元の No. しか出ない（2026-11-05）。
 *   2. 凍結（更新を停止した・substations-frozen.json）: 公表元の今のデータに無く、当時の値のまま止めたページ。
 *      ページは開ける（「更新を停止しています」の注記もそのまま・canonical も今のまま）が、検索の入口にはしない（2026-11-07）。
 *
 * ★判定はここ 1 か所。page.tsx の robots・sitemap.ts の除外・verify:grid-pages がこの関数を通る。
 *   IndexNow の道具（scripts/indexnow-submit.ts）の NO_SUBMIT_SLUGS も同じ 2 種類（名称非公開の一覧＋凍結の slug）。
 */
import { isUndisclosedSubstation } from './substation-undisclosed';
import { isFrozenSubstation } from './substations-frozen';

export function isNoindexSubstation(s: { slug: string; name?: string | null }): boolean {
  return isUndisclosedSubstation(s) || isFrozenSubstation(s.slug);
}
