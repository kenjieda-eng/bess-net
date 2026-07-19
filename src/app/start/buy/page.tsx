/**
 * /start/buy — 入口LP「蓄電所を買いたい・導入したい方へ」（入口再設計2026-07-15）
 * 設計: 1ページ=1意図=1CTA（operating-bess-introduction 型）・SSG・外部API 0・リンク厳選
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

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
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              EIC お問い合わせフォームへ →
            </a>
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: 24 }}>
            本サービスは、蓄電所ネットの運営元である{siteConfig.organization.name}（EIC）が承ります。
          </p>

          {/* さらに詳しく（厳選5本） */}
          <section
            style={{
              padding: 16,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 14,
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
