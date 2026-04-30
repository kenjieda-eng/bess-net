import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllSubsidies, type Subsidy } from '@/lib/microcms';

export const revalidate = 600; // 10分

export const metadata: Metadata = {
  title: '補助金カレンダー',
  description:
    '系統用蓄電池および低圧リソース事業向けの主要補助金を、執行機関別・公募期間別に整理。経産省・エネ庁・SII・NEDO・自治体の蓄電池関連補助金を継続トラック。',
};

const STATUS_ORDER = ['公募中', '予告', '採択済', '終了', 'その他'];

function groupByStatus(items: Subsidy[]) {
  const groups: Record<string, Subsidy[]> = {};
  for (const item of items) {
    const status = (item.status && item.status[0]) || 'その他';
    if (!groups[status]) groups[status] = [];
    groups[status].push(item);
  }
  const ordered: Array<{ status: string; items: Subsidy[] }> = [];
  for (const s of STATUS_ORDER) {
    if (groups[s]) {
      ordered.push({ status: s, items: groups[s] });
      delete groups[s];
    }
  }
  for (const s of Object.keys(groups)) {
    ordered.push({ status: s, items: groups[s] });
  }
  return ordered;
}

function fmtAmount(n?: number): string {
  if (!n) return '—';
  if (n >= 100000000) return `${(n / 100000000).toFixed(0)}億円`;
  if (n >= 10000) return `${(n / 10000).toFixed(0)}万円`;
  return `${n.toLocaleString()}円`;
}

function fmtDate(s?: string): string {
  if (!s) return '—';
  return s.replace(/^(\d{4})-(\d{2})-(\d{2}).*$/, '$1/$2/$3');
}

export default async function SubsidiesListPage() {
  let items: Subsidy[] = [];
  try {
    items = await getAllSubsidies();
  } catch (e) {
    // API未設定時は空表示
  }
  const grouped = groupByStatus(items);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 補助金カレンダー
          </p>
          <div className="section-label">Subsidies Calendar</div>
          <h1 className="section-title">補助金カレンダー</h1>
          <p className="section-desc" style={{ marginBottom: 24 }}>
            系統用蓄電池および低圧リソース事業に活用できる主要補助金を、執行機関・公募期間で整理しています。
          </p>
          <p className="page-meta" style={{ marginTop: 0, marginBottom: 32, paddingTop: 0, borderTop: 'none' }}>
            ※ 公募期間・補助率・対象は年度毎に変更されます。最新情報は各執行機関の公式サイトでご確認ください。
          </p>

          {items.length === 0 ? (
            <div className="empty-state">
              <p>補助金データはまだ準備中です。</p>
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--color-muted)' }}>
                microCMSへの API 設置完了後、初期20件を投入予定です。
              </p>
            </div>
          ) : (
            grouped.map((g) => (
              <section key={g.status} className="subsidy-status-section">
                <h2 className={`subsidy-status-title status-${g.status === '公募中' ? 'open' : g.status === '予告' ? 'upcoming' : 'closed'}`}>
                  {g.status}（{g.items.length}件）
                </h2>
                <div className="subsidy-table-wrapper">
                  <table className="subsidy-table">
                    <thead>
                      <tr>
                        <th>補助金名</th>
                        <th>執行機関</th>
                        <th>補助率</th>
                        <th>上限額</th>
                        <th>公募期間</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <Link href={`/subsidies/${item.slug}`} className="subsidy-link">
                              {item.name}
                            </Link>
                          </td>
                          <td>{item.organization}</td>
                          <td>{item.subsidyRate || '—'}</td>
                          <td>{fmtAmount(item.maxAmount)}</td>
                          <td>
                            {fmtDate(item.applicationStart)} 〜<br />
                            {fmtDate(item.applicationEnd)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))
          )}

          <p className="back-link">
            <Link href="/">← トップへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
