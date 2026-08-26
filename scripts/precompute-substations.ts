#!/usr/bin/env tsx
/**
 * scripts/precompute-substations.ts
 *
 * 依頼AR 事前計算スクリプト (落とし穴 #98 / 鉄則 #3 完全準拠)
 *
 * 処理:
 *   1. microCMS から substations 全件取得（現在10社8,225件・build 中 1 回のみ）
 *   2. 都道府県別 47 JSON に分割
 *   3. 各 JSON は軽量化 (距離計算 + UI 表示に必要なフィールドのみ)
 *   4. index.json で全体メタ + 件数集計
 *
 * 落とし穴対策:
 *   - #79 (build timeout): 単一スクリプト、API 呼び出し最小
 *   - #98 (集中アクセス): SSR では microCMS 不使用、build 時 1 回のみ
 *
 * 実行:
 *   MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/precompute-substations.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { client, type Substation } from '../src/lib/microcms';
import { FROZEN_SUBSTATION_SLUGS } from '../src/lib/substations-frozen';
import { MICROCMS_PAGE_LIMIT, MICROCMS_MAX_OFFSET } from '../src/lib/constants';
// Gr10(2026-08-11): 系統区分・設備区分が prefecture に入っている社があるため正規化する
import { normalizeSubstationPlace } from '../src/lib/grid-prefecture';

// 出力スキーマ (距離計算 + UI で必要な最小フィールド)
//
// ★★ 一覧に出る列 ＝ このスキーマに必ず入れる（2026-08-16・#118）★★
//   エリア/県ページは runtime microCMS をやめてこのデータだけで描画する（#116 恒久策）。
//   そのため「表示に使う列」がここに無いと、その列だけ静かに「—」になる（実際に台数・
//   N-1電制適用可能量で発生）。列を増やすときは必ず両方を更新すること。
//
//   一覧が参照するフィールド（2026-08-16 実査・grep で全数確認）:
//     SubstationsBrowser: id, slug, name, prefecture, area, voltage_class, units,
//                         cap_avail_mw, oc_possibility, external_id(検索), n1_eligible
//     AreaPage:           上記 ＋ n1_capacity_mw, last_updated, source_url,
//                         capacity_total_mw, cap_operational_mw, facility_class
//     県ページ:            slug, name, operator, area, prefecture, facility_class,
//                         voltage_primary_kv, cap_avail_mw, n1_eligible
//   ＋ 地図/距離計算: latitude, longitude ／ 基準日表示: fetched_at
export interface LiteSubstation {
  /** content id (microCMS の内部 id) */
  id: string;
  /** slug (例: kyu-879) */
  slug: string;
  /** 変電所名 (例: 壱岐) */
  name: string;
  /** 都道府県 (例: 福岡県)。Gr10: 正規化済み。確定できない場合は null（推測で埋めない） */
  prefecture: string | null;
  /** Gr10: 原値が都道府県でなかった場合の設備区分（「関西ローカル系」「沖縄本島66kV系・配変」等） */
  facility_class: string | null;
  /** 送配電事業者 (1 番目を採用) */
  operator: string | null;
  /** エリア (関東/関西/北海道等) */
  area: string | null;
  /** 一次電圧 kV */
  voltage_primary_kv: number | null;
  /** 二次電圧 kV */
  voltage_secondary_kv: number | null;
  /** 設備合計容量 MW */
  capacity_total_mw: number | null;
  /** 運用容量 MW */
  cap_operational_mw: number | null;
  /** 空き容量 MW */
  cap_avail_mw: number | null;
  /** N-1 電制適用可 */
  n1_eligible: boolean;
  /** 変圧器台数（一覧の「台数」列） */
  units: number | null;
  /** N-1 電制適用可能量 MW（エリアページの N-1電制Top20表） */
  n1_capacity_mw: number | null;
  /** 公表側の設備No.（SubstationsBrowser の検索対象） */
  external_id: string | null;
  /** 電圧階級（1番目・「154kV系」等）。BM(2026-08-16): /grid の電圧階級別集計をここから作る */
  voltage_class: string | null;
  /** 当サイトへの取込日（データ基準日の表示に使用・2026-08-08 Gr2是正） */
  fetched_at: string | null;
  /** 出力制御の可能性 (1 番目を採用) */
  oc_possibility: string | null;
  /** 緯度 (存在する場合のみ) */
  latitude: number | null;
  /** 経度 (存在する場合のみ) */
  longitude: number | null;
  /** 最終更新日 ISO */
  last_updated: string | null;
  /** 出典URL（エリアページの「サンプルCSV直リンク」に使う） */
  source_url: string | null;
}

// 取得対象 fields (cost 最適化: 必要なものだけ)
const FETCH_FIELDS = [
  'id', 'slug', 'name', 'prefecture', 'operator', 'area',
  'voltage_primary_kv', 'voltage_secondary_kv', 'voltage_class',
  'capacity_total_mw', 'cap_operational_mw', 'cap_avail_mw',
  'n1_eligible', 'n1_capacity_mw', 'units', 'external_id',
  'oc_possibility', 'latitude', 'longitude',
  'last_updated', 'fetched_at', 'area', 'source_url',
].join(',');

async function fetchAllSubstationsLight(): Promise<LiteSubstation[]> {
  const all: LiteSubstation[] = [];
  const limit = MICROCMS_PAGE_LIMIT;
  for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += limit) {
    const data = await client.getList<Substation>({
      endpoint: 'substations',
      queries: { limit, offset, fields: FETCH_FIELDS, orders: 'slug' },
    });
    for (const s of data.contents) {
      all.push({
        id: s.id,
        slug: s.slug,
        name: s.name,
        ...(() => {
          const place = normalizeSubstationPlace(
            s.prefecture,
            Array.isArray(s.area) && s.area.length > 0 ? s.area[0] : null
          );
          return { prefecture: place.prefecture, facility_class: place.facilityClass };
        })(),
        operator: Array.isArray(s.operator) && s.operator.length > 0 ? s.operator[0] : null,
        area: Array.isArray(s.area) && s.area.length > 0 ? s.area[0] : null,
        voltage_primary_kv: typeof s.voltage_primary_kv === 'number' ? s.voltage_primary_kv : null,
        voltage_secondary_kv: typeof s.voltage_secondary_kv === 'number' ? s.voltage_secondary_kv : null,
        capacity_total_mw: typeof s.capacity_total_mw === 'number' ? s.capacity_total_mw : null,
        cap_operational_mw: typeof s.cap_operational_mw === 'number' ? s.cap_operational_mw : null,
        cap_avail_mw: typeof s.cap_avail_mw === 'number' ? s.cap_avail_mw : null,
        n1_eligible: s.n1_eligible === true,
        units: typeof s.units === 'number' ? s.units : null,
        n1_capacity_mw: typeof s.n1_capacity_mw === 'number' ? s.n1_capacity_mw : null,
        external_id: typeof s.external_id === 'string' ? s.external_id : null,
        voltage_class: Array.isArray(s.voltage_class) && s.voltage_class.length > 0
          ? s.voltage_class[0] : null,
        oc_possibility: Array.isArray(s.oc_possibility) && s.oc_possibility.length > 0
          ? s.oc_possibility[0] : null,
        source_url: typeof s.source_url === 'string' ? s.source_url : null,
        latitude: typeof s.latitude === 'number' ? s.latitude : null,
        longitude: typeof s.longitude === 'number' ? s.longitude : null,
        last_updated: s.last_updated ?? null,

        fetched_at: typeof (s as unknown as { fetched_at?: string }).fetched_at === 'string' ? (s as unknown as { fetched_at: string }).fetched_at : null,
      });
    }
    if (data.contents.length < limit) break;
  }
  return all;
}

// 47 都道府県名 → ファイル名安全 slug (日本語そのまま使用)
function prefSlug(pref: string | null): string {
  if (!pref) return 'unknown';
  return pref.replace(/[/\\?%*:|"<>]/g, '_');
}

async function main(): Promise<void> {
  console.log('[precompute-substations] microCMS から substations 取得...');
  const t0 = Date.now();
  const all = await fetchAllSubstationsLight();
  const tFetch = Date.now() - t0;
  console.log(`  ${all.length} 件取得 (${tFetch}ms、~${(tFetch/1000).toFixed(1)}s)`);

  // 都道府県別分割
  const byPref = new Map<string, LiteSubstation[]>();
  let withCoords = 0;
  let withoutCoords = 0;
  for (const s of all) {
    const key = prefSlug(s.prefecture);
    if (!byPref.has(key)) byPref.set(key, []);
    byPref.get(key)!.push(s);
    if (s.latitude !== null && s.longitude !== null) withCoords++;
    else withoutCoords++;
  }

  // ファイル書き出し
  const outDir = path.join(process.cwd(), 'src', 'data', 'substations');
  // 既存ファイル削除 (古いデータが残らないように)
  if (fs.existsSync(outDir)) {
    for (const f of fs.readdirSync(outDir)) {
      if (f.endsWith('.json')) fs.unlinkSync(path.join(outDir, f));
    }
  }
  fs.mkdirSync(outDir, { recursive: true });

  let totalSize = 0;
  let maxSize = 0;
  let maxSizePref = '';
  const byPrefCount: Record<string, number> = {};
  const byPrefSize: Record<string, number> = {};

  for (const [pref, list] of byPref.entries()) {
    const filePath = path.join(outDir, `${pref}.json`);
    // データを最小化 (JSON.stringify 圧縮、indent なし)
    const json = JSON.stringify(list);
    fs.writeFileSync(filePath, json);
    const size = Buffer.byteLength(json, 'utf8');
    totalSize += size;
    byPrefCount[pref] = list.length;
    byPrefSize[pref] = size;
    if (size > maxSize) {
      maxSize = size;
      maxSizePref = pref;
    }
  }

  // index.json: メタ + by_pref 集計
  // Gr2是正(2026-08-08): エリア別のデータ基準日を集計してデータ側から供給する。
  // last_updated = 各社の公表時点 / fetched_at = 当サイトの取込日。
  // エリア内で値がばらつく場合は最大値（最新）を採用し、variants 数を持たせて注記表示に使う。
  const areaDates: Record<string, { last_updated: string | null; fetched_at: string | null; last_updated_variants: number; count: number }> = {};
  for (const s of all) {
    // 凍結変電所（更新停止・substations-frozen.ts）は件数・基準日の集計から除外（2026-08-16裁定）。
    // レコード自体は県別JSON・詳細ページ・sitemapに残る（URL保全）。
    if (FROZEN_SUBSTATION_SLUGS.has(s.slug)) continue;
    const area = s.area || '(不明)';
    const cur = (areaDates[area] ??= { last_updated: null, fetched_at: null, last_updated_variants: 0, count: 0 });
    cur.count += 1;
    const lu = s.last_updated ? s.last_updated.slice(0, 10) : null;
    const fa = s.fetched_at ? s.fetched_at.slice(0, 10) : null;
    if (lu && (!cur.last_updated || lu > cur.last_updated)) cur.last_updated = lu;
    if (fa && (!cur.fetched_at || fa > cur.fetched_at)) cur.fetched_at = fa;
  }
  // variants（公表時点の種類数）を数え直す
  const luSets: Record<string, Set<string>> = {};
  for (const s of all) {
    if (FROZEN_SUBSTATION_SLUGS.has(s.slug)) continue; // 凍結は基準日variants集計からも除外
    const area = s.area || '(不明)';
    (luSets[area] ??= new Set()).add(s.last_updated ? s.last_updated.slice(0, 10) : '');
  }
  for (const [area, set] of Object.entries(luSets)) {
    set.delete('');
    if (areaDates[area]) areaDates[area].last_updated_variants = set.size;
  }

  // Gr6(2026-08-09): 県 → 管轄エリア／一般送配電事業者。
  // 県ページの title/description に事業者名を出すため（「◯◯電力 空き容量」の検索語に当てる）。
  // 件数の多い順に並べ、主たる管轄が先頭に来るようにする。
  const prefAreaCount: Record<string, Record<string, number>> = {};
  const prefOperatorCount: Record<string, Record<string, number>> = {};
  for (const s of all) {
    const pref = s.prefecture || 'unknown';
    if (s.area) {
      const a = (prefAreaCount[pref] ??= {});
      a[s.area] = (a[s.area] ?? 0) + 1;
    }
    if (s.operator) {
      const o = (prefOperatorCount[pref] ??= {});
      o[s.operator] = (o[s.operator] ?? 0) + 1;
    }
  }
  const sortedKeys = (m: Record<string, number> | undefined): string[] =>
    Object.entries(m ?? {})
      .sort((a, b) => b[1] - a[1])
      .map(([k]) => k);
  const prefMeta: Record<string, { count: number; areas: string[]; operators: string[] }> = {};
  for (const [pref, count] of Object.entries(byPrefCount)) {
    prefMeta[pref] = {
      count: count as number,
      areas: sortedKeys(prefAreaCount[pref]),
      operators: sortedKeys(prefOperatorCount[pref]),
    };
  }

  // Gr9(2026-08-09): 県ごとの空容量トップ（変電所詳細の「この県の他の変電所」用）。
  // ★見出しに「近隣」「周辺」は使わない — 座標を持たないため物理的な近さは保証できない。
  // 自ページを除いて5件出せるよう、余裕を見て8件持つ。
  const prefTop: Record<string, Array<{ slug: string; name: string; cap: number | null; kv: number | null }>> = {};
  for (const s of all) {
    const pref = s.prefecture || 'unknown';
    (prefTop[pref] ??= []).push({
      slug: s.slug,
      name: s.name,
      cap: typeof s.cap_avail_mw === 'number' ? s.cap_avail_mw : null,
      kv: typeof s.voltage_primary_kv === 'number' ? s.voltage_primary_kv : null,
    });
  }
  for (const pref of Object.keys(prefTop)) {
    prefTop[pref] = prefTop[pref]
      .sort((a, b) => (b.cap ?? -1) - (a.cap ?? -1))
      .slice(0, 8);
  }

  // Gr10追補(2026-08-11): エリアごとの空容量トップ。
  // 府県が確定しない関西（ローカル系1,575＋基幹系49）で「同じ県の他の変電所」を出せないため、
  // 代わりに「{エリア}エリアで空容量の大きい変電所」を出す。★「近隣」「周辺」とは呼ばない。
  const areaTop: Record<string, Array<{ slug: string; name: string; cap: number | null; kv: number | null }>> = {};
  for (const s of all) {
    if (!s.area) continue;
    (areaTop[s.area] ??= []).push({
      slug: s.slug,
      name: s.name,
      cap: typeof s.cap_avail_mw === 'number' ? s.cap_avail_mw : null,
      kv: typeof s.voltage_primary_kv === 'number' ? s.voltage_primary_kv : null,
    });
  }
  for (const area of Object.keys(areaTop)) {
    areaTop[area] = areaTop[area].sort((a, b) => (b.cap ?? -1) - (a.cap ?? -1)).slice(0, 8);
  }

  // ── BM(2026-08-16): /grid 全国集計を build 時に確定させる ──────────────
  // 従来 /grid は runtime に getAllSubstations()（microCMS 83リクエスト）で集計していたため、
  // ①エリア詳細（precompute）と別ソースになり ②凍結除外が total だけ漏れて 8,229/8,228 が混在した。
  // 集計はここ（＝エリア詳細と同一ソース）で作り、ページは参照するだけにする（鉄則#3・落とし穴#102/#108）。
  const active = all.filter((s) => !FROZEN_SUBSTATION_SLUGS.has(s.slug));
  const AREA_JP_TO_SLUG: Record<string, string> = {
    北海道: 'hokkaido', 東北: 'tohoku', 東京: 'tokyo', 中部: 'chubu', 北陸: 'hokuriku',
    関西: 'kansai', 中国: 'chugoku', 四国: 'shikoku', 九州: 'kyushu', 沖縄: 'okinawa',
  };
  const byVoltage: Record<string, number> = {};
  const byOperator: Record<string, number> = {};
  const byAreaSlug: Record<string, number> = {};
  const byPrefActive: Record<string, number> = {};
  let availPositive = 0;
  let n1Ok = 0;
  let latestLastUpdated: string | null = null;
  for (const s of active) {
    const vc = s.voltage_class || 'その他';
    byVoltage[vc] = (byVoltage[vc] ?? 0) + 1;
    const op = s.operator || 'その他';
    byOperator[op] = (byOperator[op] ?? 0) + 1;
    const aSlug = s.area ? AREA_JP_TO_SLUG[s.area] : undefined;
    if (aSlug) byAreaSlug[aSlug] = (byAreaSlug[aSlug] ?? 0) + 1;
    if (s.prefecture) byPrefActive[s.prefecture] = (byPrefActive[s.prefecture] ?? 0) + 1;
    if (typeof s.cap_avail_mw === 'number' && s.cap_avail_mw > 0) availPositive++;
    if (s.n1_eligible === true) n1Ok++;
    if (s.last_updated && (!latestLastUpdated || s.last_updated > latestLastUpdated)) {
      latestLastUpdated = s.last_updated;
    }
  }
  // 注目変電所（空容量プラス × N-1電制適用可・上位12件）
  const highlights = active
    .filter((s) => typeof s.cap_avail_mw === 'number' && s.cap_avail_mw > 0 && s.n1_eligible === true)
    .sort((a, b) => (b.cap_avail_mw ?? 0) - (a.cap_avail_mw ?? 0))
    .slice(0, 12)
    .map((s) => ({
      id: s.id, slug: s.slug, name: s.name, prefecture: s.prefecture,
      operator: s.operator, voltage_class: s.voltage_class, cap_avail_mw: s.cap_avail_mw,
    }));

  // ── 落とし穴 #116 の恒久策（2026-08-16）─────────────────────────────
  // エリアページ・県ページが runtime microCMS を読むと、Next の fetch キャッシュにより
  // 「再取込直後のビルドが旧データを出力する」。/grid と同様に build 時 precompute の
  // 静的データへ寄せて、構造的に断つ（no-store は静的ルートを動的化するため使わない）。
  // 凍結変電所はここでも除外し、/grid の集計と件数を一致させる。
  // 実体は by_area に1回だけ持ち、県は「エリア名＋添字」の参照で持つ（二重保持でサイズが倍になるため）
  const areaLists: Record<string, LiteSubstation[]> = {};
  for (const s of active) {
    if (s.area) (areaLists[s.area] ??= []).push(s);
  }
  // 表示順は既存の runtime 実装に合わせる（エリア=名称順）
  for (const k of Object.keys(areaLists)) {
    areaLists[k].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ja'));
  }
  // 県は空容量の大きい順（既存の getSubstationsByPrefecture の orders と同じ）
  const prefRefs: Record<string, Array<[string, number]>> = {};
  for (const [areaJp, list] of Object.entries(areaLists)) {
    list.forEach((s, i) => {
      if (s.prefecture) (prefRefs[s.prefecture] ??= []).push([areaJp, i]);
    });
  }
  for (const k of Object.keys(prefRefs)) {
    prefRefs[k].sort((x, y) => {
      const a = areaLists[x[0]][x[1]].cap_avail_mw ?? -1;
      const b = areaLists[y[0]][y[1]].cap_avail_mw ?? -1;
      return b - a;
    });
  }
  const genDir = path.join(process.cwd(), 'src', 'lib', 'generated');
  fs.mkdirSync(genDir, { recursive: true });
  const listsPath = path.join(genDir, 'grid-area-lists.json');
  // Gr11(2026-08-25): 検索母集団の生成日時を JSON 内に持つ（ユウ条件3。鮮度の追跡用）
  fs.writeFileSync(listsPath, JSON.stringify({ generated_at: new Date().toISOString(), by_area: areaLists, pref_refs: prefRefs }));
  console.log(`  grid-area-lists.json: エリア${Object.keys(areaLists).length} / 県${Object.keys(prefRefs).length}`
    + ` (${(fs.statSync(listsPath).size / 1024).toFixed(0)} KB)`);

  const index = {
    // 凍結変電所は総数から除外（2026-08-16裁定: 湯船−1・新富士21B22B+1 で総表示は不変）
    total: active.length,
    // /grid 全国集計（すべて凍結除外・total と同一母数）
    summary: {
      total: active.length,
      avail_positive: availPositive,
      n1_ok: n1Ok,
      with_coords: active.filter((s) => typeof s.latitude === 'number' && typeof s.longitude === 'number').length,
      latest_last_updated: latestLastUpdated,
      by_voltage: byVoltage,
      by_operator: byOperator,
      by_area_slug: byAreaSlug,
      by_prefecture: byPrefActive,
      highlights,
    },
    area_top: areaTop,
    area_dates: areaDates,
    pref_meta: prefMeta,
    pref_top: prefTop,
    with_coords: withCoords,
    without_coords: withoutCoords,
    by_pref: byPrefCount,
    sizes_bytes: byPrefSize,
    total_size_kb: Math.round(totalSize / 1024),
    max_pref_size_kb: Math.round(maxSize / 1024),
    max_pref: maxSizePref,
    pref_count: byPref.size,
    updated_at: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(outDir, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`\n[precompute-substations] 書き出し完了`);
  console.log(`  outDir: ${outDir}`);
  console.log(`  分割ファイル数: ${byPref.size} (都道府県別)`);
  console.log(`  合計サイズ: ${(totalSize / 1024).toFixed(1)} KB (~${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`  最大ファイル: ${maxSizePref} (${(maxSize / 1024).toFixed(1)} KB)`);
  console.log(`  座標あり: ${withCoords} / ${all.length} (${(withCoords / all.length * 100).toFixed(1)}%)`);
  console.log(`  座標なし: ${withoutCoords} (距離計算不可、同 prefecture 集約検索フォールバック)`);
  console.log(`\n  ▼ 都道府県別 上位 5:`);
  const top5 = Object.entries(byPrefCount).sort((a, b) => b[1] - a[1]).slice(0, 5);
  for (const [pref, cnt] of top5) {
    console.log(`    ${pref}: ${cnt} 件 (${(byPrefSize[pref] / 1024).toFixed(1)} KB)`);
  }
}

main().catch((err) => {
  console.error('[precompute-substations] ERROR:', err);
  process.exit(1);
});
