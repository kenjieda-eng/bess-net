/**
 * src/lib/operators-301.ts
 *
 * /operators 重複統合 301 マップの単一情報源（SSOT）。
 * GLOSSARY_301（glossary-301.ts）・PROJECTS_301（projects-301.ts）と同方式。
 * middleware.ts が `/operators/断片` → `/operators/canonical` の 301 に使用。
 *
 * 非破壊: 断片 entry は microCMS に残す（DELETE しない）。middleware が 301 で吸収するため 404 を作らない。
 * 一覧・件数・集計・sitemap・detail-index からの除外は src/lib/operators-excluded.ts
 * （OPERATORS_301_SOURCE_SLUGS を自動 union）。
 *
 * ── 経緯（2026-08-23・ユウ実測 → CC 是正）───────────────────────────────
 * 8/23 の A-1実行で登録した第1層36社のうち2社が、社名抽出の断片（既存社の重複）だった。
 * slug 照合をすり抜けたのは、断片が既存社と別文字列になるため（機械照合の構造的な穴）。
 *   1 「E-Flow合同会社運用」… 「E-Flow合同会社運用のモデル」等の語尾巻き込み
 *      → 正: 「E-Flow合同会社」/operators/agg-e-flow-3766
 *   2 「茨城県ノーバル・ホールディングス」… 「茨城県…ノーバル」の地名前置巻き込み
 *      → 正: 「株式会社ノーバル・ホールディングス」/operators/pr-co69153
 * 同型の「合同会社クラダシ」は POST 前に検出して登録を見送っている。
 * 再発防止の抽出ガードは scripts/experimental/operators/fragment-guard.ts（§3）。
 */
export const OPERATORS_301: Record<string, string> = {
  '/operators/e-flow-unyo': '/operators/agg-e-flow-3766',
  '/operators/noval-holdings': '/operators/pr-co69153',
};

/** 301 元の slug 集合（一覧・件数・sitemap・detail-index から除外する） */
export const OPERATORS_301_SOURCE_SLUGS: ReadonlySet<string> = new Set(
  Object.keys(OPERATORS_301).map((p) => p.replace('/operators/', ''))
);
