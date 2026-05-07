// AreaPage.tsx - エリア別系統空き容量ページ (server component)
// /grid/tohoku, /grid/hokuriku, /grid/shikoku から呼び出される
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import SubstationsBrowser from '@/components/SubstationsBrowser';
import RelatedOperatorBadges from '@/components/RelatedOperatorBadges';
import RelatedTermBadges from '@/components/RelatedTermBadges';
import {
  getAllSubstations,
  getRelatedOperatorsForSubstation,
  type Substation,
} from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';
import { GRID_PAGE_RELATED_TERMS } from './related-terms';

export type AreaMeta = {
  slug: string;
  areaJp: string;
  operator: string;
  landingUrl: string;
  description: string;
};

// 関連用語の固定リンク → ./related-terms.ts に集約（落とし穴 #59 対応：実在slug 検証済み）
const FIXED_TERMS = GRID_PAGE_RELATED_TERMS;

function fmt(v: number | null | undefined): string {
  if (typeof v !== 'number' || Number.isNaN(v)) return '—';
  return Number.isInteger(v) ? v.toString() : v.toFixed(1);
}

function fmtDate(iso: string | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('ja-JP');
}

export default async function AreaPage({ meta }: { meta: AreaMeta }) {
  const subs = await getAllSubstations({ area: meta.areaJp });

  // ===== サマリ統計 =====
  const total = subs.length;
  const positive = subs.filter(
    (s) => typeof s.cap_avail_mw === 'number' && s.cap_avail_mw > 0
  );
  const n1ok = subs.filter((s) => s.n1_eligible === true);
  const availSum = positive.reduce((acc, s) => acc + (s.cap_avail_mw || 0), 0);
  const availAvg = positive.length > 0 ? availSum / positive.length : 0;

  // ===== 都道府県別 =====
  const byPref = new Map<string, Substation[]>();
  for (const s of subs) {
    const p = s.prefecture || '（基幹系）';
    if (!byPref.has(p)) byPref.set(p, []);
    byPref.get(p)!.push(s);
  }
  const prefRows = Array.from(byPref.entries())
    .map(([p, list]) => {
      const pos = list.filter(
        (s) => typeof s.cap_avail_mw === 'number' && s.cap_avail_mw > 0
      );
      const top3 = [...list]
        .sort(
          (a, b) =>
            ((b.cap_avail_mw as number) || -Infinity) -
            ((a.cap_avail_mw as number) || -Infinity)
        )
        .slice(0, 3);
      return { p, count: list.length, posCount: pos.length, top3 };
    })
    .sort((a, b) => b.count - a.count);

  // ===== 電圧階級別 =====
  const VOLTAGE_ORDER = [
    '500kV系',
    '275kV系',
    '187kV系',
    '154kV系',
    '110kV系',
    '77kV系',
    '66kV系',
    '22kV系',
    '13.8kV系',
    'その他',
  ];
  const byVoltage = new Map<string, number>();
  for (const s of subs) {
    const vc = (s.voltage_class && s.voltage_class[0]) || 'その他';
    byVoltage.set(vc, (byVoltage.get(vc) || 0) + 1);
  }
  const voltageRows = VOLTAGE_ORDER.map((vc) => ({
    vc,
    n: byVoltage.get(vc) || 0,
  })).filter((r) => r.n > 0);

  // ===== Top 20 by cap_avail_mw =====
  const topAvail = [...subs]
    .filter((s) => typeof s.cap_avail_mw === 'number' && s.cap_avail_mw > 0)
    .sort((a, b) => (b.cap_avail_mw || 0) - (a.cap_avail_mw || 0))
    .slice(0, 20);

  // ===== Top 20 by n1_capacity_mw =====
  const topN1 = [...subs]
    .filter(
      (s) =>
        s.n1_eligible === true &&
        typeof s.n1_capacity_mw === 'number' &&
        s.n1_capacity_mw > 0
    )
    .sort((a, b) => (b.n1_capacity_mw || 0) - (a.n1_capacity_mw || 0))
    .slice(0, 20);

  // ===== 関連事業者 =====
  const relatedOps = await getRelatedOperatorsForSubstation(meta.operator, 5).catch(
    () => []
  );
  const relatedOpsBadges = relatedOps.map((o) => ({ name: o.name, slug: o.slug }));

  // ===== 出典の最終更新日 =====
  const lastUpdated = subs.length > 0 ? subs[0].last_updated : undefined;
  const sampleSourceUrl = subs.length > 0 ? subs[0].source_url : meta.landingUrl;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${meta.areaJp}エリア｜系統空き容量データベース`,
    description: meta.description,
    url: `https://bess-net.jp/grid/${meta.slug}`,
    numberOfItems: total,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
  };

  // BreadcrumbList JSON-LD: トップ > 系統空き容量 > {エリア}エリア
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      {
        '@type': 'ListItem',
        position: 2,
        name: '系統空き容量',
        item: 'https://bess-net.jp/grid',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: `${meta.areaJp}エリア`,
        item: `https://bess-net.jp/grid/${meta.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/grid">系統空き容量</Link> / {meta.areaJp}エリア
          </p>

          <h1 className="page-title">
            {meta.areaJp}エリア｜系統空き容量データベース
          </h1>
          <p className="page-lead">
            {meta.operator} 管内の{total}変電所（変圧器バンク含む）の系統空き容量・
            予想潮流・出力制御の可能性・N-1電制適用可否を、公表 CSV
            から一元化して掲載しています。
          </p>

          {/* サマリ統計 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">サマリ統計</h2>
            <div className="grid-stats">
              <div className="grid-stat-card">
                <div className="grid-stat-num">{total}</div>
                <div className="grid-stat-label">変電所数</div>
              </div>
              <div className="grid-stat-card">
                <div className="grid-stat-num">{positive.length}</div>
                <div className="grid-stat-label">空容量プラス</div>
              </div>
              <div className="grid-stat-card">
                <div className="grid-stat-num">{n1ok.length}</div>
                <div className="grid-stat-label">N-1電制適用可</div>
              </div>
              <div className="grid-stat-card">
                <div className="grid-stat-num">{fmt(availAvg)}</div>
                <div className="grid-stat-label">平均空容量(プラス分のみ, MW)</div>
              </div>
            </div>
          </section>

          {/* 都道府県別 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">都道府県別ブレークダウン</h2>
            <div className="grid-table-wrap">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>都道府県</th>
                    <th className="num">件数</th>
                    <th className="num">空容量プラス</th>
                    <th>上位3変電所</th>
                  </tr>
                </thead>
                <tbody>
                  {prefRows.map((r) => (
                    <tr key={r.p}>
                      <td>{r.p}</td>
                      <td className="num">{r.count}</td>
                      <td className="num">{r.posCount}</td>
                      <td>
                        {r.top3.map((s, i) => (
                          <span key={s.id}>
                            {i > 0 ? '・' : ''}
                            <Link href={`/grid/${s.slug}`}>{s.name}</Link>
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 電圧階級別 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">電圧階級別ブレークダウン</h2>
            <ul className="grid-list">
              {voltageRows.map((r) => (
                <li key={r.vc} className="grid-list-row">
                  <span className="grid-list-label">{r.vc}</span>
                  <span className="grid-list-value">{r.n} 件</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 空容量プラスTOP20 */}
          {topAvail.length > 0 && (
            <section className="grid-section">
              <h2 className="grid-section-h2">空容量プラス TOP 20</h2>
              <p className="grid-source-note">
                空容量（当該設備）の値が大きい順。連系候補ショートリストとして参考にしてください。
              </p>
              <div className="grid-table-wrap">
                <table className="grid-table">
                  <thead>
                    <tr>
                      <th>変電所</th>
                      <th>都道府県</th>
                      <th>電圧階級</th>
                      <th className="num">台数</th>
                      <th className="num">空容量(MW)</th>
                      <th>N-1電制</th>
                      <th>出力制御</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topAvail.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <Link href={`/grid/${s.slug}`}>{s.name}</Link>
                        </td>
                        <td>{s.prefecture || '—'}</td>
                        <td>{(s.voltage_class && s.voltage_class[0]) || '—'}</td>
                        <td className="num">{s.units ?? '—'}</td>
                        <td className="num">
                          <span className="pos">{fmt(s.cap_avail_mw ?? null)}</span>
                        </td>
                        <td>
                          {s.n1_eligible === true ? (
                            <span className="grid-badge grid-badge-ok">可</span>
                          ) : s.n1_eligible === false ? (
                            <span className="grid-badge grid-badge-info">不可</span>
                          ) : (
                            '—'
                          )}
                        </td>
                        <td>
                          {(s.oc_possibility && s.oc_possibility[0]) === '有り' ? (
                            <span className="grid-badge grid-badge-warn">有り</span>
                          ) : (
                            (s.oc_possibility && s.oc_possibility[0]) || '—'
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* N-1電制適用可TOP20 */}
          {topN1.length > 0 && (
            <section className="grid-section">
              <h2 className="grid-section-h2">N-1電制適用可TOP 20</h2>
              <p className="grid-source-note">
                N-1電制適用可能量(MW)の値が大きい順。N-1電制活用による拡大連系の参考に。
              </p>
              <div className="grid-table-wrap">
                <table className="grid-table">
                  <thead>
                    <tr>
                      <th>変電所</th>
                      <th>都道府県</th>
                      <th>電圧階級</th>
                      <th className="num">N-1電制適用可能量(MW)</th>
                      <th className="num">空容量(MW)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topN1.map((s) => (
                      <tr key={s.id}>
                        <td>
                          <Link href={`/grid/${s.slug}`}>{s.name}</Link>
                        </td>
                        <td>{s.prefecture || '—'}</td>
                        <td>{(s.voltage_class && s.voltage_class[0]) || '—'}</td>
                        <td className="num">{fmt(s.n1_capacity_mw ?? null)}</td>
                        <td className="num">{fmt(s.cap_avail_mw ?? null)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {/* 全変電所リスト (Client side filter) */}
          <section className="grid-section">
            <h2 className="grid-section-h2">全変電所リスト（検索・フィルタ）</h2>
            <p className="grid-source-note">
              検索・フィルタはブラウザ側で実行されます。変電所名・都道府県でリアルタイム検索可能。
            </p>
            <SubstationsBrowser items={subs} />
          </section>

          {/* 関連事業者 */}
          {relatedOpsBadges.length > 0 && (
            <RelatedOperatorBadges
              operators={relatedOpsBadges}
              title={`${meta.operator} 関連`}
            />
          )}

          {/* 関連用語 */}
          <RelatedTermBadges terms={FIXED_TERMS} title="関連用語（用語集）" />

          {/* 出典 */}
          <section className="grid-section grid-source-section">
            <h2 className="grid-section-h2">出典・データ提供元</h2>
            <dl className="grid-info-table">
              <dt>データ提供</dt>
              <dd>{meta.operator}</dd>
              <dt>公式情報ページ</dt>
              <dd>
                <a
                  href={meta.landingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid-source-link"
                >
                  {meta.landingUrl}
                </a>
              </dd>
              <dt>データ最終更新日（代表）</dt>
              <dd>{fmtDate(lastUpdated)}</dd>
              <dt>サンプルCSV直リンク</dt>
              <dd>
                <a
                  href={sampleSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid-source-link"
                >
                  {sampleSourceUrl}
                </a>
              </dd>
            </dl>
            <p className="grid-source-note">
              ※ 本ページの数値は <strong>{meta.operator}</strong>
              が公表する予想潮流等情報の CSV
              に基づいています。最新情報・利用条件は各社の公式サイトでご確認ください。
            </p>
          </section>

          <p className="back-link">
            <Link href="/grid">← 系統空き容量データベースへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
