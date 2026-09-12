// related-terms.ts
// /grid 配下ページの「関連用語」固定リンク。
// microCMS glossary に実在する slug × 表示用 term のペア。
// 落とし穴 #59: 固定リンクリストは microCMS の実体slug と整合検証必須。
// すべて 2026-05-07 時点で `?filters=slug[equals]<slug>` 検索により実在確認済み。
// 金曜#6 追修便② ■7(b)（2026-09-12）: 固定リンクは編集で選んだ語なので、301 元になった slug は
//   「除外」せず 301 の宛先へ付け替えて 6 語を保つ（生成一覧は除外・キュレーション済み固定リンクは差し替え）。
//   non-firm-detail → non-firm-connection、output-control → curtailment（src/lib/glossary-301.ts の GLOSSARY_301）。
//   301 元の混入は npm run verify:no-301-links が検査する。

export type GlossaryTermLink = { term: string; slug: string };

export const GRID_PAGE_RELATED_TERMS: GlossaryTermLink[] = [
  { term: '系統連系', slug: 'grid-interconnection' },
  { term: '系統空き容量', slug: 'grid-available-capacity' },
  { term: 'ノンファーム接続', slug: 'non-firm-connection' },
  { term: 'ノンファーム', slug: 'non-firm-connection' },
  { term: '出力制御', slug: 'curtailment' },
  { term: '変電所', slug: 'substation' },
];
