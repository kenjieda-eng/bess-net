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
 * src/lib/related-cards.ts の getAllExplainerLite（news・案件・政策詳細の関連解説と JSON-LD mentions）も独自の取得のため、
 * 同じ集合で外す（是正便 10-13 で漏れを塞いだ）。FAQ の関連解説（faq.relatedExplainer の slug）も表示前に外す。
 * explainer を endpoint に持つ取得は src に 7 か所（microcms.ts 6・related-cards.ts 1）。新しく足すときは必ずこの集合を通す。
 *
 * ★prebuild が読むモジュールなので、生成 JSON（src/lib/generated/*）を import しないこと。
 */
export type ExcludedExplainer = { slug: string; row: string; reason: string };

export const EXPLAINER_EXCLUDED: readonly ExcludedExplainer[] = [
  // ★2026-09-29 Ck-2 実行便② ■4（裁定 R17）: bess-depreciation-tax の除外を解除した。
  //   Ck-1a の A13 監査（誤り 3・古い 3・裏付けなし 4）を受けて全面改稿（F-08〜F-12）を microCMS に PATCH し、
  //   保存後の本文で鉤括弧の引用 95 か所（計画便の 51 か所を含む）を一次（国税庁・e-Gov 法令 API v2・環境省）と
  //   照合して MISSING 0 を確認したうえで表示に戻す。照合記録: reports/ck2-exec-2-2026-09-29.md (5)。
  {
    slug: 'soc-soh-degradation-management',
    row: 'Ck-2 計画便 A-5 別表',
    // 全 42 文のうち 18 文が R8（数値・固有の事実で一次なし）で落ちる。落ちる 18 文が記事の主題そのもの:
    //   SOC 運用範囲 20〜90%・SOH 80%/70% 閾値・温度 25〜35℃ はタイトル「SOC・SOH・劣化管理」の核で、
    //   数値文 15 の一次は 0 件。章 4「長期運用のベストプラクティス」は 6 文中 5 文、章 7「データ活用」は 2 文とも落ちる。
    //   残る 24 文は SOC/SOH の定義と劣化要因の定性列挙で、glossary（soc-state-of-charge／soh-state-of-health／
    //   cycle-aging／calendar-aging ほか）と重複し記事としての独自価値が残らない。
    //   「容量市場参加時は最低 SOC 20% を常時確保」は制度要件の断定だが OCCTO のリクワイアメント本体を取得できず、
    //   裏取りも反証もできない断定が読者の実務判断に使われる危険が最も高い。
    reason: '数値文 15 の一次が 0 件で、落ちる 18 文が記事の主題（Ck-2 計画便 A-5 別表・裁定 R16）。改稿まで非表示',
  },
  {
    slug: 'battery-cooling-systems',
    row: 'Ck-2 計画便 A-5 別表',
    // 全 40 文のうち 13 文が R8 で落ちる。章 7「国内導入トレンド」3 文・章 8「今後の動向」2 文が全滅し、
    //   章 1「なぜ冷却が重要か」も最適温度 25〜35℃・高温 40℃超・10℃上昇で寿命半減の 3 文が落ちて
    //   「温度の記事なのに温度を一つも書けない」状態になる。選定の判断軸も規模閾値（100MWh級は水冷／10MWh以下は空冷）が落ちる。
    //   残る 27 文は空冷／水冷／液冷の長短列挙で、glossary の 3 語と重複する。
    //   Lc-3 が挙げた近い実在名（NEDO グリーンイノベーション基金事業ほか）は電池材料・セル開発の事業で
    //   BESS の冷却方式選定を論じた資料ではないため、出典の差し替え先にはしない。
    reason: '数値文 7 の一次が 0 件で、温度・規模閾値という主題が R8 で落ちる（Ck-2 計画便 A-5 別表・裁定 R16）。改稿まで非表示',
  },
  {
    slug: 'integrated-market-2026',
    row: 'T8 研究便 (7)・是正便 10-13',
    // 一次: 資源エネルギー庁「同時市場の在り方等に関する検討会」第二次中間取りまとめ
    //   https://www.meti.go.jp/shingikai/energy_environment/doji_shijo_kento/pdf/20251015_1.pdf。
    //   ★reason の頁: 2026-10-13 12:49 JST に取り直した PDF（4,801,593 バイト・sha256 e9b951c4ec595f08…）では、
    //   引用の文は印刷頁 63（PDF 63 頁目・頁末）にある（61 頁は市場開設準備・62 頁は図 30「同時市場導入のロードマップ」）。
    //   是正便 10-13 では便の指定どおり「p.61」と書き、T7 実装便（2026-10-15・ユウ裁定＝是正便 (6)-1）で「p.63」に直した。
    //   T8 研究便（reports/tool-balancing-rules-plan-2026-10-12.md (7)・C-9）で、題の「2026年度開始」が一次と食い違うことを確認。
    //   Ck-1 の A11-2-X2（reports/ck1-approval-2026-09-21.md）でも、本文 #2 の「2026年度開始予定」を落とす指摘が既にあった。
    reason: '題・リード・本文が「2026年度開始」とするが、同時市場の導入は未決定（「同時市場の在り方等に関する検討会」第二次中間取りまとめ p.63「我が国において同時市場が実現可能であると判断された場合には、同時市場の導入を最終決定することとしたい。」）。本文の大半（海外の統合市場・5 商品の呼称・清算・地域別価格・2026年4月本格運用 等）に一次が無い（R8）。改稿まで非表示',
  },
];

export const EXPLAINER_EXCLUDED_SLUGS: ReadonlySet<string> = new Set(EXPLAINER_EXCLUDED.map((e) => e.slug));

/** explainer を表示から外すか（slug 完全一致） */
export function isExcludedExplainer(slug: string | undefined | null): boolean {
  return !!slug && EXPLAINER_EXCLUDED_SLUGS.has(slug);
}
