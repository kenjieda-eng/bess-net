/**
 * scripts/apply-af-ag.ts
 *
 * 依頼AF + AG Phase B: T 40社 body 拡充 (PATCH) + AG 63社 新規投入 (POST)
 *
 * ## 入力
 *  - scripts/af-t40-drafts.json (T 40社 PATCH 用、既存 operators の body 拡充)
 *  - scripts/ag-adopt63-drafts.json (AG 63社 POST 用、新規 operators 作成)
 *
 * ## 動作
 *  1. AF: 既存 slug を GET → 既存 body の 4-section を取得（取扱製品・蓄電所事業との関係 が空なら拡充）
 *         T 40社の draft データから新 body を構築 → PATCH
 *  2. AG: 新規 slug で POST → operators 作成
 *
 * ## body 構造（osaka-gas 形式）
 *   <h3>会社概要</h3><ul>...</ul>
 *   <h3>取扱製品・サービス</h3><ul>各product</ul>
 *   <h3>蓄電所事業との関係</h3><p>battery_relation</p>
 *   <h3>出典</h3><ul>公式サイト + PR TIMES URL</ul>
 *
 * ## 実行
 *  $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *    npx tsx scripts/apply-af-ag.ts --dry-run
 *  $ MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *    npx tsx scripts/apply-af-ag.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

type DraftItem = {
  slug: string;
  name: string;
  company_id?: number | null;
  category?: string[];
  products: string[];
  battery_relation: string;
  official_url?: string;
  prtimes_url?: string;
};

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
const ONLY_AF = process.argv.includes('--af-only');
const ONLY_AG = process.argv.includes('--ag-only');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/operators`;

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

async function findBySlug(
  slug: string
): Promise<{ id: string; name: string; body?: string } | null> {
  const url = `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&fields=id,name,body&limit=1`;
  const data = (await api('GET', url)) as { contents: Array<{ id: string; name: string; body?: string }> };
  return data.contents[0] ?? null;
}

/** osaka-gas 形式の body HTML を生成 */
function buildBodyHtml(existingBody: string | undefined, draft: DraftItem): string {
  // For AF (existing): retain 会社概要 from existing body, then add/replace 取扱製品 + 蓄電所事業との関係 + 出典
  // For AG (new): construct full body from scratch
  let companySection = '';
  if (existingBody && existingBody.includes('会社概要')) {
    // Extract existing 会社概要 section up to first other <h3>
    const m = existingBody.match(/<h3[^>]*>会社概要<\/h3>([\s\S]*?)(?=<h3|$)/);
    if (m) {
      companySection = `<h3>会社概要</h3>${m[1]}`;
    }
  }
  if (!companySection) {
    // Build minimal 会社概要 from draft
    const items: string[] = [];
    if (draft.official_url) items.push(`<li>公式サイト: <a href="${draft.official_url}" target="_blank" rel="noopener noreferrer">${draft.official_url}</a></li>`);
    if (draft.prtimes_url) items.push(`<li>PR TIMES プロフィール: <a href="${draft.prtimes_url}" target="_blank" rel="noopener noreferrer">${draft.prtimes_url}</a></li>`);
    companySection = `<h3>会社概要</h3><ul>${items.join('')}</ul>`;
  }

  // Products section
  const productsHtml = `<h3>取扱製品・サービス</h3><ul>${draft.products.map((p) => `<li>${p}</li>`).join('')}</ul>`;

  // Battery relation section
  const relationHtml = `<h3>蓄電所事業との関係</h3><p>${draft.battery_relation}</p>`;

  // Sources section
  const sourceItems: string[] = [];
  if (draft.official_url) sourceItems.push(`<li>公式サイト: <a href="${draft.official_url}" target="_blank" rel="noopener noreferrer">${draft.official_url}</a></li>`);
  if (draft.prtimes_url) sourceItems.push(`<li>PR TIMES: <a href="${draft.prtimes_url}" target="_blank" rel="noopener noreferrer">${draft.prtimes_url}</a></li>`);
  const sourcesHtml = `<h3>出典</h3><ul>${sourceItems.join('')}</ul>`;

  return `${companySection}${productsHtml}${relationHtml}${sourcesHtml}`;
}

async function processAFBatch(items: DraftItem[]): Promise<{ ok: number; skip: number; err: number }> {
  let ok = 0, skip = 0, err = 0;
  for (const draft of items) {
    try {
      const existing = await findBySlug(draft.slug);
      if (!existing) {
        console.warn(`  [warn] AF slug "${draft.slug}" not found in microCMS — skip`);
        skip++;
        continue;
      }
      const newBody = buildBodyHtml(existing.body, draft);
      if (existing.body === newBody) {
        console.log(`  [skip] AF ${draft.slug} — body unchanged`);
        skip++;
        continue;
      }
      if (DRY_RUN) {
        console.log(`  [dry-run] PATCH AF ${draft.slug}: body ${(existing.body || '').length} → ${newBody.length}`);
        ok++;
        continue;
      }
      await api('PATCH', `${BASE}/${existing.id}`, { body: newBody });
      console.log(`  [ok] AF ${draft.slug} — body ${(existing.body || '').length} → ${newBody.length}`);
      ok++;
    } catch (e) {
      console.error(`  [err] AF ${draft.slug}: ${(e as Error).message}`);
      err++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return { ok, skip, err };
}

async function processAGBatch(items: DraftItem[]): Promise<{ ok: number; skip: number; err: number }> {
  let ok = 0, skip = 0, err = 0;
  for (const draft of items) {
    try {
      // Check collision
      const existing = await findBySlug(draft.slug);
      if (existing) {
        console.log(`  [skip] AG ${draft.slug} — already exists (id=${existing.id})`);
        skip++;
        continue;
      }
      const newBody = buildBodyHtml(undefined, draft);
      const postBody: Record<string, unknown> = {
        slug: draft.slug,
        name: draft.name,
        category: draft.category || ['その他'],
        description: draft.battery_relation.slice(0, 200),
        bessRelation: draft.battery_relation,
        body: newBody,
      };
      if (draft.official_url) postBody.websiteUrl = draft.official_url;
      if (draft.prtimes_url) postBody.sourceUrl = draft.prtimes_url;

      if (DRY_RUN) {
        console.log(`  [dry-run] POST AG ${draft.slug}: name="${draft.name.slice(0, 30)}" body=${newBody.length}chars`);
        ok++;
        continue;
      }
      const result = (await api('POST', BASE, postBody)) as { id: string };
      console.log(`  [ok] AG ${draft.slug} — created id=${result.id}`);
      ok++;
    } catch (e) {
      console.error(`  [err] AG ${draft.slug}: ${(e as Error).message}`);
      err++;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return { ok, skip, err };
}

async function main(): Promise<void> {
  console.log(`[apply-af-ag] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);

  let afStats = { ok: 0, skip: 0, err: 0 };
  let agStats = { ok: 0, skip: 0, err: 0 };

  if (!ONLY_AG) {
    console.log('\n=== AF: T 40社 PATCH ===');
    const afPath = path.join(process.cwd(), 'scripts', 'af-t40-drafts.json');
    const afData = JSON.parse(fs.readFileSync(afPath, 'utf8')) as { items: DraftItem[] };
    console.log(`  Loaded ${afData.items.length} AF drafts`);
    afStats = await processAFBatch(afData.items);
  }

  if (!ONLY_AF) {
    console.log('\n=== AG: 63社 POST ===');
    const agPath = path.join(process.cwd(), 'scripts', 'ag-adopt63-drafts.json');
    const agData = JSON.parse(fs.readFileSync(agPath, 'utf8')) as { items: DraftItem[] };
    console.log(`  Loaded ${agData.items.length} AG drafts`);
    agStats = await processAGBatch(agData.items);
  }

  console.log(`\n[done]`);
  console.log(`  AF: ok=${afStats.ok}, skip=${afStats.skip}, err=${afStats.err}`);
  console.log(`  AG: ok=${agStats.ok}, skip=${agStats.skip}, err=${agStats.err}`);
  process.exit(afStats.err + agStats.err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
