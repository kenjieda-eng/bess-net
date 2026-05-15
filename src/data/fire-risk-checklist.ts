/**
 * src/data/fire-risk-checklist.ts
 *
 * 火災リスク自己診断 チェックリスト (依頼AS、25 問)
 *
 * 構成: 5 カテゴリ × 5 問 = 25 問
 *   1. cell      - セル選定 (化学種、メーカー、認証、寿命管理、温度)
 *   2. pcs       - PCS/システム (BMS、保護、絶縁、サージ、断路器)
 *   3. building  - 建屋・配置 (防火区画、離隔距離、換気、温度監視、消火栓)
 *   4. operation - 運用 (充放電制御、サイクル、点検、記録、メンテ業者)
 *   5. emergency - 緊急対応 (消火設備、避難計画、消防連絡、訓練、保険)
 *
 * 各回答:
 *   - score 0-10 (高いほど安全)
 *   - weight 1-3 (重要度、cell/pcs 系は高め)
 *   - reference: UL9540A / NFPA 855 / 消防法 / JIS 等
 *
 * 編集方針 (CLAUDE.md AS 啓発ツール):
 *   - 啓発・自己評価用、法的判断の代替ではない
 *   - UL9540A 等は参考、最終判断は消防署/専門家
 */

export type CategoryKey =
  | 'cell'
  | 'pcs'
  | 'building'
  | 'operation'
  | 'emergency';

export interface ChecklistOption {
  label: string;
  /** 0-10、高いほど安全 */
  score: number;
  /** 選んだ時の注意・補足 */
  risk_note?: string;
}

export interface ChecklistItem {
  id: string;
  category: CategoryKey;
  question: string;
  options: ChecklistOption[];
  /** 重要度 1-3 */
  weight: number;
  /** 参考規格 */
  reference?: string;
  /** 補足説明 (UI ツールチップ用) */
  hint?: string;
}

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  cell: 'セル選定',
  pcs: 'PCS / システム',
  building: '建屋・配置',
  operation: '運用',
  emergency: '緊急対応',
};

export const CATEGORY_DESCRIPTIONS: Record<CategoryKey, string> = {
  cell: '電池セルの化学種・認証・温度管理。最も重要 (weight 高)',
  pcs: 'PCS の保護機能・BMS の品質。熱暴走の初期検知に直結',
  building: '建屋の防火区画・離隔距離・消火設備の物理的配置',
  operation: '日常運用での充放電管理・点検・記録の継続性',
  emergency: '事故時の対応体制・避難・消防連携・保険',
};

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  cell: '#cc0066',
  pcs: '#0066cc',
  building: '#006666',
  operation: '#cc6600',
  emergency: '#888888',
};

// ─────────────────────────────────────
// 25 問定義
// ─────────────────────────────────────

export const CHECKLIST: ChecklistItem[] = [
  // ── セル選定 (5問) ──
  {
    id: 'cell-1',
    category: 'cell',
    question: 'セル化学種は何ですか?',
    options: [
      { label: 'LFP (リン酸鉄リチウム)', score: 10, risk_note: '熱暴走耐性最も高い、業界標準' },
      { label: 'LTO (チタン酸リチウム)', score: 9, risk_note: '安全性高、コストやや高い' },
      { label: 'NMC (三元系・622/811)', score: 5, risk_note: 'エネルギー密度高だが熱暴走リスクあり' },
      { label: 'NCA (ニッケルコバルトアルミ)', score: 4, risk_note: '高エネルギー密度、熱管理要厳格' },
      { label: '不明 / その他', score: 1, risk_note: '★導入前に必ず確認、UL9540A 試験データ請求' },
    ],
    weight: 3,
    reference: 'UL9540A',
    hint: '化学種により熱暴走特性が大きく異なる',
  },
  {
    id: 'cell-2',
    category: 'cell',
    question: 'セル/モジュールの安全認証は?',
    options: [
      { label: 'UL9540A + UL1973 両方', score: 10, risk_note: '北米最高水準、日本でも信頼性高' },
      { label: 'UL1973 のみ', score: 7, risk_note: 'UL9540A 試験データ追加請求推奨' },
      { label: 'IEC 62619 / IEC 62933', score: 8, risk_note: '国際標準、UL と併用が望ましい' },
      { label: 'JIS C 8715-2 (日本)', score: 6, risk_note: '国内標準、海外規格との整合確認' },
      { label: '認証なし / 不明', score: 1, risk_note: '★調達リスク高、保険査定にも影響' },
    ],
    weight: 3,
    reference: 'UL9540A / IEC 62619',
  },
  {
    id: 'cell-3',
    category: 'cell',
    question: 'セル供給メーカーは?',
    options: [
      { label: '大手 Tier-1 (CATL/BYD/LG/Samsung 等)', score: 9, risk_note: '実績豊富、サプライ安定' },
      { label: '中堅メーカー (実績 5 年以上)', score: 7 },
      { label: '新興メーカー (実績 5 年未満)', score: 4, risk_note: '量産品質のばらつきリスク' },
      { label: 'OEM / リブランド', score: 5, risk_note: '原セル メーカー特定が重要' },
      { label: '不明', score: 1, risk_note: '★必ず確認' },
    ],
    weight: 2,
  },
  {
    id: 'cell-4',
    category: 'cell',
    question: 'セルの動作温度範囲は監視されますか?',
    options: [
      { label: 'BMS で各セル個別監視 + アラート', score: 10, risk_note: '理想形' },
      { label: 'モジュール単位で監視', score: 7 },
      { label: 'ラック単位で監視', score: 4, risk_note: 'セル個別の異常検知遅延' },
      { label: '監視なし / 不明', score: 1, risk_note: '★熱暴走初期検知不可、即改善' },
    ],
    weight: 3,
    reference: 'UL9540A 9.6 (Cell-level monitoring)',
  },
  {
    id: 'cell-5',
    category: 'cell',
    question: 'セルの寿命管理 (劣化追跡) はされますか?',
    options: [
      { label: 'SOH 自動追跡 + 閾値アラート', score: 10 },
      { label: '定期 SOH 測定 (年 1 回以上)', score: 7 },
      { label: '故障時のみ確認', score: 3, risk_note: '劣化進行を見逃すリスク' },
      { label: '管理なし / 不明', score: 1, risk_note: '★寿命予測不可、即改善' },
    ],
    weight: 2,
  },

  // ── PCS / システム (5問) ──
  {
    id: 'pcs-1',
    category: 'pcs',
    question: 'BMS (Battery Management System) の保護機能は?',
    options: [
      {
        label: '過充電・過放電・過温度・絶縁・短絡 5 重保護',
        score: 10,
        risk_note: 'UL9540A 推奨水準',
      },
      { label: '過充電・過放電・過温度の 3 重保護', score: 7 },
      { label: '基本機能のみ (過充電・過放電)', score: 4 },
      { label: '保護機能限定的 / 不明', score: 1, risk_note: '★熱暴走の最大要因' },
    ],
    weight: 3,
    reference: 'UL9540A 9.4',
  },
  {
    id: 'pcs-2',
    category: 'pcs',
    question: 'PCS の認証/規格適合は?',
    options: [
      { label: 'JET PVm / JIS C 8980 + UL', score: 10 },
      { label: 'JET PVm / JIS C 8980', score: 8 },
      { label: 'JET 認証のみ', score: 6 },
      { label: '認証不明', score: 2, risk_note: '★調達前に必ず確認' },
    ],
    weight: 2,
  },
  {
    id: 'pcs-3',
    category: 'pcs',
    question: '絶縁監視 (DC 側) の体制は?',
    options: [
      { label: '常時絶縁監視 + 異常時自動遮断', score: 10 },
      { label: '常時絶縁監視のみ', score: 7 },
      { label: '定期検査のみ', score: 4 },
      { label: '監視なし', score: 1, risk_note: '★地絡から火災への発展リスク' },
    ],
    weight: 2,
    reference: '電気事業法 / 電技解釈',
  },
  {
    id: 'pcs-4',
    category: 'pcs',
    question: 'サージ・落雷対策は?',
    options: [
      { label: 'SPD (避雷器) + 接地 + サージ保護', score: 10 },
      { label: 'SPD + 接地', score: 7 },
      { label: '接地のみ', score: 4 },
      { label: '対策不明', score: 1, risk_note: '★日本は落雷多い地域、必須' },
    ],
    weight: 2,
  },
  {
    id: 'pcs-5',
    category: 'pcs',
    question: '緊急時の電源遮断スイッチ (E-Stop) は?',
    options: [
      { label: '複数箇所 + 遠隔操作可', score: 10 },
      { label: '1 箇所 + 現場操作のみ', score: 6 },
      { label: '盤内のみ (一般操作員アクセス不可)', score: 3, risk_note: '緊急時に間に合わない' },
      { label: '未設置', score: 1, risk_note: '★消防法上必須レベル、即設置' },
    ],
    weight: 3,
    reference: '消防法 / NFPA 855',
  },

  // ── 建屋・配置 (5問) ──
  {
    id: 'building-1',
    category: 'building',
    question: '蓄電池設置場所と他設備の離隔距離は?',
    options: [
      { label: '3m 以上 + 防火壁', score: 10 },
      { label: '1m 以上 + 防火区画', score: 7 },
      { label: '0.5m 以上', score: 4 },
      { label: '近接 / 制約なし', score: 1, risk_note: '★延焼リスク高、消防法確認要' },
    ],
    weight: 3,
    reference: 'NFPA 855 / 消防法第 9 条の 2',
  },
  {
    id: 'building-2',
    category: 'building',
    question: '建屋の防火区画は?',
    options: [
      { label: '60 分以上耐火 + 自動防火扉', score: 10 },
      { label: '1 時間耐火区画', score: 8 },
      { label: '不燃材区画', score: 5 },
      { label: '区画なし (屋外コンテナ等)', score: 4, risk_note: '屋外は区画より離隔重視' },
      { label: '不明', score: 1, risk_note: '★建築基準法・消防法確認要' },
    ],
    weight: 2,
  },
  {
    id: 'building-3',
    category: 'building',
    question: '換気・排熱対策は?',
    options: [
      { label: '自動換気 + 排熱ファン + ガス排出経路', score: 10, risk_note: '熱暴走時のガス排出に重要' },
      { label: '自動換気 + 排熱ファン', score: 7 },
      { label: '自然換気のみ', score: 4 },
      { label: '密閉 / 換気不明', score: 1, risk_note: '★熱・ガス蓄積で爆発リスク' },
    ],
    weight: 3,
    reference: 'NFPA 855 9.4',
  },
  {
    id: 'building-4',
    category: 'building',
    question: '建屋内の温度監視は?',
    options: [
      { label: '常時温度監視 + アラート + 自動空調', score: 10 },
      { label: '常時温度監視 + アラート', score: 7 },
      { label: '空調のみ (監視なし)', score: 5 },
      { label: '監視・空調なし', score: 1, risk_note: '★室温上昇で熱暴走連鎖' },
    ],
    weight: 2,
  },
  {
    id: 'building-5',
    category: 'building',
    question: '消火設備の種類は?',
    options: [
      { label: 'ガス系 + スプリンクラ + 手動消火栓', score: 10, risk_note: '理想形' },
      { label: 'スプリンクラ + 手動消火栓', score: 7 },
      { label: '手動消火栓のみ', score: 4 },
      { label: '消火器のみ', score: 2, risk_note: '蓄電池火災には性能不足' },
      { label: '設備なし', score: 1, risk_note: '★消防法違反の可能性、即整備' },
    ],
    weight: 3,
    reference: '消防法施行令第 13 条',
  },

  // ── 運用 (5問) ──
  {
    id: 'operation-1',
    category: 'operation',
    question: 'SOC (充電状態) の運用範囲は?',
    options: [
      { label: '20-80% に制限 (推奨)', score: 10, risk_note: '寿命+安全性最良' },
      { label: '10-90%', score: 7 },
      { label: '5-95%', score: 5 },
      { label: '0-100% (制限なし)', score: 2, risk_note: '過充電/過放電リスク' },
      { label: '不明', score: 1 },
    ],
    weight: 2,
    hint: 'SOC: State of Charge',
  },
  {
    id: 'operation-2',
    category: 'operation',
    question: '定期点検の頻度は?',
    options: [
      { label: '月次 + 四半期詳細点検', score: 10 },
      { label: '四半期点検', score: 7 },
      { label: '年次点検のみ', score: 4 },
      { label: '故障時のみ', score: 2, risk_note: '★予兆検知不可' },
      { label: '点検なし', score: 1, risk_note: '★必ず開始' },
    ],
    weight: 3,
    reference: '電気事業法 / 保安規程',
  },
  {
    id: 'operation-3',
    category: 'operation',
    question: '点検記録の保管は?',
    options: [
      { label: 'クラウド + 5 年以上保管', score: 10 },
      { label: '紙 or デジタルで 3 年以上', score: 7 },
      { label: '紙のみ 1 年', score: 4 },
      { label: '記録なし / 散逸', score: 1, risk_note: '★事故時の証跡確保不可' },
    ],
    weight: 2,
  },
  {
    id: 'operation-4',
    category: 'operation',
    question: 'O&M 業者の体制は?',
    options: [
      { label: '専門 O&M 業者 + 24h 緊急対応', score: 10 },
      { label: '専門 O&M 業者 (営業時間内)', score: 7 },
      { label: 'EPC 兼 O&M', score: 6 },
      { label: '自社対応 + 専門知識不足', score: 3, risk_note: '★緊急時対応力に不安' },
      { label: 'O&M 体制未整備', score: 1, risk_note: '★即整備' },
    ],
    weight: 3,
  },
  {
    id: 'operation-5',
    category: 'operation',
    question: '電気主任技術者の選任は?',
    options: [
      { label: '専任 (常駐) 第 1 種', score: 10 },
      { label: '専任 第 2-3 種', score: 8 },
      { label: '兼任 + 外部委託保安管理', score: 6 },
      { label: '外部委託のみ', score: 5 },
      { label: '未選任', score: 1, risk_note: '★電気事業法違反' },
    ],
    weight: 2,
    reference: '電気事業法第 43 条',
  },

  // ── 緊急対応 (5問) ──
  {
    id: 'emergency-1',
    category: 'emergency',
    question: '緊急時の連絡体制は?',
    options: [
      {
        label: '24h オペセンタ + 消防自動連絡 + 関係者リスト',
        score: 10,
      },
      { label: '営業時間オペセンタ + 関係者リスト', score: 7 },
      { label: '担当者個人連絡先のみ', score: 4 },
      { label: '体制未整備', score: 1, risk_note: '★即整備、深夜火災対応不可' },
    ],
    weight: 3,
  },
  {
    id: 'emergency-2',
    category: 'emergency',
    question: '消防署との事前連絡・現地調査は?',
    options: [
      { label: '事前協議完了 + 現地調査 + 図面共有', score: 10 },
      { label: '事前連絡のみ', score: 6 },
      { label: '届出書類のみ', score: 4 },
      { label: '連絡なし', score: 1, risk_note: '★消防法上の届出要、即実施' },
    ],
    weight: 3,
    reference: '消防法第 9 条の 2',
  },
  {
    id: 'emergency-3',
    category: 'emergency',
    question: '訓練 (避難・初期消火) の実施頻度は?',
    options: [
      { label: '年 2 回以上 + 消防署立会', score: 10 },
      { label: '年 1 回', score: 7 },
      { label: '不定期', score: 4 },
      { label: '未実施', score: 1, risk_note: '★緊急時パニック誘発、即実施' },
    ],
    weight: 2,
  },
  {
    id: 'emergency-4',
    category: 'emergency',
    question: '事業者賠償責任保険の加入状況は?',
    options: [
      { label: '蓄電池火災特約 + 隣地延焼カバー (高額)', score: 10 },
      { label: '一般事業者賠償責任保険', score: 7 },
      { label: '火災保険のみ', score: 5 },
      { label: '未加入 / 不明', score: 1, risk_note: '★賠償リスク無防備、即加入' },
    ],
    weight: 3,
  },
  {
    id: 'emergency-5',
    category: 'emergency',
    question: '事故時の事業継続計画 (BCP) は?',
    options: [
      { label: '文書化 BCP + 年 1 回演習', score: 10 },
      { label: '文書化のみ', score: 6 },
      { label: '担当者の頭の中', score: 3 },
      { label: '未策定', score: 1, risk_note: '★長期停止リスク、即策定' },
    ],
    weight: 2,
  },
];

// 検証: カテゴリごとに 5 問
export function validateChecklist(): boolean {
  const counts: Record<CategoryKey, number> = {
    cell: 0,
    pcs: 0,
    building: 0,
    operation: 0,
    emergency: 0,
  };
  for (const item of CHECKLIST) {
    counts[item.category]++;
  }
  return Object.values(counts).every((c) => c === 5);
}
