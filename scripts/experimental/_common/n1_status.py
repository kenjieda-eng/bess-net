# -*- coding: utf-8 -*-
"""
scripts/experimental/_common/n1_status.py — N-1電制の「未算定／公表なし」一覧の読取（Python 側）

★真実源は src/data/n1-status.json（TypeScript 側 src/lib/n1-status.ts と共用・#119）。Python 側に写しを持たない。
  生成は scripts/experimental/_common/build_n1_status.py。

用途: 各社の再取込・dry-run で、未算定（reason=undetermined/blank）・公表なし（no_column）の設備を知る。
      各社パーサはこの便（N1b）では変えない（取込時の扱いは BS/BT・次回の再取込で）。
"""
import json
from pathlib import Path

N1_STATUS_JSON = Path("src/data/n1-status.json")


def load_n1_status() -> dict:
    """slug -> {area, operator, external_id, name, reason, source, as_of[, raw, note]}"""
    if not N1_STATUS_JSON.exists():
        raise SystemExit(f"N-1 一覧が見つかりません: {N1_STATUS_JSON}（cwd はリポジトリ直下で実行すること）")
    return json.loads(N1_STATUS_JSON.read_text(encoding="utf-8"))["entries"]


def _same_date(a, b) -> bool:
    """TS の sameDate と同じ: 完全一致か、先頭 10 文字（YYYY-MM-DD）の一致"""
    if not a or not b:
        return False
    return a == b or a[:10] == b[:10]


def n1_status_of(slug: str, n1_eligible, last_updated) -> str:
    """'ok' | 'ng' | 'undetermined' | 'no_column'（TS の n1StatusOf と同じ規則）"""
    if n1_eligible is True:
        return "ok"
    e = load_n1_status().get(slug)
    if e and _same_date(e.get("as_of"), last_updated):
        return "no_column" if e["reason"] == "no_column" else "undetermined"
    return "ng"
