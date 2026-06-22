#!/usr/bin/env tsx
/** import後検証: 総件数8,225 / 既存9社不変(append安全) / 東京1,718 / 衝突4県の混在。READ only。*/
import * as fs from 'node:fs';
function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}
async function cnt(client: any, filters?: string) {
  const r = await client.getList({ endpoint: 'substations', queries: { limit: 1, fields: 'id', ...(filters ? { filters } : {}) } });
  return r.totalCount;
}
async function main() {
  loadEnv();
  const { client } = await import('../../../src/lib/microcms');

  const total = await cnt(client);
  const tpg = await cnt(client, 'slug[begins_with]tpg-');
  const tokyoArea = await cnt(client, 'area[equals]東京');
  console.log(`総件数: ${total}  (期待 8225)`);
  console.log(`tpg-*: ${tpg}  / area=東京: ${tokyoArea}  (期待 1718)`);

  console.log('\n=== 既存9社の件数（append安全＝不変であること）===');
  const EXPECT: Record<string, number> = {
    関西電力送配電: 1624, 中部電力パワーグリッド: 1107, 東北電力ネットワーク: 884,
    九州電力送配電: 879, 中国電力ネットワーク: 873, 北海道電力ネットワーク: 424,
    四国電力送配電: 294, 北陸電力送配電: 271, 沖縄電力: 151,
  };
  let allOk = true;
  for (const [op, exp] of Object.entries(EXPECT)) {
    const c = await cnt(client, `operator[contains]${op}`);
    const ok = c === exp ? 'OK' : `★差異(期待${exp})`;
    if (c !== exp) allOk = false;
    console.log(`  ${op}: ${c} ${ok}`);
  }
  const tepco = await cnt(client, 'operator[contains]東京電力パワーグリッド');
  console.log(`  東京電力パワーグリッド: ${tepco} (新規)`);

  console.log('\n=== 衝突4県: 他社＋TEPCO 混在確認 ===');
  for (const pref of ['静岡県', '福島県', '長野県', '新潟県']) {
    const all = await cnt(client, `prefecture[equals]${pref}`);
    const tep = await cnt(client, `(prefecture[equals]${pref}[and]operator[contains]東京電力パワーグリッド)`);
    console.log(`  ${pref}: 全${all}件 / うちTEPCO ${tep}件 / 他社 ${all - tep}件`);
  }

  console.log(`\n判定: 既存9社不変=${allOk ? 'OK(append安全)' : 'NG'} / 総件数=${total === 8225 ? 'OK' : `${total}(要確認)`}`);
}
main().catch((e) => { console.error('ERROR:', e?.message ?? String(e)); process.exit(1); });
