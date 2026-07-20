/**
 * /start/buy — 入口LP「蓄電所を買いたい・導入したい方へ」（入口再設計2026-07-15）
 * 設計: 1ページ=1意図=1CTA（operating-bess-introduction 型）・SSG・外部API 0・リンク厳選
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import StartTrustBlock from '@/components/StartTrustBlock';

export const dynamic = 'force-static';

const CONTACT_URL =
  'https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=funnel_buy';

const LEAD =
  '稼働中の蓄電所の取得から、新規開発への投資、工場・施設への蓄電池導入まで — 目的に合わせて、EIC の専門家チームが無料でご相談に応じます。';

export const metadata: Metadata = {
  // layout の titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '蓄電所を買いたい・導入したい方へ',
  description: LEAD,
  alternates: { canonical: '/start/buy' },
  openGraph: {
    title: '蓄電所を買いたい・導入したい方へ',
    description: LEAD,
    type: 'website',
    url: 'https://bess-net.jp/start/buy',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function StartBuyPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail" style={{ maxWidth: 860 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 買いたい・導入したい
          </p>
          <span className="article-category">はじめての方へ</span>
          <h1
            className="article-title"
            style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}
          >
            蓄電所を買いたい・導入したい方へ
          </h1>

          <div className="article-body">
            <p>{LEAD}</p>

            <h2>こんな方へ</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>収益実績のある稼働中の蓄電所を取得したい</li>
              <li>蓄電所の新規開発・投資を検討している</li>
              <li>工場・商業施設の電気代削減や BCP のために蓄電池を導入したい</li>
              <li>何から始めればよいか、まず話を聞いてみたい</li>
            </ul>

            <h2>できること</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <strong>稼働中案件のご紹介</strong> — 詳細は
                <Link href="/info/operating-bess-introduction">稼働中蓄電所のご紹介ページ</Link>へ
              </li>
              <li>
                <strong>市場・収益性の情報提供</strong> — 系統DB・IRRシミュレーター等の無料ツールをご活用いただけます
              </li>
              <li>
                <strong>条件整理から相手先探しまでの伴走</strong>
              </li>
            </ol>
            <p>
              小規模から始める低圧蓄電所という選択肢もあります（<Link href="/lv">総合ガイドへ</Link>）。
            </p>
            <p>
              <strong>ご相談・お問い合わせは無料です。</strong>
            </p>

            {/* ── 3LP増補 A案（2026-07-19）: 固有節→流れ→安心材料→相談前FAQ。CTA/リンク5本/titleは不変 ── */}
            <h2>ご相談でよくあるテーマ</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li><strong>新設か、稼働中か</strong> ── ゼロから開発するか、稼働中の蓄電所を取得するか（稼働中のご紹介は<Link href="/info/operating-bess-introduction">「稼働中蓄電所のご紹介」</Link>へ）。</li>
              <li><strong>高圧か、低圧か</strong> ── 投資規模と手続き負担が大きく異なります（低圧の全体像は<Link href="/lv">総合ガイド</Link>へ）。</li>
              <li><strong>価格・利回りの妥当性</strong> ── 販売資料の前提条件をどう読むか。</li>
              <li><strong>補助金が使えるか</strong> ── 公募状況と対象要件の確認。</li>
            </ul>
            <p>どのテーマも「まだ絞れていない」段階からで大丈夫です。</p>

            <h2>ご相談の流れ（3ステップ）</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li><strong>フォームから送信</strong> ── 現時点で分かっている範囲で構いません。</li>
              <li><strong>EICチームから返信</strong> ── 内容を確認し、折り返しご連絡します（必要に応じて日程調整）。</li>
              <li><strong>オンライン等でご相談</strong> ── 状況の整理と、取りうる選択肢をご提案します。</li>
            </ol>
            <p>ここまですべて無料です。ご相談によって契約や購入の義務が生じることはありません。</p>

            <StartTrustBlock />

            <h2>ご相談前のよくある質問</h2>
            <p>
              <strong>Q. 検討を始めたばかりでも相談できますか？</strong>
              <br />
              A. できます。「何から調べればよいか」という段階のご相談も歓迎です。基礎を独学されたい方は<Link href="/lv">総合ガイド</Link>もご活用ください。
            </p>
            <p>
              <strong>Q. 相談すると、必ず何かを勧められますか？</strong>
              <br />
              A. いいえ。目的は状況の整理と選択肢のご提示です。検討の結果「今は買わない」という結論になるご相談も普通にあります。
            </p>
            <p>
              <strong>Q. 相談内容が外部に伝わることはありませんか？</strong>
              <br />
              A. ご相談内容は、相談対応の目的以外には使いません。
            </p>
          </div>

          {/* CTA（1ページ=1CTA） */}
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
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 16, marginTop: 0, color: '#0F2D4F' }}>
              ご相談・ご質問は EIC お問い合わせフォームから（無料）
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
                fontSize: 15,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              EIC お問い合わせフォームへ →
            </a>
          </div>

          <p style={{ fontSize: 15, color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: 24 }}>
            本サービスは、蓄電所ネットの運営元である{siteConfig.organization.name}（EIC）が承ります。
          </p>

          {/* さらに詳しく（厳選5本） */}
          <section
            style={{
              padding: 16,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 15,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>さらに詳しく</h2>
            <ul style={{ lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/info/operating-bess-introduction">稼働中蓄電所のご紹介</Link></li>
              <li><Link href="/buyer/factory-commercial">工場・商業施設の電気代削減（自家消費・BCP）</Link></li>
              <li><Link href="/tools/irr-simulator">蓄電池 IRR シミュレーター（無料）</Link></li>
              <li><Link href="/tools/grid-connection-check">蓄電池 系統連系診断（無料）</Link></li>
              <li><Link href="/reports/2026">業界レポート2026（全10章）</Link></li>
            </ul>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
