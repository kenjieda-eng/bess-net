/**
 * /anken — 蓄電所 流通案件の例（市場動向・匿名）
 *
 * 設計方針:
 *   - microCMS 不使用。固定10件を静的配列で保持（外部API呼び出し0）
 *   - 特定回避: 所在=地方ブロック / 規模・時期=概括化 / 実日付・住所・座標なし / 行順不同
 *   - 景表法配慮: 日付改変掲載なし、ステータス表示のみ
 *   - 中立・無償・取り次ぎ明記
 *
 * robots: noindex,follow（初期設定）
 *   ★ 掲載許諾の確定後に index:true へ変更のこと
 *   （metadata.robots = { index: true, follow: true } に書き換える）
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: '蓄電所の流通案件 例（連系枠確保済・中部）｜市場動向 | 蓄電所ネット',
  description:
    '蓄電所ネット編集部が把握する、いま動いている開発案件の傾向。連系枠確保済の約2MW/8MWh案件が中部で十数件規模という足元の温度感を、匿名・概括化で参考表示。住所・座標・契約日等は非掲載。',
  // ★ noindex（初期）: 掲載許諾の確定後に index:true へ変更すること
  robots: { index: false, follow: true },
  alternates: { canonical: '/anken' },
  openGraph: {
    title: '蓄電所の流通案件 例（連系枠確保済・中部）｜市場動向',
    description:
      '連系枠確保済の約2MW/8MWh案件が中部で十数件規模。特定回避のため匿名・概括化で参考表示。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

// ─────────────────────────────────────────────────────────────
// 固定10件データ（静的配列 / microCMS 不使用）
// 特定回避: 所在=地方ブロック、規模・時期=概括化、実日付・座標なし
// ─────────────────────────────────────────────────────────────
type AnkenRow = {
  id: string;
  area: string;
  scale: string;
  chikumoku: string;
  kukaku: string;
  hazard: string;
  status: string;
  renkei: string;
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

// ステータス色分けヘルパ
function statusColor(status: string): string {
  if (status.includes('負担金入金済')) return '#15803d';
  if (status.includes('連系枠確保進行')) return '#0369a1';
  if (status.includes('農地転用')) return '#b45309';
  return '#374151';
}

export default function AnkenPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 960 }}>
          {/* パンくず */}
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 流通案件（市場動向）
          </p>

          {/* ラベル */}
          <div className="section-label">市場動向 ／ 参考情報（匿名）</div>

          {/* H1 */}
          <h1 className="section-title">蓄電所の流通案件 例（市場動向）</h1>

          {/* リード文 */}
          <p className="section-desc" style={{ marginBottom: 24, lineHeight: 1.8 }}>
            蓄電所ネット編集部が把握する、いま動いている開発案件の傾向です。下表は実在案件をもとにした
            匿名・参考表示で、特定回避のため所在は地方ブロック、規模・時期は概括化しています
            （住所・座標・契約日等は非掲載）。連系枠の確保が進む約2MW/8MWh級が中部で十数件規模、
            というのが足元の温度感です。
          </p>

          {/* 表 */}
          <section style={{ marginBottom: 8 }}>
            <div className="subsidy-table-wrapper">
              <table className="subsidy-table">
                <thead>
                  <tr>
                    <th style={{ width: 40 }}>ID</th>
                    <th>エリア</th>
                    <th style={{ whiteSpace: 'nowrap' }}>規模</th>
                    <th>地目</th>
                    <th style={{ whiteSpace: 'nowrap' }}>区域区分</th>
                    <th>ハザード</th>
                    <th>ステータス</th>
                    <th style={{ whiteSpace: 'nowrap' }}>連系目安</th>
                  </tr>
                </thead>
                <tbody>
                  {ANKEN_DATA.map((row) => (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 700, color: 'var(--color-navy,#0F2D4F)', textAlign: 'center' }}>
                        {row.id}
                      </td>
                      <td>{row.area}</td>
                      <td style={{ whiteSpace: 'nowrap', fontSize: 13 }}>{row.scale}</td>
                      <td style={{ fontSize: 13 }}>{row.chikumoku}</td>
                      <td style={{ fontSize: 13 }}>{row.kukaku}</td>
                      <td style={{ fontSize: 13 }}>
                        {row.hazard === '特記なし' ? (
                          <span style={{ color: '#9ca3af' }}>{row.hazard}</span>
                        ) : (
                          <span style={{ color: '#b45309', fontWeight: 600 }}>{row.hazard}</span>
                        )}
                      </td>
                      <td style={{ fontSize: 13, color: statusColor(row.status) }}>{row.status}</td>
                      <td style={{ fontSize: 13, whiteSpace: 'nowrap' }}>{row.renkei}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* 注記 */}
          <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.7, marginBottom: 40 }}>
            ※ 本表は市場動向を示す参考情報です。各案件の募集状況・条件は変動します。掲載は実在案件ベースですが
            特定回避のため概括化しており、個別の正確な情報はお問い合わせ時にご確認ください。
          </p>

          {/* CTA */}
          <section
            style={{
              background: 'var(--color-navy,#0F2D4F)',
              borderRadius: 12,
              padding: '32px 28px',
              color: '#fff',
              marginBottom: 48,
            }}
          >
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: '#fff' }}>
              具体的な案件を知りたい方へ
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 24, color: '#cbd5e1' }}>
              案件の照会・売却/購入のご相談はお問い合わせから。蓄電所ネットは中立な情報提供の立場で、
              手数料は頂かず案件元へお取り次ぎします。
            </p>
            <Link
              href="/contact"
              style={{
                display: 'inline-block',
                background: 'var(--color-accent,#00B5A5)',
                color: '#fff',
                padding: '12px 28px',
                borderRadius: 8,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
              }}
            >
              お問い合わせはこちら →
            </Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
