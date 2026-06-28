/**
 * src/lib/projects-excluded.ts
 *
 * /projects から「除外＋noindex」する非プロジェクト slug（stage-1監査C・ニュース性）。
 * 非破壊: microCMS データは削除しない。一覧/件数/集計から除外し、各詳細ページは
 * 残したまま noindex（robots index:false）にする＝404を作らない・既存URLは200維持。
 *
 * ★ 厳密区別（slug が紛らわしい・絶対に触らない実プロジェクト）:
 *   - pr-100mwh-bess（Helios 50MW/104MWh・札幌の実案件）は対象外（pr-100mw-bess とは別物）。
 *   - kirishima-bess（霧島蓄電所・3社共同出資の実案件）も対象外。
 * 集合は完全一致（Set.has）なので上記は影響を受けない。
 */
import { PROJECTS_301_SOURCE_SLUGS } from './projects-301';

// 非プロジェクト（ニュース性）8件＝一覧除外＋詳細ページ noindex（ページは残す）
export const EXCLUDED_PROJECT_SLUGS: ReadonlySet<string> = new Set<string>([
  'pr-50-cxo-2-bess',            // セミナー告知
  'pr-iqg-second-foundation-bess', // 資本提携
  'pr-co134284-bess',           // 出資
  'pr-co175281-bess-2',         // 認定告知
  'pr-co138114-bess-2',         // 出資参画
  'pr-jaxa-where-bess',         // 業務提携
  'pr-co109041-bess-2',         // 業務提携（GA4 338秒・noindex でも URL は残るのでアクセス維持）
  'pr-100mw-bess',              // 英国BESS出資参画ニュース（実案件 pr-100mwh-bess とは別）
]);

// 一覧（/projects）除外 = 非プロジェクト8 ∪ 301元6（重複統合・2026-06-28）。
// 301元は middleware が canonical へ 301 するため noindex は不要（一覧からのみ除外）。
export const LIST_EXCLUDED_PROJECT_SLUGS: ReadonlySet<string> = new Set<string>([
  ...EXCLUDED_PROJECT_SLUGS,
  ...PROJECTS_301_SOURCE_SLUGS,
]);

/** 詳細ページ noindex 対象（非プロジェクト8のみ。301元は 301 されるため対象外） */
export function isExcludedProject(slug: string): boolean {
  return EXCLUDED_PROJECT_SLUGS.has(slug);
}

/** /projects 一覧・件数・集計からの除外対象（非プロジェクト8＋301元6） */
export function isListExcludedProject(slug: string): boolean {
  return LIST_EXCLUDED_PROJECT_SLUGS.has(slug);
}
