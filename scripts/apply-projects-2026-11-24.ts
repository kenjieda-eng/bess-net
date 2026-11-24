#!/usr/bin/env tsx
/**
 * scripts/apply-projects-2026-11-24.ts — projects の掃除便その 5（_QUEUE.md 141 行）の applier
 *
 * 計画 JSON は scripts/build-projects-2026-11-24.ts が書く（reports/projects-cleanup5-2026-11-24.json・PATCH 8 件）。POST 0。中身は scripts/lib/microcms-applier.ts。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。webhook は止めない。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-2026-11-24.ts [--plan=…] [--apply] [--only=projects/slug,…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects 11-24 applier', defaultPlanPath: 'reports/projects-cleanup5-2026-11-24.json' })
  .catch((e) => { console.error(e); process.exit(1); });
