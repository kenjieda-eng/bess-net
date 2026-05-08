// /grid/search — 変電所名フリーテキスト検索 (v24)
// - microCMS filters[name][contains] による部分一致検索
// - 表示上限 100 件（UI 性能保護）、空容量大きい順
// - 落とし穴 #57: 静的セグメント `search/` は同階層 [slug] より優先される
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { searchSubstationsByName } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

// SSR 動的：searchParams 反映のため revalidate は不要
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: '変電所名検索 ｜ 系統空き容量データベース - 蓄電所ネット',
  description:
    '全国9社・6,500変電所超の中から名称で検索できます（部分一致）。蓄電所連系検討の初期スクリーニングに。',
  alternates: { canonical: '/grid/search' },
  openGraph: {
    title: '変電所名検索｜系統空き容量データベース',
    description: '全国9社・6,500変電所超の中から名称で検索（部分一致）',
    type: 'website',
  },
};

type SearchPageProps = {
  searchParams: { q?: string };
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const query = (searchParams?.q || '').trim();
  const hasQuery = query.length > 0;

  const results = hasQuery ? await searchSubstationsByName(query) : [];

  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'トップ',
        item: 'https://bess-net.jp/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '系統空き容量',
        item: 'https://bess-net.jp/grid',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: '検索',
        item: 'https://bess-net.jp/grid/search',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/grid">系統空き容量</Link> / 検索
          </p>

          <h1 className="page-title">変電所名検索</h1>
          <p className="page-lead">
            全国9社・6,500変電所超の中から名称で検索できます（部分一致）。エリア・電圧・空容量等で絞り込んだ後の精密検索にもご利用ください。
          </p>

          <form action="/grid/search" method="get" className="grid-search-form">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="例：西部、松ケ枝、新潟"
              className="grid-search-input"
              aria-label="変電所名で検索"
            />
            <button type="submit" className="grid-search-submit">
              検索
            </button>
          </form>

          {hasQuery && (
            <section className="grid-section">
              <h2 className="grid-section-h2">
                検索結果：{results.length}件
                {results.length === 0 && '（該当なし）'}
                {results.length === 100 && '（上位100件まで表示）'}
              </h2>
              {results.length > 0 ? (
                <ul className="grid-search-list">
                  {results.map((r) => (
                    <li key={r.slug} className="grid-search-item">
                      <Link
                        href={`/grid/${r.slug}`}
                        className="grid-search-link"
                      >
                        <strong>{r.name}</strong>
                        <span className="grid-search-meta">
                          {r.operator}
                          {' ／ '}
                          {r.area}エリア
                          {r.prefecture && ` ／ ${r.prefecture}`}
                          {r.voltage_primary_kv != null &&
                            ` ／ ${r.voltage_primary_kv}kV`}
                          {r.cap_avail_mw != null &&
                            ` ／ 空容量 ${r.cap_avail_mw}MW`}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="grid-source-note">
                  「<strong>{query}</strong>」に一致する変電所は見つかりませんでした。
                  別のキーワードで検索するか、
                  <Link href="/grid">エリア別一覧</Link>
                  からお探しください。
                </p>
              )}
            </section>
          )}

          {!hasQuery && (
            <section className="grid-section">
              <h2 className="grid-section-h2">検索のヒント</h2>
              <ul className="grid-prose">
                <li>
                  <strong>部分一致</strong>
                  ：「西部」と入力すると「西部変電所」「西部開閉所」等にヒットします。
                </li>
                <li>
                  <strong>カタカナ・ひらがな</strong>
                  ：原則として漢字表記で検索（「マツガエ」では「松ケ枝」にヒットしません）。
                </li>
                <li>
                  <strong>地名検索</strong>
                  ：「新潟」「名古屋」等の地名で広く絞り込みできます。
                </li>
                <li>
                  <strong>記号は省く</strong>：「（１）」「(2)」等は省いて入力してください。
                </li>
              </ul>
              <p className="grid-source-note">
                または、<Link href="/grid">エリア別一覧</Link>
                から地域・送配電事業者ごとに探すこともできます。
              </p>
            </section>
          )}

          <p className="grid-source-note">
            データソース: {siteConfig.organization.name} 編集部が、9送配電事業者の公開情報を整理。
          </p>

          <p className="back-link">
            <Link href="/grid">← 系統空き容量データベースへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
