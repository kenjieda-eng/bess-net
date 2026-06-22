import * as fs from 'node:fs';
function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}
async function main() {
  loadEnv();
  const { client } = await import('../../../src/lib/microcms');
  const area = await client.getList({ endpoint: 'substations', queries: { limit: 1, fields: 'id', filters: 'area[contains]東京' } });
  const pref = await client.getList({ endpoint: 'substations', queries: { limit: 1, fields: 'id', filters: 'prefecture[equals]東京都' } });
  const kanagawa = await client.getList({ endpoint: 'substations', queries: { limit: 1, fields: 'id', filters: 'prefecture[equals]神奈川県' } });
  console.log('area[contains]東京 =', area.totalCount, '(期待 1718)');
  console.log('prefecture=東京都 =', pref.totalCount, '(期待 470)');
  console.log('prefecture=神奈川県 =', kanagawa.totalCount, '(期待 255)');
  // サンプル値: 横浜・水戸北部・新栃木
  for (const nm of ['横浜', '水戸北部', '新栃木']) {
    const r = await client.getList<any>({ endpoint: 'substations', queries: { limit: 5, filters: `(name[begins_with]${nm}[and]operator[contains]東京電力パワーグリッド)`, fields: 'slug,name,prefecture,cap_avail_mw,n1_capacity_mw,voltage_class' } });
    console.log(`\nsample "${nm}" (${r.totalCount}件):`);
    r.contents.forEach((c: any) => console.log('  ' + JSON.stringify(c)));
  }
}
main().catch((e) => { console.error('ERROR:', e?.message ?? String(e)); process.exit(1); });
