/**
 * scripts/cleanup3-apply.ts
 * ③ 適用（ユウ承認済）。microCMS PATCH のみ（DELETE/PUT/POST なし）。冪等。module化(#104)。
 *   PART A: 所在地二重県の city を先頭prefecture除去でPATCH（除去後空のedgeは変更しない）。
 *   PART B: canonical olympia-ota-isesaki を補完（capacityMwh 0→14.8 ＋ body 1文追記）。
 *           （301 pr-co109041-gunma-148mwh→olympia-ota-isesaki は src/lib/projects-301.ts 側で対応・別編集）
 * 出典: PowerX PR(prtimes 034.000109041)・日経BP 03576。捏造しない＝一次情報の値のみ(L-EIC-019)。
 * 実行: (env 読込後) npx tsx scripts/cleanup3-apply.ts [--dry-run]
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/projects`;

const OLY_BODY_FROM = '2023年8月18日に発表されました。</p>';
const OLY_BODY_TO = '2023年8月18日に発表されました。合計蓄電容量は14.8MWhで、蓄電池はパワーエックス製です。</p>';

async function patch(id: string, fields: Record<string, unknown>): Promise<void> {
  if (DRY_RUN) return;
  const r = await fetch(`${BASE}/${id}`, {
    method: 'PATCH', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!r.ok) throw new Error(`PATCH ${id} HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
}

async function main(): Promise<void> {
  console.log(`[cleanup3] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();

  // ── PART A: 所在地二重県 ──
  console.log(`\n=== PART A: 所在地二重県 city クリーンアップ ===`);
  let a = 0, edge = 0;
  for (const p of all) {
    const pref = (p.prefecture || '').trim();
    const city = (p.city || '').trim();
    if (!pref || !city) continue;
    if (city.startsWith(pref) && city !== pref && city.length > pref.length) {
      const after = city.slice(pref.length).trim();
      if (!after) { edge += 1; console.log(`  [edge-skip] ${p.slug}: 「${city}」→空`); continue; }
      console.log(`  [${p.slug}] city「${city}」→「${after}」`);
      await patch(p.id, { city: after });
      a += 1;
    }
  }
  console.log(`  PART A: ${a}件 city PATCH${edge ? ` / edge ${edge}件skip` : ''}`);

  // ── PART B: canonical olympia-ota-isesaki 補完 ──
  console.log(`\n=== PART B: olympia-ota-isesaki 補完（canonical・14.8MWh+body）===`);
  const oly = all.find((x) => x.slug === 'olympia-ota-isesaki');
  if (!oly) console.log('  [miss] olympia-ota-isesaki');
  else if (oly.capacityMwh === 14.8) console.log('  [skip-done] 既に補完済');
  else {
    const newBody = (oly.body || '').replace(OLY_BODY_FROM, OLY_BODY_TO);
    console.log(`  capacityMwh ${oly.capacityMwh}→14.8 / body 1文追記(14.8MWh・パワーエックス製): ${oly.body !== newBody ? '適用' : '対象なし(要確認)'}`);
    console.log(`  不変: operator「${oly.operator}」/ MW ${oly.outputMw} / 所在 ${oly.prefecture}${oly.city} / status[${(oly.status || []).join(',')}] / 出典 ${oly.sourceUrl}`);
    await patch(oly.id, { capacityMwh: 14.8, body: newBody });
  }

  console.log(`\n[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
