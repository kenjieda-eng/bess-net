/**
 * /lv/entry-guide — 低圧クラスタ解説⑤「事業参入ガイド」（Stage3・2026-07-19）
 * 全静的・#107初期DOM・利回り数値の自前提示なし・販売業者の名指しなし・内部リンク実在確認済み（L-EIC-021）
 * JC-STAR は「〜とされています・要確認」の慎重表現（断定なし）／15→10円は「案・決定前」表記で①〜④と統一
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
  title: '低圧蓄電所の事業参入ガイド ── 用地・系統連系・機器選定・アグリゲーター契約',
  description:
    '低圧蓄電所（低圧系統用蓄電池）事業への参入手順を販売者ではない中立の立場で整理。参入形態の選択、用地選定、系統連系の申込み、機器選定（JC-STAR動向）、アグリゲーター契約、事業計画の感応度まで。',
  alternates: { canonical: '/lv/entry-guide' },
  openGraph: {
    title: '低圧蓄電所の事業参入ガイド ── 用地・系統連系・機器選定・アグリゲーター契約',
    description:
      '低圧蓄電所事業への参入手順を中立の立場で整理。用地・系統連系・機器・アグリゲーター契約・事業計画の6ステップ。',
    type: 'article',
    url: 'https://bess-net.jp/lv/entry-guide',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function LvEntryGuidePage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '低圧蓄電所', item: 'https://bess-net.jp/lv' },
      { '@type': 'ListItem', position: 3, name: '事業参入ガイド', item: 'https://bess-net.jp/lv/entry-guide' },
    ],
  };
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '低圧蓄電所の事業参入ガイド ── 開発側に回るための6ステップ',
    description:
      '低圧蓄電所（低圧系統用蓄電池）事業への参入手順を、販売者ではない中立の立場で6ステップで整理。',
    author: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    mainEntityOfPage: 'https://bess-net.jp/lv/entry-guide',
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
            <Link href="/">ホーム</Link> / <Link href="/lv">低圧蓄電所</Link> / 事業参入ガイド
          </p>
          <span className="article-category">低圧蓄電所ガイド ⑤</span>
          <h1 className="article-title" style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}>
            低圧蓄電所の事業参入ガイド ── 開発側に回るための6ステップ
          </h1>

          <div className="article-body">
            <p>
              低圧蓄電所（低圧系統用蓄電池）に「区画を買う側」でなく「つくる側・持つ側」として参入する ── 本ページはその実務手順を、販売者ではない中立の立場から6ステップで整理します。区画購入をお考えの方は解説③（<Link href="/lv/buying-guide">購入・投資ガイド</Link>）を、収益の構造は解説②（<Link href="/lv/revenue-model">収益モデル</Link>）を先にどうぞ。
            </p>

            <h2>まず参入形態を決める</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                主な形は3つ: <strong>自社開発・自社保有</strong>（開発から運用収益まで自社で取る）／<strong>開発して分譲販売</strong>（区画商品として販売する事業）／<strong>既存区画の購入</strong>（→<Link href="/lv/buying-guide">解説③</Link>）。以降のステップは前二者（開発側）を想定します。
              </li>
            </ul>

            <h2>STEP1 用地選定 ── 「系統」と「土地」を同時に見る</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                地目・造成コスト・水害等のハザード・近隣環境に加え、<strong>その土地の系統に接続余地があるか</strong>が低圧でも出発点です。当サイトの系統空き容量データベース（<Link href="/grid">系統空き容量</Link>）で周辺の系統状況を確認できます。
              </li>
              <li>
                高圧案件より必要面積は小さく、遊休地・宅地転用が難しい土地の活用先として検討されるケースが増えています（面積・造成の要否は機器構成により異なります）。
              </li>
            </ul>

            <h2>STEP2 系統連系の申込み ── 低圧でも「申込みと検討」はある</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                低圧の蓄電池連系は、地域の一般送配電事業者への<strong>連系申込み</strong>が必要です。逆潮流（系統への放電）を伴う蓄電池は、内容により技術検討・工事が発生し、時期・費用は系統状況で変わります（例: 九州電力送配電「蓄電池等の低圧電線路への連系申込み」）。<strong>手続き・様式は送配電事業者ごとに異なる</strong>ため、必ず設置地域の各社ページで確認してください。
              </li>
              <li>
                国も系統用蓄電池の連系円滑化を審議しており（資源エネルギー庁「系統用蓄電池の迅速な系統連系に向けて」2025年3月）、手続き環境は変化中です。
              </li>
            </ul>

            <h2>STEP3 機器選定 ── 保証と「これからの要件」を見る</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                PCS出力を50kW未満に収める構成が前提。容量保証の水準・年数、国内サポート体制、故障時の対応は解説④（<Link href="/lv/risks">リスクと注意点</Link>）の観点で精査を。
              </li>
              <li>
                <strong>今後の重要動向</strong>: 機器のサイバーセキュリティ認証「JC-STAR」の適合が、系統連系の要件として2027年度から段階的に求められる見込みと報じられています（高圧2027年4月・低圧50kW未満は同年10月からとされる）。制度の詳細・適用条件は今後の公表で変わりうるため<strong>要確認</strong>ですが、これから調達する機器は<strong>認証取得（予定）の有無をメーカーに確認</strong>しておくのが安全です。
              </li>
            </ul>

            <h2>STEP4 アグリゲーター契約 ── 収益の質を決めるパートナー選び</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                運用を委ねるアグリゲーター（特定卸供給事業者）の選定は、立地選びと同じくらい収益を左右します。確認点: 参加する市場メニュー（需給調整・卸・その他）、手数料と精算の透明性、運用実績、データ提供の頻度、契約期間と解約条件（→ 用語: <Link href="/glossary/aggregator">アグリゲーター</Link>／事業者を探す: <Link href="/operators">事業者ナビ</Link>）。
              </li>
            </ul>

            <h2>STEP5 保安・消防・計量の確認</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                保安（電気工作物の扱い）・消防（危険物関連の届出等）・計量（受電点/機器個別計測）は設備構成で適用が変わります。詳細は解説⑥（<Link href="/lv/regulation-subsidy">制度・規制と補助金</Link>）に整理しました。所轄・専門家への確認を前提にしてください。
              </li>
            </ul>

            <h2>STEP6 事業計画 ── 感応度で考える</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                収益計画は単一シナリオでなく感応度で: 需給調整市場の上限価格15円→10円案（2026年9月適用案・決定前）のような制度変更、価格水準の変化、劣化を織り込んで幅で見る（→ 解説<Link href="/lv/revenue-model">②</Link>・<Link href="/lv/risks">④</Link>）。市場の実データは <Link href="/market/jepx">JEPX スポット価格ハブ</Link>などで確認できます。
              </li>
            </ul>

            <h2>参入検討の壁打ちに（まとめ）</h2>
            <p>
              事業化の進め方・パートナー選定・市場の見方など、検討段階のご相談を中立の立場で無料でお受けしています。
            </p>
          </div>

          <LvContactCta variant="entry" />
          <p style={{ fontSize: 15, textAlign: 'center', marginTop: 0 }}>
            区画の購入を検討中の方は{' '}
            <a
              href="https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=funnel_lv_buy"
              target="_blank"
              rel="noopener noreferrer"
            >
              こちら（購入・投資のご相談・無料）
            </a>
            。
          </p>

          {/* Stage4: 関連用語（glossary 投入済み・実在確認済み） */}
          <p style={{ fontSize: 15, color: 'var(--color-muted)' }}>
            関連用語: <Link href="/glossary/device-level-metering">機器個別計測</Link>
          </p>

          <section className="article-sources" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>出典</h3>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li>
                九州電力送配電「蓄電池等の低圧電線路への連系申込みについて」{' '}
                <a href="https://www.kyuden.co.jp/td/service/application/interconnection.html" target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  https://www.kyuden.co.jp/td/service/application/interconnection.html
                </a>
              </li>
              <li>
                資源エネルギー庁「系統用蓄電池の迅速な系統連系に向けて」（2025年3月・スマート電力グリッドWG資料）{' '}
                <a href="https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/smart_power_grid_wg/pdf/002_02_00.pdf" target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/smart_power_grid_wg/pdf/002_02_00.pdf
                </a>
              </li>
              <li>
                GridWatch「太陽光・蓄電池、JC-STAR★1が連系条件へ」{' '}
                <a href="https://www.gridwatch.jp/policy/der-cybersecurity-jc-star-grid-connection-february-2026" target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  https://www.gridwatch.jp/policy/der-cybersecurity-jc-star-grid-connection-february-2026
                </a>
              </li>
            </ul>
          </section>

          <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 16 }}>公開日: 2026-07-19</p>
          <p className="back-link">
            <Link href="/lv">← 低圧蓄電所 総合ガイドへ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
