/**
 * src/lib/grid-map-points.ts — 中部マップのピンの数（座標を持つ変電所の件数）の定義（小さな直し便・2026-11-17）
 *
 * ★定義は 1 か所（#121）。/grid/chubu/map の題名・件数、/grid/chubu の地図への案内、/grid の「中部マップ」の行が、ここを読む。
 *   以前は「約1,081箇所」「1,081箇所」と文に焼き込んでいて、8/19 に 1,082 件になってからも直っていなかった。
 * 値は precompute（scripts/precompute-substations.ts）が数えた index.json の summary.with_coords（凍結を除いた全国の件数。
 * 座標を持つのは中部電力パワーグリッドの変電所だけ）。サーバーのコンポーネントからだけ読む（index.json をクライアントの束に入れない）。
 */
import substationsIndex from '@/data/substations/index.json';

export const CHUBU_MAP_POINTS: number =
  (substationsIndex as unknown as { summary?: { with_coords?: number } }).summary?.with_coords ?? 0;
