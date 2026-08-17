#!/usr/bin/env tsx
/**
 * scripts/experimental/hokkaido/microcms_update_202607.ts
 * 北海道電力ネットワーク 再取込 本実行（2026年7月31日版ほか・承認 2026-08-17）
 *
 * 実行:
 *   npx tsx scripts/experimental/hokkaido/microcms_update_202607.ts          # dry-run
 *   APPLY=1 npx tsx scripts/experimental/hokkaido/microcms_update_202607.ts  # 本実行
 *
 * 入力: update_plan_202607.json（parse_hokkaido_csv.py --emit-plan の出力）
 * 裁定の実装:
 *   1. 基幹35件を新規追加（slug=hkd-kikan-NNNN）。既存424件との重複がないことは
 *      「同名13件はすべて電圧面が異なる別バンク」で確認済み（旭川: 基幹187/66 vs 既存110/66）。
 *      prefecture は持たせない＝県別ブレークダウンでは「（基幹系）」に入る。
 *   2. No.振り直し10件は slug 維持・external_id のみ更新（履歴は _common/external_id_history.json）。
 *      ★北海道は external_id を突合キーに使わない（No.が系統内で一括シフトするため）。
 *   3. last_updated はレコード単位（版4種）。4. data_source_format を PDF→CSV・source_url を ZIP へ。
 *   ＋ N-1電制の未算定7件・出力制御の未算定9件は現値維持（フィールド未送信）。
 *      0MW の「可」5件は「可」のまま投入する（未算定・不可と潰さない）。
 * 作法: 逐次400ms・並列禁止・429/5xx backoff。完了後に全 hkd-* を GET 照合（#106）。
 */
import * as fs from 'node:fs';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const PLAN = 'scripts/experimental/hokkaido/update_plan_202607.json';
const LOG_OUT = 'scripts/experimental/hokkaido/.update_202607_log.json';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnv();
  const apply = process.env.APPLY === '1';
  const FETCHED_AT = new Date().toISOString();
  const { client } = await import('../../../src/lib/microcms');

  const p = JSON.parse(fs.readFileSync(PLAN, 'utf8')) as {
    update_count: number; changed_count: number; create_count: number;
    n1_undetermined_skipped: number; oc_undetermined_skipped: number;
    renumber: Array<{ slug: string; old_external_id: string; new_external_id: string; name: string }>;
    updates: Array<{ slug: string; patch: Record<string, unknown>; changed: string[] }>;
    creates: Array<{ slug: string; content: Record<string, unknown>; n1_zero_ok: boolean }>;
  };
  const fieldCount = new Map<string, number>();
  for (const u of p.updates) for (const k of u.changed) fieldCount.set(k, (fieldCount.get(k) ?? 0) + 1);
  const luCount = new Map<string, number>();
  for (const u of p.updates) {
    const lu = String(u.patch.last_updated).slice(0, 10);
    luCount.set(lu, (luCount.get(lu) ?? 0) + 1);
  }

  console.log(`[hokkaido-202607] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  更新PUT: ${p.update_count}件（値変化 ${p.changed_count}件） / 新規: ${p.create_count}件`);
  console.log(`  現値維持: N-1可否 ${p.n1_undetermined_skipped}件 / 出力制御 ${p.oc_undetermined_skipped}件`);
  console.log(`  変化フィールド内訳: ${JSON.stringify(Object.fromEntries(fieldCount))}`);
  console.log(`  last_updated（レコード単位）: ${JSON.stringify(Object.fromEntries(luCount))}`);
  console.log(`  No.振り直し: ${p.renumber.length}件`);
  console.log(`  新規slug: ${p.creates[0]?.slug} 〜 ${p.creates[p.creates.length - 1]?.slug}`);
  console.log(`  0MWの「可」で投入: ${p.creates.filter((c) => c.n1_zero_ok).length}件`);
  console.log(`  fetched_at=${FETCHED_AT}`);
  if (p.update_count !== 424) throw new Error(`更新対象が424件でない: ${p.update_count}`);
  if (p.create_count !== 35) throw new Error(`新規が35件でない: ${p.create_count}`);
  if (p.n1_undetermined_skipped !== 7) throw new Error('N-1現値維持が7件でない');
  if (p.oc_undetermined_skipped !== 9) throw new Error('出力制御現値維持が9件でない');
  if (p.renumber.length !== 10) throw new Error('No.振り直しが10件でない');
  if (!apply) { console.log('[hokkaido-202607] dry-run 完了（書込なし）'); return; }

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
    if (ok % 100 === 0) console.log(`  更新 ${ok}/${p.updates.length} ...`);
    await sleep(400);
  }
  console.log(`  更新: 成功 ${ok} / 失敗 ${fail}`);

  let created = 0;
  for (const c of p.creates) {
    const content = { ...c.content, fetched_at: FETCHED_AT };
    try {
      await client.create({ endpoint: 'substations', contentId: c.slug, content });
      created++;
    } catch (e: any) {
      if (/already exists/i.test(e?.message ?? '')) {
        await client.update({ endpoint: 'substations', contentId: c.slug, content });
        created++;
      } else { fail++; failures.push(`${c.slug}: ${e?.message ?? e}`); }
    }
    await sleep(400);
  }
  console.log(`  新規: ${created}/${p.creates.length}`);
  fs.writeFileSync(LOG_OUT, JSON.stringify({ fetched_at: FETCHED_AT, ok, created, fail, failures,
    renumber: p.renumber }, null, 2));

  // ── 照合（#106）: 全 hkd-* を再GET ──
  await sleep(1500);
  const live = new Map<string, any>();
  for (let offset = 0; ; offset += 100) {
    const page = await client.getList({ endpoint: 'substations', queries: {
      filters: 'slug[begins_with]hkd-', limit: 100, offset,
      fields: 'slug,name,external_id,last_updated,fetched_at,data_source_format,cap_avail_mw,cap_avail_upper_mw,cap_operational_mw,forecast_flow_mw,capacity_total_mw,n1_capacity_mw,units,n1_eligible,voltage_class' } });
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
    if (l?.external_id !== r.new_external_id) {
      console.log(`  ✗ 振り直し ${r.slug}: ${l?.external_id}（期待 ${r.new_external_id}）`);
      mis++;
    }
  }
  const zeroOk = p.creates.filter((c) => c.n1_zero_ok);
  for (const c of zeroOk) {
    const l = live.get(c.slug);
    console.log(`  0MW可の確認 ${c.slug} ${l?.name}: n1_eligible=${l?.n1_eligible} 可能量=${l?.n1_capacity_mw}`);
    if (l?.n1_eligible !== true) mis++;
  }
  const n1ok = [...live.values()].filter((x) => x.n1_eligible === true).length;
  const csvFmt = [...live.values()].filter((x) => (x.data_source_format || []).includes('CSV')).length;
  console.log(`  照合: 総数=${live.size}（期待459） 不一致=${mis}`);
  console.log(`  N-1電制適用可: ${n1ok}件（期待24） / data_source_format=CSV: ${csvFmt}件（期待459）`);
  if (mis || live.size !== 459 || n1ok !== 24) process.exit(1);
  console.log('[hokkaido-202607] 本実行＋照合 完了');
}

main().catch((e) => { console.error('FATAL:', e?.message ?? String(e)); process.exit(1); });
export {};
