#!/usr/bin/env tsx
/**
 * TEPCO Phase 2c — microCMS substations 一括import（冪等・rate-limit・canary/cleanup）
 *
 * 使い方:
 *   npx tsx scripts/experimental/tepco/microcms_import.ts canary   # 先頭2件のみ投入し検証
 *   npx tsx scripts/experimental/tepco/microcms_import.ts full     # 全1,718件投入
 *   npx tsx scripts/experimental/tepco/microcms_import.ts verify   # 件数・東京件数の確認
 *   npx tsx scripts/experimental/tepco/microcms_import.ts cleanup  # tpg-* を全削除（ロールバック）
 *
 * 安全策:
 *   - PUT by slug（contentId=slug）で冪等。再実行で重複作成しない。
 *   - rate-limit 400ms + 429/5xx 指数backoff（鉄則#90/#91）。
 *   - select値は既存登録オプションへマップ。鍵はログ出力しない。
 */
import * as fs from 'node:fs';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const GRID_READY = 'scripts/experimental/tepco/tepco_grid_ready.json';

// voltage_class → 既存microCMS登録オプション
const VC_MAP: Record<string, string> = {
  '500kV': '500kV系', '275kV': '275kV系', '154kV': '154kV系',
  '66kV': '66kV系', '22kV': '22kV系', '配電用変電所': 'その他',
};

function toContent(r: any) {
  const vc = VC_MAP[r.voltage_class] ?? 'その他';
  const content: Record<string, any> = {
    slug: r.slug,
    name: r.name,
    prefecture: r.prefecture,
    operator: ['東京電力パワーグリッド'],
    area: ['東京'],
    voltage_class: [vc],
    n1_eligible: !!r.n1_eligible,
    source_url: r.source_url,
    last_updated: r.last_updated,
    // fetched_at は実行時刻から動的付与（2026-08-16 是正: 旧 '2026-06-22' ハードコードは
    // 再取込のたびに実態とズレるため廃止）
    fetched_at: new Date().toISOString(),
  };
  // 数値（null は送らない＝microCMS側で空に）
  for (const [k, src] of [
    ['voltage_primary_kv', r.voltage_primary_kv],
    ['voltage_secondary_kv', r.voltage_secondary_kv],
    ['units', r.units],
    ['capacity_total_mw', r.capacity_total_mw],
    ['cap_operational_mw', r.cap_operational_mw],
    ['cap_avail_mw', r.cap_avail_mw],
    ['cap_avail_upper_mw', r.cap_avail_upper_mw],
    ['n1_capacity_mw', r.n1_capacity_mw],
    ['forecast_flow_mw', r.forecast_flow_mw],
  ] as [string, any][]) {
    if (src !== null && src !== undefined) content[k] = src;
  }
  // テキスト/任意
  if (r.external_id) content.external_id = r.external_id;
  if (r.notes) content.notes = r.notes;
  // oc_possibility: 既存登録は「有り」のみ。「なし」は未登録の可能性 → 有りのみ送る
  if (r.oc_possibility === '有り') content.oc_possibility = ['有り'];
  return content;
}

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function putWithRetry(client: any, slug: string, content: any, attempt = 0): Promise<void> {
  try {
    await client.create({ endpoint: 'substations', contentId: slug, content });
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    const status = e?.response?.status ?? e?.status;
    // 既存（create はPOST=作成専用）→ PATCHで更新（冪等upsert）
    if (/already exists/i.test(msg)) {
      await client.update({ endpoint: 'substations', contentId: slug, content });
      return;
    }
    // 429/5xx は backoff retry
    if ((status === 429 || (status >= 500 && status < 600)) && attempt < 5) {
      const wait = 800 * Math.pow(2, attempt);
      console.warn(`  retry ${slug} (status=${status}) wait=${wait}ms`);
      await sleep(wait);
      return putWithRetry(client, slug, content, attempt + 1);
    }
    throw new Error(`PUT ${slug} failed (status=${status}): ${msg}`);
  }
}

async function main() {
  loadEnv();
  const mode = process.argv[2] ?? 'verify';
  const { client } = await import('../../../src/lib/microcms');
  const data = JSON.parse(fs.readFileSync(GRID_READY, 'utf8'));
  const recs: any[] = data.substations;

  if (mode === 'verify') {
    const total = await client.getList({ endpoint: 'substations', queries: { limit: 1, fields: 'id' } });
    const tokyo = await client.getList({ endpoint: 'substations', queries: { filters: 'area[equals]東京', limit: 1, fields: 'id' } });
    const tpg = await client.getList({ endpoint: 'substations', queries: { filters: 'slug[begins_with]tpg-', limit: 1, fields: 'id' } });
    console.log(`total=${total.totalCount}  area=東京: ${tokyo.totalCount}  tpg-*: ${tpg.totalCount}`);
    return;
  }

  if (mode === 'cleanup') {
    // tpg-* を全削除
    let deleted = 0;
    while (true) {
      const page = await client.getList({ endpoint: 'substations', queries: { filters: 'slug[begins_with]tpg-', limit: 50, fields: 'id' } });
      if (page.contents.length === 0) break;
      for (const c of page.contents) {
        await client.delete({ endpoint: 'substations', contentId: (c as any).id });
        deleted++;
        await sleep(300);
      }
      console.log(`  deleted ${deleted}...`);
    }
    console.log(`cleanup done: ${deleted} 件削除`);
    return;
  }

  const targets = mode === 'canary' ? recs.slice(0, 2) : recs;
  console.log(`[import:${mode}] ${targets.length} 件を投入開始（rate-limit 400ms）...`);
  let ok = 0, fail = 0;
  const failures: string[] = [];
  for (const r of targets) {
    try {
      await putWithRetry(client, r.slug, toContent(r));
      ok++;
      if (ok % 100 === 0) console.log(`  ${ok}/${targets.length} ...`);
    } catch (e: any) {
      fail++;
      failures.push(e?.message ?? String(e));
      if (fail <= 5) console.error(`  FAIL: ${e?.message ?? e}`);
      if (mode === 'canary') break; // canaryは即停止
    }
    await sleep(400);
  }
  console.log(`\n[import:${mode}] 完了: 成功 ${ok} / 失敗 ${fail}`);
  if (failures.length) {
    console.log('失敗サンプル:');
    failures.slice(0, 5).forEach((f) => console.log('  ' + f));
  }
  // canary後の確認
  if (mode === 'canary' && ok > 0) {
    await sleep(1000);
    const check = await client.getList({ endpoint: 'substations', queries: { filters: 'slug[begins_with]tpg-', limit: 5, fields: 'slug,name,operator,area,voltage_class,cap_avail_mw,prefecture' } });
    console.log('\ncanary投入確認:');
    check.contents.forEach((c: any) => console.log('  ' + JSON.stringify(c)));
  }
}
main().catch((e) => { console.error('FATAL:', e?.message ?? String(e)); process.exit(1); });
