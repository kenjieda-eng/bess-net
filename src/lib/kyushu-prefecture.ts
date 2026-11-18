/**
 * src/lib/kyushu-prefecture.ts — 九州電力送配電の変電所の県（九州の県の直し便・2026-11-18）
 *
 * 九州の変電所の県（microCMS の prefecture）は、最初の取込（2026-05-08）で、変電所の名前と公表の地区から当サイトが推定したもの。
 * 同社の公表資料で県が分かるのは「供給余力マップ（系統用変電所）」の県ごとの地図に名前が出る主な変電所だけ
 * （reports/kyushu-prefecture-investigation-2026-11-17.md）。対応表 src/data/kyushu-prefecture-map.json（作り直し方は表の _rebuild）:
 *   - verified（105 件）: 地図の県（一次）。収録の県と違う 4 件（武雄 3・南宮崎）は、ここで一次の県になる。
 *   - pending（70 件）: 県を出さない（確認中）。県をまたぐ地区で、名前が別の県の地名に当たるもの（国土地理院の地名検索＝手がかり・一次ではない）。
 *   - どちらにも無いもの: 収録の県を「当サイトの推定」として出す。
 * ★microCMS の prefecture は書き換えない（L-EIC-028）。表示の県は normalizeSubstationPlace の 1 か所でだけ使う（#119）。
 * ★サーバー側だけで読む（ブラウザの部品からは import しない＝対応表をブラウザに送らない）。
 * ★引くのは external_id（normalizeSubstationPlace の呼び出し側が持っている値）。表の slug と external_id の組が今のレコードと
 *   同じことは verify:kyushu-prefecture が見る（No. の振り直しで external_id が変わったら、表を作り直すまでビルドが止まる）。
 */
import mapData from '../data/kyushu-prefecture-map.json';

type Verified = { eid: string; name: string; p: string; was: string; map: number; on_map: string };
type Pending = { eid: string; name: string; was: string; district: string; other: string; hits: [number, number] };
type MapFile = {
  source: {
    primary: { name: string; publisher: string; entry: string; title_verbatim: string; asof_label: string };
    maps: Array<{ pref: string; title: string; url: string; names: string[] }>;
  };
  verified: Record<string, Verified>;
  pending: Record<string, Pending>;
  counts: { records: number; verified: number; pending: number; estimated: number; by_pref_after: Record<string, number> };
};

const MAP = mapData as unknown as MapFile;

const BY_EID = new Map<string, { slug: string; status: 'verified' | 'pending'; prefecture: string | null }>();
for (const [slug, e] of Object.entries(MAP.verified)) BY_EID.set(e.eid.normalize('NFKC').trim(), { slug, status: 'verified', prefecture: e.p });
for (const [slug, e] of Object.entries(MAP.pending)) BY_EID.set(e.eid.normalize('NFKC').trim(), { slug, status: 'pending', prefecture: null });

/** 九州の 7 県（県のページに断り書きを出す） */
export const KYUSHU_PREFECTURES: ReadonlySet<string> = new Set(['福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県']);

/** external_id から、一次で確かめた県（verified）か確認中（pending）かを引く。表に無ければ null（収録の県＝推定） */
export function kyushuPrefectureOf(
  externalId: string | null | undefined
): { status: 'verified'; prefecture: string } | { status: 'pending'; prefecture: null } | null {
  if (!externalId) return null;
  const e = BY_EID.get(externalId.normalize('NFKC').trim());
  if (!e) return null;
  return e.status === 'verified' ? { status: 'verified', prefecture: e.prefecture as string } : { status: 'pending', prefecture: null };
}

/** 件数（表から出す・焼き込まない） */
export const KYUSHU_PREFECTURE_COUNTS = MAP.counts;

/** 一次の資料（入口のページ） */
export const KYUSHU_PREFECTURE_SOURCE = MAP.source.primary;

/** /grid/kyushu と九州の 7 県のページの断り書き（初期 DOM）。件数は表から（確認中の件数は /grid/kyushu の県別の表の行に出る） */
export const KYUSHU_PREFECTURE_NOTE =
  `九州電力送配電の変電所の県は、同社の「供給余力マップ（系統用変電所）」で確かめた主な変電所（${MAP.counts.verified} 件）のほかは、` +
  '変電所の名前と公表の地区から当サイトが推定したものです。名前が別の県の地名に当たるものは、県を「確認中」としています。';

/** 詳細ページ（県が確認中のもの）の 1 文（初期 DOM） */
export const KYUSHU_PREFECTURE_PENDING_SENTENCE = 'この変電所の県は、九州電力送配電の公表資料で確かめられていないため、表示していません。';

/** 対応表の全件（検査用） */
export function kyushuPrefectureTable(): { verified: Record<string, Verified>; pending: Record<string, Pending> } {
  return { verified: MAP.verified, pending: MAP.pending };
}
