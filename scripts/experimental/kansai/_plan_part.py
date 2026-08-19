
    # =========================================================================
    # --emit-plan: 本実行用の update_plan を生成（microCMS 書込はしない）
    # 裁定（2026-08-19 承認）:
    #   1. 高時川 = 滋ED（5項目一致で証明済）→ slug維持・external_id更新・履歴追記
    #   2. 電圧面変化3件（篠山・山口・大池 77/6.6→22/6.6）→ 旧77kV行の完全消滅を確認済
    #      → 同一設備の更新として slug 維持で電圧面・電圧階級を更新
    #   3. 消滅5件 → DELETE せず凍結（substations-frozen.json 側で対応・本プラン対象外）
    #   4. last_updated は全件 2026-08-17（版割れなしのため一律）
    # =========================================================================
    if args.emit_plan:
        VC_MAP = {500: "500kV系", 275: "275kV系", 187: "187kV系", 154: "154kV系",
                  110: "110kV系", 77: "77kV系", 66: "66kV系", 22: "22kV系", 13.8: "13.8kV系"}
        vclass = lambda kv: VC_MAP.get(kv, "その他") if kv is not None else "その他"  # noqa: E731
        LAST_UPDATED = "2026-08-17T00:00:00.000Z"

        # ── 新規83件の slug 採番（既存slugと衝突ゼロ・全国レベルで確認）──
        lists = json.load(open("src/lib/generated/grid-area-lists.json", encoding="utf-8"))
        taken = {s["slug"] for rows_ in lists["by_area"].values() for s in rows_}
        taken |= {x["slug"] for x in base}
        frozen_json = json.load(open("src/data/substations-frozen.json", encoding="utf-8"))
        taken |= set(frozen_json["frozen"].keys())

        def base_token(no_norm: str) -> str:
            """No.正規化値 → slug の基幹トークン。既存規約に合わせる:
            接頭辞（海/陸/北/神/京/姫/南/滋/和/奈）は落とす（例 海Ａ→a・姫GE→ge）。
            枝番 -N は 000N（例 AI-1→ai0001）。英字直後の数字も0詰め（姫F1→f0001）。"""
            t = re.sub(r"^(海|陸|北|神|京|姫|南|滋|和|奈)", "", no_norm)
            m = re.fullmatch(r"([A-Z]+)-(\d+)", t)
            if m:
                return f"{m.group(1).lower()}{int(m.group(2)):04d}"
            m = re.fullmatch(r"([A-Z]+)(\d+)", t)
            if m:
                return f"{m.group(1).lower()}{int(m.group(2)):04d}"
            return t.lower()

        def assign_slug(prefix: str, no_norm: str) -> str:
            b_ = f"{prefix}{base_token(no_norm)}"
            if b_ not in taken:
                taken.add(b_)
                return b_
            n = 2
            while f"{b_}-{n}" in taken:
                n += 1
            s_ = f"{b_}-{n}"
            taken.add(s_)
            return s_

        # ── 新規×既存の同名チェック（電圧面が異なる別バンクであることの根拠）──
        base_by_name = {}
        for x in base:
            base_by_name.setdefault(clean_name(x.get("name")), []).append(x)
        dup_proof, dup_block = [], []
        for r in new_rows:
            same = base_by_name.get(r["name"], [])
            if not same:
                continue
            faces = [vkey(x["voltage_primary_kv"], x["voltage_secondary_kv"]) for x in same]
            nf = vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])
            rec = {"name": r["name"], "new_external_id": r["external_id"], "new_face": nf,
                   "existing": [{"slug": x["slug"], "external_id": x.get("external_id"),
                                 "face": vkey(x["voltage_primary_kv"], x["voltage_secondary_kv"])}
                                for x in same]}
            if nf in faces:
                dup_block.append(rec)   # 同名かつ同一電圧面 → 判別不能・保留
            else:
                dup_proof.append(rec)

        # ── creates ──
        RENUM_NEW_EID = {x["new_external_id"] for x in renumber}
        creates = []
        for r in new_rows:
            slug = assign_slug(r["slug_prefix"], r["no"])
            content = {
                "name": r["name"], "slug": slug,
                "operator": ["関西電力送配電"], "area": ["関西"],
                "voltage_primary_kv": r["voltage_primary_kv"],
                "voltage_secondary_kv": r["voltage_secondary_kv"],
                "voltage_class": [vclass(r["voltage_primary_kv"])],
                "units": r["units"],
                "capacity_total_mw": r["capacity_total_mw"],
                "cap_operational_mw": r["cap_operational_mw"],
                "op_constraint": r["op_constraint"],
                "forecast_flow_mw": r["forecast_flow_mw"],
                "cap_avail_mw": r["cap_avail_mw"],
                "cap_avail_upper_mw": r["cap_avail_upper_mw"],
                # boolean は null 不可。未算定（None）は false で入るため n1_zero 系の扱いに注意
                "n1_eligible": bool(r["n1_eligible"]),
                "n1_capacity_mw": r["n1_capacity_mw"],
                "external_id": r["external_id"],
                "non_firm_eligible": False,
                "source_url": f"{BASE_URL}/154kv_{'more' if r['set'] == 'more' else 'less'}_trans.csv",
                "data_source_format": ["CSV"],
                "last_updated": LAST_UPDATED,
            }
            if r["oc_possibility"] is not None:
                content["oc_possibility"] = [r["oc_possibility"]]
            if r["set"] == "less":
                content["prefecture"] = "関西ローカル系"   # 既存1,575件と同じ原値
            # 基幹は prefecture を持たせない → facility_class「基幹系統」がヘルパで導出される
            content = {k: v for k, v in content.items() if v is not None}
            creates.append({"slug": slug, "set": r["set"], "external_id": r["external_id"],
                            "content": content,
                            "n1_undetermined_as_false": r["n1_eligible"] is None})

        # ── updates（matched 全件 + 電圧面変化3件。last_updated は一律）──
        RENUM_BY_SLUG = {x["slug"]: x for x in renumber}
        NUMF = ["units", "capacity_total_mw", "cap_operational_mw", "forecast_flow_mw",
                "cap_avail_mw", "cap_avail_upper_mw", "n1_capacity_mw"]
        updates, n1_skip, oc_skip = [], 0, 0

        def build_patch(b_, r_, face_change):
            patch, changed = {}, []
            for k in NUMF:
                ov, nv = b_.get(k), r_.get(k)
                if nv is None:
                    continue   # 新CSVで欠落 → 現値維持（フィールド未送信）
                if ov is None or abs(float(ov) - float(nv)) > 1e-6:
                    patch[k] = nv
                    changed.append(k)
            if r_.get("op_constraint") and (b_.get("op_constraint") or "") != r_["op_constraint"]:
                patch["op_constraint"] = r_["op_constraint"]
                changed.append("op_constraint")
            if r_.get("n1_eligible") is None:
                if b_.get("n1_eligible") is not None:
                    pass   # 現値維持
            elif bool(b_.get("n1_eligible")) != r_["n1_eligible"]:
                patch["n1_eligible"] = r_["n1_eligible"]
                changed.append("n1_eligible")
            if r_.get("oc_possibility") is None:
                pass       # 現値維持
            elif (b_.get("oc_possibility") or None) != r_["oc_possibility"]:
                patch["oc_possibility"] = [r_["oc_possibility"]]
                changed.append("oc_possibility")
            if face_change:
                patch["voltage_primary_kv"] = r_["voltage_primary_kv"]
                patch["voltage_secondary_kv"] = r_["voltage_secondary_kv"]
                patch["voltage_class"] = [vclass(r_["voltage_primary_kv"])]
                changed += ["voltage_primary_kv", "voltage_secondary_kv", "voltage_class"]
            patch["last_updated"] = LAST_UPDATED
            return patch, changed

        for b_, r_ in matched:
            patch, changed = build_patch(b_, r_, face_change=False)
            if r_.get("n1_eligible") is None and b_.get("n1_eligible") is not None:
                n1_skip += 1
            if r_.get("oc_possibility") is None and b_.get("oc_possibility") is not None:
                oc_skip += 1
            rn = RENUM_BY_SLUG.get(b_["slug"])
            if rn:
                patch["external_id"] = rn["new_external_id"]
                changed.append("external_id")
            updates.append({"slug": b_["slug"], "patch": patch, "changed": changed})
        # 電圧面変化3件（matched に入っていない）
        fc_slugs = []
        for x in face_changed:
            b_ = next(y for y in base if y["slug"] == x["slug"])
            r_ = next(y for y in kept
                      if NFKC(y["external_id"]) == NFKC(x["external_id"])
                      and vkey(y["voltage_primary_kv"], y["voltage_secondary_kv"]) == x["new_voltage"])
            patch, changed = build_patch(b_, r_, face_change=True)
            updates.append({"slug": b_["slug"], "patch": patch, "changed": changed})
            fc_slugs.append(b_["slug"])

        plan = {
            "generated_on": R["generated_on"], "last_updated": LAST_UPDATED,
            "update_count": len(updates),
            "changed_count": sum(1 for u in updates if [c for c in u["changed"]]),
            "create_count": len(creates),
            "n1_undetermined_skipped": n1_skip, "oc_undetermined_skipped": oc_skip,
            "renumber": renumber, "face_changed_slugs": fc_slugs,
            "frozen_slugs": [x["slug"] for x in removed],
            "dup_proof": dup_proof, "dup_block": dup_block,
            "creates_n1_false_as_undetermined": sum(1 for c in creates if c["n1_undetermined_as_false"]),
            "updates": updates, "creates": creates,
        }
        Path("scripts/experimental/kansai/update_plan_2608.json").write_text(
            json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
        print("\n=== emit-plan ===")
        print(f"  更新PATCH: {plan['update_count']}（うち値変化 {sum(1 for u in updates if len([c for c in u['changed']]) > 0)}）")
        print(f"  新規POST: {plan['create_count']}（基幹 {sum(1 for c in creates if c['set'] == 'more')}"
              f" / ローカル {sum(1 for c in creates if c['set'] == 'less')}）")
        print(f"  現値維持: N-1 {n1_skip} / 出力制御 {oc_skip}")
        print(f"  新規で n1 未算定→false格納: {plan['creates_n1_false_as_undetermined']}件")
        print(f"  同名別バンク根拠: {len(dup_proof)}件 ／ ★判別不能（同名同面）: {len(dup_block)}件")
        for d in dup_block:
            print(f"    ★保留: {d['name']} {d['new_external_id']} face={d['new_face']} 既存={d['existing']}")
        print(f"  slug例: {creates[0]['slug']} .. {creates[-1]['slug']}")
        print("  -> scripts/experimental/kansai/update_plan_2608.json")
