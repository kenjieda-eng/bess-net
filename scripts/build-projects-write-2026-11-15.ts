#!/usr/bin/env tsx
/**
 * scripts/build-projects-write-2026-11-15.ts — projects 便（11/13 のニュースに出た設備の登録と更新・POST 8・PATCH 6 件）の書込計画を作る（読むだけ）
 *
 * 計画: reports/projects-plan-2026-11-15_ユウ.json（OneDrive の正本の写し・sha256 先頭 16 桁 48cc5d8ffe53816f）。
 * やること（microCMS は GET だけ・書込 0）:
 *   1. projects を全件 GET（baseline）。件数・11/13 以降に更新されたレコードを出す。
 *   2. POST 8 件の不在の再確認（slug の衝突・名称／所在地／社名の部分一致）。
 *   3. PATCH 6 件: slug → id・計画の old と GET の値の照合（「空」は null・[]・''・未設定を同じに扱う）・keep と GET の照合。
 *      U4・U5 は本文の末尾の段落が注記の段落（insert_before）で、それがちょうど 1 回であることを確かめる。
 *   4. applier（scripts/apply-projects-2026-11-15.ts → runApplier）の計画 reports/projects-write-2026-11-15.json を書く。
 *      数値・配列・空の欄は「配列・JSON 値モード」の op、文字列は生の置換（old は GET の値）。expect_final は最終状態の digest。
 *   5. 見るだけ: 計画の look_only の 4 行の名前が projects の全件にあるか。
 * 照合が 1 つでも合わない件は計画に入れない（problems に書く）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/build-projects-write-2026-11-15.ts [--baseline-out=…]
 */
import * as fs from 'node:fs';
import { digest } from './lib/microcms-applier';
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) { console.error('MICROCMS_API_KEY 未設定'); process.exit(1); }
const PLAN_IN = 'reports/projects-plan-2026-11-15_ユウ.json';
const OUT = 'reports/projects-write-2026-11-15.json';
const BASELINE_OUT = process.argv.find((a) => a.startsWith('--baseline-out='))?.slice(15);
const EP = `https://${DOMAIN}.microcms.io/api/v1/projects`;

type Rec = Record<string, unknown> & { id: string; slug: string };
type YOp = { field: string; old: unknown; new: unknown; insert?: string; insert_before?: string };
type YPatch = { key: string; slug: string; ops: YOp[]; keep: Record<string, unknown> };
type YPost = { key: string; slug: string; payload: Record<string, unknown> };
const yu = JSON.parse(fs.readFileSync(PLAN_IN, 'utf8')) as { posts: YPost[]; patches: YPatch[]; look_only: { name: string }[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
let gets = 0;
async function get<T>(url: string): Promise<T> {
  for (let a = 0; ; a++) {
    gets++;
    const r = await fetch(url, { headers: { 'X-MICROCMS-API-KEY': KEY! } });
    if (r.status === 429 && a < 4) { await sleep(2000 * (a + 1)); continue; }
    if (!r.ok) throw new Error(`GET ${url.replace(/\?.*/, '')} → HTTP ${r.status}`);
    return r.json() as T;
  }
}
const isEmpty = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);
const same = (a: unknown, b: unknown) => (isEmpty(a) && isEmpty(b)) || JSON.stringify(a) === JSON.stringify(b);
const SELECTS: Record<string, string[]> = { status: ['稼働中', '建設中', '計画中'], marketParticipation: ['需給調整市場'] };

async function main(): Promise<void> {
  // 1. baseline（全件・offset ページング・一意な第二キー＝#124）
  const fetchedAt = new Date().toISOString();
  const first = await get<{ totalCount: number }>(`${EP}?limit=0`);
  const all: Rec[] = [];
  for (let off = 0; off < first.totalCount; off += 100) {
    const r = await get<{ contents: Rec[] }>(`${EP}?limit=100&offset=${off}&orders=-publishedAt,-createdAt&depth=0`);
    all.push(...r.contents);
    await sleep(300);
  }
  const ids = new Set(all.map((x) => x.id));
  console.log(`[baseline] totalCount ${first.totalCount}・取得 ${all.length}・id の重複 ${all.length - ids.size}（${fetchedAt}）`);
  const bySlug = new Map(all.map((x) => [x.slug, x]));
  const since = all.filter((x) => String(x.updatedAt ?? '') >= '2026-11-12T15:00:00.000Z' || String(x.createdAt ?? '') >= '2026-11-12T15:00:00.000Z')
    .map((x) => ({ slug: x.slug, id: x.id, name: x.name, createdAt: x.createdAt, updatedAt: x.updatedAt }));
  console.log(`[baseline] 2026-11-13 00:00 JST 以降に作成・更新: ${since.length} 件${since.length ? ` → ${since.map((s) => s.slug).join('・')}` : ''}`);
  if (BASELINE_OUT) fs.writeFileSync(BASELINE_OUT, JSON.stringify({ fetchedAt, totalCount: first.totalCount, contents: all }, null, 1));

  const problems: string[] = [];
  const txt = (x: Rec) => ['name', 'city', 'prefecture', 'operator', 'epc'].map((k) => String(x[k] ?? '')).join('｜');

  // 2. POST の不在の再確認
  //   キー: 名称の固有部分・所在地の固有部分・社名（＋所在地）。既に裁定で「別の設備」とされた既存（arao-bess・buddynet-fujinomiya-bess・pr-co161802-saga*）は known として分けて出す。
  //   ★社名は「同じ所在地（市町村）での一致」だけを同じ設備の候補にする（社名だけの一致＝その社のほかの土地の設備は、別の設備として一覧に出すだけ）。
  //     2026-11-15 の 1 回目は社名だけの一致も止めにしたため、P4〜P7 がブルースカイエナジーの他県の 7 か所で止まった（中津・みやき・大崎・姫路・牧之原ほか）。
  const ABS: Record<string, { name: string[]; place: string[]; company: [string, string][]; companyAny: string[] }> = {
    P1: { name: ['浜玉', '浜崎'], place: ['浜玉'], company: [['クラフティア', '唐津'], ['日本蓄電池', '唐津'], ['リミックスポイント', '唐津'], ['デジタルグリッド', '唐津']], companyAny: [] },
    P2: { name: ['府本', '打越'], place: ['府本', '荒尾'], company: [['クラフティア', '荒尾'], ['日本蓄電池', '荒尾']], companyAny: [] },
    P3: { name: ['新屋町', '境港'], place: ['境港'], company: [['NAMIJU', '境港'], ['エンブルー', '境港']], companyAny: ['NAMIJU'] },
    P4: { name: ['いわき'], place: ['いわき'], company: [['野村不動産', 'いわき'], ['ブルースカイ', 'いわき']], companyAny: ['野村不動産', 'ブルースカイ'] },
    P5: { name: ['児玉'], place: ['児玉'], company: [['野村不動産', '児玉'], ['ブルースカイ', '児玉']], companyAny: ['野村不動産', 'ブルースカイ'] },
    P6: { name: ['前橋'], place: ['前橋'], company: [['野村不動産', '前橋'], ['ブルースカイ', '前橋']], companyAny: ['野村不動産', 'ブルースカイ'] },
    P7: { name: ['富士宮'], place: ['富士宮'], company: [['野村不動産', '富士宮'], ['ブルースカイ', '富士宮']], companyAny: ['野村不動産', 'ブルースカイ'] },
    P8: { name: ['益城'], place: ['益城'], company: [['エー・ディー・ワークス', '益城'], ['ADワークス', '益城'], ['ADW', '益城']], companyAny: [] },
  };
  const KNOWN_DIFFERENT: Record<string, string[]> = {
    P1: ['pr-co161802-saga', 'pr-co161802-saga-2'],
    // arao-bess（荒尾蓄電所・テレビショッピング研究所）は便 §2-8 で別の設備。pr-afterfit-bess・pr-co55631-kumamoto は arao-bess への 301（projects-301.ts 53・54 行「3重登載」）
    P2: ['arao-bess', 'pr-afterfit-bess', 'pr-co55631-kumamoto'],
    P7: ['buddynet-fujinomiya-bess'],
    P8: ['adw-kumamoto-bess'],
  };
  const absence: Record<string, unknown>[] = [];
  const okPosts: YPost[] = [];
  for (const p of yu.posts) {
    const k = ABS[p.key];
    const slugHit = bySlug.has(p.slug);
    const hits = all.filter((x) => {
      const n = String(x.name ?? ''), c = `${x.prefecture ?? ''}${x.city ?? ''}`, co = `${x.operator ?? ''}｜${x.epc ?? ''}`;
      return k.name.some((w) => n.includes(w)) || k.place.some((w) => c.includes(w)) || k.company.some(([w, pl]) => co.includes(w) && (c.includes(pl) || n.includes(pl)));
    }).map((x) => ({ slug: x.slug, text: txt(x) }));
    const hitSlugs = new Set(hits.map((h) => h.slug));
    const companyOnly = all.filter((x) => !hitSlugs.has(x.slug) && k.companyAny.some((w) => `${x.operator ?? ''}｜${x.epc ?? ''}｜${x.name ?? ''}`.includes(w)))
      .map((x) => ({ slug: x.slug, text: txt(x) }));
    const known = hits.filter((h) => (KNOWN_DIFFERENT[p.key] ?? []).includes(h.slug));
    const other = hits.filter((h) => !(KNOWN_DIFFERENT[p.key] ?? []).includes(h.slug));
    absence.push({ key: p.key, slug: p.slug, slug_collision: slugHit, hits_known_different: known, hits_other: other, company_only_other_place: companyOnly });
    console.log(`[不在] ${p.key} ${p.slug}: slug ${slugHit ? '★衝突' : '0'}・名称／所在地／同じ所在地の社名の一致 ${hits.length}（裁定で別の設備 ${known.length}${known.length ? `: ${known.map((h) => h.slug).join('・')}` : ''}／ほか ${other.length}${other.length ? `: ${other.map((h) => `${h.slug}〔${h.text}〕`).join(' ／ ')}` : ''}）・社名だけの一致（ほかの土地）${companyOnly.length}${companyOnly.length ? `: ${companyOnly.map((h) => h.slug).join('・')}` : ''}`);
    for (const [f, opts] of Object.entries(SELECTS)) {
      const v = p.payload[f];
      if (v !== undefined && (!Array.isArray(v) || v.some((x) => !opts.includes(String(x))))) problems.push(`${p.key} ${f} ${JSON.stringify(v)} が選択肢に無い`);
    }
    if (slugHit || other.length) problems.push(`${p.key} ${p.slug}: ${slugHit ? 'slug 衝突' : ''}${other.length ? `部分一致 ${other.length} 件（${other.map((h) => h.slug).join('・')}）` : ''} → POST しない`);
    else okPosts.push(p);
  }

  // 3. PATCH の old・keep の照合
  const oldCheck: Record<string, unknown>[] = [];
  const keepCheck: Record<string, unknown>[] = [];
  const okPatches: { y: YPatch; rec: Rec }[] = [];
  for (const p of yu.patches) {
    const rec = bySlug.get(p.slug);
    if (!rec) { problems.push(`${p.key} ${p.slug}: slug が無い → 書かない`); continue; }
    const before = await get<Rec>(`${EP}/${rec.id}?depth=0`);
    let bad = false;
    for (const op of p.ops) {
      if (op.field === 'body') {
        const body = String(before.body ?? '');
        if (op.insert) {
          const n = body.split(op.insert_before!).length - 1;
          const last = body.endsWith(op.insert_before!);
          oldCheck.push({ key: p.key, field: 'body', check: '末尾の段落が注記', count: n, endsWith: last, ok: n === 1 && last });
          if (!(n === 1 && last)) { bad = true; problems.push(`${p.key} body: 末尾が注記の段落でない（出現 ${n}・末尾 ${last}）→ 書かない`); }
        } else {
          oldCheck.push({ key: p.key, field: 'body', check: 'GET の値を old に使う', len: body.length, ok: body.length > 0 });
          if (!body) { bad = true; problems.push(`${p.key} body: GET の本文が空 → 書かない`); }
        }
        continue;
      }
      const ok = same(before[op.field], op.old);
      oldCheck.push({ key: p.key, field: op.field, plan_old: op.old, get: before[op.field] ?? null, ok });
      if (!ok) { bad = true; problems.push(`${p.key} ${op.field}: GET ${JSON.stringify(before[op.field] ?? null)} が計画の old ${JSON.stringify(op.old)} と違う → 書かない`); }
      const opts = SELECTS[op.field];
      if (opts && (!Array.isArray(op.new) || (op.new as unknown[]).some((x) => !opts.includes(String(x))))) { bad = true; problems.push(`${p.key} ${op.field} ${JSON.stringify(op.new)} が選択肢に無い`); }
    }
    for (const [f, v] of Object.entries(p.keep)) {
      const ok = same(before[f], v);
      keepCheck.push({ key: p.key, field: f, keep: v, get: before[f] ?? null, ok });
    }
    if (!bad) okPatches.push({ y: p, rec: before });
  }
  console.log(`[old] ${oldCheck.filter((x) => x.ok).length}/${oldCheck.length} 一致${oldCheck.some((x) => !x.ok) ? `・★不一致 ${JSON.stringify(oldCheck.filter((x) => !x.ok))}` : ''}`);
  console.log(`[keep] ${keepCheck.filter((x) => x.ok).length}/${keepCheck.length} 一致${keepCheck.some((x) => !x.ok) ? `・違い ${JSON.stringify(keepCheck.filter((x) => !x.ok))}` : ''}`);

  // 4. applier の計画
  const ORDER_POST = ['P2', 'P1', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']; // P2 が canary（便 §5-3）
  const posts = okPosts.sort((a, b) => ORDER_POST.indexOf(a.key) - ORDER_POST.indexOf(b.key)).map((p) => ({
    ep: 'projects', slug: p.slug, row_id: p.key, order: ORDER_POST.indexOf(p.key) + 1, payload: p.payload,
  }));
  const patches = okPatches.map(({ y, rec }, i) => {
    const ops = y.ops.map((op) => {
      if (op.field === 'body' && op.insert) {
        return { field: 'body', old: op.insert_before!, new: op.insert + op.insert_before!, row_ids: [y.key], note: '追記型（末尾の注記の段落の直前に 1 段落）' };
      }
      if (op.field === 'body') return { field: 'body', old: String(rec.body), new: String(op.new), row_ids: [y.key], note: '全文の置換（old は GET の値）' };
      const cur = rec[op.field];
      if (typeof cur === 'string' && cur !== '' && typeof op.new === 'string') return { field: op.field, old: cur, new: op.new, row_ids: [y.key], note: '' };
      return { field: op.field, old: JSON.stringify(cur === undefined || cur === '' ? null : cur), new: JSON.stringify(op.new), row_ids: [y.key], note: '配列・JSON 値モード。' };
    });
    const finalVals: Record<string, unknown> = {};
    for (const op of y.ops) {
      finalVals[op.field] = op.field === 'body' && op.insert
        ? String(rec.body).replace(op.insert_before!, () => op.insert! + op.insert_before!)
        : op.new;
    }
    const expect_final = Object.fromEntries(Object.entries(finalVals).map(([k, v]) => [k, digest(v)]));
    return { ep: 'projects', slug: y.slug, row_id: y.key, order: 9 + i, ops, expect_final };
  });

  // 5. 見るだけ（look_only）
  const LOOK: [string, string[]][] = [
    ['ADW の第10号（栃木県日光市）・第11号（長野県松本市）', ['日光', '松本']],
    ['NC相知町長部田蓄電所（佐賀県唐津市）', ['長部田']],
    ['GM豊岡市但東町蓄電所（グローム・ホールディングスの第1号）', ['但東', '豊岡']],
    ['御殿場高圧蓄電所・大垣市上石津一之瀬蓄電所（デジタルグリッドグループの自社保有）', ['御殿場', '上石津', '大垣']],
  ];
  const look = LOOK.map(([name, ws]) => ({
    name, words: ws,
    hits: all.filter((x) => ws.some((w) => txt(x).includes(w))).map((x) => ({ slug: x.slug, text: txt(x) })),
  }));
  for (const l of look) console.log(`[見るだけ] ${l.name}: ${l.hits.length} 件${l.hits.length ? ` → ${l.hits.map((h) => `${h.slug}〔${h.text}〕`).join(' ／ ')}` : ''}`);

  const out = {
    note: 'projects 便（2026-11-15・_QUEUE.md 113 行）。ユウの計画（reports/projects-plan-2026-11-15_ユウ.json）を、書込直前の GET（baseline）で確かめて applier の形にしたもの。scripts/apply-projects-2026-11-15.ts（runApplier）が読む。既定 dry run・本実行は --apply。',
    generated: new Date().toISOString(),
    baseline: { totalCount: first.totalCount, fetched: all.length, fetched_at: fetchedAt, changed_since_2026_11_13_jst: since },
    checks: { problems, absence, old: oldCheck, keep: keepCheck, look_only: look },
    plan: { posts, patches },
  };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 1));
  console.log(`[計画] POST ${posts.length}・PATCH ${patches.length}（op ${patches.reduce((s, p) => s + p.ops.length, 0)}）→ ${OUT}`);
  console.log(`[problems] ${problems.length}${problems.length ? `: ${problems.join(' ／ ')}` : ''}`);
  console.log(`[microCMS] GET ${gets}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
