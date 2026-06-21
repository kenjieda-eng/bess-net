import json, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

with open("scripts/experimental/tepco/tepco_ibaraki.json", encoding="utf-8") as f:
    d = json.load(f)

bulk = [s for s in d["substations"] if s["type"] == "bulk"]
distr = [s for s in d["substations"] if s["type"] == "distribution"]
print("Bulk substations:")
for s in bulk:
    print(f"  {s['voltage_class']} #{s['no']} {s['name']}: flow={s['forecast_flow_mw']}MW n1={s['n1_eligible']} n1cap={s['n1_capacity_mw']}")

print()
distr_nos = sorted(int(s["no"]) for s in distr)
print(f"Distribution count: {len(distr)}, nos: {distr_nos[0]}..{distr_nos[-1]}")
with_cap = sum(1 for s in distr if (s["cap_avail_mw"] or 0) > 0)
print(f"Distribution with cap_avail>0: {with_cap}")

print()
n1s = [s for s in d["substations"] if s["n1_eligible"]]
print("N-1 eligible:")
for s in n1s:
    print(f"  {s['voltage_class']} #{s['no']} {s['name']}: n1cap={s['n1_capacity_mw']}MW")

print()
print(f"Lines 154kV: {sum(1 for l in d['transmission_lines'] if l['voltage_class']=='154kV')}")
print(f"Lines 66kV:  {sum(1 for l in d['transmission_lines'] if l['voltage_class']=='66kV')}")
n1_lines = sum(1 for l in d["transmission_lines"] if l["n1_eligible"])
print(f"Lines N-1 eligible: {n1_lines}")
print(f"Parse errors: {len(d['parse_errors'])}")
