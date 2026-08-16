# -*- coding: utf-8 -*-
"""
scripts/experimental/_common/series_dedup.py — 系列別ビュー重複の共通除去（落とし穴 #111）

送配電各社の公表CSVは「設備一覧」ではなく「系列別ビュー」であり、行数＝設備数ではない。
同一設備が複数の電圧系列・複数の都県ファイルに再掲されることがある。差分で「新規」と出た行は、
名称＋数値の同値判定で重複を除去してから投入しないと、同名・同値・別slugの重複ページを量産する。

実証: 2026-08-16 TEPCO 7月CSV で66行（同名同値59＋他地区写像7）を検出・除外、真正新規0件
      （commit 5cdfef7 / parse_tepco_csv_2607.py の apply_series_dedup を本モジュールへ汎用化）。

使い方（社を問わず同じ）:
    from series_dedup import apply_series_dedup
    kept, excluded = apply_series_dedup(
        rows,                       # 正規化済みの行（dict）
        base_ids=set(...),          # 既存レコードの external_id 集合
        base_names={name: 参照文字列},# 既存レコードの正規化名称 → 参照（写像先の説明）
        key_id="external_id",       # 行の識別子キー
        key_name="name",
        value_keys=("cap_operational_mw", "forecast_flow_mw"),  # 同値判定に使う数値キー
        group_key="src_area",       # 「同一ソース内」の単位（None なら全行を1グループ扱い）
        lower_series=lambda r: ...,  # 下位系列（再掲側）判定。None なら②のみ適用
    )
ヒット0なら kept == rows（素通し）。除外は取込対象からの除外であり、既存レコードの更新には影響しない。
"""
from typing import Any, Callable, Dict, Iterable, List, Optional, Sequence, Set, Tuple


def apply_series_dedup(
    rows: Sequence[Dict[str, Any]],
    base_ids: Set[str],
    base_names: Optional[Dict[str, str]] = None,
    *,
    enable_baseline_name_rule: bool = False,
    key_id: str = "external_id",
    key_name: str = "name",
    value_keys: Sequence[str] = ("cap_operational_mw", "forecast_flow_mw"),
    group_key: Optional[str] = None,
    lower_series: Optional[Callable[[Dict[str, Any]], bool]] = None,
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """
    ① 同一グループ内に「名称一致＋value_keys が全て同値」の相手（再掲元）がある行を除外
    ② baseline 名称一致で既存レコードへ写像できる行を除外
    ③ 残余のみ真正新規として kept に残す（既存 external_id を持つ行は常に kept）

    戻り値: (kept, excluded)。excluded の各行には exclude_reason を付与する。
    """
    base_names = base_names or {}
    kept: List[Dict[str, Any]] = []
    excluded: List[Dict[str, Any]] = []

    by_name: Dict[Any, List[Dict[str, Any]]] = {}
    for r in rows:
        g = r.get(group_key) if group_key else None
        by_name.setdefault((g, r.get(key_name)), []).append(r)

    for r in rows:
        # 既存 external_id を持つ＝更新対象。dedup の対象外（必ず残す）
        if r.get(key_id) in base_ids:
            kept.append(r)
            continue

        # ★名称が空の行は「同名」判定ができない（空欄同士を同一設備と見なすのは誤り）。
        #   北陸2026-08 CSV で名称非公開の別設備2件が同値扱いされる誤判定を検出したため必須
        #   （2026-08-16・北陸パイロット）。値が全て None の行も同様に同値と言えない。
        name = (r.get(key_name) or "").strip()
        has_value = any(r.get(k) is not None for k in value_keys)
        if not name or not has_value:
            kept.append(r)
            continue

        # ① 同一グループ内の同名・同値（再掲）
        g = r.get(group_key) if group_key else None
        peers = [p for p in by_name.get((g, r.get(key_name)), []) if p is not r]
        if lower_series is not None:
            # 再掲元（=下位系列でない側）だけを相手にする
            peers = [p for p in peers if not lower_series(p)]
        same = [
            p for p in peers
            if all(p.get(k) == r.get(k) for k in value_keys)
        ]
        if same:
            excluded.append({**r, "exclude_reason": f"同一ソース内の {same[0].get(key_id)} と同名同値（系列別ビューの再掲）"})
            continue

        # ② baseline 名称一致（他地区・他系列からの写像）
        # ★既定は無効（落とし穴 #117・2026-08-16）。No.の振り直しがある社では、同名の正当な設備を
        #   「既存の再掲」と誤判定して除去してしまう（中国で玉造/安浦/大崎の4行を誤除去した実績）。
        #   TEPCO の 23区ファイルのように「他地区局を丸ごと再掲する」社でのみ opt-in する。
        mapped = base_names.get(r.get(key_name)) if enable_baseline_name_rule else None
        if mapped:
            excluded.append({**r, "exclude_reason": f"既存 {mapped} の再掲（他系列/他地区の相互参照）"})
            continue

        # ③ 真正新規
        kept.append(r)

    return kept, excluded


def summarize(excluded: Iterable[Dict[str, Any]]) -> Dict[str, int]:
    """除外理由の内訳を数える（ログ出力用）"""
    out: Dict[str, int] = {}
    for e in excluded:
        kind = "同名同値" if "同名同値" in e.get("exclude_reason", "") else "名称写像"
        out[kind] = out.get(kind, 0) + 1
    return out
