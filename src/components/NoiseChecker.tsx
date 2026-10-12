'use client';

/**
 * 騒音・離隔の目安チェッカーの部品（/tools/noise-check・T5 騒音便 2026-10-12）
 * 入力は画面の中だけで使う（保存しない・送らない・URL にも書かない）。計算は src/lib/noise-check.ts の純関数。
 * 結果の欄は初期 DOM から描き、値は入力後に入る（#107: 見出し・前提の文・3 区分の意味は初期 DOM に載る）。
 */

import { useId, useMemo, useState } from 'react';
import {
  EMPTY_ROW,
  INPUT_LIMITS,
  MAX_SOURCE_ROWS,
  NOISE_SOURCE_KINDS,
  NOTICE_PERIODS,
  NOTICE_ZONES,
  RANGE_BAND_LABEL,
  RANGE_BAND_MEANING,
  SCHOOL_PROVISO_DB,
  barrierValue,
  classifyAgainstRange,
  distanceForLevel,
  insideMeasurementDistance,
  isUsableDistance,
  isUsableRow,
  levelAtDistance,
  levelForCount,
  maxMeasurementDistance,
  noticeRange,
  receiverLevel,
  roundDb,
  specifiedFacilityNotes,
  type NoiseSourceKind,
  type NoiseSourceRow,
  type NoticePeriod,
  type NoticeZone,
  type RangeBand,
} from '@/lib/noise-check';

type ZoneChoice = NoticeZone | 'unknown';

const box = { border: '1px solid var(--color-border)', borderRadius: 8, padding: 16, marginBottom: 16, background: '#fff' } as const;
// iOS Safari はフォーカス時に 16px 未満の入力欄を拡大するので 16px
const input = { width: '100%', padding: '6px 8px', fontSize: 16, border: '1px solid var(--color-border)', borderRadius: 4, boxSizing: 'border-box' } as const;
const th = { textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--color-border)', whiteSpace: 'nowrap', fontSize: 14 } as const;
const td = { padding: '6px 8px', borderBottom: '1px solid var(--color-border)', fontSize: 14 } as const;
const help = { display: 'block', marginTop: 4, color: 'var(--color-muted)', lineHeight: 1.6, fontSize: 14 } as const;
const srOnly = { position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 } as const;

/**
 * 数の欄の読み取り（当サイトの扱い）: 空欄は blank、数として読めないものは bad（単位つき・0x 等・桁区切りでないカンマ）。
 * 全角の数字・小数点・マイナス（－・−）は半角にする。カンマは 3 桁ごとの桁区切りのときだけ除く。
 */
type Parsed = { state: 'blank' } | { state: 'bad' } | { state: 'num'; value: number };
const parseNum = (s: string): Parsed => {
  let t = s.trim().replace(/[０-９．]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)).replace(/[－−]/g, '-').replace(/，/g, ',');
  if (t === '') return { state: 'blank' };
  if (/^[+-]?0[xob]/i.test(t)) return { state: 'bad' };
  if (t.includes(',')) {
    if (!/^[+-]?\d{1,3}(,\d{3})+(\.\d+)?$/.test(t)) return { state: 'bad' };
    t = t.replace(/,/g, '');
  }
  if (!/^[+-]?(\d+\.?\d*|\.\d+)$/.test(t)) return { state: 'bad' };
  const v = Number(t);
  return Number.isFinite(v) ? { state: 'num', value: v } : { state: 'bad' };
};
const numOrNull = (p: Parsed) => (p.state === 'num' ? p.value : null);

const fmtDb = (v: number | null) => (v === null ? '—' : `${roundDb(v).toFixed(1)} dB`);
const fmtM = (v: number | null) => {
  if (v === null) return '—';
  if (v < 0.01) return '0.01 m 未満';
  const r1 = Math.round(v * 10) / 10;
  if (r1 >= 100) return `約 ${Math.round(v).toLocaleString('ja-JP')} m`;
  if (r1 >= 10) return `約 ${r1.toFixed(1)} m`;
  return `約 ${v.toFixed(2)} m`;
};

type RowText = { kind: NoiseSourceKind; count: string; level: string; r0: string; motorKw: string };
const emptyText = (): RowText => ({ kind: EMPTY_ROW.kind, count: String(EMPTY_ROW.count), level: '', r0: '', motorKw: '' });

/** 欄の下の「読めない」表示 */
function Bad({ id, p }: { id: string; p: Parsed }) {
  return p.state === 'bad' ? (
    <span id={id} style={{ display: 'block', marginTop: 2, fontSize: 13 }}>{'数として読めません（数字だけで入れてください）'}</span>
  ) : null;
}

export default function NoiseChecker() {
  const uid = useId();
  const [rows, setRows] = useState<RowText[]>([emptyText()]);
  const [dText, setDText] = useState('');
  const [barrierText, setBarrierText] = useState('');
  const [zone, setZone] = useState<ZoneChoice>('unknown');
  const [period, setPeriod] = useState<NoticePeriod>('day');
  const [school, setSchool] = useState(false);

  const parsedText = useMemo(
    () => rows.map((r) => ({ kind: r.kind, count: parseNum(r.count), level: parseNum(r.level), r0: parseNum(r.r0), motorKw: parseNum(r.motorKw) })),
    [rows],
  );
  const parsed: NoiseSourceRow[] = parsedText.map((p) => ({ kind: p.kind, count: numOrNull(p.count), level: numOrNull(p.level), r0: numOrNull(p.r0), motorKw: numOrNull(p.motorKw) }));
  const dParsed = parseNum(dText);
  const bParsed = parseNum(barrierText);
  const d = numOrNull(dParsed);
  const barrier = numOrNull(bParsed);
  const bv = barrierValue(barrier);
  const dOk = isUsableDistance(d);
  const usable = parsed.filter(isUsableRow);
  const total = receiverLevel(parsed, d, barrier);
  const inside = insideMeasurementDistance(parsed, d);
  const maxR0 = maxMeasurementDistance(parsed);
  const facility = specifiedFacilityNotes(parsed);
  const range = zone === 'unknown' ? null : noticeRange(zone, period, school);
  const band: RangeBand | null = total !== null && range ? classifyAgainstRange(total, range) : null;
  const periodLabel = NOTICE_PERIODS.find((p) => p.key === period)?.label ?? '';
  const zoneLabel = zone === 'unknown' ? '不明' : NOTICE_ZONES.find((z) => z.key === zone)?.label ?? '';
  const excluded = parsedText
    .map((p, i) => ({ p, i, r: parsed[i] }))
    .filter(({ p, r }) => !isUsableRow(r) && (p.level.state !== 'blank' || p.r0.state !== 'blank' || p.count.state !== 'num'));

  /** 逆算した距離の表示: 計算に入れた行の最大の測定距離より内側なら、数ではなくその旨を出す */
  const distanceText = (target: number) => {
    const dd = distanceForLevel(parsed, barrier, target);
    if (dd === null) return '—';
    if (maxR0 !== null && dd < maxR0) return `測定距離（${maxR0.toLocaleString('ja-JP')} m）より内側（式の対象外）`;
    if (dd > INPUT_LIMITS.distance.max) return `${INPUT_LIMITS.distance.max.toLocaleString('ja-JP')} m 超`;
    return fmtM(dd);
  };

  const setRow = (i: number, patch: Partial<RowText>) => setRows((cur) => cur.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const statusText =
    total === null
      ? '受音点の合成レベルはまだ出ていません。'
      : `受音点の合成レベル ${fmtDb(total)}${inside ? '（参考・式の前提外）' : ''}。${range && band ? `${zoneLabel}・${periodLabel}の告示の範囲 ${range.min}〜${range.max} デシベルに対して${RANGE_BAND_LABEL[band]}。` : ''}${excluded.length ? `計算に入れていない音源 ${excluded.length} 行あり。` : ''}`;

  return (
    <div>
      <section style={box} aria-labelledby={`${uid}-sources`}>
        <h2 id={`${uid}-sources`} style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 6 }}>
          {`1. 音源（最大 ${MAX_SOURCE_ROWS} 行）`}
        </h2>
        <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 0, lineHeight: 1.7 }}>
          {'騒音レベルには機器の仕様書や測定記録の 1 台の値（A特性の騒音レベル）を、測定距離にはその値を測った距離を入れます。同じ機器が複数あるときは台数を入れます。1 台の原動機の定格出力は、送風機・空気圧縮機などが騒音規制法の特定施設に当たるかの注記に使います（任意）。'}
        </p>
        {rows.map((r, i) => {
          const pt = parsedText[i];
          const fid = `${uid}-s${i}`;
          return (
            <fieldset key={i} style={{ border: '1px solid var(--color-border)', borderRadius: 6, padding: 12, margin: '10px 0', minWidth: 0 }}>
              <legend style={{ fontSize: 15, fontWeight: 600, padding: '0 6px' }}>{`音源 ${i + 1}`}</legend>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(150px, 100%), 1fr))', gap: 10 }}>
                <label style={{ fontSize: 14 }}>
                  <span style={{ display: 'block', marginBottom: 4 }}>機器の種類</span>
                  <select value={r.kind} onChange={(e) => setRow(i, { kind: e.target.value as NoiseSourceKind })} style={input}>
                    {NOISE_SOURCE_KINDS.map((k) => (
                      <option key={k.key} value={k.key}>{k.label}</option>
                    ))}
                  </select>
                </label>
                <label style={{ fontSize: 14 }}>
                  <span style={{ display: 'block', marginBottom: 4 }}>台数</span>
                  <input inputMode="numeric" value={r.count} onChange={(e) => setRow(i, { count: e.target.value })} style={input} aria-describedby={`${fid}-c`} />
                  <Bad id={`${fid}-c`} p={pt.count} />
                </label>
                <label style={{ fontSize: 14 }}>
                  <span style={{ display: 'block', marginBottom: 4 }}>騒音レベル（1 台・dB）</span>
                  <input inputMode="decimal" value={r.level} onChange={(e) => setRow(i, { level: e.target.value })} style={input} aria-describedby={`${fid}-l`} />
                  <Bad id={`${fid}-l`} p={pt.level} />
                </label>
                <label style={{ fontSize: 14 }}>
                  <span style={{ display: 'block', marginBottom: 4 }}>騒音レベルの測定距離（m）</span>
                  <input inputMode="decimal" value={r.r0} onChange={(e) => setRow(i, { r0: e.target.value })} style={input} aria-describedby={`${fid}-r`} />
                  <Bad id={`${fid}-r`} p={pt.r0} />
                </label>
                <label style={{ fontSize: 14 }}>
                  <span style={{ display: 'block', marginBottom: 4 }}>原動機の定格出力（1 台・kW・任意）</span>
                  <input inputMode="decimal" value={r.motorKw} onChange={(e) => setRow(i, { motorKw: e.target.value })} style={input} aria-describedby={`${fid}-m`} />
                  <Bad id={`${fid}-m`} p={pt.motorKw} />
                </label>
              </div>
              {rows.length > 1 && (
                <button
                  type="button"
                  onClick={() => setRows((cur) => cur.filter((_, j) => j !== i))}
                  style={{ marginTop: 8, padding: '4px 10px', fontSize: 14, background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 4, cursor: 'pointer' }}
                >
                  {`音源 ${i + 1} を外す`}
                </button>
              )}
            </fieldset>
          );
        })}
        <button
          type="button"
          disabled={rows.length >= MAX_SOURCE_ROWS}
          onClick={() => setRows((cur) => (cur.length >= MAX_SOURCE_ROWS ? cur : [...cur, emptyText()]))}
          style={{ padding: '6px 14px', fontSize: 15, background: 'transparent', border: '1px solid var(--color-border)', borderRadius: 4, cursor: rows.length >= MAX_SOURCE_ROWS ? 'not-allowed' : 'pointer' }}
        >
          {'音源を足す'}
        </button>
      </section>

      <section style={box} aria-labelledby={`${uid}-receiver`}>
        <h2 id={`${uid}-receiver`} style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 6 }}>{'2. 受音点と区分'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 12 }}>
          <div style={{ fontSize: 14 }}>
            <label htmlFor={`${uid}-d`} style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'音源から受音点までの距離（m）'}</label>
            <input id={`${uid}-d`} inputMode="decimal" value={dText} onChange={(e) => setDText(e.target.value)} style={input} aria-describedby={`${uid}-d-help ${uid}-d-bad`} />
            <Bad id={`${uid}-d-bad`} p={dParsed} />
            <span id={`${uid}-d-help`} style={help}>
              {'規制基準は、特定施設を設置する工場・事業場（特定工場等）の敷地の境界線における騒音の大きさの許容限度です（騒音規制法第2条第2項）。規制基準の範囲と比べるなら、音源からいちばん近い敷地の境界線までの距離を入れてください。'}
            </span>
          </div>
          <div style={{ fontSize: 14 }}>
            <label htmlFor={`${uid}-b`} style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'防音壁などの減衰量（dB・設計値があれば）'}</label>
            <input id={`${uid}-b`} inputMode="decimal" value={barrierText} onChange={(e) => setBarrierText(e.target.value)} style={input} aria-describedby={`${uid}-b-help ${uid}-b-bad`} />
            <Bad id={`${uid}-b-bad`} p={bParsed} />
            <span id={`${uid}-b-help`} style={help}>
              {`空欄は 0（減衰なし）として計算します。下げる量を正の数（例: 10）で入れると、全部の音源から一律に引きます（${INPUT_LIMITS.barrier.min}〜${INPUT_LIMITS.barrier.max} dB の範囲だけ使います）。`}
            </span>
          </div>
          <label style={{ fontSize: 14 }}>
            <span style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'区域の区分'}</span>
            <select value={zone} onChange={(e) => setZone(e.target.value as ZoneChoice)} style={input}>
              <option value="unknown">{'不明（4 区域を並べる）'}</option>
              {NOTICE_ZONES.map((z) => (
                <option key={z.key} value={z.key}>{z.label}</option>
              ))}
            </select>
          </label>
          <div style={{ fontSize: 14 }}>
            <label htmlFor={`${uid}-p`} style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{'時間の区分'}</label>
            <select id={`${uid}-p`} value={period} onChange={(e) => setPeriod(e.target.value as NoticePeriod)} style={input} aria-describedby={`${uid}-p-help`}>
              {NOTICE_PERIODS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
            <span id={`${uid}-p-help`} style={help}>{'夜間に運転（充放電）するなら、夜間の範囲も確かめてください。告示の範囲は、どの区域でも夜間が昼間より低く、朝・夕と比べても同じか低い範囲です。'}</span>
          </div>
        </div>
        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 14, marginTop: 12, lineHeight: 1.6 }}>
          <input type="checkbox" checked={school} onChange={(e) => setSchool(e.target.checked)} style={{ marginTop: 4 }} />
          <span>
            {`学校・保育所・病院・入院施設のある診療所・図書館・特別養護老人ホーム・幼保連携型認定こども園の敷地の周囲おおむね 50m の区域内（第二種〜第四種区域では、知事・市長が規制基準として定める値から ${SCHOOL_PROVISO_DB} デシベル減じた値まで下げられる＝告示 第一条第1項ただし書。範囲の下限を ${SCHOOL_PROVISO_DB} デシベル下げて表示します）`}
          </span>
        </label>
        {school && zone === 'zone1' && (
          <p style={{ fontSize: 14, margin: '8px 0 0' }}>{'第一種区域にはただし書は掛かりません（告示 第一条第1項ただし書は第二種〜第四種区域が対象）。'}</p>
        )}
      </section>

      <section style={box} aria-labelledby={`${uid}-result`}>
        <h2 id={`${uid}-result`} style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 8 }}>{'3. 結果（目安）'}</h2>
        <p role="status" style={srOnly}>{statusText}</p>
        <dl style={{ display: 'grid', gridTemplateColumns: 'fit-content(45%) minmax(0, 1fr)', gap: '6px 12px', margin: 0, fontSize: 15 }}>
          <dt style={{ fontWeight: 600 }}>{'受音点の合成レベル'}</dt>
          <dd style={{ margin: 0 }}>
            {total === null ? '—（音源の騒音レベル・測定距離・台数と、受音点までの距離を入れると出ます）' : `${fmtDb(total)}${inside ? '（参考・式の前提外）' : ''}`}
          </dd>
          <dt style={{ fontWeight: 600 }}>{'比べる範囲'}</dt>
          <dd style={{ margin: 0 }}>
            {range ? `${zoneLabel}・${periodLabel}: ${range.min}〜${range.max} デシベル${range.provisoApplied ? `（ただし書で下限を ${SCHOOL_PROVISO_DB} デシベル下げた範囲）` : ''}` : `区域が不明のため、下の表に 4 区域を並べます（${periodLabel}）`}
          </dd>
          <dt style={{ fontWeight: 600 }}>{'告示の範囲との位置'}</dt>
          <dd style={{ margin: 0 }}>{band ? RANGE_BAND_LABEL[band] : '—'}</dd>
          <dt style={{ fontWeight: 600 }}>{'範囲の上限まで下がる距離'}</dt>
          <dd style={{ margin: 0 }}>{range ? distanceText(range.max) : '—'}</dd>
          <dt style={{ fontWeight: 600 }}>{'範囲の下限まで下がる距離'}</dt>
          <dd style={{ margin: 0 }}>{range ? distanceText(range.min) : '—'}</dd>
        </dl>
        {d !== null && !dOk && (
          <p style={{ fontSize: 14, margin: '10px 0 0' }}>{`受音点までの距離は 0 より大きく ${INPUT_LIMITS.distance.max.toLocaleString('ja-JP')} m 以下の数で入れてください。`}</p>
        )}
        {inside && (
          <p style={{ fontSize: 14, margin: '10px 0 0', lineHeight: 1.7 }}>
            {'受音点までの距離が、計算に入れた音源の測定距離より近くなっています。このチェッカーは仕様の測定距離より遠い点の目安を出すもので、測定距離より内側の値は対象外です（当サイトの扱い）。上の合成レベルは参考です。'}
          </p>
        )}
        {!bv.usable && (
          <p style={{ fontSize: 14, margin: '10px 0 0' }}>{`減衰量は ${INPUT_LIMITS.barrier.min}〜${INPUT_LIMITS.barrier.max} の数（下げる量・例: 10）で入れてください。いまの値は計算に入れていません（0 として計算）。`}</p>
        )}
        {excluded.length > 0 && (
          <p style={{ fontSize: 14, margin: '10px 0 0', lineHeight: 1.7 }}>
            {`計算に入れていない音源: ${excluded.map(({ i }) => `音源 ${i + 1}`).join('・')}（台数は 1〜${INPUT_LIMITS.count.max.toLocaleString('ja-JP')} の整数、騒音レベルは ${INPUT_LIMITS.level.min}〜${INPUT_LIMITS.level.max} dB、測定距離は ${INPUT_LIMITS.r0.min}〜${INPUT_LIMITS.r0.max.toLocaleString('ja-JP')} m の数で入れてください）`}
          </p>
        )}
        <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20, margin: '10px 0 0' }}>
          {(Object.keys(RANGE_BAND_LABEL) as RangeBand[]).map((b) => (
            <li key={b}>{`${RANGE_BAND_LABEL[b]}: ${RANGE_BAND_MEANING[b]}`}</li>
          ))}
          <li>{'騒音規制法の規制基準が掛かるのは、指定地域内で特定施設を設置する工場・事業場（特定工場等）です（騒音規制法第2条第2項・第5条）。特定施設が無い場合も、条例の基準が掛かることがあります。所在地の規制基準の値は、都道府県・市・特別区で確かめてください。'}</li>
          <li>{'距離は、丸める前の上限・下限の値から逆算した目安です（表示は約の値）。'}</li>
        </ul>

        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <caption style={{ textAlign: 'left', fontSize: 16, fontWeight: 700, padding: '0 0 6px' }}>
              {`告示の範囲との比較（${periodLabel}${school ? '・第二〜四種区域はただし書で下限 −5 デシベル' : ''}）`}
            </caption>
            <thead>
              <tr>
                {['区域の区分', '告示の範囲', '告示の範囲との位置', '上限まで下がる距離', '下限まで下がる距離'].map((h) => (
                  <th key={h} scope="col" style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {NOTICE_ZONES.map((z) => {
                const rg = noticeRange(z.key, period, school);
                const b = total !== null ? classifyAgainstRange(total, rg) : null;
                const selected = zone === z.key;
                return (
                  <tr key={z.key} aria-current={selected ? 'true' : undefined} style={selected ? { background: '#e7f3ff' } : undefined}>
                    <th scope="row" style={{ ...td, textAlign: 'left', whiteSpace: 'nowrap', fontWeight: selected ? 700 : 400 }}>{`${z.label}${selected ? '（選択中）' : ''}`}</th>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{`${rg.min}〜${rg.max} デシベル${rg.provisoApplied ? '（ただし書）' : ''}`}</td>
                    <td style={td}>{b ? RANGE_BAND_LABEL[b] : '—'}</td>
                    <td style={td}>{distanceText(rg.max)}</td>
                    <td style={td}>{distanceText(rg.min)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ overflowX: 'auto', marginTop: 16 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <caption style={{ textAlign: 'left', fontSize: 16, fontWeight: 700, padding: '0 0 6px' }}>{'音源ごとの受音点レベル'}</caption>
            <thead>
              <tr>
                {['音源', '種類', '台数', '1 台の値', '受音点（台数込み・減衰後）'].map((h) => (
                  <th key={h} scope="col" style={th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {parsed.map((r, i) => {
                const ok = isUsableRow(r);
                const at = ok && dOk ? levelForCount(levelAtDistance(r.level as number, r.r0 as number, d as number), r.count as number) - bv.value : null;
                return (
                  <tr key={i}>
                    <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 400 }}>{`音源 ${i + 1}`}</th>
                    <td style={td}>{NOISE_SOURCE_KINDS.find((k) => k.key === r.kind)?.label}</td>
                    <td style={td}>{ok ? String(r.count) : '—'}</td>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{ok ? `${r.level} dB（${r.r0} m）` : '—'}</td>
                    <td style={td}>{ok ? fmtDb(at) : '計算に入れていない'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {usable.length > 0 && (
          <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '8px 0 0' }}>{`計算に入れた音源 ${usable.length} 行・${usable.reduce((s, r) => s + (r.count as number), 0)} 台`}</p>
        )}
      </section>

      <section style={box} aria-labelledby={`${uid}-facility`}>
        <h2 id={`${uid}-facility`} style={{ fontSize: 18, fontWeight: 700, marginTop: 0, marginBottom: 6 }}>{'4. 特定施設（騒音規制法施行令 別表第一）の注記'}</h2>
        {facility.length === 0 ? (
          <p style={{ fontSize: 14, margin: 0 }}>{'音源の値を入れると、機器の種類ごとに施行令 別表第一の語との関係を示します。'}</p>
        ) : (
          <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 20, margin: 0 }}>
            {facility.map((n) => (
              <li key={n.rowIndex}>{n.text}</li>
            ))}
          </ul>
        )}
        <p style={{ fontSize: 14, margin: '10px 0 0', lineHeight: 1.7 }}>
          {'届出と、電気事業法の電気工作物である特定施設の扱いは、このページの「特定施設と届出」に書いています。'}
        </p>
      </section>
    </div>
  );
}
