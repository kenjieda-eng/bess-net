/**
 * /tools/grid-connection-check — 系統連系診断 (依頼AR、業界唯一機能)
 *
 * 設計 (CLAUDE.md §0 鉄則完全準拠):
 *   - 鉄則 #2: SSR で外部 API リクエスト 0 (事前計算済 40 JSON 参照)
 *   - 鉄則 #3: 単一 URL、動的ルートなし、8,225 件は build 時計算 + 都道府県別分割
 *   - 鉄則 #4: ピーク負荷 0 req/分
 *   - 落とし穴 #98 完全回避: build 時 1 回 microCMS から取得、SSR は静的 JSON のみ
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import GridConnectionChecker from '@/components/GridConnectionChecker';
import { siteConfig } from '@/lib/site-config';
import substationsIndex from '@/data/substations/index.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '系統連系診断 (8,225 変電所DB ベース)',
  description:
    '日本全国 8,225 変電所の公表データから、希望地点・出力に最適な連系候補を Top 5 即時抽出。空き容量・N-1 電制適用可否・距離評価でスコアリング。業界唯一の無料ツール。',
  alternates: { canonical: '/tools/grid-connection-check' },
  openGraph: {
    title: '系統連系診断 (業界唯一・8,225変電所DB)',
    description:
      '所在地・出力・容量で連系候補 Top 5 を即時診断。10 送配電・8,200+ 件の空き容量データを横断検索。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

const INDEX = substationsIndex as {
  total: number;
  with_coords: number;
  pref_count: number;
  updated_at: string;
};

export default function GridConnectionCheckPage() {
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '系統連系診断',
    alternateName: 'BESS Grid Connection Checker',
    description:
      '日本全国 8,225 変電所の公表データから、希望地点・出力に最適な連系候補を即時抽出するブラウザ完結ツール。',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    url: 'https://bess-net.jp/tools/grid-connection-check',
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    featureList: [
      '8,225 変電所データベース ベース',
      '都道府県 + 緯度経度 + 出力で診断',
      'haversine 距離計算 (km)',
      'feasibility スコアリング (0-100)',
      '空き容量・N-1 電制・出力制御リスクの総合評価',
      'Top 5 候補表示',
      'CSV エクスポート',
      '入力条件付き URL 共有',
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'ツール', item: 'https://bess-net.jp/tools' },
      {
        '@type': 'ListItem',
        position: 3,
        name: '系統連系診断',
        item: 'https://bess-net.jp/tools/grid-connection-check',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        {/* Tier 2/3 UI 統一: max-w 1320 */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 系統連系診断
          </p>
          <div className="section-label">業界唯一 · 無料・登録不要</div>
          <h1 className="section-title">系統連系診断</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            <strong>{INDEX.total.toLocaleString()} 変電所</strong> の公表データから、希望地点・出力に最適な連系候補を{' '}
            <strong>Top 5</strong> 即時抽出。空き容量・N-1 電制適用可否・距離評価でスコアリング。
            9 送配電を横断検索、CSV エクスポート / URL 共有対応。
          </p>
          <p
            className="page-meta"
            style={{
              marginTop: 0,
              marginBottom: 24,
              paddingTop: 0,
              borderTop: 'none',
              fontSize: 13,
              color: 'var(--color-muted)',
            }}
          >
            ※ データは microCMS 上の 系統空き容量データベース ({INDEX.total.toLocaleString()} 件) と同期。座標あり {INDEX.with_coords.toLocaleString()} 件は距離順、座標なしは都道府県内全件集約検索。
            東京電力PG（13都県＋基幹系）も2026年6月より収録・診断対象です。最新更新 {INDEX.updated_at.slice(0, 10)}。
          </p>

          <GridConnectionChecker />

          {/* 診断ロジック説明 */}
          <section
            style={{
              marginTop: 40,
              padding: 20,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              診断ロジック
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, marginTop: 0, marginBottom: 12 }}>
              feasibility スコアリング (最大 100 点):
            </p>
            <ul style={{ fontSize: 14, lineHeight: 1.8 }}>
              <li>
                <strong>空き容量 vs 出力</strong>: 比率 1.5x で +30 / 1.0x で +20 / 0.5x で +10
              </li>
              <li>
                <strong>距離評価</strong> (緯度経度入力時): 5km 未満 +25 / 10km 未満 +15 / 20km 未満 +5
              </li>
              <li>
                <strong>N-1 電制適用可</strong>: +15
              </li>
              <li>
                <strong>電圧階級</strong> (一次・二次両方明示): +10
              </li>
              <li>
                <strong>出力制御リスク低</strong>: +10
              </li>
              <li>
                <strong>同都道府県フォールバック</strong> (距離不明時): +5
              </li>
            </ul>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 12, marginBottom: 0 }}>
              <strong>レコメンデーション判定</strong>: スコア ≥70 「連系可能性高」/ ≥50 「連系可能性あり」/ ≥30 「連系困難」/ {'<'} 30 「個別協議必須」。
              <strong>注意</strong>: 公表データベースの参考情報です。実際の連系可否は各送配電事業者への接続検討申請で確定します。
            </p>
          </section>

          {/* 使い方ガイド */}
          <section
            style={{
              marginTop: 24,
              padding: 20,
              background: 'var(--color-bg-card, #fff)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              使い方
            </h2>
            <ol style={{ fontSize: 14, lineHeight: 1.8 }}>
              <li>
                <strong>都道府県選択</strong>: 連系希望のエリアを選択 (都道府県別件数表示)
              </li>
              <li>
                <strong>緯度経度入力</strong> (任意): Google Maps 等から取得した正確な座標で距離順ソート
              </li>
              <li>
                <strong>出力 + 容量入力</strong>: BESS の定格出力 (MW)・容量 (MWh)
              </li>
              <li>
                <strong>結果確認</strong>: 入力変更で即座に再診断、Top 5 表示
              </li>
              <li>
                <strong>連系条件確認</strong>: 「変電所詳細」リンクで該当変電所の公表データを確認
              </li>
              <li>
                <strong>共有 / 出力</strong>: URL 共有 or CSV エクスポート
              </li>
            </ol>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
