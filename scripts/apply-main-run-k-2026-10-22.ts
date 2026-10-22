#!/usr/bin/env tsx
/**
 * scripts/apply-main-run-k-2026-10-22.ts — 本実行便 10-22 の applier ①（K: 事業者 operators 148 レコード）
 *
 * 計画 JSON は reports/main-run-2026-10-22.k-plan.json の `plan`。
 * T6 収集便の plan（「登録」→「届出」145 レコード・311 op）と、グループ会社 3 件（JERA→JERA Cross・自然電力→Shizen Connect・
 * 東芝エネルギーシステムズ→株式会社東芝）を、T6 裁定（2026-10-20）どおり文のまま当てる。
 * 中身は scripts/lib/microcms-applier.ts（共通）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 * operators には webhook がある → 本実行は webhook OFF の窓で（本実行便 §3）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-main-run-k-2026-10-22.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '本実行便 10-22 applier ①K', defaultPlanPath: 'reports/main-run-2026-10-22.k-plan.json' })
  .catch((e) => { console.error(e); process.exit(1); });
