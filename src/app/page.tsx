// トップページ — 15→8セクション再構成（top分析2026-07-12・EDAさん承認済み設計図）
// 大原則: 削除ではなく移設（記録系＝公開予定/ロードマップは /milestones へ）。
// 数値は全て動的導出（microCMS totalCount／substations INDEX、焼き込みゼロ・追加リクエスト0）
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import { getExplainerList, getGlossaryList, getIndustryNews, getSubstationList, getAllPolicyEvents, type PolicyEvent } from '@/lib/microcms';
import {
  POLICY_DETAIL_SLUG_SET,
  EVENT_TYPE_COLORS,
  firstOf,
  formatDateJa,
  jstTodayISO,
} from '@/lib/policy-utils';
import substationsIndex from '@/data/substations/index.json';

export const revalidate = 60;

// ローカル JSON（変電所 total は microCMS 失敗時のフォールバック、with_coords は中部マップ箇所数）
const SUBSTATION_INDEX = substationsIndex as { total: number; with_coords: number };

// セクション4「データベースとツール」前面カード5枚（GA4 利用順・tools分析2026-07-09 準拠）
// 説明文は旧「9機能」カードの文言を継承（変電所数は動的挿入）
function buildPrimaryCards(substationsCountStr: string, chubuCountStr: string) {
  return [
    { href: '/tools/grid-connection-check', title: '系統連系診断', desc: `緯度経度 / 都道府県から接続候補変電所 5件抽出 (${substationsCountStr}件DB)。`, tag: 'ツール' },
    { href: '/tools/irr-simulator', title: '蓄電池 IRR シミュレーター', desc: '11入力 × 20年DCF × 感度分析。無料・登録不要のオープン公開ツール。', tag: 'ツール' },
    { href: '/grid', title: '変電所別 系統空き容量DB', desc: `全国10社・${substationsCountStr}件の予想潮流・空容量・N-1電制適用可否を一元化（表形式・エリア別/都道府県別/名称検索）。`, tag: 'DB' },
    { href: '/grid/chubu/map', title: '中部地方 変電所マップ', desc: `中部電力PG管内 ${chubuCountStr}箇所を緯度経度付きで Leaflet 地図に可視化。空き容量・N-1電制をマーカー色で直感把握。`, tag: 'DB' },
    { href: '/tools/fire-risk-check', title: '火災リスク自己診断', desc: '25問チェック式、教育型。安全文化醸成に。', tag: 'ツール' },
  ];
}

// 折りたたみ側（初期DOMに全文残す・#107 表示切替方式＝details）
const moreFeatures = [
  { href: '/tools/subsidy-match', title: '補助金マッチング', desc: '事業条件から最適補助金を自動マッチング (50+件)。', tag: 'ツール' },
  { href: '/tools/capacity-market-bid', title: '容量市場応札試算', desc: '9エリア × FY2024-FY2029。OCCTO実データ連携。', tag: 'ツール' },
  { href: '/map/industry-chaos', title: '業界カオスマップ', desc: '50+社 × 11カテゴリ + 35関係。Matrix + Force graph。', tag: 'ハブ' },
  { href: '/market/jepx', title: 'JEPX ハブ', desc: '9エリア × 30日 × 30分。ヒートマップ + アービ計算機。', tag: 'ハブ' },
  { href: '/global', title: '海外5市場ハブ', desc: '米国/EU/中国/インド/豪州 比較マトリクス。', tag: 'ハブ' },
  { href: '/tracker', title: '業界トラッカー (4軸)', desc: '補助金/系統/事業者/案件 の更新タイムライン。', tag: 'ハブ' },
];

// カード共通レンダリング
function FeatureCard({ f }: { f: { href: string; title: string; desc: string; tag: string } }) {
  return (
    <Link key={f.href} href={f.href} style={{
      display: 'block',
      padding: 14,
      border: '1px solid var(--color-border)',
      borderRadius: 8,
      textDecoration: 'none',
      color: 'inherit',
      background: 'white',
    }}>
      <div style={{
        fontSize: 10,
        display: 'inline-block',
        padding: '1px 6px',
        background: f.tag === 'ツール' ? '#ffe4d6' : '#d6e4ff',
        color: f.tag === 'ツール' ? '#a44' : '#346',
        borderRadius: 3,
        marginBottom: 4,
      }}>{f.tag}</div>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '4px 0' }}>{f.title}</h3>
      <p style={{ fontSize: 12, lineHeight: 1.6, margin: 0, color: 'var(--color-muted)' }}>{f.desc}</p>
    </Link>
  );
}

export default async function Home() {
  // 公開済みコンテンツの最新を取得（newsはAPI未作成でも落ちないようにラップ）
  const safeFetch = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch { return fallback; }
  };

  const [explainerData, glossaryNew, glossaryTotal, industryNewsAll, substationsCount, policyEventsAll] = await Promise.all([
    getExplainerList({ limit: 6, orders: '-publishedAt' }),
    getGlossaryList({ limit: 10, orders: '-publishedAt' }),
    getGlossaryList({ limit: 1, fields: 'id' }),
    safeFetch(() => getIndustryNews(), [] as any[]),
    safeFetch(async () => (await getSubstationList({ limit: 0, fields: 'id' })).totalCount, 0),
    safeFetch(() => getAllPolicyEvents(), [] as PolicyEvent[]),
  ]);
  // 直近の制度スケジュール（本日以降JST・60日以内・日付昇順・最大3件。0件時は小ブロック非表示）
  const todayJst = jstTodayISO();
  const in60d = new Date(new Date(todayJst).getTime() + 60 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const upcomingPolicyEvents = policyEventsAll
    .filter((e) => {
      const d = (e.eventDate || '').slice(0, 10);
      return d >= todayJst && d <= in60d;
    })
    .sort((a, b) => (a.eventDate < b.eventDate ? -1 : 1))
    .slice(0, 3);
  // 変電所件数: microCMS totalCount（失敗時はローカル INDEX.total、リテラル焼き込みなし）
  const substationsCountStr = (substationsCount > 0 ? substationsCount : SUBSTATION_INDEX.total).toLocaleString('en-US');
  // 中部マップ箇所数: 緯度経度付き件数（現状 中部のみ座標収録＝INDEX.with_coords）
  const chubuCountStr = SUBSTATION_INDEX.with_coords.toLocaleString('en-US');
  // 業界ニュース最新3本（編集部=お知らせは除外済み）
  const latestNews = (industryNewsAll as any[])
    .slice()
    .sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, 3);
  const glossaryCount = glossaryTotal.totalCount;
  const explainerCount = explainerData.totalCount;
  const primaryCards = buildPrimaryCards(substationsCountStr, chubuCountStr);

  return (
    <>
      <SiteHeader />

      {/* ── 1. ヒーロー ───────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <h1>
            系統用蓄電池・低圧リソース事業の
            <br />
            <span className="accent">実務情報ポータル</span>
          </h1>
          <p>
            業界ニュース、プロジェクトデータベース、市場制度解説、補助金カレンダー、政策・法制度カレンダー、業界イベント、業界用語FAQ、変電所別 系統空き容量、事業者情報。蓄電所事業に関わるすべての方が「ここに来れば一通りわかる」サイトを目指します。
          </p>
          {/* 実績数値（全て動的導出・焼き込みなし） */}
          <p style={{ fontSize: 14, opacity: 0.92, marginTop: 8 }}>
            解説記事 {explainerCount}本 · 用語集 {glossaryCount.toLocaleString('en-US')}語 · 変電所 {substationsCountStr}件/10社 · 中部マップ {chubuCountStr}箇所
          </p>
          <div className="hero-cta">
            <Link href="/tools/grid-connection-check" className="btn-primary">
              系統連系診断を使う
            </Link>
            <Link href="/reports/2026" className="btn-secondary">
              業界レポート2026を読む
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. あなたに合った入口へ（入口再設計2026-07-15: 8動線→3分岐LP。既存8ページは各LPの深掘り先に降格・存置） ── */}
      <section className="section" style={{ background: '#f8fafc' }}>
        <div className="section-inner">
          <div className="section-label" style={{ color: '#1e40af', fontWeight: 700 }}>Start Here</div>
          <h2 className="section-title">あなたに合った入口へ</h2>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 32, lineHeight: 1.7 }}>
            立場に合わせて、3つの入口を用意しています。
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24 }}>
            {[
              { href: '/start/buy', title: '蓄電所を買いたい・導入したい', desc: '稼働中の取得・新規開発への投資・工場や施設への導入のご相談' },
              { href: '/start/sell', title: '蓄電所を売りたい・案件がある', desc: '売却・譲渡、開発中案件や土地の活用のご相談' },
              { href: '/start/partner', title: '蓄電池ビジネスに事業として関わりたい', desc: 'データ・ツール・協業の窓口' },
            ].map((it) => (
              <Link key={it.href} href={it.href} style={{
                display: 'block', background: 'white', padding: 28, borderRadius: 12,
                border: '1px solid #e2e8f0', textDecoration: 'none', color: 'inherit',
              }}>
                <h3 style={{ fontSize: 19, fontWeight: 700, color: '#0f172a', marginTop: 0, marginBottom: 8, lineHeight: 1.5 }}>
                  {it.title}
                </h3>
                <p style={{ fontSize: 14, color: '#475569', margin: 0, lineHeight: 1.7 }}>{it.desc}</p>
                <div style={{ fontSize: 13, color: '#1e40af', fontWeight: 600, marginTop: 12 }}>入口を開く →</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3. 今週の動き（制度スケジュール＋業界ニュース統合） ─────── */}
      {(upcomingPolicyEvents.length > 0 || latestNews.length > 0) && (
        <section className="section section-alt">
          <div className="section-inner">
            <div className="section-label">This Week · 制度と業界の直近動向</div>
            <h2 className="section-title">今週の動き</h2>

            {upcomingPolicyEvents.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '16px 0 8px' }}>📅 直近の制度スケジュール</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px' }}>
                  {upcomingPolicyEvents.map((ev) => {
                    const type = firstOf(ev.eventType);
                    const href = POLICY_DETAIL_SLUG_SET.has(ev.slug)
                      ? `/policy-calendar/${ev.slug}`
                      : '/policy-calendar';
                    return (
                      <li
                        key={ev.id}
                        style={{
                          padding: '12px 16px',
                          marginBottom: 10,
                          border: '1px solid var(--color-border)',
                          borderRadius: 6,
                          background: 'var(--color-bg-card, #fff)',
                          fontSize: 14,
                          lineHeight: 1.6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color: 'var(--color-muted)',
                            marginRight: 10,
                            fontVariantNumeric: 'tabular-nums',
                          }}
                        >
                          {formatDateJa(ev.eventDate)}
                        </span>
                        {type && (
                          <span
                            style={{
                              fontSize: 11,
                              padding: '2px 8px',
                              borderRadius: 4,
                              color: '#fff',
                              background: EVENT_TYPE_COLORS[type] || '#666',
                              fontWeight: 600,
                              marginRight: 10,
                            }}
                          >
                            {type}
                          </span>
                        )}
                        <Link href={href} style={{ fontWeight: 600 }}>
                          {ev.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {latestNews.length > 0 && (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '20px 0 8px' }}>
                  📰 業界ニュース <Link href="/news" style={{ fontSize: 13, fontWeight: 600, marginLeft: 8 }}>すべて見る →</Link>
                </h3>
                <ul className="article-list">
                  {latestNews.map((article: any) => (
                    <li key={article.id} className="article-item">
                      <Link href={`/news/${article.slug}`} className="article-link">
                        {article.category && article.category[0] && (
                          <span className="article-category">{article.category[0]}</span>
                        )}
                        <h4 className="article-title" style={{ margin: 0 }}>{article.title}</h4>
                        <p className="article-lead">{article.lead}</p>
                        <span className="article-date">
                          {new Date(article.publishedAt).toLocaleDateString('ja-JP')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <p style={{ fontSize: 13, marginTop: 12 }}>
              カレンダーで追う: <Link href="/policy-calendar" style={{ fontWeight: 600 }}>政策・法制度</Link>
              {' / '}
              <Link href="/events" style={{ fontWeight: 600 }}>業界イベント</Link>
              {' / '}
              <Link href="/subsidies" style={{ fontWeight: 600 }}>補助金</Link>
            </p>
          </div>
        </section>
      )}

      {/* ── 4. データベースとツール（9機能＋中部マップ＋系統DBを統合） ── */}
      <section className="section">
        <div className="section-inner">
          <div className="section-label">Tools & Database · 無料・登録不要</div>
          <h2 className="section-title">データベースとツール</h2>
          <p className="section-desc" style={{ marginBottom: 24 }}>
            系統・事業性・安全の意思決定に直結するデータベースとブラウザ完結ツールを無料公開しています。
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 12,
          }}>
            {primaryCards.map((f) => (
              <FeatureCard key={f.href} f={f} />
            ))}
          </div>
          {/* 残り機能はデフォルト折りたたみ（#107: details=表示切替・初期DOMに全文残る） */}
          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'var(--color-accent, #0066cc)' }}>
              その他の機能を表示（補助金マッチング・容量市場応札試算・業界分析ハブ など 6件）
            </summary>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: 12,
              marginTop: 12,
            }}>
              {moreFeatures.map((f) => (
                <FeatureCard key={f.href} f={f} />
              ))}
            </div>
          </details>
          <p style={{ fontSize: 14, marginTop: 16 }}>
            <Link href="/tools" style={{ fontWeight: 600 }}>すべてのツールを見る →</Link>
          </p>
        </div>
      </section>

      {/* ── 5. 業界レポート2026（旗艦棚） ───────────────────── */}
      <section className="section section-alt">
        <div className="section-inner">
          <div className="home-feature">
            <span className="home-feature-tag">Annual Report · 公開中</span>
            <h2>📕 業界レポート2026</h2>
            <p>
              蓄電所事業の年次レポート（本編・全10章）を公開中。市場概況・政策・主要プレイヤー・系統データ・補助金・火災事例・海外比較・展望を、当サイトのデータベースと公的一次情報から編集統合した決定版です。
            </p>
            <Link href="/reports/2026" className="home-feature-button">
              業界レポート2026を読む →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 6. 学ぶ・調べる（解説記事＋用語集の2カラム統合） ────────── */}
      <section className="section">
        <div className="section-inner">
          <div className="section-label">Learn · 学ぶ・調べる</div>
          <h2 className="section-title">学ぶ・調べる</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 32, marginTop: 16 }}>
            {/* 解説記事 */}
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>
                解説記事（{explainerCount}本）
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12 }}>
                市場制度・参入手順・補助金など、実務担当者向けに体系解説。
                <Link href="/explainer" style={{ fontWeight: 600, marginLeft: 6 }}>すべて見る →</Link>
              </p>
              {explainerData.contents.length === 0 ? (
                <p>記事はまだありません。準備中です。</p>
              ) : (
                <ul className="article-list">
                  {explainerData.contents.map((article) => (
                    <li key={article.id} className="article-item">
                      <Link href={`/explainer/${article.slug}`} className="article-link">
                        <span className="article-category">{article.category}</span>
                        <h4 className="article-title" style={{ margin: 0 }}>{article.title}</h4>
                        <span className="article-date">
                          {new Date(article.publishedAt).toLocaleDateString('ja-JP')}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* 用語集 */}
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>
                用語集（{glossaryCount.toLocaleString('en-US')}語）
              </h3>
              <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12 }}>
                業界用語を一言定義と詳細解説で整備。
                <Link href="/glossary" style={{ fontWeight: 600, marginLeft: 6 }}>用語集を開く →</Link>
              </p>
              {glossaryNew.contents.length > 0 && (
                <ul className="glossary-list">
                  {glossaryNew.contents.slice(0, 10).map((g) => (
                    <li key={g.id}>
                      <Link href={`/glossary/${g.slug}`} className="glossary-card">
                        <div className="glossary-card-term">{g.term}</div>
                        {g.reading && (
                          <div className="glossary-card-reading">{g.reading}</div>
                        )}
                        <div className="glossary-card-def">{g.shortDef}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <p style={{ fontSize: 13, marginTop: 16 }}>
            <Link href="/faq" style={{ fontWeight: 600 }}>業界用語よくある質問（FAQ）→</Link>
          </p>
        </div>
      </section>

      {/* ── 7. 稼働中蓄電所のご紹介（静かなバンド・PRバナーの受け皿） ── */}
      <section className="section section-alt">
        <div className="section-inner">
          <p style={{ fontSize: 15, margin: 0, textAlign: 'center' }}>
            稼働中の系統用蓄電池（蓄電所）のご紹介が可能です —{' '}
            <Link href="/info/operating-bess-introduction" style={{ fontWeight: 700 }}>
              詳しくはこちら →
            </Link>
          </p>
        </div>
      </section>

      {/* ── 8. お問い合わせ（現行維持）＋サイトの歩みリンク ─────────── */}
      <section className="section contact">
        <div className="section-inner">
          <div className="section-label">Contact</div>
          <h2 className="section-title">お問い合わせ・取材ご依頼</h2>
          <p>
            蓄電所ネットでは、業界関係者からの情報提供・取材ご協力・サイトへの情報掲載依頼を歓迎します。記事化を保証するものではありませんが、編集部にて拝見の上、適切に検討いたします。
          </p>
          <p>
            <a
              href={siteConfig.organization.contactUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {siteConfig.organization.contactUrl}
            </a>{' '}
            までご連絡ください。
          </p>
          {/* 記録系（ロードマップ・公開予定）は /milestones へ移設（top分析2026-07-12） */}
          <p style={{ fontSize: 13, marginTop: 16 }}>
            <Link href="/milestones" style={{ fontWeight: 600 }}>サイトの歩み・公開予定 →</Link>
          </p>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
