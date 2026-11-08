/**
 * src/lib/substations-frozen.ts — 更新停止（凍結）変電所の一元管理
 *
 * ★定義の実体は src/data/substations-frozen.json（TypeScript と Python の唯一の真実源）。
 *   scripts/experimental/_common/frozen.py が同じ JSON を読む。
 *   落とし穴 #119『定義は一箇所だけ』に従い、言語ごとに写しを持たない。
 *
 * 凍結の扱い（tpg-1623 湯船・2026-08-16裁定で確立）:
 *   - データは当時のまま保持・ページ維持（URL保全・削除/301しない）
 *     ★例外: 変電所でない誤取込（egz-kikan-x）は、データを残したままページを転送にする（redirectTo・2026-11-08）
 *   - 空容量プラス集計・TOP20・検索・エリア件数からは除外する
 *   - 詳細ページには slug ごとの注記を初期DOMで表示する（落とし穴 #107）
 *
 * 2026-08-17 追加: egz-kikan-x は公表CSVの「【留意事項】」注記行を設備として
 *   取り込んだもの。変電所ではないため同じ仕組みで除外する（DELETE はしない）。
 *   再登録を防ぐパーサ側のガードは scripts/experimental/chugoku/parse_chugoku_csv.py。
 */
import frozenData from '../data/substations-frozen.json';

type FrozenEntry = {
  name: string;
  operator: string;
  decidedOn: string;
  reason: string;
  note: string;
  /** 恒久の転送先（ページを開かせない凍結だけ）。next.config.js の redirects がこの欄から作る */
  redirectTo?: string;
  redirectDecidedOn?: string;
  redirectReason?: string;
};

const FROZEN = (frozenData as { frozen: Record<string, FrozenEntry> }).frozen;

/** 凍結の全件（件数・一覧・検索・TOP20・IndexNow から外す）。転送にしたものも入る */
export const FROZEN_SUBSTATION_SLUGS: ReadonlySet<string> = new Set(Object.keys(FROZEN));

/**
 * 凍結のうち、ページを開かせず転送にしたもの（slug → 転送先）。小さな直し便（2026-11-08）:
 * egz-kikan-x は変電所ではない（公表 CSV の「【留意事項】」の注記の行）ので、/grid/chugoku へ恒久の転送にした。
 * データは消さない（凍結のまま＝件数・一覧・検索からは今までどおり外れる）。
 */
export const FROZEN_REDIRECTS: ReadonlyMap<string, string> = new Map(
  Object.entries(FROZEN).filter(([, v]) => !!v.redirectTo).map(([slug, v]) => [slug, v.redirectTo as string]),
);

/** 凍結のページ（開ける凍結＝noindex・注記つき）。転送にしたものは入らない */
export const FROZEN_PAGE_SLUGS: ReadonlySet<string> = new Set(
  [...FROZEN_SUBSTATION_SLUGS].filter((slug) => !FROZEN_REDIRECTS.has(slug)),
);

/** 詳細ページに出す凍結注記（slug ごと。裁定で確定した文言を JSON 側に持つ） */
export function frozenSubstationNote(slug: string | undefined | null): string | null {
  if (!slug) return null;
  return FROZEN[slug]?.note ?? null;
}

export function isFrozenSubstation(slug: string | undefined | null): boolean {
  return !!slug && FROZEN_SUBSTATION_SLUGS.has(slug);
}
