/**
 * src/middleware.ts
 *
 * 旧 news-2026-NNN-* スラッグへ 410 Gone を返す（SEO 対応）
 * Glossary 重複スラッグ → canonical へ 301 リダイレクト
 *
 * 背景 (2026-06-02):
 *   Google Search Console で /news/news-2026-NNN-* 形式が 708 件 404 として記録。
 *   これらは microCMS にもサイトマップにも存在しない旧スラッグ残存（原因1）。
 *   Google に「恒久的に消滅」を伝えるため 404 → 410 に格上げ。
 *
 * 背景 (2026-06-10):
 *   旧AI生成スタブ eu-ets-detail / carbon-pricing-detail が canonical
 *   eu-ets / carbon-pricing と重複。SEO重複コンテンツ・relatedTerms衝突を解消するため
 *   301 で canonical へ統合（非破壊）。
 *
 * 背景 (2026-06-19, P1 batch1):
 *   Glossary 重複候補 134 グループ（docs/glossary-dup-candidates.md）をユウ監査。
 *   Rule A（-detail スタブ 32件）+ Rule B（term正規化重複 91グループ→100件）を batch1 承認。
 *   以下を除外:
 *     - #29 response-time-detail: 「駆けつけ時間」≠「応動時間」、別概念
 *     - #3 ce-marking-detail: borderline、要再検討
 *     - #43 distributed-energy-resource-2: canonical slug に "-2" 残留
 *   以下を canonical 反転（GA4/GSC 実績）:
 *     - #93 spot-market（GA4 6v）← day-ahead-market（1v）
 *     - #112 dispatch-command-source（GSC 4.4位）← dispatch-resource（0v）
 *     - #123 fire-separation-distance（GA4 8v・397秒）← setback-distance, separation-distance
 *   Rule C（english正規化 8件）batch2 承認（2026-06-21）:
 *     6グループ統合。除外: #129 lfp（クラスタ要整理）、#132 transformer-ai（別概念）。
 *     ※ re100-detail は batch1 Rule A で既存のため batch2 では追加しない（冪等）。
 *
 * 保護:
 *   src/data/legacy-news-allowlist.json に列挙されたスラッグ（現存 28 件）は
 *   410 の対象外。build 時に build:legacy-news-allowlist が再生成。
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import legacyAllowlist from '@/data/legacy-news-allowlist.json';
import { GLOSSARY_301 } from '@/lib/glossary-301';
import { PROJECTS_301 } from '@/lib/projects-301';
// 2026-08-23: 社名抽出の断片2件を正エントリへ 301（削除はしない・operators-301.ts が SSOT）
import { OPERATORS_301 } from '@/lib/operators-301';
// Gr10(2026-08-11): 設備区分が都道府県URLになっていた7本を 301（削除はしない）
import { GRID_PREFECTURE_301 } from '@/lib/grid-prefecture';

const LEGACY = new Set(legacyAllowlist as string[]);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Glossary 重複統合 301
  if (pathname in GLOSSARY_301) {
    return NextResponse.redirect(new URL(GLOSSARY_301[pathname], req.url), { status: 301 });
  }

  // Projects 重複統合 301（旧slug → canonical・2026-06-28）
  if (pathname in PROJECTS_301) {
    return NextResponse.redirect(new URL(PROJECTS_301[pathname], req.url), { status: 301 });
  }

  // Operators 重複統合 301（抽出断片 → 正エントリ・2026-08-23）
  if (pathname in OPERATORS_301) {
    return NextResponse.redirect(new URL(OPERATORS_301[pathname], req.url), { status: 301 });
  }

  // Gr10: /grid/prefecture/{設備区分} → 沖縄県ページ / 関西エリアページ
  // pathname はエンコード済みで来るためデコードして突合する
  const decodedPath = (() => {
    try {
      return decodeURIComponent(pathname);
    } catch {
      return pathname;
    }
  })();
  if (decodedPath in GRID_PREFECTURE_301) {
    return NextResponse.redirect(new URL(GRID_PREFECTURE_301[decodedPath], req.url), { status: 301 });
  }

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
  matcher: ['/news/:slug*', '/glossary/:slug*', '/projects/:slug*', '/grid/prefecture/:slug*'],
};
