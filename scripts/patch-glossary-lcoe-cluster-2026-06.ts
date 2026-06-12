/**
 * scripts/patch-glossary-lcoe-cluster-2026-06.ts
 *
 * LCOE クラスタ relatedTerms 修正（2026-06-12）
 *
 * 原因: relatedTerms に短縮名（LCOS/充放電効率/卸電力市場）を使っていたが、
 *       関連用語解決は「term 完全一致」のため脱落。実term文字列に修正。
 *
 * 対象:
 *   lcoe               (x0u677fd6z) relatedTerms 3件修正
 *   lcos               (2u02da0ob2n) relatedTerms 3件修正
 *   round-trip-efficiency (xthnyb0fwwl) relatedTerms 3件付与（任意推奨）
 *   wholesale-electricity-market → 健全（変更なし）
 *
 * 冪等設計（落とし穴#91）: GET で現在値と比較し、一致なら skip。
 * 実行: npx tsx scripts/patch-glossary-lcoe-cluster-2026-06.ts [--dry-run]
 */

import {} from 'node:process';

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');

if (!SERVICE_DOMAIN || !API_KEY) {
  console.error('ERROR: MICROCMS_SERVICE_DOMAIN and MICROCMS_API_KEY required');
  process.exit(1);
}

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/glossary`;

async function apiFetch(method: 'GET' | 'PATCH', url: string, body?: unknown): Promise<unknown> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const resp = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`${method} ${url} → HTTP ${resp.status}: ${text.slice(0, 400)}`);
  }
  return resp.json();
}

const PATCHES = [
  {
    id: 'x0u677fd6z',
    slug: 'lcoe',
    relatedTerms: 'LCOS（均等化蓄電原価）,ラウンドトリップ効率,卸電力市場（JEPX）',
  },
  {
    id: '2u02da0ob2n',
    slug: 'lcos',
    relatedTerms: 'LCOE（均等化発電原価）,ラウンドトリップ効率,サイクル寿命',
  },
  {
    id: 'xthnyb0fwwl',
    slug: 'round-trip-efficiency',
    relatedTerms: 'LCOE（均等化発電原価）,LCOS（均等化蓄電原価）,サイクル寿命',
  },
];

async function patchEntry(target: { id: string; slug: string; relatedTerms: string }): Promise<'ok' | 'skip' | 'err'> {
  try {
    const entry = (await apiFetch('GET', `${BASE}/${target.id}?fields=id,slug,relatedTerms`)) as {
      id: string;
      slug: string;
      relatedTerms: string;
    };

    if (entry.relatedTerms === target.relatedTerms) {
      console.log(`  [skip] ${target.slug} — already up to date`);
      return 'skip';
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] PATCH ${target.slug}`);
      console.log(`    before: ${repr(entry.relatedTerms)}`);
      console.log(`    after:  ${repr(target.relatedTerms)}`);
      return 'ok';
    }

    await apiFetch('PATCH', `${BASE}/${target.id}`, { relatedTerms: target.relatedTerms });
    console.log(`  [ok] ${target.slug} patched`);
    console.log(`    before: ${repr(entry.relatedTerms)}`);
    console.log(`    after:  ${repr(target.relatedTerms)}`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] ${target.slug}: ${(e as Error).message}`);
    return 'err';
  }
}

function repr(s: string | undefined): string {
  return s ? `'${s}'` : '(empty)';
}

async function main(): Promise<void> {
  console.log(`[patch-glossary-lcoe-cluster-2026-06] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);

  let ok = 0, skip = 0, err = 0;
  for (const target of PATCHES) {
    const r = await patchEntry(target);
    if (r === 'ok') ok++;
    else if (r === 'skip') skip++;
    else err++;
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  console.log(`\n[done] ok=${ok}  skip=${skip}  err=${err}`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
