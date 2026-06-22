// /grid/tokyo/status — 東京電力PG 系統情報の公開停止・再開の経緯（記録）
// - 旧 /grid/tokyo（公開状況解説）の内容をここへ移設（Phase 2c でデータページ化）。
// - 404を作らないため、経緯はサブページとして保持（L-EIC-019）。
import type { Metadata } from 'next';
import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const revalidate = 3600;

export const metadata: Metadata = {
  title:
    '東京電力PG 系統情報の公開停止・再開の経緯｜系統空き容量データベース - 蓄電所ネット',
  description:
    '東京電力パワーグリッド管内の系統空き容量・予想潮流情報は2026年2月2日に公開停止、2026年6月2日に公開再開。蓄電所ネットは2026年6月に10社目として収録（1,718件）。停止〜再開の経緯と事前相談窓口を整理。',
  alternates: { canonical: '/grid/tokyo/status' },
  openGraph: {
    title: '東京電力PG 系統情報の公開停止・再開の経緯｜系統空き容量データベース',
    description:
      '東京エリア：2026年2月停止→6月2日再開。蓄電所ネットは10社目として収録（1,718件）。',
    type: 'article',
    images: ['/og-image.png'],
  },
};

export default function TokyoStatusPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '系統空き容量', item: 'https://bess-net.jp/grid' },
      { '@type': 'ListItem', position: 3, name: '東京エリア', item: 'https://bess-net.jp/grid/tokyo' },
      { '@type': 'ListItem', position: 4, name: '公開停止・再開の経緯', item: 'https://bess-net.jp/grid/tokyo/status' },
    ],
  };

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '東京電力PG 系統空き容量情報の公開停止・再開の経緯',
    description:
      '東京電力パワーグリッド管内の系統空き容量・予想潮流情報の公開停止（2026/2〜6/1）と2026年6月2日の公開再開。蓄電所ネットは2026年6月に10社目として収録。',
    datePublished: '2026-05-08',
    dateModified: '2026-06-22',
    author: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://bess-net.jp/grid/tokyo/status' },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> /{' '}
            <Link href="/grid">系統空き容量</Link> /{' '}
            <Link href="/grid/tokyo">東京エリア</Link> / 公開停止・再開の経緯
          </p>

          <h1 className="page-title">
            東京電力パワーグリッド 系統空き容量情報の公開停止・再開の経緯
          </h1>
          <p className="page-lead">
            東京電力PG 管内の予想潮流・空容量等に関する情報は、2026年2月2日よりデータメンテナンスのため公開を一時停止していましたが、
            <strong>2026年6月2日に公開を再開</strong>しました（
            <a href="https://www.tepco.co.jp/pg/consignment/system/" target="_blank" rel="noopener noreferrer">TEPCO公式</a>
            ）。蓄電所ネットは公開再開を受けて<strong>2026年6月に10社目として収録（1,718件）</strong>しました。
            最新のデータは{' '}
            <Link href="/grid/tokyo" className="grid-area-link">東京エリアのデータページ</Link>
            {' '}をご覧ください。
          </p>

          {/* 公開停止・再開の経緯 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">公開停止・再開の経緯</h2>
            <dl className="grid-info-table">
              <dt>停止対象</dt>
              <dd>系統の空き容量等に関する情報、需要・送配電に関する情報の系統構成・予想潮流</dd>
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
                <a href="https://www.tepco.co.jp/pg/consignment/system/" target="_blank" rel="noopener noreferrer" className="grid-source-link">
                  東京電力PG 系統情報ページ（TEPCO公式）
                </a>
              </dd>
              <dt>蓄電所ネットの収録状況</dt>
              <dd><strong>2026年6月 収録済み（13都県＋基幹系、1,718件）</strong> — <Link href="/grid/tokyo">/grid/tokyo</Link></dd>
            </dl>
          </section>

          {/* 事前相談窓口 */}
          <section className="grid-section">
            <h2 className="grid-section-h2">事前相談窓口（公式案内）</h2>
            <p>個別の連系検討には以下の事前相談窓口をご活用ください（東京電力PG 公式案内）：</p>
            <ul className="grid-list">
              <li className="grid-list-row">
                <span className="grid-list-label">ネットワークサービスセンター</span>
                <span className="grid-list-value">
                  <a href="https://www.tepco.co.jp/pg/consignment/retailservice2/wsc/" target="_blank" rel="noopener noreferrer" className="grid-source-link">公式お問い合わせページ</a>
                </span>
              </li>
              <li className="grid-list-row">
                <span className="grid-list-label">電源接続案件一括検討プロセス</span>
                <span className="grid-list-value">
                  <a href="https://www.tepco.co.jp/pg/consignment/system/process.html" target="_blank" rel="noopener noreferrer" className="grid-source-link">案内ページ</a>
                </span>
              </li>
              <li className="grid-list-row">
                <span className="grid-list-label">募集プロセス</span>
                <span className="grid-list-value">
                  <a href="https://www.tepco.co.jp/pg/consignment/system/recruitment.html" target="_blank" rel="noopener noreferrer" className="grid-source-link">案内ページ</a>
                </span>
              </li>
            </ul>
          </section>

          {/* 出典 */}
          <section className="grid-section grid-source-section">
            <h2 className="grid-section-h2">出典・データ提供元</h2>
            <p>
              本ページは{' '}
              <a href="https://www.tepco.co.jp/pg/consignment/system/" target="_blank" rel="noopener noreferrer" className="grid-source-link">
                東京電力パワーグリッド「当社における系統情報について」
              </a>
              {' '}の公開情報をもとに蓄電所ネット編集部が整理したものです（最終更新：2026年6月22日）。最新情報は公式ページでご確認ください。
            </p>
          </section>

          <p className="back-link">
            <Link href="/grid/tokyo">← 東京エリアのデータページへ</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
