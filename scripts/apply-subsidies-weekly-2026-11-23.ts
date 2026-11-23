#!/usr/bin/env tsx
/**
 * scripts/apply-subsidies-weekly-2026-11-23.ts — 補助金 月曜定例 11-23 の subsidies PATCH 1 レコード（3 op）の applier
 *
 * 計画 JSON は reports/subsidies-weekly-2026-11-23.data.json の `plan`（月曜定例 11-23 に自走のユウが一次照合して起草した計画のコピー。
 * 実行日が 2026-11-23・県のページの更新日が 2026年11月13日のため、中身は変えていない）。
 * 鹿児島県「再エネ設備と蓄電池を併用した先進的な取組導入支援事業（R8年度）」（kagoshima-saiene-chikudenchi-2026）の四次募集
 * （応募申請書提出期限 2026年12月25日）を反映し、締切が過ぎた三次募集のままで「受付終了」と出ていた表示を「公募中」に戻す。
 * 中身は scripts/lib/microcms-applier.ts（共通）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-subsidies-weekly-2026-11-23.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '補助金 月曜定例 11-23 applier', defaultPlanPath: 'reports/subsidies-weekly-2026-11-23.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
