// related-terms.ts
// /grid 配下ページの「関連用語」固定リンク。
// microCMS glossary に実在する slug × 表示用 term のペア。
// 落とし穴 #59: 固定リンクリストは microCMS の実体slug と整合検証必須。
// すべて 2026-05-07 時点で `?filters=slug[equals]<slug>` 検索により実在確認済み。

export type GlossaryTermLink = { term: string; slug: string };

export const GRID_PAGE_RELATED_TERMS: GlossaryTermLink[] = [
  { term: '系統連系', slug: 'grid-interconnection' },
  { term: '系統空き容量', slug: 'grid-available-capacity' },
  { term: 'ノンファーム接続', slug: 'non-firm-connection' },
  { term: 'ノンファーム', slug: 'non-firm-detail' },
  { term: '出力制御', slug: 'output-control' },
  { term: '変電所', slug: 'substation' },
];
