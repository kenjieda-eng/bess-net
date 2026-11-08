#!/usr/bin/env tsx
/**
 * scripts/apply-projects-stage2-2026-11-08.ts — projects 便・段 2（ニュースに出た設備の登録と更新・POST 33・PATCH 11 件）の applier
 *
 * 計画 JSON は reports/projects-write-2026-11-08.json の `plan`（段 1 の計画 reports/projects-plan-2026-11-07.json に、
 * ユウの裁定〔検証記録_小さな直し便11-07・projects段1_裁定_2026-11-07_ユウ.md B〕を当てたもの）。
 * 中身は scripts/lib/microcms-applier.ts（POST は slug が既存なら skip・POST/PATCH 後に GET して全 field 照合＝#106、
 * PATCH は old がちょうど 1 回のときだけ置換・送っていない field の変化 0 を確認・配列と空欄は JSON 値モード）。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。projects の API には webhook があるので、
 * 本実行の前に EDAさんが止める（便 §0）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-projects-stage2-2026-11-08.ts [--apply] [--orders=1] [--only=ep/slug,…] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: 'projects 便・段 2 applier', defaultPlanPath: 'reports/projects-write-2026-11-08.json' })
  .catch((e) => { console.error(e); process.exit(1); });
