#!/usr/bin/env tsx
/**
 * live microCMS substations endpoint のスキーマ確認（READ only）。
 * - .env.local から鍵をロード（鍵は絶対に出力しない）
 * - 既存レコード2件のフィールド形式を確認（select系が配列か等）
 * - 既存 tpg-* レコードの有無（冪等性チェック）
 * - 総件数
 */
import * as fs from 'node:fs';

// .env.local ロード（値は出力しない）
function loadEnv() {
  const txt = fs.readFileSync('.env.local', 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) {
      let v = m[2].trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[m[1]]) process.env[m[1]] = v;
    }
  }
}

async function main() {
  loadEnv();
  if (!process.env.MICROCMS_API_KEY || !process.env.MICROCMS_SERVICE_DOMAIN) {
    console.error('ENV MISSING (key/domain)');
    process.exit(1);
  }
  console.log('service domain loaded:', process.env.MICROCMS_SERVICE_DOMAIN); // ドメインは公開情報
  const { client } = await import('../../../src/lib/microcms');

  // 1. 総件数
  const head = await client.getList({ endpoint: 'substations', queries: { limit: 1, fields: 'id' } });
  console.log('totalCount:', head.totalCount);

  // 2. サンプル2件（全フィールド、depth0）— 鍵はレコードに含まれない
  const sample = await client.getList<any>({ endpoint: 'substations', queries: { limit: 2, depth: 0 } });
  for (const r of sample.contents) {
    const shape: Record<string, string> = {};
    for (const [k, v] of Object.entries(r)) {
      shape[k] = Array.isArray(v) ? `array[${v.length}]=${JSON.stringify(v)}` : `${typeof v}=${JSON.stringify(v)}`;
    }
    console.log('--- record', r.slug ?? r.id, '---');
    console.log(JSON.stringify(shape, null, 2));
  }

  // 3. 既存 tpg-* の有無（冪等性: 過去の部分import検出）
  const tpg = await client.getList({ endpoint: 'substations', queries: { filters: 'slug[begins_with]tpg-', limit: 1, fields: 'id,slug' } });
  console.log('existing tpg-* count:', tpg.totalCount);

  // 4. operator/area の既存値（select選択肢の正確な文字列）
  const ops = await client.getList<any>({ endpoint: 'substations', queries: { limit: 3, filters: 'area[contains]中部', fields: 'slug,operator,area,oc_possibility,voltage_class' } });
  for (const r of ops.contents) {
    console.log('中部sample:', JSON.stringify({ slug: r.slug, operator: r.operator, area: r.area, oc: r.oc_possibility, vc: r.voltage_class }));
  }
}

main().catch((e) => { console.error('ERROR:', e?.message ?? String(e)); process.exit(1); });
