#!/usr/bin/env tsx
/**
 * scripts/apply-operators-post-2026-10-05.ts — operators POST 便（3 社: コレックHD・グローム・HD・CHC Japan）の applier
 *
 * 計画 JSON は reports/operators-post-3-2026-10-05.data.json の `plan`（posts 3・patches 0）。
 * 中身は scripts/lib/microcms-applier.ts（slug が既存なら skip・POST 後に GET して全 field 照合＝#106 の選択肢の黙落ちを検出）。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-operators-post-2026-10-05.ts [--apply] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'operators POST 便 10-05 applier', defaultPlanPath: 'reports/operators-post-3-2026-10-05.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
