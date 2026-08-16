/**
 * src/lib/grid-refresh-log.ts — 各社データ再取込の「変化サマリ」記録
 *
 * 依頼BK（2026-08-16）: 空き容量の増減は投資判断に直結するため、取込ごとの要約を
 * /tracker/grid に残して埋もれさせない。数値は取込時の dry-run 差分レポート
 * （reports/grid-{area}-dryrun-*.md）の実測値をそのまま転記する（推測値を書かない）。
 *
 * 追記のみ。過去分は書き換えない（後から見て「いつ何が変わったか」を辿れるようにする）。
 */

export type GridRefreshEntry = {
  /** 取込日（当サイトが反映した日・YYYY-MM-DD） */
  importedOn: string;
  areaJp: string;
  areaSlug: string;
  operator: string;
  /** 各社の公表版（表示用の文字列） */
  publishedVersion: string;
  /** 対象件数 */
  total: number;
  /** 空き容量が減った件数（うちゼロ化） */
  decreased: number;
  zeroed: number;
  /** 空き容量が増えた件数 */
  increased: number;
  /** 値が変わったレコード数 */
  changed: number;
  /** 設備の増減 */
  added: number;
  removed: number;
  /** 減少の代表例（上位） */
  topDecreases: Array<{ name: string; prefecture: string; from: number; to: number }>;
  /** 補足（未算定の現値維持など） */
  note?: string;
  /** 差分レポートのパス（リポジトリ内） */
  report?: string;
};

export const GRID_REFRESH_LOG: readonly GridRefreshEntry[] = [
  {
    importedOn: '2026-08-16',
    areaJp: '東北',
    areaSlug: 'tohoku',
    operator: '東北電力ネットワーク',
    publishedVersion: '2026年7月版（2026-07-03作成）',
    total: 884,
    decreased: 226,
    zeroed: 7,
    increased: 106,
    changed: 386,
    added: 0,
    removed: 0,
    topDecreases: [
      { name: '七戸', prefecture: '青森県', from: 10, to: 2 },
      { name: '酒田北港', prefecture: '山形県', from: 14, to: 7 },
      { name: '柏台', prefecture: '岩手県', from: 10, to: 4 },
      { name: '原町', prefecture: '福島県', from: 11, to: 5 },
      { name: '大越', prefecture: '福島県', from: 5, to: 0 },
    ],
    note: 'N-1電制の未算定20件・出力制御の未算定10件は上書きせず現値維持。',
    report: 'reports/grid-tohoku-dryrun-2026-08-16.md',
  },
  {
    importedOn: '2026-08-16',
    areaJp: '北陸',
    areaSlug: 'hokuriku',
    operator: '北陸電力送配電',
    publishedVersion: '2026年8月5日更新版',
    total: 274,
    decreased: 40,
    zeroed: 1,
    increased: 4,
    changed: 77,
    added: 3,
    removed: 0,
    topDecreases: [
      { name: '泊', prefecture: '富山県', from: 15, to: 8 },
      { name: '五百石', prefecture: '富山県', from: 8, to: 3 },
      { name: '安宅　77/6kV', prefecture: '石川県', from: 20, to: 16 },
      { name: '大野', prefecture: '福井県', from: 20, to: 16 },
      { name: '富来', prefecture: '石川県', from: 7, to: 4 },
    ],
    note: 'N-1電制の未算定222件は現値維持。早月第一66/22kV ほか3件を新規収録。',
  },
  {
    importedOn: '2026-08-16',
    areaJp: '東京',
    areaSlug: 'tokyo',
    operator: '東京電力パワーグリッド',
    publishedVersion: '2026年7月10日公表（CSV版）',
    total: 1718,
    decreased: 0,
    zeroed: 0,
    increased: 0,
    changed: 104,
    added: 1,
    removed: 0,
    topDecreases: [],
    note: '空き容量(当該)は全1,521件で変化なし。上位系等考慮空容量が10件減（うちゼロ化9件）。'
      + '湯船は最新公表に不掲載のため更新停止（凍結）。',
  },
] as const;
