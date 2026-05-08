// 共通定数 — microCMS 取得・ページネーション関連
// 落とし穴 #48 対応：ハードコード散在を防止するため一元管理

/**
 * microCMS 一覧取得時の最大 offset 上限
 *
 * - microCMS API は offset > 5000 で 422 を返すケースがあったが、Team プランでは 20,000 まで実用上昇可
 * - 将来 20,000 件超えるカテゴリが出たら、本定数のみ更新（要 microCMS Plan 確認）
 * - 本定数を `for (let offset = 0; offset < MICROCMS_MAX_OFFSET; offset += MICROCMS_PAGE_LIMIT)` の形で参照
 *
 * 履歴：
 * - v15: 1000 (初期)
 * - v17: 5000 (Phase 2A 2,648件超過対応)
 * - v20: 20000 (Phase 2-C-1 5,628件超過対応 + 余裕)
 * - v21: 共通定数化（再発防止）
 */
export const MICROCMS_MAX_OFFSET = 20000;

/**
 * microCMS 一覧取得時のデフォルト limit
 * microCMS API の上限は 100 (これを超えるとエラー)
 */
export const MICROCMS_PAGE_LIMIT = 100;
