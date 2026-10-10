#!/usr/bin/env tsx
/**
 * scripts/verify-asset-check-urls.ts — /tools/asset-check の一次 URL の生死（T2 実装便・2026-10-10）
 *
 * ★ネットワークを使うので prebuild には入れない（meti.go.jp・enecho.meti.go.jp などは WAF が 202・本文 0 B を返し、ビルドが不安定になる）。手で回す。
 * 設問の主の一次（http の URL）と「ほかの一次」を取り、HTTP 200 で本文があれば ok。WAF の 202／403（本文 0 B）は「不明」として記録し、落とさない（便 §0）。
 * 警告のみ（exit 0）。--strict で NG（不明を除く）があれば exit 1。
 *
 * 実行: npm run verify:asset-check:urls
 */
import { ASSET_CHECK_QUESTIONS } from '../src/data/asset-check-questions';
export {};

const STRICT = process.argv.includes('--strict');
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const urls = new Map<string, string[]>();
for (const q of ASSET_CHECK_QUESTIONS) {
  for (const href of [q.primary.href, ...q.others.map((o) => o.href)]) {
    if (!href.startsWith('http')) continue;
    urls.set(href, [...(urls.get(href) ?? []), q.id]);
  }
}

async function probe(url: string): Promise<{ status: number; bytes: number }> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 60_000);
      // 本文の先頭だけ読む（大きな PDF を全部落とさない）
      const r = await fetch(url, { headers: { 'User-Agent': UA }, redirect: 'follow', signal: ctrl.signal });
      let bytes = 0;
      const reader = r.body?.getReader();
      if (reader) {
        while (bytes < 4096) {
          const { done, value } = await reader.read();
          if (done) break;
          bytes += value?.length ?? 0;
        }
        await reader.cancel().catch(() => undefined);
      }
      clearTimeout(timer);
      if (r.status === 200 && bytes > 0) return { status: 200, bytes };
      if (attempt === 2) return { status: r.status, bytes };
    } catch {
      if (attempt === 2) return { status: 0, bytes: 0 };
    }
    await sleep(30_000 * (attempt + 1));
  }
  return { status: 0, bytes: 0 };
}

async function main() {
  let ok = 0, unknown = 0;
  const ng: string[] = [];
  for (const [url, ids] of urls) {
    const { status, bytes } = await probe(url);
    if (status === 200) ok++;
    else if ((status === 202 || status === 403) && bytes === 0) {
      unknown++;
      console.log(`[verify:asset-check:urls] 不明（WAF の ${status}・本文 0 B）: ${url}（${[...new Set(ids)].join('・')}）`);
    } else ng.push(`${status} ${url}（${[...new Set(ids)].join('・')}）`);
    await sleep(1500);
  }
  console.log(`[verify:asset-check:urls] URL ${urls.size}・ok ${ok}・不明 ${unknown}・NG ${ng.length}`);
  for (const n of ng) console.warn(`   ★NG ${n}`);
  process.exit(STRICT && ng.length ? 1 : 0);
}
main();
