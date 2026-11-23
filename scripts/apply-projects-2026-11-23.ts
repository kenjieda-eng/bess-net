#!/usr/bin/env tsx
/**
 * scripts/apply-projects-2026-11-23.ts — projects の小さな直し便（_QUEUE.md 139 行）の applier
 *
 * 計画 JSON は scripts/build-projects-2026-11-23.ts が書く（reports/projects-smallfix-2026-11-23.json・PATCH 5 件）。POST 0。中身は scripts/lib/microcms-applier.ts。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。webhook は止めない。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-2026-11-23.ts [--plan=…] [--apply] [--only=projects/slug,…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects 11-23 applier', defaultPlanPath: 'reports/projects-smallfix-2026-11-23.json' })
  .catch((e) => { console.error(e); process.exit(1); });
