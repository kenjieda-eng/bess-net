/**
 * /start/operate — 入口LP「蓄電所を運営している方へ」（運営者の入口と紹介の依頼便・2026-10-17）
 * 設計: /start/sell と同じ形（1ページ=1意図=1CTA・SSG・外部API 0・StartTrustBlock）。
 * 文は便（OneDrive 03_5月13日朝_実行/運営者の入口と紹介の依頼便_…_2026-10-17起草_ユウ.md §1）のとおり（言い換えない・足さない）。
 * 相談のリンクは src/lib/contact-link.ts の contactUrl（campaign funnel_operate）。
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import StartTrustBlock from '@/components/StartTrustBlock';
import { contactUrl } from '@/lib/contact-link';

export const dynamic = 'force-static';

const CONTACT_URL = contactUrl({ campaign: 'funnel_operate', position: 'cta' });

const LEAD =
  '稼働中の蓄電所の売却・譲渡、収益と運用の見直し、2 機目以降の計画など、運営中のオーナー・事業者の方のご相談を EIC の専門家チームが無料で承ります。';

export const metadata: Metadata = {
  // layout の titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '蓄電所を運営している方へ',
  description: LEAD,
  alternates: { canonical: '/start/operate' },
  openGraph: {
    title: '蓄電所を運営している方へ',
    description: LEAD,
    type: 'website',
    url: 'https://bess-net.jp/start/operate',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function StartOperatePage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail" style={{ maxWidth: 860 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 運営している
          </p>
          <span className="article-category">はじめての方へ</span>
          <h1
            className="article-title"
            style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}
          >
            蓄電所を運営している方へ
          </h1>

          <div className="article-body">
            <p>{LEAD}</p>

            <h2>こんな方へ</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>稼働中の蓄電所の売却・譲渡を考えている（買い手を探したい）</li>
              <li>収入が想定と違う。運用や契約の見直しを考えたい</li>
              <li>1 機目の運転実績をもとに、2 機目以降を考えている</li>
              <li>事業計画や売却の条件について、第三者の意見がほしい</li>
            </ul>

            <h2>できること</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li><strong>買い手候補のご紹介</strong></li>
              <li><strong>市場環境・制度の変化の情報提供</strong></li>
              <li><strong>事業計画・運用についてのセカンドオピニオン</strong></li>
            </ol>
            <p>
              <strong>ご相談・お問い合わせは無料です。</strong>
            </p>

            <h2>ご相談時に「あると話が早い」情報（6点）</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>所在地（都道府県・市区町村）</li>
              <li>規模（kW／kWh）</li>
              <li>運転開始の時期</li>
              <li>アグリゲーター・O&amp;M の契約の状況（契約先・期間）</li>
              <li>直近 12 か月の収入の傾向</li>
              <li>ご相談の目的（売却・運用の見直し・2 機目 など）</li>
            </ol>
            <p>
              <strong>そろっていなくても大丈夫です。</strong>
              分かる範囲でお知らせいただければ、確認しながら進めます。
            </p>
            <p>
              記録は、無料の「<Link href="/tools/asset-ledger">系統用蓄電所 資産台帳テンプレート</Link>」にまとめておくと、売却や借入のご相談で話が早くなります。
            </p>

            <h2>ご相談の流れ（3ステップ）</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li><strong>フォームから送信</strong> ── 上の6点は分かる範囲で。</li>
              <li><strong>EICチームから返信</strong> ── 内容を確認し、折り返しご連絡します。</li>
              <li><strong>オンライン等でご相談</strong> ── 市場環境の共有と、進め方のご提案をします。</li>
            </ol>
            <p>ここまですべて無料です。ご相談によって売却や契約の義務が生じることはありません。</p>

            <StartTrustBlock />

            <h2>ご相談前のよくある質問</h2>
            <p>
              <strong>Q. 売るかどうか決めていない段階でも良いですか？</strong>
              <br />
              A. 構いません。市場環境や進め方の情報提供だけのご相談も承ります。
            </p>
            <p>
              <strong>Q. 案件情報の扱いが心配です。</strong>
              <br />
              A. ご相談内容・案件情報は、相談対応の目的以外には使いません。買い手候補への提示は、ご了承をいただいてから行います。
            </p>
            <p>
              <strong>Q. 費用はかかりますか？</strong>
              <br />
              A. ご相談は無料です。内容によって費用が発生する場合は、事前に明示し、合意のうえで進めます。
            </p>
          </div>

          {/* CTA（1ページ=1CTA・/start/sell と同じ見た目） */}
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

          {/* さらに詳しく（5本） */}
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
              <li><Link href="/tools/asset-ledger">系統用蓄電所 資産台帳テンプレート</Link></li>
              <li><Link href="/tools/asset-check">蓄電所 評価軸セルフチェック</Link></li>
              <li><Link href="/tracker/balancing-rules">需給調整市場 制度変更トラッカー</Link></li>
              <li><Link href="/operators/aggregators">蓄電池アグリゲーター一覧</Link></li>
              <li><Link href="/start/sell">蓄電所を売りたい・案件をお持ちの方へ</Link></li>
            </ul>
          </section>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
