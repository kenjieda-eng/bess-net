/**
 * /info/operating-bess-introduction — 稼働中蓄電所ご紹介の常設PR 1枚ページ
 * （2026-07-11 EDAさん発案・11ペルソナ議論済みコピーをそのまま使用）
 *
 * 設計:
 *  - SEETEL 紹介ページと同族の info 型・静的ページ（SSG・runtime 外部API 0）
 *  - 実績数値の焼き込みなし（誇張なし方針・レビュー済みコピー固定）
 *  - CTA は EIC お問い合わせフォームへ UTM 付き外部リンク（変更0で 200 確認済み）
 */
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

const SLUG = 'operating-bess-introduction';
const CONTACT_URL =
  'https://eic-jp.org/contact?utm_source=bess-net&utm_medium=referral&utm_campaign=operating_bess_intro';

const LEAD =
  '稼働中の系統用蓄電池（蓄電所）の取得をご検討の事業者・投資家の方へ、当サイト運営元の EIC が案件のご紹介を承ります。売却・譲渡をご検討のオーナー様からのご相談も受け付けています。';

export const metadata: Metadata = {
  // layout の titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '稼働中の系統用蓄電池（蓄電所）のご紹介',
  description: LEAD,
  alternates: { canonical: `/info/${SLUG}` },
  openGraph: {
    title: '稼働中の系統用蓄電池（蓄電所）のご紹介',
    description: LEAD,
    type: 'website',
    url: `https://bess-net.jp/info/${SLUG}`,
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function OperatingBessIntroductionPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail" style={{ maxWidth: 860 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/info">お知らせ</Link> /
            稼働中蓄電所のご紹介
          </p>
          <span className="article-category">ご案内</span>
          <h1
            className="article-title"
            style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}
          >
            稼働中の系統用蓄電池（蓄電所）のご紹介
          </h1>

          <div className="article-body">
            <p>{LEAD}</p>

            <h2>こんな方へ</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>稼働中（運転開始済み）の蓄電所の取得・投資を検討している</li>
              <li>開発段階のリスクを避け、運転実績のある案件から参入したい</li>
              <li>保有する蓄電所の売却・譲渡先を探している</li>
            </ul>

            <h2>ご紹介の流れ</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <strong>お問い合わせ</strong> — 下記フォームからご連絡ください
              </li>
              <li>
                <strong>ヒアリング</strong> — ご希望条件（エリア・規模・時期など）を伺います
              </li>
              <li>
                <strong>ご紹介</strong> — 条件に合う案件・お相手をご紹介します
              </li>
            </ol>

            <h2>運営元について</h2>
            <p>
              本サービスは、蓄電所ネットの運営元である{siteConfig.organization.name}（EIC）が承ります。
              ※案件の状況により、ご希望に沿うご紹介ができない場合があります。
            </p>
          </div>

          {/* CTA（主ボタン1つ・EIC フォームへ UTM 付き誘導） */}
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
            <p
              style={{
                fontSize: 15,
                fontWeight: 700,
                marginBottom: 16,
                marginTop: 0,
                color: '#0F2D4F',
              }}
            >
              ご相談・ご質問は EIC お問い合わせフォームから
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

          {/* 関連リンク */}
          <section
            style={{
              padding: 16,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
              fontSize: 14,
            }}
          >
            <h2 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
              関連リンク
            </h2>
            <ul style={{ lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li>
                <Link href="/anken">流通案件一覧</Link> — 蓄電所ネット掲載の売買・開発案件情報
              </li>
              <li>
                <Link href="/tools/grid-connection-check">系統連系診断</Link> —
                希望地点・出力から連系候補変電所を即時抽出
              </li>
              <li>
                <Link href="/tools/irr-simulator">蓄電池IRRシミュレーター</Link> —
                取得検討時の事業性を無料試算
              </li>
            </ul>
          </section>

          <p className="back-link">
            <Link href="/info">← お知らせ一覧へ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
