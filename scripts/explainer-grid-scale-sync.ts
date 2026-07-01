/**
 * scripts/explainer-grid-scale-sync.ts
 * /explainer/grid-scale-bess 本文（microCMS）の「9社・6,507・関東を除く」→「10社・8,225・関東含む」同期。
 * 6/22 の東京電力PG投入（10社8,225）に本文が未追随だったため。description不使用・body のみ PATCH。冪等。module化(#104)。
 * 実行: (env 読込後) npx tsx scripts/explainer-grid-scale-sync.ts [--dry-run]
 */
export {};

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/explainer`;

const REPLACES: [string, string][] = [
  ['蓄電所ネット では全国9社・6,507変電所の系統空き容量データを統合提供しています。',
   '蓄電所ネット では全国10社・8,225変電所（関東含む）の系統空き容量データを統合提供しています。'],
  ['系統空き容量データベース（9社6,507件、関東を除く全国カバー）',
   '系統空き容量データベース（10社8,225件、関東含む全国カバー）'],
  ['東京電力PG 公開状況解説',
   '東京電力PG エリア（13都県＋基幹系 収録済）'],
];

async function main(): Promise<void> {
  console.log(`[explainer-grid-sync] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const getUrl = `${BASE}?filters=slug[equals]grid-scale-bess&fields=id,slug,body`;
  const g = await fetch(getUrl, { headers: { 'X-MICROCMS-API-KEY': KEY! } });
  if (!g.ok) throw new Error(`GET HTTP ${g.status}`);
  const data = await g.json();
  const c = data.contents?.[0];
  if (!c) { console.log('  [miss] grid-scale-bess'); return; }

  let body = c.body as string;
  const orig = body;
  for (const [from, to] of REPLACES) {
    const before = body;
    body = body.split(from).join(to);
    console.log(`  「${from.slice(0, 30)}…」→「${to.slice(0, 30)}…」: ${body !== before ? '適用' : '対象なし(既済/要確認)'}`);
  }
  if (body === orig) { console.log('  [skip-done] 変更なし（既に同期済）'); return; }
  console.log(`  9社残=${(body.match(/9社/g) || []).length} / 6,507残=${(body.match(/6,?507/g) || []).length} / 関東を除く残=${(body.match(/関東を除く/g) || []).length}（すべて0が目標）`);

  if (!DRY_RUN) {
    const r = await fetch(`${BASE}/${c.id}`, {
      method: 'PATCH', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });
    if (!r.ok) throw new Error(`PATCH HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    console.log('  [ok] PATCH 完了');
  }
  console.log(`[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
