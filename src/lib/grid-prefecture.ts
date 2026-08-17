/**
 * src/lib/grid-prefecture.ts — Gr10（2026-08-11）
 *
 * ★是正する不具合:
 *  substations.prefecture に、都道府県ではない「系統区分・設備区分」が入っている社がある。
 *  実測（2026-08-11）:
 *    関西電力送配電 … 1,575件すべて「関西ローカル系」／ 基幹系 49件は prefecture が null
 *    沖縄電力       … 151件すべて「沖縄本島66kV系・配変」等の6区分（府県の記載なし）
 *    他8社          … 正しく都道府県が入っている
 *  この原値がそのまま「都道府県」として4か所に露出していた
 *  （/grid/prefecture の一覧・県ページの title・エリアページの都道府県別表・検索結果の行）。
 *
 * ★方針: microCMS は書き換えない。precompute と表示層の正規化だけで是正する。
 *  原値は捨てず「設備区分（facilityClass）」として保持し、表示先を都道府県から移すだけ。
 *
 * ★府県を推測で振らないこと:
 *  - 沖縄電力の供給区域は**沖縄県のみ**（定義）なので、沖縄エリア151件は沖縄県としてよい。
 *  - 関西電力送配電の供給区域は2府4県＋福井・岐阜・三重の一部にまたがるため、
 *    単一府県に割り当てられない。→ 府県ページは作らず、エリアページへ 301 する。
 */

/** 実在する47都道府県 */
export const REAL_PREFECTURES: ReadonlySet<string> = new Set([
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
]);

export function isRealPrefecture(value: string | null | undefined): boolean {
  return !!value && REAL_PREFECTURES.has(value.trim());
}

/**
 * 府県の記載も設備区分の記載も無いレコードに与える設備区分（案B・2026-08-17）。
 * 各社の公表ファイルの語彙に合わせて「基幹系統」とする。
 *
 * ★microCMS には書き戻さない（案A不採用）。prefecture へ系統区分を書くのは
 *   Gr10「系統区分を都道府県として扱っていた不具合を是正」に逆行するため、
 *   専用列である facilityClass 側に持たせる（関西1,575・沖縄151と同じ扱い）。
 *
 * ★導出条件は「prefecture が確定しない かつ 原値が無い」ことのみ。
 *   - slug（-kikan-）に依存させない: 命名が揃っていない社（中部 cb-*）を取りこぼす
 *   - 電圧階級に依存させない: 東京の275kV系など実在の県を持つ設備を誤分類する
 *   - 原値がある関西「関西ローカル系」等は原値のまま（上書きしない）
 */
export const KIKAN_FACILITY_CLASS = '基幹系統';

export type NormalizedPlace = {
  /** 都道府県（確定できないときは null。**推測で埋めない**） */
  prefecture: string | null;
  /** 原値のうち都道府県でなかったもの＝設備区分（「関西ローカル系」「沖縄本島66kV系・配変」等） */
  facilityClass: string | null;
};

/**
 * 変電所レコードの「府県らしき原値」と「エリア」から、都道府県と設備区分を分離する。
 * 原値が実在の都道府県ならそのまま。そうでなければ設備区分として退避する。
 */
export function normalizeSubstationPlace(
  rawPrefecture: string | null | undefined,
  area: string | null | undefined
): NormalizedPlace {
  const raw = (rawPrefecture ?? '').trim();
  const ar = (area ?? '').trim();

  if (isRealPrefecture(raw)) return { prefecture: raw, facilityClass: null };

  // 沖縄電力の供給区域は沖縄県のみ（定義であって推測ではない）
  if (ar === '沖縄') return { prefecture: '沖縄県', facilityClass: raw || null };

  // 関西ローカル系など、府県は確定できないが原値のある設備区分（原値を優先・上書きしない）
  if (raw) return { prefecture: null, facilityClass: raw };

  // 府県も設備区分も記載が無いもの ＝ 各社の基幹系統ファイル由来（2026-08-17 実測 222件・7社）
  return { prefecture: null, facilityClass: KIKAN_FACILITY_CLASS };
}

/* ------------------------------------------------------------------ *
 * 旧URL → 新URL の 301（削除はしない・既存方針）
 * ------------------------------------------------------------------ */

/** 沖縄の6設備区分 → 沖縄県ページ／関西ローカル系 → 関西エリアページ */
export const GRID_PREFECTURE_301: Record<string, string> = {
  '/grid/prefecture/沖縄本島66kV系・配変': '/grid/prefecture/沖縄県',
  '/grid/prefecture/沖縄本島66kV系・変電所': '/grid/prefecture/沖縄県',
  '/grid/prefecture/沖縄本島22kV系・配変': '/grid/prefecture/沖縄県',
  '/grid/prefecture/沖縄本島22kV系・変電所': '/grid/prefecture/沖縄県',
  '/grid/prefecture/沖縄離島・配変': '/grid/prefecture/沖縄県',
  '/grid/prefecture/沖縄離島・変電所': '/grid/prefecture/沖縄県',
  // 関西は単一府県に割り当てられないため、エリアページ（上位互換）へ
  '/grid/prefecture/関西ローカル系': '/grid/kansai',
};

/* ------------------------------------------------------------------ *
 * 検索の救済（実際に起こる検索を行き止まりにしない）
 * ------------------------------------------------------------------ */

/** 関西電力送配電の供給区域にあたる府県（公表データに府県の記載がない） */
export const KANSAI_PREFECTURES: ReadonlySet<string> = new Set([
  '大阪府', '京都府', '兵庫県', '奈良県', '和歌山県', '滋賀県',
]);

export const KANSAI_NO_PREFECTURE_NOTE =
  '関西電力送配電の公表データには変電所の府県の記載がないため、府県別のページはありません。エリア全体、または名称・電圧・空容量でお探しください。';

/**
 * 検索の area パラメータを、実際に絞り込める値へ寄せる。
 * 例: 大阪府 → 関西（府県の記載が無いのでエリア全体）／沖縄県 → 沖縄
 */
export function rescueAreaParam(
  value: string
): { area: string; note: string } | null {
  const v = (value ?? '').trim();
  if (KANSAI_PREFECTURES.has(v)) {
    return {
      area: '関西',
      note: `関西電力送配電の公表データには変電所の府県の記載がありません。${v}を含む関西エリア全体を表示します。`,
    };
  }
  if (v === '沖縄県') {
    return { area: '沖縄', note: '沖縄県の変電所は沖縄エリアとして収録しています。' };
  }
  return null;
}
