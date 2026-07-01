/**
 * 海外5市場 (米国/EU/中国/インド/豪州) 蓄電池市場データ
 *
 * 注: 編集部が公開情報 (IEA / BloombergNEF / SolarPower Europe / 各国政府発表) に基づき作成。
 *     2026年上半期 (H1) 時点。最新は各種一次情報を参照。
 *     半期更新: 2026-06-30 (出典一覧は docs/02_計画・運営/半期更新レポート_海外5市場＋FAQ_2026-06-30.md)
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
      'ITC 48E (蓄電池) — 2033年着工分まで30%+控除を存続 (OBBBA 2025で太陽光/風力より優遇温存)',
      'FEOC/PFE規制 — 2026年着工分はMACR (資材コスト比率) 55%以上が要件、中国系部材を制限 (財務省Notice 2026-15, 2026/2/12)',
      'FERC Order 841/2222 — 蓄電池・分散リソースの市場参加義務 (継続)',
    ],
    keyPlayers: [
      'Tesla (Megapack、大型BESS最大手)',
      'Fluence (Siemens × AES、世界 No.1 級)',
      'Wärtsilä (フィンランド系、米国展開大)',
      'Powin (米国系、大型案件多)',
      'LG Energy Solution (韓国、米国工場展開)',
      'CATL (中国、FEOC規制で米国向け供給に制約)',
      'NextEra Energy (デベロッパー最大)',
      'AES Clean Energy',
    ],
    priceTrend: 'FEOC規制で中国製セル調達が制限され、2026年は国産・非中国系セルへの切替が進む。ITC控除で実質コストは依然低位だが、サプライチェーン分断で価格に上昇圧力。',
    japanComparison: '導入量は日本の約20倍、案件規模も平均5-10倍。FERC Order 841 で蓄電池の市場参入義務 → 日本の容量市場/需給調整市場議論の先行モデル。FEOC規制は日本企業 (GSユアサ等) ・非中国系セルにとって米国参入の追い風になり得る。',
    notes: '世界最大の BESS 市場。カリフォルニア・テキサスが2大ハブ、ミシガン・ジョージア等の垂直統合電力会社圏も拡大。2026年の最大テーマは FEOC 対応の供給網再編。出典: SEIA Energy Storage Market Outlook Q1 2026 / 財務省・IRS Notice 2026-15 (FEOC) / EIA。(2026-06-30 半期更新)',
    overview: '米国は世界最大の BESS 市場。2026年Q1に四半期過去最高の3.3GW/8.4GWh を導入 (前年同期比+32%、SEIA)。2025年成立の OBBBA (One Big Beautiful Bill Act) で蓄電池ITC (48E) は2033年着工分まで存続する一方、FEOC (懸念外国主体) 規制が2026年から本格適用され、中国製セル依存の供給網見直しが最大論点。テキサス・カリフォルニア・アリゾナが主力。',
    highlights: [
      '2026年Q1に過去最高3.3GW/8.4GWh導入 (前年比+32%、SEIA Q1 2026 Outlook)',
      'OBBBA (2025) で蓄電池ITCは2033年着工分まで存続、太陽光/風力の早期逓減と対照的',
      'FEOC/PFE規制が2026年適用、MACR 55% (2026) →2030年75%へ、中国製依存を段階排除',
      'テキサス・カリフォルニア・アリゾナが主力、ミシガン・ジョージアの新市場も拡大',
      '累積見通しは2030年に600GWh超 (SEIA/Benchmark)',
    ],
  },
  eu: {
    key: 'eu',
    name: 'EU',
    nameEn: 'European Union',
    flag: '🇪🇺',
    marketSizeGWh2025: 100,
    marketSizeGWh2030: 470,
    cagr: '約37%',
    topPolicies: [
      'イタリア MACSE (Terna) — 蓄電容量を15年契約で調達。初回10GWh約定 (2025/10)、第2回16GWhを2026/11/24実施',
      'REPowerEU / Net Zero Industry Act — 域内BESS製造40%目標 (継続)',
      'ドイツ 系統利用料・接続規制改革 — 2026年が大型蓄電池の「正念場」',
    ],
    keyPlayers: [
      'Wärtsilä (フィンランド、ヨーロッパ最大級)',
      'Siemens Energy (BESS + Power-to-X)',
      'Saft (TotalEnergies傘下、フランス)',
      'Fluence (ドイツ拠点で欧州展開)',
      'CATL Hungary (中国系、欧州製造拠点)',
      'BYD (中国系、欧州市場参入)',
      'Engie (フランス、デベロッパー)',
      'Enel / Terna圏 (イタリア MACSE 主導)',
    ],
    priceTrend: '電力市場の高ボラ + 容量報酬 (英Capacity Market・伊MACSE) でBESS経済性が向上。アービトラージ + 容量市場の二層収益が主流化。中国製比でEU製 +20-25%。',
    japanComparison: '累積稼働は日本の約25倍。電力市場の統合 (域内取引) で日本より価格ボラ大、アービトラージ収益機会も大きい。イタリアMACSEの容量報酬型モデルは、日本の容量市場/長期脱炭素オークションと比較可能な先行事例。',
    notes: 'ドイツ・英国・イタリア・スペインが4大市場。2026年の目玉はイタリアMACSEの容量報酬型モデル始動。出典: SolarPower Europe European Battery Market Outlook 2026-2030 / Terna (MACSE) / S&P Global。(2026-06-30 半期更新)',
    overview: 'EUは2025年に欧州全体で過去最高36GWh を導入 (前年比+48%)、累積稼働容量が初めて100GWh超に到達 (SolarPower Europe)。イタリアがTerna運営のMACSE (蓄電容量調達メカニズム) 初回入札で10GWh/15年契約を約定し、容量報酬型モデルが本格始動。英国は2026年末までに系統用約10GW、ドイツは5GW/10.4GWhが開発中。',
    highlights: [
      '2025年に欧州全体で過去最高36GWh導入 (+48%)、稼働容量が初の100GWh超 (SolarPower Europe)',
      'イタリアMACSE初回入札10GWh約定 (15年契約・2028年運開)、加重平均€12,959/MWh/年',
      '英国は2026年末までに系統用 (FoM) 約10GW (S&P Global)',
      'ドイツ 系統用2.4GW/3.2GWh稼働、5GW/10.4GWhが開発中 (2026年規制改革が焦点)',
      'EU-27の蓄電池フリートは2030年に約470GWhへ (SolarPower Europe)',
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
      '136号文 (NDRC/NEA, 2025/2) — 再エネへの蓄電池強制配置 (強制配儲) を撤廃、市場ベース取引へ (2025/6/1以降の新規)',
      '容量価格メカニズム (2026/2) — 系統用蓄電池の容量報酬を石炭基準価格に連動',
      '新型エネルギー貯蔵 三年行動計画 (NEA) — 2030年370GW超目標',
    ],
    keyPlayers: [
      'CATL (寧徳時代、世界最大セルメーカー)',
      'BYD (世界 No.2、自社EPC + システム)',
      'EVE Energy (セル + システム、急成長)',
      'Sungrow (PCS最大級 + システム)',
      'Hithium (海辰、新興セル急伸)',
      'Trina Solar (太陽光最大手、蓄電池参入)',
      'JinkoSolar (蓄電池参入)',
      'HiNa Battery (ナトリウムイオン)',
    ],
    priceTrend: 'セル価格は依然世界最安 (kWhあたり~50-70 USD)。強制配置撤廃で粗悪な抱き合わせ案件が淘汰され、市場型収益 (容量価格・スポット裁定) で採算が取れる案件へ選別が進む。',
    japanComparison: '導入量は日本の約50倍、価格は約半分。日本にも CATL/BYD/EVE が大量供給、国内メーカー (GS Yuasa等) はニッチ。強制配置撤廃で「量から質」への移行が、世界のセル価格・供給に波及。',
    notes: '世界最大の BESS 生産国 + 導入国。2026年の最大テーマは強制配置撤廃後の市場型移行。出典: NEA / CNESA / Carbon Brief (136号文) / S&P Global / ess-news (容量価格)。(2026-06-30 半期更新)',
    overview: '中国は2025年末に新型エネルギー貯蔵の累積導入が136GW (前年比+84%) に到達 (NEA)。2025年2月の「136号文」で再エネへの蓄電池強制配置 (強制配儲) が撤廃され市場ベース取引へ移行、短期は新規が一服 (S&P Global: 2026年44GW/116GWh、前年予測比-36%) する一方、2026年2月に系統用蓄電池の容量価格 (石炭基準連動) が導入され収益モデルが市場型へ転換中。2030年に370GW超見通し。',
    highlights: [
      '2025年末に新型蓄電 累積136GW (+84% YoY、NEA)',
      '136号文で再エネへの蓄電池強制配置を撤廃、市場ベース取引へ (2025/2)',
      '2026年2月に容量価格メカニズム導入 (石炭基準連動) で収益が市場型へ',
      '2026年は新規が一服見通し (44GW/116GWh、S&P Global) も、2030年370GW超',
      'セル/PCS/システム供給を支配、ナトリウムイオン量産も世界先行',
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
      'VGFスキーム拡大 (内閣承認 2026/5/14) — 5,400億ルピーで30GWh、第1弾の8倍規模',
      'PLI (生産連動補助) — 国内セル製造を支援 (継続)',
      'SECI/NTPC入札 — Standalone BESS + 太陽光+BESS複合入札が標準化',
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
    priceTrend: 'VGF入札タリフは2024年2.26→2025年1.48 lakhルピー/MW/月 (-35% YoY)。資本補助 + 入札競争で世界最安水準の貯蔵コストへ。',
    japanComparison: '導入量は日本の約1倍前後だが伸び率は世界最大級 (CAGR ~60%)。SECI/NTPC主導の入札 + VGF型で、日本の市場 (容量市場・需給調整市場) とは制度構造が大きく異なる。',
    notes: 'PLI + VGF + SECI入札主導で世界最速級の成長。2026年の目玉はVGFの8倍拡大。出典: 印政府/内閣 (VGF) / SECI / IEEFA / JMK Research / ess-news。(2026-06-30 半期更新)',
    overview: 'インドは2025年に130GWh超のBESS入札が出た後、2026年に約9.2GWhが運開予定 (Saur Energy)。2026年5月14日に内閣がVGF (Viability Gap Funding) を5,400億ルピー・30GWh規模へ8倍拡大承認し、SECI/NTPC主導の入札が加速。VGF入札タリフは2024年2.26→2025年1.48 lakhルピー/MW/月へ約35%下落とコスト競争が激化。Reliance/Adani/Tata の3大財閥が垂直統合で牽引。',
    highlights: [
      '内閣がVGFを30GWh・5,400億ルピーへ拡大承認 (2026/5/14)、第1弾の8倍',
      '2025年に130GWh超を入札、2026年に約9.2GWh運開見込み',
      'VGF入札タリフ -35% YoY (2024→2025) でコスト競争激化',
      'VGF支援は累計43.2GWh・約910億ルピー ($1.09B) 規模',
      'Reliance/Adani/Tataの財閥型垂直統合が牽引',
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
      'CIS (容量投資スキーム) — 第8回入札で4.2GW/15件約定 (2026/6/24)、技術中立入札に76GW応札・2029年末運開',
      'AEMO 2026 ISP — 2050年までに蓄電40GW (短中時間35GW + 長時間5GW)',
      'NEM/FCAS市場 — BESSが周波数調整で世界トップ級収益 (継続)',
    ],
    keyPlayers: [
      'Tesla (Hornsdale 等で先駆け)',
      'Neoen (フランス系デベロッパー、Hornsdale所有)',
      'AGL Energy / Origin Energy (発電大手、石炭跡地でBESS大規模建設)',
      'Akaysha Energy (BlackRock系、CIS第8回落札)',
      'Eku Energy (CIS第8回落札)',
      'Edify Energy (CIS第8回落札)',
      'Ampyr Energy / Potentia Energy (CIS第8回落札)',
      'Genex Power (揚水+太陽光+BESS)',
    ],
    priceTrend: 'FCAS市場で世界トップ級収益 (継続)。CIS第8回で約AU$60億の民間投資を誘発、入札競争 (76GW応札/4.2GW約定) でコスト規律が強まる。BESSシステム価格は 250-300 AUD/kWh。',
    japanComparison: '導入量は日本の約4倍。FCAS で BESS 高収益、日本の需給調整市場 (三次調整力等) の先行モデル。CIS の容量投資型支援は、日本の長期脱炭素オークションと比較可能。',
    notes: '世界のBESS実証実験場。2026年の目玉はCIS第8回 (4.2GW) とAEMO 2026 ISP。出典: 豪政府DCCEEW/CIS / AEMO 2026 ISP / Energy-Storage.News。(2026-06-30 半期更新)',
    overview: '豪州は2026年6月24日にCIS (容量投資スキーム) 第8回入札で4.2GW・15件のリチウムイオンBESSを約定 (応札76GW、2029年末までに運開)。同日AEMOが2026年版ISP (統合系統計画) を公表し、2050年までに蓄電40GW (短中時間35GW + 長時間5GW) を提示。系統接続中の67GWのうち45GWが蓄電池で、投資パイプラインの46%を占める。FCAS市場で世界トップ級収益。',
    highlights: [
      'CIS第8回入札で4.2GW/15件のBESS約定 (2026/6/24)、応札76GW・2029年末運開',
      'AEMO 2026 ISPで2050年までに蓄電40GW (短中35GW + 長時間5GW) を提示',
      '系統接続パイプライン67GW中45GWが蓄電池、投資パイプラインの46%',
      'Akaysha/Eku/Edify/Ampyr/Potentia等が落札、約AU$60億の民間投資',
      'NEMのFCAS市場でBESSが世界トップ級収益、Hornsdaleの実証から商用化が定着',
    ],
  },
};

export const COUNTRY_ORDER: CountryKey[] = ['us', 'eu', 'cn', 'in', 'au'];
