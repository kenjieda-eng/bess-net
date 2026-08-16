#!/usr/bin/env tsx
/**
 * scripts/experimental/tohoku/microcms_update_202607.ts
 * 東北電力ネットワーク 再取込 本実行（2026年7月版・承認 2026-08-16）
 *
 * 実行:
 *   npx tsx scripts/experimental/tohoku/microcms_update_202607.ts          # dry-run（書込なし）
 *   APPLY=1 npx tsx scripts/experimental/tohoku/microcms_update_202607.ts  # 本実行
 *
 * 入力: update_plan_202607.json（parse_tohoku_csv.py --emit-plan の出力）
 *   - N-1電制の未算定20件・出力制御の未算定10件は patch に含まれない＝現値維持（フィールド未送信）
 *   - last_updated=2026-07-03（メタ行「2026年7月3日作成」。他にデータ時点の公表がない）
 *   - fetched_at は実行時刻から動的付与（ハードコード禁止）
 * 作法: 逐次400ms・並列禁止・429/5xx backoff（鉄則#2/#4・落とし穴#90/#91）。
 *       完了後に全 thk-* を GET して不一致0を確認する（#106）。
 */
import * as fs from 'node:fs';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const PLAN = 'scripts/experimental/tohoku/update_plan_202607.json';
const LOG_OUT = 'scripts/experimental/tohoku/.update_202607_log.json';
const LAST_UPDATED = '2026-07-03T00:00:00.000Z';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  loadEnv();
  const apply = process.env.APPLY === '1';
  const FETCHED_AT = new Date().toISOString();
  const { client } = await import('../../../src/lib/microcms');

  const planFile = JSON.parse(fs.readFileSync(PLAN, 'utf8')) as {
    count: number; changed_count: number; n1_undetermined_skipped: number;
    oc_undetermined_skipped: number;
    plan: Array<{ slug: string; patch: Record<string, unknown>; changed: string[] }>;
  };
  const plan = planFile.plan;
  const fieldCount = new Map<string, number>();
  for (const p of plan) for (const k of p.changed) fieldCount.set(k, (fieldCount.get(k) ?? 0) + 1);

  console.log(`[tohoku-202607] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  更新PUT: ${plan.length}件（値変化 ${planFile.changed_count}件）`);
  console.log(`  現値維持: N-1可否 ${planFile.n1_undetermined_skipped}件 / 出力制御 ${planFile.oc_undetermined_skipped}件`);
  console.log(`  変化フィールド内訳: ${JSON.stringify(Object.fromEntries(fieldCount))}`);
  console.log(`  last_updated=${LAST_UPDATED} / fetched_at=${FETCHED_AT}`);
  if (plan.length !== 884) throw new Error(`対象が884件でない: ${plan.length}`);
  if (planFile.changed_count !== 386) throw new Error(`値変化が386件でない: ${planFile.changed_count}`);
  if (planFile.n1_undetermined_skipped !== 20) throw new Error(`N-1現値維持が20件でない`);
  if (planFile.oc_undetermined_skipped !== 10) throw new Error(`出力制御現値維持が10件でない`);
  if (!apply) { console.log('[tohoku-202607] dry-run 完了（書込なし）'); return; }

  let ok = 0, fail = 0;
  const failures: string[] = [];
  for (const p of plan) {
    const body = { ...p.patch, fetched_at: FETCHED_AT };
    for (let attempt = 0; ; attempt++) {
      try {
        await client.update({ endpoint: 'substations', contentId: p.slug, content: body });
        ok++;
        break;
      } catch (e: any) {
        const status = e?.response?.status ?? e?.status;
        if ((status === 429 || (status >= 500 && status < 600)) && attempt < 5) {
          await sleep(800 * Math.pow(2, attempt));
          continue;
        }
        fail++; failures.push(`${p.slug}: ${e?.message ?? e}`); break;
      }
    }
    if (ok % 200 === 0) console.log(`  ${ok}/${plan.length} ...`);
    await sleep(400);
  }
  console.log(`  更新: 成功 ${ok} / 失敗 ${fail}`);
  fs.writeFileSync(LOG_OUT, JSON.stringify({ fetched_at: FETCHED_AT, ok, fail, failures }, null, 2));

  // ── 照合（#106）: 全 thk-* を再GET ──
  await sleep(1500);
  const live = new Map<string, any>();
  for (let offset = 0; ; offset += 100) {
    const page = await client.getList({ endpoint: 'substations', queries: {
      filters: 'slug[begins_with]thk-', limit: 100, offset,
      fields: 'slug,last_updated,fetched_at,cap_avail_mw,cap_avail_upper_mw,cap_operational_mw,forecast_flow_mw,capacity_total_mw,n1_capacity_mw,units,n1_eligible,oc_possibility' } });
    for (const c of page.contents as any[]) live.set(c.slug, c);
    if (offset + 100 >= page.totalCount) break;
    await sleep(400);
  }
  let mis = 0;
  for (const p of plan) {
    const l = live.get(p.slug);
    if (!l) { console.log(`  ✗ 消失? ${p.slug}`); mis++; continue; }
    if (l.last_updated !== LAST_UPDATED) { if (mis < 5) console.log(`  ✗ ${p.slug} last_updated=${l.last_updated}`); mis++; continue; }
    for (const k of p.changed) {
      if (k === 'oc_possibility') continue;
      const want = (p.patch as any)[k];
      if (JSON.stringify(l[k] ?? null) !== JSON.stringify(want ?? null)) {
        if (mis < 8) console.log(`  ✗ ${p.slug} ${k}: live=${l[k]} 期待=${want}`);
        mis++;
      }
    }
  }
  console.log(`  照合: 総数=${live.size}（期待884） 不一致=${mis}`);
  if (mis || live.size !== 884) process.exit(1);
  console.log('[tohoku-202607] 本実行＋照合 完了');
}

main().catch((e) => { console.error('FATAL:', e?.message ?? String(e)); process.exit(1); });
export {};
