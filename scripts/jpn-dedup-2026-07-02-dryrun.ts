/**
 * scripts/jpn-dedup-2026-07-02-dryrun.ts （Stage A・読み取り専用）
 * 日本蓄電池 PR-import（pr-co161802-系・容量0・会社HP出典）を curated兄弟（jpn-系 / nc-系・容量保有）に
 * name/所在地で対応付け、301マップ案を提示。適用しない。microCMS GET のみ。
 */
export {};
import * as fs from 'node:fs';
import { getAllProjects } from '../src/lib/microcms';

const OUT = process.argv.find((a) => a.startsWith('--out='))?.slice(6) || 'tmp/jpn-dedup-dryrun.txt';
const L: string[] = [];
const w = (s = '') => L.push(s);

// 所在地/nameから 市区町村トークンを抽出（【…】や社名prefixを除去して 〇〇市/町/村 を拾う）
function cityToken(...parts: (string | undefined)[]): string {
  const s = parts.map((p) => p || '').join(' ').replace(/【[^】]*】/g, ' ');
  const m = s.match(/([一-龥ぁ-んァ-ヶ]{2,}?[市町村])/);
  return m ? m[1] : '';
}
function isJpn(op?: string): boolean { return /日本蓄電池/.test(op || ''); }

async function main(): Promise<void> {
  const all = await getAllProjects();
  const prImports = all.filter((p) => /^pr-co161802/.test(p.slug) && isJpn(p.operator));
  const curated = all.filter((p) => /^(jpn-|nc-)/.test(p.slug) && isJpn(p.operator));

  w(`日本蓄電池 PR-import(pr-co161802-*)=${prImports.length}件 / curated兄弟(jpn-*/nc-*)=${curated.length}件`);

  // curated 索引: prefecture|cityToken
  const idx = new Map<string, typeof curated>();
  w(`\n---- curated兄弟 一覧 ----`);
  for (const c of curated) {
    const ct = c.city || cityToken(c.name, c.city);
    const key = `${c.prefecture || ''}|${ct}`;
    (idx.get(key) ?? idx.set(key, []).get(key)!).push(c);
    w(`  [${c.slug}] 「${c.name}」 ${c.prefecture}/${c.city} MW=${c.outputMw} MWh=${c.capacityMwh} status=[${(c.status || []).join(',')}] cod=${c.cod}`);
  }

  w(`\n---- 301マップ案（PR-import → curated兄弟）----`);
  const proposals: { pr: string; canon: string }[] = [];
  const singles: string[] = [];
  for (const p of prImports) {
    const ct = cityToken(p.name, p.city, p.prefecture);
    const key = `${p.prefecture || ''}|${ct}`;
    const hits = (idx.get(key) || []).filter((c) => c.slug); // 同pref+同市
    w(`\n  PR-import [${p.slug}] 「${p.name}」 ${p.prefecture || 'null'}/${p.city || 'null'} MW=${p.outputMw} MWh=${p.capacityMwh} status=[${(p.status||[]).join(',')}]`);
    w(`     抽出city=「${ct}」 出典=${p.sourceUrl}`);
    if (hits.length === 1) {
      const c = hits[0];
      proposals.push({ pr: p.slug, canon: c.slug });
      w(`     → 301候補: ${p.slug} ⇒ ${c.slug}（「${c.name}」${c.prefecture}/${c.city} ${c.capacityMwh}MWh）★同一pref+市`);
    } else if (hits.length > 1) {
      w(`     → 要判断: 同pref+市の curated 複数 [${hits.map((h) => h.slug).join(', ')}]`);
      singles.push(p.slug);
    } else {
      w(`     → 単独（対応curated兄弟なし・要一次情報の容量補完）`);
      singles.push(p.slug);
    }
  }

  w(`\n======== サマリ ========`);
  w(`301候補ペア=${proposals.length}件 / 単独or要判断=${singles.length}件`);
  w(`\n301マップ案（コピー用）:`);
  for (const pr of proposals) w(`  '/projects/${pr.pr}': '/projects/${pr.canon}',`);
  w(`\n単独扱い（301しない・容量補完候補）:`);
  for (const s of singles) w(`  ${s}`);

  fs.writeFileSync(OUT, L.join('\n'), 'utf8');
  process.stdout.write(`WROTE ${OUT} (${L.length} lines)\n`);
  process.stdout.write(`prImports=${prImports.length} curated=${curated.length} proposals=${proposals.length} singles=${singles.length}\n`);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
