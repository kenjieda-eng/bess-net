// /grid/search — v25: 多角的検索フィルタ
// - q (変電所名) + area + voltage_min + cap_avail_min + n1_eligible + operator
// - microCMS filters [and] 結合、searchSubstationsByFilters 関数で検索
// - 表示上限 200 件（UI 性能保護）、空容量大きい順
// - 落とし穴 #57: 静的セグメント `search/` は同階層 [slug] より優先
import type { Metadata } from 'next';
import substationsIndex from '@/data/substations/index.json';
import { AREA_META } from '../[slug]/area-meta';

// Gr5②(2026-08-08): 件数はデータ実数から動的算出
const GRID_TOTAL: number = (substationsIndex as { total: number }).total;
const GRID_OPERATORS: number = Object.keys(AREA_META).length;
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import {
  searchSubstationsByFilters,
  type SubstationSearchFilters,
} from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  // #88: 手書き「- 蓄電所ネット」を除去（template が自動付与・title総仕上げ2026-07-15）
  title: '変電所詳細検索｜蓄電池 系統空き容量DB',
  description:
    '名称・エリア・電圧階級・空容量・N-1電制適用可・送配電事業者で絞り込み検索。蓄電所連系検討の精密スクリーニングに。',
  alternates: { canonical: '/grid/search' },
  openGraph: {
    title: '変電所詳細検索｜蓄電池 系統空き容量DB',
    description:
      '8,200変電所超を 6 つの軸で絞り込み（変電所名・エリア・電圧・空容量・N-1電制・送配電事業者）',
    type: 'website',
  },
};

type SearchPageProps = {
  searchParams: SubstationSearchFilters;
};

const AREAS = [
  '北海道',
  '東北',
  '中部',
  '北陸',
  '関西',
  '中国',
  '四国',
  '九州',
  '沖縄',
];

const OPERATORS = [
  '北海道電力ネットワーク',
  '東北電力ネットワーク',
  '中部電力パワーグリッド',
  '北陸電力送配電',
  '関西電力送配電',
  '中国電力ネットワーク',
  '四国電力送配電',
  '九州電力送配電',
  '沖縄電力',
];

const VOLTAGE_OPTIONS: Array<[string, string]> = [
  ['22', '22kV以上'],
  ['66', '66kV以上'],
  ['77', '77kV以上'],
  ['110', '110kV以上'],
  ['154', '154kV以上'],
  ['275', '275kV以上'],
  ['500', '500kV以上'],
];

const CAP_OPTIONS: Array<[string, string]> = [
  ['0', '空容量プラス（>0MW）'],
  ['10', '10MW以上'],
  ['50', '50MW以上'],
  ['100', '100MW以上'],
];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const filters: SubstationSearchFilters = {
    q: (searchParams?.q || '').trim() || undefined,
    area: (searchParams?.area || '').trim() || undefined,
    voltage_min: (searchParams?.voltage_min || '').trim() || undefined,
    cap_avail_min: (searchParams?.cap_avail_min || '').trim() || undefined,
    n1_eligible: (searchParams?.n1_eligible || '').trim() || undefined,
    operator: (searchParams?.operator || '').trim() || undefined,
  };

  const hasAnyFilter =
    !!filters.q ||
    !!filters.area ||
    !!filters.voltage_min ||
    !!filters.cap_avail_min ||
    filters.n1_eligible === 'true' ||
    !!filters.operator;

  const results = hasAnyFilter ? await searchSubstationsByFilters(filters) : [];

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
        name: '詳細検索',
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
            <Link href="/grid">系統空き容量</Link> / 詳細検索
          </p>

          <h1 className="page-title">変電所 詳細検索</h1>
          <p className="page-lead">
            全国{GRID_OPERATORS}社・{GRID_TOTAL.toLocaleString()}変電所の中から、変電所名・エリア・電圧階級・空容量・N-1電制適用可・送配電事業者の
            6 つの軸で絞り込み検索できます（複数条件は AND 結合）。
          </p>

          {/* 詳細検索フォーム */}
          <form
            action="/grid/search"
            method="get"
            className="grid-search-form-multi"
          >
            <div className="grid-search-row">
              <label htmlFor="f-q">変電所名（部分一致）</label>
              <input
                id="f-q"
                type="text"
                name="q"
                defaultValue={filters.q ?? ''}
                placeholder="例：西部、松ケ枝、新潟"
                className="grid-search-input"
              />
            </div>
            <div className="grid-search-row">
              <label htmlFor="f-area">エリア</label>
              <select
                id="f-area"
                name="area"
                defaultValue={filters.area ?? ''}
                className="grid-search-input"
              >
                <option value="">指定なし</option>
                {AREAS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid-search-row">
              <label htmlFor="f-volt">電圧階級（一次kV 以上）</label>
              <select
                id="f-volt"
                name="voltage_min"
                defaultValue={filters.voltage_min ?? ''}
                className="grid-search-input"
              >
                <option value="">指定なし</option>
                {VOLTAGE_OPTIONS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid-search-row">
              <label htmlFor="f-cap">
                空容量（MW以上）
                <span
                  style={{
                    fontWeight: 400,
                    fontSize: '12px',
                    color: '#9ca3af',
                    marginLeft: 4,
                  }}
                >
                  N-1電制可選択時は「N-1電制適用可能量」を対象
                </span>
              </label>
              <select
                id="f-cap"
                name="cap_avail_min"
                defaultValue={filters.cap_avail_min ?? ''}
                className="grid-search-input"
              >
                <option value="">指定なし</option>
                {CAP_OPTIONS.map(([v, label]) => (
                  <option key={v} value={v}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid-search-row">
              <label htmlFor="f-n1">N-1電制適用可</label>
              <select
                id="f-n1"
                name="n1_eligible"
                defaultValue={filters.n1_eligible ?? ''}
                className="grid-search-input"
              >
                <option value="">指定なし</option>
                <option value="true">適用可のみ</option>
              </select>
            </div>
            <div className="grid-search-row">
              <label htmlFor="f-op">送配電事業者</label>
              <select
                id="f-op"
                name="operator"
                defaultValue={filters.operator ?? ''}
                className="grid-search-input"
              >
                <option value="">指定なし</option>
                {OPERATORS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid-search-row grid-search-row-actions">
              <button type="submit" className="grid-search-submit">
                🔍 検索する
              </button>
              {hasAnyFilter && (
                <Link
                  href="/grid/search"
                  className="grid-search-clear"
                  prefetch={false}
                >
                  条件をクリア
                </Link>
              )}
            </div>
          </form>

          {hasAnyFilter && (
            <section className="grid-section">
              <h2 className="grid-section-h2">
                検索結果：{results.length}件
                {results.length === 0 && '（該当なし）'}
                {results.length === 200 && '（上位200件まで表示）'}
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
                          {r.n1_capacity_mw != null &&
                            ` ／ N-1可能量 ${r.n1_capacity_mw}MW`}
                          {r.n1_eligible && ' ／ N-1電制可'}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="grid-source-note">
                  指定された条件に一致する変電所は見つかりませんでした。
                  条件を緩めるか、<Link href="/grid">エリア別一覧</Link>
                  からお探しください。
                </p>
              )}
            </section>
          )}

          {!hasAnyFilter && (
            <section className="grid-section">
              <h2 className="grid-section-h2">検索のヒント</h2>
              <ul className="grid-prose">
                <li>
                  <strong>複数条件は AND 結合</strong>
                  ：例えば「エリア=関西 + 空容量50MW以上 + N-1可」のように絞り込めます。
                </li>
                <li>
                  <strong>変電所名は部分一致</strong>
                  ：「西部」と入力すると「西部変電所」「西部開閉所」等にヒット。
                </li>
                <li>
                  <strong>表示上限 200 件</strong>
                  ：それ以上は更に条件を絞ってください。
                </li>
                <li>
                  <strong>空容量プラス</strong>
                  ：「{'>'} 0MW」のフィルタで連系候補を一気に絞り込みできます。
                </li>
              </ul>
              <p className="grid-source-note">
                <Link href="/grid">← エリア別一覧</Link>
                {' / '}
                <Link href="/grid/prefecture">📍 都道府県別一覧</Link>
              </p>
            </section>
          )}

          <p className="grid-source-note">
            データソース: {siteConfig.organization.name}{' '}
            編集部が、10送配電事業者の公開情報を整理。
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
