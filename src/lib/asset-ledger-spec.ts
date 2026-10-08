/**
 * src/lib/asset-ledger-spec.ts — 系統用蓄電所 資産台帳テンプレート（xlsx）の定義（T3 台帳便・2026-10-08）
 *
 * 落とし穴 #119（定義は一箇所）: シート・列・説明・選択肢・README の文・行の配置はここだけに置く。
 *   - scripts/build-asset-ledger.ts …… この定義から public/dl/bess-asset-ledger-v1.0.xlsx を生成する（手で作らない）
 *   - scripts/verify-asset-ledger.ts …… 生成済みの xlsx を読み戻し、この定義と一致するかを検査する（prebuild・警告のみ）
 *   - src/app/tools/asset-ledger/page.tsx・src/app/tools/page.tsx …… シート一覧・項目の説明・件数をこの定義から描く
 * ★外部モジュールを読まない（アプリとスクリプトの両方が読む・生成物が無くても読める）。
 *
 * 書き方の約束（便 §0）:
 *   - 法令・制度の説明は書かない。制度に触れる列は、一次で確かめた条文番号（電気事業法・e-Gov 2026-10-08 取得）と
 *     当サイトの用語集へのリンクだけを添える。
 *   - 指標（約定率・稼働可能率・サイクル数・営業利益）は「この台帳での定義」と明記して書く（業界の標準定義だとは書かない）。
 *   - 手数料・保証・金利などの数値は例示しない（利用者が契約書の値を入れる欄）。
 *   - 「買い手・貸し手が確かめる順」などの並びの理由は「当サイトの想定」と明記する（裏付けのある事実としては書かない）。
 */

export const LEDGER_VERSION = '1.0';
/** 版の年月（README・ページの表示用） */
export const LEDGER_RELEASED = '2026-10';
export const LEDGER_FILE_NAME = `bess-asset-ledger-v${LEDGER_VERSION}.xlsx`;
/** 配布 URL のパス（public/ 配下） */
export const LEDGER_PUBLIC_PATH = `/dl/${LEDGER_FILE_NAME}`;
export const LEDGER_TITLE = '系統用蓄電所 資産台帳テンプレート';
/** 説明・README に書く当サイトの URL の起点（ページはこの起点の URL を内部リンクに置き換えて描く） */
export const LEDGER_SITE = 'https://bess-net.jp';
const glossary = (slug: string) => `${LEDGER_SITE}/glossary/${slug}`;

/** 用語集の canonical slug（301 元・表示除外でないことを確認済み・src/lib/glossary-301.ts） */
export const LEDGER_GLOSSARY = {
  n1: 'n-1-densei',
  nonFirm: 'non-firm-connection',
  generationBusiness: 'generation-business-operator',
  specifiedWholesale: 'specified-wholesale-supply',
} as const;

export type LedgerColumnType = 'text' | 'number' | 'date' | 'month' | 'list' | 'formula';

export type LedgerFormula =
  /** 列の和（どれも空なら空欄） */
  | { kind: 'sum'; of: readonly string[] }
  /** 左の列から右の列の和を引く（左も右もすべて空なら空欄。左が空で右に値があれば左を 0 として引く） */
  | { kind: 'minus'; from: string; subtract: readonly string[] };

export type LedgerColumn = {
  /** 列名（LEDGER_ROW.header 行）。単位は列名に入れる */
  name: string;
  /** 説明（LEDGER_ROW.desc 行・灰色） */
  desc: string;
  type: LedgerColumnType;
  /** type: 'list' の選択肢（データ検証のプルダウン） */
  options?: readonly string[];
  formula?: LedgerFormula;
  /** 列幅（文字数の目安）。省略時は列名から決める */
  width?: number;
};

export type LedgerSheet = {
  /** シート名（xlsx のタブ） */
  name: string;
  /** ページ・README に出す 1 行の説明 */
  purpose: string;
  /** 1 行が何を表すか（README・ページ用） */
  rowUnit: string;
  columns: readonly LedgerColumn[];
};

/**
 * 表の行の配置（各データシート共通）: 1 行目＝シート名と版、2 行目＝列名、3 行目＝説明、4 行目から入力。
 * 便 §1 の「1 行目に項目名・2 行目に説明・3 行目から入力」と「各シート A1 にシート名と版」は同時に満たせないため、
 * A1 の行を足して 1 行ずつ下げた（報告 (4)）。
 */
export const LEDGER_ROW = { title: 1, header: 2, desc: 3, firstInput: 4 } as const;
/** プルダウン・書式を掛ける入力行の数（firstInput 行から） */
export const LEDGER_INPUT_ROWS = 500;
/** 04_月次実績で数式を入れておく行数（10 年分） */
export const LEDGER_FORMULA_ROWS = 120;

/** シート名（README・説明文・08 の参照・ページはこの定数から引く＝改名しても文が取り残されない） */
export const LEDGER_SHEET_NAMES = {
  site: '01_サイト基本',
  equipment: '02_設備',
  contract: '03_契約',
  monthly: '04_月次実績',
  incident: '05_インシデント',
  documents: '06_書類',
  finance: '07_ファイナンス',
  checklist: '08_売却時に聞かれる項目',
} as const;
const N = LEDGER_SHEET_NAMES;

const YESNO = ['有', '無'] as const;
const YESNO_UNKNOWN = ['有', '無', '不明'] as const;

const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県', '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県',
  '東京都', '神奈川県', '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県', '徳島県',
  '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
] as const;

const BALANCING_PRODUCTS = ['一次', '二次①', '二次②', '三次①', '三次②', '複合'] as const;
const JEPX_REVENUE = 'JEPX 収益(円)';
const REVENUE_COLUMNS = [
  ...BALANCING_PRODUCTS.map((p) => `需給調整 ${p} 収益(円)`),
  '容量市場 収益(円)',
  JEPX_REVENUE,
  '相対 収益(円)',
] as const;
const COST_COLUMNS = ['アグリ手数料(円)', 'O&M費(円)', '保険料(円)', 'その他費用(円)'] as const;
const REVENUE_DESC = '当月の収益（精算の確定値か見込みかは備考に）。収益が無い月は 0';

const insurance = (kind: string): LedgerColumn[] => [
  { name: `${kind} 保険会社`, desc: `${kind}の保険会社`, type: 'text' },
  { name: `${kind} 保険金額(円)`, desc: '保険証券の金額', type: 'number' },
  { name: `${kind} 免責`, desc: '免責金額・免責期間など保険証券の記載', type: 'text' },
  { name: `${kind} 満期日`, desc: '保険期間の終了日', type: 'date' },
];

export const LEDGER_SHEETS: readonly LedgerSheet[] = [
  {
    name: N.site,
    purpose: '所在地・土地・連系・届出など、サイトそのものの情報。',
    rowUnit: '1 行＝1 サイト',
    columns: [
      { name: 'サイトID', desc: '台帳の中での識別子（任意。例: S-001）', type: 'text' },
      { name: '名称', desc: '蓄電所の名称', type: 'text', width: 24 },
      { name: '都道府県', desc: '所在地の都道府県', type: 'list', options: PREFECTURES },
      { name: '市区町村', desc: '所在地の市区町村', type: 'text' },
      { name: '住所', desc: '地番まで', type: 'text', width: 28 },
      { name: '緯度', desc: '10 進数で（例: 35.6812）', type: 'number' },
      { name: '経度', desc: '10 進数で（例: 139.7671）', type: 'number' },
      { name: '用途地域', desc: '都市計画の用途地域（区域外ならその旨）', type: 'text' },
      { name: '敷地面積(㎡)', desc: '登記・契約上の面積', type: 'number' },
      { name: '土地（所有/賃借/その他）', desc: '土地の権利', type: 'list', options: ['所有', '賃借', 'その他'] },
      { name: '土地契約の終了日', desc: '賃借などの場合の契約終了日', type: 'date' },
      { name: '連系電圧(kV)', desc: '連系点の電圧', type: 'number' },
      { name: '接続変電所名', desc: '接続検討の回答書・接続契約の表記で', type: 'text' },
      {
        name: '接続変電所（当サイト slug）',
        desc: `当サイトの変電所ページの URL 末尾（${LEDGER_SITE}/grid/<slug> の <slug>）`,
        type: 'text',
        width: 28,
      },
      { name: '契約容量(kW)', desc: '接続契約上の容量', type: 'number' },
      { name: 'N-1電制の対象（有/無/不明）', desc: `接続条件での扱い。用語: ${glossary(LEDGER_GLOSSARY.n1)}`, type: 'list', options: YESNO_UNKNOWN },
      { name: 'ノンファーム接続（有/無）', desc: `接続条件での扱い。用語: ${glossary(LEDGER_GLOSSARY.nonFirm)}`, type: 'list', options: YESNO },
      {
        name: '発電事業届出（有/無）',
        desc: `電気事業法第27条の27 の発電事業の届出をしているか。用語: ${glossary(LEDGER_GLOSSARY.generationBusiness)}`,
        type: 'list',
        options: YESNO,
        width: 22,
      },
      { name: '発電事業届出の日付', desc: '届出をした日', type: 'date' },
      {
        name: '特定卸供給（有/無）',
        desc: `電気事業法第27条の30 の特定卸供給事業の届出をしているか（自社が届け出ている場合に「有」）。用語: ${glossary(LEDGER_GLOSSARY.specifiedWholesale)}`,
        type: 'list',
        options: YESNO,
        width: 22,
      },
      { name: '消防 届出/許可の種別', desc: '所轄消防への届出・許可の種別（書類名どおりに）', type: 'text', width: 24 },
      { name: '消防 届出/許可の日付', desc: '届出・許可の日付', type: 'date' },
      { name: '条例', desc: '対象となる条例と手続き（名称・日付）', type: 'text', width: 24 },
      { name: '備考', desc: '自由記述', type: 'text', width: 30 },
    ],
  },
  {
    name: N.equipment,
    purpose: '出力・容量・セル・PCS・保証など、設備の仕様。',
    rowUnit: '1 行＝1 設備構成（構成が 1 つなら 1 行）',
    columns: [
      { name: '定格出力(MW)', desc: '系統側の定格出力', type: 'number' },
      { name: '定格容量(MWh)', desc: '定格の蓄電容量', type: 'number' },
      { name: '設置形態', desc: '設置のしかた', type: 'list', options: ['コンテナ', '建屋', '屋外', 'その他'] },
      { name: 'セルメーカー', desc: 'セルの製造者', type: 'text' },
      { name: 'セル型式', desc: '仕様書の型式', type: 'text' },
      { name: 'セル化学', desc: '正極材の種類', type: 'list', options: ['LFP', 'NMC', 'その他'] },
      { name: 'PCSメーカー', desc: 'PCS の製造者', type: 'text' },
      { name: 'PCS型式', desc: '仕様書の型式', type: 'text' },
      { name: 'PCS台数', desc: '設置台数', type: 'number' },
      { name: 'PCS定格(kW)', desc: '1 台あたりの定格', type: 'number' },
      { name: '変圧器メーカー', desc: '連系用変圧器の製造者', type: 'text' },
      { name: 'EMS（メーカー/版）', desc: 'EMS の提供者とソフトウェアの版', type: 'text' },
      { name: 'BMS（メーカー/版）', desc: 'BMS の提供者とソフトウェアの版', type: 'text' },
      { name: '騒音仕様(dB)', desc: '仕様書・測定記録の値', type: 'number' },
      { name: '騒音の測定距離(m)', desc: '上の値の測定距離', type: 'number' },
      { name: '製品保証(年)', desc: '保証書の期間', type: 'number' },
      { name: '容量保証(%)', desc: '保証書の保証容量（初期に対する割合）', type: 'number' },
      { name: '容量保証の年数(年)', desc: '容量保証の期間', type: 'number' },
      { name: '容量保証の条件（SOH等）', desc: '保証の条件（SOH の測り方・サイクル数の上限など保証書の記載）', type: 'text', width: 28 },
      { name: '保証会社', desc: '保証の主体（メーカー・保険会社など）', type: 'text' },
      { name: '竣工日', desc: '工事の完了日', type: 'date' },
      { name: '運転開始日', desc: '商用運転を始めた日', type: 'date' },
      { name: 'EPC', desc: '設計・調達・建設の請負者', type: 'text' },
      { name: 'O&M事業者', desc: '運用・保守の委託先', type: 'text' },
      { name: '備考', desc: '自由記述', type: 'text', width: 30 },
    ],
  },
  {
    name: N.contract,
    purpose: 'アグリゲーター・O&M・保険・接続契約など、契約の条件。',
    rowUnit: '1 行＝1 契約期間（どれかの契約が替わったら行を足す。最新の行が現在の条件）',
    columns: [
      { name: 'アグリゲーター', desc: '運用を委託している事業者', type: 'text' },
      { name: '契約開始日', desc: 'アグリゲーター契約の開始日', type: 'date' },
      { name: '契約終了日', desc: 'アグリゲーター契約の終了日', type: 'date' },
      { name: '自動更新（有/無）', desc: '契約書の自動更新条項', type: 'list', options: YESNO },
      { name: '解約条件（通知期間）', desc: '解約の通知期間など契約書の記載', type: 'text', width: 24 },
      { name: '手数料の型', desc: '手数料の決め方', type: 'list', options: ['成功報酬', '固定', '併用', 'その他'] },
      { name: '手数料率(%)', desc: '契約書の値（当サイトは例示しません）', type: 'number' },
      { name: '固定額(円/年)', desc: '契約書の値（当サイトは例示しません）', type: 'number' },
      { name: 'データ引継ぎ条項（有/無/不明）', desc: '契約終了時に運転データを受け取れる条項', type: 'list', options: YESNO_UNKNOWN, width: 24 },
      { name: '報告頻度', desc: 'アグリゲーターからの報告の頻度', type: 'list', options: ['日次', '週次', '月次', '四半期', 'その他'] },
      { name: '対応市場', desc: '参加している市場を「・」区切りで（需給調整・容量・JEPX・相対）', type: 'text', width: 24 },
      { name: 'O&M契約 社名', desc: 'O&M の委託先', type: 'text' },
      { name: 'O&M契約 範囲', desc: '委託の範囲（点検・遠隔監視・駆け付けなど契約書の記載）', type: 'text', width: 24 },
      { name: 'O&M契約 SLA', desc: '駆け付け時間・稼働率などの約束（契約書の記載）', type: 'text', width: 24 },
      { name: 'O&M契約 終了日', desc: 'O&M 契約の終了日', type: 'date' },
      ...insurance('火災保険'),
      ...insurance('事業中断（利益）保険'),
      ...insurance('賠償責任保険'),
      { name: '接続契約 電力会社', desc: '接続契約の相手（一般送配電事業者など）', type: 'text' },
      { name: '接続契約 契約日', desc: '接続契約の締結日', type: 'date' },
      { name: '備考', desc: '自由記述', type: 'text', width: 30 },
    ],
  },
  {
    name: N.monthly,
    purpose: '月ごとの収益・費用・運転の記録（合計収益と営業利益は数式）。',
    rowUnit: '1 行＝1 か月',
    columns: [
      { name: '年月', desc: '対象の月（その月の 1 日を入れる）', type: 'month' },
      ...REVENUE_COLUMNS.map((name) =>
        name === JEPX_REVENUE
          ? {
              name,
              desc: '当月の JEPX の売電額、または充電の買電額を引いた額（どちらかを備考に。引かない場合は買電額を「その他費用」に）。無い月は 0',
              type: 'number' as const,
              width: 16,
            }
          : { name, desc: REVENUE_DESC, type: 'number' as const },
      ),
      { name: '合計収益(円)', desc: '数式（左の収益列の和）', type: 'formula', formula: { kind: 'sum', of: REVENUE_COLUMNS } },
      { name: '約定率(%)', desc: 'この台帳での定義: 需給調整の約定量÷応札量', type: 'number' },
      { name: '平均落札単価(円/ΔkW・30分)', desc: '当月の需給調整の落札単価の平均（算定方法は備考に）', type: 'number', width: 22 },
      { name: '稼働可能率(%)', desc: 'この台帳での定義: 暦時間のうち運転できた時間の割合', type: 'number' },
      { name: '停止日数(日)', desc: '当月に停止していた日数', type: 'number' },
      { name: '停止理由', desc: `停止の理由（${N.incident}の記録と揃える）`, type: 'text', width: 24 },
      { name: '充電量(MWh)', desc: '当月の充電量', type: 'number' },
      { name: '放電量(MWh)', desc: '当月の放電量', type: 'number' },
      { name: 'サイクル数', desc: 'この台帳での定義: 当月の放電量÷定格容量（別の算定なら備考に）', type: 'number', width: 18 },
      { name: 'SOH(%)', desc: '当月の SOH（測り方は備考に）', type: 'number' },
      { name: '補機電力(kWh)', desc: '空調・制御などの当月の消費電力量', type: 'number' },
      ...COST_COLUMNS.map((name) =>
        name === 'その他費用(円)'
          ? { name, desc: '左の 3 つ以外の当月の費用（充電の買電額・減価償却費などを入れる場合は、何を入れたかを備考に）', type: 'number' as const, width: 18 }
          : { name, desc: '当月の費用', type: 'number' as const },
      ),
      {
        name: '営業利益(円)',
        desc: 'この台帳での定義（数式）: 合計収益 −（アグリ手数料・O&M費・保険料・その他費用）。減価償却費の列は無い（引くなら「その他費用」に入れる）',
        type: 'formula',
        formula: { kind: 'minus', from: '合計収益(円)', subtract: COST_COLUMNS },
        width: 18,
      },
      { name: '備考', desc: '自由記述', type: 'text', width: 30 },
    ],
  },
  {
    name: N.incident,
    purpose: '停止・故障・火災・苦情などの出来事の記録。',
    rowUnit: '1 行＝1 件',
    columns: [
      { name: '日付', desc: '発生日', type: 'date' },
      { name: '種別', desc: '出来事の種類', type: 'list', options: ['停止', '故障', '火災', '系統事象', '騒音苦情', 'その他'] },
      { name: '概要', desc: '何が起きたか', type: 'text', width: 30 },
      { name: '原因', desc: '分かっている原因', type: 'text', width: 24 },
      { name: '対応', desc: '行った対応', type: 'text', width: 24 },
      { name: '復旧日', desc: '運転を再開した日', type: 'date' },
      { name: '停止日数(日)', desc: '停止していた日数', type: 'number' },
      { name: '損失推定(円)', desc: '逸失収益・修理費などの推定', type: 'number' },
      { name: '保険適用', desc: '保険の扱い', type: 'list', options: ['有', '無', '申請中'] },
      { name: '報告先', desc: '報告した先を「・」区切りで（電力会社・消防・自治体・アグリ）', type: 'text', width: 24 },
      { name: '備考', desc: '自由記述', type: 'text', width: 30 },
    ],
  },
  {
    name: N.documents,
    purpose: '契約書・許認可・保証書などの書類の所在と期限。',
    rowUnit: '1 行＝1 書類',
    columns: [
      { name: '書類名', desc: '書類の名称', type: 'text', width: 28 },
      { name: '種別', desc: '書類の種類', type: 'list', options: ['契約', '許認可', '保証書', '試験成績書', '保険証券', '図面', '議事録', 'その他'] },
      { name: '発行者', desc: '書類を出した者', type: 'text' },
      { name: '日付', desc: '書類の日付', type: 'date' },
      { name: '保管場所', desc: '原本・電子ファイルの置き場所', type: 'text', width: 24 },
      { name: '期限', desc: '有効期限・更新期限', type: 'date' },
      { name: '最終確認日', desc: '所在と内容を最後に確かめた日', type: 'date' },
      { name: '備考', desc: '自由記述', type: 'text', width: 30 },
    ],
  },
  {
    name: N.finance,
    purpose: '借入・鑑定・減価償却・補助金の条件。',
    rowUnit: '1 行＝1 件（借入・補助金ごと）',
    columns: [
      { name: '借入先', desc: '金融機関など', type: 'text' },
      { name: '借入額(円)', desc: '契約上の借入額', type: 'number' },
      { name: '金利(%)', desc: '契約上の金利', type: 'number' },
      { name: '返済期間(年)', desc: '契約上の返済期間', type: 'number' },
      { name: 'DSCR 条件', desc: '借入契約の DSCR に関する条件（契約書の記載）', type: 'text', width: 24 },
      { name: '担保', desc: '担保の内容', type: 'text' },
      { name: '鑑定 実施日', desc: '任意（鑑定をした場合）', type: 'date' },
      { name: '鑑定 評価者', desc: '任意', type: 'text' },
      { name: '鑑定 評価額(円)', desc: '任意', type: 'number' },
      { name: '減価償却 方法', desc: '採用している方法', type: 'list', options: ['定額法', '定率法', 'その他'] },
      { name: '減価償却 年数(年)', desc: '採用している年数', type: 'number' },
      { name: '補助金 名称', desc: '交付を受けた補助金の名称', type: 'text', width: 24 },
      { name: '補助金 交付額(円)', desc: '交付決定・確定の額', type: 'number' },
      { name: '補助金 処分制限期間', desc: '交付元の定めによる期間', type: 'text' },
      { name: '補助金 処分制限の終了日', desc: '上の期間が終わる日', type: 'date' },
      { name: '備考', desc: '自由記述', type: 'text', width: 30 },
    ],
  },
];

/** 08_売却時に聞かれる項目 */
export const LEDGER_CHECKLIST_SHEET: LedgerSheet = {
  name: N.checklist,
  purpose: '記録用のシートの中から、売却や借入の相手（買い手・貸し手）が確かめそうな項目を、確かめられそうな順に並べた一覧（当サイトの想定・評価や点数は入れていません）。',
  rowUnit: '1 行＝1 項目',
  columns: [
    { name: '項目', desc: '確かめられる事柄', type: 'text', width: 30 },
    { name: '参照シート', desc: '値を入れるシート', type: 'text', width: 18 },
    { name: '参照列', desc: '値を入れる列（列記号つき）', type: 'text', width: 56 },
    { name: '整備状況（済/未/不要）', desc: '台帳に入れ終えたか', type: 'list', options: ['済', '未', '不要'] },
    { name: '備考', desc: '自由記述', type: 'text', width: 30 },
  ],
};

/** 08 の行（項目・参照シート・参照列）。参照先は生成時と検査時に LEDGER_SHEETS に実在するかを確かめる */
export const LEDGER_CHECKLIST_ITEMS: readonly { item: string; sheet: string; columns: readonly string[] }[] = [
  { item: '運転開始日', sheet: N.equipment, columns: ['運転開始日'] },
  { item: '竣工日', sheet: N.equipment, columns: ['竣工日'] },
  { item: '定格出力', sheet: N.equipment, columns: ['定格出力(MW)'] },
  { item: '定格容量', sheet: N.equipment, columns: ['定格容量(MWh)'] },
  { item: 'セルのメーカー・型式・化学', sheet: N.equipment, columns: ['セルメーカー', 'セル型式', 'セル化学'] },
  { item: 'PCS のメーカー・型式・台数', sheet: N.equipment, columns: ['PCSメーカー', 'PCS型式', 'PCS台数'] },
  { item: '製品保証の期間', sheet: N.equipment, columns: ['製品保証(年)'] },
  { item: '容量保証の割合と期間', sheet: N.equipment, columns: ['容量保証(%)', '容量保証の年数(年)'] },
  { item: '容量保証の条件', sheet: N.equipment, columns: ['容量保証の条件（SOH等）'] },
  { item: '直近の SOH', sheet: N.monthly, columns: ['SOH(%)'] },
  { item: 'アグリゲーター契約の残期間', sheet: N.contract, columns: ['契約終了日'] },
  { item: 'アグリゲーター契約の解約条件', sheet: N.contract, columns: ['解約条件（通知期間）'] },
  { item: 'アグリゲーター手数料の型', sheet: N.contract, columns: ['手数料の型'] },
  { item: 'データ引継ぎ条項', sheet: N.contract, columns: ['データ引継ぎ条項（有/無/不明）'] },
  { item: '直近 12 か月の合計収益', sheet: N.monthly, columns: ['合計収益(円)'] },
  { item: '直近 12 か月の約定率', sheet: N.monthly, columns: ['約定率(%)'] },
  { item: '直近 12 か月の稼働可能率', sheet: N.monthly, columns: ['稼働可能率(%)'] },
  { item: '直近 12 か月の停止日数', sheet: N.monthly, columns: ['停止日数(日)'] },
  { item: '直近 12 か月の営業利益', sheet: N.monthly, columns: ['営業利益(円)'] },
  { item: 'インシデントの記録', sheet: N.incident, columns: ['日付', '種別', '概要'] },
  { item: '火災保険の満期日', sheet: N.contract, columns: ['火災保険 満期日'] },
  { item: '事業中断（利益）保険の満期日', sheet: N.contract, columns: ['事業中断（利益）保険 満期日'] },
  { item: '賠償責任保険の満期日', sheet: N.contract, columns: ['賠償責任保険 満期日'] },
  { item: 'O&M 契約の範囲と終了日', sheet: N.contract, columns: ['O&M契約 範囲', 'O&M契約 終了日'] },
  { item: '接続契約の相手と契約日', sheet: N.contract, columns: ['接続契約 電力会社', '接続契約 契約日'] },
  { item: '契約容量', sheet: N.site, columns: ['契約容量(kW)'] },
  { item: 'N-1電制の対象', sheet: N.site, columns: ['N-1電制の対象（有/無/不明）'] },
  { item: 'ノンファーム接続', sheet: N.site, columns: ['ノンファーム接続（有/無）'] },
  { item: '土地の権利と契約終了日', sheet: N.site, columns: ['土地（所有/賃借/その他）', '土地契約の終了日'] },
  { item: '発電事業の届出', sheet: N.site, columns: ['発電事業届出（有/無）', '発電事業届出の日付'] },
  { item: '消防の届出・許可', sheet: N.site, columns: ['消防 届出/許可の種別', '消防 届出/許可の日付'] },
  { item: '許認可・契約書類の所在', sheet: N.documents, columns: ['書類名', '保管場所'] },
  { item: '借入の条件', sheet: N.finance, columns: ['借入額(円)', '金利(%)', '返済期間(年)', '担保'] },
  { item: 'DSCR 条件', sheet: N.finance, columns: ['DSCR 条件'] },
  { item: '補助金の処分制限', sheet: N.finance, columns: ['補助金 処分制限期間', '補助金 処分制限の終了日'] },
];

/** 全データシート（README を除く）。記録用シート（01〜07）に 08 を足した順 */
export function ledgerDataSheets(): readonly LedgerSheet[] {
  return [...LEDGER_SHEETS, LEDGER_CHECKLIST_SHEET];
}

/** xlsx のシート数（README を含む） */
export function ledgerSheetCount(): number {
  return ledgerDataSheets().length + 1;
}

/** 記録用シートの短い名前（「サイト基本・設備・…」。説明文に並べる用） */
export function ledgerSheetLabels(): string {
  return LEDGER_SHEETS.map((s) => s.name.replace(/^\d+_/, '')).join('・');
}

/** 各シートの A1（シート名と版） */
export function ledgerSheetTitle(sheetName: string): string {
  return `${sheetName} — ${LEDGER_TITLE} v${LEDGER_VERSION}（${LEDGER_RELEASED}）`;
}

/** 列番号（1 始まり）→ 列記号（A, B, …, Z, AA, …） */
export function columnLetter(n: number): string {
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

/** シート内の列名 → 列記号（無ければ null） */
export function columnLetterOf(sheetName: string, columnName: string): string | null {
  const sh = ledgerDataSheets().find((s) => s.name === sheetName);
  const i = sh ? sh.columns.findIndex((c) => c.name === columnName) : -1;
  return i < 0 ? null : columnLetter(i + 1);
}

/** 08 の「参照列」の表示（例: セルメーカー（D 列）・セル型式（E 列）） */
export function checklistColumnLabel(sheetName: string, columns: readonly string[]): string {
  return columns.map((c) => `${c}（${columnLetterOf(sheetName, c) ?? '?'} 列）`).join('・');
}

/** 数式の列（04 の合計収益・営業利益）の行 r の式。参照は列名から列記号を引く（生成と検査が同じ式を使う） */
export function formulaOf(sheet: LedgerSheet, col: LedgerColumn, r: number): string {
  const letter = (name: string) => {
    const i = sheet.columns.findIndex((c) => c.name === name);
    if (i < 0) throw new Error(`${sheet.name}／${col.name}: 数式の参照列 ${name} が無い`);
    return columnLetter(i + 1);
  };
  const f = col.formula;
  if (!f) throw new Error(`${sheet.name}／${col.name}: 数式の定義が無い`);
  if (f.kind === 'sum') {
    const refs = f.of.map((n) => `${letter(n)}${r}`).join(',');
    return `IF(COUNT(${refs})=0,"",SUM(${refs}))`;
  }
  // 合計収益が空（収益の列がすべて空）でも費用が入っていれば、収益 0 として引く（費用だけの月の損失を落とさない）
  const from = `${letter(f.from)}${r}`;
  const subs = f.subtract.map((n) => `${letter(n)}${r}`).join(',');
  return `IF(COUNT(${from},${subs})=0,"",N(${from})-SUM(${subs}))`;
}

const MONTHLY = N.monthly;
const lastFormulaRow = LEDGER_ROW.firstInput + LEDGER_FORMULA_ROWS - 1;
/** 04 の列の範囲（シート名つき＝別のシートに貼っても 04 を指す。シート名が数字で始まるので引用符で囲む） */
const letterOf04 = (col: string): string => {
  const L = columnLetterOf(MONTHLY, col);
  // README の式に「null」が入らないよう、列が無ければ読み込みの時点で止める（生成・検査・ページのどれでも気づける）
  if (!L) throw new Error(`asset-ledger-spec: README の式が参照する列 ${MONTHLY}／${col} が無い`);
  return L;
};
const ref = (col: string) => {
  const L = letterOf04(col);
  return `'${MONTHLY}'!${L}${LEDGER_ROW.firstInput}:${L}${lastFormulaRow}`;
};
/** 記録用シートの番号の範囲（例: 01〜07） */
export function ledgerRecordSheetRange(): string {
  const no = (s: LedgerSheet) => s.name.match(/^(\d+)_/)?.[1] ?? s.name;
  return `${no(LEDGER_SHEETS[0])}〜${no(LEDGER_SHEETS[LEDGER_SHEETS.length - 1])}`;
}

/** README シートの段落（各 300 字以内・生成時に検査）。行番号・列記号は定義から組み立てる（#119） */
export const LEDGER_README_PARAGRAPHS: readonly { heading: string; body: string }[] = [
  {
    heading: 'この台帳について',
    body:
      '系統用（高圧・特別高圧）蓄電所の運用の記録を、一つのファイルにまとめておくためのテンプレートです。' +
      '売却や借入の相談に備えて、運転開始日・SOH・保証・アグリゲーター契約・直近の収益と停止の記録などを一か所に揃えておけます。' +
      'アグリゲーターや O&M 事業者を替えても記録が手元に残るよう、利用者自身が持つ台帳として作りました。',
  },
  {
    heading: '使い方',
    body:
      `1 ファイルに 1 サイトを記録します。各シートの ${LEDGER_ROW.header} 行目が列名、${LEDGER_ROW.desc} 行目が説明で、${LEDGER_ROW.firstInput} 行目から入力します。` +
      '選択肢のある列はプルダウンから選びます。' +
      `${MONTHLY} の合計収益・営業利益は数式です（${LEDGER_ROW.firstInput}〜${lastFormulaRow} 行目。それより先は上の行をコピー）。`,
  },
  {
    heading: '年度の小計',
    body:
      '表の外（別のシートや右の空いた列）に、たとえば ' +
      `=SUMIFS(${ref('合計収益(円)')},${ref('年月')},">="&DATE(2025,4,1),${ref('年月')},"<"&DATE(2026,4,1)) ` +
      'のように年月で範囲を指定して足します（4 月〜翌 3 月）。営業利益も同じ形で ' +
      `${letterOf04('営業利益(円)')} 列を足します。表の中に小計の行を入れると「1 行＝1 か月」が崩れます。`,
  },
  {
    heading: 'シートの並び',
    body:
      `${ledgerRecordSheetRange()} は記録の種類ごとに ${LEDGER_SHEETS.map((s) => s.name.replace(/^\d+_/, '')).join(' → ')} の順です。` +
      `${N.checklist} は、売却や借入の相手（買い手・貸し手）が確かめそうな項目を、確かめられそうな順に当サイトが想定して並べ、` +
      '値を入れるシートと列を添えた一覧です（実際の項目と順は相手によって違うことがあります）。',
  },
  {
    heading: '参照先',
    body:
      `変電所の公表データ: ${LEDGER_SITE}/grid（${N.site} の「接続変電所（当サイト slug）」は ${LEDGER_SITE}/grid/<slug> の <slug>）。` +
      `蓄電池の火災・トラブル事例: ${LEDGER_SITE}/incidents（${N.incident} の記録の参考に）。` +
      `制度の用語: ${LEDGER_SITE}/glossary 。`,
  },
  {
    heading: '免責・データの扱い',
    body:
      '当サイト（蓄電所ネット）は、このテンプレートに入力された内容を受け取りません。ファイルは利用者の手元で使い、当サイトへ送る機能はありません（マクロも含みません）。' +
      '当サイトは資産の評価者ではなく、この台帳は評価や点数を出すものではありません。項目は例であり、法令・契約上の義務を網羅するものではありません。',
  },
];

/** README の更新履歴（最後の行が現在の版＝checklistProblems が検査） */
export const LEDGER_CHANGELOG: readonly { version: string; date: string; note: string }[] = [
  { version: '1.0', date: '2026-10', note: '初版' },
];

/** README の更新履歴の 1 行目（A 列）の表示 */
export function changelogLabel(h: { version: string; date: string }): string {
  return `v${h.version}（${h.date}）`;
}

/** 定義そのものの検査（生成時と検査時に使う）。問題の一覧を返す（空＝問題なし） */
export function checklistProblems(): string[] {
  const out: string[] = [];
  for (const it of LEDGER_CHECKLIST_ITEMS) {
    const sh = LEDGER_SHEETS.find((s) => s.name === it.sheet);
    if (!sh) {
      out.push(`08: 「${it.item}」の参照シート ${it.sheet} が無い`);
      continue;
    }
    if (it.columns.length === 0) out.push(`08: 「${it.item}」の参照列が空`);
    for (const c of it.columns) if (!sh.columns.some((x) => x.name === c)) out.push(`08: 「${it.item}」の参照列 ${it.sheet}／${c} が無い`);
  }
  for (const s of ledgerDataSheets()) {
    const names = s.columns.map((c) => c.name);
    const dup = names.filter((n, i) => names.indexOf(n) !== i);
    if (dup.length) out.push(`${s.name}: 列名が重複（${[...new Set(dup)].join('・')}）`);
    for (const c of s.columns) {
      if (c.type === 'list' && !(c.options && c.options.length)) out.push(`${s.name}／${c.name}: 選択肢が無い`);
      if (c.formula) {
        const refs = c.formula.kind === 'sum' ? c.formula.of : [c.formula.from, ...c.formula.subtract];
        for (const r of refs) if (!names.includes(r)) out.push(`${s.name}／${c.name}: 数式の参照列 ${r} が無い`);
      }
    }
  }
  const last = LEDGER_CHANGELOG[LEDGER_CHANGELOG.length - 1];
  if (!last || last.version !== LEDGER_VERSION || last.date !== LEDGER_RELEASED) {
    out.push(`更新履歴の最後の行（${last ? changelogLabel(last) : 'なし'}）が現在の版 v${LEDGER_VERSION}（${LEDGER_RELEASED}）と違う`);
  }
  for (const p of LEDGER_README_PARAGRAPHS) {
    if ([...p.body].length > 300) out.push(`README「${p.heading}」が 300 字を超える（${[...p.body].length} 字）`);
  }
  return out;
}

/** 列幅（文字数の目安）。指定が無ければ列名の長さ（全角を 2 と数える）から決める */
export function ledgerColumnWidth(c: LedgerColumn): number {
  if (c.width) return c.width;
  const w = [...c.name].reduce((n, ch) => n + (ch.charCodeAt(0) > 0xff ? 2 : 1), 0);
  return Math.min(Math.max(w + 2, 12), 30);
}

/**
 * 説明の行（LEDGER_ROW.desc）の高さ（pt）。シートで最も長い説明の推定行数から決める（説明が切れて隠れないように）。
 * 推定: 列の幅 w の画素数 ≒ w×7＋5、9pt の文字は全角 12・半角 6 画素、1 行 ≒ 12pt（Excel 未確認の概算）。
 */
export function ledgerDescRowHeight(sheet: LedgerSheet): number {
  const lines = Math.max(
    1,
    ...sheet.columns.map((c) => {
      const px = [...c.desc].reduce((n, ch) => n + (ch.charCodeAt(0) > 0xff ? 12 : 6), 0);
      return Math.ceil(px / (ledgerColumnWidth(c) * 7 + 5 - 4));
    }),
  );
  return Math.min(Math.max(48, lines * 12 + 6), 160);
}

/** README の 1 行（行番号・A〜C の文字・見た目の種類）。merge は B と C を結合する行 */
export type LedgerReadmeRow = {
  row: number;
  cells: readonly [string, string, string];
  kind: 'title' | 'paragraph' | 'tableHeader' | 'sheet' | 'sectionTitle' | 'changelog';
  merge?: boolean;
};

/** README シートの全行（生成と検査が同じ並びを使う＝#119） */
export function ledgerReadmeRows(): LedgerReadmeRow[] {
  const out: LedgerReadmeRow[] = [{ row: 1, cells: [ledgerSheetTitle('README'), '', ''], kind: 'title' }];
  let r = 3;
  for (const p of LEDGER_README_PARAGRAPHS) out.push({ row: r++, cells: [p.heading, p.body, ''], kind: 'paragraph', merge: true });
  r += 1;
  out.push({ row: r++, cells: ['シート', '内容', '1 行の単位'], kind: 'tableHeader' });
  for (const s of ledgerDataSheets()) out.push({ row: r++, cells: [s.name, s.purpose, s.rowUnit], kind: 'sheet' });
  r += 1;
  out.push({ row: r++, cells: ['更新履歴', '', ''], kind: 'sectionTitle' });
  for (const h of LEDGER_CHANGELOG) out.push({ row: r++, cells: [changelogLabel(h), h.note, ''], kind: 'changelog' });
  return out;
}
