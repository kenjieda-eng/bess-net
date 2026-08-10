// /grid/tokyo — 東京エリア（東京電力PG）系統空き容量データページ
// - Phase 2c: 公開状況解説 → エリアデータページ化（他エリアと同形、AreaPage を描画）。
// - 経緯/公開状況は /grid/tokyo/status へ移設（404を作らない・L-EIC-019）。
// - 落とし穴 #57: 静的セグメント `tokyo/` は同階層の `[slug]/` より優先されるため、
//   ここで AreaPage を明示描画する（[slug] の generateStaticParams からは tokyo を除外済み）。
import type { Metadata } from 'next';
import AreaPage from '../[slug]/AreaPage';
import { AREA_META } from '../[slug]/area-meta';
import substationsIndex from '@/data/substations/index.json';
import { buildAreaTitle, buildAreaDescription } from '@/lib/grid-meta';
import { formatDataDateLabel } from '@/lib/grid-data-date';

export const revalidate = 3600;

const META = AREA_META.tokyo;

// Gr6(2026-08-09): 東京は静的セグメントで [slug] を通らないため、同じ title 生成をここにも適用する
//（適用漏れがあると「東京電力 空き容量」に当たらないままになる）。
const TOKYO_COUNT =
  (substationsIndex as { area_dates?: Record<string, { count: number }> }).area_dates?.[META.areaJp]
    ?.count ?? null;
const TOKYO_TITLE = buildAreaTitle(META.areaJp, META.operator, TOKYO_COUNT);
const TOKYO_DESC = buildAreaDescription(
  META.areaJp,
  META.operator,
  TOKYO_COUNT,
  formatDataDateLabel(META.areaJp),
  META.description.substring(0, 90)
);

export const metadata: Metadata = {
  title: { absolute: TOKYO_TITLE },
  description: TOKYO_DESC,
  alternates: { canonical: '/grid/tokyo' },
  openGraph: {
    title: TOKYO_TITLE,
    description: TOKYO_DESC,
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function TokyoAreaPage() {
  return <AreaPage meta={META} />;
}
