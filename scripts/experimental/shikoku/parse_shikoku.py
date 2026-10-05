# -*- coding: utf-8 -*-
"""
scripts/experimental/shikoku/parse_shikoku.py

四国電力送配電 予想潮流等 最新版の dry-run 差分レポート（BS・2026-10-04）。
★microCMS への書込は一切行わない（baseline は fetch_baseline.py が GET 済みのローカル JSON）。

使い方（リポジトリ直下）:
  python scripts/experimental/shikoku/parse_shikoku.py

── 実データで確定させた設計（BS 依頼書 9/19＋追補 10/1・推測しない）──
[取得元] 公表ページ https://www.yonden.co.jp/nw/line_access/data.html の「系統構成・予想潮流・空容量」節の
  href を実取得（2026-10-04）。変圧器 CSV 5 本 = sys_capa_{kikan00,local01..04}_tr_202610_08.csv。
  ページの見出し順: 基幹（187kV以上）→ 香川(local01) → 愛媛(local02) → 徳島(local03) → 高知(local04)。
  旧版 _202605_08 は 404（列構成は baseline の値の有無から推定する）。
[encoding] 5 本とも utf-8-sig strict 失敗 → cp932 strict 成功（実測）。
[版] 5 本とも行0「2026年10月1日更新」（割れなし）。PDF の更新表記はレポート側で別途記録。
[突合キー] external_id = yonden_{file}_{No}（baseline と同じ体系）。同一 No. に複数行（バンク）があり external_id は
  一意でない（48 組）→ (file, No) の組の中で 電圧面 → 設備容量 → 運用容量 → 台数 の順にタイブレーク（#115）。
  slug の枝番は「組の中の CSV 行順 1 行目=無印・2 行目=-2」（初期取込の規則）。組内で順序が入れ替わっていないか照合（§4-b）。
[#120] No.欄はホワイトリスト（数字のみ）。「全項目null」を除外条件にしない。
[#111/#117] dedupe はルール①のみ（電圧面込み複合判定）・ルール②不使用。
[#114] 数値は float 正規化して比較（97.9 等の小数を丸めない）。
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

VERSION_TAG = "202610_08"
SRC = HERE / f"csv_{VERSION_TAG[:6]}"
BASE_URL = "https://www.yonden.co.jp/nw/assets/line_access/data/"
PAGE_URL = "https://www.yonden.co.jp/nw/line_access/data.html"
BASELINE = HERE / "baseline_live.json"
# 報告の日付は公表ファイルを取得した日（2026-10-04）に固定する（実行が日付を跨いでも同じファイルを上書きする）
TODAY = "2026-10-04"
REPORT_MD = Path(f"reports/grid-shikoku-dryrun-{TODAY}.md")
REPORT_JSON = Path(f"reports/grid-shikoku-dryrun-{TODAY}.json")
NORMALIZED = HERE / f"shikoku_csv_{VERSION_TAG[:6]}_normalized.json"
N1_OUT = HERE.parent / "_common" / "n1_undetermined_shikoku.json"

# file -> (slug の県キー, 県名, ページ見出し)
FILES = {
    "kikan00": ("kikan", None, "基幹系統(187kV以上系統)"),
    "local01": ("kagawa", "香川県", "香川県 ローカル系統"),
    "local02": ("ehime", "愛媛県", "愛媛県 ローカル系統"),
    "local03": ("tokushima", "徳島県", "徳島県 ローカル系統"),
    "local04": ("kochi", "高知県", "高知県 ローカル系統"),
}
CURRENT_PREF_COUNTS = {"愛媛県": 100, "香川県": 58, "高知県": 56, "徳島県": 55, "基幹": 25}

NO_RE = re.compile(r"^\d+$")
DASHES = {"-", "－", "―", "ー", "—", "‐", "−"}
NFKC = lambda s: unicodedata.normalize("NFKC", s or "").strip()  # noqa: E731


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


def n1_reason(v):
    """N-1 欄の原文 → n1-status の reason（None は可・不可）"""
    if (v or "").strip() == "":
        return "blank"
    if is_dash(v):
        return "undetermined"
    return None


def text_or_none(v):
    s = (v or "").strip()
    return None if is_dash(s) else s


def oc_possibility(v):
    s = NFKC(v)
    if is_dash(v):
        return None
    return "有り" if "有" in s else s


def voltage_class(p):
    if p is None:
        return None
    m = {500: "500kV系", 187: "187kV系", 110: "110kV系", 66: "66kV系", 22: "22kV系"}
    for k, v in m.items():
        if abs(p - k) < 1e-6:
            return v
    if abs(p - 13) < 1e-6 or abs(p - 13.8) < 1e-6:
        return "13.8kV系"
    return "その他"


def fnum(x):
    return "-" if x is None else f"{float(x):g}"


def vkey(a, b):
    return f"{fnum(a)}/{fnum(b)}"


def numeq(x, y):
    return (x is None and y is None) or (x is not None and y is not None and abs(float(x) - float(y)) < 1e-6)


def parse_version(s):
    m = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日", NFKC(s))
    return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}" if m else None


def read_csv(path):
    raw = path.read_bytes()
    tried = []
    for e in ("utf-8-sig", "cp932"):
        try:
            t = raw.decode(e, errors="strict")
            tried.append(f"{e}: ok")
            return raw, e, tried, list(csv.reader(io.StringIO(t)))
        except UnicodeDecodeError as ex:
            tried.append(f"{e}: NG（{str(ex)[:60]}）")
    raise SystemExit(f"{path}: encoding 判定不能 {tried}")


def load_files():
    files, rows, skipped = [], [], []
    for fkey, (pkey, pref, heading) in FILES.items():
        name = f"sys_capa_{fkey}_tr_{VERSION_TAG}.csv"
        raw, enc, tried, rs = read_csv(SRC / name)
        ver = parse_version(rs[0][0]) if rs and rs[0] else None
        header = [c.strip() for c in rs[1]] if len(rs) > 1 else []
        header_used = [h for h in header if h]
        extra_nonempty = sum(1 for r in rs for c in r[17:] if c.strip())
        order_in_no = Counter()
        cnt = 0
        prev = None
        for line_no, r in enumerate(rs[2:], start=3):
            if not r or not any(c.strip() for c in r):
                continue
            no = NFKC(r[0])
            name_cell = (r[1] if len(r) > 1 else "").strip()
            continuation = False
            # No.・名称が空欄でも設備値がある行は、直前の変電所の続き（別バンク）。結合セルの書き出しと見て
            # No.・名称・一次電圧を直前の行から引き継ぐ（#120: 値のある行を黙って捨てない）。
            # 実例（10月版）: 基幹 13 行目 = 高知変電所（No.13）の 187/110kV バンク。
            if no == "" and name_cell == "" and prev is not None and any(to_float(c) is not None for c in r[3:13]):
                continuation = True
                no = prev["no"]
            elif not NO_RE.fullmatch(no):
                skipped.append({"file": fkey, "line": line_no, "no": no[:40], "name": name_cell,
                                "reason": "No.欄が数字でない（注記・凡例の行）"})
                continue
            order_in_no[no] += 1
            k = order_in_no[no]
            p, s2 = to_float(r[2]), to_float(r[3])
            if continuation and p is None:
                p = prev["voltage_primary_kv"]
            row_name = prev["name"] if continuation else r[1].strip()
            rows.append({
                "file": fkey, "no": no, "bank_order": k, "line": line_no, "continuation": continuation,
                "external_id": f"yonden_{fkey}_{no}",
                "expected_slug": f"ydn-{pkey}-{int(no):04d}" + ("" if k == 1 else f"-{k}"),
                "prefecture": pref,
                "name": row_name,
                "voltage_primary_kv": p, "voltage_secondary_kv": s2,
                "voltage_class": voltage_class(p),
                "units": to_int(r[4]),
                "capacity_total_mw": to_float(r[5]),
                "cap_operational_mw": to_float(r[6]),
                "op_constraint": text_or_none(r[7]),
                "forecast_flow_mw": to_float(r[8]),
                "cap_avail_mw": to_float(r[9]),
                "cap_avail_upper_mw": to_float(r[10]),
                "n1_raw": r[11],
                "n1_eligible": parse_n1(r[11]),
                "n1_capacity_mw": to_float(r[12]),
                "oc_possibility": oc_possibility(r[13]),
                "oc_target_self": text_or_none(r[14]),
                "oc_target_upper": text_or_none(r[15]),
                "notes": (r[16] or "").strip() or None,
                "last_updated": ver,
                "source_url": BASE_URL + name,
            })
            prev = rows[-1]
            cnt += 1
        files.append({"file": fkey, "heading": heading, "url": BASE_URL + name, "bytes": len(raw),
                      "encoding": enc, "encoding_tried": tried, "version": ver, "data_rows": cnt,
                      "header": header_used, "columns_total": len(header), "extra_columns_nonempty": extra_nonempty})
    return files, rows, skipped


def pdf_compare(pdf_dir):
    """公表 PDF（sys_capa_*_map_*.pdf）の表と CSV の行を全行照合する（2026-10-04 追加・沖縄で CSV／PDF の不一致が実在）。
    セルは NFKC＋空白除去で比較。CSV の各データ行（No.欄が数字か続き行）が PDF の表のどこかに同じ並びで在るかを見る。"""
    import pdfplumber
    norm = lambda c: re.sub(r"\s+", "", NFKC(c or ""))  # noqa: E731
    out = {"pdf_files": [], "csv_rows_checked": 0, "csv_rows_found": 0, "mismatches": []}
    for fkey in FILES:
        pdf = Path(pdf_dir) / f"sys_capa_{fkey}_map_{VERSION_TAG}.pdf"
        prow = Counter()
        bykey = defaultdict(list)
        with pdfplumber.open(pdf) as doc:
            for pg in doc.pages:
                for tb in pg.extract_tables():
                    for row in tb:
                        cells = tuple(norm(c) for c in (list(row) + [None] * 17)[:17])
                        prow[cells] += 1
                        bykey[(cells[0], cells[1])].append(cells)
        out["pdf_files"].append({"file": pdf.name, "bytes": pdf.stat().st_size})
        _, _, _, rs = read_csv(SRC / f"sys_capa_{fkey}_tr_{VERSION_TAG}.csv")
        for line_no, r in enumerate(rs[2:], start=3):
            cells = tuple(norm(c) for c in (r + [""] * 17)[:17])
            if not any(cells) or not (NO_RE.fullmatch(cells[0]) or (cells[0] == "" and cells[1] == "" and any(cells[3:13]))):
                continue
            out["csv_rows_checked"] += 1
            if prow[cells] > 0:
                prow[cells] -= 1
                out["csv_rows_found"] += 1
            else:
                out["mismatches"].append({"file": fkey, "line": line_no, "csv": list(cells),
                                          "pdf_same_no_name": [list(x) for x in bykey.get((cells[0], cells[1]), [])]})
    return out


FIELDS = [  # (key, 表示名, 種別)
    ("units", "台数", "num"), ("capacity_total_mw", "設備容量", "num"), ("cap_operational_mw", "運用容量", "num"),
    ("op_constraint", "運用容量制約要因", "text"), ("forecast_flow_mw", "予想潮流", "num"),
    ("cap_avail_mw", "空容量(当該)", "num"), ("cap_avail_upper_mw", "空容量(上位系等)", "num"),
    ("n1_capacity_mw", "N-1電制適用可能量", "num"), ("oc_possibility", "平常時出力制御の可能性", "text"),
    ("oc_target_self", "出力制御対象(当該)", "text"), ("oc_target_upper", "出力制御対象(上位系)", "text"),
    ("notes", "備考", "text"),
]


def base_val(b, k):
    v = b.get(k)
    if k == "oc_possibility":
        return v[0] if isinstance(v, list) and v else None
    return v if v not in ("",) else None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pdf-dir", help="公表 PDF（sys_capa_*_map_*.pdf）の置き場所。指定時は CSV と PDF を全行照合する")
    args = ap.parse_args()
    R = {"generated_on": TODAY, "area": "四国", "operator": "四国電力送配電",
         "scope": "dry-run（差分レポートのみ・microCMS 書込ゼロ）", "page": PAGE_URL,
         "requires_judgement": [], "warnings": []}
    files, raw_rows, skipped = load_files()
    R["files"] = files
    vers = Counter(f["version"] for f in files)
    R["version"] = {"current": "2026-05-01", "new": sorted(vers), "split": len(vers) > 1}
    R["excluded_note_rows"] = skipped

    base = drop_frozen(json.load(open(BASELINE, encoding="utf-8")))
    R["baseline"] = {"count": len(base), "source": "microCMS GET（fetch_baseline.py）"}

    kept, removed_dup = apply_series_dedup(
        raw_rows, {b.get("external_id") for b in base},
        enable_baseline_name_rule=False,  # #117
        key_id="external_id", key_name="name",
        value_keys=("voltage_primary_kv", "voltage_secondary_kv", "cap_operational_mw",
                    "forecast_flow_mw", "capacity_total_mw", "units"),
        group_key="file",
    )
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(removed_dup),
                   "summary": summarize(removed_dup), "rule2": "不使用（#117）",
                   "examples": [{"external_id": e.get("external_id"), "name": e.get("name"),
                                 "reason": e.get("exclude_reason")} for e in removed_dup[:5]]}

    # ── 突合: (file,No) 組 → 電圧面 → 設備容量 → 運用容量 → 台数（#115）──
    bgroups = defaultdict(list)
    for b in base:
        bgroups[b["external_id"]].append(b)
    ngroups = defaultdict(list)
    for r in kept:
        ngroups[r["external_id"]].append(r)
    matched, new_rows, removed, renamed, order_cross = [], [], [], [], []
    for eid in sorted(set(bgroups) | set(ngroups)):
        bl, nl = list(bgroups.get(eid, [])), list(ngroups.get(eid, []))
        used = set()
        pairs = []
        for r in nl:
            cands = [b for b in bl if id(b) not in used
                     and vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv"))
                     == vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])]
            for key in ("capacity_total_mw", "cap_operational_mw", "units"):
                if len(cands) > 1:
                    narrowed = [b for b in cands if numeq(b.get(key), r[key])]
                    if narrowed:
                        cands = narrowed
            if len(cands) > 1:  # まだ複数 → slug の枝番（行順）で決める
                narrowed = [b for b in cands if b["slug"] == r["expected_slug"]]
                cands = narrowed or cands
            if cands:
                b = cands[0]
                used.add(id(b))
                pairs.append((b, r))
            else:
                new_rows.append(r)
        removed += [b for b in bl if id(b) not in used]
        for b, r in pairs:
            matched.append((b, r))
            if NFKC(b.get("name")) != NFKC(r["name"]):
                renamed.append({"slug": b["slug"], "external_id": eid, "old_name": b.get("name"), "new_name": r["name"],
                                "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])})
            if b["slug"] != r["expected_slug"]:
                order_cross.append({"slug": b["slug"], "expected_slug_by_row_order": r["expected_slug"],
                                    "name": r["name"], "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                                    "line": r["line"]})

    # 新規×消滅で 名称＋電圧面 が一致する組（No. の振り直し候補）
    renumber = []
    for r in list(new_rows):
        for b in list(removed):
            if NFKC(b.get("name")) == NFKC(r["name"]) and vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")) \
                    == vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]):
                renumber.append({"slug": b["slug"], "name": r["name"], "old_external_id": b.get("external_id"),
                                 "new_external_id": r["external_id"], "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])})
                new_rows.remove(r)
                removed.remove(b)
                break

    # ── フィールド差分 ──
    field_stats = {k: {"label": lab, "changed": 0, "filled": 0, "dropped": 0} for k, lab, _ in FIELDS}
    changed_records, dropped_examples = [], defaultdict(list)
    vclass_diff = []
    n1_changes, n1_undet = [], []
    dec, inc = [], []
    for b, r in matched:
        diffs = {}
        for k, lab, kind in FIELDS:
            bv, nv = base_val(b, k), r[k]
            same = numeq(bv, nv) if kind == "num" else ((bv or None) == (nv or None))
            if same:
                continue
            if bv is None:
                field_stats[k]["filled"] += 1
            elif nv is None:
                field_stats[k]["dropped"] += 1
                dropped_examples[k].append({"slug": b["slug"], "name": b["name"], "current": bv,
                                            "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])})
            else:
                field_stats[k]["changed"] += 1
            diffs[k] = {"current": bv, "new": nv}
        # N-1（三値を潰さない: 新が未算定なら比較しない＝現値維持）
        if r["n1_eligible"] is None:
            n1_undet.append({"slug": b["slug"], "name": r["name"], "external_id": r["external_id"],
                             "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                             "raw": r["n1_raw"], "reason": n1_reason(r["n1_raw"]), "current_n1_eligible": b.get("n1_eligible"),
                             "prefecture": r["prefecture"], "file": r["file"]})
        elif bool(b.get("n1_eligible")) != r["n1_eligible"]:
            n1_changes.append({"slug": b["slug"], "name": r["name"], "current": b.get("n1_eligible"), "new": r["n1_eligible"],
                               "raw": r["n1_raw"]})
            diffs["n1_eligible"] = {"current": b.get("n1_eligible"), "new": r["n1_eligible"]}
        if (b.get("voltage_class") or [None])[0] != r["voltage_class"]:
            vclass_diff.append({"slug": b["slug"], "current": b.get("voltage_class"), "new": r["voltage_class"]})
        ca, cn = base_val(b, "cap_avail_mw"), r["cap_avail_mw"]
        if ca is not None and cn is not None:
            if cn < ca:
                dec.append({"slug": b["slug"], "name": r["name"], "prefecture": r["prefecture"] or "（基幹）",
                            "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                            "current": ca, "new": cn, "delta": cn - ca, "zeroed": cn == 0 and ca > 0})
            elif cn > ca:
                inc.append({"slug": b["slug"], "name": r["name"], "prefecture": r["prefecture"] or "（基幹）",
                            "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                            "current": ca, "new": cn, "delta": cn - ca})
        if diffs:
            changed_records.append({"slug": b["slug"], "name": r["name"], "diffs": diffs})
    dec.sort(key=lambda x: (x["delta"], x["slug"]))
    inc.sort(key=lambda x: (-x["delta"], x["slug"]))

    # 新規行の N-1 未算定も一覧に（取込後に未算定になる行）
    n1_undet_new = [{"external_id": r["external_id"], "name": r["name"], "raw": r["n1_raw"], "reason": n1_reason(r["n1_raw"]),
                     "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])}
                    for r in new_rows if r["n1_eligible"] is None]
    oc_undet = sum(1 for _, r in matched if r["oc_possibility"] is None)

    # ── 基幹の突合（§4-a）──
    kikan_rows = [r for r in kept if r["file"] == "kikan00"]
    kikan_base = [b for b in base if b["slug"].startswith("ydn-kikan-")]
    kikan_new = [r for r in new_rows if r["file"] == "kikan00"]
    kikan_removed = [b for b in removed if b["slug"].startswith("ydn-kikan-")]

    # ── 件数 ──
    after_total = len(matched) + len(renumber) + len(new_rows)
    pref_new = Counter((r["prefecture"] or "基幹") for _, r in matched) + Counter((r["prefecture"] or "基幹") for r in new_rows)
    pct = (after_total - len(base)) / len(base) * 100

    R.update({
        "matching": {"key": "external_id = yonden_{file}_{No}（(file,No) 組の中で 電圧面→設備容量→運用容量→台数→行順の枝番でタイブレーク・#115）",
                     "groups_multi_bank_baseline": sum(1 for v in bgroups.values() if len(v) > 1),
                     "groups_multi_bank_new": sum(1 for v in ngroups.values() if len(v) > 1)},
        "counts": {"baseline": len(base), "new_after_dedupe": len(kept), "matched": len(matched),
                   "new": len(new_rows), "removed": len(removed), "renumbered": len(renumber),
                   "renamed": len(renamed), "changed_records": len(changed_records),
                   "unchanged_records": len(matched) - len(changed_records),
                   "after_total": after_total, "change_pct": round(pct, 2)},
        "field_stats": field_stats, "dropped_examples": dropped_examples,
        "new_rows": [{k: r[k] for k in ("external_id", "expected_slug", "name", "prefecture", "voltage_primary_kv", "voltage_secondary_kv",
                                         "units", "capacity_total_mw", "cap_operational_mw", "forecast_flow_mw", "cap_avail_mw",
                                         "n1_raw", "notes", "line", "continuation")} for r in new_rows],
        "continuation_rows": [{k: r[k] for k in ("file", "line", "no", "name", "voltage_primary_kv", "voltage_secondary_kv", "units",
                                                  "capacity_total_mw", "forecast_flow_mw", "n1_raw", "notes", "expected_slug")}
                              for r in raw_rows if r.get("continuation")],
        "removed": [{"slug": b["slug"], "name": b["name"], "external_id": b.get("external_id"),
                     "voltage": vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv"))} for b in removed],
        "renamed": renamed, "renumbered": renumber, "bank_order_cross": order_cross,
        "voltage_class_diff": vclass_diff,
        "cap_decreased": {"count": len(dec), "zeroed": sum(1 for x in dec if x["zeroed"]), "top10": dec[:10], "all": dec},
        "cap_increased": {"count": len(inc), "top5": inc[:5]},
        "n1": {"current_ok": sum(1 for b in base if b.get("n1_eligible") is True),
               "new_ok": sum(1 for _, r in matched if r["n1_eligible"] is True) + sum(1 for r in new_rows if r["n1_eligible"] is True),
               "changes": n1_changes, "undetermined_matched": n1_undet, "undetermined_new_rows": n1_undet_new},
        "oc_undetermined_matched": oc_undet,
        "kikan": {"csv_rows": len(kikan_rows), "baseline": len(kikan_base), "not_in_ours": len(kikan_new),
                  "not_in_csv": len(kikan_removed)},
        "pref_counts": {"current": CURRENT_PREF_COUNTS, "after": dict(pref_new)},
    })
    # ── 列単位の事実（要判断 2 の材料）──
    R["column_facts"] = {
        "cap_avail_upper_nonnull_new": sum(1 for r in kept if r["cap_avail_upper_mw"] is not None),
        "rows_new": len(kept),
        "x22_banks_new": sum(1 for r in kept if r["voltage_secondary_kv"] is not None and abs(r["voltage_secondary_kv"] - 22) < 1e-6),
        "x22_banks_with_cap_avail_new": sum(1 for r in kept if r["voltage_secondary_kv"] is not None
                                            and abs(r["voltage_secondary_kv"] - 22) < 1e-6 and r["cap_avail_mw"] is not None),
        "diamond_rows_equal_n1_dash_rows": {r["external_id"] + "|" + vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]) for r in kept if "◇" in (r["notes"] or "")}
                                           == {r["external_id"] + "|" + vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]) for r in kept if r["n1_eligible"] is None},
        "baseline_cap_avail_gt_operational": [{"slug": b["slug"], "cap_avail": b.get("cap_avail_mw"), "operational": b.get("cap_operational_mw")}
                                              for b in base if b.get("cap_avail_mw") is not None and b.get("cap_operational_mw") is not None
                                              and b["cap_avail_mw"] > b["cap_operational_mw"]],
    }
    if args.pdf_dir:
        R["pdf_compare"] = pdf_compare(args.pdf_dir)
    if abs(pct) > 10:
        R["warnings"].append(f"件数が現行 {len(base)} から {pct:+.1f}%（±10% 超）")
    # 要判断は .md と同じ並び（同じ 1 行を観点別に重ねて数えない）
    cont = [r for r in raw_rows if r.get("continuation")]
    for r in new_rows:
        why = "No.・名称が空欄の続きの行（直前の変電所の別バンク）" if r.get("continuation") else "新規の行"
        kikan = "・基幹で当方に無い設備（§4-a）" if r["file"] == "kikan00" else ""
        R["requires_judgement"].append(f"新規 {r['expected_slug']} {r['name']} {vkey(r['voltage_primary_kv'], r['voltage_secondary_kv'])}"
                                       f"（{why}{kikan}）を足すか")
    n_drop = sum(v["dropped"] for v in field_stats.values())
    if n_drop:
        R["requires_judgement"].append(f"新 CSV で「－」になった既存値 {n_drop} 件の扱い（現値維持か公表どおり空か）: "
                                       + "・".join(f"{v['label']} {v['dropped']}" for v in field_stats.values() if v["dropped"]))
    if R.get("pdf_compare", {}).get("mismatches"):
        R["requires_judgement"].append(f"CSV と PDF の値が合わない行 {len(R['pdf_compare']['mismatches'])} 件")
    if renamed:
        R["requires_judgement"].append(f"同一No.で名称変更 {len(renamed)} 件（上書きしない・ブロック）")
    if renumber:
        R["requires_judgement"].append(f"No. の振り直し候補 {len(renumber)} 件")
    if order_cross:
        R["requires_judgement"].append(f"枝番の行順と slug が交差 {len(order_cross)} 件（§4-b）")
    if removed:
        R["requires_judgement"].append(f"CSV に無い既存レコード {len(removed)} 件（消滅候補・扱いは裁定事項）")
    if vclass_diff:
        R["requires_judgement"].append(f"電圧階級の導出が初期取込と異なる {len(vclass_diff)} 件（§4-d）")

    NORMALIZED.write_text(json.dumps({"version": VERSION_TAG, "rows": raw_rows}, ensure_ascii=False, indent=1), encoding="utf-8")
    N1_OUT.write_text(json.dumps({
        "purpose": "四国 10月版（_202610_08）で N-1電制適用可否が未算定（－）・空欄の行。dry-run の一覧（書込なし）。"
                   "build_n1_status.py の入力（as_of は 10月版の版日付＝再取込後の last_updated）。",
        "version": "2026-10-01", "count": len(n1_undet) + len(n1_undet_new),
        "matched": n1_undet, "new_rows": n1_undet_new}, ensure_ascii=False, indent=1), encoding="utf-8")
    REPORT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=str), encoding="utf-8")

    c = R["counts"]
    print(f"files: " + ", ".join(f"{f['file']} {f['bytes']}B {f['encoding']} v{f['version']} rows{f['data_rows']}" for f in files))
    print(f"note rows excluded {len(skipped)}; dedupe {len(raw_rows)}->{len(kept)} ({len(removed_dup)} removed)")
    print(f"baseline {c['baseline']} matched {c['matched']} new {c['new']} removed {c['removed']} renumbered {c['renumbered']} "
          f"renamed {c['renamed']} changed {c['changed_records']} after {c['after_total']} ({c['change_pct']:+}%)")
    print("field_stats", {v['label']: (v['changed'], v['filled'], v['dropped']) for v in field_stats.values()})
    print(f"cap decreased {len(dec)} (zeroed {R['cap_decreased']['zeroed']}) increased {len(inc)}")
    print(f"n1 current_ok {R['n1']['current_ok']} new_ok {R['n1']['new_ok']} changes {len(n1_changes)} "
          f"undet matched {len(n1_undet)} undet new {len(n1_undet_new)}; oc undet {oc_undet}")
    print(f"kikan {R['kikan']}; order_cross {len(order_cross)}; vclass_diff {len(vclass_diff)}")
    print("requires_judgement:", R["requires_judgement"]); print("warnings:", R["warnings"])
    print(f"→ {REPORT_JSON}（md はこの JSON から別途作成）")


if __name__ == "__main__":
    main()
