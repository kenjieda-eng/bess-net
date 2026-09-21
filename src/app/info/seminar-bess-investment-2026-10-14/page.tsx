import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { TimeSwitch } from '@/components/TimeSwitch';
import { siteConfig } from '@/lib/site-config';
import { ENDS_AT, PPS_PAGE, PPS_URL, SEMINAR_SLUG as SLUG, STARTS_AT } from './seminar';

// 前例 /info/seminar-seetel-jc-star-2026-07-27 と同じ静的 1 枚ページ（An-1・2026-09-21）。
// 一次: https://pps-net.org/seminar/165196（2026-09-21 取得）。依頼の「案内ページ原稿」は依頼文に添付が無かったため、
//   本文は一次の記載の範囲だけで起こした（固有名詞・日時・料金・主催は一次と突合済み）。
// ★中立方針: 当サイト運営団体（EIC）の共催であることを冒頭で明示する。税務上の効果は断定しない
//   （「セミナーで扱うテーマ」として列挙するだけ。適用要件は主催者の注記を伝える）。
// ★申込は新電力ネット側で完結（蓄電所ネットは個人情報を持たない）。
export const dynamic = 'force-static';
// ★開催後の表示: TimeSwitch で閲覧時点に合わせて切り替えるが、それは JS 実行後の表示。
//   初期 DOM（#107・JS を実行しないクローラ）も開催後の状態に揃えるため ISR にする。
//   このページは microCMS を読まない（外部 API 0）ので、1 時間ごとの再生成でも上流の負荷は増えない。
//   前例は force-static のみで、募集終了は手作業のデプロイで反映していた（commit 2ba0f06）。
export const revalidate = 3600;

const TITLE = '経営者のための系統用蓄電池投資セミナー（2026/10/14・無料オンライン）';
const DESCRIPTION =
  '2026年10月14日（水）13:00〜14:00、Zoom で開催される無料セミナーのご案内。当サイト運営団体の一般社団法人エネルギー情報センター（新電力ネット運営事務局）とRAUL株式会社の主催。系統用蓄電池事業の市場環境・収益構造、100％即時償却を活用した設備投資、事業承継、自社株評価への活用可能性などを、公認会計士・税理士の平尾和也氏が解説。';

export const metadata: Metadata = {
  // layout の titleTemplate が「 | 蓄電所ネット」を付与するため手書きサフィックスは持たない（#88）
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: `/info/${SLUG}` },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: `https://bess-net.jp/info/${SLUG}`,
    images: ['https://bess-net.jp/og-image.png'],
  },
};

const THEMES = [
  '系統用蓄電池事業の市場環境と収益構造',
  '100％即時償却を活用した設備投資',
  '事業承継',
  '自社株評価への活用可能性',
];

export default function BessInvestmentSeminarPage() {
  // サーバの描画時点（ISR の再生成時点）。TimeSwitch の初回描画と JSON-LD の受付状態をこの時点で決める
  const renderedAt = Date.now();
  const endedAtRender = renderedAt >= Date.parse(ENDS_AT);
  /** 開催前 / 開催後で出し分ける（閲覧時点で選び直す） */
  const sw = (before: ReactNode, after: ReactNode) => (
    <TimeSwitch renderedAt={renderedAt} switchAt={ENDS_AT} before={before} after={after} />
  );

  const overviewRows: [string, ReactNode][] = [
    ['セミナー名', '経営者のための系統用蓄電池投資セミナー　100％即時償却・高収益・事業承継をどう活用するか'],
    ['日時', '2026年10月14日（水）13:00〜14:00'],
    [
      '形式',
      sw('オンライン（Zoom）。視聴方法は、お申し込み後にメールで案内されます。', 'オンライン（Zoom）'),
    ],
    ['料金', '無料'],
    ['主催', '一般社団法人エネルギー情報センター 新電力ネット運営事務局、RAUL株式会社'],
    ['講師', '平尾和也 氏（公認会計士・税理士／RAULエグゼクティブアドバイザー）'],
    [
      '申込',
      sw(
        '新電力ネットのセミナーページで受付（申込締切・定員の記載なし。2026年9月21日確認）',
        '受付は終了しました（2026年10月14日開催）',
      ),
    ],
  ];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: '経営者のための系統用蓄電池投資セミナー',
    startDate: STARTS_AT,
    endDate: ENDS_AT,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
    location: { '@type': 'VirtualLocation', url: PPS_PAGE },
    organizer: [
      {
        '@type': 'Organization',
        name: '一般社団法人エネルギー情報センター 新電力ネット運営事務局',
        url: siteConfig.organization.url,
      },
      { '@type': 'Organization', name: 'RAUL株式会社' },
    ],
    performer: { '@type': 'Person', name: '平尾和也' },
    isAccessibleForFree: true,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
      // 前例（募集終了後）と同じく utm 付き申込 URL は置かない。受付状態は描画時点で導出
      url: PPS_PAGE,
      availability: endedAtRender ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    },
    description:
      '経営者・事業オーナー向けのオンラインセミナー。系統用蓄電池事業の市場環境・収益構造、100％即時償却を活用した設備投資（適用には一定の要件があると主催者が注記）、事業承継、自社株評価への活用可能性などを扱う。',
    inLanguage: 'ja-JP',
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <article className="section-inner article-detail" style={{ maxWidth: 860 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/info">お知らせ</Link> / セミナー案内
          </p>
          <span className="article-category">セミナー</span>
          <h1
            className="article-title"
            style={{ fontSize: '1.45rem', lineHeight: 1.5, marginTop: 12 }}
          >
            【10/14(水) 無料オンライン】
            <br />
            経営者のための系統用蓄電池投資セミナー
          </h1>
          <p className="article-meta">2026年9月21日掲載</p>

          {/* 中立方針: 運営者の告知であることを冒頭で明示する */}
          <div
            style={{
              margin: '16px 0 20px',
              padding: '12px 16px',
              background: '#f8fafc',
              border: '1px solid var(--color-border)',
              borderLeft: '4px solid #0F2D4F',
              borderRadius: 6,
              fontSize: 15,
              lineHeight: 1.8,
            }}
          >
            本セミナーは、<strong>当サイト（蓄電所ネット）の運営団体である一般社団法人エネルギー情報センターが共催</strong>
            するものです（主催: 一般社団法人エネルギー情報センター 新電力ネット運営事務局、RAUL株式会社）。本ページは運営者による告知です。
          </div>

          {sw(
            null,
            <div
              style={{
                margin: '0 0 24px',
                padding: '14px 18px',
                background: '#fef2f2',
                border: '2px solid #b91c1c',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                color: '#b91c1c',
                lineHeight: 1.7,
              }}
            >
              本セミナーの開催は終了しました（2026年10月14日開催）。
            </div>,
          )}

          <div className="article-body">
            <p>
              経営者・事業オーナーの方を対象に、系統用蓄電池事業の市場環境や収益構造、税制や事業承継との関わりを、公認会計士・税理士の
              <strong>平尾和也 氏</strong>
              が解説するオンラインセミナーです（Zoom・1時間・無料）。主催者は、系統用蓄電池への新規参入や設備投資を検討している経営者・法人の方に向けた内容と案内しています。
            </p>

            <h2>開催概要</h2>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 15,
                lineHeight: 1.8,
              }}
            >
              <tbody>
                {overviewRows.map(([label, value]) => (
                  <tr key={label} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <th
                      style={{
                        padding: '8px 12px 8px 0',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        verticalAlign: 'top',
                        width: 72,
                        color: 'var(--color-muted)',
                        textAlign: 'left',
                      }}
                    >
                      {label}
                    </th>
                    <td style={{ padding: '8px 0' }}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h2>セミナーで扱うテーマ（主催者の案内より）</h2>
            <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              {THEMES.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
            <p style={{ fontSize: 15, color: 'var(--color-muted)', lineHeight: 1.8 }}>
              ※ 主催者の案内では、100％即時償却の適用には特定生産性向上設備等投資促進税制に基づく一定の要件を満たす必要があるとされています。また、本セミナーは情報提供を目的としたもので、特定の投資成果や収益性を保証するものではないとされています。
              <br />
              ※ 蓄電所ネットは、税制の適用の可否や税務上の効果について判断・保証するものではありません。個別の適用は税理士等の専門家にご確認ください。
            </p>

            <h2>講師</h2>
            <p>
              <strong>平尾和也 氏</strong>（公認会計士・税理士／RAULエグゼクティブアドバイザー／株式会社デシアシ代表取締役）
              <br />
              大手会計系コンサルティング会社で M&amp;A・企業価値評価・会計・税務コンサルティングに従事したのち、事業会社の上場対応を経験。現在は事業承継や企業価値向上などの支援に携わっています（主催者の講師紹介より要約）。
            </p>
          </div>

          {sw(
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
                お申し込みは新電力ネットのセミナーページで受け付けています
              </p>
              <a
                href={PPS_URL}
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
                申し込みページへ（新電力ネット）→
              </a>
            </div>,
            <div
              style={{
                margin: '32px 0',
                padding: 24,
                background: '#f8fafc',
                border: '2px solid #6b7280',
                borderRadius: 8,
                textAlign: 'center',
              }}
            >
              <p style={{ fontSize: 15, fontWeight: 700, margin: 0, color: '#374151' }}>
                開催は終了しました
              </p>
            </div>,
          )}

          <p
            style={{
              fontSize: 15,
              color: 'var(--color-muted)',
              lineHeight: 1.7,
              marginBottom: 24,
            }}
          >
            {sw(
              '※ 本ページは案内です。お申し込みの受付は、主催者が新電力ネットのセミナーページで行います。蓄電所ネット（本サイト）ではお申し込みの受付・個人情報の取得を行いません。',
              '※ 本ページは開催案内の記録です。お申し込みの受付は、主催者が新電力ネットのセミナーページで行いました。蓄電所ネット（本サイト）ではお申し込みの受付・個人情報の取得を行っていません。',
            )}
          </p>

          <section
            style={{
              margin: '8px 0 32px',
              padding: 20,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              関連する蓄電所ネットのページ
            </h2>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li>
                <Link href="/tools/irr-simulator">
                  蓄電池IRRシミュレーター（収益を単純加算する簡易モデルでの概算）
                </Link>
              </li>
              <li>
                <Link href="/explainer/bess-business-decision-tree">
                  解説: 系統用蓄電池ビジネス参入の決定木 ── 開発・運用・投資のどれを担うか
                </Link>
              </li>
              <li>
                <Link href="/projects">蓄電所プロジェクトデータベース（国内の事例）</Link>
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
