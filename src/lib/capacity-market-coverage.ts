/**
 * src/lib/capacity-market-coverage.ts — 容量市場ツールの年度レンジ・件数の導出（Cm1・2026-09-01）
 *
 * 背景: /tools/capacity-market-bid の見出し・本文・出典行が
 *   「9 エリア × FY2024-FY2029（6 年度・54 件）」を静的文字列で持っていた。
 *   2026年度メインオークション（FY2030 対象）が catalog に着地するとグラフは 7 点になるが、
 *   見出しと本文は古いまま残り、表示は壊れないので気付けない（落とし穴 #121 と同型の
 *   「時間で drift する値を焼き込む」問題／L-EIC-027 の文章版）。
 *
 * 方針（二段構え）:
 *   1. catalog の coverage（D-020・PR #37 で 609/609 系列に付与）があれば
 *      label_first / label_last / count を使う
 *   2. 無ければ、取得済みの系列データの観測日から FY と点数を導出する
 *   両経路を常に計算し、値が食い違えば coverage を優先しつつ警告を返す
 *   （設計上の不変条件 coverage.last == observation_cutoff が崩れている＝上流異常のシグナル）。
 *
 * 表示精度の制約: FY 表記は cutoff_semantics=delivery × frequency=annual の系列にのみ付ける。
 *   それ以外の系列に FY を付けない（原資料が保証する範囲を超えない）。
 */

export type EicCoverage = {
  first?: string;
  last?: string;
  count?: number;
  label_first?: string;
  label_last?: string;
};

export type EicSeriesMeta = {
  id?: string;
  frequency?: string;
  cutoff_semantics?: string;
  observation_cutoff?: string;
  updated_at?: string;
  coverage?: EicCoverage;
};

export type EicPoint = { date: string; value: number | null };

export type EicSeries = {
  id?: string;
  meta?: EicSeriesMeta;
  points?: EicPoint[];
};

/** 4月始まりの年度。'2024-04-01' → 2024 ／ '2025-03-31' → 2024 */
export function fiscalYearOf(isoDate: string): number | null {
  const m = /^(\d{4})-(\d{2})/.exec(isoDate);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  return mo >= 4 ? y : y - 1;
}

/** FY ラベルを付けてよい系列か（原資料が保証する範囲を超えないためのガード） */
export function canLabelFiscalYear(meta: EicSeriesMeta | undefined): boolean {
  return meta?.cutoff_semantics === 'delivery' && meta?.frequency === 'annual';
}

/** 値のある観測日（昇順・重複なし） */
export function observedDates(series: EicSeries): string[] {
  const ds = (series.points ?? [])
    .filter((p) => p && p.value !== null && p.value !== undefined)
    .map((p) => p.date)
    .filter(Boolean);
  return [...new Set(ds)].sort();
}

export type CoverageSummary = {
  /** 例 'FY2024'。FY ラベル不可の系列や導出不能な場合は null */
  labelFirst: string | null;
  labelLast: string | null;
  /** 年度数（= 観測点数） */
  count: number;
  /** 採用した経路 */
  source: 'coverage' | 'points' | 'none';
  /** coverage 経路と points 経路の値が一致したか（両方算出できたときのみ true/false） */
  agrees: boolean | null;
  /** 不変条件 coverage.last === observation_cutoff（coverage があるときのみ） */
  cutoffMatches: boolean | null;
  warnings: string[];
};

/** 1 系列の年度レンジ・点数を導出する（coverage 優先・points fallback） */
export function summarizeSeriesCoverage(series: EicSeries): CoverageSummary {
  const meta = series.meta;
  const labelOk = canLabelFiscalYear(meta);
  const warnings: string[] = [];

  // --- 経路2: 系列データからの導出（常に計算して突合に使う） ---
  const dates = observedDates(series);
  const fromPoints =
    dates.length > 0
      ? {
          labelFirst: labelOk ? fyLabel(dates[0]) : null,
          labelLast: labelOk ? fyLabel(dates[dates.length - 1]) : null,
          count: dates.length,
        }
      : null;

  // --- 経路1: catalog coverage ---
  const cov = meta?.coverage;
  const covUsable = !!cov && typeof cov.count === 'number' && !!cov.first && !!cov.last;
  const fromCoverage = covUsable
    ? {
        // label_* が無い場合は first/last から導出（FY ラベル可の系列のみ）
        labelFirst: labelOk ? cov!.label_first ?? fyLabel(cov!.first!) : null,
        labelLast: labelOk ? cov!.label_last ?? fyLabel(cov!.last!) : null,
        count: cov!.count!,
      }
    : null;

  // --- 不変条件と突合 ---
  let cutoffMatches: boolean | null = null;
  if (covUsable && meta?.observation_cutoff) {
    cutoffMatches = cov!.last === meta.observation_cutoff;
    if (!cutoffMatches) {
      warnings.push(
        `[${meta?.id ?? series.id ?? '?'}] 不変条件違反: coverage.last=${cov!.last} ≠ observation_cutoff=${meta.observation_cutoff}（上流異常のシグナル）`
      );
    }
  }

  let agrees: boolean | null = null;
  if (fromCoverage && fromPoints) {
    agrees =
      fromCoverage.count === fromPoints.count &&
      fromCoverage.labelFirst === fromPoints.labelFirst &&
      fromCoverage.labelLast === fromPoints.labelLast;
    if (!agrees) {
      warnings.push(
        `[${meta?.id ?? series.id ?? '?'}] coverage と系列データが不一致: coverage=${fromCoverage.labelFirst}-${fromCoverage.labelLast}/${fromCoverage.count} vs points=${fromPoints.labelFirst}-${fromPoints.labelLast}/${fromPoints.count}（表示は coverage を優先）`
      );
    }
  }

  const chosen = fromCoverage ?? fromPoints;
  return {
    labelFirst: chosen?.labelFirst ?? null,
    labelLast: chosen?.labelLast ?? null,
    count: chosen?.count ?? 0,
    source: fromCoverage ? 'coverage' : fromPoints ? 'points' : 'none',
    agrees,
    cutoffMatches,
    warnings,
  };
}

function fyLabel(isoDate: string): string | null {
  const fy = fiscalYearOf(isoDate);
  return fy === null ? null : `FY${fy}`;
}

export type AreaCoverageSummary = CoverageSummary & {
  /** 実際にデータを取得できたエリア系列の数（9 を焼き込まない） */
  areaCount: number;
  /** エリア数 × count（見出しの「◯件」。エリアが欠けたら実数になる） */
  recordCount: number;
  /** レンジ表記。'FY2024-FY2029'／1年度なら 'FY2024'／不能なら null */
  rangeLabel: string | null;
};

/**
 * エリア別系列（price 9本など）をまとめて要約する。
 * 各系列の年度レンジが揃っている前提だが、揃っていなければ最も広いレンジを採り警告する。
 */
export function summarizeAreaSeries(seriesList: EicSeries[]): AreaCoverageSummary {
  const usable = seriesList.filter((s) => (s.points ?? []).some((p) => p?.value !== null && p?.value !== undefined));
  const each = usable.map(summarizeSeriesCoverage);
  const warnings = each.flatMap((e) => e.warnings);

  if (each.length === 0) {
    return { labelFirst: null, labelLast: null, count: 0, source: 'none', agrees: null, cutoffMatches: null, warnings, areaCount: 0, recordCount: 0, rangeLabel: null };
  }

  const counts = [...new Set(each.map((e) => e.count))];
  const firsts = [...new Set(each.map((e) => e.labelFirst).filter(Boolean))] as string[];
  const lasts = [...new Set(each.map((e) => e.labelLast).filter(Boolean))] as string[];
  if (counts.length > 1 || firsts.length > 1 || lasts.length > 1) {
    warnings.push(
      `エリア系列で年度レンジが不揃い: counts=${JSON.stringify(counts)} first=${JSON.stringify(firsts)} last=${JSON.stringify(lasts)}（最も広いレンジを表示）`
    );
  }

  const labelFirst = firsts.length ? firsts.sort()[0] : null;
  const labelLast = lasts.length ? lasts.sort()[lasts.length - 1] : null;
  const count = Math.max(...each.map((e) => e.count));
  const agreesList = each.map((e) => e.agrees).filter((x) => x !== null) as boolean[];

  return {
    labelFirst,
    labelLast,
    count,
    source: each.every((e) => e.source === 'coverage') ? 'coverage' : each.some((e) => e.source === 'coverage') ? 'coverage' : 'points',
    agrees: agreesList.length ? agreesList.every(Boolean) : null,
    cutoffMatches: each.map((e) => e.cutoffMatches).filter((x) => x !== null).every(Boolean),
    warnings,
    areaCount: usable.length,
    recordCount: usable.length * count,
    rangeLabel: labelFirst && labelLast ? (labelFirst === labelLast ? labelFirst : `${labelFirst}-${labelLast}`) : labelFirst ?? labelLast,
  };
}

/** 系列群の最新 updated_at（データ鮮度の動的表示用） */
export function latestUpdatedAt(seriesList: EicSeries[]): string | null {
  const ds = seriesList.map((s) => s.meta?.updated_at).filter(Boolean) as string[];
  return ds.length ? ds.sort()[ds.length - 1] : null;
}

/** 観測日の集合（昇順・重複なし）。buildLiveHistory の FY 走査に使う（FY_DATES を焼き込まない） */
export function unionObservedDates(seriesList: EicSeries[]): string[] {
  const all = seriesList.flatMap(observedDates);
  return [...new Set(all)].sort();
}
