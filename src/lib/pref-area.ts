/**
 * src/lib/pref-area.ts — 都道府県 → 一般送配電の供給エリア（10）の共通ヘルパ（売買事例の一覧便・2026-11-10）
 *
 * - 値は /grid のページの対応表（src/app/grid/page.tsx の PREFECTURE_TO_AREA・40 都道府県）と同じ。
 *   そこに無い関西の 6 府県と沖縄県を足して 47 にした。/grid のページの表はこの便では触らない（中身を同じにするだけ）。
 * - 県の中で供給エリアが 2 社以上に分かれる県（SPLIT_PREFS）は、県だけではエリアを決めない（null を返す）。
 *   その県の行は、一次の所在地（市区町村）から手で areas を付ける。付いていなければ scripts/verify-deals.ts が警告する。
 *   分かれる県は、各社の託送供給等約款の供給区域の条で確かめた（SPLIT_PREFS のコメント）。
 */

export type AreaKey =
  | 'hokkaido' | 'tohoku' | 'tokyo' | 'chubu' | 'hokuriku' | 'kansai' | 'chugoku' | 'shikoku' | 'kyushu' | 'okinawa';

/** 表示の順（北から）。URL の鍵は /grid/[area] の slug とそろえる */
export const AREA_ORDER: readonly AreaKey[] = [
  'hokkaido', 'tohoku', 'tokyo', 'chubu', 'hokuriku', 'kansai', 'chugoku', 'shikoku', 'kyushu', 'okinawa',
];

export const AREA_LABEL: Record<AreaKey, string> = {
  hokkaido: '北海道',
  tohoku: '東北',
  tokyo: '東京',
  chubu: '中部',
  hokuriku: '北陸',
  kansai: '関西',
  chugoku: '中国',
  shikoku: '四国',
  kyushu: '九州',
  okinawa: '沖縄',
};

export const PREF_TO_AREA: Readonly<Record<string, AreaKey>> = {
  北海道: 'hokkaido',
  青森県: 'tohoku', 岩手県: 'tohoku', 秋田県: 'tohoku', 宮城県: 'tohoku', 山形県: 'tohoku', 福島県: 'tohoku', 新潟県: 'tohoku',
  東京都: 'tokyo', 神奈川県: 'tokyo', 埼玉県: 'tokyo', 千葉県: 'tokyo', 茨城県: 'tokyo', 群馬県: 'tokyo', 栃木県: 'tokyo', 山梨県: 'tokyo',
  愛知県: 'chubu', 静岡県: 'chubu', 三重県: 'chubu', 岐阜県: 'chubu', 長野県: 'chubu',
  富山県: 'hokuriku', 石川県: 'hokuriku', 福井県: 'hokuriku',
  大阪府: 'kansai', 京都府: 'kansai', 兵庫県: 'kansai', 奈良県: 'kansai', 和歌山県: 'kansai', 滋賀県: 'kansai',
  鳥取県: 'chugoku', 島根県: 'chugoku', 岡山県: 'chugoku', 広島県: 'chugoku', 山口県: 'chugoku',
  香川県: 'shikoku', 愛媛県: 'shikoku', 徳島県: 'shikoku', 高知県: 'shikoku',
  福岡県: 'kyushu', 佐賀県: 'kyushu', 長崎県: 'kyushu', 大分県: 'kyushu', 熊本県: 'kyushu', 宮崎県: 'kyushu', 鹿児島県: 'kyushu',
  沖縄県: 'okinawa',
};

/**
 * 県の中で供給エリアが分かれる県。10 社の託送供給等約款「Ⅰ総則 1 適用」の「当社の供給区域（…）」で確かめた
 * （2026-11-10 取得・2026 年 10 月〜11 月実施の版）。市区町村の単位の境目は、どの社の約款にも書かれていない
 * （静岡県だけ「富士川」の名前がある）。
 */
export const SPLIT_PREFS: ReadonlySet<string> = new Set<string>(['静岡県', '岐阜県', '三重県', '福井県', '兵庫県', '香川県', '愛媛県']);

/** 分かれる県の各社の書きぶり（約款の逐語）。verify-deals と報告で使う */
export const SPLIT_PREF_NOTES: Readonly<Record<string, string>> = {
  静岡県: '東京電力パワーグリッド「静岡県〔富士川以東〕」／中部電力パワーグリッド「静岡県〔富士川以西〕」',
  岐阜県: '中部電力パワーグリッド「岐阜県〔一部を除きます。〕」／北陸電力送配電「岐阜県の一部」／関西電力送配電「岐阜県の一部」',
  三重県: '中部電力パワーグリッド「三重県〔一部を除きます。〕」／関西電力送配電「三重県の一部」',
  福井県: '北陸電力送配電「福井県〔一部を除きます。〕」／関西電力送配電「福井県の一部」',
  兵庫県: '関西電力送配電「兵庫県〔一部を除きます。〕」／中国電力ネットワーク「兵庫県の一部」',
  香川県: '四国電力送配電「香川県〔一部を除きます｡〕」／中国電力ネットワーク「香川県の一部」',
  愛媛県: '四国電力送配電「愛媛県〔一部を除きます｡〕」／中国電力ネットワーク「愛媛県の一部」',
};

/**
 * 県名からエリアを出す。県が分かれる県・知らない県は null（手で areas を付ける）。
 * 県名は「〇〇県」「東京都」「大阪府」「京都府」「北海道」の正式な形で渡す。
 */
export function areaOfPref(pref: string): AreaKey | null {
  if (!pref || SPLIT_PREFS.has(pref)) return null;
  return PREF_TO_AREA[pref] ?? null;
}
