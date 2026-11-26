#!/usr/bin/env tsx
/**
 * scripts/build-projects-posts-2026-11-26.ts — au×JPN の 3 拠点を登録する便（_QUEUE.md 143 行）の POST の計画を作る（読むだけ）
 *
 * 計画: reports/projects-plan-2026-11-26-I_ユウ.json（sha256 先頭 16 桁 fcc911af5370e4ac）＝OneDrive の正本の写し。
 * やること（microCMS は GET だけ・書込 0）: posts の slug が microCMS に無いことを確かめ、applier（scripts/apply-projects-2026-11-26.ts → runApplier）の形に書く。
 * slug が既にあれば、その件は計画に入れない（problems に書く）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/build-projects-posts-2026-11-26.ts
 */
import * as fs from 'node:fs';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const PLAN_IN = 'reports/projects-plan-2026-11-26-I_ユウ.json';
const OUT = 'reports/projects-au-jpn-3sites-2026-11-26.json';
const EP = `https://${DOMAIN}.microcms.io/api/v1/projects`;
const yu = JSON.parse(fs.readFileSync(PLAN_IN, 'utf8')) as { posts: { key: string; slug: string; payload: Record<string, unknown> }[] };
const SELECTS: Record<string, string[]> = { status: ['稼働中', '建設中', '計画中'], marketParticipation: ['JEPX', '需給調整市場', '容量市場'] };

async function main(): Promise<void> {
  const problems: string[] = [];
  const posts: Record<string, unknown>[] = [];
  let gets = 0;
  for (const p of yu.posts) {
    if (p.payload.slug !== p.slug) { problems.push(`${p.key}: payload.slug が slug と違う`); continue; }
    for (const [f, opts] of Object.entries(SELECTS)) {
      const v = p.payload[f];
      if (Array.isArray(v) && v.some((x) => !opts.includes(String(x)))) problems.push(`${p.key}: ${f} ${JSON.stringify(v)} が選択肢に無い`);
    }
    gets++;
    const r = await fetch(`${EP}?filters=slug[equals]${encodeURIComponent(p.slug)}&limit=1&depth=0&fields=id`, { headers: { 'X-MICROCMS-API-KEY': KEY! } });
    const j = (await r.json()) as { totalCount: number };
    if (j.totalCount !== 0) { problems.push(`${p.key} ${p.slug}: 既にある（${j.totalCount} 件）→ 書かない`); continue; }
    posts.push({ ep: 'projects', slug: p.slug, row_id: p.key, order: posts.length + 1, payload: p.payload });
    await new Promise((x) => setTimeout(x, 300));
  }
  const out = {
    note: `au×JPN の 3 拠点を登録する便（_QUEUE.md 143 行）。ユウの計画（${PLAN_IN}）の posts を、書込直前の GET で slug の空きを確かめて applier の形にしたもの。scripts/apply-projects-2026-11-26.ts（runApplier）が読む。既定 dry run・本実行は --apply。`,
    generated: new Date().toISOString(),
    checks: { problems },
    plan: { posts, patches: [] },
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(`[計画] POST ${posts.length} → ${OUT}`);
  console.log(`[problems] ${problems.length}${problems.length ? `: ${problems.join(' ／ ')}` : ''}`);
  console.log(`[microCMS] GET ${gets}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
