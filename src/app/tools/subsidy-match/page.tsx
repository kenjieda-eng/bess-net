/**
 * /tools/subsidy-match — 蓄電池補助金マッチング (依頼AO)
 *
 * 設計 (CLAUDE.md §0 鉄則完全準拠):
 *   - 鉄則 #2: SSR で外部 API リクエスト 0 (事前計算済 JSON 参照のみ)
 *   - 鉄則 #3: 動的ルートなし (単一 URL)
 *   - 鉄則 #4: ピーク負荷 0 req/分
 *   - 落とし穴 #98 完全回避: build 時 1 回 microCMS から取得 → JSON 化
 *
 * 落とし穴対応:
 *   - #79: 単一 URL、build timeout 無関係
 *   - #92: useSearchParams 不使用 (client component で window.location)
 *   - #95-98: contains 検索なし、microCMS リクエスト 0
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import SubsidyMatcher from '@/components/SubsidyMatcher';
import { siteConfig } from '@/lib/site-config';
import subsidiesData from '@/data/subsidies.json';

export const revalidate = 86400; // 24h

// 件数はローカル JSON から動的参照（焼き込み drift 防止・tools分析2026-07-09 変更3。microCMS 0 req）
const SUBSIDY_COUNT = (subsidiesData as unknown[]).length;

export const metadata: Metadata = {
  title: '蓄電池補助金マッチング (無料・登録不要)',
  description:
    `蓄電池補助金を所在地・用途・容量・事業者種別で即マッチング。SII・自治体・民間ローンの ${SUBSIDY_COUNT} 件から条件適合の Top 10 を表示。無料・登録不要。`,
  alternates: { canonical: '/tools/subsidy-match' },
  openGraph: {
    title: '蓄電池補助金マッチング (無料・登録不要)',
    description:
      `SII・自治体・民間ローンの ${SUBSIDY_COUNT} 件補助金から、所在地・用途・容量・事業者種別で適合制度を Top 10 即時抽出。`,
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function SubsidyMatchPage() {
  // JSON-LD SoftwareApplication
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '蓄電池補助金マッチング',
    alternateName: 'BESS Subsidy Matcher',
    description:
      '蓄電池補助金を所在地・用途・容量・事業者種別で即マッチングするブラウザ完結ツール。',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    url: 'https://bess-net.jp/tools/subsidy-match',
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    featureList: [
      '所在地・用途・容量・事業者種別の 4 軸マッチング',
      'スコアリング型 Top 10 表示',
      '補助金額試算 (補助率 × 想定 CAPEX)',
      'マッチング理由の説明 (透明性)',
      'CSV エクスポート (Excel UTF-8 BOM 対応)',
      '入力条件付き URL 共有',
      'モバイル対応 (768px 以下レスポンシブ)',
    ],
  };

  // BreadcrumbList
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'ツール', item: 'https://bess-net.jp/tools' },
      {
        '@type': 'ListItem',
        position: 3,
        name: '蓄電池補助金マッチング',
        item: 'https://bess-net.jp/tools/subsidy-match',
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
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 蓄電池補助金マッチング
          </p>
          <div className="section-label">補助金DB連携（{SUBSIDY_COUNT}件） · 無料・登録不要</div>
          <h1 className="section-title">蓄電池補助金マッチング</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            <strong>所在地・用途・容量・事業者種別</strong> で蓄電池補助金 {SUBSIDY_COUNT} 件から条件適合の{' '}
            <strong>Top 10</strong> を即時マッチング。SII・自治体・民間ローンを横断検索、
            スコアリング表示で「なぜ該当するか」も透明化。CSV エクスポート / URL 共有対応。
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
            ※ データは microCMS 上の 補助金カレンダー (50 件) と同期。build 時に事前計算した
            キーワード抽出 (都道府県・用途・事業者種別) でクライアント側マッチング。
            実申請には各制度の公式情報を必ずご確認ください。
          </p>

          <SubsidyMatcher />

          {/* マッチングロジック説明 */}
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
              マッチングロジック
            </h2>
            <p style={{ fontSize: 14, lineHeight: 1.8, marginTop: 0, marginBottom: 12 }}>
              スコアリング方式 (合計最大 100 点):
            </p>
            <ul style={{ fontSize: 14, lineHeight: 1.8 }}>
              <li>
                <strong>都道府県一致</strong>: +30 (全国対応含む)
              </li>
              <li>
                <strong>用途一致</strong>: +25 (系統用 / 自家消費 / 産業用)
              </li>
              <li>
                <strong>事業者種別一致</strong>: +20 (個人 / 法人 / 自治体)
              </li>
              <li>
                <strong>期限有効</strong>: +15 (随時受付 or 設置予定日 ≤ 締切)
              </li>
              <li>
                <strong>補助率明示</strong>: +10 (% / 分数で算定可)
              </li>
            </ul>
            <p style={{ fontSize: 13, color: 'var(--color-muted)', marginTop: 12, marginBottom: 0 }}>
              <strong>除外条件</strong>: スコア &lt; 30 (全項目不一致レベル) は Top 10 から除外。
              <strong>補助金額試算</strong>: 補助率 (max %) × 想定 CAPEX (1MW あたり 1.5 億円業界目安)。実額は別途査定。
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
                <strong>Step 1</strong>: 都道府県 + 用途 + 事業者種別 + 設置予定日 を選択
              </li>
              <li>
                <strong>Step 2</strong>: 容量 (kWh) + 出力 (kW) を入力 (補助金額試算用)
              </li>
              <li>
                <strong>結果確認</strong>: Top 10 表示、入力変更で即座に再マッチング
              </li>
              <li>
                <strong>詳細確認</strong>: 「公式情報へ」「詳細解説」リンクで各制度の正確情報へ
              </li>
              <li>
                <strong>共有 / 出力</strong>: URL 共有 (入力条件付き) or CSV エクスポート (Excel 対応)
              </li>
            </ol>
            <p
              style={{
                marginTop: 12,
                fontSize: 13,
                color: 'var(--color-muted)',
              }}
            >
              <strong>注意</strong>: 補助金情報は変更頻度が高いため、必ず公式ページで最新情報を確認してください。
              本マッチング結果は &quot;検討の出発点&quot; として活用ください。
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
