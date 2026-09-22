/**
 * src/lib/links-excluded.ts
 *
 * /links（お役立ちサイト一覧）から外すエントリの単一情報源（SSOT）。
 * src/lib/info-excluded.ts と同方式（Lc-3 ■2・依頼者裁定＝案A）。
 *
 * 非破壊: microCMS のデータは削除しない。中身は 2 種類で、詳細ページの扱いが違う:
 *
 * (1) MERGED_LINKS（統合）… 一覧・sitemap から外し、詳細 /links/[slug] は 200 のまま noindex（robots index:false）
 *     ＝404 を作らない・既存 URL は生きたまま。宛先が実在し、別エントリへ統合しただけのもの。
 *   jepx-prices（2026-09-20・Lc-3）… JEPX スポット市場のデータページへの直リンクを主眼にしたエントリ。
 *     JEPX「リンクについて」（https://www.jepx.jp/disclaimer/ ・実測）が
 *     「・トップページ以外のページへのリンク」を明示的にお断りしているため、
 *     **「スポット価格への直リンク」というエントリ自体が成立しない**。
 *     同じ宛先（トップ）を指す jepx-japan が既にあるので、そちらへ統合する。
 *
 * (2) HIDDEN_LINKS（非表示・Ck-1a 2026-09-22）… 宛先のサイト・団体が一次で確認できない／閉鎖済み／
 *     差し替え案が反証されたもの。取得の共通関数（src/lib/microcms.ts の getAllLinks・getLinkBySlug）で外し、
 *     詳細も 404 にする（存在しない団体・閉鎖したサイトのカードを読者に見せ続けない）。
 *     理由は reports/ck1-approval-2026-09-21.md の該当行（行 id を row に記載）。作り直しは Ck-2 で裁定する。
 *
 * ★除外を掛ける箇所（落とし穴 #118/#119: 一方だけに掛けると取りこぼす）:
 *   1) src/app/links/page.tsx … 一覧と JSON-LD の numberOfItems（isExcludedLink）
 *   2) src/app/links/[slug]/page.tsx generateStaticParams … 静的生成の対象から外す（isExcludedLink）
 *   3) 同 generateMetadata … robots index:false（MERGED のみ到達する。HIDDEN は取得層で null → 404）
 *   4) src/app/sitemap.ts … linkUrls（isExcludedLink）
 *   5) src/lib/microcms.ts getAllLinks・getLinkBySlug … HIDDEN を取得層で外す（isHiddenLink）
 */
const MERGED_LINKS: readonly { slug: string; reason: string }[] = [
  { slug: 'jepx-prices', reason: 'JEPX スポット市場のデータページへの直リンク用エントリ（jepx-japan に統合・Lc-3）' },
];

export const HIDDEN_LINKS: readonly { slug: string; row: string; reason: string }[] = [
  // ■1-2 同定できず 5 件（承認表 §0-2）
  { slug: 'nedo-roadmap', row: '§0-2 links/nedo-roadmap.url', reason: 'NEDO サイト上の掲載ページはすべて 404。旧 URL もアーカイブ記録なし' },
  { slug: 'engadget-energy', row: '§0-2 links/engadget-energy.url', reason: 'エンガジェット日本版は 2022-05-01 にサイト閉鎖。転送先の米国版は英語の総合テックサイト' },
  { slug: 'esaj-japan', row: '§0-2 links/esaj-japan.url', reason: '「蓄電システム工業会（ESAJ）」が実在する一次の痕跡なし。ドメインも名前解決できない' },
  { slug: 'news2u', row: '§0-2 links/news2u.url', reason: 'News2u.net は 2020-06-30 でサービス終了' },
  { slug: 'pv-magazine-jp', row: '§0-2 links/pv-magazine-jp.url', reason: 'pv magazine の公式エディション一覧（12 サイト）に日本版・.jp サイトなし' },
  // ■3-7 差し替え案を反証 3 件（承認表 §0-2。依頼は「URL を空にして非表示」だが url は必須項目で空にできない
  //   ＝HTTP 400・変更なし。非表示で到達しないため旧 URL は残る。作り直しは Ck-2）
  { slug: 'nagoya-env', row: '§0-2 links/nagoya-env.url', reason: '差し替え案（環境局トップ）は主題が異なり反証。作り直しは Ck-2' },
  { slug: 'chiba-env', row: '§0-2 links/chiba-env.url', reason: '差し替え案（環境の親カテゴリ）は主題が異なり反証。カード名の変更を含む作り直しは Ck-2' },
  { slug: 'climate-group-jp', row: '§0-2 links/climate-group-jp.url', reason: '差し替え案は RE100 のみのページで反証。Climate Group の日本支部は一次で確認できず' },
  // ■3-6 B3 死（承認表 B3 の notes どおり links-excluded へ）
  { slug: 'kyoto-env', row: 'B3 https://www.city.kyoto.lg.jp/kankyo/', reason: '/kankyo/ はページとして存在しない（403）。現行は局の組織一覧で説明文の「脱炭素支援情報」ではなく同定できず（url は必須項目のため空にできない）' },
  { slug: 'drimo-japan', row: 'B3 https://drimo.jp/', reason: 'drimo.jp は apex に A レコードが無く記事が引けない（死）' },
  { slug: 'natural-power-jp', row: 'B3 https://natural-power.jp/', reason: 'HTTPS はサーバ側が TLS alert 80 で握手を拒否（死）' },
  // A11-2-07: url（https://www.occto.or.jp/iinkai/koukai_shiryou.html）は 404 で、同一内容の現行ページを同定できず
  //   Wayback にも収録が無い。依頼は「同定できなければ URL を空に」だが、links.url は microCMS の必須項目で
  //   "" の PATCH は HTTP 400（変更なし）。404 のリンクを出し続けないよう、他の同定できないカードと同じく非表示にする。
  //   description の需給調整市場の帰属（A11-2-07-b）は是正済み。作り直しは Ck-2。
  { slug: 'occto-data', row: 'A11-2-07', reason: 'url が 404 で同一内容の現行ページを同定できず（url は必須項目のため空にできない）' },
];

const HIDDEN_LINK_SLUGS: ReadonlySet<string> = new Set(HIDDEN_LINKS.map((l) => l.slug));

export const LINKS_EXCLUDED_SLUGS: ReadonlySet<string> = new Set<string>([
  ...MERGED_LINKS.map((l) => l.slug),
  ...HIDDEN_LINK_SLUGS,
]);

/** /links 一覧・件数・sitemap からの除外＋詳細ページ noindex 対象（完全一致） */
export function isExcludedLink(slug: string): boolean {
  return LINKS_EXCLUDED_SLUGS.has(slug);
}

/** 取得層で外す（詳細も 404）対象か */
export function isHiddenLink(slug: string | undefined | null): boolean {
  return !!slug && HIDDEN_LINK_SLUGS.has(slug);
}
