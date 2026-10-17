'use client';
/**
 * /corrections の一覧と絞り込み（訂正履歴便・2026-10-16）。
 * - 全件を初期 DOM に描き、絞り込みは hidden の切り替えだけ（#107）。
 * - URL は useSearchParams を使わず window.location＋history.replaceState（hydrated ガード・#92/#103）。
 */
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import CorrectionItemBody from '@/components/CorrectionItemBody';
import type { CorrectionKind, CorrectionTarget } from '@/lib/corrections';

export type CorrectionRowView = {
  id: string;
  dateLabel: string;
  kind: CorrectionKind;
  target: CorrectionTarget;
  path: string;
  title: string;
  linkable: boolean;
  before: string;
  after: string;
  basis: { name: string; publisher: string; url: string }[];
};

const select = { width: '100%', padding: '8px 10px', fontSize: 15, border: '1px solid var(--color-border, #cbd5e1)', borderRadius: 6, background: '#fff' } as const;
const muted = { color: 'var(--color-muted)' } as const;

function Row({ r, hidden }: { r: CorrectionRowView; hidden: boolean }) {
  return (
    <article hidden={hidden} id={`correction-${r.id}`} style={{ border: '1px solid var(--color-border, #cbd5e1)', borderRadius: 8, padding: '12px 14px', margin: '10px 0', background: '#fff', minWidth: 0, overflowWrap: 'anywhere' }}>
      <div style={{ fontSize: 13, ...muted }}>{`${r.dateLabel}・${r.kind}・${r.target}`}</div>
      <h2 style={{ fontSize: 16, fontWeight: 700, margin: '2px 0 6px', lineHeight: 1.6 }}>
        {r.linkable ? <Link href={r.path} style={{ color: 'var(--color-accent)' }}>{r.title}</Link> : r.title}
      </h2>
      <div style={{ fontSize: 14, lineHeight: 1.8, margin: 0 }}>
        <CorrectionItemBody kind={r.kind} before={r.before} after={r.after} basis={r.basis} />
      </div>
    </article>
  );
}

export default function CorrectionsList({ rows, kinds, targets }: { rows: CorrectionRowView[]; kinds: readonly CorrectionKind[]; targets: readonly CorrectionTarget[] }) {
  const [kind, setKind] = useState<'' | CorrectionKind>('');
  const [target, setTarget] = useState<'' | CorrectionTarget>('');
  const [hydrated, setHydrated] = useState(false);

  // 選択肢に出すのは記録のある種類・対象だけ。URL の復元も同じ集合で照合する（選択肢に無い値を受けると、欄は「すべて」に見えたまま 0 件になる）
  const usedKinds = kinds.filter((k) => rows.some((r) => r.kind === k));
  const usedTargets = targets.filter((t) => rows.some((r) => r.target === t));

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const k = sp.get('kind') ?? '';
    const t = sp.get('target') ?? '';
    setKind(rows.some((r) => r.kind === k) ? (k as CorrectionKind) : '');
    setTarget(rows.some((r) => r.target === t) ? (t as CorrectionTarget) : '');
    setHydrated(true);
  }, [rows]);

  useEffect(() => {
    if (!hydrated) return;
    const sp = new URLSearchParams();
    if (kind) sp.set('kind', kind);
    if (target) sp.set('target', target);
    const q = sp.toString();
    const url = `${window.location.pathname}${q ? `?${q}` : ''}`;
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, '', url);
  }, [hydrated, kind, target]);

  const match = (r: CorrectionRowView) => (!kind || r.kind === kind) && (!target || r.target === target);
  const shown = useMemo(() => rows.filter(match).length, [rows, kind, target]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <section aria-label="絞り込み" style={{ border: '1px solid var(--color-border, #cbd5e1)', borderRadius: 8, padding: 12, marginBottom: 12, background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(200px, 100%), 1fr))', gap: 10 }}>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'種類'}</span>
            <select value={kind} onChange={(e) => setKind(e.target.value as '' | CorrectionKind)} style={select}>
              <option value="">{'すべて'}</option>
              {usedKinds.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
          </label>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'対象'}</span>
            <select value={target} onChange={(e) => setTarget(e.target.value as '' | CorrectionTarget)} style={select}>
              <option value="">{'すべて'}</option>
              {usedTargets.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        <p style={{ fontSize: 14, margin: '8px 0 0' }} aria-live="polite">{`${rows.length} 件のうち ${shown} 件を表示`}</p>
      </section>
      {rows.map((r) => (
        <Row key={r.id} r={r} hidden={!match(r)} />
      ))}
    </div>
  );
}
