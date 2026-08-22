/**
 * /lv/revenue-model — 低圧クラスタ解説②「収益モデル」（Stage1・2026-07-18）
 * 全静的・#107初期DOM・利回り数値の自前提示なし・内部リンク実在確認済み（L-EIC-021）
 * 上限価格15→10円は EPRX 2026-07-30 公表で確定済（8/31実需給分まで15.00円・9/1実需給分から10.00円）。
 * 時点を明示した両論併記で書く＝9/1 を跨いでも陳腐化させない（L-EIC-019/-027・policy詳細ページと整合）
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import LvContactCta from '@/components/LvContactCta';
import LvInvestEduLinks from '@/components/LvInvestEduLinks';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '低圧蓄電所の収益モデル ── 需給調整市場・卸電力市場・コスト構造から読み解く',
  description:
    '低圧蓄電所（低圧系統用蓄電池）の収益はどこから生まれるのか。需給調整市場・卸電力市場での運用、コスト構造、収益を左右する前提条件を、利回りを謳わない中立の立場で解説します。',
  alternates: { canonical: '/lv/revenue-model' },
  openGraph: {
    title: '低圧蓄電所の収益モデル ── 需給調整市場・卸電力市場・コスト構造から読み解く',
    description:
      '低圧蓄電所の収益構造とコスト、収益を左右する変数を利回りを謳わない中立の立場で解説。',
    type: 'article',
    url: 'https://bess-net.jp/lv/revenue-model',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function LvRevenueModelPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '低圧蓄電所', item: 'https://bess-net.jp/lv' },
      { '@type': 'ListItem', position: 3, name: '収益モデル', item: 'https://bess-net.jp/lv/revenue-model' },
    ],
  };
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '低圧蓄電所の収益モデル ── 収入はどこから生まれ、何に左右されるのか',
    description:
      '低圧蓄電所（低圧系統用蓄電池）の収益構造とコスト、収益を左右する変数を、利回りを謳わない中立の立場で解説。',
    author: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    mainEntityOfPage: 'https://bess-net.jp/lv/revenue-model',
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
            <Link href="/">ホーム</Link> / <Link href="/lv">低圧蓄電所</Link> / 収益モデル
          </p>
          <span className="article-category">低圧蓄電所ガイド ②</span>
          <h1 className="article-title" style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}>
            低圧蓄電所の収益モデル ── 収入はどこから生まれ、何に左右されるのか
          </h1>

          <div className="article-body">
            <p>
              低圧蓄電所（低圧系統用蓄電池）の販売資料では「想定利回り」の数字が目を引きます。しかし数字の妥当性は、収益がどの市場から生まれ、どんな前提に依存しているかを分解しないと判断できません。このページでは、販売者ではない中立の立場から、低圧蓄電所の収益の構造とコスト、そして収益を左右する変数を整理します。当サイトは特定商品の利回りを提示・保証しません。
            </p>

            <h2>収益の基本構造 ── 「アグリゲーター経由の市場運用」が軸</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                低圧蓄電所の多くは、アグリゲーター（特定卸供給事業者）が設備を遠隔制御し、電力市場で運用します。所有者の収入は、その運用成果や契約条件（固定・変動・ハイブリッド等）に基づいてアグリゲーターから受け取る対価です。つまり<strong>収益性は「市場そのもの」と「契約の設計」の2層で決まります</strong>。
              </li>
              <li>なお、工場や家庭に設置して自家消費と組み合わせる「需要地併設型」とは収益構造が異なります。本ページは独立して系統に連系する蓄電所型を対象とします。</li>
            </ul>

            <h2>収益源① 需給調整市場（2026年4月に低圧へ開放）</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                需給調整市場は、電力の周波数維持などに使う「調整力」を取引する市場です。蓄電池は応動の速さを活かせるリソースとして位置付けられ、2026年度から低圧リソースの参入が可能になりました（出典: OCCTO 第57回需給調整市場検討小委員会 資料）。参加はアグリゲーター経由が基本です（当サイト解説: <Link href="/explainer/low-voltage-balancing-market-launch">低圧系統用蓄電池の需給調整市場参入</Link>）。
              </li>
              <li>対価の基本は、指令に備えて容量を確保しておくことへの支払い（ΔkW価格）です。ここで重要なのは<strong>価格の上限が制度で見直されうる</strong>ことです。</li>
              <li>
                <strong>【制度動向・決定済】</strong> 一次調整力・二次調整力①・複合商品のΔkW上限価格は、<strong>2026年8月31日実需給分まで15.00円/ΔkW・30分、2026年9月1日実需給分から10.00円/ΔkW・30分</strong>に引き下げられます（適用終了は「当面の間」）。二次調整力②・三次調整力①は7.21円/ΔkW・30分を当面継続、三次調整力②は上限なしです。上限付近の約定が多い商品では収益前提に直接影響するため、契約や試算がどちらの水準を前提にしているかを確認してください（当サイトの詳細ページ: <Link href="/policy-calendar/meti-stable-supply-wg4-balancing-cap-2026-07">第4回 電力安定供給WG ── 上限価格15円→10円引下げ</Link>／出典: 電力需給調整力取引所（EPRX）2026年7月30日公表「需給調整市場のΔkW上限価格について」、根拠: 経済産業省 電力安定供給ワーキンググループ 第4回 資料6）。
              </li>
            </ul>

            <h2>収益源② 卸電力市場（値差を収益にする運用）</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>電気の安い時間帯に充電し、高い時間帯に放電して価格差を収益にする運用です。低圧蓄電所では所有者が直接市場に参加するのではなく、アグリゲーター等の運用メニューを通じて行われる形が基本です。</li>
              <li>収益は市場価格の変動幅（スプレッド）と運用の巧拙に依存します。市場価格の見方は当サイトの市場データ（<Link href="/market/jepx">JEPX スポット価格ハブ</Link>）も参考にしてください。</li>
            </ul>

            <h2>収益源③ その他（容量市場など）</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                アグリゲーターが多数のリソースを束ねて容量市場（発動指令電源）等に参加するメニューも制度上あり得ますが、提供の有無・条件は事業者により異なります。契約前に「どの市場に・どんな条件で」参加するのかを確認することが重要です（参考: <Link href="/explainer/capacity-market">容量市場と蓄電池</Link>）。
              </li>
            </ul>

            <h2>コスト構造 ── 収入と同じ解像度で見る</h2>
            <p>
              初期費用: 蓄電池・PCS等の機器費／設置工事費／系統連系にかかる費用（連系負担金等）／土地の取得・賃借・造成費。
              <br />
              運転費用: 保守点検（O&M）／通信・計量関連費／アグリゲーターへの手数料・運用委託費（契約形態による）／保険料／固定資産税等の税負担／将来の劣化・機器交換への引当。
            </p>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>販売資料の「利回り」がこれらをどこまで含んでいるか（税・交換費用・撤去費の扱い）は商品によって異なります。</li>
            </ul>

            <h2>収益を左右する5つの変数（「利回り◯%」を読む前に）</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li><strong>市場価格の前提</strong>: どの年度の・どの市場の価格を前提にしているか。上限価格の引下げ（2026年9月1日実需給分から10.00円/ΔkW・30分）のような制度変更が織り込まれているか。</li>
              <li><strong>稼働の前提</strong>: 市場に参加できる時間・約定の想定はどの程度か。</li>
              <li><strong>契約の設計</strong>: 固定払いか変動か、アグリゲーターの手数料・解約条件はどうか。</li>
              <li><strong>劣化と交換</strong>: 蓄電池の性能低下と交換費用がどう見込まれているか。</li>
              <li><strong>費用の網羅性</strong>: 税・保険・撤去まで含んだ「手取り」ベースか。</li>
            </ol>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>リスク面の各論は解説「<Link href="/lv/risks">リスクと注意点</Link>」で詳しく扱っています。</li>
            </ul>

            <h2>まとめ ── 数字より先に構造を</h2>
            <p>
              低圧蓄電所の収益は「市場 × 契約 × コスト」の掛け算であり、単一の利回り数字では比較できません。当サイトは販売者ではないため、個別商品の評価はしませんが、検討の考え方は無料でご相談いただけます。
            </p>
          </div>

          {/* EIC Data 教材への発リンク（相互リンク・リン連携） */}
          <LvInvestEduLinks
            links={[{ href: 'https://data.eic-jp.org/insight/guide', label: '電力市場の教材ハブ（EIC Data）' }]}
          />

          <LvContactCta variant="buy" />
          <LvContactCta variant="entry" />

          {/* 関連ツール（tools-cta 対応: /lv/revenue-model → /tools/balancing-revenue・実在確認済み） */}
          <section className="cta-grid-section">
            <h3>需給調整市場の収益シナリオを試算する</h3>
            <p>
              需給調整市場 6 商品の蓄電池落札単価（EPRX 実績）に落札率・容量を掛けた概算年間収益を無料で試算できます（前提次第で大きく変わる感応度ツール）。
            </p>
            <Link href="/tools/balancing-revenue" className="cta-grid-button">
              需給調整 収益シナリオツールを使う →
            </Link>
          </section>

          {/* Stage4: 関連用語（glossary 投入済み・実在確認済み） */}
          <p style={{ fontSize: 15, color: 'var(--color-muted)' }}>
            関連用語: <Link href="/glossary/device-level-metering">機器個別計測</Link>
          </p>

          <section className="article-sources" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>出典</h3>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li>
                OCCTO 第57回 需給調整市場検討小委員会 資料3{' '}
                <a href="https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_57_03.pdf" target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  https://www.occto.or.jp/assets/iinkai/chouseiryoku/jukyuchousei/2025/files/jukyu_shijyo_57_03.pdf
                </a>
              </li>
              <li>
                経済産業省 第4回 電力安定供給ワーキンググループ{' '}
                <a href="https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/004.html" target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/004.html
                </a>
              </li>
            </ul>
          </section>

          <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 16 }}>公開日: 2026-07-18</p>
          <p className="back-link">
            <Link href="/lv">← 低圧蓄電所 総合ガイドへ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
