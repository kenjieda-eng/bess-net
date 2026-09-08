#!/usr/bin/env tsx
/** scripts/scout-pj2g-2026-09-08.ts — Pj2-G 読取専用スカウト（書込ゼロ）。対象30レコードの全field＋掲載件数・合計値 */
import * as fs from 'node:fs';
const D = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const H = { headers: { 'X-MICROCMS-API-KEY': KEY } };
const EP = `https://${D}.microcms.io/api/v1/projects`;
const SLUGS = [
  // ■1 301
  'pr-co160356-bess', 'pr-co96742-mie-8mwh',
  // ✅ 実行対象
  'pr-co161802-gifu', 'pr-co161802-shimane', 'pr-co161802-yamaguchi', 'pr-co168085-saga',
  'pr-co176494-okayama', 'pr-co43349-bess', 'pr-co69153-ibaraki', 'pr-co69153-ibaraki-2',
  'pr-co69153-ibaraki-3', 'pr-co86244-tochigi-8mwh', 'pr-co88876-bess', 'pr-co98598-bess', 'pr-looop-saitama',
  // ⚠️ 条件付き
  'pr-co140317-bess', 'pr-co161802-fukushima', 'pr-co161802-gifu-3', 'pr-co161802-kumamoto-2',
  'pr-co161802-saga-2', 'pr-co166651-bess',
  // (4) 実行系＋同定調査
  'pr-co109041-gunma', 'pr-co85634-fukuoka', 'pr-co109041-hyogo', 'pr-co161802-miyagi', 'kyuden-omuta-reuse',
  'jpn-gifu-sendai', 'nc-sendai-kamiayashi',
  // (5) 提案のみ
  'hexa-fukushima-tokyogas-offtake', 'pr-co154894-bess', 'pr-co28193-bess',
];
type Rec = Record<string, unknown>;
async function main(): Promise<void> {
  const out: Record<string, Rec | null> = {};
  for (const slug of SLUGS) {
    const d = await fetch(`${EP}?filters=slug[equals]${slug}&limit=1`, H).then((r) => r.json() as Promise<{ contents: Rec[] }>);
    const c = d.contents[0] ?? null;
    out[slug] = c;
    if (!c) { console.log(`\n== ${slug}: ★不在`); continue; }
    console.log(`\n== ${slug} (id=${c.id})`);
    for (const k of ['name', 'status', 'outputMw', 'capacityMwh', 'prefecture', 'city', 'operator', 'epc', 'cod', 'sourceUrl', 'latitude', 'longitude']) {
      console.log(`   ${k}: ${JSON.stringify(c[k])}`);
    }
    console.log(`   body(先頭160): ${String(c.body ?? '').replace(/<[^>]+>/g, '').slice(0, 160)}`);
    await new Promise((r) => setTimeout(r, 180));
  }
  // 全件の掲載件数・合計値（before スナップショット）
  const all: Rec[] = [];
  for (let off = 0; off < 500; off += 100) {
    const d = await fetch(`${EP}?fields=slug,status,outputMw,capacityMwh&limit=100&offset=${off}`, H).then((r) => r.json() as Promise<{ totalCount: number; contents: Rec[] }>);
    all.push(...d.contents);
    if (all.length >= d.totalCount) break;
  }
  const sumMw = all.reduce((a, p) => a + (Number(p.outputMw) || 0), 0);
  const sumMwh = all.reduce((a, p) => a + (Number(p.capacityMwh) || 0), 0);
  console.log(`\n=== before スナップショット: 総件数 ${all.length} / 合計 outputMw ${sumMw.toFixed(3)} / 合計 capacityMwh ${sumMwh.toFixed(3)}`);
  out.__all = all as unknown as Rec;
  fs.writeFileSync('scripts/.scout-pj2g.json', JSON.stringify(out, null, 2));
  console.log('→ 保存: scripts/.scout-pj2g.json');
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
export {};
