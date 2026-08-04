/**
 * scripts/import-projects.ts
 *
 * /projects（microCMS projects エンドポイント）への一括投入スクリプト
 * scripts/import-news.ts と同型（--file 指定・findBySlug 冪等・--dry-run・300ms スロットル）。
 * 週次連動（金曜ワンセット⑤）で毎週再利用する。
 *
 * 使い方:
 *   MICROCMS_API_KEY=xxx npx tsx scripts/import-projects.ts --dry-run
 *   MICROCMS_API_KEY=xxx npx tsx scripts/import-projects.ts --limit 2
 *   MICROCMS_API_KEY=xxx npx tsx scripts/import-projects.ts --skip 2
 *   MICROCMS_API_KEY=xxx npx tsx scripts/import-projects.ts --file scripts/projects-import-YYYY-MM.json
 *
 * データ規約（実スキーマ 2026-08-04 実査）:
 *   - outputMw / capacityMwh は数値。不明は 0（=サイト表示「調査中」の既存規約）
 *   - status は実在 select 値のみ: 計画中 / 建設中 / 稼働中（#106 silently drop ガードを投入前に実施）
 *   - marketParticipation は実在値のみ: JEPX / 需給調整市場 / 容量市場 / 長期脱炭素
 *   - cod は YYYY-MM-DD（未定は省略）
 * セキュリティ: API キーは環境変数のみ・ログ出力しない・.env は変更しない。POST のみ（PUT/PATCH/DELETE なし）。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

type ProjectInput = {
  slug: string;
  name: string;
  prefecture?: string;
  city?: string;
  operator?: string;
  epc?: string;
  outputMw?: number;      // 不明は 0（調査中）
  capacityMwh?: number;   // 不明は 0（調査中）
  cod?: string;           // YYYY-MM-DD
  status?: string[];      // 計画中 / 建設中 / 稼働中
  marketParticipation?: string[]; // JEPX / 需給調整市場 / 容量市場 / 長期脱炭素
  sourceUrl?: string;
  body?: string;
  // 内部メモ（送らない）
  _note?: string;
};

const VALID_STATUS = new Set(['計画中', '建設中', '稼働中']);
const VALID_MARKET = new Set(['JEPX', '需給調整市場', '容量市場', '長期脱炭素']);

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const API_KEY = process.env.MICROCMS_API_KEY;
if (!API_KEY) {
  console.error('ERROR: MICROCMS_API_KEY 環境変数が必要です');
  process.exit(1);
}

const DRY_RUN = process.argv.includes('--dry-run');
function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}
const INPUT_FILE = getArgValue('--file') ?? path.join(process.cwd(), 'scripts', 'projects-import-2026-08.json');
const rawLimit = getArgValue('--limit');
const rawSkip = getArgValue('--skip');
const LIMIT = rawLimit !== undefined ? parseInt(rawLimit, 10) : undefined;
const SKIP = rawSkip !== undefined ? parseInt(rawSkip, 10) : undefined;
if ((LIMIT !== undefined && isNaN(LIMIT)) || (SKIP !== undefined && isNaN(SKIP))) {
  console.error('ERROR: --limit / --skip の値が不正です');
  process.exit(1);
}

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
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
  return resp.json() as T;
}

async function findBySlug(slug: string): Promise<{ id: string } | null> {
  const d = await api<{ contents: { id: string }[] }>(
    'GET',
    `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&fields=id&limit=1`
  );
  return d.contents[0] ?? null;
}
async function totalCount(): Promise<number> {
  return (await api<{ totalCount: number }>('GET', `${BASE}?limit=1`)).totalCount;
}

/** 実在 select 値ガード（#106: 未定義値は silently drop されるため投入前に fail-fast） */
function validate(items: ProjectInput[]): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    if (!it.slug || !it.name) errs.push(`${it.slug || '(no slug)'}: slug/name 必須`);
    if (seen.has(it.slug)) errs.push(`${it.slug}: 入力ファイル内 slug 重複`);
    seen.add(it.slug);
    for (const s of it.status ?? []) if (!VALID_STATUS.has(s)) errs.push(`${it.slug}: status「${s}」は実在値でない（#106）`);
    for (const m of it.marketParticipation ?? []) if (!VALID_MARKET.has(m)) errs.push(`${it.slug}: marketParticipation「${m}」は実在値でない（#106）`);
    if (it.outputMw !== undefined && typeof it.outputMw !== 'number') errs.push(`${it.slug}: outputMw は数値`);
    if (it.capacityMwh !== undefined && typeof it.capacityMwh !== 'number') errs.push(`${it.slug}: capacityMwh は数値`);
    if (it.cod !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(it.cod)) errs.push(`${it.slug}: cod は YYYY-MM-DD`);
  }
  return errs;
}

function toPayload(it: ProjectInput): Record<string, unknown> {
  const p: Record<string, unknown> = { slug: it.slug, name: it.name };
  if (it.prefecture) p.prefecture = it.prefecture;
  if (it.city) p.city = it.city;
  if (it.operator) p.operator = it.operator;
  if (it.epc) p.epc = it.epc;
  if (it.outputMw !== undefined) p.outputMw = it.outputMw;
  if (it.capacityMwh !== undefined) p.capacityMwh = it.capacityMwh;
  if (it.cod) p.cod = it.cod;
  if (it.status?.length) p.status = it.status;
  if (it.marketParticipation?.length) p.marketParticipation = it.marketParticipation;
  if (it.sourceUrl) p.sourceUrl = it.sourceUrl;
  if (it.body) p.body = it.body;
  // _note は送らない
  return p;
}

async function postOne(it: ProjectInput): Promise<'ok' | 'skip' | 'err'> {
  try {
    const existing = await findBySlug(it.slug);
    if (existing) {
      console.log(`  [skip] ${it.slug} — 既存 (id=${existing.id})`);
      return 'skip';
    }
    const payload = toPayload(it);
    if (DRY_RUN) {
      const mw = it.outputMw === 0 ? '調査中' : `${it.outputMw ?? '-'}MW`;
      const mwh = it.capacityMwh === 0 ? '調査中' : `${it.capacityMwh ?? '-'}MWh`;
      console.log(`  [dry-run] POST ${it.slug} [${(it.status ?? []).join('/') || 'statusなし'}] ${mw}/${mwh} ${it.prefecture ?? ''}${it.city ?? ''}`);
      console.log(`           name: ${it.name.slice(0, 70)}`);
      return 'ok';
    }
    const created = await api<{ id: string }>('POST', BASE, payload);
    console.log(`  [ok] ${it.slug} — created id=${created.id}`);

    // POST後 GET 照合（#106）: name / status / marketParticipation / 数値
    const back = await api<{ contents: Record<string, unknown>[] }>(
      'GET',
      `${BASE}?filters=slug[equals]${encodeURIComponent(it.slug)}&limit=1`
    );
    const r = back.contents[0];
    const ok =
      r &&
      r.name === it.name &&
      JSON.stringify(r.status ?? []) === JSON.stringify(it.status ?? []) &&
      JSON.stringify(r.marketParticipation ?? []) === JSON.stringify(it.marketParticipation ?? []) &&
      (it.outputMw === undefined || r.outputMw === it.outputMw) &&
      (it.capacityMwh === undefined || r.capacityMwh === it.capacityMwh);
    if (!ok) {
      console.error(`  [err] ${it.slug}: GET照合 不一致（#106 の可能性） got status=${JSON.stringify(r?.status)} mkt=${JSON.stringify(r?.marketParticipation)}`);
      return 'err';
    }
    console.log(`  [get照合] ${it.slug}: PASS`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] ${it.slug}: ${(e as Error).message}`);
    return 'err';
  }
}

async function main(): Promise<void> {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`ERROR: 入力ファイルが見つかりません: ${INPUT_FILE}`);
    process.exit(1);
  }
  const allItems: ProjectInput[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  if (!Array.isArray(allItems)) {
    console.error('ERROR: 入力 JSON はルートが配列である必要があります');
    process.exit(1);
  }

  const errs = validate(allItems);
  if (errs.length > 0) {
    console.error('ERROR: 入力バリデーション失敗:');
    for (const e of errs) console.error('  - ' + e);
    process.exit(2);
  }

  console.log('━'.repeat(70));
  const before = await totalCount();
  console.log(`[import-projects] projects 現在件数: ${before}`);

  let items = allItems;
  const skipN = SKIP ?? 0;
  if (skipN > 0) items = items.slice(skipN);
  if (LIMIT !== undefined) items = items.slice(0, LIMIT);

  console.log(`[import-projects] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}  入力=${allItems.length}件  処理対象=${items.length}件${skipN > 0 ? `（先頭 ${skipN} 件スキップ）` : ''}`);
  console.log('━'.repeat(70));

  let ok = 0, skip = 0, err = 0;
  for (const item of items) {
    const r = await postOne(item);
    if (r === 'ok') ok++;
    else if (r === 'skip') skip++;
    else err++;
    // 300ms スロットル（12件 × 2-3req ≈ 数十req/分 << 警告閾値・鉄則#4）
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  console.log('━'.repeat(70));
  console.log(`[done] ok=${ok}  skip=${skip}  err=${err}`);
  if (!DRY_RUN) {
    const after = await totalCount();
    console.log(`[projects 総件数] 投入前=${before}  投入後=${after}  差分=+${after - before}`);
  }
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
