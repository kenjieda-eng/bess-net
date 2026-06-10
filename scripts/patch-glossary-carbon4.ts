/**
 * scripts/patch-glossary-carbon4.ts
 *
 * 炭素価格クラスタ 5件 PATCH（非破壊、削除なし）
 *
 * 対象:
 *   1. cap-and-trade          : term / reading / category / subcategory / shortDef / detail / relatedTerms 拡充
 *   2. eu-ets (m95dym4r2pz)   : relatedTerms を canonical 実term 完全一致に修正
 *   3. gx-ets (l7uhsnm4gj)    : relatedTerms を canonical 実term 完全一致に修正
 *   4. carbon-pricing (jfxxv28w23i4): relatedTerms を canonical 実term 完全一致に修正
 *   5. carbon-pricing-detail  : term を「カーボンプライシング（旧・統合済）」にリネーム（衝突解消）
 *
 * 使い方: npx tsx scripts/patch-glossary-carbon4.ts [--dry-run]
 *
 * 冪等設計 (落とし穴#91): 同じ内容を再実行しても副作用なし。
 *   - PATCH 前に GET して現在値を確認し、変更不要なら skip。
 *
 * Phase 0 で確認した実 ID / term:
 *   cap-and-trade           id=cap-and-trade    term="Cap and Trade"
 *   eu-ets                  id=m95dym4r2pz      term="EU ETS（欧州排出量取引制度）"
 *   gx-ets                  id=l7uhsnm4gj       term="GX-ETS（日本版排出量取引制度）"
 *   carbon-pricing          id=jfxxv28w23i4     term="カーボンプライシング"
 *   carbon-pricing-detail   id=carbon-pricing-detail  term="カーボンプライシング" → リネーム対象
 *   wholesale-electricity-market  term="卸電力市場（JEPX）"（relatedTerms で使用）
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

async function apiFetch(method: 'GET' | 'POST' | 'PATCH', url: string, body?: unknown): Promise<unknown> {
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

async function getById(id: string): Promise<Record<string, unknown>> {
  return (await apiFetch('GET', `${BASE}/${id}`)) as Record<string, unknown>;
}

async function patchById(id: string, fields: Record<string, unknown>): Promise<void> {
  await apiFetch('PATCH', `${BASE}/${id}`, fields);
}

// ─────────────────────────────────────────────────────────────
// 1. cap-and-trade 拡充
// ─────────────────────────────────────────────────────────────
async function patchCapAndTrade(): Promise<'ok' | 'skip' | 'err'> {
  try {
    const entry = await getById('cap-and-trade');
    const currentTerm = entry.term as string;
    if (currentTerm === 'キャップ・アンド・トレード') {
      console.log('  [skip] cap-and-trade — already patched');
      return 'skip';
    }

    const patch = {
      term: 'キャップ・アンド・トレード',
      reading: 'きゃっぷあんどとれーど',
      english: 'Cap and Trade',
      category: ['市場制度'],
      subcategory: '炭素価格',
      shortDef: '排出量取引の代表的な方式。排出総量の上限（キャップ）を定めて排出枠を配分し、過不足を市場で売買（トレード）させる。EU ETS・GX-ETSが採用。キャップを絞るほど炭素価格が上がる。',
      detail: '<p>キャップ・アンド・トレード（Cap and Trade）は、排出量取引でもっとも広く使われる制度設計です。まず社会全体の排出総量に上限（<strong>キャップ</strong>）を設け、その範囲で排出枠を企業に配分します。排出が枠を超える企業は市場で枠を買い、余った企業は売る（<strong>トレード</strong>）ことで、削減コストの低いところから優先的に削減が進む仕組みです。<a href="/glossary/eu-ets">EU ETS</a>や日本の<a href="/glossary/gx-ets">GX-ETS</a>はこの方式を採用しています。</p><p>枠の配分には、無償で配る「無償割当」と、オークションで買い取らせる「有償割当」があります。キャップを年々絞るほど枠が希少になり炭素価格が上がる──これが<a href="/glossary/carbon-pricing">カーボンプライシング</a>として発電コストに反映され、<a href="/glossary/wholesale-electricity-market">卸電力市場</a>の価格と変動に波及します。火力比率の高い電力システムほどこの影響を受けやすく、系統用蓄電池の裁定価値にも関わってきます。</p>',
      relatedTerms: 'EU ETS（欧州排出量取引制度）,GX-ETS（日本版排出量取引制度）,カーボンプライシング',
    };

    if (DRY_RUN) {
      console.log(`  [dry-run] PATCH cap-and-trade  "${currentTerm}" → "${patch.term}"`);
      return 'ok';
    }
    await patchById('cap-and-trade', patch);
    console.log(`  [ok] cap-and-trade patched: term="${currentTerm}" → "キャップ・アンド・トレード"`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] cap-and-trade: ${(e as Error).message}`);
    return 'err';
  }
}

// ─────────────────────────────────────────────────────────────
// 2-4. 新3語の relatedTerms を canonical 実term で更新
// ─────────────────────────────────────────────────────────────
const RELATED_TERMS_PATCHES: Array<{ id: string; slug: string; relatedTerms: string }> = [
  {
    id: 'm95dym4r2pz',
    slug: 'eu-ets',
    relatedTerms: 'GX-ETS（日本版排出量取引制度）,カーボンプライシング,キャップ・アンド・トレード',
  },
  {
    id: 'l7uhsnm4gj',
    slug: 'gx-ets',
    relatedTerms: 'EU ETS（欧州排出量取引制度）,カーボンプライシング,キャップ・アンド・トレード',
  },
  {
    id: 'jfxxv28w23i4',
    slug: 'carbon-pricing',
    relatedTerms: 'EU ETS（欧州排出量取引制度）,GX-ETS（日本版排出量取引制度）,キャップ・アンド・トレード,卸電力市場（JEPX）',
  },
];

async function patchRelatedTerms(p: typeof RELATED_TERMS_PATCHES[number]): Promise<'ok' | 'skip' | 'err'> {
  try {
    const entry = await getById(p.id);
    const current = (entry.relatedTerms as string) || '';
    if (current === p.relatedTerms) {
      console.log(`  [skip] ${p.slug} — relatedTerms already correct`);
      return 'skip';
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] PATCH ${p.slug} relatedTerms`);
      console.log(`           "${current}" → "${p.relatedTerms}"`);
      return 'ok';
    }
    await patchById(p.id, { relatedTerms: p.relatedTerms });
    console.log(`  [ok] ${p.slug} relatedTerms updated`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] ${p.slug}: ${(e as Error).message}`);
    return 'err';
  }
}

// ─────────────────────────────────────────────────────────────
// 5. carbon-pricing-detail term リネーム（衝突解消）
// ─────────────────────────────────────────────────────────────
const OLD_TERM_COLLISION = 'カーボンプライシング';
const NEW_TERM_RENAMED   = 'カーボンプライシング（旧・統合済）';

async function renameDetailStub(): Promise<'ok' | 'skip' | 'err'> {
  try {
    const entry = await getById('carbon-pricing-detail');
    const currentTerm = entry.term as string;
    if (currentTerm === NEW_TERM_RENAMED) {
      console.log(`  [skip] carbon-pricing-detail — already renamed`);
      return 'skip';
    }
    if (currentTerm !== OLD_TERM_COLLISION) {
      console.log(`  [skip] carbon-pricing-detail — term="${currentTerm}" (no collision, skip)`);
      return 'skip';
    }

    if (DRY_RUN) {
      console.log(`  [dry-run] PATCH carbon-pricing-detail term "${currentTerm}" → "${NEW_TERM_RENAMED}"`);
      return 'ok';
    }
    await patchById('carbon-pricing-detail', { term: NEW_TERM_RENAMED });
    console.log(`  [ok] carbon-pricing-detail renamed: "${currentTerm}" → "${NEW_TERM_RENAMED}"`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] carbon-pricing-detail: ${(e as Error).message}`);
    return 'err';
  }
}

// ─────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(`[patch-glossary-carbon4] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);

  let ok = 0, skip = 0, err = 0;

  const count = (r: 'ok' | 'skip' | 'err') => {
    if (r === 'ok') ok++; else if (r === 'skip') skip++; else err++;
  };

  // 1. cap-and-trade 拡充（Phase 2）
  console.log('[Phase 2] cap-and-trade 拡充');
  count(await patchCapAndTrade());
  await new Promise<void>((resolve) => setTimeout(resolve, 300));

  // 2-4. relatedTerms 修正（Phase 3）
  // ※ cap-and-trade の term が "キャップ・アンド・トレード" になった後に実行
  console.log('[Phase 3] relatedTerms 修正');
  for (const p of RELATED_TERMS_PATCHES) {
    count(await patchRelatedTerms(p));
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  // 5. carbon-pricing-detail リネーム（Phase 4）
  console.log('[Phase 4] carbon-pricing-detail リネーム');
  count(await renameDetailStub());

  console.log(`[done] ok=${ok}  skip=${skip}  err=${err}`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
