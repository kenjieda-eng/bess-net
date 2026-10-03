#!/usr/bin/env tsx
/**
 * scripts/apply-atb2025-2026-10-02.ts — ATB2025 追随便の explainer PATCH 2 の applier
 *
 * 計画 JSON は reports/atb-2025-followup-2026-10-02.data.json の `plan`。
 * 中身は scripts/lib/microcms-applier.ts（Ck-2 実行便②と共通・Ck2d ■2 で切り出し・挙動は不変）。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-atb2025-2026-10-02.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'ATB2025 追随便 applier', defaultPlanPath: 'reports/atb-2025-followup-2026-10-02.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
