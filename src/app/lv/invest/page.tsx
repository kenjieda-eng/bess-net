/**
 * /lv/invest — 投資家のための低圧蓄電所ガイド ハブ（低圧投資家ガイド W1 Stage1・2026-07-20）
 * 全静的（force-static）・runtime microCMS 0・#107初期DOM・#88 titleは layout が「 | 蓄電所ネット」自動付与。
 * 記事本体（A群〜）は W2 以降に /lv/invest/[slug] 配下で順次追加。当面のリンクは実在ページのみ。
 * CTA は funnel_lv_invest（新設・既存 funnel_lv_buy/entry は不変）。禁止語（編集ガイドライン §1-A）不使用。
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import LvInvestTrustBlock from '@/components/LvInvestTrustBlock';
import { siteConfig } from '@/lib/site-config';
import { LV_INVEST_ARTICLES } from '@/lib/lv-invest';

export const dynamic = 'force-static';

const CONTACT_URL =
  'https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=funnel_lv_invest';

export const metadata: Metadata = {
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88 二重回避）
  title: '投資家のための低圧蓄電所ガイド（低圧系統用蓄電池の購入・投資）',
  description:
    '低圧系統用蓄電池（低圧蓄電所）への投資を検討する方向けの中立ガイド。買う前の疑問・営業資料の読み方から、購入後の運用、将来の売却まで。無料相談・登録不要の資料も。',
  alternates: { canonical: '/lv/invest' },
  openGraph: {
    title: '投資家のための低圧蓄電所ガイド（低圧系統用蓄電池の購入・投資）',
    description:
      '低圧系統用蓄電池（低圧蓄電所）への投資を検討する方向けの中立ガイド。買う前の疑問から購入後の運用、将来の売却まで。',
    type: 'website',
    url: 'https://bess-net.jp/lv/invest',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

// 入口5分岐（記事は W2 以降に追加。当面のリンクは実在ページのみ・日付表記なし）
const ENTRIES = [
  {
    num: '①',
    title: 'まず知りたい',
    desc: '仕組みと、何に投資するのかの全体像から。',
    // W2: 投入記事を主リンクに（LV_INVEST_ARTICLES で管理・週次追記）。既存リンクは「関連する解説」へ。
    guideArticles: true,
    links: [
      { href: '/lv/what-is', label: '低圧蓄電所とは' },
      { href: '/lv/revenue-model', label: '収益モデル' },
      { href: '/faq', label: 'よくある質問' },
    ],
  },
  {
    num: '②',
    title: '買うか迷っている',
    desc: '利回り・回収・リスクをどう考えるか。',
    links: [
      { href: '/lv/risks', label: 'リスクと注意点' },
      { href: '/tools/irr-simulator', label: 'IRRシミュレーター' },
    ],
  },
  {
    num: '③',
    title: '営業資料を受け取った',
    desc: '提案書の読み方と、確認すべきこと。',
    links: [{ href: '/lv/buying-guide', label: '購入・投資ガイド（チェックリスト8項目）' }],
  },
  {
    num: '④',
    title: 'すでに購入した',
    desc: '運用レポートの見方から、将来の売却まで。このセクションの記事は順次公開します。',
    links: [{ href: '/faq', label: 'よくある質問' }],
  },
  {
    num: '⑤',
    title: '無料で相談したい',
    desc: 'できること・できないことを先に明示します。',
    links: [{ href: '#invest-trust', label: '相談前にお読みください' }],
  },
] as const;

export default function LvInvestHubPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '低圧蓄電所', item: 'https://bess-net.jp/lv' },
      { '@type': 'ListItem', position: 3, name: '投資家のための低圧蓄電所ガイド', item: 'https://bess-net.jp/lv/invest' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 960 }}>
          <p className="article-breadcrumb">
            <Link href="/">ホーム</Link> / <Link href="/lv">低圧蓄電所</Link> / 投資家のためのガイド
          </p>
          <div className="section-label">LV INVEST — 投資家のための低圧蓄電所ガイド</div>
          <h1 className="section-title">投資家のための低圧蓄電所ガイド</h1>
          <p style={{ fontSize: 16, color: 'var(--color-muted)', marginTop: 4, marginBottom: 20, lineHeight: 1.7 }}>
            低圧系統用蓄電池を検討する方へ — 買う前の疑問から、購入後の運用、将来の売却まで
          </p>
          <p style={{ fontSize: 16, lineHeight: 1.9, marginBottom: 32 }}>
            低圧蓄電所（低圧系統用蓄電池）への投資は、2,000万円前後の大きな判断です。このガイドは、販売資料では分かりにくい部分を中立の立場で整理するためのものです。まだ購入を決めていない段階でも大丈夫です。買わないという判断も含めて、考えるための材料を提供します。
          </p>

          {/* 入口5分岐 */}
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>あなたの段階に合わせて</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 32 }}>
            {ENTRIES.map((e) => (
              <div
                key={e.num}
                style={{
                  padding: 20,
                  border: '1px solid var(--color-border)',
                  borderRadius: 8,
                  background: 'var(--color-bg-card, #fff)',
                }}
              >
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>
                  <span style={{ color: 'var(--color-accent, #0066cc)', marginRight: 6 }}>{e.num}</span>
                  {e.title}
                </h3>
                <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 10px', color: 'var(--color-muted)' }}>{e.desc}</p>
                {'guideArticles' in e && e.guideArticles ? (
                  <>
                    <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 18, margin: 0 }}>
                      {LV_INVEST_ARTICLES.map((a) => (
                        <li key={a.slug}>
                          <Link href={`/lv/invest/${a.slug}`}>{a.hubLabel}</Link>
                        </li>
                      ))}
                    </ul>
                    <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '10px 0 4px', fontWeight: 600 }}>関連する解説</p>
                    <ul style={{ fontSize: 14, lineHeight: 1.9, paddingLeft: 18, margin: 0 }}>
                      {e.links.map((l) => (
                        <li key={l.href}>
                          <Link href={l.href}>{l.label}</Link>
                        </li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 18, margin: 0 }}>
                    {e.links.map((l) => (
                      <li key={l.href}>
                        <Link href={l.href}>{l.label}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>

          {/* CTA（低圧CTA同型・funnel_lv_invest 新設） */}
          <div
            style={{
              margin: '0 0 32px',
              padding: 24,
              background: '#f8fafc',
              border: '2px solid #0F2D4F',
              borderRadius: 8,
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, marginTop: 0, color: '#0F2D4F' }}>
              検討段階のご相談を、中立の立場で無料でお受けしています
            </p>
            <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 0, marginBottom: 16, lineHeight: 1.7 }}>
              「この前提は妥当か」「この資料はどう読むべきか」といった段階からで大丈夫です。
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
              無料で相談する（何かを買う必要はありません） →
            </a>
          </div>

          {/* 登録不要のDL資料（W2 Stage3・GA4 file_download で自動計測想定・download属性なし通常アンカー） */}
          <section style={{ margin: '0 0 32px', padding: 20, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 8 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>登録不要の資料</h2>
            <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12 }}>
              登録・メールアドレス不要でそのまま開けます。
            </p>
            <ul style={{ fontSize: 15, lineHeight: 2.0, paddingLeft: 18, margin: 0 }}>
              <li>
                <a href="/dl/questions-15-v1.pdf" target="_blank" rel="noopener noreferrer">
                  販売会社に聞く15の質問シート（PDF）
                </a>
              </li>
              <li>
                <a href="/dl/anken-hikaku-v1.pdf" target="_blank" rel="noopener noreferrer">
                  低圧蓄電所 案件比較表（PDF）
                </a>
              </li>
            </ul>
          </section>

          <LvInvestTrustBlock />

          <p style={{ fontSize: 15, marginTop: 24 }}>
            低圧蓄電所の制度・仕組みの解説は{' '}
            <Link href="/lv">低圧蓄電所 総合ガイド</Link> へ。
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 8 }}>
            運営: {siteConfig.organization.name}（EIC）
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
