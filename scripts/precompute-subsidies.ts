#!/usr/bin/env tsx
/**
 * scripts/precompute-subsidies.ts
 *
 * 依頼AO build 時事前計算スクリプト (落とし穴 #98 鉄則 #3 完全準拠)
 *
 * 処理:
 *   1. microCMS から subsidies 全 50 件取得 (build 中 1 回のみ)
 *   2. 自由文字列フィールド (body / targetEntity / scheme / name) からキーワード抽出:
 *      - 都道府県名 → applicable_prefs
 *      - 用途キーワード → applicable_use_cases (grid / self_consumption / industrial)
 *      - 事業者種別 → applicable_entities (individual / corporate / municipal)
 *      - 種別 → kind (subsidy / loan / tax / other)
 *   3. src/data/subsidies.json として書き出し
 *
 * 実行:
 *   MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net \
 *     npx tsx scripts/precompute-subsidies.ts
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAllSubsidies } from '../src/lib/microcms';

// ──────────────────────────────────────
// 抽出ルール
// ──────────────────────────────────────

const PREFECTURES = [
  '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
  '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
  '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知',
  '三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山',
  '鳥取', '島根', '岡山', '広島', '山口',
  '徳島', '香川', '愛媛', '高知',
  '福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄',
] as const;

const REGIONS_TO_PREFS: Record<string, string[]> = {
  北海道: ['北海道'],
  東北: ['青森', '岩手', '宮城', '秋田', '山形', '福島'],
  関東: ['茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川'],
  北陸: ['新潟', '富山', '石川', '福井'],
  中部: ['山梨', '長野', '岐阜', '静岡', '愛知'],
  関西: ['三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山'],
  近畿: ['三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山'],
  中国: ['鳥取', '島根', '岡山', '広島', '山口'],
  四国: ['徳島', '香川', '愛媛', '高知'],
  九州: ['福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島'],
  沖縄: ['沖縄'],
};

const USE_CASE_KEYWORDS: Record<string, string[]> = {
  grid: ['系統用', '系統連系', 'グリッドスケール', 'BESS', '蓄電所', '大型蓄電', '事業用蓄電'],
  self_consumption: ['自家消費', '住宅用', '家庭用', 'PPA', '建物', '需要家', '事業所'],
  industrial: ['産業用', '工場', '事業所', '中小企業', '低圧リソース', 'V2H', 'EV'],
};

const ENTITY_KEYWORDS: Record<string, string[]> = {
  individual: ['個人', '住宅', '家庭', '戸建', '住民'],
  corporate: ['法人', '事業者', 'SPC', '企業', '事業会社', '中小企業'],
  municipal: ['自治体', '都道府県', '市町村', '地方公共', '行政'],
};

const KIND_KEYWORDS: Record<string, string[]> = {
  loan: ['融資', 'ローン', 'グリーンローン', 'グリーンボンド', 'プロジェクトファイナンス'],
  tax: ['税制', '減税', '優遇税制', '税額控除'],
  subsidy: ['補助金', '助成金', '補助', '支援事業', '導入支援'],
  guarantee: ['保証', '信用保証'],
};

// ──────────────────────────────────────
// 抽出ヘルパー
// ──────────────────────────────────────

function stripHtml(s: string): string {
  if (!s) return '';
  return s.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractPrefectures(text: string): string[] {
  const found = new Set<string>();
  if (!text) return [];
  // 「全国」「日本全国」キーワードなら全 47 都道府県を applicable とする
  if (/全国|日本全国|国内全域/.test(text)) {
    return [...PREFECTURES];
  }
  // 地域名 → 都道府県展開
  for (const [region, prefs] of Object.entries(REGIONS_TO_PREFS)) {
    if (text.includes(region)) {
      for (const p of prefs) found.add(p);
    }
  }
  // 都道府県名 直接マッチ
  for (const pref of PREFECTURES) {
    if (text.includes(pref)) found.add(pref);
  }
  return Array.from(found);
}

function extractKeywordTags(text: string, dict: Record<string, string[]>): string[] {
  const found = new Set<string>();
  if (!text) return [];
  for (const [tag, kws] of Object.entries(dict)) {
    for (const kw of kws) {
      if (text.includes(kw)) {
        found.add(tag);
        break;
      }
    }
  }
  return Array.from(found);
}

// ──────────────────────────────────────
// 期限解析 (「随時」「2026-08-31」「2026年8月」等)
// ──────────────────────────────────────

interface DeadlineInfo {
  is_rolling: boolean;          // 随時 / 通年 / オープン受付
  deadline_iso?: string;        // ISO 日付 (YYYY-MM-DD)、不明なら undefined
  raw: string;                  // 元文字列
}

function parseDeadline(s: string): DeadlineInfo {
  const raw = (s || '').trim();
  if (!raw) return { is_rolling: false, raw };
  if (/随時|通年|オープン|常時/.test(raw)) {
    return { is_rolling: true, raw };
  }
  // YYYY-MM-DD or YYYY/MM/DD
  let m = raw.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (m) {
    const iso = `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    return { is_rolling: false, deadline_iso: iso, raw };
  }
  // YYYY年MM月 (DD なし) → 月末扱い
  m = raw.match(/(\d{4})年(\d{1,2})月(?:(\d{1,2})日)?/);
  if (m) {
    const year = parseInt(m[1]);
    const month = parseInt(m[2]);
    const day = m[3] ? parseInt(m[3]) : new Date(year, month, 0).getDate();
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return { is_rolling: false, deadline_iso: iso, raw };
  }
  return { is_rolling: false, raw };
}

// ──────────────────────────────────────
// 補助率 解析 (「1/3」「33%」「最大 50%」等)
// ──────────────────────────────────────

function parseSubsidyRate(s: string): { rate_max_pct?: number; raw: string } {
  const raw = (s || '').trim();
  if (!raw) return { raw };
  // X% (最大 X%、X% 補助、X-Y%)
  let m = raw.match(/(\d+(?:\.\d+)?)\s*[％%]/);
  if (m) {
    return { rate_max_pct: parseFloat(m[1]), raw };
  }
  // 分数 X/Y (1/3, 2/3, 1/2 等)
  m = raw.match(/(\d+)\s*\/\s*(\d+)/);
  if (m) {
    const num = parseInt(m[1]);
    const den = parseInt(m[2]);
    if (den > 0) return { rate_max_pct: (num / den) * 100, raw };
  }
  return { raw };
}

// ──────────────────────────────────────
// 出力スキーマ
// ──────────────────────────────────────

export interface PrecomputedSubsidy {
  id: string;
  slug: string;
  name: string;
  organization: string;
  category: string[];
  status: string[];
  /** 補助率 解析結果 */
  subsidyRate_raw: string;
  subsidyRate_max_pct?: number;
  upperLimit_raw: string;
  targetEntity_raw: string;
  applicationStart: string;
  deadline_raw: string;
  deadline_iso?: string;
  is_rolling: boolean;
  fiscalYear: string;
  sourceUrl: string;
  scheme: string;
  /** 抽出タグ */
  applicable_prefs: string[];     // 対象都道府県 (47項目 or 一部)
  applicable_use_cases: string[]; // grid / self_consumption / industrial
  applicable_entities: string[];  // individual / corporate / municipal
  kind: string[];                 // subsidy / loan / tax / guarantee
}

// ──────────────────────────────────────
// メイン
// ──────────────────────────────────────

async function main(): Promise<void> {
  console.log('[precompute-subsidies] microCMS から subsidies 全件取得...');
  const t0 = Date.now();
  const subsidies = await getAllSubsidies();
  console.log(`  ${subsidies.length} 件取得 (${Date.now() - t0}ms)`);

  const out: PrecomputedSubsidy[] = [];
  let stats = {
    prefs_extracted: 0,
    use_cases_extracted: 0,
    entities_extracted: 0,
    rolling: 0,
    has_deadline: 0,
    has_rate: 0,
  };

  for (const s of subsidies) {
    // 全文ベース検索用テキスト
    const fullText = [
      s.name,
      s.organization || '',
      s.scheme || '',
      stripHtml(s.body || ''),
      s.targetEntity || '',
    ].join(' ');

    const prefs = extractPrefectures(fullText);
    const useCases = extractKeywordTags(fullText, USE_CASE_KEYWORDS);
    const entities = extractKeywordTags(fullText, ENTITY_KEYWORDS);
    const kinds = extractKeywordTags(fullText, KIND_KEYWORDS);
    if (kinds.length === 0) kinds.push('other');

    const deadline = parseDeadline(s.deadline || '');
    const rate = parseSubsidyRate(s.subsidyRate || '');

    if (prefs.length > 0) stats.prefs_extracted++;
    if (useCases.length > 0) stats.use_cases_extracted++;
    if (entities.length > 0) stats.entities_extracted++;
    if (deadline.is_rolling) stats.rolling++;
    if (deadline.deadline_iso) stats.has_deadline++;
    if (rate.rate_max_pct !== undefined) stats.has_rate++;

    out.push({
      id: s.id,
      slug: s.slug,
      name: s.name,
      organization: s.organization || '',
      category: (s.category as string[]) || [],
      status: (s.status as string[]) || [],
      subsidyRate_raw: s.subsidyRate || '',
      subsidyRate_max_pct: rate.rate_max_pct,
      upperLimit_raw: s.upperLimit || '',
      targetEntity_raw: s.targetEntity || '',
      applicationStart: s.applicationStart || '',
      deadline_raw: s.deadline || '',
      deadline_iso: deadline.deadline_iso,
      is_rolling: deadline.is_rolling,
      fiscalYear: s.fiscalYear || '',
      sourceUrl: s.sourceUrl || '',
      scheme: s.scheme || '',
      applicable_prefs: prefs,
      applicable_use_cases: useCases,
      applicable_entities: entities,
      kind: kinds,
    });
  }

  const outDir = path.join(process.cwd(), 'src', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'subsidies.json');
  const outJson = JSON.stringify(out, null, 2);
  fs.writeFileSync(outPath, outJson);

  const sizeKB = (Buffer.byteLength(outJson, 'utf8') / 1024).toFixed(1);
  console.log(`\n[precompute-subsidies] 書き出し完了`);
  console.log(`  path: ${outPath}`);
  console.log(`  size: ${sizeKB} KB`);
  console.log(`\n  ▼ 抽出統計 (50 件中):`);
  console.log(`    prefs 抽出済: ${stats.prefs_extracted} 件`);
  console.log(`    use_case 抽出済: ${stats.use_cases_extracted} 件`);
  console.log(`    entity 抽出済: ${stats.entities_extracted} 件`);
  console.log(`    随時 (is_rolling): ${stats.rolling} 件`);
  console.log(`    deadline 解析済: ${stats.has_deadline} 件`);
  console.log(`    補助率 解析済: ${stats.has_rate} 件`);

  // 種別分布
  const kindDist: Record<string, number> = {};
  for (const s of out) {
    for (const k of s.kind) kindDist[k] = (kindDist[k] || 0) + 1;
  }
  console.log(`\n  ▼ 種別分布:`);
  for (const [k, v] of Object.entries(kindDist).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${k}: ${v}`);
  }
}

main().catch((err) => {
  console.error('[precompute-subsidies] ERROR:', err);
  process.exit(1);
});
