/**
 * src/lib/grid-search-core.ts — /grid/search の検索コア（precompute メモリ内フィルタ）
 *
 * Gr11（2026-08-25・ユウ裁定 A案）:
 *   従来の searchSubstationsByFilters は runtime で microCMS を叩いていた（force-dynamic）。
 *   CLAUDE.md 2-2 Q3「ユーザー入力からの検索 → 既に取得した list を絞り込む」に沿い、
 *   母集団を precompute（grid-area-lists.json・凍結除外済み・build 時生成）へ差し替える。
 *   ★差し替えるのはデータ源だけ。描画は現行どおりサーバ側（結果一覧は初期DOMに載る=#107）。
 *
 * 現行との意味の一致（reports/grid-search-parity-2026-08-25.md で全クエリ突合済み）:
 *   - q / operator / area: 部分一致（microCMS [contains] と同じ）
 *   - voltage_min: voltage_primary_kv >= v（null は対象外）
 *   - 空容量: n1_eligible=true のときは n1_capacity_mw、それ以外は cap_avail_mw（落とし穴 #61）。
 *     null は「条件に一致しない」＝対象外（microCMS の数値比較と同じ）
 *   - 条件ゼロなら空を返す（全件表示はしない）
 *
 * 現行との意図的な差分（parity レポートに記録）:
 *   1. totalCount から凍結変電所を除外。現行は totalCount に凍結を数えつつ行は隠しており
 *      「件数と表示が食い違う」自己不整合だった。母集団（grid-area-lists）は凍結除外済みのため
 *      新実装では件数・表示とも凍結ゼロで一貫する（/grid の集計 8,345 とも一致）。
 *   2. 同値の並び（tie）: 現行は microCMS の内部順に依存していた（未定義）。
 *      「空容量降順 → 名称 → slug」に固定（ユウ条件2の指示どおり変更として報告）。
 */
import { getAreaSubstationsStatic, type GridListItem } from './grid-static-lists';
import { AREA_META } from '@/app/grid/[slug]/area-meta';
import substationsIndex from '@/data/substations/index.json';

export type GridSearchFilters = {
  q?: string;
  area?: string;
  prefecture?: string;
  voltage_min?: string;
  cap_avail_min?: string;
  cap_avail_max?: string;
  n1_eligible?: string;
  operator?: string;
};

export type GridSearchRow = GridListItem & {
  /** 同名グループ内の識別子（同名が結果に複数あるときのみ設定。単独行では undefined） */
  disambiguator?: string;
};

export type GridSearchOutcome = {
  items: GridSearchRow[];
  totalCount: number;
  truncated: boolean;
  /** 一致した行のうち、適用中の空容量フィールドが未公表（null）の件数 */
  capUnpublishedInMatches: number;
};

const SEARCH_LIMIT = 200;

/** 母集団: 全エリアの precompute リスト（凍結除外済み・build 時生成） */
let _all: GridListItem[] | null = null;
export function getSearchPopulation(): GridListItem[] {
  if (_all) return _all;
  const areas = Object.values(AREA_META).map((m) => m.areaJp);
  _all = areas.flatMap((a) => getAreaSubstationsStatic(a));
  return _all;
}

/** 母集団の件数（= /grid の全件数と一致するはず。ページ側の整合検査に使う） */
export function getSearchPopulationTotal(): number {
  return getSearchPopulation().length;
}

/** index.json 側の全件数（表示用。母集団と一致しない場合はページ側で通知） */
export const GRID_INDEX_TOTAL: number = (substationsIndex as { total: number }).total;

/** データに実在する都道府県（Gr10 で県扱いから外した区分は prefecture=null なので自然に出ない） */
export function getAvailablePrefectures(): Array<{ pref: string; count: number }> {
  const m = new Map<string, number>();
  for (const i of getSearchPopulation()) {
    if (i.prefecture) m.set(i.prefecture, (m.get(i.prefecture) ?? 0) + 1);
  }
  return [...m.entries()]
    .map(([pref, count]) => ({ pref, count }))
    .sort((a, b) => a.pref.localeCompare(b.pref, 'ja'));
}

/** 都道府県の区分を一切持たない事業者（例: 関西電力送配電）。select 下の注記に使う */
export function getOperatorsWithoutPrefecture(): Array<{ operator: string; area: string; count: number }> {
  const byOp = new Map<string, { withPref: number; total: number; area: string }>();
  for (const i of getSearchPopulation()) {
    const op = i.operator ?? '';
    if (!op) continue;
    const e = byOp.get(op) ?? { withPref: 0, total: 0, area: i.area ?? '' };
    e.total++;
    if (i.prefecture) e.withPref++;
    if (!e.area && i.area) e.area = i.area;
    byOp.set(op, e);
  }
  return [...byOp.entries()]
    .filter(([, v]) => v.withPref === 0 && v.total > 0)
    .map(([operator, v]) => ({ operator, area: v.area, count: v.total }));
}

/** 空容量が未公表（null）の全件数（注記用。焼き込まずデータから算出） */
export function getCapUnpublishedTotal(): number {
  return getSearchPopulation().filter((i) => i.cap_avail_mw === null || i.cap_avail_mw === undefined).length;
}

/** external_id 末尾の枝番（例 "kyuden_14_13(2)" → "(2)"）。無ければ null */
function extBranch(externalId: string | null): string | null {
  if (!externalId) return null;
  const m = externalId.match(/(\([0-9０-９]+\))\s*$/);
  return m ? m[1].normalize('NFKC') : null;
}

/**
 * 同名グループの識別子付与（Gr11-②）。
 * 優先順: 二次電圧（常に行に表示するため識別子は不要）→ 公式Noの枝番 → 変圧器台数/設備容量 → slug。
 * ★二次電圧は全行に表示されるので、ここでは「二次電圧でも同値」のグループにだけ追加識別子を付ける。
 *   同名が1件しかない行には何も付けない。
 */
export function attachDisambiguators(items: GridListItem[]): GridSearchRow[] {
  const byName = new Map<string, GridListItem[]>();
  for (const i of items) {
    const k = (i.name ?? '').trim();
    (byName.get(k) ?? byName.set(k, []).get(k)!).push(i);
  }
  return items.map((i) => {
    const group = byName.get((i.name ?? '').trim()) ?? [];
    if (group.length <= 1) return i as GridSearchRow;
    // 同名グループ。二次電圧が一意なら追加識別子は不要（行に常時表示されるため）
    const sameSecondary = group.filter((g) => g.voltage_secondary_kv === i.voltage_secondary_kv);
    if (sameSecondary.length <= 1) return i as GridSearchRow;
    // 二次電圧でも同値 → 公式Noの枝番
    const br = extBranch(i.external_id);
    if (br && sameSecondary.filter((g) => extBranch(g.external_id) === br).length === 1) {
      return { ...i, disambiguator: br };
    }
    // 枝番でも割れない → 台数/設備容量
    if (i.units != null && sameSecondary.filter((g) => g.units === i.units).length === 1) {
      return { ...i, disambiguator: `${i.units}台` };
    }
    if (i.capacity_total_mw != null && sameSecondary.filter((g) => g.capacity_total_mw === i.capacity_total_mw).length === 1) {
      return { ...i, disambiguator: `${i.capacity_total_mw}MW` };
    }
    // 最後は必ず一意になる slug
    return { ...i, disambiguator: i.slug };
  });
}

/** 現行 searchSubstationsByFilters と同じ意味の絞り込み＋ソート */
export function searchGridStatic(filters: GridSearchFilters): GridSearchOutcome {
  const q = (filters.q || '').trim();
  const area = (filters.area || '').trim();
  const prefecture = (filters.prefecture || '').trim();
  const voltageMin = (filters.voltage_min || '').trim();
  const capMin = (filters.cap_avail_min || '').trim();
  const capMax = (filters.cap_avail_max || '').trim();
  const wantN1 = (filters.n1_eligible || '').trim() === 'true';
  const operator = (filters.operator || '').trim();

  const hasAny = !!(q || area || prefecture || voltageMin || capMin || capMax || wantN1 || operator);
  if (!hasAny) return { items: [], totalCount: 0, truncated: false, capUnpublishedInMatches: 0 };

  const vMin = voltageMin && Number.isFinite(Number(voltageMin)) ? Number(voltageMin) : null;
  const cMin = capMin && Number.isFinite(Number(capMin)) ? Number(capMin) : null;
  const cMax = capMax && Number.isFinite(Number(capMax)) ? Number(capMax) : null;
  const capField = (i: GridListItem): number | null => (wantN1 ? i.n1_capacity_mw : i.cap_avail_mw);

  const matched = getSearchPopulation().filter((i) => {
    if (q && !(i.name ?? '').includes(q)) return false;
    if (area && !(i.area ?? '').includes(area)) return false;
    if (prefecture && i.prefecture !== prefecture) return false;
    if (operator && !(i.operator ?? '').includes(operator)) return false;
    if (vMin !== null) {
      if (i.voltage_primary_kv === null || i.voltage_primary_kv === undefined) return false;
      if (!(i.voltage_primary_kv > vMin - 0.001)) return false;
    }
    if (wantN1 && i.n1_eligible !== true) return false;
    if (cMin !== null) {
      const v = capField(i);
      if (v === null || v === undefined || !(v > cMin - 0.001)) return false;
    }
    if (cMax !== null) {
      const v = capField(i);
      if (v === null || v === undefined || !(v < cMax + 0.001)) return false;
    }
    return true;
  });

  // 並び: 空容量（n1=true のときは N-1 可能量）降順。null は末尾。tie は 名称 → slug で固定
  const sortKey = (i: GridListItem) => {
    const v = capField(i);
    return v === null || v === undefined ? -Infinity : v;
  };
  const sorted = [...matched].sort(
    (a, b) => sortKey(b) - sortKey(a) || (a.name ?? '').localeCompare(b.name ?? '', 'ja') || a.slug.localeCompare(b.slug)
  );

  const capUnpublishedInMatches = matched.filter((i) => {
    const v = capField(i);
    return v === null || v === undefined;
  }).length;

  const items = attachDisambiguators(sorted.slice(0, SEARCH_LIMIT));
  return {
    items,
    totalCount: matched.length,
    truncated: matched.length > items.length,
    capUnpublishedInMatches,
  };
}
