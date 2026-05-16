'use client';

/**
 * src/components/IRRSimulator.tsx
 *
 * 蓄電池IRRシミュレーター UI (依頼AM、業界唯一機能)
 *
 * 機能:
 *  - 3 ステップフォーム (設備 / 投資 / 市場前提)
 *  - 楽観 / 標準 / 悲観 の 3 シナリオ並列計算 + 結果表示
 *  - 年次キャッシュフロー SVG チャート (Recharts 非依存、軽量)
 *  - 感応度分析 ±10%
 *  - CSV エクスポート (年次CF含む)
 *  - URL params で入力共有 (window.location + history.replaceState、落とし穴 #92 対応)
 *  - アクセシビリティ: ARIA、キーボード操作、コントラスト WCAG AA
 *
 * 落とし穴対応:
 *  - #92: useSearchParams 不使用、window.location.search を mount 時に CSR で復元
 *  - #95-98: microCMS リクエストなし (client-side 計算のみ、サイト最安全)
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  calculateAll,
  calculateSensitivity,
  type IRRInput,
  type IRRResult,
  type SensitivityResult,
} from '@/lib/irr-calculator';
import {
  COMMON_DEFAULTS,
  SCENARIO_DEFAULTS,
  SCENARIO_LABELS,
  SCENARIO_DESCRIPTIONS,
  SCENARIO_COLORS,
  getScenarioInput,
  type ScenarioKey,
} from '@/lib/irr-defaults';

const SCENARIO_KEYS: ScenarioKey[] = ['optimistic', 'standard', 'pessimistic'];

// ─────────────────────────────────────
// URL params シリアライズ (落とし穴 #92: window.location ベース)
// ─────────────────────────────────────

function inputToParams(input: IRRInput): URLSearchParams {
  const sp = new URLSearchParams();
  // 数値 keys を短縮形で詰める (URL 短く保つ)
  const map: Record<string, keyof IRRInput> = {
    c: 'capacity_mwh',
    o: 'output_mw',
    e: 'efficiency',
    l: 'lifespan_years',
    cy: 'cycles_per_year',
    d: 'dod',
    cx: 'capex_oku',
    ox: 'opex_yen_per_mw_year',
    sb: 'subsidy_rate',
    sh: 'spot_high',
    sl: 'spot_low',
    cm: 'capacity_market_yen_per_kw_year',
    an: 'ancillary_yen_per_kw_month',
  };
  for (const [k, v] of Object.entries(map)) {
    const val = input[v];
    if (typeof val === 'number') sp.set(k, String(val));
  }
  return sp;
}

function paramsToInput(sp: URLSearchParams, base: IRRInput): IRRInput {
  const map: Record<string, keyof IRRInput> = {
    c: 'capacity_mwh',
    o: 'output_mw',
    e: 'efficiency',
    l: 'lifespan_years',
    cy: 'cycles_per_year',
    d: 'dod',
    cx: 'capex_oku',
    ox: 'opex_yen_per_mw_year',
    sb: 'subsidy_rate',
    sh: 'spot_high',
    sl: 'spot_low',
    cm: 'capacity_market_yen_per_kw_year',
    an: 'ancillary_yen_per_kw_month',
  };
  const out: IRRInput = { ...base };
  for (const [k, v] of Object.entries(map)) {
    const sv = sp.get(k);
    if (sv !== null && sv !== '') {
      const n = Number(sv);
      if (Number.isFinite(n)) {
        (out as unknown as Record<string, number>)[v as string] = n;
      }
    }
  }
  return out;
}

// ─────────────────────────────────────
// SVG キャッシュフロー チャート (Recharts 非依存、軽量自前実装)
// ─────────────────────────────────────

function CashflowChart({
  data,
  height = 480,
}: {
  data: Record<ScenarioKey, IRRResult>;
  height?: number;
}) {
  // EDA 改善 #5: 高さ 280 → 480 + SVG W 700 → 900 で aspect ratio 1.875:1 (FRED スタイル時系列)
  const lifespan = data.standard.cashflow.length - 1;
  // 全シナリオの cumulative の min/max を取得
  const allCumValues = SCENARIO_KEYS.flatMap((k) =>
    data[k].cashflow.map((c) => c.cumulative)
  );
  const yMin = Math.floor(Math.min(...allCumValues, -1) - 1);
  const yMax = Math.ceil(Math.max(...allCumValues, 1) + 1);
  const yRange = yMax - yMin;

  // padding (Y軸ラベル領域も拡大)
  const PAD_L = 72;
  const PAD_R = 24;
  const PAD_T = 40; // 凡例領域確保
  const PAD_B = 50;
  const W = 900;
  const H = height;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const xScale = (year: number) => PAD_L + (year / lifespan) * chartW;
  const yScale = (cum: number) =>
    PAD_T + ((yMax - cum) / yRange) * chartH;

  // y 軸 grid (5 段)
  const yTicks: number[] = [];
  for (let i = 0; i <= 5; i++) {
    yTicks.push(yMin + (yRange * i) / 5);
  }

  // x 軸 grid (5 年刻み)
  const xTicks: number[] = [];
  for (let y = 0; y <= lifespan; y += 5) xTicks.push(y);
  if (xTicks[xTicks.length - 1] !== lifespan) xTicks.push(lifespan);

  return (
    <div style={{ width: '100%', overflowX: 'auto' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', maxWidth: W, height: 'auto' }}
        role="img"
        aria-label="年次累積キャッシュフロー チャート (3 シナリオ並列)"
      >
        {/* y grid */}
        {yTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={PAD_L}
              x2={PAD_L + chartW}
              y1={yScale(t)}
              y2={yScale(t)}
              stroke="#eee"
              strokeWidth={1}
            />
            <text
              x={PAD_L - 8}
              y={yScale(t) + 5}
              fontSize={14}
              textAnchor="end"
              fill="#666"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {t.toFixed(0)} 億
            </text>
          </g>
        ))}
        {/* x grid */}
        {xTicks.map((t, i) => (
          <g key={i}>
            <line
              x1={xScale(t)}
              x2={xScale(t)}
              y1={PAD_T}
              y2={PAD_T + chartH}
              stroke="#f3f3f3"
              strokeWidth={1}
            />
            <text
              x={xScale(t)}
              y={H - 16}
              fontSize={14}
              textAnchor="middle"
              fill="#666"
              style={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {t}年
            </text>
          </g>
        ))}
        {/* 0 ライン強調 */}
        {yTicks.includes(0) && (
          <line
            x1={PAD_L}
            x2={PAD_L + chartW}
            y1={yScale(0)}
            y2={yScale(0)}
            stroke="#888"
            strokeWidth={1.5}
            strokeDasharray="2,2"
          />
        )}
        {/* 各シナリオのライン */}
        {SCENARIO_KEYS.map((key) => {
          const points = data[key].cashflow
            .map((cf) => `${xScale(cf.year)},${yScale(cf.cumulative)}`)
            .join(' ');
          return (
            <polyline
              key={key}
              points={points}
              fill="none"
              stroke={SCENARIO_COLORS[key]}
              strokeWidth={2.5}
              strokeLinejoin="round"
            />
          );
        })}
        {/* 凡例: PAD_T 拡大に伴い上部に移動、fontSize 12 → 14 */}
        <g transform={`translate(${PAD_L + 10}, 8)`}>
          {SCENARIO_KEYS.map((key, i) => (
            <g key={key} transform={`translate(${i * 110}, 0)`}>
              <line
                x1={0}
                y1={10}
                x2={24}
                y2={10}
                stroke={SCENARIO_COLORS[key]}
                strokeWidth={2.5}
              />
              <text x={30} y={14} fontSize={14} fill="#333" fontWeight={500}>
                {SCENARIO_LABELS[key]}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────
// CSV エクスポート (papaparse 非依存)
// ─────────────────────────────────────

function buildCsv(
  inputs: Record<ScenarioKey, IRRInput>,
  results: Record<ScenarioKey, IRRResult>
): string {
  const lines: string[] = [];
  lines.push('# 蓄電池IRRシミュレーター 結果出力 (bess-net.jp/tools/irr-simulator)');
  lines.push(`# 生成日時: ${new Date().toISOString()}`);
  lines.push('');

  // サマリ
  lines.push('## サマリ');
  lines.push(',楽観,標準,悲観');
  lines.push(
    [
      'IRR (%)',
      results.optimistic.irr?.toFixed(2) ?? 'N/A',
      results.standard.irr?.toFixed(2) ?? 'N/A',
      results.pessimistic.irr?.toFixed(2) ?? 'N/A',
    ].join(',')
  );
  lines.push(
    [
      'NPV (億円)',
      results.optimistic.npv.toFixed(2),
      results.standard.npv.toFixed(2),
      results.pessimistic.npv.toFixed(2),
    ].join(',')
  );
  lines.push(
    [
      'Payback (年)',
      results.optimistic.payback_years?.toFixed(2) ?? '未達',
      results.standard.payback_years?.toFixed(2) ?? '未達',
      results.pessimistic.payback_years?.toFixed(2) ?? '未達',
    ].join(',')
  );
  lines.push(
    [
      '初期投資 (億円)',
      results.optimistic.initial_investment_oku.toFixed(2),
      results.standard.initial_investment_oku.toFixed(2),
      results.pessimistic.initial_investment_oku.toFixed(2),
    ].join(',')
  );
  lines.push('');

  // 入力前提
  lines.push('## 入力前提');
  lines.push(',楽観,標準,悲観');
  const fields: Array<[string, keyof IRRInput]> = [
    ['容量 (MWh)', 'capacity_mwh'],
    ['出力 (MW)', 'output_mw'],
    ['効率 (%)', 'efficiency'],
    ['耐用年数', 'lifespan_years'],
    ['サイクル/年', 'cycles_per_year'],
    ['DoD (%)', 'dod'],
    ['CAPEX (億円)', 'capex_oku'],
    ['OPEX (円/MW/年)', 'opex_yen_per_mw_year'],
    ['補助金 (%)', 'subsidy_rate'],
    ['スポット高 (円/kWh)', 'spot_high'],
    ['スポット低 (円/kWh)', 'spot_low'],
    ['容量市場 (円/kW/年)', 'capacity_market_yen_per_kw_year'],
    ['需給調整 (円/kW/月)', 'ancillary_yen_per_kw_month'],
  ];
  for (const [label, key] of fields) {
    lines.push(
      [
        label,
        String(inputs.optimistic[key] ?? ''),
        String(inputs.standard[key] ?? ''),
        String(inputs.pessimistic[key] ?? ''),
      ].join(',')
    );
  }
  lines.push('');

  // 年次CF
  lines.push('## 年次累積キャッシュフロー (億円)');
  lines.push('年,楽観,標準,悲観');
  const lifespan = inputs.standard.lifespan_years;
  for (let y = 0; y <= lifespan; y++) {
    const o = results.optimistic.cashflow[y]?.cumulative.toFixed(2) ?? '';
    const s = results.standard.cashflow[y]?.cumulative.toFixed(2) ?? '';
    const p = results.pessimistic.cashflow[y]?.cumulative.toFixed(2) ?? '';
    lines.push(`${y},${o},${s},${p}`);
  }

  return lines.join('\n');
}

function downloadCsv(content: string, filename: string) {
  const bom = '﻿'; // Excel UTF-8 BOM
  const blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────
// 数値入力フィールド共通コンポーネント
// ─────────────────────────────────────

function NumberField({
  label,
  value,
  onChange,
  step = 1,
  min,
  max,
  unit,
  hint,
  id,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  hint?: string;
  id: string;
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      {/* EDA 改善 1, 3: label fontSize 13 → 16、input fontSize 14 → 18、padding 拡大 */}
      <label
        htmlFor={id}
        style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}
      >
        {label}
        {unit && (
          <span style={{ color: 'var(--color-muted)', marginLeft: 4, fontWeight: 400 }}>
            ({unit})
          </span>
        )}
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="tabular-nums"
        style={{
          width: '100%',
          padding: '10px 14px',
          fontSize: 18,
          fontVariantNumeric: 'tabular-nums',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          fontFamily: 'inherit',
        }}
      />
      {hint && (
        <p
          id={`${id}-hint`}
          style={{
            fontSize: 14,
            color: 'var(--color-muted)',
            marginTop: 6,
            marginBottom: 0,
            lineHeight: 1.5,
          }}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// メイン
// ─────────────────────────────────────

export default function IRRSimulator() {
  // 入力 state: 3 シナリオ別の IRRInput を保持
  const [inputs, setInputs] = useState<Record<ScenarioKey, IRRInput>>({
    optimistic: getScenarioInput('optimistic'),
    standard: getScenarioInput('standard'),
    pessimistic: getScenarioInput('pessimistic'),
  });
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [activeEditing, setActiveEditing] = useState<ScenarioKey>('standard');
  const [hydrated, setHydrated] = useState(false);

  // mount 時に URL params から復元 (落とし穴 #92: useSearchParams 不使用)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.toString().length > 0) {
      // 共有 URL からの遷移時のみ、標準シナリオに override 適用
      setInputs((prev) => ({
        ...prev,
        standard: paramsToInput(sp, prev.standard),
      }));
    }
    setHydrated(true);
  }, []);

  // 入力変更時に URL を更新 (history.replaceState、history 汚染なし)
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const sp = inputToParams(inputs.standard);
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [inputs.standard, hydrated]);

  // 計算結果 (memo、入力変更時のみ再計算)
  const results = useMemo<Record<ScenarioKey, IRRResult>>(() => ({
    optimistic: calculateAll(inputs.optimistic),
    standard: calculateAll(inputs.standard),
    pessimistic: calculateAll(inputs.pessimistic),
  }), [inputs]);

  const sensitivity = useMemo<SensitivityResult>(
    () => calculateSensitivity(inputs.standard),
    [inputs.standard]
  );

  // 個別 field 更新ヘルパ (現在編集中のシナリオに対し)
  const updateField = (field: keyof IRRInput, value: number) => {
    setInputs((prev) => ({
      ...prev,
      [activeEditing]: { ...prev[activeEditing], [field]: value },
    }));
  };

  const updateAllField = (field: keyof IRRInput, value: number) => {
    setInputs((prev) => ({
      optimistic: { ...prev.optimistic, [field]: value },
      standard: { ...prev.standard, [field]: value },
      pessimistic: { ...prev.pessimistic, [field]: value },
    }));
  };

  const resetDefaults = () => {
    setInputs({
      optimistic: getScenarioInput('optimistic'),
      standard: getScenarioInput('standard'),
      pessimistic: getScenarioInput('pessimistic'),
    });
  };

  const handleCsvExport = () => {
    const csv = buildCsv(inputs, results);
    downloadCsv(csv, `bess-irr-simulation-${new Date().toISOString().slice(0, 10)}.csv`);
  };

  const handleShareUrl = async () => {
    const sp = inputToParams(inputs.standard);
    const url = `${window.location.origin}${window.location.pathname}?${sp.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('入力条件付き URL をクリップボードにコピーしました\n' + url);
    } catch {
      // fallback: prompt
      prompt('URL をコピーしてください:', url);
    }
  };

  // 現在編集中のシナリオの入力 (active editing)
  const cur = inputs[activeEditing];

  // ─────────────────────────────────────
  // 描画
  // ─────────────────────────────────────

  return (
    <div>
      {/* 注意書き */}
      <div
        style={{
          padding: 12,
          marginBottom: 16,
          background: '#fff8e1',
          border: '1px solid #f1c40f',
          borderRadius: 6,
          fontSize: 13,
        }}
      >
        ⚠️ <strong>本シミュレーターは投資判断の参考情報です</strong>。すべての市場 (容量市場・需給調整市場・スポット市場アービトラージ) を併用可能な
        理論上限を示します。現実は市場間の時間配分で trade-off が発生するため、実事業 IRR は本結果より下振れする可能性があります。
        計算ロジック・前提値の詳細は <Link href="/explainer/grid-scale-bess" style={{color:'var(--color-accent, #0066cc)'}}>解説記事</Link> を参照ください。
      </div>

      {/* シナリオ切替 (どのシナリオの値を編集するか) */}
      <div
        style={{
          marginBottom: 16,
          padding: 12,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
        }}
      >
        <label style={{ fontSize: 13, fontWeight: 600, marginRight: 12 }}>
          編集するシナリオ:
        </label>
        {SCENARIO_KEYS.map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setActiveEditing(k)}
            aria-pressed={activeEditing === k}
            style={{
              marginRight: 8,
              padding: '6px 14px',
              fontSize: 13,
              fontWeight: 600,
              background: activeEditing === k ? SCENARIO_COLORS[k] : '#fff',
              color: activeEditing === k ? '#fff' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderRadius: 4,
              cursor: 'pointer',
            }}
          >
            {SCENARIO_LABELS[k]}
          </button>
        ))}
        <button
          type="button"
          onClick={resetDefaults}
          style={{
            marginLeft: 16,
            padding: '6px 14px',
            fontSize: 13,
            background: 'transparent',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          デフォルトに戻す
        </button>
        <p
          style={{
            fontSize: 12,
            color: 'var(--color-muted)',
            marginTop: 8,
            marginBottom: 0,
          }}
        >
          {SCENARIO_DESCRIPTIONS[activeEditing]}
        </p>
      </div>

      {/* ステップタブ */}
      <div
        role="tablist"
        aria-label="入力ステップ"
        style={{
          display: 'flex',
          gap: 4,
          marginBottom: 16,
          borderBottom: '2px solid var(--color-border)',
        }}
      >
        {[1, 2, 3].map((s) => (
          <button
            key={s}
            role="tab"
            type="button"
            aria-selected={step === s}
            onClick={() => setStep(s as 1 | 2 | 3)}
            style={{
              padding: '10px 18px',
              fontSize: 14,
              fontWeight: 600,
              background: step === s ? 'var(--color-accent, #0066cc)' : '#fff',
              color: step === s ? '#fff' : 'var(--color-text)',
              border: '1px solid var(--color-border)',
              borderBottom: 'none',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
            }}
          >
            Step {s}/3
            {s === 1 && ' 設備'}
            {s === 2 && ' 投資'}
            {s === 3 && ' 市場前提'}
          </button>
        ))}
      </div>

      {/* フォーム */}
      <form
        role="form"
        aria-label="蓄電池IRRシミュレーター 入力フォーム"
        onSubmit={(e) => e.preventDefault()}
        style={{
          padding: 16,
          background: 'var(--color-bg-card, #fff)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          marginBottom: 24,
        }}
      >
        {step === 1 && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              Step 1/3: 設備情報 (3 シナリオ共通)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 14 }}>
              ※ 設備情報の変更は 3 シナリオ全てに同時適用されます (物理的設備の前提)。
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <NumberField
                id="capacity_mwh"
                label="定格容量"
                unit="MWh"
                value={cur.capacity_mwh}
                onChange={(v) => updateAllField('capacity_mwh', v)}
                step={1}
                min={1}
                max={1000}
                hint="例: 50 MWh"
              />
              <NumberField
                id="output_mw"
                label="定格出力"
                unit="MW"
                value={cur.output_mw}
                onChange={(v) => updateAllField('output_mw', v)}
                step={0.1}
                min={0.1}
                hint="例: 12.5 MW (4h 放電) / 業界標準刻み 0.1"
              />
              <NumberField
                id="efficiency"
                label="充放電効率"
                unit="%"
                value={cur.efficiency}
                onChange={(v) => updateAllField('efficiency', v)}
                step={1}
                min={50}
                max={100}
                hint="LFP 系: 85-90%"
              />
              <NumberField
                id="lifespan_years"
                label="設備耐用年数"
                unit="年"
                value={cur.lifespan_years}
                onChange={(v) => updateAllField('lifespan_years', v)}
                step={1}
                min={5}
                max={40}
                hint="一般 20 年"
              />
              <NumberField
                id="cycles_per_year"
                label="年間サイクル数"
                unit="回"
                value={cur.cycles_per_year}
                onChange={(v) => updateAllField('cycles_per_year', v)}
                step={10}
                min={1}
                max={730}
                hint="365 = 1日1サイクル"
              />
              <NumberField
                id="dod"
                label="放電深度 (DoD)"
                unit="%"
                value={cur.dod}
                onChange={(v) => updateAllField('dod', v)}
                step={1}
                min={50}
                max={100}
                hint="一般 80-90%"
              />
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              Step 2/3: 投資情報 (シナリオ別)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 14 }}>
              ※ 現在 <strong>{SCENARIO_LABELS[activeEditing]}</strong> シナリオを編集中
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <NumberField
                id="capex_oku"
                label="初期投資 (CAPEX)"
                unit="億円"
                value={cur.capex_oku}
                onChange={(v) => updateField('capex_oku', v)}
                step={1}
                min={1}
                max={500}
                hint="例: 標準 26 億円"
              />
              <NumberField
                id="opex_yen_per_mw_year"
                label="年間運用費 (OPEX)"
                unit="円/MW/年"
                value={cur.opex_yen_per_mw_year}
                onChange={(v) => updateField('opex_yen_per_mw_year', v)}
                step={100_000}
                min={0}
                max={50_000_000}
                hint="例: 5,000,000"
              />
              <NumberField
                id="subsidy_rate"
                label="補助金率"
                unit="%"
                value={cur.subsidy_rate}
                onChange={(v) => updateField('subsidy_rate', v)}
                step={1}
                min={0}
                max={100}
                hint="SII: 33%、自治体併用 40%、無補助 0%"
              />
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              Step 3/3: 市場前提 (シナリオ別)
            </h3>
            <p style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 14 }}>
              ※ 現在 <strong>{SCENARIO_LABELS[activeEditing]}</strong> シナリオを編集中
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <NumberField
                id="spot_high"
                label="スポット高値"
                unit="円/kWh"
                value={cur.spot_high}
                onChange={(v) => updateField('spot_high', v)}
                step={0.1}
                min={0}
                max={100}
                hint="JEPX 高値 (放電時) / 業界標準刻み 0.1"
              />
              <NumberField
                id="spot_low"
                label="スポット低値"
                unit="円/kWh"
                value={cur.spot_low}
                onChange={(v) => updateField('spot_low', v)}
                step={0.1}
                min={0}
                max={100}
                hint="JEPX 低値 (充電時) / 業界標準刻み 0.1"
              />
              <NumberField
                id="capacity_market_yen_per_kw_year"
                label="容量市場対価"
                unit="円/kW/年"
                value={cur.capacity_market_yen_per_kw_year}
                onChange={(v) => updateField('capacity_market_yen_per_kw_year', v)}
                step={500}
                min={0}
                max={50_000}
                hint="2025年度オークション ~8,000"
              />
              <NumberField
                id="ancillary_yen_per_kw_month"
                label="需給調整対価"
                unit="円/kW/月"
                value={cur.ancillary_yen_per_kw_month}
                onChange={(v) => updateField('ancillary_yen_per_kw_month', v)}
                step={100}
                min={0}
                max={10_000}
                hint="三次調整力相当"
              />
            </div>
          </div>
        )}

        <div
          style={{
            display: 'flex',
            gap: 8,
            marginTop: 16,
            paddingTop: 12,
            borderTop: '1px solid var(--color-border)',
          }}
        >
          {step > 1 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                cursor: 'pointer',
              }}
            >
              ← 前のステップ
            </button>
          )}
          {step < 3 && (
            <button
              type="button"
              onClick={() => setStep((s) => (s + 1) as 1 | 2 | 3)}
              style={{
                padding: '8px 16px',
                fontSize: 14,
                background: 'var(--color-accent, #0066cc)',
                color: '#fff',
                border: 'none',
                borderRadius: 4,
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              次のステップ →
            </button>
          )}
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 12,
              color: 'var(--color-muted)',
              alignSelf: 'center',
            }}
            aria-live="polite"
          >
            入力変更で結果が即座に再計算されます
          </span>
        </div>
      </form>

      {/* 結果サマリ (3 シナリオ並列) */}
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginTop: 0,
          marginBottom: 12,
        }}
      >
        計算結果 (3 シナリオ並列)
      </h2>
      <div
        role="region"
        aria-label="計算結果サマリ"
        aria-live="polite"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginBottom: 24,
        }}
      >
        {SCENARIO_KEYS.map((k) => {
          const r = results[k];
          return (
            <div
              key={k}
              style={{
                padding: 16,
                background: 'var(--color-bg-card, #fff)',
                border: `2px solid ${SCENARIO_COLORS[k]}`,
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: SCENARIO_COLORS[k],
                  marginBottom: 8,
                }}
              >
                {SCENARIO_LABELS[k]}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-muted)', marginBottom: 4 }}>
                IRR
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>
                {r.irr !== null ? `${r.irr.toFixed(1)}%` : '計算不可'}
              </div>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 8,
                  fontSize: 12,
                }}
              >
                <div>
                  <div style={{ color: 'var(--color-muted)' }}>NPV @5%</div>
                  <div style={{ fontWeight: 600 }}>
                    {r.npv >= 0 ? '+' : ''}
                    {r.npv.toFixed(1)} 億
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-muted)' }}>Payback</div>
                  <div style={{ fontWeight: 600 }}>
                    {r.payback_years !== null
                      ? `${r.payback_years.toFixed(1)}年`
                      : '未達'}
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-muted)' }}>初期投資</div>
                  <div style={{ fontWeight: 600 }}>
                    {r.initial_investment_oku.toFixed(1)} 億
                  </div>
                </div>
                <div>
                  <div style={{ color: 'var(--color-muted)' }}>1年目CF</div>
                  <div style={{ fontWeight: 600 }}>
                    {(r.cashflow[1]?.yearly ?? 0).toFixed(2)} 億
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 年次CF チャート */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 24, marginBottom: 8 }}>
        年次累積キャッシュフロー
      </h3>
      <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12 }}>
        各シナリオの累積CFが 0 を超える年が payback (回収完了)。グラフが右肩上がりで 0 を超えれば事業性 OK。
      </p>
      <div
        style={{
          padding: 16,
          background: 'var(--color-bg-card, #fff)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          marginBottom: 24,
        }}
      >
        <CashflowChart data={results} />
      </div>

      {/* 感応度分析 */}
      <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
        感応度分析 (標準シナリオ ±10%)
      </h3>
      <div
        style={{
          padding: 16,
          background: 'var(--color-bg-card, #fff)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          marginBottom: 24,
          fontSize: 13,
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: 13,
          }}
          aria-label="感応度分析テーブル"
        >
          <thead>
            <tr style={{ borderBottom: '2px solid var(--color-border)' }}>
              <th style={{ textAlign: 'left', padding: '8px 6px' }}>パラメータ</th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>-10%</th>
              <th style={{ textAlign: 'right', padding: '8px 6px', background: '#f8f8f8' }}>
                基準
              </th>
              <th style={{ textAlign: 'right', padding: '8px 6px' }}>+10%</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              <td style={{ padding: '8px 6px' }}>スポット価格スプレッド</td>
              <td style={{ textAlign: 'right', padding: '8px 6px' }}>
                {sensitivity.spot_price_minus_10pct_irr?.toFixed(2) ?? '-'} %
              </td>
              <td style={{ textAlign: 'right', padding: '8px 6px', background: '#f8f8f8', fontWeight: 600 }}>
                {sensitivity.baseline_irr?.toFixed(2) ?? '-'} %
              </td>
              <td style={{ textAlign: 'right', padding: '8px 6px' }}>
                {sensitivity.spot_price_plus_10pct_irr?.toFixed(2) ?? '-'} %
              </td>
            </tr>
            <tr>
              <td style={{ padding: '8px 6px' }}>容量市場対価</td>
              <td style={{ textAlign: 'right', padding: '8px 6px' }}>
                {sensitivity.capacity_market_minus_10pct_irr?.toFixed(2) ?? '-'} %
              </td>
              <td style={{ textAlign: 'right', padding: '8px 6px', background: '#f8f8f8', fontWeight: 600 }}>
                {sensitivity.baseline_irr?.toFixed(2) ?? '-'} %
              </td>
              <td style={{ textAlign: 'right', padding: '8px 6px' }}>
                {sensitivity.capacity_market_plus_10pct_irr?.toFixed(2) ?? '-'} %
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* エクスポート + 共有 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          flexWrap: 'wrap',
          marginBottom: 24,
        }}
      >
        <button
          type="button"
          onClick={handleCsvExport}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            background: 'var(--color-accent, #0066cc)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          📥 CSV エクスポート (Excel 対応 UTF-8 BOM)
        </button>
        <button
          type="button"
          onClick={handleShareUrl}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            background: '#fff',
            color: 'var(--color-text)',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            cursor: 'pointer',
          }}
        >
          🔗 入力条件付き URL をコピー
        </button>
      </div>

      {/* 関連用語 + 解説リンク */}
      <section
        style={{
          padding: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
          marginBottom: 24,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
          関連用語・解説
        </h3>
        <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
          <li>
            <Link href="/glossary/irr" style={{ color: 'var(--color-accent, #0066cc)' }}>
              IRR (内部収益率)
            </Link>
            : 投資の収益性を測る指標
          </li>
          <li>
            <Link href="/glossary/npv" style={{ color: 'var(--color-accent, #0066cc)' }}>
              NPV (正味現在価値)
            </Link>
            : 将来 CF を現在価値に割引した総和
          </li>
          <li>
            <Link href="/glossary/capacity-market" style={{ color: 'var(--color-accent, #0066cc)' }}>
              容量市場
            </Link>
            : kW 価値の取引市場 (年契約、容量提供で対価)
          </li>
          <li>
            <Link href="/glossary/jepx" style={{ color: 'var(--color-accent, #0066cc)' }}>
              JEPX (卸電力市場)
            </Link>
            : スポット価格アービトラージの市場
          </li>
          <li>
            <Link href="/explainer/grid-scale-bess" style={{ color: 'var(--color-accent, #0066cc)' }}>
              系統用蓄電池 解説記事
            </Link>
            : 事業構造・市場参入の体系解説
          </li>
        </ul>
      </section>
    </div>
  );
}
