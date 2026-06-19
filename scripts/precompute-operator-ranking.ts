#!/usr/bin/env tsx
/**
 * scripts/precompute-operator-ranking.ts
 * 依頼65: projects → operator 別集計 → src/data/operator-ranking.json
 * 鉄則#2/#3: build 時 1 回のみ microCMS 取得、ランタイム 0 リクエスト
 * 実行: npm run build:operator-ranking (prebuild フック)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import { getAllProjects, getAllOperators } from '../src/lib/microcms';

// 全角→半角統一 + trim（表記ゆれ対策の最小正規化）
function normalizeOpName(name: string): string {
  return name.trim().normalize('NFKC').replace(/\s+/g, ' ');
}

async function main() {
  console.log('[precompute-operator-ranking] 開始...');

  // 1. 全 projects 取得（1回のみ、鉄則#93 memoization 対応）
  const projects = await getAllProjects();
  console.log(`[precompute-operator-ranking] projects: ${projects.length}件`);

  // 2. 全 operators 取得 → name/alias → slug マッピング構築（build 時のみ）
  const operators = await getAllOperators();
  console.log(`[precompute-operator-ranking] operators: ${operators.length}件`);

  const nameToSlug = new Map<string, string>();
  for (const op of operators) {
    const normalized = normalizeOpName(op.name);
    if (!nameToSlug.has(normalized)) {
      nameToSlug.set(normalized, op.slug);
    }
    // aliases（改行区切り）
    if (op.aliases) {
      for (const alias of op.aliases.split('\n')) {
        const a = normalizeOpName(alias);
        if (a.length >= 2 && !nameToSlug.has(a)) {
          nameToSlug.set(a, op.slug);
        }
      }
    }
  }

  // 3. projects → operator 別集計
  type OperatorStats = {
    operator: string;          // 元の表記（代表値）
    operatorSlug: string | null;
    totalCapacityMwh: number;
    totalOutputMw: number;
    projectCount: number;
    prefectureSet: Set<string>;
    capacityKnownCount: number; // capacityMwh > 0 の件数
  };

  const statsMap = new Map<string, OperatorStats>();

  for (const p of projects) {
    const rawOp = p.operator?.trim();
    if (!rawOp) continue; // operator 未登録は除外

    const key = normalizeOpName(rawOp);

    if (!statsMap.has(key)) {
      statsMap.set(key, {
        operator: rawOp,
        operatorSlug: nameToSlug.get(key) ?? null,
        totalCapacityMwh: 0,
        totalOutputMw: 0,
        projectCount: 0,
        prefectureSet: new Set(),
        capacityKnownCount: 0,
      });
    }

    const stats = statsMap.get(key)!;
    stats.projectCount += 1;

    // null/undefined/0 は除外（/projects「調査中」と同一規約、L-EIC-024 §3）
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

  // 4. 容量あり / なし に分離
  const withCapacity: OperatorStats[] = [];
  const noCapacity: OperatorStats[] = [];

  for (const stats of statsMap.values()) {
    if (stats.totalCapacityMwh > 0) {
      withCapacity.push(stats);
    } else {
      noCapacity.push(stats);
    }
  }

  // 5. ソート
  // 容量あり: 容量降順 → 件数降順 → 名前昇順
  withCapacity.sort(
    (a, b) =>
      b.totalCapacityMwh - a.totalCapacityMwh ||
      b.projectCount - a.projectCount ||
      a.operator.localeCompare(b.operator, 'ja')
  );
  // 容量なし: 件数降順 → 名前昇順
  noCapacity.sort(
    (a, b) =>
      b.projectCount - a.projectCount ||
      a.operator.localeCompare(b.operator, 'ja')
  );

  // 6. Top50 or 全社（50社未満なら全社、透明性優先）
  const top50 = withCapacity.slice(0, 50);

  // 7. 出力 JSON
  const output = {
    generatedAt: new Date().toISOString(),
    source: 'bess-net projects (microCMS)',
    totalProjects: projects.length,
    totalOperators: statsMap.size,
    ranking: top50.map((s, i) => ({
      rank: i + 1,
      operator: s.operator,
      operatorSlug: s.operatorSlug,
      totalCapacityMwh: Math.round(s.totalCapacityMwh * 10) / 10,
      totalOutputMw: Math.round(s.totalOutputMw * 10) / 10,
      projectCount: s.projectCount,
      prefectures: s.prefectureSet.size,
      capacityKnownCount: s.capacityKnownCount,
    })),
    noCapacityOperators: noCapacity.map((s) => ({
      operator: s.operator,
      operatorSlug: s.operatorSlug,
      projectCount: s.projectCount,
      prefectures: s.prefectureSet.size,
    })),
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
}

main().catch((err) => {
  console.error('[precompute-operator-ranking] エラー:', err);
  process.exit(1);
});
