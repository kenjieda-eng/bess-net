/**
 * scripts/projects-agora-stage9.ts
 *
 * /projects ステージ9 PART B — pr-co16325-gunma-2（群馬伊勢崎第一蓄電所・ポート）容量補完（PATCH 1件）。
 *   capacityMwh: 0 → 8.0（ポート全拠点 2MW/8MWh・出典 theport 11497）。outputMw=2 は据置。
 *   （PART A の 301 統合は src/lib/projects-301.ts 側で対応・別編集＝本スクリプトは PATCH のみ）
 *
 * 安全: microCMS PATCH のみ（DELETE/PUT/POST なし）。冪等（既に 8 なら skip）。module化(#104)。
 *   捏造しない＝記載値は theport 一次情報のみ(L-EIC-019)。
 *
 * 実行: (env 読込後) npx tsx scripts/projects-agora-stage9.ts [--dry-run]
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/projects`;

async function main(): Promise<void> {
  console.log(`[agora-stage9] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const p = all.find((x) => x.slug === 'pr-co16325-gunma-2');
  if (!p) { console.log('  [miss] pr-co16325-gunma-2'); return; }
  if (p.capacityMwh === 8) { console.log('  [skip-done] 既に 8MWh'); return; }

  console.log(`  pr-co16325-gunma-2「${p.name}」`);
  console.log(`     capacityMwh ${p.capacityMwh}→8 / outputMw ${p.outputMw}（据置）`);
  console.log(`     不変: 事業者${p.operator} / 所在地${p.prefecture}${p.city} / status[${(p.status || []).join(',')}] / cod ${p.cod} / 出典 不変`);

  if (!DRY_RUN) {
    const r = await fetch(`${BASE}/${p.id}`, {
      method: 'PATCH', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ capacityMwh: 8 }),
    });
    if (!r.ok) throw new Error(`PATCH HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    console.log('  [ok] PATCH 完了');
  }
  console.log(`[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
