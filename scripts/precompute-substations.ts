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
import { MICROCMS_PAGE_LIMIT, MICROCMS_MAX_OFFSET } from '../src/lib/constants';

// 出力スキーマ (距離計算 + UI で必要な最小フィールド)
export interface LiteSubstation {
  /** content id (microCMS の内部 id) */
  id: string;
  /** slug (例: kyu-879) */
  slug: string;
  /** 変電所名 (例: 壱岐) */
  name: string;
  /** 都道府県 (例: 福岡県) */
  prefecture: string | null;
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
}

// 取得対象 fields (cost 最適化: 必要なものだけ)
const FETCH_FIELDS = [
  'id', 'slug', 'name', 'prefecture', 'operator', 'area',
  'voltage_primary_kv', 'voltage_secondary_kv',
  'capacity_total_mw', 'cap_operational_mw', 'cap_avail_mw',
  'n1_eligible', 'oc_possibility', 'latitude', 'longitude',
  'last_updated', 'fetched_at', 'area',
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
        prefecture: s.prefecture ?? null,
        operator: Array.isArray(s.operator) && s.operator.length > 0 ? s.operator[0] : null,
        area: Array.isArray(s.area) && s.area.length > 0 ? s.area[0] : null,
        voltage_primary_kv: typeof s.voltage_primary_kv === 'number' ? s.voltage_primary_kv : null,
        voltage_secondary_kv: typeof s.voltage_secondary_kv === 'number' ? s.voltage_secondary_kv : null,
        capacity_total_mw: typeof s.capacity_total_mw === 'number' ? s.capacity_total_mw : null,
        cap_operational_mw: typeof s.cap_operational_mw === 'number' ? s.cap_operational_mw : null,
        cap_avail_mw: typeof s.cap_avail_mw === 'number' ? s.cap_avail_mw : null,
        n1_eligible: s.n1_eligible === true,
        oc_possibility: Array.isArray(s.oc_possibility) && s.oc_possibility.length > 0
          ? s.oc_possibility[0] : null,
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
    const area = s.area || '(不明)';
    (luSets[area] ??= new Set()).add(s.last_updated ? s.last_updated.slice(0, 10) : '');
  }
  for (const [area, set] of Object.entries(luSets)) {
    set.delete('');
    if (areaDates[area]) areaDates[area].last_updated_variants = set.size;
  }

  const index = {
    total: all.length,
    area_dates: areaDates,
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
