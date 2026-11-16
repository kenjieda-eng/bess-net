#!/usr/bin/env tsx
/**
 * scripts/apply-projects-2026-11-16b.ts — projects の小さな直し便（ADW の益城町と松阪・_QUEUE.md 116 行）の applier
 *
 * 計画 JSON は reports/projects-write-2026-11-16b.json の `plan`（scripts/build-projects-write-2026-11-16b.ts が、
 * ユウの計画 reports/projects-plan-2026-11-15b_ユウ.json を書込直前の GET で確かめて作る）。
 * 中身は scripts/lib/microcms-applier.ts（PATCH は old がちょうど 1 回のときだけ置換・PATCH 後に GET して送った欄の一致と
 * 送っていない欄の変化 0 を確認＝#106・expect_final で冪等）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 * webhook は止めない（便 §0・書込 2 件）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-2026-11-16b.ts [--apply] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects 小さな直し便 11-16b applier', defaultPlanPath: 'reports/projects-write-2026-11-16b.json' })
  .catch((e) => { console.error(e); process.exit(1); });
