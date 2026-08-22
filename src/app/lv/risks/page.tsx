/**
 * /lv/risks — 低圧クラスタ解説④「リスクと注意点」（Stage2・2026-07-19）
 * 全静的・#107初期DOM・利回り数値の自前提示なし・販売業者の名指しなし・内部リンク実在確認済み（L-EIC-021）
 * 上限価格15→10円は EPRX 2026-07-30 公表で確定済。時点明示の両論併記（8/31実需給分まで15.00円・
 * 9/1実需給分から10.00円）で書く＝9/1 を跨いでも陳腐化させない（L-EIC-019/-027・①②③と統一）／
 * 消防・保安は一次出典に基づく慎重表現
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
  title: '低圧蓄電所のリスクと注意点 ── 価格変動・制度・機器・「高利回り」表示の読み方',
  description:
    '低圧蓄電所（低圧系統用蓄電池）投資のリスクを中立の立場で整理。市場価格の変動、制度変更（需給調整市場の上限価格引下げ）、機器の劣化・故障、事業者リスク、災害・消防、販売資料の利回り表示を読む5つの視点。',
  alternates: { canonical: '/lv/risks' },
  openGraph: {
    title: '低圧蓄電所のリスクと注意点 ── 価格変動・制度・機器・「高利回り」表示の読み方',
    description:
      '低圧蓄電所投資のリスクを中立の立場で整理。6つのリスクと「高利回り」表示を読む5つの視点。',
    type: 'article',
    url: 'https://bess-net.jp/lv/risks',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function LvRisksPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '低圧蓄電所', item: 'https://bess-net.jp/lv' },
      { '@type': 'ListItem', position: 3, name: 'リスクと注意点', item: 'https://bess-net.jp/lv/risks' },
    ],
  };
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '低圧蓄電所のリスクと注意点 ── 何が収益を揺らすのか',
    description:
      '低圧蓄電所（低圧系統用蓄電池）の収益を揺らしうる6つのリスクと「高利回り」表示を読む5つの視点を、販売者ではない中立の立場で整理。',
    author: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    mainEntityOfPage: 'https://bess-net.jp/lv/risks',
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
            <Link href="/">ホーム</Link> / <Link href="/lv">低圧蓄電所</Link> / リスクと注意点
          </p>
          <span className="article-category">低圧蓄電所ガイド ④</span>
          <h1 className="article-title" style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}>
            低圧蓄電所のリスクと注意点 ── 何が収益を揺らすのか
          </h1>

          <div className="article-body">
            <p>
              リスクを知ることは、投資をやめる理由を探すことではありません。前提を正しく持ち、販売資料を自分の目で評価できるようになるためのものです。このページでは、低圧蓄電所（低圧系統用蓄電池）の収益を揺らしうる6つのリスクと、「高利回り」表示を読むための5つの視点を、販売者ではない中立の立場から整理します。
            </p>

            <h2>リスク① 市場価格の変動</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                収益の源泉である需給調整市場の調達価格や卸電力市場の価格差（スプレッド）は、燃料価格・再エネ導入量・参加リソースの増加などで常に変動します。参加者が増えれば価格が下がる方向に働くのは市場の性質です。収益の構造は解説②（<Link href="/lv/revenue-model">収益モデル</Link>）を参照。
              </li>
            </ul>

            <h2>リスク② 制度変更 ── 「上限価格15円→10円」という実例</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                電力市場のルールは毎年のように見直されます。足元の実例が、需給調整市場の一次調整力・二次調整力①・複合商品のΔkW上限価格の引下げです。<strong>2026年8月31日実需給分まで15.00円/ΔkW・30分、2026年9月1日実需給分から10.00円/ΔkW・30分</strong>となります（適用終了は「当面の間」。二次調整力②・三次調整力①は7.21円/ΔkW・30分を当面継続、三次調整力②は上限なし）。上限付近の約定が多い商品では、単価前提がそのまま変わりえます（詳細: <Link href="/policy-calendar/meti-stable-supply-wg4-balancing-cap-2026-07">第4回 電力安定供給WG ── 上限価格15円→10円引下げ</Link>／出典: 電力需給調整力取引所（EPRX）2026年7月30日公表、根拠: 経済産業省 電力安定供給WG 第4回 資料6）。
              </li>
              <li>
                制度動向は当サイトの政策カレンダー（<Link href="/policy-calendar">政策・制度カレンダー</Link>）で追えます。「制度が変わりうること」自体を前提に、感応度で考えるのが健全です。
              </li>
            </ul>

            <h2>リスク③ 機器 ── 劣化・故障・保証の実効性</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                蓄電池は充放電を繰り返すほど、また時間の経過でも容量が低下します（サイクル劣化・カレンダー劣化）。想定より速い劣化は収益計画を直撃します。
              </li>
              <li>
                確認すべきは保証の中身です: 容量保証の水準と年数、保証の前提条件（運用範囲）、故障時の費用負担、そして保証を履行する主体の継続性（海外メーカーの場合の国内体制含む）。
              </li>
            </ul>

            <h2>リスク④ 事業者 ── 販売会社・運用会社の継続性</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                分譲型は購入後も販売会社・アグリゲーター等との長い付き合いになります。事業撤退・破綻時に運用契約がどうなるか、代替アグリゲーターへの切替は可能か、収益「保証」の担保は何か ── 契約前に確認すべき論点です（チェックリスト: <Link href="/lv/buying-guide">購入・投資ガイド</Link>）。
              </li>
            </ul>

            <h2>リスク⑤ 災害・安全・近隣</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>水害・土砂等のハザード該当は土地選定の基本確認です。</li>
              <li>
                火災・消防面では、リチウムイオン電池の電解液が消防法上の危険物（第4類）に該当するため、設備の容量・電解液量によって届出等や市町村の火災予防条例の基準が適用される場合があり、近年も規制の見直しが続いています（出典: 総務省消防庁資料・2024年の規制見直し解説）。適用は設備構成と自治体で異なるため、所轄消防への確認を前提にしてください。
              </li>
              <li>騒音（PCS等）や景観への近隣理解も、長期運用の安定には無視できません。</li>
              <li>規制の全体像は<Link href="/lv/regulation-subsidy">制度・規制と補助金</Link>に整理しています。</li>
            </ul>

            <h2>リスク⑥ 流動性・出口</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                低圧蓄電所の中古売買市場はまだ形成途上です。「いつでも売れる」前提は置かず、保有期間満了時の撤去費用や土地の原状回復まで含めて計画するのが安全です。
              </li>
            </ul>

            <h2>「高利回り」表示を読む5つの視点</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li><strong>前提の年度と市場</strong>: どの年の・どの市場価格か。制度変更（2026年9月1日実需給分からの上限価格10.00円/ΔkW・30分など）を織り込んでいるか。</li>
              <li><strong>稼働の前提</strong>: 約定率・稼働率はどんな根拠か。</li>
              <li><strong>費用の網羅性</strong>: 税・保険・O&M・交換・撤去まで含む「手取り」か。</li>
              <li><strong>保証の裏付け</strong>: 「保証利回り」なら、保証する主体と原資は何か。</li>
              <li>
                <strong>感応度</strong>: 価格前提が下がったらどうなるか。実例として、一次調整力・二次調整力①・複合商品の上限価格は2026年8月31日実需給分まで15.00円、2026年9月1日実需給分から10.00円で、上限前提の単価は3分の2になります。この試算を販売会社に求めて、答えられるかを見てください。
              </li>
            </ol>

            <h2>リスクにどう向き合うか（まとめ）</h2>
            <p>
              リスクは「知って・確かめて・織り込む」ものです。前提の確認と感応度の試算、そして契約書の精読 ── そのうえで判断すれば、低圧蓄電所は検討に値する事業です。判断の前に第三者の目が欲しいときは、中立の立場で無料でご相談をお受けしています。
            </p>
          </div>

          <LvContactCta variant="buy" />
          <LvContactCta variant="entry" />

          <section className="article-sources" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>出典</h3>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
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
