import { siteConfig } from '@/lib/site-config';

const features = [
  {
    num: '01',
    title: '業界ニュース・解説',
    body:
      '新規連系・補助金採択・制度改正・市場動向を、編集部が独自取材を含めて毎週お届けします。容量市場・需給調整市場・JEPX・FIPなど主要制度の応用解説も。',
  },
  {
    num: '02',
    title: 'プロジェクトデータベース',
    body:
      '国内の系統用蓄電池プロジェクトを公開情報ベースで一元管理。容量・所在地・事業者・ステータス・運転開始時期・併設の有無を構造化して提供します。',
  },
  {
    num: '03',
    title: '変電所別 系統空き容量',
    body:
      '10電力会社が公表する空き容量情報を変電所単位で一覧化。エリア・電圧・容量で素早く絞り込め、開発担当者の用地選定を時短します。',
  },
  {
    num: '04',
    title: '補助金カレンダー',
    body:
      '経産省・エネ庁・NEDO・SII・自治体の蓄電池関連補助金を、公募開始から〆切、採択結果まで継続トラック。蓄電池導入の検討段階で必ず参照される一覧へ。',
  },
  {
    num: '05',
    title: '事業者・サービス一覧',
    body:
      '電池メーカー・PCS・EPC・O&M・アグリゲーター・土地・金融・保険・法務・監視・消防・電気主任。蓄電所事業に必要な12カテゴリの事業者を体系的に掲載。',
  },
  {
    num: '06',
    title: '用語集（業界辞典）',
    body:
      '蓄電所事業に関わる用語300語の解説辞典。専門用語に迷ったときの最初の参照先となるよう、定義・関連用語・参考文献を整備します。',
  },
];

export default function Home() {
  return (
    <>
      {/* ヘッダー */}
      <header className="site-header">
        <div className="site-header-inner">
          <div className="brand">
            <span className="brand-mark"></span>
            蓄電所ネット
            <span className="brand-en">BESS NET / bess-net.jp</span>
          </div>
          <span className="coming-soon-badge">COMING SOON</span>
        </div>
      </header>

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
          <div className="hero-meta">2026年順次公開予定</div>
        </div>
      </section>

      {/* 機能紹介 */}
      <section className="section features">
        <div className="section-inner">
          <div className="section-label">What We&apos;re Building</div>
          <h2 className="section-title">提供予定の主要コンテンツ</h2>
          <div className="feature-grid">
            {features.map((f) => (
              <div key={f.num} className="feature">
                <div className="feature-num">{f.num}</div>
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
            <a href={`mailto:${siteConfig.contactEmail}`}>
              {siteConfig.contactEmail}
            </a>{' '}
            までご連絡ください。
          </p>
        </div>
      </section>

      {/* フッター */}
      <footer className="site-footer">
        <div className="site-footer-inner">
          <div>© 2026 {siteConfig.name}（bess-net.jp）</div>
          <div className="site-footer-meta">
            本サイトは2026年順次公開予定です。記載内容は予告なく変更される場合があります。
          </div>
        </div>
      </footer>
    </>
  );
}
