#!/usr/bin/env tsx
/** 既存 select 値の確認: 東京/東京電力PG オプションが既存か、voltage_class の選択肢一覧。READ only。*/
import * as fs from 'node:fs';
function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { let v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}
async function main() {
  loadEnv();
  const { client } = await import('../../../src/lib/microcms');

  // 1. 東京電力PG / 東京 が既にデータとして存在するか
  for (const f of ['operator[contains]東京', 'area[equals]東京', 'area[contains]関東', 'prefecture[equals]東京都']) {
    const r = await client.getList({ endpoint: 'substations', queries: { filters: f, limit: 1, fields: 'id' } });
    console.log(`filter "${f}" → count=${r.totalCount}`);
  }

  // 2. voltage_class の登録値を広くサンプリング（distinct近似）
  const vcSet = new Set<string>();
  const opSet = new Set<string>();
  const areaSet = new Set<string>();
  const ocSet = new Set<string>();
  let offset = 0;
  while (offset < 6507) {
    const r = await client.getList<any>({ endpoint: 'substations', queries: { limit: 100, offset, fields: 'voltage_class,operator,area,oc_possibility' } });
    for (const c of r.contents) {
      (c.voltage_class ?? []).forEach((x: string) => vcSet.add(x));
      (c.operator ?? []).forEach((x: string) => opSet.add(x));
      (c.area ?? []).forEach((x: string) => areaSet.add(x));
      (c.oc_possibility ?? []).forEach((x: string) => ocSet.add(x));
    }
    if (r.contents.length < 100) break;
    offset += 100;
  }
  console.log('\n=== 登録済み select 値（既存データ由来）===');
  console.log('operator:', JSON.stringify([...opSet], null, 0));
  console.log('area:', JSON.stringify([...areaSet], null, 0));
  console.log('voltage_class:', JSON.stringify([...vcSet].sort(), null, 0));
  console.log('oc_possibility:', JSON.stringify([...ocSet], null, 0));
}
main().catch((e) => { console.error('ERROR:', e?.message ?? String(e)); process.exit(1); });
