/**
 * scripts/patch-project-coordinates.ts
 *
 * 依頼AA Phase 4: AA前段 (geocoding-results.json) で取得した
 * 緯度経度を microCMS の projects に PATCH 投入する。
 *
 * ## 前提
 *  - microCMS の projects schema に latitude / longitude 数字フィールド追加済（江田さん作業）
 *  - 入力: scripts/geocoding-results.json （AA前段の出力）
 *  - MICROCMS_API_KEY / MICROCMS_SERVICE_DOMAIN 環境変数
 *
 * ## 実行
 *   # 1) Webhook OFF
 *   # 2) dry-run
 *   $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/patch-project-coordinates.ts --dry-run
 *   # 3) 本実行
 *   $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/patch-project-coordinates.ts
 *   # 4) Webhook ON
 *
 * ## 動作
 *  1. geocoding-results.json から ok の項目（lat/lng あり）を抽出
 *  2. 各 project の id を slug 検索で取得
 *  3. 既存値と新規値が同じなら skip（冪等）
 *  4. PATCH /api/v1/projects/{id} に { latitude, longitude } を送信
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

type GeocodingResult = {
  slug: string;
  name: string;
  prefecture: string | null;
  city: string | null;
  operator: string | null;
  address: string;
  addr_source: string;
  status: string;
  lat: number | null;
  lng: number | null;
  failure_category: string | null;
};

type ProjectRecord = {
  id: string;
  name: string;
  slug: string;
  latitude?: number;
  longitude?: number;
};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error(
    'ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY env vars are required'
  );
  process.exit(1);
}

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;

async function api(
  method: 'GET' | 'PATCH',
  url: string,
  body?: unknown
): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${url} → HTTP ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function findBySlug(slug: string): Promise<ProjectRecord | null> {
  const url = `${BASE}?filters=slug[equals]${encodeURIComponent(
    slug
  )}&fields=id,name,slug,latitude,longitude&limit=1`;
  const data = (await api('GET', url)) as {
    contents: ProjectRecord[];
    totalCount: number;
  };
  return data.contents[0] ?? null;
}

/** 既存値と新規値の差が 1e-6 (約 0.1m) 未満なら同じとみなす */
function sameCoord(a: number | undefined, b: number): boolean {
  if (typeof a !== 'number') return false;
  return Math.abs(a - b) < 1e-6;
}

async function patchCoords(
  project: ProjectRecord,
  lat: number,
  lng: number
): Promise<'ok' | 'skip'> {
  if (sameCoord(project.latitude, lat) && sameCoord(project.longitude, lng)) {
    console.log(
      `  [skip] ${project.slug} — coords already set (${lat}, ${lng})`
    );
    return 'skip';
  }
  const body = { latitude: lat, longitude: lng };
  if (DRY_RUN) {
    console.log(
      `  [dry-run] PATCH ${project.slug}: lat=${lat.toFixed(6)} lng=${lng.toFixed(6)}`
    );
    return 'ok';
  }
  await api('PATCH', `${BASE}/${project.id}`, body);
  console.log(
    `  [ok] ${project.slug} — set lat=${lat.toFixed(6)} lng=${lng.toFixed(6)}`
  );
  return 'ok';
}

async function main(): Promise<void> {
  const jsonPath = path.join(
    process.cwd(),
    'scripts',
    'geocoding-results.json'
  );
  if (!fs.existsSync(jsonPath)) {
    console.error(`ERROR: input not found: ${jsonPath}`);
    console.error('       AA前段のスクリプトを先に実行してください');
    process.exit(1);
  }
  const text = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(text) as { results: GeocodingResult[] };
  const oks = parsed.results.filter(
    (r) =>
      r.status === 'ok' &&
      typeof r.lat === 'number' &&
      typeof r.lng === 'number' &&
      !Number.isNaN(r.lat) &&
      !Number.isNaN(r.lng)
  );
  console.log(
    `[patch-project-coordinates] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}, ${oks.length} projects with coords`
  );

  let ok = 0;
  let skip = 0;
  let notFound = 0;
  let err = 0;

  for (const r of oks) {
    try {
      const proj = await findBySlug(r.slug);
      if (!proj) {
        console.warn(`  [warn] slug "${r.slug}" not found in microCMS — skip`);
        notFound++;
        continue;
      }
      const result = await patchCoords(proj, r.lat!, r.lng!);
      if (result === 'ok') ok++;
      else skip++;
    } catch (e) {
      console.error(`  [err] ${r.slug}: ${(e as Error).message}`);
      err++;
    }
  }

  console.log(
    `\n[done] ok=${ok}, skip=${skip}, notFound=${notFound}, err=${err}`
  );
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
