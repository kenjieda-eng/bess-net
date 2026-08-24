/**
 * scripts/patch-operator-mirait-one-2026-08-24.ts
 * operators slug=mirait の社名を「株式会社ミライト」→「株式会社ミライト・ワン」へ改名。
 *
 * ── 事実（ユウ一次照合 2026-08-24・独立2ソース）──────────────────────────
 * 株式会社ミライトは 2022年7月1日にミライト・ホールディングス／ミライト・テクノロジーズと
 * 3社統合され「株式会社ミライト・ワン」となり消滅（2026年現在 存在しない）。
 *   https://built.itmedia.co.jp/bt/articles/2205/25/news024.html （ITmedia BUILT 2022-05-25）
 *   https://www.nihon-ma.co.jp/news/20240326_1417-16/ （日本M&Aセンター）
 * 筑紫野天山蓄電所（2025-06-30 竣工）の EPC 受託者は 株式会社ミライト・ワン
 *   https://www.mirait-one.com/info/001697.html （自社公式 2025-07-28）
 * → 現状は「2022年に消滅した法人に 2025年の案件を帰属させている」状態＝事実として誤り。
 *
 * ── 処置: 改名（新規登録＋301 はしない）─────────────────────────────
 * 別法人ではなく承継。同一実体で2エントリを作ると重複計上になる
 * （operators-excluded.ts の警告・8/23 kepco-eflow-aso-chikugo の実例）。
 * ★slug は変更しない（識別子であって事実主張ではない。変えると 301・sitemap・内部リンクの
 *   掃除が発生する）。PATCH は name フィールドのみ。
 *
 * ── 着手前の実測（2026-08-24）────────────────────────────────────
 * ・slug=mirait は microCMS に登録済み（id R5Sw4dIYy・category ["EPC"]）
 *   ※generated index の grep ヒットは登録の証拠にならない（本文テキストを含むため）ので
 *     microCMS を直接 GET して確認した。
 * ・operators に aliases フィールドは存在する（15社が使用中）。本エントリは未設定。
 * ・/projects/mirait-chikushino の operator 欄は既に「株式会社ミライト・ワン」
 *   → 改名すればマスタ完全一致になり、突合はむしろ厳密になる。
 * ・旧称「株式会社ミライト」単独表記（直後が「・ワン」でない）は news 2件のみ・projects 0件。
 *     pr-2020-03-30-co29136-35 … 2020年・統合前の実体としての言及
 *     pr-2024-03-22-co55631-115-3 … 「ミライト・ワンは…ミライトの3社が統合し」という沿革説明
 *       （「ミライト・ワン」も含むため改名後も拾える）
 * ・「ミライト・ワン・システムズ」（別法人）の出現は news/projects とも 0件。
 *
 * 作法: GET 先行／冪等（既に新社名なら skip = #91）／PATCH 後 GET 全field照合（#106）／
 *       DELETE・PUT 不使用／slug は不変。
 * 実行: npx tsx --env-file=.env.local scripts/patch-operator-mirait-one-2026-08-24.ts [--dry-run]
 */
export {};
const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const ID = 'R5Sw4dIYy';
const URL_ = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/operators/${ID}`;
const OLD_NAME = '株式会社ミライト';
const NEW_NAME = '株式会社ミライト・ワン';
const SKIP = new Set(['createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

async function api(method: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(URL_, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

async function main(): Promise<void> {
  const before = (await api('GET')) as Record<string, unknown>;
  if (before.slug !== 'mirait') throw new Error(`slug 不一致: ${String(before.slug)}`);
  console.log(`operators/${ID} slug=${String(before.slug)} name="${String(before.name)}"`);

  if (before.name === NEW_NAME) { console.log('  [skip] 既に新社名 — 冪等スキップ'); return; }
  if (before.name !== OLD_NAME) { console.error(`  ✗ 想定外の社名（"${String(before.name)}"）— 中止`); process.exit(1); }

  console.log(`  → name: "${OLD_NAME}" → "${NEW_NAME}"（slug は変更しない）`);
  if (DRY_RUN) { console.log('  [dry-run] PATCH name のみ'); return; }

  await api('PATCH', { name: NEW_NAME });
  await new Promise((r) => setTimeout(r, 900));
  const after = (await api('GET')) as Record<string, unknown>;

  let bad = 0;
  for (const k of new Set([...Object.keys(before), ...Object.keys(after)])) {
    if (SKIP.has(k)) continue;
    if (k === 'name') {
      const ok = after.name === NEW_NAME;
      console.log(`  ${ok ? '✓' : '✗'} name: "${String(after.name)}"`);
      if (!ok) bad++;
    } else if (JSON.stringify(after[k]) !== JSON.stringify(before[k])) {
      bad++;
      console.log(`  ✗ ${k}: 意図しない変化 ${JSON.stringify(before[k])?.slice(0, 90)} → ${JSON.stringify(after[k])?.slice(0, 90)}`);
    }
  }
  console.log(`  ✓ slug 不変: ${String(after.slug) === 'mirait'}`);
  console.log(`  ✓ category 不変: ${JSON.stringify(after.category)}`);
  console.log(`\n[patch-operator-mirait-one] 意図外の変化 ${bad}件`);
  if (bad) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
