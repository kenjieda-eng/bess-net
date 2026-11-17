# -*- coding: utf-8 -*-
"""
scripts/experimental/chubu/parse_chubu_2611.py

中部電力パワーグリッド gridmap 予想潮流等 最新版（2026年11月10日更新）の dry-run 差分レポート（BX・2026-11-15）。
★microCMS への書込は一切行わない（baseline は fetch_baseline.py が GET 済みのローカル JSON）。本実行の計画も作らない。

使い方（リポジトリ直下で）:
  python scripts/experimental/chubu/parse_chubu_2611.py --grid-html <素URLで取った /grid/chubu の HTML>

8/19 版（parse_chubu.py）からの変更:
  - 取得物は src_2611/（11/15 に pass_data/pass.json で確かめた KRSIH001・002・010〜016）、baseline は baseline_live_2611.json。
  - 当方の版は 2026-08-17（8/19 本実行）。
  - 出力制御の可能性（oc_possibility）を 2 通りの読みで数える（BX §2・まだ裁定が無い）:
      解釈A＝現行維持（書かない。初期取込の「当該設備が対象の場合のみ有り」は CSV の列から規則で作り直せない＝下の対照表）
      解釈B＝CSV 素直読み（「平常時出力制御の可能性」列のまま。'-' は現値維持）
    あわせて oc_target_self（当該設備）・oc_target_upper（上位系設備）の現値と CSV の対照も出す（送らない）。
  - 制約要因（op_constraint）の '-' を文字として持たないこと（8/19 のパーサバグ 168 件）の再発確認。
  - 8/17 版（src/）と 11/10 版の CSV の列ごとの変化（同じ No. の行どうし）。
  - 県別の現行値は素 URL の /grid/chubu から取る（--grid-html）。
  - --emit-plan は持たない（dry-run まで・本実行は別便）。
2026-11-17（BX 本実行便）: --emit-plan を足した（下の emit_plan・裁定 BX 1〜4）。
  python scripts/experimental/chubu/parse_chubu_2611.py --emit-plan --fetched-on 2026-11-17 \\
      --baseline <書込直前の GET> --out-json <scratchpad> --n1-out <scratchpad> --plan-out scripts/experimental/chubu/update_plan_202611.json
  11/15 の dry-run の記録（reports/grid-chubu-dryrun-2026-11-15.json・_common/n1_undetermined_chubu_2611.json）は上書きしない（出力先を変える）。
"""
import argparse, csv, gzip, io, json, re, sys, unicodedata, zipfile
from collections import Counter
from datetime import date
from pathlib import Path
import html as H

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402
from frozen import drop_frozen  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "src_2611"
SRC_OLD = HERE / "src"           # 8/17 版（8/19 の取込で使ったもの・比較だけ）
BASELINE = HERE / "baseline_live_2611.json"
BASE_URL = "https://gridmap.powergrid.chuden.co.jp"
REPORT_MD = Path("reports/grid-chubu-dryrun-2026-11-15.md")
REPORT_JSON = Path("reports/grid-chubu-dryrun-2026-11-15.json")
N1_OUT = HERE.parent / "_common" / "n1_undetermined_chubu_2611.json"
CUR_VERSION = "2026-08-17"

LAYERS = {
    "KRSIH010": None,      # 500/275kV（基幹。prefecture なし → facility_class「基幹系統」導出）
    "KRSIH011": "愛知県",
    "KRSIH012": "静岡県",
    "KRSIH013": "三重県",
    "KRSIH014": "岐阜県",
    "KRSIH015": "長野県",
    "KRSIH016": "愛知県",
}
HYPHENS = ("", "-", "ー", "―", "‐", "－", "−")

NFKC = lambda s: unicodedata.normalize("NFKC", (s or "")).strip()  # noqa: E731
clean_name = lambda s: (s or "").strip()  # noqa: E731  # ★名称は NFKC 禁止（全角括弧枝番の保持）


def to_float(v):
    s = NFKC(v)
    return float(s) if re.fullmatch(r"-?\d+(\.\d+)?", s) else None


def to_int(v):
    f = to_float(v)
    return int(f) if f is not None else None


def parse_n1(v):
    s = NFKC(v)
    if s in HYPHENS:
        return None
    if s.startswith("不可"):
        return False
    if s.startswith("可"):
        return True
    return None


def parse_oc(v):
    s = NFKC(v)
    if s in HYPHENS:
        return None
    if "有" in s:
        return "有り"
    if "無" in s or "な" in s:
        return "なし"
    return None


def vkey(a, b):
    f = lambda x: f"{float(x):g}" if x is not None else "-"  # noqa: E731
    return f"{f(a)}/{f(b)}"


def decode_strict(raw: bytes):
    for enc in ("utf-8-sig", "cp932"):
        try:
            return raw.decode(enc, errors="strict"), enc
        except UnicodeDecodeError:
            continue
    return None, None


def strip_trailer(s: str) -> str:
    i = s.rfind("&&")
    if i >= 0 and i > len(s) - 40:
        return s[:i]
    return s


def load_layers(src: Path):
    files, rows, skipped = [], [], []
    for k, pref in LAYERS.items():
        raw = (src / k).read_bytes()
        zf = zipfile.ZipFile(io.BytesIO(raw))
        subst = None
        member_kinds = []
        for n in zf.namelist():
            t, enc = decode_strict(zf.read(n))
            if t is None:
                raise SystemExit(f"{k}/{n}: utf-8-sig でも cp932 でも strict に読めない")
            rs = list(csv.reader(io.StringIO(t)))
            head = rs[1][0] if len(rs) > 1 and rs[1] else ""
            if head.startswith("変電所"):
                subst = (rs, enc, n)
                member_kinds.append(f"変電所（{enc}）")
            elif head.startswith("送電線"):
                member_kinds.append(f"送電線・対象外（{enc}）")
            else:
                member_kinds.append(f"その他・対象外: {head[:12]}（{enc}）")
        if subst is None:
            raise SystemExit(f"{k}: 変電所CSVが見つからない（スキーマ変化の可能性）")
        rs, enc, member = subst
        version = NFKC(rs[0][0]) if rs and rs[0] else None
        header = rs[1]
        cnt = 0
        for r in rs[2:]:
            if not r or len(r) < 16:
                continue
            no = NFKC(r[0])
            if not no:
                continue
            if not re.fullmatch(r"\d+", no):   # #120 ホワイトリスト
                skipped.append({"layer": k, "no": no[:50], "name": clean_name(r[1]), "reason": "No.欄が数値でない（注記行）"})
                continue
            rows.append({
                "layer": k, "no": no, "external_id": f"chuden_{no}", "prefecture": pref,
                "name": clean_name(r[1]),
                "voltage_primary_kv": to_float(r[2]), "voltage_secondary_kv": to_float(r[3]),
                "units": to_int(r[4]), "capacity_total_mw": to_float(r[5]), "cap_operational_mw": to_float(r[6]),
                "op_constraint_raw": NFKC(r[7]),
                "op_constraint": None if NFKC(r[7]) in HYPHENS else NFKC(r[7]),
                "forecast_flow_mw": to_float(r[8]), "cap_avail_mw": to_float(r[9]),
                "n1_raw": NFKC(r[10]), "n1_eligible": parse_n1(r[10]), "n1_capacity_mw": to_float(r[11]),
                "oc_raw": NFKC(r[12]), "oc_possibility": parse_oc(r[12]),
                "oc_self_raw": NFKC(r[13]), "oc_upper_raw": NFKC(r[14]),
                "oc_upper_csv": (r[14] or "").strip(),   # 本実行で書く値（裁定 1: CSV の文字のまま・trim だけ）
                "remarks": NFKC(r[15]), "src_version": version,
            })
            cnt += 1
        files.append({"layer": k, "url": f"{BASE_URL}/geo_data/{k}", "bytes": len(raw), "container": "ZIP",
                      "csv_member": member, "csv_encoding": enc, "version_row": version, "members": member_kinds,
                      "columns": len(header), "header": header, "data_rows": cnt, "prefecture": pref or "（基幹）"})
    return files, rows, skipped


def load_points(src: Path):
    raw = (src / "KRSIH001").read_bytes()
    t = gzip.decompress(raw)
    s, enc = decode_strict(t)
    gj = json.loads(strip_trailer(s))
    pts, icon_counts = {}, Counter()
    for f in gj["features"]:
        if f["geometry"]["type"] != "Point":
            continue
        icon = (f["properties"].get("_iconUrl") or "?").split("/")[-1]
        icon_counts[icon] += 1
        no = NFKC(f["properties"].get("変電所番号") or "")
        if no:
            lng, lat = f["geometry"]["coordinates"]
            pts.setdefault(no, []).append({"lat": lat, "lng": lng, "icon": icon, "name": clean_name(f["properties"].get("設備名称"))})
    return pts, dict(icon_counts), sum(icon_counts.values()), enc, len(raw)


def grid_page_counts(path: str):
    """素 URL の /grid/chubu の初期 DOM から、県別件数・総数・N-1 可・データ基準日を読む"""
    b = open(path, encoding="utf-8", errors="replace").read()
    v = re.sub(r"<script[\s\S]*?</script>|<style[\s\S]*?</style>", "", b).replace("<!-- -->", "")
    t = H.unescape(re.sub(r"<[^>]+>", "\n", v))
    t = re.sub(r"\n\s*\n+", "\n", t)
    out = {}
    i = t.find("都道府県別ブレークダウン")
    seg = t[i:i + 1500] if i >= 0 else ""
    for p in ["愛知県", "長野県", "岐阜県", "静岡県", "三重県", "基幹系統"]:
        m = re.search(rf"\n{p}\n(\d+)\n(\d+)\n", seg)
        out[p] = int(m.group(1)) if m else None
    m = re.search(r"サマリ統計\n([\d,]+)\n変電所数\n([\d,]+)\n空容量プラス\n([\d,]+)\nN-1電制適用可", t)
    if m:
        out["_total"], out["_avail_plus"], out["_n1_ok"] = (int(x.replace(",", "")) for x in m.groups())
    m = re.search(r"データ基準日: ([^\n]+)", t)
    out["_basis"] = m.group(1).strip() if m else None
    return out


def main():
    global BASELINE, REPORT_JSON, N1_OUT, SRC, NEW_VERSION
    ap = argparse.ArgumentParser()
    ap.add_argument("--grid-html", default="", help="dry-run の報告用（--emit-plan のときは省略可）")
    ap.add_argument("--grid-meta", default="", help="/grid/chubu を取った時刻・x-vercel-cache・age（報告に写すだけ）")
    # BX 本実行（2026-11-17）: 計画の出力。11/15 の dry-run の記録（REPORT_JSON・N1_OUT）は上書きしないよう出力先を変える
    ap.add_argument("--emit-plan", action="store_true")
    ap.add_argument("--plan-out", default="scripts/experimental/chubu/update_plan_202611.json")
    ap.add_argument("--baseline", default=str(BASELINE))
    ap.add_argument("--out-json", default=str(REPORT_JSON))
    ap.add_argument("--n1-out", default=str(N1_OUT))
    ap.add_argument("--fetched-on", default="")
    # 2026-11-17: 便の最初の版の取り直しで新しい版（11/13）が出ていた → その版で dry run をやり直す（書込しない）ための引数
    ap.add_argument("--src", default=str(SRC), help="取得物のフォルダ（既定 src_2611＝11/10 版）")
    ap.add_argument("--new-version", default=NEW_VERSION, help="取込む版の日付（last_updated）")
    ap.add_argument("--no-expect", action="store_true",
                    help="11/15 の dry run の件数と照らさない（新しい版の dry run 用）。計画は書くが、想定の外は止めずに一覧にする")
    args = ap.parse_args()
    BASELINE, REPORT_JSON, N1_OUT = Path(args.baseline), Path(args.out_json), Path(args.n1_out)
    SRC, NEW_VERSION = Path(args.src), args.new_version
    if args.emit_plan and not args.fetched_on:
        raise SystemExit("--emit-plan には --fetched-on が必要")

    R = {"generated_on": str(date.today()), "area": "中部", "operator": "中部電力パワーグリッド",
         "scope": "dry-run（差分レポートのみ・microCMS 書込ゼロ・本実行の計画も作らない）",
         "files": [], "warnings": [], "requires_judgement": []}

    print("=== 1. 取得レイヤ・encoding 実測 ===")
    files, raw_rows, skipped = load_layers(SRC)
    R["files"] = files
    for f in files:
        print(f"  {f['layer']} {f['csv_encoding']:9s} {f['bytes']:7d}B 版={f['version_row']} 変電所{f['data_rows']:4d}行 列{f['columns']} {f['prefecture']} members={f['members']}")
    hdrs = {json.dumps(f["header"], ensure_ascii=False) for f in files}
    old_files, old_rows, _ = load_layers(SRC_OLD)
    old_hdrs = {json.dumps(f["header"], ensure_ascii=False) for f in old_files}
    R["schema"] = {"header_variants_new": len(hdrs), "same_as_8_17": hdrs == old_hdrs, "header": files[0]["header"]}
    print(f"  列: {len(files[0]['header'])} 列・レイヤ間の差 {len(hdrs) - 1}・8/17 版と同じ {hdrs == old_hdrs}")
    p2, _ = decode_strict((SRC / "KRSIH002").read_bytes())
    m = re.search(r'"taishobi"\s*:\s*"([^"]+)"', p2)
    taishobi = m.group(1) if m else "?"
    vers = sorted({f["version_row"] for f in files})
    R["version"] = {"当方(現行)": CUR_VERSION, "新": vers, "taishobi": taishobi, "レイヤ割れ": len(vers) > 1}
    print(f"  版: {vers}・taishobi {taishobi}")

    R["excluded_note_rows"] = {"count": len(skipped), "rows": skipped}
    print(f"\n=== 2. #120 注記行の除外: {len(skipped)}件 ===")

    base = json.load(open(BASELINE, encoding="utf-8"))
    base = drop_frozen(base)
    for b in base:
        for k in ("cap_avail_mw", "cap_operational_mw", "capacity_total_mw", "n1_capacity_mw", "units",
                  "voltage_primary_kv", "voltage_secondary_kv", "latitude", "longitude", "op_constraint",
                  "oc_target_self", "oc_target_upper", "n1_eligible"):
            b.setdefault(k, None)
        oc = b.get("oc_possibility")
        b["oc_possibility"] = (oc[0] if isinstance(oc, list) and oc else None)

    kept, removed_dup = apply_series_dedup(
        raw_rows, {b.get("external_id") for b in base}, enable_baseline_name_rule=False,
        key_id="external_id", key_name="name",
        value_keys=("voltage_primary_kv", "voltage_secondary_kv", "cap_operational_mw", "forecast_flow_mw", "capacity_total_mw", "units"),
        group_key="layer",
    )
    print(f"\n=== 3. 重複除去（#111）: {len(raw_rows)} -> {len(kept)}（除去 {len(removed_dup)}件 {summarize(removed_dup)}）===")
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(removed_dup), "rule2": "不使用（#117）",
                   "examples": [{"external_id": e.get("external_id"), "name": e.get("name")} for e in removed_dup[:5]]}

    # ── 突合: 主キー=名称＋電圧面（タイブレーク 設備容量→運用容量→台数）＋ eid クロスチェック ──
    numeq = lambda x, y: (x is None and y is None) or (x is not None and y is not None and abs(float(x) - float(y)) < 1e-6)  # noqa: E731
    bidx = {}
    for b in base:
        bidx.setdefault((clean_name(b.get("name")), vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"])), []).append(b)
    used, matched, new_rows, ambiguous, eid_mismatch = set(), [], [], [], []
    for r in kept:
        cands = [b for b in bidx.get((r["name"], vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])), []) if id(b) not in used]
        if not cands:
            new_rows.append(r)
            continue
        face = cands
        if len(face) > 1:
            for k in ("capacity_total_mw", "cap_operational_mw", "units"):
                nar = [b for b in face if numeq(b.get(k), r.get(k))]
                if len(nar) == 1:
                    face = nar
                    break
                if nar:
                    face = nar
            if len(face) > 1:
                ambiguous.append({"external_id": r["external_id"], "name": r["name"], "candidates": [b["slug"] for b in face]})
        b = face[0]
        used.add(id(b))
        matched.append((b, r))
        if NFKC(b.get("external_id")) != NFKC(r["external_id"]):
            eid_mismatch.append({"slug": b["slug"], "name": r["name"], "old_eid": b.get("external_id"), "new_eid": r["external_id"]})
    removed = [b for b in base if id(b) not in used]

    face_changed = []
    for r in list(new_rows):
        for b in list(removed):
            if (NFKC(b.get("external_id")) == NFKC(r["external_id"]) and clean_name(b.get("name")) == r["name"]
                    and numeq(b.get("capacity_total_mw"), r.get("capacity_total_mw")) and numeq(b.get("units"), r.get("units"))):
                face_changed.append({"slug": b["slug"], "external_id": b.get("external_id"), "name": r["name"],
                                     "old_voltage": vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"]),
                                     "new_voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])})
                new_rows.remove(r)
                removed.remove(b)
                break
    # 同一 No.（eid）で名称が変わった行（差し替え疑い）: 新規×消滅のうち eid が同じ組
    renamed = []
    all_new_names = {r["name"] for r in kept}
    for r in list(new_rows):
        for b in list(removed):
            if NFKC(b.get("external_id")) == NFKC(r["external_id"]):
                renamed.append({"slug": b["slug"], "external_id": r["external_id"], "old_name": clean_name(b.get("name")),
                                "new_name": r["name"], "old_name_in_new_csv": clean_name(b.get("name")) in all_new_names})
                break
    print(f"\n=== 4. 突合 === マッチ {len(matched)} / 新規 {len(new_rows)} / 消滅 {len(removed)} / 曖昧 {len(ambiguous)}"
          f" / eid食い違い {len(eid_mismatch)} / 電圧面変化 {len(face_changed)} / 同一No.名称変更 {len(renamed)}")

    # ── 座標（§0 最優先）──
    pts, icon_counts, n_points, gj_enc, gj_bytes = load_points(SRC)
    before_coords = sum(1 for b in base if b.get("latitude") is not None and b.get("longitude") is not None)
    coord_diff, coord_gain, coord_lost_in_map = [], [], []
    for b, r in matched:
        cand = pts.get(r["no"], [])
        if not cand:
            if b.get("latitude") is not None:
                coord_lost_in_map.append({"slug": b["slug"], "name": r["name"]})
            continue
        p = cand[0]
        if b.get("latitude") is None or b.get("longitude") is None:
            coord_gain.append({"slug": b["slug"], "name": r["name"], "lat": p["lat"], "lng": p["lng"]})
        elif abs(float(b["latitude"]) - p["lat"]) > 1e-6 or abs(float(b["longitude"]) - p["lng"]) > 1e-6:
            coord_diff.append({"slug": b["slug"], "name": r["name"], "old": [b["latitude"], b["longitude"]], "new": [p["lat"], p["lng"]],
                               "delta_deg": round(max(abs(float(b["latitude"]) - p["lat"]), abs(float(b["longitude"]) - p["lng"])), 6)})
    lost_by_removal = sum(1 for b in removed if b.get("latitude") is not None)
    after_coords_keep = before_coords - lost_by_removal
    block = after_coords_keep < before_coords
    R["coords"] = {"before": before_coords, "after_default_keep": after_coords_keep, "after_if_adopt_gain": after_coords_keep + len(coord_gain),
                   "lost_by_removal": lost_by_removal, "diff_count": len(coord_diff), "diffs": coord_diff,
                   "gain_candidates": coord_gain, "map_point_missing": coord_lost_in_map, "block_main_run": block,
                   "geojson": {"bytes": gj_bytes, "encoding": gj_enc, "points": n_points, "icons": icon_counts}}
    print(f"\n=== 5. 座標 === 取込前 {before_coords} / 取込後(現値保持) {after_coords_keep} / 差 {len(coord_diff)} / 新規候補 {len(coord_gain)} / 地図に無い {len(coord_lost_in_map)}")
    if block:
        R["warnings"].append("★座標保有数が減る＝本実行ブロック")

    csv_nos = {r["no"] for r in kept}
    R["missing_groups"] = {"map_icon_breakdown": icon_counts, "map_only_station_nos": len({no for no in pts if no not in csv_nos})}

    # ── フィールド差分 ──
    FIELDS = [("cap_avail_mw", "空き容量"), ("cap_operational_mw", "運用容量"), ("capacity_total_mw", "設備容量"),
              ("n1_capacity_mw", "N-1電制適用可能量"), ("units", "台数")]
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
        field_stats[label] = {"変化": chg, "新規充足": filled, "新データで欠落(現値維持)": lost}
    # 制約要因（文字）
    con_chg = [{"slug": b["slug"], "name": clean_name(b.get("name")), "from": b.get("op_constraint"), "to": r["op_constraint"]}
               for b, r in matched if r["op_constraint"] is not None and (b.get("op_constraint") or None) != r["op_constraint"]]
    con_lost = sum(1 for b, r in matched if r["op_constraint"] is None and b.get("op_constraint") is not None)
    field_stats["運用容量制約要因"] = {"変化": len(con_chg), "新規充足": sum(1 for x in con_chg if x["from"] is None), "新データで欠落(現値維持)": con_lost}
    for x in con_chg:
        changed_slugs.add(x["slug"])
    raw_hyphen = Counter(r["op_constraint_raw"] for r in kept if r["op_constraint_raw"] in HYPHENS)
    R["op_constraint_check"] = {"raw_hyphen_rows": dict(raw_hyphen), "parsed_none": sum(1 for r in kept if r["op_constraint"] is None),
                                "parsed_as_text_hyphen": sum(1 for r in kept if (r["op_constraint"] or "") in HYPHENS[1:]),
                                "baseline_none": sum(1 for b in base if b.get("op_constraint") is None),
                                "values_new": dict(Counter(r["op_constraint"] for r in kept)), "changes": con_chg}
    print(f"\n=== 7. フィールド差分 === {json.dumps(field_stats, ensure_ascii=False)}")
    print(f"  制約要因: 生の『-』{dict(raw_hyphen)} → None {R['op_constraint_check']['parsed_none']}・文字の『-』として残った {R['op_constraint_check']['parsed_as_text_hyphen']}")

    dec, inc, zeroed = [], [], []
    for b, r in matched:
        ov, nv = b.get("cap_avail_mw"), r.get("cap_avail_mw")
        if ov is None or nv is None or numeq(ov, nv):
            continue
        rec = {"slug": b["slug"], "name": clean_name(b.get("name")), "prefecture": b.get("prefecture"),
               "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]), "from": ov, "to": nv, "delta": round(nv - ov, 3)}
        (dec if nv < ov else inc).append(rec)
        if nv <= 0 < ov:
            zeroed.append(rec)
    dec.sort(key=lambda x: (x["delta"], x["slug"]))
    inc.sort(key=lambda x: (-x["delta"], x["slug"]))
    print(f"\n=== 8. 空き容量: 減少 {len(dec)}（ゼロ化 {len(zeroed)}）／増加 {len(inc)} ===")

    # ── N-1（三値）──
    n1_und = [{"operator": "中部電力パワーグリッド", "area": "中部", "slug": b["slug"], "external_id": b.get("external_id"),
               "name": clean_name(b.get("name")), "prefecture": b.get("prefecture"), "stored_n1_eligible": b.get("n1_eligible"),
               "csv_value": r["n1_raw"], "source": f"gridmap geo_data/KRSIH010-016（{vers[0] if len(vers) == 1 else vers}）"}
              for b, r in matched if r.get("n1_eligible") is None and b.get("n1_eligible") is not None]
    n1_chg = [{"slug": b["slug"], "name": clean_name(b.get("name")), "from": b.get("n1_eligible"), "to": r.get("n1_eligible"),
               "n1_capacity_from": b.get("n1_capacity_mw"), "n1_capacity_to": r.get("n1_capacity_mw")}
              for b, r in matched if r.get("n1_eligible") is not None and b.get("n1_eligible") != r.get("n1_eligible")]
    n1_new = Counter("可" if r.get("n1_eligible") is True else ("不可" if r.get("n1_eligible") is False else "未算定") for r in kept)
    n1_zero_ok = sum(1 for r in kept if r.get("n1_eligible") is True and (r.get("n1_capacity_mw") or 0) == 0)
    n1_cur = Counter("可" if b.get("n1_eligible") is True else ("不可" if b.get("n1_eligible") is False else "未算定") for b in base)
    N1_OUT.write_text(json.dumps({"count": len(n1_und), "entries": n1_und}, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"=== 9. N-1: 新 {dict(n1_new)}（0MW可 {n1_zero_ok}）／現行 {dict(n1_cur)}／可否変化 {len(n1_chg)}／未算定で潰れる {len(n1_und)} ===")

    # ── 出力制御の可能性（BX §2: 2 通りの読み）──
    oc_cur = Counter(b.get("oc_possibility") or "（空）" for b in base)
    oc_csv = Counter(r["oc_raw"] or "（空）" for r in kept)
    b_changes = [{"slug": b["slug"], "name": clean_name(b.get("name")), "from": b.get("oc_possibility"), "to": r["oc_possibility"]}
                 for b, r in matched if r["oc_possibility"] is not None and (b.get("oc_possibility") or None) != r["oc_possibility"]]
    b_hyphen_keep = [{"slug": b["slug"], "name": clean_name(b.get("name")), "stored": b.get("oc_possibility"), "csv": r["oc_raw"]}
                     for b, r in matched if r["oc_possibility"] is None]
    after_B = Counter()
    for b, r in matched:
        v = r["oc_possibility"] if r["oc_possibility"] is not None else b.get("oc_possibility")
        after_B[v or "（空）"] += 1
    # 現行の値が CSV のどの列と対応しているか（解釈A を規則で作り直せるかの確認）
    tab = Counter((r["oc_raw"] or "（空）", "対象" if r["oc_self_raw"] == "対象" else "-", b.get("oc_possibility") or "（空）",
                   "上位系の現値あり" if b.get("oc_target_upper") else "上位系の現値なし") for b, r in matched)
    self_cmp = Counter(((b.get("oc_target_self") or "-"), ("対象" if r["oc_self_raw"] == "対象" else "-")) for b, r in matched)
    upper_eq = sum(1 for b, r in matched if (b.get("oc_target_upper") or "") == (r["oc_upper_raw"] if r["oc_upper_raw"] not in HYPHENS else ""))
    # 現行の oc_target_upper が CSV の上位系の部分集合か（初期取込が一部の設備を落として持っていた形跡）
    def toks(s):
        return [x for x in re.split(r"[、,]", s or "") if x and x not in HYPHENS]
    upper_subset = sum(1 for b, r in matched if b.get("oc_target_upper") and set(toks(b["oc_target_upper"])) <= set(toks(r["oc_upper_raw"])))
    dropped_tokens = Counter()
    for b, r in matched:
        if b.get("oc_target_upper"):
            for t_ in set(toks(r["oc_upper_raw"])) - set(toks(b["oc_target_upper"])):
                dropped_tokens[t_] += 1
    R["oc"] = {
        "current": dict(oc_cur), "csv_column": dict(oc_csv),
        "A_keep": {"有り": oc_cur.get("有り", 0), "（空）": oc_cur.get("（空）", 0), "changes": 0,
                   "note": "現行維持（oc_possibility を送らない）。初期取込の規則は CSV の列から作り直せない（下の対照表）"},
        "B_csv": {"有り": after_B.get("有り", 0), "（空）": after_B.get("（空）", 0), "なし": after_B.get("なし", 0),
                  "changes": len(b_changes), "changes_by": dict(Counter(f"{x['from'] or '（空）'}→{x['to']}" for x in b_changes)),
                  "csv_hyphen_keep": b_hyphen_keep},
        "crosstab_csv_self_current_upper": {" | ".join(k): v for k, v in sorted(tab.items(), key=lambda z: -z[1])},
        "oc_target_self_current_vs_csv": {f"{a}→{c}": v for (a, c), v in self_cmp.items()},
        "oc_target_upper_equal_to_csv": upper_eq, "oc_target_upper_subset_of_csv": upper_subset,
        "oc_target_upper_tokens_missing_from_current_top": dropped_tokens.most_common(10),
    }
    print(f"=== 10. 出力制御の可能性 === 現行 {dict(oc_cur)}／CSV の列 {dict(oc_csv)}／解釈A 変化 0／解釈B 変化 {len(b_changes)} {R['oc']['B_csv']['changes_by']}")

    # ── 8/17 版 → 11/10 版の CSV の列ごとの変化（同じ No.・名称・電圧面の行どうし）──
    oidx = {(r["no"], r["name"], vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])): r for r in old_rows}
    col_chg = Counter()
    for r in kept:
        o = oidx.get((r["no"], r["name"], vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])))
        if not o:
            col_chg["（8/17 版に同じ行が無い）"] += 1
            continue
        for k in ("units", "capacity_total_mw", "cap_operational_mw", "op_constraint_raw", "forecast_flow_mw", "cap_avail_mw",
                  "n1_raw", "n1_capacity_mw", "oc_raw", "oc_self_raw", "oc_upper_raw", "remarks"):
            if o.get(k) != r.get(k):
                col_chg[k] += 1
    R["csv_change_from_8_17"] = {"old_rows": len(old_rows), "new_rows": len(kept), "by_column": dict(col_chg)}
    print(f"=== 11. 8/17 版との CSV の列の変化: {dict(col_chg)} ===")

    # ── 県別（現行は素 URL の /grid/chubu）──
    by_pref_new = Counter(r["prefecture"] or "基幹系統" for r in kept)
    by_pref_base = Counter(b.get("prefecture") or "基幹系統" for b in base)
    page = grid_page_counts(args.grid_html) if args.grid_html else {}
    total_after = len(base) + len(new_rows) - len(removed)
    pct = (total_after - len(base)) / len(base) * 100
    flow_only = sum(1 for r in kept if r.get("cap_avail_mw") is None and r.get("forecast_flow_mw") is not None)
    avail_plus_new = sum(1 for r in kept if (r.get("cap_avail_mw") or 0) > 0)

    if eid_mismatch:
        R["requires_judgement"].append(f"名称＋電圧面キーと eid の食い違い {len(eid_mismatch)}件（改番の可能性）")
    if ambiguous:
        R["requires_judgement"].append(f"タイブレーク後も曖昧 {len(ambiguous)}件")
    if face_changed:
        R["requires_judgement"].append(f"電圧面変化 {len(face_changed)}件")
    if renamed:
        blocking = [x for x in renamed if not x["old_name_in_new_csv"]]
        R["requires_judgement"].append(f"同一No.で名称変更 {len(renamed)}件（うち旧名称が新CSVに無い＝差し替え疑い {len(blocking)}件・ブロック）")
    if new_rows:
        R["requires_judgement"].append(f"新規 {len(new_rows)}件（追加は裁定事項）")
    if removed:
        R["requires_judgement"].append(f"消滅 {len(removed)}件（301/凍結の方針判断）")
    if coord_gain:
        R["requires_judgement"].append(f"座標の新規付与候補 {len(coord_gain)}件")
    if coord_diff:
        R["requires_judgement"].append(f"座標が異なる既存レコード {len(coord_diff)}件（上書きせず・GSI 逆ジオコーダでの県一致確認は本実行の前に）")
    R["requires_judgement"].append(f"出力制御の可能性の読み方（解釈A＝現行維持 有り {oc_cur.get('有り', 0)}件のまま／解釈B＝CSV 素直読み 有り {after_B.get('有り', 0)}件・変化 {len(b_changes)}件）。dry-run では既定を選ばない（EDAさんの裁定）")
    if flow_only:
        R["requires_judgement"].append(f"空容量が'-'で予想潮流のみの行 {flow_only}件（8/19 裁定4＝算出不採用・null 維持のままでよいか）")
    if abs(pct) > 10:
        R["warnings"].append(f"★総数が現行から {pct:+.1f}%（±10%超）")

    R.update({
        "join_key": {"確定": "主キー=名称＋電圧面（タイブレーク: 設備容量→運用容量→台数）。eid=chuden_{変電所No} はクロスチェック用",
                     "名称の正規化": "trim のみ。NFKC 禁止（全角括弧枝番（２）の保持）。No のみ NFKC"},
        "counts": {"baseline": len(base), "raw": len(raw_rows), "dedup": len(kept), "matched": len(matched), "new": len(new_rows),
                   "removed": len(removed), "ambiguous": len(ambiguous), "eid_mismatch": len(eid_mismatch),
                   "changed_records": len(changed_slugs), "total_after": total_after, "pct": round(pct, 2)},
        "by_pref": {"new": dict(by_pref_new), "baseline": dict(by_pref_base), "page_bare_url": page, "page_meta": args.grid_meta},
        "field_stats": field_stats,
        "cap_avail": {"decreased": len(dec), "zeroed": len(zeroed), "increased": len(inc), "top_decreases": dec[:10],
                      "zeroed_list": zeroed, "top_increases": inc[:5], "avail_plus_new": avail_plus_new},
        "avail_flow_only": flow_only,
        "n1": {"new": dict(n1_new), "current": dict(n1_cur), "zero_ok": n1_zero_ok, "changed": len(n1_chg), "changes": n1_chg,
               "undetermined": len(n1_und)},
        "voltage_face_changed": face_changed, "renamed_same_no": renamed, "ambiguous": ambiguous, "eid_mismatch_list": eid_mismatch,
        "new_records_detail": [{"external_id": r["external_id"], "name": r["name"], "layer": r["layer"],
                                "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])} for r in new_rows],
        "disappeared_records": [{"slug": b["slug"], "external_id": b.get("external_id"), "name": clean_name(b.get("name")),
                                 "voltage": vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"]), "has_coords": b.get("latitude") is not None}
                                for b in removed],
    })
    REPORT_JSON.parent.mkdir(parents=True, exist_ok=True)
    REPORT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n-> {REPORT_JSON} / {N1_OUT}（Markdown の報告は手で書く）")
    if args.emit_plan:
        raw_base = json.load(open(BASELINE, encoding="utf-8"))  # 正規化前の GET のまま（before と id に使う）
        emit_plan(args.plan_out, raw_base, matched, new_rows, removed, ambiguous, eid_mismatch, face_changed, renamed,
                  coord_diff, coord_gain, coord_lost_in_map, args.fetched_on, strict=not args.no_expect)
    print("[dry-run] 完了（microCMS 書込なし）")


# =============================================================================
# --emit-plan（BX 本実行・2026-11-17）: 本実行の計画（microCMS には書かない）
# 裁定（02_計画・運営/検証記録_BX中部・BY中国dry-run_確かめと裁定の案_2026-11-15_ユウ.md の BX 1〜4・EDAさん 11/16 10:03「任せます」）:
#   1. 出力制御の 3 欄は公表の CSV の列のとおり。
#      oc_possibility ←「平常時出力制御の可能性」（'-' は空＝現値の空のまま）／oc_target_self ←「(当該設備)」（'-' は空）／
#      oc_target_upper ←「(上位系設備)」（trim だけ・区切りの「、」も CSV のまま・'-' は空）。
#      「有り」→空・「対象」→空 が 1 件でも出たら計画を作らない。
#   2. 座標は cb-5168 御代田だけ新しい公表値に（GSI 逆ジオコーダの県一致は別に確かめる・旧値は coordinate_history.json）。
#   3. 空容量が '-' の 193 件は算出しない（null のまま・8/19 裁定 4）。
#   4. 全 1,107 件を PATCH（last_updated を 2026-11-10 にそろえる・#121）。
#   予想潮流と備考（notes）は書かない（8/19 と同じ）。
# 11/15 の dry run の件数（マッチ 1,107・新規 0・消滅 0・値の変化 457 ほか）と合わなければ計画を作らない。
# =============================================================================
NEW_VERSION = "2026-11-10"
COORD_ADOPT = {"cb-5168": (36.311849, 138.494028)}   # 裁定 2（御代田・長野県）
EXPECT = {"matched": 1107, "value_changed": 457, "cap_avail_mw": 425, "cap_operational_mw": 87, "capacity_total_mw": 17,
          "n1_capacity_mw": 20, "units": 7, "op_constraint": 1, "n1_eligible": 0,
          "oc_possibility": 375, "oc_target_self": 18, "coords": 1, "n1_ok_after": 148}
META = {"id", "createdAt", "updatedAt", "publishedAt", "revisedAt"}
NUMF = ["units", "capacity_total_mw", "cap_operational_mw", "cap_avail_mw", "n1_capacity_mw"]


def _blank(v):
    return v is None or v == "" or v == [] or (isinstance(v, str) and v.strip() in HYPHENS)


def emit_plan(plan_out, raw_base, matched, new_rows, removed, ambiguous, eid_mismatch, face_changed, renamed,
              coord_diff, coord_gain, coord_lost_in_map, fetched_on, strict=True):
    errs = []
    if len(matched) != EXPECT["matched"] or new_rows or removed or ambiguous or eid_mismatch or face_changed or renamed:
        errs.append(f"突合が dry run と違う: マッチ {len(matched)}・新規 {len(new_rows)}・消滅 {len(removed)}・曖昧 {len(ambiguous)}"
                    f"・eid 食い違い {len(eid_mismatch)}・電圧面 {len(face_changed)}・名称 {len(renamed)}")
    got_coord = {x["slug"]: tuple(x["new"]) for x in coord_diff}
    if got_coord != COORD_ADOPT or coord_gain or coord_lost_in_map:
        errs.append(f"座標が dry run と違う: 差 {got_coord}・新規 {len(coord_gain)}・地図に無い {len(coord_lost_in_map)}")
    iso = lambda d: f"{d}T00:00:00.000Z"  # noqa: E731
    raw = {b["slug"]: b for b in raw_base}
    updates, cnt, oc_hyphen_keep, upper_trans = [], Counter(), [], Counter()
    for b, r in matched:
        rb = raw[b["slug"]]
        patch, changed = {}, []
        for k in NUMF:
            ov, nv = b.get(k), r.get(k)
            if nv is None:
                continue   # 裁定 3: 空容量 '-' は null のまま（送らない）。ほかの欄の欠落も現値維持
            if ov is None or abs(float(ov) - float(nv)) > 1e-6:
                patch[k] = nv
                changed.append(k)
        if r.get("op_constraint") is None:
            if b.get("op_constraint") is not None:
                errs.append(f"{b['slug']}: 制約要因が CSV で '-' なのに現値 {b.get('op_constraint')!r}")
        elif (b.get("op_constraint") or "") != r["op_constraint"]:
            patch["op_constraint"] = r["op_constraint"]
            changed.append("op_constraint")
        if r.get("n1_eligible") is None:
            if b.get("n1_eligible") is not None:
                errs.append(f"{b['slug']}: N-1 が CSV で未算定（boolean を潰さない・dry run では 0）")
        elif bool(b.get("n1_eligible")) != r["n1_eligible"]:
            patch["n1_eligible"] = r["n1_eligible"]
            changed.append("n1_eligible")
        # ── 出力制御の 3 欄（裁定 1・公表のとおり）──
        if r["oc_raw"] not in ("有り",) and r["oc_raw"] not in HYPHENS:
            errs.append(f"{b['slug']}: 出力制御の可能性が想定外の値 {r['oc_raw']!r}")
        oc_new = "有り" if r["oc_raw"] == "有り" else None
        oc_cur = b.get("oc_possibility")
        if oc_new is None:
            oc_hyphen_keep.append(b["slug"])
            if oc_cur is not None:
                errs.append(f"{b['slug']}: 出力制御の可能性 {oc_cur}→空（止める）")
        elif oc_cur != oc_new:
            patch["oc_possibility"] = [oc_new]
            changed.append("oc_possibility")
        if r["oc_self_raw"] not in ("対象",) and r["oc_self_raw"] not in HYPHENS:
            errs.append(f"{b['slug']}: 当該設備が想定外の値 {r['oc_self_raw']!r}")
        self_new = "対象" if r["oc_self_raw"] == "対象" else None
        self_cur = None if _blank(rb.get("oc_target_self")) else rb.get("oc_target_self")
        if self_cur is not None and self_new is None:
            errs.append(f"{b['slug']}: 当該設備 対象→空（止める）")
        elif self_cur != self_new:
            patch["oc_target_self"] = self_new
            changed.append("oc_target_self")
        upper_new = None if r["oc_upper_csv"] in HYPHENS else r["oc_upper_csv"]
        upper_cur = None if _blank(rb.get("oc_target_upper")) else rb.get("oc_target_upper")
        if upper_cur != upper_new:
            patch["oc_target_upper"] = upper_new
            changed.append("oc_target_upper")
            upper_trans["空→値" if upper_cur is None else ("値→空" if upper_new is None else "値→別の値")] += 1
        if b["slug"] in COORD_ADOPT:
            patch["latitude"], patch["longitude"] = COORD_ADOPT[b["slug"]]
            changed.append("coords")
        patch["last_updated"] = iso(NEW_VERSION)
        patch["fetched_at"] = iso(fetched_on)
        for c in changed:
            cnt[c] += 1
        updates.append({"slug": b["slug"], "id": rb["id"], "patch": patch, "changed": changed,
                        "before": {k: v for k, v in rb.items() if k not in META}})
    value_changed = sum(1 for u in updates if set(u["changed"]) & set(NUMF + ["op_constraint", "n1_eligible"]))
    n1_ok = sum(1 for u in updates if (u["patch"]["n1_eligible"] if "n1_eligible" in u["patch"] else u["before"].get("n1_eligible")) is True)
    got = {"value_changed": value_changed, "n1_ok_after": n1_ok, "coords": cnt["coords"],
           **{k: cnt[k] for k in NUMF + ["op_constraint", "n1_eligible", "oc_possibility", "oc_target_self"]}}
    for k, v in got.items():
        if EXPECT[k] != v:
            errs.append(f"{k}: 計画 {v} ≠ dry run {EXPECT[k]}")
    if errs and strict:
        raise SystemExit("想定の外のため計画を作らない:\n  " + "\n  ".join(errs[:30]))
    if errs:
        print("\n=== emit-plan（--no-expect）: 想定の外（止めずに一覧） ===\n  " + "\n  ".join(errs[:60]))
    plan = {"generated": str(date.today()), "area": "中部", "prefix": "cb-", "endpoint": "substations",
            "version": NEW_VERSION, "fetched_on": fetched_on,
            "ruling": "02_計画・運営/検証記録_BX中部・BY中国dry-run_確かめと裁定の案_2026-11-15_ユウ.md（BX 1〜4・EDAさん 11/16 10:03）",
            "expected": {"updates": len(updates), "creates": 0, "n1_ok_after": n1_ok, "value_changed": value_changed,
                         "date_only": sum(1 for u in updates if not u["changed"]), "by_field": dict(cnt),
                         "oc_target_upper_transitions": dict(upper_trans)},
            "oc_hyphen_kept_blank": oc_hyphen_keep,
            "coord_adopt": [{"slug": s, "lat": v[0], "lng": v[1]} for s, v in COORD_ADOPT.items()],
            "coord_history": coord_diff,
            "not_expected": errs, "strict": strict,
            "updates": updates, "creates": []}
    Path(plan_out).write_text(json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n=== emit-plan: PATCH {len(updates)}（値 {value_changed}・日付だけ {plan['expected']['date_only']}）・N-1 可 {n1_ok}")
    print(f"  列ごとの変化 {dict(cnt)}")
    print(f"  上位系設備の変化 {dict(upper_trans)}・出力制御 '-' で空のまま {oc_hyphen_keep}")
    print(f"  -> {plan_out}")


if __name__ == "__main__":
    main()
