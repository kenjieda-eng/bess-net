/**
 * scripts/precompute-hazard-risk.ts
 *
 * 変電所別 災害リスク build 時事前計算スクリプト
 *
 * 実行: npm run precompute:hazard              # 全1,081件
 *       npm run precompute:hazard -- --limit=10 # dry-run 先頭10件
 *
 * データソース: 不動産情報ライブラリ (reinfolib) ─ 国土交通省
 *   XKT026: 浸水想定区域（洪水・想定最大規模）
 *   XKT027: 高潮浸水想定区域
 *   XKT028: 津波浸水想定
 *   XKT029: 土砂災害警戒区域
 *
 * CLAUDE.md 鉄則#3: SSR ではなく build 時事前計算（SSR で reinfolib リクエスト追加なし）
 * CLAUDE.md 鉄則#4: 負荷 = 1,081 × 4ep × 0.30s / 5並列 ≈ 4.3分（月次バッチ前提）
 * CLAUDE.md 鉄則#5: 実行後 JSON commit → /grid/[slug] は JSON 参照のみ
 *
 * 出力: src/data/hazard-risk-map.json
 */

// Node 22+ 内蔵 loadEnvFile で .env.local を読込
(process as { loadEnvFile?: (path: string) => void }).loadEnvFile?.('.env.local');

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import booleanPointInPolygon from '@turf/boolean-point-in-polygon';
import { point } from '@turf/helpers';
import type { Feature, Polygon, MultiPolygon, GeoJsonProperties } from 'geojson';

// ─── 型定義 ──────────────────────────────────────────────────────

interface Substation {
  id: string;
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
}

type HazardStatus = 'inside' | 'nearby' | 'none' | 'error';

interface FloodRisk {
  status: HazardStatus;
  depthCat: number | null; // A31a_205: 1=0.5m未満〜6=20m以上
  scale: '想定最大規模';
}

interface SimpleRisk {
  status: HazardStatus;
}

interface HazardEntry {
  flood: FloodRisk;
  landslide: SimpleRisk;
  stormSurge: SimpleRisk;
  tsunami: SimpleRisk;
  sources: string[];
  note: string;
  generatedAt: string;
}

type HazardRiskMap = Record<string, HazardEntry>;

// ─── 設定 ─────────────────────────────────────────────────────────

const API_KEY = process.env.REINFOLIB_API_KEY;
if (!API_KEY) {
  console.error('ERROR: REINFOLIB_API_KEY not set. Run with .env.local or set env var.');
  process.exit(1);
}

const BASE = 'https://www.reinfolib.mlit.go.jp/ex-api/external';
const ZOOM = 15;
const CONCURRENCY = 5;
const INTERVAL_MS = 300;

const LIMIT = (() => {
  const arg = process.argv.find(a => a.startsWith('--limit='));
  return arg ? parseInt(arg.replace('--limit=', ''), 10) : undefined;
})();

const SUBSTATIONS_DIR = resolve(process.cwd(), 'src/data/substations');
const OUT_FILE = resolve(process.cwd(), 'src/data/hazard-risk-map.json');

const SOURCES = [
  '国土交通省 不動産情報ライブラリ(reinfolib)',
  '国土数値情報',
  '都道府県別利用条件あり',
];
const NOTE = '編集部が reinfolib API を加工・集計';

// ─── ユーティリティ ───────────────────────────────────────────────

function latlngToTile(lat: number, lng: number, z: number): [number, number] {
  const n = Math.pow(2, z);
  const x = Math.floor(((lng + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return [x, y];
}

type GeoJsonFeatureCollection = {
  type: 'FeatureCollection';
  features: Feature<Polygon | MultiPolygon, GeoJsonProperties>[];
};

async function fetchTile(endpoint: string, x: number, y: number, z: number): Promise<GeoJsonFeatureCollection> {
  const url = `${BASE}/${endpoint}?response_format=geojson&z=${z}&x=${x}&y=${y}`;
  const resp = await fetch(url, {
    headers: { 'Ocp-Apim-Subscription-Key': API_KEY! },
  });
  if (!resp.ok) {
    throw new Error(`${endpoint} HTTP ${resp.status}`);
  }
  return resp.json() as Promise<GeoJsonFeatureCollection>;
}

function assessStatus(
  pt: ReturnType<typeof point>,
  features: Feature<Polygon | MultiPolygon, GeoJsonProperties>[]
): { status: HazardStatus; insideFeatures: typeof features } {
  if (features.length === 0) return { status: 'none', insideFeatures: [] };

  const insideFeatures = features.filter(f => {
    try {
      return booleanPointInPolygon(pt, f);
    } catch {
      return false;
    }
  });

  if (insideFeatures.length > 0) return { status: 'inside', insideFeatures };
  return { status: 'nearby', insideFeatures: [] };
}

// ─── 変電所データ読込 ─────────────────────────────────────────────

function loadSubstations(): Substation[] {
  const files = readdirSync(SUBSTATIONS_DIR).filter(
    f => f.endsWith('.json') && f !== 'index.json'
  );

  const result: Substation[] = [];
  for (const file of files) {
    const entries = JSON.parse(
      readFileSync(join(SUBSTATIONS_DIR, file), 'utf-8')
    ) as Substation[];
    for (const e of entries) {
      if (e.latitude && e.longitude) result.push(e);
    }
  }
  return result;
}

// ─── 1変電所の処理 ───────────────────────────────────────────────

async function processSubstation(sub: Substation, generatedAt: string): Promise<[string, HazardEntry]> {
  const [x, y] = latlngToTile(sub.latitude, sub.longitude, ZOOM);
  const pt = point([sub.longitude, sub.latitude]);

  const [floodData, stormData, tsunamiData, landslideData] = await Promise.allSettled([
    fetchTile('XKT026', x, y, ZOOM),
    fetchTile('XKT027', x, y, ZOOM),
    fetchTile('XKT028', x, y, ZOOM),
    fetchTile('XKT029', x, y, ZOOM),
  ]);

  // 浸水（洪水）─ A31a_205 が浸水深区分
  let flood: FloodRisk;
  if (floodData.status === 'fulfilled') {
    const { status, insideFeatures } = assessStatus(pt, floodData.value.features);
    const depthCat =
      insideFeatures.length > 0
        ? Math.max(...insideFeatures.map(f => Number((f.properties as Record<string, unknown>)?.A31a_205 ?? 0)))
        : null;
    flood = { status, depthCat: depthCat === 0 ? null : depthCat, scale: '想定最大規模' };
  } else {
    flood = { status: 'error', depthCat: null, scale: '想定最大規模' };
  }

  // 高潮
  let stormSurge: SimpleRisk;
  if (stormData.status === 'fulfilled') {
    stormSurge = { status: assessStatus(pt, stormData.value.features).status };
  } else {
    stormSurge = { status: 'error' };
  }

  // 津波
  let tsunami: SimpleRisk;
  if (tsunamiData.status === 'fulfilled') {
    tsunami = { status: assessStatus(pt, tsunamiData.value.features).status };
  } else {
    tsunami = { status: 'error' };
  }

  // 土砂
  let landslide: SimpleRisk;
  if (landslideData.status === 'fulfilled') {
    landslide = { status: assessStatus(pt, landslideData.value.features).status };
  } else {
    landslide = { status: 'error' };
  }

  const entry: HazardEntry = {
    flood,
    landslide,
    stormSurge,
    tsunami,
    sources: SOURCES,
    note: NOTE,
    generatedAt,
  };

  return [sub.slug, entry];
}

// ─── バッチ並列処理 ───────────────────────────────────────────────

async function processBatch(
  batch: Substation[],
  generatedAt: string
): Promise<Array<[string, HazardEntry] | null>> {
  return Promise.all(
    batch.map(sub =>
      processSubstation(sub, generatedAt).catch(err => {
        console.error(`  [err] ${sub.slug}: ${(err as Error).message}`);
        return null;
      })
    )
  );
}

// ─── main ────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const all = loadSubstations();
  const targets = LIMIT ? all.slice(0, LIMIT) : all;
  const generatedAt = new Date().toISOString();

  console.log(`[precompute-hazard-risk] ${generatedAt}`);
  console.log(`  対象: ${targets.length}件 / 座標保有 ${all.length}件`);
  console.log(`  API: XKT026/027/028/029  z=${ZOOM}  並列=${CONCURRENCY}  interval=${INTERVAL_MS}ms`);
  if (LIMIT) console.log(`  ★ --limit=${LIMIT} モード`);

  const map: HazardRiskMap = {};
  let ok = 0, err = 0;
  const total = targets.length;
  const batchCount = Math.ceil(total / CONCURRENCY);

  for (let i = 0; i < batchCount; i++) {
    const batch = targets.slice(i * CONCURRENCY, (i + 1) * CONCURRENCY);
    const results = await processBatch(batch, generatedAt);

    for (const r of results) {
      if (r) {
        map[r[0]] = r[1];
        ok++;
      } else {
        err++;
      }
    }

    const done = Math.min((i + 1) * CONCURRENCY, total);
    const floodInside = Object.values(map).filter(e => e.flood.status === 'inside').length;
    const floodNearby = Object.values(map).filter(e => e.flood.status === 'nearby').length;
    console.log(
      `  [${done}/${total}] ok=${ok} err=${err}` +
      ` | flood inside=${floodInside} nearby=${floodNearby}`
    );

    if (i < batchCount - 1) {
      await new Promise<void>(r => setTimeout(r, INTERVAL_MS));
    }
  }

  // ─── 統計サマリ ─────────────────────────────────────────────────
  const count = (hazard: keyof HazardEntry, status: string) =>
    Object.values(map).filter(e => (e[hazard] as { status: string }).status === status).length;

  console.log('\n=== 分布サマリ ===');
  for (const h of ['flood', 'landslide', 'stormSurge', 'tsunami'] as const) {
    console.log(
      `  ${h.padEnd(12)}: inside=${count(h, 'inside')} nearby=${count(h, 'nearby')}` +
      ` none=${count(h, 'none')} error=${count(h, 'error')}`
    );
  }
  if (ok > 0) {
    const insideFloodEntries = Object.entries(map)
      .filter(([, e]) => e.flood.status === 'inside')
      .slice(0, 3);
    if (insideFloodEntries.length > 0) {
      console.log('\n  [flood inside サンプル]');
      for (const [slug, e] of insideFloodEntries) {
        console.log(`    ${slug}: depthCat=${e.flood.depthCat}`);
      }
    }
  }

  // ─── JSON 書出し ──────────────────────────────────────────────
  if (!LIMIT || ok > 0) {
    writeFileSync(OUT_FILE, JSON.stringify(map, null, 2), 'utf-8');
    console.log(`\n[done] ok=${ok}  err=${err}  → ${OUT_FILE}`);
    console.log(`  エントリ数: ${Object.keys(map).length}`);
  }

  process.exit(err > 0 ? 1 : 0);
}

main().catch(e => {
  console.error('FATAL:', e);
  process.exit(1);
});
