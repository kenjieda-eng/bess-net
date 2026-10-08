'use client';

/**
 * src/components/BalancingBenchmark.tsx — 需給調整 入札ベンチマーク（蓄電池）（T1 実装便・2026-10-08）
 *
 * 設計: reports/tool-balancing-benchmark-plan-2026-10-08.md・T1 実装便の裁定 R1〜R9。
 *  - 計算はすべてブラウザ内（src/lib/balancing-benchmark-calc.ts・収益の式は src/lib/balancing-revenue-calc.ts＝/tools/balancing-revenue と同じ）。
 *  - 市場の月次・上限はサーバ（page.tsx）が組み立てて props で渡す（カタログ JSON をクライアントに入れない）。
 *  - 入力（単価・約定率・容量）はサーバにもブラウザの保存領域にも置かない。URL には商品と期間だけ（R6）。
 *    持ち出しは CSV の保存と読み込み（Blob／FileReader）。
 *  - 当サイトは評価者ではない: 事業者名・自由記述の欄を置かない・順位を出さない・差に良し悪しの言葉や色を付けない（符号と数値だけ）。
 *  - URL の読み書きは useSearchParams を使わず window.location＋history.replaceState（hydrated ガード・落とし穴 #92/#103）。
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BENCH_PRODUCTS,
  CAP_NEAR_RATIO,
  CSV_HEADER,
  CSV_LOAD_LABEL,
  CSV_SAVE_LABEL,
  NEAR_CAP_PRODUCTS,
  SINGLE_AND_COMPOSITE_CAP_PRODUCTS,
  EMPTY_ROW,
  capacityKwOf,
  computeMonth,
  computeTotals,
  formatCap,
  monthsInRange,
  periodError,
  parseCsv,
  serializeCsv,
  type BenchMonth,
  type BenchProductKey,
  type MonthResult,
  type RowInput,
} from '@/lib/balancing-benchmark-calc';

type Props = {
  months: BenchMonth[];
  labels: Record<BenchProductKey, string>;
  defaultStart: string;
  defaultEnd: string;
};

// ─── 表示の書式（色で良し悪しを示さない） ───
const yen = (v: number | null) => (v === null ? '—' : `${Math.round(v).toLocaleString('ja-JP')} 円`);
const signedYen = (v: number | null) =>
  v === null ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(Math.round(v)).toLocaleString('ja-JP')} 円`;
const signedPct = (v: number | null) =>
  v === null ? '—' : `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v * 100).toFixed(1)}%`;
const price2 = (v: number | null) => (v === null ? '—' : v.toFixed(2));
const ratioPct = (v: number | null) => (v === null ? '—' : `${(v * 100).toFixed(1)}%`);
const kw = (v: number | null) => (v === null ? '—' : `${v.toLocaleString('ja-JP')} kW`);

const cellStyle: React.CSSProperties = {
  padding: '6px 8px',
  borderBottom: '1px solid var(--color-border, #e5e7eb)',
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
  fontVariantNumeric: 'tabular-nums',
};
const headStyle: React.CSSProperties = {
  padding: '6px 8px',
  background: 'var(--color-navy, #0F2D4F)',
  color: '#fff',
  fontWeight: 600,
  textAlign: 'left',
  whiteSpace: 'nowrap',
  fontSize: 13,
};
const inputStyle: React.CSSProperties = {
  width: 92,
  padding: '4px 6px',
  border: '1px solid var(--color-border, #ccc)',
  borderRadius: 4,
  fontSize: 14,
  background: '#fff',
};

function downloadCsv(content: string, filename: string) {
  const bom = '﻿'; // Excel で文字化けしないよう UTF-8 の BOM
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

/** 月が横軸の折れ線（SVG・ライブラリなし）。null の点は線を切る */
function LineChart({
  yms,
  series,
  height,
  ariaLabel,
}: {
  yms: string[];
  series: { name: string; color: string; values: (number | null)[]; dashed?: boolean }[];
  height: number;
  ariaLabel: string;
}) {
  const W = 720;
  const H = height;
  const PAD = { l: 52, r: 16, t: 16, b: 28 };
  const all = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  if (yms.length === 0 || all.length === 0) return null;
  const vMax = Math.max(...all) * 1.1 || 1;
  const x = (i: number) => PAD.l + (yms.length === 1 ? (W - PAD.l - PAD.r) / 2 : (i * (W - PAD.l - PAD.r)) / (yms.length - 1));
  const y = (v: number) => H - PAD.b - (v / vMax) * (H - PAD.t - PAD.b);
  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, height: 'auto' }} role="img" aria-label={ariaLabel}>
        {[0, 0.5, 1].map((t) => {
          const v = vMax * t;
          return (
            <g key={t}>
              <line x1={PAD.l} y1={y(v)} x2={W - PAD.r} y2={y(v)} stroke="#eee" />
              <text x={PAD.l - 6} y={y(v) + 4} fontSize={10} textAnchor="end" fill="#666">
                {v.toFixed(v >= 100 ? 0 : 1)}
              </text>
            </g>
          );
        })}
        {yms.map((ym, i) =>
          yms.length <= 12 || i % 2 === 0 ? (
            <text key={ym} x={x(i)} y={H - 8} fontSize={9} textAnchor="middle" fill="#666">
              {ym.slice(2)}
            </text>
          ) : null,
        )}
        {series.map((s) => {
          const segs: string[][] = [];
          let cur: string[] = [];
          s.values.forEach((v, i) => {
            if (v === null) {
              if (cur.length) segs.push(cur);
              cur = [];
            } else cur.push(`${x(i)},${y(v)}`);
          });
          if (cur.length) segs.push(cur);
          return (
            <g key={s.name}>
              {segs.map((seg, k) => (
                <polyline key={k} points={seg.join(' ')} fill="none" stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? '5 4' : undefined} />
              ))}
              {s.values.map((v, i) => (v === null ? null : <circle key={i} cx={x(i)} cy={y(v)} r={2.5} fill={s.color} />))}
            </g>
          );
        })}
        {series.map((s, k) => (
          <g key={`lg-${s.name}`} transform={`translate(${PAD.l + 8 + k * 170}, ${PAD.t - 4})`}>
            <line x1={0} y1={0} x2={18} y2={0} stroke={s.color} strokeWidth={2} strokeDasharray={s.dashed ? '5 4' : undefined} />
            <text x={24} y={4} fontSize={11} fill="#333">
              {s.name}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}

export function BalancingBenchmark({ months, labels, defaultStart, defaultEnd }: Props) {
  const allYms = useMemo(() => months.map((m) => m.ym), [months]);
  const byYm = useMemo(() => new Map(months.map((m) => [m.ym, m])), [months]);
  const [product, setProduct] = useState<BenchProductKey>('primary');
  const [start, setStart] = useState(defaultStart);
  const [end, setEnd] = useState(defaultEnd);
  const [capacityText, setCapacityText] = useState('');
  const [unit, setUnit] = useState<'kW' | 'MW'>('kW');
  const [rows, setRows] = useState<Record<string, RowInput>>({});
  const [csvMessage, setCsvMessage] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // mount: URL から商品と期間だけを復元（入力の値は URL に入れない＝R6）
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const p = sp.get('product');
    if (p && (BENCH_PRODUCTS as readonly string[]).includes(p)) setProduct(p as BenchProductKey);
    const from = sp.get('from');
    const to = sp.get('to');
    if (from && to && periodError(allYms, from, to) === null) {
      setStart(from);
      setEnd(to);
    }
    setHydrated(true);
  }, [allYms]);

  useEffect(() => {
    if (!hydrated) return;
    const sp = new URLSearchParams();
    sp.set('product', product);
    sp.set('from', start);
    sp.set('to', end);
    const url = `${window.location.pathname}?${sp.toString()}`;
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, '', url);
  }, [hydrated, product, start, end]);

  const error = periodError(allYms, start, end);
  const yms = error ? [] : monthsInRange(allYms, start, end);
  const contractKw = capacityKwOf(capacityText, unit);
  const capacityInvalid = contractKw !== null && !Number.isFinite(contractKw);
  const results: MonthResult[] = yms.map((ym) =>
    computeMonth(product, byYm.get(ym) as BenchMonth, rows[ym] ?? EMPTY_ROW, capacityInvalid ? null : contractKw),
  );
  const totals = computeTotals(results);
  const twoCaps = SINGLE_AND_COMPOSITE_CAP_PRODUCTS.includes(product);
  const marks = NEAR_CAP_PRODUCTS.includes(product);

  const setCell = (ym: string, key: keyof RowInput, value: string) =>
    setRows((prev) => ({ ...prev, [ym]: { ...(prev[ym] ?? EMPTY_ROW), [key]: value } }));

  const onLoadCsv = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = parseCsv(String(reader.result ?? ''), allYms);
      setRows((prev) => ({ ...prev, ...res.rows }));
      // 期間を CSV の最初と最後の年月に合わせる（保存は表示中の期間の月だけなので、読み込んだ月が表に出るようにする）
      const loaded = Object.keys(res.rows).sort();
      if (loaded.length > 0) {
        setStart(loaded[0]);
        setEnd(loaded[loaded.length - 1]);
      }
      const rej = res.rejected.slice(0, 5).map((r) => `${r.line} 行目: ${r.reason}`).join('／');
      setCsvMessage(
        res.accepted === 0 && res.rejected.length === 0
          ? `読み込める行がありませんでした（1 行目が見出し「${CSV_HEADER.join(',')}」、2 行目から月ごとの行の CSV を選んでください）`
          : `読み込み ${res.accepted} 行` +
              (loaded.length > 0 ? `・期間を ${loaded[0]}〜${loaded[loaded.length - 1]} に合わせました` : '') +
              (res.rejected.length ? `・読み込まなかった行 ${res.rejected.length}（${rej}${res.rejected.length > 5 ? ' ほか' : ''}）` : ''),
      );
    };
    reader.readAsText(file, 'utf-8');
  };

  const totalCard = (title: string, value: string, sub: string) => (
    <div style={{ flex: '1 1 200px', border: '1px solid var(--color-border, #e5e7eb)', borderRadius: 8, padding: '12px 14px', background: '#fff' }}>
      <div style={{ fontSize: 13, color: '#6b7280' }}>{title}</div>
      <div style={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', margin: '4px 0' }}>{value}</div>
      <div style={{ fontSize: 13, color: '#6b7280' }}>{sub}</div>
    </div>
  );

  return (
    <div>
      {/* ─── 入力（商品・容量・期間） ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'flex-end', marginBottom: 12 }}>
        <label style={{ fontSize: 14 }}>
          商品
          <br />
          <select value={product} onChange={(e) => setProduct(e.target.value as BenchProductKey)} style={{ ...inputStyle, width: 180 }} aria-label="商品">
            {BENCH_PRODUCTS.map((p) => (
              <option key={p} value={p}>
                {labels[p]}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 14 }}>
          契約容量
          <br />
          <input
            value={capacityText}
            onChange={(e) => setCapacityText(e.target.value)}
            inputMode="decimal"
            placeholder={unit === 'kW' ? '例: 2000' : '例: 2'}
            style={{ ...inputStyle, width: 120 }}
            aria-label={`契約容量（${unit}）`}
          />
          <select value={unit} onChange={(e) => setUnit(e.target.value as 'kW' | 'MW')} style={{ ...inputStyle, width: 64, marginLeft: 4 }} aria-label="容量の単位">
            <option value="kW">kW</option>
            <option value="MW">MW</option>
          </select>
        </label>
        <label style={{ fontSize: 14 }}>
          期間（開始）
          <br />
          <select value={start} onChange={(e) => setStart(e.target.value)} style={{ ...inputStyle, width: 110 }} aria-label="期間の開始">
            {allYms.map((ym) => (
              <option key={ym} value={ym}>
                {ym}
              </option>
            ))}
          </select>
        </label>
        <label style={{ fontSize: 14 }}>
          期間（終了）
          <br />
          <select value={end} onChange={(e) => setEnd(e.target.value)} style={{ ...inputStyle, width: 110 }} aria-label="期間の終了">
            {allYms.map((ym) => (
              <option key={ym} value={ym}>
                {ym}
              </option>
            ))}
          </select>
        </label>
      </div>
      {error && <p style={{ color: '#b45309', fontSize: 14, margin: '0 0 8px' }}>{error}</p>}
      {capacityInvalid && <p style={{ color: '#b45309', fontSize: 14, margin: '0 0 8px' }}>契約容量は 0 以上の数で入れてください</p>}

      {/* ─── CSV の保存・読み込み（サーバへは送らない） ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', marginBottom: 16, fontSize: 14 }}>
        <button
          type="button"
          onClick={() => downloadCsv(serializeCsv(yms, rows), `balancing-benchmark-${product}-${start}_${end}.csv`)}
          style={{ padding: '6px 12px', border: '1px solid var(--color-border, #ccc)', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
        >
          {CSV_SAVE_LABEL}
        </button>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          style={{ padding: '6px 12px', border: '1px solid var(--color-border, #ccc)', borderRadius: 4, background: '#fff', cursor: 'pointer' }}
        >
          {CSV_LOAD_LABEL}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onLoadCsv(f);
            e.target.value = '';
          }}
        />
        <span style={{ color: '#6b7280' }}>列: 年月・単価・約定率・容量の上書き（空欄は空のまま、0 は 0）。保存されるのは、いま選んでいる期間の月だけです。契約容量と商品は CSV に入りません（読み込んだ後に選び直してください）。ファイルはこの端末の中だけで読みます。</span>
      </div>
      {csvMessage && <p style={{ fontSize: 14, margin: '-8px 0 12px' }}>{csvMessage}</p>}

      {/* ─── 期間合計 ─── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 8 }}>
        {totalCard('実績（入力のある月）', yen(totals.actual.sum), `${totals.actual.months} か月`)}
        {totalCard('全電源の月次平均で計算した場合', yen(totals.benchAll.sum), `${totals.benchAll.months} か月`)}
        {totalCard('蓄電池の月次平均で計算した場合', yen(totals.benchBattery.sum), `${totals.benchBattery.months} か月（約定なしの月を除く）`)}
      </div>
      <p style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 6px' }}>
        {`差（実績 − 全電源）: ${signedYen(totals.diffAll.diff)}（${signedPct(totals.diffAll.pct)}・対象 ${totals.diffAll.months} か月・対象月の実績の小計 ${yen(totals.diffAll.actual)}）`}
        <br />
        {`差（実績 − 蓄電池）: ${signedYen(totals.diffBattery.diff)}（${signedPct(totals.diffBattery.pct)}・対象 ${totals.diffBattery.months} か月・対象月の実績の小計 ${yen(totals.diffBattery.actual)}）`}
      </p>
      {totals.diffBattery.months !== totals.actual.months && totals.actual.months > 0 && (
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 6px' }}>
          蓄電池の差は、蓄電池の月次平均がある月（約定なしの月を除く）だけで計算しています。実績のカードと月数が違うため、カード同士を引いた値とは一致しないことがあります。
        </p>
      )}
      {totals.incompleteMonths > 0 && (
        <p style={{ fontSize: 13, color: '#b45309', margin: '0 0 6px' }}>
          {`単価・約定率・容量のどれかが欠けているか範囲外の月が ${totals.incompleteMonths} か月あり、計算から外しています（表の「不完全」「範囲外か数でない」）。`}
        </p>
      )}

      {/* ─── 図（R9: 主の図は自分の単価と蓄電池平均の 2 本・全電源は別の小図） ─── */}
      <div style={{ margin: '16px 0 4px', fontSize: 14, fontWeight: 700 }}>{`${labels[product]}: 自分の単価と蓄電池の月次平均（円/ΔkW・30分）`}</div>
      <LineChart
        yms={yms}
        height={240}
        ariaLabel={`${labels[product]}の自分の単価と蓄電池の月次平均`}
        series={[
          { name: '自分の単価', color: '#0F2D4F', values: results.map((r) => r.price) },
          { name: '蓄電池の月次平均', color: '#00A3A3', values: results.map((r) => r.marketBattery), dashed: true },
        ]}
      />
      <div style={{ margin: '12px 0 4px', fontSize: 13, fontWeight: 700 }}>{`${labels[product]}: 全電源の月次平均（円/ΔkW・30分・縦軸は別）`}</div>
      <LineChart
        yms={yms}
        height={140}
        ariaLabel={`${labels[product]}の全電源の月次平均`}
        series={[{ name: '全電源の月次平均', color: '#6b7280', values: results.map((r) => r.marketAll) }]}
      />

      {/* ─── 月別の表（市場平均・上限・上限比は入力が無くても出す＝初期 DOM） ─── */}
      <div style={{ overflowX: 'auto', marginTop: 16 }}>
        <table style={{ borderCollapse: 'collapse', fontSize: 14, minWidth: 1400 }}>
          <thead>
            <tr>
              <th style={headStyle}>年月</th>
              <th style={headStyle}>自分の単価</th>
              <th style={headStyle}>約定率（容量ベース・%）</th>
              <th style={headStyle}>容量の上書き（kW）</th>
              <th style={headStyle}>計算に使った容量</th>
              <th style={headStyle}>実績</th>
              <th style={headStyle}>市場平均 全電源</th>
              <th style={headStyle}>市場平均 蓄電池</th>
              <th style={headStyle}>全電源で計算</th>
              <th style={headStyle}>蓄電池で計算</th>
              <th style={headStyle}>差（実績 − 全電源）</th>
              <th style={headStyle}>差（実績 − 蓄電池）</th>
              <th style={headStyle}>上限</th>
              <th style={headStyle}>上限比 全電源</th>
              <th style={headStyle}>上限比 蓄電池</th>
              <th style={headStyle}>{`上限付近（${Math.round(CAP_NEAR_RATIO * 100)}% 以上）`}</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => {
              const inp = rows[r.ym] ?? EMPTY_ROW;
              const batteryNull = r.marketBattery === null;
              return (
                <tr key={r.ym}>
                  <td style={cellStyle}>
                    {r.ym}
                    {r.incomplete && (
                      <div style={{ fontSize: 12, color: '#b45309' }}>
                        {r.invalidFields.length ? `範囲外か数でない: ${r.invalidFields.join('・')}` : '不完全'}
                      </div>
                    )}
                  </td>
                  <td style={cellStyle}>
                    <input value={inp.price} onChange={(e) => setCell(r.ym, 'price', e.target.value)} inputMode="decimal" style={inputStyle} aria-label={`${r.ym} の自分の平均落札単価`} />
                  </td>
                  <td style={cellStyle}>
                    <input value={inp.rate} onChange={(e) => setCell(r.ym, 'rate', e.target.value)} inputMode="decimal" style={inputStyle} aria-label={`${r.ym} の約定率`} />
                  </td>
                  <td style={cellStyle}>
                    <input value={inp.cap} onChange={(e) => setCell(r.ym, 'cap', e.target.value)} inputMode="decimal" style={inputStyle} aria-label={`${r.ym} の容量の上書き`} />
                  </td>
                  <td style={cellStyle}>{r.complete ? kw(r.capacityKw) : '—'}</td>
                  <td style={cellStyle}>{yen(r.actual)}</td>
                  <td style={cellStyle}>{price2(r.marketAll)}</td>
                  <td style={cellStyle}>{batteryNull ? '約定なし' : price2(r.marketBattery)}</td>
                  <td style={cellStyle}>{yen(r.benchAll)}</td>
                  <td style={cellStyle}>{batteryNull ? '約定なし' : yen(r.benchBattery)}</td>
                  <td style={cellStyle}>{r.diffAll === null ? '—' : `${signedYen(r.diffAll)}（${signedPct(r.diffAllPct)}）`}</td>
                  <td style={cellStyle}>{batteryNull ? '約定なし' : r.diffBattery === null ? '—' : `${signedYen(r.diffBattery)}（${signedPct(r.diffBatteryPct)}）`}</td>
                  <td style={cellStyle}>{twoCaps ? `単独 ${formatCap(r.cap)}／複合 ${formatCap(r.compositeCap)}` : formatCap(r.cap)}</td>
                  <td style={cellStyle}>{twoCaps ? `単独 ${ratioPct(r.ratioAll)}／複合 ${ratioPct(r.ratioAllComposite)}` : ratioPct(r.ratioAll)}</td>
                  <td style={cellStyle}>
                    {batteryNull ? '—' : twoCaps ? `単独 ${ratioPct(r.ratioBattery)}／複合 ${ratioPct(r.ratioBatteryComposite)}` : ratioPct(r.ratioBattery)}
                  </td>
                  <td style={cellStyle}>{marks ? (r.nearCap ? '上限付近' : '') : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!marks && (
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
          {!twoCaps
            ? `${labels[product]}には上限価格の設定が無いため、上限比と印は出しません。`
            : 'この商品は印を付けません（単独応札と複合応札で適用される上限が違うため。上限の列に両方を出しています）。'}
        </p>
      )}
    </div>
  );
}
