# -*- coding: utf-8 -*-
"""
scripts/experimental/_common/build_n1_undetermined.py

N-1電制適用可否が公表CSVで「未算定（-）」の設備一覧を社別に出力する（GET/ローカル読取のみ・書込なし）。

背景: microCMS の n1_eligible は boolean（null不可）のため、取込時に未算定が false に潰れている。
      その結果、詳細ページ上は「不可」と読める状態になっている（＝表示の三値化が必要）。
      再取込のたびに現値維持で据え置く対象でもあるため、機械可読な一覧として固定する。
出力: scripts/experimental/_common/n1_undetermined.json
"""
import json, sys
from pathlib import Path
sys.stdout.reconfigure(encoding="utf-8")

ROOT = Path("scripts/experimental")
OUT = ROOT / "_common" / "n1_undetermined.json"

entries = []

# ── 北陸（2026-08-05公表CSV） ──
hk_new = json.loads((ROOT / "hokuriku" / "hokuriku_csv_2608_normalized.json").read_text(encoding="utf-8"))["rows"]
hk_base = {b["slug"]: b for b in json.loads((ROOT / "hokuriku" / "baseline_live.json").read_text(encoding="utf-8"))}
for r in hk_new:
    b = hk_base.get(r["slug"])
    if b and b.get("n1_eligible") is not None and r.get("n1_eligible") is None:
        entries.append({
            "operator": "北陸電力送配電", "area": "北陸",
            "slug": r["slug"], "external_id": r["external_id"], "name": b.get("name"),
            "prefecture": b.get("prefecture"),
            "stored_n1_eligible": b.get("n1_eligible"),
            "source": "sys_capa_*_tr_202608_05.csv（2026-08-05公表）",
        })

# ── 東京（2026-07-10公表CSV・13件） ──
tk_new = json.loads((ROOT / "tepco" / "tepco_csv_2607_normalized.json").read_text(encoding="utf-8"))["rows"]
tk_base = {}
for b in json.loads((ROOT / "tepco" / "tepco_grid_ready.json").read_text(encoding="utf-8"))["substations"]:
    tk_base.setdefault(b["external_id"], b)
for r in tk_new:
    b = tk_base.get(r["external_id"])
    if b and b.get("n1_eligible") is not None and r.get("n1_eligible") is None:
        entries.append({
            "operator": "東京電力パワーグリッド", "area": "東京",
            "slug": b["slug"], "external_id": r["external_id"], "name": b.get("name"),
            "prefecture": b.get("prefecture"),
            "stored_n1_eligible": b.get("n1_eligible"),
            "source": "csv_yosochoryu_*_hendensyo.csv（2026-07-10公表）",
        })

# ── 東北（2026-07-03公表・202607版） ──
# dry-run レポート（reports/grid-tohoku-dryrun-2026-08-16.json）の n1_undetermined を社別に統合。
# 本実行（2026-08-16）でも上書きせず現値維持した20件。
tk_report = Path("reports/grid-tohoku-dryrun-2026-08-16.json")
if tk_report.exists():
    for e in json.loads(tk_report.read_text(encoding="utf-8"))["n1_undetermined"]["entries"]:
        entries.append({
            "operator": "東北電力ネットワーク", "area": "東北",
            "slug": e["slug"], "external_id": e["external_id"], "name": e["name"],
            "prefecture": e["prefecture"],
            "stored_n1_eligible": e["stored"],
            "source": "sys_capa_*_tr_202607_02.csv（2026-07-03作成）",
        })

by_area = {}
for e in entries:
    by_area[e["area"]] = by_area.get(e["area"], 0) + 1

OUT.write_text(json.dumps({
    "purpose": "公表CSVで N-1電制適用可否が未算定（-）の設備。microCMS の n1_eligible は boolean のため "
               "false に潰れているが、実態は「不可」ではなく「未算定」。表示の三値化タスクの入力。",
    "note": "再取込では上書きせず現値維持する（社を問わず既定）。",
    "generated_from": ["hokuriku/hokuriku_csv_2608_normalized.json", "tepco/tepco_csv_2607_normalized.json",
                       "reports/grid-tohoku-dryrun-2026-08-16.json"],
    "count": len(entries), "count_by_area": by_area, "entries": entries,
}, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"出力 {OUT}: 計{len(entries)}件 {by_area}")
