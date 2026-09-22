/**
 * src/data/subsidies-excluded.ts
 *
 * subsidies（/subsidies・/subsidies/[slug]・/tools/subsidy-match・sitemap ほか）から外すレコードの単一情報源（SSOT）。
 * links-excluded.ts・events-excluded.ts と同方式（Ck-1a ■1-1・2026-09-22）。
 *
 * 非破壊: microCMS のレコードは削除しない（DELETE しない）。subsidies のスキーマに非表示用の欄は無いため、
 * 取得の共通関数（src/lib/microcms.ts の getAllSubsidies・getSubsidyBySlug・getAllSubsidySlugs）で外す。
 * precompute（scripts/precompute-subsidies.ts → src/data/subsidies.json）も getAllSubsidies を通るので、
 * 一覧・詳細（404）・補助金マッチ・sitemap・件数・グリッドの県ページが同時に揃う（#118/#119: 一部の経路だけ外れる事態を防ぐ）。
 *
 * 理由はすべて reports/ck1-approval-2026-09-21.md「0-1. 補助金 18 件」の該当行（slug が行 id）。
 * いずれも一次（各自治体の制度一覧・担当課ページ）で、名称・所管・補助率・上限の揃う制度を確認できなかった。
 * 「公募終了」と書き換えるのも制度の実在を示せない以上は捏造になるため、書き換えずに外す。
 * 実在する制度への作り直しは Ck-2 で個別に裁定する。
 */
export type ExcludedSubsidy = {
  slug: string;
  /** 承認表の行 id */
  row: string;
  /** 非表示にした理由（承認表の要約） */
  reason: string;
};

export const SUBSIDIES_EXCLUDED: readonly ExcludedSubsidy[] = [
  { slug: 'hyogo-energy-storage-2026', row: '§0-1 hyogo-energy-storage-2026', reason: '兵庫県の支援制度一覧に同名制度なし。近い非住宅太陽光補助は 1/3・上限 3,000 万円と一致しない' },
  { slug: 'kawasaki-decarbonization-2026', row: '§0-1 kawasaki-decarbonization-2026', reason: '川崎市の事業者向け補助に 2/3・上限 2,000 万円の制度なし' },
  { slug: 'kobe-sme-decarbonization-2026', row: '§0-1 kobe-sme-decarbonization-2026', reason: '神戸市環境局の補助一覧に該当制度なし。近い経済観光局の制度は令和 4 年に受付終了で所管・率とも不一致' },
  { slug: 'nagoya-bess-2026', row: '§0-1 nagoya-bess-2026', reason: '名古屋市の補助一覧に産業用蓄電池の単独補助なし。担当部署名も不一致' },
  { slug: 'yokohama-self-consumption-2026', row: '§0-1 yokohama-self-consumption-2026', reason: '横浜市の令和 8 年度制度一覧（23 制度）に 1/2・上限 1,500 万円の制度なし' },
  { slug: 'chiba-bess-support-2026', row: '§0-1 chiba-bess-support-2026', reason: '千葉県の事業用支援制度一覧に該当なし。記録の「産業労働部」は実在しない（実際は商工労働部）' },
  { slug: 'fukuoka-bess-2026', row: '§0-1 fukuoka-bess-2026', reason: '福岡県商工部に「新産業振興課」なし。同名の県制度なし' },
  { slug: 'gunma-bess-2026', row: '§0-1 gunma-bess-2026', reason: '群馬県産業経済部に「エネルギー政策課」なし。該当制度なし' },
  { slug: 'hiroshima-bess-support-2026', row: '§0-1 hiroshima-bess-support-2026', reason: '広島県イノベーション推進チームに蓄電の記載なし。該当制度なし' },
  { slug: 'hokkaido-renewable-2026', row: '§0-1 hokkaido-renewable-2026', reason: '北海道の令和 8 年度新エネ補助 8 事業に同名・1/3・系統用蓄電池対象の事業なし' },
  { slug: 'ibaraki-decarbonization-2026', row: '§0-1 ibaraki-decarbonization-2026', reason: '茨城県の助成・支援金一覧と産業政策課ページに該当制度なし' },
  { slug: 'kagoshima-solar-bess-2026', row: '§0-1 kagoshima-solar-bess-2026', reason: '鹿児島県の実在 2 制度とも上限・所管が不一致。該当制度なし' },
  { slug: 'nagano-self-consumption-2026', row: '§0-1 nagano-self-consumption-2026', reason: '長野県の再エネ補助金一覧に事業者向け 1/2・上限 1,500 万円の制度なし' },
  { slug: 'oita-bess-2026', row: '§0-1 oita-bess-2026', reason: '大分県の事業者向け補助一覧に系統用蓄電池の制度なし。所管も不一致' },
  { slug: 'okinawa-island-energy-2026', row: '§0-1 okinawa-island-energy-2026', reason: '沖縄県に「離島電力安定化補助金」は存在しない' },
  { slug: 'saitama-decarbonization-2026', row: '§0-1 saitama-decarbonization-2026', reason: '同名制度なし。旧 URL の a0509 ディレクトリも県サイトに存在しない' },
  { slug: 'shizuoka-bess-2026', row: '§0-1 shizuoka-bess-2026', reason: '静岡県の補助制度一覧に同名制度なし。産業政策課は補助事業を持たない' },
  { slug: 'regional-bank-green-loans', row: '§0-1 regional-bank-green-loans', reason: '単一の制度ではなく各地銀のグリーンローンの総称。出典の全銀協ページは存在した形跡がない' },
];

export const SUBSIDIES_EXCLUDED_SLUGS: ReadonlySet<string> = new Set(SUBSIDIES_EXCLUDED.map((s) => s.slug));

/** subsidies のレコードを表示から外すか（slug 完全一致） */
export function isExcludedSubsidy(slug: string | undefined | null): boolean {
  return !!slug && SUBSIDIES_EXCLUDED_SLUGS.has(slug);
}
