#!/usr/bin/env tsx
/**
 * scripts/apply-zesei-2026-10-13.ts — 是正便 10-13 の PATCH 2 レコード（policy-events 1・subsidies 1）の applier
 *
 * 計画 JSON は reports/zesei-2026-10-13.data.json の `plan`（是正便 10-13 にユウが一次照合して起草した計画をそのままコピー）。
 * 中身は scripts/lib/microcms-applier.ts（Ck-2 実行便②・ATB2025 追随便と共通）。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-zesei-2026-10-13.ts [--apply] [--only=ep/slug,…] [--orders=1,2] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '是正便 10-13 applier', defaultPlanPath: 'reports/zesei-2026-10-13.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
