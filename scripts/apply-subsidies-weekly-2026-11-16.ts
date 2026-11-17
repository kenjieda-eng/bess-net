#!/usr/bin/env tsx
/**
 * scripts/apply-subsidies-weekly-2026-11-16.ts — 補助金 月曜定例 11-16 の subsidies PATCH 1 レコード（3 op）の applier
 *
 * 計画 JSON は reports/subsidies-weekly-2026-11-16.data.json の `plan`（月曜定例 11-16 にユウが一次照合して起草した計画のコピー。
 * 実行日が 2026-11-17 のため、便の ★ のとおり W1116-03 の new の「【2026-11-16 更新】」「2026年11月16日時点」の 2 か所だけを 11-17 に替えた）。
 * 環境省 ストレージパリティ R8（moe-storage-parity-r08）の二次公募の採択結果（2026-10-28 EIC 機構公表）を反映し、status を「採択結果公表」に。
 * 中身は scripts/lib/microcms-applier.ts（共通）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-subsidies-weekly-2026-11-16.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '補助金 月曜定例 11-16 applier', defaultPlanPath: 'reports/subsidies-weekly-2026-11-16.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
