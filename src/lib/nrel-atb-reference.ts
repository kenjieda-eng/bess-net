/**
 * src/lib/nrel-atb-reference.ts
 *
 * NREL ATB の参照値（蓄電池 CAPEX・電源別 CF/CAPEX/LCOE）をカタログから 1 箇所で出す（Ck-1 A8/A9・2026-09-21）
 *
 * ★なぜ要るか
 *   - A8: /tools/lcoe-lcos は CAPEX と LCOE 参考値だけカタログ（NREL ATB）を読み、設備利用率（CF）は
 *     lcoe-lcos.ts に概数を焼き込んでいた（太陽光 17%・陸上風力 30% ほか）。同じ画面で前提が混在し、
 *     カタログの ATB 値（太陽光 26.3%・陸上風力 44.8%）とも食い違っていた。CF も ATB に揃える。
 *   - A9/#121: 蓄電池 CAPEX の円換算（$/kW ÷ 4h × USD/JPY）を irr-simulator と lcoe-lcos が別々に計算していた。
 *
 * ★カタログの date は ATB の版（base year）。例 2024-01-01 ＝ ATB 2024 版の当年推計。
 *   原子力は ATB 2024 版に当年値が無いため最新が 2023 版になる（系列ごとに版が違いうる → 画面に版を併記）。
 * ★カタログが無ければ null（代替値を焼き込まない。画面では数値を出さない）。
 * ★相対 import（@/ ではない）。scripts から tsx で読めるように。
 */
import { FX_USDJPY } from './fx-reference';
import atbCapexBattery from '../data/eic/atb-capex-battery.json';
import capexPv from '../data/eic/atb-capex-utility-pv.json';
import capexOnshore from '../data/eic/atb-capex-onshore-wind.json';
import capexOffshore from '../data/eic/atb-capex-offshore-wind.json';
import capexNuclear from '../data/eic/atb-capex-nuclear.json';
import capexGeo from '../data/eic/atb-capex-geothermal.json';
import capexHydro from '../data/eic/atb-capex-hydro.json';
import lcoePv from '../data/eic/atb-lcoe-utility-pv.json';
import lcoeOnshore from '../data/eic/atb-lcoe-onshore-wind.json';
import lcoeOffshore from '../data/eic/atb-lcoe-offshore-wind.json';
import lcoeNuclear from '../data/eic/atb-lcoe-nuclear.json';
import lcoeGeo from '../data/eic/atb-lcoe-geothermal.json';
import lcoeHydro from '../data/eic/atb-lcoe-hydro.json';
import cfPv from '../data/eic/atb-cf-utility-pv.json';
import cfOnshore from '../data/eic/atb-cf-onshore-wind.json';
import cfOffshore from '../data/eic/atb-cf-offshore-wind.json';
import cfNuclear from '../data/eic/atb-cf-nuclear.json';
import cfGeo from '../data/eic/atb-cf-geothermal.json';
import cfHydro from '../data/eic/atb-cf-hydro.json';

type Series = { points?: { date: string; value: number | null }[] };
type Latest = { value: number; atbYear: number } | null;

function latest(d: unknown): Latest {
  const pts = ((d as Series).points ?? []).filter((p): p is { date: string; value: number } => typeof p.value === 'number');
  if (pts.length === 0) return null;
  const p = pts[pts.length - 1];
  return { value: p.value, atbYear: Number(p.date.slice(0, 4)) };
}

export const ATB_SOURCE_NAME = 'NREL Annual Technology Baseline (ATB) Electricity';

// ───────────── 蓄電池 CAPEX（4 時間・ユーティリティ規模） ─────────────
const battery = latest(atbCapexBattery);

export type BatteryCapexRef = {
  atbYear: number;
  usdPerKw: number;
  /** 4 時間構成として $/kW ÷ 4 */
  usdPerKwh: number;
  fxJpyPerUsd: number;
  fxMonthLabel: string;
  /** 円/kWh（1,000 円単位に丸め）。low/high は ±20% の感度レンジ（当サイトの仮定） */
  mid: number;
  low: number;
  high: number;
};

export const BATTERY_CAPEX: BatteryCapexRef | null =
  battery && FX_USDJPY
    ? (() => {
        const usdPerKwh = battery.value / 4;
        const mid = Math.round((usdPerKwh * FX_USDJPY.value) / 1000) * 1000;
        return {
          atbYear: battery.atbYear,
          usdPerKw: battery.value,
          usdPerKwh: Math.round(usdPerKwh * 100) / 100,
          fxJpyPerUsd: Math.round(FX_USDJPY.value * 100) / 100,
          fxMonthLabel: FX_USDJPY.monthLabel,
          mid,
          low: Math.round((mid * 0.8) / 100) * 100,
          high: Math.round((mid * 1.2) / 100) * 100,
        };
      })()
    : null;

// ───────────── 電源別（CF・CAPEX・LCOE） ─────────────
export type PowerSourceRef = {
  key: string;
  label: string;
  /** 設備利用率 0–1（ATB の base year 値） */
  cf: Latest;
  capexUsdPerKw: Latest;
  lcoeUsdPerMwh: Latest;
};

const RAW: { key: string; label: string; cf: unknown; capex: unknown; lcoe: unknown }[] = [
  { key: 'utility-pv', label: '太陽光（事業用）', cf: cfPv, capex: capexPv, lcoe: lcoePv },
  { key: 'onshore-wind', label: '陸上風力', cf: cfOnshore, capex: capexOnshore, lcoe: lcoeOnshore },
  { key: 'offshore-wind', label: '洋上風力', cf: cfOffshore, capex: capexOffshore, lcoe: lcoeOffshore },
  { key: 'nuclear', label: '原子力', cf: cfNuclear, capex: capexNuclear, lcoe: lcoeNuclear },
  { key: 'geothermal', label: '地熱', cf: cfGeo, capex: capexGeo, lcoe: lcoeGeo },
  { key: 'hydro', label: '水力', cf: cfHydro, capex: capexHydro, lcoe: lcoeHydro },
];

export const POWER_SOURCE_REFS: PowerSourceRef[] = RAW.map((r) => {
  const cf = latest(r.cf);
  return {
    key: r.key,
    label: r.label,
    // カタログの単位は % → 0–1 に直す
    cf: cf ? { value: cf.value / 100, atbYear: cf.atbYear } : null,
    capexUsdPerKw: latest(r.capex),
    lcoeUsdPerMwh: latest(r.lcoe),
  };
});

/** 電源別の値が使う ATB の版の一覧（画面の注記用。例「2024 年版（原子力の CF は 2023 年版）」） */
export function atbYearsLabel(): string {
  const years = new Set<number>();
  for (const r of POWER_SOURCE_REFS) for (const v of [r.cf, r.capexUsdPerKw, r.lcoeUsdPerMwh]) if (v) years.add(v.atbYear);
  const ys = [...years].sort((a, b) => b - a);
  if (ys.length <= 1) return ys.length ? `ATB ${ys[0]} 年版` : 'ATB（カタログ未取得）';
  const main = ys[0];
  const exceptions = POWER_SOURCE_REFS.flatMap((r) =>
    (
      [
        ['CF', r.cf],
        ['CAPEX', r.capexUsdPerKw],
        ['LCOE', r.lcoeUsdPerMwh],
      ] as const
    )
      .filter(([, v]) => v && v.atbYear !== main)
      .map(([k, v]) => `${r.label}の${k}は ${v!.atbYear} 年版`),
  );
  return `ATB ${main} 年版（${exceptions.join('・')}）`;
}
