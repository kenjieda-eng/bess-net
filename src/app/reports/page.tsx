/**
 * /reports — レポート index
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'レポート (業界レポート 年次)',
  description: '蓄電所業界の年次レポートを公開予定。業界レポート2026 (7月予定)。',
  alternates: { canonical: '/reports' },
};

export default function ReportsIndexPage() {
  return (
    <>
      <SiteHeader />
      <main className="section">
        {/* Tier 2/3 UI 統一: 分類 C 記事系 max-w 896 */}
        <div className="section-inner" style={{ maxWidth: 896 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / レポート
          </p>
          <h1 className="section-title">業界レポート</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 24, lineHeight: 1.7 }}>
            蓄電所業界の年次レポートを公開予定。業界唯一機能で蓄積したデータを編集統合します。
          </p>

          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{
              padding: 16, border: '1px solid var(--color-border)', borderRadius: 8, marginBottom: 12,
            }}>
              <div style={{ fontSize: 11, color: '#c70', fontWeight: 700, marginBottom: 4 }}>準備中 · 2026年7月公開予定</div>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
                <Link href="/reports/2026">業界レポート2026 (蓄電所事業 年次レポート)</Link>
              </h2>
              <p style={{ fontSize: 13, lineHeight: 1.7, margin: 0, color: 'var(--color-muted)' }}>
                市場規模 / 政策動向 / 主要プレイヤー / 系統 / 火災・トラブル / 海外比較 を集約した業界初の年次レポート。
                プレビュー版を公開中、本編は順次。
              </p>
            </li>
          </ul>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
