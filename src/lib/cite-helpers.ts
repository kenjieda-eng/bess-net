/**
 * EIC Data 引用フォーマッタ
 * data.eic-jp.org 側 (5/13 PR #37) の実装を移植
 *
 * 用途: 各 catalog ページ・業界レポートで引用文字列を機械的に生成
 * 形式: APA 7 / BibTeX / Chicago 17
 */
import type { Indicator } from '@/types/eic';
import { clampToRunDateJst, todayJst } from '@/lib/eic-date';

export type CitationFormat = 'bibtex' | 'apa' | 'chicago';

export function formatCitation(indicator: Indicator, format: CitationFormat = 'apa', runDate: string = todayJst()): string {
  // Ck-1a ■2-12: 年・アクセス日は observation_cutoff を実行日（JST）で頭打ちにして使う。
  //   JEPX は受渡日＝明日、容量市場は対象実需給年度（2029-04-01）が入るため、そのままだと未来の日付・年になる。
  const asOf = clampToRunDateJst(indicator.observation_cutoff, runDate) ?? runDate;
  switch (format) {
    case 'bibtex':
      return formatBibtex(indicator, asOf);
    case 'apa':
      return formatApa(indicator, asOf);
    case 'chicago':
      return formatChicago(indicator, asOf);
  }
}

const yearOf = (asOf: string): number => Number(asOf.slice(0, 4));

function formatApa(ind: Indicator, asOf: string): string {
  const year = yearOf(asOf);
  const publisher = ind.publisher ?? ind.source_name;
  return `${publisher}. (${year}). ${ind.name}. EIC Data. https://data.eic-jp.org/catalog/${ind.id}`;
}

function formatBibtex(ind: Indicator, asOf: string): string {
  const year = yearOf(asOf);
  const publisher = ind.publisher ?? ind.source_name;
  const key = `eic_${ind.id.replaceAll('-', '_')}`;
  return `@misc{${key},
  title = {${ind.name}},
  author = {{${publisher}}},
  year = {${year}},
  url = {https://data.eic-jp.org/catalog/${ind.id}},
  note = {Retrieved via EIC Data (data.eic-jp.org), license: ${ind.license}}
}`;
}

function formatChicago(ind: Indicator, asOf: string): string {
  const year = yearOf(asOf);
  const publisher = ind.publisher ?? ind.source_name;
  return `${publisher}. "${ind.name}." EIC Data. Accessed ${asOf}. https://data.eic-jp.org/catalog/${ind.id}.`;
}

/**
 * disclaimer テンプレ（bess-net 全体で統一）
 */
export const EIC_DATA_DISCLAIMER = `データ出典: EIC Data (data.eic-jp.org)、原データは各機関の公表値。本サービスでは公開・無料・引用可能なソースのみを使用しています。`;
