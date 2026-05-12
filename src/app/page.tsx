import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import { getExplainerList, getGlossaryList, getIndustryNews, getSubstationList } from '@/lib/microcms';
import type { RoadmapStatus } from '@/lib/site-config';

const ROADMAP_BADGE: Record<RoadmapStatus, { label: string; className: string }> = {
  done: { label: '✅ 公開済', className: 'roadmap-badge roadmap-badge-done' },
  'in-progress': { label: '🚧 開発中', className: 'roadmap-badge roadmap-badge-in-progress' },
  planned: { label: '📅 計画中', className: 'roadmap-badge roadmap-badge-planned' },
};

export const revalidate = 60;

// Sprint 5+ で計画中の真に未公開なコンテンツのみ列挙。
// 既公開コーナーは「Now Live · 注目コーナー」または「公開中」セクションへ移動済み。
const upcomingFeatures = [
  {
    num: '01',
    title: '日本の蓄電所マップ全国展開',
    body:
      '現在は中部電力PG 配下 1,081箇所を先行公開。残る7社（東北・北陸・関西・中国・四国・九州・北海道）の緯度経度補完を進めつつ、Leaflet レイヤーへ順次展開予定。',
    status: 'Sprint 3〜4（進行中）',
  },
  {
    num: '02',
    title: '火災・トラブル事例DB',
    body:
      '国内外の蓄電池トラブル事例（火災・性能低下・系統影響）を公開資料に基づき体系化。業界の安全文化向上に資する情報基盤を構築。',
    status: 'Sprint 5',
  },
  {
    num: '03',
    title: '事業者ナビ拡充・口コミ機能',
    body:
      '現在 86社・78ops を継続拡充しつつ、利用事業者からの匿名レビュー機能を検討中。EPC・O&M・PCS 事業者の客観的評価基盤に。',
    status: 'Sprint 6〜',
  },
];

export default async function Home() {
  // 公開済みコンテンツの最新を取得（newsはAPI未作成でも落ちないようにラップ）
  const safeFetch = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch { return fallback; }
  };

  const emptyList = { contents: [], totalCount: 0, offset: 0, limit: 0 };

  const [explainerData, glossaryNew, glossaryTotal, industryNewsAll, substationsCount] = await Promise.all([
    getExplainerList({ limit: 6, orders: '-publishedAt' }),
    getGlossaryList({ limit: 10, orders: '-publishedAt' }),
    getGlossaryList({ limit: 1, fields: 'id' }),
    safeFetch(() => getIndustryNews(), [] as any[]),
    safeFetch(async () => (await getSubstationList({ limit: 0, fields: 'id' })).totalCount, 0),
  ]);
  const substationsCountStr = substationsCount > 0 ? substationsCount.toLocaleString('en-US') : '4,097';
  // 業界ニュース最新3本（編集部=お知らせは除外済み）
  const newsData = {
    contents: (industryNewsAll as any[])
      .slice()
      .sort(
        (a: any, b: any) =>
          new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      )
      .slice(0, 3),
    totalCount: (industryNewsAll as any[]).length,
    offset: 0,
    limit: 3,
  };
  const glossaryCount = glossaryTotal.totalCount;
  const explainerCount = explainerData.totalCount;

  return (
    <>
      <SiteHeader />

      {/* ヒーロー */}
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
          <div className="hero-cta">
            <Link href="/explainer" className="btn-primary">
              解説記事を読む
            </Link>
            <Link href="/glossary" className="btn-secondary">
              用語集を見る
            </Link>
          </div>
        </div>
      </section>

      {/* AA Phase 4: 業界唯一の地図ベース変電所空き容量DB — 差別化資産の最上位告知 */}
      <section className="section section-alt">
        <div className="section-inner">
          <div className="home-feature">
            <span className="home-feature-tag">業界唯一 · Phase 4 公開中</span>
            <h2>🗺 中部地方 変電所空き容量マップ</h2>
            <p>
              中部電力パワーグリッド管内の <strong>1,081箇所</strong> の変電所を、緯度経度付きで Leaflet 地図に可視化。
              系統空き容量・N-1電制適用可否・出力制御リスクをマーカー色で直感的に把握できる、
              <strong>業界初の検索可能・地図ベース変電所空き容量データベース</strong> です。
            </p>
            <ul className="home-feature-stats">
              <li>
                <strong>1,081</strong>変電所
              </li>
              <li>
                <strong>業界初</strong>地図UI
              </li>
              <li>
                <strong>緯度経度</strong>付き
              </li>
            </ul>
            <Link href="/grid/chubu/map" className="home-feature-button">
              マップを開く →
            </Link>
          </div>
        </div>
      </section>

      {/* Sprint 2 Day 2 完遂: 新規 3 corners 同時公開 — /policy-calendar /events /faq */}
      <section className="section">
        <div className="section-inner">
          <div className="section-label">NEW · Sprint 2 新コーナー</div>
          <h2 className="section-title">時系列で追う、業界の今と動向</h2>
          <p className="section-desc" style={{ marginBottom: 24 }}>
            政策・法制度の動き、業界イベント・展示会、よくある質問。蓄電所事業に必要な情報を時系列・体系的に整理しました。
          </p>
          <div className="feature-grid">
            <div className="feature">
              <div className="feature-num">
                01<span className="feature-status">公開中</span>
              </div>
              <h3>政策・法制度カレンダー</h3>
              <p>
                経産省・OCCTO・環境省・NEDO・SII の <strong>26件</strong> の主要政策イベント（法改正・パブコメ・重要会議・オークション・補助金公募）を時系列で一覧。
              </p>
              <p style={{ marginTop: 8 }}>
                <Link href="/policy-calendar" style={{ fontWeight: 600 }}>
                  /policy-calendar を開く →
                </Link>
              </p>
            </div>
            <div className="feature">
              <div className="feature-num">
                02<span className="feature-status">公開中</span>
              </div>
              <h3>業界イベント・展示会カレンダー</h3>
              <p>
                スマートエネルギーWeek・PV EXPO・Energy Storage Japan 等の <strong>40件</strong> の展示会・セミナー・学会・業界団体総会を時系列で一覧。
              </p>
              <p style={{ marginTop: 8 }}>
                <Link href="/events" style={{ fontWeight: 600 }}>
                  /events を開く →
                </Link>
              </p>
            </div>
            <div className="feature">
              <div className="feature-num">
                03<span className="feature-status">公開中</span>
              </div>
              <h3>業界用語よくある質問（FAQ）</h3>
              <p>
                制度・技術・事業・補助金・その他の5カテゴリで <strong>50件</strong> のQ&Aを整理。新規参入者から既存事業者まで、エントリーポイントとして。
              </p>
              <p style={{ marginTop: 8 }}>
                <Link href="/faq" style={{ fontWeight: 600 }}>
                  /faq を開く →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 既存: 系統空き容量DB（マップ以外のテーブル形式アクセス）*/}
      <section className="section section-alt">
        <div className="section-inner">
          <div className="home-feature">
            <span className="home-feature-tag">公開中 · 9社 系統データ</span>
            <h2>変電所別 系統空き容量データベース（表形式）</h2>
            <p>
              北海道電力NW・東北電力NW・中部電力PG・北陸電力送配電・関西電力送配電・中国電力NW・四国電力送配電・九州電力送配電・沖縄電力 の <strong>9社・約{substationsCountStr}件</strong> の予想潮流・空容量・N-1電制適用可否を、公表データに基づき一元化。エリア別・都道府県別・名称検索でアクセス可能です。
            </p>
            <Link href="/grid" className="home-feature-button">
              データベースを見る →
            </Link>
          </div>
        </div>
      </section>

      {/* 最新ニュース（あれば） */}
      {newsData.contents.length > 0 && (
        <section className="section">
          <div className="section-inner">
            <div className="section-header">
              <div>
                <div className="section-label">News · 最新</div>
                <h2 className="section-title">業界ニュース</h2>
                <p className="section-desc">
                  系統用蓄電池・低圧リソース事業の最新動向。
                </p>
              </div>
              <Link href="/news" className="section-link">
                すべて見る →
              </Link>
            </div>
            <ul className="article-list">
              {newsData.contents.map((article: any) => (
                <li key={article.id} className="article-item">
                  <Link href={`/news/${article.slug}`} className="article-link">
                    {article.category && article.category[0] && (
                      <span className="article-category">{article.category[0]}</span>
                    )}
                    <h3 className="article-title">{article.title}</h3>
                    <p className="article-lead">{article.lead}</p>
                    <span className="article-date">
                      {new Date(article.publishedAt).toLocaleDateString('ja-JP')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* 公開中：解説記事 */}
      <section className={newsData.contents.length > 0 ? "section section-alt" : "section"}>
        <div className="section-inner">
          <div className="section-header">
            <div>
              <div className="section-label">Now Live · 公開中</div>
              <h2 className="section-title">解説記事（{explainerCount}本）</h2>
              <p className="section-desc">
                市場制度・参入手順・補助金など、業界の実務担当者向けに体系的に解説します。
              </p>
            </div>
            <Link href="/explainer" className="section-link">
              すべて見る →
            </Link>
          </div>

          {explainerData.contents.length === 0 ? (
            <p>記事はまだありません。準備中です。</p>
          ) : (
            <ul className="article-list">
              {explainerData.contents.map((article) => (
                <li key={article.id} className="article-item">
                  <Link
                    href={`/explainer/${article.slug}`}
                    className="article-link"
                  >
                    <span className="article-category">{article.category}</span>
                    <h3 className="article-title">{article.title}</h3>
                    <p className="article-lead">{article.lead}</p>
                    <span className="article-date">
                      {new Date(article.publishedAt).toLocaleDateString('ja-JP')}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 公開中：用語集 */}
      <section className={newsData.contents.length > 0 ? "section" : "section section-alt"}>
        <div className="section-inner">
          <div className="section-header">
            <div>
              <div className="section-label">Now Live · 公開中</div>
              <h2 className="section-title">用語集（{glossaryCount}語）</h2>
              <p className="section-desc">
                蓄電所事業に関わる業界用語を{glossaryCount}語、一言定義と詳細解説で整備しています。
              </p>
            </div>
            <Link href="/glossary" className="section-link">
              用語集を開く →
            </Link>
          </div>

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
      </section>

      {/* 順次公開予定 */}
      <section className="section features">
        <div className="section-inner">
          <div className="section-label">Coming · 順次公開</div>
          <h2 className="section-title">公開予定の主要コンテンツ</h2>
          <div className="feature-grid">
            {upcomingFeatures.map((f) => (
              <div key={f.num} className="feature">
                <div className="feature-num">
                  {f.num}
                  <span className="feature-status">{f.status}</span>
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ロードマップ */}
      <section className="section roadmap">
        <div className="section-inner">
          <div className="section-label">Roadmap</div>
          <h2 className="section-title">公開ロードマップ</h2>
          <div className="roadmap-list">
            {siteConfig.roadmap.map((r, i) => {
              const badge = ROADMAP_BADGE[r.status];
              const description = r.description.replace(
                '{substations}',
                substationsCountStr,
              );
              return (
              <div
                key={i}
                className={`roadmap-item${r.isCurrent ? ' is-current' : ''}`}
              >
                <div className="roadmap-when">
                  {r.phase}
                  <small>{r.period}</small>
                </div>
                <div className="roadmap-content">
                  <h4>
                    {r.title}
                    <span className={badge.className}>{badge.label}</span>
                  </h4>
                  <p>{description}</p>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* お問い合わせ */}
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
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
