# -*- coding: utf-8 -*-
"""
scripts/experimental/okinawa/parse_okinawa.py

沖縄電力 空容量マッピング・運用容量等一覧表 最新版の dry-run 差分レポート（BT・2026-10-04）。
★microCMS への書込は一切行わない（baseline は fetch_baseline.py（shikoku のものを prefix 指定で流用）が GET 済みのローカル JSON）。

使い方（リポジトリ直下）:
  python scripts/experimental/okinawa/parse_okinawa.py

── 実データで確定させた設計（BT 依頼書 9/19＋追補 10/1 D「変更なし」）──
[取得元] 公表ページ https://www.okiden.co.jp/business-support/service/rule/plan/index.html の href を実取得（2026-10-04）。
  3 系統とも「[2026年9月18日 更新]」。対象は _02・_03（変電所・配変・変電塔・配電塔）。_01（送電線）は対象外。
[encoding] 6 本とも utf-8-sig strict 失敗 → cp932 strict 成功（実測）。
[版] 6 本とも行0「2026年8月末時点」（データ基準時点・割れなし）。サイト更新日は 2026-09-18（別に記録）。
[列] 本島 変電所（01_02）だけ N-1 列があり台数・容量が無い（10 列）。他の 5 本は 台数・容量・空容量があり N-1 列が無い（12 列）。
[突合キー] external_id = okiden_{honto-66kv|honto-22kv|ritou}_{No原文}。★ファイル（＝設備区分）を跨いで external_id が重なる
  （離島の 平良「1」と 伊原間変電塔「1」、本島 66kV の変電所表と配変表が同じ No. 体系）→ (ファイル, external_id) を突合キーにする（§4-a）。
[#120] No.欄はホワイトリスト（「数字」または「数字 -数字」）。「全項目null」を除外条件にしない（変電所表は台数・空容量が全て無い）。
[#111/#117] dedupe はルール①のみ（ファイル内・名称＋電圧面＋数値）・ルール②不使用。設備区分はファイル単位で分かれているので名称同値でも別ファイルなら消さない。
[#114] 数値は float 正規化（0.12 等の小数を丸めない）。
"""
import argparse, csv, io, json, re, sys, unicodedata
from collections import Counter, defaultdict
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402
from frozen import drop_frozen  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "csv_2609"
BASE_URL = "https://www.okiden.co.jp/shared/csv/business-support/service/rule/plan/"
PAGE_URL = "https://www.okiden.co.jp/business-support/service/rule/plan/index.html"
BASELINE = HERE / "baseline_live.json"
# 報告の日付は公表ファイルを取得した日（2026-10-04）に固定する（実行が日付を跨いでも同じファイルを上書きする）
TODAY = "2026-10-04"
REPORT_JSON = Path(f"reports/grid-okinawa-dryrun-{TODAY}.json")
NORMALIZED = HERE / "okinawa_csv_2609_normalized.json"
SITE_UPDATED = "2026-09-18"

# file -> (eid 接頭辞, 当方の設備区分（prefecture 欄の原値）, 列の型)
FILES = {
    "con_res_map01_02.csv": ("okiden_honto-66kv_", "沖縄本島66kV系・変電所", "n1"),
    "con_res_map01_03.csv": ("okiden_honto-66kv_", "沖縄本島66kV系・配変", "cap"),
    "con_res_map02_02.csv": ("okiden_honto-22kv_", "沖縄本島22kV系・変電所", "cap"),
    "con_res_map02_03.csv": ("okiden_honto-22kv_", "沖縄本島22kV系・配変", "cap"),
    "con_res_map03_02.csv": ("okiden_ritou_", "沖縄離島・変電所", "cap"),
    "con_res_map03_03.csv": ("okiden_ritou_", "沖縄離島・配変", "cap"),
}
CURRENT_CLASS_COUNTS = {"沖縄本島66kV系・配変": 77, "沖縄本島66kV系・変電所": 38, "沖縄離島・変電所": 20,
                        "沖縄本島22kV系・配変": 10, "沖縄本島22kV系・変電所": 5, "沖縄離島・配変": 1}

NO_RE = re.compile(r"^\d+(\s*-\s*\d+)?$")
NFKC = lambda s: unicodedata.normalize("NFKC", s or "").strip()  # noqa: E731
DASHES = {"-", "－", "―", "ー", "—", "‐", "−"}


def is_dash(v):
    s = NFKC(v)
    return s == "" or s in {NFKC(d) for d in DASHES}


def to_float(v):
    s = NFKC(v).replace(",", "").replace(" ", "")
    return float(s) if re.fullmatch(r"-?\d+(\.\d+)?", s) else None


def to_int(v):
    f = to_float(v)
    return int(f) if f is not None else None


def parse_n1(v):
    s = NFKC(v)
    if is_dash(v):
        return None
    if s.startswith("不可"):
        return False
    if s.startswith("可"):
        return True
    return None


def text_or_none(v):
    s = (v or "").strip()
    return None if is_dash(s) else s


def oc_possibility(v):
    if is_dash(v):
        return None
    s = NFKC(v)
    return "有り" if "有" in s else s


def voltage_class(p):
    if p is None:
        return None
    # 初期取込（2026-05）と同じ規則: 132kV は独立の階級を作らず「その他」（現行 9 件・サイトの電圧階級に 132kV系 は無い）
    for k, v in ((66, "66kV系"), (22, "22kV系")):
        if abs(p - k) < 1e-6:
            return v
    if abs(p - 13.8) < 1e-6:
        return "13.8kV系"
    return "その他"


def fnum(x):
    return "-" if x is None else f"{float(x):g}"


def vkey(a, b):
    return f"{fnum(a)}/{fnum(b)}"


def numeq(x, y):
    return (x is None and y is None) or (x is not None and y is not None and abs(float(x) - float(y)) < 1e-6)


def parse_basis(s):
    s = NFKC(s)
    m = re.search(r"(\d{4})年(\d{1,2})月末時点", s)
    if m:
        y, mo = int(m.group(1)), int(m.group(2))
        import calendar
        return f"{y}-{mo:02d}-{calendar.monthrange(y, mo)[1]:02d}", s
    m = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日", s)
    return (f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}", s) if m else (None, s)


NONSTANDARD = []


def load_files():
    files, rows, skipped = [], [], []
    for fn, (prefix, fclass, kind) in FILES.items():
        raw = (SRC / fn).read_bytes()
        tried = []
        for e in ("utf-8-sig", "cp932"):
            try:
                t = raw.decode(e, errors="strict")
                tried.append(f"{e}: ok")
                enc = e
                break
            except UnicodeDecodeError:
                tried.append(f"{e}: NG")
        rs = list(csv.reader(io.StringIO(t)))
        basis, basis_raw = parse_basis(rs[0][0]) if rs and rs[0] else (None, None)
        header = [re.sub(r"\s+", "", c) for c in rs[1]] if len(rs) > 1 else []
        cnt = 0
        for line_no, r in enumerate(rs[2:], start=3):
            if not r or not any(c.strip() for c in r):
                continue
            no = re.sub(r"\s+", " ", (r[0] or "").strip())
            if not NO_RE.fullmatch(NFKC(no)):
                skipped.append({"file": fn, "line": line_no, "no": no[:40], "name": (r[1] if len(r) > 1 else "").strip(),
                                "reason": "No.欄が設備No（数字・数字 -数字）でない"})
                continue
            for ci, label in ((2, "電圧(一次)"), (3, "電圧(二次)")):
                if r[ci].strip() and to_float(r[ci]) is None:
                    NONSTANDARD.append({"file": fn, "line": line_no, "no": no, "name": r[1].strip(), "column": label,
                                        "raw": r[ci], "note": "数値にならないため null で読む（原値は失われる）"})
            row = {"file": fn, "facility_class": fclass, "no": no, "line": line_no,
                   "external_id": prefix + no, "name": r[1].strip(),
                   "voltage_primary_kv": to_float(r[2]), "voltage_secondary_kv": to_float(r[3]),
                   "last_updated": basis, "source_url": BASE_URL + fn}
            row["voltage_class"] = voltage_class(row["voltage_primary_kv"])
            if kind == "n1":
                row.update({"n1_raw": r[4], "n1_eligible": parse_n1(r[4]), "n1_capacity_mw": to_float(r[5]),
                            "oc_possibility": oc_possibility(r[6]), "oc_target_self": text_or_none(r[7]),
                            "oc_target_upper": text_or_none(r[8]), "notes": (r[9] or "").strip() or None,
                            "units": None, "capacity_total_mw": None, "cap_operational_mw": None,
                            "op_constraint": None, "cap_avail_mw": None})
            else:
                row.update({"units": to_int(r[4]), "capacity_total_mw": to_float(r[5]), "cap_operational_mw": to_float(r[6]),
                            "op_constraint": text_or_none(r[7]), "cap_avail_mw": to_float(r[8]),
                            "oc_possibility": oc_possibility(r[9]), "oc_target_self": None,
                            "oc_target_upper": text_or_none(r[10]), "notes": (r[11] or "").strip() or None,
                            "n1_raw": None, "n1_eligible": None, "n1_capacity_mw": None})
            rows.append(row)
            cnt += 1
        files.append({"file": fn, "facility_class": fclass, "url": BASE_URL + fn, "bytes": len(raw), "encoding": enc,
                      "encoding_tried": tried, "basis": basis, "basis_raw": basis_raw, "data_rows": cnt,
                      "columns": header})
    return files, rows, skipped


def pdf_compare(pdf_dir):
    """公表 PDF（con_res_map0{1,2,3}.pdf）の表と CSV の行を全行照合する（2026-10-04 追加）。
    セルは NFKC＋空白除去で比較し、CSV の各データ行と同じ並びの行が PDF の表に在るかを見る。"""
    import pdfplumber
    norm = lambda c: re.sub(r"\s+", "", NFKC(c or ""))  # noqa: E731
    prow, bykey, files = Counter(), defaultdict(list), []
    for s in ("01", "02", "03"):
        pdf = Path(pdf_dir) / f"con_res_map{s}.pdf"
        files.append({"file": pdf.name, "url": f"https://www.okiden.co.jp/shared/pdf/business/free/rule02/{pdf.name}",
                      "bytes": pdf.stat().st_size})
        with pdfplumber.open(pdf) as doc:
            for pg in doc.pages:
                for tb in pg.extract_tables():
                    for row in tb:
                        cells = tuple(norm(c) for c in (list(row) + [None] * 12)[:12])
                        for w in (10, 12):
                            prow[(w,) + cells[:w]] += 1
                        bykey[(cells[0], cells[1])].append(cells)
    out = {"pdf_files": files, "csv_rows_checked": 0, "csv_rows_found": 0, "mismatches": []}
    for fn in FILES:
        rs = list(csv.reader(io.StringIO((SRC / fn).read_bytes().decode("cp932"))))
        for line_no, r in enumerate(rs[2:], start=3):
            if not r or not NO_RE.fullmatch(NFKC(re.sub(r"\s+", " ", (r[0] or "").strip()))):
                continue
            w = len(r) if len(r) in (10, 12) else 12
            cells = tuple(norm(c) for c in (r + [""] * 12)[:w])
            out["csv_rows_checked"] += 1
            key = (w,) + cells
            if prow[key] > 0:
                prow[key] -= 1
                out["csv_rows_found"] += 1
            else:
                out["mismatches"].append({"file": fn, "line": line_no, "csv": list(cells),
                                          "pdf_same_no_name": [list(x[:w]) for x in bykey.get((cells[0], cells[1]), [])]})
    return out


FIELDS = [
    ("units", "台数", "num"), ("capacity_total_mw", "設備容量", "num"), ("cap_operational_mw", "運用容量", "num"),
    ("op_constraint", "運用容量制約要因", "text"), ("cap_avail_mw", "空容量(当該)", "num"),
    ("n1_capacity_mw", "N-1電制適用可能量", "num"), ("oc_possibility", "平常時出力制御の可能性", "text"),
    ("notes", "備考", "text"),
]


def base_val(b, k):
    v = b.get(k)
    if k == "oc_possibility":
        return v[0] if isinstance(v, list) and v else None
    return None if v == "" else v


META_KEYS = {"id", "createdAt", "updatedAt", "publishedAt", "revisedAt"}
PLAN_LU = "2026-08-31T00:00:00.000Z"  # 「2026年8月末時点」＝データ基準時点（裁定 BT-1。サイト更新日 2026-09-18 は報告にだけ記録）
PLAN_FETCHED = "2026-10-05T00:00:00.000Z"  # 当サイトの取込日（10/5 に取り直した CSV は 10/4 とハッシュ一致）
MATSUDA = "oki-honto-66kv-710001"  # 裁定 BT-2: CSV 13／PDF 12 の食い違い → 取り込まない（現値 12・last_updated も据え置き）。備考に両値だけ残す
OKUMA = "oki-honto-66kv-850001"    # 裁定 BT-4: 二次電圧「22-13.8」は数値にならない → 数値欄は null のまま、原値を備考に


def append_note(cur, extra):
    if extra in (cur or ""):  # 冪等: 取込後の baseline から計画を作り直しても二重に足さない
        return cur
    return f"{cur}／{extra}" if cur else extra


def emit_plan(path, matched, new_rows, base):
    """本実行の計画（BS+BT 本実行便 2026-10-05・裁定 §2 BT 5 点）。書込はしない（applier が読む）。"""
    assert not new_rows, new_rows
    updates = []
    for b, r in matched:
        if b["slug"] == MATSUDA:
            patch = {"notes": append_note(b.get("notes"), "空容量: 2026年8月末時点の公表 CSV は 13、PDF は 12")}
            updates.append({"slug": b["slug"], "id": b["id"], "patch": patch, "changed": ["notes"],
                            "before": {k: v for k, v in b.items() if k not in META_KEYS}, "note": "取り込まない（値・last_updated 据え置き）。備考に両値だけ"})
            continue
        patch = {"last_updated": PLAN_LU, "fetched_at": PLAN_FETCHED}
        if b.get("source_url") != r["source_url"]:
            patch["source_url"] = r["source_url"]
        changed = []
        for k, _lab, kind in FIELDS:
            bv, nv = base_val(b, k), r[k]
            if kind == "num" and numeq(bv, nv) or kind == "text" and (bv or None) == (nv or None):
                continue
            patch[k] = ([nv] if nv else []) if k == "oc_possibility" else (int(nv) if k == "units" and nv is not None else nv)
            changed.append(k)
        if r["file"] == "con_res_map01_02.csv" and r["n1_eligible"] is not None and bool(b.get("n1_eligible")) != r["n1_eligible"]:
            patch["n1_eligible"] = r["n1_eligible"]
            changed.append("n1_eligible")
        if b["slug"] == OKUMA:
            raw = next(x["raw"] for x in NONSTANDARD if x["name"] == r["name"] and x["column"] == "電圧(二次)")
            patch["notes"] = append_note(r["notes"], f"二次電圧の公表値は「{raw}」（数値にならないため電圧欄は空）")
            changed.append("notes")
        updates.append({"slug": b["slug"], "id": b["id"], "patch": patch, "changed": changed,
                        "before": {k: v for k, v in b.items() if k not in META_KEYS}})
    plan = {"generated": "2026-10-05", "area": "沖縄", "prefix": "oki-", "endpoint": "substations",
            "expected": {"updates": 151, "imported": 150, "value_changed_imported": 14, "creates": 0, "n1_ok_after": 4,
                         # n1-status の「公表なし」113 件の as_of: 本実行後の再生成で 112 件が 2026-08-31 に、松田 1 件は据え置き（last_updated を変えないため）
                         "n1_status_as_of_updated": 112, "n1_status_as_of_kept": 1},
            "updates": updates, "creates": []}
    imported = [u for u in updates if u["slug"] != MATSUDA]
    vc = sum(1 for u in imported if [k for k in u["changed"] if k != "notes" or u["slug"] != OKUMA])
    assert len(updates) == 151 and len(imported) == 150 and vc == 14, (len(updates), len(imported), vc)
    Path(path).write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"plan → {path}: updates {len(updates)}（取込 {len(imported)}・値変化 {vc}・松田は備考だけ・奥間は備考に原値）")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf-dir", help="公表 PDF（con_res_map0{1,2,3}.pdf）の置き場所。指定時は CSV と PDF を全行照合する")
    ap.add_argument("--emit-plan", help="本実行の計画 JSON の出力先（指定時は計画だけ書き、dry-run の成果物は書き換えない）")
    args = ap.parse_args()
    R = {"generated_on": TODAY, "area": "沖縄", "operator": "沖縄電力", "page": PAGE_URL,
         "scope": "dry-run（差分レポートのみ・microCMS 書込ゼロ）", "site_updated": SITE_UPDATED,
         "requires_judgement": [], "warnings": []}
    files, raw_rows, skipped = load_files()
    R["files"] = files
    bases = Counter(f["basis"] for f in files)
    R["version"] = {"current_last_updated": "2026-03-01", "new_basis": sorted(bases), "split": len(bases) > 1,
                    "basis_raw": sorted({f["basis_raw"] for f in files}), "site_updated": SITE_UPDATED}
    R["excluded_note_rows"] = skipped

    base = drop_frozen(json.load(open(BASELINE, encoding="utf-8")))
    R["baseline"] = {"count": len(base)}

    kept, removed_dup = apply_series_dedup(
        raw_rows, {b.get("external_id") for b in base}, enable_baseline_name_rule=False,
        key_id="external_id", key_name="name",
        value_keys=("voltage_primary_kv", "voltage_secondary_kv", "cap_operational_mw", "capacity_total_mw", "units", "cap_avail_mw"),
        group_key="file",
    )
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(removed_dup), "summary": summarize(removed_dup),
                   "rule2": "不使用（#117）"}

    # ── 突合: (ファイル＝設備区分, external_id) → 組内は 電圧面 → 設備容量 → 運用容量 → 台数（#115）──
    def bfile(b):
        return (b.get("source_url") or "").rsplit("/", 1)[-1]
    bgroups, ngroups = defaultdict(list), defaultdict(list)
    for b in base:
        bgroups[(bfile(b), NFKC(b.get("external_id")))].append(b)
    for r in kept:
        ngroups[(r["file"], NFKC(r["external_id"]))].append(r)
    class_mismatch = [b["slug"] for b in base if FILES.get(bfile(b), (None, None))[1] != b.get("prefecture")]
    matched, new_rows, removed, renamed = [], [], [], []
    for key in sorted(set(bgroups) | set(ngroups)):
        bl, nl = list(bgroups.get(key, [])), list(ngroups.get(key, []))
        used = set()
        for r in nl:
            cands = [b for b in bl if id(b) not in used and vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv"))
                     == vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])]
            for k in ("capacity_total_mw", "cap_operational_mw", "units"):
                if len(cands) > 1:
                    nar = [b for b in cands if numeq(b.get(k), r[k])]
                    cands = nar or cands
            if not cands:  # 電圧面が変わった行も同じ組なら紐付ける（名称一致で）
                cands = [b for b in bl if id(b) not in used and NFKC(b.get("name")) == NFKC(r["name"])]
            if cands:
                b = cands[0]
                used.add(id(b))
                matched.append((b, r))
                if NFKC(b.get("name")) != NFKC(r["name"]):
                    renamed.append({"slug": b["slug"], "external_id": b.get("external_id"), "facility_class": r["facility_class"],
                                    "old_name": b.get("name"), "new_name": r["name"]})
            else:
                new_rows.append(r)
        removed += [b for b in bl if id(b) not in used]

    renumber = []
    for r in list(new_rows):
        for b in list(removed):
            if bfile(b) == r["file"] and NFKC(b.get("name")) == NFKC(r["name"]) and \
                    vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")) == vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]):
                renumber.append({"slug": b["slug"], "name": r["name"], "facility_class": r["facility_class"],
                                 "old_external_id": b.get("external_id"), "new_external_id": r["external_id"]})
                new_rows.remove(r)
                removed.remove(b)
                break

    field_stats = {k: {"label": lab, "changed": 0, "filled": 0, "dropped": 0} for k, lab, _ in FIELDS}
    field_stats["voltage"] = {"label": "電圧面", "changed": 0, "filled": 0, "dropped": 0}
    changed_records, dropped, volt_changes = [], [], []
    n1_changes, n1_undet, dec, inc, vclass_diff = [], [], [], [], []
    for b, r in matched:
        diffs = {}
        for k, lab, kind in FIELDS:
            bv, nv = base_val(b, k), r[k]
            if kind == "num" and numeq(bv, nv) or kind == "text" and (bv or None) == (nv or None):
                continue
            if bv is None:
                field_stats[k]["filled"] += 1
            elif nv is None:
                field_stats[k]["dropped"] += 1
                dropped.append({"slug": b["slug"], "name": b["name"], "field": lab, "current": bv})
            else:
                field_stats[k]["changed"] += 1
            diffs[k] = {"current": bv, "new": nv}
        if vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")) != vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]):
            field_stats["voltage"]["changed"] += 1
            volt_changes.append({"slug": b["slug"], "name": b["name"],
                                 "current": vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")),
                                 "new": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])})
        if r["file"] == "con_res_map01_02.csv":
            if r["n1_eligible"] is None:
                n1_undet.append({"slug": b["slug"], "name": r["name"], "raw": r["n1_raw"]})
            elif bool(b.get("n1_eligible")) != r["n1_eligible"]:
                n1_changes.append({"slug": b["slug"], "name": r["name"], "current": b.get("n1_eligible"), "new": r["n1_eligible"], "raw": r["n1_raw"]})
                diffs["n1_eligible"] = {"current": b.get("n1_eligible"), "new": r["n1_eligible"]}
        if (b.get("voltage_class") or [None])[0] != r["voltage_class"]:
            vclass_diff.append({"slug": b["slug"], "current": b.get("voltage_class"), "new": r["voltage_class"]})
        ca, cn = base_val(b, "cap_avail_mw"), r["cap_avail_mw"]
        if ca is not None and cn is not None:
            item = {"slug": b["slug"], "name": r["name"], "facility_class": r["facility_class"],
                    "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]), "current": ca, "new": cn, "delta": round(cn - ca, 6)}
            if cn < ca:
                item["zeroed"] = cn == 0 and ca > 0
                dec.append(item)
            elif cn > ca:
                inc.append(item)
        if diffs:
            changed_records.append({"slug": b["slug"], "name": r["name"], "diffs": diffs})
    dec.sort(key=lambda x: (x["delta"], x["slug"]))
    inc.sort(key=lambda x: (-x["delta"], x["slug"]))

    # 当方が保存していない 2 列（出力制御の可能性がある設備: 当該／上位系）に中身があるか
    unstored = Counter()
    for r in kept:
        if r["oc_target_self"]:
            unstored["当該設備"] += 1
        if r["oc_target_upper"]:
            unstored["上位系設備"] += 1

    # 同名ペア（変電所表と配変表）の残存（§4-a）
    def names(fn):
        return {NFKC(r["name"]) for r in kept if r["file"] == fn}
    pair_names = sorted(names("con_res_map01_02.csv") & names("con_res_map01_03.csv"))
    pair_check = {}
    for nm in ("与勝変電所", "与根変電所", "与那原変電所", "中城湾変電所", "西那覇変電所"):
        pair_check[nm] = {"変電所表": nm in names("con_res_map01_02.csv"), "配変表": nm in names("con_res_map01_03.csv")}

    after_total = len(matched) + len(renumber) + len(new_rows)
    pct = (after_total - len(base)) / len(base) * 100
    class_after = Counter(r["facility_class"] for _, r in matched) + Counter(r["facility_class"] for r in new_rows)
    R.update({
        "matching": {"key": "(ファイル＝設備区分, external_id = okiden_{系統}_{No原文})・組内は電圧面→設備容量→運用容量→台数（#115）",
                     "baseline_class_vs_file_mismatch": class_mismatch},
        "counts": {"baseline": len(base), "new_after_dedupe": len(kept), "matched": len(matched), "new": len(new_rows),
                   "removed": len(removed), "renumbered": len(renumber), "renamed": len(renamed),
                   "changed_records": len(changed_records), "unchanged_records": len(matched) - len(changed_records),
                   "after_total": after_total, "change_pct": round(pct, 2)},
        "field_stats": field_stats, "changed": changed_records, "dropped": dropped, "voltage_changes": volt_changes, "voltage_class_diff": vclass_diff,
        "new_rows": [{k: r[k] for k in ("file", "facility_class", "external_id", "name", "voltage_primary_kv", "voltage_secondary_kv",
                                         "units", "capacity_total_mw", "cap_operational_mw", "cap_avail_mw", "n1_raw", "line")} for r in new_rows],
        "removed": [{"slug": b["slug"], "name": b["name"], "external_id": b.get("external_id"), "facility_class": b.get("prefecture"),
                     "voltage": vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv"))} for b in removed],
        "renamed": renamed, "renumbered": renumber,
        "cap_decreased": {"count": len(dec), "zeroed": sum(1 for x in dec if x.get("zeroed")), "top10": dec[:10], "all": dec},
        "cap_increased": {"count": len(inc), "top5": inc[:5], "all": inc},
        "n1": {"current_ok": sum(1 for b in base if b.get("n1_eligible") is True),
               "new_ok": sum(1 for _, r in matched if r["n1_eligible"] is True) + sum(1 for r in new_rows if r["n1_eligible"] is True),
               "changes": n1_changes, "undetermined": n1_undet,
               "ok_list": sorted(r["name"] for _, r in matched if r["n1_eligible"] is True),
               "n1_capacity_values": sorted({(r["name"], r["n1_capacity_mw"]) for _, r in matched if r["n1_capacity_mw"] is not None})},
        "unstored_columns_nonempty": dict(unstored),
        "same_name_pairs": {"both_tables": pair_names, "check": pair_check},
        "class_counts": {"current": CURRENT_CLASS_COUNTS, "after": dict(class_after)},
    })
    R["nonstandard_values"] = NONSTANDARD
    R["n1_reason_codes"] = dict(Counter(NFKC(r["n1_raw"]) for r in kept if r["file"] == "con_res_map01_02.csv"))
    if args.pdf_dir:
        R["pdf_compare"] = pdf_compare(args.pdf_dir)
    if abs(pct) > 10:
        R["warnings"].append(f"件数が現行 {len(base)} から {pct:+.1f}%（±10% 超）")
    # 要判断は .md と同じ並び
    R["requires_judgement"].append(f"last_updated に入れる日付（基準時点「{sorted(R['version']['basis_raw'])[0]}」→ {sorted(bases)[0]} を提案。"
                                   f"現行 {R['version']['current_last_updated']} の付け方は確かめられない）")
    for m in R.get("pdf_compare", {}).get("mismatches", []):
        R["requires_judgement"].append(f"CSV と PDF の値が合わない: {m['file']} {m['line']} 行 {m['csv'][0]} {m['csv'][1]}（どちらを採るか・照会するか）")
    R["requires_judgement"].append("本実行の手順: last_updated を変えると n1-status.json の沖縄 no_column 113 件（as_of 2026-03-01）が表示に効かなくなり"
                                   "「不可」に戻る → webhook を止めて PATCH → build_n1_status.py を再実行（as_of を新しい last_updated に）→ push 1 回")
    if NONSTANDARD:
        R["requires_judgement"].append(f"数値にならない原値 {len(NONSTANDARD)} 件（null で読む・原値を残すか）: "
                                       + "・".join(f"{x['name']} {x['column']}「{x['raw']}」" for x in NONSTANDARD))
    if renamed:
        R["requires_judgement"].append(f"同一No.で名称変更 {len(renamed)} 件（上書きしない・ブロック）")
    if renumber:
        R["requires_judgement"].append(f"No. の振り直し候補 {len(renumber)} 件")
    if new_rows:
        R["requires_judgement"].append(f"新規 {len(new_rows)} 件（追加は裁定事項）")
    if removed:
        R["requires_judgement"].append(f"CSV に無い既存レコード {len(removed)} 件（消滅候補）")
    if volt_changes:
        R["requires_judgement"].append(f"同じ No. で電圧面が変わった {len(volt_changes)} 件")
    if dropped:
        R["requires_judgement"].append(f"新 CSV で「-」になった既存値 {len(dropped)} 件（現値維持か空にするか）")
    if unstored:
        R["requires_judgement"].append(f"当方が保存していない列に値がある（出力制御の可能性がある設備）: {dict(unstored)}")
    if class_mismatch:
        R["requires_judgement"].append(f"baseline の設備区分と source ファイルが食い違う {len(class_mismatch)} 件")

    if args.emit_plan:
        emit_plan(args.emit_plan, matched, new_rows, base)
        return
    NORMALIZED.write_text(json.dumps({"basis": sorted(bases), "rows": raw_rows}, ensure_ascii=False, indent=1), encoding="utf-8")
    REPORT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    c = R["counts"]
    print("files:", ", ".join(f"{f['file'][11:16]} {f['bytes']}B {f['encoding']} {f['basis']} rows{f['data_rows']}" for f in files))
    print(f"note rows excluded {len(skipped)} {[(s['file'][11:16], s['no']) for s in skipped]}; dedupe {len(raw_rows)}->{len(kept)}")
    print(f"baseline {c['baseline']} matched {c['matched']} new {c['new']} removed {c['removed']} renumbered {c['renumbered']} "
          f"renamed {c['renamed']} changed {c['changed_records']} after {c['after_total']} ({c['change_pct']:+}%)")
    print("field_stats", {v['label']: (v['changed'], v['filled'], v['dropped']) for v in field_stats.values()})
    print(f"cap decreased {len(dec)} (zeroed {R['cap_decreased']['zeroed']}) increased {len(inc)}")
    print(f"n1 current_ok {R['n1']['current_ok']} new_ok {R['n1']['new_ok']} changes {len(n1_changes)} undet {len(n1_undet)} ok_list {R['n1']['ok_list']}")
    print("pairs", pair_check, "unstored", dict(unstored), "class_mismatch", class_mismatch, "vclass_diff", len(vclass_diff))
    print("requires_judgement:", R["requires_judgement"]); print("warnings:", R["warnings"])


if __name__ == "__main__":
    main()
