/**
 * scripts/projects-title-fix-2026-06-30.ts
 *
 * 壊れタイトル2件を整形（title=name の PATCH ＋ body の <strong> 同期のみ）。
 * 事業者/出力/容量/status/所在地/cod/出典は不変。タイトルは body で確認できた範囲のみ（捏造しない・L-EIC-019）。
 *
 *   pr-co55631-gunma:        「九電工は系統用蓄電池」→「太田・足利の系統用蓄電所（しろくま電力）」
 *     （body確認: しろくま電力・群馬県太田市＋栃木県足利市の2拠点・2025-09-01運開）
 *   pr-co109041-gunma-148mwh:「株式会社オリンピアから系統用蓄電池」→「太田・伊勢崎の系統用蓄電所 14.8MWh（オリンピア）」
 *     （body確認: オリンピア・群馬県太田市＋伊勢崎市の2拠点・合計14.8MWh・パワーエックス製）
 *
 * 安全: microCMS PATCH のみ（DELETE/PUT/POST なし）。冪等。module化(#104)。
 * 実行: (env 読込後) npx tsx scripts/projects-title-fix-2026-06-30.ts [--dry-run]
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

const SD = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SD || !KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SD}.microcms.io/api/v1/projects`;

const FIXES: { slug: string; name: string; bodyFrom: string; bodyTo: string }[] = [
  {
    slug: 'pr-co55631-gunma',
    name: '太田・足利の系統用蓄電所（しろくま電力）',
    bodyFrom: '<strong>九電工は系統用蓄電池</strong>',
    bodyTo: '<strong>太田・足利の系統用蓄電所</strong>',
  },
  {
    slug: 'pr-co109041-gunma-148mwh',
    name: '太田・伊勢崎の系統用蓄電所 14.8MWh（オリンピア）',
    bodyFrom: '<strong>株式会社オリンピアから系統用蓄電池</strong>',
    bodyTo: '<strong>太田・伊勢崎の系統用蓄電所</strong>',
  },
];

async function patch(id: string, fields: Record<string, unknown>): Promise<void> {
  if (DRY_RUN) return;
  const r = await fetch(`${BASE}/${id}`, {
    method: 'PATCH', headers: { 'X-MICROCMS-API-KEY': KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify(fields),
  });
  if (!r.ok) throw new Error(`PATCH ${id} HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
}

async function main(): Promise<void> {
  console.log(`[title-fix] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const by = new Map(all.map((p) => [p.slug, p]));

  for (const f of FIXES) {
    const p = by.get(f.slug);
    if (!p) { console.log(`  [miss] ${f.slug}`); continue; }
    if (p.name === f.name) { console.log(`  [skip-done] ${f.slug} 既に整形済`); continue; }
    const newBody = (p.body || '').replace(f.bodyFrom, f.bodyTo);
    console.log(`  [${f.slug}]`);
    console.log(`     title「${p.name}」→「${f.name}」`);
    console.log(`     body <strong> 同期: ${p.body !== newBody ? '適用' : '対象なし(要確認)'}`);
    console.log(`     不変: op「${p.operator}」/ MW ${p.outputMw} / MWh ${p.capacityMwh} / 所在 ${p.prefecture}${p.city} / status[${(p.status || []).join(',')}] / 出典`);
    await patch(p.id, { name: f.name, body: newBody });
  }
  console.log(`[done] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
