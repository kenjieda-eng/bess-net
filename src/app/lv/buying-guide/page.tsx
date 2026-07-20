/**
 * /lv/buying-guide — 低圧クラスタ解説③「購入・投資ガイド」（Stage2・2026-07-19）
 * 全静的・#107初期DOM・利回り数値の自前提示なし・販売業者の名指しなし・内部リンク実在確認済み（L-EIC-021）
 * 上限価格15→10円は「案・決定前」と明記（L-EIC-019・①②と統一）／消防・保安は一次出典に基づく慎重表現
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
  title: '低圧蓄電所の購入・投資ガイド ── 分譲購入の流れと中立チェックリスト',
  description:
    '分譲（区画販売）型の低圧蓄電所を購入・投資する前に確認すべきことを、販売者ではない中立の立場で整理。購入までの流れ、収益前提・契約・機器・土地・保安の8項目チェックリスト。',
  alternates: { canonical: '/lv/buying-guide' },
  openGraph: {
    title: '低圧蓄電所の購入・投資ガイド ── 分譲購入の流れと中立チェックリスト',
    description:
      '分譲型の低圧蓄電所を購入・投資する前に確認すべきことを中立の立場で整理。購入までの流れと8項目チェックリスト。',
    type: 'article',
    url: 'https://bess-net.jp/lv/buying-guide',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function LvBuyingGuidePage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '低圧蓄電所', item: 'https://bess-net.jp/lv' },
      { '@type': 'ListItem', position: 3, name: '購入・投資ガイド', item: 'https://bess-net.jp/lv/buying-guide' },
    ],
  };
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '低圧蓄電所の購入・投資ガイド ── 分譲購入の流れと「販売者でない立場」のチェックリスト',
    description:
      '分譲（区画販売）型の低圧蓄電所を購入・投資する前に確認すべきことを、販売者ではない中立の立場で整理。',
    author: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    mainEntityOfPage: 'https://bess-net.jp/lv/buying-guide',
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
            <Link href="/">ホーム</Link> / <Link href="/lv">低圧蓄電所</Link> / 購入・投資ガイド
          </p>
          <span className="article-category">低圧蓄電所ガイド ③</span>
          <h1 className="article-title" style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}>
            低圧蓄電所の購入・投資ガイド ── 分譲購入の流れと「販売者でない立場」のチェックリスト
          </h1>

          <div className="article-body">
            <p>
              低圧蓄電所（低圧系統用蓄電池）は、区画を購入して運用をアグリゲーターに委ね、その対価を受け取る「分譲型」の商品が増えています。ただ、販売資料の前提条件は商品ごとに大きく異なり、比較は簡単ではありません。このページでは、販売者ではない中立の立場から、購入までの一般的な流れと「契約前に確かめるべき8項目」を整理します。当サイトは特定商品の評価・あっせんは行いません。
            </p>

            <h2>分譲型の低圧蓄電所とは</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                事業者が用地確保・機器選定・系統連系までを整えた区画を購入し、稼働後の運用（市場取引）はアグリゲーター等が担い、購入者は契約に基づく対価を受け取る形が典型です。仕組みの基礎は解説①（<Link href="/lv/what-is">低圧蓄電所とは？</Link>）、収益の構造は解説②（<Link href="/lv/revenue-model">収益モデル</Link>）を先にどうぞ。
              </li>
            </ul>

            <h2>購入までの一般的な流れ（5ステップ）</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li><strong>情報収集・比較</strong>: 複数商品の資料を取り寄せ、前提条件をそろえて比較する（このページのチェックリストを利用）。</li>
              <li><strong>問い合わせ・ヒアリング</strong>: 販売会社に収益前提・契約条件・実績を確認する。</li>
              <li><strong>物件（区画）の精査</strong>: 立地・系統連系の状況・機器・アグリゲーター契約の中身を確認する。</li>
              <li><strong>売買契約・資金調達</strong>: 契約書の条項（解約・保証・費用分担）を精読。必要に応じ融資条件も比較する。</li>
              <li><strong>設置・連系・運用開始</strong>: 工事と系統連系を経て運用開始。以後は運用レポートで収支を確認する。</li>
            </ol>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                ※流れ・所要期間は商品により異なります。「連系済み・稼働済み」区画か「開発中」区画かで、リスクの性質が大きく変わる点に注意してください。
              </li>
            </ul>

            <h2>契約前チェックリスト（8項目・中立版）</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <strong>収益前提</strong>: どの市場の・どの年度の価格を前提にしているか。需給調整市場の<strong>上限価格15円→10円引下げ案（2026年9月1日実需給分から適用案・2026年7月時点で決定前）</strong>のような制度動向が織り込まれているか（詳細: <Link href="/policy-calendar/meti-stable-supply-wg4-balancing-cap-2026-07">第4回 電力安定供給WG ── 上限価格15円→10円引下げ案</Link>）。
              </li>
              <li>
                <strong>費用の網羅性</strong>: 提示「利回り」に O&M・通信/計量・保険・税（固定資産税等）・将来の機器交換・撤去費まで含まれているか（構造は<Link href="/lv/revenue-model">解説②</Link>参照）。
              </li>
              <li>
                <strong>契約設計</strong>: 対価は固定か変動か、最低保証があるならその裏付けは何か。アグリゲーター手数料・中途解約条件・契約期間。
              </li>
              <li>
                <strong>機器と保証</strong>: 蓄電池・PCSのメーカー、容量保証（年数・保証水準）、国内サポート体制、故障時の対応と費用負担。
              </li>
              <li>
                <strong>系統連系</strong>: 連系承諾は取得済みか、時期と費用負担はどうなっているか。承諾前の区画は完成・稼働までの不確実性が残る。
              </li>
              <li>
                <strong>土地</strong>: 所有か賃借か、地目・造成の状況、水害等のハザード該当。賃借なら期間と更新条件。
              </li>
              <li>
                <strong>保安・消防</strong>: リチウムイオン電池の電解液は消防法上の危険物（第4類）に該当するため、設備の容量・電解液量によっては届出等や市町村の火災予防条例に基づく基準が適用される場合があります（近年も規制見直しが継続）。適用の有無は設備構成と自治体により異なるため、所轄消防への確認状況を販売会社に尋ねてください（出典: 総務省消防庁資料）。制度全体の整理は解説「<Link href="/lv/regulation-subsidy">制度・規制と補助金</Link>」へ。
              </li>
              <li>
                <strong>出口</strong>: 将来の売却可能性（中古市場は形成途上）、撤去費用の見込み、販売会社・運用会社が事業撤退した場合の扱い。
              </li>
            </ol>

            <h2>よくある誤解</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <strong>「利回りは保証されている」</strong>: 収益の源泉は市場取引であり、本質的に変動します。「保証」がある場合は、誰がどう裏付けるのかを確認してください。
              </li>
              <li>
                <strong>「低圧だから手続きは何もない」</strong>: 高圧より負担が軽いのは事実ですが、系統連系・契約・消防関連の確認は低圧でも必要です。
              </li>
            </ul>

            <h2>契約前のセカンドオピニオンとして</h2>
            <p>
              「この前提は妥当か」「この契約条件はどう読むべきか」といった購入前のご相談を、販売者ではない中立の立場で無料でお受けしています。
            </p>
          </div>

          <LvContactCta variant="buy" />
          <p style={{ fontSize: 15, textAlign: 'center', marginTop: 0 }}>
            事業として開発側に回りたい方は{' '}
            <a
              href="https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=funnel_lv_entry"
              target="_blank"
              rel="noopener noreferrer"
            >
              こちら（事業参入のご相談・無料）
            </a>
            。
          </p>

          {/* Stage4: 関連用語（glossary 投入済み・実在確認済み） */}
          <p style={{ fontSize: 15, color: 'var(--color-muted)' }}>
            関連用語: <Link href="/glossary/bess-unit-sale">区画販売（分譲蓄電所）</Link>
          </p>

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
