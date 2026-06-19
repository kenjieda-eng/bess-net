#!/usr/bin/env tsx
/**
 * scripts/precompute-operator-ranking.ts
 * 依頼65 v1.1: 法人格サフィックス正規化 + JV タグ + 監査ログ
 * 鉄則#2/#3: build 時 1 回のみ microCMS 取得、ランタイム 0 リクエスト
 * 実行: npm run build:operator-ranking (prebuild フック)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAllProjects, getAllOperators } from '../src/lib/microcms';

// ──────────────────────────────────────
// 正規化ユーティリティ
// ──────────────────────────────────────

/** 除去対象の法人格トークン（前置 / 後置の両方で適用）*/
const LEGAL_TOKENS = [
  '株式会社',
  '(株)',
  '（株）',
  '㈱',
  '有限会社',
  '(有)',
  '（有）',
  '合同会社',
  '(同)',
  '（同）',
  '合資会社',
  '一般社団法人',
  '一般財団法人',
  '公益社団法人',
  '公益財団法人',
  'Co., Ltd.',
  'Co.,Ltd.',
  ' Ltd.',
  'Ltd.',
  ' Inc.',
  'Inc.',
  ' LLC',
  'LLC',
  ' K.K.',
  'K.K.',
];

/** 法人格トークンを前置・後置から繰り返し除去する */
function removeLegalSuffix(s: string): string {
  let prev = '';
  while (prev !== s) {
    prev = s;
    const trimmed = s.trim();
    for (const token of LEGAL_TOKENS) {
      if (trimmed.startsWith(token)) {
        s = trimmed.slice(token.length).trim();
      } else if (trimmed.endsWith(token)) {
        s = trimmed.slice(0, trimmed.length - token.length).trim();
      }
    }
  }
  return s.trim();
}

/**
 * 全角括弧内の注記を安全に除去する。
 * 「括弧内の法人格除去後 === 基底部分の法人格除去後」の場合だけ除去（再掲パターン）。
 * 例: 「上組（株式会社上組）」→「上組」
 * 例: 「東京ガス（ニジオ）」→ 除去せず「東京ガス（ニジオ）」
 */
function stripRedundantParen(s: string): string {
  return s.replace(/[（(]([^）)]+)[）)]/g, (match: string, inner: string, offset: number) => {
    const beforeParen = s.slice(0, offset).normalize('NFKC').trim();
    const innerNorm = inner.normalize('NFKC').trim();
    const baseStripped = removeLegalSuffix(beforeParen);
    const innerStripped = removeLegalSuffix(innerNorm);
    if (
      innerStripped === baseStripped ||
      innerNorm === beforeParen ||
      // 括弧内が純粋に法人格トークンのみ（例: 「（株）」単体）
      LEGAL_TOKENS.includes(innerNorm)
    ) {
      return '';
    }
    return match;
  });
}

/**
 * 集計キー生成（displayName とは別物）。
 * 1. NFKC 正規化
 * 2. 冗長括弧除去
 * 3. 法人格サフィックス/プレフィックス除去
 * 4. 空文字保護
 */
function normalizeOperatorKey(raw: string): string {
  let s = raw.trim().normalize('NFKC');
  s = stripRedundantParen(s);
  s = removeLegalSuffix(s);
  s = s.replace(/\s+/g, ' ').trim();
  return s.length > 0 ? s : raw.normalize('NFKC').trim();
}

/**
 * JV / コンソーシアム判定。
 * 該当する場合、集計キー正規化の対象外（登録名そのまま、L-EIC-013 捏造防止）。
 */
function isJointVenture(raw: string): boolean {
  const s = raw.normalize('NFKC');
  return (
    s.includes('・') ||                          // 中黒区切り（複数社連名）
    /他(\d|社|件)?(\s|[）)）]|$)/.test(s) || // 「他」「他3社」等で終わる
    s.includes('共同出資') ||
    s.includes('コンソーシアム')
  );
}

// ──────────────────────────────────────
// メイン
// ──────────────────────────────────────

async function main() {
  console.log('[precompute-operator-ranking] 開始...');

  // 1. 全 projects 取得（1回のみ、鉄則#93）
  const projects = await getAllProjects();
  console.log(`[precompute-operator-ranking] projects: ${projects.length}件`);

  // 2. 全 operators 取得 → name/alias → slug マッピング（build 時のみ）
  const operators = await getAllOperators();
  console.log(`[precompute-operator-ranking] operators: ${operators.length}件`);

  // 正規化キー → slug（operators DB）
  const normalizedNameToSlug = new Map<string, string>();
  const rawNameToSlug = new Map<string, string>();

  for (const op of operators) {
    // raw name → slug
    rawNameToSlug.set(op.name.trim().normalize('NFKC'), op.slug);

    // 正規化キー → slug（法人格除去後）
    const normKey = normalizeOperatorKey(op.name);
    if (!normalizedNameToSlug.has(normKey)) {
      normalizedNameToSlug.set(normKey, op.slug);
    }

    // aliases
    if (op.aliases) {
      for (const alias of op.aliases.split('\n')) {
        const a = alias.trim();
        if (a.length < 2) continue;
        rawNameToSlug.set(a.normalize('NFKC'), op.slug);
        const aliasKey = normalizeOperatorKey(a);
        if (!normalizedNameToSlug.has(aliasKey)) {
          normalizedNameToSlug.set(aliasKey, op.slug);
        }
      }
    }
  }

  /** slug を解決（正規化キー → raw → fallback null）*/
  function resolveSlug(rawOp: string): string | null {
    const normKey = normalizeOperatorKey(rawOp);
    return (
      rawNameToSlug.get(rawOp.trim().normalize('NFKC')) ??
      normalizedNameToSlug.get(normKey) ??
      null
    );
  }

  // 3. projects → operator 別集計
  type RawGroup = {
    raw: string;
    projectCount: number;
  };
  type OperatorStats = {
    isJv: boolean;
    displayName: string;
    operatorSlug: string | null;
    totalCapacityMwh: number;
    totalOutputMw: number;
    projectCount: number;
    prefectureSet: Set<string>;
    capacityKnownCount: number;
    rawGroups: Map<string, RawGroup>; // raw → {raw, projectCount}
  };

  const statsMap = new Map<string, OperatorStats>();

  for (const p of projects) {
    const rawOp = p.operator?.trim();
    if (!rawOp) continue;

    const jv = isJointVenture(rawOp);
    // JV: key = raw のまま。それ以外: key = 正規化キー
    const key = jv ? rawOp.normalize('NFKC') : normalizeOperatorKey(rawOp);

    if (!statsMap.has(key)) {
      statsMap.set(key, {
        isJv: jv,
        displayName: rawOp, // 後で rawGroups で更新
        operatorSlug: null,
        totalCapacityMwh: 0,
        totalOutputMw: 0,
        projectCount: 0,
        prefectureSet: new Set(),
        capacityKnownCount: 0,
        rawGroups: new Map(),
      });
    }

    const stats = statsMap.get(key)!;
    stats.projectCount += 1;

    // rawGroups 更新
    const rg = stats.rawGroups.get(rawOp) ?? { raw: rawOp, projectCount: 0 };
    rg.projectCount += 1;
    stats.rawGroups.set(rawOp, rg);

    // 容量・出力（null/0 は除外、現行どおり）
    if (p.capacityMwh && p.capacityMwh > 0) {
      stats.totalCapacityMwh += p.capacityMwh;
      stats.capacityKnownCount += 1;
    }
    if (p.outputMw && p.outputMw > 0) {
      stats.totalOutputMw += p.outputMw;
    }
    if (p.prefecture) {
      stats.prefectureSet.add(p.prefecture);
    }
  }

  // 4. displayName と slug を確定（件数最多 raw を代表名に）
  for (const stats of statsMap.values()) {
    const groups = Array.from(stats.rawGroups.values()).sort(
      (a, b) => b.projectCount - a.projectCount || b.raw.length - a.raw.length
    );
    stats.displayName = groups[0].raw;

    // slug: 件数最多 raw から順に解決を試みる（最初に解決できたもの）
    for (const g of groups) {
      const slug = resolveSlug(g.raw);
      if (slug) {
        stats.operatorSlug = slug;
        break;
      }
    }
  }

  // 5. 容量あり / なし に分離
  const withCapacity: OperatorStats[] = [];
  const noCapacity: OperatorStats[] = [];

  for (const stats of statsMap.values()) {
    if (stats.totalCapacityMwh > 0) {
      withCapacity.push(stats);
    } else {
      noCapacity.push(stats);
    }
  }

  // 6. ソート
  withCapacity.sort(
    (a, b) =>
      b.totalCapacityMwh - a.totalCapacityMwh ||
      b.projectCount - a.projectCount ||
      a.displayName.localeCompare(b.displayName, 'ja')
  );
  noCapacity.sort(
    (a, b) =>
      b.projectCount - a.projectCount ||
      a.displayName.localeCompare(b.displayName, 'ja')
  );

  // 7. Top50 or 全社
  const top50 = withCapacity.slice(0, 50);

  // 8. 監査ログ（2件以上の raw が統合されたキーのみ列挙）
  const nameNormalizationLog = Array.from(statsMap.values())
    .filter((s) => s.rawGroups.size >= 2)
    .map((s) => ({
      displayName: s.displayName,
      mergedFrom: Array.from(s.rawGroups.keys()).sort(),
    }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'ja'));

  // 9. 出力 JSON
  const output = {
    generatedAt: new Date().toISOString(),
    source: 'bess-net projects (microCMS)',
    totalProjects: projects.length,
    totalOperators: statsMap.size,
    ranking: top50.map((s, i) => ({
      rank: i + 1,
      operator: s.displayName,
      operatorSlug: s.operatorSlug,
      isJv: s.isJv,
      mergedFrom: Array.from(s.rawGroups.keys()).sort(),
      totalCapacityMwh: Math.round(s.totalCapacityMwh * 10) / 10,
      totalOutputMw: Math.round(s.totalOutputMw * 10) / 10,
      projectCount: s.projectCount,
      prefectures: s.prefectureSet.size,
      capacityKnownCount: s.capacityKnownCount,
    })),
    noCapacityOperators: noCapacity.map((s) => ({
      operator: s.displayName,
      operatorSlug: s.operatorSlug,
      isJv: s.isJv,
      projectCount: s.projectCount,
      prefectures: s.prefectureSet.size,
    })),
    nameNormalizationLog,
  };

  const outPath = path.resolve(process.cwd(), 'src/data/operator-ranking.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log('[precompute-operator-ranking] 完了');
  console.log(`  totalProjects   : ${output.totalProjects}`);
  console.log(`  totalOperators  : ${output.totalOperators}`);
  console.log(`  rankingRows     : ${output.ranking.length}（Top50 or 全社）`);
  console.log(`  noCapacityRows  : ${output.noCapacityOperators.length}`);
  if (output.ranking.length > 0) {
    const t = output.ranking[0];
    console.log(`  Top1            : ${t.operator} / ${t.totalCapacityMwh}MWh / ${t.projectCount}件`);
  }
  console.log(`\n--- nameNormalizationLog（統合グループ ${nameNormalizationLog.length}件）---`);
  for (const g of nameNormalizationLog) {
    console.log(`  "${g.displayName}" <= [ ${g.mergedFrom.join(' / ')} ]`);
  }
}

main().catch((err) => {
  console.error('[precompute-operator-ranking] エラー:', err);
  process.exit(1);
});
