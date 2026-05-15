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

// シード 10件 (公開情報のみ)
export const INCIDENTS: Incident[] = [
  {
    id: 'moss-landing-2021',
    date: '2021-09-04',
    location: '米国カリフォルニア州 Moss Landing',
    region: 'us',
    facilityName: 'Moss Landing Energy Storage Facility (Phase 1)',
    capacity_mwh: 1200,
    severity: 'major',
    cause: 'thermal_runaway',
    summary: 'Moss Landing 蓄電所 (Vistra 運営、Tesla Megapack) で 2021/9 に熱暴走発生、施設の一部停止。以後 2022/2、2024/9 にも同施設で続発。',
    lessons: '大型 BESS の単一サイト集約リスク。スプリンクラー作動による派生被害も議論。',
    sourceUrls: [
      'https://www.cpuc.ca.gov/industries-and-topics/electrical-energy/electric-power-procurement/energy-storage-incidents',
    ],
  },
  {
    id: 'moss-landing-2024',
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
    id: 'liverpool-2020',
    date: '2020-09-15',
    location: '英国リバプール',
    region: 'eu',
    facilityName: 'Carnegie Road BESS',
    capacity_mwh: 20,
    severity: 'moderate',
    cause: 'thermal_runaway',
    summary: 'Liverpool 近郊の 20MW BESS で 2020/9 に火災発生、約2日間延焼。',
    lessons: '近隣住宅地への BESS 設置リスク評価の重要性。',
    sourceUrls: [
      'https://www.gov.uk/government/publications/health-and-safety-of-grid-scale-electrical-energy-storage-systems',
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
      'https://www.hawaiianelectric.com/about-us/news-and-events/press-releases',
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
      'https://english.motie.go.kr/en/pc/pressreleases/bbs/bbsView.do?bbs_seq_n=572',
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
      'https://www.cnesa.org/index.php?m=content&c=index&a=show&catid=7&id=290',
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
      'https://www.energysafe.vic.gov.au/news-and-publications/news-and-resources/victorian-big-battery-fire',
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
      'https://www.lgensol.com/en/business-newsroom/news-list?utm=press',
    ],
  },
];
