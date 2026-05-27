/**
 * /incidents — 蓄電池 火災・トラブル事例 DB (Sprint 5 シード版)
 *
 * 設計:
 *   - Server Component、静的データのみ (鉄則 #2 完全準拠、SSR 外部 API 0)
 *   - シード 10件 (公開情報ベース)
 *   - フィルタ UI は Sprint 5 で追加予定 (現在は全件表示)
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import { INCIDENTS, SEVERITY_LABELS, CAUSE_LABELS, REGION_LABELS } from '@/data/incidents';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '火災・トラブル事例DB (蓄電池 国内外 公開情報)',
  description: `蓄電池 (BESS) の火災・トラブル事例を公開情報ベースで体系化。${INCIDENTS.length}件のシードデータを掲載。教育・安全文化向上を目的とした業界唯一の事例DB。`,
  alternates: { canonical: '/incidents' },
  openGraph: {
    title: '火災・トラブル事例DB (蓄電池 国内外)',
    description: '公開情報ベースの BESS 事例集。教育・安全文化向上目的',
    type: 'website',
    images: ['/og-image.png'],
  },
};

const SEVERITY_COLOR: Record<string, string> = {
  major: '#c33',
  moderate: '#e80',
  minor: '#999',
  unknown: '#aaa',
};

export default function IncidentsPage() {
  // 並び替え: 重大度 → 日付降順
  const severityOrder: Record<string, number> = { major: 0, moderate: 1, minor: 2, unknown: 3 };
  const sorted = [...INCIDENTS].sort((a, b) => {
    const so = severityOrder[a.severity] - severityOrder[b.severity];
    if (so !== 0) return so;
    return b.date.localeCompare(a.date);
  });

  // 集計
  const byRegion: Record<string, number> = {};
  const byCause: Record<string, number> = {};
  for (const i of INCIDENTS) {
    byRegion[i.region] = (byRegion[i.region] || 0) + 1;
    byCause[i.cause] = (byCause[i.cause] || 0) + 1;
  }

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '蓄電池 火災・トラブル事例 DB',
    description: '蓄電池 (BESS) の火災・トラブル事例 公開情報ベース',
    numberOfItems: INCIDENTS.length,
    itemListElement: sorted.slice(0, 20).map((i, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: i.facilityName,
      description: `${i.date} ${REGION_LABELS[i.region]} — ${i.summary.slice(0, 100)}`,
    })),
  };
  const datasetJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Dataset',
    name: '蓄電池 火災・トラブル事例 DB',
    description: '公開情報ベースの BESS 火災・トラブル事例集',
    keywords: ['BESS', '蓄電池', '火災', '熱暴走', '安全', 'インシデント'],
    license: 'https://creativecommons.org/licenses/by/4.0/',
    creator: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    url: 'https://bess-net.jp/incidents',
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '火災・トラブル事例DB', item: 'https://bess-net.jp/incidents' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        {/* Tier 2/3 UI 統一: 分類 C 記事系 max-w 896 (読み物用、リン推奨規約) */}
        <div className="section-inner" style={{ maxWidth: 896 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 火災・トラブル事例DB
          </p>
          <div className="section-label" style={{ color: '#c55', fontWeight: 700 }}>🔥 AJ 火災事例 DB v1 · 2026-05-28 公開</div>
          <h1 className="section-title">火災・トラブル事例 DB</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.7 }}>
            蓄電池 (BESS) の火災・トラブル事例を<strong>公開情報ベース</strong>で体系化。
            業界の<strong>安全文化向上</strong>に資することを目的とした、業界唯一の事例DB。
            現在 <strong>{INCIDENTS.length}件</strong>を掲載（国内外・公開情報のみ）。
          </p>

          {/* ─ Disclaimer (編集方針 v2 準拠) ─ */}
          <section style={{ padding: 16, marginBottom: 24, background: 'rgba(255,200,0,0.08)', border: '1px solid #c70', borderRadius: 6 }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 6 }}>⚠ 利用上の注意（必読）</h2>
            <ul style={{ fontSize: 12, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li>本DBは<strong>教育・安全文化向上</strong>を目的としており、法的・技術的な専門助言の代替ではありません。</li>
              <li>情報は<strong>公開資料（報道/政府発表/企業プレスリリース）</strong>に基づきます。原因欄は「推定原因」であり確定情報ではありません。</li>
              <li>詳細は必ず<strong>一次ソース</strong>を参照し、内部判断にお使いください。</li>
              <li>
                <strong>削除依頼：</strong>掲載内容に誤りまたは削除すべき情報がある場合は
                <a href="https://eic-jp.org/contact" target="_blank" rel="noopener noreferrer" style={{ marginLeft: 4 }}>
                  お問い合わせフォーム
                </a>
                からご連絡ください。<strong>原則48時間以内</strong>に対応します（緊急の場合は件名に「DB削除依頼【緊急】」とご記入ください）。
              </li>
            </ul>
          </section>

          {/* 集計 */}
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 8, marginBottom: 24 }}>
            <Stat label="掲載事例" value={`${INCIDENTS.length} 件`} />
            <Stat label="重大事例" value={`${INCIDENTS.filter((i) => i.severity === 'major').length} 件`} />
            <Stat label="地域数" value={`${Object.keys(byRegion).length} 地域`} />
            <Stat label="原因類型" value={`${Object.keys(byCause).length} 種`} />
          </section>

          {/* 事例リスト */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>事例一覧 ({sorted.length} 件)</h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {sorted.map((i) => (
                <li key={i.id} style={{
                  padding: 16, marginBottom: 12,
                  border: '1px solid var(--color-border)', borderRadius: 6,
                  background: 'white',
                }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{
                      fontSize: 11, padding: '2px 8px', borderRadius: 4,
                      background: SEVERITY_COLOR[i.severity], color: 'white', fontWeight: 700,
                    }}>{SEVERITY_LABELS[i.severity]}</span>
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 3, background: '#eef', color: '#446' }}>
                      推定原因: {CAUSE_LABELS[i.cause]}
                    </span>
                    <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 3, background: 'var(--color-bg)', color: 'var(--color-muted)' }}>
                      {REGION_LABELS[i.region]} · {i.date}
                    </span>
                    {i.capacity_mwh && (
                      <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 3, background: 'var(--color-bg)', color: 'var(--color-muted)' }}>
                        {i.capacity_mwh} MWh
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, margin: '4px 0' }}>{i.facilityName}</h3>
                  <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 6px' }}>{i.location}</p>
                  <p style={{ fontSize: 13, lineHeight: 1.7, margin: '6px 0' }}>{i.summary}</p>
                  {i.lessons && (
                    <p style={{ fontSize: 12, lineHeight: 1.7, margin: '6px 0', padding: 8, background: 'rgba(0,102,204,0.05)', borderLeft: '3px solid var(--color-accent)' }}>
                      <strong>学びポイント: </strong>{i.lessons}
                    </p>
                  )}
                  {i.sourceUrls && i.sourceUrls.length > 0 && (
                    <div style={{ fontSize: 11, marginTop: 6 }}>
                      <strong style={{ color: 'var(--color-muted)' }}>出典: </strong>
                      {i.sourceUrls.map((u, idx) => (
                        <span key={u}>
                          {idx > 0 && ' / '}
                          <a href={u} target="_blank" rel="noopener noreferrer" style={{ wordBreak: 'break-all' }}>{u}</a>
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>

          {/* 拡張計画 */}
          <section style={{ marginTop: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>AJ 火災事例 DB 拡張計画</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
              <li>事例を 30+ 件に拡張（公開情報ベース・順次追加）</li>
              <li>地域 / 重大度 / 原因 によるフィルタ UI</li>
              <li>国内事例の詳細調査（経産省・消防庁・NEDO 資料ベース）</li>
              <li><Link href="/tools/fire-risk-check">火災リスク自己診断</Link> との連携強化</li>
              <li>消防法・自治体条例・UL9540A 規制動向解説</li>
            </ul>
          </section>

          <section style={{ marginTop: 16, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/tools/fire-risk-check">火災リスク自己診断 (業界唯一・教育型)</Link></li>
              <li><Link href="/reports/2026">業界レポート2026 (プレビュー)</Link></li>
              <li><Link href="/industry">業界分析ハブ</Link></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: 10, border: '1px solid var(--color-border)', borderRadius: 6,
      background: 'rgba(0, 102, 204, 0.06)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
