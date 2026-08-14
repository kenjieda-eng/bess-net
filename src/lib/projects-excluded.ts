/**
 * src/lib/projects-excluded.ts
 *
 * /projects から「除外＋noindex」する非プロジェクト slug（stage-1監査C・ニュース性）。
 * 非破壊: microCMS データは削除しない。一覧/件数/集計から除外し、各詳細ページは
 * 残したまま noindex（robots index:false）にする＝404を作らない・既存URLは200維持。
 *
 * ★ 厳密区別（slug が紛らわしい・絶対に触らない実プロジェクト）:
 *   - pr-100mwh-bess（Helios 50MW/104MWh・札幌の実案件）は対象外（pr-100mw-bess とは別物）。
 *   - kirishima-bess（霧島蓄電所・3社共同出資の実案件）も対象外。
 * 集合は完全一致（Set.has）なので上記は影響を受けない。
 */
import { PROJECTS_301_SOURCE_SLUGS } from './projects-301';

// 非プロジェクト（ニュース性）8件＝一覧除外＋詳細ページ noindex（ページは残す）
export const EXCLUDED_PROJECT_SLUGS: ReadonlySet<string> = new Set<string>([
  'pr-50-cxo-2-bess',            // セミナー告知
  'pr-iqg-second-foundation-bess', // 資本提携
  'pr-co134284-bess',           // 出資
  'pr-co175281-bess-2',         // 認定告知
  'pr-co138114-bess-2',         // 出資参画
  'pr-jaxa-where-bess',         // 業務提携
  'pr-co109041-bess-2',         // 業務提携（GA4 338秒・noindex でも URL は残るのでアクセス維持）
  'pr-100mw-bess',              // 英国BESS出資参画ニュース（実案件 pr-100mwh-bess とは別）
  // 金曜ワンセット#2 ⑦-1（2026-08-14）: jfe-tc-memuro（北海道芽室・20MW/79MWh）の二重登載。
  // JFE 2025-03-17 PR の実績表にある熊本別案件（J&S蓄電・玉名郡長洲町・1.9MW/8.4MWh）の行を
  // 誤って取り込み、名称=芽室・所在地=熊本県玉名市という自己矛盾レコードになっていた。
  // 正エントリは jfe-tc-memuro。熊本の実案件は js-tamana-nagasu-bess として起票済（2026-08-14・裁定1）。
  'pr-jfe-hokkaido',
  // 金曜ワンセット#2 裁定4（2026-08-14）: yatogo-bess（弥藤吾蓄電所）と同一案件の二重登載。
  // 埼玉県熊谷市・1.96MW/7.46MWh・GSユアサ製が完全一致し、東北電力 2025-03-04 一次
  // （営業運転開始リリース）で弥藤吾蓄電所＝正エントリを確定。日経由来の本エントリを除外。
  'kumagaya-bess',
  // 2026-08-04 一斉整理: 案件性なし32件＋混載1件（projects-fill-2026-08・EDAさん承認済）
  'pr-co109041-bess-4',                // 案件性なし（基本合意による3年間30地点の高圧系統蓄電所開発計画の発表・特定地点なし）
  'pr-co113700-bess-4',                // 案件性なし（提携・全国展開計画の発表のみで特定地点なし）
  'pr-co125331-bess',                  // 案件性なし（海外・米国テキサス州Pintail 200MW/521.4MWhへの出資参画）
  'pr-co13775-bess-2',                 // 案件性なし（低圧200kWh級の消防法実務解説記事の公開告知）
  'pr-co13775-bess-3',                 // 案件性なし（展示会出展終了報告・サービス構想紹介のみ）
  'pr-co138114-bess',                  // 案件性なし（ファンド出資参画・個別案件非開示、TMEIC製・東芝アグリゲーター）
  'pr-co143072-bess-4',                // 案件性なし（テス・エンジニアリングとバディネットの業務提携・特定案件なし）
  'pr-co14485-bess',                   // 案件性なし（匿名組合出資・ファンドで6案件開発予定、個別非開示）
  'pr-co14485-bess-2',                 // 案件性なし（合弁・蓄電所投資ファンド組成検討の基本合意）
  'pr-co161611-bess',                  // 案件性なし（参入戦略セミナー告知）
  'pr-co161611-bess-2',                // 案件性なし（特定卸供給ライセンス取得によるアグリゲーション事業開始・特定地点/数値なし）
  'pr-co168478-bess',                  // 案件性なし（同提携のバディネット側リリース）
  'pr-co174524-bess',                  // 案件性なし（低圧向けアグリゲーションサービス開始発表・地点数値なし）
  'pr-co176494-bess',                  // 案件性なし（ライジングコーポレーションと包括提携・2MW/8MWh規模を今後10件程度開発目標のみで
  'pr-co177112-bess',                  // 案件性なし（海外＝ドイツ、大和エナジー・インフラが持分49%取得）
  'pr-co29991-bess',                   // 案件性なし（パワーエックスとの業務提携契約再締結・特定地点/数値なし）
  'pr-co30192-bess',                   // 案件性なし（AI電力取引システムの本格稼働発表、個別蓄電所の記載なし）
  'pr-co32407-bess',                   // 案件性なし（関西電力講演セミナーの告知）
  'pr-co45726-bess',                   // 案件性なし（アグリゲーションサービスの複数蓄電池合計取扱量100MW突破の発表・単一蓄電所でない）
  'pr-co45726-bess-2',                 // 案件性なし（同・合計取扱量50MW突破の発表・単一蓄電所でない）
  'pr-co53978-bess',                   // 案件性なし（系統用蓄電池ビジネス解説ウェビナー開催告知）
  'pr-co72966-bess',                   // 案件性なし（データセンター×蓄電所用地開発の戦略発表・構想段階）
  'pr-co8483-bess',                    // 案件性なし（海外：アジア太平洋2.4GWh展開・日本国内特定地点の記載なし）
  'pr-co8483-bess-2',                  // 案件性なし（蓄電システム製品Elementa 3 FlexのPV EXPO 2026世界初公開告知）
  'pr-co85927-bess-3',                 // 案件性なし（海外・英国：Fidra Energy Holdingsへの出資参画、3.1GW規模）
  'pr-co86244-bess-8',                 // 案件性なし（ダイヘン提携で2MW×8MWh×6案件・総容量2.4GWh規模の開発計画のみ・特定地点な
  'pr-co89612-bess-3',                 // 案件性なし（REITとの業務提携発表・特定案件未定）
  'pr-co93934-bess-3',                 // 案件性なし（業務提携基本合意書締結・特定地点/数値なし）
  'pr-co99599-bess',                   // 案件性なし（系統用蓄電所開発事業への本格参入発表・3年間100億円規模の投資計画のみ）
  'pr-eprx-2026-bess-bess',            // 案件性なし（EPRX需給調整市場手数料改定の解説記事公開告知）
  'pr-power-bess',                     // 案件性なし（Recharge Power社の日本展開構想・資本業務提携発表）
  'pr-pv-expo-2026-bess',              // 案件性なし（PV EXPO 2026出展レポート）
  'gifu-imari-bess',                   // 混載エントリ（岐阜太郎丸＋伊万里の2案件混載・各構成要素は個別entryに存在）
]);

// 一覧（/projects）除外 = 非プロジェクト8 ∪ 301元6（重複統合・2026-06-28）。
// 301元は middleware が canonical へ 301 するため noindex は不要（一覧からのみ除外）。
export const LIST_EXCLUDED_PROJECT_SLUGS: ReadonlySet<string> = new Set<string>([
  ...EXCLUDED_PROJECT_SLUGS,
  ...PROJECTS_301_SOURCE_SLUGS,
]);

/** 詳細ページ noindex 対象（非プロジェクト8のみ。301元は 301 されるため対象外） */
export function isExcludedProject(slug: string): boolean {
  return EXCLUDED_PROJECT_SLUGS.has(slug);
}

/** /projects 一覧・件数・集計からの除外対象（非プロジェクト8＋301元6） */
export function isListExcludedProject(slug: string): boolean {
  return LIST_EXCLUDED_PROJECT_SLUGS.has(slug);
}
