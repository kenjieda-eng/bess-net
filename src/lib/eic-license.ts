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
 * 出典リンクの href を表示用に正す。
 * jepx.jp の深い URL はトップへ寄せる（出所の文言は呼び出し側がそのまま残すこと）。
 */
export function normalizeSourceLinkHref(url?: string): string | undefined {
  if (!url) return url;
  try {
    const u = new URL(url);
    if (u.hostname.endsWith('jepx.jp') && u.pathname !== '/') return JEPX_TOP;
  } catch {
    // 相対 URL・不正な URL はそのまま返す
  }
  return url;
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
