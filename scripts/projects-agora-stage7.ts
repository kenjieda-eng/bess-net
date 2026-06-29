/**
 * scripts/projects-agora-stage7.ts
 *
 * /projects ステージ7 — ota-bess 事業者特定・補完（PATCH 1件のみ）。
 * 出典: 株式会社fantasista PR（prtimes 000000032.000093934）／enehub。
 *   事業者=株式会社fantasista（上州太田蓄電所合同会社）、容量8.14MWh、title更新、body 1文補正。
 *   ★出力MWは一次情報未確認のため 0（調査中）のまま＝捏造しない（L-EIC-019）。
 *   所在地(群馬県太田市)・status(稼働中)・cod(2025年8月) 不変。microCMS PATCH のみ。冪等。
 *
 * 実行: (env 読込後) npx tsx scripts/projects-agora-stage7.ts [--dry-run]
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/projects`;
const SRC = 'https://prtimes.jp/main/html/rd/p/000000032.000093934.html';
const NAME = '群馬太田蓄電所（fantasista）';
const OP = '株式会社fantasista（上州太田蓄電所合同会社）';

const OLD_SENT = '<strong>群馬太田市蓄電所</strong>は、群馬県太田市に立地する系統用蓄電所で、2024年12月10日に建設工事を着工、2025年8月1日に運転を開始しました。';
const NEW_SENT = '<strong>群馬太田蓄電所</strong>は、株式会社fantasista（上州太田蓄電所合同会社）が自社初の系統用蓄電所として群馬県太田市に開発した案件で、2024年12月10日に建設工事を着工、容量8.14MWh級で2025年8月1日に運転を開始しました。';

async function main(): Promise<void> {
  console.log(`[agora-stage7] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const p = all.find((x) => x.slug === 'ota-bess');
  if (!p) { console.log('  [miss] ota-bess'); return; }
  if (p.name === NAME && p.capacityMwh === 8.14) { console.log('  [skip-done] 既に補完済'); return; }

  const newBody = (p.body || '').replace(OLD_SENT, NEW_SENT);
  console.log(`  ota-bess:`);
  console.log(`     事業者「${p.operator || '空'}」→「${OP}」`);
  console.log(`     容量MWh ${p.capacityMwh}→8.14 / 出力MW ${p.outputMw}（一次情報未確認＝不変・捏造しない）`);
  console.log(`     title「${p.name}」→「${NAME}」 / 出典→fantasista PR`);
  console.log(`     body 1文補正（fantasista・自社初・8.14MWh）: ${p.body !== newBody ? '適用' : '対象なし(要確認)'}`);
  console.log(`     不変: 所在地${p.prefecture}${p.city} / status[${(p.status || []).join(',')}] / cod ${p.cod}`);

  if (!DRY_RUN) {
    const r = await fetch(`${BASE}/${p.id}`, {
      method: 'PATCH', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: NAME, operator: OP, capacityMwh: 8.14, sourceUrl: SRC, body: newBody }),
    });
    if (!r.ok) throw new Error(`PATCH HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
    console.log('  [ok] PATCH 完了');
  }
  console.log(`[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
