# -*- coding: utf-8 -*-
"""--emit-plan ブロックを parse_kyushu.py の main() 末尾へ挿入する一回きりの補助"""
import io

PLAN_CODE = r'''
    # =========================================================================
    # --emit-plan: 本実行用の update_plan（microCMS 書込はしない）
    # 裁定（2026-08-20 承認）:
    #   1. kyu-764 待金→侍金（4項目一致＋「待金」不在を証明済）→ 名称更新・履歴保持
    #   2. 振り直し2件（大口 21_4→21_4(1)・ｱｲﾗﾝﾄﾞｼﾃｨ 27_11→27_11(1)）→ (1)側一致を
    #      フィールド突合で証明済（(2)は電圧面が異なり判別可能）→ slug維持・eid更新・履歴
    #   3. 新規6件のうち県が確定した4件のみ投入（null投入は厳禁＝基幹導出ヘルパの誤発火防止）:
    #        大口4(2)=鹿児島県（同名継承）・宮人23=鹿児島県（GSI: 伊佐市「大口宮人」muni46224）
    #        枕崎20(3)=鹿児島県（同名継承）・ｱｲﾗﾝﾄﾞｼﾃｨ11(2)=福岡県（同名継承）
    #      ★保留2件: 志和池13(3)（GSIで宮崎県都城市 muni45202 と確定したが、既存13(1)/(2)が
    #        鹿児島県で収録されており同時修正は裁定外＝3件まとめて要判断）・
    #        原田39（都城市と霧島市の両方に実在・地区マップPDFは画像で判定不能＝確定不能）
    #   4. 武雄 No『-』行は取り込まない（除外1件としてレポート残置）
    #   ＋ last_updated はレコード単位（7/27=14地区・7/28=17地区）
    #   ＋ source_url を現行URL（td_rHc7Jd0i.zip）へ全件更新（旧URLは404実測済み）
    # =========================================================================
    if args.emit_plan:
        VC_MAP = {500: "500kV系", 220: "220kV系", 110: "110kV系", 66: "66kV系", 22: "22kV系"}
        vclass = lambda kv: VC_MAP.get(kv, "その他") if kv is not None else "その他"  # noqa: E731
        iso = lambda d: f"{d}T00:00:00.000Z"  # noqa: E731

        NEW_PREF = {  # 県が確定した新規のみ（確定方法つき）
            "kyuden_21_4(2)": ("鹿児島県", "同名既存 kyu-619 大口（鹿児島県）から継承"),
            "kyuden_21_23": ("鹿児島県", "GSI地名検索: 伊佐市「大口宮人」「宮人」muni=46224"),
            "kyuden_23_20(3)": ("鹿児島県", "同名既存 kyu-708/709 枕崎（鹿児島県）から継承"),
            "kyuden_27_11(2)": ("福岡県", "同名既存 kyu-798 ｱｲﾗﾝﾄﾞｼﾃｨ（福岡県）から継承"),
        }
        HOLD = {
            "kyuden_22_13(3)": "志和池: GSIで宮崎県都城市（muni=45202）と確定したが、既存13(1)/(2)が"
                               "鹿児島県で収録済み。同時修正は裁定外のため3件まとめて要判断（今回保留）",
            "kyuden_22_39": "原田: 都城市（宮崎）と霧島市（鹿児島）の両方に実在し、地区マップPDFは"
                            "画像ベースで判定不能＝県を確定できず保留（次回更新待ち）",
        }

        RENUM_BY_SLUG = {x["slug"]: x for x in renumber}
        RENAME_BY_SLUG = {x["slug"]: x for x in renamed}
        NUMF = ["units", "capacity_total_mw", "cap_operational_mw", "forecast_flow_mw",
                "cap_avail_mw", "cap_avail_upper_mw", "n1_capacity_mw"]
        updates, value_changed, n1_skip, oc_skip = [], 0, 0, 0
        for b_, r_ in matched:
            patch, changed = {}, []
            for k in NUMF:
                ov, nv = b_.get(k), r_.get(k)
                if nv is None:
                    continue
                if ov is None or abs(float(ov) - float(nv)) > 1e-6:
                    patch[k] = nv
                    changed.append(k)
            if r_.get("op_constraint") and (b_.get("op_constraint") or "") != r_["op_constraint"]:
                patch["op_constraint"] = r_["op_constraint"]
                changed.append("op_constraint")
            if r_.get("n1_eligible") is None:
                if b_.get("n1_eligible") is not None:
                    n1_skip += 1
            elif bool(b_.get("n1_eligible")) != r_["n1_eligible"]:
                patch["n1_eligible"] = r_["n1_eligible"]
                changed.append("n1_eligible")
            if r_.get("oc_possibility") is None:
                if b_.get("oc_possibility") is not None:
                    oc_skip += 1
            elif (b_.get("oc_possibility") or None) != r_["oc_possibility"]:
                patch["oc_possibility"] = [r_["oc_possibility"]]
                changed.append("oc_possibility")
            if any(c in NUMF for c in changed):
                value_changed += 1
            rn = RENUM_BY_SLUG.get(b_["slug"])
            if rn:
                patch["external_id"] = rn["new_external_id"]
                changed.append("external_id")
            nm = RENAME_BY_SLUG.get(b_["slug"])
            if nm:
                patch["name"] = nm["new_name"]
                changed.append("name")
            patch["last_updated"] = iso(r_["last_updated"])
            patch["source_url"] = ZIP_URL          # 旧URLは404（全件更新）
            updates.append({"slug": b_["slug"], "patch": patch, "changed": changed})

        creates, held = [], []
        next_no = 880
        for r_ in sorted(new_rows, key=lambda x: (x["district"], x["no"])):
            eid = r_["external_id"]
            if eid in HOLD:
                held.append({"external_id": eid, "name": r_["name"], "reason": HOLD[eid]})
                continue
            pref, evidence = NEW_PREF[eid]
            slug = f"kyu-{next_no}"
            next_no += 1
            content = {
                "name": r_["name"], "slug": slug,
                "operator": ["九州電力送配電"], "area": ["九州"],
                "prefecture": pref,                 # ★null投入は厳禁（基幹導出ヘルパの誤発火）
                "voltage_primary_kv": r_["voltage_primary_kv"],
                "voltage_secondary_kv": r_["voltage_secondary_kv"],
                "voltage_class": [vclass(r_["voltage_primary_kv"])],
                "units": r_["units"],
                "capacity_total_mw": r_["capacity_total_mw"],
                "cap_operational_mw": r_["cap_operational_mw"],
                "op_constraint": r_["op_constraint"],
                "forecast_flow_mw": r_["forecast_flow_mw"],
                "cap_avail_mw": r_["cap_avail_mw"],
                "cap_avail_upper_mw": r_["cap_avail_upper_mw"],
                "n1_eligible": bool(r_["n1_eligible"]),
                "n1_capacity_mw": r_["n1_capacity_mw"],
                "external_id": eid,
                "non_firm_eligible": False,
                "source_url": ZIP_URL,
                "data_source_format": ["CSV"],
                "last_updated": iso(r_["last_updated"]),
            }
            if r_["oc_possibility"] is not None:
                content["oc_possibility"] = [r_["oc_possibility"]]
            content = {k: v for k, v in content.items() if v is not None}
            creates.append({"slug": slug, "external_id": eid, "name": r_["name"],
                            "prefecture": pref, "evidence": evidence, "content": content,
                            "n1_undetermined_as_false": r_["n1_eligible"] is None})

        plan = {
            "generated_on": R["generated_on"],
            "update_count": len(updates), "value_changed": value_changed,
            "create_count": len(creates), "held": held,
            "n1_undetermined_skipped": n1_skip, "oc_undetermined_skipped": oc_skip,
            "renumber": renumber, "renamed": renamed,
            "source_url_new": ZIP_URL,
            "updates": updates, "creates": creates,
        }
        Path("scripts/experimental/kyushu/update_plan_2607.json").write_text(
            json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
        lu = {}
        for u in updates:
            d = str(u["patch"]["last_updated"])[:10]
            lu[d] = lu.get(d, 0) + 1
        print("\n=== emit-plan ===")
        print(f"  更新PATCH: {plan['update_count']}（数値変化 {value_changed}・名称修正 {len(renamed)}・eid更新 {len(renumber)}）")
        print(f"  last_updated（レコード単位）: {lu}")
        print(f"  新規POST: {plan['create_count']}件（保留 {len(held)}件）")
        for c in creates:
            print(f"    + {c['slug']} {c['name']} {c['prefecture']} ← {c['evidence']}")
        for h in held:
            print(f"    保留: {h['external_id']} {h['name']}")
        print(f"  現値維持: N-1 {n1_skip} / 出力制御 {oc_skip}")
        print("  -> scripts/experimental/kyushu/update_plan_2607.json")
'''

p = "scripts/experimental/kyushu/parse_kyushu.py"
lines = io.open(p, encoding="utf-8").read().splitlines(True)
idx = None
for i, l in enumerate(lines):
    if "REPORT_MD} / {REPORT_JSON} / {N1_OUT}" in l and "print" in l:
        idx = i
        break
assert idx is not None
lines.insert(idx, PLAN_CODE + "\n")
io.open(p, "w", encoding="utf-8", newline="").writelines(lines)
import ast
ast.parse(io.open(p, encoding="utf-8").read())
print("挿入＋構文OK")
