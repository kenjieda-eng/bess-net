"""
TEPCO Phase 2b — dedup + 正規化（staging）
入力: tepco_all.json（1,777変電所）
出力:
  tepco_dedup.json       … サイト単位（voltage_levels[]）＋統計
  tepco_grid_ready.json  … 本番16フィールド schema（1レコード=1変圧器）

dedup方針:
  1) 県内クロスリスト（154kV面/66kV面が同一TRで全数値一致）を collapse
  2) kikan(基幹) を同名県サイトへ名寄せ（voltage_levels に追加）
  3) grid_pref 補完（県側=既設、kikan=同名県継承 or 地理マップ）
  4) バンク合算行（notesに「合算」）に bank_aggregated フラグ
本番 src/ は変更しない。
"""
import json, sys, re
from collections import defaultdict, OrderedDict
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = "scripts/experimental/tepco/tepco_all.json"
DEDUP_OUT = "scripts/experimental/tepco/tepco_dedup.json"
GRID_OUT  = "scripts/experimental/tepco/tepco_grid_ready.json"

OPERATOR = "東京電力パワーグリッド"
AREA = "東京"
SLUG_PREFIX = "tpg"
SOURCE_URL = "https://www.tepco.co.jp/pg/consignment/system/"
LAST_UPDATED = "2026-04-23T00:00:00.000Z"  # データ基準日

# kikan-only 変電所の grid_pref 地理マップ（同名県マッチしないもの）。best-effort、findingsで明示。
KIKAN_GEO = {
    "新茂木": "栃木県", "新古河": "埼玉県", "東群馬": "群馬県", "新榛名": "群馬県",
    "新信濃": "長野県", "新木更津": "千葉県", "新佐原": "千葉県", "新野田": "千葉県",
    "東山梨": "山梨県", "新富士": "静岡県", "新多摩": "東京都", "新所沢": "埼玉県",
    "新飯能": "埼玉県",
}

d = json.load(open(SRC, encoding="utf-8"))
subs = d["substations"]

# ── 数値シグネチャ（同一TR判定用）────────────────────────────────────
def sig(r):
    return (r["voltage_primary_kv"], r["voltage_secondary_kv"], r["units"],
            r["capacity_equip_mw"], r["capacity_op_mw"], r["forecast_flow_mw"],
            r["cap_avail_mw"], r["n1_eligible"], r["n1_capacity_mw"])

def is_bank_aggregated(r):
    n = r.get("notes") or ""
    return ("合算" in n)

# ── Pass 1: 県内クロスリスト collapse ────────────────────────────────
# (region, name) でグループ化し、同一シグネチャを1件に。
collapsed = []           # collapse後レコード
collapse_log = []        # 何を畳んだか
group = defaultdict(list)
for r in subs:
    group[(r["region"], r["name"])].append(r)

for (region, name), recs in group.items():
    seen = OrderedDict()  # sig -> representative record
    for r in recs:
        k = sig(r)
        if k in seen:
            # クロスリスト重複 → 代表にマージ元を記録
            seen[k].setdefault("_merged_from", []).append(r["external_id"])
        else:
            rr = dict(r)
            rr["_merged_from"] = []
            seen[k] = rr
    for rr in seen.values():
        collapsed.append(rr)
        if rr["_merged_from"]:
            collapse_log.append({
                "region": region, "name": name,
                "kept": rr["external_id"], "collapsed": rr["_merged_from"]
            })

n_raw = len(subs)
n_after_xlist = len(collapsed)

# ── Pass 2: サイト化（name + 物理サイト）＋ kikan 名寄せ ──────────────
# 県側レコードは region/grid_pref をそのまま。kikan は同名県へ寄せる。
# サイトキー: 県側 = (name, grid_pref) ／ kikan = 同名の県サイトがあれば合流。

# 県側（非kikan）レコードでまず grid_pref 別名サイトを作る
prefecture_recs = [r for r in collapsed if r["pdf_key"] != "kikan"]
kikan_recs      = [r for r in collapsed if r["pdf_key"] == "kikan"]

# name -> 県側 grid_pref 集合（kikan継承用）
name_to_pref = defaultdict(set)
for r in prefecture_recs:
    if r["grid_pref"]:
        name_to_pref[r["name"]].add(r["grid_pref"])

# kikan の grid_pref を確定
kikan_pref_unresolved = []
for r in kikan_recs:
    prefs = name_to_pref.get(r["name"])
    if prefs and len(prefs) >= 1:
        # 同名県あり → その県へ（複数県該当は最初の1つ＋note）
        r["grid_pref"] = sorted(prefs)[0]
        r["_kikan_pref_source"] = "prefecture_match" + ("(multi)" if len(prefs) > 1 else "")
    elif r["name"] in KIKAN_GEO:
        r["grid_pref"] = KIKAN_GEO[r["name"]]
        r["_kikan_pref_source"] = "geo_map"
    else:
        r["_kikan_pref_source"] = "unresolved"
        kikan_pref_unresolved.append(r["external_id"] + " " + r["name"])

# サイト化: site_key = (name, grid_pref)。kikanも同じキーで合流。
sites = OrderedDict()
def site_key(r):
    return (r["name"], r["grid_pref"])

for r in collapsed:
    k = site_key(r)
    if k not in sites:
        sites[k] = {
            "name": r["name"],
            "grid_pref": r["grid_pref"],
            "regions": set(),
            "voltage_levels": [],
        }
    site = sites[k]
    site["regions"].add(r["region"])
    site["voltage_levels"].append({
        "external_id": r["external_id"],
        "pdf_key": r["pdf_key"],
        "voltage_class": r["voltage_class"],
        "type": r["type"],
        "voltage_primary_kv": r["voltage_primary_kv"],
        "voltage_secondary_kv": r["voltage_secondary_kv"],
        "units": r["units"],
        "capacity_equip_mw": r["capacity_equip_mw"],
        "capacity_op_mw": r["capacity_op_mw"],
        "forecast_flow_mw": r["forecast_flow_mw"],
        "cap_avail_mw": r["cap_avail_mw"],
        "cap_avail_upper_mw": r["cap_avail_upper_mw"],
        "n1_eligible": r["n1_eligible"],
        "n1_capacity_mw": r["n1_capacity_mw"],
        "curtailment_possible": r["curtailment_possible"],
        "bank_aggregated": is_bank_aggregated(r),
        "notes": r.get("notes"),
        "merged_from": r.get("_merged_from", []),
        "kikan_pref_source": r.get("_kikan_pref_source"),
    })

# サイト単位の集計（容量の二重計上を避ける）
site_list = []
for (name, gp), site in sites.items():
    levels = site["voltage_levels"]
    has_dist = any(l["type"] == "distribution" for l in levels)
    # distribution の空容量（実数）は配電用/22kVレベルから取る（複数あれば最大）
    dist_caps = [l["cap_avail_mw"] for l in levels if l["type"] == "distribution" and l["cap_avail_mw"] is not None]
    site_cap_avail = max(dist_caps) if dist_caps else None
    # bulk の N-1可能量（最大）
    n1caps = [l["n1_capacity_mw"] for l in levels if l["n1_capacity_mw"] is not None]
    site_n1cap = max(n1caps) if n1caps else None
    site_list.append({
        "name": name,
        "grid_pref": gp,
        "regions": sorted(site["regions"]),
        "n_levels": len(levels),
        "has_distribution": has_dist,
        "has_bulk": any(l["type"] == "bulk" for l in levels),
        "site_cap_avail_mw": site_cap_avail,
        "site_n1_capacity_mw": site_n1cap,
        "any_n1_eligible": any(l["n1_eligible"] for l in levels),
        "voltage_levels": levels,
    })

# ── tepco_dedup.json 出力 ────────────────────────────────────────────
n_sites = len(site_list)
n_levels_total = sum(s["n_levels"] for s in site_list)
sites_with_dist = sum(1 for s in site_list if s["has_distribution"])
sites_bulk_only = sum(1 for s in site_list if s["has_bulk"] and not s["has_distribution"])

# 県別ユニークサイト数
by_pref_sites = defaultdict(int)
for s in site_list:
    by_pref_sites[s["grid_pref"]] += 1

dedup_result = {
    "source": "TEPCO",
    "phase": "2b-dedup",
    "operator": OPERATOR,
    "source_date": "2026-04-23",
    "published_date": "2026-04-30",
    "stats": {
        "raw_substations": n_raw,
        "after_crosslist_collapse": n_after_xlist,
        "crosslist_collapsed_count": n_raw - n_after_xlist,
        "unique_sites": n_sites,
        "total_voltage_levels": n_levels_total,
        "sites_with_distribution": sites_with_dist,
        "sites_bulk_only": sites_bulk_only,
        "kikan_pref_unresolved": kikan_pref_unresolved,
    },
    "by_prefecture_sites": dict(sorted(by_pref_sites.items(), key=lambda x: -x[1])),
    "crosslist_collapse_log": collapse_log,
    "sites": site_list,
}
json.dump(dedup_result, open(DEDUP_OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

# ── コンソール: dedup サマリ ─────────────────────────────────────────
print("=" * 64)
print("TEPCO Phase 2b dedup 結果")
print("=" * 64)
print(f"  raw変電所              : {n_raw}")
print(f"  クロスリスト collapse後 : {n_after_xlist}  (畳んだ重複 {n_raw - n_after_xlist}件)")
print(f"  ユニークサイト数        : {n_sites}")
print(f"    └ distribution含む   : {sites_with_dist}")
print(f"    └ bulkのみ           : {sites_bulk_only}")
print(f"  電圧レベル総数          : {n_levels_total}")
print(f"  kikan grid_pref 未解決  : {len(kikan_pref_unresolved)} {kikan_pref_unresolved}")
print()
print("  県別ユニークサイト数:")
for pref, cnt in sorted(by_pref_sites.items(), key=lambda x: -x[1]):
    print(f"    {str(pref):<10} {cnt}")
