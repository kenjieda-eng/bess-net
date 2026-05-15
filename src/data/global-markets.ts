/**
 * 海外5市場 (米国/EU/中国/インド/豪州) 蓄電池市場データ
 *
 * 注: 編集部が公開情報 (IEA / BloombergNEF / 各国政府発表) に基づき作成。
 *     2025-2026 時点の概況。最新は各種一次情報を参照。
 */

export type CountryKey = 'us' | 'eu' | 'cn' | 'in' | 'au';

export interface CountryMarket {
  key: CountryKey;
  name: string; // 日本語名
  nameEn: string;
  flag: string; // 絵文字
  marketSizeGWh2025: number; // 2025 累積導入量 (GWh)
  marketSizeGWh2030: number; // 2030 予測
  cagr: string; // 年率
  topPolicies: string[]; // 主要政策 3件
  keyPlayers: string[]; // 主要プレイヤー 5-10件
  priceTrend: string; // 価格動向
  japanComparison: string; // 日本市場との比較
  notes: string;
  // メタ
  overview: string; // 200字程度
  highlights: string[]; // 3-5 件、箇条書き
}

export const GLOBAL_MARKETS: Record<CountryKey, CountryMarket> = {
  us: {
    key: 'us',
    name: '米国',
    nameEn: 'United States',
    flag: '🇺🇸',
    marketSizeGWh2025: 80,
    marketSizeGWh2030: 350,
    cagr: '約35%',
    topPolicies: [
      'IRA (インフレ抑制法) — ITC 30%+ 国産加点でBESS導入加速',
      'FERC Order 841/2222 — 蓄電池・分散リソースの市場参加義務',
      'カリフォルニア SB-100 — 2045年再エネ100%、蓄電池が必須',
    ],
    keyPlayers: [
      'Tesla (Megapack、大型BESS最大手)',
      'Fluence (Siemens × AES、世界 No.1 級)',
      'Wärtsilä (フィンランド系、米国展開大)',
      'Powin (米国系、大型案件多)',
      'LG Energy Solution (韓国、米国工場展開)',
      'CATL (中国、米国市場も)',
      'NextEra Energy (デベロッパー最大)',
      'AES Clean Energy',
    ],
    priceTrend: 'IRA 効果で 2024 から国産 BESS 価格 +20% 前後 (中国製比)。ただし ITC 補助で実質コスト低下。',
    japanComparison: '導入量は日本の約20倍、案件規模も平均5-10倍。FERC Order 841 で蓄電池の市場参入義務 → 日本の容量市場/需給調整市場議論の先行モデル。',
    notes: '世界最大の BESS 市場。カリフォルニア・テキサスが2大ハブ。',
    overview: '米国は世界最大の BESS 市場で、IRA (2022) + FERC Order 841/2222 で蓄電池導入が加速。カリフォルニア・テキサスを中心に大型案件 (100MW+) が標準化、2025年累積80GWh規模。Tesla / Fluence / Powin の3強構造に CATL/LG が食い込む構図。',
    highlights: [
      'IRA ITC 30% + 国産加点で実質コスト大幅低下',
      'FERC Order 841/2222 — 蓄電池が DSO 市場へ参入義務化',
      'CAISO / ERCOT で大型 BESS が周波数調整・容量を担う',
      '2030 まで CAGR 35% 予測、累積 350GWh 超',
    ],
  },
  eu: {
    key: 'eu',
    name: 'EU',
    nameEn: 'European Union',
    flag: '🇪🇺',
    marketSizeGWh2025: 25,
    marketSizeGWh2030: 180,
    cagr: '約45%',
    topPolicies: [
      'REPowerEU — 2030 再エネ45%、蓄電池はキー技術',
      'Net Zero Industry Act — EU 域内 BESS 製造40%目標',
      'ドイツ Innovationsausschreibung — 蓄電池+再エネ複合入札',
    ],
    keyPlayers: [
      'Wärtsilä (フィンランド、ヨーロッパ最大級)',
      'Siemens Energy (BESS + Power-to-X)',
      'Saft (TotalEnergies傘下、フランス)',
      'Fluence (ドイツ拠点で欧州展開)',
      'Nofar Energy (イスラエル、欧州案件多)',
      'CATL Hungary (中国系、欧州製造拠点)',
      'BYD (中国系、欧州市場参入)',
      'Engie (フランス、デベロッパー)',
    ],
    priceTrend: '電力危機後の高ボラ + 容量市場立ち上げで BESS 経済性向上。中国製比でEU製 +25%。',
    japanComparison: '導入量は日本の約7倍。電力市場の統合 (域内取引) で日本より価格ボラ大、アービトラージ収益機会も大きい。',
    notes: 'ドイツ・英国・イタリア・スペインが4大市場。容量市場+周波数調整サービスの組合せが主流。',
    overview: 'EU は REPowerEU + Net Zero Industry Act で BESS を脱炭素のキー技術と位置付け。ドイツ・英国・イタリア・スペインを中心に2025年累積25GWh、2030には180GWh規模へ。電力危機後の高ボラ + 容量市場立ち上げが BESS 経済性を押し上げる。',
    highlights: [
      'REPowerEU で 2030 再エネ 45%、蓄電池が必須技術',
      'Net Zero Industry Act — 域内製造 40% 目標',
      '英国 Capacity Market + 周波数調整サービスが BESS 主収益源',
      'ドイツ Innovationsausschreibung — 蓄電池+再エネ複合入札',
    ],
  },
  cn: {
    key: 'cn',
    name: '中国',
    nameEn: 'China',
    flag: '🇨🇳',
    marketSizeGWh2025: 200,
    marketSizeGWh2030: 800,
    cagr: '約30%',
    topPolicies: [
      '国家エネルギー局「新型エネルギー貯蔵 14次5カ年計画」 — 30GW 以上',
      '省別「再エネ + 蓄電池抱き合わせ」要件 — 10-20% 義務',
      '電力市場改革 — 補助スポット市場/容量市場の整備',
    ],
    keyPlayers: [
      'CATL (寧徳時代、世界最大セルメーカー)',
      'BYD (世界 No.2、自社EPC + システム)',
      'EVE Energy (セル + システム)',
      'Sungrow (PCS最大級 + システム)',
      'Hithium (海辰、新興セル)',
      'Trina Solar (太陽光最大手、蓄電池参入)',
      'JinkoSolar (蓄電池参入)',
      'HiNa Battery (ナトリウムイオン)',
    ],
    priceTrend: 'セル価格は kWh あたり 50-70 USD レベル、世界最安。BESS システム価格は 90-120 USD/kWh。',
    japanComparison: '導入量は日本の約50倍、価格は約半分。日本にも CATL/BYD/EVE が大量供給、国内メーカー (GS Yuasa等) はニッチ。',
    notes: '世界最大の BESS 生産国 + 導入国。セル/PCS/システムすべての供給を支配。',
    overview: '中国は世界最大の BESS 生産国・導入国。14次5カ年計画で2025年累積200GWh規模、2030には800GWhへ。CATL/BYD/EVE などセルメーカーが世界供給を支配、日本市場でも標準。',
    highlights: [
      '世界の BESS セル供給の 70% 以上',
      '「再エネ + 蓄電池」抱き合わせで省単位 10-20% 義務',
      'セル価格 50-70 USD/kWh で世界最安',
      'ナトリウムイオン (HiNa 等) の量産も世界先行',
    ],
  },
  in: {
    key: 'in',
    name: 'インド',
    nameEn: 'India',
    flag: '🇮🇳',
    marketSizeGWh2025: 5,
    marketSizeGWh2030: 50,
    cagr: '約60%',
    topPolicies: [
      'PLI (Production Linked Incentive) — BESS 製造補助 1810億ルピー',
      'NEP (National Electricity Plan) — 2030 BESS 47GW',
      'SECI 入札 — 太陽光+BESS 複合入札標準化',
    ],
    keyPlayers: [
      'Reliance Industries (Reliance New Energy、大型投資)',
      'Adani Group (Adani Green、垂直統合)',
      'Tata Power (再エネ + BESS)',
      'JSW Energy',
      'ReNew Power (NASDAQ上場再エネ)',
      'Greenko (再エネ + 揚水)',
      'Exide Industries (セル、PLI 受給)',
      'Amara Raja (セル、PLI 受給)',
    ],
    priceTrend: 'SECI 入札で BESS 単独 (Standalone) 価格は 2.5-3.5 ルピー/kWh で安定。',
    japanComparison: '導入量は日本の1/3だが伸び率は世界最大級。インド市場はSECI主導の入札型で日本と構造異なる。',
    notes: 'PLI 補助 + SECI 入札主導で急成長中。揚水との併用も顕著。',
    overview: 'インドは PLI 補助 + SECI 入札主導で急成長中。2025累積5GWh、2030には50GWhへ (CAGR 60%)。Reliance / Adani / Tata の3大財閥が垂直統合で参入、Standalone BESS 入札と太陽光+BESS 複合入札が主流。',
    highlights: [
      'PLI 1810億ルピーで国内 BESS 製造を加速',
      'NEP — 2030 BESS 47GW 目標',
      'SECI 入札で Standalone BESS が市場形成',
      'Reliance/Adani/Tata の財閥型統合が特徴',
    ],
  },
  au: {
    key: 'au',
    name: '豪州',
    nameEn: 'Australia',
    flag: '🇦🇺',
    marketSizeGWh2025: 15,
    marketSizeGWh2030: 60,
    cagr: '約30%',
    topPolicies: [
      'Capacity Investment Scheme (CIS) — 32GW再エネ+蓄電池、2030年まで',
      'Hornsdale 等の大型 BESS パイロット政府支援',
      'NEM (National Electricity Market) — FCAS 市場で BESS 高収益',
    ],
    keyPlayers: [
      'Tesla (Hornsdale 等で先駆け)',
      'Neoen (フランス系デベロッパー、Hornsdale所有)',
      'AGL Energy (発電大手、BESS 大量投資)',
      'Origin Energy (Eraring石炭跡地に Australia最大BESS)',
      'EnergyAustralia',
      'CWP Renewables',
      'Akaysha Energy (BlackRock 系)',
      'Genex Power (揚水+太陽光+BESS)',
    ],
    priceTrend: 'FCAS 市場で世界トップ級の収益。BESS システム価格は 250-300 AUD/kWh。',
    japanComparison: '導入量は日本の約4倍。FCAS で BESS 高収益、日本の需給調整市場 (三次調整力等) の先行モデル。',
    notes: 'Hornsdale で世界初の大型 BESS 商業化を実証、現在は世界 BESS の実証実験場。',
    overview: '豪州は Hornsdale 等で世界初の大型 BESS 商業化を実証、現在も世界の BESS 実証実験場。2025累積15GWh、2030には60GWhへ。CIS で2030まで32GW再エネ+蓄電池目標、FCAS 市場で BESS 高収益。',
    highlights: [
      'Hornsdale で世界初の大型 BESS 商業化',
      'CIS — 32GW 再エネ+蓄電池目標',
      'NEM の FCAS 市場で BESS が世界トップ級収益',
      'AGL / Origin 等の発電大手が石炭跡地で BESS 大規模建設',
    ],
  },
};

export const COUNTRY_ORDER: CountryKey[] = ['us', 'eu', 'cn', 'in', 'au'];
