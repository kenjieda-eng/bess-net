/**
 * /industry — 業界分析ハブ (Sprint 4 後半 4 ハブの集約 index)
 *
 * 設計:
 *   - Server Component（ISR 86400秒）
 *   - industry群分析2026-07-15 P1: 今週の業界ハイライト＋5機能カードの「今日の1数字」チップ
 *     - チップの大半はローカル precompute（industry-map / operator-ranking / jepx-spot）＝取得0
 *     - ハイライトとトラッカー7日更新件数のみ 最小 microCMS クエリ（8req/86,400秒＝約0.006req/分・#98域外）
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { PLAYERS } from '@/data/industry-map';
import { getSubsidyList, getSubstationList, getOperatorList, getProjectList } from '@/lib/microcms';
import operatorRanking from '@/data/operator-ranking.json';
import jepxHokkaido from '@/data/eic/jepx-spot-hokkaido.json';
import jepxTohoku from '@/data/eic/jepx-spot-tohoku.json';
import jepxTokyo from '@/data/eic/jepx-spot-tokyo.json';
import jepxChubu from '@/data/eic/jepx-spot-chubu.json';
import jepxHokuriku from '@/data/eic/jepx-spot-hokuriku.json';
import jepxKansai from '@/data/eic/jepx-spot-kansai.json';
import jepxChugoku from '@/data/eic/jepx-spot-chugoku.json';
import jepxShikoku from '@/data/eic/jepx-spot-shikoku.json';
import jepxKyushu from '@/data/eic/jepx-spot-kyushu.json';

export const revalidate = 86400;

export const metadata: Metadata = {
  // layout titleTemplate が「 | 蓄電所ネット」を自動付与（#88）
  title: '蓄電池 業界分析ハブ（カオスマップ × JEPX × 海外5市場 × トラッカー × Top50）',
  description: '蓄電所事業の業界分析5機能を一覧。業界カオスマップ・JEPXハブ・海外5市場ハブ・業界トラッカー・事業者Top50ランキング。当サイト独自の構造可視化基盤、無料公開・登録不要。',
  alternates: { canonical: '/industry' },
  openGraph: {
    title: '蓄電池 業界分析ハブ（カオスマップ × JEPX × 海外5市場 × トラッカー × Top50）',
    description: '業界構造 × スポット市場 × 海外比較 × 更新トラッカー × Top50ランキング',
    type: 'website',
    images: ['/og-image.png'],
  },
};

// ── 「今日の1数字」導出（ローカル precompute・焼き込みゼロ） ──────────────
type JepxJson = { points: { date: string; value: number | null }[] };
const JEPX_AREAS: JepxJson[] = [
  jepxHokkaido, jepxTohoku, jepxTokyo, jepxChubu, jepxHokuriku,
  jepxKansai, jepxChugoku, jepxShikoku, jepxKyushu,
] as JepxJson[];

/** 9エリアの最新スポット値平均（¥/kWh）と最新日付 */
function jepxLatestAvg(): { avg: number; date: string } | null {
  const lasts: { date: string; value: number }[] = [];
  for (const s of JEPX_AREAS) {
    const pts = (s.points ?? []).filter((p): p is { date: string; value: number } => p.value != null);
    if (pts.length) lasts.push(pts[pts.length - 1]);
  }
  if (!lasts.length) return null;
  const avg = lasts.reduce((a, b) => a + b.value, 0) / lasts.length;
  const date = lasts.map((l) => l.date).sort().pop()!;
  return { avg, date };
}

const RANKING = operatorRanking as {
  generatedAt: string;
  totalProjects: number;
  ranking: { operator: string; totalCapacityMwh: number }[];
};

export default async function IndustryHubPage() {
  const safeFetch = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); } catch { return fallback; }
  };

  // 今週の業界ハイライト＋トラッカー7日更新件数（最小クエリ: 4軸 ×（最新1件＋7日件数）＝8req/86,400秒）
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const axes = [
    { key: '補助金', href: '/tracker/subsidy', fn: getSubsidyList },
    { key: '系統', href: '/tracker/grid', fn: getSubstationList },
    { key: '事業者', href: '/tracker/ag', fn: getOperatorList },
    { key: '案件', href: '/tracker/pf', fn: getProjectList },
  ] as const;

  const [latests, counts7d] = await Promise.all([
    Promise.all(axes.map((a) =>
      safeFetch(async () => {
        const r = await a.fn({ limit: 1, orders: '-updatedAt', fields: 'name,updatedAt' } as any);
        const it = (r as any).contents?.[0];
        return it ? { axis: a.key, href: a.href, name: it.name as string, updatedAt: it.updatedAt as string } : null;
      }, null)
    )),
    Promise.all(axes.map((a) =>
      safeFetch(async () => {
        const r = await a.fn({ limit: 0, fields: 'id', filters: `updatedAt[greater_than]${sevenDaysAgo}` } as any);
        return (r as any).totalCount as number;
      }, 0)
    )),
  ]);

  const highlights = latests
    .filter((h): h is NonNullable<typeof h> => h !== null)
    .sort((a, b) => (a.updatedAt > b.updatedAt ? -1 : 1))
    .slice(0, 3);
  const updates7d = counts7d.reduce((a, b) => a + b, 0);

  const jepx = jepxLatestAvg();
  const top1 = RANKING.ranking[0];

  // 5機能カード（「今日の1数字」チップ付き・全てコード導出）
  const HUBS = [
    {
      href: '/map/industry-chaos',
      title: '業界カオスマップ',
      desc: '主要50+社を11カテゴリで整理 + 35件の関係 (出資/EPC/セル供給/オフテイク等) で業界構造を可視化。Matrix view + Force graph。',
      tag: '構造',
      chip: `掲載 ${PLAYERS.length}社`,
    },
    {
      href: '/market/jepx',
      title: 'JEPX ハブ',
      desc: '9エリア × 過去30日 × 30分単位 = 12,960データポイント。ヒートマップ + アービトラージ計算機 + 月次推移 + 9エリア比較。',
      tag: '市場',
      chip: jepx ? `最新スポット平均 ${jepx.avg.toFixed(1)}円/kWh（${jepx.date.slice(5)}）` : undefined,
    },
    {
      href: '/global',
      title: '海外5市場ハブ',
      desc: '米国/EU/中国/インド/豪州の蓄電池市場概況。市場規模 (2025累積〜2030予測) × 主要政策 × 主要プレイヤー × 日本との比較。',
      tag: '海外',
      chip: '収録 5市場',
    },
    {
      href: '/tracker',
      title: '業界トラッカー (4軸)',
      desc: '補助金・系統 (変電所8,200+)・事業者 (540+)・プロジェクトDB の更新を時系列タイムラインで一望。',
      tag: '時系列',
      chip: updates7d > 0 ? `直近7日 更新${updates7d.toLocaleString('en-US')}件` : undefined,
    },
    {
      href: '/industry/top50',
      title: '事業者 Top50 ランキング',
      desc: `国内 BESS 事業者を総蓄電容量（MWh）で順位付け。bess-net プロジェクトDB（${RANKING.totalProjects}件）の build 時集計。容量・件数・展開都道府県数を一覧。`,
      tag: 'ランキング',
      chip: top1 ? `首位 ${top1.totalCapacityMwh.toLocaleString('en-US')}MWh` : undefined,
    },
  ];

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: '蓄電所業界 業界分析ハブ',
    description: '業界カオスマップ・JEPXハブ・海外5市場ハブ・業界トラッカー・Top50ランキングの5機能',
    numberOfItems: HUBS.length,
    itemListElement: HUBS.map((h, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: h.title,
      description: h.desc,
      url: `https://bess-net.jp${h.href}`,
    })),
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: 'https://bess-net.jp/' },
      { '@type': 'ListItem', position: 2, name: '業界分析', item: 'https://bess-net.jp/industry' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        {/* Tier 1 UI 統一: max-w 1320 (data.eic-jp.org Phase B-C 規約) */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 業界分析
          </p>
          <div className="section-label">当サイト独自 · 業界分析5機能</div>
          <h1 className="section-title">蓄電池 業界分析ハブ</h1>
          {/* Tier 1 UI 統一 #1: 本文 text-base lg:text-lg (16-18px) */}
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 24, lineHeight: 1.7 }}>
            蓄電所業界の<strong>構造・市場・海外・時系列・ランキング</strong>を 5 機能で可視化。
            業界カオスマップ・JEPXハブ・海外5市場ハブ・業界トラッカー・Top50ランキングへの入口です。
            すべて無料公開・登録不要。
          </p>

          {/* P1a: 今週の業界ハイライト（トラッカー系の直近更新・コード導出。0件時は非表示） */}
          {highlights.length > 0 && (
            <section
              style={{
                marginBottom: 24,
                padding: 16,
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                borderRadius: 8,
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 10 }}>
                今週の業界ハイライト
              </h2>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: 15, lineHeight: 1.9 }}>
                {highlights.map((h) => (
                  <li key={h.axis}>
                    <span style={{ fontVariantNumeric: 'tabular-nums', color: 'var(--color-muted)', fontWeight: 600, marginRight: 8 }}>
                      {h.updatedAt.slice(0, 10)}
                    </span>
                    <span style={{
                      fontSize: 12, padding: '2px 8px', borderRadius: 4, marginRight: 8,
                      background: '#d6e4ff', color: '#346', fontWeight: 600,
                    }}>{h.axis}</span>
                    {h.name} を更新
                    {' '}
                    <Link href={h.href} style={{ fontSize: 15, fontWeight: 600 }}>タイムラインへ →</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
            {HUBS.map((h) => (
              <Link key={h.href} href={h.href} style={{
                display: 'block', padding: 16, border: '1px solid var(--color-border)',
                borderRadius: 8, textDecoration: 'none', color: 'inherit', background: 'white',
              }}>
                <div style={{
                  fontSize: 12, display: 'inline-block', padding: '1px 6px',
                  background: '#d6e4ff', color: '#346', borderRadius: 3, marginBottom: 4,
                }}>{h.tag}</div>
                <h2 style={{ fontSize: 17, fontWeight: 700, margin: '4px 0 8px' }}>{h.title}</h2>
                {/* P1b: 今日の1数字チップ（コード導出） */}
                {h.chip && (
                  <div style={{
                    display: 'inline-block', fontSize: 13, fontWeight: 700, padding: '2px 10px',
                    borderRadius: 999, background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d',
                    marginBottom: 8, fontVariantNumeric: 'tabular-nums',
                  }}>
                    {h.chip}
                  </div>
                )}
                <p style={{ fontSize: 15, lineHeight: 1.7, margin: 0, color: 'var(--color-text)' }}>{h.desc}</p>
                <div style={{ fontSize: 13, color: 'var(--color-accent)', marginTop: 8 }}>開く →</div>
              </Link>
            ))}
          </div>

          <section style={{ padding: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 6 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>ツール (実務支援5機能)</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/tools/irr-simulator">蓄電池 IRR シミュレーター</Link></li>
              <li><Link href="/tools/subsidy-match">補助金マッチング</Link></li>
              <li><Link href="/tools/grid-connection-check">系統連系診断</Link></li>
              <li><Link href="/tools/fire-risk-check">火災リスク自己診断</Link></li>
              <li><Link href="/tools/capacity-market-bid">容量市場応札試算</Link></li>
              <li><Link href="/tools">ツール一覧</Link></li>
              <li>
                制度の仕組み（EIC Data 教材）:{' '}
                <a href="https://data.eic-jp.org/insight/jp-power-markets-three-layers?utm_source=bess-net&utm_medium=referral&utm_campaign=edu_cluster" target="_blank" rel="noopener noreferrer">
                  電力市場の3層：スポット・容量・需給調整の読み方 ↗
                </a>
              </li>
            </ul>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
