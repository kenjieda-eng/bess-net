/**
 * /tools/fire-risk-check — 火災リスク自己診断 (依頼AS、教育型)
 *
 * 設計 (CLAUDE.md §0 鉄則完全準拠):
 *   - 鉄則 #2: SSR 外部 API 0 (チェックリストは静的データ)
 *   - 鉄則 #3: 単一 URL、動的ルートなし
 *   - 鉄則 #4: ピーク負荷 0 req/分
 *
 * 編集方針 (啓発ツール):
 *   - disclaimer 明示必須 (本診断は啓発・自己評価用)
 *   - UL9540A / NFPA 855 / 消防法 は参考
 *   - 最終判断は消防署/専門家
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import FireRiskChecker from '@/components/FireRiskChecker';
import { siteConfig } from '@/lib/site-config';
import { CHECKLIST } from '@/data/fire-risk-checklist';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '火災リスク自己診断 (UL9540A 25問チェック)',
  description:
    '蓄電池の火災リスクを 25 問でセルフチェック。UL9540A / NFPA 855 / 消防法 の主要観点を網羅。総合スコア + カテゴリ別評価 + 優先改善 Top 5 を即時算出。無料・登録不要の教育型ツール。',
  alternates: { canonical: '/tools/fire-risk-check' },
  openGraph: {
    title: '火災リスク自己診断 (UL9540A 準拠・25問)',
    description: 'セル選定・PCS・建屋・運用・緊急対応の 5 カテゴリ 25 問チェックリスト。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function FireRiskCheckPage() {
  // JSON-LD SoftwareApplication
  const softwareJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: '蓄電池火災リスク自己診断',
    alternateName: 'BESS Fire Risk Self-Check',
    description:
      '蓄電池の火災リスクを UL9540A / NFPA 855 / 消防法 観点で 25 問セルフチェックするブラウザ完結ツール。',
    applicationCategory: 'EducationalApplication',
    operatingSystem: 'Web Browser',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'JPY' },
    url: 'https://bess-net.jp/tools/fire-risk-check',
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    provider: {
      '@type': 'Organization',
      name: siteConfig.organization.name,
      url: siteConfig.organization.url,
    },
    featureList: [
      '5 カテゴリ × 5 問 = 25 問チェックリスト',
      '加重スコアリング (0-100、weight 1-3 反映)',
      'リスクレベル 4 段階判定 (low / moderate / high / critical)',
      'カテゴリ別スコアバー',
      '優先改善 Top 5 抽出 (severity 付き)',
      'UL9540A / NFPA 855 / 消防法 参照付き',
      'CSV エクスポート (改善計画書として活用可)',
      '回答付き URL 共有',
    ],
  };

  // JSON-LD Article (教育コンテンツとして SEO 流入強化)
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '蓄電池火災リスク自己診断 — UL9540A / NFPA 855 / 消防法 25 問チェック',
    description:
      '蓄電池の火災リスクを国際規格 UL9540A、NFPA 855、国内消防法の観点で評価する 25 問のセルフチェックツール。事業者の安全意識向上と業界全体の安全文化醸成を目的とした啓発教材。',
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
    datePublished: '2026-05-17',
    dateModified: '2026-05-17',
    inLanguage: 'ja-JP',
    keywords: [
      '蓄電池', '火災リスク', 'UL9540A', 'NFPA 855', '消防法', '熱暴走',
      'BMS', 'BESS', '安全対策', 'リチウムイオン電池',
    ],
    about: {
      '@type': 'Thing',
      name: '蓄電池の火災対策',
    },
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
        name: '火災リスク自己診断',
        item: 'https://bess-net.jp/tools/fire-risk-check',
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
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
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 火災リスク自己診断
          </p>
          <div className="section-label">UL9540A 準拠・25問 · 教育型 · 無料</div>
          <h1 className="section-title">蓄電池火災リスク自己診断</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            蓄電池の火災リスクを <strong>UL9540A / NFPA 855 / 消防法</strong> の主要観点で{' '}
            <strong>{CHECKLIST.length} 問</strong> セルフチェック。
            <strong>セル選定・PCS・建屋・運用・緊急対応</strong> の 5 カテゴリで総合スコア + リスクレベル + 優先改善 Top 5 を即時算出。
            事業者の安全意識向上 + 業界全体の安全文化醸成を目的とした<strong>啓発・教育型ツール</strong>です。
          </p>

          <FireRiskChecker />

          {/* 規格概要 */}
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
              参考規格・法令 概要
            </h2>
            <dl style={{ fontSize: 14, lineHeight: 1.7 }}>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>UL9540A (米国)</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                蓄電池の熱暴走伝播試験規格。セル → モジュール → ラック → ユニット → 設置場所の各段階で
                熱暴走の伝播性を評価。北米では事実上の業界標準、日本でも信頼性指標として広く参照される。
              </dd>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>NFPA 855 (米国)</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                定置用蓄電システムの設置基準。離隔距離・換気・消火設備・電源遮断等の物理的要件を体系化。
              </dd>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>消防法 (日本)</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                第 9 条の 2、施行令 第 13 条、施行規則 等が蓄電池に関連。設置届出・消火設備・離隔距離の
                法的要件を規定。最終判断は所轄消防署。
              </dd>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>電気事業法 (日本)</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                第 43 条 電気主任技術者の選任、第 42 条 保安規程の届出 等。電気的安全の最終責任体制を規定。
              </dd>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>IEC 62619 / IEC 62933 (国際)</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                産業用リチウムイオン電池および定置用蓄電システムの国際安全標準。UL と並んで認証取得対象。
              </dd>
              <dt style={{ fontWeight: 700, marginTop: 8 }}>JIS C 8715-2 (日本)</dt>
              <dd style={{ marginLeft: 16, marginBottom: 4 }}>
                産業用リチウムイオン電池の安全要求事項。国内認証の参照規格。
              </dd>
            </dl>
          </section>

          {/* 注意 + 使い方 */}
          <section
            style={{
              marginTop: 24,
              padding: 20,
              background: '#fff4f4',
              border: '2px solid #cc0066',
              borderRadius: 8,
            }}
          >
            <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12, color: '#cc0066' }}>
              重要な注意事項 (必読)
            </h2>
            <ul style={{ fontSize: 14, lineHeight: 1.8 }}>
              <li>
                <strong>本診断は啓発・自己評価用です</strong>。法的判断・専門助言の代替にはなりません。
              </li>
              <li>
                最終的な火災対策の妥当性は{' '}
                <strong>消防署・電気主任技術者・蓄電池専門家との協議で確定</strong>してください。
              </li>
              <li>
                UL9540A / NFPA 855 は <strong>参考規格</strong>。日本国内では消防法・電気事業法・JIS 規格が
                法的拘束力を持ちます。両者の併用が望ましい。
              </li>
              <li>
                スコア 100 でも事故ゼロを保証するものではありません。<strong>定期点検と継続改善</strong>{' '}
                が必須です。
              </li>
              <li>
                結果の CSV エクスポートは社内検討資料・改善計画書のたたき台として活用ください。
              </li>
            </ul>
          </section>

          {/* 使い方 */}
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
                <strong>Step 1-5</strong>: セル選定 / PCS / 建屋 / 運用 / 緊急対応 の 25 問に順次回答
              </li>
              <li>
                <strong>回答中</strong>: 各問の選択肢の右側にスコア (0-10) が表示。<strong>★重要</strong> マーク付の問は
                weight 3 で総合スコアへの影響が大きい
              </li>
              <li>
                <strong>結果確認</strong>: 入力変更で即座に再計算。総合スコア + カテゴリ別バー + 優先改善 Top 5 を確認
              </li>
              <li>
                <strong>改善計画</strong>: 優先改善 Top 5 を起点に、対応すべき項目を社内で検討
              </li>
              <li>
                <strong>共有 / 出力</strong>: 回答付き URL を社内共有、CSV を改善計画書のたたき台に
              </li>
            </ol>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
