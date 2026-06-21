// /grid/tokyo — 東京電力PG 系統空き容量情報の公開状況解説
// - 東京PG は 2026/02/02 〜 2026/06/01 公開停止、2026/06/02 に公開再開
// - 蓄電所ネットはデータ取り込み準備中（本ページで進捗更新）
// - 落とし穴 #57: 静的セグメント `tokyo/` は同階層の `[slug]/` より優先される
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    '東京電力PG 系統空き容量情報の公開状況｜系統空き容量データベース - 蓄電所ネット',
  description:
    '東京電力パワーグリッド管内の系統空き容量・予想潮流情報は2026年6月2日に公開を再開。蓄電所ネットはデータ取り込み準備中。停止期間（2026年2月〜6月1日）の経緯と代替アクセス方法を整理。',
  alternates: { canonical: '/grid/tokyo' },
  openGraph: {
    title: '東京電力PG 系統情報の公開状況｜系統空き容量データベース',
    description:
      '東京エリア：2026年6月2日に公開再開。蓄電所ネット取り込み準備中・9送配電事業者の公開状況比較',
    type: 'article',
    images: ['/og-image.png'],
  },
};

export default function TokyoStatusPage() {
  // BreadcrumbList JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'トップ',
        item: 'https://bess-net.jp/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: '系統空き容量',
        item: 'https://bess-net.jp/grid',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: '東京電力PG',
        item: 'https://bess-net.jp/grid/tokyo',
      },
    ],
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '東京電力PG 系統空き容量情報の公開状況',
    description:
      '東京電力パワーグリッド管内の系統空き容量・予想潮流情報の公開停止（2026/2〜6/1）と2026年6月2日の公開再開。蓄電所ネットはデータ取り込み準備中。',
    datePublished: '2026-05-08',
    dateModified: '2026-06-21',
    author: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': 'https://bess-net.jp/grid/tokyo',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/grid">系統空き容量</Link> / 東京電力PG
          </p>

          <h1 className="page-title">
            東京電力パワーグリッド 系統空き容量情報の公開状況
          </h1>
          <p className="page-lead">
            東京電力PG 管内の予想潮流・空容量等に関する情報は、2026年2月2日よりデータメンテナンスのため公開を一時停止していましたが、
            <strong>2026年6月2日に公開を再開しました</strong>（
            <a href="https://www.tepco.co.jp/pg/consignment/system/" target="_blank" rel="noopener noreferrer">TEPCO公式</a>
            ）。蓄電所ネットは現在データ取り込み準備中です。
          </p>

          {/* 公開停止・再開の経緯 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">公開停止・再開の経緯</h2>
            <dl className="grid-info-table">
              <dt>停止対象</dt>
              <dd>
                系統の空き容量等に関する情報、需要・送配電に関する情報の系統構成・予想潮流
              </dd>
              <dt>停止開始</dt>
              <dd>2026年2月2日</dd>
              <dt>当初再開予定</dt>
              <dd>2026年4月中</dd>
              <dt>延期後の再開予定</dt>
              <dd>2026年5月中（2026年4月30日に延期発表）</dd>
              <dt>実際の公開再開日</dt>
              <dd><strong>2026年6月2日</strong></dd>
              <dt>停止理由</dt>
              <dd>データメンテナンス</dd>
              <dt>公式アナウンス</dt>
              <dd>
                <a
                  href="https://www.tepco.co.jp/pg/consignment/system/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid-source-link"
                >
                  東京電力PG 系統情報ページ（TEPCO公式）
                </a>
              </dd>
              <dt>蓄電所ネットの対応状況</dt>
              <dd>データ取り込み準備中（完了後 /grid/tokyo にデータを追加予定）</dd>
            </dl>
          </section>

          {/* 代替アクセス方法 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">事前相談窓口（公式案内）</h2>
            <p>
              公開再開後も、個別の連系検討には以下の事前相談窓口をご活用ください（東京電力PG 公式案内）：
            </p>
            <ul className="grid-list">
              <li className="grid-list-row">
                <span className="grid-list-label">
                  ネットワークサービスセンター
                </span>
                <span className="grid-list-value">
                  <a
                    href="https://www.tepco.co.jp/pg/consignment/retailservice2/wsc/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid-source-link"
                  >
                    公式お問い合わせページ
                  </a>
                </span>
              </li>
              <li className="grid-list-row">
                <span className="grid-list-label">
                  電源接続案件一括検討プロセス
                </span>
                <span className="grid-list-value">
                  <a
                    href="https://www.tepco.co.jp/pg/consignment/system/process.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid-source-link"
                  >
                    案内ページ
                  </a>
                </span>
              </li>
              <li className="grid-list-row">
                <span className="grid-list-label">募集プロセス</span>
                <span className="grid-list-value">
                  <a
                    href="https://www.tepco.co.jp/pg/consignment/system/recruitment.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid-source-link"
                  >
                    案内ページ
                  </a>
                </span>
              </li>
            </ul>
          </section>

          {/* 現在も公開中の関連情報 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">現在も公開中の関連情報</h2>
            <p>
              空容量・予想潮流以外の以下の情報は、東京PG で現在も公開されています。
            </p>
            <ul className="grid-list">
              <li className="grid-list-row">
                <span className="grid-list-label">2024年度 実績系統図</span>
                <span className="grid-list-value">
                  基幹275kV以上、154kV、66kV を13都県別に公開
                </span>
              </li>
              <li className="grid-list-row">
                <span className="grid-list-label">送変電設備の投資・廃止計画</span>
                <span className="grid-list-value">
                  500/275kV、154kV、66kV
                </span>
              </li>
              <li className="grid-list-row">
                <span className="grid-list-label">系統混雑情報</span>
                <span className="grid-list-value">
                  発電等設備の受付状況、出力制御見通し
                </span>
              </li>
              <li className="grid-list-row">
                <span className="grid-list-label">作業停止計画</span>
                <span className="grid-list-value">2024〜2026年度</span>
              </li>
            </ul>
            <p className="grid-source-note">
              詳細は{' '}
              <a
                href="https://www.tepco.co.jp/pg/consignment/system/"
                target="_blank"
                rel="noopener noreferrer"
              >
                東京電力PG 系統情報ページ
              </a>
              {' '}をご参照ください。
            </p>
          </section>

          {/* 他社の公開状況 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">他送配電事業者の公開状況</h2>
            <p>
              蓄電所ネットが収録している送配電事業者の公開状況です。9社合計で約 6,500件超を一元化しており、東京電力PG
              の公開再開後、10社目として追加収録予定です。
            </p>
            <div className="grid-table-wrap">
              <table className="grid-table">
                <thead>
                  <tr>
                    <th>事業者</th>
                    <th className="num">件数</th>
                    <th>形式</th>
                    <th>緯度経度</th>
                    <th>地図</th>
                    <th>詳細</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>北海道電力ネットワーク</td>
                    <td className="num">424</td>
                    <td>PDF</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <Link href="/grid/hokkaido">/grid/hokkaido</Link>
                    </td>
                  </tr>
                  <tr>
                    <td>東北電力ネットワーク</td>
                    <td className="num">884</td>
                    <td>CSV</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <Link href="/grid/tohoku">/grid/tohoku</Link>
                    </td>
                  </tr>
                  <tr style={{ background: '#fffbe6' }}>
                    <td>
                      <strong>東京電力PG</strong>
                    </td>
                    <td colSpan={5}>
                      <strong>📋 2026年6月2日に公開再開。蓄電所ネットはデータ取り込み準備中</strong>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      中部電力PG <span className="grid-badge grid-badge-ok">★</span>
                    </td>
                    <td className="num">1,107</td>
                    <td>CSV+GeoJSON</td>
                    <td>1,081 (97.7%)</td>
                    <td>
                      ✅ <Link href="/grid/chubu/map">マップ</Link>
                    </td>
                    <td>
                      <Link href="/grid/chubu">/grid/chubu</Link>
                    </td>
                  </tr>
                  <tr>
                    <td>北陸電力送配電</td>
                    <td className="num">271</td>
                    <td>CSV</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <Link href="/grid/hokuriku">/grid/hokuriku</Link>
                    </td>
                  </tr>
                  <tr>
                    <td>関西電力送配電</td>
                    <td className="num">1,624</td>
                    <td>CSV</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <Link href="/grid/kansai">/grid/kansai</Link>
                    </td>
                  </tr>
                  <tr>
                    <td>中国電力ネットワーク</td>
                    <td className="num">873</td>
                    <td>CSV</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <Link href="/grid/chugoku">/grid/chugoku</Link>
                    </td>
                  </tr>
                  <tr>
                    <td>四国電力送配電</td>
                    <td className="num">294</td>
                    <td>CSV</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <Link href="/grid/shikoku">/grid/shikoku</Link>
                    </td>
                  </tr>
                  <tr>
                    <td>九州電力送配電</td>
                    <td className="num">879</td>
                    <td>CSV ZIP</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <Link href="/grid/kyushu">/grid/kyushu</Link>
                    </td>
                  </tr>
                  <tr>
                    <td>沖縄電力</td>
                    <td className="num">151</td>
                    <td>CSV</td>
                    <td>—</td>
                    <td>—</td>
                    <td>
                      <Link href="/grid/okinawa">/grid/okinawa</Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="grid-source-note">
              ※ 件数は変電所単位（変圧器バンクを含む）。中部電力PG
              は緯度経度付きデータを業界唯一の地図表示として可視化しています。
            </p>
          </section>

          {/* 蓄電所ネットの対応状況 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">蓄電所ネットの対応状況（取り込み準備中）</h2>
            <p>
              東京電力PG が2026年6月2日に公開を再開したため、蓄電所ネットは現在データ取り込み作業を進めています。中部電力PG
              と同様の手順で：
            </p>
            <ol className="grid-prose">
              <li>提供されたデータ形式（PDF/CSV/JSON/GeoJSON）の解析</li>
              <li>変電所単位の構造化データ化</li>
              <li>microCMS 投入（推定 1,500〜2,500件）</li>
              <li>
                緯度経度が含まれる場合は <code>/grid/tokyo/map</code>{' '}
                （仮）として地図ページも実装
              </li>
            </ol>
            <p>
              取り込み完了後は、本ページおよび
              <Link href="/news">業界ニュース</Link>
              でお知らせします。
            </p>
          </section>

          {/* 出典 */}
          <section className="grid-section grid-source-section">
            <h2 className="grid-section-h2">出典・データ提供元</h2>
            <p>
              本ページは{' '}
              <a
                href="https://www.tepco.co.jp/pg/consignment/system/"
                target="_blank"
                rel="noopener noreferrer"
                className="grid-source-link"
              >
                東京電力パワーグリッド「当社における系統情報について」
              </a>
              {' '}の公開情報をもとに蓄電所ネット編集部が整理したものです（最終更新：2026年6月21日）。
              最新情報は公式ページでご確認ください。
            </p>
          </section>

          <p className="back-link">
            <Link href="/grid">← 系統空き容量データベースへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
