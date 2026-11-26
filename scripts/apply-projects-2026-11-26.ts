#!/usr/bin/env tsx
/**
 * scripts/apply-projects-2026-11-26.ts — au×JPN の 3 拠点の登録とサムスン物産の別名の便（_QUEUE.md 143 行）の applier
 *
 * 計画 JSON: projects の POST 3 件は scripts/build-projects-posts-2026-11-26.ts が書く（reports/projects-au-jpn-3sites-2026-11-26.json・既定）／
 * operators の PATCH 1 件は scripts/build-operators-alias-2026-11-26.ts が書く（reports/operators-alias-samsung-2026-11-26.json＝--plan= で渡す）。中身は scripts/lib/microcms-applier.ts。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。webhook は止めない。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-2026-11-26.ts [--plan=…] [--apply] [--only=ep/slug,…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects 11-26 applier', defaultPlanPath: 'reports/projects-au-jpn-3sites-2026-11-26.json' })
  .catch((e) => { console.error(e); process.exit(1); });
