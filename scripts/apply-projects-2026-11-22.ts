#!/usr/bin/env tsx
/**
 * scripts/apply-projects-2026-11-22.ts — projects の 11/22 の 2 便（_QUEUE.md 132 行「掃除その 2」・133 行「名前の直し」）の applier
 *
 * 計画 JSON は scripts/build-projects-2026-11-22.ts が書く（132 行: reports/projects-cleanup2-A-2026-11-22.json・PATCH 4 件／
 * 133 行: reports/projects-names-2026-11-22.json・PATCH 14 件＝--plan= で渡す）。POST 0。中身は scripts/lib/microcms-applier.ts。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。webhook は止めない。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-2026-11-22.ts [--plan=…] [--apply] [--only=projects/slug,…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects 11-22 applier', defaultPlanPath: 'reports/projects-cleanup2-A-2026-11-22.json' })
  .catch((e) => { console.error(e); process.exit(1); });
