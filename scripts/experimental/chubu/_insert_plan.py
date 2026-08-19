# -*- coding: utf-8 -*-
"""--emit-plan ブロックを parse_chubu.py の main() 末尾（出力printの直前）へ挿入する一回きりの補助"""
import io

PLAN_CODE = r'''
    # =========================================================================
    # --emit-plan: 本実行用の update_plan（microCMS 書込はしない）
    # 裁定（2026-08-19 承認）:
    #   1. cb-6240 電圧面変化 33/6.6→77/6.6 は slug 維持で更新（関西の篠山と同処理）
    #   2. cb-2037 へ座標新規付与（公式GeoJSONの値・座標保有 1,081→1,082）
    #   3. 座標が異なる14件は新公表値を採用。全15件を GSI逆ジオコーダで県一致確認済（保留0）。
    #      旧→新は _common/coordinate_history.json に退避
    #   4. 空容量「-」193件への算出適用は不採用（公表側が算出式を明記していない。null 維持）
    #   ＋ last_updated は全件 2026-08-17（版割れなし・一律）
    # =========================================================================
    if args.emit_plan:
        VC_MAP = {500: "500kV系", 275: "275kV系", 187: "187kV系", 154: "154kV系",
                  110: "110kV系", 77: "77kV系", 66: "66kV系", 22: "22kV系", 13.8: "13.8kV系"}
        vclass = lambda kv: VC_MAP.get(kv, "その他") if kv is not None else "その他"  # noqa: E731
        LAST_UPDATED = "2026-08-17T00:00:00.000Z"

        # 座標の採用対象（裁定2・3）: slug -> (lat,lng)
        coord_updates = {x["slug"]: (x["new"][0], x["new"][1]) for x in coord_diff}
        coord_updates.update({x["slug"]: (x["lat"], x["lng"]) for x in coord_gain})

        NUMF = ["units", "capacity_total_mw", "cap_operational_mw", "cap_avail_mw", "n1_capacity_mw"]
        updates, value_changed, oc_changed, con_changed = [], 0, 0, 0

        def build_patch(b_, r_, face_change):
            patch, changed = {}, []
            for k in NUMF:
                ov, nv = b_.get(k), r_.get(k)
                if nv is None:
                    continue   # 裁定4: 空容量'-'は null 維持（送信しない）。他欄の欠落も現値維持
                if ov is None or abs(float(ov) - float(nv)) > 1e-6:
                    patch[k] = nv
                    changed.append(k)
            if r_.get("op_constraint") and (b_.get("op_constraint") or "") != r_["op_constraint"]:
                patch["op_constraint"] = r_["op_constraint"]
                changed.append("op_constraint")
            if r_.get("n1_eligible") is not None and bool(b_.get("n1_eligible")) != r_["n1_eligible"]:
                patch["n1_eligible"] = r_["n1_eligible"]
                changed.append("n1_eligible")
            if r_.get("oc_possibility") is not None and (b_.get("oc_possibility") or None) != r_["oc_possibility"]:
                patch["oc_possibility"] = [r_["oc_possibility"]]
                changed.append("oc_possibility")
            if face_change:
                patch["voltage_primary_kv"] = r_["voltage_primary_kv"]
                patch["voltage_secondary_kv"] = r_["voltage_secondary_kv"]
                patch["voltage_class"] = [vclass(r_["voltage_primary_kv"])]
                changed += ["voltage_primary_kv", "voltage_secondary_kv", "voltage_class"]
            sl = b_["slug"]
            if sl in coord_updates:
                lat, lng = coord_updates[sl]
                patch["latitude"] = lat
                patch["longitude"] = lng
                changed.append("coords")
            patch["last_updated"] = LAST_UPDATED
            return patch, changed

        fc_by_slug = {x["slug"] for x in face_changed}
        # face_changed の新CSV行を取り出すヘルパ
        def new_row_for(slug_eid):
            return next(y for y in kept if NFKC(y["external_id"]) == NFKC(slug_eid))

        for b_, r_ in matched:
            patch, changed = build_patch(b_, r_, face_change=False)
            if any(c in NUMF for c in changed):
                value_changed += 1
            if "oc_possibility" in changed:
                oc_changed += 1
            if "op_constraint" in changed:
                con_changed += 1
            updates.append({"slug": b_["slug"], "patch": patch, "changed": changed})
        for x in face_changed:
            b_ = next(y for y in base if y["slug"] == x["slug"])
            r_ = new_row_for(x["external_id"])
            patch, changed = build_patch(b_, r_, face_change=True)
            updates.append({"slug": b_["slug"], "patch": patch, "changed": changed})

        plan = {
            "generated_on": R["generated_on"], "last_updated": LAST_UPDATED,
            "update_count": len(updates),
            "value_changed": value_changed,
            "oc_changed": oc_changed, "op_constraint_changed": con_changed,
            "face_changed": [x["slug"] for x in face_changed],
            "coord_update_count": len(coord_updates),
            "coord_updates": [{"slug": s, "lat": v[0], "lng": v[1]} for s, v in sorted(coord_updates.items())],
            "coord_history": [{"slug": x["slug"], "name": x["name"], "old": x["old"], "new": x["new"]}
                               for x in coord_diff],
            "coord_gain": coord_gain,
            "updates": updates,
        }
        Path("scripts/experimental/chubu/update_plan_2608.json").write_text(
            json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
        print("\n=== emit-plan ===")
        chset = sum(1 for u in updates if u["changed"])
        print(f"  更新PATCH: {plan['update_count']}（changedあり {chset}）")
        print(f"  数値欄の値変化レコード: {value_changed}（承認dry-runの369＋電圧面変化1の内訳確認用）")
        print(f"  oc変化: {oc_changed} / 制約要因変化: {con_changed}")
        print(f"  電圧面変化: {plan['face_changed']}")
        print(f"  座標更新: {plan['coord_update_count']}件（修正{len(coord_diff)}＋新規{len(coord_gain)}）")
        print("  -> scripts/experimental/chubu/update_plan_2608.json")
'''

p = "scripts/experimental/chubu/parse_chubu.py"
lines = io.open(p, encoding="utf-8").read().splitlines(True)
idx = None
for i, l in enumerate(lines):
    if "REPORT_MD} / {REPORT_JSON} / {N1_OUT}" in l and "print" in l:
        idx = i
        break
assert idx is not None, "anchor line not found"
lines.insert(idx, PLAN_CODE + "\n")
io.open(p, "w", encoding="utf-8", newline="").writelines(lines)
import ast
ast.parse(io.open(p, encoding="utf-8").read())
print("挿入＋構文OK")
