import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import { getExplainerList, getGlossaryList, getIndustryNews } from '@/lib/microcms';

export const revalidate = 60;

const upcomingFeatures = [
  {
    num: '01',
    title: '業界ニュース',
    body:
      '新規連系・補助金採択・制度改正・市場動向を、編集部が独自取材を含めて発信します。',
    status: 'Sprint 1後半',
  },
  {
    num: '02',
    title: 'プロジェクトデータベース',
    body:
      '国内の系統用蓄電池プロジェクトを公開情報ベースで一元管理。容量・所在地・事業者・ステータス・運転開始時期・併設の有無を構造化。',
    status: 'Sprint 1後半',
  },
  {
    num: '03',
    title: '補助金カレンダー',
    body:
      '経産省・エネ庁・NEDO・SII・自治体の蓄電池関連補助金を、公募開始から〆切、採択結果まで継続トラック。',
    status: 'Sprint 1後半',
  },
  {
    num: '04',
    title: '変電所別 系統空き容量',
    body:
      '10電力会社が公表する空き容量情報を変電所単位で一覧化。エリア・電圧・容量で素早く絞り込み。',
    status: 'Sprint 2',
  },
  {
    num: '05',
    title: '日本の蓄電所マップ',
    body:
      'プロジェクトDBと系統情報をレイヤー連動した地図ベースの体験。',
    status: 'Sprint 3',
  },
  {
    num: '06',
    title: '事業者・サービス一覧',
    body:
      '電池メーカー・PCS・EPC・O&M・アグリゲーター・土地・金融・保険・法務・監視・消防・電気主任の12カテゴリ。',
    status: 'Sprint 2以降',
  },
];

export default async function Home() {
  // 公開済みコンテンツの最新を取得（newsはAPI未作成でも落ちないようにラップ）
  const safeFetch = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch { return fallback; }
  };

  const emptyList = { contents: [], totalCount: 0, offset: 0, limit: 0 };

  const [explainerData, glossaryNew, glossaryTotal, industryNewsAll] = await Promise.all([
    getExplainerList({ limit: 6, orders: '-publishedAt' }),
    getGlossaryList({ limit: 10, orders: '-publishedAt' }),
    getGlossaryList({ limit: 1, fields: 'id' }),
    safeFetch(() => getIndustryNews(), [] as any[]),
  ]);
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
            業界ニュース、プロジェクトデータベース、市場制度解説、補助金カレンダー、変電所別 系統空き容量、事業者情報。蓄電所事業に関わるすべての方が「ここに来れば一通りわかる」サイトを目指します。
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
            {siteConfig.roadmap.map((r, i) => (
              <div
                key={i}
                className={`roadmap-item${r.isCurrent ? ' is-current' : ''}`}
              >
                <div className="roadmap-when">
                  {r.phase}
                  <small>{r.period}</small>
                </div>
                <div className="roadmap-content">
                  <h4>{r.title}</h4>
                  <p>{r.description}</p>
                </div>
              </div>
            ))}
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
