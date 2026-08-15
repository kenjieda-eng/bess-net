/**
 * /anken/flow — お取り次ぎの流れ・仕組み（anken Phase1 下層）
 * 静的・SSR・canonical自己参照。CTA→eic-jp.org/contact。中立・非媒介（有償化方針）免責。
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AnkenContactCTA from '@/components/AnkenContactCTA';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '蓄電所案件のお取り次ぎの流れ ｜ 中立的な窓口',
  description:
    '蓄電所ネット（一般社団法人エネルギー情報センター）による蓄電所案件のお取り次ぎの流れ。お問い合わせ→内容確認→案件元へ取り次ぎ→直接ご商談。中立・守秘、宅地建物取引の媒介・代理は行いません。',
  robots: { index: true, follow: true },
  alternates: { canonical: '/anken/flow' },
  openGraph: {
    title: '蓄電所案件のお取り次ぎの流れ ｜ 中立的な窓口 | 蓄電所ネット',
    description: 'お問い合わせ→内容確認→案件元へ取り次ぎ→直接ご商談。中立・守秘・非媒介。',
    type: 'website',
  },
};

const NAVY = 'var(--color-navy,#0F2D4F)';
const ACCENT = 'var(--color-accent,#00B5A5)';
const card: CSSProperties = { padding: 20, background: 'var(--color-bg-card,#fff)', border: '1px solid var(--color-border)', borderRadius: 8 };

export default function AnkenFlowPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/anken">流通案件</Link> / お取り次ぎの流れ
          </p>
          <div className="section-label">流通案件 ／ 仕組み</div>
          <h1 className="section-title">蓄電所案件のお取り次ぎの流れ ─ 中立的な窓口</h1>
          <p className="section-desc anken-prose" style={{ marginBottom: 28, lineHeight: 1.85, marginLeft: 0 }}>
            蓄電所ネット（一般社団法人エネルギー情報センター運営）は、買いたい方・売りたい方をつなぐ中立的な窓口です。
            宅地建物取引の媒介・代理は行わず、案件元へのお取り次ぎ・コンサルティングを行います。
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 16 }}>4ステップ</h2>
          <div style={{ display: 'grid', gap: 12, marginBottom: 36 }}>
            {[
              ['① お問い合わせ', '買いたい・売りたい・相談したい、のいずれかと概要をお送りください。窓口は ', 'eic-jp.org/contact', ' です。'],
              ['② 蓄電所ネットが内容確認し案件元へお取り次ぎ', '内容を確認し、適切な案件元（売主・買主・開発事業者等）へお取り次ぎします。', '', ''],
              ['③ 案件元と直接ご商談', '以降は案件元と直接ご商談いただきます。条件・契約は当事者間でご確認ください。', '', ''],
              ['④ 成約は当事者間', '成約は当事者間で行われます。蓄電所ネットは宅地建物取引の媒介・代理を行いません。', '', ''],
            ].map(([h, d, link, tail]) => (
              <div key={h} style={{ ...card, borderLeft: `4px solid ${ACCENT}` }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: NAVY }}>{h}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0 }}>
                  {d}
                  {link ? <AnkenContactCTA page="flow" position="step1" kind="inline">{link}</AnkenContactCTA> : null}
                  {tail}
                </p>
              </div>
            ))}
          </div>

          <p className="anken-prose" style={{ fontSize: 15, lineHeight: 1.85, marginBottom: 36, marginLeft: 0 }}>
            ご相談・お取り次ぎの費用は、ご相談内容に応じて個別にご案内します。
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 12 }}>なぜ中立な窓口なのか</h2>
          <p className="anken-prose" style={{ fontSize: 15, lineHeight: 1.85, marginBottom: 28, marginLeft: 0 }}>
            蓄電所ネットは中立な業界ハブとして、業界全体の健全な流通を促すことを目的としています。
            宅地建物取引の媒介・代理は行わないため、買い手・売り手のどちらにも偏らず、中立にお取り次ぎできます。
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 12 }}>守秘・個人情報の取り扱い</h2>
          <p className="anken-prose" style={{ fontSize: 15, lineHeight: 1.85, marginBottom: 28, marginLeft: 0 }}>
            お預かりした情報は、お取り次ぎの目的の範囲でのみ取り扱います。しつこい営業は行いません。
            個別案件の住所・座標・契約日等の詳細は、特定回避のため公開ページには掲載していません。
          </p>

          <section style={{ background: NAVY, borderRadius: 12, padding: '28px 24px', color: '#fff', marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#fff' }}>まずはお気軽にご相談ください</h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 20, color: '#cbd5e1' }}>買い・売り・相談のいずれも、中立的にお取り次ぎします。</p>
            <AnkenContactCTA page="flow" position="footer">お問い合わせ・ご相談はこちら →</AnkenContactCTA>
          </section>

          <section style={{ ...card, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/anken">流通案件トップ（市場動向）</Link></li>
              <li><Link href="/anken/buy">購入・取得したい方へ</Link></li>
              <li><Link href="/anken/sell">売却・譲渡したい方へ</Link></li>
              <li><Link href="/anken/faq">よくある質問</Link></li>
            </ul>
          </section>

          <p className="anken-prose" style={{ fontSize: 15.5, color: 'var(--color-muted)', lineHeight: 1.85, marginLeft: 0 }}>
            ※ 蓄電所ネット（一般社団法人エネルギー情報センター）は中立的な情報提供および案件元へのお取り次ぎ・コンサルティングを行うもので、宅地建物取引の媒介・代理は行いません。取引条件は案件元と直接ご確認ください。
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
