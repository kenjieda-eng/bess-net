"""grid_ready が既存 static schema(16フィールド)と互換か検証＋不足フィールド分析。"""
import json, sys, glob, os
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

# 既存 static schema の16フィールド（全6,507件で共通）
CORE_16 = ["id","slug","name","prefecture","operator","area",
           "voltage_primary_kv","voltage_secondary_kv","capacity_total_mw",
           "cap_operational_mw","cap_avail_mw","n1_eligible","oc_possibility",
           "latitude","longitude","last_updated"]

# 既存レコードの型プロファイル（中部サンプルから）
existing = json.load(open("src/data/substations/静岡県.json", encoding="utf-8"))
ex_types = {}
for r in existing:
    for k, v in r.items():
        ex_types.setdefault(k, set()).add(type(v).__name__)

gr = json.load(open("scripts/experimental/tepco/tepco_grid_ready.json", encoding="utf-8"))
recs = gr["substations"]

print("=== 1. コア16フィールド: 全grid_readyレコードに存在するか ===")
missing_any = False
for f in CORE_16:
    n_present = sum(1 for r in recs if f in r)
    ok = "OK" if n_present == len(recs) else f"欠落{len(recs)-n_present}件"
    if n_present != len(recs): missing_any = True
    print(f"  {f:<22} {ok}")
print(f"  → コア16フィールド充足: {'YES' if not missing_any else 'NO'}")

print()
print("=== 2. 型互換（既存 静岡県 vs grid_ready）===")
for f in CORE_16:
    ex_t = ex_types.get(f, set())
    gr_t = set()
    for r in recs:
        gr_t.add(type(r[f]).__name__)
    # null(None)は許容
    print(f"  {f:<22} 既存={sorted(ex_t)} grid_ready={sorted(gr_t)}")

print()
print("=== 3. TEPCO拡張フィールド（16コア外、microCMS full型用）===")
extra = [k for k in recs[0].keys() if k not in CORE_16]
for k in extra:
    print(f"  + {k}")

print()
print("=== 4. 不足データ（TEPCOが埋められない既存フィールド）===")
n_no_geo = sum(1 for r in recs if r["latitude"] is None)
n_no_vp  = sum(1 for r in recs if r["voltage_primary_kv"] is None)
n_no_oc  = sum(1 for r in recs if r["oc_possibility"] is None)
print(f"  latitude/longitude=null : {n_no_geo}/{len(recs)} 件（地図はPhase 2c+で後付け）")
print(f"  voltage_primary_kv=null : {n_no_vp}/{len(recs)} 件（配電用/22kVは1次電圧非掲載）")
print(f"  oc_possibility=null     : {n_no_oc}/{len(recs)} 件")

print()
print("=== 5. cap_avail_mw 充足（/grid 空容量表示の母数）===")
n_cap = sum(1 for r in recs if r["cap_avail_mw"] is not None)
print(f"  cap_avail_mw 実数あり: {n_cap}/{len(recs)} 件（distribution＝連系判断の actionable データ）")

print()
print("=== 6. slug 一意性 ===")
slugs = [r["slug"] for r in recs]
print(f"  slug ユニーク: {len(set(slugs))}/{len(slugs)} {'OK' if len(set(slugs))==len(slugs) else 'DUP!'}")

print()
print("=== 7. 既存 prefecture ファイルとの衝突（TEPCO partial overlap）===")
existing_pref_files = [os.path.basename(f).replace('.json','') for f in glob.glob('src/data/substations/*.json')]
tepco_prefs = set(r["prefecture"] for r in recs if r["prefecture"])
for p in sorted(tepco_prefs):
    collide = "★既存ファイルあり(他社データ)" if p in existing_pref_files else "新規"
    n = sum(1 for r in recs if r["prefecture"]==p)
    print(f"  {p:<10} {n:>4}件  {collide}")
