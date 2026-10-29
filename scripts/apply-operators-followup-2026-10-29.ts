/**
 * scripts/apply-operators-followup-2026-10-29.ts — 事業者の追修便 10-29 の applier（operators PATCH 17 レコード・DELETE/PUT/POST 0）
 *
 * SII の「蓄電池アグリゲーター登録」を名乗る 11 社の記述の削除・言い方の直し 5 件・静岡県 0円ソーラーの名称。
 * 計画は reports/operators-followup-2026-10-29.data.json（op の old は 2026-10-29 の GET にちょうど 1 回・expect_final つき）。
 * 既定は dry run。本実行は --apply（R32）。
 *   set -a && . ./.env.local && set +a && npx tsx scripts/apply-operators-followup-2026-10-29.ts [--apply] [--log=<path>]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({
  label: '事業者の追修便 10-29 applier（operators）',
  defaultPlanPath: 'reports/operators-followup-2026-10-29.data.json',
});
