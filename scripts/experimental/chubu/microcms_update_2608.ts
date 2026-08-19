#!/usr/bin/env tsx
/**
 * scripts/experimental/chubu/microcms_update_2608.ts
 * 中部電力パワーグリッド 再取込 本実行（2026年8月17日更新版・承認 2026-08-19）
 *
 * 実行:
 *   npx tsx scripts/experimental/chubu/microcms_update_2608.ts          # dry-run
 *   APPLY=1 npx tsx scripts/experimental/chubu/microcms_update_2608.ts  # 本実行
 *
 * 入力: update_plan_2608.json（parse_chubu.py --emit-plan の出力）
 * 裁定の実装:
 *   1. cb-6240 電圧面変化 33/6.6→77/6.6（slug維持・voltage_class 77kV系へ）
 *   2. cb-2037 へ座標新規付与（座標保有 1,081→1,082）
 *   3. 座標修正14件は新公表値を採用（全15件 GSI逆ジオコーダで県一致確認済・保留0。
 *      旧→新は _common/coordinate_history.json に退避済）
 *   4. 空容量「-」193件への算出適用は不採用（null 維持・フィールド未送信）
 *   ＋ last_updated 全件 2026-08-17。oc_possibility は裁定外のため未送信
 *     （新CSVでは375件が None→有り になるが初期取込の解釈差の疑い・要判断として報告）。
 * 作法: 逐次400ms・並列禁止・429/5xx backoff。完了後 全1,107件 GET 照合（#106/#113）。
 * ★座標は §0 最優先: 計画外の座標変更が無いことを GET 照合で全件確認する。
 */
import * as fs from 'node:fs';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const PLAN = 'scripts/experimental/chubu/update_plan_2608.json';
const BASELINE = 'scripts/experimental/chubu/baseline_live.json';
const LOG_OUT = 'scripts/experimental/chubu/.update_2608_log.json';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Plan = {
  update_count: number; value_changed: number; coord_update_count: number;
  face_changed: string[];
  coord_updates: Array<{ slug: string; lat: number; lng: number }>;
  updates: Array<{ slug: string; patch: Record<string, unknown>; changed: string[] }>;
};

async function main() {
  loadEnv();
  const apply = process.env.APPLY === '1';
  const FETCHED_AT = new Date().toISOString();
  const { client } = await import('../../../src/lib/microcms');

  const p = JSON.parse(fs.readFileSync(PLAN, 'utf8')) as Plan;
  const fieldCount = new Map<string, number>();
  for (const u of p.updates) for (const k of Object.keys(u.patch)) fieldCount.set(k, (fieldCount.get(k) ?? 0) + 1);

  console.log(`[chubu-2608] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  更新PATCH: ${p.update_count}件（数値変化 ${p.value_changed}件・座標 ${p.coord_update_count}件・電圧面 ${p.face_changed.length}件）`);
  console.log(`  patchフィールド内訳: ${JSON.stringify(Object.fromEntries(fieldCount))}`);
  console.log(`  fetched_at=${FETCHED_AT}`);
  if (p.update_count !== 1107) throw new Error(`更新対象が1107件でない: ${p.update_count}`);
  if (p.value_changed !== 369) throw new Error(`数値変化が369件でない: ${p.value_changed}`);
  if (p.coord_update_count !== 15) throw new Error(`座標更新が15件でない: ${p.coord_update_count}`);
  if (p.face_changed.length !== 1 || p.face_changed[0] !== 'cb-6240') throw new Error('電圧面変化が cb-6240 1件でない');
  if ((fieldCount.get('oc_possibility') ?? 0) !== 0) throw new Error('oc_possibility が patch に混入（裁定外）');
  if ((fieldCount.get('op_constraint') ?? 0) !== 0) throw new Error('op_constraint が patch に混入');
  if (!apply) { console.log('[chubu-2608] dry-run 完了（書込なし）'); return; }

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
  if (failures.length) for (const f of failures) console.log(`    - ${f}`);

  // ── GET 照合（#106/#113 ＋ §0 座標の全件照合）──
  console.log('  GET照合を開始 ...');
  const all: Array<Record<string, unknown>> = [];
  for (let offset = 0; ; offset += 100) {
    const res = await client.getList({
      endpoint: 'substations',
      queries: { limit: 100, offset, filters: 'area[contains]中部' as never },
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
          mismatch++; console.log(`    ✗ ${u.slug}.last_updated: ${got.last_updated}`);
        }
        continue;
      }
      if (!numeq(got[k], v)) {
        mismatch++; console.log(`    ✗ ${u.slug}.${k}: ${JSON.stringify(got[k])} != ${JSON.stringify(v)}`);
      }
    }
  }
  // §0: 座標の全件照合 — 計画15件以外の座標が baseline から1件も動いていないこと
  const base = JSON.parse(fs.readFileSync(BASELINE, 'utf8')) as Array<Record<string, unknown>>;
  const planned = new Set(p.coord_updates.map((c) => c.slug));
  let coordDrift = 0, coordCount = 0;
  for (const b of base) {
    const got = bySlug.get(b.slug as string);
    if (!got) continue;
    if (got.latitude !== undefined && got.latitude !== null) coordCount++;
    if (planned.has(b.slug as string)) continue;
    if (!numeq(got.latitude ?? null, b.latitude ?? null) || !numeq(got.longitude ?? null, b.longitude ?? null)) {
      coordDrift++; console.log(`    ✗ 計画外の座標変化: ${b.slug}`);
    }
  }
  console.log(`  照合: 中部総数=${all.length}（期待1107） 不一致=${mismatch}`);
  console.log(`  座標: 保有=${coordCount}（期待1082） 計画外の変化=${coordDrift}（期待0）`);
  fs.writeFileSync(LOG_OUT, JSON.stringify({ finished_at: new Date().toISOString(), ok, fail, mismatch, coordCount, coordDrift, failures }, null, 1));
  console.log(`[chubu-2608] 本実行＋照合 完了（不一致 ${mismatch}・座標ドリフト ${coordDrift}）`);
  if (fail > 0 || mismatch > 0 || coordDrift > 0 || all.length !== 1107 || coordCount !== 1082) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
