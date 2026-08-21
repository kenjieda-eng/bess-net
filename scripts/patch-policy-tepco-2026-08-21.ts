#!/usr/bin/env tsx
/**
 * scripts/patch-policy-tepco-2026-08-21.ts — policy-events「東京電力PG 系統情報公開 一時停止」の title/description 是正
 * 監査便 §3（件別承認済み・2026-08-21）。PATCH 1件のみ・他fieldは送らない（差分限定）。
 *
 * 一次（2026-08-21 実取得）: 東京電力パワーグリッド お知らせ一覧
 *   https://www.tepco.co.jp/pg/consignment/system/information/index-j.html
 *   「2026年6月2日 2026年2月2日からデータメンテナンスのため公開を一時停止していた『系統の空き容量等に関する情報』
 *    および『需要・送配電に関する情報』の系統構成・予想潮流について、公開を再開しました。」
 *
 * 実行: npx tsx scripts/patch-policy-tepco-2026-08-21.ts            # dry-run（前後GETのみ）
 *       APPLY=1 npx tsx scripts/patch-policy-tepco-2026-08-21.ts    # 本実行（#106: 前後GET全field照合）
 */
import * as fs from 'node:fs';

function loadEnv() {
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m) { const v = m[2].trim().replace(/^["']|["']$/g, ''); if (!process.env[m[1]]) process.env[m[1]] = v; }
  }
}

const ID = 'jq9zjxzn_xah';
const SLUG = 'tepco-pg-grid-info-suspension-2026-05';
const PATCH = {
  title: '東京電力PG 系統情報公開 一時停止 → 6月2日再開',
  description:
    '東京電力パワーグリッドが系統情報（変電所別空き容量等）の公開を2026年2月2日に一時停止し、データメンテナンスを経て2026年6月2日に公開を再開。' +
    '蓄電所事業者の関東エリア用地選定に影響した事案で、停止期間中は事前相談等での確認が代替手段だった。',
};
const SKIP = new Set(['createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

async function main() {
  loadEnv();
  const apply = process.env.APPLY === '1';
  const { client } = await import('../src/lib/microcms');
  const before = await client.get<Record<string, unknown>>({ endpoint: 'policy-events', contentId: ID });
  if (before.slug !== SLUG) throw new Error(`slug 不一致: ${before.slug}`);
  console.log(`[patch-policy-tepco] mode=${apply ? 'APPLY' : 'DRY-RUN'}`);
  console.log(`  before.title      = ${before.title}`);
  console.log(`  before.description= ${String(before.description).slice(0, 60)}…`);
  console.log(`  before.status     = ${JSON.stringify(before.status)}（変更しない）`);
  console.log(`  after.title       = ${PATCH.title}（${PATCH.title.length}字）`);
  if (!apply) { console.log('[patch-policy-tepco] dry-run 完了（書込なし）'); return; }

  await client.update({ endpoint: 'policy-events', contentId: ID, content: PATCH });
  await new Promise((r) => setTimeout(r, 800));
  const after = await client.get<Record<string, unknown>>({ endpoint: 'policy-events', contentId: ID });
  // #106: 前後GET 全field照合 — title/description 以外に変化がないこと
  let bad = 0;
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (SKIP.has(k)) continue;
    const b = JSON.stringify(before[k]), a = JSON.stringify(after[k]);
    if (k in PATCH) {
      if (a !== JSON.stringify((PATCH as Record<string, string>)[k])) { bad++; console.log(`  ✗ ${k}: 反映されていない`); }
      else console.log(`  ✓ ${k}: 更新反映`);
    } else if (a !== b) { bad++; console.log(`  ✗ ${k}: 意図しない変化 ${b} → ${a}`); }
  }
  console.log(`  照合: 意図外の変化 ${bad}件 / status=${JSON.stringify(after.status)}`);
  fs.writeFileSync('scripts/experimental/_common/policy_tepco_after.json', JSON.stringify({ before, after }, null, 1));
  if (bad) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
