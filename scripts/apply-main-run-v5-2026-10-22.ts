#!/usr/bin/env tsx
/**
 * scripts/apply-main-run-v5-2026-10-22.ts — 本実行便 10-22 の applier ②③（Ck2e 第5版＋追加 op 10・PATCH 127 レコード／POST 3）
 *
 * 計画 JSON は reports/main-run-2026-10-22.v5-plan.json の `plan`。
 * Ck2e 第5版（reports/ck2e-plan-v5-2026-10-17.data.json）に、10/17 裁定 §4 の追加 op 10（X1〜X10）を足したもの。
 * K（scripts/apply-main-run-k-2026-10-22.ts）の後に当てる。PATCH（② explainer・glossary・subsidies・policy-events・projects・
 * faq・news・links・operators）を API ごとに --only で区切って当て、最後に POST 3（③ SEW 春・秋・RE+）。
 * 中身は scripts/lib/microcms-applier.ts（共通）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 * 見えない差の op（glossary/nite・power-market-price-trend・subsidies/okinawa-ritou-saiene-2025・policy-events/enex-2026 の issuer）は、
 * PATCH 後の GET の生の文字列で別に確かめる（sameValue は plain でも一致とするため）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-main-run-v5-2026-10-22.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '本実行便 10-22 applier ②③第5版', defaultPlanPath: 'reports/main-run-2026-10-22.v5-plan.json' })
  .catch((e) => { console.error(e); process.exit(1); });
