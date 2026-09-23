/**
 * src/lib/explainer-excluded.ts
 *
 * explainer（/explainer 一覧・詳細・カテゴリ・関連・sitemap）から外す記事の単一情報源（SSOT）。
 * src/data/subsidies-excluded.ts・src/lib/links-excluded.ts と同方式（Ck-1b ■6・2026-09-23）。
 *
 * 非破壊: microCMS のレコードは削除しない。explainer のスキーマに非表示用の欄が無いため、
 * 取得の共通関数（src/lib/microcms.ts の getAllExplainer・getExplainerBySlug・getAllExplainerSlugs・
 * getExplainersByTermName）で外す。これで一覧・カテゴリ・詳細（404）・用語集の関連・sitemap・
 * トップの新着が同時に揃う（#118/#119: 一部の経路だけ外れる事態を防ぐ）。
 * 関連マップの生成（scripts/precompute-explainer-related.ts）は独自 fetch のため、そちらでも同じ集合を使う。
 *
 * ★prebuild が読むモジュールなので、生成 JSON（src/lib/generated/*）を import しないこと。
 */
export type ExcludedExplainer = { slug: string; row: string; reason: string };

export const EXPLAINER_EXCLUDED: readonly ExcludedExplainer[] = [
  {
    slug: 'bess-depreciation-tax',
    row: 'Ck-1a 報告 (5) A13 監査表',
    // 一次（e-Gov 法令 API・国税庁タックスアンサー・中小企業庁）と突き合わせた結果:
    //   誤り 3（カーボンニュートラル投資促進税制の対象・「年次の事前申告」・過少資本税制の説明）
    //   古い 3（環境関連投資促進税制＝グリーン投資減税は廃止・過大支払利息税制は令和元年度改正前・連結納税制度は
    //          令和4年4月開始事業年度からグループ通算制度へ移行）
    //   裏付けなし 4（耐用年数 15〜17年・PCS 15年・変圧器 15〜17年・「自治体ごとの固定資産税減免 3〜5年」）
    // 税務は読者が実務判断に使う領域で、部分修正より全面改稿が要る。改稿まで表示しない。
    reason: '税務の記述に誤り 3・古い記述 3・裏付けなし 4（Ck-1a の A13 監査）。全面改稿まで非表示',
  },
];

export const EXPLAINER_EXCLUDED_SLUGS: ReadonlySet<string> = new Set(EXPLAINER_EXCLUDED.map((e) => e.slug));

/** explainer を表示から外すか（slug 完全一致） */
export function isExcludedExplainer(slug: string | undefined | null): boolean {
  return !!slug && EXPLAINER_EXCLUDED_SLUGS.has(slug);
}
