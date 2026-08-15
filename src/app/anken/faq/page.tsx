/**
 * /anken/faq — 流通案件のよくある質問（anken Phase1 下層）
 * 静的・SSR・canonical自己参照。FAQPage JSON-LD。CTA→eic-jp.org/contact。中立・非媒介（有償化方針）免責。
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AnkenContactCTA from '@/components/AnkenContactCTA';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '蓄電所 流通案件のよくある質問',
  description:
    '蓄電所の流通案件・お取り次ぎに関するよくある質問。なぜ詳細が載っていないのか、宅建業の媒介との違い、守秘、案件の傾向、対応エリアなどを解説。中立・非媒介。',
  robots: { index: true, follow: true },
  alternates: { canonical: '/anken/faq' },
  openGraph: {
    title: '蓄電所 流通案件のよくある質問 | 蓄電所ネット',
    description: '匿名の理由・媒介との違い・守秘・対応エリア等。中立的にお取り次ぎ。',
    type: 'website',
  },
};

const NAVY = 'var(--color-navy,#0F2D4F)';
const card: CSSProperties = { padding: 20, background: 'var(--color-bg-card,#fff)', border: '1px solid var(--color-border)', borderRadius: 8 };

const FAQ: { q: string; a: string }[] = [
  {
    q: 'なぜ案件の詳細が載っていないのですか？',
    a: '個別特定を避けるため、所在は地方ブロック止まり・座標なし・実日付なしで匿名・概括化して掲載しています。具体的な詳細はお問い合わせ時に案件元へお取り次ぎします。',
  },
  {
    q: '宅建業の媒介ですか？',
    a: 'いいえ。情報提供と案件元へのお取り次ぎ・コンサルティングを行い、宅地建物取引の媒介・代理は行いません。取引条件は案件元と当事者間で直接ご確認いただきます。',
  },
  {
    q: '個人情報・守秘はどう扱われますか？',
    a: 'お預かりした情報は、お取り次ぎの目的の範囲でのみ取り扱います。しつこい営業は行いません。',
  },
  {
    q: 'どんな案件がありますか？',
    a: '連系枠確保済の2MW/8MWh級を中心に、全国の開発案件を取り扱っています。規模・ステータス・エリアの傾向は匿名で公開し、個別の案件はお問い合わせ時にご案内します。',
  },
  {
    q: '買い手・売り手どちらも相談できますか？対応エリアは？',
    a: 'どちらも相談可能です。対応エリアは全国です。中立的にお取り次ぎします。',
  },
];

export default function AnkenFaqPage() {
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/anken">流通案件</Link> / よくある質問
          </p>
          <div className="section-label">流通案件 ／ FAQ</div>
          <h1 className="section-title">蓄電所 流通案件のよくある質問</h1>
          <p className="section-desc anken-prose" style={{ marginBottom: 28, lineHeight: 1.85, marginLeft: 0 }}>
            蓄電所の流通案件・お取り次ぎについて、よくいただくご質問にお答えします。
            蓄電所ネット（一般社団法人エネルギー情報センター運営）は中立的な窓口です。
          </p>

          <div className="anken-prose" style={{ marginBottom: 32, marginLeft: 0 }}>
            {FAQ.map((f) => (
              <div key={f.q} style={{ ...card, marginBottom: 12 }}>
                <h2 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: NAVY }}>Q. {f.q}</h2>
                <p style={{ fontSize: 15, lineHeight: 1.85, margin: 0 }}>A. {f.a}</p>
              </div>
            ))}
          </div>

          <section style={{ background: NAVY, borderRadius: 12, padding: '28px 24px', color: '#fff', marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#fff' }}>その他のご質問・ご相談</h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 20, color: '#cbd5e1' }}>ご不明点は何でもお問い合わせください。中立的にお取り次ぎします。</p>
            <AnkenContactCTA page="faq" position="main">お問い合わせはこちら →</AnkenContactCTA>
          </section>

          <section style={{ ...card, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/anken">流通案件トップ（市場動向）</Link></li>
              <li><Link href="/anken/flow">お取り次ぎの流れ</Link></li>
              <li><Link href="/anken/buy">購入・取得したい方へ</Link></li>
              <li><Link href="/anken/sell">売却・譲渡したい方へ</Link></li>
            </ul>
          </section>

          <p className="anken-prose" style={{ fontSize: 15.5, color: 'var(--color-muted)', lineHeight: 1.85, marginLeft: 0 }}>
            ※ 蓄電所ネット（一般社団法人エネルギー情報センター）は中立的な情報提供および案件元へのお取り次ぎ・コンサルティングを行うもので、宅地建物取引の媒介・代理は行いません。掲載は特定回避のため概括化しており、住所・座標・契約日等は掲載していません。取引条件は案件元と直接ご確認ください。
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
