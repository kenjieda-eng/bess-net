/**
 * EIC Data 引用フォーマッタ
 * data.eic-jp.org 側 (5/13 PR #37) の実装を移植
 *
 * 用途: 各 catalog ページ・業界レポートで引用文字列を機械的に生成
 * 形式: APA 7 / BibTeX / Chicago 17
 */
import type { Indicator } from '@/types/eic';

export type CitationFormat = 'bibtex' | 'apa' | 'chicago';

export function formatCitation(indicator: Indicator, format: CitationFormat = 'apa'): string {
  switch (format) {
    case 'bibtex':
      return formatBibtex(indicator);
    case 'apa':
      return formatApa(indicator);
    case 'chicago':
      return formatChicago(indicator);
  }
}

function safeYear(dateStr?: string): number {
  if (!dateStr) return new Date().getFullYear();
  const d = new Date(dateStr);
  return Number.isNaN(d.getFullYear()) ? new Date().getFullYear() : d.getFullYear();
}

function formatApa(ind: Indicator): string {
  const year = safeYear(ind.observation_cutoff);
  const publisher = ind.publisher ?? ind.source_name;
  return `${publisher}. (${year}). ${ind.name}. EIC Data. https://data.eic-jp.org/catalog/${ind.id}`;
}

function formatBibtex(ind: Indicator): string {
  const year = safeYear(ind.observation_cutoff);
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

function formatChicago(ind: Indicator): string {
  const year = safeYear(ind.observation_cutoff);
  const publisher = ind.publisher ?? ind.source_name;
  const access = ind.observation_cutoff ?? new Date().toISOString().slice(0, 10);
  return `${publisher}. "${ind.name}." EIC Data. Accessed ${access}. https://data.eic-jp.org/catalog/${ind.id}.`;
}

/**
 * disclaimer テンプレ（bess-net 全体で統一）
 */
export const EIC_DATA_DISCLAIMER = `データ出典: EIC Data (data.eic-jp.org)、原データは各機関の公表値。本サービスでは公開・無料・引用可能なソースのみを使用しています。`;
