#!/usr/bin/env tsx
/**
 * scripts/precompute-glossary-dup-report.ts
 * 依頼: Glossary P1 Stage1 — 重複候補レポート生成（READ ONLY）
 *
 * 出力: docs/glossary-dup-candidates.json + docs/glossary-dup-candidates.md
 *
 * 検出ルール:
 *   A. slug suffix pattern: `slug` と `slug-detail` の共存
 *   B. term 正規化重複: term 文字列の正規化後が一致する複数エントリ
 *   C. english 正規化重複: english フィールドの正規化後が一致する複数エントリ
 *
 * 出力には 301 実装に必要な情報（slug, term, canonical 候補）のみ含む。
 * 本スクリプトは microCMS・ファイル・DB への書き込みを一切行わない。
 *
 * 鉄則#3: getAllGlossary を 1回のみ実行（memoization 済み）
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAllGlossary } from '../src/lib/microcms';

// ──────────────────────────────────────
// 正規化ユーティリティ
// ──────────────────────────────────────

/** 表示名の正規化（重複キー生成用）: NFKC + 小文字 + 記号除去 + 空白統一 */
function normalizeTerm(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\s　]+/g, '')     // 全角半角スペース除去
    .replace(/[-－‐ー〜～]/g, '')   // ダッシュ/長音類除去
    .replace(/[（(][^）)]*[）)]/g, '') // 括弧注記除去
    .trim();
}

/** slug から `-detail` サフィックスを除去 */
function stripDetailSuffix(slug: string): string {
  return slug.replace(/-detail$/, '');
}

/** `-detail` サフィックスを持つかどうか */
function hasDetailSuffix(slug: string): boolean {
  return slug.endsWith('-detail');
}

// ──────────────────────────────────────
// 型定義
// ──────────────────────────────────────

type GlossaryEntry = {
  slug: string;
  term: string;
  english?: string;
  category: string[];
  subcategory?: string;
  shortDef: string;
  detail?: string;
  relatedTerms?: string;
  updatedAt: string;
};

type DupGroup = {
  rule: 'A_slug_detail' | 'B_term_norm' | 'C_english_norm';
  normalizedKey: string;
  entries: Pick<GlossaryEntry, 'slug' | 'term' | 'english' | 'category' | 'updatedAt'>[];
  /** 推奨 canonical スラッグ（-detail なし側、または更新日最新） */
  canonicalSlug: string;
  /** 301 対象スラッグ（canonical 以外） */
  redirectSlugs: string[];
  /** 信頼度（A: high / B: medium / C: medium） */
  confidence: 'high' | 'medium' | 'low';
  note: string;
};

// ──────────────────────────────────────
// メイン
// ──────────────────────────────────────

async function main() {
  console.log('[precompute-glossary-dup-report] 開始...');

  // 1. 全件取得（1回のみ）
  const all = await getAllGlossary();
  console.log(`[precompute-glossary-dup-report] 全 ${all.length} 件取得`);

  const dupGroups: DupGroup[] = [];

  // ──────────────────────────────────────
  // Rule A: slug-detail パターン
  // ──────────────────────────────────────
  const slugSet = new Set(all.map((e) => e.slug));

  for (const entry of all) {
    if (!hasDetailSuffix(entry.slug)) continue;
    const base = stripDetailSuffix(entry.slug);
    if (!slugSet.has(base)) continue;

    const baseEntry = all.find((e) => e.slug === base)!;
    const detailEntry = entry;

    // 既に登録済みのグループとの重複チェック
    const alreadyRegistered = dupGroups.some(
      (g) => g.rule === 'A_slug_detail' && g.redirectSlugs.includes(detailEntry.slug)
    );
    if (alreadyRegistered) continue;

    dupGroups.push({
      rule: 'A_slug_detail',
      normalizedKey: base,
      entries: [baseEntry, detailEntry].map((e) => ({
        slug: e.slug,
        term: e.term,
        english: e.english,
        category: e.category,
        updatedAt: e.updatedAt,
      })),
      canonicalSlug: base,
      redirectSlugs: [detailEntry.slug],
      confidence: 'high',
      note: `"${detailEntry.slug}" は "-detail" サフィックスを持ち、"${base}" が canonical 候補`,
    });
  }

  // ──────────────────────────────────────
  // Rule B: term 正規化重複
  // ──────────────────────────────────────
  const termNormMap = new Map<string, GlossaryEntry[]>();
  for (const entry of all) {
    const key = normalizeTerm(entry.term);
    if (!key) continue;
    if (!termNormMap.has(key)) termNormMap.set(key, []);
    termNormMap.get(key)!.push(entry);
  }

  for (const [key, entries] of termNormMap) {
    if (entries.length < 2) continue;

    // 既に Rule A で検出済みのグループとの重複を除外
    const ruleASlugs = new Set(
      dupGroups
        .filter((g) => g.rule === 'A_slug_detail')
        .flatMap((g) => [...g.redirectSlugs, g.canonicalSlug])
    );
    const nonAEntries = entries.filter((e) => !ruleASlugs.has(e.slug));
    if (nonAEntries.length < 2) continue;

    // canonical: 更新日最新 or -detail なし優先
    const sorted = [...entries].sort((a, b) => {
      const aDetail = hasDetailSuffix(a.slug) ? 1 : 0;
      const bDetail = hasDetailSuffix(b.slug) ? 1 : 0;
      if (aDetail !== bDetail) return aDetail - bDetail; // -detail 後回し
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    const canonical = sorted[0];
    const redirects = sorted.slice(1);

    dupGroups.push({
      rule: 'B_term_norm',
      normalizedKey: key,
      entries: entries.map((e) => ({
        slug: e.slug,
        term: e.term,
        english: e.english,
        category: e.category,
        updatedAt: e.updatedAt,
      })),
      canonicalSlug: canonical.slug,
      redirectSlugs: redirects.map((e) => e.slug),
      confidence: 'medium',
      note: `term 正規化後 "${key}" が ${entries.length} エントリで一致`,
    });
  }

  // ──────────────────────────────────────
  // Rule C: english 正規化重複
  // ──────────────────────────────────────
  const englishNormMap = new Map<string, GlossaryEntry[]>();
  for (const entry of all) {
    if (!entry.english) continue;
    const key = normalizeTerm(entry.english);
    if (key.length < 3) continue; // 短すぎる英語は除外（誤検知防止）
    if (!englishNormMap.has(key)) englishNormMap.set(key, []);
    englishNormMap.get(key)!.push(entry);
  }

  // Rule A/B 既検出スラッグ
  const alreadyDetectedSlugs = new Set(
    dupGroups.flatMap((g) => [...g.redirectSlugs, g.canonicalSlug])
  );

  for (const [key, entries] of englishNormMap) {
    if (entries.length < 2) continue;

    const newEntries = entries.filter((e) => !alreadyDetectedSlugs.has(e.slug));
    if (newEntries.length < 2) continue;

    // 既に同じ slug セットが B で登録されていないか確認
    const slugKey = entries.map((e) => e.slug).sort().join('|');
    const alreadyInB = dupGroups.some(
      (g) => g.rule === 'B_term_norm' && g.entries.map((e) => e.slug).sort().join('|') === slugKey
    );
    if (alreadyInB) continue;

    const sorted = [...entries].sort((a, b) => {
      const aDetail = hasDetailSuffix(a.slug) ? 1 : 0;
      const bDetail = hasDetailSuffix(b.slug) ? 1 : 0;
      if (aDetail !== bDetail) return aDetail - bDetail;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
    const canonical = sorted[0];
    const redirects = sorted.slice(1);

    dupGroups.push({
      rule: 'C_english_norm',
      normalizedKey: key,
      entries: entries.map((e) => ({
        slug: e.slug,
        term: e.term,
        english: e.english,
        category: e.category,
        updatedAt: e.updatedAt,
      })),
      canonicalSlug: canonical.slug,
      redirectSlugs: redirects.map((e) => e.slug),
      confidence: 'medium',
      note: `english 正規化後 "${key}" が ${entries.length} エントリで一致`,
    });
  }

  // ──────────────────────────────────────
  // ソート: A (high) → B/C (medium) → confidence 順
  // ──────────────────────────────────────
  dupGroups.sort((a, b) => {
    const order = { high: 0, medium: 1, low: 2 };
    if (order[a.confidence] !== order[b.confidence]) {
      return order[a.confidence] - order[b.confidence];
    }
    return a.rule.localeCompare(b.rule);
  });

  // ──────────────────────────────────────
  // サマリー
  // ──────────────────────────────────────
  const summary = {
    generatedAt: new Date().toISOString(),
    totalGlossaryEntries: all.length,
    totalDupGroups: dupGroups.length,
    byRule: {
      A_slug_detail: dupGroups.filter((g) => g.rule === 'A_slug_detail').length,
      B_term_norm: dupGroups.filter((g) => g.rule === 'B_term_norm').length,
      C_english_norm: dupGroups.filter((g) => g.rule === 'C_english_norm').length,
    },
    byConfidence: {
      high: dupGroups.filter((g) => g.confidence === 'high').length,
      medium: dupGroups.filter((g) => g.confidence === 'medium').length,
      low: dupGroups.filter((g) => g.confidence === 'low').length,
    },
    totalRedirectCandidates: dupGroups.reduce((acc, g) => acc + g.redirectSlugs.length, 0),
  };

  // ──────────────────────────────────────
  // JSON 出力
  // ──────────────────────────────────────
  const outDir = path.resolve(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonOut = { summary, groups: dupGroups };
  const jsonPath = path.join(outDir, 'glossary-dup-candidates.json');
  fs.writeFileSync(jsonPath, JSON.stringify(jsonOut, null, 2), 'utf-8');
  console.log(`[precompute-glossary-dup-report] JSON → ${jsonPath}`);

  // ──────────────────────────────────────
  // Markdown 出力（ユウ監査用）
  // ──────────────────────────────────────
  const lines: string[] = [];
  lines.push('# Glossary 重複候補レポート（P1 Stage1）');
  lines.push('');
  lines.push('> **READ ONLY レポート。301リダイレクト・削除は Stage2（ユウ監査後）に実施。**');
  lines.push('');
  lines.push('## サマリー');
  lines.push('');
  lines.push(`| 項目 | 値 |`);
  lines.push(`|------|-----|`);
  lines.push(`| 全エントリ数 | ${summary.totalGlossaryEntries} |`);
  lines.push(`| 重複グループ数 | ${summary.totalDupGroups} |`);
  lines.push(`| Rule A（slug-detail） | ${summary.byRule.A_slug_detail} |`);
  lines.push(`| Rule B（term正規化） | ${summary.byRule.B_term_norm} |`);
  lines.push(`| Rule C（english正規化） | ${summary.byRule.C_english_norm} |`);
  lines.push(`| 301候補総数 | ${summary.totalRedirectCandidates} |`);
  lines.push(`| 生成日時 | ${summary.generatedAt} |`);
  lines.push('');
  lines.push('## 重複グループ詳細');
  lines.push('');
  lines.push('各グループの確認事項:');
  lines.push('- `canonicalSlug` が正しい canonical か確認');
  lines.push('- `redirectSlugs` の内容が duplicate／旧スタブか確認');
  lines.push('- 問題なければ Stage2 で `middleware.ts` に 301 追加');
  lines.push('');

  for (const [i, g] of dupGroups.entries()) {
    const confidenceEmoji = g.confidence === 'high' ? '🔴' : g.confidence === 'medium' ? '🟠' : '🟡';
    lines.push(`### ${i + 1}. ${confidenceEmoji} [${g.rule}] ${g.canonicalSlug}`);
    lines.push('');
    lines.push(`**信頼度**: ${g.confidence} | **ルール**: ${g.rule}`);
    lines.push('');
    lines.push(`> ${g.note}`);
    lines.push('');
    lines.push('| slug | term | english | category | 更新日 |');
    lines.push('|------|------|---------|----------|--------|');
    for (const e of g.entries) {
      const isCanon = e.slug === g.canonicalSlug;
      const isRedirect = g.redirectSlugs.includes(e.slug);
      const marker = isCanon ? '✅ canonical' : isRedirect ? '🔁 301候補' : '';
      lines.push(
        `| \`${e.slug}\` ${marker} | ${e.term} | ${e.english ?? '—'} | ${e.category.join('/')} | ${e.updatedAt.slice(0, 10)} |`
      );
    }
    lines.push('');
    lines.push(`**301実装メモ**: \`GLOSSARY_301[\'/glossary/${g.redirectSlugs[0]}\'] = \'/glossary/${g.canonicalSlug}\'\``);
    if (g.redirectSlugs.length > 1) {
      for (const slug of g.redirectSlugs.slice(1)) {
        lines.push(`&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;\`GLOSSARY_301[\'/glossary/${slug}\'] = \'/glossary/${g.canonicalSlug}\'\``);
      }
    }
    lines.push('');
    lines.push('---');
    lines.push('');
  }

  const mdPath = path.join(outDir, 'glossary-dup-candidates.md');
  fs.writeFileSync(mdPath, lines.join('\n'), 'utf-8');
  console.log(`[precompute-glossary-dup-report] Markdown → ${mdPath}`);

  // ──────────────────────────────────────
  // コンソール出力（サマリー）
  // ──────────────────────────────────────
  console.log('\n=== サマリー ===');
  console.log(`  全エントリ数      : ${summary.totalGlossaryEntries}`);
  console.log(`  重複グループ数    : ${summary.totalDupGroups}`);
  console.log(`    Rule A (slug-detail): ${summary.byRule.A_slug_detail}`);
  console.log(`    Rule B (term正規化) : ${summary.byRule.B_term_norm}`);
  console.log(`    Rule C (english正規): ${summary.byRule.C_english_norm}`);
  console.log(`  301候補総数       : ${summary.totalRedirectCandidates}`);

  console.log('\n=== Rule A 重複 (slug-detail) ===');
  for (const g of dupGroups.filter((x) => x.rule === 'A_slug_detail')) {
    console.log(`  301: /glossary/${g.redirectSlugs[0]} → /glossary/${g.canonicalSlug}`);
  }

  console.log('\n=== Rule B 重複 (term正規化) ===');
  for (const g of dupGroups.filter((x) => x.rule === 'B_term_norm')) {
    console.log(`  canonical: ${g.canonicalSlug}`);
    console.log(`    terms: ${g.entries.map((e) => `"${e.term}" (${e.slug})`).join(', ')}`);
  }

  if (dupGroups.filter((x) => x.rule === 'C_english_norm').length > 0) {
    console.log('\n=== Rule C 重複 (english正規化) ===');
    for (const g of dupGroups.filter((x) => x.rule === 'C_english_norm')) {
      console.log(`  canonical: ${g.canonicalSlug}`);
      console.log(`    english: ${g.entries.map((e) => `"${e.english}" (${e.slug})`).join(', ')}`);
    }
  }
}

main().catch((err) => {
  console.error('[precompute-glossary-dup-report] エラー:', err);
  process.exit(1);
});
