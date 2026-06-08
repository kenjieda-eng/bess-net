/**
 * /ops/freshness — 運用者向け鮮度ダッシュボード（noindex）
 *
 * 表示内容:
 *   ① 13 SOP の次回更新予定日（過去なら赤ハイライト）
 *   ② catalog SLA 違反集計（precompute 経由）
 *
 * 公開: しない（robots.txt で Disallow、metadata で noindex）
 * 鉄則: SSR 外部 API 0（catalog JSON 直読みのみ）
 */

import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { SOP_ENTRIES, FREQ_LABEL, nextScheduledAt } from '@/lib/sop-schedule';
import catalogData from '@/data/eic/catalog.json';

export const revalidate = 3600; // 1 時間

export const metadata: Metadata = {
  title: '運用鮮度ダッシュボード（運用者向け・非公開）',
  description: '13 SOP の次回更新予定日＋catalog SLA 違反集計。noindex。',
  robots: { index: false, follow: false },
  alternates: { canonical: '/ops/freshness' },
};

interface CatalogIndicator {
  id: string;
  name?: string;
  freshness_sla_days?: number;
  updated_at?: string;
  observation_cutoff?: string;
}

function daysSince(iso?: string): number | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / (1000 * 60 * 60 * 24));
}

function isOverdue(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).getTime() < Date.now();
}

export default function OpsFreshnessPage() {
  const now = new Date();
  const indicators = (catalogData as { indicators: CatalogIndicator[] }).indicators ?? [];

  // catalog SLA 違反集計
  const slaViolations = indicators.filter((i) => {
    if (!i.freshness_sla_days) return false;
    const ds = daysSince(i.observation_cutoff || i.updated_at);
    return ds !== null && ds > i.freshness_sla_days;
  });

  // SOP entries
  const sopRows = SOP_ENTRIES.map((e) => ({
    ...e,
    next: nextScheduledAt(e, now),
  }));

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1024 }}>
          <p className="article-breadcrumb">
            <a href="/">トップ</a> / 運用 / 鮮度ダッシュボード
          </p>
          <div className="section-label">運用者向け（非公開・noindex）</div>
          <h1 className="section-title">運用鮮度ダッシュボード</h1>
          <p className="section-desc" style={{ marginBottom: 24, lineHeight: 1.7 }}>
            13 SOP の次回更新予定日と catalog SLA 違反を一覧化。週次・月次・四半期・半期の更新タイミングを scheduled task 6 本が自動リマインドします（SOP 設計 v1 / D-018 半自動化）。
          </p>

          {/* ─── SOP 次回更新予定 ─── */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-navy,#0F2D4F)', marginBottom: 12 }}>
              13 SOP 次回更新予定日（{sopRows.length} 件）
            </h2>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead style={{ background: 'var(--color-navy,#0F2D4F)', color: '#fff' }}>
                  <tr>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>コンテンツ</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>頻度</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>担当</th>
                    <th style={{ padding: '8px 10px', textAlign: 'left' }}>次回更新予定</th>
                  </tr>
                </thead>
                <tbody>
                  {sopRows.map((r) => {
                    const overdue = isOverdue(r.next);
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border,#e5e7eb)' }}>
                        <td style={{ padding: '7px 10px' }}>
                          <a href={r.url} style={{ color: 'var(--color-accent,#00B5A5)' }}>{r.label}</a>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{r.url}</div>
                        </td>
                        <td style={{ padding: '7px 10px' }}>{FREQ_LABEL[r.frequency]}</td>
                        <td style={{ padding: '7px 10px' }}>{r.persona}</td>
                        <td style={{ padding: '7px 10px', color: overdue ? '#b91c1c' : '#374151', fontWeight: overdue ? 700 : 400 }}>
                          {r.next ? new Date(r.next).toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '随時'}
                          {overdue && <span style={{ marginLeft: 6, fontSize: 11 }}>⚠ 期限超過</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ─── catalog SLA 違反 ─── */}
          <section style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--color-navy,#0F2D4F)', marginBottom: 12 }}>
              catalog SLA 違反（{slaViolations.length} / {indicators.length} 件）
            </h2>
            {slaViolations.length === 0 ? (
              <p style={{ color: '#15803d', fontSize: 14 }}>✅ 違反なし（catalog {indicators.length} 系列、全て SLA 内）</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead style={{ background: '#b91c1c', color: '#fff' }}>
                    <tr>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>系列 ID</th>
                      <th style={{ padding: '8px 10px', textAlign: 'left' }}>名前</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>SLA(日)</th>
                      <th style={{ padding: '8px 10px', textAlign: 'right' }}>経過(日)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slaViolations.map((v) => {
                      const ds = daysSince(v.observation_cutoff || v.updated_at) ?? 0;
                      return (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--color-border,#e5e7eb)' }}>
                          <td style={{ padding: '7px 10px', fontFamily: 'monospace', fontSize: 12 }}>{v.id}</td>
                          <td style={{ padding: '7px 10px' }}>{v.name ?? '—'}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right' }}>{v.freshness_sla_days}</td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: '#b91c1c', fontWeight: 700 }}>{ds}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* ─── 注記 ─── */}
          <section style={{ padding: '14px 16px', background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 8, fontSize: 12, color: '#6b7280', lineHeight: 1.7 }}>
            <strong style={{ color: '#374151' }}>運用ノート</strong>
            <br />
            ・本ページは <code>noindex</code> + robots.txt Disallow で一般公開しない。
            <br />
            ・SOP 詳細は <code>02_計画・運営/既存コンテンツSOP設計v1_全13本+運用実装_2026-05-30.md</code>。
            <br />
            ・scheduled task 6 本（Cowork）が自動でリマインダーを送る（D-018 半自動化）。
            <br />
            ・revalidate = 3600（1時間キャッシュ）。
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
