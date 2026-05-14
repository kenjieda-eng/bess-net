#!/usr/bin/env tsx
/**
 * scripts/build-glossary-faq-index.ts
 *
 * 依頼 Phase 2 (関連 FAQ 恒久対策): build 時 事前計算スクリプト
 *
 * 目的:
 *  - /glossary/[slug] の関連 FAQ セクションを SSR で faq endpoint への
 *    microCMS リクエスト ゼロ で実現
 *  - 落とし穴 #98 (大規模動的ルート × クローラ集中アクセス) を完全解決
 *
 * 処理:
 *  1. microCMS から glossary 全件 + faq 全件 を取得 (build 中 各 1 回のみ)
 *  2. メモリ内でマッチング (microCMS 追加リクエスト ゼロ)
 *  3. src/lib/generated/glossary-faq-index.json に出力
 *
 * 既存落とし穴対策の継承:
 *  - #95 dedupe + 短語(<3)除外
 *  - #96 english `/` 併記 split
 *  - #97 question only (関連性判定は question フィールド優先)
 *  - #98 microCMS リクエスト集中 → build 時 1 回のみ
 *
 * 実行:
 *  MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *    npx tsx scripts/build-glossary-faq-index.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAllGlossary, getAllFaq } from '../src/lib/microcms';

interface FaqRef {
  id: string;
  slug: string;
  question: string;
  category?: string;
}

// 用語が question/answer のどれに含まれるかで関連度判定
// (落とし穴 #97 で SSR では question only だったが、build 時は cost なしなので
//  answer も含めて精度向上、ただし fallback として weighted)
function extractKeywords(g: {
  term: string;
  english?: string;
  reading?: string;
}): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  // term は分割しない (固有名詞性高い)
  if (g.term) {
    const t = g.term.trim();
    if (t.length >= 3 && t.length <= 40 && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }

  // english は「/」「,」「、」併記分割 (落とし穴 #96)
  if (g.english) {
    for (const raw of g.english.split(/[\/,、]/)) {
      const t = raw.trim();
      if (t.length < 3 || t.length > 40) continue;
      if (seen.has(t)) continue;
      seen.add(t);
      out.push(t);
    }
  }

  // reading は通常マッチに使わない (kana 表記が question/answer に出ない)
  // ※ ただし建設業界用語等で reading だけがマッチするケースは将来検討

  // 最大 5 keyword (build 時なので gentle、SSR より緩い制限)
  return out.slice(0, 5);
}

// FAQ から keyword に hit するものを抽出 (memory 内マッチング、microCMS リクエストなし)
function findMatchingFaqs(
  keywords: string[],
  faqs: ReadonlyArray<{
    id: string;
    slug: string;
    question: string;
    answer?: string;
    category?: string[] | string;
  }>,
  limit = 5
): FaqRef[] {
  if (keywords.length === 0) return [];

  // 各 FAQ について match score を計算
  const scored: { faq: (typeof faqs)[number]; score: number }[] = [];
  for (const f of faqs) {
    let score = 0;
    for (const kw of keywords) {
      // question 一致 = high weight (落とし穴 #97 同様の優先)
      if (f.question && f.question.includes(kw)) score += 3;
      // answer 一致 = lower weight (補助)
      if (f.answer && f.answer.includes(kw)) score += 1;
    }
    if (score > 0) scored.push({ faq: f, score });
  }

  // score 降順 + 上位 limit 件
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map(({ faq: f }) => ({
    id: f.id,
    slug: f.slug ?? f.id,
    question: f.question,
    category: Array.isArray(f.category) ? f.category[0] : f.category,
  }));
}

async function main(): Promise<void> {
  console.log('[build-glossary-faq-index] microCMS から glossary + faq 取得...');
  const t0 = Date.now();

  // microCMS への呼び出しはここでのみ実施 (各 1 回、合計 2 回)
  const [glossary, faqs] = await Promise.all([
    getAllGlossary(),
    getAllFaq(),
  ]);
  const tFetch = Date.now() - t0;
  console.log(
    `  glossary: ${glossary.length} entries, faqs: ${faqs.length} entries (${tFetch}ms)`
  );

  console.log('[build-glossary-faq-index] メモリ内マッチング (microCMS リクエストなし)...');
  const t1 = Date.now();
  const index: Record<string, FaqRef[]> = {};
  let totalMappings = 0;
  let slugsWithFaqs = 0;

  for (const g of glossary) {
    const keywords = extractKeywords(g);
    const matched = findMatchingFaqs(keywords, faqs, 5);
    index[g.slug] = matched;
    if (matched.length > 0) slugsWithFaqs += 1;
    totalMappings += matched.length;
  }
  const tMatch = Date.now() - t1;
  console.log(
    `  → ${totalMappings} mappings for ${slugsWithFaqs}/${glossary.length} glossary entries (${tMatch}ms)`
  );

  // 出力
  const outDir = path.join(process.cwd(), 'src', 'lib', 'generated');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'glossary-faq-index.json');
  const outJson = JSON.stringify(index, null, 2);
  fs.writeFileSync(outPath, outJson);
  const sizeKB = (Buffer.byteLength(outJson, 'utf8') / 1024).toFixed(1);

  console.log(`[build-glossary-faq-index] 書き出し完了`);
  console.log(`  path: ${outPath}`);
  console.log(`  size: ${sizeKB} KB`);
  console.log(`  total mappings: ${totalMappings}`);
  console.log(
    `  coverage: ${slugsWithFaqs}/${glossary.length} (${((slugsWithFaqs / glossary.length) * 100).toFixed(1)}%)`
  );

  // 上位 10 関連 FAQ サンプル表示
  const sortedSlugs = Object.entries(index)
    .filter(([, v]) => v.length > 0)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);
  console.log(`\n  Top 10 glossary entries by related FAQ count:`);
  for (const [slug, faqs] of sortedSlugs) {
    const titles = faqs.map((f) => f.question.slice(0, 30)).join(' / ');
    console.log(`    /${slug} (${faqs.length}件): ${titles}`);
  }
}

main().catch((err) => {
  console.error('[build-glossary-faq-index] ERROR:', err);
  process.exit(1);
});
