/**
 * src/lib/links-excluded.ts
 *
 * /links（お役立ちサイト一覧）から外すエントリの単一情報源（SSOT）。
 * src/lib/info-excluded.ts と同方式（Lc-3 ■2・依頼者裁定＝案A）。
 *
 * 非破壊: microCMS のデータは削除しない。一覧・sitemap から外し、
 * 詳細ページ /links/[slug] は 200 のまま noindex（robots index:false）にする
 * ＝404 を作らない・既存 URL は生きたまま。「非表示は DELETE でなくフラグか 301」の方針どおり。
 *
 * 判定（2026-09-20・Lc-3）:
 *   jepx-prices … JEPX スポット市場のデータページへの直リンクを主眼にしたエントリ。
 *     JEPX「リンクについて」（https://www.jepx.jp/disclaimer/ ・実測）が
 *     「・トップページ以外のページへのリンク」を明示的にお断りしているため、
 *     **「スポット価格への直リンク」というエントリ自体が成立しない**。
 *     同じ宛先（トップ）を指す jepx-japan が既にあるので、そちらへ統合する。
 *     ★削除ではなく除外。/links/jepx-prices は 200 のまま残り、被リンクや既存の
 *       ブックマークを壊さない。
 *
 * ★除外を掛ける箇所は 4 つ（落とし穴 #118/#119: 一方だけに掛けると取りこぼす）:
 *   1) src/app/links/page.tsx … 一覧と JSON-LD の numberOfItems
 *   2) src/app/links/[slug]/page.tsx generateStaticParams … 静的生成の対象から外す
 *   3) 同 generateMetadata … robots index:false
 *   4) src/app/sitemap.ts … linkUrls
 */
export const LINKS_EXCLUDED_SLUGS: ReadonlySet<string> = new Set<string>([
  // JEPX スポット市場のデータページへの直リンク用エントリ（jepx-japan に統合）
  'jepx-prices',
]);

/** /links 一覧・件数・sitemap からの除外＋詳細ページ noindex 対象（完全一致） */
export function isExcludedLink(slug: string): boolean {
  return LINKS_EXCLUDED_SLUGS.has(slug);
}
