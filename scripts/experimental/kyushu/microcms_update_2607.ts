#!/usr/bin/env tsx
/**
 * scripts/experimental/kyushu/microcms_update_2607.ts
 * 九州電力送配電 再取込 本実行（2026年7月27/28日更新版・承認 2026-08-20）
 *
 * 実行:
 *   npx tsx scripts/experimental/kyushu/microcms_update_2607.ts          # dry-run
 *   APPLY=1 npx tsx scripts/experimental/kyushu/microcms_update_2607.ts  # 本実行
 *
 * 入力: update_plan_2607.json（parse_kyushu.py --emit-plan の出力）
 * 裁定の実装:
 *   1. kyu-764 待金→侍金（4項目一致＋「待金」不在を証明済）。旧名称は _common/name_history.json
 *   2. 振り直し2件は slug維持・external_id 更新（(1)側一致を突合証明済・履歴追記）
 *   3. 新規は県が確定した4件のみ POST（prefecture null 投入は厳禁）。志和池・原田は保留
 *   4. 武雄 No『-』行は取り込まない
 *   ＋ last_updated レコード単位（7/27=260件・7/28=619件）・source_url 全件現行URLへ
 * 作法: 逐次400ms・並列禁止・429/5xx backoff。完了後 全件 GET 照合（#106/#113）。
 */
import * as fs from 'node:fs';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const PLAN = 'scripts/experimental/kyushu/update_plan_2607.json';
const LOG_OUT = 'scripts/experimental/kyushu/.update_2607_log.json';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Plan = {
  update_count: number; value_changed: number; create_count: number;
  held: Array<{ external_id: string; name: string }>;
  n1_undetermined_skipped: number; oc_undetermined_skipped: number;
  renumber: Array<{ slug: string }>; renamed: Array<{ slug: string }>;
  source_url_new: string;
  updates: Array<{ slug: string; patch: Record<string, unknown>; changed: string[] }>;
  creates: Array<{ slug: string; external_id: string; name: string; prefecture: string;
                   content: Record<string, unknown> }>;
};

async function main() {
  loadEnv();
  const apply = process.env.APPLY === '1';
  const FETCHED_AT = new Date().toISOString();
  const { client } = await import('../../../src/lib/microcms');

  const p = JSON.parse(fs.readFileSync(PLAN, 'utf8')) as Plan;
  const lu = new Map<string, number>();
  for (const u of p.updates) {
    const d = String(u.patch.last_updated).slice(0, 10);
    lu.set(d, (lu.get(d) ?? 0) + 1);
  }
  console.log(`[kyushu-2607] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  更新PATCH: ${p.update_count}（数値変化 ${p.value_changed}・名称修正 ${p.renamed.length}・eid更新 ${p.renumber.length}）`);
  console.log(`  last_updated: ${JSON.stringify(Object.fromEntries(lu))}`);
  console.log(`  新規POST: ${p.create_count}（保留 ${p.held.length}: ${p.held.map((h) => h.name).join('・')}）`);
  console.log(`  fetched_at=${FETCHED_AT}`);
  if (p.update_count !== 879) throw new Error(`更新対象が879件でない: ${p.update_count}`);
  if (p.value_changed !== 164) throw new Error(`数値変化が164件でない: ${p.value_changed}`);
  if (p.create_count !== 4) throw new Error(`新規が4件でない: ${p.create_count}`);
  if (p.held.length !== 2) throw new Error(`保留が2件でない: ${p.held.length}`);
  if (p.renumber.length !== 2 || p.renamed.length !== 1) throw new Error('振り直し2・名称修正1でない');
  if (p.n1_undetermined_skipped !== 2 || p.oc_undetermined_skipped !== 1) throw new Error('現値維持件数が2/1でない');
  for (const c of p.creates) {
    if (!c.content.prefecture) throw new Error(`★prefecture が null の新規: ${c.slug}（基幹導出ヘルパ誤発火の危険）`);
  }
  if ((lu.get('2026-07-27') ?? 0) !== 260 || (lu.get('2026-07-28') ?? 0) !== 619) throw new Error('版別件数が260/619でない');
  if (!apply) { console.log('[kyushu-2607] dry-run 完了（書込なし）'); return; }

  let ok = 0, fail = 0;
  const failures: string[] = [];
  const doWrite = async (label: string, fn: () => Promise<unknown>) => {
    for (let attempt = 0; ; attempt++) {
      try { await fn(); ok++; return; }
      catch (e) {
        const msg = String(e);
        if (attempt < 3 && /429|5\d\d|ECONNRESET|ETIMEDOUT|fetch failed/i.test(msg)) {
          await sleep(2000 * (attempt + 1));
          continue;
        }
        fail++; failures.push(`${label}: ${msg.slice(0, 200)}`);
        return;
      }
    }
  };

  let i = 0;
  for (const u of p.updates) {
    const body = { ...u.patch, fetched_at: FETCHED_AT };
    await doWrite(`PATCH ${u.slug}`, () =>
      client.update({ endpoint: 'substations', contentId: u.slug, content: body }));
    i++;
    if (i % 200 === 0) console.log(`  更新 ${i}/${p.updates.length} ...`);
    await sleep(400);
  }
  console.log(`  更新: 成功 ${ok} / 失敗 ${fail}`);
  for (const c of p.creates) {
    const content = { ...c.content, fetched_at: FETCHED_AT };
    await doWrite(`POST ${c.slug}`, () =>
      client.create({ endpoint: 'substations', contentId: c.slug, content }));
    await sleep(400);
  }
  console.log(`  新規: ${p.creates.length}件（累計 成功 ${ok} / 失敗 ${fail}）`);
  if (failures.length) for (const f of failures) console.log(`    - ${f}`);

  // ── GET 照合 ──
  console.log('  GET照合を開始 ...');
  const all: Array<Record<string, unknown>> = [];
  for (let offset = 0; ; offset += 100) {
    const res = await client.getList({
      endpoint: 'substations',
      queries: { limit: 100, offset, filters: 'area[contains]九州' as never },
    }) as unknown as { contents: Array<Record<string, unknown>>; totalCount: number };
    all.push(...res.contents);
    if (offset + 100 >= res.totalCount) break;
    await sleep(400);
  }
  const bySlug = new Map(all.map((x) => [x.slug as string, x]));
  const numeq = (a: unknown, b: unknown) => {
    if (a === undefined || a === null) return b === undefined || b === null;
    if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-6;
    return JSON.stringify(a) === JSON.stringify(b);
  };
  let mismatch = 0;
  for (const u of p.updates) {
    const got = bySlug.get(u.slug);
    if (!got) { mismatch++; console.log(`    ✗ ${u.slug}: GET で見つからない`); continue; }
    for (const [k, v] of Object.entries(u.patch)) {
      if (k === 'last_updated') {
        if (String(got.last_updated).slice(0, 10) !== String(v).slice(0, 10)) {
          mismatch++; console.log(`    ✗ ${u.slug}.last_updated: ${got.last_updated} != ${v}`);
        }
        continue;
      }
      if (!numeq(got[k], v)) { mismatch++; console.log(`    ✗ ${u.slug}.${k}: ${JSON.stringify(got[k])} != ${JSON.stringify(v)}`); }
    }
  }
  for (const c of p.creates) {
    const got = bySlug.get(c.slug);
    if (!got) { mismatch++; console.log(`    ✗ 新規 ${c.slug}: GET で見つからない`); continue; }
    for (const k of ['name', 'external_id', 'prefecture', 'voltage_primary_kv',
      'voltage_secondary_kv', 'cap_avail_mw', 'voltage_class']) {
      if (!(k in c.content)) continue;
      if (!numeq(got[k], (c.content as Record<string, unknown>)[k])) {
        mismatch++; console.log(`    ✗ 新規 ${c.slug}.${k}: ${JSON.stringify(got[k])}`);
      }
    }
  }
  // 南関の保護確認（値が動いていない・残存）
  const nankan = bySlug.get('kyu-500');
  if (!nankan) { mismatch++; console.log('    ✗ kyu-500 南関が消えている'); }
  else if (nankan.cap_avail_mw !== undefined && nankan.cap_avail_mw !== null) {
    mismatch++; console.log(`    ✗ kyu-500 南関に値が入っている: ${nankan.cap_avail_mw}`);
  }
  console.log(`  照合: 九州総数=${all.length}（期待883=879+4） 不一致=${mismatch}`);
  console.log(`  南関: 残存=${!!nankan}・全値空維持=${nankan ? nankan.cap_avail_mw == null : '-'}`);
  fs.writeFileSync(LOG_OUT, JSON.stringify({ finished_at: new Date().toISOString(), ok, fail, mismatch, failures }, null, 1));
  console.log(`[kyushu-2607] 本実行＋照合 完了（不一致 ${mismatch}）`);
  if (fail > 0 || mismatch > 0 || all.length !== 883) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
