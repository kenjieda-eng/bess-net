import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

const SLUG = 'seminar-seetel-jc-star-2026-07-27';
const PPS_URL =
  'https://pps-net.org/seminar/161088?utm_source=bess-net&utm_medium=referral&utm_campaign=seminar_seetel_20260727';

export const metadata: Metadata = {
  title: '台湾SEETEL × JC-STAR｜日本の系統用蓄電池セミナー(2026/7/27)｜蓄電所ネット',
  description:
    '2026年7月27日開催。台湾SEETEL（JC-STAR★1取得）登壇の無料セミナー。JC-STAR対応・系統用蓄電池2030政策動向・台湾VPP事例・日台スマートグリッドフォーラム。東京・神保町、定員140名（抽選）。',
  alternates: { canonical: `/info/${SLUG}` },
  openGraph: {
    title: '台湾SEETEL × JC-STAR｜日本の系統用蓄電池セミナー(2026/7/27)',
    description:
      '2026年7月27日（月）16:00〜20:00、東京・神保町。JC-STAR★1取得の台湾SEETELが登壇。系統用蓄電池の2030政策・VPP・日台スマートグリッドフォーラム。無料・定員140名（抽選）。',
    type: 'website',
    url: `https://bess-net.jp/info/${SLUG}`,
    images: ['https://bess-net.jp/og-image.png'],
  },
};

const OVERVIEW_ROWS: [string, string][] = [
  ['日時', '2026年7月27日（月）16:00〜20:00（懇親会 18:00〜20:00）'],
  ['会場', 'TKPガーデンシティPREMIUM神保町（東京都千代田区神田錦町3-22）'],
  ['料金', '無料（1社2名まで、事業会社・自治体・エネルギー関連企業対象）'],
  ['定員', '140名（抽選）'],
  ['主催', 'SEETEL Group'],
  ['協力', '一般社団法人エネルギー情報センター 新電力ネット運営事務局・RAUL株式会社'],
  ['司会', '江田健二 氏（RAUL 代表・エネルギー情報センター理事）'],
];

export default function SeetelSeminarPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: '台湾SEETEL × JC-STAR ― 日本の系統用蓄電池市場へ',
    startDate: '2026-07-27T16:00:00+09:00',
    endDate: '2026-07-27T20:00:00+09:00',
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: 'TKPガーデンシティPREMIUM神保町',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '神田錦町3-22',
        addressLocality: '千代田区',
        addressRegion: '東京都',
        addressCountry: 'JP',
      },
    },
    organizer: { '@type': 'Organization', name: 'SEETEL Group' },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'JPY',
      availability: 'https://schema.org/LimitedAvailability',
      url: PPS_URL,
    },
    description:
      'JC-STAR★1取得の台湾SEETELが登壇。系統用蓄電池の2030政策動向・台湾VPP事例・日台スマートグリッドフォーラム。蓄電池事業者・アグリゲーター・EPC・電力会社・投資家向け。',
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
            【7/27(月) 無料セミナー】台湾SEETEL × JC-STAR
            <br />― 日本の系統用蓄電池市場へ
          </h1>
          <p className="article-meta">2026年6月20日掲載</p>

          <div className="article-body">
            <p>
              2027年4月以降、蓄電池の機器選定で重要となる <strong>JC-STAR★1</strong>。台湾企業として初めて BMS＋蓄電池モジュールと EMS の両方で JC-STAR★1 を取得した{' '}
              <strong>SEETEL Group</strong> を迎え、日本市場戦略と最先端の蓄電池・EMS 技術、2030年に向けた系統用蓄電池の政策動向、台湾で先行するVPP事例、日台の有識者フォーラムを通じて次世代電力システムを展望します。蓄電池事業者・アグリゲーター・EPC・電力会社・投資家の皆さま向けのセミナーです。
            </p>

            <h2>開催概要</h2>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 14,
                lineHeight: 1.8,
              }}
            >
              <tbody>
                {OVERVIEW_ROWS.map(([label, value]) => (
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

            <h2>主なプログラム</h2>
            <ol style={{ paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <strong>日本の系統用蓄電池制度設計から読み解く2030政策動向と事業機会</strong>
                <br />
                <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  村谷 敬 氏（AnPrenergy）
                </span>
              </li>
              <li style={{ marginTop: 12 }}>
                <strong>
                  台湾企業初 JC-STAR 取得 SEETEL の日本市場戦略・次世代蓄電池/EMSソリューション
                </strong>
                <br />
                <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  松島可奈恵 氏・Ray Wen 氏・Jeff Chang 氏（SEETEL Group）
                </span>
              </li>
              <li style={{ marginTop: 12 }}>
                <strong>特別講演：台湾VPPの現状と展望</strong>
                <br />
                <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  胡 誌麟 教授（台湾中央大学）
                </span>
              </li>
              <li style={{ marginTop: 12 }}>
                <strong>
                  パネルディスカッション「日台スマートグリッド未来フォーラム ― Utility 3.0」
                </strong>
                <br />
                <span style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                  石井英雄 氏（早稲田大学）・岡本浩 氏（東京電力HD 上席フェロー）・胡誌麟 教授
                  ／ファシリテーター：松島可奈恵 氏
                </span>
              </li>
              <li style={{ marginTop: 12 }}>
                <strong>懇親会</strong>（18:00〜20:00）
              </li>
            </ol>

            <h2>JC-STAR とは</h2>
            <p>
              蓄電池等のサイバーセキュリティ適合ラベル制度（経済産業省）。2027年4月以降、機器選定・取引条件の重要な判断基準となる見込みです。SEETEL Group は台湾企業として初めて BMS＋蓄電池モジュールと EMS の両方で JC-STAR★1 を取得しました。
            </p>
          </div>

          {/* CTA */}
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
              お申し込み・最新情報は新電力ネットの特設ページへ
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
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              申し込みページへ（新電力ネット）→
            </a>
          </div>

          <p
            style={{
              fontSize: 12,
              color: 'var(--color-muted)',
              lineHeight: 1.7,
              marginBottom: 24,
            }}
          >
            ※ 本ページは案内です。お申し込み受付は主催 SEETEL Group ／協力 新電力ネット（エネルギー情報センター）の特設ページで行われます。bess-net ではお申し込み受付・個人情報の取得を行いません。
          </p>

          <p className="back-link">
            <Link href="/info">← お知らせ一覧へ戻る</Link>
          </p>
        </article>
      </main>
      <SiteFooter />
    </>
  );
}
