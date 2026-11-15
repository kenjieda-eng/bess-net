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
    ap = argparse.ArgumentParser()
    ap.add_argument("--grid-html", required=True)
    ap.add_argument("--grid-meta", default="")
    args = ap.parse_args()

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

    page = grid_page_counts(args.grid_html)
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
    print("[dry-run] 完了（microCMS 書込なし）")


if __name__ == "__main__":
    main()
