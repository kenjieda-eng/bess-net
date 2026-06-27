/**
 * /anken/buy — 購入・取得したい方へ（anken Phase1 下層）
 * 静的・SSR・canonical自己参照。CTA→eic-jp.org/contact。中立・無償・非媒介 免責。
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AnkenContactCTA from '@/components/AnkenContactCTA';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '蓄電所の開発案件・用地を購入/取得したい方へ',
  description:
    '蓄電所の開発案件・用地を購入/取得したい投資家・新規参入・EPC・地主の方へ。連系枠確保済の2MW/8MWh級を中心に、匿名でご紹介し中立・無償で案件元へお取り次ぎ。媒介・手数料はありません。',
  robots: { index: true, follow: true },
  alternates: { canonical: '/anken/buy' },
  openGraph: {
    title: '蓄電所の開発案件・用地を購入/取得したい方へ | 蓄電所ネット',
    description: '連系枠確保済の蓄電所案件を匿名でご紹介。中立・無償で案件元へお取り次ぎ。',
    type: 'website',
  },
};

const NAVY = 'var(--color-navy,#0F2D4F)';
const ACCENT = 'var(--color-accent,#00B5A5)';
const card: CSSProperties = { padding: 20, background: 'var(--color-bg-card,#fff)', border: '1px solid var(--color-border)', borderRadius: 8 };

export default function AnkenBuyPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 980 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/anken">流通案件</Link> / 購入・取得したい方へ
          </p>
          <div className="section-label">流通案件 ／ 購入・取得</div>
          <h1 className="section-title">蓄電所の開発案件・用地を購入/取得したい方へ</h1>
          <p className="section-desc" style={{ marginBottom: 28, lineHeight: 1.85 }}>
            連系枠の確保が進む2MW/8MWh級を中心に、全国の蓄電所開発案件が流通しています。
            蓄電所ネット（一般社団法人エネルギー情報センター運営）が、中立・無償で案件元へお取り次ぎします。
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 12 }}>こんな方に</h2>
          <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, marginBottom: 28 }}>
            <li>投資家・ファンド（蓄電所をポートフォリオに組み入れたい）</li>
            <li>新規参入事業者（連系枠確保済案件から始めたい）</li>
            <li>EPC 事業者（施工・運用案件のソーシング）</li>
            <li>地主・土地保有者（周辺案件の取得・共同開発）</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 12 }}>こんなご相談に</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginBottom: 28 }}>
            {[
              ['連系枠確保済案件を探したい', '負担金入金済・連系枠確保進行の案件傾向を匿名でご紹介し、詳細は取り次ぎます。'],
              ['投資基準に合う規模を知りたい', '2MW/8MWh級を中心とした規模・ステータスの傾向感をご案内します。'],
              ['EPC・運用先を紹介してほしい', '業界ハブとして、施工・O&M・アグリゲーション等の連携先もご相談に対応します。'],
            ].map(([h, d]) => (
              <div key={h} style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: NAVY }}>{h}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.8, margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 12 }}>どんな案件があるか（匿名・傾向）</h2>
          <p style={{ fontSize: 14, lineHeight: 1.85, marginBottom: 12 }}>
            連系枠確保済の2MW/8MWh級を中心に、宅地系・農地系・山林系の地目、連系目安〜6ヶ月／6〜12ヶ月／12ヶ月超など、
            規模・ステータス・エリアの傾向を匿名で公開しています（個別特定は避けています）。
            具体的な傾向は <Link href="/anken">流通案件トップの市場動向</Link> をご覧ください。確認の流れは{' '}
            <Link href="/anken/flow">お取り次ぎの流れ</Link> をご確認ください。
          </p>

          <section style={{ background: NAVY, borderRadius: 12, padding: '28px 24px', color: '#fff', margin: '20px 0 32px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#fff' }}>購入・取得のご相談</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 20, color: '#cbd5e1' }}>投資基準・希望エリア・規模をお知らせください。中立・無償でお取り次ぎします。</p>
            <AnkenContactCTA location="buy">購入・取得のご相談はこちら →</AnkenContactCTA>
          </section>

          <section style={{ ...card, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/buyer/investor">投資家・ファンドの方へ</Link></li>
              <li><Link href="/buyer/new-entry">これから参入する事業者の方へ</Link></li>
              <li><Link href="/anken">流通案件トップ（市場動向）</Link></li>
              <li><Link href="/anken/flow">お取り次ぎの流れ</Link></li>
            </ul>
          </section>

          <p style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.85 }}>
            ※ 蓄電所ネット（一般社団法人エネルギー情報センター）は中立・無償の情報提供および案件元へのお取り次ぎを行うもので、宅地建物取引の媒介・代理は行いません。掲載は特定回避のため概括化しており、住所・座標・契約日等は掲載していません。取引条件は案件元と直接ご確認ください。
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
