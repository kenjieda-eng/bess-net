#!/usr/bin/env tsx
/**
 * scripts/apply-subsidies-weekly-2026-11-09b.ts — 補助金 月曜定例 11-09b（追い便）の subsidies PATCH 1 レコード（1 op）の applier
 *
 * 計画 JSON は reports/subsidies-weekly-2026-11-09b.data.json の `plan`（月曜定例 11-09b にユウが一次照合して起草した計画をそのままコピー）。
 * 業務産業用（小規模）の概要の欄（scheme）に残る「公募期間2026-03-24〜10-30（公募中）。」を「（2026年10月30日に公募終了）。」に。
 * 中身は scripts/lib/microcms-applier.ts（共通）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-subsidies-weekly-2026-11-09b.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '補助金 月曜定例 11-09b applier', defaultPlanPath: 'reports/subsidies-weekly-2026-11-09b.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
