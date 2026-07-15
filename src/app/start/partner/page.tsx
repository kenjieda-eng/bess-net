/**
 * /start/partner — 入口LP「蓄電池ビジネスに関わりたい方へ」（入口再設計2026-07-15）
 * 設計: 1ページ=1意図=1CTA（operating-bess-introduction 型）・SSG・外部API 0・リンク厳選
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

const CONTACT_URL =
  'https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=funnel_partner';

const LEAD =
  'メーカー・EPC・デベロッパー・アグリゲーターなど、蓄電池ビジネスの実務に携わる方と、これから参入する方のために、データ・ツール・協業の窓口を用意しています。';

export const metadata: Metadata = {
  // layout の titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '蓄電池ビジネスに関わりたい方へ',
  description: LEAD,
  alternates: { canonical: '/start/partner' },
  openGraph: {
    title: '蓄電池ビジネスに関わりたい方へ',
    description: LEAD,
    type: 'website',
    url: 'https://bess-net.jp/start/partner',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function StartPartnerPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail" style={{ maxWidth: 860 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 事業として関わりたい
          </p>
          <span className="article-category">はじめての方へ</span>
          <h1
            className="article-title"
            style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}
          >
            蓄電池ビジネスに関わりたい方へ
          </h1>

          <div className="article-body">
            <p>{LEAD}</p>

            <h2>こんな方へ</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>蓄電池関連事業への参入を検討している</li>
              <li>業界の構造・プレイヤー・市場データを把握したい</li>
              <li>bess-net・EIC との協業や情報掲載を相談したい</li>
            </ul>

            <h2>できること</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <strong>実務ツール群</strong>（無料・登録不要）— IRR・系統連系診断・補助金マッチングほか
              </li>
              <li>
                <strong>業界データベース</strong> — 事業者ナビ（540社超）・業界カオスマップ・事業者ランキング Top50
              </li>
              <li>
                <strong>協業・掲載のご相談</strong>
              </li>
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
              <li><Link href="/tools">実務ツール一覧（無料・登録不要）</Link></li>
              <li><Link href="/industry">蓄電池 業界分析ハブ</Link></li>
              <li><Link href="/reports/2026">業界レポート2026（全10章）</Link></li>
              <li><Link href="/seller/manufacturer">メーカー向けページ</Link></li>
              <li><Link href="/seller/epc">EPC 事業者向けページ</Link></li>
            </ul>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
