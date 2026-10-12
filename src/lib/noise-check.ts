/**
 * src/lib/noise-check.ts — 騒音・離隔の目安チェッカー（/tools/noise-check）の計算と、法令・告示から写した定数（T5 騒音便・2026-10-12）
 *
 * - 計算は純関数だけ（入力は画面の中だけで使い、保存も送信もしない）。
 * - 焼き込む数値は告示の範囲（NOTICE_RANGES）と施行令 別表第一 第二号の出力要件（7.5kW）だけ。自治体ごとの値は持たない（確認先へ）。
 * - 距離減衰は点音源の L(d) = L(r0) − 20 log10(d / r0)、合成は 10 log10 Σ 10^(Li/10)、同じ音源 n 台は合成の式から +10 log10(n)。
 *   一次: 宮城県「騒音の尺度」・国総研資料第714号 4.2（解説4.2.13・4.2.14）・厚生労働省 基発0420第2号 別紙4（ページの出典欄）。
 *   「倍距離で約 6 dB」「2 台で約 +3 dB」は式から導いた値（20 log10 2・10 log10 2）。
 * - 地表面・空気吸収・反射・指向性・音源の位置の違いは入れない。吸収を入れないぶんは大きめに出るが、反射は実際の値を大きくしうるので
 *   「安全側」とは言い切らない（画面にもそう書く）。防音壁は利用者が設計値を入れる欄だけ。
 */

/** 機器の種類（自由記述は出さない） */
export type NoiseSourceKind = 'pcs' | 'transformer' | 'aircon' | 'fan' | 'compressor' | 'other';

export const NOISE_SOURCE_KINDS: readonly { key: NoiseSourceKind; label: string; short: string }[] = [
  { key: 'pcs', label: 'PCS（パワーコンディショナ）', short: 'PCS' },
  { key: 'transformer', label: '変圧器', short: '変圧器' },
  { key: 'aircon', label: '空調（室外機）', short: '空調の室外機' },
  { key: 'fan', label: '送風機', short: '送風機' },
  { key: 'compressor', label: '空気圧縮機', short: '空気圧縮機' },
  { key: 'other', label: 'その他', short: 'その他' },
];

export const MAX_SOURCE_ROWS = 10;

/**
 * 入力として受け付ける範囲（当サイトの扱い）。これを外れた値は計算に入れない（桁あふれ・取り違えを防ぐ）。
 * 騒音レベル 0〜200 dB・測定距離 0.01〜10,000 m・台数 1〜1,000 の整数・受音点まで 0 より大きく 100,000 m 以下・減衰量 0〜60 dB。
 */
export const INPUT_LIMITS = {
  level: { min: 0, max: 200 },
  r0: { min: 0.01, max: 10000 },
  count: { min: 1, max: 1000 },
  distance: { min: 0, max: 100000 },
  barrier: { min: 0, max: 60 },
  motorKw: { min: 0, max: 100000 },
} as const;

/** 入力の 1 行（空欄・読めない値は null） */
export interface NoiseSourceRow {
  kind: NoiseSourceKind;
  count: number | null;
  /** 1 台の騒音レベル L（dB・メーカー仕様や測定記録の値） */
  level: number | null;
  /** その値の測定距離 r0（m） */
  r0: number | null;
  /** 1 台の原動機の定格出力（kW・特定施設の注記用・任意） */
  motorKw: number | null;
}

/** 区域の区分（告示 第一条第2項） */
export type NoticeZone = 'zone1' | 'zone2' | 'zone3' | 'zone4';
/** 時間の区分（告示 第一条第1項の表の列。朝と夕は 1 つの列） */
export type NoticePeriod = 'day' | 'morningEvening' | 'night';

export const NOTICE_ZONES: readonly { key: NoticeZone; label: string; definition: string }[] = Object.freeze([
  // 告示 第一条第2項 第一〜四号の逐語（環境省 法令・告示・通達 https://www.env.go.jp/hourei/07/000052.html・2026-10-12 取得）
  { key: 'zone1', label: '第一種区域', definition: '良好な住居の環境を保全するため、特に静穏の保持を必要とする区域' },
  { key: 'zone2', label: '第二種区域', definition: '住居の用に供されているため、静穏の保持を必要とする区域' },
  { key: 'zone3', label: '第三種区域', definition: '住居の用にあわせて商業、工業等の用に供されている区域であつて、その区域内の住民の生活環境を保全するため、騒音の発生を防止する必要がある区域' },
  { key: 'zone4', label: '第四種区域', definition: '主として工業等の用に供されている区域であつて、その区域内の住民の生活環境を悪化させないため、著しい騒音の発生を防止する必要がある区域' },
] as const);

export const NOTICE_PERIODS: readonly { key: NoticePeriod; label: string; hours: string }[] = Object.freeze([
  // 告示 備考1 の時刻の候補（どれを採るかは都道府県知事・市長が定める）
  { key: 'day', label: '昼間', hours: '午前七時又は八時から午後六時、七時又は八時まで' },
  { key: 'morningEvening', label: '朝・夕', hours: '朝は午前五時又は六時から午前七時又は八時まで、夕は午後六時、七時又は八時から午後九時、十時又は十一時まで' },
  { key: 'night', label: '夜間', hours: '午後九時、十時又は十一時から翌日の午前五時又は六時まで' },
] as const);

type Cell = { readonly min: number; readonly max: number; readonly verbatim: string };
const cell = (min: number, max: number, verbatim: string): Cell => Object.freeze({ min, max, verbatim });

/**
 * 告示「特定工場等において発生する騒音の規制に関する基準」（昭和43年 厚生省・農林省・通商産業省・運輸省告示第1号）第一条第1項の表。
 * 出典: 環境省 法令・告示・通達 https://www.env.go.jp/hourei/07/000052.html（HTTP 200・49,180 バイト・2026-10-12 16:14 JST 取得・
 *   ページの表を HTML から機械的に抜いた。e-Gov には収録なし）。verbatim は表のセルの逐語、min／max はそれを数字にしたもの。単位はデシベル。
 *   verify-noise-check.ts が、取得時の 12 セルの写し（位置順）・漢数字の逐語と数字の一致を検査し、--fetch で一次と照合する。
 * 都道府県知事（市の区域内は市長）がこの範囲内で規制基準を定める（騒音規制法 第3条第1項・第4条第1項）。
 */
export const NOTICE_RANGES: Readonly<Record<NoticeZone, Readonly<Record<NoticePeriod, Cell>>>> = Object.freeze({
  zone1: Object.freeze({
    day: cell(45, 50, '四十五デシベル以上／五十デシベル以下'),
    morningEvening: cell(40, 45, '四十デシベル以上／四十五デシベル以下'),
    night: cell(40, 45, '四十デシベル以上／四十五デシベル以下'),
  }),
  zone2: Object.freeze({
    day: cell(50, 60, '五十デシベル以上／六十デシベル以下'),
    morningEvening: cell(45, 50, '四十五デシベル以上／五十デシベル以下'),
    night: cell(40, 50, '四十デシベル以上／五十デシベル以下'),
  }),
  zone3: Object.freeze({
    day: cell(60, 65, '六十デシベル以上／六十五デシベル以下'),
    morningEvening: cell(55, 65, '五十五デシベル以上／六十五デシベル以下'),
    night: cell(50, 55, '五十デシベル以上／五十五デシベル以下'),
  }),
  zone4: Object.freeze({
    day: cell(65, 70, '六十五デシベル以上／七十デシベル以下'),
    morningEvening: cell(60, 70, '六十デシベル以上／七十デシベル以下'),
    night: cell(55, 65, '五十五デシベル以上／六十五デシベル以下'),
  }),
});

/** 告示 第一条第1項ただし書: 第二種〜第四種区域の学校・病院等の周囲おおむね 50m では、定める値から 5 デシベルを減じた値まで下げられる */
export const SCHOOL_PROVISO_DB = 5;
export const SCHOOL_PROVISO_ZONES: readonly NoticeZone[] = Object.freeze(['zone2', 'zone3', 'zone4'] as NoticeZone[]);

/** 騒音規制法施行令 別表第一 第二号の出力要件（原動機の定格出力が七・五キロワット以上） */
export const SPECIFIED_FACILITY_MOTOR_KW = 7.5;
/**
 * 騒音規制法施行令 別表第一 第二号の逐語（e-Gov 343CO0000000324・2026-10-12 取得）を、空気圧縮機と送風機に分けたもの。
 * 号の全文は ITEM2_COMPRESSOR_VERBATIM + '及び' + ITEM2_FAN_VERBATIM（verify-noise-check.ts --fetch が一次と照合）。
 */
export const ITEM2_COMPRESSOR_VERBATIM = '空気圧縮機（一定の限度を超える大きさの騒音を発生しないものとして環境大臣が指定するものを除き、原動機の定格出力が七・五キロワット以上のものに限る。）';
export const ITEM2_FAN_VERBATIM = '送風機（原動機の定格出力が七・五キロワット以上のものに限る。）';

const isNum = (v: number | null | undefined): v is number => typeof v === 'number' && Number.isFinite(v);
const within = (v: number | null | undefined, lim: { min: number; max: number }) => isNum(v) && v >= lim.min && v <= lim.max;

/** 1 行が計算に使えるか（台数は 1 以上の整数・騒音レベルと測定距離が受け付ける範囲の数） */
export function isUsableRow(r: NoiseSourceRow): boolean {
  return isNum(r.count) && Number.isInteger(r.count) && within(r.count, INPUT_LIMITS.count) && within(r.level, INPUT_LIMITS.level) && within(r.r0, INPUT_LIMITS.r0);
}

/** 受音点までの距離として使えるか（0 より大きく上限以下） */
export const isUsableDistance = (d: number | null): d is number => isNum(d) && d > INPUT_LIMITS.distance.min && d <= INPUT_LIMITS.distance.max;

/** 減衰量: 空欄は 0。受け付ける範囲（0〜60 dB）を外れた値は使わない（usable=false で 0 として計算） */
export function barrierValue(b: number | null): { value: number; usable: boolean } {
  if (b === null) return { value: 0, usable: true };
  return within(b, INPUT_LIMITS.barrier) ? { value: b, usable: true } : { value: 0, usable: false };
}

/** 距離 d での 1 台のレベル: L − 20 log10(d / r0)（d > 0・r0 > 0） */
export function levelAtDistance(level: number, r0: number, d: number): number {
  return level - 20 * Math.log10(d / r0);
}

/** 同じ音源 n 台のレベル: L + 10 log10(n)（合成の式を同じ値 n 個に当てたもの） */
export function levelForCount(level: number, n: number): number {
  return level + 10 * Math.log10(n);
}

/** レベルの合成: 10 log10 Σ 10^(Li/10)（桁あふれしないよう最大値を引いてから足す）。空・有限でない値を含むなら null */
export function combineLevels(levels: readonly number[]): number | null {
  if (levels.length === 0 || !levels.every((l) => Number.isFinite(l))) return null;
  const top = Math.max(...levels);
  let sum = 0;
  for (const l of levels) sum += Math.pow(10, (l - top) / 10);
  const v = top + 10 * Math.log10(sum);
  return Number.isFinite(v) ? v : null;
}

/**
 * 距離に依らない定数 K（dB）: 受音点のレベルは K − 20 log10(d)。
 * 各行 Li' = L + 20 log10(r0) + 10 log10(n) を合成し、減衰量を引いたもの。使える行が無ければ null。
 */
export function distanceConstant(rows: readonly NoiseSourceRow[], barrierDb: number | null): number | null {
  const ks = rows.filter(isUsableRow).map((r) => levelForCount((r.level as number) + 20 * Math.log10(r.r0 as number), r.count as number));
  const k = combineLevels(ks);
  return k === null ? null : k - barrierValue(barrierDb).value;
}

/** 受音点（距離 d）の合成レベル。d が使えない・使える行が無いときは null */
export function receiverLevel(rows: readonly NoiseSourceRow[], d: number | null, barrierDb: number | null): number | null {
  if (!isUsableDistance(d)) return null;
  const k = distanceConstant(rows, barrierDb);
  if (k === null) return null;
  const v = k - 20 * Math.log10(d);
  return Number.isFinite(v) ? v : null;
}

/** 合成レベルが target（dB）まで下がる距離（m）: 10^((K − target) / 20)。求められなければ null */
export function distanceForLevel(rows: readonly NoiseSourceRow[], barrierDb: number | null, target: number): number | null {
  const k = distanceConstant(rows, barrierDb);
  if (k === null || !isNum(target)) return null;
  const d = Math.pow(10, (k - target) / 20);
  return Number.isFinite(d) && d > 0 ? d : null;
}

/** 計算に入れた行のうち最も大きい測定距離 r0（m）。無ければ null */
export function maxMeasurementDistance(rows: readonly NoiseSourceRow[]): number | null {
  const r0s = rows.filter(isUsableRow).map((r) => r.r0 as number);
  return r0s.length ? Math.max(...r0s) : null;
}

/** 距離 d が、計算に入れたどれかの行の測定距離 r0 より近い（式の前提の外）か。d が使えないときは false */
export function insideMeasurementDistance(rows: readonly NoiseSourceRow[], d: number | null): boolean {
  if (!isUsableDistance(d)) return false;
  const m = maxMeasurementDistance(rows);
  return m !== null && d < m;
}

/** 表示の丸め（0.1 dB）。区分の判定も丸めた値で行う（表示と判定を食い違わせない） */
export const roundDb = (v: number): number => Math.round(v * 10) / 10;

export type RangeBand = 'belowMin' | 'withinRange' | 'aboveMax';
export const RANGE_BAND_LABEL: Readonly<Record<RangeBand, string>> = Object.freeze({
  belowMin: '範囲の下限未満',
  withinRange: '範囲内（自治体の値による）',
  aboveMax: '範囲の上限超',
});
/** 3 区分の意味（画面の結果の欄に出す） */
export const RANGE_BAND_MEANING: Readonly<Record<RangeBand, string>> = Object.freeze({
  belowMin: '告示の範囲でいちばん厳しい値（下限）も下回っています。条例の別の基準や、測り方の違いは扱っていません。',
  withinRange: '告示の範囲の中にあります。自治体が定めた値によって、上回ることも下回ることもあります。',
  aboveMax: '告示の範囲でいちばん緩い値（上限）も上回っています。',
});

/** 告示の範囲（区域 × 時間）。ただし書（学校・病院等の周囲おおむね 50m）を選ぶと、第二〜四種区域は下限を 5 デシベル下げる */
export function noticeRange(zone: NoticeZone, period: NoticePeriod, schoolProviso: boolean): { min: number; max: number; provisoApplied: boolean } {
  const r = NOTICE_RANGES[zone][period];
  const applied = schoolProviso && SCHOOL_PROVISO_ZONES.includes(zone);
  return { min: applied ? r.min - SCHOOL_PROVISO_DB : r.min, max: r.max, provisoApplied: applied };
}

/** 合成レベル（丸めた値）を告示の範囲と比べる（合否ではなく、範囲のどこにあるか）。有限でなければ null */
export function classifyAgainstRange(level: number, range: { min: number; max: number }): RangeBand | null {
  if (!Number.isFinite(level)) return null;
  const v = roundDb(level);
  if (v < range.min) return 'belowMin';
  if (v > range.max) return 'aboveMax';
  return 'withinRange';
}

export type FacilityNote = {
  rowIndex: number;
  kind: NoiseSourceKind;
  /** 'possible' = 施行令 別表第一 第二号の語と出力要件に当たりうる／'needKw' = 出力が分からない／'belowKw' = 出力が 7.5kW 未満／'notListed' = 別表第一に語が無い／'unclear' = 語だけでは決まらない */
  status: 'possible' | 'needKw' | 'belowKw' | 'notListed' | 'unclear';
  text: string;
};

/** 行に何か入力があるか（台数の既定 1 と種類の既定だけの行には注記を出さない） */
const hasInput = (r: NoiseSourceRow) => r.level !== null || r.r0 !== null || r.motorKw !== null;

/** 特定施設（施行令 別表第一）の注記。当たる・当たらないの断定はしない（条文の語で示す） */
export function specifiedFacilityNotes(rows: readonly NoiseSourceRow[]): FacilityNote[] {
  const notes: FacilityNote[] = [];
  rows.forEach((r, i) => {
    if (!hasInput(r)) return;
    if (r.count !== null && !(Number.isInteger(r.count) && r.count >= 1)) return;
    const short = NOISE_SOURCE_KINDS.find((k) => k.key === r.kind)?.short ?? '';
    const head = `音源 ${i + 1}（${short}`;
    const fanNote = `が第二号の「${ITEM2_FAN_VERBATIM}」に当たるかは、条文の語だけでは決まりません。確認先は所在地の市町村（特別区）です。`;
    if (r.kind === 'fan' || r.kind === 'compressor') {
      // 施行令 別表第一 第二号の逐語（令和三年政令第三百四十六号による改正後）を、機器ごとに分けて引く
      const verbatim = r.kind === 'fan' ? ITEM2_FAN_VERBATIM : ITEM2_COMPRESSOR_VERBATIM;
      if (!isNum(r.motorKw) || r.motorKw <= 0 || r.motorKw > INPUT_LIMITS.motorKw.max) {
        notes.push({ rowIndex: i, kind: r.kind, status: 'needKw', text: `${head}）: 施行令 別表第一 第二号は「${verbatim}」です。1 台の原動機の定格出力を入れると、出力要件（七・五キロワット以上）に当たるかを示します。` });
      } else if (r.motorKw >= SPECIFIED_FACILITY_MOTOR_KW) {
        const exclusion = r.kind === 'compressor' ? '環境大臣が指定するもの（一定の限度を超える大きさの騒音を発生しないもの）に当たるかは、機器ごとに確かめてください。' : '';
        notes.push({ rowIndex: i, kind: r.kind, status: 'possible', text: `${head}・原動機 ${r.motorKw}kW）: 施行令 別表第一 第二号の「${verbatim}」の語と出力要件に当たります。騒音規制法の特定施設に当たる可能性があります。${exclusion}` });
      } else {
        notes.push({ rowIndex: i, kind: r.kind, status: 'belowKw', text: `${head}・原動機 ${r.motorKw}kW）: 1 台の原動機の定格出力が七・五キロワット未満で、施行令 別表第一 第二号の出力要件（七・五キロワット以上）を満たしません。自治体の条例で別に対象にしていることがあります。` });
      }
    } else if (r.kind === 'aircon') {
      notes.push({ rowIndex: i, kind: r.kind, status: 'unclear', text: `${head}）: 施行令 別表第一に「空気調和」「冷凍機」の語はありません。室外機の中の送風機など${fanNote}` });
    } else if (r.kind === 'pcs') {
      notes.push({ rowIndex: i, kind: r.kind, status: 'notListed', text: `${head}）: 別表第一に無い機器です（施行令 別表第一に「パワーコンディショナ」の語はありません）。PCS やコンテナの冷却ファンなど${fanNote}自治体の条例で別に対象にしていることもあります。` });
    } else if (r.kind === 'transformer') {
      notes.push({ rowIndex: i, kind: r.kind, status: 'notListed', text: `${head}）: 別表第一に無い機器です（施行令 別表第一に「変圧器」の語はありません）。冷却ファンなど${fanNote}自治体の条例で別に対象にしていることもあります。` });
    } else {
      notes.push({ rowIndex: i, kind: r.kind, status: 'unclear', text: `${head}）: 施行令 別表第一（全 11 号）のどれかに当たるかを、機器の種類と 1 台の原動機の定格出力で確かめてください。確認先は所在地の市町村（特別区）です。` });
    }
  });
  return notes;
}

export const EMPTY_ROW: NoiseSourceRow = Object.freeze({ kind: 'pcs', count: 1, level: null, r0: null, motorKw: null }) as NoiseSourceRow;

/**
 * 出典欄（ページの article-sources）。name は台帳 src/data/source-documents.json の name と同じ表記
 * （verify-noise-check.ts が台帳にあることを検査する。ソースに「」を直接書かないので verify:source-names の静的検査には掛からない）。
 */
export const NOISE_SOURCES: readonly { publisher: string; name: string; href: string; detail: string }[] = [
  { publisher: 'e-Gov 法令検索', name: '騒音規制法', href: 'https://laws.e-gov.go.jp/law/343AC0000000098', detail: '（昭和四十三年法律第九十八号）第2条・第3条・第4条・第5条・第6条・第8条・第21条' },
  { publisher: 'e-Gov 法令検索', name: '騒音規制法施行令', href: 'https://laws.e-gov.go.jp/law/343CO0000000324', detail: '（昭和四十三年政令第三百二十四号）第1条・別表第一' },
  { publisher: '環境省 法令・告示・通達', name: '特定工場等において発生する騒音の規制に関する基準', href: 'https://www.env.go.jp/hourei/07/000052.html', detail: '（昭和43年 厚生省・農林省・通商産業省・運輸省告示第1号）第一条（表・ただし書・備考1）・第二条' },
  { publisher: '宮城県', name: '騒音の尺度', href: 'https://www.pref.miyagi.jp/documents/13403/95295.pdf', detail: '（騒音レベルの和とその表・騒音レベルの距離減衰（点音源の場合））' },
  { publisher: '国土技術政策総合研究所 国総研資料 第714号', name: '道路環境影響評価の技術手法（平成24年度版）', href: 'https://www.nilim.go.jp/lab/bcg/siryou/tnn/tnn0714.htm', detail: '4.2 建設機械の稼働に係る騒音（解説4.2.13 の合成の式・解説4.2.14 の点音源の式＝2πr² で地面の上の半球に広がる形）' },
  { publisher: '厚生労働省', name: '騒音障害防止のためのガイドラインの改訂について', href: 'https://www.mhlw.go.jp/content/001089239.pdf', detail: '（基発0420第2号・令和5年4月20日）別紙4 等価騒音レベルの推計（音響パワーレベルからの距離減衰の式）' },
  { publisher: '環境省', name: '騒音規制法の概要', href: 'https://www.env.go.jp/air/noise/low-gaiyo.html', detail: '（規制のしくみ・都道府県知事等が規制基準を定めること）' },
  { publisher: '環境省', name: '騒音規制法 住みよい音環境を目指して', href: 'https://www.env.go.jp/content/000190185.pdf', detail: '（パンフレット。届出義務・Q&A：環境基準は行政上の政策目標で規制基準とは異なる・特定施設かどうかの問い合わせ先）' },
  { publisher: '環境省', name: '騒音に係る環境基準について', href: 'https://www.env.go.jp/kijun/oto1-1.html', detail: '（環境基本法第16条第1項にもとづく告示・地域の類型と時間の区分）' },
  { publisher: '東京都環境局', name: '工場・事業場等に対する騒音・振動の規制', href: 'https://www.kankyo.metro.tokyo.lg.jp/noise/noise_vibration/rules/workplace_factory', detail: '（確認先の例）' },
  { publisher: '大阪府', name: '工場・事業場の規制について', href: 'https://www.pref.osaka.lg.jp/o120080/kotsukankyo/oto/koujou.html', detail: '（確認先の例）' },
  { publisher: '総務省 公害等調整委員会', name: '公害苦情相談窓口', href: 'https://www.soumu.go.jp/kouchoi/complaint/soudan_madoguchi.html', detail: '（担当窓口を探す入口）' },
];
