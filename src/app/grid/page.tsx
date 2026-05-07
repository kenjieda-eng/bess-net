// /grid 系統空き容量DB トップ — Phase 1（3社・1,449件）
// 検索・地図機能は Phase 2 以降。現状は概要・サマリ統計を表示。
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllSubstations } from '@/lib/microcms';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '系統空き容量データベース ｜ 蓄電所ネット',
  description:
    '系統用蓄電池・再エネの連系検討に必要な、変電所別の系統空き容量・予想潮流・出力制御の可能性・N-1電制適用可否を、東北電力NW・北陸電力送配電・四国電力送配電の3社1,449地点について公表情報ベースで一元化。Phase 2 以降で残り7社・地図機能を追加予定。',
  alternates: { canonical: '/grid' },
  openGraph: {
    title: '系統空き容量データベース ｜ 蓄電所ネット',
    description: '東北・北陸・四国 3社・1,449変電所の系統空き容量・連系条件',
    type: 'website',
  },
};

export default async function GridIndexPage() {
  const all = await getAllSubstations();

  // サマリ統計
  const total = all.length;
  const byOperator = new Map<string, number>();
  const byVoltage = new Map<string, number>();
  let n1OkCount = 0;
  let availPositiveCount = 0;
  for (const s of all) {
    const op = (s.operator && s.operator[0]) || 'その他';
    byOperator.set(op, (byOperator.get(op) || 0) + 1);
    const vc = (s.voltage_class && s.voltage_class[0]) || 'その他';
    byVoltage.set(vc, (byVoltage.get(vc) || 0) + 1);
    if (s.n1_eligible === true) n1OkCount++;
    if (typeof s.cap_avail_mw === 'number' && s.cap_avail_mw > 0) availPositiveCount++;
  }

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

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '系統空き容量データベース',
    description:
      '東北・北陸・四国 3社・1,449変電所の系統空き容量・連系条件',
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
            <strong>東北・北陸・四国・関西・中国・沖縄・北海道・中部</strong>
            の8送配電事業者の公表 CSV / PDF / GeoJSON を一元化。中部エリアは緯度経度付きで地図表示の基盤に。Phase 2-C-2 で東京PG、Phase 3 で九州（地点別実績→PDF対応）を順次追加予定。
          </p>

          {/* サマリ統計 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">サマリ統計</h2>
            <div className="grid-stats">
              <div className="grid-stat-card">
                <div className="grid-stat-num">{total}</div>
                <div className="grid-stat-label">総変電所数（変圧器バンク含む）</div>
              </div>
              <div className="grid-stat-card">
                <div className="grid-stat-num">{availPositiveCount}</div>
                <div className="grid-stat-label">空容量プラス</div>
              </div>
              <div className="grid-stat-card">
                <div className="grid-stat-num">{n1OkCount}</div>
                <div className="grid-stat-label">N-1電制適用可</div>
              </div>
            </div>
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
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="grid-source-note">
              ※ 残り 1社（東京電力PG）は Phase 2-C-2 地図API対応で追加予定。九州電力送配電は時系列実績データのみ公開のため Phase 3 で個別対応。
            </p>
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

          {/* データ提供元の明記（落とし穴45） */}
          <section className="grid-section grid-source-section">
            <h2 className="grid-section-h2">出典・利用条件</h2>
            <p>
              本データは{' '}
              <strong>東北電力ネットワーク・北陸電力送配電・四国電力送配電</strong>
              {' '}が公開する予想潮流等情報の CSV を、蓄電所ネット編集部で一元化したものです。
              個別変電所の最新情報は、各社の公式サイト（一次ソースリンク）でご確認ください。
              数値の引用・転記には出典明記が必要です。
            </p>
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
