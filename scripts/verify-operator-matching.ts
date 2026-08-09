#!/usr/bin/env tsx
/**
 * scripts/verify-operator-matching.ts
 *
 * /operators の突合（実案件・関連ニュース）の**回帰検査**。
 * 突合ロジックを変えるたびに走らせ、「実在する紐付けを落としていないか」を機械判定する。
 *
 * 背景（2026-08-09）: Op1/Op2 の厳格化が効きすぎ、事業者欄が「レノバ」「丸紅」のように
 * 略称で入っている案件を取りこぼしていた（株式会社レノバ=0件／実在6件）。
 * 以後は本検査で 0件 を維持する。
 *
 * 判定:
 *   ✅ falseNegativeProjects / falseNegativeNews が 0件
 *   ✅ 暴発の実測値が既知の上限を超えない（ポート/パス＝本文一致0本 を維持）
 *
 * 入力: src/lib/generated/operators-match-audit.json（precompute-operators-detail が生成）
 * 実行: npm run verify:operators   ※microCMS へのアクセスなし
 */
import * as fs from 'node:fs';
import * as path from 'node:path';

type FalseNegative = { operator: string; key: string; value: string };
type Audit = {
  totals: Record<string, number>;
  falseNegativeProjects: FalseNegative[];
  falseNegativeNews: FalseNegative[];
  overreach: Record<string, { title: number; project: number }>;
};

/** 暴発の上限（実測値・2026-08-09）。素の部分一致に戻すと ポート=174本 に跳ねる。 */
const OVERREACH_LIMIT: Record<string, number> = {
  ポート株式会社: 0,
  パス株式会社: 0,
  株式会社テス: 3,
  東急株式会社: 3,
};

function main(): void {
  const auditPath = path.join(process.cwd(), 'src', 'lib', 'generated', 'operators-match-audit.json');
  if (!fs.existsSync(auditPath)) {
    console.error(`[verify-operator-matching] 監査データがありません: ${auditPath}`);
    console.error('  先に npm run build:operators-detail を実行してください。');
    process.exit(1);
  }
  const audit: Audit = JSON.parse(fs.readFileSync(auditPath, 'utf8'));
  const problems: string[] = [];

  console.log('[verify-operator-matching] 突合の回帰検査');
  console.log(
    `  対象: operators=${audit.totals.operators} projects=${audit.totals.projectsVisible} news=${audit.totals.newsTotal}`
  );
  console.log(`  接続: project=${audit.totals.projectLinks}件 news=${audit.totals.newsLinks}件`);

  // 1) 偽陰性（0件表示なのに構造化フィールドに社名が現れる）
  for (const [label, rows] of [
    ['projects', audit.falseNegativeProjects],
    ['news', audit.falseNegativeNews],
  ] as const) {
    if (rows.length === 0) {
      console.log(`  ✅ 偽陰性(${label}) = 0件`);
    } else {
      console.log(`  ❌ 偽陰性(${label}) = ${rows.length}件`);
      for (const r of rows) console.log(`      ${r.operator} ⇢ ${r.key}「${r.value}」`);
      problems.push(`偽陰性(${label}) ${rows.length}件`);
    }
  }

  // 2) 暴発（短い社名が本文・事業者欄で暴れていないか）
  for (const [name, limit] of Object.entries(OVERREACH_LIMIT)) {
    const m = audit.overreach[name];
    if (!m) {
      console.log(`  －  暴発チェック ${name}: 事業者マスタに未登録（スキップ）`);
      continue;
    }
    if (m.title <= limit) {
      console.log(`  ✅ 暴発チェック ${name}: title一致=${m.title}本（上限${limit}） project=${m.project}件`);
    } else {
      console.log(`  ❌ 暴発チェック ${name}: title一致=${m.title}本 > 上限${limit}`);
      problems.push(`暴発 ${name} ${m.title}本`);
    }
  }

  if (problems.length) {
    console.error(`\n[verify-operator-matching] FAIL: ${problems.join(' / ')}`);
    process.exit(1);
  }
  console.log('\n[verify-operator-matching] PASS');
}

main();

export {};
