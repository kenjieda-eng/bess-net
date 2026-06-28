/**
 * scripts/projects-301-dryrun.ts — projects 重複301統合 dry-run（読み取り専用・microCMS書き込み0）
 * getAllProjects() で対象 slug の現データを取得し、301マップ案＋canonical/旧の比較を print。
 * グループ4・5 は両 entry を並べて canonical 判断材料を提示。適用は別途。
 */
export {};
import { getAllProjects, type Project } from '../src/lib/microcms';

const GROUPS: { name: string; canonical: string; olds: string[] }[] = [
  { name: '1 千里蓄電所',        canonical: 'osakagas-suita',      olds: ['pr-co76147-bess', 'pr-co139670-bess'] },
  { name: '2 上奈良蓄電所',      canonical: 'kaminara-bess',       olds: ['pr-co173175-saitama-5mwh'] },
  { name: '3 琵琶湖蓄電所',      canonical: 'pr-co18049-bess',     olds: ['pr-co85927-bess-2'] },
  { name: '4 群馬太田市蓄電所',  canonical: 'ota-bess',            olds: ['gunma-ota'] },          // 要比較
  { name: '5 石川県加賀市2MW/4MWh', canonical: 'pr-2mw-4mwh-bess-2', olds: ['pr-2mw-4mwh-bess-3'] }, // 要比較
];

function fields(p: Project | undefined): string {
  if (!p) return '【欠落】';
  const n = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : String(v));
  // 情報量スコア（欠落でない主要フィールド数）
  const score = [p.prefecture, p.city, p.outputMw, p.capacityMwh, p.operator, p.epc, p.cod, p.body]
    .filter((v) => v !== undefined && v !== null && v !== '' && v !== 0).length;
  return `name=「${n(p.name)}」 pref=${n(p.prefecture)}/${n(p.city)} MW=${n(p.outputMw)} MWh=${n(p.capacityMwh)} op=${n(p.operator)} epc=${n(p.epc)} cod=${n(p.cod)} body=${p.body ? p.body.length + '字' : '—'} status=${(p.status || []).join(',')} [score=${score}]`;
}

async function main(): Promise<void> {
  const all = await getAllProjects();
  const bySlug = new Map(all.map((p) => [p.slug, p]));
  console.log(`[dryrun] getAllProjects: ${all.length} 件\n`);
  console.log('=== 301マップ案（旧 → canonical）===');
  for (const g of GROUPS) for (const o of g.olds) console.log(`  /projects/${o}  →  /projects/${g.canonical}`);
  console.log('');

  for (const g of GROUPS) {
    console.log(`── グループ ${g.name}`);
    const c = bySlug.get(g.canonical);
    console.log(`  ◎canonical ${g.canonical}: ${fields(c)}`);
    for (const o of g.olds) {
      const op = bySlug.get(o);
      console.log(`  →301 旧 ${o}: ${fields(op)}`);
      // 旧にあって canonical に無い情報（補完候補）
      if (c && op) {
        const gaps: string[] = [];
        const keys: (keyof Project)[] = ['prefecture', 'city', 'outputMw', 'capacityMwh', 'operator', 'epc', 'cod'];
        for (const k of keys) {
          const cv = c[k], ov = op[k];
          const cEmpty = cv === undefined || cv === null || cv === '' || cv === 0;
          const oFilled = !(ov === undefined || ov === null || ov === '' || ov === 0);
          if (cEmpty && oFilled) gaps.push(`${k}: canonical=空 / 旧=${ov}`);
        }
        if (gaps.length) console.log(`     ⚠ 補完候補（旧にあり canonical に無い）: ${gaps.join(' ; ')}`);
        else console.log(`     ✓ canonical は旧の主要情報を網羅（補完不要）`);
      }
    }
    console.log('');
  }
}
main().catch((e) => { console.error('ERROR:', e); process.exit(1); });
