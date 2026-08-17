// AreaPage.tsx - エリア別系統空き容量ページ (server component)
// /grid/tohoku, /grid/hokuriku, /grid/shikoku から呼び出される
import Link from 'next/link';
import { KANSAI_NO_PREFECTURE_NOTE, normalizeSubstationPlace } from '@/lib/grid-prefecture';
import { formatDataDateLabel } from '@/lib/grid-data-date';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import SubstationsBrowser from '@/components/SubstationsBrowser';
import RelatedOperatorBadges from '@/components/RelatedOperatorBadges';
import RelatedTermBadges from '@/components/RelatedTermBadges';
import {
  getRelatedOperatorsForSubstation,
  type Substation,
} from '@/lib/microcms';
// 落とし穴 #116 の恒久策(2026-08-16): エリアの一覧は build 時 precompute の静的データを使う。
// runtime microCMS だと Next の fetch キャッシュで再取込直後のビルドが旧データを出力する。
import { getAreaSubstationsStatic, toSubstationShape } from '@/lib/grid-static-lists';
import { siteConfig } from '@/lib/site-config';
import { GRID_PAGE_RELATED_TERMS } from './related-terms';

export type AreaMeta = {
  slug: string;
  areaJp: string;
  operator: string;
  landingUrl: string;
  description: string;
  /** 出典データ形式（既定: CSV）。東京PGは予想潮流PDF由来のため 'PDF'。 */
  sourceFormat?: string;
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

/**
 * 落とし穴 #119(2026-08-17): 二重正規化で原値が消えるのを防ぐ。
 *
 * Gr10(b166f57) は一覧系ヘルパ（getAllSubstations / searchSubstationsByName /
 * getSubstationsByPrefecture）と precompute の両方で正規化を済ませており、
 * 渡ってくる record は既に prefecture=正規化後・facility_class=原値 になっている。
 * そこへ再度 normalizeSubstationPlace(prefecture) を掛けると原値が null に潰れ、
 * 一覧の「都道府県／設備区分」列が全行「—」／設備区分別ブレークダウンが空になる
 * （関西1,575件・沖縄151件が Gr10 以来ずっと不可視だった）。
 * → 保存済みの facility_class があればそれを正とする。
 */
function resolvePlace(s: Substation): {
  prefecture: string | null;
  facilityClass: string | null;
} {
  const place = normalizeSubstationPlace(
    s.prefecture,
    Array.isArray(s.area) ? s.area[0] : (s.area as unknown as string | undefined)
  );
  const stored = (s as { facility_class?: string | null }).facility_class;
  return { prefecture: place.prefecture, facilityClass: stored ?? place.facilityClass };
}

/**
 * Gr10(2026-08-11): 表の「都道府県」列に系統区分・設備区分を出さない。
 * 都道府県が確定しないものは「設備区分: ◯◯」と明示する（原値は捨てない）。
 */
function placeLabel(s: Substation): string {
  const place = resolvePlace(s);
  if (place.prefecture) return place.prefecture;
  if (place.facilityClass) return `設備区分: ${place.facilityClass}`;
  return '—';
}

export default async function AreaPage({ meta }: { meta: AreaMeta }) {
  const subs = toSubstationShape(getAreaSubstationsStatic(meta.areaJp));

  // ===== サマリ統計 =====
  const total = subs.length;
  const positive = subs.filter(
    (s) => typeof s.cap_avail_mw === 'number' && s.cap_avail_mw > 0
  );
  const n1ok = subs.filter((s) => s.n1_eligible === true);
  const availSum = positive.reduce((acc, s) => acc + (s.cap_avail_mw || 0), 0);
  const availAvg = positive.length > 0 ? availSum / positive.length : 0;

  // ===== 都道府県別 =====
  // Gr10(2026-08-11): 原値に系統区分・設備区分が入っている社があるため正規化して数える。
  // 2026-08-17（案B）: 府県が確定しないものは設備区分（関西ローカル系・基幹系統）で行を立てる。
  //   列見出しが「都道府県／設備区分」なので、行レベルの表示（placeLabel）とも一致する。
  //   どちらも無いレコードだけ「（府県の記載なし）」へ集約する（フォールバック文言は不変）。
  const byPref = new Map<string, Substation[]>();
  const byFacility = new Map<string, Substation[]>();
  for (const s of subs) {
    const place = resolvePlace(s);
    const p = place.prefecture || place.facilityClass || '（府県の記載なし）';
    if (!byPref.has(p)) byPref.set(p, []);
    byPref.get(p)!.push(s);
    // 「設備区分別」表は、府県が確定していて設備区分が上表に出ない社（沖縄）専用。
    // 府県が null の社（関西・各社の基幹系統）は上表に出ているので二重掲載しない。
    if (place.prefecture && place.facilityClass) {
      if (!byFacility.has(place.facilityClass)) byFacility.set(place.facilityClass, []);
      byFacility.get(place.facilityClass)!.push(s);
    }
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

  // Gr10: 設備区分別（原値を捨てず、正しい見出しで残す）
  const facilityRows = Array.from(byFacility.entries())
    .map(([p, list]) => {
      const pos = list.filter(
        (x) => typeof x.cap_avail_mw === 'number' && x.cap_avail_mw > 0
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
    name: `${meta.areaJp}エリア｜蓄電池 系統空き容量DB`,
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
            予想潮流・出力制御の可能性・N-1電制適用可否を、公表 {meta.sourceFormat ?? 'CSV'}
            から一元化して掲載しています。
          </p>

          {/* データ基準日: microCMS 実値（precompute area_dates）から供給（Gr2是正・2026-08-08） */}
          {formatDataDateLabel(meta.areaJp) && (
            <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '-8px 0 16px' }}>
              データ基準日: {formatDataDateLabel(meta.areaJp)}（{meta.operator}の公表データ）
            </p>
          )}

          {/* Gr3(2026-08-08): 逆ブリッジ — 読み方の解説と関連用語へ（ゼロfetch・実在slug確認済） */}
          <section className="page-section news-shelf" style={{ marginBottom: 20 }}>
            <h2 className="news-shelf-title" style={{ fontSize: 16 }}>このデータの読み方</h2>
            <ul className="lv-invest-rows">
              <li><Link href="/explainer/grid-capacity-map-reading">解説: 空き容量マップの読み方</Link></li>
              <li><Link href="/glossary/grid-available-capacity">用語: 系統空き容量とは</Link></li>
              {/* Gr9-③(2026-08-09): エリアを引き継いだ状態で詳細検索を開く。
                  エリアページ10件には /grid/search への導線が1本も無かった。
                  area の値はフォームの select 実値（日本語）と一致させる。*/}
              <li>
                <Link href={`/grid/search?area=${encodeURIComponent(meta.areaJp)}`}>
                  {meta.areaJp}エリアで条件を絞り込む（電圧・空容量・N-1電制）
                </Link>
              </li>
            </ul>
          </section>

          {/* Gr10(2026-08-11): 関西は公表データに府県の記載がないため府県ページを作れない。
              「無い」ことを黙って隠さず、理由と代替手段を書く。*/}
          {meta.slug === 'kansai' && (
            <p className="grid-source-note" style={{ margin: '4px 0 16px' }}>
              📋 {KANSAI_NO_PREFECTURE_NOTE}
            </p>
          )}

          {/* 東京エリア: 収録済（表データ）。公開停止・再開の経緯は記録ページへ（404を作らない・経緯保持）*/}
          {meta.slug === 'tokyo' && (
            <p className="grid-source-note" style={{ margin: '4px 0 16px' }}>
              📋 東京電力PG（13都県＋基幹系）は2026年6月に収録済（表データ。地図・緯度経度は後日対応）。公開停止（2026年2月〜6月1日）・再開（6月2日）の経緯は{' '}
              <Link href="/grid/tokyo/status" className="grid-area-link">
                記録ページ
              </Link>
              {' '}をご覧ください。
            </p>
          )}

          {/* Phase 4-pre: 中部限定マップへの導線 */}
          {meta.slug === 'chubu' && (
            <div className="grid-map-cta" style={{ margin: '16px 0 24px' }}>
              <Link
                href="/grid/chubu/map"
                className="grid-map-cta-button"
                style={{
                  display: 'inline-block',
                  padding: '12px 20px',
                  background: '#0066cc',
                  color: 'white',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  fontWeight: 'bold',
                }}
              >
                🗺 中部地方マップで見る（緯度経度付き約1,081箇所）
              </Link>
              <span
                style={{
                  marginLeft: '12px',
                  fontSize: '15px',
                  color: '#6b7280',
                }}
              >
                マーカー色で空容量・N-1電制可否を直感的に把握できます。
              </span>
            </div>
          )}

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
                    <th>都道府県／設備区分</th>
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

          {/* Gr10(2026-08-11): 設備区分別（沖縄電力・関西電力送配電の原値。都道府県ではない） */}
          {facilityRows.length > 0 && (
            <section className="grid-section">
              <h2 className="grid-section-h2">設備区分別ブレークダウン</h2>
              <p className="grid-source-note" style={{ marginTop: 0 }}>
                {meta.operator}の公表データは変電所を系統・設備の区分で分けており、都道府県の記載がありません。原値をそのまま区分として掲載しています。
              </p>
              <div className="grid-table-wrap">
                <table className="grid-table">
                  <thead>
                    <tr>
                      <th>設備区分</th>
                      <th className="num">件数</th>
                      <th className="num">空容量プラス</th>
                      <th>上位3変電所</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facilityRows.map((r) => (
                      <tr key={r.p}>
                        <td>{r.p}</td>
                        <td className="num">{r.count}</td>
                        <td className="num">{r.posCount}</td>
                        <td>
                          {r.top3.map((x, i) => (
                            <span key={x.id}>
                              {i > 0 ? '・' : ''}
                              <Link href={`/grid/${x.slug}`}>{x.name}</Link>
                            </span>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

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
                      <th>都道府県／設備区分</th>
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
                        <td>{placeLabel(s)}</td>
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
                      <th>都道府県／設備区分</th>
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
                        <td>{placeLabel(s)}</td>
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

          {/* 系統連系診断CTA */}
          <section style={{
            margin: '8px 0 24px',
            padding: '16px 20px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '2px solid #2563eb',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <p style={{ margin: '0 0 4px', fontSize: '15px', fontWeight: '700', color: '#1e40af' }}>
                ⚡ {meta.areaJp}エリアで系統連系を診断する
              </p>
              <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', lineHeight: 1.5 }}>
                連系候補変電所の特定・N-1電制の可否・接続コスト概算（平均エンゲージ92秒）
              </p>
            </div>
            <Link
              href={`/tools/grid-connection-check?area=${meta.slug}`}
              style={{
                padding: '10px 20px',
                background: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                fontSize: '15px',
                whiteSpace: 'nowrap',
              }}
            >
              系統連系診断を始める →
            </Link>
          </section>

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
              が公表する予想潮流等情報の {meta.sourceFormat ?? 'CSV'}
              に基づいています。最新情報・利用条件は各社の公式サイトでご確認ください。
            </p>
            <p className="grid-source-note">
              <Link href="/tracker/grid" className="grid-area-link">📋 変電所データの更新タイムラインを見る（/tracker/grid）→</Link>
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
