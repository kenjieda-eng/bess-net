// /industry/top50 — 事業者ランキング Top50（依頼65）
// 鉄則#2: ランタイム microCMS 0 リクエスト（prebuild 生成 JSON を fs.readFileSync）
// 鉄則#3: 1 ページ × 0 ランタイム API = 完全安全
// 鉄則#4: ピーク負荷 = 0 req/分（静的ページ）

import fs from 'node:fs';
import path from 'node:path';
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import OperatorRankingTable, { type RankingEntry } from '@/components/OperatorRankingTable';
import { siteConfig } from '@/lib/site-config';

export const dynamic = 'force-static';

type NoCapacityEntry = {
  operator: string;
  operatorSlug: string | null;
  projectCount: number;
  prefectures: number;
};

type RankingData = {
  generatedAt: string;
  source: string;
  totalProjects: number;
  totalOperators: number;
  ranking: RankingEntry[];
  noCapacityOperators: NoCapacityEntry[];
};

export const metadata: Metadata = {
  title: '系統用蓄電池 事業者 Top50 ランキング',
  description:
    '系統用蓄電池（BESS）事業者を総蓄電容量（MWh）で順位付け。bess-net プロジェクトDB 約263件を build 時集計。容量上位50社の実績を一覧。',
  alternates: { canonical: '/industry/top50' },
  openGraph: {
    title: '系統用蓄電池 事業者 Top50 ランキング | bess-net',
    description: '国内 BESS 事業者を MWh 容量で順位付け。bess-net プロジェクトDB 集計。',
    type: 'website',
    url: 'https://bess-net.jp/industry/top50',
    images: ['https://bess-net.jp/og-image.png'],
  },
};

export default function IndustryTop50Page() {
  const rankingData: RankingData = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), 'src/data/operator-ranking.json'), 'utf-8')
  );

  const { ranking, noCapacityOperators, generatedAt, totalProjects, totalOperators } =
    rankingData;

  const generatedDate = new Date(generatedAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  });

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '系統用蓄電池 事業者 Top50 ランキング',
    description: '国内 BESS 事業者を総蓄電容量（MWh）で順位付けしたランキング',
    numberOfItems: ranking.length,
    itemListElement: ranking.slice(0, 10).map((r) => ({
      '@type': 'ListItem',
      position: r.rank,
      name: r.operator,
      url: r.operatorSlug
        ? `${siteConfig.url}/operators/${r.operatorSlug}`
        : undefined,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: `${siteConfig.url}/` },
      {
        '@type': 'ListItem',
        position: 2,
        name: '業界分析',
        item: `${siteConfig.url}/industry`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: '事業者 Top50',
        item: `${siteConfig.url}/industry/top50`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/industry">業界分析</Link> / 事業者 Top50
          </p>
          <div className="section-label">Industry</div>
          <h1 className="section-title">事業者ランキング Top50</h1>
          <p className="section-description">
            bess-net プロジェクトDB に登録された系統用蓄電池プロジェクトを事業者別に集計し、
            総蓄電容量（MWh）の大きい順にランキングしています。
          </p>

          {/* サマリーカード */}
          <div
            style={{
              display: 'flex',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 24,
            }}
          >
            {[
              { label: '集計プロジェクト数', value: `${totalProjects}件` },
              { label: '事業者数（operator登録）', value: `${totalOperators}社` },
              { label: '集計日', value: generatedDate },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  padding: '12px 20px',
                  background: '#f0f4ff',
                  borderRadius: 8,
                  border: '1px solid #c7d8ff',
                  minWidth: 140,
                }}
              >
                <div style={{ fontSize: 11, color: '#555', marginBottom: 2 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#234' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* 注記（Phase C 必須 / L-EIC-018） */}
          <section
            style={{
              padding: '12px 16px',
              background: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: 6,
              marginBottom: 24,
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            <strong>このランキングについて</strong>
            <p style={{ margin: '4px 0 0' }}>
              本ランキングは bess-net が収集・公開している系統用蓄電池プロジェクト{' '}
              {totalProjects} 件を事業者別に集計したものです（集計日 {generatedDate}）。
              公表情報ベースのため、全建設実績を悉皆的に網羅したものではなく、
              容量（MWh）が公表・登録されているプロジェクトのみを容量合計に算入しています。
              容量非公表のプロジェクトは件数には含みますが容量には加算していません。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              事業者名は法人格表記（株式会社・合同会社等）の違いを正規化して集計しています。
              複数社の共同出資・コンソーシアムは登録名のまま単独計上しています。
            </p>
            <p style={{ margin: '4px 0 0' }}>
              出典：bess-net プロジェクトデータベース。元情報は各事業者・自治体・報道等の公表資料に基づきます。
            </p>
          </section>

          {/* ランキング表 */}
          {ranking.length === 0 ? (
            <p>ランキングデータを準備中です。</p>
          ) : (
            <OperatorRankingTable ranking={ranking} />
          )}

          {/* 容量未登録事業者（別掲） */}
          {noCapacityOperators.length > 0 && (
            <section style={{ marginTop: 40 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
                容量データ未登録の事業者（{noCapacityOperators.length}社）
              </h2>
              <p style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                プロジェクトを手がけているが、容量（MWh）が公表・登録されていないためランキングに含まれない事業者です。
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {noCapacityOperators.map((op) => (
                  <span
                    key={op.operator}
                    style={{
                      padding: '4px 10px',
                      fontSize: 13,
                      background: '#f5f5f5',
                      border: '1px solid #ddd',
                      borderRadius: 4,
                    }}
                  >
                    {op.operatorSlug ? (
                      <Link
                        href={`/operators/${op.operatorSlug}`}
                        style={{ color: 'var(--color-text)', textDecoration: 'none' }}
                      >
                        {op.operator}
                        <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>
                          ({op.projectCount}件)
                        </span>
                      </Link>
                    ) : (
                      <>
                        {op.operator}
                        <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>
                          ({op.projectCount}件)
                        </span>
                      </>
                    )}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* 内部リンク */}
          <div
            style={{
              marginTop: 40,
              padding: 16,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 6,
              fontSize: 13,
            }}
          >
            <strong>関連ページ</strong>
            <ul style={{ margin: '8px 0 0', paddingLeft: 20, lineHeight: 1.9 }}>
              <li>
                <Link href="/operators">事業者データベース</Link>（544社の詳細情報）
              </li>
              <li>
                <Link href="/projects">プロジェクトデータベース</Link>（{totalProjects}件のプロジェクト詳細）
              </li>
              <li>
                <Link href="/industry">業界分析ハブ</Link>（業界カオスマップ・JEPX・海外市場・トラッカー）
              </li>
            </ul>
          </div>

          <p className="back-link" style={{ marginTop: 24 }}>
            <Link href="/industry">← 業界分析ハブへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
