"""Phase 2a 品質分析: 重複名 / 異常値 / 基幹×県重複 / 空容量レンジ。"""
import json, sys
from collections import Counter, defaultdict
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

with open("scripts/experimental/tepco/tepco_all.json", encoding="utf-8") as f:
    d = json.load(f)

subs = d["substations"]
lines = d["transmission_lines"]

print("=" * 60)
print("1. 県内 重複変電所名（154kV/66kV二重視点など）")
print("=" * 60)
for st in d["per_prefecture"]:
    if st["dup_names_count"] > 0:
        print(f"  {st['region']}: {st['dup_names_count']}件 {st['dup_names'][:8]}")

print()
print("=" * 60)
print("2. 空容量(cap_avail_mw)レンジ分布")
print("=" * 60)
caps = [s["cap_avail_mw"] for s in subs if s["cap_avail_mw"] is not None]
caps_sorted = sorted(caps)
print(f"  cap_avail件数={len(caps)}  min={min(caps)} max={max(caps)}")
import statistics
print(f"  median={statistics.median(caps)}  mean={statistics.mean(caps):.1f}")
# 分布
buckets = Counter()
for c in caps:
    if c < 0: buckets["<0"] += 1
    elif c == 0: buckets["0"] += 1
    elif c <= 10: buckets["1-10"] += 1
    elif c <= 50: buckets["11-50"] += 1
    elif c <= 200: buckets["51-200"] += 1
    elif c <= 1000: buckets["201-1000"] += 1
    else: buckets[">1000"] += 1
for k in ["<0","0","1-10","11-50","51-200","201-1000",">1000"]:
    print(f"    {k:>10}: {buckets.get(k,0)}")

print()
print("  異常候補 (cap_avail<0 or >1000):")
ab = [s for s in subs if s["cap_avail_mw"] is not None and (s["cap_avail_mw"] < 0 or s["cap_avail_mw"] > 1000)]
for s in ab[:20]:
    print(f"    {s['external_id']} {s['name']}: {s['cap_avail_mw']}")
if not ab:
    print("    なし")

print()
print("=" * 60)
print("3. 運用容量>設備容量 の件数（配電用は正常、基幹は要注意）")
print("=" * 60)
over = [s for s in subs if s["capacity_op_mw"] and s["capacity_equip_mw"] and s["capacity_op_mw"] > s["capacity_equip_mw"]]
over_bulk = [s for s in over if s["type"]=="bulk"]
over_distr = [s for s in over if s["type"]=="distribution"]
print(f"  全{len(over)}件 (配電用={len(over_distr)} 基幹={len(over_bulk)})")
print("  基幹で運用>設備のもの（要確認）:")
for s in over_bulk[:15]:
    print(f"    {s['external_id']} {s['name']}: equip={s['capacity_equip_mw']} op={s['capacity_op_mw']}")
if not over_bulk:
    print("    なし")

print()
print("=" * 60)
print("4. 基幹PDF変電所 × 県PDF基幹変電所 の名称重複（Phase 2b dedup課題）")
print("=" * 60)
kikan_names = {s["name"] for s in subs if s["pdf_key"]=="kikan"}
pref_bulk_names = defaultdict(set)
for s in subs:
    if s["pdf_key"]!="kikan" and s["type"]=="bulk":
        pref_bulk_names[s["region"]].add(s["name"])
print(f"  基幹PDF変電所名: {sorted(kikan_names)}")
print()
overlap_total = set()
for region, names in pref_bulk_names.items():
    ov = kikan_names & names
    if ov:
        overlap_total |= ov
        print(f"  {region}: {sorted(ov)}")
print(f"\n  基幹と県で重複する名称ユニーク数: {len(overlap_total)}")

print()
print("=" * 60)
print("5. 全県横断 同名変電所（複数県に跨る同一名）")
print("=" * 60)
name_to_regions = defaultdict(set)
for s in subs:
    if s["name"]:
        name_to_regions[s["name"]].add(s["region"])
cross = {n: rs for n, rs in name_to_regions.items() if len(rs) > 1}
print(f"  複数県に登場する同名変電所: {len(cross)}件")
for n, rs in sorted(cross.items(), key=lambda x:-len(x[1]))[:15]:
    print(f"    {n}: {sorted(rs)}")

print()
print("=" * 60)
print("6. N-1電制 集計")
print("=" * 60)
print(f"  変電所 N1可: {sum(1 for s in subs if s['n1_eligible'] is True)}")
print(f"  変電所 N1不可: {sum(1 for s in subs if s['n1_eligible'] is False)}")
print(f"  送電線 N1可: {sum(1 for l in lines if l['n1_eligible'] is True)}")
print(f"  送電線 N1不可: {sum(1 for l in lines if l['n1_eligible'] is False)}")
