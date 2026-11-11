'use client';

/**
 * 蓄電所の売買・出資 公表事例の一覧（/tracker/deals・売買事例の一覧便 2026-11-10）
 * - 全行を初期 DOM に描き、絞り込みは hidden の切り替えだけ（#107）。一次の逐語は開閉欄（details）の中で、初期 DOM に載る。
 * - URL は useSearchParams を使わず window.location＋history.replaceState（hydrated ガード・#92/#103）。BalancingRulesTimeline と同じ。
 * - 既定（パラメータ無し）は全行を表示（印のある行も隠さない）。
 * - 当サイトは仲介しない・評価しない（文に評価語を入れない）。
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  DEAL_AREA_LABEL,
  DEAL_AREA_ORDER,
  EMPTY_DEAL_FILTER,
  KIND_LABEL,
  KIND_ORDER,
  MARK_LABEL,
  MARK_ORDER,
  STAGE_LABEL,
  STAGE_ORDER,
  kindsLabel,
  matchesDealFilter,
  type DealArea,
  type DealFilter,
  type DealKind,
  type DealMark,
  type DealStage,
} from '@/lib/deals';

export type DealView = {
  id: string;
  heading: string;
  year: string;
  announcedLabel: string;
  publisher: string;
  kinds: DealKind[];
  stages: DealStage[];
  areas: DealArea[];
  marks: DealMark[];
  placeText: string;
  scale: string;
  parties: string[];
  price: { label: string; text: string } | null;
  note: string;
  sources: {
    title: string;
    /** 題名の一部を画面で省いたときの断り（〔利回りの表示を省略〕）。無ければ '' */
    titleNote: string;
    publisher: string;
    url: string;
    roleLabel: string;
    publishedLabel: string | null;
    modifiedLabel: string | null;
    fetchedLabel: string;
    quotes: { where: string; text: string }[];
  }[];
  newsSlug: string | null;
  projectSlugs: string[];
};

const linkStyle = { color: 'var(--color-accent)' } as const;
const muted = { color: 'var(--color-muted)' } as const;
const select = { padding: '6px 8px', fontSize: 16, border: '1px solid var(--color-border)', borderRadius: 4, width: '100%', boxSizing: 'border-box' } as const;
const dt = { fontWeight: 600 } as const;
const dd = { margin: 0 } as const;

function DealCard({ d, hidden }: { d: DealView; hidden: boolean }) {
  const top = [
    kindsLabel(d.kinds),
    `段階（発表時）${d.stages.map((s) => STAGE_LABEL[s]).join('・')}`,
    ...d.marks.map((m) => `印 ${MARK_LABEL[m]}`),
    `整理番号 ${d.id}`,
  ].join('　');
  return (
    <article hidden={hidden} id={`deal-${d.id}`} className="deal-card" style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 14px', margin: '10px 0', background: '#fff', minWidth: 0, overflowWrap: 'anywhere' }}>
      <div style={{ fontSize: 13, ...muted, lineHeight: 1.6 }}>{top}</div>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 6px', lineHeight: 1.6 }}>{d.heading}</h3>
      <dl className="deal-dl" style={{ display: 'grid', gridTemplateColumns: 'fit-content(40%) minmax(0, 1fr)', gap: '2px 10px', fontSize: 14, margin: 0 }}>
        <dt style={dt}>{'公表日（一次の日付）'}</dt>
        <dd style={dd}>{d.announcedLabel}</dd>
        <dt style={dt}>{'発表者'}</dt>
        <dd style={dd}>{d.publisher}</dd>
        <dt style={dt}>{'種類'}</dt>
        <dd style={dd}>{kindsLabel(d.kinds)}</dd>
        <dt style={dt}>{'段階（発表時）'}</dt>
        <dd style={dd}>{d.stages.includes('unknown') && d.stages.length === 1 ? '不明（一次に記載なし）' : d.stages.map((s) => STAGE_LABEL[s]).join('・')}</dd>
        <dt style={dt}>{'場所'}</dt>
        <dd style={dd}>{d.placeText || '一次に記載なし'}</dd>
        <dt style={dt}>{'規模'}</dt>
        <dd style={dd}>{d.scale || '—'}</dd>
        {d.parties.length > 0 && (
          <>
            <dt style={dt}>{'当事者'}</dt>
            <dd style={dd}>{d.parties.join('／')}</dd>
          </>
        )}
        <dt style={dt}>{'価格'}</dt>
        <dd style={dd}>{d.price ? `${d.price.label}: ${d.price.text}` : '—'}</dd>
      </dl>
      {d.note && <p style={{ fontSize: 14, margin: '8px 0 0', lineHeight: 1.7 }}>{`〔${d.note}〕`}</p>}
      <details style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>{'一次（逐語）'}</summary>
        <p style={{ margin: '6px 0 0', ...muted, fontSize: 13 }}>{'「」内は一次の逐語です。「／」は別の箇所からの抜き出しのつなぎ目です。'}</p>
        <ul style={{ margin: '6px 0 0', paddingLeft: 20 }}>
          {d.sources.map((s, i) => (
            <li key={`${s.url}-${i}`} style={{ marginBottom: 8 }}>
              {`${s.roleLabel}: ${s.publisher}「`}
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>{s.title}</a>
              {`」${s.titleNote}`}
              <span style={{ display: 'block', ...muted }}>
                {[s.publishedLabel ? `資料の日付 ${s.publishedLabel}` : null, s.modifiedLabel ? `更新日 ${s.modifiedLabel}` : null, `取得日 ${s.fetchedLabel}`].filter(Boolean).join('　')}
              </span>
              {s.quotes.map((q, j) => (
                <span key={j} style={{ display: 'block' }}>{`${q.where}: ${q.text}`}</span>
              ))}
            </li>
          ))}
        </ul>
      </details>
      {(d.newsSlug || d.projectSlugs.length > 0) && (
        <p style={{ fontSize: 14, margin: '8px 0 0', lineHeight: 1.7 }}>
          {d.newsSlug && (
            <Link href={`/news/${d.newsSlug}`} style={linkStyle}>{'当サイトの記事'}</Link>
          )}
          {d.newsSlug && d.projectSlugs.length > 0 ? '　' : ''}
          {d.projectSlugs.map((p, i) => (
            <span key={p}>
              {i === 0 ? '' : '・'}
              <Link href={`/projects/${p}`} style={linkStyle}>{'プロジェクトDB'}</Link>
            </span>
          ))}
        </p>
      )}
    </article>
  );
}

export default function DealsList({ items, years }: { items: DealView[]; years: { year: string; count: number }[] }) {
  const [f, setF] = useState<DealFilter>(EMPTY_DEAL_FILTER);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const year = sp.get('year') ?? '';
    const kind = sp.get('kind') ?? '';
    const stage = sp.get('stage') ?? '';
    const area = sp.get('area') ?? '';
    const mark = sp.get('mark') ?? '';
    setF({
      year: years.some((y) => y.year === year) ? year : '',
      kind: (KIND_ORDER as readonly string[]).includes(kind) ? (kind as DealKind) : '',
      stage: (STAGE_ORDER as readonly string[]).includes(stage) ? (stage as DealStage) : '',
      area: (DEAL_AREA_ORDER as readonly string[]).includes(area) ? (area as DealArea) : '',
      mark: mark === 'none' || (MARK_ORDER as readonly string[]).includes(mark) ? (mark as DealFilter['mark']) : '',
      price: sp.get('price') === '1',
    });
    setHydrated(true);
  }, [years]);

  useEffect(() => {
    if (!hydrated) return;
    const sp = new URLSearchParams();
    if (f.year) sp.set('year', f.year);
    if (f.kind) sp.set('kind', f.kind);
    if (f.stage) sp.set('stage', f.stage);
    if (f.area) sp.set('area', f.area);
    if (f.mark) sp.set('mark', f.mark);
    if (f.price) sp.set('price', '1');
    const q = sp.toString();
    const url = `${window.location.pathname}${q ? `?${q}` : ''}${window.location.hash}`;
    if (window.location.pathname + window.location.search + window.location.hash !== url) window.history.replaceState(null, '', url);
  }, [hydrated, f]);

  const targets = useMemo(
    () => items.map((d) => ({ year: d.year, kinds: d.kinds, stages: d.stages, areas: d.areas, marks: d.marks, hasPrice: !!d.price })),
    [items],
  );
  const shown = useMemo(() => targets.filter((t) => matchesDealFilter(t, f)).length, [targets, f]);

  return (
    <div>
      <section aria-label="絞り込み" style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, marginBottom: 12, background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 10 }}>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'公表の年'}</span>
            <select value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} style={select}>
              <option value="">{'すべて'}</option>
              {years.map((y) => (
                <option key={y.year} value={y.year}>{`${y.year}年（${y.count} 件）`}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'種類'}</span>
            <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as DealFilter['kind'] })} style={select}>
              <option value="">{'すべて'}</option>
              {KIND_ORDER.map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'段階（発表時）'}</span>
            <select value={f.stage} onChange={(e) => setF({ ...f, stage: e.target.value as DealFilter['stage'] })} style={select}>
              <option value="">{'すべて'}</option>
              {STAGE_ORDER.map((s) => (
                <option key={s} value={s}>{STAGE_LABEL[s]}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'エリア（一般送配電）'}</span>
            <select value={f.area} onChange={(e) => setF({ ...f, area: e.target.value as DealFilter['area'] })} style={select}>
              <option value="">{'すべて'}</option>
              {DEAL_AREA_ORDER.map((a) => (
                <option key={a} value={a}>{DEAL_AREA_LABEL[a]}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'印'}</span>
            <select value={f.mark} onChange={(e) => setF({ ...f, mark: e.target.value as DealFilter['mark'] })} style={select}>
              <option value="">{'すべて'}</option>
              <option value="none">{'印なし'}</option>
              {MARK_ORDER.map((m) => (
                <option key={m} value={m}>{MARK_LABEL[m]}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 14, display: 'flex', gap: 8, alignItems: 'center', paddingTop: 22 }}>
            <input type="checkbox" checked={f.price} onChange={(e) => setF({ ...f, price: e.target.checked })} />
            <span>{'価格が一次に書いてある行だけ'}</span>
          </label>
        </div>
        <p style={{ fontSize: 14, margin: '8px 0 0' }} aria-live="polite">{`${items.length} 件のうち ${shown} 件を表示`}</p>
      </section>

      {items.map((d, i) => (
        <DealCard key={d.id} d={d} hidden={!matchesDealFilter(targets[i], f)} />
      ))}
    </div>
  );
}
