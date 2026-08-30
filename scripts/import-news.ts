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
  // 2026-06 追加: Eku 長野原は協業→開発計画で同じだが slug override で明示
  'eku-energy-naganohara-bess-30mw-2026-05': '開発計画', // 群馬県企業局と土地売買契約、2029年運開
  // 2026-07 月次（前月6月配信5件・手順3 マッピング）
  'itochu-mitsubishi-estate-tokyo-century-chikuzen-bess-67mw-2026-06': '開発計画', // 筑前町67MW着工
  'tepco-daiwa-house-bess-jv-1gw-2026-06': '開発計画',                              // 東電×大和ハウス業務提携
  'nippon-chikudenchi-nc-kuchiharu-bess-juden-2026-06': '連系',                    // NC口春 受電開始
  'nippon-chikudenchi-takayama-disaster-agreement-2026-06': '地域自治体',           // 高山市 防災協定
  're100-denryoku-will-aggregation-3sites-2026-06': '連系',                        // RE100×ウィル アグリ
  // 2026-08 月次（前月7月配信18件・原文照合対象）— 全 category は microCMS 実在値のみ
  'mikimori-hd-bess-10sites-81mwh-2026-07': '開発計画',                            // 三木森HD 10案件81MWh運開予定
  'sbi-moneyplaza-bess-fund-ota-shimane-2026-07': '投資',                          // SBIマネープラザ 蓄電所ファンド
  'ecokaku-technologies-bess-4sites-keiren-2026-07': '連系',                       // エコ革 4施設 初系統連系
  'jesdi-hachigata-bess-juden-2026-07': '連系',                                    // JESDI 鉢形蓄電所 受電
  'glome-hd-toyooka-1-bess-shiunten-2026-07': '連系',                              // グローム 豊岡1号 試運転
  'seela-hd-oyama-bess-2mw-2026-07': '投資',                                       // シーラHD 小山 取得（仕入れ）
  'nippon-chikudenchi-shirakawa-disaster-agreement-2026-07': '地域自治体',          // 日本蓄電池 白河市 防災協定
  'tensor-energy-rising-lv-bess-partnership-2026-07': '開発計画',                   // Tensor×ライジング 低圧提携
  'gates-bess-6sites-2026-07': '開発計画',                                         // GATES 6件推進
  'hexa-tokyo-gas-fukushima-bess-offtake-49mw-2026-07': '開発計画',                // ヘキサ×東京ガス 20年オフテイク
  'tokyo-gas-bess-1gw-mimasaka-2026-07': '開発計画',                               // 東京ガス 1GW突破・美作受託
  're100-denryoku-escript-aggregation-2026-07': '連系',                           // RE100×エスクリプト アグリ
  're100-denryoku-birdman-aggregation-2026-07': '連系',                           // RE100×Birdman アグリ
  'birdman-sakaiminato-bess-unten-2026-07': '連系',                               // Birdman 境港 完工・運開
  'tess-engineering-komoro-bess-43mw-epc-2026-07': '技術',                        // テス 小諸 EPC受注
  'sinexcel-matsusaka-bess-balancing-entry-2026-07': '連系',                      // SINEXCEL 松阪 需給調整参入
  'remixpoint-ogano-bess-10th-chakou-2026-07': '開発計画',                        // リミックス 小鹿野町 10か所目着工
  'juniper-assets-kyushu-bess-financial-close-2026-07': '海外',                    // Juniper 九州 FC（海外資本）
  // 金曜ワンセット#2（2026-08-14）
  'nihon-chikudenchi-kama-bousai-kyotei-2026-08': '地域自治体',                    // 嘉麻市 防災協定
  'eku-hirohara-sueteuke-2026-08': '開発計画',                                     // 広原 据付完了
  // 金曜ワンセット#4（2026-08-30 遅延実施）
  'bluefield-aggregation-100mw-2026-08': '市場統計',                               // 採用決定容量100MW突破（実績統計）
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
