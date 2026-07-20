import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllProjects, type Project } from '@/lib/microcms';
import { LIST_EXCLUDED_PROJECT_SLUGS } from '@/lib/projects-excluded';
import { siteConfig } from '@/lib/site-config';

const siteContactUrl = siteConfig.organization.contactUrl;

export const revalidate = 600;

export const metadata: Metadata = {
  title: '全国の蓄電所プロジェクト一覧（容量・事業者・稼働状況）',
  description:
    '国内の系統用蓄電池プロジェクトを公開情報ベースで一元管理。容量・所在地・事業者・ステータス・運転開始時期・市場参加形態を構造化して提供します。',
  alternates: { canonical: 'https://bess-net.jp/projects' },
};

const STATUS_ORDER = ['稼働中', '建設中', '接続検討中', '計画中', '廃止'];

// 「調査中」(0 値) を各 status グループの最下位にソート (依頼: Phase C)
function sortInvestigatingLast(items: Project[]): Project[] {
  return [...items].sort((a, b) => {
    const aInvestigating = a.outputMw === 0 || a.capacityMwh === 0 ? 1 : 0;
    const bInvestigating = b.outputMw === 0 || b.capacityMwh === 0 ? 1 : 0;
    if (aInvestigating !== bInvestigating) return aInvestigating - bInvestigating;
    // 二次キー: 出力 MW 降順 (信頼可能データの中で大きい順)
    const aMw = a.outputMw ?? 0;
    const bMw = b.outputMw ?? 0;
    return bMw - aMw;
  });
}

function groupByStatus(items: Project[]) {
  const groups: Record<string, Project[]> = {};
  for (const item of items) {
    const status = (item.status && item.status[0]) || 'その他';
    if (!groups[status]) groups[status] = [];
    groups[status].push(item);
  }
  // 各グループ内で「調査中」を最下位に
  for (const s of Object.keys(groups)) {
    groups[s] = sortInvestigatingLast(groups[s]);
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

// 0 MW / 0 MWh を「調査中」と表示 (依頼: /projects データ精査修正 Phase C)
// 公開情報が不足しているプロジェクトの誤情報伝播を防止
function fmtMW(n?: number) {
  if (n == null) return '—';
  if (n === 0) return '調査中';
  return `${n.toLocaleString()} MW`;
}

function fmtMWh(n?: number) {
  if (n == null) return '—';
  if (n === 0) return '調査中';
  return `${n.toLocaleString()} MWh`;
}

// 「調査中」セル用のクラス (CSS で控えめな色に)
function cellClass(n?: number): string {
  return n === 0 ? 'cell-investigating' : '';
}

// 合計値: 0 MW/MWh はカウントから除外 (info-only エントリの誤計上防止)
function sumReliable(items: Project[], key: 'outputMw' | 'capacityMwh'): number {
  return items.reduce((s, i) => {
    const v = i[key];
    return v != null && v > 0 ? s + v : s;
  }, 0);
}

function reliableCount(items: Project[], key: 'outputMw' | 'capacityMwh'): number {
  return items.filter((i) => i[key] != null && (i[key] as number) > 0).length;
}

export default async function ProjectsListPage() {
  let items: Project[] = [];
  try {
    items = await getAllProjects();
  } catch {
    // API未設定時は空表示
  }
  // 非プロジェクト8件＋重複301元6件を一覧/件数/集計から除外（非破壊・301元は middleware が canonical へ301）
  items = items.filter((p) => !LIST_EXCLUDED_PROJECT_SLUGS.has(p.slug));

  // 「調査中」(0 値) を除いた信頼可能な合計のみ集計
  const totalMW = sumReliable(items, 'outputMw');
  const totalMWh = sumReliable(items, 'capacityMwh');
  const reliableMWCount = reliableCount(items, 'outputMw');
  const reliableMWhCount = reliableCount(items, 'capacityMwh');
  const investigatingCount = items.filter((i) => i.outputMw === 0 || i.capacityMwh === 0).length;
  const grouped = groupByStatus(items);

  return (
    <>
      <SiteHeader />
      <main className="section">
        {/* Tier 1 UI 統一: max-w 1320 */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / プロジェクトDB
          </p>
          <div className="section-label">Projects Database</div>
          <h1 className="section-title">日本の蓄電所プロジェクトDB</h1>
          {/* Tier 1 UI 統一 #1: text-base lg:text-lg */}
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 24, lineHeight: 1.7 }}>
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
                <div className="stat-label">合計出力 MW <small style={{ display: 'block', fontWeight: 400, color: 'var(--color-muted)', fontSize: 12 }}>({reliableMWCount} 件分)</small></div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{totalMWh.toLocaleString()}</div>
                <div className="stat-label">合計容量 MWh <small style={{ display: 'block', fontWeight: 400, color: 'var(--color-muted)', fontSize: 12 }}>({reliableMWhCount} 件分)</small></div>
              </div>
            </div>
          )}

          {/* データ品質 disclaimer (依頼: /projects 精査修正 Phase C) */}
          {investigatingCount > 0 && (
            <section style={{
              marginTop: 0, marginBottom: 24, padding: 16,
              background: 'rgba(255,200,0,0.08)', border: '1px solid #c70',
              borderRadius: 6,
            }} aria-label="データ品質に関するご案内">
              <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7 }}>
                ※ 出力 <strong>0 MW</strong> または容量 <strong>0 MWh</strong> と表示されているプロジェクト
                ({investigatingCount} 件) は<strong>「調査中」</strong>として扱い、合計値の集計からも除外しています。
                公開情報が不足しているため、一次情報を確認次第順次更新します。
                情報をお持ちの方は <a href={siteContactUrl} target="_blank" rel="noopener noreferrer">編集部</a> までお寄せください。
              </p>
            </section>
          )}

          <p className="page-meta" style={{ marginTop: 0, marginBottom: 32, paddingTop: 0, borderTop: 'none' }}>
            ※ 本DBは各社プレスリリース・公開資料・電力会社の公表情報に基づき構造化したものです。最新情報は事業者の公式情報でご確認ください。
          </p>

          {items.length === 0 ? (
            <div className="empty-state">
              <p>プロジェクトデータはまだ準備中です。</p>
              <p style={{ marginTop: 8, fontSize: 15, color: 'var(--color-muted)' }}>
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
                          {/* Tier 1 UI 統一 #3: 数値カラムは tabular-nums で桁揃え */}
                          <td className={`tabular-nums ${cellClass(item.outputMw)}`} style={item.outputMw === 0 ? { color: 'var(--color-muted)', fontStyle: 'italic', fontVariantNumeric: 'tabular-nums' } : { fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtMW(item.outputMw)}</td>
                          <td className={`tabular-nums ${cellClass(item.capacityMwh)}`} style={item.capacityMwh === 0 ? { color: 'var(--color-muted)', fontStyle: 'italic', fontVariantNumeric: 'tabular-nums' } : { fontVariantNumeric: 'tabular-nums', fontWeight: 600 }}>{fmtMWh(item.capacityMwh)}</td>
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

          <section style={{
            marginTop: 32, padding: 16,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)', borderRadius: 6,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連 (当サイト独自機能)</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/tracker/pf">プロジェクトトラッカー</Link> — 案件の追加・更新タイムライン</li>
              <li><Link href="/tools/irr-simulator">蓄電池 IRR シミュレーター</Link> — 個別案件の収益試算</li>
              <li><Link href="/tools/capacity-market-bid">容量市場応札試算</Link> — OCCTO実データ連携</li>
              <li><Link href="/industry">業界分析ハブ</Link></li>
            </ul>
          </section>

          <p className="back-link">
            <Link href="/">← トップへ戻る</Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
