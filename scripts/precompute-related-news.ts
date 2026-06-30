#!/usr/bin/env tsx
/**
 * scripts/precompute-related-news.ts
 *
 * 「関連ニュース」を build 時に事前計算して JSON 化し、runtime の microCMS `q`（全文検索）を 0 にする。
 * （microCMS CS 照会対応・第2弾。第1弾 540ba29 で projects への q は撤去済。本スクリプトで news への q を全廃）
 *
 * 背景の q（撤去対象）:
 *   - related-cards.ts searchRelatedNews … getRelatedEntities の関連news。projects/[slug] が
 *     q=baseName(=operator||name) で news 全文検索（wantTypes に 'news' を持つのは projects のみ）。
 *   - microcms.ts getRelatedNewsForSubstation … grid/[slug] が q=prefecture で news 全文検索。
 *
 * 方式（鉄則#3/#98・glossary-faq-index / operators-detail と同方式）:
 *   build 時に getAllNews()＋getAllProjects() を各 1 回 bulk 取得（per-page の q はしない）し、
 *   メモリ内で「事業者名/都道府県を news の title/lead に含むか」で照合 → 上位 N 件を JSON 化。
 *   出力 src/lib/generated/related-news-map.json: { "project:<slug>":[NewsRef…], "pref:<base>":[NewsRef…] }
 *
 *   ※ news/explainer 詳細ページは関連newsを表示しない（wantTypes に 'news' なし）ため、
 *     それらの base キーは生成しない（dead data 回避）。将来 wantTypes に 'news' を足す場合に拡張する。
 *
 * 実行: prebuild。手動は MICROCMS_API_KEY=... MICROCMS_SERVICE_DOMAIN=bess-net npx tsx scripts/precompute-related-news.ts
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAllNews, getAllProjects, type News } from '../src/lib/microcms';

type NewsRef = { id: string; slug: string; title: string; publishedAt: string; category: string[] };

const PER_KEY_LIMIT = 8; // 消費側（projects news=3 / grid=5）が slice する。余裕を持って保存。

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
];

/** 都道府県の照合用ベース形（北海道はそのまま・東京都→東京・京都府→京都・群馬県→群馬）。runtime 側と一致させる。 */
function prefBase(p: string): string {
  if (p === '北海道') return '北海道';
  return p.replace(/(都|府|県)$/, '');
}

/** 事業者名から法人格サフィックスを除去（operators-detail と同方式） */
function shortName(name: string): string {
  const s = name.replace(/(株式会社|合同会社|有限会社|（株）|\(株\)|ホールディングス)/g, '').trim();
  return s.length >= 2 ? s : name;
}

function toRef(n: News): NewsRef {
  return { id: n.id, slug: n.slug, title: n.title, publishedAt: n.publishedAt ?? '', category: n.category ?? [] };
}

/**
 * needle を news の title(×3)/lead(×1) に含むものを score 降順（同 score は recency 維持）で上位 limit 件。
 * news は getAllNews が -publishedAt 済みのため、安定ソートで新しい順が保たれる。
 */
function matchNews(news: News[], needle: string, limit: number): NewsRef[] {
  if (!needle || needle.length < 2) return [];
  const scored: { n: News; score: number }[] = [];
  for (const n of news) {
    let score = 0;
    if ((n.title || '').includes(needle)) score += 3;
    if ((n.lead || '').includes(needle)) score += 1;
    if (score > 0) scored.push({ n, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => toRef(s.n));
}

async function main(): Promise<void> {
  console.log('[precompute-related-news] microCMS bulk 取得（getAllNews + getAllProjects 各1回）...');
  const t0 = Date.now();
  const [news, projects] = await Promise.all([getAllNews(), getAllProjects()]);
  console.log(`  news=${news.length} projects=${projects.length} (${Date.now() - t0}ms)`);

  const t1 = Date.now();
  const map: Record<string, NewsRef[]> = {};

  // project base: query = operator || name（projects/[slug] の baseName と同等）
  let projHit = 0;
  for (const p of projects) {
    const q = (p.operator || p.name || '').trim();
    const refs = matchNews(news, shortName(q), PER_KEY_LIMIT);
    if (refs.length) {
      map[`project:${p.slug}`] = refs;
      projHit += 1;
    }
  }

  // prefecture base: query = prefecture（grid/[slug] の sub.prefecture と同等）
  let prefHit = 0;
  for (const pref of PREFECTURES) {
    const base = prefBase(pref);
    const refs = matchNews(news, base, PER_KEY_LIMIT);
    if (refs.length) {
      map[`pref:${base}`] = refs;
      prefHit += 1;
    }
  }
  console.log(`  → project keys=${projHit}/${projects.length}, pref keys=${prefHit}/${PREFECTURES.length} (${Date.now() - t1}ms)`);

  const outDir = path.join(process.cwd(), 'src', 'lib', 'generated');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'related-news-map.json');
  const json = JSON.stringify(map, null, 2);
  fs.writeFileSync(outPath, json);
  const sizeKB = (Buffer.byteLength(json, 'utf8') / 1024).toFixed(1);

  console.log(`[precompute-related-news] 書き出し完了: ${outPath}`);
  console.log(`  keys=${Object.keys(map).length} (project=${projHit} + pref=${prefHit}) / size=${sizeKB} KB`);
  // サンプル
  const sample = Object.entries(map).slice(0, 6);
  for (const [k, v] of sample) {
    console.log(`    ${k} (${v.length}件): ${v.slice(0, 2).map((r) => r.title.slice(0, 24)).join(' / ')}`);
  }
}

main().catch((err) => {
  console.error('[precompute-related-news] ERROR:', err);
  process.exit(1);
});
