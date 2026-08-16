/**
 * scripts/experimental/projects-audit-fetch.ts
 *
 * /projects 品質監査ステージ1（読み取り専用）。
 * getAllProjects() を 1 回だけ呼び（offset ページング・contains 不使用＝鉄則#1/#97/#98）、
 * 監査に必要なフィールドだけ tmp/projects-raw.json に書き出す。分類は Python 側で行う。
 * 書き込み・PATCH・push は一切しない。
 *
 * 実行: (env 読込後) npx tsx scripts/experimental/projects-audit-fetch.ts
 */
export {};
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAllProjects } from '../../src/lib/microcms';

async function main(): Promise<void> {
  const projects = await getAllProjects();
  const out = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name ?? '',
    status: Array.isArray(p.status) ? p.status : [],
    outputMw: p.outputMw ?? null,
    capacityMwh: p.capacityMwh ?? null,
    prefecture: p.prefecture ?? null,
    city: p.city ?? null,
    operator: p.operator ?? null,
    epc: p.epc ?? null,
    cod: p.cod ?? null,
    publishedAt: p.publishedAt ?? '',
  }));
  const dir = path.join(process.cwd(), 'tmp');
  fs.mkdirSync(dir, { recursive: true });
  const outPath = path.join(dir, 'projects-raw.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`fetched ${out.length} projects → ${outPath}`);
}

main().catch((e) => {
  console.error('ERROR:', e);
  process.exit(1);
});
