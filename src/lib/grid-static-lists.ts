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
import type { N1Status } from './n1-status-label';

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
  /** N1b: N-1 の表示区分（precompute で n1StatusOf を当てた値・#121） */
  n1_status: N1Status;
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

/**
 * 都道府県の変電所一覧（空容量の大きい順）。pref_refs は precompute が空容量の降順に並べた参照。
 * 沖縄県も pref_refs にある（正規化で全件が沖縄県）。以前はここで by_area（名前順）を返していて、沖縄県だけ降順でなかった（2026-11-02 是正）。
 */
export function getPrefectureSubstationsStatic(prefecture: string): GridListItem[] {
  const hit = _prefCache.get(prefecture);
  if (hit) return hit;
  const refs = DATA.pref_refs[prefecture] ?? [];
  const list = refs.map(([areaJp, i]) => DATA.by_area[areaJp][i]).filter(Boolean);
  _prefCache.set(prefecture, list);
  return list;
}

/** 公式の No.: external_id の社名などの前置きを外した部分（kyuden_23_20(2) → 20(2)・東京は external_id がそのまま No.） */
const officialNo = (externalId: string | null) => (externalId ? externalId.slice(externalId.lastIndexOf('_') + 1) : null);

/**
 * 同名の判定のキー（小さな直し便・2026-11-05）: 名前から「変電所」を外して比べる。
 * 以前は一次の名前のまま比べていたので、東京の「東山梨」と「東山梨変電所」のような組を同名と見なせず、
 * 名前便（2026-11-02）で「東山梨」に変電所を足すと題名が重なった（足さない側に倒していた＝NAME_WOULD_COLLIDE）。
 * ★今ある組は東京の 4 組だけで、4 組とも裁定待ち（SAME_NAME_RULING_PENDING）なので、今は誰の題名も変わらない。
 *   再取込でほかに組ができたら、電圧などを添えて見分ける（11/2 の小さな直し便と同じ形）。
 */
export const SAME_NAME_RULING_PENDING: ReadonlySet<string> = new Set([
  // 東山梨: 500/154・3 台・2,250MW・運用 1,705MW・潮流 -1,037 がすべて同じ＝重複の候補（No. だけ違う・#111 の系列別ビュー）
  'tpg-1713', 'tpg-1549',
  // 関谷・谷村・北巨摩: 素の名前の方は配電用変電所の行で電圧が「—」＝電圧で分けられない（要判断）
  'tpg-0022', 'tpg-0016', 'tpg-1610', 'tpg-1550', 'tpg-1591', 'tpg-1554',
]);
export function sameNameKey(s: { slug: string; name: string }): string {
  return SAME_NAME_RULING_PENDING.has(s.slug) ? s.name : s.name.replace(/変電所/g, '');
}

/**
 * 同じエリアで同じ名前の変電所を見分ける語（slug → 語）。名前が重ならない変電所は入らない＝題名を変えない。
 * 電圧（66/22kV）を添え、組の中で電圧だけでは見分けられないものは公式の No. を、No. も同じもの（#115: 東北 7307 など）は設備容量を足す。
 */
export function nameQualifiers(rows: GridListItem[]): Map<string, string> {
  const out = new Map<string, string>();
  const groups = new Map<string, GridListItem[]>();
  for (const s of rows) groups.set(sameNameKey(s), [...(groups.get(sameNameKey(s)) ?? []), s]);
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    const volt = (s: GridListItem) => (s.voltage_primary_kv == null ? '' : `${[s.voltage_primary_kv, s.voltage_secondary_kv].filter((v) => v != null).join('/')}kV`);
    const count = (f: (s: GridListItem) => string, v: string) => group.filter((s) => f(s) === v).length;
    const no = (s: GridListItem) => officialNo(s.external_id) ?? '';
    for (const s of group) {
      const parts = [volt(s)];
      if (!volt(s) || count(volt, volt(s)) > 1) {
        parts.push(no(s) ? `No.${no(s)}` : '');
        if (count(no, no(s)) > 1 && s.capacity_total_mw != null) parts.push(`${s.capacity_total_mw}MW`);
      }
      out.set(s.slug, parts.filter(Boolean).join('・'));
    }
  }
  return out;
}

let _bySlug: Map<string, GridListItem> | null = null;
/** slug の一覧の行（凍結は入らない）。名前しか持たない参照（index.json の pref_top など）から表示名を出すのに使う */
export function getListItemBySlug(slug: string): GridListItem | undefined {
  _bySlug ??= new Map(Object.values(DATA.by_area).flatMap((rows) => rows.map((s) => [s.slug, s] as const)));
  return _bySlug.get(slug);
}

let _qualifiers: Map<string, string> | null = null;
/** 変電所の詳細の題名・h1 に添える語。名前が重ならない変電所は null */
export function substationNameQualifier(slug: string): string | null {
  _qualifiers ??= new Map(Object.values(DATA.by_area).flatMap((rows) => [...nameQualifiers(rows)]));
  return _qualifiers.get(slug) ?? null;
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
    // N1b: 落とすと一覧の N-1 列が黙って「不可」に戻る（#118 と同型）。verify:grid-fields の SHAPE_CRITICAL に入れてある
    n1_status: s.n1_status,
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
