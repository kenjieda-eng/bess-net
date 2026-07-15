/**
 * /start/sell — 入口LP「蓄電所を売りたい・案件をお持ちの方へ」（入口再設計2026-07-15）
 * 設計: 1ページ=1意図=1CTA（operating-bess-introduction 型）・SSG・外部API 0・リンク厳選
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

const CONTACT_URL =
  'https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=funnel_sell';

const LEAD =
  '保有する蓄電所の売却・譲渡、開発中案件や土地の活用など、売り手側のご相談を EIC の専門家チームが無料で承ります。';

export const metadata: Metadata = {
  // layout の titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '蓄電所を売りたい・案件をお持ちの方へ',
  description: LEAD,
  alternates: { canonical: '/start/sell' },
  openGraph: {
    title: '蓄電所を売りたい・案件をお持ちの方へ',
    description: LEAD,
    type: 'website',
    url: 'https://bess-net.jp/start/sell',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function StartSellPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail" style={{ maxWidth: 860 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 売りたい・案件がある
          </p>
          <span className="article-category">はじめての方へ</span>
          <h1
            className="article-title"
            style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}
          >
            蓄電所を売りたい・案件をお持ちの方へ
          </h1>

          <div className="article-body">
            <p>{LEAD}</p>

            <h2>こんな方へ</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>稼働中の蓄電所の売却・譲渡先を探している</li>
              <li>開発中の案件・系統枠・土地の活用先を探している</li>
              <li>保有資産の売却時期・進め方を相談したい</li>
            </ul>

            <h2>できること</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li><strong>買い手候補のご紹介</strong></li>
              <li><strong>相場感・市場環境の情報提供</strong></li>
              <li><strong>条件整理から交渉プロセスまでの伴走</strong></li>
            </ol>
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

          {/* さらに詳しく（厳選4本） */}
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
              <li><Link href="/anken">蓄電所の流通案件（全国）</Link></li>
              <li><Link href="/seller/developer">プロジェクトデベロッパー向けページ</Link></li>
              <li><Link href="/subsidies">蓄電池 補助金カレンダー</Link></li>
            </ul>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
