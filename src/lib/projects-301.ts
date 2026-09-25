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
  // 8 （削除・2026-09-25 Pj2-H 実行便 A-2）オリンピア太田・伊勢崎蓄電所
  //    旧: '/projects/pr-co109041-gunma-148mwh' → '/projects/olympia-ota-isesaki'
  //    301 先だった olympia-ota-isesaki 自身が「2 施設の混載エントリ」として EXCLUDED になったため、
  //    301 を残すと「301 先が noindex の混載ページ」になる。301 を消すと projects-excluded.ts の
  //    自動 union（PROJECTS_301_SOURCE_SLUGS）から外れるので、pr-co109041-gunma-148mwh は
  //    EXCLUDED_PROJECT_SLUGS へ明示追加した（同ファイル参照）。
  //    構成 2 施設は既存: pr-co109041-gunma（三室町・1.998MW/7.404MWh）／oly-powerstorage-midorimachi（緑町）。
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
  // ★2026-09-25 Pj2-H 実行便: 宛先を張り替え。pr-co86244-bess-7 自身が 301 元になった（下の 18 番）ため、
  //   このままだと 301 → 301 の 2 ホップになる（middleware.ts は単発ルックアップで連鎖を畳まない）。
  '/projects/pr-co109041-bess-3':                  '/projects/pr-co86244-mie-tsu', // JMES3地点の束ね2件目・代表は津（芸濃町萩野蓄電所）
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
  // 16 ミツウロコ愛知県田原蓄電所（2026-09-24 Pj2-H-0 構造便・ユウ承認済）
  //    同一施設の二重登載。canonical は日経BP 由来のキュレーション済みエントリ mitsuuroko-tahara。
  //    同定の一次逐語（日経BP 2023/09/30「ミツウロコ、田原市に6MWhの系統用蓄電池を設置」）:
  //      「ミツウロコグループホールディングスの連結子会社であるミツウロコグリーンエネルギー（東京都中央区）は、
  //        愛知県田原市に系統用蓄電池を設置し、9月20日から「ミツウロコ愛知県田原蓄電所」として運用を開始した。」
  //      「蓄電池は米テスラ製を採用し、出力は1.5MW、容量は6MWh。」
  //    301 元 pr-co70816-bess-3 の name はこの正式施設名の逐語と一致し、所在地・諸元（1.5MW/6MWh）も一致する。
  //    ★ただし 301 元の sourceUrl（PR TIMES 000000040.000070816・2022-02-09）は本文が
  //      「北海道北広島市の『北広島第一、第二蓄電所』（3,085.6kW/12,192kWh・TESLA Megapack）」で、
  //      田原の出典になっていない（PR 一括取込の誤割当。cod=2022-02-09 もその配信日）。
  //      したがって 301 元に移植すべき一次裏付けのある情報は無い（前例: pr-co69153-ibaraki-2）。
  //      operator は「株式会社ミツウロコグループホールディングス」＝PR アカウント名（親会社）ではなく、
  //      一次が運用主体と明記する「ミツウロコグリーンエネルギー株式会社」を canonical に入れた（PATCH 済）。
  '/projects/pr-co70816-bess-3':                   '/projects/mitsuuroko-tahara',
  // 17 NC仙台市青葉区上愛子蓄電所（2026-09-24 Pj2-H-0 構造便 ■1(b)）
  //    ★双子（NC仙台市上愛子B蓄電所＝pr-co161802-miyagi）とは寄せていない。決め手は諸元一致ではなく、
  //    両レコードの sourceUrl が同一の PR TIMES 000000199.000033609 であり、そのリリースが名指しする
  //    宮城の拠点が 1 施設しかないこと。逐語（リミックスポイント 2026-04-01）:
  //      「本プロジェクトの2拠点目として宮城県仙台市の系統用蓄電所「NC仙台市青葉区上愛子蓄電所」
  //        （定格出力約2MW、定格容量約8MWh）が、2026年4月1日に受電を開始しました。」
  //      施設概要「施設名 NC仙台市青葉区上愛子蓄電所／定格出力 1,988kW／定格容量 8,146kWh」
  //    A と B は一次で 3 点分離できる — 施設名（000000051 と 000000056）／公表日（4/1 と 4/3）／
  //    需給調整市場の運用開始日（000000079 の 6/23 と 自社 news/1795 の 6/30）。
  //    canonical は固有名を持つ側（301 元の name「日本蓄電池（株式会社リミックスポイント）」は社名の断片）。
  //    同一施設の日本蓄電池側 stub pr-co161802-miyagi-2 は既に nc-sendai-kamiayashi へ 301 済（前例 9-10 と同型）。
  //    301 前に canonical へ status「稼働中」を移植済（根拠: 000000079「2026年6月23日より需給調整市場向けの運用を開始」）。
  '/projects/pr-co33609-miyagi-2mw':               '/projects/nc-sendai-kamiayashi',
  // 18 JMES BESS ONE 3施設の束ね（2026-09-25 Pj2-H 実行便 A-2・裁定書 §2(D) の分割承認）
  //    pr-co86244-bess-7 は津・知多・牧之原の 3 施設を 1 レコードにした束ね。3 施設は本便で
  //    pr-co86244-mie-tsu / -aichi-chita / -shizuoka-makinohara として個別起票した。
  //    ★他の束ね 5 件が EXCLUDED なのに本件だけ 301 なのは、代表施設が一次で一意に決まるため:
  //      PR TIMES 000000035.000086244 逐語「最初の案件は2025年3月運転開始を目指しています」＋
  //      3 施設表で 2025年3月 は三重県津市のみ。束ねが持つ 1.99MW/7.403MWh も津市の値と一致するので
  //      301 後も値の意味が変わらない（配列の先頭を代表にする #121 型の恣意ではない）。
  '/projects/pr-co86244-bess-7':                   '/projects/pr-co86244-mie-tsu',
};

/** 301元の bare slug（一覧除外・noindex 判定の補助。完全一致） */
export const PROJECTS_301_SOURCE_SLUGS: ReadonlySet<string> = new Set(
  Object.keys(PROJECTS_301).map((p) => p.replace(/^\/projects\//, '')),
);
