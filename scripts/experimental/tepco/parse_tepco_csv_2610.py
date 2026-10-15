# -*- coding: utf-8 -*-
"""
scripts/experimental/tepco/parse_tepco_csv_2610.py

東京電力パワーグリッド 予想潮流等 2026年9月30日更新版の dry-run 差分レポート（BU・2026-10-15）。
★microCMS への書込は一切行わない（baseline は fetch_baseline.py が GET 済みのローカル JSON）。

使い方（リポジトリ直下）:
  set -a && . ./.env.local && set +a && python scripts/experimental/shikoku/fetch_baseline.py tpg- scripts/experimental/tepco/baseline_live_2610.json
  python scripts/experimental/tepco/parse_tepco_csv_2610.py

── 実データで確定させた設計（BU 依頼書 10/15・推測しない）──
[取得元] 公表ページ https://www.tepco.co.jp/pg/consignment/system/ の「系統の予想潮流等」の href を実取得（2026-10-15）。
  /pg/consignment/system/pdf/csv_yosochoryu_{area}.zip ×14（基幹＋13 都県域）。各 ZIP に hendensyo（変電所）と
  soudensen（送電線）。本スクリプトは変電所だけ扱う（既存 tpg-* は全て変電所＝従来どおり）。
[版] 14 本とも Last-Modified: Wed, 30 Sep 2026（応答ヘッダ）。更新履歴ページ 2026年9月30日「予想潮流を更新」。
  CSV の先頭メタ行「＜送電線_予想潮流・空容量のフォーマット＞2026年09月02日更新」は**フォーマット改定日**（7 月版は 06月22日）。
[encoding] 14 本とも utf-8-sig strict 成功（7 月版は gunma・shizuoka・yamanashi が cp932）。ファイルごとに実測して出す。
[レイアウト] 14 本とも 19 列（7 月版の基幹は 24 列だった＝基幹の列が県別と同じになった）。
  No(0) 名(1) 電圧(2) 台数(3) 設備容量(4) 運用容量(5) 制約(6) 潮流方向(7-9) 予想潮流(10) 空容量当該(11)
  空容量上位系(12) N-1可否(13) N-1量(14) 出力制御の可能性(15) 対象当該(16) 対象上位系(17) 備考(18)
[突合キー] external_id = No.欄（「変栃木県 154kV 1」「変基幹 275kV 3-1」）。baseline と同じ体系。同じ external_id に複数行が
  あれば 電圧面 → 設備容量 → 運用容量 → 台数 → 行順 でタイブレーク（#115）。数値は float で比べる（#114）。
[名称] baseline の名称はバンクの番号「(1)」付き（初期取込の PDF 由来）。比べるときは末尾の「(n)」を外す。
[#111/#117] 系列別ビューの再掲（66kV 系列の No. で 154/66 等のバンクを再掲する行。電圧の欄は空）は、
  同じファイルの同名の非 66kV 系列の行と 運用容量・予想潮流・設備容量・台数 が全て同値なら除外（ルール①・lower_series）。
  ルール②（baseline の名称で写像）は使わない（BU 依頼書）。残った新規行は名称で既存に当たるかを報告するだけ（自動で除外しない）。
[#120] No.欄はホワイトリスト（ID_RE）。注記・見出しの行は除外して一覧に出す。「全項目 null」を除外条件にしない。
"""
import csv, io, json, re, sys, unicodedata, zipfile
from collections import Counter, defaultdict
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402
from frozen import drop_frozen  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "csv_2610"
OLD = HERE / "csv_2607"
BASELINE = HERE / "baseline_live_2610.json"
TODAY = "2026-10-15"
REPORT_JSON = Path(f"reports/grid-tokyo-dryrun-{TODAY}.json")
NORMALIZED = HERE / "tepco_csv_2610_normalized.json"
N1_OUT = HERE.parent / "_common" / "n1_undetermined_tokyo.json"
PAGE_URL = "https://www.tepco.co.jp/pg/consignment/system/"
FILE_URL = "https://www.tepco.co.jp/pg/consignment/system/pdf/csv_yosochoryu_{}.zip"
NEW_VERSION = "2026-09-30"

AREAS = {  # area -> (都県, ページの見出し)
    "kikan": (None, "基幹系統"), "tochigi": ("栃木県", "栃木県"), "gunma": ("群馬県", "群馬県"), "ibaraki": ("茨城県", "茨城県"),
    "saitama": ("埼玉県", "埼玉県"), "chiba": ("千葉県", "千葉県"), "tokyo": ("東京都", "東京都[23区]"), "tama": ("東京都", "東京都[多摩地区]"),
    "kanagawa": ("神奈川県", "神奈川県"), "yamanashi": ("山梨県", "山梨県"), "shizuoka": ("静岡県", "静岡県［富士川以東］"),
    "fukushima": ("福島県", "福島県[一部]"), "nagano": ("長野県", "長野県[一部]"), "niigata": ("新潟県", "新潟県[一部]"),
}
ID_RE = re.compile(r"^変.+?\s+(?:\d+(?:\.\d+)?kV|配電用変電所)\s+\d+(?:-\d+)?$")
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
    if (v or "").strip() == "":
        return "blank"
    if is_dash(v):
        return "undetermined"
    return None


def text_or_none(v):
    s = (v or "").replace("　", " ").strip()
    return None if is_dash(s) else s


def oc_possibility(v):
    s = NFKC(v)
    if is_dash(v):
        return None
    return "有り" if "有" in s else ("なし" if ("な" in s or "無" in s) else s)


def norm_id(v):
    return re.sub(r"\s+", " ", str(v).replace("　", " ")).strip()


def base_name(n):
    return re.sub(r"[（(]\d+[）)]$", "", NFKC(n))


def fnum(x):
    return "-" if x is None else f"{float(x):g}"


def vkey(a, b):
    return f"{fnum(a)}/{fnum(b)}"


def numeq(x, y):
    return (x is None and y is None) or (x is not None and y is not None and abs(float(x) - float(y)) < 1e-6)


def parse_voltage(v):
    s = NFKC(v).replace("／", "/")
    m = re.fullmatch(r"(\d+(?:\.\d+)?)\s*/\s*(\d+(?:\.\d+)?)", s)
    return (float(m.group(1)), float(m.group(2))) if m else (None, None)


def read_hendensyo(zpath):
    with zipfile.ZipFile(zpath) as z:
        names = [n for n in z.namelist() if "hendensyo" in n]
        raw = z.read(names[0])
    tried = []
    for e in ("utf-8-sig", "cp932"):
        try:
            t = raw.decode(e, errors="strict")
            tried.append(f"{e}: ok")
            return names[0], raw, e, tried, list(csv.reader(io.StringIO(t)))
        except UnicodeDecodeError as ex:
            tried.append(f"{e}: NG（{str(ex)[:50]}）")
    raise SystemExit(f"{zpath}: encoding 判定不能 {tried}")


def load_files():
    files, rows, skipped = [], [], []
    for area, (pref, heading) in AREAS.items():
        zpath = SRC / f"csv_yosochoryu_{area}.zip"
        fname, raw, enc, tried, rs = read_hendensyo(zpath)
        meta = next((c for c in (rs[0] if rs else []) if c.strip()), "")
        ncols = max(len(r) for r in rs)
        order = Counter()
        cnt = 0
        for line_no, r in enumerate(rs, start=1):
            if not r or not any(c.strip() for c in r):
                continue
            rid = norm_id(r[0] if r else "")
            if not ID_RE.match(rid):
                if line_no > 4:  # 1〜4 行目は見出し（メタ行・列名）
                    skipped.append({"area": area, "line": line_no, "cells": [c.strip()[:20] for c in r[:4]], "reason": "No.欄が設備の No. の形でない（注記・見出しの行）"})
                continue
            r = (r + [""] * 19)[:19]
            order[rid] += 1
            p, s2 = parse_voltage(r[2])
            rows.append({
                "area": area, "line": line_no, "external_id": rid, "order_in_id": order[rid],
                "prefecture": pref, "name": (r[1] or "").replace("　", " ").strip(),
                "voltage_raw": r[2].strip(), "voltage_primary_kv": p, "voltage_secondary_kv": s2,
                "series_66kv": " 66kV " in f" {rid} ",
                "units": to_int(r[3]), "capacity_total_mw": to_float(r[4]), "cap_operational_mw": to_float(r[5]),
                "op_constraint": text_or_none(r[6]), "forecast_flow_mw": to_float(r[10]),
                "cap_avail_mw": to_float(r[11]), "cap_avail_upper_mw": to_float(r[12]),
                "n1_raw": r[13], "n1_eligible": parse_n1(r[13]), "n1_capacity_mw": to_float(r[14]),
                "oc_possibility": oc_possibility(r[15]), "oc_target_self": text_or_none(r[16]), "oc_target_upper": text_or_none(r[17]),
                "notes": text_or_none(r[18]),
            })
            cnt += 1
        old_sha = None
        oldp = OLD / f"csv_yosochoryu_{area}.zip"
        if oldp.exists():
            import hashlib
            old_sha = hashlib.sha256(oldp.read_bytes()).hexdigest()
        import hashlib
        files.append({"area": area, "heading": heading, "url": FILE_URL.format(area), "zip_bytes": zpath.stat().st_size,
                      "zip_sha256": hashlib.sha256(zpath.read_bytes()).hexdigest(), "zip_sha256_july": old_sha,
                      "csv_name": fname, "csv_bytes": len(raw), "encoding": enc, "encoding_tried": tried,
                      "meta_line": meta.strip(), "columns": ncols, "data_rows": cnt})
    return files, rows, skipped


FIELDS = [  # (key, 表示名, 種別) baseline に在る列だけ
    ("units", "台数", "num"), ("capacity_total_mw", "設備容量", "num"), ("cap_operational_mw", "運用容量", "num"),
    ("forecast_flow_mw", "予想潮流", "num"), ("cap_avail_mw", "空容量(当該)", "num"), ("cap_avail_upper_mw", "空容量(上位系等)", "num"),
    ("n1_capacity_mw", "N-1電制適用可能量", "num"), ("oc_possibility", "平常時出力制御の可能性", "text"), ("notes", "備考", "text"),
]


def base_val(b, k):
    v = b.get(k)
    if k == "oc_possibility":
        return v[0] if isinstance(v, list) and v else None
    return v if v not in ("",) else None


def main():
    R = {"generated_on": TODAY, "area": "東京", "operator": "東京電力パワーグリッド",
         "scope": "dry-run（差分レポートのみ・microCMS 書込ゼロ）", "page": PAGE_URL, "requires_judgement": [], "warnings": []}
    files, raw_rows, skipped = load_files()
    R["files"] = files
    R["excluded_note_rows"] = skipped
    raw_base = json.load(open(BASELINE, encoding="utf-8"))
    base = drop_frozen(raw_base)
    R["baseline"] = {"count_raw": len(raw_base), "count": len(base), "frozen_dropped": [b["slug"] for b in raw_base if b not in base],
                     "source": "microCMS GET（scripts/experimental/shikoku/fetch_baseline.py tpg-）",
                     "last_updated": dict(Counter((b.get("last_updated") or "")[:10] for b in base))}
    base_ids = {b.get("external_id") for b in base}

    # ── 系列別ビューの再掲の除去（ルール①のみ・66kV 系列の行を再掲側として、同じファイルの同名の非 66kV 行と同値なら除外）──
    kept, removed_dup = apply_series_dedup(
        raw_rows, base_ids, enable_baseline_name_rule=False, key_id="external_id", key_name="name",
        value_keys=("cap_operational_mw", "forecast_flow_mw", "capacity_total_mw", "units"),
        group_key="area", lower_series=lambda r: r["series_66kv"])
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(removed_dup), "summary": summarize(removed_dup),
                   "rule2": "不使用（BU 依頼書・#117）", "examples": [{"external_id": e["external_id"], "name": e["name"], "reason": e["exclude_reason"]} for e in removed_dup[:5]],
                   "by_area": dict(Counter(e["area"] for e in removed_dup))}

    # ── 突合（#115）──
    bgroups, ngroups = defaultdict(list), defaultdict(list)
    for b in base:
        bgroups[b.get("external_id")].append(b)
    for r in kept:
        ngroups[r["external_id"]].append(r)
    matched, new_rows, removed, renamed = [], [], [], []
    for eid in sorted(set(bgroups) | set(ngroups), key=lambda x: x or ""):
        bl, nl = list(bgroups.get(eid, [])), list(ngroups.get(eid, []))
        used = set()
        for r in nl:
            cands = [b for b in bl if id(b) not in used]
            if r["voltage_primary_kv"] is not None and len(cands) > 1:
                nv = [b for b in cands if vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")) == vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])]
                cands = nv or cands
            for key in ("capacity_total_mw", "cap_operational_mw", "units"):
                if len(cands) > 1:
                    nv = [b for b in cands if numeq(b.get(key), r[key])]
                    cands = nv or cands
            if cands:
                b = cands[0]
                used.add(id(b))
                matched.append((b, r))
                if base_name(b.get("name")) != NFKC(r["name"]):
                    renamed.append({"slug": b["slug"], "external_id": eid, "old_name": b.get("name"), "new_name": r["name"],
                                    "old_name_in_new_csv": any(NFKC(x["name"]) == base_name(b.get("name")) for x in raw_rows)})
            else:
                new_rows.append(r)
        removed += [b for b in bl if id(b) not in used]

    # 新規×消滅で 名称＋数値 が一致する組（No. の振り直し候補）・新規が既存の名称に当たるか（報告だけ）
    renumber = []
    for r in list(new_rows):
        for b in list(removed):
            if base_name(b.get("name")) == NFKC(r["name"]) and numeq(b.get("cap_operational_mw"), r["cap_operational_mw"]) \
                    and numeq(b.get("capacity_total_mw"), r["capacity_total_mw"]):
                renumber.append({"slug": b["slug"], "name": r["name"], "old_external_id": b.get("external_id"), "new_external_id": r["external_id"]})
                new_rows.remove(r)
                removed.remove(b)
                break
    bname = defaultdict(list)
    for b in base:
        bname[base_name(b.get("name"))].append(b["slug"])
    new_name_hits = [{"external_id": r["external_id"], "name": r["name"], "area": r["area"], "same_name_existing": bname.get(NFKC(r["name"]), [])}
                     for r in new_rows]

    # ── フィールド差分 ──
    field_stats = {k: {"label": lab, "changed": 0, "filled": 0, "dropped": 0} for k, lab, _ in FIELDS}
    dropped_examples = defaultdict(list)
    changed_records, n1_changes, n1_undet, dec, inc, volt_diff = [], [], [], [], [], []
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
                dropped_examples[k].append({"slug": b["slug"], "name": b["name"], "current": bv})
            else:
                field_stats[k]["changed"] += 1
            diffs[k] = {"current": bv, "new": nv}
        if r["voltage_primary_kv"] is not None and vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")) != vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]):
            volt_diff.append({"slug": b["slug"], "name": b["name"], "current": vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")), "new": r["voltage_raw"]})
        if r["n1_eligible"] is None:
            n1_undet.append({"operator": "東京電力パワーグリッド", "area": "東京", "slug": b["slug"], "external_id": b.get("external_id"), "name": b["name"],
                             "raw": r["n1_raw"], "reason": n1_reason(r["n1_raw"]), "current_n1_eligible": b.get("n1_eligible")})
        elif bool(b.get("n1_eligible")) != r["n1_eligible"]:
            n1_changes.append({"slug": b["slug"], "name": b["name"], "current": b.get("n1_eligible"), "new": r["n1_eligible"], "raw": r["n1_raw"]})
            diffs["n1_eligible"] = {"current": b.get("n1_eligible"), "new": r["n1_eligible"]}
        ca, cn = base_val(b, "cap_avail_mw"), r["cap_avail_mw"]
        if ca is not None and cn is not None:
            row = {"slug": b["slug"], "name": b["name"], "prefecture": b.get("prefecture"), "external_id": b.get("external_id"), "current": ca, "new": cn, "delta": cn - ca}
            if cn < ca:
                dec.append({**row, "zeroed": cn == 0 and ca > 0})
            elif cn > ca:
                inc.append(row)
        if diffs:
            changed_records.append({"slug": b["slug"], "name": b["name"], "diffs": diffs})
    dec.sort(key=lambda x: (x["delta"], x["slug"]))
    inc.sort(key=lambda x: (-x["delta"], x["slug"]))

    after_total = len(matched) + len(renumber) + len(new_rows)
    pct = (after_total - len(base)) / len(base) * 100
    # 都県別（baseline の prefecture・基幹は baseline の prefecture のまま）
    pref_cur = Counter(b.get("prefecture") for b in base)
    pref_after = Counter(b.get("prefecture") for b, _ in matched) + Counter(r["prefecture"] or "（基幹）" for r in new_rows)
    # 系列（external_id の頭）ごとの CSV 行数と baseline 件数（当方に無い設備群の検出）
    series = lambda eid: re.sub(r"\s+\d+(?:-\d+)?$", "", eid or "")  # noqa: E731
    ser_base = Counter(series(b.get("external_id")) for b in base)
    ser_new = Counter(series(r["external_id"]) for r in kept)
    groups = [{"series": s, "baseline": ser_base.get(s, 0), "csv_after_dedupe": ser_new.get(s, 0)} for s in sorted(set(ser_base) | set(ser_new))]

    R.update({
        "version": {"current": sorted(R["baseline"]["last_updated"]), "new": NEW_VERSION,
                    "evidence": "更新履歴 2026年9月30日「予想潮流を更新」・14 本とも Last-Modified 2026-09-30・CSV のメタ行はフォーマット改定日（09月02日）",
                    "split": False, "split_note": "系統レベル（基幹・地域供給・配電）ごとの更新日は CSV にもページにも書かれていない。8/21 は配電（22kV 以下）だけの更新、9/30 は「予想潮流を更新」（系統レベルの記載なし）。14 本の ZIP は全て 9/30 に差し替わっている"},
        "matching": {"key": "external_id = No.欄（同じ external_id の複数行は 電圧面→設備容量→運用容量→台数→行順・#115）",
                     "multi_row_ids_baseline": sum(1 for v in bgroups.values() if len(v) > 1), "multi_row_ids_new": sum(1 for v in ngroups.values() if len(v) > 1)},
        "counts": {"baseline": len(base), "csv_raw": len(raw_rows), "csv_after_dedupe": len(kept), "matched": len(matched), "new": len(new_rows),
                   "removed": len(removed), "renumbered": len(renumber), "renamed": len(renamed), "changed_records": len(changed_records),
                   "unchanged_records": len(matched) - len(changed_records), "after_total": after_total, "change_pct": round(pct, 2)},
        "field_stats": field_stats, "dropped_examples": dropped_examples,
        "new_rows": [{**{k: r[k] for k in ("area", "line", "external_id", "name", "prefecture", "voltage_raw", "units", "capacity_total_mw", "cap_operational_mw",
                                            "forecast_flow_mw", "cap_avail_mw", "n1_raw", "notes")}} for r in new_rows],
        "new_name_hits": new_name_hits,
        "removed": [{"slug": b["slug"], "name": b["name"], "external_id": b.get("external_id"), "prefecture": b.get("prefecture"),
                     "voltage": vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv"))} for b in removed],
        "renamed": renamed, "renumbered": renumber, "voltage_diff": volt_diff,
        "cap_decreased": {"count": len(dec), "zeroed": sum(1 for x in dec if x["zeroed"]), "top10": dec[:10], "all": dec},
        "cap_increased": {"count": len(inc), "top5": inc[:5]},
        "n1": {"current_ok": sum(1 for b in base if b.get("n1_eligible") is True),
               "new_ok": sum(1 for _, r in matched if r["n1_eligible"] is True) + sum(1 for r in new_rows if r["n1_eligible"] is True),
               "changes": n1_changes, "undetermined_matched": n1_undet},
        "pref_counts": {"current": dict(pref_cur), "after": dict(pref_after)},
        "series_groups": groups,
    })
    if abs(pct) > 10:
        R["warnings"].append(f"件数が現行 {len(base)} から {pct:+.1f}%（±10% 超）")
    for r in new_rows:
        R["requires_judgement"].append(f"新規 {r['external_id']} {r['name']}（{r['area']}）を足すか")
    n_drop = sum(v["dropped"] for v in field_stats.values())
    if n_drop:
        R["requires_judgement"].append(f"新 CSV で「－」・空欄になった既存値 {n_drop} 件の扱い（現値維持か公表どおり空か）: "
                                       + "・".join(f"{v['label']} {v['dropped']}" for v in field_stats.values() if v["dropped"]))
    if renamed:
        blocked = [x for x in renamed if not x["old_name_in_new_csv"]]
        R["requires_judgement"].append(f"同一No.で名称が変わった {len(renamed)} 件（うち旧名称が新 CSV のどこにも無い {len(blocked)} 件＝上書きせずブロック）")
    if renumber:
        R["requires_judgement"].append(f"No. の振り直し候補 {len(renumber)} 件")
    if removed:
        R["requires_judgement"].append(f"CSV に無い既存レコード {len(removed)} 件（消滅候補・扱いは裁定事項）")
    if volt_diff:
        R["requires_judgement"].append(f"電圧面が baseline と違う {len(volt_diff)} 件")

    NORMALIZED.write_text(json.dumps({"version": NEW_VERSION, "rows": raw_rows, "excluded_series_dup": removed_dup}, ensure_ascii=False, indent=1), encoding="utf-8")
    N1_OUT.write_text(json.dumps({
        "purpose": "東京 2026年9月30日更新版で N-1電制適用可否が未算定（－）・空欄の行。dry-run の一覧（書込なし）。build_n1_status.py の入力にできる形。",
        "version": NEW_VERSION, "count": len(n1_undet), "entries": n1_undet}, ensure_ascii=False, indent=1), encoding="utf-8")
    REPORT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1, default=str), encoding="utf-8")
    c = R["counts"]
    print("files:", ", ".join(f"{f['area']} {f['encoding']} cols{f['columns']} rows{f['data_rows']}" for f in files))
    print(f"note rows excluded {len(skipped)}; dedupe {len(raw_rows)}->{len(kept)} ({len(removed_dup)} removed {R['dedupe']['summary']})")
    print(f"baseline {c['baseline']} matched {c['matched']} new {c['new']} removed {c['removed']} renumbered {c['renumbered']} renamed {c['renamed']} "
          f"changed {c['changed_records']} after {c['after_total']} ({c['change_pct']:+}%)")
    print("field_stats", {v['label']: (v['changed'], v['filled'], v['dropped']) for v in field_stats.values()})
    print(f"cap decreased {len(dec)} (zeroed {R['cap_decreased']['zeroed']}) increased {len(inc)}")
    print(f"n1 current_ok {R['n1']['current_ok']} new_ok {R['n1']['new_ok']} changes {len(n1_changes)} undet {len(n1_undet)}; volt_diff {len(volt_diff)}")
    print("requires_judgement:", R["requires_judgement"])
    print("warnings:", R["warnings"])
    print(f"→ {REPORT_JSON}")


if __name__ == "__main__":
    main()
