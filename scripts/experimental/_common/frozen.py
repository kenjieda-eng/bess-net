# -*- coding: utf-8 -*-
"""
scripts/experimental/_common/frozen.py — 凍結変電所リストの読取（Python 側）

★真実源は src/data/substations-frozen.json（TypeScript 側 src/lib/substations-frozen.ts と共用）。
  落とし穴 #119『定義は一箇所だけ』に従い、Python 側に写しを持たない。

用途: 各社の再取込 dry-run で、凍結レコードを baseline から外す。
      凍結レコードは公表CSVに存在しない／設備行ではないため、外さないと
      毎回「消滅」として差分に出続け、本当の消滅が埋もれる。
"""
import json
from pathlib import Path

FROZEN_JSON = Path("src/data/substations-frozen.json")


def load_frozen() -> dict:
    """slug -> {name, operator, decidedOn, reason, note}"""
    if not FROZEN_JSON.exists():
        raise SystemExit(f"凍結定義が見つかりません: {FROZEN_JSON}（cwd はリポジトリ直下で実行すること）")
    return json.loads(FROZEN_JSON.read_text(encoding="utf-8"))["frozen"]


def frozen_slugs() -> set:
    return set(load_frozen().keys())


def drop_frozen(base_rows: list, key: str = "slug", *, verbose: bool = True) -> list:
    """baseline から凍結レコードを除く。除いた分は必ず件数を出す（黙って減らさない）。"""
    fz = load_frozen()
    kept = [b for b in base_rows if b.get(key) not in fz]
    dropped = [b for b in base_rows if b.get(key) in fz]
    if verbose and dropped:
        print(f"  凍結除外: baseline から {len(dropped)}件を除外（消滅判定に載せない）")
        for b in dropped:
            print(f"    - {b.get(key)} 「{b.get('name')}」← {fz[b.get(key)]['reason']}")
    return kept
