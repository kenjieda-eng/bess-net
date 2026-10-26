#!/usr/bin/env tsx
/**
 * scripts/apply-subsidies-weekly-2026-10-26.ts — 補助金 月曜定例 10-26 の subsidies PATCH 4 レコード（8 op）の applier
 *
 * 計画 JSON は reports/subsidies-weekly-2026-10-26.data.json の `plan`（月曜定例 10-26 にユウが一次照合して起草した計画をそのままコピー）。
 * 鳥取県・滋賀県の受付終了・愛媛県の受付期間の延伸と補助対象エリアの拡大・栃木県の締切に年を入れる。
 * 中身は scripts/lib/microcms-applier.ts（共通）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-subsidies-weekly-2026-10-26.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '補助金 月曜定例 10-26 applier', defaultPlanPath: 'reports/subsidies-weekly-2026-10-26.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
