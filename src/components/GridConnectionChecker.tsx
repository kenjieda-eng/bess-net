'use client';

/**
 * src/components/GridConnectionChecker.tsx
 *
 * 系統連系診断 UI (依頼AR、業界唯一機能)
 *
 * 機能:
 *   - 都道府県 select → 動的 import で当該 prefecture JSON 読み込み
 *   - 緯度経度入力 (任意、ない場合は同 prefecture 集約検索)
 *   - 出力 (MW) + 容量 (MWh) 入力
 *   - Top 5 変電所表示 (スコア + 距離 + reasons + 推奨)
 *   - CSV エクスポート
 *   - URL share (window.location + history.replaceState、落とし穴 #92)
 *
 * 落とし穴対応:
 *   - #92: useSearchParams 不使用
 *   - #95-98: microCMS リクエスト 0 (build 時 1 回のみ、47 分割 JSON 配信)
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  diagnoseGridConnection,
  type LiteSubstation,
  type DiagnosisInput,
  type DiagnosisResult,
} from '@/lib/grid-connection-checker';
import substationsIndex from '@/data/substations/index.json';

// index.json の by_pref から都道府県一覧を抽出 (件数降順)
type IndexType = {
  total: number;
  with_coords: number;
  by_pref: Record<string, number>;
  pref_count: number;
  updated_at: string;
};
const INDEX = substationsIndex as IndexType;

const PREF_OPTIONS = Object.entries(INDEX.by_pref)
  .sort((a, b) => b[1] - a[1])
  .map(([pref, count]) => ({ pref, count }));

// ─────────────────────────────────
// URL share
// ─────────────────────────────────

function inputToParams(input: DiagnosisInput): URLSearchParams {
  const sp = new URLSearchParams();
  if (input.prefecture) sp.set('pref', input.prefecture);
  if (typeof input.latitude === 'number') sp.set('lat', String(input.latitude));
  if (typeof input.longitude === 'number') sp.set('lng', String(input.longitude));
  sp.set('mw', String(input.output_mw));
  sp.set('mwh', String(input.capacity_mwh));
  return sp;
}

function paramsToInput(sp: URLSearchParams, base: DiagnosisInput): DiagnosisInput {
  const lat = sp.get('lat');
  const lng = sp.get('lng');
  return {
    prefecture: sp.get('pref') ?? base.prefecture,
    latitude: lat !== null && lat !== '' ? Number(lat) : base.latitude,
    longitude: lng !== null && lng !== '' ? Number(lng) : base.longitude,
    output_mw: Number(sp.get('mw') ?? base.output_mw),
    capacity_mwh: Number(sp.get('mwh') ?? base.capacity_mwh),
  };
}

// ─────────────────────────────────
// CSV エクスポート
// ─────────────────────────────────

function buildCsv(input: DiagnosisInput, result: DiagnosisResult): string {
  const lines: string[] = [];
  lines.push('# 系統連系診断 結果出力 (bess-net.jp/tools/grid-connection-check)');
  lines.push(`# 生成日時: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## 入力条件');
  lines.push(`都道府県,${input.prefecture}`);
  if (input.latitude !== undefined && input.longitude !== undefined) {
    lines.push(`緯度,${input.latitude}`);
    lines.push(`経度,${input.longitude}`);
  }
  lines.push(`出力 (MW),${input.output_mw}`);
  lines.push(`容量 (MWh),${input.capacity_mwh}`);
  lines.push('');
  lines.push(`## 連系難易度: ${result.recommendation_label}`);
  lines.push(`都道府県内変電所件数: ${result.total_in_prefecture}`);
  lines.push('');
  lines.push('## 最寄り変電所 Top ' + result.candidates.length);
  lines.push('順位,スコア,距離 (km),変電所名,送配電,電圧 (一次/二次 kV),空き容量 (MW),N-1 適用,理由');
  result.candidates.forEach((c, i) => {
    const s = c.substation;
    const cells = [
      String(i + 1),
      String(c.feasibility_score),
      c.distance_km !== null ? c.distance_km.toFixed(2) : '',
      `"${s.name.replace(/"/g, '""')}"`,
      `"${(s.operator || '').replace(/"/g, '""')}"`,
      s.voltage_primary_kv !== null && s.voltage_secondary_kv !== null
        ? `${s.voltage_primary_kv}/${s.voltage_secondary_kv}`
        : '',
      s.cap_avail_mw !== null ? String(s.cap_avail_mw) : '',
      s.n1_eligible ? 'YES' : 'NO',
      `"${c.reasons.join(' / ').replace(/"/g, '""')}"`,
    ];
    lines.push(cells.join(','));
  });
  lines.push('');
  lines.push('## 注意事項');
  for (const note of result.notes) {
    lines.push(`# ${note}`);
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

// ─────────────────────────────────
// メイン
// ─────────────────────────────────

const DEFAULT_INPUT: DiagnosisInput = {
  prefecture: '北海道',
  latitude: undefined,
  longitude: undefined,
  output_mw: 12.5,
  capacity_mwh: 50,
};

export default function GridConnectionChecker() {
  const [input, setInput] = useState<DiagnosisInput>(DEFAULT_INPUT);
  const [substations, setSubstations] = useState<LiteSubstation[]>([]);
  const [loading, setLoading] = useState(false);
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

  // 都道府県変更時に動的 import (落とし穴 #98 対応: build 時 1 回のみ、初回 import で client 側でロード)
  useEffect(() => {
    if (!input.prefecture) {
      setSubstations([]);
      return;
    }
    setLoading(true);
    // dynamic import 都道府県別 JSON
    import(`@/data/substations/${input.prefecture}.json`)
      .then((mod) => {
        setSubstations(mod.default as LiteSubstation[]);
      })
      .catch(() => {
        setSubstations([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [input.prefecture]);

  // 入力 → URL replace
  useEffect(() => {
    if (!hydrated || typeof window === 'undefined') return;
    const sp = inputToParams(input);
    const newUrl = `${window.location.pathname}?${sp.toString()}`;
    if (window.location.pathname + window.location.search !== newUrl) {
      window.history.replaceState(null, '', newUrl);
    }
  }, [input, hydrated]);

  // 診断結果
  const result = useMemo<DiagnosisResult>(
    () => diagnoseGridConnection(input, substations, 5),
    [input, substations]
  );

  const update = <K extends keyof DiagnosisInput>(key: K, value: DiagnosisInput[K]) => {
    setInput((prev) => ({ ...prev, [key]: value }));
  };

  const handleCsvExport = () => {
    downloadCsv(
      buildCsv(input, result),
      `bess-grid-connection-${new Date().toISOString().slice(0, 10)}.csv`
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

  const recColor =
    result.recommendation === 'easy'
      ? '#006666'
      : result.recommendation === 'moderate'
        ? '#0066cc'
        : result.recommendation === 'difficult'
          ? '#cc6600'
          : '#888';

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
        ⚠️ <strong>本診断は参考情報です</strong>。{INDEX.total.toLocaleString()} 変電所の公表データから連系候補を Top 5 抽出します。
        座標あり {INDEX.with_coords.toLocaleString()} 件は距離計算、座標なしは同都道府県内集約検索。
        実際の連系可否・空き容量は<strong>各送配電事業者への接続検討申請</strong>で確定します。
        東京電力PG 管内（13都県＋基幹系）も2026年6月より収録・診断対象です。
      </div>

      {/* フォーム */}
      <form
        role="form"
        aria-label="系統連系診断 入力フォーム"
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
          連系希望条件
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 14,
          }}
        >
          {/* 都道府県 */}
          <div>
            <label
              htmlFor="prefecture"
              style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}
            >
              対象都道府県 / エリア
            </label>
            <select
              id="prefecture"
              value={input.prefecture}
              onChange={(e) => update('prefecture', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 14,
                border: '1px solid var(--color-border)',
                borderRadius: 4,
                fontFamily: 'inherit',
              }}
            >
              {PREF_OPTIONS.map(({ pref, count }) => (
                <option key={pref} value={pref}>
                  {pref} ({count.toLocaleString()} 件)
                </option>
              ))}
            </select>
            <p style={{ fontSize: 11, color: 'var(--color-muted)', marginTop: 4, marginBottom: 0 }}>
              空き容量 + 構造化済データから候補抽出
            </p>
          </div>
          {/* 緯度 */}
          <div>
            <label
              htmlFor="latitude"
              style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}
            >
              緯度 (任意)
            </label>
            <input
              id="latitude"
              type="number"
              inputMode="decimal"
              step={0.0001}
              value={input.latitude ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                update('latitude', v === '' ? undefined : Number(v));
              }}
              placeholder="例: 35.6812"
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
              緯度経度入力で距離順ソート
            </p>
          </div>
          {/* 経度 */}
          <div>
            <label
              htmlFor="longitude"
              style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}
            >
              経度 (任意)
            </label>
            <input
              id="longitude"
              type="number"
              inputMode="decimal"
              step={0.0001}
              value={input.longitude ?? ''}
              onChange={(e) => {
                const v = e.target.value;
                update('longitude', v === '' ? undefined : Number(v));
              }}
              placeholder="例: 139.7671"
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
              Google Maps 等から取得
            </p>
          </div>
          {/* 出力 */}
          <div>
            <label
              htmlFor="output_mw"
              style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}
            >
              出力 (MW)
            </label>
            <input
              id="output_mw"
              type="number"
              inputMode="decimal"
              step={0.5}
              min={0.1}
              value={input.output_mw}
              onChange={(e) => update('output_mw', parseFloat(e.target.value) || 0)}
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
              例: 12.5 MW
            </p>
          </div>
          {/* 容量 */}
          <div>
            <label
              htmlFor="capacity_mwh"
              style={{ display: 'block', fontSize: 16, fontWeight: 600, marginBottom: 6, color: '#334155' }}
            >
              容量 (MWh)
            </label>
            <input
              id="capacity_mwh"
              type="number"
              inputMode="decimal"
              step={1}
              min={0.1}
              value={input.capacity_mwh}
              onChange={(e) => update('capacity_mwh', parseFloat(e.target.value) || 0)}
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
              例: 50 MWh (4h 放電)
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
          {loading && ' (データ読み込み中…)'}
        </p>
      </form>

      {/* 結果サマリ */}
      <div
        style={{
          marginBottom: 16,
          padding: 16,
          background: 'var(--color-bg-card, #fff)',
          border: `2px solid ${recColor}`,
          borderRadius: 6,
        }}
        aria-live="polite"
      >
        <div style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 4 }}>
          連系難易度判定
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: recColor }}>
          {result.recommendation_label}
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-muted)' }}>
          対象都道府県内変電所: {result.total_in_prefecture.toLocaleString()} 件 / Top{' '}
          {result.candidates.length} を表示
        </div>
      </div>

      {/* Top 5 候補 */}
      {result.candidates.length === 0 ? (
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
          該当する変電所が見つかりませんでした。別の都道府県をお試しください。
        </div>
      ) : (
        <ol
          aria-label="Top 5 変電所候補"
          style={{ listStyle: 'none', padding: 0, margin: 0, marginBottom: 24 }}
        >
          {result.candidates.map((c, idx) => {
            const s = c.substation;
            return (
              <li
                key={s.id}
                style={{
                  marginBottom: 12,
                  padding: 16,
                  background: 'var(--color-bg-card, #fff)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 6,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                    gap: 8,
                    flexWrap: 'wrap',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '2px 8px',
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
                        padding: '2px 8px',
                        fontSize: 11,
                        fontWeight: 600,
                        background: '#f0f0f0',
                        borderRadius: 3,
                      }}
                    >
                      スコア {c.feasibility_score}
                    </span>
                    {c.distance_km !== null && (
                      <span
                        style={{
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#e7f3ff',
                          color: '#0066cc',
                          borderRadius: 3,
                        }}
                      >
                        距離 {c.distance_km.toFixed(2)} km
                      </span>
                    )}
                    {s.n1_eligible && (
                      <span
                        style={{
                          padding: '2px 8px',
                          fontSize: 11,
                          fontWeight: 600,
                          background: '#e8f5e9',
                          color: '#2e7d32',
                          borderRadius: 3,
                        }}
                      >
                        N-1 適用
                      </span>
                    )}
                  </div>
                </div>
                <h4 style={{ fontSize: 16, fontWeight: 700, margin: '4px 0 8px' }}>{s.name}</h4>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: 8,
                    fontSize: 13,
                    marginBottom: 10,
                  }}
                >
                  <div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>送配電</div>
                    <div>{s.operator || '—'}</div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>電圧 (kV)</div>
                    <div>
                      {s.voltage_primary_kv !== null && s.voltage_secondary_kv !== null
                        ? `${s.voltage_primary_kv} / ${s.voltage_secondary_kv}`
                        : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>空き容量</div>
                    <div style={{ fontWeight: 600 }}>
                      {s.cap_avail_mw !== null ? `${s.cap_avail_mw} MW` : '—'}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'var(--color-muted)', fontSize: 11 }}>運用容量</div>
                    <div>
                      {s.cap_operational_mw !== null ? `${s.cap_operational_mw} MW` : '—'}
                    </div>
                  </div>
                </div>
                <div style={{ marginBottom: 10 }}>
                  {c.reasons.map((r, ri) => (
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
                  <Link
                    href={`/grid/${s.slug}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--color-accent, #0066cc)',
                    }}
                  >
                    変電所詳細 →
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {/* 注意事項 */}
      {result.notes.length > 0 && (
        <section
          style={{
            padding: 12,
            marginBottom: 16,
            background: 'var(--color-bg)',
            border: '1px solid var(--color-border)',
            borderRadius: 6,
            fontSize: 13,
            color: 'var(--color-muted)',
          }}
        >
          <strong style={{ display: 'block', marginBottom: 6, color: 'var(--color-text)' }}>
            注意事項
          </strong>
          <ul style={{ paddingLeft: 20, margin: 0 }}>
            {result.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </section>
      )}

      {/* エクスポート */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <button
          type="button"
          onClick={handleCsvExport}
          disabled={result.candidates.length === 0}
          style={{
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            background: 'var(--color-accent, #0066cc)',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            cursor: result.candidates.length === 0 ? 'not-allowed' : 'pointer',
            opacity: result.candidates.length === 0 ? 0.5 : 1,
          }}
        >
          📥 CSV エクスポート
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
          関連ツール・データ
        </h3>
        <ul style={{ fontSize: 13, lineHeight: 1.8, paddingLeft: 20, margin: 0 }}>
          <li>
            <Link href="/grid" style={{ color: 'var(--color-accent, #0066cc)' }}>
              系統空き容量データベース
            </Link>
            {' '}
            — 全国10社・全変電所データ閲覧
          </li>
          <li>
            <Link href="/grid/chubu/map" style={{ color: 'var(--color-accent, #0066cc)' }}>
              中部地方 変電所マップ
            </Link>
            {' '}
            — 当サイト独自の地図ベース UI
          </li>
          <li>
            <Link href="/tools/irr-simulator" style={{ color: 'var(--color-accent, #0066cc)' }}>
              蓄電池 IRR シミュレーター
            </Link>
            {' '}
            — 連系条件確定後の事業性試算
          </li>
          <li>
            <Link href="/tools/subsidy-match" style={{ color: 'var(--color-accent, #0066cc)' }}>
              蓄電池 補助金マッチング
            </Link>
            {' '}
            — 同条件で適合補助金検索
          </li>
        </ul>
      </section>
    </div>
  );
}
