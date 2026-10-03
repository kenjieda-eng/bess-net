#!/usr/bin/env tsx
/**
 * scripts/apply-ck2-exec2-2026-09-29.ts — Ck-2 実行便②（microCMS 便）の applier
 *
 * 計画 JSON（reports/ck2-exec-2-2026-09-29.data.json の `plan`）を読んで dry run → 適用する（Ck-1a の applier 方式）。
 * 中身は scripts/lib/microcms-applier.ts（ATB2025 追随便と共通・Ck2d ■2 で切り出し・挙動は不変）。
 *
 * ★2026-10-03（Ck2d・R32）から既定は dry run。本実行は --apply を明示したときだけ。
 *   以前は --dry-run を付けないと本実行になり、2026-09-29 に冪等確認のつもりで本実行して用語集 3 レコードに
 *   意図しない PATCH が入った（即復元・本番未露出）。--dry-run は受け付けて無視する（既定と同じ）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-ck2-exec2-2026-09-29.ts [--apply] [--only=ep/slug,…] [--orders=1,2] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'Ck-2 実行便② applier', defaultPlanPath: 'reports/ck2-exec-2-2026-09-29.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
