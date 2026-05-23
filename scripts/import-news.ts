/**
 * scripts/import-news.ts
 *
 * PR TIMES キュレーション ニュース一括投入スクリプト
 *
 * 使い方:
 *   # スキーマ確認 + 全件 dry-run
 *   MICROCMS_API_KEY=xxx npx tsx scripts/import-news.ts --dry-run
 *
 *   # 先頭 2 件だけ実投入
 *   MICROCMS_API_KEY=xxx npx tsx scripts/import-news.ts --limit 2
 *
 *   # 先頭 2 件をスキップして残り 22 件を投入
 *   MICROCMS_API_KEY=xxx npx tsx scripts/import-news.ts --skip 2
 *
 *   # ファイル指定（デフォルト: scripts/news-import-2026-05.json）
 *   MICROCMS_API_KEY=xxx npx tsx scripts/import-news.ts --file scripts/other.json
 *
 * セキュリティ:
 *   - MICROCMS_API_KEY は環境変数でのみ受け取る
 *   - API キーをログ出力しない
 *   - .env は一切変更しない
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

// ─── 型定義 ───────────────────────────────────────────────────────────────────

type NewsInput = {
  slug: string;
  title: string;
  lead?: string;
  body?: string;
  tags?: string;
  sourceName?: string;
  sourceUrl?: string;
  categorySuggestion?: string;
  // microCMS には送らない (内部メモ用フィールド)
  _prtimesUrl?: string;
  relatedTerms?: string[];
  relatedOperators?: string[];
};

type NewsPayload = {
  slug: string;
  title: string;
  lead?: string;
  body?: string;
  tags?: string;
  sourceName?: string;
  sourceUrl?: string;
  category?: string[];
};

// ─── カテゴリマッピング ────────────────────────────────────────────────────────
// microCMS 既存カテゴリ: オークション / 制度 / 地域自治体 / 市場統計 / 技術 /
//                        投資 / 海外 / 編集部 / 補助金 / 連系 / 開発計画

/** categorySuggestion → microCMS category のデフォルトマッピング */
const CATEGORY_MAP: Record<string, string> = {
  ファイナンス: '投資',
  '市場・制度': 'オークション', // LTDCA 落札記事が主
  '市場参入・運開': '連系',     // 系統連系・需給調整市場参入
  '受注・EPC': '技術',
  '受注・製品納入': '技術',
  '受注・採用': '技術',
  '製品・サービス': '技術',
  協業: '開発計画',
  運用受託: '開発計画',
};

/**
 * slug 単位のオーバーライド
 * 同じ categorySuggestion でも内容によって category が異なる場合に使用
 */
const CATEGORY_OVERRIDE: Record<string, string> = {
  'shizen-connect-ac-ra-share-no1': '市場統計',       // 事業者動向: シェアNo.1 統計
  'shizen-connect-rikuden-alliance': '開発計画',       // 事業者動向: 北陸電力との協業
  'eneforward-corporate-site-renewal': '開発計画',     // 事業者動向: 事業体制・IR
  'mikimori-hd-bess-500sites': '開発計画',             // 事業者動向: 500拠点展開計画
  'taoke-wide-area-recycling-certification': '制度',   // 事業者動向: 環境大臣広域認定
};

function mapCategory(slug: string, suggestion?: string): string[] | undefined {
  // 1. per-slug オーバーライド優先
  if (CATEGORY_OVERRIDE[slug]) return [CATEGORY_OVERRIDE[slug]];
  // 2. categorySuggestion デフォルトマッピング
  if (suggestion && CATEGORY_MAP[suggestion]) return [CATEGORY_MAP[suggestion]];
  return undefined;
}

// ─── 環境変数 ────────────────────────────────────────────────────────────────

const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const API_KEY = process.env.MICROCMS_API_KEY;

if (!API_KEY) {
  console.error('ERROR: MICROCMS_API_KEY 環境変数が必要です');
  console.error('  例: MICROCMS_API_KEY=xxx npx tsx scripts/import-news.ts --dry-run');
  process.exit(1);
}

// ─── CLI オプション ───────────────────────────────────────────────────────────

const DRY_RUN = process.argv.includes('--dry-run');

function getArgValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return undefined;
  return process.argv[idx + 1];
}

const DEFAULT_FILE = path.join(process.cwd(), 'scripts', 'news-import-2026-05.json');
const INPUT_FILE = getArgValue('--file') ?? DEFAULT_FILE;

const rawLimit = getArgValue('--limit');
const rawSkip = getArgValue('--skip');
const LIMIT = rawLimit !== undefined ? parseInt(rawLimit, 10) : undefined;
const SKIP = rawSkip !== undefined ? parseInt(rawSkip, 10) : undefined;

if (LIMIT !== undefined && isNaN(LIMIT)) {
  console.error('ERROR: --limit の値が不正です');
  process.exit(1);
}
if (SKIP !== undefined && isNaN(SKIP)) {
  console.error('ERROR: --skip の値が不正です');
  process.exit(1);
}

// ─── API ─────────────────────────────────────────────────────────────────────

const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/news`;

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {
    'X-MICROCMS-API-KEY': API_KEY!,
  };
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

// ─── スキーマ確認 ─────────────────────────────────────────────────────────────

type CmsListResponse<T> = {
  totalCount: number;
  contents: T[];
};

type CmsNewsItem = {
  id: string;
  slug?: string;
  title?: string;
};

async function inspectEndpoint(): Promise<{ totalCount: number; sampleFields: string[] }> {
  const data = await api<CmsListResponse<CmsNewsItem>>('GET', `${BASE}?limit=1`);
  const sampleFields = data.contents.length > 0 ? Object.keys(data.contents[0]) : [];
  return { totalCount: data.totalCount, sampleFields };
}

// ─── 重複チェック ─────────────────────────────────────────────────────────────

async function findBySlug(slug: string): Promise<{ id: string } | null> {
  const url = `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&fields=id&limit=1`;
  const data = await api<CmsListResponse<{ id: string }>>('GET', url);
  return data.contents[0] ?? null;
}

// ─── 1 件投入 ─────────────────────────────────────────────────────────────────

async function postOne(input: NewsInput): Promise<'ok' | 'skip' | 'err'> {
  try {
    // --- 重複チェック ---
    const existing = await findBySlug(input.slug);
    if (existing) {
      console.log(`  [skip] ${input.slug} — 既存 (id=${existing.id})`);
      return 'skip';
    }

    // --- ペイロード構築 (送らないフィールドを除外) ---
    const payload: NewsPayload = { slug: input.slug, title: input.title };
    if (input.lead)       payload.lead       = input.lead;
    if (input.body)       payload.body       = input.body;
    if (input.tags)       payload.tags       = input.tags;
    if (input.sourceName) payload.sourceName = input.sourceName;
    if (input.sourceUrl)  payload.sourceUrl  = input.sourceUrl;
    // ※ categorySuggestion / _prtimesUrl / relatedTerms / relatedOperators は送らない

    const category = mapCategory(input.slug, input.categorySuggestion);
    if (category) payload.category = category;

    // --- dry-run ---
    if (DRY_RUN) {
      const catLabel = category ? `[category=${category[0]}]` : `[category=なし]`;
      console.log(`  [dry-run] POST ${input.slug} ${catLabel}`);
      console.log(`           title: ${input.title.slice(0, 70)}`);
      return 'ok';
    }

    // --- 実 POST ---
    const result = await api<{ id: string }>('POST', BASE, payload);
    console.log(`  [ok] ${input.slug} — created id=${result.id}`);
    return 'ok';
  } catch (e) {
    console.error(`  [err] ${input.slug}: ${(e as Error).message}`);
    return 'err';
  }
}

// ─── メイン ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  // 入力ファイル読み込み
  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`ERROR: 入力ファイルが見つかりません: ${INPUT_FILE}`);
    process.exit(1);
  }
  const rawText = fs.readFileSync(INPUT_FILE, 'utf8');
  const allItems: NewsInput[] = JSON.parse(rawText);

  if (!Array.isArray(allItems)) {
    console.error('ERROR: 入力 JSON はルートが配列である必要があります');
    process.exit(1);
  }

  // ファイル内 slug 重複チェック
  const slugs = allItems.map((it) => it.slug);
  if (new Set(slugs).size !== slugs.length) {
    const dup = slugs.filter((s, i) => slugs.indexOf(s) !== i);
    console.error(`ERROR: 入力ファイル内に重複 slug があります: ${dup.join(', ')}`);
    process.exit(2);
  }

  // ─── スキーマ確認 ───
  console.log('━'.repeat(70));
  console.log('[import-news] スキーマ確認中...');
  let totalBefore = -1;

  try {
    const info = await inspectEndpoint();
    totalBefore = info.totalCount;
    console.log(`  news 現在件数  : ${totalBefore}`);
    console.log(`  サンプルフィールド: ${info.sampleFields.join(', ') || '(エンドポイントは空)'}`);
    console.log(`  カテゴリマッピング: ${Object.keys(CATEGORY_MAP).join(' / ')}`);
    console.log(`  slug オーバーライド: ${Object.keys(CATEGORY_OVERRIDE).length} 件`);
  } catch (e) {
    console.error(`  [error] スキーマ確認失敗: ${(e as Error).message}`);
    process.exit(1);
  }

  // ─── スライス ───
  let items = allItems;
  const skipN = SKIP ?? 0;
  if (skipN > 0) items = items.slice(skipN);
  if (LIMIT !== undefined) items = items.slice(0, LIMIT);

  const mode = DRY_RUN ? 'DRY-RUN' : 'EXECUTE';
  console.log('━'.repeat(70));
  console.log(
    `[import-news] mode=${mode}  入力=${allItems.length}件  処理対象=${items.length}件` +
      (skipN > 0 ? `  (先頭 ${skipN} 件スキップ)` : '')
  );
  console.log('━'.repeat(70));

  // dry-run: 投入予定一覧を先に表示
  if (DRY_RUN) {
    console.log('\n▼ 投入予定一覧:');
    allItems.forEach((item, i) => {
      const cat = mapCategory(item.slug, item.categorySuggestion);
      const catLabel = cat
        ? `[✓ ${cat[0]}]`
        : `[× カテゴリなし]`;
      const inRange =
        i >= skipN && (LIMIT === undefined || i < skipN + (LIMIT ?? Infinity));
      const marker = inRange ? '→' : '  ';
      const override = CATEGORY_OVERRIDE[item.slug] ? ' (override)' : '';
      console.log(`  ${marker} ${String(i + 1).padStart(2)}. ${catLabel}${override}`);
      console.log(`        slug : ${item.slug}`);
      console.log(`        title: ${item.title.slice(0, 70)}`);
    });
    console.log('');
  }

  // ─── 投入ループ ───
  let ok = 0,
    skip = 0,
    err = 0;
  for (const item of items) {
    const r = await postOne(item);
    if (r === 'ok') ok++;
    else if (r === 'skip') skip++;
    else err++;
    // 300ms スロットル（ピーク負荷: 24件 × 2req × 300ms ≈ 144 req/min << 5,000 req/min 警告閾値）
    await new Promise<void>((resolve) => setTimeout(resolve, 300));
  }

  // ─── 完了レポート ───
  console.log('━'.repeat(70));
  console.log(`[done] ok=${ok}  skip=${skip}  err=${err}`);

  if (!DRY_RUN) {
    try {
      const { totalCount } = await inspectEndpoint();
      console.log(
        `[news 総件数] 投入前=${totalBefore}  投入後=${totalCount}  差分=+${totalCount - totalBefore}`
      );
    } catch {
      // 総件数取得失敗は無視
    }
  }

  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
