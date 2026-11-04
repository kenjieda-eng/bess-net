/**
 * src/lib/nearby-projects.ts — 変電所の近くの蓄電所案件（半径内・距離の近い順）を候補から選ぶ純関数
 *
 * 変電所の詳細をビルド時の JSON から読む便（2026-11-04）で related-cards.ts の getNearbyProjects から切り出した。
 * 実行時（related-cards）とビルド時（precompute-substations）が同じ選び方を使う（#121）。
 * microCMS を読まない・生成物を import しない（prebuild のスクリプトから読むため）。
 */
import { findWithinRadius } from './geo-distance';
import { isListExcludedProject } from './projects-excluded';
import type { ProjectGeoPoint } from './microcms';

/** 緯度経度付き project + 距離（km） */
export type NearbyProject = ProjectGeoPoint & { distanceKm: number };

export function nearbyProjectsFrom(
  candidates: ProjectGeoPoint[],
  origin: { latitude: number | null | undefined; longitude: number | null | undefined },
  opts: { radiusKm?: number; limit?: number; excludeSlug?: string } = {}
): NearbyProject[] {
  const { radiusKm = 10, limit = 5, excludeSlug } = opts;
  // 早期 return: origin に緯度経度がない場合は空配列
  if (
    typeof origin.latitude !== 'number' ||
    typeof origin.longitude !== 'number' ||
    Number.isNaN(origin.latitude) ||
    Number.isNaN(origin.longitude)
  ) {
    return [];
  }
  // findWithinRadius 用に lat/lng エイリアスを付与
  // Pj2-G ■3.5（2026-09-08・ユウ裁定）: 一覧除外レコード（301元＋案件性なし）を近隣カードの候補から外す。
  //   301元は middleware が canonical へ 301 するため、カードのリンクが「クリックすると別 slug に飛ぶ」状態になり、
  //   同一設備が canonical と重複して並ぶこともある。/projects 一覧・sitemap は既に除外済みで、
  //   近隣カードだけが未配線だった（表示側のみの変更・microCMS レコードは不変更）。
  const aliased = candidates
    .filter((c) => c.slug !== excludeSlug && !isListExcludedProject(c.slug))
    .map((c) => ({ ...c, lat: c.latitude, lng: c.longitude }));
  const matches = findWithinRadius(
    { lat: origin.latitude, lng: origin.longitude },
    aliased,
    radiusKm,
    limit
  );
  // 余分な lat/lng エイリアスを取り除き ProjectGeoPoint + distanceKm に戻す
  return matches.map(({ lat: _lat, lng: _lng, distanceKm, ...rest }) => ({
    ...(rest as ProjectGeoPoint),
    distanceKm,
  }));
}
