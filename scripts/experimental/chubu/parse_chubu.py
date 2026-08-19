# -*- coding: utf-8 -*-
"""
scripts/experimental/chubu/parse_chubu.py

中部電力パワーグリッド gridmap 予想潮流等 最新版（2026-08-17更新）の dry-run 差分レポート。
★microCMS への書込は一切行わない（baseline は fetch_baseline.py が GET 済みのローカルJSON）。

使い方:
  python scripts/experimental/chubu/parse_chubu.py --dry-run

── 実データで確定させた設計（BQ依頼書・推測しない）──
[取得元] エンドポイントは総当たりせず、マップの公式マニフェスト
  https://gridmap.powergrid.chuden.co.jp/pass_data/pass.json で全数を確定
  （KRCA503G.html のインラインJSが $.ajax で読む。JSバンドル解析より確実）。
  - KRSIH001: 地図GeoJSON（gzip・Point 2,505 ＋ LineString 4,128。座標源）
  - KRSIH002: パラメータ（taishobi=版日付）
  - KRSIH010..016: 一覧表ZIP（各ZIP内に 送電線CSV＋変電所CSV。010はフェンスCSVも）
  送電線・フェンスの members は対象外（丸ごと読まない）。初期取込(2026/5/7)の
  baseline source_url も KRSIH010..016 で、この7レイヤ構成と一致する。

[encoding] 決め打ちしない。KRSIH001=gzip(utf-8-sig, 末尾に &&タイムスタンプ のトレーラ)、
  KRSIH010..016=ZIP(member CSV は cp932)、pass.json/KRSIH002=utf-8-sig。すべて実測。

[版] 全7レイヤの変電所CSV 行0「2026年8月17日更新」＝KRSIH002 taishobi「2026年08月17日時点」。
  レイヤ割れなし → last_updated は一律（#121: レコード単位に正しく入れる）。

[突合キー] external_id = chuden_{変電所No}。
  実測: No.はレイヤ跨ぎで一意（重複0）、eid＋名称の一致は 1,107/1,107（100%）。
  北海道型の一括シフトなし。名称＋電圧面を主キー、容量・台数はタイブレーク（#114/#115）に
  した上で、eid とのクロスチェックで改番を検出する（両キーが食い違えば要判断）。

[名称] 全角括弧付き枝番（中川変電所（２）等）を保持するため、名称は trim のみ。
  NFKC を掛けない（（２）→(2) になり別バンク同一視・突合破壊の危険）。No.のみ NFKC。

[座標] §0 最優先。座標は突合キーに使わない・比較のみ。
  KRSIH001 の Point（変電所番号→[lng,lat]）と baseline の lat/lng を突合し、
  差分は「報告のみ」（上書き計画に載せない）。座標保有数 取込前/取込後を必ず出す。

[#120] 受理条件はホワイトリスト: 変電所CSV member（ヘッダが「変電所 No」）かつ No が数値の行のみ。
[#117] series_dedup ルール②不使用。①も電圧面込みの複合判定（関西 北大阪AB/BB の教訓）。
"""
import argparse, csv, gzip, io, json, re, sys, unicodedata, zipfile
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402
from frozen import drop_frozen  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "src"
BASELINE = HERE / "baseline_live.json"
BASE_URL = "https://gridmap.powergrid.chuden.co.jp"
REPORT_MD = Path("reports/grid-chubu-dryrun-2026-08-19.md")
REPORT_JSON = Path("reports/grid-chubu-dryrun-2026-08-19.json")
N1_OUT = HERE.parent / "_common" / "n1_undetermined_chubu.json"

# レイヤ → 県（初期取込と同一。011=愛知西部(名古屋)・016=愛知東部(岡崎)）
LAYERS = {
    "KRSIH010": None,      # 500/275kV（基幹。prefecture なし → facility_class「基幹系統」導出）
    "KRSIH011": "愛知県",
    "KRSIH012": "静岡県",
    "KRSIH013": "三重県",
    "KRSIH014": "岐阜県",
    "KRSIH015": "長野県",
    "KRSIH016": "愛知県",
}

NFKC = lambda s: unicodedata.normalize("NFKC", (s or "")).strip()  # noqa: E731
clean_name = lambda s: (s or "").strip()  # noqa: E731  # ★名称はNFKC禁止（全角括弧枝番の保持）


def to_float(v):
    s = NFKC(v)
    return float(s) if re.fullmatch(r"-?\d+(\.\d+)?", s) else None


def to_int(v):
    f = to_float(v)
    return int(f) if f is not None else None


def parse_n1(v):
    s = NFKC(v)
    if not s or s in ("-", "ー", "―"):
        return None
    if s.startswith("不可"):
        return False
    if s.startswith("可"):
        return True
    return None


def parse_oc(v):
    s = NFKC(v)
    if not s or s in ("-", "ー", "―"):
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
    for enc in ("utf-8-sig", "cp932", "utf-8"):
        try:
            return raw.decode(enc, errors="strict"), enc
        except UnicodeDecodeError:
            continue
    return None, None


def strip_trailer(s: str) -> str:
    """geo_data レスポンス末尾の「&&YYYYMMDDhhmmss」トレーラを除く"""
    i = s.rfind("&&")
    if i >= 0 and i > len(s) - 40:
        return s[:i]
    return s


def load_layers():
    files, rows, skipped = [], [], []
    for k, pref in LAYERS.items():
        raw = (SRC / k).read_bytes()
        zf = zipfile.ZipFile(io.BytesIO(raw))
        subst = None
        member_kinds = []
        for n in zf.namelist():
            t, enc = decode_strict(zf.read(n))
            rs = list(csv.reader(io.StringIO(t)))
            head = rs[1][0] if len(rs) > 1 and rs[1] else ""
            if head.startswith("変電所"):
                subst = (rs, enc)
                member_kinds.append("変電所")
            elif head.startswith("送電線"):
                member_kinds.append("送電線(対象外)")
            else:
                member_kinds.append(f"その他(対象外): {head[:12]}")
        if subst is None:
            raise SystemExit(f"{k}: 変電所CSVが見つからない（スキーマ変化の可能性）")
        rs, enc = subst
        version = NFKC(rs[0][0]) if rs and rs[0] else None
        cnt = 0
        for r in rs[2:]:
            if not r or len(r) < 16:
                continue
            no = NFKC(r[0])
            if not no:
                continue
            # #120 ホワイトリスト: 変電所No は数値のみ
            if not re.fullmatch(r"\d+", no):
                skipped.append({"layer": k, "no": no[:50], "name": clean_name(r[1]),
                                "reason": "No.欄が数値でない（注記行）"})
                continue
            rows.append({
                "layer": k, "no": no, "external_id": f"chuden_{no}",
                "prefecture": pref,
                "name": clean_name(r[1]),
                "voltage_primary_kv": to_float(r[2]),
                "voltage_secondary_kv": to_float(r[3]),
                "units": to_int(r[4]),
                "capacity_total_mw": to_float(r[5]),
                "cap_operational_mw": to_float(r[6]),
                "op_constraint": (lambda v: None if v in ("", "-", "ー", "―") else v)(NFKC(r[7])),
                "forecast_flow_mw": to_float(r[8]),
                "cap_avail_mw": to_float(r[9]),          # 直読のみ（算出は要判断・§7-9参照）
                "n1_eligible": parse_n1(r[10]),
                "n1_capacity_mw": to_float(r[11]),
                "oc_possibility": parse_oc(r[12]),
                "src_version": version,
            })
            cnt += 1
        files.append({"layer": k, "url": f"{BASE_URL}/geo_data/{k}", "bytes": len(raw),
                      "container": "ZIP", "csv_encoding": enc, "version_row": version,
                      "members": member_kinds, "data_rows": cnt, "prefecture": pref or "（基幹）"})
    return files, rows, skipped


def load_points():
    raw = (SRC / "KRSIH001").read_bytes()
    t = gzip.decompress(raw)
    s, enc = decode_strict(t)
    gj = json.loads(strip_trailer(s))
    pts = {}
    icon_counts = {}
    for f in gj["features"]:
        if f["geometry"]["type"] != "Point":
            continue
        icon = (f["properties"].get("_iconUrl") or "?").split("/")[-1]
        icon_counts[icon] = icon_counts.get(icon, 0) + 1
        no = NFKC(f["properties"].get("変電所番号") or "")
        if no:
            lng, lat = f["geometry"]["coordinates"]
            pts.setdefault(no, []).append({
                "lat": lat, "lng": lng, "icon": icon,
                "name": clean_name(f["properties"].get("設備名称")),
            })
    n_points = sum(icon_counts.values())
    return pts, icon_counts, n_points, enc


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--emit-plan", action="store_true")
    args = ap.parse_args()

    R = {"generated_on": str(date.today()), "area": "中部", "operator": "中部電力パワーグリッド",
         "scope": "dry-run（差分レポートのみ・microCMS 書込ゼロ）",
         "endpoint_discovery": "pass_data/pass.json（マップ公式マニフェスト・KRCA503G.html のインラインJSが参照）"
                               "から全16エンドポイントを確定。総当たり・JSバンドル推測なし。"
                               "初期取込(2026/5/7)の baseline source_url とも一致（KRSIH010..016）",
         "files": [], "warnings": [], "requires_judgement": []}

    print("=== 1. 取得レイヤ・encoding 実測 ===")
    files, raw_rows, skipped = load_layers()
    R["files"] = files
    for f in files:
        print(f"  {f['layer']} {f['container']}/{f['csv_encoding']:9s} {f['bytes']:7d}B "
              f"版={f['version_row']} 変電所{f['data_rows']:4d}行 {f['prefecture']}  members={f['members']}")
    print(f"  生データ行 合計 {len(raw_rows)}件")
    p2raw = (SRC / "KRSIH002").read_bytes()
    p2, _ = decode_strict(p2raw)
    m = re.search(r'"taishobi"\s*:\s*"([^"]+)"', p2)
    taishobi = m.group(1) if m else "?"
    print(f"  KRSIH002 taishobi: {taishobi}")
    vers = {f["version_row"] for f in files}
    R["version"] = {"当方(現行)": "2026-04-27", "新": sorted(vers), "taishobi": taishobi,
                    "レイヤ割れ": len(vers) > 1}

    print(f"\n=== 2. #120 注記行の除外: {len(skipped)}件 ===")
    for s_ in skipped:
        print(f"    - [{s_['layer']}] 『{s_['no']}』← {s_['reason']}")
    R["excluded_note_rows"] = {"count": len(skipped), "rows": skipped,
                               "note": "送電線CSV・フェンスCSVは member ごと対象外（行単位の除外とは別勘定）"}

    # ── dedupe（#111: 電圧面込み複合判定・#117: ルール②不使用）──
    base = json.load(open(BASELINE, encoding="utf-8"))
    base = drop_frozen(base)
    for b in base:
        for k in ("cap_avail_mw", "cap_operational_mw", "capacity_total_mw", "n1_capacity_mw",
                  "units", "voltage_primary_kv", "voltage_secondary_kv", "latitude", "longitude"):
            b.setdefault(k, None)
        oc = b.get("oc_possibility")
        b["oc_possibility"] = (oc[0] if isinstance(oc, list) and oc else None)

    kept, removed_dup = apply_series_dedup(
        raw_rows, {b.get("external_id") for b in base},
        enable_baseline_name_rule=False,
        key_id="external_id", key_name="name",
        value_keys=("voltage_primary_kv", "voltage_secondary_kv",
                    "cap_operational_mw", "forecast_flow_mw", "capacity_total_mw", "units"),
        group_key="layer",
    )
    print(f"\n=== 3. 重複除去（#111）: {len(raw_rows)} -> {len(kept)}（除去 {len(removed_dup)}件 {summarize(removed_dup)}）===")
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(removed_dup),
                   "rule2": "不使用（#117）",
                   "examples": [{"external_id": e.get("external_id"), "name": e.get("name")}
                                for e in removed_dup[:5]]}

    # ── 突合: 主キー=名称＋電圧面（タイブレーク 設備容量→運用容量→台数）＋ eid クロスチェック ──
    print("\n=== 4. 突合（主キー: 名称＋電圧面／eidクロスチェック）===")
    numeq = lambda x, y: (x is None and y is None) or (  # noqa: E731
        x is not None and y is not None and abs(float(x) - float(y)) < 1e-6)
    bidx = {}
    for b in base:
        bidx.setdefault((clean_name(b.get("name")), vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"])), []).append(b)
    used, matched, new_rows, ambiguous, eid_mismatch = set(), [], [], [], []
    for r in kept:
        cands = [b for b in bidx.get((r["name"], vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])), [])
                 if id(b) not in used]
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
                ambiguous.append({"external_id": r["external_id"], "name": r["name"],
                                  "candidates": [b["slug"] for b in face]})
        b = face[0]
        used.add(id(b))
        matched.append((b, r))
        if NFKC(b.get("external_id")) != NFKC(r["external_id"]):
            eid_mismatch.append({"slug": b["slug"], "name": r["name"],
                                 "old_eid": b.get("external_id"), "new_eid": r["external_id"]})
    removed = [b for b in base if id(b) not in used]

    # ── 電圧面変化（関西 篠山型）: 新規×消滅で eid＋名称（＋設備容量・台数）が一致する組 ──
    # 主キーが名称＋電圧面のため、電圧面が変わると新規×消滅に割れる。機械的な上書きは
    # 別バンクへの書込リスクがあるため独立カテゴリで報告（本実行の裁定事項）。
    face_changed = []
    for r in list(new_rows):
        for b in list(removed):
            if (NFKC(b.get("external_id")) == NFKC(r["external_id"])
                    and clean_name(b.get("name")) == r["name"]
                    and numeq(b.get("capacity_total_mw"), r.get("capacity_total_mw"))
                    and numeq(b.get("units"), r.get("units"))):
                face_changed.append({
                    "slug": b["slug"], "external_id": b.get("external_id"), "name": r["name"],
                    "old_voltage": vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"]),
                    "new_voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])})
                new_rows.remove(r)
                removed.remove(b)
                break
    print(f"  マッチ {len(matched)} / 新規 {len(new_rows)} / 消滅 {len(removed)} / 曖昧 {len(ambiguous)}"
          f" / eid食い違い {len(eid_mismatch)} / 電圧面変化 {len(face_changed)}")
    for x in face_changed:
        print(f"    ★電圧面変化: {x['slug']} 「{x['name']}」 {x['old_voltage']} -> {x['new_voltage']}kV"
              f"（旧電圧面の行は新データに存在しない＝同一設備の記載変更と推定・要判断）")
    for x in eid_mismatch[:8]:
        print(f"    ★改番? {x['slug']} 「{x['name']}」 {x['old_eid']} -> {x['new_eid']}")

    # ── 座標（§0 最優先）──
    print("\n=== 5. 座標の保全チェック（§0）===")
    pts, icon_counts, n_points, gj_enc = load_points()
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
            coord_diff.append({"slug": b["slug"], "name": r["name"],
                               "old": [b["latitude"], b["longitude"]], "new": [p["lat"], p["lng"]],
                               "delta_deg": round(max(abs(float(b["latitude"]) - p["lat"]),
                                                      abs(float(b["longitude"]) - p["lng"])), 6)})
    # 方針: 既存座標は保持（変わっていても上書きしない）。取込後の保有数 = 取込前 + 新規付与(裁定後)
    after_coords_keep = before_coords          # 本実行の既定（現値保持のみ）
    after_coords_if_gain = before_coords + len(coord_gain)
    print(f"  座標保有: 取込前 {before_coords} / 取込後(既定=現値保持) {after_coords_keep}"
          f" / 新規付与を採用した場合 {after_coords_if_gain}")
    print(f"  座標が異なる既存レコード: {len(coord_diff)}件（上書きしない・一覧報告）")
    for x in coord_diff[:8]:
        print(f"    {x['slug']} {x['name']} {x['old']} -> {x['new']} (Δ{x['delta_deg']}°)")
    print(f"  座標の新規付与候補（現行null・地図に座標あり）: {len(coord_gain)}件")
    for x in coord_gain[:5]:
        print(f"    {x['slug']} {x['name']} ({x['lat']}, {x['lng']})")
    print(f"  現行座標ありだが地図Pointが無い: {len(coord_lost_in_map)}件（現値維持・座標は失わない）")
    block = after_coords_keep < before_coords
    R["coords"] = {"before": before_coords, "after_default_keep": after_coords_keep,
                   "after_if_adopt_gain": after_coords_if_gain,
                   "diff_count": len(coord_diff), "diffs": coord_diff,
                   "gain_candidates": coord_gain, "map_point_missing": coord_lost_in_map,
                   "block_main_run": block}
    if block:
        R["warnings"].append("★座標保有数が減る＝本実行ブロック")

    # ── §5 当方に無い設備群 ──
    print("\n=== 6. 当方に無い設備群（§5・基幹欠け確認）===")
    csv_nos = {r["no"] for r in kept}
    pt_only = {no for no in pts if no not in csv_nos}
    print(f"  地図Point 総数 {n_points}（icon別 {icon_counts}）")
    print(f"  変電所CSVの全 {len(csv_nos)}件は当方収録と1:1（新規0・消滅0なら欠けなし）")
    print(f"  地図にあってCSVに無い変電所番号: {len(pt_only)}件")
    R["missing_groups"] = {
        "conclusion": "北海道・関西型の『丸ごと欠け』なし。変電所CSV 7レイヤ計1,107件は当方収録と完全一致。"
                      "地図には他に 発電所340・他社変電所1,063・開閉所20 等のマーカーがあるが、"
                      "いずれも空容量CSVに値を持たない別種設備（変圧器空き容量の対象外）",
        "map_icon_breakdown": icon_counts, "map_only_nos": sorted(pt_only)}

    # ── フィールド差分 ──
    print("\n=== 7. フィールド差分 ===")
    FIELDS = [("cap_avail_mw", "空き容量"), ("cap_operational_mw", "運用容量"),
              ("capacity_total_mw", "設備容量"), ("n1_capacity_mw", "N-1電制適用可能量"),
              ("units", "台数")]
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
        print(f"  {label:16s} 変化{chg:5d} 新規充足{filled:5d} 欠落(現値維持){lost:5d}")

    dec, inc, zeroed = [], [], []
    for b, r in matched:
        ov, nv = b.get("cap_avail_mw"), r.get("cap_avail_mw")
        if ov is None or nv is None or numeq(ov, nv):
            continue
        rec = {"slug": b["slug"], "name": clean_name(b.get("name")),
               "prefecture": b.get("prefecture"),
               "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
               "from": ov, "to": nv, "delta": round(nv - ov, 3)}
        (dec if nv < ov else inc).append(rec)
        if nv <= 0 < ov:
            zeroed.append(rec)
    dec.sort(key=lambda x: x["delta"])
    inc.sort(key=lambda x: -x["delta"])
    print(f"\n=== 8. 空き容量: 減少 {len(dec)}件（うちゼロ化 {len(zeroed)}）／増加 {len(inc)}件 ===")
    for x in dec[:10]:
        print(f"    down {x['name']}（{x['prefecture'] or '基幹'}・{x['voltage']}）{x['from']} -> {x['to']} MW")

    # ── N-1・出力制御 ──
    n1_und = [{"operator": "中部電力パワーグリッド", "area": "中部", "slug": b["slug"],
               "external_id": b.get("external_id"), "name": clean_name(b.get("name")),
               "prefecture": b.get("prefecture"), "stored_n1_eligible": b.get("n1_eligible"),
               "source": "gridmap geo_data/KRSIH010-016（2026-08-17更新）"}
              for b, r in matched if r.get("n1_eligible") is None and b.get("n1_eligible") is not None]
    oc_und = sum(1 for b, r in matched if r.get("oc_possibility") is None and b.get("oc_possibility") is not None)
    n1_chg = [{"slug": b["slug"], "name": clean_name(b.get("name")),
               "from": b.get("n1_eligible"), "to": r.get("n1_eligible")}
              for b, r in matched
              if r.get("n1_eligible") is not None and b.get("n1_eligible") != r.get("n1_eligible")]
    n1_ok_new = sum(1 for r in kept if r.get("n1_eligible") is True)
    n1_zero_ok = sum(1 for r in kept if r.get("n1_eligible") is True and (r.get("n1_capacity_mw") or 0) == 0)
    print(f"=== 9. N-1: 新データ可 {n1_ok_new}件（うち0MW可 {n1_zero_ok}）／可否変化 {len(n1_chg)}件 "
          f"／未算定(現値維持) {len(n1_und)}件 ／出力制御未算定 {oc_und}件 ===")
    for x in n1_chg[:10]:
        print(f"    {x['slug']} {x['name']}: {x['from']} -> {x['to']}")
    N1_OUT.write_text(json.dumps({"count": len(n1_und), "entries": n1_und}, ensure_ascii=False, indent=1),
                      encoding="utf-8")

    # ── 県別 ──
    by_pref_new = {}
    for r in kept:
        p = r["prefecture"] or "基幹系統"
        by_pref_new[p] = by_pref_new.get(p, 0) + 1
    total_after = len(base) + len(new_rows) - len(removed)
    pct = (total_after - len(base)) / len(base) * 100
    print(f"\n=== 10. 県別: {by_pref_new} 合計{len(kept)} 取込後想定 {total_after}（{pct:+.1f}%）===")

    # ── 空容量が新データに無い行（現行値あり）の扱い ＝ 要判断提案 ──
    flow_only = sum(1 for r in kept if r.get("cap_avail_mw") is None and r.get("forecast_flow_mw") is not None)
    R["avail_calculation"] = {
        "直読": sum(1 for r in kept if r.get("cap_avail_mw") is not None),
        "予想潮流のみ（空容量'-'）": flow_only,
        "初期取込の扱い": "直読のみ（算出せず null）。基幹9件は現行も null",
        "提案（要判断）": "関西では公表PDFの留意事項に基づき 運用容量−|予想潮流| で算出した。"
                          "中部も同型の排他パターン（両方あり0件）だが、公表側の算出式の記載を確認できるまで"
                          "本 dry-run では直読のみとし、算出採用は本実行の裁定事項とする",
    }

    if eid_mismatch:
        R["requires_judgement"].append(f"名称＋電圧面キーとeidの食い違い {len(eid_mismatch)}件（改番の可能性）")
    if ambiguous:
        R["requires_judgement"].append(f"タイブレーク後も曖昧 {len(ambiguous)}件")
    if face_changed:
        R["requires_judgement"].append(
            f"電圧面変化 {len(face_changed)}件（旧電圧面の行は新データに不在＝同一設備の記載変更と推定。"
            "slug維持で電圧面・電圧階級を更新するか裁定）")
    if new_rows:
        R["requires_judgement"].append(f"新規 {len(new_rows)}件（追加は裁定事項）")
    if removed:
        R["requires_judgement"].append(f"消滅 {len(removed)}件（301/凍結の方針判断）")
    if coord_gain:
        R["requires_judgement"].append(f"座標の新規付与候補 {len(coord_gain)}件（採用は裁定事項）")
    if coord_diff:
        R["requires_judgement"].append(f"座標が異なる既存レコード {len(coord_diff)}件（上書きせず・公表側修正か要確認）")
    if flow_only:
        R["requires_judgement"].append(
            f"空容量が'-'で予想潮流のみの行 {flow_only}件 → 運用容量−|予想潮流| で算出するか（関西前例・裁定事項）")
    if abs(pct) > 10:
        R["warnings"].append(f"★総数が現行から {pct:+.1f}%（±10%超）")

    R.update({
        "join_key": {
            "確定": "主キー=名称＋電圧面（タイブレーク: 設備容量→運用容量→台数）。eid=chuden_{変電所No} は"
                    "クロスチェック用（実測で1,107/1,107一致・一括シフトなし・単独キーにしない）",
            "名称の正規化": "trim のみ。NFKC 禁止（全角括弧枝番（２）の保持）。No のみ NFKC",
        },
        "counts": {"baseline": len(base), "raw": len(raw_rows), "dedup": len(kept),
                   "matched": len(matched), "new": len(new_rows), "removed": len(removed),
                   "ambiguous": len(ambiguous), "eid_mismatch": len(eid_mismatch),
                   "changed_records": len(changed_slugs), "total_after": total_after,
                   "pct": round(pct, 2)},
        "by_pref_new": by_pref_new,
        "field_stats": field_stats,
        "cap_avail": {"decreased": len(dec), "zeroed": len(zeroed), "increased": len(inc),
                      "top_decreases": dec[:10], "top_increases": inc[:5]},
        "n1": {"ok_new": n1_ok_new, "zero_ok": n1_zero_ok, "changed": len(n1_chg),
               "changes": n1_chg, "undetermined": len(n1_und)},
        "oc_undetermined": oc_und,
        "voltage_face_changed": face_changed,
        "new_records_detail": [{"external_id": r["external_id"], "name": r["name"],
                                "layer": r["layer"]} for r in new_rows],
        "disappeared_records": [{"slug": b["slug"], "external_id": b.get("external_id"),
                                 "name": clean_name(b.get("name"))} for b in removed],
    })

    REPORT_JSON.parent.mkdir(parents=True, exist_ok=True)
    REPORT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")

    # ── Markdown ──
    L = []
    A = L.append
    A(f"# 中部電力パワーグリッド gridmap 取込 dry-run（{R['generated_on']}）\n")
    A("**microCMS への書込はゼロ**（baseline は GET のみ）。本実行は未実施。\n")
    A("## 1. エンドポイントの特定方法\n")
    A(f"{R['endpoint_discovery']}\n")
    A("| レイヤ | 内容 | 形式 | バイト数 | encoding | 版 | 変電所行 |")
    A("|---|---|---|---:|---|---|---:|")
    for f in files:
        A(f"| {f['layer']} | {f['prefecture']} | ZIP/CSV | {f['bytes']:,} | {f['csv_encoding']} | {f['version_row']} | {f['data_rows']} |")
    A(f"| KRSIH001 | 地図GeoJSON（座標源） | gzip/GeoJSON | {(SRC / 'KRSIH001').stat().st_size:,} | {gj_enc} | — | Point {n_points} |")
    A(f"| KRSIH002 | パラメータ | JSON | {(SRC / 'KRSIH002').stat().st_size:,} | utf-8-sig | {taishobi} | — |")
    A("\n※ 各ZIP内の送電線CSV（010はフェンスCSVも）は member ごと対象外。\n")
    A("## 2. 版\n")
    A(f"当方 **2026/4/27** → 新 **2026/8/17**（全7レイヤ＋地図パラメータ taishobi が同一・**レイヤ割れなし**）\n")
    A("## 3. 座標の保全（§0 最優先）\n")
    A(f"| 指標 | 値 |\n|---|---:|")
    A(f"| 座標保有 取込前 | **{R['coords']['before']}** |")
    A(f"| 座標保有 取込後（既定＝既存座標は一切触らない） | **{R['coords']['after_default_keep']}** |")
    A(f"| 〃（新規付与 {len(coord_gain)}件を裁定で採用した場合） | {R['coords']['after_if_adopt_gain']} |")
    A(f"| 座標が異なる既存レコード（上書きしない・下表） | {len(coord_diff)} |")
    A(f"| 現行座標ありだが地図にPointなし（現値維持） | {len(coord_lost_in_map)} |")
    A(f"\n**判定: 座標保有数は減らない → 本実行ブロックなし**\n" if not R["coords"]["block_main_run"]
      else "\n**★判定: 座標保有数が減る → 本実行ブロック**\n")
    if coord_diff:
        A("| slug | 名称 | 現行(lat,lng) | 新(lat,lng) | 最大差(°) |")
        A("|---|---|---|---|---|")
        for x in coord_diff:
            A(f"| {x['slug']} | {x['name']} | {x['old']} | {x['new']} | {x['delta_deg']} |")
        A("")
    if coord_gain:
        A("**座標の新規付与候補（現行null・地図に座標あり）:**\n")
        A("| slug | 名称 | 新(lat,lng) |")
        A("|---|---|---|")
        for x in coord_gain:
            A(f"| {x['slug']} | {x['name']} | ({x['lat']}, {x['lng']}) |")
        A("")
    A("## 4. 属性スキーマの変化\n")
    A("変化なし。変電所CSVの16列構成・列名は初期取込時と同一（変電所No/変電所名/電圧一次/二次/台数/"
      "設備容量/運用容量値/制約要因/予想潮流/空容量/N-1可否/N-1可能量/出力制御/当該設備/上位系設備/備考）。\n")
    A("## 5. 行数・除外\n")
    A(f"生 **{len(raw_rows)}** 行 → dedupe 後 **{len(kept)}** 行（除去 {len(removed_dup)}件）"
      f"／注記行の除外 **{len(skipped)}件**／`series_dedup` ルール②不使用（#117）\n")
    A("## 6. 突合キー\n")
    for k, v in R["join_key"].items():
        A(f"- **{k}**: {v}")
    A("\n## 7. 増減\n")
    A("| 区分 | 件数 |")
    A("|---|---:|")
    A(f"| baseline（microCMS GET・#113） | {len(base)} |")
    A(f"| 新データ（dedupe後） | {len(kept)} |")
    A(f"| マッチ | {len(matched)} |")
    A(f"| 新規 | {len(new_rows)} |")
    A(f"| 消滅 | {len(removed)} |")
    A(f"| 名称＋電圧面キーとeidの食い違い（改番疑い） | {len(eid_mismatch)} |")
    A(f"| 値が変わったレコード | {len(changed_slugs)} |")
    A(f"| 取込後の想定総数 | **{total_after}**（{pct:+.1f}%）{' ★±10%超' if abs(pct) > 10 else ''} |")
    A("\n### フィールド別\n")
    A("| フィールド | 変化 | 新規充足 | 新データで欠落(現値維持) |")
    A("|---|---:|---:|---:|")
    for label, s_ in field_stats.items():
        A(f"| {label} | {s_['変化']} | {s_['新規充足']} | {s_['新データで欠落(現値維持)']} |")
    A("\n## 8. 当方に無い設備群（§5）\n")
    A(R["missing_groups"]["conclusion"] + "\n")
    A(f"\n## 9. 空き容量が減った変電所（{len(dec)}件・うちゼロ化 {len(zeroed)}件）\n")
    A("| 変電所 | 県 | 電圧面 | 変化 |")
    A("|---|---|---|---|")
    for x in dec[:10]:
        A(f"| {x['name']} | {x['prefecture'] or '基幹'} | {x['voltage']} | {x['from']} → **{x['to']}** MW |")
    A(f"\n## 10. 空き容量が増えた変電所（{len(inc)}件）\n")
    A("| 変電所 | 県 | 電圧面 | 変化 |")
    A("|---|---|---|---|")
    for x in inc[:5]:
        A(f"| {x['name']} | {x['prefecture'] or '基幹'} | {x['voltage']} | {x['from']} → **{x['to']}** MW |")
    A("\n## 11. 未算定・N-1\n")
    A(f"- N-1可否: 新データは 可{n1_ok_new}（うち**0MW可 {n1_zero_ok}**・潰さない）/ 不可{len(kept) - n1_ok_new}。"
      f"未算定 **{len(n1_und)}件**（現値維持・`{N1_OUT.name}` に出力）")
    A(f"- N-1可否の変化: **{len(n1_chg)}件**")
    if n1_chg:
        A("")
        A("| slug | 名称 | 変化 |")
        A("|---|---|---|")
        for x in n1_chg[:12]:
            A(f"| {x['slug']} | {x['name']} | {x['from']} → **{x['to']}** |")
    A(f"- 出力制御の未算定: {oc_und}件（現値維持）")
    A(f"- 空容量が『-』で予想潮流のみの行: **{flow_only}件** → 算出（運用容量−|予想潮流|・関西前例）を"
      "採用するかは**本実行の裁定事項**（初期取込は直読のみ・基幹9件は現行も null）\n")
    A("## 12. 同一No.名称変更・枝番振り直し\n")
    A("なし（名称＋電圧面キーと eid が全件一致）\n" if not eid_mismatch else
      f"**★{len(eid_mismatch)}件（要判断・ブロック）**\n")
    A("## 13. 県別件数\n")
    A("| 県 | 現行 | 新データ |")
    A("|---|---:|---:|")
    cur = {"愛知県": 407, "長野県": 198, "岐阜県": 184, "静岡県": 174, "三重県": 135, "基幹系統": 9}
    for p, c in cur.items():
        A(f"| {p} | {c} | {by_pref_new.get(p, 0)} |")
    if R["requires_judgement"]:
        A("\n## ★要判断（本実行前に裁定が必要）\n")
        for x in R["requires_judgement"]:
            A(f"- {x}")
    if R["warnings"]:
        A("\n## ⚠ 警告\n")
        for x in R["warnings"]:
            A(f"- {x}")
    REPORT_MD.write_text("\n".join(L) + "\n", encoding="utf-8")

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
            # ★oc_possibility は送信しない（裁定外）。新CSVは375件で None→有り となるが、
            #   初期取込が「当該設備が対象の場合のみ有り」という別解釈で格納していた形跡があり、
            #   一括で書き換えると出力制御表示が大きく変わる。要判断として報告に残す。
            if r_.get("oc_possibility") is not None and (b_.get("oc_possibility") or None) != r_["oc_possibility"]:
                changed.append("oc_skipped")
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

    print(f"\n-> {REPORT_MD} / {REPORT_JSON} / {N1_OUT} 出力")
    print("[dry-run] 完了（microCMS 書込なし）")


if __name__ == "__main__":
    main()
