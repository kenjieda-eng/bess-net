// /grid/tokyo — 東京エリア（東京電力PG）系統空き容量データページ
// - Phase 2c: 公開状況解説 → エリアデータページ化（他エリアと同形、AreaPage を描画）。
// - 経緯/公開状況は /grid/tokyo/status へ移設（404を作らない・L-EIC-019）。
// - 落とし穴 #57: 静的セグメント `tokyo/` は同階層の `[slug]/` より優先されるため、
//   ここで AreaPage を明示描画する（[slug] の generateStaticParams からは tokyo を除外済み）。
import type { Metadata } from 'next';
import AreaPage from '../[slug]/AreaPage';
import { AREA_META } from '../[slug]/area-meta';

export const revalidate = 3600;

const META = AREA_META.tokyo;

export const metadata: Metadata = {
  // layout.tsx titleTemplate が自動付与（落とし穴 #86）
  title: `${META.areaJp}エリア｜系統空き容量データベース`,
  description: META.description.substring(0, 160),
  alternates: { canonical: '/grid/tokyo' },
  openGraph: {
    title: `${META.areaJp}エリア｜系統空き容量データベース`,
    description: META.description.substring(0, 160),
    type: 'website',
    images: ['/og-image.png'],
  },
};

export default function TokyoAreaPage() {
  return <AreaPage meta={META} />;
}
