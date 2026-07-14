import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import subsidiesData from '@/data/subsidies.json';
import type { PrecomputedSubsidy } from '../../../scripts/precompute-subsidies';

// build 時静的生成（鉄則#2/#3: ランタイム microCMS 0）
export const dynamic = 'force-static';

export const metadata: Metadata = {
  title: '蓄電池 補助金カレンダー',
  description:
    '系統用蓄電池および低圧リソース事業向けの主要補助金を、執行機関別・公募期間別に整理。経産省・エネ庁・SII・NEDO・自治体の蓄電池関連補助金を継続トラック。',
  alternates: { canonical: 'https://bess-net.jp/subsidies' },
  openGraph: {
    title: '蓄電池 補助金カレンダー | 系統用蓄電池・低圧リソース事業',
    description:
      '系統用蓄電池および低圧リソース事業向けの主要補助金を、執行機関・公募期間別に整理。SII・NEDO・経産省・自治体の補助金を継続トラック。',
    type: 'website',
    url: 'https://bess-net.jp/subsidies',
    images: ['/og-image.png'],
  },
};

const ALL = subsidiesData as PrecomputedSubsidy[];

// build 時の JST 日付（YYYY-MM-DD）で deadline_iso と比較
function getTodayJST(): string {
  return new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// deadline_iso / start_iso ベースで status を自動導出（鮮度の自動補正・L-EIC-027）
function deriveStatus(item: PrecomputedSubsidy, todayISO: string): string {
  // 採択結果公表は終端状態（結果公表日が過去でも受付終了に上書きしない）
  if (item.status[0] === '採択結果公表') return '採択結果公表';
  // 締切超過が最優先（受付終了）
  if (!item.is_rolling && item.deadline_iso && item.deadline_iso < todayISO) {
    return '受付終了';
  }
  // 開始日が未来 → 公募予定（L-EIC-027拡張。start_iso は精密日付のみ）
  if (item.start_iso && item.start_iso > todayISO) {
    return '公募予定';
  }
  return item.status[0] || 'その他';
}

const STATUS_ORDER = [
  '公募中', '公募予定', '次年度継続',
  '採択結果公表', '受付終了', '予算超過終了', 'その他',
];

function groupByStatus(items: PrecomputedSubsidy[], todayISO: string) {
  const groups: Record<string, PrecomputedSubsidy[]> = {};
  for (const item of items) {
    const status = deriveStatus(item, todayISO);
    if (!groups[status]) groups[status] = [];
    groups[status].push(item);
  }
  const ordered: Array<{ status: string; items: PrecomputedSubsidy[] }> = [];
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

export default function SubsidiesListPage() {
  const todayISO = getTodayJST();
  const grouped = groupByStatus(ALL, todayISO);

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

          {grouped.map((g) => (
            <section key={g.status} className="subsidy-status-section">
              <h2
                className={`subsidy-status-title status-${
                  g.status === '公募中' ? 'open'
                  : g.status === '公募予定' ? 'upcoming'
                  : 'closed'
                }`}
              >
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
                        <td>{item.subsidyRate_raw || '—'}</td>
                        <td>{item.upperLimit_raw || '—'}</td>
                        <td>
                          {item.applicationStart || '—'} 〜<br />
                          {item.deadline_raw || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}

          <section style={{
            marginTop: 32, padding: 16,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)', borderRadius: 6,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連 (当サイト独自機能)</h2>
            <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
              <li><Link href="/tools/subsidy-match">補助金マッチング</Link> — 事業条件から最適補助金を自動マッチング</li>
              <li><Link href="/tracker/subsidy">補助金トラッカー</Link> — 補助金の追加・更新タイムライン</li>
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
