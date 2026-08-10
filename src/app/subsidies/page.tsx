import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import subsidiesData from '@/data/subsidies.json';
import type { PrecomputedSubsidy } from '../../../scripts/precompute-subsidies';
import SubsidiesBrowser, { type BrowserItem } from './SubsidiesBrowser';
// S4(2026-08-09): 状態導出と締切表示は詳細ページと共有する（両者が drift しないように）
import {
  getTodayJST,
  deriveSubsidyStatus as deriveStatus,
  deadlineCountdown,
} from '@/lib/subsidies-meta';

// S1(2026-08-08): force-static → 日次ISR。データは bundled JSON のまま（runtime microCMS 0 維持）だが、
// 「締切まであと◯日」と deriveStatus（L-EIC-027）が毎日自己更新される（従来はビルド時に凍結）。
export const revalidate = 86400;

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




const STATUS_ORDER = [
  '公募中', '公募予定', '次年度継続',
  '採択結果公表', '受付終了', '予算超過終了', 'その他',
];

// （グループ分けは SubsidiesBrowser 側に移設。関数は将来の再利用のため残置）
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

/** 地域ラベル（県名バッジ）: 全国 / 単県 / 複数県 / 地域指定なし（民間の全国融資等） */
function regionLabelOf(prefs: string[]): string {
  if (prefs.length >= 47) return '全国';
  if (prefs.length === 0) return '地域指定なし';
  if (prefs.length === 1) return `${prefs[0]}${/[都道府県]$/.test(prefs[0]) ? '' : '県'}`;
  const head = prefs[0];
  return `${head}${/[都道府県]$/.test(head) ? '' : '県'} 他${prefs.length - 1}件`;
}

export default function SubsidiesListPage() {
  const todayISO = getTodayJST();

  // 絞り込みバー用の enriched props（deriveStatus・カウントダウンはサーバ側で計算＝
  // revalidate=86400 の日次自己更新がそのままクライアント表示に反映される）
  const browserItems: BrowserItem[] = ALL.map((item) => {
    const prefs = item.applicable_prefs || [];
    const isNationwide = prefs.length >= 47;
    return {
      id: item.id,
      slug: item.slug,
      name: item.name,
      organization: item.organization,
      subsidyRate: item.subsidyRate_raw || '',
      upperLimit: item.upperLimit_raw || '',
      applicationStart: item.applicationStart || '',
      deadlineRaw: item.deadline_raw || '',
      status: deriveStatus(item, todayISO),
      countdown: deadlineCountdown(item, todayISO),
      regionLabel: regionLabelOf(prefs),
      prefKeys: isNationwide ? ['all-japan'] : prefs,
      isNationwide,
      entities: item.applicable_entities || [],
      haystack: [
        item.name, item.organization, item.targetEntity_raw, item.scheme,
        item.subsidyRate_raw, item.fiscalYear, ...prefs.slice(0, 3),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase(),
    };
  });

  // S1① 公募中の専用棚（締切昇順・締切なし/随時は末尾）
  const openItems = ALL.filter((i) => deriveStatus(i, todayISO) === '公募中').sort((a, b) => {
    const ka = a.deadline_iso && !a.is_rolling ? a.deadline_iso : '9999-99-99';
    const kb = b.deadline_iso && !b.is_rolling ? b.deadline_iso : '9999-99-99';
    return ka < kb ? -1 : ka > kb ? 1 : 0;
  });

  // S1③ 最終更新（掲載データの最新更新日時 = microCMS updatedAt 最大値・JST）
  const latestUpdated = ALL.reduce((acc, it) => {
    const u = it.updatedAt ? new Date(Date.parse(it.updatedAt) + 9 * 3600 * 1000).toISOString().slice(0, 10) : '';
    return u > acc ? u : acc;
  }, '');

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
          <p className="page-meta" style={{ marginTop: 0, marginBottom: 8, paddingTop: 0, borderTop: 'none' }}>
            ※ 公募期間・補助率・対象は年度毎に変更されます。最新情報は各執行機関の公式サイトでご確認ください。
          </p>
          {latestUpdated && (
            <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: '0 0 24px' }}>
              最終更新: {latestUpdated}（掲載データの最新更新日）
            </p>
          )}

          {/* S1① 公募中の専用棚（締切昇順・あと◯日つき） */}
          {openItems.length > 0 && (
            <section className="page-section news-shelf" style={{ marginBottom: 28 }}>
              <h2 className="news-shelf-title">いま公募中（締切が近い順）</h2>
              <ul className="lv-invest-rows">
                {openItems.map((item) => {
                  const cd = deadlineCountdown(item, todayISO);
                  return (
                    <li key={item.id}>
                      <Link href={`/subsidies/${item.slug}`}>{item.name}</Link>
                      <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--color-muted)' }}>
                        {item.is_rolling
                          ? '（随時受付）'
                          : item.deadline_iso
                            ? `（締切 ${item.deadline_iso}${cd ? `・${cd}` : ''}）`
                            : ''}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* 絞り込みバー＋一覧（クライアント）: 全件をDOMに出し、除外行は hidden。
              deriveStatus/カウントダウンはサーバ計算値を props で受け渡し＝日次ISRの自己更新を維持 */}
          <SubsidiesBrowser items={browserItems} />

          <section style={{
            marginTop: 32, padding: 16,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)', borderRadius: 6,
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>関連 (当サイト独自機能)</h2>
            <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
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
