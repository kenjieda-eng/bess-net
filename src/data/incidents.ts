/**
 * 蓄電池 火災・トラブル事例 DB シード版
 *
 * 注意: すべて公開情報 (報道資料 / 政府発表 / 企業プレスリリース) ベース。
 *       教育・安全文化向上目的。詳細は必ず一次ソースを参照のこと。
 *       誤情報を発見した場合は編集部までご連絡ください。
 */

export type IncidentSeverity = 'major' | 'moderate' | 'minor' | 'unknown';
export type IncidentCause = 'thermal_runaway' | 'electrical' | 'mechanical' | 'natural_disaster' | 'human_error' | 'cell_defect' | 'unknown';
export type IncidentRegion = 'japan' | 'us' | 'eu' | 'cn' | 'kr' | 'au' | 'other';

export interface Incident {
  id: string;
  date: string; // YYYY-MM-DD (or YYYY-MM 不明分)
  location: string;
  region: IncidentRegion;
  facilityName: string;
  capacity_mwh?: number;
  severity: IncidentSeverity;
  cause: IncidentCause;
  summary: string; // 1-2 文
  lessons?: string; // 学びポイント (任意)
  sourceUrls: string[]; // 必須
  /**
   * true なら /incidents（一覧・件数・JSON-LD）に出さない（Ck-1a ■1-5・2026-09-22）。
   * 一次で事実を確認できない事例を、データを消さずに外すためのフラグ（DELETE しない方針と同じ）。
   * 表示側は必ず VISIBLE_INCIDENTS を使う（INCIDENTS を直接数えない）。
   */
  hidden?: boolean;
}

export const SEVERITY_LABELS: Record<IncidentSeverity, string> = {
  major: '重大 (人的被害/長期停止)',
  moderate: '中程度 (設備損壊)',
  minor: '軽微 (限定的影響)',
  unknown: '不明',
};

export const CAUSE_LABELS: Record<IncidentCause, string> = {
  thermal_runaway: '熱暴走',
  electrical: '電気系',
  mechanical: '機械系',
  natural_disaster: '自然災害',
  human_error: '人的要因',
  cell_defect: 'セル不良',
  unknown: '不明 / 調査中',
};

export const REGION_LABELS: Record<IncidentRegion, string> = {
  japan: '日本',
  us: '米国',
  eu: '欧州',
  cn: '中国',
  kr: '韓国',
  au: '豪州',
  other: 'その他',
};

// 公開情報のみ。件数は固定で書かない（表示・件数は必ず VISIBLE_INCIDENTS を数える。#121）
export const INCIDENTS: Incident[] = [
  {
    id: 'moss-landing-2021',
    // Ck-2 ■1（E-inc-01〜07・裁定 R23）: 本文が一次と真逆だったため全面是正（2026-09-27 に一次を再取得・逐語一致）。
    //   旧: 「Vistra 運営、Tesla Megapack で熱暴走発生」「2024/9 にも続発」
    //   一次（Vistra 調査報告 2022-01-21）: 「the investigation found that the batteries were not the initial source
    //   of smoke or a cause of the incident.」＝電池は発煙の起点でも原因でもない。セルは LG Energy Solution・EPC は Fluence。
    //   2024/9 の事象は一次不在（隣接する PG&E Elkhorn の 2022-09-20 火災との混同。下の moss-landing-2024 参照）。
    date: '2021-09-04',
    location: '米国カリフォルニア州 Moss Landing',
    region: 'us',
    facilityName: 'Moss Landing Energy Storage Facility — Phase I（Moss 300）',
    capacity_mwh: 1200,
    severity: 'major',
    // 一次が電池起因を否定し、発煙源を空調ユニットの軸受故障、電池損傷を消火配管の継手不良としているため機械系。
    cause: 'mechanical',
    summary:
      '2021年9月4日夜、Vistra の Moss Landing Energy Storage Facility Phase I（300MW/1,200MWh。セルは LG Energy Solution、EPC は Fluence）で水ベースの熱抑制（消火）設備が作動し、電池モジュールの約7%が損傷した。Vistra の調査は「空調ユニットの軸受故障に由来する微量の煙を検知して消火設備が作動し、可とう管・配管の継手不良で電池ラックに放水された。最初の放水時点で全モジュールの温度は規定値内であり、電池は発煙の起点でも事故原因でもなかった」と結論づけている。負傷者・周辺への影響はなく、別棟の Phase II（100MW/400MWh）は稼働を継続した。2022年2月13日にはその Phase II でも同種の事象（損傷約20%）が起きている。',
    lessons:
      '電池そのものが健全でも、付帯設備（空調・消火配管）の不具合が電池損傷に連鎖しうる。消火系の誤作動・継手の施工品質は電池の安全設計と同じ重みで検証する必要がある。Vistra は是正措置を実施したうえで段階的に復旧した。',
    sourceUrls: [
      // Vistra（運営者）調査報告 2022-01-21。本事案の原因・損傷率の一次
      'https://investor.vistracorp.com/news?item=217',
      // Vistra 声明（2021-09-05 / 09-07 / 09-30）。発生当日〜1か月の一次
      'https://investor.vistracorp.com/news?item=197',
      // Vistra の当該サイト公式「Previous Incidents」。2021-09 / 2022-02 の位置づけと「火災ではない」旨
      'https://www.mosslandingresponse.com/previous-incidents',
      // ★旧 sourceUrl の cpuc.ca.gov .../energy-storage-incidents は HTTP 404（2026-09-27 実機・33,055 バイト・<title>Page not found</title>）
    ],
  },
  {
    id: 'moss-landing-2024',
    // Ck-1a ■1-5: 非表示（承認表 §0-4 src/data/incidents.ts:83 moss-landing-2024 行・同定できず）。
    // Ck-2 ■1 で一次により再確認（2026-09-27）。★作り直さないこと。
    //   ・Vistra 公式 https://www.mosslandingresponse.com/previous-incidents は自社サイトの事象を
    //     2021-09（Moss 300）と 2022-02（Moss 100）の2件のみとし、2024年の事象を一切掲げていない。
    //     同ページは「2022年に隣接する別会社の設備で火災があり、しばしば Vistra のものと誤解される」と明記。
    //   ・その別会社の事案＝PG&E Elkhorn BESS（182.5MW/730MWh・Tesla Megapack）の 2022-09-20 火災。
    //     Elkhorn は Vistra のサイトの Phase 3 ではなく、隣接する PG&E Moss Landing 変電所内の別設備。
    //     https://www.pge.com/en/newsroom/currents/safety/pg-e-shares-findings-of-september-2022-moss-landing-megapack-inc.html
    //   ・Vistra の実在する火災は 2025-01-16（Moss 300）。下の moss-landing-2025 として起票済み。
    //   ・引用の EPA 資料 .../2024-12/moss-landing-bess-fact-sheet.pdf は HTTP 404（2026-09-27 実機）。
    hidden: true,
    date: '2024-09-26',
    location: '米国カリフォルニア州 Moss Landing',
    region: 'us',
    facilityName: 'Moss Landing Energy Storage Facility',
    capacity_mwh: 750,
    severity: 'major',
    cause: 'thermal_runaway',
    summary: '2024/9/26 PG&E が運営する Phase 3 (LG Energy Solution セル) で大規模火災発生、近隣住民避難勧告。',
    lessons: 'リチウムイオン BESS の長時間燃焼特性、周辺地域への影響対策の重要性。',
    sourceUrls: [
      'https://www.epa.gov/system/files/documents/2024-12/moss-landing-bess-fact-sheet.pdf',
    ],
  },
  {
    // Ck-2 ■1（E-inc-18・裁定 R23）で新設。実在する重大事案が DB から欠落していた。
    //   2026-09-18 の再燃は独立レコードにせず lessons に織り込む（同一設備・撤去未了に由来する再着火のため）。
    //   ★countyofmonterey.gov はブラウザ以外の UA に 403 を返す（curl では 423 バイト）。
    //     deploy 後のリンク検査で偽の「死亡」判定が出うるので、検査側で例外に入れること。
    id: 'moss-landing-2025',
    date: '2025-01-16',
    location: '米国カリフォルニア州 Monterey County（Moss Landing）',
    region: 'us',
    facilityName: 'Vistra Moss Landing Energy Storage Facility — Moss 300（Phase I）',
    capacity_mwh: 1200,
    severity: 'major',
    // Vistra 自身が 2026-09 時点でも逐語「The cause of the January 16 battery fire remains unknown」と明言しているため
    // 'thermal_runaway' を当てない（一次を越える断定になる）。
    cause: 'unknown',
    summary:
      '2025年1月16日、Vistra の Moss Landing サイトにある 300MW の蓄電設備（Moss 300／Phase I）で電池火災が発生。社員が直ちに対応し North County Fire Protection District が出動、火災は Moss 300 の建屋内に留まり、他の蓄電設備およびガス火力には延焼しなかった。予防措置として周辺住民 約1,200人が24時間にわたり避難した。米国 EPA によれば当該 300MW 設備は約10万個のリチウムイオン電池を収容しており、うち約55%が火災で損傷した。原因は 2026年9月時点でも Vistra 自身が「不明」としており、調査が継続している。',
    lessons:
      '損傷した電池は撤去が完了するまで再着火しうる（2025年2月18日および2026年9月18日に再燃・後者は 1/3マイル圏に屋内退避指示）。避難は予防措置として行われ、EPA と Monterey Bay Air Resources District はいずれも健康リスクとなる大気環境を確認していない。EPA 監督下の電池撤去・処分には年単位の期間を要している。',
    sourceUrls: [
      // Vistra（運営者）公式の事故対応サイト。発生日時・避難規模・原因不明の継続を確認
      'https://www.mosslandingresponse.com/',
      // US EPA 対応ページ。設備規模・損傷率・EPA の役割・2026-09-18 の再燃
      'https://www.epa.gov/ca/moss-landing-vistra-battery-fire',
      // Monterey County（地元当局）。2025-02-18 の再燃と現地対応体制
      'https://www.countyofmonterey.gov/Home/Components/News/News/11188',
    ],
  },
  {
    id: 'liverpool-2020',
    // Ck-2 ■1（E-inc-08〜13・裁定 R23）: 出典が 404 だったため消防当局の一次へ差し替え、本文を逐語で書き直した。
    //   cause 'thermal_runaway' は維持（moss-landing-2021 と違い、消防の火災調査が明確に熱暴走を推定原因としている）。
    //   ★capacity_mwh は削除した。20 は MW（出力）であって MWh ではない（Ørsted のリリースは「The 20 megawatt (MW)
    //     battery … consists of three battery containers」。MFRS 報告書の全文に MWh の記載は 0 件）。
    date: '2020-09-15',
    location: '英国リバプール Old Swan（Carnegie Road）',
    region: 'eu',
    facilityName: 'Carnegie Road BESS',
    severity: 'moderate',
    cause: 'thermal_runaway',
    summary:
      '2020年9月15日 00:49、英国リバプール Old Swan の Carnegie Road にある Ørsted の BESS（20MW・NEC 製の電池コンテナ3基構成）で爆発を伴う火災が発生。爆風でコンテナの扉が約6m 飛ばされたが、延焼は3基のうち1基に留まった。防御的な消火活動は計59時間続き、9月17日 10:44 に鎮火（STOP）。消防の火災調査は推定原因を「リチウム電池の故障が熱暴走に移行したことによる失火」とし、電池から放出された可燃性ガスの着火による爆燃（deflagration）の痕跡を確認した。',
    lessons:
      '最大の教訓は、出動する消防隊が事前に持っていた現場のリスク情報（Site Specific Risk Information）が不十分だったこと。MFRS はこれを受けて、敷地内に安全情報ボックス（Gerda Box / SIB）を設け、建物図面・危険性・鍵管理者の緊急連絡先・避難計画・消火設備の情報を収める等の勧告をまとめ、英国の全国ガイダンスの土台となった。放水の流出水からはフッ化水素酸（HF）が検出され、環境保護の観点も課題となった。',
    sourceUrls: [
      // Merseyside Fire & Rescue Service（対応した消防当局）自身の公表 2024-02-06
      'https://www.merseyfire.gov.uk/media-centre/news-press/latest-news/battery-energy-storage-site-enhances-safety-in-response-to-recommendations-from-mfrs/',
      // MFRS Significant Incident Report v1.2（2021-12）本体。★ホストは第三者（Cherwell District Council の
      //   planning register）で、MFRS 自身のサイトではない。文書の発行元は MFRS。
      'https://planningregister.cherwell.gov.uk/Document/Download?module=PLA&recordNumber=154109&planId=1951104&imageId=30&isPlan=False&fileName=Appendix+2++-+Liverpool+BESS+Significant+Investigation+Report+(1).pdf',
      // Ørsted（事業者）press release 2018-12-24。設備諸元（20MW・NEC 製コンテナ3基）の一次
      'https://orsted.co.uk/media/newsroom/news/2018/12/orsteds-first-standalone-battery-storage-project-now-complete',
      // ★旧 sourceUrl の gov.uk .../health-and-safety-of-grid-scale-electrical-energy-storage-systems は
      //   HTTP 404（2026-09-27 実機・52,491 バイト・<title>Page not found - GOV.UK</title>）
    ],
  },
  {
    id: 'kahuku-2022',
    date: '2022-08-03',
    location: '米国ハワイ州 Kahuku',
    region: 'us',
    facilityName: 'Kahuku Wind / BESS',
    capacity_mwh: 15,
    severity: 'major',
    cause: 'thermal_runaway',
    summary: '風力発電併設 BESS で 2022/8 に火災発生、複数日延焼、近隣道路通行止め。',
    lessons: '再エネ併設 BESS の協調制御と防火対策。',
    sourceUrls: [
      'https://www.hawaiianelectric.com/about-us/newsroom', // Ck-1 A3: 旧 press-releases は 404。現行のニュースリリース一覧（title「Newsroom | Hawaiian Electric」）
    ],
  },
  {
    id: 'korea-multi-2017-2019',
    date: '2018-12',
    location: '韓国 (複数箇所)',
    region: 'kr',
    facilityName: '韓国国内 BESS (23件以上、2017-2019)',
    severity: 'major',
    cause: 'cell_defect',
    summary: '2017-2019 にかけて韓国国内で 23 件以上の BESS 火災が連続発生。政府調査で複数原因 (絶縁性能、保護システム、運用環境、統合管理) を特定。',
    lessons: '急速な導入と品質管理のバランス。韓国政府の調査報告は国際的に参照されている。',
    sourceUrls: [
      'https://www.motir.go.kr/kor/article/ATCL3f49a5a8c/161771/view', // Ck-1 A3: 旧英語版 URL は 404。同じ発表（2019-06-11「ESS 사고원인 조사결과 및 안전강화 대책 발표」・産業通商部）
    ],
  },
  {
    id: 'beijing-2021',
    date: '2021-04-16',
    location: '中国北京市豊台区',
    region: 'cn',
    facilityName: 'Dahongmen ESS (大紅門)',
    capacity_mwh: 25,
    severity: 'major',
    cause: 'thermal_runaway',
    summary: '北京の商業ビル併設 BESS で 2021/4 に爆発、消防士 2 名殉職、1 名負傷。',
    lessons: '中国国内では本事故を契機に BESS 安全基準 (GB/T) の整備が進む。',
    sourceUrls: [
      'https://www.cnesa.org/information/detail/?column_id=58&id=376', // Ck-1 A3: 旧 URL は soft-404。CNESA の同事故の記事（2021-04-24「沉痛悼念丰台储能电站火灾事故中牺牲的消防员！」）
    ],
  },
  {
    id: 'victoria-2021',
    date: '2021-07-30',
    location: '豪州ビクトリア州',
    region: 'au',
    facilityName: 'Victorian Big Battery (Geelong)',
    capacity_mwh: 450,
    severity: 'moderate',
    cause: 'electrical',
    summary: 'コミッショニング中の Tesla Megapack 1台で 2021/7 火災発生、隣接ユニットへ拡大。3日間延焼後鎮火。',
    lessons: '冷却液漏洩 + 電気アークによる発火。Tesla の試運転手順改善のきっかけ。',
    sourceUrls: [
      'https://www.energysafe.vic.gov.au/sites/default/files/2022-12/VBB_StatementOfFindings_FINAL_28Sep2021.pdf', // Ck-1 A3: 旧ページは 404。Energy Safe Victoria の同火災の調査結果（Statement of Technical Findings）
    ],
  },
  {
    id: 'arizona-mcmicken-2019',
    date: '2019-04-19',
    location: '米国アリゾナ州',
    region: 'us',
    facilityName: 'APS McMicken BESS',
    capacity_mwh: 2,
    severity: 'major',
    cause: 'thermal_runaway',
    summary: 'APS (Arizona Public Service) 運営の 2MWh BESS で 2019/4 に熱暴走、消防士 4 名が爆発で負傷。',
    lessons: '小規模 BESS でも熱暴走の連鎖と消火活動時の爆発リスク。米国 NFPA 855 制定の契機の一つ。',
    sourceUrls: [
      'https://www.aps.com/-/media/APS/APSCOM-PDFs/About/Our-Company/Newsroom/McMickenFinalTechnicalReport.pdf',
    ],
  },
  {
    id: 'japan-undisclosed-policy',
    // Ck-2 ■1（E-inc-14/15・裁定 R23）: 非表示。事故レコードの形をしているが特定の出来事が無い
    //   （facilityName が「(個別非公表)」＝定義上、同定できる事象が存在しない）。
    //   date '2023-06' の根拠となる一次が無く、summary の「2025年時点で限定的」「低圧産業用で複数報告」も
    //   裏づける一次を取得できなかった（R8）。DELETE はせず hidden で /incidents から外す（moss-landing-2024 と同じ扱い）。
    //   ★下の sourceUrls の fdma.go.jp/mission/prevention/suisin/items/secondary_batteries.html は
    //     HTTP 404（2026-09-27 実機・17,848 バイト・<title>404 Not Found | 総務省消防庁</title>）。
    //     復活・移設するときは、生存を確認した次の FDMA 一次を使う（ただし本レコードの主張は支えない）:
    //       https://www.fdma.go.jp/singi_kento/kento/post-116.html（蓄電池設備のリスクに応じた防火安全対策検討部会）
    //       https://www.fdma.go.jp/singi_kento/kento/items/post-116/03/houkokusho.pdf（同 報告書・令和５年３月）
    //       https://www.fdma.go.jp/singi_kento/kento/post-106.html（リチウムイオン蓄電池に係る火災予防上の安全対策に関する検討会）
    //     内容は事故ではなく制度解説なので、/incidents ではなく explainer 側に置くのが筋（実行便②以降で検討）。
    hidden: true,
    date: '2023-06',
    location: '日本国内',
    region: 'japan',
    facilityName: '(個別非公表) 国内 系統用蓄電池 検証ケース',
    severity: 'minor',
    cause: 'unknown',
    summary: '経産省・消防庁・NEDO 等で系統用蓄電池の安全性検証が継続中。個別重大事故事例は2025年時点で限定的だが、低圧産業用での発火・煙発生事例は複数報告。',
    lessons: '国内の事例蓄積は始まったばかり。海外事例を参考にした標準化が進行中。',
    sourceUrls: [
      'https://www.fdma.go.jp/mission/prevention/suisin/items/secondary_batteries.html',
    ],
  },
  {
    id: 'lithium-cell-defect-2018',
    date: '2018-10',
    location: '韓国 / 米国 等',
    region: 'kr',
    facilityName: '複数施設 (セル製造段階の不良由来)',
    severity: 'moderate',
    cause: 'cell_defect',
    summary: 'LG Chem (現 LG Energy Solution) 製セルの一部に絶縁不良が確認され、複数の蓄電所で発火リスクが指摘。2020年に大規模リコール。',
    lessons: 'セル製造品質と現場での発火リスクの直接的な関係。サプライチェーン透明性の重要性。',
    sourceUrls: [
      'https://www.lgensol.com/en/company/newsroom', // Ck-1 A3: 旧 news-list は 404。現行の Newsroom（title「Newsroom｜LG Energy Solution」）
    ],
  },
];

/** 表示に使う事例（hidden を除く）。件数・一覧・JSON-LD はすべてこれを数える（#121: 同じ意味の値を二箇所で出さない） */
export const VISIBLE_INCIDENTS: Incident[] = INCIDENTS.filter((i) => !i.hidden);

