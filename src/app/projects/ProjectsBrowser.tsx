'use client';

/**
 * src/app/projects/ProjectsBrowser.tsx — 蓄電所一覧の絞り込み・並べ替え・CSV（蓄電所一覧の検索便・2026-11-21）
 *
 * 事業者ナビ（OperatorBrowser）・補助金（SubsidiesBrowser）と同じ型（#103）:
 *   - 初めの状態（条件なし）で、今と同じ 4 つの表を全行 描く＝初めの HTML に全行が載る（#107）。
 *   - URL の状態は、マウントの後に window.location.search を読み、変わったら history.replaceState（#92・next/navigation の検索パラメータの hook は使わない）。
 *   - 条件か並べ替えを 1 つでも選ぶと、4 つの表と「表へ移動」を hidden で隠し（DOM には残す）、1 つの表（「状態」の列つき）で出す。
 * 判定・並べ替え・URL・CSV は src/lib/projects-list.ts の 1 か所（#119）。ここで数え方を持たない。
 * ★import してよいのは React・next/link・projects-list・projects-cod だけ（verify:projects-list の軸 2 が見る）。
 */
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { codCellText } from '@/lib/projects-cod';
import {
  type ListRow,
  type ListState,
  EMPTY_STATE,
  INV_OPTIONS,
  MW_BANDS,
  PREFECTURES,
  REGIONS,
  SORTS,
  buildCsv,
  codYear,
  countConditions,
  filterRows,
  fmtMW,
  fmtMWh,
  fmtTotal,
  groupRows,
  isActive,
  jaDay,
  jstStamp,
  matchKeyword,
  mwBand,
  parseState,
  prefOf,
  reliableCount,
  serializeState,
  sortRows,
  statusLabel,
  sumReliable,
  tokens,
} from '@/lib/projects-list';

type Gtag = (...a: unknown[]) => void;
function gtagEvent(name: string, params: Record<string, unknown>): void {
  try {
    const w = window as { gtag?: Gtag };
    if (w.gtag) w.gtag('event', name, params);
  } catch {
    // 計測が落ちても一覧は動かす
  }
}

const codText = (r: ListRow) => codCellText({ status: r.st, cod: r.cod });
const numStyle = (v: number | null) =>
  v === 0 ? { color: 'var(--color-muted)', fontStyle: 'italic' as const, fontVariantNumeric: 'tabular-nums' as const } : { fontVariantNumeric: 'tabular-nums' as const, fontWeight: 600 };

function Row({ r, flat, epcHint, showPd }: { r: ListRow; flat: boolean; epcHint: boolean; showPd: boolean }) {
  return (
    <tr data-slug={r.s}>
      <td className="projects-td-name">
        <Link href={`/projects/${r.s}`} className="subsidy-link">
          {r.n}
        </Link>
        {showPd && r.pd && <small className="projects-sub">公開日 {jaDay(r.pd)}</small>}
      </td>
      {flat && <td data-label="状態">{statusLabel(r.st)}</td>}
      <td data-label="所在地">
        {r.p}
        {r.c && ` ${r.c}`}
      </td>
      <td data-label="出力" className={`tabular-nums projects-td-num ${r.mw === 0 ? 'cell-investigating' : ''}`} style={numStyle(r.mw)}>{fmtMW(r.mw)}</td>
      <td data-label="容量" className={`tabular-nums projects-td-num ${r.mwh === 0 ? 'cell-investigating' : ''}`} style={numStyle(r.mwh)}>{fmtMWh(r.mwh)}</td>
      <td data-label="事業者">
        {r.op || '—'}
        {epcHint && <small className="projects-sub">EPC: {r.epc}</small>}
      </td>
      <td data-label="運転開始">{codText(r)}</td>
    </tr>
  );
}

export default function ProjectsBrowser({ rows, children }: { rows: ListRow[]; children?: ReactNode }) {
  const total = rows.length;
  const groups = useMemo(() => groupRows(rows), [rows]);
  const statusKeys = useMemo(() => groups.map((g) => g.key), [groups]);
  const keyBySlug = useMemo(() => {
    const m = new Map<string, string>();
    for (const g of groups) for (const r of g.rows) m.set(r.s, g.key);
    return m;
  }, [groups]);
  const statusKeyOf = (r: ListRow) => keyBySlug.get(r.s) ?? '';
  const labelOfKey = (k: string) => groups.find((g) => g.key === k)?.status ?? k;

  // 件数（掲載の全件での数。ほかの条件で変わらない）
  const counts = useMemo(() => {
    const pref = new Map<string, number>();
    let prefNone = 0;
    const mw = new Map<string, number>();
    const year = new Map<number, number>();
    let yearNone = 0;
    for (const r of rows) {
      const p = prefOf(r.p);
      if (p) pref.set(p, (pref.get(p) ?? 0) + 1);
      else prefNone++;
      const b = mwBand(r.mw);
      mw.set(b, (mw.get(b) ?? 0) + 1);
      const y = codYear(r.cod);
      if (y == null) yearNone++;
      else year.set(y, (year.get(y) ?? 0) + 1);
    }
    const years = [...year.keys()].sort((a, b) => a - b);
    return { pref, prefNone, mw, year, years, yearNone };
  }, [rows]);
  const yearKeys = useMemo(() => counts.years.map(String), [counts]);

  const [st, setSt] = useState<ListState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const sent = useRef(new Set<string>());
  const [copy, setCopy] = useState<'idle' | 'copied' | 'fallback'>('idle');
  const [copyUrl, setCopyUrl] = useState('');
  const urlRef = useRef<HTMLInputElement>(null);

  // URL → 状態（マウントの後に 1 回。例外を出さない）
  useEffect(() => {
    try {
      setSt(parseState(window.location.search, statusKeys, yearKeys));
    } catch {
      // 読めない URL は初めの状態のまま
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // 状態 → URL（復元の後だけ・replaceState で履歴を汚さない）
  useEffect(() => {
    if (!hydrated) return;
    try {
      const qs = serializeState(st);
      const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      const cur = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (next !== cur) window.history.replaceState(null, '', next);
    } catch {
      // URL に書けなくても表示は続ける
    }
    setCopy('idle');
  }, [st, hydrated]);

  const active = isActive(st);
  const ts = useMemo(() => tokens(st.q), [st.q]);
  const shown = useMemo(
    () => (active ? sortRows(filterRows(rows, st, statusKeyOf), st.sort) : rows),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, st, active, keyBySlug],
  );
  const conditions = countConditions(st);

  const track = (kind: string, next: ListState) => {
    if (sent.current.has(kind)) return;
    sent.current.add(kind);
    gtagEvent('projects_filter', { filter_kind: kind, result_count: filterRows(rows, next, statusKeyOf).length });
  };
  const apply = (next: ListState, kind?: string) => {
    setSt(next);
    if (kind) track(kind, next);
  };

  const toggle = (list: string[], key: string, order: readonly string[]) => order.filter((k) => (k === key ? !list.includes(k) : list.includes(k)));

  const areaValue = st.pref ? `pref:${st.pref}` : st.region ? `region:${st.region}` : '';
  const onArea = (v: string) => {
    const [kind, val] = [v.slice(0, v.indexOf(':')), v.slice(v.indexOf(':') + 1)];
    apply({ ...st, pref: kind === 'pref' ? val : '', region: kind === 'region' ? val : '' }, 'area');
  };

  const quick = [
    { label: '出力の大きい順', state: { ...EMPTY_STATE, sort: 'mw' } },
    { label: '最近 運転を始めた蓄電所', state: { ...EMPTY_STATE, status: statusKeys.includes('operating') ? ['operating'] : [], sort: 'cod-desc' } },
    { label: '新しく載った蓄電所', state: { ...EMPTY_STATE, sort: 'new' } },
  ];
  const stQs = serializeState(st);

  const onCsv = () => {
    try {
      const { stamp, ymd } = jstStamp();
      const csv = buildCsv(shown, st, total, stamp, labelOfKey, codText);
      // UTF-8 BOM: Excel は BOM 無しの UTF-8 を cp932 と誤判定して文字化けする（OperatorBrowser と同じ）
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `projects-bess-net-${ymd}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      gtagEvent('projects_csv_download', { result_count: shown.length, conditions });
    }
  };

  const onCopy = async () => {
    const url = `${window.location.origin}${window.location.pathname}${stQs ? `?${stQs}` : ''}`;
    setCopyUrl(url);
    gtagEvent('projects_url_copy', { conditions });
    try {
      await navigator.clipboard.writeText(url);
      setCopy('copied');
      setTimeout(() => setCopy('idle'), 2500);
    } catch {
      // クリップボードが使えない環境: URL を出して選んだ状態にする（GridSearchUrlCopy と同じ）
      setCopy('fallback');
      setTimeout(() => {
        urlRef.current?.focus();
        urlRef.current?.select();
      }, 0);
    }
  };

  const sumMw = sumReliable(shown.map((r) => r.mw));
  const sumMwh = sumReliable(shown.map((r) => r.mwh));
  const cntMw = reliableCount(shown.map((r) => r.mw));
  const cntMwh = reliableCount(shown.map((r) => r.mwh));

  return (
    <div className="projects-browser" data-list-total={total}>
      {/* 絞り込み・並べ替えの箱 */}
      <form
        className="projects-filter no-print"
        role="search"
        aria-label="蓄電所一覧の絞り込み・並べ替え"
        onSubmit={(e) => {
          e.preventDefault();
          if (st.q.trim()) track('q', st);
        }}
      >
        <h2 className="projects-filter-title">絞り込み・並べ替え</h2>
        <div className="projects-filter-grid">
          <div className="projects-field projects-field-q">
            <label htmlFor="pl-q">キーワード</label>
            <input
              id="pl-q"
              type="search"
              value={st.q}
              maxLength={100}
              placeholder="名前・事業者・EPC・市町村で探す"
              onChange={(e) => setSt({ ...st, q: e.target.value })}
              onBlur={() => {
                if (st.q.trim()) track('q', st);
              }}
            />
          </div>
          <div className="projects-field">
            <label htmlFor="pl-area">地域</label>
            <select id="pl-area" value={areaValue} onChange={(e) => onArea(e.target.value)}>
              <option value="">すべての地域</option>
              {REGIONS.map((rg) => (
                <optgroup key={rg.key} label={rg.label}>
                  {rg.prefs.length > 1 && (
                    <option value={`region:${rg.key}`}>
                      {rg.label} 全体（{rg.prefs.reduce((s, p) => s + (counts.pref.get(p) ?? 0), 0)}）
                    </option>
                  )}
                  {rg.prefs.map((p) => (
                    <option key={p} value={`pref:${p}`}>
                      {p}（{counts.pref.get(p) ?? 0}）
                    </option>
                  ))}
                </optgroup>
              ))}
              <option value="pref:none">所在地が未記載・確認中（{counts.prefNone}）</option>
            </select>
          </div>
          <div className="projects-field">
            <label htmlFor="pl-year">運転開始の年</label>
            <select id="pl-year" value={st.year} onChange={(e) => apply({ ...st, year: e.target.value }, 'year')}>
              <option value="">すべての年</option>
              {counts.years.map((y) => (
                <option key={y} value={String(y)}>
                  {y}年（{counts.year.get(y)}）
                </option>
              ))}
              <option value="none">記載なし（{counts.yearNone}）</option>
            </select>
          </div>
          <div className="projects-field">
            <label htmlFor="pl-inv">調査中の扱い</label>
            <select id="pl-inv" value={st.inv} onChange={(e) => apply({ ...st, inv: e.target.value }, 'inv')}>
              {INV_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <div className="projects-field">
            <label htmlFor="pl-sort">並べ替え</label>
            <select id="pl-sort" value={st.sort} onChange={(e) => apply({ ...st, sort: e.target.value }, 'sort')}>
              {SORTS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="projects-chips" role="group" aria-label="状態">
          <span className="projects-chips-label">状態</span>
          {groups.map((g) => (
            <button
              key={g.key}
              type="button"
              className="projects-chip"
              data-key={g.key}
              data-count={g.rows.length}
              aria-pressed={st.status.includes(g.key)}
              onClick={() => apply({ ...st, status: toggle(st.status, g.key, statusKeys) }, 'status')}
            >
              {g.status}（{g.rows.length}）
            </button>
          ))}
        </div>
        <div className="projects-chips" role="group" aria-label="出力">
          <span className="projects-chips-label">出力</span>
          {MW_BANDS.map((b) => (
            <button
              key={b.key}
              type="button"
              className="projects-chip"
              data-key={b.key}
              data-count={counts.mw.get(b.key) ?? 0}
              aria-pressed={st.mw.includes(b.key)}
              onClick={() => apply({ ...st, mw: toggle(st.mw, b.key, MW_BANDS.map((x) => x.key)) }, 'mw')}
            >
              {b.label}（{counts.mw.get(b.key) ?? 0}）
            </button>
          ))}
        </div>
        <div className="projects-chips projects-quick" role="group" aria-label="よく使う見方">
          <span className="projects-chips-label">よく使う見方:</span>
          {quick.map((v) => (
            <button
              key={v.label}
              type="button"
              className="projects-chip"
              aria-pressed={stQs !== '' && serializeState(v.state) === stQs}
              onClick={() => apply(v.state, 'quick')}
            >
              {v.label}
            </button>
          ))}
        </div>
      </form>
      <p className="projects-filter-note">
        運転開始の年は予定を含みます（「2027年度」は 2027 年に入れています）。出力の「2〜10MW」は 2MW を超えて 10MW 未満、「10〜50MW」は 10MW 以上 50MW 未満です。調査中は、出力か容量が未確認のものです。
      </p>

      {/* 結果の行 */}
      <div className="projects-result no-print">
        <p className="projects-result-text" aria-live="polite">
          {!active
            ? `全 ${total} 件を表示中`
            : shown.length === 0
              ? '該当する蓄電所がありません。条件を変えてお試しください。'
              : `該当 ${shown.length} 件（全 ${total} 件中）｜合計出力 ${fmtTotal(sumMw)} MW（${cntMw} 件分）｜合計容量 ${fmtTotal(sumMwh)} MWh（${cntMwh} 件分）`}
        </p>
        <div className="projects-result-actions">
          {shown.length > 0 && (
            <button type="button" className="projects-btn projects-btn-primary" onClick={onCsv}>
              CSV をダウンロード（{shown.length} 件）
            </button>
          )}
          {active && (
            <button type="button" className="projects-btn" onClick={onCopy} aria-label="この条件の URL をコピー">
              {copy === 'copied' ? 'コピーしました' : 'この条件の URL をコピー'}
            </button>
          )}
          {active && (
            <button type="button" className="projects-btn" onClick={() => apply(EMPTY_STATE)}>
              条件をクリア
            </button>
          )}
        </div>
        {active && copy === 'fallback' && (
          <input
            ref={urlRef}
            readOnly
            value={copyUrl}
            className="projects-copy-url"
            onFocus={(e) => e.currentTarget.select()}
            aria-label="この条件の URL（コピーしてください）"
          />
        )}
        {shown.length > 0 && (
          <p className="projects-csv-note">
            CSV の先頭に、出典と取得日時が入ります。再配布や商業目的でのご利用は、<Link href="/terms">利用規約</Link>をご覧ください。
          </p>
        )}
      </div>

      {/* 表へ移動（条件を選ぶと隠す） */}
      <div hidden={active}>
        <nav aria-label="状態ごとの表へ移動" className="projects-jump" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 4px', alignItems: 'center', margin: '0 0 12px', fontSize: 16 }}>
          <span className="projects-jump-label">表へ移動:</span>
          {groups.map((g, i) => (
            <span key={g.status} style={{ display: 'inline-flex', alignItems: 'center' }}>
              <a href={`#status-${g.key}`} style={{ display: 'inline-block', padding: '6px 4px', fontWeight: 600 }}>
                {g.status}（{g.rows.length}）
              </a>
              {/* 区切りは前の項目の後ろに置く＝折り返しても行の頭に「｜」が来ない */}
              {i < groups.length - 1 && <span aria-hidden="true" style={{ color: 'var(--color-muted)', margin: '0 4px' }}>｜</span>}
            </span>
          ))}
        </nav>
      </div>

      {children}

      {/* 4 つの表（初めの表示・条件を選ぶと隠す） */}
      <div hidden={active}>
        {groups.map((g) => (
          <section key={g.status} className="project-status-section">
            <h2 id={`status-${g.key}`} className={`subsidy-status-title status-${g.status === '稼働中' ? 'open' : g.status === '建設中' ? 'upcoming' : 'closed'}`}>
              {g.status}（{g.rows.length}件）
            </h2>
            <div className="subsidy-table-wrapper">
              <table className="subsidy-table projects-table">
                <thead>
                  <tr>
                    <th>プロジェクト名</th>
                    <th>所在地</th>
                    <th>出力</th>
                    <th>容量</th>
                    <th>事業者</th>
                    {/* 金曜#6 追修便 ■2: 列見出しは「運転開始」、未実現の日付にだけセル側で「（予定）」を付ける（projects-cod.ts） */}
                    <th>運転開始</th>
                  </tr>
                </thead>
                <tbody>
                  {g.rows.map((r) => (
                    <Row key={r.s} r={r} flat={false} epcHint={false} showPd={false} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}
      </div>

      {/* 1 つの表（条件か並べ替えを選んだときだけ描く＝初めの HTML には無い） */}
      {active && shown.length > 0 && (
        <section className="project-status-section">
          <div className="subsidy-table-wrapper">
            <table className="subsidy-table projects-table projects-table-flat">
              <thead>
                <tr>
                  <th>プロジェクト名</th>
                  <th>状態</th>
                  <th>所在地</th>
                  <th>出力</th>
                  <th>容量</th>
                  <th>事業者</th>
                  <th>運転開始</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <Row key={r.s} r={r} flat epcHint={ts.length > 0 && matchKeyword(r, ts).epcOnly} showPd={st.sort === 'new'} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
