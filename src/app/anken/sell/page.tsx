/**
 * /anken/sell — 売却・譲渡したい方へ（anken Phase1 下層）
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
  title: '蓄電所の用地・開発案件を売却/譲渡したい方へ',
  description:
    '蓄電所の用地・開発案件を売却/譲渡したい地主・開発事業者・事業譲渡検討者の方へ。匿名・無償・守秘で安心してご相談いただけます。蓄電所ネットが中立に案件元（買い手）へお取り次ぎ。媒介・手数料はありません。',
  robots: { index: true, follow: true },
  alternates: { canonical: '/anken/sell' },
  openGraph: {
    title: '蓄電所の用地・開発案件を売却/譲渡したい方へ | 蓄電所ネット',
    description: '用地・開発案件・事業譲渡を匿名・無償・守秘でご相談。中立にお取り次ぎ。',
    type: 'website',
  },
};

const NAVY = 'var(--color-navy,#0F2D4F)';
const ACCENT = 'var(--color-accent,#00B5A5)';
const card: CSSProperties = { padding: 20, background: 'var(--color-bg-card,#fff)', border: '1px solid var(--color-border)', borderRadius: 8 };

export default function AnkenSellPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 980 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/anken">流通案件</Link> / 売却・譲渡したい方へ
          </p>
          <div className="section-label">流通案件 ／ 売却・譲渡</div>
          <h1 className="section-title">蓄電所の用地・開発案件を売却/譲渡したい方へ</h1>
          <p className="section-desc" style={{ marginBottom: 28, lineHeight: 1.85 }}>
            用地・開発中案件・事業の売却や譲渡をご検討の方へ。蓄電所ネット（一般社団法人エネルギー情報センター運営）が、
            匿名・無償・守秘で中立に買い手へお取り次ぎします。宅地建物取引の媒介・手数料はありません。
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 12 }}>こんな方に</h2>
          <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, marginBottom: 28 }}>
            <li>地主・土地保有者（用地の売却・賃貸・共同開発を検討）</li>
            <li>開発事業者（開発中案件・連系枠付き案件の売却）</li>
            <li>事業譲渡を検討する事業者（運用中・建設中案件の譲渡）</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 12 }}>こんなご相談に</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginBottom: 28 }}>
            {[
              ['用地・開発中案件を売却したい', '匿名でお預かりし、関心のある買い手へ中立にお取り次ぎします。'],
              ['事業譲渡の相手を探したい', '運用中・建設中案件の譲渡先について、守秘の範囲でご相談に対応します。'],
              ['適正な相場感を知りたい', '規模・ステータス・エリアの傾向から、相場感の整理をお手伝いします。'],
            ].map(([h, d]) => (
              <div key={h} style={card}>
                <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px', color: NAVY }}>{h}</h3>
                <p style={{ fontSize: 13.5, lineHeight: 1.8, margin: 0 }}>{d}</p>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, color: NAVY, marginBottom: 12 }}>匿名・無償・守秘で安心</h2>
          <p style={{ fontSize: 14, lineHeight: 1.85, marginBottom: 12 }}>
            公開ページに住所・座標・契約日等の個別情報は掲載しません（特定回避のため概括化）。
            お預かりした情報はお取り次ぎの目的の範囲でのみ扱い、しつこい営業は行いません。
            お取り次ぎの詳細は <Link href="/anken/flow">お取り次ぎの流れ</Link> をご確認ください。
          </p>

          <section style={{ background: NAVY, borderRadius: 12, padding: '28px 24px', color: '#fff', margin: '20px 0 32px' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 10, color: '#fff' }}>売却・譲渡のご相談</h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, marginBottom: 20, color: '#cbd5e1' }}>用地・案件の概要をお知らせください。匿名・無償・守秘でお取り次ぎします。</p>
            <AnkenContactCTA location="sell">売却・譲渡のご相談はこちら →</AnkenContactCTA>
          </section>

          <section style={{ ...card, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/seller/developer">プロジェクトデベロッパーの方へ</Link></li>
              <li><Link href="/buyer/landowner">土地保有者・地主の方へ</Link></li>
              <li><Link href="/anken">流通案件トップ（市場動向）</Link></li>
              <li><Link href="/anken/flow">お取り次ぎの流れ</Link></li>
            </ul>
          </section>

          <p style={{ fontSize: 12.5, color: 'var(--color-muted)', lineHeight: 1.85 }}>
            ※ 蓄電所ネット（一般社団法人エネルギー情報センター）は中立・無償の情報提供および案件元へのお取り次ぎを行うもので、宅地建物取引の媒介・代理は行いません。取引条件は案件元と直接ご確認ください。
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
