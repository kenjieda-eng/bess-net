'use client';

/**
 * src/components/LcoeLcosCalculator.tsx — LCOE/LCOS 計算機 UI（66番・業界唯一）
 *
 * 落とし穴対応:
 *  - #92/#103: useSearchParams 不使用。window.location + history.replaceState（hydrated ガード）。
 *  - 鉄則#2/#4: client-side 計算のみ（microCMS/外部 fetch 0）。既定値は page.tsx から props（build時 precompute済 NREL ATB）。
 */

import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import {
  computeLCOS, computeLCOE,
  LCOS_DEFAULTS, LCOE_DEFAULTS,
  type LcosInput,
} from '@/lib/lcoe-lcos';

export interface LcosCapexProp {
  low: number; mid: number; high: number;
  fxJpyPerUsd: number; capexUsdPerKwh: number;
}
export interface SourceProp {
  key: string; label: string;
  capexJpyPerKw: number; capexUsdPerKw: number;
  lcoeUsdPerMwh: number; cfDefault: number;
}
interface Props {
  lcosCapex: LcosCapexProp;
  sources: SourceProp[];
  fxJpyPerUsd: number;
}

type CapexMode = 'low' | 'mid' | 'high' | 'custom';

const yen = (n: number, d = 0) =>
  '¥' + n.toLocaleString('ja-JP', { maximumFractionDigits: d, minimumFractionDigits: d });
const usd = (n: number, d = 0) =>
  '$' + n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });

// ── 入力行（数値 + スライダー）────────────────────────────
function Field({
  label, value, onChange, min, max, step, unit, hint, pct,
}: {
  label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; unit: string; hint?: string; pct?: boolean;
}) {
  const display = pct ? Math.round(value * 1000) / 10 : value;
  const toModel = (v: number) => (pct ? v / 100 : v);
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="number" value={display} min={pct ? min * 100 : min} max={pct ? max * 100 : max} step={pct ? step * 100 : step}
            onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) onChange(toModel(n)); }}
            style={{ width: 92, padding: '4px 6px', fontSize: 15, textAlign: 'right', border: '1px solid var(--color-border)', borderRadius: 4 }}
            aria-label={label}
          />
          <span style={{ fontSize: 15, color: 'var(--color-muted)', minWidth: 42 }}>{unit}</span>
        </span>
      </label>
      <input
        type="range" value={display} min={pct ? min * 100 : min} max={pct ? max * 100 : max} step={pct ? step * 100 : step}
        onChange={(e) => onChange(toModel(Number(e.target.value)))}
        style={{ width: '100%' }} aria-label={`${label} スライダー`}
      />
      {hint && <p style={{ fontSize: 15, color: 'var(--color-muted)', margin: '2px 0 0' }}>{hint}</p>}
    </div>
  );
}

export default function LcoeLcosCalculator({ lcosCapex, sources, fxJpyPerUsd }: Props) {
  const [hydrated, setHydrated] = useState(false);
  const [tab, setTab] = useState<'lcos' | 'lcoe'>('lcos');

  // ── LCOS state ──
  const [capexMode, setCapexMode] = useState<CapexMode>('mid');
  const [lcos, setLcos] = useState<LcosInput>({
    capexJpyPerKwh: lcosCapex.mid,
    ...LCOS_DEFAULTS,
  });

  // ── LCOE state（共通パラメータ + 電源別 CF）──
  const [lcoeDiscount, setLcoeDiscount] = useState(LCOE_DEFAULTS.discountRate);
  const [lcoeLife, setLcoeLife] = useState(LCOE_DEFAULTS.lifeYears);
  const [lcoeOmRate, setLcoeOmRate] = useState(LCOE_DEFAULTS.omRate);
  const [cfBySource, setCfBySource] = useState<Record<string, number>>(
    Object.fromEntries(sources.map((s) => [s.key, s.cfDefault])),
  );

  // mount: URL params 復元（落とし穴#92）
  useEffect(() => {
    if (typeof window === 'undefined') { setHydrated(true); return; }
    const sp = new URLSearchParams(window.location.search);
    if (sp.get('tab') === 'lcoe') setTab('lcoe');
    const num = (k: string) => { const v = sp.get(k); const n = v === null ? NaN : Number(v); return Number.isFinite(n) ? n : undefined; };
    const cx = num('cx');
    if (cx !== undefined) { setCapexMode('custom'); setLcos((p) => ({ ...p, capexJpyPerKwh: cx })); }
    setLcos((p) => ({
      ...p,
      rte: num('rte') ?? p.rte,
      cyclesPerYear: num('cy') ?? p.cyclesPerYear,
      dod: num('dod') ?? p.dod,
      chargePriceJpyPerKwh: num('cp') ?? p.chargePriceJpyPerKwh,
      omRate: num('om') ?? p.omRate,
      discountRate: num('r') ?? p.discountRate,
      projectYears: num('yr') ?? p.projectYears,
    }));
    setHydrated(true);
  }, []);

  // URL 更新（history.replaceState、hydrated ガード）
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const sp = new URLSearchParams();
    if (tab === 'lcoe') sp.set('tab', 'lcoe');
    if (capexMode === 'custom') sp.set('cx', String(lcos.capexJpyPerKwh));
    sp.set('rte', String(lcos.rte));
    sp.set('cy', String(lcos.cyclesPerYear));
    sp.set('dod', String(lcos.dod));
    sp.set('cp', String(lcos.chargePriceJpyPerKwh));
    sp.set('om', String(lcos.omRate));
    sp.set('r', String(lcos.discountRate));
    sp.set('yr', String(lcos.projectYears));
    const url = `${window.location.pathname}?${sp.toString()}`;
    if (window.location.pathname + window.location.search !== url) {
      window.history.replaceState(null, '', url);
    }
  }, [hydrated, tab, capexMode, lcos]);

  const setCapex = (mode: CapexMode) => {
    setCapexMode(mode);
    if (mode !== 'custom') setLcos((p) => ({ ...p, capexJpyPerKwh: lcosCapex[mode] }));
  };
  const setLcosField = (k: keyof LcosInput) => (v: number) => {
    if (k === 'capexJpyPerKwh') setCapexMode('custom');
    setLcos((p) => ({ ...p, [k]: v }));
  };

  const lcosResult = useMemo(() => computeLCOS(lcos, fxJpyPerUsd), [lcos, fxJpyPerUsd]);

  const lcoeRows = useMemo(() => sources.map((s) => {
    const r = computeLCOE({
      capexJpyPerKw: s.capexJpyPerKw,
      cf: cfBySource[s.key] ?? s.cfDefault,
      omRate: lcoeOmRate, fuelJpyPerKwh: 0,
      discountRate: lcoeDiscount, lifeYears: lcoeLife,
    }, fxJpyPerUsd);
    return {
      key: s.key, label: s.label, cfDefault: s.cfDefault,
      capexJpyPerKw: s.capexJpyPerKw,
      simpleJpyPerKwh: r.lcoeJpyPerKwh,
      simpleUsdPerMwh: r.lcoeUsdPerMwh,
      atbUsdPerMwh: s.lcoeUsdPerMwh,
    };
  }), [sources, cfBySource, lcoeOmRate, lcoeDiscount, lcoeLife, fxJpyPerUsd]);

  const tabBtn = (key: 'lcos' | 'lcoe', label: string, sub: string) => (
    <button
      onClick={() => setTab(key)}
      style={{
        flex: 1, padding: '12px 14px', cursor: 'pointer', textAlign: 'left',
        border: '1px solid var(--color-border)',
        borderBottom: tab === key ? '3px solid var(--color-accent, #0066cc)' : '1px solid var(--color-border)',
        background: tab === key ? 'var(--color-bg-card, #fff)' : 'var(--color-bg)',
        fontWeight: tab === key ? 700 : 500, borderRadius: '8px 8px 0 0',
      }}
    >
      <span style={{ fontSize: 15 }}>{label}</span>
      <br /><span style={{ fontSize: 15, color: 'var(--color-muted)', fontWeight: 400 }}>{sub}</span>
    </button>
  );

  const cardStyle: CSSProperties = {
    padding: 18, background: 'var(--color-bg-card, #fff)',
    border: '1px solid var(--color-border)', borderRadius: 8,
  };

  return (
    <div>
      {/* タブ */}
      <div style={{ display: 'flex', gap: 6, marginBottom: -1 }}>
        {tabBtn('lcos', 'LCOS（蓄電）', '系統用蓄電池の均等化蓄電原価・主役')}
        {tabBtn('lcoe', 'LCOE（発電）', '電源別の均等化発電原価・比較')}
      </div>

      {/* ───────── LCOS（常時DOM・非選択時 display:none で SEO 維持 #103）───────── */}
      <div style={{ display: tab === 'lcos' ? 'grid' : 'none', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: 16, border: '1px solid var(--color-border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: 18 }}>
          {/* 入力 */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>入力条件（蓄電・容量1kWhあたり）</h2>
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 15, fontWeight: 600, display: 'block', marginBottom: 6 }}>
                蓄電池CAPEX（NREL ATB 2024・米国前提）
              </label>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
                {(['low', 'mid', 'high'] as const).map((m) => (
                  <button key={m} onClick={() => setCapex(m)}
                    style={{
                      flex: 1, padding: '6px 4px', fontSize: 15, cursor: 'pointer', borderRadius: 4,
                      border: '1px solid var(--color-border)',
                      background: capexMode === m ? 'var(--color-accent, #0066cc)' : 'var(--color-bg)',
                      color: capexMode === m ? '#fff' : 'var(--color-text)', fontWeight: capexMode === m ? 700 : 500,
                    }}>
                    {m === 'low' ? '楽観' : m === 'mid' ? '標準' : '保守'}<br />
                    <span style={{ fontSize: 15 }}>{yen(lcosCapex[m])}</span>
                  </button>
                ))}
              </div>
              <Field label="CAPEX（手入力で上書き）" value={lcos.capexJpyPerKwh} onChange={setLcosField('capexJpyPerKwh')}
                min={20000} max={200000} step={1000} unit="¥/kWh"
                hint={`標準=NREL ATB実値（$/kW÷4h×${lcosCapex.fxJpyPerUsd}）。楽観/保守=mid±20%（感度レンジ・仮定）`} />
            </div>
            <Field label="往復効率（RTE）" value={lcos.rte} onChange={setLcosField('rte')} min={0.6} max={0.98} step={0.01} unit="%" pct hint="概数 85%" />
            <Field label="年間サイクル数" value={lcos.cyclesPerYear} onChange={setLcosField('cyclesPerYear')} min={50} max={730} step={5} unit="回/年" />
            <Field label="放電深度（DoD）" value={lcos.dod} onChange={setLcosField('dod')} min={0.5} max={1} step={0.01} unit="%" pct />
            <Field label="充電単価" value={lcos.chargePriceJpyPerKwh} onChange={setLcosField('chargePriceJpyPerKwh')} min={0} max={40} step={0.5} unit="¥/kWh" hint="JEPXスポット平均の概数" />
            <Field label="O&M率（CAPEX比/年）" value={lcos.omRate} onChange={setLcosField('omRate')} min={0} max={0.08} step={0.005} unit="%" pct />
            <Field label="割引率" value={lcos.discountRate} onChange={setLcosField('discountRate')} min={0} max={0.12} step={0.005} unit="%" pct />
            <Field label="事業年数" value={lcos.projectYears} onChange={setLcosField('projectYears')} min={5} max={25} step={1} unit="年" />
            <Field label="サイクル寿命" value={lcos.cycleLife} onChange={setLcosField('cycleLife')} min={1000} max={12000} step={250} unit="回" hint={`実効年数 N = min(事業年数, 寿命/年サイクル) = ${lcosResult.n.toFixed(1)}年`} />
          </div>

          {/* 出力 */}
          <div style={cardStyle}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>LCOS（均等化蓄電原価）</h2>
            <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
              <div style={{ fontSize: 44, fontWeight: 800, lineHeight: 1.1, color: 'var(--color-accent, #0066cc)' }}>
                {yen(lcosResult.lcosJpyPerKwh, 1)}<span style={{ fontSize: 18, fontWeight: 600 }}>/kWh</span>
              </div>
              <div style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 6 }}>
                = {yen(Math.round(lcosResult.lcosJpyPerMwh))}/MWh ・ {usd(Math.round(lcosResult.lcosUsdPerMwh))}/MWh
              </div>
            </div>

            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '8px 0 6px' }}>コスト内訳（寄与）</h3>
            <div style={{ display: 'flex', height: 26, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--color-border)' }}>
              <div style={{ width: `${lcosResult.capexPct}%`, background: '#0066cc' }} title={`CAPEX ${lcosResult.capexPct.toFixed(0)}%`} />
              <div style={{ width: `${lcosResult.chargePct}%`, background: '#e8833a' }} title={`充電費 ${lcosResult.chargePct.toFixed(0)}%`} />
              <div style={{ width: `${lcosResult.omPct}%`, background: '#5aa469' }} title={`O&M ${lcosResult.omPct.toFixed(0)}%`} />
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8, fontSize: 15 }}>
              <span><span style={{ color: '#0066cc' }}>■</span> CAPEX {lcosResult.capexPct.toFixed(0)}%（{yen(lcosResult.capexContrib, 1)}/kWh）</span>
              <span><span style={{ color: '#e8833a' }}>■</span> 充電費 {lcosResult.chargePct.toFixed(0)}%（{yen(lcosResult.chargeContrib, 1)}/kWh）</span>
              <span><span style={{ color: '#5aa469' }}>■</span> O&M {lcosResult.omPct.toFixed(0)}%（{yen(lcosResult.omContrib, 1)}/kWh）</span>
            </div>

            <table style={{ width: '100%', fontSize: 15, marginTop: 16, borderCollapse: 'collapse' }}>
              <tbody>
                {[
                  ['年間放電量（容量1kWhあたり）', `${lcosResult.dischargePerYear.toFixed(1)} kWh/年`],
                  ['年間充電費', yen(Math.round(lcosResult.chargeCostPerYear))],
                  ['年間O&M', yen(Math.round(lcosResult.omPerYear))],
                  ['年金現価係数（割引）', lcosResult.annuity.toFixed(2)],
                ].map(([k, v]) => (
                  <tr key={k} style={{ borderTop: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '6px 0', color: 'var(--color-muted)' }}>{k}</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', fontWeight: 600 }}>{v}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      {/* ───────── LCOE（常時DOM・#103）───────── */}
      <div style={{ display: tab === 'lcoe' ? 'block' : 'none', border: '1px solid var(--color-border)', borderTop: 'none', borderRadius: '0 0 8px 8px', padding: 18 }}>
          <div style={{ ...cardStyle, marginBottom: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <Field label="割引率（共通）" value={lcoeDiscount} onChange={setLcoeDiscount} min={0} max={0.12} step={0.005} unit="%" pct />
            <Field label="設備寿命（共通）" value={lcoeLife} onChange={setLcoeLife} min={10} max={60} step={1} unit="年" />
            <Field label="O&M率（共通）" value={lcoeOmRate} onChange={setLcoeOmRate} min={0} max={0.08} step={0.005} unit="%" pct />
          </div>

          <div style={{ ...cardStyle, overflowX: 'auto' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 4 }}>電源別 簡易LCOE 比較</h2>
            <p style={{ fontSize: 15, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12 }}>
              CAPEX は NREL ATB 2024（$/kW×{fxJpyPerUsd}）。CF は代表値（概数・編集可）。
              「NREL ATB参考値」は ATB が独自CF・前提で算出した公表 LCOE（$/MWh）で、左の簡易値とは前提が異なります。
            </p>
            <table style={{ width: '100%', fontSize: 15, borderCollapse: 'collapse', minWidth: 640 }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'right' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px' }}>電源</th>
                  <th style={{ padding: '6px 8px' }}>CAPEX(¥/kW)</th>
                  <th style={{ padding: '6px 8px' }}>CF(%)</th>
                  <th style={{ padding: '6px 8px' }}>簡易LCOE(¥/kWh)</th>
                  <th style={{ padding: '6px 8px' }}>簡易($/MWh)</th>
                  <th style={{ padding: '6px 8px' }}>NREL ATB参考($/MWh)</th>
                </tr>
              </thead>
              <tbody>
                {lcoeRows.map((r) => (
                  <tr key={r.key} style={{ borderBottom: '1px solid var(--color-border)', textAlign: 'right' }}>
                    <td style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>{r.label}</td>
                    <td style={{ padding: '6px 8px' }}>{yen(Math.round(r.capexJpyPerKw))}</td>
                    <td style={{ padding: '4px 8px' }}>
                      <input type="number" value={Math.round((cfBySource[r.key] ?? r.cfDefault) * 1000) / 10}
                        min={1} max={100} step={1}
                        onChange={(e) => { const n = Number(e.target.value); if (Number.isFinite(n)) setCfBySource((p) => ({ ...p, [r.key]: n / 100 })); }}
                        style={{ width: 56, padding: '3px 4px', fontSize: 15, textAlign: 'right', border: '1px solid var(--color-border)', borderRadius: 4 }}
                        aria-label={`${r.label} 設備利用率`} />
                    </td>
                    <td style={{ padding: '6px 8px', fontWeight: 700, color: 'var(--color-accent, #0066cc)' }}>{yen(r.simpleJpyPerKwh, 1)}</td>
                    <td style={{ padding: '6px 8px' }}>{usd(Math.round(r.simpleUsdPerMwh))}</td>
                    <td style={{ padding: '6px 8px', color: 'var(--color-muted)' }}>{usd(Math.round(r.atbUsdPerMwh))}</td>
                  </tr>
                ))}
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ textAlign: 'left', padding: '6px 8px', fontWeight: 600 }}>火力（参考）</td>
                  <td colSpan={5} style={{ padding: '6px 8px', fontSize: 15, color: 'var(--color-muted)' }}>
                    NREL ATB に火力 LCOE 系列なし。概数 $40–80/MWh ＋ 燃料費・CO2価格依存（定性）。確定ソース調査中につき本ツールでは試算しません（捏造回避）。
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
    </div>
  );
}
