'use client';

// /subsidies 絞り込みバー（2026-08-08）
// - OperatorBrowser のUIパターンを流用（#92 回避: useSearchParams を使わず
//   window.location + history.replaceState で URL 状態を扱う。初期 state はデフォルト＝SSR は全件描画）
// - deriveStatus / カウントダウンはサーバ側で計算済みの値を props で受け取る
//   → ハブの revalidate=86400（日次自己更新）を壊さない。フィルタはクライアント完結。
// - 全件を DOM に出し、絞り込みで外れた行は hidden 属性で隠す（#107: 表示切替であってDOM生成/破棄ではない）

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';

export type BrowserItem = {
  id: string;
  slug: string;
  name: string;
  organization: string;
  subsidyRate: string;
  upperLimit: string;
  applicationStart: string;
  deadlineRaw: string;
  /** サーバ側 deriveStatus 結果（日次 ISR で更新） */
  status: string;
  /** サーバ側計算のカウントダウン（「あと◯日」等・null は非表示） */
  countdown: string | null;
  /** 表示用の地域ラベル（「全国」「石川県」「北海道 他26県」「—」） */
  regionLabel: string;
  /** 絞り込み用の都道府県キー（全国制度は 'all-japan'、地域なしは ''） */
  prefKeys: string[];
  isNationwide: boolean;
  /** 対象者（precompute の applicable_entities） */
  entities: string[];
  /** 検索対象テキスト（制度名・実施主体・対象・要件・自治体名を連結済み） */
  haystack: string;
};

const STATUS_ORDER = [
  '公募中', '公募予定', '次年度継続',
  '採択結果公表', '受付終了', '予算超過終了', 'その他',
];

const ENTITY_LABELS: { key: string; label: string }[] = [
  { key: 'corporate', label: '法人・事業者' },
  { key: 'individual', label: '個人・個人事業主' },
  { key: 'municipal', label: '自治体・公共' },
];

export default function SubsidiesBrowser({ items }: { items: BrowserItem[] }) {
  const [pref, setPref] = useState('all');
  const [target, setTarget] = useState('all');
  // c) 「公募中のみ表示」トグルは初期 ON
  const [openOnly, setOpenOnly] = useState(true);
  const [query, setQuery] = useState('');
  const [hydrated, setHydrated] = useState(false);

  // マウント後に URL から状態を復元（client-only。SSR では default のまま＝全件 DOM）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = sp.get('pref');
    const t = sp.get('target');
    const s = sp.get('status');
    const q = sp.get('q');
    if (p) setPref(p);
    if (t) setTarget(t);
    if (s) setOpenOnly(s === 'open');
    if (q) setQuery(q);
    setHydrated(true);
  }, []);

  // 状態 → URL（復元後のみ・replaceState で履歴を汚さない）
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (pref !== 'all') params.set('pref', pref);
    if (target !== 'all') params.set('target', target);
    if (!openOnly) params.set('status', 'all');
    if (query) params.set('q', query);
    const qs = params.toString();
    window.history.replaceState(null, '', qs ? `${window.location.pathname}?${qs}` : window.location.pathname);
  }, [pref, target, openOnly, query, hydrated]);

  // a) 都道府県プルダウン（件数つき・「全国対象（国の制度）」を先頭に）
  const prefOptions = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const it of items) for (const p of it.prefKeys) counts[p] = (counts[p] || 0) + 1;
    const nationwide = items.filter((i) => i.isNationwide).length;
    const list = Object.entries(counts)
      .filter(([k]) => k && k !== 'all-japan')
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'ja'));
    return { nationwide, list };
  }, [items]);

  // b) 対象者プルダウン（precompute の applicable_entities ベース・件数つき）
  const targetOptions = useMemo(
    () =>
      ENTITY_LABELS.map((e) => ({
        ...e,
        count: items.filter((i) => i.entities.includes(e.key)).length,
      })).filter((e) => e.count > 0),
    [items]
  );

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const set = new Set<string>();
    for (const it of items) {
      if (pref === 'all-japan') {
        if (!it.isNationwide) continue;
      } else if (pref !== 'all') {
        if (!it.prefKeys.includes(pref)) continue;
      }
      if (target !== 'all' && !it.entities.includes(target)) continue;
      if (openOnly && it.status !== '公募中') continue;
      if (q && !it.haystack.includes(q)) continue;
      set.add(it.id);
    }
    return set;
  }, [items, pref, target, openOnly, query]);

  // 絞り込み後もステータス別グループ表示を維持（連動）
  const groups = useMemo(() => {
    const byStatus: Record<string, BrowserItem[]> = {};
    for (const it of items) (byStatus[it.status] ||= []).push(it);
    const ordered = STATUS_ORDER.filter((s) => byStatus[s]).map((s) => ({ status: s, items: byStatus[s] }));
    for (const s of Object.keys(byStatus)) if (!STATUS_ORDER.includes(s)) ordered.push({ status: s, items: byStatus[s] });
    return ordered;
  }, [items]);

  const hasFilter = pref !== 'all' || target !== 'all' || !openOnly || query.trim() !== '';
  const reset = () => { setPref('all'); setTarget('all'); setOpenOnly(true); setQuery(''); };

  return (
    <div className="subsidy-browser">
      <div className="op-controls" style={{ marginBottom: 8 }}>
        <input
          className="op-search"
          type="search"
          placeholder="制度名・実施主体・対象・要件・自治体名で検索"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="補助金を検索"
        />
        <select className="op-pref" value={pref} onChange={(e) => setPref(e.target.value)} aria-label="都道府県で絞り込み">
          <option value="all">すべての地域</option>
          <option value="all-japan">全国対象（国の制度）（{prefOptions.nationwide}件）</option>
          {prefOptions.list.map(([p, c]) => (
            <option key={p} value={p}>{p}（{c}件）</option>
          ))}
        </select>
        <select className="op-sort" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="対象者で絞り込み">
          <option value="all">すべての対象者</option>
          {targetOptions.map((t) => (
            <option key={t.key} value={t.key}>{t.label}（{t.count}件）</option>
          ))}
        </select>
        <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} />
          公募中のみ表示
        </label>
        {hasFilter && (
          <button type="button" onClick={reset} className="op-tab" aria-label="絞り込みをリセット">
            ✕ リセット
          </button>
        )}
      </div>

      <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '0 0 4px' }}>
        <strong>{matches.size}件</strong>該当（全{items.length}件中）
      </p>
      {/* 4) 診断ツール導線 */}
      <p style={{ fontSize: 14, margin: '0 0 20px' }}>
        条件がわからない方は <Link href="/tools/subsidy-match">補助金マッチング診断</Link> をご利用ください。
      </p>

      {matches.size === 0 && (
        <div className="empty-state" style={{ marginBottom: 24 }}>
          <p>該当する補助金がありません。</p>
          <p style={{ fontSize: 14 }}>
            <button type="button" onClick={reset} className="op-tab">条件をゆるめる（絞り込みをリセット）</button>
            {' '}または <Link href="/tools/subsidy-match">補助金マッチング診断</Link> をお試しください。
          </p>
        </div>
      )}

      {groups.map((g) => {
        const shown = g.items.filter((i) => matches.has(i.id)).length;
        return (
          <section key={g.status} className="subsidy-status-section" hidden={shown === 0}>
            <h2
              className={`subsidy-status-title status-${
                g.status === '公募中' ? 'open' : g.status === '公募予定' ? 'upcoming' : 'closed'
              }`}
            >
              {g.status}（{shown}件）
            </h2>
            <div className="subsidy-table-wrapper">
              <table className="subsidy-table">
                <thead>
                  <tr>
                    <th>補助金名</th>
                    <th>地域</th>
                    <th>執行機関</th>
                    <th>補助率</th>
                    <th>上限額</th>
                    <th>公募期間</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((item) => (
                    <tr key={item.id} hidden={!matches.has(item.id)}>
                      <td>
                        <Link href={`/subsidies/${item.slug}`} className="subsidy-link">{item.name}</Link>
                      </td>
                      {/* 2) 県名バッジ（市単独制度も所在県で見つかる） */}
                      <td>
                        <span className="badge badge-category">{item.regionLabel}</span>
                      </td>
                      <td>{item.organization}</td>
                      <td>{item.subsidyRate || '—'}</td>
                      <td>{item.upperLimit || '—'}</td>
                      <td>
                        {item.applicationStart || '—'} 〜<br />
                        {item.deadlineRaw || '—'}
                        {g.status === '公募中' && item.countdown && (
                          <>
                            <br />
                            <strong style={{ fontSize: 13 }}>{item.countdown}</strong>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}
