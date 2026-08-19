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
    importedOn: '2026-08-19',
    areaJp: '関西',
    areaSlug: 'kansai',
    operator: '関西電力送配電',
    publishedVersion: '2026年8月17日更新版（154kV以上・未満とも同一版）',
    total: 1702,
    decreased: 93,
    zeroed: 10,
    increased: 92,
    changed: 619,
    added: 83,
    removed: 0,
    topDecreases: [
      { name: '内原', prefecture: '関西ローカル系', from: 11, to: 0 },
      { name: '阪井', prefecture: '関西ローカル系', from: 14, to: 4 },
      { name: '西院', prefecture: '関西ローカル系', from: 28, to: 19 },
      { name: '本郷', prefecture: '関西ローカル系', from: 9, to: 3 },
      { name: '高浜', prefecture: '関西ローカル系', from: 18, to: 12 },
    ],
    note: '基幹系統79件（500/275kV等）を新規収録し、公表128件の全容を収録しました（従来は49件のみ）。'
      + '空容量は基幹が全行「運用容量−|予想潮流|」で算出（公表カラムに実値なし・PDF留意事項(2)）、'
      + 'ローカルはカラム直読1,296件＋同式で算出279件。空容量の新規充足326件。'
      + '篠山・山口・大池の3件は電圧階級が77kV系→22kV系に変更（公表側の記載変更・設備は同一）。'
      + '高時川は公表No.の振り直し（滋D→滋ED・設備は同一・URLは維持）。'
      + '玄妙・美豆・金剛南・金剛中・万波の5件は最新版に不掲載のため凍結（更新停止・ページ維持）。'
      + 'N-1電制の未算定2件・出力制御の未算定14件は現値維持。',
    report: 'reports/grid-kansai-dryrun-2026-08-17.md',
  },
  {
    importedOn: '2026-08-17',
    areaJp: '北海道',
    areaSlug: 'hokkaido',
    operator: '北海道電力ネットワーク',
    publishedVersion: '2026年7月31日更新版ほか（系統により2025年5月〜2026年8月7日）',
    total: 459,
    decreased: 29,
    zeroed: 4,
    increased: 29,
    changed: 95,
    added: 35,
    removed: 0,
    topDecreases: [
      { name: '東岩見沢変電所', prefecture: '北海道', from: 9, to: 6 },
      { name: '稚内西変電所', prefecture: '北海道', from: 10, to: 8 },
      { name: '浜頓別変電所', prefecture: '北海道', from: 3, to: 1 },
      { name: '新十津川変電所', prefecture: '北海道', from: 6, to: 4 },
      { name: '錦岡変電所', prefecture: '北海道', from: 2, to: 0 },
    ],
    note: '基幹系（187kV以上）35件を新規収録し、N-1電制適用可が3→24件になりました'
      + '（従来は基幹系そのものが未収録でした）。データ源をPDF抽出から公表CSVへ変更。'
      + 'N-1電制の未算定7件・出力制御の未算定9件は現値維持。',
    report: 'reports/grid-hokkaido-dryrun-2026-08-17.md',
  },
  {
    importedOn: '2026-08-16',
    areaJp: '中国',
    areaSlug: 'chugoku',
    operator: '中国電力ネットワーク',
    publishedVersion: '2026年8月6日更新版（岡山・島根・鳥取・山口は2026年7月27日更新）',
    total: 874,
    decreased: 44,
    zeroed: 2,
    increased: 24,
    changed: 167,
    added: 1,
    removed: 0,
    topDecreases: [
      { name: '用瀬変電所', prefecture: '鳥取県', from: 12, to: 6 },
      { name: '打吹変電所', prefecture: '鳥取県', from: 16, to: 10 },
      { name: '明塚変電所', prefecture: '島根県', from: 4, to: 1 },
      { name: '真加部変電所', prefecture: '岡山県', from: 7, to: 4 },
      { name: '岩国(変)', prefecture: '山口県', from: 17, to: 14 },
    ],
    note: 'N-1電制の未算定8件・出力制御の未算定15件は現値維持。玉造変電所に110/22kVバンクを新規収録。'
      + '安浦・大崎・玉造の3件は公表No.の振り直し（設備は同一・URLは維持）。',
    report: 'reports/grid-chugoku-dryrun-2026-08-16.md',
  },
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
