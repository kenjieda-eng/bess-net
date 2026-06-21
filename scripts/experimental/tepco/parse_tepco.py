"""
TEPCO茨城PDFパーサ（変電所・送電線・配電用変電所）
出力: tepco_ibaraki.json
"""
import sys, re, json
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

import pdfplumber

PDF  = "scripts/experimental/tepco/ibaraki_yosochoryu.pdf"
OUT  = "scripts/experimental/tepco/tepco_ibaraki.json"
DBGOUT = "scripts/experimental/tepco/parse_debug.txt"

# ─── ヘルパ ───────────────────────────────────────────────────────────
def clean(v):
    if v is None: return None
    v = str(v).strip()
    if v in ("-", "－", "", "ー", "—"): return None
    return v

def to_float(v):
    v = clean(v)
    if v is None: return None
    v = v.replace(",", "").replace("，", "")
    try: return float(v)
    except: return None

def parse_n1(v):
    """不可#1 → False / 可 → True / None → None"""
    v = clean(v)
    if v is None: return None
    if v.startswith("可"): return True
    if v.startswith("不可"): return False
    return None

def parse_curtail(v):
    v = clean(v)
    if v is None: return None
    return True if "有り" in v else (False if "なし" in v else None)

# ─── テーブル抽出ロジック ──────────────────────────────────────────────
# 各ページは1つのテーブルを持ち、先頭7行がヘッダ。
# 実データ行の最初のセル（No.セル）にエントリ識別子が入っている。
#
# 変電所 No. セル例:
#   "変茨城県 154kV 1"   → 基幹変電所 154kV
#   "変茨城県 66kV 2"    → 基幹変電所 66kV
#   "変茨城県 22kV 1"    → 22kV変電所
#   "変茨城県 配電用変電所 5" → 配電用変電所
#
# 送電線 No. セル例:
#   "茨城県 154kV 3"
#   "茨城県 66kV 20"
#
# テーブルカラム（0-indexed）を実際のセル数に合わせて取得。
# pdfplumber は複数列の複雑ヘッダを含む全行を返す。
# 先頭 6–8 行はヘッダなのでスキップ。

# ヘッダスキップはパターンマッチで行う（固定行数だとページによってズレる）

# 変電所テーブル列定義（0-indexed、ヘッダ除く）実カラム数=17
# 0:No, 1:変電所名, 2:電圧1次/2次, 3:台数, 4:設備容量, 5:運用容量値, 6:制約要因,
# 7:(空白セル), 8:予想潮流, 9:空容量(当該), 10:空容量(上位系考慮),
# 11:N1可否, 12:N1可能量, 13:平常時制御, 14:当該設備, 15:上位系設備, 16:備考
COL_SUB = dict(
    id=0, name=1, voltage=2, units=3,
    cap_equip=4, cap_op=5, constraint=6,
    # col 7 = blank merged header cell
    flow=8, cap_avail=9, cap_avail_upper=10,
    n1_yn=11, n1_cap=12,
    curtail=13, target=14, upper_grid=15
)

# 送電線テーブル列定義（実カラム数=19）
# 0:No, 1:送電線名, 2:電圧kV, 3:回線数, 4:設備容量, 5:運用容量値, 6:制約要因,
# 7:潮流方向from, 8:"→", 9:潮流方向to, 10:予想潮流,
# 11:空容量(当該), 12:空容量(上位), 13:N1可否, 14:N1可能量,
# 15:平常時制御, 16:当該設備, 17:上位系設備, 18:備考
COL_LINE = dict(
    id=0, name=1, voltage_kv=2, circuits=3,
    cap_equip=4, cap_op=5, constraint=6,
    flow_dir_from=7, flow_dir_to=9,
    flow=10, cap_avail=11, cap_avail_upper=12,
    n1_yn=13, n1_cap=14,
    curtail=15, target=16, upper_grid=17
)

RE_SUB_ID  = re.compile(r"^変茨城県\s+(154kV|66kV|22kV|配電用変電所)\s+(\d+)")
RE_LINE_ID = re.compile(r"^茨城県\s+(154kV|66kV)\s+(\d+)")

def safe_col(row, idx, default=None):
    try: return row[idx]
    except: return default

def parse_substation_row(row):
    id_raw = clean(safe_col(row, COL_SUB["id"]))
    if not id_raw: return None
    m = RE_SUB_ID.match(id_raw)
    if not m: return None

    voltage_class = m.group(1)   # "154kV" / "66kV" / "22kV" / "配電用変電所"
    no = m.group(2)

    name = clean(safe_col(row, COL_SUB["name"]))
    voltage_raw = clean(safe_col(row, COL_SUB["voltage"]))   # "275/154" or None
    units = to_float(safe_col(row, COL_SUB["units"]))
    cap_equip = to_float(safe_col(row, COL_SUB["cap_equip"]))
    cap_op = to_float(safe_col(row, COL_SUB["cap_op"]))
    constraint = clean(safe_col(row, COL_SUB["constraint"]))
    flow = to_float(safe_col(row, COL_SUB["flow"]))
    cap_avail = to_float(safe_col(row, COL_SUB["cap_avail"]))
    cap_avail_upper = to_float(safe_col(row, COL_SUB["cap_avail_upper"]))
    n1_raw = clean(safe_col(row, COL_SUB["n1_yn"]))
    n1_cap = to_float(safe_col(row, COL_SUB["n1_cap"]))
    curtail = parse_curtail(safe_col(row, COL_SUB["curtail"]))
    target = clean(safe_col(row, COL_SUB["target"]))
    upper_grid = clean(safe_col(row, COL_SUB["upper_grid"]))

    # 電圧パース
    voltage_primary = voltage_secondary = None
    if voltage_raw and "/" in voltage_raw:
        parts = voltage_raw.split("/")
        voltage_primary = to_float(parts[0])
        voltage_secondary = to_float(parts[1])
    elif voltage_class != "配電用変電所":
        kv = re.search(r"(\d+)kV", voltage_class)
        if kv: voltage_secondary = float(kv.group(1))

    return {
        "source":          "TEPCO",
        "prefecture":      "茨城県",
        "type":            "distribution" if voltage_class == "配電用変電所" else "bulk",
        "voltage_class":   voltage_class,
        "no":              no,
        "name":            name,
        "voltage_primary_kv":   voltage_primary,
        "voltage_secondary_kv": voltage_secondary,
        "units":           int(units) if units is not None else None,
        "capacity_equip_mw":    cap_equip,
        "capacity_op_mw":       cap_op,
        "constraint_type":      constraint,
        "forecast_flow_mw":     flow,
        "cap_avail_mw":         cap_avail,
        "cap_avail_upper_mw":   cap_avail_upper,
        "n1_eligible":     parse_n1(n1_raw),
        "n1_raw":          n1_raw,
        "n1_capacity_mw":  n1_cap,
        "curtailment_possible": curtail,
        "curtailment_target":   target if target not in (None, "-") else None,
        "upper_grid":      upper_grid,
    }

def parse_line_row(row):
    id_raw = clean(safe_col(row, COL_LINE["id"]))
    if not id_raw: return None
    m = RE_LINE_ID.match(id_raw)
    if not m: return None

    voltage_class = m.group(1)
    no = m.group(2)

    flow_from = clean(safe_col(row, COL_LINE["flow_dir_from"]))
    flow_to   = clean(safe_col(row, COL_LINE["flow_dir_to"]))
    flow_dir  = f"{flow_from} → {flow_to}" if flow_from and flow_to else (flow_from or flow_to)

    return {
        "source":       "TEPCO",
        "prefecture":   "茨城県",
        "voltage_class": voltage_class,
        "no":           no,
        "name":         clean(safe_col(row, COL_LINE["name"])),
        "voltage_kv":   to_float(safe_col(row, COL_LINE["voltage_kv"])),
        "circuits":     to_float(safe_col(row, COL_LINE["circuits"])),
        "capacity_equip_mw": to_float(safe_col(row, COL_LINE["cap_equip"])),
        "capacity_op_mw":    to_float(safe_col(row, COL_LINE["cap_op"])),
        "constraint_type":   clean(safe_col(row, COL_LINE["constraint"])),
        "flow_direction":    flow_dir,
        "forecast_flow_mw":  to_float(safe_col(row, COL_LINE["flow"])),
        "cap_avail_mw":      to_float(safe_col(row, COL_LINE["cap_avail"])),
        "cap_avail_upper_mw": to_float(safe_col(row, COL_LINE["cap_avail_upper"])),
        "n1_eligible":       parse_n1(safe_col(row, COL_LINE["n1_yn"])),
        "n1_raw":            clean(safe_col(row, COL_LINE["n1_yn"])),
        "n1_capacity_mw":    to_float(safe_col(row, COL_LINE["n1_cap"])),
        "curtailment_possible": parse_curtail(safe_col(row, COL_LINE["curtail"])),
        "curtailment_target":   clean(safe_col(row, COL_LINE["target"])),
        "upper_grid":        clean(safe_col(row, COL_LINE["upper_grid"])),
    }

# ─── メイン処理 ───────────────────────────────────────────────────────
substations = []
lines = []
debug_rows = []
parse_errors = []

with pdfplumber.open(PDF) as pdf:
    for page_idx, page in enumerate(pdf.pages):
        p = page_idx + 1
        tables = page.extract_tables()
        if not tables:
            continue
        table = tables[0]

        # ページ種別判定
        text_snippet = (page.extract_text() or "")[:200]
        is_substation = "予想潮流等一覧表（変電所）" in text_snippet
        is_line       = "予想潮流等一覧表（送電線）" in text_snippet

        if not (is_substation or is_line):
            continue

        debug_rows.append(f"\n=== p{p} ({'変電所' if is_substation else '送電線'}) ===")
        debug_rows.append(f"  rows={len(table)}, cols={len(table[0]) if table else 0}")

        for row in table:
            debug_rows.append(f"  ROW: {[str(c)[:30] if c else None for c in row[:16]]}")
            try:
                if is_substation:
                    entry = parse_substation_row(row)
                    if entry:
                        substations.append(entry)
                else:
                    entry = parse_line_row(row)
                    if entry:
                        lines.append(entry)
            except Exception as e:
                parse_errors.append(f"p{p} row error: {e}")

# ─── 出力 ─────────────────────────────────────────────────────────────
result = {
    "source_file": "ibaraki_yosochoryu.pdf",
    "source_date": "2026-04-23",
    "published_date": "2026-04-30",
    "operator": "東京電力パワーグリッド",
    "prefecture": "茨城県",
    "substations": substations,
    "transmission_lines": lines,
    "stats": {
        "substations_total":     len(substations),
        "subs_bulk":             sum(1 for s in substations if s["type"] == "bulk"),
        "subs_distribution":     sum(1 for s in substations if s["type"] == "distribution"),
        "lines_total":           len(lines),
        "subs_n1_eligible":      sum(1 for s in substations if s["n1_eligible"] is True),
        "subs_with_cap":         sum(1 for s in substations if s["cap_avail_mw"] is not None),
    },
    "parse_errors": parse_errors,
}

with open(OUT, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

with open(DBGOUT, "w", encoding="utf-8") as f:
    f.write("\n".join(debug_rows))

print(f"変電所: {result['stats']['substations_total']} 件 "
      f"(基幹={result['stats']['subs_bulk']}, 配電用={result['stats']['subs_distribution']})")
print(f"送電線: {result['stats']['lines_total']} 件")
print(f"N-1電制適用可: {result['stats']['subs_n1_eligible']} 件")
if parse_errors:
    print(f"パースエラー: {len(parse_errors)} 件")
    for e in parse_errors[:5]:
        print(f"  {e}")
print(f"出力: {OUT}")
