/**
 * /lv — 低圧蓄電所クラスタ Stage1 ハブ（低圧クラスタ企画2026-07-18）
 * 設計: 全静的（鉄則#2/#98/#103）・runtime外部フェッチ0・#107初期DOM・#88二重なし
 * 内部リンクは全て実在確認済み（L-EIC-021・2026-07-18 本番200照合）
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import LvContactCta from '@/components/LvContactCta';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

export const metadata: Metadata = {
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '低圧蓄電所・低圧系統用蓄電池 総合ガイド ── 仕組み・収益・購入・参入',
  description:
    '低圧蓄電所（低圧系統用蓄電池）の仕組み・収益モデル・購入や事業参入の考え方を、販売者ではない中立の立場で体系的に解説。2026年4月に始まった需給調整市場の低圧開放など最新制度も一次資料ベースで扱います。',
  alternates: { canonical: '/lv' },
  openGraph: {
    title: '低圧蓄電所・低圧系統用蓄電池 総合ガイド ── 仕組み・収益・購入・参入',
    description:
      '低圧蓄電所（低圧系統用蓄電池）の仕組み・収益・購入・参入を中立の立場で体系解説。',
    type: 'website',
    url: 'https://bess-net.jp/lv',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

const GUIDES = [
  {
    href: '/lv/what-is',
    num: '解説①',
    title: '低圧蓄電所（低圧系統用蓄電池）とは？',
    desc: '仕組みと構成、高圧の蓄電所との違い、2026年4月の需給調整市場低圧開放までの基礎。',
  },
  {
    href: '/lv/revenue-model',
    num: '解説②',
    title: '低圧蓄電所の収益モデル',
    desc: '収入はどこから生まれ、何に左右されるのか。市場・契約・コストの3層で分解。',
  },
];

const RELATED = [
  { href: '/explainer/low-voltage-balancing-market-launch', label: '低圧系統用蓄電池の需給調整市場参入 ── 4月実装開始とアグリ事業の本格化（解説）' },
  { href: '/policy-calendar/meti-stable-supply-wg4-balancing-cap-2026-07', label: '第4回 電力安定供給WG ── 需給調整市場の上限価格15円→10円引下げ案（政策詳細）' },
  { href: '/explainer/balancing-market-practical', label: '需給調整市場の実務：応札から精算までのプロセス（解説）' },
  { href: '/glossary/aggregator', label: 'アグリゲーター（用語集）' },
  { href: '/glossary/adjustment-reserve', label: '調整力（用語集）' },
];

export default function LvHubPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '低圧蓄電所', item: 'https://bess-net.jp/lv' },
    ],
  };
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: '低圧蓄電所・低圧系統用蓄電池 総合ガイド',
    description: '低圧蓄電所（低圧系統用蓄電池）の仕組み・収益・購入・参入を中立の立場で体系解説。',
    url: 'https://bess-net.jp/lv',
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 960 }}>
          <p className="article-breadcrumb">
            <Link href="/">ホーム</Link> / 低圧蓄電所
          </p>
          <div className="section-label">LV BESS — 低圧蓄電所ガイド</div>
          <h1 className="section-title">低圧蓄電所・低圧系統用蓄電池 総合ガイド</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 32, lineHeight: 1.8 }}>
            契約電力50kW未満の「低圧」で系統に連系する蓄電池事業 ── 低圧蓄電所（低圧系統用蓄電池）への関心が高まっています。2026年4月には需給調整市場が低圧リソースに開かれ、区画販売（分譲）型の商品も増えてきました。一方で、検索して出てくる情報の多くは販売者側の資料です。このページは、販売者ではない中立の立場から、仕組み・収益・リスク・制度を一次資料ベースで整理する総合ガイドです。
          </p>

          {/* 解説シリーズ（Stage1: 2本） */}
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>解説シリーズ</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 8 }}>
            {GUIDES.map((g) => (
              <Link key={g.href} href={g.href} style={{
                display: 'block', padding: 20, border: '1px solid var(--color-border)',
                borderRadius: 8, textDecoration: 'none', color: 'inherit', background: 'white',
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-accent, #0066cc)', marginBottom: 4 }}>{g.num}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.5 }}>{g.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: 'var(--color-muted)' }}>{g.desc}</p>
                <div style={{ fontSize: 12, color: 'var(--color-accent)', marginTop: 8 }}>読む →</div>
              </Link>
            ))}
          </div>
          <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 32 }}>
            購入・投資ガイド、リスクと注意点、事業参入ガイド、制度・規制と補助金を順次公開予定です（7月中）。
          </p>

          {/* 関連する当サイトのコンテンツ（全て実在確認済み L-EIC-021） */}
          <section style={{ padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連する当サイトのコンテンツ</h2>
            <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              {RELATED.map((r) => (
                <li key={r.href}><Link href={r.href}>{r.label}</Link></li>
              ))}
            </ul>
          </section>

          {/* 意図別の入口 */}
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>ご検討の内容に合わせて</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 8 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>購入・投資を検討している</h3>
              <LvContactCta variant="buy" />
              <p style={{ fontSize: 13, marginTop: 0 }}>
                蓄電所全般の購入・導入は <Link href="/start/buy">蓄電所を買いたい・導入したい方へ</Link> もご覧ください。
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>事業として参入したい</h3>
              <LvContactCta variant="entry" />
              <p style={{ fontSize: 13, marginTop: 0 }}>
                業界全体のデータ・協業は <Link href="/start/partner">蓄電池ビジネスに関わりたい方へ</Link> もご覧ください。
              </p>
            </div>
          </div>

          <p style={{ fontSize: 12, color: 'var(--color-muted)', lineHeight: 1.7 }}>
            本ガイドは情報提供を目的とし、特定商品の勧誘・利回りの保証は行いません。
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>公開日: 2026-07-18</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
