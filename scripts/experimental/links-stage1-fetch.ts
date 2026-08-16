/**
 * scripts/experimental/links-stage1-fetch.ts — /links ステージ1 調査（読み取り専用・microCMS書き込み0）
 * getAllLinks() で全 links を1スキャン取得し tmp/links-raw.json に書き出すのみ。分析は Python 側。
 */
export {};
import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAllLinks } from '../../src/lib/microcms';

async function main(): Promise<void> {
  const links = await getAllLinks();
  const dir = path.join(process.cwd(), 'tmp');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'links-raw.json'), JSON.stringify(links, null, 2));
  console.log(`fetched ${links.length} links -> tmp/links-raw.json`);
}
main().catch((e) => { console.error('ERROR:', e); process.exit(1); });
