/**
 * src/lib/geo-distance.ts (依頼AA)
 *
 * 緯度経度間の距離計算ユーティリティ。
 * Haversine 公式（球面三角法）で 2 点間の大円距離を km 単位で返す。
 *
 * 用途:
 *  - /grid/{slug} に「この変電所周辺の蓄電所案件」セクションを表示するため、
 *    変電所と projects（緯度経度あり 150件想定）の距離を計算
 *  - /projects/{slug} に「接続変電所候補」セクションを表示するため、
 *    project と substations（中部 1,081件想定）の距離を計算
 *
 * 精度:
 *  - 地球を完全球体と仮定。極付近で若干の誤差あり
 *  - 半径 10km 以内のマッチングでは ±数十m〜100m 程度の誤差で実用十分（落とし穴 #80）
 */

/** 地球半径 (km) — 平均値 (WGS84 だと 6378.137～6356.752 km 間で揺らぐ) */
const EARTH_RADIUS_KM = 6371.0088;

/** 度 → ラジアン変換 */
function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * 2 点間の大円距離（Haversine, km）
 *
 * @param a 緯度経度 1
 * @param b 緯度経度 2
 * @returns 距離 (km)。NaN は呼び出し側で確認すること
 */
export function haversineDistanceKm(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number }
): number {
  // 入力 sanity check（NaN/undefined を距離 +Infinity 扱いで返す）
  if (
    typeof a.lat !== 'number' ||
    typeof a.lng !== 'number' ||
    typeof b.lat !== 'number' ||
    typeof b.lng !== 'number' ||
    Number.isNaN(a.lat) ||
    Number.isNaN(a.lng) ||
    Number.isNaN(b.lat) ||
    Number.isNaN(b.lng)
  ) {
    return Number.POSITIVE_INFINITY;
  }

  const lat1Rad = toRadians(a.lat);
  const lat2Rad = toRadians(b.lat);
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);

  // Haversine formula
  const sinHalfDLat = Math.sin(deltaLat / 2);
  const sinHalfDLng = Math.sin(deltaLng / 2);
  const h =
    sinHalfDLat * sinHalfDLat +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinHalfDLng * sinHalfDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));

  return EARTH_RADIUS_KM * c;
}

/**
 * 与えられた候補リストから半径 radiusKm 以内の項目を距離昇順で最大 limit 件返す。
 *
 * @param origin 中心点 (lat/lng)
 * @param candidates 候補リスト（各要素は lat/lng を持つ）
 * @param radiusKm 半径 (km)
 * @param limit 最大件数
 * @returns 距離付きで距離昇順にソート済みの配列
 */
export function findWithinRadius<T extends { lat: number; lng: number }>(
  origin: { lat: number; lng: number },
  candidates: T[],
  radiusKm: number,
  limit: number
): Array<T & { distanceKm: number }> {
  if (
    typeof origin.lat !== 'number' ||
    typeof origin.lng !== 'number' ||
    Number.isNaN(origin.lat) ||
    Number.isNaN(origin.lng)
  ) {
    return [];
  }
  const withDist: Array<T & { distanceKm: number }> = [];
  for (const c of candidates) {
    const d = haversineDistanceKm(origin, { lat: c.lat, lng: c.lng });
    if (d <= radiusKm) {
      withDist.push({ ...c, distanceKm: d });
    }
  }
  withDist.sort((a, b) => a.distanceKm - b.distanceKm);
  return withDist.slice(0, limit);
}
