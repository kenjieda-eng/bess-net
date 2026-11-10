/**
 * /build-info.json — ビルドの日付の印（毎朝の再ビルドの予備便・2026-11-10）
 *
 * いまのデプロイがいつビルドされたかを返す小さな JSON。
 *   { "dateJst": "2026-11-10", "builtAt": "2026-11-10T08:02:11+09:00" }
 *
 * - 読み手は .github/workflows/daily-rebuild.yml の予備の回（02:10・04:10・06:10・09:10 JST）。
 *   dateJst が今日（JST）ならやり直さず、前の日付なら deploy hook を叩く。
 *   背景: 2026-11-10 は 00:10 JST の自動の再ビルドが始まらず、/subsidies が約 8 時間 前日の見え方だった。
 * - 値はビルドのときに決まる（force-static・revalidate なし＝実行時に計算しない・ISR にしない）。
 *   デプロイごとに作り直されるので、ビルドのたびに builtAt が変わる。
 * - dateJst は getTodayJST()（src/lib/subsidies-meta.ts・/subsidies の「本日締切」と同じ出し方）。
 * - microCMS を読まない（鉄則 #3／#102）。サイトマップに載せない。X-Robots-Tag: noindex は next.config.js の headers で付ける。
 */
import { getTodayJST } from '@/lib/subsidies-meta';

export const dynamic = 'force-static';
export const revalidate = false;

/** ミリ秒の時刻を「YYYY-MM-DDTHH:mm:ss+09:00」（JST・秒まで）にする */
function toJstIso(ms: number): string {
  return new Date(ms + 9 * 60 * 60 * 1000).toISOString().replace(/\.\d{3}Z$/, '+09:00');
}

export function GET() {
  const builtAt = toJstIso(Date.now());
  const dateJst = getTodayJST();
  return Response.json({ dateJst, builtAt });
}
