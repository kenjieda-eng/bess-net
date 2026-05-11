/**
 * scripts/post-b-to-explainer-batch.ts
 *
 * 依頼AE Phase C: 43件の B_TO_EXPLAINER ドラフトを microCMS explainer に POST。
 *
 * ## 前提
 *  - microCMS の explainer schema は既存運用通り（title, slug, lead, body, sources, relatedTerms, category）
 *  - 入力: scripts/b-to-explainer-final.json（Phase B で 江田さん承認済の 43件）
 *  - 江田さん作業: microCMS Admin で explainer の Webhook 一時 OFF
 *  - MICROCMS_API_KEY / MICROCMS_SERVICE_DOMAIN 環境変数
 *
 * ## 実行
 *   # 1) dry-run（重複チェック・既存衝突チェックのみ）
 *   $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/post-b-to-explainer-batch.ts --dry-run
 *   # 2) 本実行
 *   $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/post-b-to-explainer-batch.ts
 *
 * ## 動作
 *  1. final.json から 43件のドラフトを読み込み
 *  2. 各 slug について GET filters[slug][equals] で既存チェック
 *     - 既存あり → skip（冪等性）
 *     - 既存なし → POST /api/v1/explainer
 *  3. POST body: {title, slug, lead, body, sources, relatedTerms, category}
 *  4. publishedAt は microCMS 側で自動付与（POST 直後に公開状態）
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

type DraftItem = {
  slug: string;
  title: string;
  category: string[];
  lead: string;
  body: string;
  sources: string;
  relatedTerms: string;
};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error(
    'ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY env vars are required'
  );
  process.exit(1);
}

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/explainer`;

async function api(
  method: 'GET' | 'POST',
  url: string,
  body?: unknown
): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${url} → HTTP ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function findBySlug(slug: string): Promise<{ id: string } | null> {
  const url = `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&fields=id&limit=1`;
  const data = (await api('GET', url)) as { contents: { id: string }[] };
  return data.contents[0] ?? null;
}

async function postOne(item: DraftItem): Promise<'ok' | 'skip' | 'err'> {
  // Check existing
  const existing = await findBySlug(item.slug);
  if (existing) {
    console.log(`  [skip] ${item.slug} — already exists (id=${existing.id})`);
    return 'skip';
  }
  // Build body
  const body: Record<string, unknown> = {
    title: item.title,
    slug: item.slug,
    lead: item.lead,
    body: item.body,
    category: item.category,
  };
  if (item.sources) body.sources = item.sources;
  if (item.relatedTerms) body.relatedTerms = item.relatedTerms;

  if (DRY_RUN) {
    console.log(
      `  [dry-run] POST ${item.slug}: title="${item.title.slice(0, 50)}..." body=${item.body.length}chars`
    );
    return 'ok';
  }

  try {
    const result = (await api('POST', BASE, body)) as { id: string };
    console.log(`  [ok] ${item.slug} — created id=${result.id}`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] ${item.slug}: ${(e as Error).message}`);
    return 'err';
  }
}

async function main(): Promise<void> {
  const jsonPath = path.join(
    process.cwd(),
    'scripts',
    'b-to-explainer-final.json'
  );
  if (!fs.existsSync(jsonPath)) {
    console.error(`ERROR: input not found: ${jsonPath}`);
    process.exit(1);
  }
  const text = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(text) as { count: number; items: DraftItem[] };

  console.log(
    `[post-b-to-explainer] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}, ${parsed.items.length} items`
  );

  // Pre-flight: check internal duplicates
  const slugs = parsed.items.map((it) => it.slug);
  const slugSet = new Set(slugs);
  if (slugSet.size !== slugs.length) {
    console.error(`ERROR: internal duplicate slugs detected in input`);
    process.exit(2);
  }

  let ok = 0;
  let skip = 0;
  let err = 0;

  for (const item of parsed.items) {
    const r = await postOne(item);
    if (r === 'ok') ok++;
    else if (r === 'skip') skip++;
    else err++;
    // Rate-limit safety (microCMS allows reasonable rate but be polite)
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\n[done] ok=${ok}, skip=${skip}, err=${err}`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
