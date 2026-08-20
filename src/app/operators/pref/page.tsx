// /operators/pref — 都道府県別 事業者一覧のインデックス（Op4④・2026-08-20）
// データは precompute（operators-category-index.json）のみ＝runtime fetch 0（鉄則 #2/#3）。
// ★実データがある県のみ列挙（件数・県数はハードコードせず実カウント）。
//   「海外」「情報非公開」等の非県値は都道府県として扱わない（gridの教訓・#119 と同型）。
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import { REAL_PREFECTURES } from '@/lib/grid-prefecture';
import categoryIndex from '@/lib/generated/operators-category-index.json';

type Row = { slug: string; prefecture: string | null };

// 実在47都道府県のうち、掲載事業者が1社以上ある県だけを件数つきで列挙
const PREF_COUNTS: Array<{ pref: string; count: number }> = (() => {
  const counts = new Map<string, number>();
  for (const o of categoryIndex as Row[]) {
    const p = o.prefecture;
    if (p && REAL_PREFECTURES.has(p)) counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([pref, count]) => ({ pref, count }))
    .sort((a, b) => b.count - a.count || a.pref.localeCompare(b.pref, 'ja'));
})();

const TOTAL = PREF_COUNTS.reduce((n, r) => n + r.count, 0);

const TITLE = `都道府県別の蓄電池関連事業者 ── ${PREF_COUNTS.length}都道府県・掲載${TOTAL}社`;
const DESCRIPTION = `系統用蓄電池（BESS）・低圧リソース事業に関わる事業者を本社所在地の都道府県別に一覧。${PREF_COUNTS.length}都道府県・${TOTAL}社を掲載（本社所在地が確認できた事業者のみ）。`;

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: '/operators/pref' },
  openGraph: { title: TITLE, description: DESCRIPTION, type: 'website' },
};

export default function OperatorPrefIndexPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/operators">事業者ナビ</Link> / 都道府県別
          </p>
          <h1 className="section-title">都道府県別の蓄電池関連事業者</h1>
          <p className="section-description">
            蓄電所ネット掲載の事業者を本社所在地の都道府県別に一覧しています（{PREF_COUNTS.length}都道府県・{TOTAL}社）。本社所在地が確認できた事業者のみを対象とし、掲載のない県はページを設けていません（網羅を保証するものではありません）。
          </p>
          <div className="grid-table-wrap">
            <table className="grid-table">
              <thead>
                <tr>
                  <th>都道府県</th>
                  <th className="num">掲載事業者数</th>
                </tr>
              </thead>
              <tbody>
                {PREF_COUNTS.map((r) => (
                  <tr key={r.pref}>
                    <td>
                      <Link href={`/operators/pref/${r.pref}`}>{r.pref}の蓄電池関連事業者</Link>
                    </td>
                    <td className="num">{r.count}社</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="grid-source-note" style={{ marginTop: 16 }}>
            <Link href="/operators">← 事業者ナビ（カテゴリ・キーワード・都道府県で絞り込み）</Link>
          </p>
          <p className="grid-source-note">
            データソース: {siteConfig.organization.name} 編集部
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
