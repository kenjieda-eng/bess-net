/**
 * src/lib/eic-license.ts — 出典・ライセンス表示の正規化（Lc-1・2026-09-20）
 *
 * 背景:
 * 1. EIC カタログ（上流 eic-data-pipeline が毎ビルド再生成する src/data/eic/*.json）の license_url に
 *    404 の URL が残っている（2026-09-20 実測）:
 *      https://www.occto.or.jp/info/disclaimer.html … 63 系列（404）
 *      https://www.jepx.jp/electricpower/index.html … 16 系列（404）
 *    src/data/eic は .gitignore 済み＝手元を直しても次のビルドで上流の値に戻るため、
 *    表示の直前にここ 1 箇所で正す（#119 定義は一箇所）。★恒久策は上流カタログの修正（別便）。
 * 2. JEPX「リンクについて」はトップページ以外へのリンクを断っている一方、著作権条項は出所の明示を求める。
 *    両立する形は「出所は文字で明示し、リンク先は https://www.jepx.jp/ トップ」（ユウ裁定・Lc-1 ■3）。
 * 3. license_notice は逐語で扱う（要約しない・Lc-1 ■4）。行単位で返すだけで、文面は作らない。
 */

/** JEPX のトップ（リンク先はここに寄せる） */
export const JEPX_TOP = 'https://www.jepx.jp/';
/** EPRX のトップ（同上。EPRX 利用規約 §3） */
export const EPRX_TOP = 'https://www.eprx.or.jp/';
/** OCCTO のトップ（OCCTO は深いリンク可なので寄せない。表記の一貫性のために置く） */
export const OCCTO_TOP = 'https://www.occto.or.jp/';

/**
 * ソース別のリンク方針（Lc-2 ■3）
 * ★「どこもトップだけ」にしてはいけない。条文はソースごとに違う。
 *   2026-09-20 に各社の条文を実機取得して逐語で確認した結果を表にする（basis に逐語の該当部分）。
 *   条文を確認していないソースは表に入れない（推測で方針を作らない）。
 */
export type LinkPolicy = 'top-only' | 'deep-ok';

export type SourcePolicy = {
  /** ホスト名の末尾一致で判定する */
  host: string;
  policy: LinkPolicy;
  top: string;
  /** 利用条件ページ。top-only でもここへのリンクは許容する（後述の例外） */
  termsUrl?: string;
  /** 方針の根拠（条文の逐語） */
  basis: string;
};

export const SOURCE_LINK_POLICIES: readonly SourcePolicy[] = [
  {
    host: 'jepx.jp',
    policy: 'top-only',
    top: JEPX_TOP,
    termsUrl: 'https://www.jepx.jp/disclaimer/',
    basis:
      'JEPX「リンクについて」（https://www.jepx.jp/disclaimer/ ・2026-09-20 取得）: ' +
      '「このホームページへのリンクは、原則として自由です。但し以下に該当するリンク元ウェブサイトやリンクの設定方法はお断りいたします。」' +
      'の但書 4 項目の最後に「・トップページ以外のページへのリンク」が明記されている。',
  },
  {
    host: 'eprx.or.jp',
    policy: 'top-only',
    top: EPRX_TOP,
    termsUrl: 'https://www.eprx.or.jp/terms/',
    basis:
      'EPRX 利用規約 §3「リンクについて」（https://www.eprx.or.jp/terms/ ・2026-09-20 取得）: ' +
      '「本サイトへのリンクは原則としてトップページ（https://www.eprx.or.jp/）とし、当法人のサイトである旨を明示してください。」',
  },
  {
    host: 'occto.or.jp',
    policy: 'deep-ok',
    top: OCCTO_TOP,
    termsUrl: 'https://www.occto.or.jp/chosakuken.html',
    basis:
      'OCCTO「リンクについて」（https://www.occto.or.jp/chosakuken.html ・2026-09-20 取得）: ' +
      '「なお、トップページ以外にリンクを設定していただくことも可能ですが、変更等により、そのページのURLが変更となる場合がある点をご了承ください。」' +
      '＝深いリンクは明文で可。ただし「リンク設定にあたっては本機関のロゴマークの使用は一切禁止」も同条にある。',
  },
];
// ※ METI・気象庁は条文未確認のため表に入れていない（未確認のものを deep-ok として扱わないこと）。

/**
 * ★利用条件ページへのリンクの扱い（要裁定・2026-09-20 時点の暫定）
 *   JEPX の /disclaimer/ も EPRX の /terms/ も、厳密には「トップページ以外のページ」であり、
 *   条文の文言だけを見れば top-only の但書に当たる。しかし
 *     ・Lc-1 ■2 で「死んだ license_url を /disclaimer/ に差し替える」ことが明示的に指示されている
 *     ・読者がライセンス条文に到達できることは、出所明示の趣旨に沿う
 *   ため、利用条件ページへのリンクだけは例外として許容している（termsUrl）。
 *   条文に忠実に倒すなら termsUrl もトップへ寄せ、条文名はテキストで示す形になる。判断は依頼者に委ねる。
 */
export function policyFor(url: string): SourcePolicy | null {
  try {
    const host = new URL(url).hostname;
    return SOURCE_LINK_POLICIES.find((p) => host === p.host || host.endsWith(`.${p.host}`)) ?? null;
  } catch {
    return null;
  }
}

/** 404 になっている license_url の差し替え（右辺は 2026-09-20 に 200 を確認） */
export const DEAD_LICENSE_URL_FIX: Readonly<Record<string, string>> = {
  'https://www.occto.or.jp/info/disclaimer.html': 'https://www.occto.or.jp/chosakuken.html',
  'https://www.jepx.jp/electricpower/index.html': 'https://www.jepx.jp/disclaimer/',
};

/** カタログの license_url を表示用に正す（未知の URL はそのまま） */
export function normalizeLicenseUrl(url?: string): string | undefined {
  if (!url) return url;
  return DEAD_LICENSE_URL_FIX[url] ?? url;
}

/**
 * 出典リンクの href を表示用に正す（Lc-2 ■3 でソース別の方針表に一般化）。
 * top-only のソース（JEPX・EPRX）の深い URL はトップへ寄せる。
 * deep-ok のソース（OCCTO）はそのまま。条文を確認していないソースもそのまま（勝手に制限しない）。
 *
 * ★出所の文言は消さないこと。href だけを寄せ、資料名は地の文に残すのが呼び出し側の責任。
 */
export function normalizeSourceLinkHref(url?: string): string | undefined {
  if (!url) return url;
  const policy = policyFor(url);
  if (!policy || policy.policy !== 'top-only') return url;
  try {
    const u = new URL(url);
    // ★ここを `${u.origin}/ === policy.top` で判定してはいけない。origin は path を含まないので
    //   同じホストの**あらゆる深い URL**が「トップと同じ」と判定され、正規化が丸ごと素通りする
    //   （2026-09-20 に実際に埋め込み、/policy-calendar の生成 HTML に深い EPRX リンクが残って発覚）。
    //   「トップである」＝パスが / であること、で判定する。
    if (u.pathname === '/' && !u.search && !u.hash) return url;
    // 利用条件ページは例外（上の注記を参照）
    if (policy.termsUrl && u.href.replace(/\/$/, '') === policy.termsUrl.replace(/\/$/, '')) return url;
    return policy.top;
  } catch {
    return url;
  }
}

/**
 * ── JEPX の既定の出所文言（Lc-2 ■1(c)）────────────────────────────────────
 * 上流カタログの jepx-spot-* は license_notice が空（2026-09-20 実測）。
 * だが JEPX の著作権条項は「利用する場合は、出所を明示した上でご利用下さい」と出所明示を利用の条件にしている。
 * カタログが埋まるのを待つ間も条文は満たす必要があるので、表示側で出す既定文をここに 1 つだけ置く（#119）。
 * カタログが埋まったら licenseNoticeLines() の逐語表示に差し替える（jepxNoticeLines が自動で切り替える）。
 *
 * ★資料名について: 「スポット市場取引結果」は JEPX のページに存在しない名称だった（2026-09-20 実測。
 *   https://www.jepx.jp/electricpower/market-data/spot/ の <title> は「スポット市場 | 市場情報 | 電力取引 | JEPX」で、
 *   「取引結果」の語はサイト内 0 件）。公式名称でない資料名を名乗らないため「スポット市場」と書く。
 */
export const JEPX_PUBLISHER = '一般社団法人 日本卸電力取引所（JEPX）';
export const JEPX_SPOT_PAGE_NAME = 'スポット市場';
export const JEPX_SPOT_FALLBACK_NOTICE =
  `出典: ${JEPX_PUBLISHER}「${JEPX_SPOT_PAGE_NAME}」の約定価格。` +
  'JEPX 著作権条項「利用する場合は、出所を明示した上でご利用下さい」に従い、出所明示を条件に利用。';

/**
 * 表示に使う JEPX 系列の出所行を返す。
 * カタログの license_notice があれば逐語（要約しない）、無ければ上の既定文。
 */
export function jepxNoticeLines(notice?: string): string[] {
  const lines = licenseNoticeLines(notice);
  return lines.length > 0 ? lines : [JEPX_SPOT_FALLBACK_NOTICE];
}

/**
 * license_notice を逐語の行として返す（空行は落とすだけ・語句は一切変えない）。
 * 要約や言い換えをしないための共通入口（Lc-1 ■4）。
 */
export function licenseNoticeLines(notice?: string): string[] {
  return (notice ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}
