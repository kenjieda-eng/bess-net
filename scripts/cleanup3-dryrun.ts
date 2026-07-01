/**
 * scripts/cleanup3-dryrun.ts （読み取り専用・dry-run）
 * ③ の before→after を提示。microCMS GET のみ（PATCH/POST/DELETEなし）。
 *   PART A: city が prefecture を二重包含する entry を全検出（city.startsWith(prefecture) かつ city≠prefecture）。
 *           after=先頭prefecture除去。除去後が空/空白の edge を別リスト化。
 *   PART B: pr-co109041-gunma-148mwh と olympia-ota-isesaki を全フィールド並置（同一/別判定の材料）。
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

async function main(): Promise<void> {
  const all = await getAllProjects();
  console.log(`projects=${all.length}`);

  console.log('\n==================== PART A: 所在地二重県 検出 ====================');
  const hits: { slug: string; pref: string; city: string; after: string; edge: boolean }[] = [];
  for (const p of all) {
    const pref = (p.prefecture || '').trim();
    const city = (p.city || '').trim();
    if (!pref || !city) continue;
    if (city.startsWith(pref) && city !== pref && city.length > pref.length) {
      const after = city.slice(pref.length).trim();
      hits.push({ slug: p.slug, pref, city, after, edge: after.length === 0 });
    }
  }
  const normal = hits.filter((h) => !h.edge);
  const edges = hits.filter((h) => h.edge);
  console.log(`該当=${hits.length}件（通常=${normal.length} / edge除去後空=${edges.length}）`);
  for (const h of normal) console.log(`  [${h.slug}] pref=「${h.pref}」 city=「${h.city}」→「${h.after}」`);
  if (edges.length) { console.log(`  --- edge（除去後が空＝変更しない・報告のみ）---`); for (const h of edges) console.log(`  [${h.slug}] pref=「${h.pref}」 city=「${h.city}」→（空・スキップ）`); }

  console.log('\n==================== PART B: オリンピア重複比較 ====================');
  for (const slug of ['pr-co109041-gunma-148mwh', 'olympia-ota-isesaki']) {
    const p = all.find((x) => x.slug === slug);
    if (!p) { console.log(`  [miss] ${slug}`); continue; }
    console.log(`\n  [${slug}] id=${p.id}`);
    console.log(`     title=「${p.name}」`);
    console.log(`     operator=「${p.operator}」 / epc=「${(p as any).epc ?? ''}」`);
    console.log(`     MW=${p.outputMw} / MWh=${p.capacityMwh}`);
    console.log(`     所在=「${p.prefecture}」/「${p.city}」 / status=[${(p.status || []).join(',')}] / cod=「${p.cod}」`);
    console.log(`     sourceUrl=${p.sourceUrl}`);
    console.log(`     body=${(p.body || '').replace(/\s+/g, ' ').slice(0, 500)}`);
  }
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
