/**
 * src/data/industry-map.ts
 *
 * 業界カオスマップ データ (依頼AP)
 *
 * 構成:
 *   - 11 カテゴリ × 代表事業者 (operators 544 社からの典型例)
 *   - 関係データ 30+ 件 (出資/提携/EPC/オフテイク等)
 *
 * 注: 完全網羅ではなく主要プレイヤーを抽出した「業界構造可視化」用。
 *     実完全リストは /operators (544 社、microCMS) を参照。
 */

export type CategoryKey =
  | 'developer'        // BESS デベロッパー (事業主)
  | 'epc'              // EPC
  | 'om'               // O&M / 保守
  | 'cell'             // セル/モジュールメーカー
  | 'system'           // BESS システム統合 (Container 完成品)
  | 'pcs'              // PCS / インバータ
  | 'ems'              // EMS / アグリゲーター
  | 'utility'          // 電力会社 / 送配電
  | 'finance'          // 金融機関 / PF
  | 'land'             // 土地・不動産
  | 'consulting';      // コンサル / 法務 / 監査

export interface Player {
  id: string;
  name: string;
  category: CategoryKey;
  /** 主要拠点・原産国 */
  origin: 'JP' | 'CN' | 'KR' | 'US' | 'EU' | 'TW' | 'OTHER';
  /** 上場 / 非上場 */
  listed: boolean;
  /** 業界活動度 (1-5、5 が最も活発) */
  activity: number;
  /** operators DB slug (/operators/ への link、ない場合 null) */
  operator_slug?: string;
  /** subsidies DB slug (/subsidies/ への link、金融機関の補助金プログラム等) */
  subsidy_slug?: string;
  /** 外部 URL (公式サイト等、operator/subsidy ページが無い場合のフォールバック) */
  external_url?: string;
  /** メモ (主要事業や差別化要素) */
  note?: string;
}

export interface Relation {
  /** Player.id */
  from: string;
  to: string;
  /** 関係タイプ */
  type:
    | 'equity'         // 出資・資本関係
    | 'epc_contract'   // EPC 契約
    | 'cell_supply'    // セル/モジュール 供給
    | 'pcs_supply'     // PCS 供給
    | 'om_contract'    // O&M 契約
    | 'offtake'        // オフテイク / 売電
    | 'jv'             // ジョイントベンチャー
    | 'partner';       // 戦略パートナー
  /** 補足 */
  note?: string;
}

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  developer: 'BESS デベロッパー',
  epc: 'EPC',
  om: 'O&M / 保守',
  cell: 'セル / モジュール',
  system: 'BESS システム統合',
  pcs: 'PCS / インバータ',
  ems: 'EMS / アグリゲーター',
  utility: '電力会社 / 送配電',
  finance: '金融機関 / PF',
  land: '土地・不動産',
  consulting: 'コンサル / 法務 / 監査',
};

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  developer: '#0066cc',
  epc: '#cc6600',
  om: '#888888',
  cell: '#cc0066',
  system: '#9933cc',
  pcs: '#006666',
  ems: '#669900',
  utility: '#cc9900',
  finance: '#006699',
  land: '#996633',
  consulting: '#444444',
};

// ──────────────────────────────────────
// PLAYERS (50+ 代表的事業者)
// ──────────────────────────────────────

export const PLAYERS: Player[] = [
  // ── デベロッパー (国内) ──
  { id: 'jfe-engi', name: 'JFE エンジニアリング', category: 'developer', origin: 'JP', listed: true, activity: 5, operator_slug: 'jfe-engineering', note: '北海道大型 BESS 案件先行' },
  { id: 'osaka-gas', name: '大阪ガス', category: 'developer', origin: 'JP', listed: true, activity: 5, operator_slug: 'osaka-gas', note: 'マルチユース BESS 戦略' },
  { id: 'tokyo-gas', name: '東京ガス', category: 'developer', origin: 'JP', listed: true, activity: 5, note: 'メガソーラー + BESS 併設展開' },
  { id: 'orix', name: 'ORIX', category: 'developer', origin: 'JP', listed: true, activity: 4, note: 'グリッド BESS PF 主導' },
  { id: 'eurus-energy', name: 'ユーラスエナジー', category: 'developer', origin: 'JP', listed: false, activity: 4, note: '再エネ大手、BESS 拡大中' },

  // ── デベロッパー (海外参入) ──
  { id: 'macquarie', name: 'マッコーリー', category: 'developer', origin: 'OTHER', listed: true, activity: 4, note: '豪州系インフラファンド、日本参入' },
  { id: 'tepco-rp', name: 'TEPCO Renewable Power', category: 'developer', origin: 'JP', listed: false, activity: 4, note: '東電子会社、再エネ + BESS' },

  // ── EPC ──
  { id: 'kandenko', name: '関電工', category: 'epc', origin: 'JP', listed: true, activity: 5, note: '関東 BESS EPC 主力' },
  { id: 'kinden', name: 'きんでん', category: 'epc', origin: 'JP', listed: true, activity: 5, note: '関西電工事業最大手' },
  { id: 'taikisha', name: 'タイキシャ', category: 'epc', origin: 'JP', listed: true, activity: 3 },
  { id: 'toshiba-ep', name: '東芝エネルギーシステムズ', category: 'epc', origin: 'JP', listed: true, activity: 4, note: 'PCS + EPC 統合' },

  // ── O&M ──
  { id: 'looop-om', name: 'ループ O&M', category: 'om', origin: 'JP', listed: false, activity: 3 },
  { id: 'shizen-energy-om', name: '自然電力 O&M', category: 'om', origin: 'JP', listed: false, activity: 4 },

  // ── セル / モジュール ──
  { id: 'catl', name: 'CATL (寧徳時代)', category: 'cell', origin: 'CN', listed: true, activity: 5, note: 'LFP セル世界最大手' },
  { id: 'byd', name: 'BYD', category: 'cell', origin: 'CN', listed: true, activity: 5, note: '電池 + EV 垂直統合' },
  { id: 'lgenergy', name: 'LG Energy Solution', category: 'cell', origin: 'KR', listed: true, activity: 4, note: 'NMC + LFP' },
  { id: 'samsung-sdi', name: 'Samsung SDI', category: 'cell', origin: 'KR', listed: true, activity: 4 },
  { id: 'panasonic-ec', name: 'パナソニック EV エナジー', category: 'cell', origin: 'JP', listed: true, activity: 3, note: 'Tesla 向け中心' },

  // ── BESS システム統合 ──
  { id: 'tesla', name: 'Tesla Megapack', category: 'system', origin: 'US', listed: true, activity: 5, note: 'Container BESS 業界標準' },
  { id: 'fluence', name: 'Fluence', category: 'system', origin: 'US', listed: true, activity: 5, operator_slug: 'pr-fluenceenergyinc', note: '三菱 × Siemens JV 出自' },
  { id: 'sungrow', name: 'Sungrow', category: 'system', origin: 'CN', listed: true, activity: 5, note: 'BESS + PCS 統合最大手' },
  { id: 'huawei-ds', name: 'Huawei DS', category: 'system', origin: 'CN', listed: false, activity: 4 },
  { id: 'hitachi-energy', name: '日立エナジー', category: 'system', origin: 'JP', listed: true, activity: 4 },

  // ── PCS / インバータ ──
  { id: 'tmeic', name: 'TMEIC', category: 'pcs', origin: 'JP', listed: false, activity: 5, note: '東芝 × 三菱電機 JV、PCS 国内最大手' },
  { id: 'hitachi-pcs', name: '日立製作所 PCS', category: 'pcs', origin: 'JP', listed: true, activity: 4 },
  { id: 'goodwe', name: 'GoodWe', category: 'pcs', origin: 'CN', listed: true, activity: 3 },
  { id: 'sma', name: 'SMA', category: 'pcs', origin: 'EU', listed: true, activity: 3, note: 'ドイツ系老舗' },

  // ── EMS / アグリゲーター ──
  { id: 'tepco-power-grid', name: 'TEPCO パワーグリッド', category: 'ems', origin: 'JP', listed: false, activity: 5, note: '関東アグリゲーション最大' },
  { id: 'enex', name: 'エネックス・インフィニティ', category: 'ems', origin: 'JP', listed: false, activity: 4 },
  { id: 'shizen-energy-ems', name: '自然電力 EMS', category: 'ems', origin: 'JP', listed: false, activity: 4 },
  { id: 'aurora', name: 'Aurora Energy Research', category: 'ems', origin: 'EU', listed: false, activity: 4, operator_slug: 'pr-auroraenergyresearch', note: '市場分析 + 最適化' },

  // ── 電力会社 / 送配電 ──
  { id: 'tepco-pg', name: '東京電力 PG', category: 'utility', origin: 'JP', listed: false, activity: 5, note: '系統運用、空き容量データ非公開中' },
  { id: 'kepco', name: '関西電力', category: 'utility', origin: 'JP', listed: true, activity: 5 },
  { id: 'chubu-ep', name: '中部電力', category: 'utility', origin: 'JP', listed: true, activity: 5, note: 'PG 配下 1,081 変電所 緯度経度公開' },
  { id: 'hokkaido-ep', name: '北海道電力', category: 'utility', origin: 'JP', listed: true, activity: 4 },
  { id: 'occto', name: 'OCCTO', category: 'utility', origin: 'JP', listed: false, activity: 5, note: '広域機関、容量市場 運営' },

  // ── 金融機関 / PF ──
  // ※ DBJ / 地方銀行は補助金/PF プログラム単位で linkable、operator slug ではなく subsidy_slug を使う (EDA 5/16 19:00 指摘対応)
  { id: 'dbj', name: '日本政策投資銀行 (DBJ)', category: 'finance', origin: 'JP', listed: false, activity: 5, subsidy_slug: 'dbj-environmental-finance', external_url: 'https://www.dbj.jp/', note: '大型 BESS PF レンダー' },
  { id: 'mufg', name: '三菱 UFJ 銀行', category: 'finance', origin: 'JP', listed: true, activity: 4 },
  { id: 'smbc', name: '三井住友銀行', category: 'finance', origin: 'JP', listed: true, activity: 4 },
  { id: 'mizuho', name: 'みずほ銀行', category: 'finance', origin: 'JP', listed: true, activity: 4 },
  { id: 'regional-banks', name: '地方銀行グリーンローン', category: 'finance', origin: 'JP', listed: false, activity: 3, subsidy_slug: 'regional-bank-green-loans', note: '中規模案件向け' },

  // ── 土地・不動産 ──
  { id: 'mitsubishi-estate', name: '三菱地所', category: 'land', origin: 'JP', listed: true, activity: 3, note: 'グリーン不動産 戦略' },
  { id: 'mitsui-fudosan', name: '三井不動産', category: 'land', origin: 'JP', listed: true, activity: 3 },

  // ── コンサル / 法務 / 監査 ──
  { id: 'pwc', name: 'PwC コンサルティング', category: 'consulting', origin: 'OTHER', listed: false, activity: 4 },
  { id: 'mri', name: '三菱総合研究所', category: 'consulting', origin: 'JP', listed: true, activity: 4 },
  { id: 'mhri', name: 'みずほリサーチ&テクノロジーズ', category: 'consulting', origin: 'JP', listed: false, activity: 3 },
  { id: 'eic', name: 'エネルギー情報センター', category: 'consulting', origin: 'JP', listed: false, activity: 4, note: '蓄電所ネット 運営、業界中立媒体' },
];

// ──────────────────────────────────────
// RELATIONS (35 件、主要事業者間の関係)
// ──────────────────────────────────────

export const RELATIONS: Relation[] = [
  // セル供給
  { from: 'catl', to: 'fluence', type: 'cell_supply', note: 'Fluence の主要 LFP セル供給元' },
  { from: 'catl', to: 'tesla', type: 'cell_supply', note: 'Megapack 向け LFP' },
  { from: 'byd', to: 'sungrow', type: 'cell_supply', note: 'Sungrow BESS 製品向け' },
  { from: 'byd', to: 'hitachi-energy', type: 'cell_supply' },
  { from: 'lgenergy', to: 'hitachi-energy', type: 'cell_supply' },
  { from: 'samsung-sdi', to: 'kinden', type: 'cell_supply', note: '日本案件 EPC 経由' },
  { from: 'panasonic-ec', to: 'tesla', type: 'cell_supply', note: 'NMC、車載中心' },

  // PCS 供給
  { from: 'tmeic', to: 'jfe-engi', type: 'pcs_supply' },
  { from: 'tmeic', to: 'kandenko', type: 'pcs_supply' },
  { from: 'sungrow', to: 'osaka-gas', type: 'pcs_supply', note: 'BESS + PCS 一体供給' },
  { from: 'hitachi-pcs', to: 'tepco-rp', type: 'pcs_supply' },

  // EPC 契約
  { from: 'kandenko', to: 'tokyo-gas', type: 'epc_contract' },
  { from: 'kandenko', to: 'orix', type: 'epc_contract' },
  { from: 'kinden', to: 'osaka-gas', type: 'epc_contract' },
  { from: 'toshiba-ep', to: 'tepco-rp', type: 'epc_contract' },
  { from: 'tesla', to: 'macquarie', type: 'epc_contract', note: 'Megapack ターンキー' },
  { from: 'fluence', to: 'eurus-energy', type: 'epc_contract' },

  // PF (金融機関 → 事業主)
  { from: 'dbj', to: 'jfe-engi', type: 'equity', note: '大型 BESS PF レンダー' },
  { from: 'dbj', to: 'eurus-energy', type: 'equity' },
  { from: 'mufg', to: 'orix', type: 'equity', note: 'シンジケートローン' },
  { from: 'smbc', to: 'tokyo-gas', type: 'equity' },
  { from: 'mizuho', to: 'osaka-gas', type: 'equity' },
  { from: 'regional-banks', to: 'shizen-energy-ems', type: 'equity', note: '地方中小案件' },

  // オフテイク / 売電
  { from: 'jfe-engi', to: 'occto', type: 'offtake', note: '容量市場応札' },
  { from: 'orix', to: 'kepco', type: 'offtake' },
  { from: 'tokyo-gas', to: 'tepco-pg', type: 'offtake' },

  // O&M
  { from: 'shizen-energy-om', to: 'shizen-energy-ems', type: 'om_contract', note: '社内 EMS との連動' },
  { from: 'looop-om', to: 'regional-banks', type: 'partner', note: '小規模案件 保守' },

  // JV / 戦略パートナー
  { from: 'tmeic', to: 'hitachi-energy', type: 'jv', note: '東芝 × 三菱電機 PCS 共同' },
  { from: 'fluence', to: 'aurora', type: 'partner', note: '市場分析連携' },
  { from: 'eic', to: 'mri', type: 'partner', note: '業界統計連携' },
  { from: 'tepco-pg', to: 'occto', type: 'partner', note: '系統運用協議' },
  { from: 'chubu-ep', to: 'occto', type: 'partner' },

  // アグリゲーション
  { from: 'tepco-power-grid', to: 'tepco-rp', type: 'partner', note: 'グループ内アグリゲーション' },
  { from: 'enex', to: 'shizen-energy-ems', type: 'partner', note: 'リソースアグリゲーション連携' },
];

// 集計ヘルパ
export function playerCountByCategory(): Record<CategoryKey, number> {
  const result: Record<CategoryKey, number> = {} as Record<CategoryKey, number>;
  for (const cat of Object.keys(CATEGORY_LABELS) as CategoryKey[]) {
    result[cat] = PLAYERS.filter((p) => p.category === cat).length;
  }
  return result;
}
