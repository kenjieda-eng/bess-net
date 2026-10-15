'use client';

/**
 * 需給調整市場 制度変更トラッカーのタイムライン（/tracker/balancing-rules・T8 実装便 2026-10-14）
 * - 全行を初期 DOM に描き、絞り込みは hidden の切り替えだけ（#107）。逐語は開閉欄（details）の中で、初期 DOM に載る。
 * - URL は useSearchParams を使わず window.location＋history.replaceState（hydrated ガード・#92/#103）。
 * - 当サイトは改定の良し悪しや収益への影響を評価しない（文に評価語を入れない）。
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import type { BalancingProduct, BalancingRuleKind } from '@/data/balancing-rules';
import {
  EMPTY_FILTER,
  KIND_LABEL,
  KIND_ORDER,
  PRODUCT_LABEL,
  PRODUCT_ORDER,
  matchesFilter,
  pumpedHydroGroupTitle,
  type BenchmarkLink,
  type RuleFilter,
} from '@/lib/balancing-rules';

export type RuleView = {
  id: string;
  kind: BalancingRuleKind;
  title: string;
  announcedLabel: string;
  effectiveLabel: string | null;
  products: BalancingProduct[];
  areas: string[];
  before: string;
  after: string;
  reasonQuote: string | null;
  batteryNote: string | null;
  sources: { name: string; publisher: string; url: string; where: string; quote: string; dateLabel: string | null }[];
  explainers: { slug: string; title: string }[];
  /** href: 詳細ページがある 9 件（POLICY_DETAIL_SLUGS）はその詳細、それ以外は /policy-calendar（詳細は 404 になるため） */
  policyEvents: { slug: string; title: string; href: string }[];
  capLine: string | null;
  bench: BenchmarkLink;
  dateException: string | null;
};
export type TimelineView = ({ type: 'row'; row: RuleView } | { type: 'group'; key: string; fiscalYear: number; rows: RuleView[] })[];

const linkStyle = { color: 'var(--color-accent)' } as const;
const muted = { color: 'var(--color-muted)' } as const;
const select = { padding: '6px 8px', fontSize: 16, border: '1px solid var(--color-border)', borderRadius: 4, width: '100%', boxSizing: 'border-box' } as const;

function benchText(b: BenchmarkLink) {
  if (b.kind === 'link') {
    return (
      <>
        <Link href={b.href} style={linkStyle}>{`前後の月を入札ベンチマークで比べる（${b.productLabel}${b.multiProduct ? '。商品は切り替えられます' : ''}）`}</Link>
        {`　${b.windowText}`}
      </>
    );
  }
  if (b.kind === 'wait') return `前後の比較は月次の公表後に（いまの月次は ${Number(b.lastYm.slice(0, 4))}年${Number(b.lastYm.slice(5, 7))}月まで）`;
  if (b.kind === 'before-coverage') return `前の期間に月次の範囲（${Number(b.firstYm.slice(0, 4))}年${Number(b.firstYm.slice(5, 7))}月から）より前の月があり、前後の比較はできません`;
  return null;
}

function RuleCard({ r, hidden }: { r: RuleView; hidden: boolean }) {
  const bench = benchText(r.bench);
  return (
    <article hidden={hidden} id={`rule-${r.id}`} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '12px 14px', margin: '10px 0', background: '#fff', minWidth: 0, overflowWrap: 'anywhere' }}>
      <div style={{ fontSize: 13, ...muted, lineHeight: 1.6 }}>
        {`区分 ${KIND_LABEL[r.kind]}（整理番号 ${r.id}）`}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 6px', lineHeight: 1.6 }}>{r.title}</h3>
      <dl style={{ display: 'grid', gridTemplateColumns: 'fit-content(45%) minmax(0, 1fr)', gap: '2px 10px', fontSize: 14, margin: 0 }}>
        <dt style={{ fontWeight: 600 }}>{'公表日（一次の日付）'}</dt>
        <dd style={{ margin: 0 }}>{r.announcedLabel}</dd>
        <dt style={{ fontWeight: 600 }}>{'適用日（実需給日）'}</dt>
        <dd style={{ margin: 0 }}>{r.effectiveLabel ?? '適用日は一次に無し'}</dd>
        <dt style={{ fontWeight: 600 }}>{'対象商品'}</dt>
        <dd style={{ margin: 0 }}>{r.products.map((p) => PRODUCT_LABEL[p]).join('・') || '—'}</dd>
        {r.areas.length > 0 && (
          <>
            <dt style={{ fontWeight: 600 }}>{'エリア'}</dt>
            <dd style={{ margin: 0 }}>{r.areas.join('・')}</dd>
          </>
        )}
        {r.capLine && (
          <>
            <dt style={{ fontWeight: 600 }}>{'上限価格（カタログ）'}</dt>
            <dd style={{ margin: 0 }}>{r.capLine}</dd>
          </>
        )}
      </dl>
      {r.batteryNote && <p style={{ fontSize: 14, margin: '8px 0 0', lineHeight: 1.7 }}>{`蓄電池に関わる点: ${r.batteryNote}`}</p>}
      <details style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7 }}>
        <summary style={{ cursor: 'pointer', color: 'var(--color-accent)' }}>{'変更前・変更後（一次の逐語）と一次'}</summary>
        <p style={{ margin: '6px 0 0', ...muted, fontSize: 13 }}>{'〔〕内は当サイトの補足です（一次の文ではありません）。「／」は別の箇所からの抜き出しのつなぎ目です。'}</p>
        <p style={{ margin: '8px 0 4px', fontWeight: 600 }}>{'変更前'}</p>
        <p style={{ margin: 0 }}>{r.before}</p>
        <p style={{ margin: '8px 0 4px', fontWeight: 600 }}>{'変更後'}</p>
        <p style={{ margin: 0 }}>{r.after}</p>
        {r.reasonQuote && (
          <>
            <p style={{ margin: '8px 0 4px', fontWeight: 600 }}>{'一次が書いている理由（逐語）'}</p>
            <p style={{ margin: 0 }}>{r.reasonQuote}</p>
          </>
        )}
        <p style={{ margin: '8px 0 4px', fontWeight: 600 }}>{'一次資料'}</p>
        <ul style={{ margin: 0, paddingLeft: 20 }}>
          {r.sources.map((s, i) => (
            <li key={`${s.url}-${i}`} style={{ marginBottom: 4 }}>
              {`${s.publisher}「`}
              <a href={s.url} target="_blank" rel="noopener noreferrer" style={linkStyle}>{s.name}</a>
              {`」${s.dateLabel ? `（${s.dateLabel}）` : ''}　${s.where}`}
              <span style={{ display: 'block', ...muted }}>{`逐語: ${s.quote}`}</span>
            </li>
          ))}
        </ul>
        {r.dateException && <p style={{ margin: '8px 0 0', ...muted }}>{`日付の注記: ${r.dateException}`}</p>}
      </details>
      {(r.explainers.length > 0 || r.policyEvents.length > 0 || bench) && (
        <p style={{ fontSize: 14, margin: '8px 0 0', lineHeight: 1.7 }}>
          {r.explainers.map((e, i) => (
            <span key={e.slug}>
              {i === 0 ? '関連の解説（当サイトの解説記事）: ' : '・'}
              <Link href={`/explainer/${e.slug}`} style={linkStyle}>{e.title}</Link>
            </span>
          ))}
          {r.explainers.length > 0 && r.policyEvents.length > 0 ? '　' : ''}
          {r.policyEvents.map((e, i) => (
            <span key={e.slug}>
              {i === 0 ? '政策カレンダー: ' : '・'}
              <Link href={e.href} style={linkStyle}>{e.title}</Link>
            </span>
          ))}
          {bench && (
            <span style={{ display: 'block' }}>{bench}</span>
          )}
        </p>
      )}
    </article>
  );
}

export default function BalancingRulesTimeline({ items, areas }: { items: TimelineView; areas: string[] }) {
  const [f, setF] = useState<RuleFilter>(EMPTY_FILTER);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const kind = sp.get('kind') ?? '';
    const product = sp.get('product') ?? '';
    const area = sp.get('area') ?? '';
    setF({
      kind: (KIND_ORDER as readonly string[]).includes(kind) ? (kind as BalancingRuleKind) : '',
      product: (PRODUCT_ORDER as readonly string[]).includes(product) ? (product as BalancingProduct) : '',
      area: areas.includes(area) ? area : '',
      battery: sp.get('battery') === '1',
    });
    setHydrated(true);
  }, [areas]);

  useEffect(() => {
    if (!hydrated) return;
    const sp = new URLSearchParams();
    if (f.kind) sp.set('kind', f.kind);
    if (f.product) sp.set('product', f.product);
    if (f.area) sp.set('area', f.area);
    if (f.battery) sp.set('battery', '1');
    const q = sp.toString();
    const url = `${window.location.pathname}${q ? `?${q}` : ''}`;
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, '', url);
  }, [hydrated, f]);

  const shown = useMemo(() => {
    let n = 0;
    for (const it of items) for (const r of it.type === 'row' ? [it.row] : it.rows) if (matchesFilter(r, f)) n++;
    return n;
  }, [items, f]);
  const total = items.reduce((s, it) => s + (it.type === 'row' ? 1 : it.rows.length), 0);
  const filtered = !!(f.kind || f.product || f.area || f.battery);

  return (
    <div>
      <section aria-label="絞り込み" style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: 12, marginBottom: 12, background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 10 }}>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'区分'}</span>
            <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as RuleFilter['kind'] })} style={select}>
              <option value="">{'すべて'}</option>
              {KIND_ORDER.map((k) => (
                <option key={k} value={k}>{KIND_LABEL[k]}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'商品'}</span>
            <select value={f.product} onChange={(e) => setF({ ...f, product: e.target.value as RuleFilter['product'] })} style={select}>
              <option value="">{'すべて'}</option>
              {PRODUCT_ORDER.map((p) => (
                <option key={p} value={p}>{PRODUCT_LABEL[p]}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'エリア'}</span>
            <select value={f.area} onChange={(e) => setF({ ...f, area: e.target.value })} style={select}>
              <option value="">{'すべて'}</option>
              {areas.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 14, display: 'flex', gap: 8, alignItems: 'center', paddingTop: 22 }}>
            <input type="checkbox" checked={f.battery} onChange={(e) => setF({ ...f, battery: e.target.checked })} />
            <span>{'蓄電池に関わる点がある行だけ'}</span>
          </label>
        </div>
        <p style={{ fontSize: 13, ...muted, margin: '8px 0 0', lineHeight: 1.6 }}>
          {'エリアを選ぶと、エリアの指定がある行（揚水発電機の随意契約に伴う募集量の見直し）をそのエリアに絞ります。それ以外の改定は、対象のエリアが限られるもの（例: 東エリア3社に適用）も含めてそのまま出ます。'}
        </p>
        <p style={{ fontSize: 14, margin: '6px 0 0' }} aria-live="polite">{`${total} 件のうち ${shown} 件を表示`}</p>
      </section>

      {items.map((it) =>
        it.type === 'row' ? (
          <RuleCard key={it.row.id} r={it.row} hidden={!matchesFilter(it.row, f)} />
        ) : (
          (() => {
            const visible = it.rows.filter((r) => matchesFilter(r, f));
            return (
              <details
                key={`${it.key}-${f.area || 'all'}`}
                open={!!f.area && visible.length > 0}
                hidden={visible.length === 0}
                style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 14px', margin: '10px 0', background: '#fafafa' }}
              >
                <summary style={{ cursor: 'pointer', fontSize: 15, fontWeight: 700 }}>
                  {pumpedHydroGroupTitle(it.fiscalYear, it.rows.length)}
                  {filtered && visible.length !== it.rows.length ? `（表示 ${visible.length} 件）` : ''}
                </summary>
                {it.rows.map((r) => (
                  <RuleCard key={r.id} r={r} hidden={!matchesFilter(r, f)} />
                ))}
              </details>
            );
          })()
        ),
      )}
    </div>
  );
}
