/**
 * scripts/projects-agora-stage3-post.ts
 *
 * /projects × agora ステージ3 — 未掲載11件を新規 POST（ステージ2 PART B 提示案そのまま）。
 * 出典(agora=正): https://agora.ex.nii.ac.jp/earthquake/201103-eastjapan/energy/electrical-japan/type/9.html.ja
 *
 * 安全: microCMS は新規 POST のみ（DELETE/PUT/PATCH なし）。冪等（slug 既存なら skip＋報告＝中断はしない）。
 *   捏造しない（不明な所在地/容量/status/運開は送らず空＝既存に status空 project あり実証済）。
 *   POST 前に再度 slug/title 衝突チェック。落とし穴#104（module化）。
 *
 * 実行: (env 読込後) npx tsx scripts/projects-agora-stage3-post.ts [--dry-run]
 */
export {};
import { getAllProjects } from '../src/lib/microcms';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;
const AGORA_URL = 'https://agora.ex.nii.ac.jp/earthquake/201103-eastjapan/energy/electrical-japan/type/9.html.ja';

async function apiFetch(method: string, url: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!resp.ok) throw new Error(`${method} ${url} → HTTP ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
  return resp.json();
}

type NewEntry = { slug: string; name: string; operator: string; outputMw: number; prefecture: string; city: string };
const NEW_ENTRIES: NewEntry[] = [
  { slug: 'kita-toyotomi-bess',            name: '北豊富変電所蓄電池設備',                operator: '北海道北部風力送電',                       outputMw: 240,    prefecture: '北海道', city: '豊富町' },
  { slug: 'shinkawa-dax-bess',             name: 'しんかわ蓄電所',                        operator: '合同会社DAX',                             outputMw: 50,     prefecture: '',     city: '' },
  { slug: 'okiden-miyako-2-bess',          name: '宮古第二発電所供給用蓄電池',            operator: '沖縄電力',                                 outputMw: 12,     prefecture: '沖縄県', city: '宮古島市' },
  { slug: 'teras-nagasaki-koyagi-bess',    name: 'テラスエナジー長崎香焼エナジーストレージ', operator: 'テラスエナジー',                           outputMw: 2,      prefecture: '長崎県', city: '長崎市香焼' },
  { slug: 'nakagawa-daiichi-bess',         name: '第一系統用蓄電所',                      operator: '中川商事',                                 outputMw: 2,      prefecture: '',     city: '' },
  { slug: 'sakaino-johyo-bess',            name: '境野蓄電所',                            operator: '株式会社城洋商事',                         outputMw: 2,      prefecture: '',     city: '' },
  { slug: 'sagamihara-tokyu-bess',         name: '相模原蓄電所',                          operator: '東急建設',                                 outputMw: 1.999,  prefecture: '神奈川県', city: '相模原市' },
  { slug: 'oly-powerstorage-midorimachi',  name: 'OLYPowerstorage緑町',                  operator: 'オリンピア',                               outputMw: 1.998,  prefecture: '',     city: '' },
  { slug: 'oly-powerstorage-mimurocho',    name: 'OLYPowerstorage三室町',                operator: 'オリンピア',                               outputMw: 1.998,  prefecture: '',     city: '' },
  { slug: 'noval-power-c3-bess',           name: 'ノーバル・パワーC3',                    operator: '合同会社ノーバル・ソーラー',               outputMw: 1.9272, prefecture: '',     city: '' },
  { slug: 'tagawa-ntt-kyuden-bess',        name: '田川蓄電所',                            operator: 'NTTアノードエナジー／九州電力／三菱商事', outputMw: 1.4,    prefecture: '福岡県', city: '田川市' },
];

async function main(): Promise<void> {
  console.log(`[agora-stage3-post] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  const all = await getAllProjects();
  const slugs = new Set(all.map((p) => p.slug));
  const titles = new Map<string, string[]>();
  for (const p of all) { const t = (p.name || '').trim(); (titles.get(t) ?? titles.set(t, []).get(t)!).push(p.slug); }
  const before = all.length;
  console.log(`projects 現在(microCMS全件)=${before}`);

  let ok = 0, skip = 0, err = 0;
  for (const e of NEW_ENTRIES) {
    try {
      if (slugs.has(e.slug)) { console.log(`  [skip-dup] ${e.slug}: slug 既存`); skip++; continue; }
      const tdup = titles.get(e.name.trim()) ?? [];
      if (tdup.length) console.log(`  [warn] ${e.slug}: 同名title既存(${tdup.join(',')}) — 別案件のため作成は継続`);
      // 捏造しない: 不明フィールド(status/capacityMwh/cod)は送らない。空所在地も送らない。
      const body: Record<string, unknown> = { slug: e.slug, name: e.name, operator: e.operator, outputMw: e.outputMw, sourceUrl: AGORA_URL };
      if (e.prefecture) body.prefecture = e.prefecture;
      if (e.city) body.city = e.city;
      if (DRY_RUN) { console.log(`  [dry] POST ${e.slug}: ${e.name} / ${e.operator} / ${e.outputMw}MW / ${e.prefecture}${e.city}`); ok++; continue; }
      const r = (await apiFetch('POST', BASE, body)) as { id: string };
      console.log(`  [ok] ${e.slug} — created id=${r.id}`);
      ok++;
    } catch (er) { console.error(`  [err] ${e.slug}: ${(er as Error).message}`); err++; }
    await new Promise<void>((res) => setTimeout(res, 300));
  }
  console.log(`\n[done] ${DRY_RUN ? '(対象)' : 'POST'}=${ok} skip-dup=${skip} err=${err}`);
  if (!DRY_RUN) {
    const after = (await getAllProjects()).length;
    console.log(`projects 件数(microCMS全件): ${before} → ${after}（+${after - before}）`);
  }
  process.exit(err > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
