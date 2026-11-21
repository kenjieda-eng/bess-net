import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { getAllProjects, type Project } from '@/lib/microcms';
import { LIST_EXCLUDED_PROJECT_SLUGS } from '@/lib/projects-excluded';
import { contactUrl } from '@/lib/contact-link';
import { jstDay, jaDayLabel } from '@/lib/page-dates';
// 蓄電所一覧の検索便（2026-11-21）: 状態の並び・調査中・合計・数字の書式は src/lib/projects-list.ts の 1 か所（#119）。
//   絞り込み・並べ替え・CSV はブラウザの部品 ProjectsBrowser（初めの状態で今と同じ 4 つの表を全行 描く）。
import { fmtTotal, groupByStatus, isInvestigating, reliableCount, sumReliable, toListRow } from '@/lib/projects-list';
import ProjectsBrowser from './ProjectsBrowser';

// 「情報をお持ちの方は編集部まで」＝情報提供（position feedback）
const feedbackContactUrl = contactUrl({ campaign: 'projects_index', position: 'feedback' });

export const revalidate = 600;

export const metadata: Metadata = {
  title: '全国の蓄電所プロジェクト一覧（容量・事業者・稼働状況）',
  description:
    '国内の系統用蓄電池プロジェクトを公開情報ベースで一元管理。容量・所在地・事業者・ステータス・運転開始時期・市場参加形態を構造化して提供します。',
  alternates: { canonical: 'https://bess-net.jp/projects' },
};

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
  const totalMW = sumReliable(items.map((i) => i.outputMw));
  const totalMWh = sumReliable(items.map((i) => i.capacityMwh));
  const reliableMWCount = reliableCount(items.map((i) => i.outputMw));
  const reliableMWhCount = reliableCount(items.map((i) => i.capacityMwh));
  const investigatingCount = items.filter((i) => isInvestigating(i.outputMw, i.capacityMwh)).length;
  // 今の並び（状態の順 → 状態の中は「調査中」を最後・出力の大きい順）。ブラウザはこの順をそのまま使い、並べ直さない
  //   ブラウザへ渡すのは軽い形だけ（body・緯度経度・市場・id は渡さない）
  const rows = groupByStatus(items).flatMap((g) => g.items.map((p) => toListRow(p, jstDay)));
  // 蓄電所一覧便（2026-11-21）: 最終更新日＝掲載中の蓄電所の revisedAt のうち、いちばん新しい日（JST・詳細ページの「更新日」と同じ関数）
  const latestRevised = items.reduce((m, i) => (i.revisedAt && i.revisedAt > m ? i.revisedAt : m), '');
  const latestDay = jstDay(latestRevised);

  // 最終更新日と注記 2 つ（サーバーの JSX のまま。一覧があるときはブラウザの部品の children で渡す）
  const notes = (
    <>
      {latestDay && (
        <p style={{ margin: '0 0 20px', fontSize: 15, color: 'var(--color-muted)' }}>
          最終更新: {jaDayLabel(latestDay)}
          <Link href="/tracker/pf" style={{ marginLeft: 12 }}>追加・更新の履歴 →</Link>
        </p>
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
            情報をお持ちの方は <a href={feedbackContactUrl} target="_blank" rel="noopener noreferrer">編集部</a> までお寄せください。
          </p>
        </section>
      )}

      <p className="page-meta" style={{ marginTop: 0, marginBottom: 32, paddingTop: 0, borderTop: 'none' }}>
        ※ 本DBは各社プレスリリース・公開資料・電力会社の公表情報に基づき構造化したものです。最新情報は事業者の公式情報でご確認ください。
      </p>
    </>
  );

  return (
    <>
      <SiteHeader />
      <main className="section">
        {/* Tier 1 UI 統一: max-w 1320 */}
        <div className="section-inner" style={{ maxWidth: 1320 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 蓄電所一覧
          </p>
          <div className="section-label">Projects Database</div>
          <h1 className="section-title">全国の蓄電所一覧</h1>
          {/* Tier 1 UI 統一 #1: text-base lg:text-lg */}
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 24, lineHeight: 1.7 }}>
            計画中・建設中・稼働中の系統用蓄電池プロジェクトを、公開情報をもとに一覧にしています。
          </p>

          {items.length > 0 && (
            <div className="project-stats">
              <div className="stat-card">
                <div className="stat-num">{items.length}</div>
                <div className="stat-label">掲載件数</div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{fmtTotal(totalMW)}</div>
                <div className="stat-label">合計出力 MW <small style={{ display: 'block', fontWeight: 400, color: 'var(--color-muted)', fontSize: 12 }}>({reliableMWCount} 件分)</small></div>
              </div>
              <div className="stat-card">
                <div className="stat-num">{fmtTotal(totalMWh)}</div>
                <div className="stat-label">合計容量 MWh <small style={{ display: 'block', fontWeight: 400, color: 'var(--color-muted)', fontSize: 12 }}>({reliableMWhCount} 件分)</small></div>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <>
              {notes}
              <div className="empty-state">
                <p>プロジェクトデータはまだ準備中です。</p>
                <p style={{ marginTop: 8, fontSize: 15, color: 'var(--color-muted)' }}>
                  公開情報のリサーチを経て、Sprint 1終了までに10件以上の初期データを公開予定です。
                </p>
              </div>
            </>
          ) : (
            // 並び（§1）: 絞り込みの箱 → 結果の行 → 表へ移動 → 最終更新日・注記 2 つ（children）→ 表
            <ProjectsBrowser rows={rows}>{notes}</ProjectsBrowser>
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
