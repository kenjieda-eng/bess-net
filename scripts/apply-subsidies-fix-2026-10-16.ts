#!/usr/bin/env tsx
/**
 * scripts/apply-subsidies-fix-2026-10-16.ts — 補助金 直し便 10-16 の applier（subsidies PATCH 1 レコード・5 op＋POST 1）
 *
 * 計画 JSON は reports/subsidies-fix-2026-10-16.data.json の `plan`（ユウが一次照合して起草した計画のコピー。実行日 10/17 に合わせて
 * 本文の「時点」「確認」の日付だけを替えた＝executed_note）。鹿児島県の三次募集（11/6 必着）の反映と、埼玉県の 3 次募集（11/9 必着）の掲載。
 * 中身は scripts/lib/microcms-applier.ts（Ck-2 実行便②・ATB2025 追随便・補助金 月曜定例 10-12 と共通）。
 * 既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-subsidies-fix-2026-10-16.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '補助金 直し便 10-16 applier', defaultPlanPath: 'reports/subsidies-fix-2026-10-16.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
