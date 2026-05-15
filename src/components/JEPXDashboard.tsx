/**
 * JEPX ダッシュボード (Client Component)
 *
 * 機能:
 *   - エリア別 30日価格推移 (SVG line chart)
 *   - 30分単位ヒートマップ (24h × 30日)
 *   - 月次平均推移
 *   - 簡易アービトラージ計算
 *   - URL share (window.location)
 *   - CSV エクスポート
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import { DAILY_DATA, MONTHLY_DATA, AREA_LABELS, AREAS, type AreaKey } from '@/data/jepx-history';
import { calcArbitrage, calcAvgArbitrage, compareAreas } from '@/lib/jepx-analyzer';

type View = 'price' | 'heatmap' | 'monthly' | 'arbitrage';

export default function JEPXDashboard() {
  const [view, setView] = useState<View>('price');
  const [area, setArea] = useState<AreaKey>('tokyo');
  const [capacityMWh, setCapacityMWh] = useState<number>(10);
  const [efficiency, setEfficiency] = useState<number>(0.85);
  const [cycles, setCycles] = useState<number>(1);
  const [shareMsg, setShareMsg] = useState<string>('');

  // URL 復元
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const v = sp.get('view');
    const a = sp.get('area');
    const c = sp.get('cap');
    const e = sp.get('eff');
    const cy = sp.get('cycles');
    if (v && ['price', 'heatmap', 'monthly', 'arbitrage'].includes(v)) setView(v as View);
    if (a && AREAS.includes(a as AreaKey)) setArea(a as AreaKey);
    if (c && !isNaN(Number(c))) setCapacityMWh(Number(c));
    if (e && !isNaN(Number(e))) setEfficiency(Number(e));
    if (cy && !isNaN(Number(cy))) setCycles(Number(cy));
  }, []);

  // URL 同期
  useEffect(() => {
    const sp = new URLSearchParams();
    sp.set('view', view);
    sp.set('area', area);
    if (view === 'arbitrage') {
      sp.set('cap', String(capacityMWh));
      sp.set('eff', String(efficiency));
      sp.set('cycles', String(cycles));
    }
    window.history.replaceState(null, '', `?${sp.toString()}`);
  }, [view, area, capacityMWh, efficiency, cycles]);

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href).then(() => {
        setShareMsg('URL をコピーしました');
        setTimeout(() => setShareMsg(''), 2000);
      });
    }
  };

  const dailyRecords = useMemo(() => DAILY_DATA.filter((r) => r.area === area).sort((a, b) => a.daysAgo - b.daysAgo), [area]);
  const monthlyRecords = useMemo(() => MONTHLY_DATA.filter((r) => r.area === area).sort((a, b) => a.monthsAgo - b.monthsAgo), [area]);

  const arbResult = useMemo(() => {
    if (view !== 'arbitrage') return null;
    return calcAvgArbitrage(area, 30, capacityMWh, efficiency, cycles);
  }, [view, area, capacityMWh, efficiency, cycles]);

  const areaComparison = useMemo(() => {
    if (view !== 'arbitrage') return null;
    return compareAreas(30, capacityMWh, efficiency, cycles);
  }, [view, capacityMWh, efficiency, cycles]);

  const exportCSV = () => {
    let csv = '';
    if (view === 'price' || view === 'heatmap') {
      csv = '日付,エリア,平均(円/kWh),最高,最低,' + Array.from({ length: 48 }, (_, i) => `slot${i}`).join(',') + '\n';
      for (const rec of dailyRecords) {
        csv += `${rec.dateStr},${AREA_LABELS[rec.area]},${rec.avg},${rec.max},${rec.min},${rec.slots.join(',')}\n`;
      }
    } else if (view === 'monthly') {
      csv = '月,エリア,平均,最高,最低\n';
      for (const r of monthlyRecords) {
        csv += `${r.yearMonth},${AREA_LABELS[r.area]},${r.avg},${r.max},${r.min}\n`;
      }
    } else if (view === 'arbitrage' && areaComparison) {
      csv = 'エリア,平均日次粗利益(円),平均spread(円/kWh)\n';
      for (const r of areaComparison) {
        csv += `${AREA_LABELS[r.area]},${r.avgNetRevenue},${r.avgSpread}\n`;
      }
    }
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jepx-${view}-${area}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* ビュー切替タブ */}
      <div role="tablist" aria-label="JEPX 分析ビュー" style={{ display: 'flex', gap: 8, borderBottom: '1px solid var(--color-border)', marginBottom: 16, flexWrap: 'wrap' }}>
        {[
          { id: 'price', label: '価格推移' },
          { id: 'heatmap', label: 'ヒートマップ' },
          { id: 'monthly', label: '月次推移' },
          { id: 'arbitrage', label: 'アービトラージ計算' },
        ].map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={view === tab.id}
            onClick={() => setView(tab.id as View)}
            style={{
              padding: '8px 14px',
              border: 'none',
              borderBottom: view === tab.id ? '2px solid var(--color-accent)' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer',
              fontWeight: view === tab.id ? 700 : 500,
              color: view === tab.id ? 'var(--color-accent)' : 'var(--color-text)',
              fontSize: 14,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* エリア選択 */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <label style={{ fontSize: 13, fontWeight: 600 }}>エリア:</label>
        <select value={area} onChange={(e) => setArea(e.target.value as AreaKey)} style={{ padding: '6px 10px', border: '1px solid var(--color-border)', borderRadius: 4, fontSize: 13 }}>
          {AREAS.map((a) => (<option key={a} value={a}>{AREA_LABELS[a]}</option>))}
        </select>
        <button onClick={handleShare} style={{ padding: '6px 12px', fontSize: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer' }}>URL共有</button>
        <button onClick={exportCSV} style={{ padding: '6px 12px', fontSize: 12, background: 'var(--color-bg)', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer' }}>CSV出力</button>
        {shareMsg && <span style={{ fontSize: 12, color: 'var(--color-accent)' }} aria-live="polite">{shareMsg}</span>}
      </div>

      {/* 価格推移 (line chart) */}
      {view === 'price' && (
        <PriceChart records={dailyRecords} />
      )}

      {/* ヒートマップ (slot × day) */}
      {view === 'heatmap' && (
        <Heatmap records={dailyRecords} />
      )}

      {/* 月次推移 (bar chart) */}
      {view === 'monthly' && (
        <MonthlyChart records={monthlyRecords} />
      )}

      {/* アービトラージ */}
      {view === 'arbitrage' && (
        <ArbitrageView
          area={area}
          capacityMWh={capacityMWh}
          setCapacityMWh={setCapacityMWh}
          efficiency={efficiency}
          setEfficiency={setEfficiency}
          cycles={cycles}
          setCycles={setCycles}
          result={arbResult}
          comparison={areaComparison}
        />
      )}

      <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 16, lineHeight: 1.6 }}>
        ※ 本データは JEPX 公表値ベースの<strong>モック</strong>です (編集部生成、決定論的)。
        最新の実勢値は <a href="https://www.jepx.jp/electricpower/market-data/spot/" target="_blank" rel="noopener noreferrer">JEPX 公式</a> を参照。
      </p>
    </div>
  );
}

// 価格推移チャート (SVG line)
function PriceChart({ records }: { records: { dateStr: string; daysAgo: number; avg: number; max: number; min: number }[] }) {
  if (records.length === 0) return null;
  const W = 720, H = 280, PAD = 40;
  const all = records.flatMap((r) => [r.max, r.min]);
  const yMax = Math.max(...all) * 1.05;
  const yMin = 0;
  const xs = records.map((_, i) => PAD + (i / (records.length - 1)) * (W - PAD * 2));
  const ys = (v: number) => H - PAD - ((v - yMin) / (yMax - yMin)) * (H - PAD * 2);
  const lineAvg = records.map((r, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${ys(r.avg)}`).join(' ');
  const lineMax = records.map((r, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${ys(r.max)}`).join(' ');
  const lineMin = records.map((r, i) => `${i === 0 ? 'M' : 'L'} ${xs[i]} ${ys(r.min)}`).join(' ');
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto' }} role="img" aria-label="価格推移">
        {/* Y軸 */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const y = PAD + t * (H - PAD * 2);
          const v = yMax - t * (yMax - yMin);
          return (
            <g key={t}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#eee" />
              <text x={PAD - 4} y={y + 4} fontSize={10} textAnchor="end" fill="#666">{Math.round(v)}</text>
            </g>
          );
        })}
        {/* lines */}
        <path d={lineMax} fill="none" stroke="#e35" strokeWidth={1} strokeDasharray="3,3" />
        <path d={lineMin} fill="none" stroke="#39c" strokeWidth={1} strokeDasharray="3,3" />
        <path d={lineAvg} fill="none" stroke="#0066cc" strokeWidth={2} />
        {/* X軸 labels */}
        {[0, Math.floor(records.length / 2), records.length - 1].map((i) => (
          <text key={i} x={xs[i]} y={H - PAD + 14} fontSize={10} textAnchor="middle" fill="#666">{records[i].dateStr.slice(5)}</text>
        ))}
        {/* legend */}
        <g transform={`translate(${W - 140}, ${PAD + 6})`}>
          <rect x={0} y={0} width={130} height={48} fill="white" stroke="#ddd" />
          <line x1={6} y1={12} x2={20} y2={12} stroke="#0066cc" strokeWidth={2} />
          <text x={24} y={15} fontSize={10}>平均</text>
          <line x1={6} y1={26} x2={20} y2={26} stroke="#e35" strokeDasharray="3,3" />
          <text x={24} y={29} fontSize={10}>最高</text>
          <line x1={6} y1={40} x2={20} y2={40} stroke="#39c" strokeDasharray="3,3" />
          <text x={24} y={43} fontSize={10}>最低</text>
        </g>
      </svg>
    </div>
  );
}

// ヒートマップ (slot × day)
function Heatmap({ records }: { records: { dateStr: string; daysAgo: number; slots: number[] }[] }) {
  if (records.length === 0) return null;
  const allValues = records.flatMap((r) => r.slots);
  const vMax = Math.max(...allValues);
  const vMin = Math.min(...allValues);
  const colorFor = (v: number): string => {
    const t = (v - vMin) / (vMax - vMin);
    // ヒート: blue → yellow → red
    const r = Math.round(t * 220 + 30);
    const g = Math.round((1 - Math.abs(t - 0.5) * 2) * 200 + 30);
    const b = Math.round((1 - t) * 200 + 40);
    return `rgb(${r},${g},${b})`;
  };
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ borderCollapse: 'collapse', fontSize: 9, lineHeight: 1 }} aria-label="価格ヒートマップ">
        <thead>
          <tr>
            <th style={{ padding: 2, textAlign: 'left', minWidth: 60 }}>日付</th>
            {Array.from({ length: 48 }, (_, i) => (
              <th key={i} style={{ padding: 1, fontWeight: 'normal', minWidth: 14 }}>
                {i % 4 === 0 ? `${Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'}` : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {records.map((rec) => (
            <tr key={rec.dateStr}>
              <td style={{ padding: '2px 4px', whiteSpace: 'nowrap' }}>{rec.dateStr.slice(5)}</td>
              {rec.slots.map((v, i) => (
                <td key={i} title={`${rec.dateStr} ${Math.floor(i / 2)}:${i % 2 === 0 ? '00' : '30'} ${v}円`}
                  style={{ background: colorFor(v), width: 14, height: 14, padding: 0, border: '1px solid #fff' }}>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 8 }}>
        色: 青 (安値、{vMin.toFixed(1)}円) → 黄 → 赤 (高値、{vMax.toFixed(1)}円) / マウスオーバーで詳細
      </p>
    </div>
  );
}

// 月次推移 (bar chart)
function MonthlyChart({ records }: { records: { yearMonth: string; avg: number; max: number; min: number }[] }) {
  if (records.length === 0) return null;
  const sorted = [...records].reverse(); // oldest first
  const W = 720, H = 240, PAD = 40;
  const vMax = Math.max(...sorted.map((r) => r.max)) * 1.05;
  const barW = (W - PAD * 2) / sorted.length * 0.7;
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto' }} role="img" aria-label="月次価格推移">
        {[0, 0.5, 1].map((t) => {
          const y = PAD + t * (H - PAD * 2);
          const v = vMax * (1 - t);
          return (
            <g key={t}>
              <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#eee" />
              <text x={PAD - 4} y={y + 4} fontSize={10} textAnchor="end" fill="#666">{Math.round(v)}</text>
            </g>
          );
        })}
        {sorted.map((r, i) => {
          const x = PAD + (i + 0.5) * ((W - PAD * 2) / sorted.length) - barW / 2;
          const h = (r.avg / vMax) * (H - PAD * 2);
          return (
            <g key={r.yearMonth}>
              <rect x={x} y={H - PAD - h} width={barW} height={h} fill="#0066cc" opacity={0.8} />
              <text x={x + barW / 2} y={H - PAD + 12} fontSize={9} textAnchor="middle" fill="#666">{r.yearMonth.slice(2)}</text>
              <text x={x + barW / 2} y={H - PAD - h - 4} fontSize={9} textAnchor="middle" fill="#333">{r.avg.toFixed(1)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// アービトラージ計算
function ArbitrageView({ area, capacityMWh, setCapacityMWh, efficiency, setEfficiency, cycles, setCycles, result, comparison }: {
  area: AreaKey;
  capacityMWh: number; setCapacityMWh: (v: number) => void;
  efficiency: number; setEfficiency: (v: number) => void;
  cycles: number; setCycles: (v: number) => void;
  result: ReturnType<typeof calcAvgArbitrage> | null;
  comparison: ReturnType<typeof compareAreas> | null;
}) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>容量 (MWh)</label>
          <input type="number" min={1} max={500} step={1} value={capacityMWh} onChange={(e) => setCapacityMWh(Number(e.target.value))}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 4 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>往復効率 (%)</label>
          <input type="number" min={50} max={100} step={1} value={Math.round(efficiency * 100)} onChange={(e) => setEfficiency(Number(e.target.value) / 100)}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 4 }} />
        </div>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>1日サイクル数</label>
          <select value={cycles} onChange={(e) => setCycles(Number(e.target.value))}
            style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--color-border)', borderRadius: 4 }}>
            <option value={1}>1サイクル</option>
            <option value={2}>2サイクル</option>
          </select>
        </div>
      </div>

      {result && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 16 }}>
          <Card label="過去30日 平均日次粗利益" value={`${result.avgNetRevenue.toLocaleString()}円`} accent />
          <Card label="月次換算 (30日)" value={`${result.totalRevenue.toLocaleString()}円`} />
          <Card label="ベスト日" value={result.bestDay ? `${result.bestDay.netRevenue.toLocaleString()}円 (${result.bestDay.date.slice(5)})` : '-'} />
          <Card label="ワースト日" value={result.worstDay ? `${result.worstDay.netRevenue.toLocaleString()}円 (${result.worstDay.date.slice(5)})` : '-'} />
        </div>
      )}

      {comparison && (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>9エリア比較 (過去30日 平均日次粗利益)</h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--color-bg)' }}>
                <th style={{ padding: 6, textAlign: 'left', border: '1px solid var(--color-border)' }}>エリア</th>
                <th style={{ padding: 6, textAlign: 'right', border: '1px solid var(--color-border)' }}>平均日次粗利益 (円)</th>
                <th style={{ padding: 6, textAlign: 'right', border: '1px solid var(--color-border)' }}>平均spread (円/kWh)</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((r) => (
                <tr key={r.area} style={{ background: r.area === area ? 'rgba(0, 102, 204, 0.08)' : 'transparent' }}>
                  <td style={{ padding: 6, border: '1px solid var(--color-border)' }}>{AREA_LABELS[r.area]}{r.area === area ? ' ←' : ''}</td>
                  <td style={{ padding: 6, textAlign: 'right', border: '1px solid var(--color-border)' }}>{r.avgNetRevenue.toLocaleString()}</td>
                  <td style={{ padding: 6, textAlign: 'right', border: '1px solid var(--color-border)' }}>{r.avgSpread}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{
      padding: 12, border: '1px solid var(--color-border)', borderRadius: 6,
      background: accent ? 'rgba(0, 102, 204, 0.08)' : 'transparent',
    }}>
      <div style={{ fontSize: 11, color: 'var(--color-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: accent ? 18 : 16, fontWeight: 700 }}>{value}</div>
    </div>
  );
}
