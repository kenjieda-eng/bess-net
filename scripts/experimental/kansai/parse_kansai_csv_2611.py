# -*- coding: utf-8 -*-
"""
scripts/experimental/kansai/parse_kansai_csv_2611.py

関西電力送配電 予想潮流等「2026年11月02日更新」版の dry-run 差分レポート（BW 便・2026-11-05）。
★microCMS への書込は一切行わない。baseline は GET 済みのローカル JSON
  （`python scripts/experimental/shikoku/fetch_baseline.py ksi- scripts/experimental/kansai/baseline_live_2611.json`）。

8/19 の parse_kansai_csv.py を写したもの。読み方・突合・差分の規則は同じ:
  - encoding は決め打ちしない（strict で utf-8-sig → cp932）
  - #120 注記行は No. 欄のホワイトリスト（NO_RE は 8/19 と同じ）
  - #111 重複除去は series_dedup（名称＋電圧面＋数値）。ルール②は使わない（#117）
  - 突合キー = external_id（kansai_{kikan|local}_{No.原文}）＋電圧面（#114 float 正規化）、
    タイブレーク = 設備容量 → 運用容量 → 台数（#115）
  - 空容量: 当該設備の欄が「-」「ー」なら 運用容量 − |予想潮流|（同社の留意事項(2)）
変えたのは、版に依存する定数・文言と、BW 便の報告項目の追加（◇・ＢＵ・凍結 5 件・基幹の丸ごと欠け・
府県の情報なし・未算定のハイフンの種類・No.＋名称の一致率・11/4 の府県の図にあった記号）だけ。
本実行の計画（8/19 の --emit-plan）は持たない（dry-run の便。本実行は承認後の別の便）。

使い方（リポジトリ直下）: python -P scripts/experimental/kansai/parse_kansai_csv_2611.py
"""
import collections, csv, io, json, re, sys, unicodedata
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402
from frozen import drop_frozen  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "src_2611"
BASELINE = HERE / "baseline_live_2611.json"
BASE_URL = "https://www.kansai-td.co.jp/interchange/takusou/pdf"
LANDING = "https://www.kansai-td.co.jp/consignment/disclosure/distribution-equipment/index.html"
OUT_JSON = Path("reports/grid-kansai-dryrun-2026-11-05.json")
N1_OUT = HERE.parent / "_common" / "n1_undetermined_kansai_2611.json"
NEW_VERSION = "2026-11-02"
CUR_VERSION = "2026-08-17"

SETS = [
    ("more", "154kv_more_trans.csv", "kansai_kikan_", "ksi-kikan-", "154kv_more_space.pdf"),
    ("less", "154kv_less_trans.csv", "kansai_local_", "ksi-local-", "154kv_less_space.pdf"),
]
COL = dict(no=0, name=1, kv1=2, kv2=3, units=4, cap_total=5, cap_op=6, constraint=7,
           flow=8, avail=9, avail_upper=10, n1=11, n1_mw=12, oc=13, oc_self=14,
           oc_upper=15, note=16)

# #120 ホワイトリスト（8/19 と同じ）: A / AA / AI-1 / 陸A / 海A（more）、北A / 姫GE / 姫F1（less）
NO_RE = re.compile(r"^(?:海|陸|北|神|京|姫|南|滋|和|奈)?[A-Z]{1,3}\d*(?:-\d+)?$")
NFKC = lambda s: unicodedata.normalize("NFKC", (s or "")).strip()  # noqa: E731
clean_name = lambda s: (s or "").strip()  # noqa: E731  #111 注記2: 全角スペースは半角化しない
HYPHENS = {"-", "－", "ー", "―", "‐", "−", "–", "—"}
# 11/4 の府県の調べで「図にあって当サイトに無い」とした記号（reports/kansai-prefecture-investigation-2026-11-04.md (2)）
MAP_ONLY_SYMBOLS = ["京CT", "京EA", "北F", "北GO", "南C", "南GC", "姫F", "姫FX"]


def read_csv_bytes(raw: bytes):
    attempts = []
    for enc in ("utf-8-sig", "cp932"):
        try:
            txt = raw.decode(enc, errors="strict")
            attempts.append(f"{enc} OK")
            return txt, enc, attempts
        except UnicodeDecodeError as e:
            attempts.append(f"{enc} NG（{e.reason}・{e.start} バイト目）")
    raise SystemExit("encoding 判定不能: " + " / ".join(attempts))


def to_float(v):
    s = NFKC(v)
    return float(s) if re.fullmatch(r"-?\d+(\.\d+)?", s) else None


def to_int(v):
    f = to_float(v)
    return int(f) if f is not None else None


def is_hyphen(v):
    s = (v or "").strip()
    return bool(s) and all(ch in HYPHENS for ch in s)


def hyphen_kind(v):
    s = (v or "").strip()
    return " ".join(f"U+{ord(ch):04X}「{ch}」" for ch in s)


def parse_n1(v):
    s = NFKC(v)
    if not s or is_hyphen(v) or s in ("-", "ー", "―", "‐"):
        return None
    if s.startswith("不可"):
        return False
    if s.startswith("可"):
        return True
    return None


def parse_oc(v):
    s = NFKC(v)
    if not s or is_hyphen(v) or s in ("-", "ー", "―", "‐"):
        return None
    if "有" in s:
        return "有り"
    if "無" in s or "な" in s:
        return "なし"
    return None


def vkey(a, b):
    f = lambda x: f"{float(x):g}" if x is not None else "-"  # noqa: E731
    return f"{f(a)}/{f(b)}"


def numeq(x, y):
    if x is None and y is None:
        return True
    if x is None or y is None:
        return False
    return abs(float(x) - float(y)) < 1e-6


def load_rows():
    files, rows, skipped = [], [], []
    for tag, fname, eid_prefix, slug_prefix, pdf in SETS:
        raw = (SRC / fname).read_bytes()
        txt, enc, attempts = read_csv_bytes(raw)
        data = list(csv.reader(io.StringIO(txt)))
        version = NFKC(data[0][0]) if data and data[0] else None
        cnt = 0
        for r in data[2:]:
            if not r or len(r) < 17:
                continue
            no_raw = (r[COL["no"]] or "").strip()
            no = NFKC(no_raw)
            if not no:
                continue
            if not NO_RE.match(no):
                skipped.append({"set": tag, "no": no[:60], "name": clean_name(r[COL["name"]]),
                                "reason": "No. 欄が設備の No. の形をしていない（注記行）"})
                continue
            flow = to_float(r[COL["flow"]])
            cap_op = to_float(r[COL["cap_op"]])
            avail_col = to_float(r[COL["avail"]])
            avail_up_col = to_float(r[COL["avail_upper"]])
            if avail_col is not None:
                avail, avail_src = avail_col, "欄の値（直読）"
            elif cap_op is not None and flow is not None:
                avail, avail_src = round(cap_op - abs(flow), 3), "運用容量−|予想潮流|（算出）"
            else:
                avail, avail_src = None, "算出不能（運用容量か予想潮流が公表されていない）"
            if avail_up_col is not None:
                avail_up = avail_up_col
            elif avail_src.startswith("運用容量"):
                avail_up = avail
            else:
                avail_up = None
            rows.append({
                "set": tag, "external_id": f"{eid_prefix}{no_raw}", "no": no, "no_raw": no_raw,
                "slug_prefix": slug_prefix, "name": clean_name(r[COL["name"]]),
                "voltage_primary_kv": to_float(r[COL["kv1"]]),
                "voltage_secondary_kv": to_float(r[COL["kv2"]]),
                "units": to_int(r[COL["units"]]),
                "capacity_total_mw": to_float(r[COL["cap_total"]]),
                "cap_operational_mw": cap_op,
                "op_constraint": NFKC(r[COL["constraint"]]) or None,
                "forecast_flow_mw": flow,
                "cap_avail_mw": avail, "cap_avail_upper_mw": avail_up, "avail_source": avail_src,
                "n1_eligible": parse_n1(r[COL["n1"]]), "n1_raw": (r[COL["n1"]] or "").strip(),
                "n1_capacity_mw": to_float(r[COL["n1_mw"]]),
                "oc_possibility": parse_oc(r[COL["oc"]]), "oc_raw": (r[COL["oc"]] or "").strip(),
                "note_raw": (r[COL["note"]] or "").strip(),
                "src_encoding": enc, "src_version": version,
            })
            cnt += 1
        files.append({"file": fname, "url": f"{BASE_URL}/{fname}", "bytes": len(raw),
                      "encoding": enc, "encoding_attempts": attempts, "version_row": version,
                      "pdf": f"{BASE_URL}/{pdf}", "data_rows": cnt})
    return files, rows, skipped


def main():
    R = {"generated_on": str(date.today()), "area": "関西", "operator": "関西電力送配電",
         "scope": "dry-run（差分レポートのみ・microCMS 書込 0・baseline は GET のみ）",
         "landing": LANDING, "new_version": NEW_VERSION, "current_version": CUR_VERSION,
         "warnings": [], "requires_judgement": []}

    files, raw_rows, skipped = load_rows()
    R["files"] = files
    print("=== 1. 取得ファイル ===")
    for f in files:
        print(f"  {f['file']} {f['bytes']}B {f['encoding_attempts']} 版={f['version_row']} 行={f['data_rows']}")
    R["excluded_note_rows"] = {"count": len(skipped), "rows": skipped}
    print(f"=== 2. 注記行の除外 {len(skipped)} 件 ===")
    for s in skipped:
        print(f"    [{s['set']}] {s['no'][:40]}")

    avail_stat = {t: dict(collections.Counter(r["avail_source"] for r in raw_rows if r["set"] == t))
                  for t in ("more", "less")}
    R["avail_calculation"] = avail_stat
    print("=== 3. 空容量の出し方 ===", avail_stat)

    # ── baseline（凍結を外す）──
    base_all = json.load(open(BASELINE, encoding="utf-8"))
    base = drop_frozen(base_all)
    frozen_recs = [b for b in base_all if b not in base]
    for b in base:
        for k in ["cap_avail_mw", "cap_avail_upper_mw", "cap_operational_mw", "capacity_total_mw",
                  "n1_capacity_mw", "units", "voltage_primary_kv", "voltage_secondary_kv",
                  "forecast_flow_mw"]:
            b.setdefault(k, None)
        b.setdefault("prefecture", None)
        oc = b.get("oc_possibility")
        b["oc_possibility"] = (oc[0] if isinstance(oc, list) and oc else None)
    R["baseline"] = {"file": str(BASELINE).replace("\\", "/"), "get_total": len(base_all),
                     "frozen_excluded": len(frozen_recs), "count": len(base),
                     "last_updated": dict(collections.Counter((b.get("last_updated") or "")[:10] for b in base))}

    # ── 4. 重複除去 ──
    kept, removed_dup = apply_series_dedup(
        raw_rows, {b.get("external_id") for b in base},
        enable_baseline_name_rule=False,   # #117
        key_id="external_id", key_name="name",
        value_keys=("voltage_primary_kv", "voltage_secondary_kv",
                    "cap_operational_mw", "forecast_flow_mw", "capacity_total_mw", "units"),
        group_key="set",
    )
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(removed_dup),
                   "rule2_baseline_name": "使用しない（#117）", "breakdown": summarize(removed_dup),
                   "examples": [{"external_id": e.get("external_id"), "name": e.get("name"),
                                 "voltage": vkey(e.get("voltage_primary_kv"), e.get("voltage_secondary_kv")),
                                 "reason": e.get("exclude_reason")} for e in removed_dup[:5]]}
    print(f"=== 4. 重複除去 {len(raw_rows)} → {len(kept)}（除去 {len(removed_dup)}）===")

    # ── 5. 突合 ──
    bidx = {}
    for b in base:
        bidx.setdefault(NFKC(b.get("external_id")), []).append(b)
    used, matched, new_rows, ambiguous = set(), [], [], []
    for r in kept:
        cands = [b for b in bidx.get(NFKC(r["external_id"]), []) if id(b) not in used]
        if not cands:
            new_rows.append(r)
            continue
        face = [b for b in cands if vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"])
                == vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])]
        if not face:
            new_rows.append(r)
            continue
        if len(face) > 1:
            for k in ("capacity_total_mw", "cap_operational_mw", "units"):
                nar = [b for b in face if numeq(b.get(k), r.get(k))]
                if len(nar) == 1:
                    face = nar
                    break
                if nar:
                    face = nar
            if len(face) > 1:
                ambiguous.append({"external_id": r["external_id"], "name": r["name"],
                                  "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                                  "candidates": [b["slug"] for b in face]})
        b = face[0]
        used.add(id(b))
        matched.append((b, r))
    removed = [b for b in base if id(b) not in used]
    print(f"=== 5. マッチ {len(matched)} / 新規候補 {len(new_rows)} / 消滅候補 {len(removed)} / 曖昧 {len(ambiguous)} ===")

    # 一括シフトの検査: external_id が同じ組で名前が一致する割合（set 別）
    shift = {}
    for t in ("more", "less"):
        pairs = [(b, r) for b, r in matched if r["set"] == t]
        same = sum(1 for b, r in pairs if clean_name(b.get("name")) == r["name"])
        shift[t] = {"matched": len(pairs), "same_name": same}
    R["external_id_shift_check"] = shift

    # ── 6. 振り直し（新規×消滅で 名称＋電圧面＋設備容量 が一致）──
    renumber = []
    for r in list(new_rows):
        for b in list(removed):
            if (clean_name(b.get("name")) == r["name"]
                    and vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"])
                    == vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])
                    and numeq(b.get("capacity_total_mw"), r.get("capacity_total_mw"))):
                renumber.append({"slug": b["slug"], "name": r["name"],
                                 "old_external_id": b.get("external_id"), "new_external_id": r["external_id"],
                                 "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                                 "capacity_total_mw": r.get("capacity_total_mw"), "units": r.get("units"),
                                 "old_units": b.get("units"),
                                 "old_cap_operational_mw": b.get("cap_operational_mw"),
                                 "new_cap_operational_mw": r.get("cap_operational_mw")})
                new_rows.remove(r)
                removed.remove(b)
                matched.append((b, r))
                break
    # ── 6-2. 同一 No.・同一名称で電圧面が変化 ──
    face_changed = []
    for r in list(new_rows):
        for b in list(removed):
            if NFKC(b.get("external_id")) == NFKC(r["external_id"]) and clean_name(b.get("name")) == r["name"]:
                face_changed.append({"slug": b["slug"], "external_id": b.get("external_id"), "name": r["name"],
                                     "old_voltage": vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"]),
                                     "new_voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                                     "old_units": b.get("units"), "new_units": r.get("units"),
                                     "old_capacity_total_mw": b.get("capacity_total_mw"),
                                     "new_capacity_total_mw": r.get("capacity_total_mw")})
                new_rows.remove(r)
                removed.remove(b)
                break
    # ── 6-3. 同一 No. で名称が変わった行（電圧面も一致して突合された組）＋新規×消滅で同 No.・別名 ──
    renamed = []
    for b, r in matched:
        bn, rn = clean_name(b.get("name")), r["name"]
        if bn and rn and bn != rn:
            renamed.append({"slug": b["slug"], "external_id": b.get("external_id"), "old_name": bn,
                            "new_name": rn, "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                            "old_name_in_new_csv": any(x["name"] == bn for x in kept)})
    renamed_unmatched = []
    for r in new_rows:
        for b in removed:
            if NFKC(b.get("external_id")) == NFKC(r["external_id"]):
                renamed_unmatched.append({"slug": b["slug"], "external_id": b.get("external_id"),
                                          "old_name": clean_name(b.get("name")), "new_name": r["name"],
                                          "old_voltage": vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"]),
                                          "new_voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                                          "old_name_in_new_csv": any(x["name"] == clean_name(b.get("name")) for x in kept)})
    print(f"=== 6. 振り直し {len(renumber)} / 電圧面変化 {len(face_changed)} / 名称変更 {len(renamed)}＋{len(renamed_unmatched)} ===")

    # ── 7. フィールド差分 ──
    FIELDS = [("cap_avail_mw", "空き容量（当該設備）"), ("cap_avail_upper_mw", "空容量（上位系等考慮）"),
              ("forecast_flow_mw", "予想潮流"), ("cap_operational_mw", "運用容量"),
              ("capacity_total_mw", "設備容量"), ("n1_capacity_mw", "N-1電制適用可能量"), ("units", "台数")]
    field_stats, changed_slugs = {}, set()
    for key, label in FIELDS:
        chg = filled = lost = 0
        for b, r in matched:
            ov, nv = b.get(key), r.get(key)
            if nv is None and ov is not None:
                lost += 1
                continue
            if ov is None and nv is not None:
                filled += 1
                changed_slugs.add(b["slug"])
                continue
            if ov is not None and nv is not None and not numeq(ov, nv):
                chg += 1
                changed_slugs.add(b["slug"])
        field_stats[label] = {"変化": chg, "新規充足": filled, "新CSVで欠落(現値維持)": lost}
    # 文字の欄（運用容量制約要因）・N-1 可否・出力制御の可能性
    other = {"op_constraint": 0, "n1_eligible": 0, "oc_possibility": 0}
    for b, r in matched:
        if r.get("op_constraint") and (b.get("op_constraint") or "") != r["op_constraint"]:
            other["op_constraint"] += 1
            changed_slugs.add(b["slug"])
        if r.get("n1_eligible") is not None and bool(b.get("n1_eligible")) != r["n1_eligible"]:
            other["n1_eligible"] += 1
            changed_slugs.add(b["slug"])
        if r.get("oc_possibility") is not None and (b.get("oc_possibility") or None) != r["oc_possibility"]:
            other["oc_possibility"] += 1
            changed_slugs.add(b["slug"])
    for x in renumber:
        changed_slugs.add(x["slug"])
    print("=== 7. フィールド差分 ===", field_stats, other)

    # ── 8. 空き容量の増減 ──
    dec, inc, zeroed = [], [], []
    for b, r in matched:
        ov, nv = b.get("cap_avail_mw"), r.get("cap_avail_mw")
        if ov is None or nv is None or numeq(ov, nv):
            continue
        rec = {"slug": b["slug"], "name": clean_name(b.get("name")), "set": r["set"],
               "external_id": b.get("external_id"),
               "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
               "from": ov, "to": nv, "delta": round(nv - ov, 3), "how": r["avail_source"]}
        (dec if nv < ov else inc).append(rec)
        if nv <= 0 < ov:
            zeroed.append(rec)
    dec.sort(key=lambda x: (x["delta"], x["slug"]))
    inc.sort(key=lambda x: (-x["delta"], x["slug"]))
    zeroed.sort(key=lambda x: (x["delta"], x["slug"]))
    filled_avail = [{"slug": b["slug"], "name": clean_name(b.get("name")), "to": r.get("cap_avail_mw"),
                     "how": r["avail_source"]}
                    for b, r in matched if b.get("cap_avail_mw") is None and r.get("cap_avail_mw") is not None]
    print(f"=== 8. 空き容量 減 {len(dec)}（ゼロ化 {len(zeroed)}）/ 増 {len(inc)} / 新規充足 {len(filled_avail)} ===")

    # ── 9. 未算定（ハイフン）──
    hy = {}
    for t in ("more", "less"):
        rows_t = [r for r in kept if r["set"] == t]
        hy[t] = {
            "N-1電制適用可否": dict(collections.Counter(hyphen_kind(r["n1_raw"]) for r in rows_t if is_hyphen(r["n1_raw"]))),
            "平常時出力制御の可能性": dict(collections.Counter(hyphen_kind(r["oc_raw"]) for r in rows_t if is_hyphen(r["oc_raw"]))),
        }
    n1_und = [{"operator": "関西電力送配電", "area": "関西", "slug": b["slug"],
               "external_id": b.get("external_id"), "name": clean_name(b.get("name")),
               "prefecture": b.get("prefecture"), "stored_n1_eligible": b.get("n1_eligible"),
               "csv_value": r["n1_raw"], "source": f"154kv_{r['set']}_trans.csv（{NEW_VERSION} 更新）"}
              for b, r in matched if r.get("n1_eligible") is None and b.get("n1_eligible") is not None]
    oc_und = [{"slug": b["slug"], "name": clean_name(b.get("name")), "stored": b.get("oc_possibility"),
               "csv_value": r["oc_raw"]}
              for b, r in matched if r.get("oc_possibility") is None and b.get("oc_possibility") is not None]
    n1_chg = [{"slug": b["slug"], "name": clean_name(b.get("name")), "from": b.get("n1_eligible"),
               "to": r.get("n1_eligible")}
              for b, r in matched if r.get("n1_eligible") is not None and bool(b.get("n1_eligible")) != r["n1_eligible"]]
    new_n1_und = [r["external_id"] for r in new_rows if r.get("n1_eligible") is None]
    N1_OUT.write_text(json.dumps({"count": len(n1_und), "version": NEW_VERSION, "entries": n1_und},
                                 ensure_ascii=False, indent=1), encoding="utf-8")
    try:
        n1s = json.load(open("src/data/n1-status.json", encoding="utf-8"))
        n1s_kansai = {k: v for k, v in (n1s.get("entries") or {}).items() if str(k).startswith("ksi-")}
    except Exception as e:  # noqa: BLE001
        n1s_kansai = {"error": str(e)}
    print(f"=== 9. 未算定: N-1 {len(n1_und)} / 出力制御 {len(oc_und)} / N-1 可否の変化 {len(n1_chg)} ===", hy)

    # ── 10. ◇・ＢＵ・凍結 5 件・基幹の丸ごと欠け・府県 ──
    diamonds = {t: [{"no": r["no_raw"], "name": r["name"], "note": r["note_raw"],
                     "values": {k: r[k] for k in ("voltage_primary_kv", "voltage_secondary_kv", "units",
                                                 "capacity_total_mw", "cap_operational_mw", "forecast_flow_mw")}}
                    for r in kept if r["set"] == t and "◇" in r["note_raw"]] for t in ("more", "less")}
    bu_rows = [r for r in kept if NFKC(r["no_raw"]) == "BU" and r["set"] == "more"]
    bu_base = next((b for b in base if b["slug"] == "ksi-kikan-bu"), None)
    bu_pair = next(((b, r) for b, r in matched if b["slug"] == "ksi-kikan-bu"), None)
    bu = {"csv_rows": [{"no": r["no_raw"], "name": r["name"], "note": r["note_raw"],
                        "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                        "units": r["units"], "capacity_total_mw": r["capacity_total_mw"],
                        "cap_operational_mw": r["cap_operational_mw"], "forecast_flow_mw": r["forecast_flow_mw"],
                        "n1_raw": r["n1_raw"], "oc_raw": r["oc_raw"]} for r in bu_rows],
          "baseline": {k: bu_base.get(k) for k in ("slug", "name", "external_id", "voltage_primary_kv",
                                                   "voltage_secondary_kv", "units", "capacity_total_mw",
                                                   "cap_operational_mw", "notes", "n1_eligible")} if bu_base else None,
          "matched": bool(bu_pair)}
    frozen_check = []
    for b in frozen_recs:
        eid = NFKC(b.get("external_id"))
        by_eid = [r for r in kept if NFKC(r["external_id"]) == eid]
        by_name = [r for r in kept if r["name"] == clean_name(b.get("name"))]
        frozen_check.append({"slug": b["slug"], "name": clean_name(b.get("name")), "external_id": b.get("external_id"),
                             "voltage": vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")),
                             "same_external_id_in_new": [f"{r['no_raw']} {r['name']} {vkey(r['voltage_primary_kv'], r['voltage_secondary_kv'])}" for r in by_eid],
                             "same_name_in_new": [f"{r['no_raw']} {r['name']} {vkey(r['voltage_primary_kv'], r['voltage_secondary_kv'])}" for r in by_name]})
    by_set = {t: sum(1 for r in kept if r["set"] == t) for t in ("more", "less")}
    base_by = {"more": sum(1 for b in base if b["slug"].startswith("ksi-kikan-")),
               "less": sum(1 for b in base if b["slug"].startswith("ksi-local-"))}

    def no_group(no):
        m = re.match(r"^(海|陸|北|神|京|姫|南|滋|和|奈)?", no)
        return m.group(1) or "（接頭辞なし）"
    groups = {}
    for t in ("more", "less"):
        cg = collections.Counter(no_group(r["no"]) for r in kept if r["set"] == t)
        bg = collections.Counter(no_group(NFKC((b.get("external_id") or "").split("_", 2)[-1]))
                                 for b in base if (b["slug"].startswith("ksi-kikan-") if t == "more" else b["slug"].startswith("ksi-local-")))
        groups[t] = {g: {"new_csv": cg.get(g, 0), "baseline": bg.get(g, 0)} for g in sorted(set(cg) | set(bg))}
    pref = dict(collections.Counter(b.get("prefecture") or "（null）" for b in base))
    map_symbols = {}
    for sym in MAP_ONLY_SYMBOLS:
        hits = [r for r in kept if r["set"] == "less" and re.fullmatch(re.escape(sym) + r"(?:\d+|-\d+)?", r["no"])]
        in_new_rows = [r for r in hits if any(r is x for x in new_rows)]
        map_symbols[sym] = {"in_csv": [f"{r['no_raw']} {r['name']} {vkey(r['voltage_primary_kv'], r['voltage_secondary_kv'])}" for r in hits],
                            "new_records": len(in_new_rows),
                            "in_baseline": sum(1 for b in base if re.fullmatch(re.escape(sym) + r"(?:\d+|-\d+)?",
                                                                               NFKC((b.get("external_id") or "").split("_", 2)[-1])))}

    total_after = len(base) + len(new_rows) - len(removed)
    pct = (total_after - len(base)) / len(base) * 100
    if abs(pct) > 10:
        R["warnings"].append(f"総数が現行から {pct:+.1f}%（±10% 超）")
    unchanged = sum(1 for b, r in matched if b["slug"] not in changed_slugs)

    R.update({
        "versions": {"more": next(f["version_row"] for f in files if f["file"].startswith("154kv_more")),
                     "less": next(f["version_row"] for f in files if f["file"].startswith("154kv_less")),
                     "split": len({f["version_row"] for f in files}) > 1},
        "counts": {"baseline": len(base), "csv_raw": len(raw_rows), "csv_dedup": len(kept),
                   "matched": len(matched), "new": len(new_rows), "removed": len(removed),
                   "ambiguous": len(ambiguous), "changed_records": len(changed_slugs),
                   "unchanged_records": unchanged, "total_after": total_after, "pct": round(pct, 2)},
        "by_set": by_set, "baseline_by_set": base_by, "no_groups": groups,
        "field_stats": field_stats, "other_field_changes": other,
        "cap_avail": {"decreased": len(dec), "zeroed": len(zeroed), "increased": len(inc),
                      "newly_filled": len(filled_avail), "newly_filled_rows": filled_avail,
                      "top_decreases": dec[:10], "zeroed_rows": zeroed, "top_increases": inc[:5],
                      "all_decreases": dec, "all_increases": inc},
        "hyphens": hy,
        "n1_undetermined": {"count": len(n1_und), "entries": n1_und, "file": str(N1_OUT).replace("\\", "/"),
                            "new_records_n1_undetermined": new_n1_und},
        "oc_undetermined": {"count": len(oc_und), "entries": oc_und},
        "n1_changed": {"count": len(n1_chg), "entries": n1_chg},
        "n1_status_json_kansai": n1s_kansai,
        "renamed_same_no": renamed, "renamed_unmatched": renamed_unmatched,
        "renumbered": renumber, "voltage_face_changed": face_changed, "ambiguous_rows": ambiguous,
        "external_id_dup_in_baseline": len([1 for v in bidx.values() if len(v) > 1]),
        "new_records_detail": [{"external_id": r["external_id"], "no": r["no_raw"], "name": r["name"], "set": r["set"],
                                "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                                "units": r["units"], "capacity_total_mw": r["capacity_total_mw"],
                                "cap_operational_mw": r["cap_operational_mw"], "cap_avail_mw": r["cap_avail_mw"],
                                "same_name_in_baseline": [f"{b['slug']} {vkey(b['voltage_primary_kv'], b['voltage_secondary_kv'])}"
                                                          for b in base if clean_name(b.get('name')) == r['name']]}
                               for r in new_rows],
        "disappeared_records": [{"slug": b["slug"], "external_id": b.get("external_id"),
                                 "name": clean_name(b.get("name")),
                                 "voltage": vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"]),
                                 "units": b.get("units"), "capacity_total_mw": b.get("capacity_total_mw"),
                                 "cap_avail_mw": b.get("cap_avail_mw"),
                                 "same_name_in_new_csv": [f"{r['no_raw']} {vkey(r['voltage_primary_kv'], r['voltage_secondary_kv'])}"
                                                          for r in kept if r['name'] == clean_name(b.get('name'))]}
                                for b in removed],
        "diamond_rows": diamonds, "bu": bu, "frozen_check": frozen_check,
        "prefecture_baseline": pref, "map_only_symbols_2611": map_symbols,
    })
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"=== 10. 区分 現行 more {base_by['more']} / less {base_by['less']} → 新 more {by_set['more']} / less {by_set['less']}・"
          f"取込後 {total_after}（{pct:+.1f}%）===")
    print(f"-> {OUT_JSON} / {N1_OUT}（microCMS 書込なし）")


if __name__ == "__main__":
    main()
