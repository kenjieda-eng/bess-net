#!/usr/bin/env tsx
/**
 * scripts/apply-projects-2026-11-15.ts — projects 便（11/13 のニュースに出た設備の登録と更新・_QUEUE.md 113 行）の applier
 *
 * 計画 JSON は reports/projects-write-2026-11-15.json の `plan`（scripts/build-projects-write-2026-11-15.ts が、
 * ユウの計画 reports/projects-plan-2026-11-15_ユウ.json を書込直前の GET で確かめて作る）。
 * 中身は scripts/lib/microcms-applier.ts（POST は slug が既存なら skip・POST/PATCH 後に GET して全 field 照合＝#106、
 * PATCH は old がちょうど 1 回のときだけ置換・送っていない field の変化 0・数値／配列／空欄は JSON 値モード・expect_final で冪等）。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。webhook は止めない（便 §0・書込 13 件）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-2026-11-15.ts [--apply] [--orders=1] [--only=projects/slug,…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects 便 11-15 applier', defaultPlanPath: 'reports/projects-write-2026-11-15.json' })
  .catch((e) => { console.error(e); process.exit(1); });
