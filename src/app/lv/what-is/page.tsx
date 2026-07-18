/**
 * /lv/what-is — 低圧クラスタ解説①「低圧蓄電所とは」（Stage1・2026-07-18）
 * 全静的・#107初期DOM（比較表含む）・内部リンク実在確認済み（L-EIC-021）
 * 制度記述は /explainer/low-voltage-balancing-market-launch と整合（2026年4月・アグリゲーター経由）
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import LvContactCta from '@/components/LvContactCta';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '低圧蓄電所（低圧系統用蓄電池）とは？仕組み・高圧との違いをわかりやすく解説',
  description:
    '低圧蓄電所（低圧系統用蓄電池）は契約電力50kW未満で系統連系する蓄電池事業。仕組み・構成、高圧蓄電所との違い、2026年4月の需給調整市場低圧開放までを中立の立場で解説します。',
  alternates: { canonical: '/lv/what-is' },
  openGraph: {
    title: '低圧蓄電所（低圧系統用蓄電池）とは？仕組み・高圧との違いをわかりやすく解説',
    description:
      '契約電力50kW未満で系統連系する低圧蓄電所の仕組み・構成・高圧との違いを中立の立場で解説。',
    type: 'article',
    url: 'https://bess-net.jp/lv/what-is',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

const TH: React.CSSProperties = { padding: '8px 10px', textAlign: 'left', border: '1px solid var(--color-border)', background: 'var(--color-bg)', whiteSpace: 'nowrap' };
const TD: React.CSSProperties = { padding: '8px 10px', border: '1px solid var(--color-border)', verticalAlign: 'top' };

export default function LvWhatIsPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '低圧蓄電所', item: 'https://bess-net.jp/lv' },
      { '@type': 'ListItem', position: 3, name: '低圧蓄電所とは', item: 'https://bess-net.jp/lv/what-is' },
    ],
  };
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '低圧蓄電所（低圧系統用蓄電池）とは？ ── 仕組みと高圧との違い',
    description:
      '低圧蓄電所（低圧系統用蓄電池）は契約電力50kW未満で系統連系する蓄電池事業。仕組み・構成、高圧蓄電所との違い、2026年4月の需給調整市場低圧開放までを中立の立場で解説。',
    author: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    mainEntityOfPage: 'https://bess-net.jp/lv/what-is',
    inLanguage: 'ja-JP',
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail" style={{ maxWidth: 860 }}>
          <p className="article-breadcrumb">
            <Link href="/">ホーム</Link> / <Link href="/lv">低圧蓄電所</Link> / 低圧蓄電所とは
          </p>
          <span className="article-category">低圧蓄電所ガイド ①</span>
          <h1 className="article-title" style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}>
            低圧蓄電所（低圧系統用蓄電池）とは？ ── 仕組みと高圧との違い
          </h1>

          <div className="article-body">
            <p>
              低圧蓄電所（低圧系統用蓄電池）とは、契約電力50kW未満の「低圧」区分で電力系統に連系し、電力市場での運用収入を目的として設置される蓄電池設備のことです。かつての低圧太陽光と同じように土地活用・区画販売（分譲）の形で広がりつつあり、2026年4月に需給調整市場が低圧リソースに開かれたことで、事業環境が大きく動いています。このページでは、仕組みと構成、高圧の蓄電所との違いを、販売者ではない中立の立場から整理します。
            </p>

            <h2>「低圧」とはどの区分か</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>電気の供給区分は電圧により低圧（600V以下）・高圧（600V超〜7,000V以下）・特別高圧（7,000V超）に分かれ、契約電力ではおおむね50kW未満が低圧、50kW以上2,000kW未満が高圧に対応します（出典: 関西電力 法人向け解説）。</li>
              <li>低圧蓄電所は、パワーコンディショナー出力を50kW未満に収めて低圧で連系する構成が一般的です。蓄電池容量（kWh）は案件により様々ですが、高圧・特別高圧の蓄電所（MWh級）と比べると小規模です。</li>
              <li>「低圧系統用蓄電池」「低圧蓄電所」はいずれも同じ事業形態を指す呼び方として使われています。当サイトでは両方の表記を用います。</li>
            </ul>

            <h2>仕組みと構成 ── 誰がどう運用するのか</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>設備の基本構成は、蓄電池本体＋パワーコンディショナー（PCS）＋計量・通信設備。系統から充電し、系統へ放電します。</li>
              <li>
                運用の主体は多くの場合<strong>アグリゲーター</strong>（特定卸供給事業者）です。所有者が自分で市場取引をするのではなく、アグリゲーターが多数の低圧リソースを束ねて遠隔制御し、需給調整市場などで運用します。所有者はその対価を契約に基づいて受け取るのが基本形です（→ 用語: <Link href="/glossary/aggregator">アグリゲーター</Link>）。
              </li>
              <li>収益の中身（どの市場で・どんな対価か）は解説②「<Link href="/lv/revenue-model">収益モデル</Link>」で詳しく扱います。</li>
            </ul>

            <h2>高圧の蓄電所との違い</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, lineHeight: 1.7 }}>
                <thead>
                  <tr>
                    <th style={TH}>項目</th>
                    <th style={TH}>低圧蓄電所</th>
                    <th style={TH}>高圧の蓄電所</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td style={TD}>契約電力の区分</td><td style={TD}>50kW未満</td><td style={TD}>50kW以上2,000kW未満</td></tr>
                  <tr><td style={TD}>連系する電圧</td><td style={TD}>600V以下</td><td style={TD}>600V超〜7,000V以下</td></tr>
                  <tr><td style={TD}>設備規模の目安</td><td style={TD}>PCS出力50kW未満・容量は高圧より小規模</td><td style={TD}>MWh級の大容量案件が中心</td></tr>
                  <tr><td style={TD}>受電設備</td><td style={TD}>キュービクル不要の構成が一般的</td><td style={TD}>キュービクル等の受電設備が必要</td></tr>
                  <tr><td style={TD}>保安体制</td><td style={TD}>高圧に比べ負担が軽いことが一般的（適用は設備構成により異なる）</td><td style={TD}>電気主任技術者の選任等が必要</td></tr>
                  <tr><td style={TD}>市場参加の形</td><td style={TD}>アグリゲーター経由が基本</td><td style={TD}>直接参加・アグリゲーター経由の両方</td></tr>
                  <tr><td style={TD}>投資規模の桁感</td><td style={TD}>相対的に小さく個人・中小も参入</td><td style={TD}>数億円規模が中心で法人・ファンドが中心</td></tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 13, color: 'var(--color-muted)' }}>
              保安規制・手続きの適用は設備構成や設置形態により異なります。個別案件では施工事業者・所管窓口への確認が必要です。
            </p>

            <h2>なぜいま注目されるのか</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <strong>需給調整市場の低圧開放（2026年4月〜）</strong>: 2026年度から低圧リソースが需給調整市場に参入可能になりました。制度整理では、低圧の受電点計測は2026年度から全商品で市場参入可とされています（出典: OCCTO 第57回需給調整市場検討小委員会 資料）。詳しくは当サイトの解説「<Link href="/explainer/low-voltage-balancing-market-launch">低圧系統用蓄電池の需給調整市場参入</Link>」へ。
              </li>
              <li>
                <strong>区画販売（分譲）型の広がり</strong>: 低圧太陽光で定着した「区画を購入して事業収入を得る」モデルが蓄電所にも広がり、開発・販売の動きが活発化していると報じられています（出典: 日経BP メガソーラービジネス）。
              </li>
              <li>
                <strong>相対的に低い参入ハードル</strong>: 高圧案件に比べ初期投資・手続き負担が小さく、土地活用や分散投資の選択肢として検討されるようになっています。
              </li>
            </ol>

            <h2>検討を始める方へ（まとめ）</h2>
            <p>
              低圧蓄電所は「小さく始められる系統用蓄電池事業」ですが、収益は市場価格と制度に依存し、販売資料の前提がそのまま実現するとは限りません。まず収益の構造（<Link href="/lv/revenue-model">解説②</Link>）から確認することをおすすめします。
            </p>
          </div>

          <LvContactCta variant="buy" />
          <LvContactCta variant="entry" />

          <section className="article-sources" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>出典</h3>
            <ul style={{ fontSize: 13, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li>
                関西電力「高圧電力とは？低圧電力や特別高圧電力との違い」{' '}
                <a href="https://sol.kepco.jp/useful/aircontrol/w/koatsudenryokui/" target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  https://sol.kepco.jp/useful/aircontrol/w/koatsudenryokui/
                </a>
              </li>
              <li>
                OCCTO 第57回 需給調整市場検討小委員会 資料3「需給調整市場における機器個別計測・低圧リソース導入について」{' '}
                <a href="https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_57_03.pdf" target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_57_03.pdf
                </a>
              </li>
              <li>
                日経BP メガソーラービジネス「低圧蓄電所の開発が活発化」{' '}
                <a href="https://project.nikkeibp.co.jp/ms/atcl/19/news/00001/05844/?ST=msb" target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  https://project.nikkeibp.co.jp/ms/atcl/19/news/00001/05844/?ST=msb
                </a>
              </li>
            </ul>
          </section>

          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 16 }}>公開日: 2026-07-18</p>
          <p className="back-link">
            <Link href="/lv">← 低圧蓄電所 総合ガイドへ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
