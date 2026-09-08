/**
 * src/lib/projects-301.ts
 *
 * /projects 重複統合 301 マップの単一情報源（SSOT）。GLOSSARY_301（src/lib/glossary-301.ts）と同方式。
 * middleware.ts が `/projects/旧` → `/projects/canonical` の 301 に使用。
 *
 * 非破壊: 旧entry は microCMS に残す（middleware が 301 吸収＝404を作らない）。
 * 一覧除外は src/lib/projects-excluded.ts（PROJECTS_301_SOURCE_SLUGS を自動 union）。
 * sitemap も isListExcludedProject で除外されるため、本マップに1行足せば
 * 「301 ＋ 一覧除外 ＋ sitemap 除外」が同時に成立する（件数は焼き込まない・#121）。
 * canonical は dry-run でデータ妥当性を確認・空フィールドは情報補完 PATCH 済（cod/status）。
 *
 * 統合グループ（projects分析 発見③ / stage-1監査D・ユウ監査 2026-06-28 以降の追記）:
 *   1 千里蓄電所      → osakagas-suita（大阪ガス・11MW/23MWh）
 *   2 上奈良蓄電所    → kaminara-bess（HOBE ENERGY・5MWh）
 *   3 琵琶湖蓄電所    → pr-co18049-bess（森トラスト・8.7MW/19.7MWh）
 *   4 群馬太田市蓄電所 → ota-bess（稼働中・cleaner slug）
 *   5 石川県加賀市2MW/4MWh → pr-2mw-4mwh-bess-2
 */
export const PROJECTS_301: Record<string, string> = {
  // 1 千里蓄電所
  '/projects/pr-co76147-bess':         '/projects/osakagas-suita',
  '/projects/pr-co139670-bess':        '/projects/osakagas-suita',
  // 2 上奈良蓄電所
  '/projects/pr-co173175-saitama-5mwh': '/projects/kaminara-bess',
  // 3 琵琶湖蓄電所
  '/projects/pr-co85927-bess-2':       '/projects/pr-co18049-bess',
  // 4 群馬太田市蓄電所
  '/projects/gunma-ota':               '/projects/ota-bess',
  // 5 石川県加賀市2MW/4MWh蓄電所
  '/projects/pr-2mw-4mwh-bess-3':      '/projects/pr-2mw-4mwh-bess-2',
  // 6 武雄蓄電所（2026-06-29 stage6・みずほリースPR ⇔ 4社canonical jfe-takeo）
  '/projects/pr-co85927-bess':         '/projects/jfe-takeo',
  // 7 ポート群馬太田蓄電所（2026-06-30 stage9・需給調整参入PR183/計画中 ⇔ 稼働中2MW/8MWh canonical pr-co16325-gunma）
  '/projects/pr-co16325-bess':         '/projects/pr-co16325-gunma',
  // 8 オリンピア太田・伊勢崎蓄電所（2026-07-01・PowerX PR/14.8MWh ⇔ operator=オリンピア正・slug綺麗 canonical olympia-ota-isesaki）
  '/projects/pr-co109041-gunma-148mwh': '/projects/olympia-ota-isesaki',
  // 9-10 日本蓄電池 PR-import 重複（2026-07-02・容量補完①）: raw「日本蓄電池 [県][市]」0/0 stub ⇔ curated NC{市}{地区}蓄電所 8.146MWh
  '/projects/pr-co161802-fukushima-2': '/projects/nc-shirakawa-omotegou', // 福島県白河市
  '/projects/pr-co161802-yamaguchi-2': '/projects/nc-shunan-yuno',        // 山口県周南市
  // 11〜 調査中182件一斉整理（2026-08-04・projects-fill-2026-08 検証済: dup18組+verify4組）
  '/projects/pr-daigas-hokkaido-2':                '/projects/pr-daigas-hokkaido', // 千歳・上長都25MW/50MWh 同一案件（3重登載）
  '/projects/osakagas-chitose':                    '/projects/pr-daigas-hokkaido', // 千歳・上長都25MW/50MWh 同一案件（3重登載）
  '/projects/pr-co55631-hokkaido':                 '/projects/naganuma-bess', // 長沼37,515kW 同一案件（事業者は城洋商事に訂正）
  '/projects/pr-co161802-bess-2':                  '/projects/pr-co161802-bess-4', // 春日井西尾蓄電所 同一地点（4重登載）
  '/projects/pr-co161802-bess-3':                  '/projects/pr-co161802-bess-4', // 春日井西尾蓄電所 同一地点（4重登載）
  '/projects/pr-co86244-bess-3':                   '/projects/pr-co161802-bess-4', // 春日井西尾蓄電所 同一地点（4重登載）
  '/projects/pr-afterfit-bess':                    '/projects/arao-bess', // 荒尾2MW/8MWh 同一案件（3重登載）
  '/projects/pr-co55631-kumamoto':                 '/projects/arao-bess', // 荒尾2MW/8MWh 同一案件（3重登載）
  '/projects/pr-co2296-bess':                      '/projects/daiwa-kurate', // 大和ハウス鞍手1.9MW/9.8MWh 同一案件
  '/projects/pr-co113700-bess-5':                  '/projects/kirishima-bess', // 霧島1.99MW/8.128MWh 同一案件（3重登載）
  '/projects/pr-co113700-bess':                    '/projects/kirishima-bess', // 霧島1.99MW/8.128MWh 同一案件（3重登載）
  '/projects/pr-co109041-bess-3':                  '/projects/pr-co86244-bess-7', // JMES3地点（津・東浦・牧之原）同一取引
  '/projects/pr-co161802-saga':                    '/projects/pr-co161802-saga-2', // NC唐津市相知町 同一案件
  '/projects/pr-co161802-gifu-2':                  '/projects/pr-co161802-gifu', // NC岐阜市太郎丸 同一案件
  '/projects/pr-co161802-gifu-4':                  '/projects/pr-co161802-gifu-3', // NC羽島足近町 同一案件
  '/projects/pr-co70816-bess':                     '/projects/mitsuuroko-tahara', // ミツウロコ田原1,500kW/6,000kWh 同一案件
  '/projects/pr-co70816-bess-2':                   '/projects/mitsuuroko-tahara', // ミツウロコ田原1,500kW/6,000kWh 同一案件
  '/projects/pr-co70816-miyagi':                   '/projects/mitsuuroko-sendai', // ミツウロコ仙台1,534kW/6,140kWh 同一案件
  '/projects/pr-looop-tokyo':                      '/projects/pr-looop-saitama', // Looop比企郡小川町 同一案件（東京都事業採択のため東京都表記になっていた）
  '/projects/pr-co86244-bess-5':                   '/projects/sunvillage-echizen', // 越前2MW/8MWh 同一案件
  '/projects/pr-co175281-bess':                    '/projects/pr-co175281-shizuoka', // ブルースカイ牧之原 同一案件
  '/projects/pr-co143072-bess-3':                  '/projects/pr-co143072-bess-2', // テス×東京センチュリー徳島2件 同一提携
  '/projects/pr-co89612-bess':                     '/projects/pr-co89612-bess-2', // EUKA 200MW/800MWh 同一プロジェクト
  '/projects/pr-co93934-bess':                     '/projects/ota-bess', // fantasista群馬太田8.14MWh 同一案件（3重登載）
  '/projects/pr-co93934-bess-2':                   '/projects/ota-bess', // fantasista群馬太田8.14MWh 同一案件（3重登載）
  '/projects/pr-co161802-miyagi-2':                '/projects/nc-sendai-kamiayashi', // verify_clusters判定 2026-08
  '/projects/pr-co33609-kumamoto-2mw':             '/projects/pr-co161802-kumamoto', // verify_clusters判定 2026-08
  '/projects/pr-co116500-bess':                    '/projects/pr-lehmanhodings-saitama', // verify_clusters判定 2026-08
  '/projects/pr-co116500-bess-2':                  '/projects/pr-lehmanhodings-saitama', // verify_clusters判定 2026-08
  '/projects/hdre-hokkaido-50':                    '/projects/pr-100mwh-bess', // verify_clusters判定 2026-08
  '/projects/pr-auroraenergyres-hokkaido-50mw':    '/projects/pr-100mwh-bess', // verify_clusters判定 2026-08
  // 12 スターシーズ和歌山井ノ口蓄電所（2026-09-03 Pj2-C・ユウ裁定§3）
  //    同一一次（PR TIMES 000000044.000088876）・同一所在地（和歌山県和歌山市）。
  //    旧側 pr-co88876-bess-3 は body が「〜は、に立地する」の所在地欠落定型文で cod=発表日
  //    ＝PR一括取込の汎用レコードの特徴が揃う。canonical はキュレーション済みの
  //    starseeds-wakayama-inokuchi。microCMS レコードは削除しない（middleware が 301 吸収）。
  '/projects/pr-co88876-bess-3':                   '/projects/starseeds-wakayama-inokuchi',
  // 13 徳島県板野郡蓄電所（とくぎんトモニリンクアップ）（2026-09-05 金曜#5 追修便・ユウ裁定 9/5）
  //    旧側 pr-co92942-bess は name が PR タイトル断片「初となる系統用蓄電所」・city null・
  //    sourceUrl が Sustech トップページ・cod=参入発表日（2026-02-20）＝PR一括取込の汎用レコード。
  //    諸元（1.99MW/8.226MWh・徳島県）は canonical と一致し、Sustech は同設備のアグリゲーター。
  //    canonical はキュレーション済み（一次: Sustech PR 000000090.000092942・2026-08-31 竣工）。
  //    latitude/longitude は移植しない（addr_source=pref-only の派生座標・一次裏付けなし）。
  //    microCMS レコードは削除しない（middleware が 301 吸収）。
  '/projects/pr-co92942-bess':                     '/projects/pr-co149815-bess',
  // 14 ADW三重松阪蓄電所（2026-09-08 Pj2-G・ユウ裁定 Pj2-F(1)）
  //    ★「別法人＝別案件」ガードの逆パターン。保有者(ADW)と施工者(サステナブルHD)が
  //    それぞれ自社リリースを出したため、同一設備が2レコードに二重登載されていた。
  //    同一性の一次逐語（ADW PR 000000043・竣工式）:
  //      「施工会社であるサステナブルホールディングス株式会社、アグリゲーターのデジタルグリッド株式会社、
  //        O＆M（運営・保守）のJESM株式会社各社の代表の方々らにご参列いただき」
  //    所在地（三重県松阪市）・稼働日（2026-03-31）・諸元（1,995kW/8,340kWh ≒ 2MW/8MWh）が一致。
  //    canonical は案件の主体である保有・運営者側（ADW）。301 の前に canonical へ諸元を移設済み
  //    （outputMw 0→1.995・capacityMwh 0→8.34。出所は SHD PR 000000065 の実値であり、
  //     PR 077 の丸め 2MW/8MWh でも ADW 側「2,000kW以下」の上限表記でもない）。
  '/projects/pr-co96742-mie-8mwh':                 '/projects/pr-co160356-bess',
  // 15 ノーバル・パワーC2（2026-09-08 Pj2-G 追修便・ユウ裁定）
  //    同一施設の二重登載。-2 は竣工告知（PR 000000004・2025-03-12 配信）、
  //    -3 は商業運転開始告知（PR 000000006・2025-07-09 配信）で、一次2本は同じ設備を指す:
  //      施設名「ノーバル・パワーC2」／茨城県常総市／1927.2kW・4887.6kWh（407.3kWh×12台）／
  //      連系完了 2025-03-07／CATL製LFP／東京都 令和4年度 系統用大規模蓄電池導入促進事業 採択
  //    canonical は -3。理由: 一次が後発で商業運転開始日が確定形（2025-06-19）、
  //    -3 の一次にしか無い情報（E-Flow によるアグリゲーター運用受託・参画市場）がある、
  //    -2 の cod=2025-03-12 は PR 配信日で誤り（本文の事象日は連系完了 3/7 のみ）。
  //    ★-2 側に排他的な実情報は無く（唯一の差分「商業運転の開始は同月末を予定」は
  //      後続告知で 6/19 と確定済み＝移植すると誤情報）、移植はしていない。
  '/projects/pr-co69153-ibaraki-2':                '/projects/pr-co69153-ibaraki-3',
};

/** 301元の bare slug（一覧除外・noindex 判定の補助。完全一致） */
export const PROJECTS_301_SOURCE_SLUGS: ReadonlySet<string> = new Set(
  Object.keys(PROJECTS_301).map((p) => p.replace(/^\/projects\//, '')),
);
