/**
 * src/middleware.ts
 *
 * 旧 news-2026-NNN-* スラッグへ 410 Gone を返す（SEO 対応）
 *
 * 背景 (2026-06-02):
 *   Google Search Console で /news/news-2026-NNN-* 形式が 708 件 404 として記録。
 *   これらは microCMS にもサイトマップにも存在しない旧スラッグ残存（原因1）。
 *   Google に「恒久的に消滅」を伝えるため 404 → 410 に格上げ。
 *
 * 保護:
 *   src/data/legacy-news-allowlist.json に列挙されたスラッグ（現存 28 件）は
 *   410 の対象外。build 時に build:legacy-news-allowlist が再生成。
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import legacyAllowlist from '@/data/legacy-news-allowlist.json';

const LEGACY = new Set(legacyAllowlist as string[]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /news/news-2026-{数字}-{...} パターンのみ対象
  const m = pathname.match(/^\/news\/(news-2026-\d+-.+)$/);
  if (m) {
    const slug = decodeURIComponent(m[1]);
    if (!LEGACY.has(slug)) {
      return new NextResponse('Gone', { status: 410 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/news/:slug*'],
};
