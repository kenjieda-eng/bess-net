/**
 * /lv/regulation-subsidy — 低圧クラスタ解説⑥「制度・規制と補助金」（Stage3・2026-07-19）
 * 全静的・#107初期DOM（整理表も初期DOM）・内部リンク実在確認済み（L-EIC-021・/subsidies・/tools/subsidy-match 実在照合済）
 * JC-STAR・補助金は「〜とされています・要確認」の慎重表現（断定なし）／「決定済み」と「検討中」を区別（L-EIC-019）
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import LvContactCta from '@/components/LvContactCta';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

const TD: React.CSSProperties = { border: '1px solid var(--color-border)', padding: '8px 10px', fontSize: 15, lineHeight: 1.7, verticalAlign: 'top' };

export const metadata: Metadata = {
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '低圧蓄電所の制度・規制と補助金 ── 電気事業法・保安・計量・支援策の現在地',
  description:
    '低圧蓄電所（低圧系統用蓄電池）に関わる制度を中立に整理。電気事業法上の位置づけ、保安・消防、機器個別計測と計量ルール、需給調整市場の要件、補助金の探し方。「決定済み」と「検討中」を区別した2026年7月時点の現在地。',
  alternates: { canonical: '/lv/regulation-subsidy' },
  openGraph: {
    title: '低圧蓄電所の制度・規制と補助金 ── 電気事業法・保安・計量・支援策の現在地',
    description:
      '低圧蓄電所に関わる制度・規制・補助金を「決定済み」と「検討中」を区別して整理した2026年7月時点の現在地。',
    type: 'article',
    url: 'https://bess-net.jp/lv/regulation-subsidy',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function LvRegulationSubsidyPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '低圧蓄電所', item: 'https://bess-net.jp/lv' },
      { '@type': 'ListItem', position: 3, name: '制度・規制と補助金', item: 'https://bess-net.jp/lv/regulation-subsidy' },
    ],
  };
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '低圧蓄電所の制度・規制と補助金 ── 2026年7月時点の現在地',
    description:
      '低圧蓄電所（低圧系統用蓄電池）に関わる制度・規制・支援策を「決定済み」と「検討中」を区別して整理。',
    author: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    mainEntityOfPage: 'https://bess-net.jp/lv/regulation-subsidy',
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
            <Link href="/">ホーム</Link> / <Link href="/lv">低圧蓄電所</Link> / 制度・規制と補助金
          </p>
          <span className="article-category">低圧蓄電所ガイド ⑥</span>
          <h1 className="article-title" style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}>
            低圧蓄電所の制度・規制と補助金 ── 2026年7月時点の現在地
          </h1>

          <div className="article-body">
            <p>
              蓄電池事業の制度は毎年のように動きます。このページでは、低圧蓄電所（低圧系統用蓄電池）に関わる制度・規制・支援策を、<strong>「決まっていること」と「検討中のこと」を区別して</strong>2026年7月時点で整理します。個別案件への適用は構成・地域で異なるため、最終判断は一次資料と所管への確認を前提にしてください。
            </p>

            <h2>電気事業法上の位置づけ</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                低圧蓄電所の所有者は、アグリゲーター（特定卸供給事業者）経由で市場に参加する形が基本で、<strong>所有者自身が電気事業のライセンスを取得する必要は通常ありません</strong>（アグリゲーター側が2022年施行の制度で特定卸供給事業者として届出制になっています）。事業スキームによって扱いが変わるため、個別の座組は専門家に確認を。
              </li>
            </ul>

            <h2>保安と消防</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <strong>保安</strong>: 電気工作物としての区分・必要な保安体制は設備構成により異なります。高圧（電気主任技術者の選任等が必要）に比べ低圧は負担が軽いのが一般的です（→ 解説①の<Link href="/lv/what-is">比較表</Link>）。
              </li>
              <li>
                <strong>消防</strong>: リチウムイオン電池の電解液は消防法上の危険物（第4類）に該当し、容量・電解液量に応じて届出や市町村の火災予防条例の基準が適用される場合があります。2024年にも規制の見直しが行われるなど動きが続く領域です（出典: 総務省消防庁資料・DOWAエコジャーナル解説）。<strong>所轄消防への事前確認が実務の基本</strong>です。
              </li>
            </ul>

            <h2>計量のルール ── 受電点計測と機器個別計測</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                需給調整市場の制度整理では、<strong>低圧の受電点計測は2026年度から全商品で市場参入可</strong>とされ、機器点で直接計測する<strong>機器個別計測</strong>も次世代スマートメーターの設置を前提に低圧は2026年度から導入と整理されています（出典: OCCTO 第57回需給調整市場検討小委員会資料）。
              </li>
              <li>
                どの計測方式で参加するかは設備構成とアグリゲーターのメニューによります。蓄電池単独で連系する低圧蓄電所は構成がシンプルな分、確認事項も明確です（契約時にアグリゲーターへ確認を）。
              </li>
            </ul>

            <h2>需給調整市場の要件と価格制度</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                2026年4月に低圧リソースへ開放済み（→ 当サイト解説: <Link href="/explainer/low-voltage-balancing-market-launch">低圧系統用蓄電池の需給調整市場参入</Link>）。
              </li>
              <li>
                価格面では、一次・二次①・複合商品の上限価格を15円/ΔkW・30分→10円へ引き下げ、2026年9月1日実需給分から適用する<strong>案</strong>が審議中です（2026年7月時点で決定前・→ <Link href="/policy-calendar/meti-stable-supply-wg4-balancing-cap-2026-07">第4回 電力安定供給WG ── 上限価格15円→10円引下げ案</Link>）。
              </li>
            </ul>

            <h2>補助金の現在地 ── 「低圧向け」は限定的、探し方が重要</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                国の系統用蓄電池関連の補助（SII実施の大型公募など）は<strong>大規模案件を主対象</strong>としてきており、低圧蓄電所がそのまま対象になる国の定番メニューは限定的です。<strong>公募ごとに要件（規模・用途）が異なる</strong>ため、対象になるかは各公募要領での確認が必須です。
              </li>
              <li>
                自治体の支援策は地域差・年度差が大きい領域です。当サイトの<strong>補助金データベース（<Link href="/subsidies">補助金一覧</Link>）</strong>と<strong>補助金マッチング（<Link href="/tools/subsidy-match">補助金マッチングツール</Link>）</strong>で最新の公募状況を確認できます。
              </li>
              <li>
                補助金前提の事業計画は、公募時期・採択率・交付決定までのタイムラグというスケジュールリスクを織り込んでください。
              </li>
            </ul>

            <h2>決まっていること・検討中のこと（2026年7月時点の整理表）</h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%', marginBottom: 8 }}>
                <thead>
                  <tr>
                    <th style={{ ...TD, background: 'var(--color-bg)', fontWeight: 700, whiteSpace: 'nowrap' }}>区分</th>
                    <th style={{ ...TD, background: 'var(--color-bg)', fontWeight: 700 }}>内容</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={TD}>実施済み</td>
                    <td style={TD}>需給調整市場の低圧開放（2026年4月）／特定卸供給事業者（アグリゲーター）制度（2022年施行）／消防関連の規制見直し（2024年）</td>
                  </tr>
                  <tr>
                    <td style={TD}>検討・予定（決定前含む）</td>
                    <td style={TD}>需給調整市場の上限価格15円→10円案（2026年9月適用案・審議中）／機器のセキュリティ認証 JC-STAR の連系要件化（2027年度から段階適用の見込み・低圧は2027年10月からとされる・詳細要確認）／機器個別計測の運用細部</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p style={{ fontSize: 15, color: 'var(--color-muted)' }}>
              本表は2026年7月時点の公表情報に基づく整理です。最新の動向は当サイトの政策カレンダー（<Link href="/policy-calendar">政策・制度カレンダー</Link>）で追えます。
            </p>

            <h2>制度を「追い続ける」ためのまとめ</h2>
            <p>
              制度は事業の前提そのものです。当サイトは政策カレンダーと解説で更新を追い続けます。個別案件への適用判断で迷ったら、中立の立場で無料でご相談をお受けしています。
            </p>
          </div>

          <LvContactCta variant="entry" />
          <LvContactCta variant="buy" />

          {/* Stage4: 関連用語（glossary 投入済み・実在確認済み） */}
          <p style={{ fontSize: 15, color: 'var(--color-muted)' }}>
            関連用語: <Link href="/glossary/low-voltage-resource-term">低圧リソース</Link>
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
              <li>
                総務省消防庁「蓄電池設備の規制（消防関係法令による規制体系）」{' '}
                <a href="https://www.fdma.go.jp/singi_kento/kento/items/kento164_05_shiryo1-4.pdf" target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  https://www.fdma.go.jp/singi_kento/kento/items/kento164_05_shiryo1-4.pdf
                </a>
              </li>
              <li>
                DOWAエコジャーナル「リチウムイオン電池の貯蔵に関する消防法の規制見直し（2024）」{' '}
                <a href="https://www.dowa-ecoj.jp/law/2024/20240102.html" target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>
                  https://www.dowa-ecoj.jp/law/2024/20240102.html
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
