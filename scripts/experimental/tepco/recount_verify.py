"""
独立リカウント検証: PDF生テーブルから「ID正規表現にマッチするcol0」を数え、
パーサ出力の件数と一致するか確認する。ドロップ行（取りこぼし）検出が目的。
さらに、ヘッダ/注記でない & IDにマッチしない col0（=潜在的な取りこぼし）を列挙。
"""
import sys, re, json, os
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import pdfplumber

PDF_DIR = "scripts/experimental/tepco/pdfs"
OUT_DIR = "scripts/experimental/tepco/out"

PREFS = ["tochigi","gunma","ibaraki","saitama","chiba","tokyo23","tama",
         "kanagawa","yamanashi","shizuoka","fukushima","nagano","niigata","kikan"]

VCLASS = r"(?:500kV|275kV|154kV|66kV|22kV|配電用変電所)"
RE_SUB_ID  = re.compile(rf"^変(.+?)\s+({VCLASS})\s+(\S+)$")
RE_LINE_ID = re.compile(rf"^(?!変)(.+?)\s+({VCLASS})\s+(\S+)$")
HEADER_FRAGMENTS = ("電圧","設備容量","送電線名","変電所名","No.","資料作成日",
                    "転載禁止","潮流方向","可否","可能量","当該設備","考慮",
                    "1次/2次","潮流","備考")

import unicodedata
def norm(s):
    if s is None: return None
    out=[]
    for ch in str(s):
        cp=ord(ch)
        if 0x2F00<=cp<=0x2FD5 or 0x2E80<=cp<=0x2EFF:
            out.append(unicodedata.normalize("NFKC",ch))
        else: out.append(ch)
    return "".join(out)

def is_header(c0):
    return (not c0) or any(f in c0 for f in HEADER_FRAGMENTS)

mismatches = 0
suspicious = []
for key in PREFS:
    path = os.path.join(PDF_DIR, f"{key}_yosochoryu.pdf")
    raw_sub = raw_line = 0
    susp_here = []
    with pdfplumber.open(path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = (page.extract_text() or "")[:200]
            is_sub  = "予想潮流等一覧表（変電所）" in text
            is_line = "予想潮流等一覧表（送電線）" in text
            if not (is_sub or is_line): continue
            tables = page.extract_tables()
            if not tables: continue
            for row in tables[0]:
                c0 = norm((row[0] or "").strip()) if row else ""
                if not c0: continue
                rx = RE_SUB_ID if is_sub else RE_LINE_ID
                if rx.match(c0):
                    if is_sub: raw_sub += 1
                    else: raw_line += 1
                elif not is_header(c0):
                    # ID未マッチかつヘッダでない = 取りこぼし候補
                    susp_here.append(f"p{i+1} {'S' if is_sub else 'L'}: {c0[:50]!r}")

    with open(os.path.join(OUT_DIR, f"{key}.json"), encoding="utf-8") as f:
        d = json.load(f)
    parsed_sub = len(d["substations"])
    parsed_line = len(d["transmission_lines"])

    ok_sub  = "OK " if raw_sub  == parsed_sub  else "MISMATCH"
    ok_line = "OK " if raw_line == parsed_line else "MISMATCH"
    if raw_sub != parsed_sub or raw_line != parsed_line:
        mismatches += 1
    print(f"{key:<10} sub raw={raw_sub:>3} parsed={parsed_sub:>3} {ok_sub} | "
          f"line raw={raw_line:>3} parsed={parsed_line:>3} {ok_line} | susp={len(susp_here)}")
    for s in susp_here:
        suspicious.append(f"  [{key}] {s}")

print()
print(f"count mismatches: {mismatches}")
print(f"suspicious (non-header, non-ID) col0 rows: {len(suspicious)}")
for s in suspicious[:40]:
    print(s)
