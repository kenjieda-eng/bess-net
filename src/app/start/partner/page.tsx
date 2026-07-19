/**
 * /start/partner — 入口LP「蓄電池ビジネスに関わりたい方へ」（入口再設計2026-07-15）
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
              低圧での事業参入という入口もあります（<Link href="/lv/entry-guide">事業参入ガイドへ</Link>）。
            </p>
            <p>
              <strong>ご相談・お問い合わせは無料です。</strong>
            </p>

            {/* ── 3LP増補 A案（2026-07-19）: 固有節→流れ→安心材料→相談前FAQ。CTA/リンク5本/titleは不変 ── */}
            <h2>「関わり方」の5類型 ── 自分の立ち位置を見つける</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li><strong>開発する</strong> ── 用地取得から連系・建設まで（低圧の手順は<Link href="/lv/entry-guide">事業参入ガイド</Link>へ）。</li>
              <li><strong>出資・投資する</strong> ── 区画購入・共同出資などの資金参加。</li>
              <li><strong>土地を提供する</strong> ── 遊休地・転用が難しい土地の活用先として。</li>
              <li><strong>機器・サービスを提供する</strong> ── 機器・EPC・O&M・ソフトウェアなどの供給側。</li>
              <li><strong>束ねる・運用する</strong> ── アグリゲーションや運用面での連携。</li>
            </ol>
            <p>複数の類型にまたがるご相談も普通です。</p>

            <h2>ご相談の流れ（3ステップ）</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li><strong>フォームから送信</strong> ── 関心のある類型・現在の状況を一言で。</li>
              <li><strong>EICチームから返信</strong> ── 内容を確認し、折り返しご連絡します。</li>
              <li><strong>オンライン等でご相談</strong> ── 業界の現在地の共有と、参入・連携の選択肢をご提案します。</li>
            </ol>
            <p>ここまですべて無料です。</p>

            <StartTrustBlock />

            <h2>ご相談前のよくある質問</h2>
            <p>
              <strong>Q. 具体的な事業計画がなくても相談できますか？</strong>
              <br />
              A. できます。「どんな関わり方があるか」を知る段階からどうぞ。上の5類型が地図になります。
            </p>
            <p>
              <strong>Q. bess-netへの情報掲載・協業の相談もここで良いですか？</strong>
              <br />
              A. はい。掲載・データ提供・共同企画などのご相談も同じ窓口で承ります。
            </p>
            <p>
              <strong>Q. 費用はかかりますか？</strong>
              <br />
              A. ご相談は無料です。協業の内容によって費用が発生する場合は、事前に明示し、合意のうえで進めます。
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
