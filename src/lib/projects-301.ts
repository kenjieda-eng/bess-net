/**
 * src/lib/projects-301.ts
 *
 * /projects 重複統合 301 マップの単一情報源（SSOT）。GLOSSARY_301（src/lib/glossary-301.ts）と同方式。
 * middleware.ts が `/projects/旧` → `/projects/canonical` の 301 に使用。
 *
 * 非破壊: 旧entry は microCMS に残す（middleware が 301 吸収＝404を作らない）。
 * 一覧除外は src/lib/projects-excluded.ts（301元 6 slug を登録）。
 * canonical は dry-run でデータ妥当性を確認・空フィールドは情報補完 PATCH 済（cod/status）。
 *
 * 5グループ（projects分析 発見③ / stage-1監査D・ユウ監査 2026-06-28）:
 *   1 千里蓄電所      → osakagas-suita（大阪ガス・11MW/23MWh）
 *   2 上奈良蓄電所    → kaminara-bess（HOBE ENERGY・5MWh）
 *   3 琵琶湖蓄電所    → pr-co18049-bess（森トラスト・8.7MW/19.7MWh）
 *   4 群馬太田市蓄電所 → ota-bess（稼働中・cleaner slug）
 *   5 石川県加賀市2MW/4MWh → pr-2mw-4mwh-bess-2
 */
export const PROJECTS_301: Record<string, string> = {
  // 1 千里蓄電所
  '/projects/pr-co76147-bess':         '/projects/osakagas-suita',
  '/projects/pr-co139670-bess':        '/projects/osakagas-suita',
  // 2 上奈良蓄電所
  '/projects/pr-co173175-saitama-5mwh': '/projects/kaminara-bess',
  // 3 琵琶湖蓄電所
  '/projects/pr-co85927-bess-2':       '/projects/pr-co18049-bess',
  // 4 群馬太田市蓄電所
  '/projects/gunma-ota':               '/projects/ota-bess',
  // 5 石川県加賀市2MW/4MWh蓄電所
  '/projects/pr-2mw-4mwh-bess-3':      '/projects/pr-2mw-4mwh-bess-2',
  // 6 武雄蓄電所（2026-06-29 stage6・みずほリースPR ⇔ 4社canonical jfe-takeo）
  '/projects/pr-co85927-bess':         '/projects/jfe-takeo',
};

/** 301元の bare slug（一覧除外・noindex 判定の補助。完全一致） */
export const PROJECTS_301_SOURCE_SLUGS: ReadonlySet<string> = new Set(
  Object.keys(PROJECTS_301).map((p) => p.replace(/^\/projects\//, '')),
);
