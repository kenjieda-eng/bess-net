'use client';

/**
 * src/components/SubsidyMatcher.tsx
 *
 * 補助金マッチング UI (依頼AO、業界唯一機能)
 *
 * 機能:
 *   - 2 ステップフォーム (Step 1 基本情報 / Step 2 設備情報)
 *   - 入力即時計算 (Top 10 マッチング結果表示)
 *   - 補助金額試算
 *   - CSV エクスポート
 *   - URL share (window.location + history.replaceState、落とし穴 #92 対応)
 *
 * 落とし穴対応:
 *   - #92: useSearchParams 不使用
 *   - #95-98: microCMS リクエスト 0 (事前計算済 JSON 参照)
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import subsidiesJson from '@/data/subsidies.json';
import type { PrecomputedSubsidy } from '../../scripts/precompute-subsidies';
import {
  matchSubsidies,
  USE_CASE_LABELS,
  ENTITY_LABELS,
  type MatchInput,
  type MatchResult,
  type UseCase,
  type EntityType,
} from '@/lib/subsidy-matcher';

// 型キャスト (build 時 JSON import)
const ALL_SUBSIDIES = subsidiesJson as PrecomputedSubsidy[];

const PREFS = [
  '北海道', '青森', '岩手', '宮城', '秋田', '山形', '福島',
  '茨城', '栃木', '群馬', '埼玉', '千葉', '東京', '神奈川',
  '新潟', '富山', '石川', '福井', '山梨', '長野', '岐阜', '静岡', '愛知',
  '三重', '滋賀', '京都', '大阪', '兵庫', '奈良', '和歌山',
  '鳥取', '島根', '岡山', '広島', '山口',
  '徳島', '香川', '愛媛', '高知',
  '福岡', '佐賀', '長崎', '熊本', '大分', '宮崎', '鹿児島', '沖縄',
];

// ───────────────────────────────────────
// URL params シリアライズ (落とし穴 #92)
// ───────────────────────────────────────

function inputToParams(input: MatchInput): URLSearchParams {
  const sp = new URLSearchParams();
  if (input.pref) sp.set('pref', input.pref);
  sp.set('use', input.use_case);
  sp.set('ent', input.entity_type);
  if (input.capacity_kwh) sp.set('cap', String(input.capacity_kwh));
  if (input.output_kw) sp.set('out', String(input.output_kw));
  if (input.install_target_date) sp.set('date', input.install_target_date);
  return sp;
}

function paramsToInput(sp: URLSearchParams, base: MatchInput): MatchInput {
  const useV = sp.get('use');
  const entV = sp.get('ent');
  return {
    pref: sp.get('pref') ?? base.pref,
    use_case: (useV === 'grid' || useV === 'self_consumption' || useV === 'industrial' ? useV : base.use_case) as UseCase,
    entity_type: (entV === 'individual' || entV === 'corporate' || entV === 'municipal' ? entV : base.entity_type) as EntityType,
    capacity_kwh: Number(sp.get('cap') ?? base.capacity_kwh),
    output_kw: Number(sp.get('out') ?? base.output_kw),
    install_target_date: sp.get('date') ?? base.install_target_date,
  };
}

// ───────────────────────────────────────
// CSV エクスポート
// ───────────────────────────────────────

function buildCsv(input: MatchInput, results: MatchResult[]): string {
  const lines: string[] = [];
  lines.push('# 蓄電池補助金マッチング 結果出力 (bess-net.jp/tools/subsidy-match)');
  lines.push(`# 生成日時: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## 入力条件');
  lines.push(`都道府県,${input.pref || '全国'}`);
  lines.push(`用途,${USE_CASE_LABELS[input.use_case]}`);
  lines.push(`事業者種別,${ENTITY_LABELS[input.entity_type]}`);
  lines.push(`容量 (kWh),${input.capacity_kwh}`);
  lines.push(`出力 (kW),${input.output_kw}`);
  lines.push(`設置予定,${input.install_target_date}`);
  lines.push('');
  lines.push('## マッチング結果 (Top ' + results.length + ')');
  lines.push('順位,スコア,補助金名,実施機関,補助率,上限,期限,試算額 (億円),理由,URL');
  results.forEach((m, i) => {
    const cells = [
      String(i + 1),
      String(m.match_score),
      `"${m.subsidy.name.replace(/"/g, '""')}"`,
      `"${m.subsidy.organization.replace(/"/g, '""')}"`,
      `"${m.subsidy.subsidyRate_raw.replace(/"/g, '""')}"`,
      `"${m.subsidy.upperLimit_raw.replace(/"/g, '""')}"`,
      `"${(m.subsidy.deadline_iso || m.subsidy.deadline_raw).replace(/"/g, '""')}"`,
      m.estimated_amount_oku !== null ? m.estimated_amount_oku.toFixed(3) : '',
      `"${m.reasons.join(' / ').replace(/"/g, '""')}"`,
      m.subsidy.sourceUrl,
    ];
    lines.push(cells.join(','));
  });
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

// ───────────────────────────────────────
// メイン
// ───────────────────────────────────────

const DEFAULT_INPUT: MatchInput = {
  pref: '',
  use_case: 'grid',
  entity_type: 'corporate',
  capacity_kwh: 50000,
  output_kw: 12500,
  install_target_date: new Date(new Date().getFullYear() + 1, 5, 1).toISOString().slice(0, 10),
};

export default function SubsidyMatcher() {
  const [input, setInput] = useState<MatchInput>(DEFAULT_INPUT);
  const [step, setStep] = useState<1 | 2>(1);
  const [hydrated, setHydrated] = useState(false);

  // mount 時に URL params から復元
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const sp = new URLSearchParams(window.location.search);
    if (sp.toString().length > 0) {
      setInput((prev) => paramsToInput(sp, prev));
    }
    setHydrated(true);
  }, []);

  // input → URL replace
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const sp = inputToParams(input);
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [input, hydrated]);

  // マッチング結果 (memoized)
  const results = useMemo(
    () => matchSubsidies(input, ALL_SUBSIDIES, 10),
    [input]
  );

  const update = <K extends keyof MatchInput>(key: K, value: MatchInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleCsvExport = () => {
    const csv = buildCsv(input, results);
    downloadCsv(csv, `bess-subsidy-match-${new Date().toISOString().slice(0, 10)}.csv`);
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
        ⚠️ <strong>本マッチング結果は参考情報です</strong>。{ALL_SUBSIDIES.length} 件の業界主要補助金・融資制度から、入力条件に基づくスコアリングで Top 10 を表示します。
        実申請には各制度の公式情報を必ずご確認ください。試算額は &quot;補助率 × 想定 CAPEX (1MW あたり 1.5 億円)&quot; の机上計算で、実額は別途査定されます。
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
        {[1, 2].map((s) => (
          <button
            key={s}
            role="tab"
            type="button"
            aria-selected={step === s}
            onClick={() => setStep(s as 1 | 2)}
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
            Step {s}/2
            {s === 1 && ' 基本情報'}
            {s === 2 && ' 設備情報'}
          </button>
        ))}
      </div>

      {/* フォーム */}
      <form
        role="form"
        aria-label="補助金マッチング 入力フォーム"
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
              Step 1/2: 基本情報
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {/* 都道府県 */}
              <div>
                <label htmlFor="pref" style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                  対象都道府県
                </label>
                <select
                  id="pref"
                  value={input.pref}
                  onChange={(e) => update('pref', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: 14,
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="">全国 (制約なし)</option>
                  {PREFS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              {/* 用途 */}
              <div>
                <label htmlFor="use_case" style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                  用途
                </label>
                <select
                  id="use_case"
                  value={input.use_case}
                  onChange={(e) => update('use_case', e.target.value as UseCase)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: 14,
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="grid">{USE_CASE_LABELS.grid}</option>
                  <option value="self_consumption">{USE_CASE_LABELS.self_consumption}</option>
                  <option value="industrial">{USE_CASE_LABELS.industrial}</option>
                </select>
              </div>
              {/* 事業者種別 */}
              <div>
                <label htmlFor="entity_type" style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                  事業者種別
                </label>
                <select
                  id="entity_type"
                  value={input.entity_type}
                  onChange={(e) => update('entity_type', e.target.value as EntityType)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    fontSize: 14,
                    border: '1px solid var(--color-border)',
                    borderRadius: 4,
                    fontFamily: 'inherit',
                  }}
                >
                  <option value="corporate">{ENTITY_LABELS.corporate}</option>
                  <option value="individual">{ENTITY_LABELS.individual}</option>
                  <option value="municipal">{ENTITY_LABELS.municipal}</option>
                </select>
              </div>
              {/* 設置予定 */}
              <div>
                <label htmlFor="install_target_date" style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                  設置予定 (日付)
                </label>
                <input
                  id="install_target_date"
                  type="date"
                  value={input.install_target_date}
                  onChange={(e) => update('install_target_date', e.target.value)}
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
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 0, marginBottom: 12 }}>
              Step 2/2: 設備情報
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label htmlFor="capacity_kwh" style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                  容量
                  <span style={{ color: 'var(--color-muted)', marginLeft: 4, fontWeight: 400 }}>(kWh)</span>
                </label>
                <input
                  id="capacity_kwh"
                  type="number"
                  inputMode="decimal"
                  value={input.capacity_kwh}
                  step={1000}
                  min={1}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isFinite(v)) update('capacity_kwh', v);
                  }}
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
                  例: 50,000 kWh = 50 MWh
                </p>
              </div>
              <div>
                <label htmlFor="output_kw" style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}>
                  出力
                  <span style={{ color: 'var(--color-muted)', marginLeft: 4, fontWeight: 400 }}>(kW)</span>
                </label>
                <input
                  id="output_kw"
                  type="number"
                  inputMode="decimal"
                  value={input.output_kw}
                  step={100}
                  min={1}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    if (Number.isFinite(v)) update('output_kw', v);
                  }}
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
                  例: 12,500 kW = 12.5 MW (4h 放電)
                </p>
              </div>
            </div>
            <p
              style={{
                marginTop: 12,
                fontSize: 12,
                color: 'var(--color-muted)',
              }}
            >
              ※ 補助金額試算 = 補助率 × 想定 CAPEX (1MW あたり 1.5 億円 業界目安)
            </p>
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
              onClick={() => setStep((s) => (s - 1) as 1 | 2)}
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
          {step < 2 && (
            <button
              type="button"
              onClick={() => setStep(2)}
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
            入力変更で結果が即座に再マッチング
          </span>
        </div>
      </form>

      {/* 結果サマリ */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 12 }}>
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            marginTop: 0,
            marginBottom: 0,
          }}
        >
          マッチング結果
        </h2>
        <span style={{ fontSize: 13, color: 'var(--color-muted)' }} aria-live="polite">
          Top {results.length} 件 / 全 {ALL_SUBSIDIES.length} 件中
        </span>
      </div>

      {results.length === 0 ? (
        <div
          style={{
            padding: 24,
            background: 'var(--color-bg)',
            border: '1px dashed var(--color-border)',
            borderRadius: 6,
            textAlign: 'center',
            fontSize: 14,
            color: 'var(--color-muted)',
          }}
        >
          該当する補助金が見つかりませんでした。条件を緩和してお試しください
          (例: 都道府県を「全国」に、用途を変更)。
        </div>
      ) : (
        <ol
          aria-label="マッチング結果リスト"
          style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 24 }}
        >
          {results.map((m, idx) => {
            const isExpired =
              !m.subsidy.is_rolling &&
              m.subsidy.deadline_iso &&
              m.subsidy.deadline_iso < input.install_target_date;
            return (
              <li
                key={m.subsidy.id}
                style={{
                  marginBottom: 12,
                  padding: 16,
                  background: 'var(--color-bg-card, #fff)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                  opacity: isExpired ? 0.65 : 1,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, marginBottom: 8, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        marginRight: 8,
                        fontSize: 11,
                        fontWeight: 700,
                        background: 'var(--color-accent, #0066cc)',
                        color: '#fff',
                        borderRadius: 3,
                      }}
                    >
                      #{idx + 1}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        padding: '2px 8px',
                        background: '#f0f0f0',
                        borderRadius: 3,
                        marginRight: 8,
                      }}
                    >
                      スコア {m.match_score}
                    </span>
                    {isExpired && (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          background: '#fdd',
                          color: '#c00',
                          borderRadius: 3,
                        }}
                      >
                        期限切れ (設置時期次第)
                      </span>
                    )}
                  </div>
                </div>
                <h4 style={{ fontSize: 15, fontWeight: 700, margin: '4px 0 8px' }}>
                  {m.subsidy.name}
                </h4>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '0 0 8px' }}>
                  実施機関: {m.subsidy.organization}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 8, fontSize: 13, marginBottom: 10 }}>
                  <div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>補助率</div>
                    <div>{m.subsidy.subsidyRate_raw || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>上限額</div>
                    <div>{m.subsidy.upperLimit_raw || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>期限</div>
                    <div>
                      {m.subsidy.is_rolling
                        ? '随時受付'
                        : m.subsidy.deadline_iso || m.subsidy.deadline_raw || '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>試算額</div>
                    <div style={{ fontWeight: 600, color: 'var(--color-accent, #0066cc)' }}>
                      {m.estimated_amount_oku !== null
                        ? `約 ${m.estimated_amount_oku.toFixed(2)} 億円`
                        : '個別査定'}
                    </div>
                  </div>
                </div>
                {/* マッチング理由 */}
                <div style={{ marginBottom: 10 }}>
                  {m.reasons.map((r, ri) => (
                    <span
                      key={ri}
                      style={{
                        display: 'inline-block',
                        margin: '0 4px 4px 0',
                        padding: '2px 8px',
                        fontSize: 11,
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        borderRadius: 3,
                      }}
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                  {m.subsidy.sourceUrl && (
                    <a
                      href={m.subsidy.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--color-accent, #0066cc)',
                      }}
                    >
                      公式情報へ →
                    </a>
                  )}
                  <Link
                    href={`/subsidies/${m.subsidy.slug}`}
                    style={{
                      fontSize: 13,
                      color: 'var(--color-accent, #0066cc)',
                    }}
                  >
                    詳細解説 →
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* エクスポート */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          type="button"
          onClick={handleCsvExport}
          disabled={results.length === 0}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            background: 'var(--color-accent, #0066cc)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: results.length === 0 ? 'not-allowed' : 'pointer',
            opacity: results.length === 0 ? 0.5 : 1,
          }}
        >
          📥 CSV エクスポート (Excel UTF-8 BOM)
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
            <Link href="/tools/irr-simulator" style={{ color: 'var(--color-accent, #0066cc)' }}>
              蓄電池 IRR シミュレーター
            </Link>
            — 補助金率を入力して事業性 (IRR/NPV) を試算
          </li>
          <li>
            <Link href="/subsidies" style={{ color: 'var(--color-accent, #0066cc)' }}>
              補助金カレンダー
            </Link>
            — 50 件の補助金・融資制度の全件一覧
          </li>
          <li>
            <Link href="/explainer/grid-scale-bess" style={{ color: 'var(--color-accent, #0066cc)' }}>
              系統用蓄電池 解説
            </Link>
            — 事業構造・市場参入の体系解説
          </li>
        </ul>
      </section>
    </div>
  );
}
