#!/usr/bin/env tsx
/**
 * scripts/apply-capacity-output-design-2026-10-27.ts — 解説の直し便（explainer/capacity-output-design の 7 op・PATCH 1 レコード）の applier
 *
 * 計画 JSON は reports/capacity-output-design-2026-10-27.data.json の `plan`。
 * 10/22 の本実行から外した 7 op（Ck2e 第 5 版 order 22）を土台に、まとめの容量市場の行（op6）を一次
 * （容量市場 業務マニュアル 実需給期間中リクワイアメント対応（発動指令電源）編 p.12 の表）どおりの書き方に差し替えた計画。
 * expect_final は実行日（2026-10-29）の GET から作った。
 * 中身は scripts/lib/microcms-applier.ts（共通）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-capacity-output-design-2026-10-27.ts [--apply] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '解説の直し便 10-27 applier（capacity-output-design）', defaultPlanPath: 'reports/capacity-output-design-2026-10-27.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
