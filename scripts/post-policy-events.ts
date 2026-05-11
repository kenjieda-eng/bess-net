/**
 * scripts/post-policy-events.ts
 *
 * 依頼AB Phase B: 江田さん作成の policy-events エンドポイントに 26件投入
 *
 * 前提:
 *  - microCMS で policy-events エンドポイント作成済（Sprint 2 Kickoff Day で江田さん作業）
 *  - フィールド: title, slug, eventDate (date), eventType (select), issuer (text), description (textArea),
 *    sourceUrl (text), status (select), category (multi-select)
 *  - MICROCMS_API_KEY / MICROCMS_SERVICE_DOMAIN 環境変数
 *
 * 実行:
 *   $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/post-policy-events.ts --dry-run
 *   $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/post-policy-events.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

type Draft = {
  slug: string;
  title: string;
  eventDate: string;
  eventType: string; // microCMS select は文字列で送る (string[])
  issuer: string;
  description: string;
  sourceUrl: string;
  status: string;
  category?: string[];
};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/policy-events`;

async function api(method: string, url: string, body?: unknown): Promise<unknown> {
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

async function postOne(draft: Draft): Promise<'ok' | 'skip' | 'err'> {
  try {
    const existing = await findBySlug(draft.slug);
    if (existing) {
      console.log(`  [skip] ${draft.slug} — already exists (id=${existing.id})`);
      return 'skip';
    }
    // microCMS select は配列で POST する
    const body: Record<string, unknown> = {
      slug: draft.slug,
      title: draft.title,
      eventDate: draft.eventDate,
      eventType: [draft.eventType],
      issuer: draft.issuer,
      description: draft.description,
      sourceUrl: draft.sourceUrl,
      status: [draft.status],
    };
    if (draft.category && draft.category.length > 0) body.category = draft.category;

    if (DRY_RUN) {
      console.log(`  [dry-run] POST ${draft.slug}: ${draft.eventDate} [${draft.eventType}] ${draft.title.slice(0, 40)}`);
      return 'ok';
    }
    const result = (await api('POST', BASE, body)) as { id: string };
    console.log(`  [ok] ${draft.slug} — created id=${result.id}`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] ${draft.slug}: ${(e as Error).message}`);
    return 'err';
  }
}

async function main(): Promise<void> {
  const jsonPath = path.join(process.cwd(), 'scripts', 'ab-policy-events-drafts.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`ERROR: input not found: ${jsonPath}`);
    process.exit(1);
  }
  const text = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(text) as { items: Draft[] };

  console.log(
    `[post-policy-events] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}, ${parsed.items.length} items`
  );

  // duplicate slug check
  const slugs = parsed.items.map((it) => it.slug);
  if (new Set(slugs).size !== slugs.length) {
    console.error(`ERROR: internal duplicate slugs detected`);
    process.exit(2);
  }

  let ok = 0,
    skip = 0,
    err = 0;
  for (const draft of parsed.items) {
    const r = await postOne(draft);
    if (r === 'ok') ok++;
    else if (r === 'skip') skip++;
    else err++;
    await new Promise((resolve) => setTimeout(resolve, 200));
  }

  console.log(`\n[done] ok=${ok}, skip=${skip}, err=${err}`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
