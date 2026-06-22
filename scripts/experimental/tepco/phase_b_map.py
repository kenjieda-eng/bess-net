"""
TEPCO Phase 2b — Phase B: 本番スキーマへの写像
入力: tepco_dedup.json（サイト＋voltage_levels）
出力: tepco_grid_ready.json（既存16フィールド schema 準拠、1レコード=1電圧面）

既存 static schema（src/data/substations/<県>.json, 全6,507件で共通の16フィールド）:
  id, slug, name, prefecture, operator, area,
  voltage_primary_kv, voltage_secondary_kv,
  capacity_total_mw, cap_operational_mw, cap_avail_mw,
  n1_eligible, oc_possibility, latitude, longitude, last_updated
+ TEPCO拡張（microCMS full型が保持可。staticでは無視される非破壊キー）:
  forecast_flow_mw, n1_capacity_mw, cap_avail_upper_mw, units,
  voltage_class, external_id, notes, source_url, bank_aggregated
"""
import json, sys
from collections import defaultdict
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

DEDUP = "scripts/experimental/tepco/tepco_dedup.json"
OUT   = "scripts/experimental/tepco/tepco_grid_ready.json"

OPERATOR = "東京電力パワーグリッド"
AREA = "東京"
SOURCE_URL = "https://www.tepco.co.jp/pg/consignment/system/"
LAST_UPDATED = "2026-04-23T00:00:00.000Z"

d = json.load(open(DEDUP, encoding="utf-8"))
sites = d["sites"]

def oc_str(v):
    if v is True: return "有り"
    if v is False: return "なし"
    return None

def num(v):
    """整数値の float は int に正規化（既存schemaの数値表記に合わせる）。"""
    if isinstance(v, float) and v.is_integer():
        return int(v)
    return v

# レベル並び順: 高電圧→低電圧、bulk→distribution（(N)サフィックス採番用）
def level_sort_key(l):
    vp = l["voltage_primary_kv"] if l["voltage_primary_kv"] is not None else 0
    vs = l["voltage_secondary_kv"] if l["voltage_secondary_kv"] is not None else 0
    type_rank = 0 if l["type"] == "bulk" else 1
    return (type_rank, -vp, -vs)

records = []
seq = 0
by_pref = defaultdict(int)
by_pref_sites = defaultdict(set)

for site in sites:
    levels = sorted(site["voltage_levels"], key=level_sort_key)
    multi = len(levels) > 1
    for idx, l in enumerate(levels, start=1):
        seq += 1
        slug = f"tpg-{seq:04d}"
        name = site["name"] + (f"({idx})" if multi else "")
        pref = site["grid_pref"]
        rec = {
            # ── 16 コアフィールド（既存schema厳密一致）──
            "id": slug,
            "slug": slug,
            "name": name,
            "prefecture": pref,
            "operator": OPERATOR,
            "area": AREA,
            "voltage_primary_kv": num(l["voltage_primary_kv"]),
            "voltage_secondary_kv": num(l["voltage_secondary_kv"]),
            "capacity_total_mw": num(l["capacity_equip_mw"]),
            "cap_operational_mw": num(l["capacity_op_mw"]),
            "cap_avail_mw": num(l["cap_avail_mw"]),
            "n1_eligible": bool(l["n1_eligible"]) if l["n1_eligible"] is not None else False,
            "oc_possibility": oc_str(l["curtailment_possible"]),
            "latitude": None,    # 緯度経度は後回し（地図はPhase 2c+）
            "longitude": None,
            "last_updated": LAST_UPDATED,
            # ── TEPCO拡張（microCMS full型用、staticは無視）──
            "forecast_flow_mw": num(l["forecast_flow_mw"]),
            "n1_capacity_mw": num(l["n1_capacity_mw"]),
            "cap_avail_upper_mw": num(l["cap_avail_upper_mw"]),
            "units": l["units"],
            "voltage_class": l["voltage_class"],
            "external_id": l["external_id"],
            "notes": l.get("notes"),
            "bank_aggregated": l.get("bank_aggregated", False),
            "source_url": SOURCE_URL,
        }
        records.append(rec)
        if pref:
            by_pref[pref] += 1
            by_pref_sites[pref].add(site["name"])

# 県別件数（東京都が /grid 東京の見込み行数）
result = {
    "source": "TEPCO",
    "phase": "2b-grid-ready",
    "schema": "16-core + TEPCO-extended",
    "operator": OPERATOR,
    "area": AREA,
    "slug_prefix": "tpg",
    "last_updated": LAST_UPDATED,
    "source_url": SOURCE_URL,
    "stats": {
        "total_records": len(records),
        "unique_sites": len(sites),
        "by_prefecture_records": dict(sorted(by_pref.items(), key=lambda x: -x[1])),
        "by_prefecture_sites": {k: len(v) for k, v in sorted(by_pref_sites.items(), key=lambda x: -len(x[1]))},
    },
    "substations": records,
}
json.dump(result, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=2)

print("=" * 64)
print("Phase B: 本番スキーマ写像 結果")
print("=" * 64)
print(f"  grid_ready レコード総数: {len(records)}  (= /grid 行数見込み)")
print(f"  ユニークサイト数        : {len(sites)}")
print()
print(f"  {'県':<10}{'レコード':>8}{'サイト':>8}")
print("  " + "─" * 26)
for pref in sorted(by_pref, key=lambda x: -by_pref[x]):
    print(f"  {pref:<10}{by_pref[pref]:>8}{len(by_pref_sites[pref]):>8}")
print("  " + "─" * 26)
print(f"  {'東京都(再掲)':<10}{by_pref['東京都']:>8}{len(by_pref_sites['東京都']):>8}")
print()
# サンプル出力
print("=== サンプル grid_ready レコード（distribution）===")
for r in records:
    if r["cap_avail_mw"] is not None and r["prefecture"] == "東京都":
        print(json.dumps(r, ensure_ascii=False, indent=2))
        break
print()
print("=== サンプル grid_ready レコード（bulk, multi-level 横浜）===")
for r in records:
    if r["name"].startswith("横浜(") :
        print(json.dumps({k: r[k] for k in ["slug","name","prefecture","voltage_primary_kv","voltage_secondary_kv","capacity_total_mw","cap_operational_mw","cap_avail_mw","n1_eligible","n1_capacity_mw","voltage_class","oc_possibility"]}, ensure_ascii=False))
