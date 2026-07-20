/**
 * /anken — 蓄電所の流通案件（全国）リード獲得ページ（66番→anken Phase1）
 *
 * 設計:
 *   - microCMS 不使用・静的（鉄則#2/#98）。一覧/本文は SSR で初期HTML描画（#103）。
 *   - 特定回避（匿名・k匿名）: 所在=地方ブロック、規模/時期=概括化、住所・座標・実日付なし。
 *   - 法務: 中立・取り次ぎ／コンサル（媒介・代理しない・有償化方針）。CTA は外部 eic-jp.org/contact。
 *   - intent別CTA（買→/anken/buy・売→/anken/sell・相談→contact）＋下層4本へ導線。
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AnkenContactCTA from '@/components/AnkenContactCTA';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '蓄電所の流通案件（全国）｜売買・連系枠確保済案件の取り次ぎ',
  description:
    '全国の蓄電所開発案件（連系枠確保済の2MW/8MWh級中心）を匿名でご紹介。買いたい・売りたい・相談したい方へ、一般社団法人エネルギー情報センターが中立的に案件元へお取り次ぎします。',
  robots: { index: true, follow: true },
  alternates: { canonical: '/anken' },
  openGraph: {
    title: '蓄電所の流通案件（全国）｜売買・連系枠確保済案件の取り次ぎ | 蓄電所ネット',
    description:
      '全国の蓄電所開発案件を匿名でご紹介。買いたい・売りたい・相談したい方へ、中立的に案件元へお取り次ぎ。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

// ─────────────────────────────────────────────────────────────
// 固定10件データ（静的配列 / microCMS 不使用）— 中部エリアの抜粋例
// 特定回避: 所在=地方ブロック、規模/時期=概括化、実日付・座標なし
// ─────────────────────────────────────────────────────────────
type AnkenRow = {
  id: string; area: string; scale: string; chikumoku: string;
  kukaku: string; hazard: string; status: string; renkei: string;
};

const ANKEN_DATA: AnkenRow[] = [
  { id: 'A', area: '中部', scale: '約2MW/8MWh', chikumoku: '宅地系',         kukaku: '都市計画区域外',    hazard: '特記なし',       status: '土地契約済・連系枠確保進行',   renkei: '〜6ヶ月' },
  { id: 'B', area: '中部', scale: '約2MW/8MWh', chikumoku: '農地系',         kukaku: '市街化調整区域',    hazard: '要確認（土砂）', status: '土地契約済・農地転用申請中',   renkei: '6〜12ヶ月' },
  { id: 'C', area: '中部', scale: '約2MW/8MWh', chikumoku: '山林・原野系',   kukaku: '市街化調整区域',    hazard: '要確認（砂防）', status: '土地契約済・負担金入金済',     renkei: '12ヶ月超' },
  { id: 'D', area: '中部', scale: '約2MW/8MWh', chikumoku: '農地系',         kukaku: '市街化調整区域',    hazard: '特記なし',       status: '土地契約済・連系枠確保進行',   renkei: '6〜12ヶ月' },
  { id: 'E', area: '中部', scale: '約2MW/8MWh', chikumoku: '宅地/雑種地系',  kukaku: '都市計画区域外',    hazard: '特記なし',       status: '土地契約済・連系枠確保進行',   renkei: '〜6ヶ月' },
  { id: 'F', area: '中部', scale: '約2MW/8MWh', chikumoku: '山林系',         kukaku: '市街化調整区域',    hazard: '特記なし',       status: '土地契約済・負担金入金済',     renkei: '12ヶ月超' },
  { id: 'G', area: '中部', scale: '約2MW/8MWh', chikumoku: '農地・山林混在', kukaku: '都市計画区域外',    hazard: '要確認（洪水）', status: '土地契約済・連系枠確保進行',   renkei: '12ヶ月超' },
  { id: 'H', area: '中部', scale: '約2MW/8MWh', chikumoku: '雑種地系',       kukaku: '市街化調整区域',    hazard: '特記なし',       status: '土地契約済・連系枠確保進行',   renkei: '6〜12ヶ月' },
  { id: 'I', area: '中部', scale: '約2MW/8MWh', chikumoku: '宅地系',         kukaku: '都市計画区域外',    hazard: '特記なし',       status: '土地契約済・負担金入金済',     renkei: '〜6ヶ月' },
  { id: 'J', area: '中部', scale: '約2MW/8MWh', chikumoku: '農地系',         kukaku: '市街化調整区域',    hazard: '要確認（土砂）', status: '土地契約済・農地転用申請中',   renkei: '12ヶ月超' },
];

// 他エリアの案件イメージ（サンプル例・実在の特定案件ではない＝L-EIC-019）
// 市場で想定される典型パターンを匿名・概括化して例示（座標・住所・実日付なし）。
type SampleRow = { area: string; scale: string; chikumoku: string; kukaku: string; status: string; renkei: string };
const SAMPLE_DATA: SampleRow[] = [
  { area: '北海道', scale: '約2MW/8MWh', chikumoku: '山林系',         kukaku: '都市計画区域外', status: '連系枠確保進行',   renkei: '12ヶ月超' },
  { area: '北海道', scale: '約2MW/8MWh', chikumoku: '農地系',         kukaku: '市街化調整区域', status: '負担金入金済',     renkei: '6〜12ヶ月' },
  { area: '東北',   scale: '約2MW/8MWh', chikumoku: '農地系',         kukaku: '市街化調整区域', status: '農地転用申請中',   renkei: '6〜12ヶ月' },
  { area: '東北',   scale: '約2MW/8MWh', chikumoku: '宅地系',         kukaku: '都市計画区域外', status: '連系枠確保進行',   renkei: '〜6ヶ月' },
  { area: '関東',   scale: '約2MW/8MWh', chikumoku: '宅地/雑種地系',  kukaku: '市街化調整区域', status: '連系枠確保進行',   renkei: '〜6ヶ月' },
  { area: '関東',   scale: '約2MW/8MWh', chikumoku: '雑種地系',       kukaku: '都市計画区域外', status: '負担金入金済',     renkei: '6〜12ヶ月' },
  { area: '北陸',   scale: '約2MW/8MWh', chikumoku: '農地系',         kukaku: '市街化調整区域', status: '連系枠確保進行',   renkei: '6〜12ヶ月' },
  { area: '関西',   scale: '約2MW/8MWh', chikumoku: '宅地系',         kukaku: '都市計画区域外', status: '連系枠確保進行',   renkei: '〜6ヶ月' },
  { area: '関西',   scale: '約2MW/8MWh', chikumoku: '山林系',         kukaku: '市街化調整区域', status: '連系枠確保進行',   renkei: '12ヶ月超' },
  { area: '中国',   scale: '約2MW/8MWh', chikumoku: '農地・山林混在', kukaku: '都市計画区域外', status: '負担金入金済',     renkei: '12ヶ月超' },
  { area: '四国',   scale: '約2MW/8MWh', chikumoku: '農地系',         kukaku: '市街化調整区域', status: '農地転用申請中',   renkei: '6〜12ヶ月' },
  { area: '九州',   scale: '約2MW/8MWh', chikumoku: '宅地系',         kukaku: '都市計画区域外', status: '連系枠確保進行',   renkei: '〜6ヶ月' },
  { area: '九州',   scale: '約2MW/8MWh', chikumoku: '山林系',         kukaku: '市街化調整区域', status: '負担金入金済',     renkei: '12ヶ月超' },
];

function statusColor(status: string): string {
  if (status.includes('負担金入金済')) return '#15803d';
  if (status.includes('連系枠確保進行')) return '#0369a1';
  if (status.includes('農地転用')) return '#b45309';
  return '#374151';
}

// 分布サマリー（中部抜粋例の匿名集計。個別特定なし）
function countBy(keyer: (r: AnkenRow) => string): { label: string; n: number }[] {
  const m = new Map<string, number>();
  for (const r of ANKEN_DATA) m.set(keyer(r), (m.get(keyer(r)) ?? 0) + 1);
  return [...m.entries()].map(([label, n]) => ({ label, n })).sort((a, b) => b.n - a.n);
}
function chikumokuGroup(c: string): string {
  if (c.includes('農地') || c.includes('山林') || c.includes('原野')) {
    if (c.includes('宅地') || c.includes('雑種')) return '混在系';
    return c.includes('農地') ? '農地系' : '山林系';
  }
  return '宅地・雑種地系';
}

const ACCENT = 'var(--color-accent,#00B5A5)';
const NAVY = 'var(--color-navy,#0F2D4F)';

function DistroBar({ title, items }: { title: string; items: { label: string; n: number }[] }) {
  const total = items.reduce((s, i) => s + i.n, 0) || 1;
  return (
    <div style={{ background: 'var(--color-bg-card,#fff)', border: '1px solid var(--color-border)', borderRadius: 8, padding: 14 }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 10px', color: NAVY }}>{title}</h3>
      {items.map((i) => (
        <div key={i.label} style={{ marginBottom: 7 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 2 }}>
            <span>{i.label}</span><span style={{ color: 'var(--color-muted)' }}>{i.n}件</span>
          </div>
          <div style={{ height: 6, background: 'var(--color-bg,#f1f5f9)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${(i.n / total) * 100}%`, height: '100%', background: ACCENT }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function IntentCard({ href, external, title, note }: { href: string; external?: boolean; title: string; note: string }) {
  const inner = (
    <div style={{ padding: 20, height: '100%', background: 'var(--color-bg-card,#fff)', border: `1px solid var(--color-border)`, borderTop: `3px solid ${ACCENT}`, borderRadius: 8 }}>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px', color: NAVY }}>{title}</h3>
      <p style={{ fontSize: 15, color: 'var(--color-muted)', margin: 0 }}>{note}</p>
      <p style={{ marginTop: 12, fontSize: 15, fontWeight: 700, color: ACCENT }}>進む →</p>
    </div>
  );
  return external ? (
    <AnkenContactCTA location="hero" kind="inline" style={{ textDecoration: 'none', display: 'block', height: '100%' }}>{inner}</AnkenContactCTA>
  ) : (
    <Link href={href} style={{ textDecoration: 'none', color: 'inherit', display: 'block', height: '100%' }}>{inner}</Link>
  );
}

const card: CSSProperties = { padding: 20, background: 'var(--color-bg-card,#fff)', border: '1px solid var(--color-border)', borderRadius: 8 };

export default function AnkenPage() {
  const dStatus = countBy((r) => r.status.replace('土地契約済・', ''));
  const dRenkei = countBy((r) => r.renkei);
  const dChikumoku = countBy((r) => chikumokuGroup(r.chikumoku));

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 流通案件
          </p>

          {/* 1. ヒーロー */}
          <div className="section-label">流通案件 ／ 売買・取り次ぎ（中立）</div>
          <h1 className="section-title">全国の蓄電所流通案件 ─ 売買・連系枠確保済案件のお取り次ぎ</h1>
          <p className="section-desc anken-prose" style={{ marginBottom: 24, lineHeight: 1.85, marginLeft: 0 }}>
            連系枠の確保が進む2MW/8MWh級を中心に、全国の蓄電所開発案件が流通しています。買いたい・売りたい・まず相談したい
            ——蓄電所ネット（<strong>一般社団法人エネルギー情報センター</strong>運営）が、<strong>中立的に</strong>案件元へお取り次ぎします。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 14, marginBottom: 44 }}>
            <IntentCard href="/anken/buy" title="案件を買いたい・取得したい" note="投資家・新規参入・EPC・地主の方" />
            <IntentCard href="/anken/sell" title="用地・案件を売りたい・譲渡したい" note="地主・開発事業者の方" />
            <IntentCard href="#" external title="まず相談したい" note="守秘でお取り次ぎ" />
          </div>

          {/* 2. 蓄電所ネットができること */}
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 16 }}>蓄電所ネットができること</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 14, marginBottom: 44 }}>
            <div style={card}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: NAVY }}>案件のご紹介</h3>
              <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0 }}>全国・連系枠確保済中心の開発案件。特定回避のため匿名で傾向を公開し、詳細はお問い合わせ時に案件元へお取り次ぎします。</p>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: NAVY }}>売買のお取り次ぎ</h3>
              <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0 }}>買い手・売り手の双方をつなぐ窓口です。宅地建物取引の媒介・代理は行いません（情報提供・お取り次ぎ・コンサルティング）。</p>
            </div>
            <div style={card}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: NAVY }}>専門相談</h3>
              <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0 }}>連系枠・農地転用・区域区分・資金スキーム・中古/リユース蓄電池の活用まで、業界ハブとして幅広くご相談に対応します。</p>
            </div>
          </div>

          {/* 3. 市場動向（匿名集計）+ 抜粋テーブル */}
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 6 }}>市場動向（匿名集計）</h2>
          <p style={{ fontSize: 15, color: ACCENT, fontWeight: 600, marginBottom: 16 }}>対応エリア：全国 ／ 下表・下記分布は中部エリアの抜粋例</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 20 }}>
            <DistroBar title="規模" items={[{ label: '2MW/8MWh級中心', n: ANKEN_DATA.length }]} />
            <DistroBar title="ステータス" items={dStatus} />
            <DistroBar title="連系目安" items={dRenkei} />
            <DistroBar title="地目" items={dChikumoku} />
          </div>

          <section style={{ marginBottom: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 12 }}>中部エリアの抜粋例</h3>
            <div className="subsidy-table-wrapper">
              <table className="subsidy-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>ID</th><th>エリア</th>
                    <th style={{ whiteSpace: 'nowrap' }}>規模</th><th>地目</th>
                    <th style={{ whiteSpace: 'nowrap' }}>区域区分</th><th>ハザード</th>
                    <th>ステータス</th><th style={{ whiteSpace: 'nowrap' }}>連系目安</th>
                  </tr>
                </thead>
                <tbody>
                  {ANKEN_DATA.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 700, color: NAVY, textAlign: 'center' }}>{row.id}</td>
                      <td>{row.area}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 15 }}>{row.scale}</td>
                      <td style={{ fontSize: 15 }}>{row.chikumoku}</td>
                      <td style={{ fontSize: 15 }}>{row.kukaku}</td>
                      <td style={{ fontSize: 15 }}>
                        {row.hazard === '特記なし'
                          ? <span style={{ color: '#9ca3af' }}>{row.hazard}</span>
                          : <span style={{ color: '#b45309', fontWeight: 600 }}>{row.hazard}</span>}
                      </td>
                      <td style={{ fontSize: 15, color: statusColor(row.status) }}>{row.status}</td>
                      <td style={{ fontSize: 15, whiteSpace: 'nowrap' }}>{row.renkei}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="anken-prose" style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 44, marginLeft: 0 }}>
            ※ 本表・分布は全国の取扱案件のうち中部エリアの抜粋・参考情報です。各案件の募集状況・条件は変動します。特定回避の
            ため概括化しており、個別の正確な情報や他エリア（北海道〜九州）の案件はお問い合わせ時にご確認ください。
          </p>

          {/* 各エリアの案件イメージ（サンプル例・実在ではない＝L-EIC-019）*/}
          <section style={{ marginBottom: 8 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: NAVY, marginBottom: 6 }}>各エリアの案件イメージ（サンプル例）</h3>
            <p className="anken-prose" style={{ fontSize: 15.5, color: '#b45309', lineHeight: 1.7, marginBottom: 12, fontWeight: 600, marginLeft: 0 }}>
              ※ 中部エリア以外は、市場で想定される案件像を示すサンプル例です（実在の特定案件・正確な情報ではありません）。中部は実取扱案件の匿名抜粋です。実際の案件・他エリアの取扱はお問い合わせ時にご確認ください。
            </p>
            <div className="subsidy-table-wrapper">
              <table className="subsidy-table">
                <thead>
                  <tr>
                    <th>エリア</th>
                    <th style={{ whiteSpace: 'nowrap' }}>規模</th><th>地目</th>
                    <th style={{ whiteSpace: 'nowrap' }}>区域区分</th>
                    <th>ステータス（典型）</th><th style={{ whiteSpace: 'nowrap' }}>連系目安</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_DATA.map((row, i) => (
                    <tr key={`${row.area}-${i}`}>
                      <td style={{ fontWeight: 600, color: NAVY }}>{row.area}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 15 }}>{row.scale}</td>
                      <td style={{ fontSize: 15 }}>{row.chikumoku}</td>
                      <td style={{ fontSize: 15 }}>{row.kukaku}</td>
                      <td style={{ fontSize: 15, color: statusColor(row.status) }}>{row.status}</td>
                      <td style={{ fontSize: 15, whiteSpace: 'nowrap' }}>{row.renkei}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <p className="anken-prose" style={{ fontSize: 15, color: '#6b7280', lineHeight: 1.7, marginBottom: 44, marginLeft: 0 }}>
            ※ 上記サンプル例は特定の実在案件を示すものではなく、匿名・概括化した一般的な傾向の例示です（座標・住所・実日付は含みません）。
          </p>

          {/* 4. ユースケース 3列×各3 */}
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 16 }}>こんな相談に乗れます</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 14, marginBottom: 44 }}>
            {[
              { h: '買いたい', items: ['連系枠確保済案件を探したい', '投資基準に合う規模を知りたい', 'EPC・運用先を紹介してほしい'], cta: <Link href="/anken/buy" style={{ color: ACCENT, fontWeight: 700 }}>購入の相談 →</Link> },
              { h: '売りたい', items: ['用地・開発中案件を売却したい', '事業譲渡の相手を探したい', '適正な相場感を知りたい'], cta: <Link href="/anken/sell" style={{ color: ACCENT, fontWeight: 700 }}>売却の相談 →</Link> },
              { h: '相談したい', items: ['連系枠・農地転用・区域区分の進め方', '資金・事業スキーム', '中古・リユース蓄電池の活用'], cta: <AnkenContactCTA location="usecase-consult" kind="inline">相談する →</AnkenContactCTA> },
            ].map((col) => (
              <div key={col.h} style={card}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 10px', color: NAVY }}>{col.h}</h3>
                <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 18, margin: '0 0 12px' }}>
                  {col.items.map((it) => <li key={it}>{it}</li>)}
                </ul>
                {col.cta}
              </div>
            ))}
          </div>

          {/* 5. お取り次ぎの流れ（要約）*/}
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 16 }}>お取り次ぎの流れ</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12, marginBottom: 12 }}>
            {[
              ['①お問い合わせ', '買い/売り/相談の内容をお送りください'],
              ['②お取り次ぎ', '蓄電所ネットが内容を確認し案件元へ取り次ぎ'],
              ['③直接ご商談', '案件元と直接ご商談いただきます'],
              ['④当事者間で成約', '成約は当事者間。当サイトは媒介・代理を行いません・守秘'],
            ].map(([h, d]) => (
              <div key={h} style={{ ...card, borderTop: `3px solid ${ACCENT}` }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: NAVY, marginBottom: 4 }}>{h}</div>
                <div style={{ fontSize: 15, color: 'var(--color-muted)', lineHeight: 1.7 }}>{d}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 15, marginBottom: 8 }}>
            <Link href="/anken/flow" style={{ color: ACCENT, fontWeight: 700 }}>詳しくは お取り次ぎの流れ →</Link>
          </p>
          <p className="anken-prose" style={{ fontSize: 15, color: 'var(--color-muted)', lineHeight: 1.7, marginTop: 0, marginBottom: 44, marginLeft: 0 }}>
            ご相談・お取り次ぎの費用は、ご相談内容に応じて個別にご案内します。
          </p>

          {/* 6. FAQ 抜粋 */}
          <h2 style={{ fontSize: 22, fontWeight: 700, color: NAVY, marginBottom: 16 }}>よくある質問</h2>
          <div className="anken-prose" style={{ marginBottom: 12, marginLeft: 0 }}>
            {[
              ['なぜ詳細が載っていないの？', '個別特定を避けるため匿名・概括化しています。詳細はお問い合わせ時に案件元へお取り次ぎします。'],
              ['買い手・売り手どちらも相談できる？', 'どちらも可能です。全国対応で中立にお取り次ぎします。'],
            ].map(([q, a]) => (
              <div key={q} style={{ ...card, marginBottom: 10 }}>
                <p style={{ fontWeight: 700, margin: '0 0 4px', color: NAVY }}>Q. {q}</p>
                <p style={{ fontSize: 15, lineHeight: 1.8, margin: 0 }}>A. {a}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 15, marginBottom: 44 }}>
            <Link href="/anken/faq" style={{ color: ACCENT, fontWeight: 700 }}>もっと見る → よくある質問</Link>
          </p>

          {/* 7. 信頼シグナル */}
          <section style={{ ...card, background: 'var(--color-bg,#f8fafc)', marginBottom: 44 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: NAVY, marginTop: 0, marginBottom: 10 }}>蓄電所ネットの信頼</h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, marginTop: 0 }}>
              <strong>一般社団法人エネルギー情報センター</strong>が運営する中立的な業界ハブです。中立・守秘・全国対応でお取り次ぎします。
              案件のご紹介は、当サイトが整備する以下のデータ基盤を背景としています。
            </p>
            <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/grid">系統データ（全国 8,225 変電所地点）</Link></li>
              <li><Link href="/operators">事業者データベース（544 社）</Link></li>
              <li><Link href="/projects">蓄電所プロジェクト（263 件）</Link></li>
            </ul>
          </section>

          {/* 8. 最終CTA */}
          <section style={{ background: NAVY, borderRadius: 12, padding: '32px 28px', color: '#fff', marginBottom: 44 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#fff' }}>具体的な案件の照会・ご相談はこちら</h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 24, color: '#cbd5e1' }}>
              具体的な案件の照会、売却・購入のご相談はお問い合わせから。蓄電所ネットが中立的に案件元へお取り次ぎします。
            </p>
            <AnkenContactCTA location="footer">具体的な案件の照会・売却/購入のご相談はこちら →</AnkenContactCTA>
          </section>

          {/* 免責（本文そのまま）*/}
          <section style={{ ...card, marginBottom: 16 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>免責</h2>
            <small className="anken-prose" style={{ fontSize: 13.5, lineHeight: 1.85, color: 'var(--color-muted)', display: 'block', marginLeft: 0 }}>
              本ページは蓄電所ネットが把握した市場動向の参考情報です。特定回避のため概括化しており、住所・座標・契約日等は掲載していません。
              蓄電所ネット（一般社団法人エネルギー情報センター）は中立的な情報提供および案件元へのお取り次ぎ・コンサルティングを行うもので、宅地建物取引の媒介・代理は行いません。
              取引条件は案件元と直接ご確認ください。最新の募集状況は変動します。
            </small>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
