"""
TEPCO Phase 2a — 13都県＋基幹PDF 一括パーサ
全県をループしてパース → 県別JSON + 結合 tepco_all.json
品質計測（parseエラー / 未パース行 = 列ズレ警告 / 重複名 / 異常レンジ）を内蔵。

本番 src/ は一切変更しない。実験ディレクトリのみ。
"""
import sys, re, json, os, unicodedata
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import pdfplumber

PDF_DIR  = "scripts/experimental/tepco/pdfs"
OUT_DIR  = "scripts/experimental/tepco/out"
ALL_OUT  = "scripts/experimental/tepco/tepco_all.json"
os.makedirs(OUT_DIR, exist_ok=True)

# ─── 県メタ（PDFキー / 表示名 / /grid用prefecture）─────────────────────
PREFS = [
    {"key": "tochigi",   "jp": "栃木県",              "grid_pref": "栃木県"},
    {"key": "gunma",     "jp": "群馬県",              "grid_pref": "群馬県"},
    {"key": "ibaraki",   "jp": "茨城県",              "grid_pref": "茨城県"},
    {"key": "saitama",   "jp": "埼玉県",              "grid_pref": "埼玉県"},
    {"key": "chiba",     "jp": "千葉県",              "grid_pref": "千葉県"},
    {"key": "tokyo23",   "jp": "東京都（23区）",       "grid_pref": "東京都"},
    {"key": "tama",      "jp": "東京都（多摩地区）",   "grid_pref": "東京都"},
    {"key": "kanagawa",  "jp": "神奈川県",            "grid_pref": "神奈川県"},
    {"key": "yamanashi", "jp": "山梨県",              "grid_pref": "山梨県"},
    {"key": "shizuoka",  "jp": "静岡県（富士川以東）", "grid_pref": "静岡県"},
    {"key": "fukushima", "jp": "福島県（一部）",       "grid_pref": "福島県"},
    {"key": "nagano",    "jp": "長野県（一部）",       "grid_pref": "長野県"},
    {"key": "niigata",   "jp": "新潟県（一部）",       "grid_pref": "新潟県"},
    {"key": "kikan",     "jp": "基幹系統",            "grid_pref": None},
]

# ─── 文字正規化（Kangxi部首グリフ → CJK統合漢字）──────────────────────
# 長野PDFで 長(U+9577) が ⾧(U+2FA7) として埋め込まれている等のフォント由来バグを補正。
def norm(s):
    if s is None:
        return None
    s = str(s)
    # Kangxi Radicals (U+2F00–2FD5) / CJK Radicals Supplement (U+2E80–2EFF) を
    # NFKC相当の正規漢字へ。全角括弧・数字は保持したいので個別置換に留める。
    out = []
    for ch in s:
        cp = ord(ch)
        if 0x2F00 <= cp <= 0x2FD5 or 0x2E80 <= cp <= 0x2EFF:
            nf = unicodedata.normalize("NFKC", ch)
            out.append(nf)
        else:
            out.append(ch)
    return "".join(out)

# ─── 値クリーニング ──────────────────────────────────────────────────
def clean(v):
    if v is None:
        return None
    v = norm(str(v)).strip()
    if v in ("-", "－", "", "ー", "—", "―"):
        return None
    return v

def to_float(v):
    v = clean(v)
    if v is None:
        return None
    v = v.replace(",", "").replace("，", "")
    try:
        return float(v)
    except Exception:
        return None

def parse_n1(v):
    v = clean(v)
    if v is None:
        return None
    if v.startswith("可"):
        return True
    if v.startswith("不可"):
        return False
    return None

def parse_curtail(v):
    v = clean(v)
    if v is None:
        return None
    if "有り" in v or "有" in v:
        return True
    if "なし" in v or "無" in v:
        return False
    return None

def safe_col(row, idx):
    try:
        return row[idx]
    except Exception:
        return None

# ─── 列定義（全県共通: sub=17列 / line=19列、Phase1で実証）─────────────
COL_SUB = dict(
    id=0, name=1, voltage=2, units=3,
    cap_equip=4, cap_op=5, constraint=6,
    # col 7 = 空白の結合ヘッダセル
    flow=8, cap_avail=9, cap_avail_upper=10,
    n1_yn=11, n1_cap=12,
    curtail=13, target=14, upper_grid=15, notes=16,
)
COL_LINE = dict(
    id=0, name=1, voltage_kv=2, circuits=3,
    cap_equip=4, cap_op=5, constraint=6,
    flow_dir_from=7, flow_dir_to=9,   # col8 = "→"
    flow=10, cap_avail=11, cap_avail_upper=12,
    n1_yn=13, n1_cap=14,
    curtail=15, target=16, upper_grid=17, notes=18,
)

# ─── ID判定（プレフィックス不問、電圧クラスをアンカー）─────────────────
VCLASS = r"(?:500kV|275kV|154kV|66kV|22kV|配電用変電所)"
RE_SUB_ID  = re.compile(rf"^変(.+?)\s+({VCLASS})\s+(\S+)$")
RE_LINE_ID = re.compile(rf"^(?!変)(.+?)\s+({VCLASS})\s+(\S+)$")

# 明らかにヘッダ/注記でデータ行ではないと分かる断片
HEADER_FRAGMENTS = ("電圧", "設備容量", "送電線名", "変電所名", "No.", "資料作成日",
                    "転載禁止", "潮流方向", "可否", "可能量", "当該設備", "考慮",
                    "1次/2次", "潮流", "備考")

def looks_like_header(c0):
    if not c0:
        return True
    return any(frag in c0 for frag in HEADER_FRAGMENTS)

# ─── 行パース ────────────────────────────────────────────────────────
def parse_sub_row(row, pref):
    id_raw = clean(safe_col(row, COL_SUB["id"]))
    if not id_raw:
        return None, (None, None)
    m = RE_SUB_ID.match(id_raw)
    if not m:
        return None, ("unparsed", id_raw) if not looks_like_header(id_raw) else (None, None)
    _prefix, vclass, no = m.group(1), m.group(2), m.group(3)

    voltage_raw = clean(safe_col(row, COL_SUB["voltage"]))
    units = to_float(safe_col(row, COL_SUB["units"]))
    vp = vs = None
    if voltage_raw and "/" in voltage_raw:
        a, b = voltage_raw.split("/", 1)
        vp, vs = to_float(a), to_float(b)
    elif vclass != "配電用変電所":
        kvm = re.search(r"(\d+)kV", vclass)
        if kvm:
            vs = float(kvm.group(1))

    # type分類: 空容量(空き容量)を実数で持つ系統 = distribution。
    #   配電用変電所 と 22kV は予想潮流=「-」/空容量=実数（同一データ形状）。
    #   154/66/275/500kV は予想潮流=実数/空容量=「-」（N-1可能量で表現）= bulk。
    DIST_CLASSES = {"配電用変電所", "22kV"}
    entry = {
        "source":        "TEPCO",
        "pdf_key":       pref["key"],
        "region":        pref["jp"],
        "grid_pref":     pref["grid_pref"],
        "external_id":   id_raw,
        "type":          "distribution" if vclass in DIST_CLASSES else "bulk",
        "voltage_class": vclass,
        "no":            no,
        "name":          clean(safe_col(row, COL_SUB["name"])),
        "voltage_primary_kv":   vp,
        "voltage_secondary_kv": vs,
        "units":         int(units) if units is not None else None,
        "capacity_equip_mw":    to_float(safe_col(row, COL_SUB["cap_equip"])),
        "capacity_op_mw":       to_float(safe_col(row, COL_SUB["cap_op"])),
        "constraint_type":      clean(safe_col(row, COL_SUB["constraint"])),
        "forecast_flow_mw":     to_float(safe_col(row, COL_SUB["flow"])),
        "cap_avail_mw":         to_float(safe_col(row, COL_SUB["cap_avail"])),
        "cap_avail_upper_mw":   to_float(safe_col(row, COL_SUB["cap_avail_upper"])),
        "n1_eligible":   parse_n1(safe_col(row, COL_SUB["n1_yn"])),
        "n1_raw":        clean(safe_col(row, COL_SUB["n1_yn"])),
        "n1_capacity_mw": to_float(safe_col(row, COL_SUB["n1_cap"])),
        "curtailment_possible": parse_curtail(safe_col(row, COL_SUB["curtail"])),
        "curtailment_target":   clean(safe_col(row, COL_SUB["target"])),
        "upper_grid":    clean(safe_col(row, COL_SUB["upper_grid"])),
        "notes":         clean(safe_col(row, COL_SUB["notes"])),
    }
    return entry, (None, None)

def parse_line_row(row, pref):
    id_raw = clean(safe_col(row, COL_LINE["id"]))
    if not id_raw:
        return None, (None, None)
    m = RE_LINE_ID.match(id_raw)
    if not m:
        return None, ("unparsed", id_raw) if not looks_like_header(id_raw) else (None, None)
    _prefix, vclass, no = m.group(1), m.group(2), m.group(3)

    ffrom = clean(safe_col(row, COL_LINE["flow_dir_from"]))
    fto   = clean(safe_col(row, COL_LINE["flow_dir_to"]))
    fdir  = f"{ffrom} → {fto}" if ffrom and fto else (ffrom or fto)

    entry = {
        "source":        "TEPCO",
        "pdf_key":       pref["key"],
        "region":        pref["jp"],
        "grid_pref":     pref["grid_pref"],
        "external_id":   id_raw,
        "voltage_class": vclass,
        "no":            no,
        "name":          clean(safe_col(row, COL_LINE["name"])),
        "voltage_kv":    to_float(safe_col(row, COL_LINE["voltage_kv"])),
        "circuits":      to_float(safe_col(row, COL_LINE["circuits"])),
        "capacity_equip_mw":    to_float(safe_col(row, COL_LINE["cap_equip"])),
        "capacity_op_mw":       to_float(safe_col(row, COL_LINE["cap_op"])),
        "constraint_type":      clean(safe_col(row, COL_LINE["constraint"])),
        "flow_direction":       fdir,
        "forecast_flow_mw":     to_float(safe_col(row, COL_LINE["flow"])),
        "cap_avail_mw":         to_float(safe_col(row, COL_LINE["cap_avail"])),
        "cap_avail_upper_mw":   to_float(safe_col(row, COL_LINE["cap_avail_upper"])),
        "n1_eligible":   parse_n1(safe_col(row, COL_LINE["n1_yn"])),
        "n1_raw":        clean(safe_col(row, COL_LINE["n1_yn"])),
        "n1_capacity_mw": to_float(safe_col(row, COL_LINE["n1_cap"])),
        "curtailment_possible": parse_curtail(safe_col(row, COL_LINE["curtail"])),
        "curtailment_target":   clean(safe_col(row, COL_LINE["target"])),
        "upper_grid":    clean(safe_col(row, COL_LINE["upper_grid"])),
        "notes":         clean(safe_col(row, COL_LINE["notes"])),
    }
    return entry, (None, None)

# ─── 県単位パース ────────────────────────────────────────────────────
def parse_pref(pref):
    path = os.path.join(PDF_DIR, f"{pref['key']}_yosochoryu.pdf")
    subs, lines = [], []
    unparsed = []        # 列ズレ/フォーマット差異の候補
    col_warnings = []    # 列数が想定(17/19)と違うページ
    errors = []
    if not os.path.exists(path):
        errors.append(f"FILE MISSING: {path}")
        return dict(pref=pref, substations=subs, transmission_lines=lines,
                    unparsed=unparsed, col_warnings=col_warnings, errors=errors)

    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            p = i + 1
            text = (page.extract_text() or "")[:200]
            is_sub  = "予想潮流等一覧表（変電所）" in text
            is_line = "予想潮流等一覧表（送電線）" in text
            if not (is_sub or is_line):
                continue
            tables = page.extract_tables()
            if not tables:
                continue
            table = tables[0]
            ncol = len(table[0]) if table else 0
            want = 17 if is_sub else 19
            if ncol != want:
                col_warnings.append(f"p{p} {'SUB' if is_sub else 'LINE'}: cols={ncol} (want {want})")
            for row in table:
                try:
                    if is_sub:
                        entry, (flag, val) = parse_sub_row(row, pref)
                    else:
                        entry, (flag, val) = parse_line_row(row, pref)
                    if entry:
                        (subs if is_sub else lines).append(entry)
                    elif flag == "unparsed":
                        unparsed.append(f"p{p} {'SUB' if is_sub else 'LINE'}: {val!r}")
                except Exception as e:
                    errors.append(f"p{p} row error: {e}")

    return dict(pref=pref, substations=subs, transmission_lines=lines,
                unparsed=unparsed, col_warnings=col_warnings, errors=errors)

# ─── 異常レンジ検出 ──────────────────────────────────────────────────
def detect_anomalies(subs):
    out = []
    for s in subs:
        ca = s.get("cap_avail_mw")
        if ca is not None and (ca < 0 or ca > 3000):
            out.append(f"{s['external_id']} {s['name']}: cap_avail={ca}")
        co = s.get("capacity_op_mw")
        if co is not None and co < 0:
            out.append(f"{s['external_id']} {s['name']}: capacity_op={co}")
    return out

# ─── メイン ──────────────────────────────────────────────────────────
all_subs, all_lines = [], []
pref_stats = []
total_errors = 0
total_unparsed = 0

for pref in PREFS:
    r = parse_pref(pref)
    subs, lines = r["substations"], r["transmission_lines"]
    all_subs.extend(subs)
    all_lines.extend(lines)
    total_errors += len(r["errors"])
    total_unparsed += len(r["unparsed"])

    # 県別JSON
    pref_json = {
        "pdf_key": pref["key"], "region": pref["jp"], "grid_pref": pref["grid_pref"],
        "source_date": "2026-04-23", "published_date": "2026-04-30",
        "operator": "東京電力パワーグリッド",
        "substations": subs, "transmission_lines": lines,
    }
    with open(os.path.join(OUT_DIR, f"{pref['key']}.json"), "w", encoding="utf-8") as f:
        json.dump(pref_json, f, ensure_ascii=False, indent=2)

    # 重複名（県内）
    names = [s["name"] for s in subs if s["name"]]
    dup_names = sorted({n for n in names if names.count(n) > 1})
    anomalies = detect_anomalies(subs)

    pref_stats.append({
        "key": pref["key"],
        "region": pref["jp"],
        "subs_total": len(subs),
        "subs_bulk": sum(1 for s in subs if s["type"] == "bulk"),
        "subs_distribution": sum(1 for s in subs if s["type"] == "distribution"),
        "lines_total": len(lines),
        "subs_n1_eligible": sum(1 for s in subs if s["n1_eligible"] is True),
        "lines_n1_eligible": sum(1 for l in lines if l["n1_eligible"] is True),
        "subs_with_cap": sum(1 for s in subs if s["cap_avail_mw"] is not None),
        "dup_names_count": len(dup_names),
        "dup_names": dup_names[:20],
        "unparsed_rows": r["unparsed"],
        "col_warnings": r["col_warnings"],
        "errors": r["errors"],
        "anomalies": anomalies,
    })

# 結合JSON
result = {
    "source": "TEPCO",
    "operator": "東京電力パワーグリッド",
    "source_date": "2026-04-23",
    "published_date": "2026-04-30",
    "fetched_phase": "2a",
    "prefectures": [p["key"] for p in PREFS],
    "stats": {
        "prefectures_count": len(PREFS),
        "substations_total": len(all_subs),
        "transmission_lines_total": len(all_lines),
        "subs_bulk": sum(1 for s in all_subs if s["type"] == "bulk"),
        "subs_distribution": sum(1 for s in all_subs if s["type"] == "distribution"),
        "subs_n1_eligible": sum(1 for s in all_subs if s["n1_eligible"] is True),
        "lines_n1_eligible": sum(1 for l in all_lines if l["n1_eligible"] is True),
        "total_parse_errors": total_errors,
        "total_unparsed_rows": total_unparsed,
    },
    "per_prefecture": pref_stats,
    "substations": all_subs,
    "transmission_lines": all_lines,
}
with open(ALL_OUT, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

# ─── コンソール出力 ──────────────────────────────────────────────────
print(f"{'県':<24} {'変電所':>6} {'基幹':>5} {'配電':>5} {'送電線':>6} {'N1可':>5} {'未パース':>7} {'列警告':>5} {'err':>4}")
print("─" * 90)
for st in pref_stats:
    print(f"{st['region']:<24} {st['subs_total']:>6} {st['subs_bulk']:>5} "
          f"{st['subs_distribution']:>5} {st['lines_total']:>6} {st['subs_n1_eligible']:>5} "
          f"{len(st['unparsed_rows']):>7} {len(st['col_warnings']):>5} {len(st['errors']):>4}")
print("─" * 90)
s = result["stats"]
print(f"{'合計':<24} {s['substations_total']:>6} {s['subs_bulk']:>5} "
      f"{s['subs_distribution']:>5} {s['transmission_lines_total']:>6} {s['subs_n1_eligible']:>5} "
      f"{s['total_unparsed_rows']:>7} {'-':>5} {s['total_parse_errors']:>4}")
print()
print(f"変電所合計: {s['substations_total']} / 送電線合計: {s['transmission_lines_total']}")
print(f"parseエラー: {s['total_parse_errors']} / 未パース行: {s['total_unparsed_rows']}")
print(f"出力: {ALL_OUT}  +  {OUT_DIR}/<県>.json")
