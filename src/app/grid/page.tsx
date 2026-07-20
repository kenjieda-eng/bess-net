// /grid 系統空き容量DB トップ — 10社・8,225件（2026-06時点、東京電力PG追加）
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import JapanGridMap, { type JapanAreaInfo } from '@/components/JapanGridMap';
import { getAllSubstations } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  // layout.tsx titleTemplate が自動付与（落とし穴 #86）
  title: '変電所 系統空き容量データベース（全国10社・蓄電池連系検討）',
  description:
    '北海道・東北・東京・中部・北陸・関西・中国・四国・九州・沖縄の10送配電事業者・8,225変電所の系統空き容量・予想潮流・出力制御の可能性・N-1電制適用可否を公表情報ベースで一元化。東京電力PGは2026年6月の公開再開を受け13都県＋基幹系を収録。中部は緯度経度付き地図検索に対応。',
  alternates: { canonical: '/grid' },
  openGraph: {
    title: '変電所 系統空き容量データベース（全国10社・蓄電池連系検討）',
    description: '10社・8,225変電所の系統空き容量・連系条件。中部は地図検索対応。',
    type: 'website',
  },
};

export default async function GridIndexPage() {
  const all = await getAllSubstations();

  // サマリ統計
  const total = all.length;
  const byOperator = new Map<string, number>();
  const byVoltage = new Map<string, number>();
  const byAreaSlug = new Map<string, number>(); // v25: JapanGridMap 用
  const AREA_JP_TO_SLUG: Record<string, string> = {
    北海道: 'hokkaido',
    東北: 'tohoku',
    東京: 'tokyo',
    中部: 'chubu',
    北陸: 'hokuriku',
    関西: 'kansai',
    中国: 'chugoku',
    四国: 'shikoku',
    九州: 'kyushu',
    沖縄: 'okinawa',
  };
  let n1OkCount = 0;
  let availPositiveCount = 0;
  for (const s of all) {
    const op = (s.operator && s.operator[0]) || 'その他';
    byOperator.set(op, (byOperator.get(op) || 0) + 1);
    const vc = (s.voltage_class && s.voltage_class[0]) || 'その他';
    byVoltage.set(vc, (byVoltage.get(vc) || 0) + 1);
    const ja = (s.area && s.area[0]) || '';
    const aSlug = AREA_JP_TO_SLUG[ja];
    if (aSlug) byAreaSlug.set(aSlug, (byAreaSlug.get(aSlug) || 0) + 1);
    if (s.n1_eligible === true) n1OkCount++;
    if (typeof s.cap_avail_mw === 'number' && s.cap_avail_mw > 0) availPositiveCount++;
  }
  // v25: 緯度経度付き（現状中部のみ）— Phase 4 で全国化する想定
  const latlngCount = 1081;

  const operatorList = Array.from(byOperator.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const voltageOrder = [
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
  const voltageList = voltageOrder
    .map((v) => [v, byVoltage.get(v) || 0] as const)
    .filter(([, n]) => n > 0);

  // 上位の閲覧候補（空容量プラスかつ N-1 電制可、上位 12 件）
  const highlights = all
    .filter(
      (s) =>
        typeof s.cap_avail_mw === 'number' &&
        s.cap_avail_mw > 0 &&
        s.n1_eligible === true
    )
    .sort((a, b) => (b.cap_avail_mw || 0) - (a.cap_avail_mw || 0))
    .slice(0, 12);

  // 都道府県別件数（人気の検索用、件数上位8つ）
  const PREFECTURE_TO_AREA: Record<string, { area: string; areaJp: string }> = {
    青森県: { area: 'tohoku', areaJp: '東北' },
    岩手県: { area: 'tohoku', areaJp: '東北' },
    秋田県: { area: 'tohoku', areaJp: '東北' },
    宮城県: { area: 'tohoku', areaJp: '東北' },
    山形県: { area: 'tohoku', areaJp: '東北' },
    福島県: { area: 'tohoku', areaJp: '東北' },
    新潟県: { area: 'tohoku', areaJp: '東北' },
    富山県: { area: 'hokuriku', areaJp: '北陸' },
    石川県: { area: 'hokuriku', areaJp: '北陸' },
    福井県: { area: 'hokuriku', areaJp: '北陸' },
    香川県: { area: 'shikoku', areaJp: '四国' },
    愛媛県: { area: 'shikoku', areaJp: '四国' },
    徳島県: { area: 'shikoku', areaJp: '四国' },
    高知県: { area: 'shikoku', areaJp: '四国' },
    // Phase 2A 中国
    鳥取県: { area: 'chugoku', areaJp: '中国' },
    島根県: { area: 'chugoku', areaJp: '中国' },
    岡山県: { area: 'chugoku', areaJp: '中国' },
    広島県: { area: 'chugoku', areaJp: '中国' },
    山口県: { area: 'chugoku', areaJp: '中国' },
    // Phase 2B 北海道
    北海道: { area: 'hokkaido', areaJp: '北海道' },
    // Phase 2-C-1 中部
    愛知県: { area: 'chubu', areaJp: '中部' },
    静岡県: { area: 'chubu', areaJp: '中部' },
    三重県: { area: 'chubu', areaJp: '中部' },
    岐阜県: { area: 'chubu', areaJp: '中部' },
    長野県: { area: 'chubu', areaJp: '中部' },
    // Phase 3 九州
    福岡県: { area: 'kyushu', areaJp: '九州' },
    佐賀県: { area: 'kyushu', areaJp: '九州' },
    長崎県: { area: 'kyushu', areaJp: '九州' },
    大分県: { area: 'kyushu', areaJp: '九州' },
    熊本県: { area: 'kyushu', areaJp: '九州' },
    宮崎県: { area: 'kyushu', areaJp: '九州' },
    鹿児島県: { area: 'kyushu', areaJp: '九州' },
    // Phase 2c 東京（東京電力PG）— 静岡/長野/福島/新潟は他社既存マップを維持
    東京都: { area: 'tokyo', areaJp: '東京' },
    神奈川県: { area: 'tokyo', areaJp: '東京' },
    埼玉県: { area: 'tokyo', areaJp: '東京' },
    千葉県: { area: 'tokyo', areaJp: '東京' },
    茨城県: { area: 'tokyo', areaJp: '東京' },
    群馬県: { area: 'tokyo', areaJp: '東京' },
    栃木県: { area: 'tokyo', areaJp: '東京' },
    山梨県: { area: 'tokyo', areaJp: '東京' },
  };
  const prefCounts = new Map<string, number>();
  for (const s of all) {
    if (!s.prefecture) continue;
    if (!PREFECTURE_TO_AREA[s.prefecture]) continue;
    prefCounts.set(s.prefecture, (prefCounts.get(s.prefecture) || 0) + 1);
  }
  const popularPrefs = Array.from(prefCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([pref, count]) => ({
      pref,
      count,
      area: PREFECTURE_TO_AREA[pref].area,
      areaJp: PREFECTURE_TO_AREA[pref].areaJp,
    }));

  // 鮮度の明示: データセット全体の最新 last_updated
  const latestUpdatedStr = (() => {
    const d = all
      .map(s => s.last_updated)
      .filter((v): v is string => !!v)
      .sort()
      .at(-1);
    if (!d) return '—';
    const dt = new Date(d);
    return Number.isNaN(dt.getTime())
      ? d
      : dt.toLocaleDateString('ja-JP', { year: 'numeric', month: 'numeric', day: 'numeric' });
  })();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '系統空き容量データベース',
    description:
      '10社・8,225変電所の系統空き容量・連系条件。中部は地図検索対応。',
    url: 'https://bess-net.jp/grid',
    numberOfItems: total,
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 系統空き容量
          </p>
          <h1 className="page-title">系統空き容量データベース</h1>
          <p className="page-lead">
            系統用蓄電池・再エネ事業の連系検討に必要な変電所別の
            <strong>{total}</strong>地点の空き容量情報。
            <strong>北海道・東北・東京・中部・北陸・関西・中国・四国・九州・沖縄</strong>
            の10送配電事業者の公表 CSV / PDF / GeoJSON を一元化。中部エリアは緯度経度付きで地図表示の基盤に。東京電力PG は <Link href="/grid/tokyo">2026年6月の公開再開を受け13都県＋基幹系を収録</Link>。
          </p>

          {/* v25: ヒーローセクション */}
          <section className="grid-hero" aria-label="蓄電所ネットの強み">
            <div className="grid-hero-badge">🥇 当サイト独自の総合データベース</div>
            <div className="grid-hero-number">{total.toLocaleString()}</div>
            <div className="grid-hero-label">変電所</div>
            <div className="grid-hero-sub">
              全国10社・全国フルカバー（関東含む）
            </div>
            <div className="grid-hero-features">
              <div className="grid-hero-feature">🥇 当サイト独自統合DB</div>
              <div className="grid-hero-feature">🗺 当サイト独自の地図検索</div>
              <div className="grid-hero-feature">🔍 当サイト独自のテキスト検索</div>
              <div className="grid-hero-feature">📍 当サイト独自のクラウドソース基盤</div>
            </div>
          </section>

          {/* v25: サマリ・インフォグラフィック (4カード + 進捗バー) */}
          <section className="grid-section">
            <h2 className="grid-section-h2">📊 全国の系統空き容量データ</h2>
            <div className="grid-summary-cards">
              <div className="grid-summary-card">
                <div className="grid-summary-card-label">空容量プラス</div>
                <div
                  className="grid-summary-card-num"
                  style={{ color: '#16a34a' }}
                >
                  {availPositiveCount.toLocaleString()}
                </div>
                <div className="grid-summary-card-sub">
                  {Math.round((availPositiveCount / total) * 100)}% / 全
                  {total.toLocaleString()}件
                </div>
                <svg
                  width="100%"
                  height="8"
                  className="grid-summary-card-bar"
                  aria-hidden
                >
                  <rect width="100%" height="8" fill="#e5e7eb" rx="4" />
                  <rect
                    width={`${(availPositiveCount / total) * 100}%`}
                    height="8"
                    fill="#16a34a"
                    rx="4"
                  />
                </svg>
              </div>
              <div className="grid-summary-card">
                <div className="grid-summary-card-label">N-1電制適用可</div>
                <div
                  className="grid-summary-card-num"
                  style={{ color: '#2563eb' }}
                >
                  {n1OkCount.toLocaleString()}
                </div>
                <div className="grid-summary-card-sub">
                  {Math.round((n1OkCount / total) * 100)}% /
                  ノンファーム接続候補
                </div>
                <svg
                  width="100%"
                  height="8"
                  className="grid-summary-card-bar"
                  aria-hidden
                >
                  <rect width="100%" height="8" fill="#e5e7eb" rx="4" />
                  <rect
                    width={`${(n1OkCount / total) * 100}%`}
                    height="8"
                    fill="#2563eb"
                    rx="4"
                  />
                </svg>
              </div>
              <div className="grid-summary-card">
                <div className="grid-summary-card-label">
                  地図検索可能（中部）
                </div>
                <div
                  className="grid-summary-card-num"
                  style={{ color: '#ea580c' }}
                >
                  {latlngCount.toLocaleString()}
                </div>
                <div className="grid-summary-card-sub">
                  緯度経度付き、当サイト独自
                </div>
                <svg
                  width="100%"
                  height="8"
                  className="grid-summary-card-bar"
                  aria-hidden
                >
                  <rect width="100%" height="8" fill="#e5e7eb" rx="4" />
                  <rect
                    width={`${(latlngCount / total) * 100}%`}
                    height="8"
                    fill="#ea580c"
                    rx="4"
                  />
                </svg>
                <Link href="/grid/chubu/map" className="grid-summary-card-link">
                  🗺 中部マップを見る →
                </Link>
              </div>
              <div className="grid-summary-card">
                <div className="grid-summary-card-label">対応送配電事業者</div>
                <div
                  className="grid-summary-card-num"
                  style={{ color: '#0066cc' }}
                >
                  10 / 10
                </div>
                <div className="grid-summary-card-sub">
                  東京電力PG を10社目として収録（13都県＋基幹系）
                </div>
                <svg
                  width="100%"
                  height="8"
                  className="grid-summary-card-bar"
                  aria-hidden
                >
                  <rect width="100%" height="8" fill="#e5e7eb" rx="4" />
                  <rect width="100%" height="8" fill="#0066cc" rx="4" />
                </svg>
                <Link href="/grid/tokyo" className="grid-summary-card-link">
                  ⚡ 東京エリアのデータを見る →
                </Link>
              </div>
            </div>
          </section>

          {/* v25: 日本地図ビジュアル */}
          <JapanGridMap
            areas={
              [
                {
                  slug: 'hokkaido',
                  fullName: '北海道',
                  count: byAreaSlug.get('hokkaido') || 0,
                },
                {
                  slug: 'tohoku',
                  fullName: '東北',
                  count: byAreaSlug.get('tohoku') || 0,
                },
                {
                  slug: 'tokyo',
                  fullName: '東京',
                  count: byAreaSlug.get('tokyo') || 0,
                },
                {
                  slug: 'chubu',
                  fullName: '中部',
                  count: byAreaSlug.get('chubu') || 0,
                  hasMap: true,
                },
                {
                  slug: 'hokuriku',
                  fullName: '北陸',
                  count: byAreaSlug.get('hokuriku') || 0,
                },
                {
                  slug: 'kansai',
                  fullName: '関西',
                  count: byAreaSlug.get('kansai') || 0,
                },
                {
                  slug: 'chugoku',
                  fullName: '中国',
                  count: byAreaSlug.get('chugoku') || 0,
                },
                {
                  slug: 'shikoku',
                  fullName: '四国',
                  count: byAreaSlug.get('shikoku') || 0,
                },
                {
                  slug: 'kyushu',
                  fullName: '九州',
                  count: byAreaSlug.get('kyushu') || 0,
                },
                {
                  slug: 'okinawa',
                  fullName: '沖縄',
                  count: byAreaSlug.get('okinawa') || 0,
                },
              ] as JapanAreaInfo[]
            }
          />

          {/* v24: 変電所名フリーテキスト検索バナー */}
          <section className="grid-search-banner" aria-label="変電所名検索">
            <h2 className="grid-search-banner-title">🔍 変電所名で検索</h2>
            <form
              action="/grid/search"
              method="get"
              className="grid-search-form"
            >
              <input
                type="text"
                name="q"
                placeholder="例：西部、松ケ枝、新潟"
                className="grid-search-input"
                aria-label="変電所名で検索"
              />
              <button type="submit" className="grid-search-submit">
                検索
              </button>
            </form>
            <p className="grid-search-banner-note">
              全国10社・{total}変電所から名称で検索（部分一致）
            </p>
            {/* v25: 詳細検索リンク */}
            <p className="grid-search-banner-note">
              <Link href="/grid/search">
                🔧 詳細検索（エリア・電圧・空容量・N-1で絞り込み）
              </Link>
            </p>
          </section>

          {/* 事業者別 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">送配電事業者別</h2>
            <ul className="grid-list">
              {operatorList.map(([op, n]) => {
                const map: Record<string, { slug: string; areaJp: string }> = {
                  東北電力ネットワーク: { slug: 'tohoku', areaJp: '東北' },
                  北陸電力送配電: { slug: 'hokuriku', areaJp: '北陸' },
                  四国電力送配電: { slug: 'shikoku', areaJp: '四国' },
                  関西電力送配電: { slug: 'kansai', areaJp: '関西' },
                  中国電力ネットワーク: { slug: 'chugoku', areaJp: '中国' },
                  沖縄電力: { slug: 'okinawa', areaJp: '沖縄' },
                  北海道電力ネットワーク: { slug: 'hokkaido', areaJp: '北海道' },
                  中部電力パワーグリッド: { slug: 'chubu', areaJp: '中部' },
                  九州電力送配電: { slug: 'kyushu', areaJp: '九州' },
                  東京電力パワーグリッド: { slug: 'tokyo', areaJp: '東京' },
                };
                const m = map[op];
                return (
                  <li key={op} className="grid-list-row">
                    <span className="grid-list-label">{op}</span>
                    <span className="grid-list-value">
                      {n} 件
                      {m && (
                        <>
                          {' '}
                          <Link
                            href={`/grid/${m.slug}`}
                            className="grid-area-link"
                          >
                            → {m.areaJp}エリア詳細を見る
                          </Link>
                        </>
                      )}
                      {m?.slug === 'chubu' && (
                        <>
                          {' '}
                          <Link
                            href="/grid/chubu/map"
                            className="grid-area-link"
                            style={{ marginLeft: '8px' }}
                          >
                            🗺 マップで見る
                          </Link>
                        </>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* 人気の検索（都道府県別件数 上位 8） */}
          {popularPrefs.length > 0 && (
            <section className="grid-section">
              <h2 className="grid-section-h2">人気の検索（都道府県別）</h2>
              <ul className="grid-popular-prefs">
                {popularPrefs.map(({ pref, count, area }) => (
                  <li key={pref}>
                    <Link href={`/grid/${area}`} className="grid-popular-link">
                      {pref}の変電所
                      <span className="grid-popular-count">（{count}件）</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="grid-source-note">
                各都道府県の変電所は、エリアページで都道府県別ブレークダウン・上位3変電所リンクから詳細にアクセスできます。
              </p>
              {/* v25: 都道府県ディレクトリ */}
              <p className="grid-source-note">
                <Link href="/grid/prefecture" className="grid-area-link">
                  📍 全都道府県の変電所一覧を見る →
                </Link>
              </p>
            </section>
          )}

          {/* 電圧階級別 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">電圧階級別</h2>
            <ul className="grid-list">
              {voltageList.map(([v, n]) => (
                <li key={v} className="grid-list-row">
                  <span className="grid-list-label">{v}</span>
                  <span className="grid-list-value">{n} 件</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 注目変電所（空容量プラス × N-1電制適用可、上位12件） */}
          {highlights.length > 0 && (
            <section className="grid-section">
              <h2 className="grid-section-h2">
                注目変電所（空容量プラス × N-1電制適用可、上位12件）
              </h2>
              <ul className="grid-cards">
                {highlights.map((s) => (
                  <li key={s.id} className="grid-card">
                    <Link href={`/grid/${s.slug}`} className="grid-card-link">
                      <div className="grid-card-head">
                        <span className="grid-tag grid-tag-operator">
                          {s.operator?.[0] ?? ''}
                        </span>
                        {s.voltage_class?.[0] && (
                          <span className="grid-tag grid-tag-voltage">
                            {s.voltage_class[0]}
                          </span>
                        )}
                      </div>
                      <div className="grid-card-name">{s.name}</div>
                      <div className="grid-card-meta">
                        {s.prefecture && <span>{s.prefecture}</span>}
                        {typeof s.cap_avail_mw === 'number' && (
                          <span>
                            空容量 <strong>{s.cap_avail_mw} MW</strong>
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 系統連系診断CTA（最高エンゲージ 平均92.7秒） */}
          <section style={{
            margin: '24px 0',
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
            border: '2px solid #2563eb',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            flexWrap: 'wrap',
          }}>
            <div style={{ flex: 1, minWidth: '220px' }}>
              <p style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: '700', color: '#1e40af' }}>
                ⚡ 系統連系の可否・コストを今すぐ診断
              </p>
              <p style={{ margin: 0, fontSize: '15px', color: '#4b5563', lineHeight: 1.6 }}>
                変電所名・エリアから連系候補を絞り込み、N-1電制の適用可否・接続コスト概算を確認できます。
              </p>
            </div>
            <Link
              href="/tools/grid-connection-check"
              style={{
                padding: '12px 24px',
                background: '#2563eb',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '8px',
                fontWeight: '700',
                fontSize: '15px',
                whiteSpace: 'nowrap',
              }}
            >
              系統連系診断を始める →
            </Link>
          </section>

          {/* データ提供元の明記（落とし穴45） */}
          <section className="grid-section grid-source-section">
            <h2 className="grid-section-h2">出典・利用条件</h2>
            <p>
              本データは{' '}
              <strong>北海道電力NW・東北電力NW・東京電力PG・中部電力PG・北陸電力送配電・関西電力送配電・中国電力NW・四国電力送配電・九州電力送配電・沖縄電力</strong>
              {' '}の10送配電事業者が公開する予想潮流等情報の CSV / PDF / GeoJSON を、蓄電所ネット編集部で一元化したものです。
              個別変電所の最新情報は、各社の公式サイト（一次ソースリンク）でご確認ください。
              数値の引用・転記には出典明記が必要です。
            </p>
            <p style={{ marginTop: 4, fontSize: 15, color: 'var(--color-muted)' }}>
              ※ 東京電力PG は2026年4月23日時点の予想潮流等PDF（13都県＋基幹系）を収録。空容量は逆潮流側の値です。
            </p>
            <p style={{ marginTop: 8, fontSize: 15, color: 'var(--color-muted)' }}>
              データ最終更新（代表）：<strong>{latestUpdatedStr}</strong>
              <Link href="/tracker/grid" className="grid-area-link">更新タイムラインを見る →</Link>
            </p>
          </section>

          <section style={{
            marginTop: 32, padding: 16,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)', borderRadius: 6,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連 (当サイト独自機能)</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>
                制度の仕組み（EIC Data 教材）:{' '}
                <a href="https://data.eic-jp.org/insight/wheeling-charge-structure?utm_source=bess-net&utm_medium=referral&utm_campaign=edu_cluster" target="_blank" rel="noopener noreferrer">
                  託送料金の仕組み ↗
                </a>
              </li>
              <li><Link href="/tools/grid-connection-check">系統連系診断</Link> — 緯度経度から接続候補変電所を 5 件抽出</li>
              <li><Link href="/tracker/grid">系統トラッカー</Link> — 変電所データの更新タイムライン</li>
              <li><Link href="/grid/chubu/map">中部マップ (Leaflet)</Link> — 1,081箇所 地図検索</li>
              <li><Link href="/industry">業界分析ハブ</Link></li>
            </ul>
          </section>

          <p className="back-link">
            <Link href="/">← トップへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
