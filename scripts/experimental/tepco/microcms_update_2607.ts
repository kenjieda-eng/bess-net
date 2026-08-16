#!/usr/bin/env tsx
/**
 * scripts/experimental/tepco/microcms_update_2607.ts
 * 東京電力PG 再取込フェーズ2 本実行（2026年7月10日公表・CSV版／裁定反映）
 *
 * 実行:
 *   npx tsx scripts/experimental/tepco/microcms_update_2607.ts            # dry-run（書込なし）
 *   APPLY=1 npx tsx scripts/experimental/tepco/microcms_update_2607.ts    # 本実行
 *
 * 裁定の実装:
 *   - tpg-1623（湯船）= 凍結。書込対象から除外（コード側で注記・集計除外）。
 *   - tpg-1719（新富士21B22B）= 新設1件のみ（非重複を本番GETで確認済: 154/66・運用228は
 *     既存の新富士(1)(2)/2U/3U/局配のいずれとも別実体）。
 *   - 66kV系列66行 = パーサ側で除外済み（normalized.rows はマッチ1,718のみ）。
 *   - N-1電制適用可否: CSV「-」の13件は現値維持（フィールド自体を送らない）。
 *   - 反映フィールドは承認リストのみ（予想潮流/上位系等考慮空容量/運用容量/設備容量/
 *     N-1可能量/出力制御の可能性/空き容量(当該)＋tpg-0979のname改称）。台数(units)等は対象外。
 *   - last_updated=2026-07-10 全件共通 / fetched_at=実行時刻（動的）。
 *   - 既存slugへの書込は update(=PATCH・部分更新) → 未送信フィールドは保持され欠落しない。
 *   - 逐次400ms・並列禁止・429/5xxはbackoff（鉄則#2/#4・落とし穴#90/#91）。
 */
import * as fs from 'node:fs';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const BASELINE = 'scripts/experimental/tepco/tepco_grid_ready.json';
const NORMALIZED = 'scripts/experimental/tepco/tepco_csv_2607_normalized.json';
const LOG_OUT = 'scripts/experimental/tepco/.update_2607_log.json';

const LAST_UPDATED = '2026-07-10T00:00:00.000Z';
const FROZEN_SLUG = 'tpg-1623';
const RENAMED: Record<string, string> = { 'tpg-0979': '通町東' }; // 単純改称（フェーズ1確定）

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

async function main() {
  loadEnv();
  const apply = process.env.APPLY === '1';
  const FETCHED_AT = new Date().toISOString();
  const { client } = await import('../../../src/lib/microcms');

  const base: any[] = JSON.parse(fs.readFileSync(BASELINE, 'utf8')).substations;
  const norm = JSON.parse(fs.readFileSync(NORMALIZED, 'utf8'));
  const rows: any[] = norm.rows;

  // external_id → baseline（重複1件「変埼玉県 66kV 11」は電圧で解決）
  const bidx = new Map<string, any[]>();
  for (const b of base) {
    const l = bidx.get(b.external_id) ?? [];
    l.push(b);
    bidx.set(b.external_id, l);
  }
  const pick = (bl: any[], row: any) => {
    if (bl.length === 1) return bl[0];
    const v = String(row.voltage ?? '');
    return bl.find((b) => v && String(b.voltage_primary_kv) === v.split('/')[0]) ?? bl[0];
  };

  type Plan = { slug: string; patch: Record<string, unknown>; changedKeys: string[] };
  const plans: Plan[] = [];
  let n1Kept = 0;
  const APPROVED_NUM: Array<[string, string]> = [
    ['forecast_flow_mw', 'forecast_flow_mw'],
    ['cap_avail_upper_mw', 'cap_avail_upper_mw'],
    ['cap_operational_mw', 'cap_operational_mw'],
    ['capacity_total_mw', 'capacity_total_mw'],
    ['n1_capacity_mw', 'n1_capacity_mw'],
    ['cap_avail_mw', 'cap_avail_mw'],
  ];

  let shinfujiRow: any = null;
  for (const r of rows) {
    const bl = bidx.get(r.external_id);
    if (!bl) throw new Error(`baselineに無いexternal_id: ${r.external_id}（パーサ除外が不完全）`);
    const b = pick(bl, r);
    if (b.slug === FROZEN_SLUG) {
      shinfujiRow = r; // 凍結slugの行 = 新富士21B22B（tpg-1719新設の素材）
      continue;
    }
    const patch: Record<string, unknown> = { last_updated: LAST_UPDATED, fetched_at: FETCHED_AT };
    const changed: string[] = [];
    for (const [key] of APPROVED_NUM) {
      const o = b[key] ?? null;
      const n = r[key] ?? null;
      if (n !== null && o !== n) {
        patch[key] = n;
        changed.push(key);
      }
      // n=null で o!=null のケースは dry-run で0件確認済み（欠落化なし）→ null送信はしない
    }
    // N-1可否: CSVがnull（「-」）なら現値維持＝送らない。値ありかつ変化時のみ送る
    if (r.n1_eligible === null || r.n1_eligible === undefined) {
      if (b.n1_eligible !== null && b.n1_eligible !== undefined) n1Kept++;
    } else if (r.n1_eligible !== b.n1_eligible) {
      patch.n1_eligible = r.n1_eligible;
      changed.push('n1_eligible');
    }
    // 出力制御: 実在select値「有り」のみ（従来import踏襲）。「なし」新規は現CSVに0件確認済
    if (r.oc_possibility === '有り' && b.oc_possibility !== '有り') {
      patch.oc_possibility = ['有り'];
      changed.push('oc_possibility');
    }
    if (RENAMED[b.slug] && b.name !== RENAMED[b.slug]) {
      patch.name = RENAMED[b.slug];
      changed.push('name');
    }
    plans.push({ slug: b.slug, patch, changedKeys: changed });
  }

  if (!shinfujiRow) throw new Error('新富士21B22B の行（変静岡県（富士川以東） 154kV 2）が見つからない');

  // 新設 tpg-1719（フル content・PUT作成）
  const [vp, vs] = String(shinfujiRow.voltage).split('/').map((x: string) => parseInt(x, 10));
  const newContent: Record<string, unknown> = {
    slug: 'tpg-1719',
    name: shinfujiRow.name,
    prefecture: '静岡県',
    operator: ['東京電力パワーグリッド'],
    area: ['東京'],
    voltage_class: ['154kV系'],
    n1_eligible: !!shinfujiRow.n1_eligible,
    source_url: 'https://www.tepco.co.jp/pg/consignment/system/',
    last_updated: LAST_UPDATED,
    fetched_at: FETCHED_AT,
    voltage_primary_kv: vp,
    voltage_secondary_kv: vs,
    units: shinfujiRow.units,
    capacity_total_mw: shinfujiRow.capacity_total_mw,
    cap_operational_mw: shinfujiRow.cap_operational_mw,
    n1_capacity_mw: shinfujiRow.n1_capacity_mw,
    forecast_flow_mw: shinfujiRow.forecast_flow_mw,
    external_id: shinfujiRow.external_id,
  };

  const changedPlans = plans.filter((p) => p.changedKeys.length > 0);
  console.log(`[update2607] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  更新PUT対象: ${plans.length}件（全件 last_updated=2026-07-10 / fetched_at=${FETCHED_AT}）`);
  console.log(`  うち承認フィールドの値変化あり: ${changedPlans.length}件 / N-1可否 現値維持: ${n1Kept}件（期待13）`);
  console.log(`  凍結スキップ: ${FROZEN_SLUG}（湯船）/ 新設: tpg-1719 ${shinfujiRow.name}`);
  const fieldCount = new Map<string, number>();
  for (const p of changedPlans) for (const k of p.changedKeys) fieldCount.set(k, (fieldCount.get(k) ?? 0) + 1);
  console.log('  変化フィールド内訳:', JSON.stringify(Object.fromEntries(fieldCount)));
  for (const p of changedPlans.slice(0, 6)) console.log(`    例: ${p.slug} ${p.changedKeys.join(',')}`);
  if (plans.length !== 1717) throw new Error(`更新対象が1,717件でない: ${plans.length}`);
  if (n1Kept !== 13) throw new Error(`N-1現値維持が13件でない: ${n1Kept}`);

  if (!apply) {
    console.log('[update2607] dry-run 完了（書込なし）');
    return;
  }

  // ── 本実行: 逐次PATCH（既存）＋PUT作成（新設） ──
  let ok = 0, fail = 0;
  const failures: string[] = [];
  for (const p of plans) {
    for (let attempt = 0; ; attempt++) {
      try {
        await client.update({ endpoint: 'substations', contentId: p.slug, content: p.patch });
        ok++;
        break;
      } catch (e: any) {
        const status = e?.response?.status ?? e?.status;
        if ((status === 429 || (status >= 500 && status < 600)) && attempt < 5) {
          await sleep(800 * Math.pow(2, attempt));
          continue;
        }
        fail++;
        failures.push(`${p.slug}: ${e?.message ?? e}`);
        break;
      }
    }
    if (ok % 200 === 0) console.log(`  ${ok}/${plans.length} ...`);
    await sleep(400);
  }
  console.log(`  既存更新: 成功 ${ok} / 失敗 ${fail}`);

  // 新設（create → already exists なら update = 冪等）
  try {
    await client.create({ endpoint: 'substations', contentId: 'tpg-1719', content: newContent });
    console.log('  ✓ tpg-1719 新設');
  } catch (e: any) {
    if (/already exists/i.test(e?.message ?? '')) {
      await client.update({ endpoint: 'substations', contentId: 'tpg-1719', content: newContent });
      console.log('  ✓ tpg-1719 更新（既存・冪等）');
    } else {
      throw e;
    }
  }

  fs.writeFileSync(LOG_OUT, JSON.stringify({ fetched_at: FETCHED_AT, ok, fail, failures,
    changed: changedPlans.map((p) => ({ slug: p.slug, keys: p.changedKeys })) }, null, 2));

  // ── 照合（#106）: 全tpg-*をページングGETし主要fieldを検証 ──
  await sleep(1500);
  console.log('  照合GET（100件×18ページ・逐次）...');
  const live = new Map<string, any>();
  for (let offset = 0; ; offset += 100) {
    const page = await client.getList({ endpoint: 'substations', queries: {
      filters: 'slug[begins_with]tpg-', limit: 100, offset,
      fields: 'slug,name,last_updated,fetched_at,forecast_flow_mw,cap_avail_upper_mw,n1_eligible,cap_operational_mw,capacity_total_mw,n1_capacity_mw' } });
    for (const c of page.contents as any[]) live.set(c.slug, c);
    if (offset + 100 >= page.totalCount) break;
    await sleep(400);
  }
  let mis = 0;
  for (const p of plans) {
    const l = live.get(p.slug);
    if (!l) { console.log(`  ✗ 消失? ${p.slug}`); mis++; continue; }
    if (l.last_updated !== LAST_UPDATED) { if (mis < 5) console.log(`  ✗ ${p.slug} last_updated=${l.last_updated}`); mis++; continue; }
    for (const k of p.changedKeys) {
      if (k === 'name' || k === 'oc_possibility') continue;
      if (JSON.stringify(l[k] ?? null) !== JSON.stringify((p.patch as any)[k] ?? null)) {
        if (mis < 8) console.log(`  ✗ ${p.slug} ${k}: live=${l[k]} 期待=${(p.patch as any)[k]}`);
        mis++;
      }
    }
  }
  const frozen = live.get(FROZEN_SLUG);
  console.log(`  照合: 総数=${live.size}（期待1719） 不一致=${mis}`);
  console.log(`  凍結確認 ${FROZEN_SLUG}: last_updated=${frozen?.last_updated}（期待 2026-04-23 のまま） name=${frozen?.name}`);
  console.log(`  新設確認 tpg-1719: ${JSON.stringify(live.get('tpg-1719') ?? null)}`);
  console.log(`  改称確認 tpg-0979: name=${live.get('tpg-0979')?.name}（期待 通町東）`);
  if (mis || live.size !== 1719) process.exit(1);
  console.log('[update2607] 本実行＋照合 完了');
}

main().catch((e) => { console.error('FATAL:', e?.message ?? String(e)); process.exit(1); });
export {};
