/**
 * src/lib/grid-static-lists.ts — エリア/県ページ用の変電所リスト（build 時 precompute 由来）
 *
 * 落とし穴 #116 の恒久策（2026-08-16）:
 *   エリアページ・県ページが runtime microCMS を読むと、Next の fetch キャッシュにより
 *   「再取込直後のビルドが旧データのページを出力する」事故が起きる（東北で実測）。
 *   /grid が BM で precompute 参照に移行済みなので、同じ構造へ寄せて手作業チェックを不要にする。
 *   ※ `cache: 'no-store'` は静的ルート（/tracker/grid）を動的化して鉄則#2/#3 を壊すため使わない。
 *
 * データ元: scripts/precompute-substations.ts が書き出す src/lib/generated/grid-area-lists.json
 *   - 凍結変電所（substations-frozen.ts）は除外済み＝/grid の集計と件数が一致する
 *   - 並び順は従来の runtime 実装に合わせる（エリア=名称順／県=空容量の大きい順）
 */
import lists from './generated/grid-area-lists.json';
import type { Substation } from './microcms';

export type GridListItem = {
  id: string;
  slug: string;
  name: string;
  prefecture: string | null;
  facility_class: string | null;
  operator: string | null;
  area: string | null;
  voltage_primary_kv: number | null;
  voltage_secondary_kv: number | null;
  capacity_total_mw: number | null;
  cap_operational_mw: number | null;
  cap_avail_mw: number | null;
  n1_eligible: boolean;
  units: number | null;
  n1_capacity_mw: number | null;
  external_id: string | null;
  voltage_class: string | null;
  oc_possibility: string | null;
  latitude: number | null;
  longitude: number | null;
  last_updated: string | null;
  fetched_at: string | null;
  source_url: string | null;
};

const DATA = lists as unknown as {
  /** 生成日時（ISO）。precompute-substations.ts が書く。Gr11 で追加（旧生成物では undefined） */
  generated_at?: string;
  by_area: Record<string, GridListItem[]>;
  /** 県 → [エリア名, by_area 内の添字]。実体を二重に持たないための参照（生成JSONのサイズ半減） */
  pref_refs: Record<string, Array<[string, number]>>;
};

const _prefCache = new Map<string, GridListItem[]>();

/** 検索母集団の生成日時（ISO）。旧生成物では null */
export function getGridListsGeneratedAt(): string | null {
  return DATA.generated_at ?? null;
}

/** エリア（日本語名）の変電所一覧。未知エリアは空配列（縮退・404は作らない） */
export function getAreaSubstationsStatic(areaJp: string): GridListItem[] {
  return DATA.by_area[areaJp] ?? [];
}

/** 都道府県の変電所一覧。沖縄県は microCMS 側に県値がなくエリアで引き当てる（Gr10の既存仕様を踏襲） */
export function getPrefectureSubstationsStatic(prefecture: string): GridListItem[] {
  if (prefecture === '沖縄県') return DATA.by_area['沖縄'] ?? [];
  const hit = _prefCache.get(prefecture);
  if (hit) return hit;
  const refs = DATA.pref_refs[prefecture] ?? [];
  const list = refs.map(([areaJp, i]) => DATA.by_area[areaJp][i]).filter(Boolean);
  _prefCache.set(prefecture, list);
  return list;
}

/**
 * 既存コンポーネント（SubstationsBrowser 等）が `Substation` 型を要求するための変換。
 * microCMS の配列フィールド（operator/area/voltage_class/oc_possibility）へ戻すだけで、
 * 値そのものは precompute 済みのものを使う（runtime fetch は発生しない）。
 */
export function toSubstationShape(items: GridListItem[]): Substation[] {
  return items.map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    operator: s.operator ? [s.operator] : [],
    area: s.area ? [s.area] : [],
    prefecture: s.prefecture ?? undefined,
    // #119(2026-08-17): 原値（関西ローカル系・沖縄の設備区分）。落とすと一覧の
    // 「都道府県／設備区分」列が全行「—」になり、設備区分別ブレークダウンが消える。
    facility_class: s.facility_class ?? null,
    voltage_primary_kv: s.voltage_primary_kv ?? undefined,
    voltage_secondary_kv: s.voltage_secondary_kv ?? undefined,
    voltage_class: s.voltage_class ? [s.voltage_class] : [],
    capacity_total_mw: s.capacity_total_mw ?? undefined,
    cap_operational_mw: s.cap_operational_mw ?? undefined,
    cap_avail_mw: s.cap_avail_mw ?? undefined,
    n1_eligible: s.n1_eligible,
    units: s.units ?? undefined,
    n1_capacity_mw: s.n1_capacity_mw ?? undefined,
    external_id: s.external_id ?? undefined,
    oc_possibility: s.oc_possibility ? [s.oc_possibility] : [],
    latitude: s.latitude ?? undefined,
    longitude: s.longitude ?? undefined,
    last_updated: s.last_updated ?? undefined,
    source_url: s.source_url ?? '',
  })) as unknown as Substation[];
}
