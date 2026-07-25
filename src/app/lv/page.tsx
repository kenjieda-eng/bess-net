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
import { getIndustryNews } from '@/lib/microcms';

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
  {
    href: '/lv/buying-guide',
    num: '解説③',
    title: '低圧蓄電所の購入・投資ガイド',
    desc: '分譲（区画）購入までの5ステップと、収益前提・契約・機器・土地・保安の8項目チェックリスト。',
  },
  {
    href: '/lv/risks',
    num: '解説④',
    title: '低圧蓄電所のリスクと注意点',
    desc: '価格変動・制度変更・機器・事業者・災害・出口の6リスクと、「高利回り」表示を読む5つの視点。',
  },
  {
    href: '/lv/entry-guide',
    num: '解説⑤',
    title: '低圧蓄電所の事業参入ガイド',
    desc: '開発側に回るための6ステップ。用地選定・系統連系の申込み・機器選定（JC-STAR動向）・アグリゲーター契約・事業計画。',
  },
  {
    href: '/lv/regulation-subsidy',
    num: '解説⑥',
    title: '低圧蓄電所の制度・規制と補助金',
    desc: '電気事業法・保安・消防・計量・需給調整市場の要件と補助金の探し方。「決定済み」と「検討中」を区別した現在地。',
  },
];

const RELATED = [
  { href: '/explainer/low-voltage-balancing-market-launch', label: '低圧系統用蓄電池の需給調整市場参入 ── 4月実装開始とアグリ事業の本格化（解説）' },
  { href: '/policy-calendar/meti-stable-supply-wg4-balancing-cap-2026-07', label: '第4回 電力安定供給WG ── 需給調整市場の上限価格15円→10円引下げ案（政策詳細）' },
  { href: '/explainer/balancing-market-practical', label: '需給調整市場の実務：応札から精算までのプロセス（解説）' },
  { href: '/glossary/aggregator', label: 'アグリゲーター（用語集）' },
  { href: '/glossary/adjustment-reserve', label: '調整力（用語集）' },
];

export default async function LvHubPage() {
  // Stage5: 低圧の最新ニュース（news分析P1）。build時に getIndustryNews（主題ゲート・除外済みの
  // 単一チョークポイント）から title「低圧」含む3件を抽出。全静的・runtime fetch 0（force-static）。
  // 失敗時は空＝枠ごと非表示（429縮退 #100）。
  let lvNews: { slug: string; title: string; publishedAt?: string }[] = [];
  try {
    lvNews = (await getIndustryNews())
      .filter((n) => (n.title || '').includes('低圧'))
      .slice(0, 3)
      .map((n) => ({ slug: n.slug, title: n.title, publishedAt: n.publishedAt }));
  } catch {
    lvNews = [];
  }

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

          {/* 投資家ガイド ハブへの入口（W1 Stage1・2026-07-20） */}
          <Link href="/lv/invest" style={{
            display: 'block', padding: 20, border: '1px solid var(--color-accent, #0066cc)',
            borderRadius: 8, textDecoration: 'none', color: 'inherit', background: 'var(--color-bg-card, #fff)',
            marginBottom: 32,
          }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px', lineHeight: 1.5 }}>投資家のための低圧蓄電所ガイド</h3>
            <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0, color: 'var(--color-muted)' }}>
              買う前の疑問から購入後・売却まで。個人投資家向けに、段階に合わせて中立の立場で整理します。
            </p>
            <div style={{ fontSize: 13, color: 'var(--color-accent)', marginTop: 8 }}>ガイドを見る →</div>
          </Link>

          {/* 解説シリーズ（Stage3: 6本完結） */}
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>解説シリーズ</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 8 }}>
            {GUIDES.map((g) => (
              <Link key={g.href} href={g.href} style={{
                display: 'block', padding: 20, border: '1px solid var(--color-border)',
                borderRadius: 8, textDecoration: 'none', color: 'inherit', background: 'white',
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-accent, #0066cc)', marginBottom: 4 }}>{g.num}</div>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 8px', lineHeight: 1.5 }}>{g.title}</h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0, color: 'var(--color-muted)' }}>{g.desc}</p>
                <div style={{ fontSize: 13, color: 'var(--color-accent)', marginTop: 8 }}>読む →</div>
              </Link>
            ))}
          </div>
          {/* Stage4: 関連用語4語＋FAQ導線（glossary/faq 投入済み・実在確認済み L-EIC-021） */}
          <div style={{ fontSize: 15, color: 'var(--color-muted)', marginBottom: 32, lineHeight: 1.9 }}>
            <p style={{ margin: '0 0 2px' }}>
              関連用語: <Link href="/glossary/low-voltage-bess">低圧蓄電所</Link>・<Link href="/glossary/low-voltage-resource-term">低圧リソース</Link>・<Link href="/glossary/device-level-metering">機器個別計測</Link>・<Link href="/glossary/bess-unit-sale">区画販売（分譲蓄電所）</Link>
            </p>
            <p style={{ margin: 0 }}>
              低圧蓄電所のFAQ（6問）は<Link href="/faq">よくある質問</Link>でご覧いただけます。
            </p>
          </div>

          {/* Stage5: 低圧の最新ニュース（0件時は枠ごと非表示） */}
          {lvNews.length > 0 && (
            <section style={{ padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 32 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
                低圧の最新ニュース <Link href="/news" style={{ fontSize: 15, fontWeight: 600, marginLeft: 8 }}>すべて見る →</Link>
              </h2>
              <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
                {lvNews.map((n) => (
                  <li key={n.slug}>
                    <Link href={`/news/${n.slug}`}>{n.title}</Link>
                    {n.publishedAt && (
                      <span style={{ fontSize: 13, color: 'var(--color-muted)', marginLeft: 8 }}>
                        {new Date(n.publishedAt).toLocaleDateString('ja-JP')}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* 関連する当サイトのコンテンツ（全て実在確認済み L-EIC-021） */}
          <section style={{ padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連する当サイトのコンテンツ</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
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
              <p style={{ fontSize: 15, marginTop: 0 }}>
                蓄電所全般の購入・導入は <Link href="/start/buy">蓄電所を買いたい・導入したい方へ</Link> もご覧ください。
              </p>
            </div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>事業として参入したい</h3>
              <LvContactCta variant="entry" />
              <p style={{ fontSize: 15, marginTop: 0 }}>
                業界全体のデータ・協業は <Link href="/start/partner">蓄電池ビジネスに関わりたい方へ</Link> もご覧ください。
              </p>
            </div>
          </div>

          <p style={{ fontSize: 15, color: 'var(--color-muted)', lineHeight: 1.7 }}>
            本ガイドは情報提供を目的とし、特定商品の勧誘・利回りの保証は行いません。
          </p>
          <p style={{ fontSize: 15, color: 'var(--color-muted)' }}>公開日: 2026-07-18</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
