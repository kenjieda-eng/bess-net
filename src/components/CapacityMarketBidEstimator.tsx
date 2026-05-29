'use client';

/**
 * src/components/CapacityMarketBidEstimator.tsx
 *
 * 容量市場応札試算 UI (依頼AT モック版)
 *
 * 機能:
 *   - 入力: エリア / 区分 / 容量 / 対象年度 / 自社コスト
 *   - 結果: 推奨応札価格 (low/mid/high) + 落札確率 + トレンド + 収入試算
 *   - 過去 2 年実績 SVG チャート (Recharts 非依存)
 *   - CSV エクスポート
 *   - URL share (落とし穴 #92: window.location + history.replaceState)
 *
 * 落とし穴対応:
 *   - #92: useSearchParams 不使用
 *   - #95-98: microCMS リクエスト 0 (静的モックデータ)
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  estimateBid,
  estimateBidWithHistory,
  TREND_LABELS,
  type BidEstimateInput,
  type BidEstimateResult,
} from '@/lib/capacity-market-bid-estimator';
import {
  AREA_LABELS,
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  filterHistory,
  filterHistoryByArea,
  getHistory,
  type Area,
  type Category,
  type CapacityMarketRecord,
} from '@/lib/capacity-market-data';

const AREAS: Area[] = [
  'hokkaido', 'tohoku', 'tokyo', 'chubu', 'hokuriku',
  'kansai', 'chugoku', 'shikoku', 'kyushu',
];

// ─────────────────────────────────────
// URL share
// ─────────────────────────────────────

function inputToParams(input: BidEstimateInput): URLSearchParams {
  const sp = new URLSearchParams();
  sp.set('area', input.area);
  sp.set('cat', input.category);
  sp.set('cap', String(input.capacity_mw));
  sp.set('fy', String(input.target_fiscal_year));
  sp.set('cost', String(input.cost_yen_per_kw_year));
  return sp;
}

function paramsToInput(sp: URLSearchParams, base: BidEstimateInput): BidEstimateInput {
  const areaV = sp.get('area');
  const catV = sp.get('cat');
  return {
    area: (AREAS.includes(areaV as Area) ? (areaV as Area) : base.area) as Area,
    category: (catV === 'new' || catV === 'existing' || catV === 'transition'
      ? (catV as Category)
      : base.category) as Category,
    capacity_mw: Number(sp.get('cap') ?? base.capacity_mw),
    target_fiscal_year: Number(sp.get('fy') ?? base.target_fiscal_year),
    cost_yen_per_kw_year: Number(sp.get('cost') ?? base.cost_yen_per_kw_year),
  };
}

// ─────────────────────────────────────
// CSV エクスポート
// ─────────────────────────────────────

function buildCsv(input: BidEstimateInput, result: BidEstimateResult): string {
  const lines: string[] = [];
  lines.push('# 容量市場応札試算 結果出力 (bess-net.jp/tools/capacity-market-bid)');
  lines.push(`# 生成日時: ${new Date().toISOString()}`);
  lines.push('# ⚠️ モック版。応札の最終判断は OCCTO 公式情報を確認');
  lines.push('');
  lines.push('## 入力条件');
  lines.push(`エリア,${AREA_LABELS[input.area]}`);
  lines.push(`区分,${CATEGORY_LABELS[input.category]}`);
  lines.push(`応札容量 (MW),${input.capacity_mw}`);
  lines.push(`対象年度,${input.target_fiscal_year}`);
  lines.push(`自社コスト (円/kW/年),${input.cost_yen_per_kw_year}`);
  lines.push('');
  lines.push('## 試算結果');
  lines.push(`推奨応札 下限,${result.recommended_bid_low}`);
  lines.push(`推奨応札 中央,${result.recommended_bid_mid}`);
  lines.push(`推奨応札 上限,${result.recommended_bid_high}`);
  lines.push(`落札確率 下限応札時,${result.cleared_probability.low_bid}%`);
  lines.push(`落札確率 中央応札時,${result.cleared_probability.mid_bid}%`);
  lines.push(`落札確率 上限応札時,${result.cleared_probability.high_bid}%`);
  lines.push(`想定収入 (中央応札時、億円/年),${result.estimated_annual_revenue_oku.toFixed(2)}`);
  lines.push('');
  lines.push('## 過去実績');
  lines.push(`過去平均 (円/kW/年),${result.historical_context.area_avg}`);
  lines.push(`過去落札合計 (MW),${result.historical_context.area_total_capacity_mw}`);
  lines.push(`トレンド,${TREND_LABELS[result.historical_context.area_trend]}`);
  lines.push(`参照レコード数,${result.historical_context.sample_size}`);
  if (result.historical_context.latest_price !== undefined) {
    lines.push(`最新年度価格,${result.historical_context.latest_price}`);
  }
  if (result.historical_context.prior_price !== undefined) {
    lines.push(`前年度価格,${result.historical_context.prior_price}`);
  }
  lines.push('');
  lines.push('## 警告');
  for (const w of result.warnings) {
    lines.push(`# ${w}`);
  }
  return lines.join('\n');
}

function downloadCsv(content: string, filename: string) {
  const bom = '﻿';
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
// 過去実績 SVG チャート (エリア × 区分の 2 年推移)
// ─────────────────────────────────────

function HistoryChart({
  area,
  category,
  allHistory,
}: {
  area: Area;
  category: Category;
  allHistory?: CapacityMarketRecord[];
}) {
  // live data: エリアのみフィルタ（区分非依存）
  // mock data: エリア + 区分でフィルタ
  const records = (
    allHistory
      ? filterHistoryByArea(allHistory, area)
      : filterHistory(area, category)
  ).sort((a, b) => a.fiscal_year - b.fiscal_year);

  // Y軸スケール: live の場合は全エリア価格から、mock の場合は同区分全エリアから
  const scaleSource = allHistory ?? getHistory().filter((r) => r.category === category);
  const allPrices = scaleSource.map((r) => r.clearing_price_yen_per_kw_year).filter((v) => v > 0);
  const yMin = 0;
  const yMax = allPrices.length > 0 ? Math.ceil(Math.max(...allPrices) / 1000) * 1000 : 20000;

  const W = 600;
  const H = 220;
  const PAD = { l: 70, r: 20, t: 20, b: 40 };
  const chartW = W - PAD.l - PAD.r;
  const chartH = H - PAD.t - PAD.b;

  if (records.length === 0) {
    return (
      <div
        style={{
          padding: 24,
          textAlign: 'center',
          color: 'var(--color-muted)',
          fontSize: 13,
        }}
      >
        該当エリア・区分のデータがありません
      </div>
    );
  }

  const xSlot = chartW / (records.length + 1);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', maxWidth: W, height: 'auto' }}
      role="img"
      aria-label={`年度別約定価格チャート ${AREA_LABELS[area]}${allHistory ? '' : ` ${CATEGORY_LABELS[category]}`}`}
    >
      {/* y grid + labels */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
        const v = yMin + (yMax - yMin) * (1 - f);
        const y = PAD.t + chartH * f;
        return (
          <g key={i}>
            <line x1={PAD.l} y1={y} x2={PAD.l + chartW} y2={y} stroke="#eee" />
            <text x={PAD.l - 6} y={y + 4} fontSize={11} textAnchor="end" fill="#666">
              {v.toLocaleString()} 円
            </text>
          </g>
        );
      })}
      {/* bars */}
      {records.map((r, i) => {
        const x = PAD.l + xSlot * (i + 0.5);
        const barW = xSlot * 0.6;
        const height = ((r.clearing_price_yen_per_kw_year - yMin) / (yMax - yMin)) * chartH;
        const y = PAD.t + chartH - height;
        return (
          <g key={i}>
            <rect
              x={x - barW / 2}
              y={y}
              width={barW}
              height={height}
              fill="#0066cc"
              opacity={0.8}
            />
            <text x={x} y={y - 4} fontSize={11} textAnchor="middle" fill="#333" fontWeight={600}>
              {r.clearing_price_yen_per_kw_year.toLocaleString()}
            </text>
            <text x={x} y={H - 16} fontSize={12} textAnchor="middle" fill="#666">
              {r.fiscal_year}年度
            </text>
            <text x={x} y={H - 4} fontSize={10} textAnchor="middle" fill="#999">
              {r.cleared_capacity_mw.toLocaleString()} MW
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────
// メイン
// ─────────────────────────────────────

const DEFAULT_INPUT: BidEstimateInput = {
  area: 'tokyo',
  category: 'existing',
  capacity_mw: 50,
  target_fiscal_year: 2026,
  cost_yen_per_kw_year: 6_000,
};

export default function CapacityMarketBidEstimator({
  initialHistory,
}: {
  /** Server Component から props 注入された実データ（鉄則 #2 準拠）。未指定時はモックにフォールバック */
  initialHistory?: CapacityMarketRecord[];
}) {
  const isLive = !!initialHistory && initialHistory.length > 0;
  const [input, setInput] = useState<BidEstimateInput>(DEFAULT_INPUT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.toString().length > 0) {
      setInput((prev) => paramsToInput(sp, prev));
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const sp = inputToParams(input);
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [input, hydrated]);

  const result = useMemo<BidEstimateResult>(
    () =>
      isLive && initialHistory
        ? estimateBidWithHistory(input, initialHistory)
        : estimateBid(input),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [input, isLive, initialHistory]
  );

  const update = <K extends keyof BidEstimateInput>(key: K, value: BidEstimateInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleCsvExport = () => {
    downloadCsv(
      buildCsv(input, result),
      `bess-capacity-bid-${new Date().toISOString().slice(0, 10)}.csv`
    );
  };

  const handleShareUrl = async () => {
    const sp = inputToParams(input);
    const url = `${window.location.origin}${window.location.pathname}?${sp.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      alert('入力条件付き URL をクリップボードにコピーしました\n' + url);
    } catch {
      prompt('URL をコピーしてください:', url);
    }
  };

  const trendColor =
    result.historical_context.area_trend === 'rising'
      ? '#cc6600'
      : result.historical_context.area_trend === 'falling'
        ? '#006666'
        : '#666';

  return (
    <div>
      {/* ★ データソース バナー */}
      {isLive ? (
        <div
          role="note"
          style={{
            padding: 14,
            marginBottom: 16,
            background: '#e8f5e9',
            border: '2px solid #2e7d32',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          ✅ <strong>data.eic-jp.org 実データ連携済</strong>（OCCTO 公表値ベース、FY2024-FY2029）。
          <strong>OCCTO メインオークション約定価格は区分非依存</strong>（同一エリアでは新設/既設/経過措置で同価格）。
          区分セレクタは応札容量・収入試算の文脈用です。
          応札の最終判断は{' '}
          <a
            href="https://www.occto.or.jp/market-board/market/youryou-shikou-jisshi.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-accent, #0066cc)', fontWeight: 600 }}
          >
            OCCTO 公式情報
          </a>{' '}
          ・電気事業法を必ずご確認ください。
          <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
            (Data: <code>live</code> / {initialHistory.length} 件)
          </span>
        </div>
      ) : (
        <div
          role="note"
          style={{
            padding: 14,
            marginBottom: 16,
            background: '#fff8e1',
            border: '2px solid #f1c40f',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          ⚠️ <strong>フォールバック: モックデータ表示中。</strong>
          precompute データが未生成のため業界予測値ベースで表示しています。
          応札の最終判断は{' '}
          <a
            href="https://www.occto.or.jp/market-board/market/youryou-shikou-jisshi.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--color-accent, #0066cc)', fontWeight: 600 }}
          >
            OCCTO 公式情報
          </a>{' '}
          ・電気事業法を必ずご確認ください。
          <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
            (Data: <code>mock</code>)
          </span>
        </div>
      )}

      {/* フォーム */}
      <form
        role="form"
        aria-label="容量市場応札試算 入力フォーム"
        onSubmit={(e) => e.preventDefault()}
        style={{
          padding: 16,
          marginBottom: 24,
          background: 'var(--color-bg-card, #fff)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
          応札条件
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
          {/* エリア */}
          <div>
            <label htmlFor="area" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              エリア
            </label>
            <select
              id="area"
              value={input.area}
              onChange={(e) => update('area', e.target.value as Area)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 14,
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                fontFamily: 'inherit',
              }}
            >
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {AREA_LABELS[a]}
                </option>
              ))}
            </select>
          </div>
          {/* 区分 */}
          <div>
            <label htmlFor="category" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              区分
            </label>
            <select
              id="category"
              value={input.category}
              onChange={(e) => update('category', e.target.value as Category)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 14,
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                fontFamily: 'inherit',
              }}
            >
              <option value="existing">{CATEGORY_LABELS.existing}</option>
              <option value="new">{CATEGORY_LABELS.new}</option>
              <option value="transition">{CATEGORY_LABELS.transition}</option>
            </select>
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, marginBottom: 0 }}>
              {CATEGORY_DESCRIPTIONS[input.category]}
              {isLive && (
                <span style={{ display: 'block', marginTop: 2, color: '#2e7d32', fontWeight: 600 }}>
                  ※ 約定価格は区分非依存（OCCTO メインオークション）
                </span>
              )}
            </p>
          </div>
          {/* 容量 */}
          <div>
            <label htmlFor="capacity_mw" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              応札容量 (MW)
            </label>
            <input
              id="capacity_mw"
              type="number"
              inputMode="decimal"
              step={0.5}
              min={0.1}
              value={input.capacity_mw}
              onChange={(e) => update('capacity_mw', parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 14,
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                fontFamily: 'inherit',
              }}
            />
          </div>
          {/* 対象年度 */}
          <div>
            <label htmlFor="fy" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              対象年度
            </label>
            <select
              id="fy"
              value={input.target_fiscal_year}
              onChange={(e) => update('target_fiscal_year', parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 14,
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                fontFamily: 'inherit',
              }}
            >
              <option value={2026}>2026 年度</option>
              <option value={2027}>2027 年度</option>
              <option value={2028}>2028 年度</option>
            </select>
          </div>
          {/* 自社コスト */}
          <div>
            <label htmlFor="cost" style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
              自社コスト (円/kW/年)
            </label>
            <input
              id="cost"
              type="number"
              inputMode="decimal"
              step={500}
              min={0}
              value={input.cost_yen_per_kw_year}
              onChange={(e) => update('cost_yen_per_kw_year', parseFloat(e.target.value) || 0)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 14,
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                fontFamily: 'inherit',
              }}
            />
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, marginBottom: 0 }}>
              保守的入札ライン (= ペイバック計算上の最低価格)
            </p>
          </div>
        </div>
        <p
          style={{
            marginTop: 12,
            fontSize: 12,
            color: 'var(--color-muted)',
          }}
          aria-live="polite"
        >
          入力変更で結果が即座に再計算されます。
        </p>
      </form>

      {/* 推奨応札価格 + 落札確率 */}
      <section
        style={{
          padding: 16,
          marginBottom: 16,
          background: 'var(--color-bg-card, #fff)',
          border: '2px solid var(--color-accent, #0066cc)',
          borderRadius: 6,
        }}
        aria-live="polite"
        aria-label="推奨応札価格"
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
          推奨応札価格レンジ
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { key: 'low', label: '下限 (保守的)', price: result.recommended_bid_low, prob: result.cleared_probability.low_bid, color: '#006666' },
            { key: 'mid', label: '中央 (推奨)', price: result.recommended_bid_mid, prob: result.cleared_probability.mid_bid, color: '#0066cc' },
            { key: 'high', label: '上限 (積極的)', price: result.recommended_bid_high, prob: result.cleared_probability.high_bid, color: '#cc6600' },
          ].map((tier) => (
            <div
              key={tier.key}
              style={{
                padding: 12,
                background: '#fff',
                border: `1.5px solid ${tier.color}`,
                borderRadius: 4,
              }}
            >
              <div style={{ fontSize: 11, color: tier.color, fontWeight: 700, marginBottom: 4 }}>
                {tier.label}
              </div>
              <div style={{ fontSize: 24, fontWeight: 700 }}>
                {tier.price.toLocaleString()}
                <span style={{ fontSize: 11, color: 'var(--color-muted)', marginLeft: 4 }}>円/kW/年</span>
              </div>
              <div style={{ marginTop: 4, fontSize: 12 }}>
                落札確率 <strong style={{ color: tier.color }}>{tier.prob}%</strong>
              </div>
            </div>
          ))}
        </div>
        <p
          style={{
            marginTop: 12,
            padding: 10,
            background: '#f7f9fc',
            border: '1px solid var(--color-border)',
            borderRadius: 4,
            fontSize: 13,
            margin: '12px 0 0',
          }}
        >
          💰 想定収入 (中央応札時): <strong>{result.estimated_annual_revenue_oku.toFixed(2)} 億円/年</strong>{' '}
          (× {input.target_fiscal_year} 年度契約期間)
        </p>
      </section>

      {/* 過去実績統計 */}
      <section
        style={{
          padding: 16,
          marginBottom: 16,
          background: 'var(--color-bg-card, #fff)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
          過去実績 ({AREA_LABELS[input.area]} エリア
          {isLive ? '・区分非依存（全年度加重平均）' : ` × ${CATEGORY_LABELS[input.category]}`})
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, fontSize: 13 }}>
          <div>
            <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>過去平均</div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              {result.historical_context.area_avg.toLocaleString()}
              <span style={{ fontSize: 11, color: 'var(--color-muted)' }}> 円/kW/年</span>
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>トレンド</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: trendColor }}>
              {TREND_LABELS[result.historical_context.area_trend]}
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>過去落札合計</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {result.historical_context.area_total_capacity_mw.toLocaleString()} MW
            </div>
          </div>
          <div>
            <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>参照件数</div>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {result.historical_context.sample_size} 件
            </div>
          </div>
        </div>
        {result.historical_context.latest_price !== undefined &&
          result.historical_context.prior_price !== undefined && (
            <div
              style={{
                marginTop: 12,
                padding: 8,
                background: 'var(--color-bg)',
                borderRadius: 4,
                fontSize: 12,
                color: 'var(--color-muted)',
              }}
            >
              年度推移: 前年度 {result.historical_context.prior_price.toLocaleString()} 円 → 最新年度{' '}
              {result.historical_context.latest_price.toLocaleString()} 円
            </div>
          )}
      </section>

      {/* 過去実績 SVG チャート */}
      <section
        style={{
          padding: 16,
          marginBottom: 16,
          background: 'var(--color-bg-card, #fff)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
          年度別 約定価格推移{isLive ? '（FY2024-FY2029）' : '（過去 2 年）'}
        </h3>
        <HistoryChart area={input.area} category={input.category} allHistory={initialHistory} />
      </section>

      {/* 警告 */}
      {result.warnings.length > 0 && (
        <section
          style={{
            padding: 12,
            marginBottom: 16,
            background: '#fff8e1',
            border: '1px solid #f1c40f',
            borderRadius: 6,
            fontSize: 13,
          }}
        >
          <strong style={{ display: 'block', marginBottom: 6 }}>注意事項・警告</strong>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {result.warnings.map((w, i) => (
              <li key={i} style={{ marginBottom: 4 }}>
                {w}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* エクスポート */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
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
          📥 CSV エクスポート (応札戦略メモ)
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

      {/* 関連リンク */}
      <section
        style={{
          padding: 16,
          background: 'var(--color-bg)',
          border: '1px solid var(--color-border)',
          borderRadius: 6,
        }}
      >
        <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>
          関連ツール・解説
        </h3>
        <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
          <li>
            <Link href="/glossary/capacity-market" style={{ color: 'var(--color-accent, #0066cc)' }}>
              容量市場
            </Link>{' '}
            (用語集) — 制度の基礎解説
          </li>
          <li>
            <Link href="/tools/irr-simulator" style={{ color: 'var(--color-accent, #0066cc)' }}>
              IRR シミュレーター
            </Link>{' '}
            — 応札価格 × 容量市場収益で事業性を再試算
          </li>
          <li>
            <a
              href="https://www.occto.or.jp/market-board/market/youryou-shikou-jisshi.html"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-accent, #0066cc)' }}
            >
              OCCTO 容量市場 公式
            </a>{' '}
            — 約定結果・運用ルール
          </li>
          <li>
            <Link href="/policy-calendar" style={{ color: 'var(--color-accent, #0066cc)' }}>
              政策・法制度カレンダー
            </Link>{' '}
            — 容量市場関連の制度変更を追跡
          </li>
        </ul>
      </section>
    </div>
  );
}
