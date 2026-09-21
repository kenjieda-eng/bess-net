'use client';

import { useEffect, useState, type ReactNode } from 'react';

/**
 * 時刻で表示を切り替える（開催前 → 開催後 など）。An-1・2026-09-21
 *
 * force-static のページは HTML がビルド時に焼かれ、次のビルドまで同じものが配られる。
 * 切替時刻をサーバの描画時点だけで判定すると、ビルドが無い限り「開催後」に切り替わらない。
 * そこで初回描画はサーバの描画時点（renderedAt）で決めて HTML と一致させ（hydration を壊さない）、
 * マウント後に閲覧時点で選び直す。どちらの状態も初期 DOM に載るのは「描画時点の側」だけ。
 *
 * @param renderedAt サーバの描画時点（epoch ms）。ページ（サーバ部品）が Date.now() を渡す
 * @param switchAt   切替時刻（ISO 8601・タイムゾーン付き）。この時刻以降が after
 */
export function TimeSwitch({
  renderedAt,
  switchAt,
  before,
  after,
}: {
  renderedAt: number;
  switchAt: string;
  before: ReactNode;
  after: ReactNode;
}) {
  const at = Date.parse(switchAt);
  const [now, setNow] = useState(renderedAt);
  useEffect(() => {
    setNow(Date.now());
  }, []);
  return <>{now >= at ? after : before}</>;
}
