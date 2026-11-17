# -*- coding: utf-8 -*-
"""
中国電力ネットワーク 予想潮流・空容量CSV（2026年10月28日更新版）の dry-run 差分レポート（BY・2026-11-15）

**microCMS への書込は一切行わない（GET は fetch_baseline.py のみ）**。本実行の計画も作らない（--emit-plan は持たない）。

8/16 版（parse_chugoku_csv.py）からの変更:
  - 取得物は zip_202611/（11/15 に公表ページ access/ の href で確かめた zip/csv_*.zip 6 本）、baseline は baseline_live_2611.json。
  - 当方の版は 2026-08-06（基幹・広島）／2026-07-27（鳥取・島根・岡山・山口）の 2 種（8/16 本実行・last_updated はレコード単位）。
  - 名称非公開の行は dedupe の同名判定に使わない（#111・名称に「非公開」を含む行は dedupe 用の名称を空にする）。
  - 8/16 の新規 1 件（energia_shimane_島①S6-1「玉造変電所」・slug egz-shimane-s60001-2）が同じ No.・名称で残っているか。
  - 電圧階級の内訳（matched は baseline の voltage_class・新規は kV から）と、素 URL の /grid/chugoku（--grid-html）の県別・電圧階級別。
  - Markdown の報告は手で書く（この JSON を元に）。

使い方（リポジトリ直下で）:
  python scripts/experimental/chugoku/parse_chugoku_csv_2611.py --grid-html <素URLで取った /grid/chugoku の HTML>

2026-11-17（BY 本実行便）: --emit-plan を足した（下の emit_plan・裁定 BY 1〜5）。
  python scripts/experimental/chugoku/parse_chugoku_csv_2611.py --emit-plan --fetched-on 2026-11-17 \\
      --baseline <書込直前の GET> --out-json <scratchpad> --n1-out <scratchpad> --plan-out scripts/experimental/chugoku/update_plan_202611.json
  11/15 の dry-run の記録（reports/grid-chugoku-dryrun-2026-11-15.json・_common/n1_undetermined_chugoku_2611.json）は上書きしない。

突合キー（8/16 と同じ）: external_id = `energia_{県キー}_{No}`。同じ eid に複数行（電圧違い・バンク違い）があれば
電圧面 → 設備容量 → 運用容量 → 台数でタイブレーク（#115）。新規×消滅は名称＋電圧面＋設備容量＋運用容量＋台数で
No. の振り直しとして突合（#117）。
"""
import argparse, csv, io, json, re, sys, zipfile
from collections import Counter
from datetime import date
from pathlib import Path
import html as H

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402
from note_rows import skip_reason  # noqa: E402
from frozen import drop_frozen  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "zip_202611"
BASELINE = HERE / "baseline_live_2611.json"
OUT_JSON = Path("reports/grid-chugoku-dryrun-2026-11-15.json")
N1_OUT = HERE.parent / "_common" / "n1_undetermined_chugoku_2611.json"
BASE_URL = "https://www.energia.co.jp/nw/service/retailer/keitou/access"

ZIPS = [
    ("csv_220kv", "kikan", None),
    ("csv_tori", "tottori", "鳥取県"),
    ("csv_shima", "shimane", "島根県"),
    ("csv_oka", "okayama", "岡山県"),
    ("csv_hiro", "hiroshima", "広島県"),
    ("csv_yama", "yamaguchi", "山口県"),
]
COL = dict(no=0, name=1, kv1=2, kv2=3, units=4, cap_total=5, cap_op=6, constraint=7,
           flow=8, avail=9, avail_upper=10, n1=11, n1_mw=12, oc=13)
UNDETERMINED = {"-", "‐", "−", "－", "ー", "—", "―", ""}


def read_csv_bytes(b: bytes):
    for enc in ("utf-8-sig", "cp932"):
        try:
            return b.decode(enc, errors="strict"), enc
        except UnicodeDecodeError:
            continue
    raise RuntimeError("encoding 判定不能")


def clean(v):
    """★全角スペースは保持する（#111 注記 2）"""
    if v is None:
        return None
    v = str(v).replace("\n", " ").strip()
    return None if v in UNDETERMINED else v


def to_float(v):
    v = clean(v)
    if v is None:
        return None
    v = v.replace(",", "").replace("，", "").replace("　", "").replace(" ", "")
    try:
        return float(v)
    except ValueError:
        return None


def to_int(v):
    f = to_float(v)
    return int(f) if f is not None else None


def parse_n1(v):
    v = clean(v)
    if v is None:
        return None
    v = v.replace("　", " ").strip()
    if v.startswith("不可"):
        return False
    if v.startswith("可"):
        return True
    return None


def parse_oc(v):
    v = clean(v)
    if v is None:
        return None
    if "有" in v:
        return "有り"
    if "な" in v or "無" in v:
        return "なし"
    return None


def vkey(v1, v2):
    def n(v):
        return "-" if v is None else f"{float(v):g}"
    return f"{n(v1)}/{n(v2)}"


def num_eq(a, b):
    if a is None or b is None:
        return a is None and b is None
    return abs(float(a) - float(b)) < 1e-9


def vclass(kv):
    if kv is None:
        return "その他"
    for k, lab in ((500, "500kV系"), (220, "220kV系"), (110, "110kV系"), (66, "66kV系"), (22, "22kV系")):
        if abs(float(kv) - k) < 1e-9:
            return lab
    return "その他"


def load_zip_rows():
    files, rows, skipped_notes, nonpublic = [], [], [], []
    for zname, prefkey, pref in ZIPS:
        zpath = SRC / f"{zname}.zip"
        with zipfile.ZipFile(zpath) as zf:
            for member in sorted(zf.namelist()):
                if "_tr_" not in member:
                    continue  # 送電線(line)は /grid の対象外
                raw = zf.read(member)
                txt, enc = read_csv_bytes(raw)
                data = list(csv.reader(io.StringIO(txt)))
                meta = clean(data[0][0]) if data else None
                header = data[1] if len(data) > 1 else []
                m = re.search(r"_tr_(\d{6})_", member)
                cnt = 0
                for r in data[2:]:
                    if not r or len(r) < 13:
                        continue
                    no = clean(r[COL["no"]])
                    if not no:
                        continue
                    if skip_reason(no, "dummy", []) is not None:
                        skipped_notes.append({"member": f"{zname}/{member}", "no": no[:40], "reason": "No.欄が注記見出し"})
                        continue
                    name = clean(r[COL["name"]])
                    row = {
                        "external_id": f"energia_{prefkey}_{no}", "no": no, "zip": zname, "member": member, "prefecture": pref,
                        "name": name,
                        "voltage_primary_kv": to_float(r[COL["kv1"]]), "voltage_secondary_kv": to_float(r[COL["kv2"]]),
                        "units": to_int(r[COL["units"]]), "capacity_total_mw": to_float(r[COL["cap_total"]]),
                        "cap_operational_mw": to_float(r[COL["cap_op"]]), "op_constraint": clean(r[COL["constraint"]]),
                        "forecast_flow_mw": to_float(r[COL["flow"]]), "cap_avail_mw": to_float(r[COL["avail"]]),
                        "cap_avail_upper_mw": to_float(r[COL["avail_upper"]]),
                        "n1_raw": (r[COL["n1"]] or "").strip(), "n1_eligible": parse_n1(r[COL["n1"]]),
                        "n1_capacity_mw": to_float(r[COL["n1_mw"]]),
                        "oc_raw": (r[COL["oc"]] or "").strip(), "oc_possibility": parse_oc(r[COL["oc"]]),
                        "src_encoding": enc, "src_meta": meta,
                    }
                    # #111: 名称非公開の行は同名判定に使わない（dedupe 用の名称を空にする）
                    row["dedupe_name"] = None if (name and "非公開" in name) else name
                    if name and "非公開" in name:
                        nonpublic.append({"external_id": row["external_id"], "name": name})
                    why = skip_reason(no, row["name"], [
                        row["voltage_primary_kv"], row["voltage_secondary_kv"], row["units"], row["capacity_total_mw"],
                        row["cap_operational_mw"], row["cap_avail_mw"], row["n1_capacity_mw"]])
                    if why:
                        skipped_notes.append({"member": row["external_id"], "no": no[:40], "name": row["name"], "reason": why})
                        continue
                    rows.append(row)
                    cnt += 1
                files.append({"zip": f"{zname}.zip", "member": member, "url": f"{BASE_URL}/zip/{zname}.zip",
                              "zip_bytes": zpath.stat().st_size, "bytes": len(raw), "encoding": enc, "meta_row": meta,
                              "file_version": m.group(1) if m else None, "columns": len(header), "header": header,
                              "data_rows": cnt, "prefecture": pref})
    return files, rows, skipped_notes, nonpublic


def grid_page_counts(path: str):
    b = open(path, encoding="utf-8", errors="replace").read()
    v = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", "", b).replace("<!-- -->", "")
    t = H.unescape(re.sub(r"<[^>]+>", "\n", v))
    t = re.sub(r"\n\s*\n+", "\n", t)
    out = {"pref": {}, "vclass": {}}
    i = t.find("都道府県別ブレークダウン")
    seg = t[i:i + 1500] if i >= 0 else ""
    for p in ["広島県", "岡山県", "山口県", "島根県", "鳥取県", "基幹系統"]:
        m = re.search(rf"\n{p}\n(\d+)\n(\d+)\n", seg)
        out["pref"][p] = int(m.group(1)) if m else None
    i = t.find("電圧階級別ブレークダウン")
    seg = t[i:i + 400] if i >= 0 else ""
    for m in re.finditer(r"\n(\S+kV系|その他)\n([\d,]+) 件", seg):
        out["vclass"][m.group(1)] = int(m.group(2).replace(",", ""))
    m = re.search(r"サマリ統計\n([\d,]+)\n変電所数\n([\d,]+)\n空容量プラス\n([\d,]+)\nN-1電制適用可", t)
    if m:
        out["total"], out["avail_plus"], out["n1_ok"] = (int(x.replace(",", "")) for x in m.groups())
    m = re.search(r"データ基準日: ([^\n]+)", t)
    out["basis"] = m.group(1).strip() if m else None
    return out


def main():
    global BASELINE, OUT_JSON, N1_OUT
    ap = argparse.ArgumentParser()
    ap.add_argument("--grid-html", default="", help="dry-run の報告用（--emit-plan のときは省略可）")
    ap.add_argument("--grid-meta", default="")
    # BY 本実行（2026-11-17）: 計画の出力。11/15 の dry-run の記録（OUT_JSON・N1_OUT）は上書きしないよう出力先を変える
    ap.add_argument("--emit-plan", action="store_true")
    ap.add_argument("--plan-out", default=str(HERE / "update_plan_202611.json"))
    ap.add_argument("--baseline", default=str(BASELINE))
    ap.add_argument("--out-json", default=str(OUT_JSON))
    ap.add_argument("--n1-out", default=str(N1_OUT))
    ap.add_argument("--fetched-on", default="")
    args = ap.parse_args()
    BASELINE, OUT_JSON, N1_OUT = Path(args.baseline), Path(args.out_json), Path(args.n1_out)
    if args.emit_plan and not args.fetched_on:
        raise SystemExit("--emit-plan には --fetched-on が必要")

    R = {"generated": date.today().isoformat(), "version_old": "2026/8/6（基幹・広島）・2026/7/27（鳥取・島根・岡山・山口）",
         "version_new": "2026/10/28", "files": [], "warnings": [], "requires_judgement": []}

    files, raw_rows, skipped_notes, nonpublic = load_zip_rows()
    R["files"] = files
    vers = Counter(f["file_version"] for f in files)
    metas = Counter(f["meta_row"] for f in files)
    encs = Counter(f["encoding"] for f in files)
    headers = {json.dumps(f["header"], ensure_ascii=False) for f in files}
    R["file_versions"] = dict(vers)
    R["meta_rows"] = dict(metas)
    R["encodings"] = dict(encs)
    R["header_variants"] = len(headers)
    R["header"] = files[0]["header"]
    R["excluded_note_rows"] = {"count": len(skipped_notes), "rows": skipped_notes}
    R["nonpublic_rows"] = nonpublic
    print(f"=== 1. 取得 === tr メンバー {len(files)}・版 {dict(vers)}・メタ行 {dict(metas)}・encoding {dict(encs)}・列の型 {len(headers)}")
    print(f"  生データ行 {len(raw_rows)}・注記行の除外 {len(skipped_notes)}・名称非公開の行 {len(nonpublic)}")

    base_all = json.loads(BASELINE.read_text(encoding="utf-8"))
    base = drop_frozen(base_all)
    NUMKEYS = ["cap_avail_mw", "cap_avail_upper_mw", "cap_operational_mw", "capacity_total_mw",
               "forecast_flow_mw", "n1_capacity_mw", "units", "voltage_primary_kv", "voltage_secondary_kv"]
    for b in base:
        for k in NUMKEYS:
            b.setdefault(k, None)
        b.setdefault("prefecture", None)
        oc = b.get("oc_possibility")
        b["oc_possibility"] = (oc[0] if isinstance(oc, list) and oc else None)
    base_ids = {b.get("external_id") for b in base}

    kept, excluded = apply_series_dedup(
        raw_rows, base_ids=base_ids, base_names={},
        key_id="external_id", key_name="dedupe_name",
        value_keys=("cap_operational_mw", "forecast_flow_mw", "cap_avail_mw", "capacity_total_mw"),
        group_key="member",
    )
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(excluded), "breakdown": summarize(excluded),
                   "examples": [{"external_id": e["external_id"], "name": e["name"], "reason": e.get("exclude_reason")} for e in excluded[:5]]}
    print(f"=== 3. dedupe === {len(raw_rows)} → {len(kept)}（除去 {len(excluded)}）")

    bidx = {}
    for b in base:
        bidx.setdefault(b.get("external_id"), []).append(b)

    def pick(cands, row, used_ids):
        free = [c for c in cands if id(c) not in used_ids]
        if not free:
            return None
        if len(cands) == 1:
            return free[0]
        want_v = vkey(row.get("voltage_primary_kv"), row.get("voltage_secondary_kv"))
        pool = [c for c in free if vkey(c.get("voltage_primary_kv"), c.get("voltage_secondary_kv")) == want_v] or free
        for keyname in ("capacity_total_mw", "cap_operational_mw", "units"):
            exact = [c for c in pool if num_eq(c.get(keyname), row.get(keyname))]
            if len(exact) == 1:
                return exact[0]
            if exact:
                pool = exact
        return pool[0] if len(pool) == 1 else None

    matched, new_rows, ambiguous, used = [], [], [], set()
    for r in kept:
        cands = bidx.get(r["external_id"])
        if not cands:
            new_rows.append(r)
            continue
        b = pick(cands, r, used)
        if b is None:
            ambiguous.append(r)
            continue
        used.add(id(b))
        matched.append((b, r))
    removed = [b for b in base if id(b) not in used]

    renumber_pairs, renumber_matched = [], []
    for r in list(new_rows):
        for b in list(removed):
            if (b.get("name") or "").strip() != (r.get("name") or "").strip():
                continue
            if vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")) != vkey(r.get("voltage_primary_kv"), r.get("voltage_secondary_kv")):
                continue
            if not (num_eq(b.get("capacity_total_mw"), r.get("capacity_total_mw")) and num_eq(b.get("cap_operational_mw"), r.get("cap_operational_mw"))
                    and num_eq(b.get("units"), r.get("units"))):
                continue
            renumber_pairs.append({"slug": b["slug"], "name": b.get("name"), "prefecture": b.get("prefecture"),
                                   "old_external_id": b.get("external_id"), "new_external_id": r["external_id"],
                                   "kv": vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")),
                                   "capacity_total_mw": b.get("capacity_total_mw"),
                                   "cap_avail_old": b.get("cap_avail_mw"), "cap_avail_new": r.get("cap_avail_mw")})
            renumber_matched.append((b, r))
            new_rows.remove(r)
            removed.remove(b)
            break

    kept_names = {(x.get("name") or "").strip() for x in kept}
    renamed_hard, renamed_soft, disclosure = [], [], []
    for b, r in matched:
        bn, rn = (b.get("name") or "").strip(), (r.get("name") or "").strip()
        if not bn or not rn or bn == rn:
            continue
        rec = {"slug": b["slug"], "external_id": b.get("external_id"), "old_name": bn, "new_name": rn, "prefecture": b.get("prefecture")}
        if bn.startswith("(名称非公開)") or rn.startswith("(名称非公開)") or "非公開" in rn:
            disclosure.append(rec)
        elif bn in kept_names:
            rec["old_name_now_at"] = [x["external_id"] for x in kept if (x.get("name") or "").strip() == bn]
            renamed_soft.append(rec)
        else:
            renamed_hard.append(rec)
    print(f"=== 4. 突合 === マッチ {len(matched)}・新規 {len(new_rows)}・消滅 {len(removed)}・曖昧 {len(ambiguous)}・振り直し {len(renumber_pairs)}"
          f"・名称変更（旧名が新CSVに無い）{len(renamed_hard)}・（旧名が別 No. に在る）{len(renamed_soft)}・非公開⇄実名 {len(disclosure)}")

    FIELDS = [("cap_avail_mw", "空き容量(当該)"), ("cap_avail_upper_mw", "空容量(上位系等考慮)"),
              ("cap_operational_mw", "運用容量"), ("forecast_flow_mw", "予想潮流"),
              ("capacity_total_mw", "設備容量"), ("n1_capacity_mw", "N-1電制適用可能量"),
              ("units", "台数"), ("oc_possibility", "出力制御の可能性"), ("op_constraint", "運用容量制約要因")]
    field_stats, changed_slugs = {}, set()
    pairs = matched + renumber_matched
    for key, label in FIELDS:
        chg = filled = lost = 0
        for b, r in pairs:
            o, n = b.get(key), r.get(key)
            if isinstance(o, (int, float)) and isinstance(n, (int, float)):
                same = num_eq(o, n)
            else:
                same = (o or None) == (n or None)
            if o in (None, "") and n is not None:
                filled += 1
                changed_slugs.add(b["slug"])
            elif o not in (None, "") and n is None:
                lost += 1
            elif not same:
                chg += 1
                changed_slugs.add(b["slug"])
        field_stats[label] = {"changed": chg, "filled": filled, "lost_to_undetermined": lost}

    n1_undetermined, n1_changed = [], []
    for b, r in pairs:
        o, n = b.get("n1_eligible"), r.get("n1_eligible")
        if n is None:
            if o is not None:
                n1_undetermined.append({"operator": "中国電力ネットワーク", "area": "中国", "slug": b["slug"],
                                        "external_id": b.get("external_id"), "name": b.get("name"), "prefecture": b.get("prefecture"),
                                        "stored_n1_eligible": o, "csv_value": r["n1_raw"],
                                        "source": "sys_capa_*_tr_202610_07.csv（2026-10-28公表）"})
        elif o != n:
            n1_changed.append({"slug": b["slug"], "name": b.get("name"), "prefecture": b.get("prefecture"), "old": o, "new": n})
            changed_slugs.add(b["slug"])
    oc_undetermined = [{"slug": b["slug"], "name": b.get("name"), "prefecture": b.get("prefecture"), "stored": b.get("oc_possibility"),
                        "csv": r["oc_raw"]} for b, r in pairs if b.get("oc_possibility") is not None and r.get("oc_possibility") is None]
    oc_changes = Counter(f"{b.get('oc_possibility') or '（空）'}→{r['oc_possibility']}" for b, r in pairs
                         if r.get("oc_possibility") is not None and (b.get("oc_possibility") or None) != r["oc_possibility"])

    dec, inc = [], []
    for b, r in pairs:
        o, n = b.get("cap_avail_mw"), r.get("cap_avail_mw")
        if o is None or n is None or num_eq(o, n):
            continue
        rec = {"slug": b["slug"], "name": b.get("name"), "prefecture": b.get("prefecture"),
               "kv": vkey(r.get("voltage_primary_kv"), r.get("voltage_secondary_kv")), "old": o, "new": n, "delta": round(n - o, 3)}
        (dec if n < o else inc).append(rec)
    dec.sort(key=lambda x: (x["delta"], x["slug"]))
    inc.sort(key=lambda x: (-x["delta"], x["slug"]))
    zeroed = [d for d in dec if d["new"] <= 0 < d["old"]]

    n1_new = Counter("可" if r.get("n1_eligible") is True else ("不可" if r.get("n1_eligible") is False else "未算定") for r in kept)
    n1_cur = Counter("可" if b.get("n1_eligible") is True else ("不可" if b.get("n1_eligible") is False else "未算定") for b in base)
    cur_und = json.loads((HERE.parent / "_common" / "n1_undetermined_chugoku.json").read_text(encoding="utf-8"))

    def pref_count(rows):
        return dict(Counter(x.get("prefecture") or "（基幹系）" for x in rows))
    vc_after = Counter()
    for b, r in pairs:
        vc_after[(b.get("voltage_class") or ["その他"])[0]] += 1
    for r in new_rows:
        vc_after[vclass(r.get("voltage_primary_kv"))] += 1
    vc_base = Counter((b.get("voltage_class") or ["その他"])[0] for b in base)

    kikan_new = [r for r in kept if r["zip"] == "csv_220kv"]
    kikan_base = [b for b in base if (b.get("external_id") or "").startswith("energia_kikan_")]
    prev_new = [r for r in kept if r["external_id"] == "energia_shimane_島①S6-1"]
    prev_new_check = {"slug": "egz-shimane-s60001-2", "external_id": "energia_shimane_島①S6-1", "name": "玉造変電所",
                      "in_new_csv": [{"name": r["name"], "kv": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                                      "cap_avail_mw": r["cap_avail_mw"], "member": r["member"]} for r in prev_new],
                      "matched_to": [b["slug"] for b, r in pairs if r["external_id"] == "energia_shimane_島①S6-1"]}

    page = grid_page_counts(args.grid_html) if args.grid_html else {"pref": {}, "vclass": {}}
    total_after = len(base) + len(new_rows) - len(removed)
    delta_pct = (total_after - len(base)) / len(base) * 100 if base else 0
    avail_plus_after = 0
    for b, r in pairs:
        v = r.get("cap_avail_mw") if r.get("cap_avail_mw") is not None else b.get("cap_avail_mw")
        if (v or 0) > 0:
            avail_plus_after += 1
    for b in removed:
        pass
    for r in new_rows:
        if (r.get("cap_avail_mw") or 0) > 0:
            avail_plus_after += 1
    lu_after = Counter(("2026-10-28" if True else None) for _ in pairs)

    if abs(delta_pct) > 10:
        R["warnings"].append(f"件数が {delta_pct:+.1f}% 変動（±10%超）")
    if renamed_hard:
        R["requires_judgement"].append(f"同一No.名称変更（旧名称が新CSVに不在）{len(renamed_hard)}件 → 本実行ブロック")
    if ambiguous:
        R["requires_judgement"].append(f"一意に紐付かない行 {len(ambiguous)}件")
    if new_rows:
        R["requires_judgement"].append(f"新規 {len(new_rows)}件（追加は裁定事項・slug は本実行の前に決める）")
    if removed:
        R["requires_judgement"].append(f"消滅（新CSVに不在）{len(removed)}件 → 301/凍結の方針判断")
    if renumber_pairs:
        R["requires_judgement"].append(f"No.の振り直し {len(renumber_pairs)}件 → slug 維持で external_id を更新するか（8/16 の裁定1 と同じ扱いか）")

    R.update({
        "counts": {"baseline_all": len(base_all), "baseline": len(base), "raw": len(raw_rows), "new_after_dedupe": len(kept),
                   "matched": len(matched), "new_records": len(new_rows), "disappeared": len(removed), "ambiguous": len(ambiguous),
                   "renumbered": len(renumber_pairs), "changed": len(changed_slugs), "unchanged": len(pairs) - len(changed_slugs),
                   "total_after": total_after, "delta_pct": round(delta_pct, 2)},
        "field_stats": field_stats,
        "avail_decreased": {"count": len(dec), "zeroed": len(zeroed), "zeroed_list": zeroed, "top10": dec[:10]},
        "avail_increased": {"count": len(inc), "top5": inc[:5]},
        "avail_plus_after": avail_plus_after,
        "n1": {"new": dict(n1_new), "current": dict(n1_cur), "changed": n1_changed,
               "undetermined_new": n1_undetermined, "undetermined_current_file": {"count": cur_und.get("count"),
                                                                                  "slugs": [e["slug"] for e in cur_und.get("entries", [])]}},
        "oc": {"undetermined": oc_undetermined, "changes": dict(oc_changes),
               "csv_values": dict(Counter(r["oc_raw"] or "（空）" for r in kept)),
               "current": dict(Counter(b.get("oc_possibility") or "（空）" for b in base))},
        "renamed_blocking": renamed_hard, "renamed_soft": renamed_soft, "disclosure_change": disclosure,
        "renumber_pairs": renumber_pairs,
        "ambiguous_rows": [{"external_id": a["external_id"], "name": a["name"], "kv": vkey(a["voltage_primary_kv"], a["voltage_secondary_kv"])} for a in ambiguous],
        "new_records_detail": [{"external_id": r["external_id"], "name": r["name"], "prefecture": r["prefecture"],
                                "kv": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]), "units": r["units"],
                                "capacity_total_mw": r["capacity_total_mw"], "cap_operational_mw": r["cap_operational_mw"],
                                "cap_avail_mw": r["cap_avail_mw"], "n1": r["n1_raw"], "oc": r["oc_raw"], "member": r["member"]} for r in new_rows],
        "disappeared_records": [{"slug": b["slug"], "external_id": b.get("external_id"), "name": b.get("name"),
                                 "prefecture": b.get("prefecture"), "kv": vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv"))} for b in removed],
        "pref_counts": {"baseline": pref_count(base), "new": pref_count(kept), "page_bare_url": page["pref"]},
        "vclass": {"baseline": dict(vc_base), "after": dict(vc_after), "page_bare_url": page["vclass"]},
        "page": page, "page_meta": args.grid_meta,
        "kikan": {"new_rows": len(kikan_new), "baseline_rows": len(kikan_base)},
        "prev_new_record_862aed3": prev_new_check,
        "last_updated_current": dict(Counter((b.get("last_updated") or "")[:10] for b in base)),
    })
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")
    N1_OUT.write_text(json.dumps({
        "purpose": "公表CSVで N-1電制適用可否が未算定（-）の設備（中国電力NW分・2026年10月28日更新版）。microCMS の n1_eligible は boolean。",
        "note": "再取込では上書きせず現値維持する。_common/n1_undetermined.json への統合用。",
        "count": len(n1_undetermined), "entries": n1_undetermined}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"=== 7. フィールド === {json.dumps(field_stats, ensure_ascii=False)}")
    print(f"  空容量 減 {len(dec)}（ゼロ化 {len(zeroed)}）・増 {len(inc)}")
    print(f"=== N-1 === 新 {dict(n1_new)}・現行 {dict(n1_cur)}・可否変化 {len(n1_changed)}・未算定で潰れる {len(n1_undetermined)}（現行ファイル {cur_und.get('count')}）")
    print(f"=== 出力制御 === 変化 {dict(oc_changes)}・未算定化 {len(oc_undetermined)}")
    print(f"=== 基幹 === 新 {len(kikan_new)}・baseline {len(kikan_base)}・前回の新規 {prev_new_check}")
    print(f"→ {OUT_JSON} / {N1_OUT}")
    if args.emit_plan:
        raw_base = json.loads(BASELINE.read_text(encoding="utf-8"))  # 正規化前の GET のまま（before と id に使う）
        emit_plan(args.plan_out, raw_base, base, kept, matched, renumber_pairs, renumber_matched, new_rows, removed,
                  ambiguous, renamed_hard, renamed_soft, disclosure, args.fetched_on)
    print("[dry-run] 完了（microCMS 書込なし）")


# =============================================================================
# --emit-plan（BY 本実行・2026-11-17）: 本実行の計画（microCMS には書かない）
# 裁定（02_計画・運営/検証記録_BX中部・BY中国dry-run_確かめと裁定の案_2026-11-15_ユウ.md の BY 1〜5・EDAさん 11/16 10:03「任せます」）:
#   1. 西市(変) 66/6（egz-yamaguchi-s0009-2）は同じ設備として slug を保つ。external_id 山⑤S9 → 山⑤S9-1・値を 10/28 版に。
#      前の版（zip_202608）・baseline・新しい版のどれかで西市(変) の 66/6 の行が 1 行でなければ止める。
#   2. 湯原第一 S8-4（egz-okayama-s80004）は凍結（DELETE しない・計画には入れない＝frozen.json は別に足す）。
#   3. 久世・大原の No. の振り直しは slug 維持・external_id 更新（8/16 裁定 1 と同じ）。
#   4. 新規 3 件（久世 S5-1・大原 S1-1・西市 S9-2・どれも 66/22）を POST。slug は今の体系（egz-{県}-s{番号}{枝番4桁}・衝突は -2…）。
#   5. 全件 PATCH（last_updated を 2026-10-28 にそろえる・#121）。
# 値の欄は 8/16 の --emit-plan と同じ（数値 7 欄は CSV に値があるときだけ・N-1 と出力制御の未算定は現値維持・出力制御は「有り」を足すだけ）。
# 備考（notes）は書かない（8/16 と同じ）。11/15 の dry run の件数と 1 つでも違えば計画を作らない。
# =============================================================================
NEW_VERSION = "2026-10-28"
EXPECT_RENUMBER = {"egz-okayama-s0005-3": ("energia_okayama_岡⑤S5", "energia_okayama_岡⑤S5-2"),
                   "egz-okayama-s0001-2": ("energia_okayama_岡⑥S1", "energia_okayama_岡⑥S1-2")}
SAIICHI = {"slug": "egz-yamaguchi-s0009-2", "old": "energia_yamaguchi_山⑤S9", "new": "energia_yamaguchi_山⑤S9-1", "name": "西市(変)", "kv": "66/6"}
EXPECT_NEW = {"energia_okayama_岡⑤S5-1", "energia_okayama_岡⑥S1-1", "energia_yamaguchi_山⑤S9-2"}
EXPECT_FROZEN = {"egz-okayama-s80004"}
EXPECT = {"matched": 869, "updates": 872, "creates": 3, "value_changed": 128, "n1_ok_after": 69, "n1_changed": 0, "oc_changed": 0,
          "op_constraint": 0, "total_after": 875}
APPROVED = ["cap_avail_mw", "cap_avail_upper_mw", "cap_operational_mw", "forecast_flow_mw", "capacity_total_mw", "n1_capacity_mw", "units"]
META = {"id", "createdAt", "updatedAt", "publishedAt", "revisedAt"}


def _rows_named(rows, name, kv):
    return [r for r in rows if (r.get("name") or "").strip() == name and vkey(r.get("voltage_primary_kv"), r.get("voltage_secondary_kv")) == kv]


def emit_plan(plan_out, raw_base, base, kept, matched, renumber_pairs, renumber_matched, new_rows, removed,
              ambiguous, renamed_hard, renamed_soft, disclosure, fetched_on):
    global SRC
    errs = []
    if len(matched) != EXPECT["matched"] or ambiguous or renamed_hard or renamed_soft or disclosure:
        errs.append(f"突合が dry run と違う: マッチ {len(matched)}・曖昧 {len(ambiguous)}・名称の変化 {len(renamed_hard)}/{len(renamed_soft)}/{len(disclosure)}")
    got_renum = {p["slug"]: (p["old_external_id"], p["new_external_id"]) for p in renumber_pairs}
    if got_renum != EXPECT_RENUMBER:
        errs.append(f"振り直しが裁定と違う: {got_renum}")
    if {r["external_id"] for r in new_rows} != EXPECT_NEW | {SAIICHI["new"]}:
        errs.append(f"新規が裁定と違う: {sorted(r['external_id'] for r in new_rows)}")
    if {b["slug"] for b in removed} != EXPECT_FROZEN | {SAIICHI["slug"]}:
        errs.append(f"消滅が裁定と違う: {sorted(b['slug'] for b in removed)}")
    # 裁定 1: 西市(変) の 66/6 は前の版・baseline・新しい版とも 1 行だけ
    saved = SRC
    try:
        SRC = HERE / "zip_202608"
        _, old_rows, _, _ = load_zip_rows()
    finally:
        SRC = saved
    n_old, n_base, n_new = (len(_rows_named(x, SAIICHI["name"], SAIICHI["kv"])) for x in (old_rows, base, kept))
    if (n_old, n_base, n_new) != (1, 1, 1):
        errs.append(f"西市(変) 66/6 の行が 1 行でない: 前の版 {n_old}・baseline {n_base}・新しい版 {n_new}")
    sb = next((b for b in removed if b["slug"] == SAIICHI["slug"]), None)
    sr = next((r for r in new_rows if r["external_id"] == SAIICHI["new"]), None)
    if sb is None or sr is None or sb.get("external_id") != SAIICHI["old"]:
        errs.append("西市(変) の組が作れない")
    if errs:
        raise SystemExit("想定の外のため計画を作らない:\n  " + "\n  ".join(errs))

    iso = lambda d: f"{d}T00:00:00.000Z"  # noqa: E731
    raw = {b["slug"]: b for b in raw_base}
    renum_by = {p["slug"]: p["new_external_id"] for p in renumber_pairs}
    renum_by[SAIICHI["slug"]] = SAIICHI["new"]
    pairs = list(matched) + list(renumber_matched) + [(sb, sr)]
    updates, n1_kept, oc_kept, cnt = [], [], [], Counter()
    for b, r in pairs:
        if r.get("src_meta") != "2026年10月28日更新":
            raise SystemExit(f"版の行が想定外: {r.get('src_meta')!r}")
        rb = raw[b["slug"]]
        patch, changed = {}, []
        for k in APPROVED:
            o, n = b.get(k), r.get(k)
            if n is None:
                continue
            if o is None or not num_eq(o, n):
                patch[k] = n
                changed.append(k)
        if r.get("op_constraint") and (b.get("op_constraint") or None) != r["op_constraint"]:
            patch["op_constraint"] = r["op_constraint"]
            changed.append("op_constraint")
        if r.get("n1_eligible") is None:
            if b.get("n1_eligible") is not None:
                n1_kept.append(b["slug"])
        elif r["n1_eligible"] != b.get("n1_eligible"):
            patch["n1_eligible"] = r["n1_eligible"]
            changed.append("n1_eligible")
        if r.get("oc_possibility") is None:
            if b.get("oc_possibility") is not None:
                oc_kept.append(b["slug"])
        elif r["oc_possibility"] == "有り" and b.get("oc_possibility") != "有り":
            patch["oc_possibility"] = ["有り"]
            changed.append("oc_possibility")
        elif r["oc_possibility"] != "有り" and b.get("oc_possibility") is not None:
            raise SystemExit(f"{b['slug']}: 出力制御の可能性 {b.get('oc_possibility')} → {r['oc_possibility']}（想定外）")
        if b["slug"] in renum_by:
            patch["external_id"] = renum_by[b["slug"]]
            changed.append("external_id")
        patch["source_url"] = f"{BASE_URL}/zip/{r['zip']}.zip"
        patch["last_updated"] = iso(NEW_VERSION)
        patch["fetched_at"] = iso(fetched_on)
        for c in changed:
            cnt[c] += 1
        updates.append({"slug": b["slug"], "id": rb["id"], "patch": patch, "changed": changed,
                        "external_id_row": r["external_id"], "before": {k: v for k, v in rb.items() if k not in META}})

    # 新規の slug（今の体系: egz-{県キー}-{記号小文字}{番号}（枝番なし 4 桁／枝番ありは 番号＋枝番 4 桁）・使用済みなら -2, -3 …）
    taken = set(json.load(open("src/lib/generated/grid-detail-index.json", encoding="utf-8"))["shard_of"].keys())
    taken |= {x["slug"] for x in raw_base}
    taken |= set(json.load(open("src/data/substations-frozen.json", encoding="utf-8"))["frozen"].keys())

    def assign_slug(prefkey, no):
        m = re.fullmatch(r"[^A-Z]*([A-Z])(\d+)(?:-(\d+))?", no)
        if not m:
            raise SystemExit(f"No. の形が想定外: {no}")
        letter, n, br = m.groups()
        b_ = f"egz-{prefkey}-{letter.lower()}{int(n):04d}" if br is None else f"egz-{prefkey}-{letter.lower()}{n}{int(br):04d}"
        s, k = b_, 2
        while s in taken:
            s, k = f"{b_}-{k}", k + 1
        taken.add(s)
        return s

    creates = []
    for r in sorted((r for r in new_rows if r["external_id"] in EXPECT_NEW), key=lambda x: x["external_id"]):
        prefkey = r["external_id"].split("_")[1]
        slug = assign_slug(prefkey, r["no"])
        content = {"slug": slug, "name": r["name"], "operator": ["中国電力ネットワーク"], "area": ["中国"],
                   "prefecture": r["prefecture"], "voltage_class": [vclass(r["voltage_primary_kv"])],
                   "n1_eligible": r["n1_eligible"] is True, "external_id": r["external_id"], "non_firm_eligible": False,
                   "source_url": f"{BASE_URL}/zip/{r['zip']}.zip", "data_source_format": ["CSV"],
                   "last_updated": iso(NEW_VERSION), "fetched_at": iso(fetched_on)}
        for k in ["voltage_primary_kv", "voltage_secondary_kv"] + APPROVED:
            if r.get(k) is not None:
                content[k] = r[k]
        if r.get("op_constraint"):
            content["op_constraint"] = r["op_constraint"]
        if r.get("oc_possibility") == "有り":
            content["oc_possibility"] = ["有り"]
        creates.append({"slug": slug, "content": content, "external_id": r["external_id"], "no": r["no"],
                        "n1_undetermined_as_false": r["n1_eligible"] is None,
                        "csv": {"n1_raw": r["n1_raw"], "oc_raw": r["oc_raw"], "member": r["member"]}})

    value_changed = sum(1 for u in updates if set(u["changed"]) - {"external_id"})
    n1_ok = sum(1 for u in updates if (u["patch"]["n1_eligible"] if "n1_eligible" in u["patch"] else u["before"].get("n1_eligible")) is True) \
        + sum(1 for c in creates if c["content"]["n1_eligible"] is True)
    got = {"matched": len(matched), "updates": len(updates), "creates": len(creates), "value_changed": value_changed, "n1_ok_after": n1_ok,
           "n1_changed": cnt["n1_eligible"], "oc_changed": cnt["oc_possibility"], "op_constraint": cnt["op_constraint"],
           "total_after": len(updates) + len(creates)}
    bad = {k: (v, EXPECT[k]) for k, v in got.items() if v != EXPECT[k]}
    if bad:
        raise SystemExit(f"件数が dry run の見込みと違うため計画を作らない（計画, 見込み）: {bad}")
    plan = {"generated": str(date.today()), "area": "中国", "prefix": "egz-", "endpoint": "substations",
            "version": NEW_VERSION, "fetched_on": fetched_on,
            "ruling": "02_計画・運営/検証記録_BX中部・BY中国dry-run_確かめと裁定の案_2026-11-15_ユウ.md（BY 1〜5・EDAさん 11/16 10:03）",
            "expected": {"updates": len(updates), "creates": len(creates), "n1_ok_after": n1_ok, "value_changed": value_changed,
                         "date_only": sum(1 for u in updates if not u["changed"]), "by_field": dict(cnt)},
            "renumber": [{"slug": s, "old_external_id": o, "new_external_id": n} for s, (o, n) in EXPECT_RENUMBER.items()]
            + [{"slug": SAIICHI["slug"], "old_external_id": SAIICHI["old"], "new_external_id": SAIICHI["new"]}],
            "frozen_slugs": sorted(EXPECT_FROZEN), "n1_undetermined_kept": n1_kept, "oc_undetermined_kept": oc_kept,
            "updates": updates, "creates": creates}
    Path(plan_out).write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n=== emit-plan: PATCH {len(updates)}（値 {value_changed}・日付だけ {plan['expected']['date_only']}）・POST {len(creates)} "
          f"{[(c['slug'], c['external_id']) for c in creates]}・凍結 {sorted(EXPECT_FROZEN)}・N-1 可 {n1_ok}")
    print(f"  列ごとの変化 {dict(cnt)}・現値維持 N-1 {len(n1_kept)}／出力制御 {len(oc_kept)}")
    print(f"  -> {plan_out}")


if __name__ == "__main__":
    main()
