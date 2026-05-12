/**
 * scripts/post-faq.ts
 *
 * 依頼AD Phase B: faq エンドポイントに 50件投入
 *
 * 前提:
 *  - microCMS で faq エンドポイント作成済（江田さん作業、JSON schema import）
 *  - 入力: scripts/ad-faq-drafts.json
 *  - MICROCMS_API_KEY / MICROCMS_SERVICE_DOMAIN 環境変数
 *
 * slug 自動生成:
 *  drafts には slug がないため、category + displayOrder から決定的に生成
 *  format: faq-{cat-roman}-{displayOrder:02d}
 *  例: faq-seido-01, faq-gijutsu-05, faq-jigyou-10
 *
 * 実行:
 *   $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/post-faq.ts --dry-run
 *   $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/post-faq.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

type Draft = {
  displayOrder: number;
  category: string;
  question: string;
  answer: string;
  sourceUrl?: string;
  relatedGlossary?: string;
  relatedExplainer?: string;
};

const CATEGORY_SLUG: Record<string, string> = {
  制度: 'seido',
  技術: 'gijutsu',
  事業: 'jigyou',
  補助金: 'hojokin',
  その他: 'sonota',
};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/faq`;

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

function buildSlug(draft: Draft): string {
  const cat = CATEGORY_SLUG[draft.category] || 'misc';
  const order = String(draft.displayOrder).padStart(2, '0');
  return `faq-${cat}-${order}`;
}

async function postOne(draft: Draft): Promise<'ok' | 'skip' | 'err'> {
  const slug = buildSlug(draft);
  try {
    const existing = await findBySlug(slug);
    if (existing) {
      console.log(`  [skip] ${slug} — already exists (id=${existing.id})`);
      return 'skip';
    }
    const body: Record<string, unknown> = {
      slug,
      question: draft.question,
      answer: draft.answer,
      category: [draft.category],
      displayOrder: draft.displayOrder,
    };
    if (draft.sourceUrl) body.sourceUrl = draft.sourceUrl;
    if (draft.relatedGlossary) body.relatedGlossary = draft.relatedGlossary;
    if (draft.relatedExplainer) body.relatedExplainer = draft.relatedExplainer;

    if (DRY_RUN) {
      console.log(
        `  [dry-run] POST ${slug}: [${draft.category}#${draft.displayOrder}] ${draft.question.slice(0, 50)}`
      );
      return 'ok';
    }
    const result = (await api('POST', BASE, body)) as { id: string };
    console.log(`  [ok] ${slug} — created id=${result.id}`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] ${slug}: ${(e as Error).message}`);
    return 'err';
  }
}

async function main(): Promise<void> {
  const jsonPath = path.join(process.cwd(), 'scripts', 'ad-faq-drafts.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`ERROR: input not found: ${jsonPath}`);
    process.exit(1);
  }
  const text = fs.readFileSync(jsonPath, 'utf8');
  const parsed = JSON.parse(text) as { items: Draft[] };

  console.log(
    `[post-faq] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}, ${parsed.items.length} items`
  );

  // duplicate slug pre-check
  const slugs = parsed.items.map(buildSlug);
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
