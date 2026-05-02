import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllProjects, type Project } from '@/lib/microcms';

export const revalidate = 600;

export const metadata: Metadata = {
  title: 'プロジェクトデータベース',
  description:
    '国内の系統用蓄電池プロジェクトを公開情報ベースで一元管理。容量・所在地・事業者・ステータス・運転開始時期・市場参加形態を構造化して提供します。',
};

const STATUS_ORDER = ['稼働中', '建設中', '接続検討中', '計画中', '廃止'];

function groupByStatus(items: Project[]) {
  const groups: Record<string, Project[]> = {};
  for (const item of items) {
    const status = (item.status && item.status[0]) || 'その他';
    if (!groups[status]) groups[status] = [];
    groups[status].push(item);
  }
  const ordered: Array<{ status: string; items: Project[] }> = [];
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

function fmtMW(n?: number) {
  return n != null ? `${n.toLocaleString()} MW` : '—';
}

function fmtMWh(n?: number) {
  return n != null ? `${n.toLocaleString()} MWh` : '—';
}

export default async function ProjectsListPage() {
  let items: Project[] = [];
  try {
    items = await getAllProjects();
  } catch {
    // API未設定時は空表示
  }

  const totalMW = items.reduce((s, i) => s + (i.outputMw || 0), 0);
  const totalMWh = items.reduce((s, i) => s + (i.capacityMwh || 0), 0);
  const grouped = groupByStatus(items);

  return (
    <>
      <SiteHeader />
      <main className="section">
        <div className="section-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / プロジェクトDB
          </p>
          <div className="section-label">Projects Database</div>
          <h1 className="section-title">日本の蓄電所プロジェクトDB</h1>
          <p className="section-desc" style={{ marginBottom: 24 }}>
            国内の系統用蓄電池プロジェクトを公開情報ベースで一元管理しています。
          </p>

          {items.length > 0 && (
            <div className="project-stats">
              <div className="stat-card">
                <div className="stat-num">{items.length}</div>
                <div className="stat-label">掲載件数</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{totalMW.toLocaleString()}</div>
                <div className="stat-label">合計出力 MW</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{totalMWh.toLocaleString()}</div>
                <div className="stat-label">合計容量 MWh</div>
              </div>
            </div>
          )}

          <p className="page-meta" style={{ marginTop: 0, marginBottom: 32, paddingTop: 0, borderTop: 'none' }}>
            ※ 本DBは各社プレスリリース・公開資料・電力会社の公表情報に基づき構造化したものです。最新情報は事業者の公式情報でご確認ください。
          </p>

          {items.length === 0 ? (
            <div className="empty-state">
              <p>プロジェクトデータはまだ準備中です。</p>
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--color-muted)' }}>
                公開情報のリサーチを経て、Sprint 1終了までに10件以上の初期データを公開予定です。
              </p>
            </div>
          ) : (
            grouped.map((g) => (
              <section key={g.status} className="project-status-section">
                <h2 className={`subsidy-status-title status-${g.status === '稼働中' ? 'open' : g.status === '建設中' ? 'upcoming' : 'closed'}`}>
                  {g.status}（{g.items.length}件）
                </h2>
                <div className="subsidy-table-wrapper">
                  <table className="subsidy-table">
                    <thead>
                      <tr>
                        <th>プロジェクト名</th>
                        <th>所在地</th>
                        <th>出力</th>
                        <th>容量</th>
                        <th>事業者</th>
                        <th>運開予定</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <Link href={`/projects/${item.slug}`} className="subsidy-link">
                              {item.name}
                            </Link>
                          </td>
                          <td>
                            {item.prefecture}
                            {item.city && ` ${item.city}`}
                          </td>
                          <td>{fmtMW(item.outputMw)}</td>
                          <td>{fmtMWh(item.capacityMwh)}</td>
                          <td>{item.operator || '—'}</td>
                          <td>{item.cod || '—'}</td>
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
