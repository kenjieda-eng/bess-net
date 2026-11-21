#!/usr/bin/env tsx
/**
 * scripts/apply-projects-2026-11-21.ts — projects の合計を正す便（重複 6 組の統合・計画 4 件の除外・_QUEUE.md 129 行）の applier
 *
 * 計画 JSON は reports/projects-totals-fix-2026-11-21.json の `plan`（scripts/build-projects-totals-2026-11-21.ts が、
 * ユウの計画 reports/projects-plan-2026-11-21_ユウ.json を書込直前の GET で確かめて作る）。PATCH 7 件（23 op）・POST 0。
 * 中身は scripts/lib/microcms-applier.ts（PATCH は old がちょうど 1 回のときだけ置換・送っていない field の変化 0・数値／配列／空欄は
 * JSON 値モード・expect_final で冪等）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。webhook は止めない（書込 7 件）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-2026-11-21.ts [--apply] [--only=projects/slug,…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects の合計を正す便 11-21 applier', defaultPlanPath: 'reports/projects-totals-fix-2026-11-21.json' })
  .catch((e) => { console.error(e); process.exit(1); });
