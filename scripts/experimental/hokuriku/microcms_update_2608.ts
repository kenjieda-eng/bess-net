#!/usr/bin/env tsx
/**
 * scripts/experimental/hokuriku/microcms_update_2608.ts
 * 北陸電力送配電 再取込 本実行（2026年8月5日公表・CSV版）
 *
 * 実行:
 *   npx tsx scripts/experimental/hokuriku/microcms_update_2608.ts          # dry-run（書込なし）
 *   APPLY=1 npx tsx scripts/experimental/hokuriku/microcms_update_2608.ts  # 本実行
 *
 * 裁定の実装（2026-08-16）:
 *   - N-1可否は CSV「-」（未算定）の222件を現値維持＝フィールドを送らない。
 *     一覧は scripts/experimental/_common/n1_undetermined.json に固定済み（三値化タスクの入力）。
 *   - baseline は本番実データ（fetch_baseline.py の baseline_live.json）。static JSON は使わない
 *     （欠損フィールドが「新規充足」の偽陽性になるため。落とし穴 #113）。
 *   - 更新は update(=PATCH 部分更新)。未送信フィールドは保持され欠落しない。
 *   - 新設3件は create（already exists なら update＝冪等）。
 *   - last_updated=2026-08-05 全件共通 / fetched_at=実行時刻。逐次400ms・並列禁止・429/5xx backoff。
 */
import * as fs from 'node:fs';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const BASELINE = 'scripts/experimental/hokuriku/baseline_live.json';
const NORMALIZED = 'scripts/experimental/hokuriku/hokuriku_csv_2608_normalized.json';
const LOG_OUT = 'scripts/experimental/hokuriku/.update_2608_log.json';

const LAST_UPDATED = '2026-08-05T00:00:00.000Z';
const SOURCE_BASE = 'https://www.rikuden.co.jp/nw_notification/attach';
const FILE_OF_REGION: Record<string, string> = {
  kikan: 'sys_capa_kikan01_tr_202608_05.csv',
  toyama: 'sys_capa_local01_tr_202608_05.csv',
  ishikawa: 'sys_capa_local02_tr_202608_05.csv',
  fukui: 'sys_capa_local03_tr_202608_05.csv',
};
// 承認された反映フィールド（台数=units を含む。N-1可否は別扱い）
const NUM_KEYS = ['cap_avail_mw', 'cap_operational_mw', 'forecast_flow_mw',
  'capacity_total_mw', 'n1_capacity_mw', 'units'] as const;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

function voltageClass(kv: number | null): string {
  if (kv === null) return 'その他';
  if (kv >= 500) return '500kV系';
  if (kv >= 275) return '275kV系';
  if (kv >= 154) return '154kV系';
  if (kv >= 77) return '77kV系';
  if (kv >= 66) return '66kV系';
  if (kv >= 22) return '22kV系';
  return 'その他';
}

async function main() {
  loadEnv();
  const apply = process.env.APPLY === '1';
  const FETCHED_AT = new Date().toISOString();
  const { client } = await import('../../../src/lib/microcms');

  const base: any[] = JSON.parse(fs.readFileSync(BASELINE, 'utf8'));
  const rows: any[] = JSON.parse(fs.readFileSync(NORMALIZED, 'utf8')).rows;
  const bySlug = new Map<string, any>(base.map((b) => [b.slug, b]));

  type Plan = { slug: string; patch: Record<string, unknown>; changed: string[] };
  const updates: Plan[] = [];
  const creates: Array<{ slug: string; content: Record<string, unknown> }> = [];
  let n1Kept = 0;

  for (const r of rows) {
    const b = bySlug.get(r.slug);
    const srcUrl = `${SOURCE_BASE}/${FILE_OF_REGION[r.region]}`;
    if (!b) {
      // 新設（既存 slug と衝突しないことは bySlug 未ヒットで確認済み）
      const content: Record<string, unknown> = {
        slug: r.slug,
        name: r.name,
        operator: ['北陸電力送配電'],
        area: ['北陸'],
        prefecture: r.prefecture ?? undefined,
        voltage_class: [voltageClass(r.voltage_primary_kv)],
        n1_eligible: r.n1_eligible === true,
        external_id: r.external_id,
        source_url: srcUrl,
        data_source_format: ['CSV'],
        last_updated: LAST_UPDATED,
        fetched_at: FETCHED_AT,
      };
      for (const k of ['voltage_primary_kv', 'voltage_secondary_kv', ...NUM_KEYS] as string[]) {
        if (r[k] !== null && r[k] !== undefined) content[k] = r[k];
      }
      if (r.constraint) content.op_constraint = r.constraint;
      if (r.notes) content.notes = r.notes;
      if (r.oc_possibility === '有り') content.oc_possibility = ['有り'];
      creates.push({ slug: r.slug, content });
      continue;
    }
    const patch: Record<string, unknown> = { last_updated: LAST_UPDATED, fetched_at: FETCHED_AT, source_url: srcUrl };
    const changed: string[] = [];
    for (const k of NUM_KEYS) {
      const o = b[k] ?? null;
      const n = r[k] ?? null;
      if (n !== null && o !== n) { patch[k] = n; changed.push(k); }
    }
    // N-1可否: CSVが未算定(null)なら現値維持＝送らない
    if (r.n1_eligible === null || r.n1_eligible === undefined) {
      if (b.n1_eligible !== null && b.n1_eligible !== undefined) n1Kept++;
    } else if (r.n1_eligible !== b.n1_eligible) {
      patch.n1_eligible = r.n1_eligible;
      changed.push('n1_eligible');
    }
    updates.push({ slug: r.slug, patch, changed });
  }

  const changedPlans = updates.filter((p) => p.changed.length > 0);
  const fieldCount = new Map<string, number>();
  for (const p of changedPlans) for (const k of p.changed) fieldCount.set(k, (fieldCount.get(k) ?? 0) + 1);
  console.log(`[hokuriku-2608] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  更新PUT: ${updates.length}件（値変化あり ${changedPlans.length}件） / 新設: ${creates.length}件`);
  console.log(`  N-1可否 現値維持: ${n1Kept}件（期待222）`);
  console.log(`  変化フィールド内訳: ${JSON.stringify(Object.fromEntries(fieldCount))}`);
  console.log(`  新設slug: ${creates.map((c) => c.slug).join(', ')}`);
  console.log(`  last_updated=${LAST_UPDATED} / fetched_at=${FETCHED_AT}`);
  if (updates.length !== 271) throw new Error(`更新対象が271件でない: ${updates.length}`);
  if (creates.length !== 3) throw new Error(`新設が3件でない: ${creates.length}`);
  if (n1Kept !== 222) throw new Error(`N-1現値維持が222件でない: ${n1Kept}`);

  if (!apply) { console.log('[hokuriku-2608] dry-run 完了（書込なし）'); return; }

  let ok = 0, fail = 0;
  const failures: string[] = [];
  for (const p of updates) {
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
        fail++; failures.push(`${p.slug}: ${e?.message ?? e}`); break;
      }
    }
    if (ok % 100 === 0) console.log(`  ${ok}/${updates.length} ...`);
    await sleep(400);
  }
  console.log(`  既存更新: 成功 ${ok} / 失敗 ${fail}`);

  for (const c of creates) {
    try {
      await client.create({ endpoint: 'substations', contentId: c.slug, content: c.content });
      console.log(`  ✓ 新設 ${c.slug}`);
    } catch (e: any) {
      if (/already exists/i.test(e?.message ?? '')) {
        await client.update({ endpoint: 'substations', contentId: c.slug, content: c.content });
        console.log(`  ✓ 新設(既存・冪等更新) ${c.slug}`);
      } else { fail++; failures.push(`${c.slug}: ${e?.message ?? e}`); }
    }
    await sleep(400);
  }

  fs.writeFileSync(LOG_OUT, JSON.stringify({ fetched_at: FETCHED_AT, ok, fail, failures,
    changed: changedPlans.map((p) => ({ slug: p.slug, keys: p.changed })), created: creates.map((c) => c.slug) }, null, 2));

  // ── 照合（#106）: 全 rkd-* を再GETして検証 ──
  await sleep(1500);
  const live = new Map<string, any>();
  for (let offset = 0; ; offset += 100) {
    const page = await client.getList({ endpoint: 'substations', queries: {
      filters: 'slug[begins_with]rkd-', limit: 100, offset,
      fields: 'slug,name,last_updated,fetched_at,cap_avail_mw,cap_operational_mw,forecast_flow_mw,capacity_total_mw,n1_capacity_mw,units,n1_eligible' } });
    for (const c of page.contents as any[]) live.set(c.slug, c);
    if (offset + 100 >= page.totalCount) break;
    await sleep(400);
  }
  let mis = 0;
  for (const p of updates) {
    const l = live.get(p.slug);
    if (!l) { console.log(`  ✗ 消失? ${p.slug}`); mis++; continue; }
    if (l.last_updated !== LAST_UPDATED) { if (mis < 5) console.log(`  ✗ ${p.slug} last_updated=${l.last_updated}`); mis++; continue; }
    for (const k of p.changed) {
      if (JSON.stringify(l[k] ?? null) !== JSON.stringify((p.patch as any)[k] ?? null)) {
        if (mis < 8) console.log(`  ✗ ${p.slug} ${k}: live=${l[k]} 期待=${(p.patch as any)[k]}`);
        mis++;
      }
    }
  }
  for (const c of creates) {
    const l = live.get(c.slug);
    console.log(`  新設確認 ${c.slug}: ${l ? `${l.name} / 空容量=${l.cap_avail_mw ?? '-'} / ${l.last_updated}` : '★不在'}`);
    if (!l) mis++;
  }
  console.log(`  照合: 総数=${live.size}（期待274） 不一致=${mis}`);
  if (mis || live.size !== 274) process.exit(1);
  console.log('[hokuriku-2608] 本実行＋照合 完了');
}

main().catch((e) => { console.error('FATAL:', e?.message ?? String(e)); process.exit(1); });
export {};
