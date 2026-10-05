#!/usr/bin/env tsx
/**
 * scripts/apply-subsidies-weekly-2026-10-05.ts — 補助金 月曜定例 10/5 の subsidies PATCH 3 レコード（4 entry）の applier
 *
 * 計画 JSON は reports/subsidies-weekly-2026-10-05.data.json の `plan`（月曜定例 10/5 にユウが一次照合して起草した計画をそのままコピー）。
 * 中身は scripts/lib/microcms-applier.ts（Ck-2 実行便②・ATB2025 追随便と共通）。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-subsidies-weekly-2026-10-05.ts [--apply] [--only=ep/slug,…] [--orders=1,2,4] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '補助金 月曜定例 10-05 applier', defaultPlanPath: 'reports/subsidies-weekly-2026-10-05.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
