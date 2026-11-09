#!/usr/bin/env tsx
/**
 * scripts/apply-subsidies-weekly-2026-11-09.ts — 補助金 月曜定例 11-09 の subsidies PATCH 3 レコード（4 op）の applier
 *
 * 計画 JSON は reports/subsidies-weekly-2026-11-09.data.json の `plan`（月曜定例 11-09 にユウが一次照合して起草した計画をそのままコピー）。
 * SII の R7 補正 3 事業（業務産業用〔小規模〕・大規模業務産業用・再エネ電源併設）の締切の文面を一次の掲示に合わせ、業務産業用（小規模）の status を「採択結果公表」に。
 * 中身は scripts/lib/microcms-applier.ts（共通）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-subsidies-weekly-2026-11-09.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '補助金 月曜定例 11-09 applier', defaultPlanPath: 'reports/subsidies-weekly-2026-11-09.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
