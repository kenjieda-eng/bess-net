/**
 * src/lib/grid-detail-static.ts — 変電所の詳細（/grid/[slug]）をビルド時の JSON から読む（変電所の詳細をビルド時の JSON から読む便・2026-11-04）
 *
 * ★実行時に microCMS を呼ばない（鉄則 #3・落とし穴 #102）。このファイルとその読み込み先は microcms.ts を値として import しない
 *   （型だけは可）。verify:grid-detail-static が /grid/[slug] から読み込み先をたどって検査する。
 * 以前は getSubstationBySlug（実行時の microCMS）で、429 を受けると null → notFound() の 404 が revalidate つきでキャッシュされ、
 * 表示できていたページが最大 1 時間 404 に置き換わっていた（Next 14.2 base-server.js 1462 行）。
 * データは precompute-substations が prebuild で書き出す（生の microCMS の形・凍結も含む）。毎朝の再ビルドで入れ替わる。
 */
import detailIndex from './generated/grid-detail-index.json';
import type { SubstationDetail } from './grid-detail-fields';
import type { NearbyProject } from './nearby-projects';

type DetailIndex = {
  generated_at: string;
  count: number;
  shard_of: Record<string, string>;
  with_coords: string[];
  nearby_projects: Record<string, NearbyProject[]>;
};
const INDEX = detailIndex as unknown as DetailIndex;

const shardCache = new Map<string, Promise<Record<string, SubstationDetail>>>();
/** エリアの 1 本だけを読む（webpack が分け先ごとに別のチャンクにする） */
function loadShard(shard: string): Promise<Record<string, SubstationDetail>> {
  let p = shardCache.get(shard);
  if (!p) {
    p = import(`./generated/grid-detail/${shard}.json`).then((m) => (m.default ?? m) as Record<string, SubstationDetail>);
    // 読み込みに失敗した Promise は持ち続けない（次の要求で読み直す）
    p.catch(() => shardCache.delete(shard));
    shardCache.set(shard, p);
  }
  return p;
}

/** slug の変電所（microCMS の形）。JSON に無い slug は null＝本当に無いページ（404） */
export async function getSubstationDetailStatic(slug: string): Promise<SubstationDetail | null> {
  const shard = INDEX.shard_of[slug];
  if (!shard) return null;
  return (await loadShard(shard))[slug] ?? null;
}

/** 事前生成する変電所（座標のあるもの＝中部）。以前の getSubstationSlugsWithCoords と同じ選び方 */
export function substationSlugsWithCoordsStatic(): { slug: string }[] {
  return INDEX.with_coords.map((slug) => ({ slug }));
}

/** 近くの蓄電所案件（座標のある変電所だけ・半径 10km・5 件）。ビルド時に nearbyProjectsFrom で計算した結果 */
export function nearbyProjectsStatic(slug: string): NearbyProject[] {
  return INDEX.nearby_projects[slug] ?? [];
}
