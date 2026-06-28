/**
 * scripts/projects-301-patch-canonical.ts
 *
 * projects 重複301統合の「情報補完 PATCH」（手順2・情報損失防止）。
 * canonical が空のフィールドだけを、同一案件の旧entryの値で補完（捏造なし・L-EIC-019）。
 * 冪等: 既に値があれば skip。microCMS は PATCH のみ（DELETE/PUT/POST なし）。
 *
 *   G1 osakagas-suita.cod ← 2025-09-02（同一事業者 Daigas=大阪ガス pr-co139670-bess より）
 *   G2 kaminara-bess.status ← ["稼働中"]（旧 pr-co173175 が稼働中・cod 2026-03-27 は既に過去）
 *
 * 実行: (env 読込後) npx tsx scripts/projects-301-patch-canonical.ts [--dry-run]
 */
export {};
import { getAllProjects, type Project } from '../src/lib/microcms';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;

async function patch(id: string, fields: Record<string, unknown>): Promise<void> {
  if (DRY_RUN) return;
  const resp = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!resp.ok) throw new Error(`PATCH ${id} HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
}

const empty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

async function main(): Promise<void> {
  console.log(`[patch-canonical] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const by = new Map(all.map((p) => [p.slug, p]));

  // G1: osakagas-suita.cod
  const g1 = by.get('osakagas-suita');
  if (g1) {
    if (empty(g1.cod)) {
      console.log(`  osakagas-suita.cod: 「${g1.cod ?? '空'}」→「2025-09-02」`);
      await patch(g1.id, { cod: '2025-09-02' });
    } else console.log(`  [skip] osakagas-suita.cod 既値「${g1.cod}」`);
  } else console.log('  [warn] osakagas-suita 見つからない');

  // G2: kaminara-bess.status
  const g2 = by.get('kaminara-bess');
  if (g2) {
    const st = (g2 as Project).status;
    if (empty(st)) {
      console.log(`  kaminara-bess.status: 「${(st || []).join(',') || '空'}」→「稼働中」`);
      await patch(g2.id, { status: ['稼働中'] });
    } else console.log(`  [skip] kaminara-bess.status 既値「${(st || []).join(',')}」`);
  } else console.log('  [warn] kaminara-bess 見つからない');

  console.log(`[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
