/**
 * src/lib/operators-excluded.ts
 *
 * /operators から「一覧・件数・集計・sitemap・detail-index」を除外する slug の単一情報源。
 * projects-excluded.ts と同方式。非破壊（microCMS は削除しない）。
 *
 * 中身は 2 種類:
 *   (1) OPERATORS_301_SOURCE_SLUGS（301 元＝抽出断片）。middleware が正エントリへ 301 するため、除外しても 404 は生まれない。
 *   (2) HIDDEN_OPERATORS（Ck-1a ■1-3・2026-09-22）。一次で企業の実在を確認できないレコード。
 *       取得の共通関数（src/lib/microcms.ts の getAllOperators・getOperatorBySlug・getAllOperatorSlugs）で外すので、
 *       一覧・詳細（404）・件数・突合・ランキング・用語集の関連・sitemap のどれにも同時に効く（#118/#119）。
 *
 * ★突合（operator-match）でも除外する必要がある。断片名は既存社と別文字列のため、
 *   除外しないと同一案件が「断片」と「正」の両方に計上され重複計上になる
 *   （2026-08-23 実測: kepco-eflow-aso-chikugo が e-flow-unyo と agg-e-flow-3766 の双方に計上）。
 */
import { OPERATORS_301_SOURCE_SLUGS } from './operators-301';

/**
 * 一次で企業の実在を確認できないレコード（非表示・DELETE しない）。
 * 理由はすべて reports/ck1-approval-2026-09-21.md「0-3. operators」の該当行（所在 operators/<slug>.sourceUrl が行 id）。
 * 作り直す（実在の企業に寄せる）かは Ck-2 で個別に裁定する。
 */
export const HIDDEN_OPERATORS: readonly { slug: string; row: string; reason: string }[] = [
  { slug: 'octa', row: '§0-3 operators/octa.sourceUrl', reason: '出典・公式サイトの両ドメインとも名前解決できず、該当企業が見つからない' },
  { slug: 'smile-energy', row: '§0-3 operators/smile-energy.sourceUrl', reason: 'ドメインは名前解決できずアーカイブもない。社名・設立年・本社所在地に一致する企業なし' },
  { slug: 'kepco-power', row: '§0-3 operators/kepco-power.sourceUrl', reason: '「関西電力エネルギーソリューション株式会社」という商号を確認できない（近い Kenes は設立年・事業が異なる）' },
  { slug: 'ses-japan', row: '§0-3 operators/ses-japan.sourceUrl', reason: 'ドメインは名前解決できず、該当企業も SAP SE の子会社とする記述の裏付けもない' },
];

const HIDDEN_OPERATOR_SLUGS: ReadonlySet<string> = new Set(HIDDEN_OPERATORS.map((o) => o.slug));

export const EXCLUDED_OPERATOR_SLUGS: ReadonlySet<string> = new Set<string>([
  ...OPERATORS_301_SOURCE_SLUGS,
  ...HIDDEN_OPERATOR_SLUGS,
]);

export function isExcludedOperator(slug: string | undefined | null): boolean {
  return !!slug && EXCLUDED_OPERATOR_SLUGS.has(slug);
}

/** 取得層で外す（詳細も 404）対象か。301 元は middleware が吸収するのでここには含めない */
export function isHiddenOperator(slug: string | undefined | null): boolean {
  return !!slug && HIDDEN_OPERATOR_SLUGS.has(slug);
}
