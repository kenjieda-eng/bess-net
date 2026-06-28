/**
 * scripts/fix-links-description-dedup-2026-06.ts
 *
 * /links 改善ステージ2A — description 先頭の重複バグ修正（116件想定）。
 * 先頭で「【{title} とは】\n\n{title}は、」が N回（N≥2）連続する場合、1回に畳む。
 * 本文（実際の説明）は一切変更しない（L-EIC-019・捏造なし）。description のみ PATCH。
 *
 * 安全: getAllLinks() 1スキャン（contains不使用）。冪等（既に1回なら skip）。
 *   microCMS は description PATCH のみ（他フィールド・本文不変）。落とし穴#104（module化）。
 *
 * 実行: (env 読込後) npx tsx scripts/fix-links-description-dedup-2026-06.ts [--dry-run]
 */
export {};
import { getAllLinks } from '../src/lib/microcms';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/links`;

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// 先頭の (【T とは】\n\nTは、) の連続を1つに畳む
function fixDup(title: string, desc: string): { fixed: string; removed: number } {
  const unit = `【${title} とは】\n\n${title}は、`;
  const m = desc.match(new RegExp('^(' + escapeRe(unit) + ')+'));
  if (!m) return { fixed: desc, removed: 0 };
  const run = m[0];
  const k = run.split(unit).length - 1; // 連続出現数
  if (k <= 1) return { fixed: desc, removed: 0 };
  return { fixed: unit + desc.slice(run.length), removed: k - 1 };
}

async function patchDescription(id: string, description: string): Promise<void> {
  if (DRY_RUN) return;
  const resp = await fetch(`${BASE}/${id}`, {
    method: 'PATCH',
    headers: { 'X-MICROCMS-API-KEY': API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({ description }),
  });
  if (!resp.ok) throw new Error(`PATCH ${id} HTTP ${resp.status}: ${(await resp.text()).slice(0, 200)}`);
}

const head = (s: string, n = 150) => (s || '').replace(/\n\n/g, '⏎⏎').replace(/\n/g, '⏎').slice(0, n);

async function main(): Promise<void> {
  console.log(`[fix-links-dedup] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const links = await getAllLinks();
  console.log(`getAllLinks: ${links.length} 件`);

  let ok = 0, skip = 0, err = 0;
  const removedTotals: number[] = [];
  for (const l of links) {
    const desc = l.description || '';
    const { fixed, removed } = fixDup(l.title, desc);
    if (removed < 1) { skip++; continue; }
    try {
      console.log(`  [${DRY_RUN ? 'dry' : 'fix'}] ${l.slug} (除去${removed})`);
      console.log(`     現: ${head(desc)}`);
      console.log(`     新: ${head(fixed)}`);
      await patchDescription(l.id, fixed);
      ok++; removedTotals.push(removed);
    } catch (e) {
      console.error(`  [err] ${l.slug}: ${(e as Error).message}`); err++;
    }
  }
  console.log(`\n[done] ${DRY_RUN ? '(対象)' : 'PATCH'} ok=${ok}  skip(既クリーン)=${skip}  err=${err}`);
  const dist: Record<number, number> = {};
  for (const r of removedTotals) dist[r] = (dist[r] || 0) + 1;
  console.log(`  除去数分布: ${JSON.stringify(dist)}  mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  process.exit(err > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
