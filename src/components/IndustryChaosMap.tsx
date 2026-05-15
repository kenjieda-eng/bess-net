'use client';

/**
 * src/components/IndustryChaosMap.tsx
 *
 * 業界カオスマップ UI (依頼AP)
 *
 * 機能:
 *   - マトリクスビュー (カテゴリ別、初期表示): カードグリッド
 *   - フォースグラフビュー: SVG 自前実装 (D3 / react-force-graph 不使用、軽量)
 *   - フィルタ: カテゴリ・上場・国内外・業界活動度
 *   - URL share (落とし穴 #92: window.location)
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  PLAYERS,
  RELATIONS,
  CATEGORY_LABELS,
  CATEGORY_COLORS,
  playerCountByCategory,
  type CategoryKey,
  type Player,
} from '@/data/industry-map';

const ORIGIN_LABELS: Record<string, string> = {
  JP: '🇯🇵 日本',
  CN: '🇨🇳 中国',
  KR: '🇰🇷 韓国',
  US: '🇺🇸 米国',
  EU: '🇪🇺 欧州',
  TW: '🇹🇼 台湾',
  OTHER: '🌐 その他',
};

type View = 'matrix' | 'force';
type ListedFilter = 'all' | 'listed' | 'unlisted';
type OriginFilter = 'all' | 'domestic' | 'foreign';

// ───────────────────────────────────────
// URL params
// ───────────────────────────────────────

interface FilterState {
  view: View;
  category: CategoryKey | 'all';
  listed: ListedFilter;
  origin: OriginFilter;
  minActivity: number;
}

function stateToParams(s: FilterState): URLSearchParams {
  const sp = new URLSearchParams();
  if (s.view !== 'matrix') sp.set('v', s.view);
  if (s.category !== 'all') sp.set('cat', s.category);
  if (s.listed !== 'all') sp.set('l', s.listed);
  if (s.origin !== 'all') sp.set('o', s.origin);
  if (s.minActivity > 1) sp.set('a', String(s.minActivity));
  return sp;
}

function paramsToState(sp: URLSearchParams): FilterState {
  const v = sp.get('v');
  const cat = sp.get('cat');
  const l = sp.get('l');
  const o = sp.get('o');
  const a = sp.get('a');
  return {
    view: v === 'force' ? 'force' : 'matrix',
    category: (cat as CategoryKey) || 'all',
    listed: (l === 'listed' || l === 'unlisted' ? l : 'all') as ListedFilter,
    origin: (o === 'domestic' || o === 'foreign' ? o : 'all') as OriginFilter,
    minActivity: a ? Math.max(1, Math.min(5, parseInt(a, 10))) : 1,
  };
}

const DEFAULT: FilterState = {
  view: 'matrix',
  category: 'all',
  listed: 'all',
  origin: 'all',
  minActivity: 1,
};

// ───────────────────────────────────────
// フォースグラフ (SVG 自前、static circular layout)
// 注: D3 / react-force-graph 非依存、軽量。
//     ノードはカテゴリごとに同心円配置 → 関係をエッジで結ぶ。
// ───────────────────────────────────────

function ForceGraph({ players, relations }: { players: Player[]; relations: typeof RELATIONS }) {
  const W = 800;
  const H = 600;
  const cx = W / 2;
  const cy = H / 2;
  const radius = 240;

  // ノードをカテゴリでグループ化 → 各カテゴリを円周に配置
  const playerIds = new Set(players.map((p) => p.id));
  const categories = Array.from(new Set(players.map((p) => p.category)));
  const positions = new Map<string, { x: number; y: number }>();

  categories.forEach((cat, ci) => {
    const angleOffset = (ci / categories.length) * Math.PI * 2;
    const catPlayers = players.filter((p) => p.category === cat);
    catPlayers.forEach((p, pi) => {
      // 小さな散布: カテゴリ中心から少しズラす
      const subAngle = (pi / catPlayers.length) * Math.PI * 2;
      const subRadius = 50;
      const catCx = cx + Math.cos(angleOffset) * radius;
      const catCy = cy + Math.sin(angleOffset) * radius;
      positions.set(p.id, {
        x: catCx + Math.cos(subAngle) * subRadius,
        y: catCy + Math.sin(subAngle) * subRadius,
      });
    });
  });

  const visibleRelations = relations.filter(
    (r) => playerIds.has(r.from) && playerIds.has(r.to)
  );

  return (
    <div style={{ width: '100%', overflow: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, height: 'auto', background: '#fafafa', borderRadius: 6 }}
        role="img"
        aria-label={`業界カオスマップ フォースグラフビュー (${players.length} 社、${visibleRelations.length} 関係)`}
      >
        {/* エッジ */}
        {visibleRelations.map((r, i) => {
          const from = positions.get(r.from);
          const to = positions.get(r.to);
          if (!from || !to) return null;
          return (
            <line
              key={i}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke="#bbb"
              strokeWidth={1}
              opacity={0.5}
            />
          );
        })}
        {/* ノード */}
        {players.map((p) => {
          const pos = positions.get(p.id);
          if (!pos) return null;
          const r = 6 + p.activity * 1.5;
          return (
            <g key={p.id}>
              <circle
                cx={pos.x}
                cy={pos.y}
                r={r}
                fill={CATEGORY_COLORS[p.category]}
                stroke="#fff"
                strokeWidth={1.5}
                opacity={0.85}
              />
              <text
                x={pos.x}
                y={pos.y + r + 10}
                fontSize={9}
                textAnchor="middle"
                fill="#333"
              >
                {p.name.length > 10 ? p.name.slice(0, 10) + '…' : p.name}
              </text>
            </g>
          );
        })}
      </svg>
      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8 }}>
        ※ フォースグラフはノードをカテゴリ別に同心円配置した簡易ビュー。詳細関係はマトリクスビュー or{' '}
        <Link href="/operators">事業者ナビ</Link>で確認。
      </p>
    </div>
  );
}

// ───────────────────────────────────────
// メイン
// ───────────────────────────────────────

export default function IndustryChaosMap() {
  const [state, setState] = useState<FilterState>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.toString()) setState(paramsToState(sp));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const sp = stateToParams(state);
    const newUrl = sp.toString()
      ? `${window.location.pathname}?${sp.toString()}`
      : window.location.pathname;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [state, hydrated]);

  const filtered = useMemo(() => {
    return PLAYERS.filter((p) => {
      if (state.category !== 'all' && p.category !== state.category) return false;
      if (state.listed === 'listed' && !p.listed) return false;
      if (state.listed === 'unlisted' && p.listed) return false;
      if (state.origin === 'domestic' && p.origin !== 'JP') return false;
      if (state.origin === 'foreign' && p.origin === 'JP') return false;
      if (p.activity < state.minActivity) return false;
      return true;
    });
  }, [state]);

  const counts = useMemo(() => playerCountByCategory(), []);
  const categoryKeys = Object.keys(CATEGORY_LABELS) as CategoryKey[];

  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    setState((p) => ({ ...p, [key]: value }));
  };

  return (
    <div>
      {/* フィルタ */}
      <section
        style={{
          padding: 16,
          marginBottom: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
        }}
      >
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', marginBottom: 8 }}>
          {/* View 切替 */}
          <div role="tablist" aria-label="ビュー切替" style={{ display: 'flex', gap: 4 }}>
            {(['matrix', 'force'] as const).map((v) => (
              <button
                key={v}
                role="tab"
                aria-selected={state.view === v}
                onClick={() => update('view', v)}
                style={{
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  background: state.view === v ? 'var(--color-accent, #0066cc)' : '#fff',
                  color: state.view === v ? '#fff' : 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                {v === 'matrix' ? '🗂 マトリクス' : '🕸 フォースグラフ'}
              </button>
            ))}
          </div>
          {/* category */}
          <label style={{ fontSize: 12 }}>
            カテゴリ:{' '}
            <select
              value={state.category}
              onChange={(e) => update('category', e.target.value as CategoryKey | 'all')}
              style={{ padding: '4px 6px', fontSize: 12 }}
            >
              <option value="all">すべて ({PLAYERS.length})</option>
              {categoryKeys.map((c) => (
                <option key={c} value={c}>
                  {CATEGORY_LABELS[c]} ({counts[c]})
                </option>
              ))}
            </select>
          </label>
          {/* listed */}
          <label style={{ fontSize: 12 }}>
            上場:{' '}
            <select
              value={state.listed}
              onChange={(e) => update('listed', e.target.value as ListedFilter)}
              style={{ padding: '4px 6px', fontSize: 12 }}
            >
              <option value="all">すべて</option>
              <option value="listed">上場</option>
              <option value="unlisted">非上場</option>
            </select>
          </label>
          {/* origin */}
          <label style={{ fontSize: 12 }}>
            原産:{' '}
            <select
              value={state.origin}
              onChange={(e) => update('origin', e.target.value as OriginFilter)}
              style={{ padding: '4px 6px', fontSize: 12 }}
            >
              <option value="all">すべて</option>
              <option value="domestic">日本</option>
              <option value="foreign">海外</option>
            </select>
          </label>
          {/* activity */}
          <label style={{ fontSize: 12 }}>
            業界活動度 ≥:{' '}
            <select
              value={state.minActivity}
              onChange={(e) => update('minActivity', parseInt(e.target.value, 10))}
              style={{ padding: '4px 6px', fontSize: 12 }}
            >
              {[1, 2, 3, 4, 5].map((a) => (
                <option key={a} value={a}>
                  {a}★以上
                </option>
              ))}
            </select>
          </label>
          <span style={{ fontSize: 12, color: 'var(--color-muted)', marginLeft: 'auto' }} aria-live="polite">
            表示中: {filtered.length} / {PLAYERS.length} 社
          </span>
        </div>
      </section>

      {/* ビュー */}
      {state.view === 'matrix' ? (
        <div>
          {categoryKeys.map((cat) => {
            const inCat = filtered.filter((p) => p.category === cat);
            if (inCat.length === 0) return null;
            return (
              <section key={cat} style={{ marginBottom: 24 }}>
                <h3
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    margin: 0,
                    marginBottom: 8,
                    color: CATEGORY_COLORS[cat],
                    borderBottom: `2px solid ${CATEGORY_COLORS[cat]}`,
                    paddingBottom: 4,
                  }}
                >
                  {CATEGORY_LABELS[cat]} ({inCat.length})
                </h3>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: 8,
                  }}
                >
                  {inCat.map((p) => (
                    <article
                      key={p.id}
                      style={{
                        padding: 10,
                        background: '#fff',
                        border: `1px solid var(--color-border)`,
                        borderLeft: `3px solid ${CATEGORY_COLORS[p.category]}`,
                        borderRadius: 4,
                        fontSize: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                        <strong style={{ fontSize: 13 }}>
                          {p.operator_slug ? (
                            <Link
                              href={`/operators/${p.operator_slug}`}
                              style={{ color: 'var(--color-accent, #0066cc)' }}
                            >
                              {p.name}
                            </Link>
                          ) : (
                            p.name
                          )}
                        </strong>
                        <span style={{ fontSize: 10, color: CATEGORY_COLORS[p.category] }}>
                          {'★'.repeat(p.activity)}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-muted)', marginTop: 2 }}>
                        {ORIGIN_LABELS[p.origin]} {p.listed && '・上場'}
                      </div>
                      {p.note && (
                        <div style={{ fontSize: 11, marginTop: 4, color: '#444' }}>{p.note}</div>
                      )}
                    </article>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        <section
          style={{
            padding: 8,
            background: '#fff',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            marginBottom: 16,
          }}
        >
          <ForceGraph players={filtered} relations={RELATIONS} />
        </section>
      )}

      {/* 関係統計 */}
      <section
        style={{
          padding: 16,
          marginBottom: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          fontSize: 13,
        }}
      >
        <h3 style={{ fontSize: 14, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
          関係データ集計 ({RELATIONS.length} 件)
        </h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {(['equity', 'epc_contract', 'cell_supply', 'pcs_supply', 'om_contract', 'offtake', 'jv', 'partner'] as const).map((t) => {
            const cnt = RELATIONS.filter((r) => r.type === t).length;
            if (cnt === 0) return null;
            const labelMap: Record<string, string> = {
              equity: '出資/PF',
              epc_contract: 'EPC',
              cell_supply: 'セル供給',
              pcs_supply: 'PCS供給',
              om_contract: 'O&M',
              offtake: 'オフテイク',
              jv: 'JV',
              partner: 'パートナー',
            };
            return (
              <span
                key={t}
                style={{
                  padding: '4px 10px',
                  fontSize: 11,
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 3,
                }}
              >
                {labelMap[t]}: {cnt}
              </span>
            );
          })}
        </div>
      </section>

      <p style={{ fontSize: 12, color: 'var(--color-muted)' }}>
        ※ 主要 {PLAYERS.length} 社 + 関係 {RELATIONS.length} 件の業界構造可視化。完全網羅は{' '}
        <Link href="/operators">事業者ナビ (544社)</Link>を参照。
        関係データは公開情報・業界既知の事実に基づき編集部が整理。
      </p>
    </div>
  );
}
