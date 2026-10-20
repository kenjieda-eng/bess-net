#!/usr/bin/env tsx
/**
 * scripts/apply-operators-website-2026-10-20.ts — 公式サイト欄の直し便 10-20 の applier（operators PATCH 9 レコード・websiteUrl だけ）
 *
 * 計画 JSON は reports/operators-website-fix-2026-10-20.data.json の `plan`。
 * 「公式サイト」が本人のサイトでない 9 レコード（T6 報告 registrationAudit.websiteIssues）を、curl と国税庁 法人番号公表サイトで
 * 社名・所在地を確かめ直した結果で、差し替え 7・空にする 2（global-engineering＝オンラインカジノのページ・centrica-jp＝日本法人の公式を特定できず）。
 * 中身は scripts/lib/microcms-applier.ts（共通）。既定は dry run。本実行は --apply を明示したときだけ（R32・#125）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/apply-operators-website-2026-10-20.ts [--apply] [--only=ep/slug,…] [--orders=1] [--plan=…] [--log=…]
 */
import { runApplier } from './lib/microcms-applier';
export {};

runApplier({ label: '公式サイト欄の直し便 10-20 applier', defaultPlanPath: 'reports/operators-website-fix-2026-10-20.data.json' })
  .catch((e) => { console.error(e); process.exit(1); });
