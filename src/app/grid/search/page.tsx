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
import { formatDataDateLabel } from '@/lib/grid-data-date';
import { subsidyCountForPref } from '@/lib/grid-meta';
import projectsPrefCount from '@/lib/generated/projects-pref-count.json';

// Gr8(2026-08-09): 検索結果からの導線に使う県別件数（precompute・runtime fetch 0）
const PREF_PROJECT_COUNT = projectsPrefCount as Record<string, number>;

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
  // Gr7(2026-08-09): URLパラメータは既存名を維持しつつ、subsidies/operators と同じ短い別名も受ける。
  // （既存のリンクを壊さずに ?cap_min= / ?cap_max= / ?voltage= / ?n1= でも共有できるようにする）
  const sp = (searchParams ?? {}) as Record<string, string | undefined>;
  const pick = (...keys: string[]): string | undefined => {
    for (const k of keys) {
      const v = (sp[k] || '').trim();
      if (v) return v;
    }
    return undefined;
  };
  const filters: SubstationSearchFilters = {
    q: pick('q'),
    area: pick('area'),
    voltage_min: pick('voltage_min', 'voltage'),
    cap_avail_min: pick('cap_avail_min', 'cap_min', 'cap_preset'),
    cap_avail_max: pick('cap_avail_max', 'cap_max'),
    n1_eligible: pick('n1_eligible', 'n1'),
    operator: pick('operator'),
  };

  const hasAnyFilter =
    !!filters.q ||
    !!filters.area ||
    !!filters.voltage_min ||
    !!filters.cap_avail_min ||
    !!filters.cap_avail_max ||
    filters.n1_eligible === 'true' ||
    !!filters.operator;

  const response = hasAnyFilter
    ? await searchSubstationsByFilters(filters)
    : { items: [], totalCount: 0, truncated: false };
  const results = response.items;

  // 結果に含まれる県から導線用の件数を集める（Gr8）
  const resultPrefs = [...new Set(results.map((r) => r.prefecture).filter(Boolean))] as string[];
  const linkPrefs = resultPrefs
    .map((p) => ({
      pref: p,
      projects: PREF_PROJECT_COUNT[p] ?? 0,
      subsidies: subsidyCountForPref(p),
    }))
    .filter((x) => x.projects > 0 || x.subsidies > 0)
    .slice(0, 6);

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
            全国{GRID_OPERATORS}社・{GRID_TOTAL.toLocaleString()}変電所の中から、変電所名・エリア・電圧階級・空容量（プリセット／MWの自由入力で上限・下限とも指定可）・N-1電制適用可・送配電事業者で
            絞り込み検索できます（複数条件は AND 結合）。絞り込んだ状態のURLはそのまま共有できます。
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
                name="cap_preset"
                defaultValue={CAP_OPTIONS.some(([v]) => v === (filters.cap_avail_min ?? '')) ? filters.cap_avail_min ?? '' : ''}
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
            {/* Gr7(2026-08-09): 空容量の自由入力（上限・下限の両方向）。上のプリセットは残す */}
            <div className="grid-search-row">
              <label htmlFor="f-cap-min">空容量の範囲（MW・自由入力）</label>
              <span className="grid-search-range">
                <input
                  id="f-cap-min"
                  type="number"
                  name="cap_avail_min"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  defaultValue={filters.cap_avail_min ?? ''}
                  placeholder="以上（例: 12.5）"
                  className="grid-search-input"
                  style={{ maxWidth: 190 }}
                />
                <span style={{ margin: '0 8px', color: '#6b7280' }}>〜</span>
                <input
                  id="f-cap-max"
                  type="number"
                  name="cap_avail_max"
                  min="0"
                  step="0.1"
                  inputMode="decimal"
                  defaultValue={filters.cap_avail_max ?? ''}
                  placeholder="以下（例: 80）"
                  className="grid-search-input"
                  style={{ maxWidth: 190 }}
                />
              </span>
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
                条件に一致: {response.totalCount.toLocaleString()}件 / 全
                {GRID_TOTAL.toLocaleString()}件
              </h2>
              <p className="grid-source-note" style={{ marginTop: 0 }}>
                {response.truncated
                  ? `空容量の大きい順に上位${results.length}件を表示しています。さらに条件を絞ると全件を確認できます。`
                  : `${results.length.toLocaleString()}件すべてを表示しています。`}
              </p>
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
                        {/* Gr7(2026-08-09): 行ごとにデータ基準日を明示（Gr2の実値を流用） */}
                        {formatDataDateLabel(r.area) && (
                          <span className="grid-search-meta" style={{ color: '#6b7280', fontSize: 12 }}>
                            {formatDataDateLabel(r.area)}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="grid-source-note">
                  <p style={{ marginTop: 0 }}>
                    指定された条件に一致する変電所は見つかりませんでした。次のどれかで条件をゆるめてください。
                  </p>
                  <ul className="grid-prose" style={{ marginTop: 4 }}>
                    <li>空容量の下限を下げる（例: 50MW以上 → 10MW以上）／上限を外す</li>
                    <li>電圧階級の指定を外す（高い階級ほど該当が少なくなります）</li>
                    <li>N-1電制適用可の指定を外す（対象は全体の一部です）</li>
                    <li>変電所名の部分一致をやめて、エリアだけで絞る</li>
                  </ul>
                  <p style={{ marginBottom: 0 }}>
                    <Link href="/grid">← エリア別一覧</Link>
                    {' / '}
                    <Link href="/grid/prefecture">📍 都道府県別一覧</Link>
                  </p>
                </div>
              )}
            </section>
          )}

          {/* Gr8(2026-08-09): 検索結果からの導線。0件の枠は出さない */}
          {hasAnyFilter && results.length > 0 && (
            <section className="grid-section">
              <h2 className="grid-section-h2">この結果から次へ</h2>
              {linkPrefs.length > 0 && (
                <ul className="grid-prose">
                  {linkPrefs.map((x) => (
                    <li key={x.pref}>
                      <strong>{x.pref}</strong>：
                      {x.projects > 0 && (
                        <>
                          <Link href="/projects">蓄電所案件 {x.projects}件</Link>
                          {x.subsidies > 0 && ' ／ '}
                        </>
                      )}
                      {x.subsidies > 0 && (
                        <Link href="/subsidies">この県で使える補助金 {x.subsidies}件</Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              <ul className="grid-prose">
                <li>
                  <Link href="/explainer/grid-capacity-map-reading">
                    解説: 系統空き容量マップの読み方（13指標の意味）
                  </Link>
                </li>
                <li>
                  <Link href="/glossary/grid-available-capacity">用語: 系統空き容量とは</Link>
                </li>
                <li>
                  <Link href="/tools/grid-connection-check">系統連系診断（事業条件から可否の目安を確認）</Link>
                </li>
              </ul>
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
                  <strong>件数は常に表示</strong>
                  ：条件に一致する総件数を出したうえで、空容量の大きい順に最大200件を表示します。
                </li>
                <li>
                  <strong>URLで共有できる</strong>
                  ：?area=関西&amp;cap_min=10&amp;cap_max=80&amp;n1=true のように、絞り込んだ状態をそのまま渡せます。
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
