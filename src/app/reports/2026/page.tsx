/**
 * /reports/2026 — 業界レポート2026 (プレビュー版)
 *
 * 設計:
 *   - Server Component、microCMS 集約から自動集計
 *   - 鉄則 #2 準拠: getAll* 各1回 (合計 ~4 endpoints)、ISR 1時間
 *   - 7/5 完全公開予定、現在はプレビュー版
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import {
  getAllOperators,
  getAllProjects,
  getAllSubsidies,
  getAllSubstations,
} from '@/lib/microcms';
import { GLOBAL_MARKETS, COUNTRY_ORDER } from '@/data/global-markets';
import { PLAYERS, RELATIONS, CATEGORY_LABELS } from '@/data/industry-map';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '業界レポート2026 (蓄電所事業 年次レポート、プレビュー)',
  description: '蓄電所事業の年次レポート2026。市場規模・政策・主要プレイヤー・系統データ・火災事例・海外比較を業界唯一機能の蓄積データから編集統合。プレビュー版。',
  alternates: { canonical: '/reports/2026' },
  openGraph: {
    title: '業界レポート2026 (蓄電所事業 年次レポート)',
    description: '業界唯一機能から編集統合した年次レポート (プレビュー)',
    type: 'article',
    images: ['/og-image.png'],
  },
};

const safeFetch = async <T,>(fn: () => Promise<T[]>): Promise<T[]> => {
  try { return await fn(); } catch { return []; }
};

export default async function Report2026Page() {
  const [operators, projects, subsidies, substations] = await Promise.all([
    safeFetch(getAllOperators),
    safeFetch(getAllProjects),
    safeFetch(getAllSubsidies),
    safeFetch(() => getAllSubstations()),
  ]);

  // 集計
  const operatorCount = operators.length;
  const projectCount = projects.length;
  const subsidyCount = subsidies.length;
  const substationCount = substations.length;

  // プロジェクト集計
  const totalMW = projects.reduce((sum, p) => sum + (p.outputMw ?? 0), 0);
  const totalMWh = projects.reduce((sum, p) => sum + (p.capacityMwh ?? 0), 0);
  const projectsByStatus: Record<string, number> = {};
  for (const p of projects) {
    const s = (p.status && p.status[0]) || 'その他';
    projectsByStatus[s] = (projectsByStatus[s] || 0) + 1;
  }
  const statusEntries = Object.entries(projectsByStatus).sort((a, b) => b[1] - a[1]);

  // 都道府県別 Top 5
  const projectsByPref: Record<string, number> = {};
  for (const p of projects) {
    if (p.prefecture) projectsByPref[p.prefecture] = (projectsByPref[p.prefecture] || 0) + 1;
  }
  const topPrefs = Object.entries(projectsByPref).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // 海外比較
  const globalTotal2025 = COUNTRY_ORDER.reduce((s, k) => s + GLOBAL_MARKETS[k].marketSizeGWh2025, 0);
  const globalTotal2030 = COUNTRY_ORDER.reduce((s, k) => s + GLOBAL_MARKETS[k].marketSizeGWh2030, 0);

  // JSON-LD Article
  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: '業界レポート2026 (蓄電所事業 年次レポート、プレビュー)',
    description: '蓄電所事業の年次レポート2026。市場規模・政策・主要プレイヤー・系統データ・火災事例・海外比較を業界唯一機能の蓄積データから編集統合',
    author: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    datePublished: '2026-05-15',
    dateModified: '2026-05-15',
    mainEntityOfPage: 'https://bess-net.jp/reports/2026',
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: 'レポート', item: 'https://bess-net.jp/reports' },
      { '@type': 'ListItem', position: 3, name: '業界レポート2026', item: 'https://bess-net.jp/reports/2026' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/reports">レポート</Link> / 業界レポート2026
          </p>
          <div className="section-label" style={{ color: '#c70', fontWeight: 700 }}>★ プレビュー版 · 2026年7月本編公開予定</div>
          <h1 className="section-title">業界レポート2026 (蓄電所事業 年次レポート)</h1>
          <p className="section-desc" style={{ marginBottom: 24 }}>
            業界唯一機能 17機能で蓄積したデータを編集統合した、蓄電所事業の<strong>年次レポート</strong>。
            市場規模 × 政策 × 主要プレイヤー × 系統 × 火災・トラブル × 海外比較 を1冊に集約します。
            <br />
            本ページはプレビュー版 (主要数値の即時集計)。本編は <strong>2026年7月</strong>公開予定。
          </p>

          {/* TOC */}
          <section style={{ marginBottom: 32, padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>目次 (本編予定)</h2>
            <ol style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 24, margin: 0 }}>
              <li>序章: 蓄電所事業 2025-2026 年の見取り図</li>
              <li>市場概況: 国内累積導入量、年次推移、地域偏在</li>
              <li>政策・制度: 容量市場、長期脱炭素電源オークション、需給調整市場</li>
              <li>主要プレイヤー: デベロッパー / EPC / セル / PCS / EMS / 電力</li>
              <li>系統データ: 9送配電エリア別 空き容量 / N-1電制 / ノンファーム</li>
              <li>補助金・公募動向: SII / NEDO / 経産省 / 自治体</li>
              <li>火災・トラブル事例: 国内外の代表事例と教訓</li>
              <li>海外比較: 米国 / EU / 中国 / インド / 豪州</li>
              <li>今後の展望: 2030 までの市場予測と参入機会</li>
              <li>付録: 主要事業者一覧 / プロジェクトDB / 用語集 / FAQ</li>
            </ol>
          </section>

          {/* 集計セクション */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>📊 業界主要指標 (リアルタイム集計)</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
              <Stat label="主要事業者" value={`${operatorCount} 社`} sub="事業者ナビ" />
              <Stat label="プロジェクト" value={`${projectCount} 件`} sub="プロジェクトDB" />
              <Stat label="累積出力" value={`${totalMW.toLocaleString()} MW`} sub="登録分のみ" />
              <Stat label="累積容量" value={`${totalMWh.toLocaleString()} MWh`} sub="登録分のみ" />
              <Stat label="補助金" value={`${subsidyCount} 件`} sub="補助金一覧" />
              <Stat label="変電所" value={`${substationCount.toLocaleString()} 件`} sub="9送配電エリア" />
            </div>
          </section>

          {/* 案件ステータス内訳 */}
          {statusEntries.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>📈 プロジェクトステータス内訳</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg)' }}>
                    <th style={{ padding: 8, textAlign: 'left', border: '1px solid var(--color-border)' }}>ステータス</th>
                    <th style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>件数</th>
                    <th style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>構成比</th>
                  </tr>
                </thead>
                <tbody>
                  {statusEntries.map(([s, n]) => (
                    <tr key={s}>
                      <td style={{ padding: 8, border: '1px solid var(--color-border)' }}>{s}</td>
                      <td style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>{n}</td>
                      <td style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>{(n / projectCount * 100).toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* 都道府県別 Top 5 */}
          {topPrefs.length > 0 && (
            <section style={{ marginBottom: 32 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🗾 プロジェクト所在地 Top 5 都道府県</h2>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg)' }}>
                    <th style={{ padding: 8, textAlign: 'left', border: '1px solid var(--color-border)' }}>順位</th>
                    <th style={{ padding: 8, textAlign: 'left', border: '1px solid var(--color-border)' }}>都道府県</th>
                    <th style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>件数</th>
                  </tr>
                </thead>
                <tbody>
                  {topPrefs.map(([pref, n], idx) => (
                    <tr key={pref}>
                      <td style={{ padding: 8, border: '1px solid var(--color-border)' }}>{idx + 1}</td>
                      <td style={{ padding: 8, border: '1px solid var(--color-border)' }}>{pref}</td>
                      <td style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>{n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          {/* 業界構造 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🗺 業界構造 (カオスマップ抜粋)</h2>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              主要 <strong>{PLAYERS.length}社</strong>を <strong>11カテゴリ</strong>で整理 + <strong>{RELATIONS.length}件</strong>の関係 (出資/EPC/セル供給/オフテイク等) で構造を可視化。
              詳細は <Link href="/map/industry-chaos">業界カオスマップ</Link> 参照。
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, marginTop: 12 }}>
              {(Object.keys(CATEGORY_LABELS) as Array<keyof typeof CATEGORY_LABELS>).map((k) => {
                const cnt = PLAYERS.filter((p) => p.category === k).length;
                return (
                  <div key={k} style={{
                    padding: 8, border: '1px solid var(--color-border)', borderRadius: 4,
                    fontSize: 12, textAlign: 'center',
                  }}>
                    <div style={{ color: 'var(--color-muted)' }}>{CATEGORY_LABELS[k]}</div>
                    <div style={{ fontWeight: 700, fontSize: 16 }}>{cnt}</div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* 海外比較 */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12 }}>🌐 海外比較 (主要 5 市場)</h2>
            <p style={{ fontSize: 13, lineHeight: 1.7 }}>
              米国/EU/中国/インド/豪州 の 5 大市場で、2025年累積 <strong>{globalTotal2025} GWh</strong>、2030予測 <strong>{globalTotal2030} GWh</strong>。
              詳細は <Link href="/global">海外5市場ハブ</Link> 参照。
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, marginTop: 8 }}>
              <thead>
                <tr style={{ background: 'var(--color-bg)' }}>
                  <th style={{ padding: 8, textAlign: 'left', border: '1px solid var(--color-border)' }}>市場</th>
                  <th style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>2025 (GWh)</th>
                  <th style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>2030 (GWh)</th>
                  <th style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>CAGR</th>
                </tr>
              </thead>
              <tbody>
                {COUNTRY_ORDER.map((k) => {
                  const m = GLOBAL_MARKETS[k];
                  return (
                    <tr key={k}>
                      <td style={{ padding: 8, border: '1px solid var(--color-border)' }}>
                        {m.flag} <Link href={`/global/${k}`}>{m.name}</Link>
                      </td>
                      <td style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>{m.marketSizeGWh2025}</td>
                      <td style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>{m.marketSizeGWh2030}</td>
                      <td style={{ padding: 8, textAlign: 'right', border: '1px solid var(--color-border)' }}>{m.cagr}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>

          {/* 注意書き */}
          <section style={{ marginBottom: 32, padding: 16, background: 'rgba(255,200,0,0.08)', border: '1px solid #c70', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>注意事項</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
              <li>本ページは<strong>プレビュー版</strong>で、主要数値の即時集計を表示。</li>
              <li>本編は <strong>2026年7月</strong>公開予定。執筆部分・図表・分析コメントを追加。</li>
              <li>数値は当サイト DB の登録分。公開情報に基づくため、国内全体の実数とは異なります。</li>
              <li>引用・転載時は当サイト名 (蓄電所ネット / bess-net.jp) を明記してください。</li>
            </ul>
          </section>

          <section style={{ padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連 (一次データへ)</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/operators">事業者ナビ ({operatorCount}社)</Link></li>
              <li><Link href="/projects">プロジェクトDB ({projectCount}件)</Link></li>
              <li><Link href="/subsidies">補助金一覧 ({subsidyCount}件)</Link></li>
              <li><Link href="/grid">系統空き容量 ({substationCount.toLocaleString()}変電所)</Link></li>
              <li><Link href="/map/industry-chaos">業界カオスマップ</Link></li>
              <li><Link href="/global">海外5市場ハブ</Link></li>
              <li><Link href="/industry">業界分析ハブ</Link></li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{
      padding: 12, border: '1px solid var(--color-border)', borderRadius: 6,
      background: 'rgba(0, 102, 204, 0.06)', textAlign: 'center',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  );
}
