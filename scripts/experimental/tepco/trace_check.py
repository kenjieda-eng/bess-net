"""grid_ready の値が dedup を経ても tepco_all（PDF検証済）と一致するか追跡。"""
import json, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

from collections import defaultdict
alld = json.load(open("scripts/experimental/tepco/tepco_all.json", encoding="utf-8"))
gr = json.load(open("scripts/experimental/tepco/tepco_grid_ready.json", encoding="utf-8"))

# external_id は一意でない（多バンク変電所が同一No.を共有）→ external_id ごとに候補集合を持つ
src = defaultdict(list)
for s in alld["substations"]:
    src[s["external_id"]].append(s)

# external_id 重複の実態
dup_eids = {e: len(v) for e, v in src.items() if len(v) > 1}
print(f"external_id 重複: {len(dup_eids)}種（多バンク変電所）。例: {list(dup_eids.items())[:5]}")

# grid_ready の各レコードを「external_id一致 かつ 主要数値一致」のsource候補が存在するか確認
checks = 0
mismatches = 0
for r in gr["substations"]:
    eid = r["external_id"]
    cands = src.get(eid, [])
    def matches(o):
        for field, exp in [
            ("capacity_total_mw", o["capacity_equip_mw"]),
            ("cap_operational_mw", o["capacity_op_mw"]),
            ("cap_avail_mw", o["cap_avail_mw"]),
            ("forecast_flow_mw", o["forecast_flow_mw"]),
            ("n1_capacity_mw", o["n1_capacity_mw"]),
        ]:
            got = r[field]
            if (got is None) != (exp is None): return False
            if got is not None and exp is not None and float(got) != float(exp): return False
        return True
    checks += 1
    if not any(matches(o) for o in cands):
        mismatches += 1
        print(f"  MISMATCH {eid} {r['name']}: 値が source 候補({len(cands)})のいずれとも不一致")

print(f"\n追跡: {checks}レコード照合, 値不一致 {mismatches}件")

# 東京23区・神奈川の主要サイト サンプル目視
print("\n=== 東京23区・神奈川 主要サイト（grid_ready値）===")
samples = ["新豊洲", "横浜", "川崎", "塩浜"]
for nm in samples:
    rows = [r for r in gr["substations"] if r["name"].startswith(nm)]
    for r in rows:
        print(f"  {r['name']:<10} {r['prefecture']:<6} V={r['voltage_primary_kv']}/{r['voltage_secondary_kv']} "
              f"設備={r['capacity_total_mw']} 空容量={r['cap_avail_mw']} n1={r['n1_eligible']} n1cap={r['n1_capacity_mw']} vc={r['voltage_class']}")
