import json, sys
from collections import Counter
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
with open("scripts/experimental/tepco/tepco_all.json", encoding="utf-8") as f:
    d = json.load(f)
subs = d["substations"]

# voltage_class 別に、forecast/cap_avail の有無パターンを集計
print("voltage_class別 データ形状（forecast有無 / cap_avail有無 / 現type）:")
by = {}
for s in subs:
    vc = s["voltage_class"]
    has_fc = s["forecast_flow_mw"] is not None
    has_ca = s["cap_avail_mw"] is not None
    key = (vc, has_fc, has_ca, s["type"])
    by[key] = by.get(key, 0) + 1
for (vc, fc, ca, t), n in sorted(by.items()):
    print(f"  {vc:<14} forecast={'有' if fc else '無'} cap_avail={'有' if ca else '無'} type={t:<12} : {n}件")

print()
# 22kV のサンプル
print("22kV サンプル:")
for s in subs:
    if s["voltage_class"] == "22kV":
        print(f"  {s['external_id']} {s['name']}: equip={s['capacity_equip_mw']} op={s['capacity_op_mw']} "
              f"forecast={s['forecast_flow_mw']} cap_avail={s['cap_avail_mw']} type={s['type']}")
