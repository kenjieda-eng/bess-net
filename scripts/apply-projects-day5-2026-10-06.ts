#!/usr/bin/env tsx
/**
 * scripts/apply-projects-day5-2026-10-06.ts — projects 便 Day5（新規 POST・既存 PATCH）の applier
 *
 * 計画 JSON は scripts/projects-day5-plan-2026-10-06.json の `plan`（便: projects便_Day5_…_2026-10-06起草_ユウ.md）。
 * 中身は scripts/lib/microcms-applier.ts（POST は slug が既存なら skip・POST/PATCH 後に GET して全 field 照合＝#106、
 * PATCH は old がちょうど 1 回のときだけ置換・送っていない field の変化 0 を確認）。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-day5-2026-10-06.ts [--apply] [--orders=1] [--only=ep/slug,…] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects 便 Day5 applier', defaultPlanPath: 'scripts/projects-day5-plan-2026-10-06.json' })
  .catch((e) => { console.error(e); process.exit(1); });
