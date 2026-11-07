/**
 * src/lib/kansai-prefecture.ts — 関西電力送配電の変電所の府県（関西の府県の割り当て便・2026-11-07）
 *
 * 関西電力送配電の公表データ（空容量一覧の CSV）には変電所の府県の記載がない（prefecture は「関西ローカル系」か空）。
 * 府県は、対応表 src/data/kansai-prefecture-map.json から導出する。対応表は公表図から機械で作る
 * （scripts/experimental/kansai/build_prefecture_map.py・図の更新ごとに作り直す）:
 *   - ローカル系: 同社「マッピング（154kV未満）」の府県別の図に、No. が 1 つの府県の図にだけ出るもの（根拠「図」）
 *   - 基幹系統: 同社「供給可能エリアマップ」の住所で府県が決まるもの（根拠「住所」）
 *   図に「所在地」とは書かれていない。当サイトが所在地を確かめたのではない（11/4 の裁定 §3 条件 1）。
 * ★microCMS の prefecture は書き換えない（L-EIC-028）。表示の府県は normalizeSubstationPlace の 1 か所でだけ使う（#119）。
 * ★サーバー側だけで読む（ブラウザの部品からは import しない＝対応表をブラウザに送らない）。
 */
import mapData from '../data/kansai-prefecture-map.json';

export type KansaiPrefectureBasis = '図' | '図＋住所' | '住所';

type Entry = { p: string; b: KansaiPrefectureBasis; f?: number[]; a?: string; pg?: number };
type MapFile = {
  source: { mapping: { url: string; asof: string; label: string }; area_map: { url: string; asof_label: string } };
  figures: Record<string, { pref: string; title: string; url: string }>;
  entries: Record<string, Entry>;
};

const MAP = mapData as unknown as MapFile;

/** 対応表の出典（一覧のページの URL・図の時点） */
export const KANSAI_PREFECTURE_SOURCE = MAP.source;

/** external_id（例 kansai_local_北GO・kansai_kikan_ＡＵ）から府県と根拠を引く。表に無ければ null（府県なし） */
export function kansaiPrefectureOf(
  externalId: string | null | undefined
): { prefecture: string; basis: KansaiPrefectureBasis } | null {
  if (!externalId) return null;
  const e = MAP.entries[externalId.normalize('NFKC').trim()];
  return e ? { prefecture: e.p, basis: e.b } : null;
}

/** 詳細の「都道府県」の欄に添える根拠の一言（括弧の中身） */
export function kansaiPrefectureBasisLabel(basis: KansaiPrefectureBasis): string {
  if (basis === '住所') return '関西電力送配電『供給可能エリアマップ』の住所による';
  if (basis === '図＋住所') return '関西電力送配電『マッピング（154kV未満）』の府県別の図と『供給可能エリアマップ』の住所による';
  return '関西電力送配電『マッピング（154kV未満）』の府県別の図による';
}

/** 対応表の全件（検査用） */
export function kansaiPrefectureEntries(): Record<string, Entry> {
  return MAP.entries;
}
