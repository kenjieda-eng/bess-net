#!/usr/bin/env tsx
/**
 * scripts/verify-eic-license.ts — 表示中の EIC 系列のライセンス表記の検査（警告のみ・Lc-1 ■6・2026-09-20）
 *
 * 目的: 「表示に使っている系列の license_notice が空」を build のログで気づけるようにする。
 *   Y-14 の宿題④。落とすのではなく警告（exit 0 固定）。ライセンス表記の欠落はビルドを止める性質の問題ではなく、
 *   気づかないまま公開が続くことが問題なので、毎ビルドのログに出す。
 *
 * 表示系列の定義: src 配下（src/data を除く）の .ts/.tsx が import している `@/data/eic/<id>.json`。
 *   これらは src/data/eic/<id>.json（上流 eic-data-pipeline が prebuild で再生成）にメタを持つ。
 *
 * 検査:
 *   軸1: license_notice が空・未定義 → 警告（件数と id）
 *   軸2: license_url が既知の 404（src/lib/eic-license.ts の DEAD_LICENSE_URL_FIX の左辺）→ 警告
 *        表示側は normalizeLicenseUrl で正した URL を出すため読者影響は無いが、上流カタログの修正が要る合図
 *   軸3: license_url が無い系列 → 警告（リンクなしで license 名だけが出る）
 *
 * 実行: npm run verify:eic-license（prebuild の末尾でも走る）
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import { DEAD_LICENSE_URL_FIX } from '../src/lib/eic-license';
export {};

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'src');
const EIC_DIR = path.join(ROOT, 'src', 'data', 'eic');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (p === EIC_DIR) continue; // 生成データ自体は対象外
      walk(p, out);
    } else if (/\.(ts|tsx)$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

type Meta = { id?: string; license?: string; license_url?: string; license_notice?: string; source_name?: string };

function metaOf(id: string): Meta | null {
  const p = path.join(EIC_DIR, `${id}.json`);
  if (!fs.existsSync(p)) return null;
  try {
    return (JSON.parse(fs.readFileSync(p, 'utf8')).meta ?? {}) as Meta;
  } catch {
    return null;
  }
}

// catalog.json は「系列」ではなくカタログ索引そのもの（meta を持たない）。
// 検査対象に混ぜると license_notice 空・license_url 無しに必ず計上され、件数の信号が濁る。
const NOT_A_SERIES = new Set(['catalog']);

const used = new Map<string, string[]>(); // id → 参照元ファイル
for (const f of walk(SRC)) {
  const text = fs.readFileSync(f, 'utf8');
  for (const m of text.matchAll(/@\/data\/eic\/([a-z0-9-]+)\.json/g)) {
    if (NOT_A_SERIES.has(m[1])) continue;
    const rel = path.relative(ROOT, f).replace(/\\/g, '/');
    const list = used.get(m[1]) ?? [];
    if (!list.includes(rel)) list.push(rel);
    used.set(m[1], list);
  }
}

const ids = [...used.keys()].sort();
const missingFile: string[] = [];
const emptyNotice: string[] = [];
const deadUrl: string[] = [];
const noUrl: string[] = [];

for (const id of ids) {
  const meta = metaOf(id);
  if (!meta) {
    missingFile.push(id);
    continue;
  }
  if (!(meta.license_notice ?? '').trim()) emptyNotice.push(id);
  if (meta.license_url && meta.license_url in DEAD_LICENSE_URL_FIX) deadUrl.push(id);
  if (!meta.license_url) noUrl.push(id);
}

console.log(`[verify:eic-license] 表示系列 ${ids.length} 件（src が import している @/data/eic/*.json）`);
const warn = (label: string, list: string[]) => {
  if (list.length === 0) {
    console.log(`[verify:eic-license] ok   ${label}: 0 件`);
    return;
  }
  console.warn(`[verify:eic-license] WARN ${label}: ${list.length} 件`);
  for (const id of list.slice(0, 20)) {
    console.warn(`   - ${id}（参照: ${(used.get(id) ?? []).slice(0, 2).join(', ')}）`);
  }
  if (list.length > 20) console.warn(`   … ほか ${list.length - 20} 件`);
};

warn('license_notice が空', emptyNotice);
warn('license_url が既知の 404（上流カタログの修正待ち・表示は正規化済み）', deadUrl);
warn('license_url が無い', noUrl);
warn('カタログに JSON が無い（prebuild 前・または id の綴り違い）', missingFile);

console.log('[verify:eic-license] 警告のみ・ビルドは止めない（exit 0）');
process.exit(0);
