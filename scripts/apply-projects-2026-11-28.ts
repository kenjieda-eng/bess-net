#!/usr/bin/env tsx
/**
 * scripts/apply-projects-2026-11-28.ts — 日本蓄電池の新しい発表 4 本の便（_QUEUE.md 144 行）の applier
 *
 * 計画 JSON: POST は scripts/build-projects-posts-2026-11-28.ts が書く（reports/projects-weekly-nc-posts-2026-11-28.json・既定）／
 * PATCH は scripts/build-projects-2026-11-28.ts --part=J が書く（reports/projects-weekly-nc-patch-2026-11-28.json＝--plan= で渡す）。中身は scripts/lib/microcms-applier.ts。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。webhook は止めない。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-2026-11-28.ts [--plan=…] [--apply] [--only=projects/slug,…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects 11-28 applier', defaultPlanPath: 'reports/projects-weekly-nc-posts-2026-11-28.json' })
  .catch((e) => { console.error(e); process.exit(1); });
