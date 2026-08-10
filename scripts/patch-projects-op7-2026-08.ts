#!/usr/bin/env tsx
/**
 * scripts/patch-projects-op7-2026-08.ts
 *
 * Op7（2026-08-09）: projects.operator が null のレコードのうち、
 * 一次情報で事業者を確定できた 1件のみを差分 PATCH する。
 *
 * 対象: tokyogas-tomakomai-75（苫小牧75MWh蓄電所）
 *   現状: operator = null（データ不備）
 *   一次: https://prtimes.jp/main/html/rd/p/000001350.000021766.html（東京ガス株式会社・2025-11-25）
 *         「両社が共同で出資する苫小牧パワーストレージ合同会社」
 *         「東京ガスが20年間にわたり利用対価を苫小牧PSに対し支払い、系統用蓄電池の運用権を得る」
 *         出力 2.5万kW／容量 7.5万kWh ＝ 当レコードの outputMw=25 / capacityMwh=75 と一致
 *   → SPC＝苫小牧パワーストレージ合同会社、出資＝東京ガス／岡谷鋼機。
 *      既存の表記規約（例:「嬬恋蓄電所合同会社（東電HD×NTTアノードエナジー）」）に合わせる。
 *
 * 落とし穴 #106 準拠: PATCH 後に GET で全 field 照合する。
 * 実行: node scripts/run-with-env.mjs 相当（.env.local を値非表示で読み込んで実行）
 *       DRY=1 で dry-run（既定）、APPLY=1 で実行。
 */
import * as fs from 'node:fs';

type PatchPlan = { slug: string; field: 'operator'; before: unknown; after: string; source: string };

const PLANS: Omit<PatchPlan, 'before'>[] = [
  {
    slug: 'tokyogas-tomakomai-75',
    field: 'operator',
    after: '苫小牧パワーストレージ合同会社（東京ガス×岡谷鋼機）',
    source: 'https://prtimes.jp/main/html/rd/p/000001350.000021766.html',
  },
];

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const KEY = process.env.MICROCMS_API_KEY;
if (!DOMAIN || !KEY) {
  console.error('[op7] MICROCMS_SERVICE_DOMAIN / MICROCMS_API_KEY が未設定です');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1`;
const HEAD = { 'X-MICROCMS-API-KEY': KEY, 'Content-Type': 'application/json' };

async function findBySlug(slug: string): Promise<Record<string, unknown> | null> {
  const r = await fetch(`${BASE}/projects?filters=slug[equals]${encodeURIComponent(slug)}&depth=0`, {
    headers: { 'X-MICROCMS-API-KEY': KEY! },
  });
  if (!r.ok) throw new Error(`GET projects ${r.status}`);
  const j = (await r.json()) as { contents: Record<string, unknown>[] };
  return j.contents[0] ?? null;
}

async function main(): Promise<void> {
  const apply = process.env.APPLY === '1';
  console.log(`[op7] mode = ${apply ? 'APPLY' : 'DRY-RUN'}`);

  const results: unknown[] = [];
  for (const plan of PLANS) {
    const cur = await findBySlug(plan.slug);
    if (!cur) {
      console.log(`  ✗ ${plan.slug}: 見つかりません（スキップ）`);
      continue;
    }
    const before = cur[plan.field];
    console.log(`\n  ${plan.slug} (id=${cur.id})`);
    console.log(`    ${plan.field}: ${JSON.stringify(before)}  →  ${JSON.stringify(plan.after)}`);
    console.log(`    根拠: ${plan.source}`);

    if (before === plan.after) {
      console.log('    = 既に同値のためスキップ（冪等）');
      continue;
    }
    if (!apply) continue;

    const res = await fetch(`${BASE}/projects/${cur.id}`, {
      method: 'PATCH',
      headers: HEAD,
      body: JSON.stringify({ [plan.field]: plan.after }),
    });
    if (!res.ok) {
      console.error(`    ✗ PATCH 失敗 ${res.status}: ${(await res.text()).slice(0, 300)}`);
      process.exitCode = 1;
      continue;
    }
    console.log('    ✓ PATCH 完了');

    // 落とし穴 #106: 投入値が実際に入ったかを GET で照合する
    await new Promise((r) => setTimeout(r, 600));
    const after = await findBySlug(plan.slug);
    const ok = after && after[plan.field] === plan.after;
    console.log(`    照合: ${plan.field} = ${JSON.stringify(after?.[plan.field])} → ${ok ? '✓ 一致' : '✗ 不一致'}`);
    if (!ok) process.exitCode = 1;
    // 他フィールドが壊れていないことも確認
    const keys = ['name', 'slug', 'status', 'outputMw', 'capacityMwh', 'prefecture', 'city', 'marketParticipation', 'sourceUrl'];
    const drift = keys.filter((k) => JSON.stringify(cur[k]) !== JSON.stringify(after?.[k]));
    console.log(`    他フィールドの変化: ${drift.length ? '✗ ' + drift.join(',') : '✓ なし'}`);
    if (drift.length) process.exitCode = 1;
    results.push({ slug: plan.slug, before, after: after?.[plan.field], drift });
  }

  if (apply && results.length) {
    fs.writeFileSync('scripts/.op7-patch-log.json', JSON.stringify(results, null, 2));
    console.log('\n[op7] ログ: scripts/.op7-patch-log.json');
  }
}

main().catch((e) => {
  console.error('[op7] ERROR:', e);
  process.exit(1);
});

export {};
