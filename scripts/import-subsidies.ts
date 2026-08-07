/**
 * scripts/import-subsidies.ts
 *
 * /subsidies（microCMS subsidies エンドポイント＝真実源）への一括投入スクリプト
 * scripts/import-projects.ts と同型（--file 指定・findBySlug 冪等・--dry-run・--limit/--skip・300ms スロットル）。
 * S3（都道府県拡張）承認後の投入・以後の週次④で再利用する。
 *
 * 使い方:
 *   MICROCMS_API_KEY=xxx npx tsx scripts/import-subsidies.ts --file scripts/subsidies-import-YYYY-MM.json --dry-run
 *   MICROCMS_API_KEY=xxx npx tsx scripts/import-subsidies.ts --file scripts/subsidies-import-YYYY-MM.json
 *
 * データ規約（2026-08 実査・[[subsidies-source-of-truth]]）:
 *   - POST するのは source(raw) フィールドのみ: name/slug/organization/category[]/status[]/
 *     subsidyRate/upperLimit/targetEntity/applicationStart/deadline/fiscalYear/sourceUrl/scheme/body?
 *   - applicable_prefs・deadline_iso・kind 等は precompute-subsidies.ts が派生（送らない・#110）
 *   - select 実在値ガード（#106 silently drop 対策）:
 *       status: 公募中 / 採択結果公表 / 受付終了 / その他（※「公募予定」は選択肢に無い＝不可）
 *       category: 蓄電池 / 再エネ統合 / EV/V2H / 太陽光 / 需要側 / ZEH/ZEB / 地域脱炭素
 * セキュリティ: キーは環境変数のみ・値は出力しない・.env 不変更・POST のみ（PUT/PATCH/DELETE なし）。
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
export {};

type SubsidyInput = {
  slug: string;
  name: string;
  organization: string;
  category?: string[];
  status?: string[];
  subsidyRate?: string;
  upperLimit?: string;
  targetEntity?: string;
  applicationStart?: string;
  deadline?: string;
  fiscalYear?: string;
  sourceUrl?: string;
  scheme?: string;
  body?: string;
  _note?: string; // 内部メモ（送らない）
};

const VALID_STATUS = new Set(['公募中', '採択結果公表', '受付終了', 'その他']);
const VALID_CATEGORY = new Set(['蓄電池', '再エネ統合', 'EV/V2H', '太陽光', '需要側', 'ZEH/ZEB', '地域脱炭素']);
const SEND_FIELDS = [
  'slug', 'name', 'organization', 'category', 'status', 'subsidyRate', 'upperLimit',
  'targetEntity', 'applicationStart', 'deadline', 'fiscalYear', 'sourceUrl', 'scheme', 'body',
] as const;

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const API_KEY = process.env.MICROCMS_API_KEY;
if (!API_KEY) {
  console.error('ERROR: MICROCMS_API_KEY 環境変数が必要です');
  process.exit(1);
}
const DRY_RUN = process.argv.includes('--dry-run');
function argValue(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i !== -1 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}
const INPUT_FILE = argValue('--file') ?? path.join(process.cwd(), 'scripts', 'subsidies-import-2026-08.json');
const rawLimit = argValue('--limit');
const rawSkip = argValue('--skip');
const LIMIT = rawLimit !== undefined ? parseInt(rawLimit, 10) : undefined;
const SKIP = rawSkip !== undefined ? parseInt(rawSkip, 10) : undefined;

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/subsidies`;

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${url} → HTTP ${r.status}: ${(await r.text()).slice(0, 400)}`);
  return r.json() as T;
}
async function findBySlug(slug: string): Promise<{ id: string } | null> {
  const d = await api<{ contents: { id: string }[] }>(
    'GET', `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&fields=id&limit=1`);
  return d.contents[0] ?? null;
}
async function totalCount(): Promise<number> {
  return (await api<{ totalCount: number }>('GET', `${BASE}?limit=1`)).totalCount;
}

function validate(items: SubsidyInput[]): string[] {
  const errs: string[] = [];
  const seen = new Set<string>();
  for (const it of items) {
    if (!it.slug || !it.name || !it.organization) errs.push(`${it.slug || '(no slug)'}: slug/name/organization 必須`);
    if (seen.has(it.slug)) errs.push(`${it.slug}: 入力ファイル内 slug 重複`);
    seen.add(it.slug);
    for (const s of it.status ?? []) if (!VALID_STATUS.has(s)) errs.push(`${it.slug}: status「${s}」非実在値（#106・公募予定は不可）`);
    for (const c of it.category ?? []) if (!VALID_CATEGORY.has(c)) errs.push(`${it.slug}: category「${c}」非実在値（#106）`);
    for (const k of Object.keys(it)) {
      if (!k.startsWith('_') && !(SEND_FIELDS as readonly string[]).includes(k)) {
        errs.push(`${it.slug}: フィールド「${k}」は送信対象外（applicable_prefs等は precompute 派生・#110）`);
      }
    }
  }
  return errs;
}

function toPayload(it: SubsidyInput): Record<string, unknown> {
  const p: Record<string, unknown> = {};
  for (const k of SEND_FIELDS) {
    const v = it[k as keyof SubsidyInput];
    if (v !== undefined && v !== '' && !(Array.isArray(v) && v.length === 0)) p[k] = v;
  }
  return p;
}

async function main(): Promise<void> {
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`ERROR: 入力ファイルが見つかりません: ${INPUT_FILE}`);
    process.exit(1);
  }
  const allItems: SubsidyInput[] = JSON.parse(fs.readFileSync(INPUT_FILE, 'utf8'));
  if (!Array.isArray(allItems)) {
    console.error('ERROR: 入力 JSON はルートが配列である必要があります');
    process.exit(1);
  }
  const errs = validate(allItems);
  if (errs.length) {
    console.error('ERROR: 入力バリデーション失敗:');
    errs.forEach((e) => console.error('  - ' + e));
    process.exit(2);
  }

  console.log('━'.repeat(70));
  const before = await totalCount();
  console.log(`[import-subsidies] subsidies 現在件数: ${before}`);
  let items = allItems;
  const skipN = SKIP ?? 0;
  if (skipN > 0) items = items.slice(skipN);
  if (LIMIT !== undefined) items = items.slice(0, LIMIT);
  console.log(`[import-subsidies] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}  入力=${allItems.length}件  処理対象=${items.length}件`);
  console.log('━'.repeat(70));

  let ok = 0, skip = 0, err = 0;
  for (const it of items) {
    try {
      const existing = await findBySlug(it.slug);
      if (existing) {
        console.log(`  [skip] ${it.slug} — 既存 (id=${existing.id})`);
        skip++;
      } else if (DRY_RUN) {
        console.log(`  [dry-run] POST ${it.slug} [${(it.status ?? []).join('/') || 'statusなし'}] ${it.name.slice(0, 50)}`);
        ok++;
      } else {
        const created = await api<{ id: string }>('POST', BASE, toPayload(it));
        console.log(`  [ok] ${it.slug} — created id=${created.id}`);
        // GET照合（#106）: slug/name/status/category
        const back = await api<{ contents: Record<string, unknown>[] }>(
          'GET', `${BASE}?filters=slug[equals]${encodeURIComponent(it.slug)}&limit=1`);
        const r = back.contents[0];
        const pass =
          r && r.name === it.name &&
          JSON.stringify(r.status ?? []) === JSON.stringify(it.status ?? []) &&
          JSON.stringify(r.category ?? []) === JSON.stringify(it.category ?? []);
        if (!pass) {
          console.error(`  [err] ${it.slug}: GET照合不一致（#106?） status=${JSON.stringify(r?.status)}`);
          err++;
        } else {
          console.log(`  [get照合] ${it.slug}: PASS`);
          ok++;
        }
      }
    } catch (e) {
      console.error(`  [err] ${it.slug}: ${(e as Error).message}`);
      err++;
    }
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }
  console.log('━'.repeat(70));
  console.log(`[done] ok=${ok}  skip=${skip}  err=${err}`);
  if (!DRY_RUN) {
    const after = await totalCount();
    console.log(`[subsidies 総件数] 投入前=${before}  投入後=${after}  差分=+${after - before}`);
  }
  process.exit(err > 0 ? 1 : 0);
}
main().catch((e) => { console.error('FATAL:', e); process.exit(1); });
