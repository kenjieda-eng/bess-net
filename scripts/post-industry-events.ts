/**
 * ★2026-08-31 廃止（実行しないこと）
 * 旧 industry-events エンドポイントは policy-events（kind=業界）へ統合済み。
 * 本スクリプトは過去の一回物の記録として残しているだけで、実行すると廃止予定の
 * エンドポイントへ書き込もうとする。新規の業界イベント投入は policy-events に
 * kind=業界 で行うこと（移行手順は scripts/migrate-industry-events-2026-08-31.ts）。
 */
/**
 * scripts/post-industry-events.ts
 *
 * 依頼AC Phase B: 江田さん作成の industry-events エンドポイントに 40件投入
 *
 * 前提:
 *  - microCMS で industry-events エンドポイント作成済（江田さん作業）
 *  - フィールド: title, slug, eventDate (date), endDate (date 任意), venue (text 任意),
 *    location (text 任意), eventType (select 単一), organizer (text 必須),
 *    description (textArea 任意), officialUrl (text 任意),
 *    registrationDeadline (date 任意), relatedTopics (select 複数 任意),
 *    status (select 単一 任意)
 *  - MICROCMS_API_KEY / MICROCMS_SERVICE_DOMAIN 環境変数
 *
 * 実行:
 *   $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/post-industry-events.ts --dry-run
 *   $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/post-industry-events.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

type Draft = {
  slug: string;
  title: string;
  eventDate: string;
  endDate?: string;
  venue?: string;
  location?: string;
  eventType: string;
  organizer: string;
  description?: string;
  officialUrl?: string;
  registrationDeadline?: string;
  relatedTopics?: string[];
  status: string;
};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/industry-events`;

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
    const body: Record<string, unknown> = {
      slug: draft.slug,
      title: draft.title,
      eventDate: draft.eventDate,
      eventType: [draft.eventType],
      organizer: draft.organizer,
      status: [draft.status],
    };
    if (draft.endDate) body.endDate = draft.endDate;
    if (draft.venue) body.venue = draft.venue;
    if (draft.location) body.location = draft.location;
    if (draft.description) body.description = draft.description;
    if (draft.officialUrl) body.officialUrl = draft.officialUrl;
    if (draft.registrationDeadline) body.registrationDeadline = draft.registrationDeadline;
    if (draft.relatedTopics && draft.relatedTopics.length > 0)
      body.relatedTopics = draft.relatedTopics;

    if (DRY_RUN) {
      console.log(
        `  [dry-run] POST ${draft.slug}: ${draft.eventDate} [${draft.eventType}] ${draft.title.slice(0, 50)}`
      );
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
  const jsonPath = path.join(
    process.cwd(),
    'scripts',
    'ac-industry-events-drafts.json'
  );
  if (!fs.existsSync(jsonPath)) {
    console.error(`ERROR: input not found: ${jsonPath}`);
    process.exit(1);
  }
  const text = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(text) as { items: Draft[] };

  console.log(
    `[post-industry-events] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}, ${parsed.items.length} items`
  );

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
