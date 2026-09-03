#!/usr/bin/env tsx
/**
 * scripts/patch-projects-pj2d-status-2026-09-03.ts — Pj2-D 工程0: 裁定1 の status 1フィールド PATCH
 *
 * 承認: 02_計画・運営/検証記録_Pj2C_裁定_2026-09-03_ユウ.md §3-1
 *   「inokuchi の status=['計画中'] PATCH — 承認（既存 301 前例の『canonical 補完済み』条件に合わせる）。
 *    cod は空のままも承認——2025-09-19 は発表日で E 群が是正した欠陥そのもの、#53 で
 *    『一次に運開日なし』確定済み」
 *
 * 背景: Pj2-C で pr-co88876-bess-3 → starseeds-wakayama-inokuchi へ 301 したが、
 *   canonical 側の status が空（[]）で /projects の「その他」グループに落ちていた。
 *   301元は status=['計画中'] を持っていたため、集約で分類情報が失われていた。
 *
 * ★本便の microCMS 書込はこの1フィールドのみ。cod には触らない。body の PATCH は
 *   提案表→ユウ承認後の実行便 E で行う（本スクリプトの対象外）。
 *
 * #106 対策: select は未定義の選択肢値を silently drop するため、
 *   (1) PATCH 前に既存レコード群から「計画中」が実在の選択肢値であることを確認
 *   (2) PATCH 後に GET して値の実反映と他フィールドの不変を全field照合
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1/projects`;
const DRY = process.argv.includes('--dry-run');
const SYS = new Set(['createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

const TARGET_SLUG = 'starseeds-wakayama-inokuchi';
const FIELD = 'status';
const VALUE = ['計画中'];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}

async function getBySlug(slug: string): Promise<Record<string, unknown> | null> {
  const d = await api<{ contents: Array<Record<string, unknown>> }>(
    'GET',
    `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`
  );
  return d.contents[0] ?? null;
}

async function main(): Promise<void> {
  console.log(`[pj2d-status] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);

  // (1) 選択肢の実在確認（#106: select の未定義値は silently drop する）
  const all: Array<Record<string, unknown>> = [];
  for (let off = 0; off < 2000; off += 100) {
    const d = await api<{ totalCount: number; contents: Array<Record<string, unknown>> }>(
      'GET',
      `${BASE}?limit=100&offset=${off}&fields=slug,status`
    );
    all.push(...d.contents);
    if (all.length >= d.totalCount) break;
  }
  const observed = new Map<string, number>();
  for (const r of all) for (const s of (r.status as string[] | undefined) ?? []) observed.set(s, (observed.get(s) ?? 0) + 1);
  console.log(`  既存 status の実測分布（${all.length}件）: ${[...observed.entries()].map(([k, v]) => `${k}=${v}`).join(' / ')}`);
  if (!observed.has(VALUE[0])) {
    console.error(`  ★NG: 「${VALUE[0]}」が既存データに1件も無い → 選択肢未定義の可能性。silently drop を避けるため停止`);
    process.exit(1);
  }
  console.log(`  ✓ 「${VALUE[0]}」は実在の選択肢値（${observed.get(VALUE[0])}件で使用中）`);

  // (2) 対象の現状確認
  const before = await getBySlug(TARGET_SLUG);
  if (!before) {
    console.error(`  ★NG: ${TARGET_SLUG} が見つからない`);
    process.exit(1);
  }
  const cur = (before[FIELD] as string[] | undefined) ?? [];
  console.log(`  対象 ${TARGET_SLUG} (id=${before.id})`);
  console.log(`    現在: ${FIELD}=${JSON.stringify(before[FIELD])} / cod=${JSON.stringify(before.cod)}（cod は触らない）`);

  if (JSON.stringify(cur) === JSON.stringify(VALUE)) {
    console.log(`  [skip] 既に ${JSON.stringify(VALUE)}（冪等 #91）`);
    return;
  }
  if (cur.length > 0) {
    console.error(`  ★NG: status が空でない（${JSON.stringify(cur)}）。承認は「空 → 計画中」の補完なので停止`);
    process.exit(1);
  }

  console.log(`  [PATCH] ${FIELD}: ${JSON.stringify(cur)} → ${JSON.stringify(VALUE)}`);
  if (DRY) return;

  await api('PATCH', `${BASE}/${before.id}`, { [FIELD]: VALUE });
  await new Promise((r) => setTimeout(r, 1000));
  const after = await getBySlug(TARGET_SLUG);

  // (3) #106 全field照合
  const okField = JSON.stringify(after?.[FIELD]) === JSON.stringify(VALUE);
  const others: string[] = [];
  for (const k of new Set([...Object.keys(before), ...Object.keys(after ?? {})])) {
    if (SYS.has(k) || k === FIELD) continue;
    if (JSON.stringify(before[k]) !== JSON.stringify(after?.[k])) others.push(k);
  }
  console.log(`  #106: 反映=${okField ? '✓' : '★NG'}（実値 ${JSON.stringify(after?.[FIELD])}） / 他フィールド変化=${others.length === 0 ? '0' : '★' + others.join(',')}`);
  console.log(`  cod の確認: ${JSON.stringify(after?.cod)}（空のままが正）`);
  if (!okField || others.length > 0) process.exit(1);
  console.log(`[done] 実行 1 / 失敗 0`);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });

export {};
