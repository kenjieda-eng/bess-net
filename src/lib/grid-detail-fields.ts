/**
 * src/lib/grid-detail-fields.ts — 変電所の詳細（/grid/[slug]）が表示に使う microCMS の欄（変電所の詳細をビルド時の JSON から読む便・2026-11-04）
 *
 * precompute-substations がこの欄だけをビルド時に 1 回取って src/lib/generated/grid-detail/{エリア}.json に書き出し、
 * 詳細ページは実行時に microCMS を呼ばずにそこから読む。
 * ★#118 と同じ型の落とし穴: ページが使う欄がここに無いと、その欄だけ静かに「情報なし」になる。
 *   verify:grid-detail-static が page.tsx の `sub.〇〇` をすべて拾い、この一覧に入っているかを検査する。
 * 生成物を import しない（prebuild のスクリプトから読むため）。
 */
import type { Substation } from './microcms';

export const GRID_DETAIL_FIELDS = [
  'id', 'slug', 'name', 'operator', 'area', 'prefecture', 'city', 'address',
  'latitude', 'longitude', 'voltage_primary_kv', 'voltage_secondary_kv', 'voltage_class', 'units',
  'capacity_total_mw', 'cap_operational_mw', 'op_constraint', 'forecast_flow_mw',
  'cap_avail_mw', 'cap_avail_upper_mw', 'n1_eligible', 'n1_capacity_mw',
  'oc_possibility', 'oc_target_self', 'oc_target_upper', 'external_id', 'non_firm_eligible',
  'reinforcement_plan', 'conn_cost_typical', 'control_frequency', 'notes',
  'source_url', 'data_source_format', 'last_updated', 'fetched_at',
] as const;

/** 詳細のレコードの型（この欄だけ）。page.tsx や関数が一覧に無い欄を読むと tsc で止まる */
export type SubstationDetail = Pick<Substation, (typeof GRID_DETAIL_FIELDS)[number]>;

/** エリア名 → 詳細の JSON の分け先（エリアのページの slug と同じ） */
export const GRID_DETAIL_SHARD: Record<string, string> = {
  北海道: 'hokkaido', 東北: 'tohoku', 東京: 'tokyo', 中部: 'chubu', 北陸: 'hokuriku',
  関西: 'kansai', 中国: 'chugoku', 四国: 'shikoku', 九州: 'kyushu', 沖縄: 'okinawa',
};
/** エリアが無い・表に無いレコードの分け先 */
export const GRID_DETAIL_SHARD_OTHER = 'other';
