#!/usr/bin/env tsx
/**
 * scripts/apply-projects-2026-11-23.ts — 11/23 の 2 便（_QUEUE.md 139 行「projects の小さな直し」・140 行「九電工の別名」）の applier
 *
 * 計画 JSON は 139 行: scripts/build-projects-2026-11-23.ts が書く（reports/projects-smallfix-2026-11-23.json・PATCH 5 件）／
 * 140 行: scripts/build-operators-alias-2026-11-23.ts が書く（reports/operators-alias-kyudenko-2026-11-23.json・operators の PATCH 1 件＝--plan= で渡す）。POST 0。中身は scripts/lib/microcms-applier.ts。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。webhook は止めない。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-2026-11-23.ts [--plan=…] [--apply] [--only=projects/slug,…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects 11-23 applier', defaultPlanPath: 'reports/projects-smallfix-2026-11-23.json' })
  .catch((e) => { console.error(e); process.exit(1); });
