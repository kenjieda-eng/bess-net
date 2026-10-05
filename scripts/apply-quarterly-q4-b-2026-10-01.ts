#!/usr/bin/env tsx
/**
 * scripts/apply-quarterly-q4-b-2026-10-01.ts — 四半期Q4 便B ■B-1 の explainer PATCH 5 レコードの applier
 *
 * 計画 JSON は reports/quarterly-q4-b-2026-10-01.data.json の `plan`（op ごとの marker＝#122 の冪等キーも同じファイル）。
 * 中身は scripts/lib/microcms-applier.ts（Ck-2 実行便②・ATB2025 追随便と共通）。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-quarterly-q4-b-2026-10-01.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '四半期Q4 便B applier', defaultPlanPath: 'reports/quarterly-q4-b-2026-10-01.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
