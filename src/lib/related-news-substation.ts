/**
 * src/lib/related-news-substation.ts — 変電所の詳細の関連ニュース（build 時事前計算の related-news-map.json だけを読む）
 *
 * 変電所の詳細をビルド時の JSON から読む便（2026-11-04）で related-cards.ts から移した。
 * /grid/[slug] とその読み込み先は microCMS のクライアントを import しない（verify:grid-detail-static が検査）。
 */
import relatedNewsMap from './generated/related-news-map.json';
import type { News } from './microcms';

export type RelatedNewsItem = {
  id: string;
  slug: string;
  title: string;
  publishedAt?: string;
  category?: string[];
};

/** build 時事前計算した関連newsマップ（"project:<slug>" / "pref:<base>" → NewsRef[]）。runtime q を排除（鉄則#98） */
const RELATED_NEWS_MAP = relatedNewsMap as Record<string, RelatedNewsItem[]>;

/**
 * 関連ニュース（変電所ページ用）：build 時事前計算マップ（related-news-map.json）の都道府県キーから返す。
 * 旧実装は q=都道府県 で news 全文検索していたが、runtime microCMS q を撤去（2026-06-30・鉄則#98）。
 * query は grid/[slug] が渡す sub.prefecture（例「群馬県」）。事前計算側と同じ base 形に正規化して引く。
 * 2026-09-13 追修便④ ■1: microcms.ts から移設（microcms.ts は prebuild の各スクリプトが読むため、そこで生成物を
 * import すると生成物の無い新規クローンで prebuild が起動できない）。マップの読込もこのファイルの 1 箇所に揃う。
 */
export const getRelatedNewsForSubstation = async (
  query: string,
  limit = 5
): Promise<News[]> => {
  const q = (query || '').trim();
  if (!q) return [];
  const base = q === '北海道' ? '北海道' : q.replace(/(都|府|県)$/, '');
  const refs = (RELATED_NEWS_MAP[`pref:${base}`] ?? []).slice(0, limit);
  // refs は表示に必要な最小フィールド（id,slug,title,publishedAt,category）。RelatedNewsList は本5項目のみ参照。
  return refs as unknown as News[];
};
