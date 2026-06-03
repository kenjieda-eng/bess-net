/**
 * scripts/build-legacy-news-allowlist.ts
 *
 * microCMS news から news-2026-NNN-* 形式の現存スラッグを抽出し
 * src/data/legacy-news-allowlist.json に書き出す。
 *
 * 用途: src/middleware.ts が allowlist を参照して 410 Gone を返す際に
 *       現存する旧形式スラッグ（約24件）を 410 対象から除外するため。
 *
 * 実行: npx tsx scripts/build-legacy-news-allowlist.ts
 *       (prebuild から自動実行)
 */

import { getAllNews } from '../src/lib/microcms';
import * as fs from 'node:fs';
import * as path from 'node:path';

(async () => {
  const all = await getAllNews();
  const legacy = all
    .map((n: { slug: string }) => n.slug)
    .filter((s: string) => /^news-2026-\d+-/.test(s))
    .sort();
  const outPath = path.join(process.cwd(), 'src', 'data', 'legacy-news-allowlist.json');
  fs.writeFileSync(outPath, JSON.stringify(legacy, null, 2));
  console.log('現存legacyスラッグ:', legacy.length, '件');
  if (legacy.length > 0) {
    console.log('サンプル:', legacy.slice(0, 5));
  }
})();
