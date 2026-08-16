#!/usr/bin/env tsx
/**
 * scripts/experimental/chugoku/microcms_update_202608.ts
 * 中国電力ネットワーク 再取込 本実行（2026年8月6日版・承認 2026-08-16）
 *
 * 実行:
 *   npx tsx scripts/experimental/chugoku/microcms_update_202608.ts          # dry-run
 *   APPLY=1 npx tsx scripts/experimental/chugoku/microcms_update_202608.ts  # 本実行
 *
 * 入力: update_plan_202608.json（parse_chugoku_csv.py --emit-plan の出力）
 * 裁定の実装:
 *   1. No.振り直し3件は **slug 維持・external_id のみ更新**（旧Noは _common/external_id_history.json）
 *   2. last_updated は **レコード単位**（基幹・広島=2026-08-06 / 岡山・島根・鳥取・山口=2026-07-27）
 *   3. N-1電制の未算定8件・出力制御の未算定15件は現値維持（フィールド未送信）
 * 作法: 逐次400ms・並列禁止・429/5xx backoff。完了後に全 egz-* を GET 照合（#106）。
 */
import * as fs from 'node:fs';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const PLAN = 'scripts/experimental/chugoku/update_plan_202608.json';
const LOG_OUT = 'scripts/experimental/chugoku/.update_202608_log.json';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnv();
  const apply = process.env.APPLY === '1';
  const FETCHED_AT = new Date().toISOString();
  const { client } = await import('../../../src/lib/microcms');

  const p = JSON.parse(fs.readFileSync(PLAN, 'utf8')) as {
    update_count: number; changed_count: number; create_count: number;
    n1_undetermined_skipped: number; oc_undetermined_skipped: number;
    renumber: Array<{ slug: string; old_external_id: string; new_external_id: string }>;
    updates: Array<{ slug: string; patch: Record<string, unknown>; changed: string[] }>;
    creates: Array<{ slug: string; content: Record<string, unknown> }>;
  };
  const fieldCount = new Map<string, number>();
  for (const u of p.updates) for (const k of u.changed) fieldCount.set(k, (fieldCount.get(k) ?? 0) + 1);
  const luCount = new Map<string, number>();
  for (const u of p.updates) {
    const lu = String(u.patch.last_updated);
    luCount.set(lu, (luCount.get(lu) ?? 0) + 1);
  }

  console.log(`[chugoku-202608] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  更新PUT: ${p.update_count}件（値変化 ${p.changed_count}件） / 新規: ${p.create_count}件`);
  console.log(`  現値維持: N-1可否 ${p.n1_undetermined_skipped}件 / 出力制御 ${p.oc_undetermined_skipped}件`);
  console.log(`  変化フィールド内訳: ${JSON.stringify(Object.fromEntries(fieldCount))}`);
  console.log(`  last_updated（レコード単位）: ${JSON.stringify(Object.fromEntries(luCount))}`);
  console.log(`  external_id 更新（No.振り直し）: ${p.renumber.map((r) => `${r.slug}: ${r.old_external_id}→${r.new_external_id}`).join(' / ')}`);
  console.log(`  新規slug: ${p.creates.map((c) => c.slug).join(', ')}`);
  console.log(`  fetched_at=${FETCHED_AT}`);
  if (p.update_count !== 873) throw new Error(`更新対象が873件でない: ${p.update_count}`);
  if (p.changed_count !== 170) throw new Error(`値変化が170件でない（167＋振り直し3）: ${p.changed_count}`);
  if (p.create_count !== 1) throw new Error(`新規が1件でない: ${p.create_count}`);
  if (p.n1_undetermined_skipped !== 8) throw new Error('N-1現値維持が8件でない');
  if (p.oc_undetermined_skipped !== 15) throw new Error('出力制御現値維持が15件でない');
  if (!apply) { console.log('[chugoku-202608] dry-run 完了（書込なし）'); return; }

  let ok = 0, fail = 0;
  const failures: string[] = [];
  for (const u of p.updates) {
    const body = { ...u.patch, fetched_at: FETCHED_AT };
    for (let attempt = 0; ; attempt++) {
      try {
        await client.update({ endpoint: 'substations', contentId: u.slug, content: body });
        ok++;
        break;
      } catch (e: any) {
        const status = e?.response?.status ?? e?.status;
        if ((status === 429 || (status >= 500 && status < 600)) && attempt < 5) {
          await sleep(800 * Math.pow(2, attempt));
          continue;
        }
        fail++; failures.push(`${u.slug}: ${e?.message ?? e}`); break;
      }
    }
    if (ok % 200 === 0) console.log(`  ${ok}/${p.updates.length} ...`);
    await sleep(400);
  }
  console.log(`  更新: 成功 ${ok} / 失敗 ${fail}`);

  for (const c of p.creates) {
    const content = { ...c.content, fetched_at: FETCHED_AT };
    try {
      await client.create({ endpoint: 'substations', contentId: c.slug, content });
      console.log(`  ✓ 新規 ${c.slug}`);
    } catch (e: any) {
      if (/already exists/i.test(e?.message ?? '')) {
        await client.update({ endpoint: 'substations', contentId: c.slug, content });
        console.log(`  ✓ 新規(既存・冪等更新) ${c.slug}`);
      } else { fail++; failures.push(`${c.slug}: ${e?.message ?? e}`); }
    }
    await sleep(400);
  }
  fs.writeFileSync(LOG_OUT, JSON.stringify({ fetched_at: FETCHED_AT, ok, fail, failures,
    renumber: p.renumber, created: p.creates.map((c) => c.slug) }, null, 2));

  // ── 照合（#106）──
  await sleep(1500);
  const live = new Map<string, any>();
  for (let offset = 0; ; offset += 100) {
    const page = await client.getList({ endpoint: 'substations', queries: {
      filters: 'slug[begins_with]egz-', limit: 100, offset,
      fields: 'slug,name,external_id,last_updated,fetched_at,cap_avail_mw,cap_avail_upper_mw,cap_operational_mw,forecast_flow_mw,capacity_total_mw,n1_capacity_mw,units,n1_eligible' } });
    for (const c of page.contents as any[]) live.set(c.slug, c);
    if (offset + 100 >= page.totalCount) break;
    await sleep(400);
  }
  let mis = 0;
  for (const u of p.updates) {
    const l = live.get(u.slug);
    if (!l) { console.log(`  ✗ 消失? ${u.slug}`); mis++; continue; }
    if (l.last_updated !== u.patch.last_updated) {
      if (mis < 5) console.log(`  ✗ ${u.slug} last_updated=${l.last_updated} 期待=${u.patch.last_updated}`);
      mis++; continue;
    }
    for (const k of u.changed) {
      if (k === 'oc_possibility') continue;
      const want = (u.patch as any)[k];
      if (JSON.stringify(l[k] ?? null) !== JSON.stringify(want ?? null)) {
        if (mis < 8) console.log(`  ✗ ${u.slug} ${k}: live=${l[k]} 期待=${want}`);
        mis++;
      }
    }
  }
  for (const r of p.renumber) {
    const l = live.get(r.slug);
    console.log(`  No.振り直し確認 ${r.slug}: external_id=${l?.external_id}（期待 ${r.new_external_id}）`);
    if (l?.external_id !== r.new_external_id) mis++;
  }
  for (const c of p.creates) {
    const l = live.get(c.slug);
    console.log(`  新規確認 ${c.slug}: ${l ? `${l.name} / ${l.external_id} / 空容量=${l.cap_avail_mw ?? '-'}` : '★不在'}`);
    if (!l) mis++;
  }
  console.log(`  照合: 総数=${live.size}（期待874） 不一致=${mis}`);
  if (mis || live.size !== 874) process.exit(1);
  console.log('[chugoku-202608] 本実行＋照合 完了');
}

main().catch((e) => { console.error('FATAL:', e?.message ?? String(e)); process.exit(1); });
export {};
