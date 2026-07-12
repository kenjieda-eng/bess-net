/**
 * /info/operating-bess-introduction — 稼働中蓄電所ご紹介の常設PR 1枚ページ
 * （2026-07-11 EDAさん発案・11ペルソナ議論済みコピーをそのまま使用）
 *
 * 設計:
 *  - SEETEL 紹介ページと同族の info 型・静的ページ（SSG・runtime 外部API 0）
 *  - 実績数値の焼き込みなし（誇張なし方針・レビュー済みコピー固定）
 *  - CTA は EIC お問い合わせフォームへ UTM 付き外部リンク（変更0で 200 確認済み）
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import substationsIndex from '@/data/substations/index.json';

export const dynamic = 'force-static';

// 変電所数はローカル JSON から動的参照（焼き込み禁止・v15 原則。microCMS 0 req）
const SUBSTATION_TOTAL_STR = (substationsIndex as { total: number }).total.toLocaleString('en-US');

const SLUG = 'operating-bess-introduction';
const CONTACT_URL =
  'https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=operating_bess_intro';

const LEAD =
  '稼働中の系統用蓄電池（蓄電所）の取得をご検討の事業者・投資家の方へ、当サイト運営元の EIC が案件のご紹介を承ります。売却・譲渡をご検討のオーナー様からのご相談も受け付けています。';

export const metadata: Metadata = {
  // layout の titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '稼働中の系統用蓄電池（蓄電所）のご紹介',
  description: LEAD,
  alternates: { canonical: `/info/${SLUG}` },
  openGraph: {
    title: '稼働中の系統用蓄電池（蓄電所）のご紹介',
    description: LEAD,
    type: 'website',
    url: `https://bess-net.jp/info/${SLUG}`,
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function OperatingBessIntroductionPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail" style={{ maxWidth: 860 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/info">お知らせ</Link> /
            稼働中蓄電所のご紹介
          </p>
          <span className="article-category">ご案内</span>
          <h1
            className="article-title"
            style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}
          >
            稼働中の系統用蓄電池（蓄電所）のご紹介
          </h1>

          <div className="article-body">
            <p>
              {LEAD}
              電力・エネルギー分野の専門家が直接ご相談に対応します。
            </p>

            {/* 信頼性強化（2026-07-12 ノブ案）。記載は EIC 公式サイト・自サイトで出典が取れた事実のみ（L-EIC-019） */}
            <h2>安心してご相談いただける理由</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <strong>電力業界の専門家が直接対応</strong> —
                ご相談には、蓄電池・エネルギー分野の著書（『2時間でわかる 蓄電池ビジネスの未来』ほか）を持つ運営法人理事の江田健二が対応します。
              </li>
              <li>
                <strong>業界データ基盤の運営元</strong> —
                蓄電所ネットは全国10社・{SUBSTATION_TOTAL_STR}変電所の系統情報DB、540社超の事業者ナビ、
                <Link href="/reports/2026">業界レポート2026</Link> 等を運営しており、案件を評価するためのデータ基盤を持っています。
              </li>
              <li>
                <strong>中立的な業界メディアとしての運営実績</strong> —
                運営元の{siteConfig.organization.name}（EIC）は、電力・エネルギーの会員制総合情報サイト「新電力ネット」の運営、セミナーの主催・講演会の開催・書籍の出版・講師派遣を行う法人です（2026年7月の台湾SEETEL×JC-STARセミナーにも協力）。
              </li>
            </ul>

            <h2>こんな方へ</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>稼働中（運転開始済み）の蓄電所の取得・投資を検討している</li>
              <li>開発段階のリスクを避け、運転実績のある案件から参入したい</li>
              <li>保有する蓄電所の売却・譲渡先を探している</li>
            </ul>

            <h2>ご紹介の流れ</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <strong>お問い合わせ</strong> — 下記フォームからご連絡ください
              </li>
              <li>
                <strong>ヒアリング</strong> — ご希望条件（エリア・規模・時期など）を伺います
              </li>
              <li>
                <strong>ご紹介</strong> — 条件に合う案件・お相手をご紹介します
              </li>
            </ol>
            <p>
              <strong>ご相談・お問い合わせは無料です。</strong>
            </p>

            <h2>よくあるご質問</h2>
            <p style={{ marginBottom: 8 }}>
              <strong>Q. 相談だけでも可能ですか？</strong>
              <br />
              A. 可能です。条件が固まっていない段階のご相談もお受けします。
            </p>
            <p>
              <strong>Q. 売却側の相談もできますか？</strong>
              <br />
              A. はい。保有蓄電所の売却・譲渡のご相談も受け付けています。
            </p>

            <h2>運営元について</h2>
            <p>
              本サービスは、蓄電所ネットの運営元である{siteConfig.organization.name}（EIC）が承ります。
              EIC は各種統計等のエネルギーに関する情報の提供、セミナーの主催および講演会の開催・書籍の出版、環境・エネルギーに関するアドバイザー事業を行う一般社団法人です。
              ※案件の状況により、ご希望に沿うご紹介ができない場合があります。
            </p>
          </div>

          {/* CTA（主ボタン1つ・EIC フォームへ UTM 付き誘導） */}
          <div
            style={{
              margin: '32px 0',
              padding: 24,
              background: '#f8fafc',
              border: '2px solid #0F2D4F',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 16,
                marginTop: 0,
                color: '#0F2D4F',
              }}
            >
              ご相談・ご質問は EIC お問い合わせフォームから
            </p>
            <a
              href={CONTACT_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-block',
                background: '#0F2D4F',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: 4,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              EIC お問い合わせフォームへ →
            </a>
          </div>

          {/* 関連リンク */}
          <section
            style={{
              padding: 16,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
              関連リンク
            </h2>
            <ul style={{ lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li>
                <Link href="/anken">流通案件一覧</Link> — 蓄電所ネット掲載の売買・開発案件情報
              </li>
              <li>
                <Link href="/tools/grid-connection-check">系統連系診断</Link> —
                希望地点・出力から連系候補変電所を即時抽出
              </li>
              <li>
                <Link href="/tools/irr-simulator">蓄電池IRRシミュレーター</Link> —
                取得検討時の事業性を無料試算
              </li>
            </ul>
          </section>

          <p className="back-link">
            <Link href="/info">← お知らせ一覧へ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
