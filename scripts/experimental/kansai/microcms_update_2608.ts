#!/usr/bin/env tsx
/**
 * scripts/experimental/kansai/microcms_update_2608.ts
 * 関西電力送配電 再取込 本実行（2026年8月17日更新版・承認 2026-08-19）
 *
 * 実行:
 *   npx tsx scripts/experimental/kansai/microcms_update_2608.ts          # dry-run
 *   APPLY=1 npx tsx scripts/experimental/kansai/microcms_update_2608.ts  # 本実行
 *
 * 入力: update_plan_2608.json（parse_kansai_csv.py --emit-plan の出力）
 * 裁定の実装:
 *   1. 高時川（ksi-local-d-7）は slug 維持・external_id 滋D→滋ED
 *      （5項目一致で同一性証明済。履歴は _common/external_id_history.json）。
 *      ★裁定の「荒川（新 滋D）は新規レコード」は前提相違: 荒川は既存 ksi-local-d-8
 *        （baseline では2件が滋Dを共有→公表側が高時川へ滋EDを新規付番して解消）。新規POSTなし。
 *   2. 電圧面変化3件（篠山・山口・大池 77/6.6→22/6.6）は旧77kV行の完全消滅を確認済
 *      → slug 維持で電圧面・電圧階級（voltage_class 22kV系）を更新。
 *   3. 消滅5件（玄妙・美豆・金剛南・金剛中・万波）は DELETE せず凍結
 *      （substations-frozen.json 側・本スクリプトは触らない）。
 *   4. last_updated は全件 2026-08-17（more/less とも同一版・版割れなし）。
 *   ＋ N-1未算定2件・出力制御未算定14件は現値維持（フィールド未送信）。
 * 作法: 逐次400ms・並列禁止・429/5xx backoff。完了後に関西全件を GET 照合（#106/#113）。
 */
import * as fs from 'node:fs';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const PLAN = 'scripts/experimental/kansai/update_plan_2608.json';
const LOG_OUT = 'scripts/experimental/kansai/.update_2608_log.json';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Plan = {
  update_count: number; changed_count: number; create_count: number;
  n1_undetermined_skipped: number; oc_undetermined_skipped: number;
  renumber: Array<{ slug: string; old_external_id: string; new_external_id: string; name: string }>;
  face_changed_slugs: string[];
  frozen_slugs: string[];
  dup_block: unknown[];
  updates: Array<{ slug: string; patch: Record<string, unknown>; changed: string[] }>;
  creates: Array<{ slug: string; set: string; name: string; external_id: string;
                   content: Record<string, unknown>; n1_undetermined_as_false: boolean }>;
};

async function main() {
  loadEnv();
  const apply = process.env.APPLY === '1';
  const FETCHED_AT = new Date().toISOString();
  const { client } = await import('../../../src/lib/microcms');

  const p = JSON.parse(fs.readFileSync(PLAN, 'utf8')) as Plan;

  const fieldCount = new Map<string, number>();
  for (const u of p.updates) for (const k of u.changed) fieldCount.set(k, (fieldCount.get(k) ?? 0) + 1);

  console.log(`[kansai-2608] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  更新PATCH: ${p.update_count}件（値変化 ${p.changed_count}件） / 新規POST: ${p.create_count}件`);
  console.log(`  現値維持: N-1可否 ${p.n1_undetermined_skipped}件 / 出力制御 ${p.oc_undetermined_skipped}件`);
  console.log(`  変化フィールド内訳: ${JSON.stringify(Object.fromEntries(fieldCount))}`);
  console.log(`  No.振り直し: ${p.renumber.length}件 / 電圧面変化: ${p.face_changed_slugs.length}件 / 凍結(書込なし): ${p.frozen_slugs.length}件`);
  console.log(`  fetched_at=${FETCHED_AT}`);
  // 承認済み dry-run の数値と完全一致することを強制（違ったら何かがズレている＝停止）
  if (p.update_count !== 1619) throw new Error(`更新対象が1619件でない: ${p.update_count}`);
  if (p.create_count !== 83) throw new Error(`新規が83件でない: ${p.create_count}`);
  if (p.n1_undetermined_skipped !== 2) throw new Error('N-1現値維持が2件でない');
  if (p.oc_undetermined_skipped !== 14) throw new Error('出力制御現値維持が14件でない');
  if (p.renumber.length !== 1) throw new Error('No.振り直しが1件でない');
  if (p.face_changed_slugs.length !== 3) throw new Error('電圧面変化が3件でない');
  if (p.frozen_slugs.length !== 5) throw new Error('凍結対象が5件でない');
  if (p.dup_block.length !== 0) throw new Error('判別不能（同名同面）が残っている');
  if (!apply) { console.log('[kansai-2608] dry-run 完了（書込なし）'); return; }

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

  // ── 更新 1,619件（逐次400ms）──
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

  // ── 新規 83件 ──
  let created = 0;
  for (const c of p.creates) {
    const content = { ...c.content, fetched_at: FETCHED_AT };
    await doWrite(`POST ${c.slug}`, () =>
      client.create({ endpoint: 'substations', contentId: c.slug, content }));
    created++;
    await sleep(400);
  }
  console.log(`  新規: ${created}/${p.creates.length}（累計 成功 ${ok} / 失敗 ${fail}）`);
  if (failures.length) {
    console.log('  失敗一覧:');
    for (const f of failures) console.log(`    - ${f}`);
  }

  // ── GET 照合（#106/#113: 書いたつもりと実データを突き合わせる）──
  console.log('  GET照合を開始 ...');
  const all: Array<Record<string, unknown>> = [];
  for (let offset = 0; ; offset += 100) {
    const res = await client.getList({
      endpoint: 'substations',
      queries: { limit: 100, offset, filters: 'area[contains]関西' as never },
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
  const CHECK_KEYS = ['units', 'capacity_total_mw', 'cap_operational_mw', 'forecast_flow_mw',
    'cap_avail_mw', 'cap_avail_upper_mw', 'n1_capacity_mw', 'n1_eligible', 'external_id',
    'voltage_primary_kv', 'voltage_secondary_kv'];
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
      if (!CHECK_KEYS.includes(k) && !['voltage_class', 'oc_possibility', 'op_constraint'].includes(k)) continue;
      if (!numeq(got[k], v)) { mismatch++; console.log(`    ✗ ${u.slug}.${k}: ${JSON.stringify(got[k])} != ${JSON.stringify(v)}`); }
    }
  }
  for (const c of p.creates) {
    const got = bySlug.get(c.slug);
    if (!got) { mismatch++; console.log(`    ✗ 新規 ${c.slug}: GET で見つからない`); continue; }
    for (const k of ['name', 'external_id', 'voltage_primary_kv', 'voltage_secondary_kv',
      'cap_operational_mw', 'cap_avail_mw', 'voltage_class', 'prefecture']) {
      if (!(k in c.content)) continue;
      if (!numeq(got[k], (c.content as Record<string, unknown>)[k])) {
        mismatch++; console.log(`    ✗ 新規 ${c.slug}.${k}: ${JSON.stringify(got[k])} != ${JSON.stringify((c.content as Record<string, unknown>)[k])}`);
      }
    }
  }
  // 凍結5件が触られていないこと（last_updated が旧のまま）
  for (const s of p.frozen_slugs) {
    const got = bySlug.get(s);
    if (!got) { mismatch++; console.log(`    ✗ 凍結 ${s}: GET で見つからない（DELETE していないか）`); continue; }
    if (String(got.last_updated).slice(0, 10) !== '2026-04-01') {
      mismatch++; console.log(`    ✗ 凍結 ${s}: last_updated が動いている ${got.last_updated}`);
    }
  }
  console.log(`  照合: 関西総数=${all.length}（期待1707=1624+83） 不一致=${mismatch}`);
  if (all.length !== 1707) console.log(`    ★総数が期待と違う`);
  // N-1 現値維持の確認（未算定2件が旧値のままか）
  const und = JSON.parse(fs.readFileSync('scripts/experimental/_common/n1_undetermined_kansai.json', 'utf8')) as
    { entries: Array<{ slug: string; stored_n1_eligible: boolean }> };
  for (const e of und.entries) {
    const got = bySlug.get(e.slug);
    if (got && got.n1_eligible !== e.stored_n1_eligible) {
      console.log(`    ✗ N-1現値維持が破れている: ${e.slug} ${got.n1_eligible} != ${e.stored_n1_eligible}`);
      mismatch++;
    }
  }
  fs.writeFileSync(LOG_OUT, JSON.stringify({ finished_at: new Date().toISOString(), ok, fail, mismatch, failures }, null, 1));
  console.log(`[kansai-2608] 本実行＋照合 完了（不一致 ${mismatch}）`);
  if (fail > 0 || mismatch > 0) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
