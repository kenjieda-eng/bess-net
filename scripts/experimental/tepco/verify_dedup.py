import json, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
d = json.load(open("scripts/experimental/tepco/tepco_dedup.json", encoding="utf-8"))
sites = d["sites"]

print("=== 1. 複数regionにまたがるサイト（23区↔多摩 等の誤マージ検出）===")
multi_region = [s for s in sites if len(s["regions"]) > 1]
print(f"  複数region サイト: {len(multi_region)}件")
for s in multi_region:
    print(f"  ■ {s['name']} ({s['grid_pref']}) regions={s['regions']} levels={s['n_levels']}")
    for l in s["voltage_levels"]:
        print(f"      {l['external_id']:<24} {l['type']:<12} V={l['voltage_primary_kv']}/{l['voltage_secondary_kv']} "
              f"設備={l['capacity_equip_mw']} cap_avail={l['cap_avail_mw']}")

print()
print("=== 2. サンプル: 水戸北部（154/66クロスリスト→1サイト1レベル）===")
for s in sites:
    if s["name"] == "水戸北部" and s["grid_pref"] == "茨城県":
        print(json.dumps(s, ensure_ascii=False, indent=2)[:800])

print()
print("=== 3. サンプル: 新栃木（tochigi 154kV + kikan 275kV → 1サイト複数レベル）===")
for s in sites:
    if s["name"] == "新栃木":
        print(f"  grid_pref={s['grid_pref']} regions={s['regions']} n_levels={s['n_levels']}")
        for l in s["voltage_levels"]:
            print(f"    {l['external_id']:<24} {l['type']:<8} V={l['voltage_primary_kv']}/{l['voltage_secondary_kv']} "
                  f"設備={l['capacity_equip_mw']} 運用={l['capacity_op_mw']} bank_agg={l['bank_aggregated']} n1cap={l['n1_capacity_mw']}")

print()
print("=== 4. サンプル: 東京23区 主要(distribution)サイトの空容量 ===")
cnt = 0
for s in sites:
    if "東京都（23区）" in s["regions"] and s["has_distribution"]:
        print(f"  {s['name']:<12} grid_pref={s['grid_pref']} cap_avail={s['site_cap_avail_mw']} levels={s['n_levels']}")
        cnt += 1
        if cnt >= 6: break

print()
print("=== 5. サンプル: 神奈川 主要サイト ===")
cnt = 0
for s in sites:
    if s["grid_pref"] == "神奈川県" and s["n_levels"] > 1:
        print(f"  {s['name']:<12} regions={s['regions']} levels={s['n_levels']} cap_avail={s['site_cap_avail_mw']} n1cap={s['site_n1_capacity_mw']}")
        cnt += 1
        if cnt >= 8: break

print()
print("=== 6. voltage_levels>1 のサイト件数（複数面サイト）===")
multi_lv = [s for s in sites if s["n_levels"] > 1]
print(f"  複数面サイト: {len(multi_lv)}件 / 全{len(sites)}サイト")
print("  内訳例（上位10、レベル数順）:")
for s in sorted(multi_lv, key=lambda x:-x["n_levels"])[:10]:
    classes = [l["voltage_class"] for l in s["voltage_levels"]]
    print(f"    {s['name']:<12} ({s['grid_pref']}) {s['n_levels']}面 {classes}")
