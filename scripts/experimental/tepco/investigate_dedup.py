"""dedup設計のための実態調査: TEPCOの電圧面クロスリスト構造 + 既存事業者の慣習。"""
import json, sys
from collections import defaultdict
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# ── TEPCO: 茨城のbulk変電所を name でグループ化、クロスリスト実態を見る ──
d = json.load(open("scripts/experimental/tepco/tepco_all.json", encoding="utf-8"))
subs = d["substations"]

print("=" * 70)
print("A. TEPCO 茨城 bulk変電所 name別グループ（クロスリスト実態）")
print("=" * 70)
by_name = defaultdict(list)
for s in subs:
    if s["region"] == "茨城県" and s["type"] == "bulk":
        by_name[s["name"]].append(s)
for name, recs in sorted(by_name.items()):
    if len(recs) > 1:
        print(f"\n■ {name} ({len(recs)}件)")
        for r in recs:
            print(f"    {r['external_id']:<22} vc={r['voltage_class']:<6} "
                  f"V={r['voltage_primary_kv']}/{r['voltage_secondary_kv']} "
                  f"台数={r['units']} 設備={r['capacity_equip_mw']} 運用={r['capacity_op_mw']} "
                  f"潮流={r['forecast_flow_mw']} n1cap={r['n1_capacity_mw']}")

# ── 同名・全数値一致 かどうか判定 ──
print()
print("=" * 70)
print("B. クロスリストは『全数値一致』か？（茨城 bulk 重複名で検証）")
print("=" * 70)
def numkey(r):
    return (r["voltage_primary_kv"], r["voltage_secondary_kv"], r["units"],
            r["capacity_equip_mw"], r["capacity_op_mw"], r["forecast_flow_mw"],
            r["n1_capacity_mw"])
for name, recs in sorted(by_name.items()):
    if len(recs) > 1:
        keys = {numkey(r) for r in recs}
        verdict = "完全一致(同一TR)" if len(keys) == 1 else f"差異あり({len(keys)}種)"
        print(f"  {name}: {len(recs)}件 → {verdict}")

# ── 既存事業者(中部/静岡)の同名重複の有無 ──
print()
print("=" * 70)
print("C. 既存事業者の慣習: 静岡県(中部)の同名・(N)サフィックス")
print("=" * 70)
chubu = json.load(open("src/data/substations/静岡県.json", encoding="utf-8"))
import re
base_groups = defaultdict(list)
for r in chubu:
    base = re.sub(r"\(\d+\)$", "", r["name"]).strip()
    base_groups[base].append(r)
multi = {b: rs for b, rs in base_groups.items() if len(rs) > 1}
print(f"  静岡県 総レコード={len(chubu)}, ベース名ユニーク={len(base_groups)}, 複数面サイト={len(multi)}")
for b, rs in list(multi.items())[:8]:
    print(f"\n  ■ {b} ({len(rs)}件)")
    for r in rs:
        print(f"      {r['slug']:<10} name={r['name']:<16} "
              f"V={r['voltage_primary_kv']}/{r['voltage_secondary_kv']} "
              f"設備={r['capacity_total_mw']} 運用={r['cap_operational_mw']} cap_avail={r['cap_avail_mw']}")
