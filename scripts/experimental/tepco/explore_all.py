"""
全14PDFのフォーマット差異を探索する。
各県について:
  - 総ページ数
  - 変電所/送電線テーブルのページ番号
  - テーブル列数（ページごと）
  - 先頭データ行のID文字列パターン（プレフィックス把握）
出力: explore_all_output.txt
"""
import sys, re, json, glob, os
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import pdfplumber

PDF_DIR = "scripts/experimental/tepco/pdfs"
OUT = "scripts/experimental/tepco/explore_all_output.txt"

NAMES = ["tochigi","gunma","ibaraki","saitama","chiba","tokyo23","tama",
         "kanagawa","yamanashi","shizuoka","fukushima","nagano","niigata","kikan"]

# データ行っぽいIDを拾う正規表現（プレフィックス不問）
RE_ANY_ID = re.compile(r"^(変?\S+?)\s+(154kV|66kV|22kV|275kV|500kV|配電用変電所|電源接続|基幹)\s*(\S*)")

def first_data_id(table):
    """ヘッダ以降で最初に '県名 + 電圧クラス + No' っぽいセルを返す"""
    for row in table:
        c0 = (row[0] or "").strip() if row else ""
        if not c0:
            continue
        if RE_ANY_ID.match(c0):
            return c0
    return None

lines_out = []
def emit(s):
    lines_out.append(s)
    print(s)

for name in NAMES:
    path = os.path.join(PDF_DIR, f"{name}_yosochoryu.pdf")
    if not os.path.exists(path):
        emit(f"\n##### {name}: FILE MISSING")
        continue
    emit(f"\n##### {name} #####")
    try:
        with pdfplumber.open(path) as pdf:
            total = len(pdf.pages)
            emit(f"  total_pages={total}")
            sub_pages, line_pages = [], []
            col_counts = {}
            id_samples = {}
            sheet_dates = set()
            base_dates = set()
            for i, page in enumerate(pdf.pages):
                p = i + 1
                text = page.extract_text() or ""
                snip = text[:300]
                # 資料作成日 / 基準日 検出
                m = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日", text)
                if "資料作成日" in text or "公開" in text:
                    for mm in re.finditer(r"(\d{4})年(\d{1,2})月(\d{1,2})日", text):
                        sheet_dates.add(f"{mm.group(1)}-{int(mm.group(2)):02d}-{int(mm.group(3)):02d}")
                if "時点" in text:
                    for mm in re.finditer(r"(\d{4})年(\d{1,2})月(\d{1,2})日時点", text):
                        base_dates.add(f"{mm.group(1)}-{int(mm.group(2)):02d}-{int(mm.group(3)):02d}")
                tables = page.extract_tables()
                is_sub = "予想潮流等一覧表（変電所）" in snip
                is_line = "予想潮流等一覧表（送電線）" in snip
                if tables and is_sub:
                    sub_pages.append(p)
                    col_counts.setdefault("sub", set()).add(len(tables[0][0]) if tables[0] else 0)
                    sid = first_data_id(tables[0])
                    if sid and "sub" not in id_samples:
                        id_samples["sub"] = sid
                if tables and is_line:
                    line_pages.append(p)
                    col_counts.setdefault("line", set()).add(len(tables[0][0]) if tables[0] else 0)
                    lid = first_data_id(tables[0])
                    if lid and "line" not in id_samples:
                        id_samples["line"] = lid
            emit(f"  substation_pages={sub_pages}")
            emit(f"  line_pages={line_pages}")
            emit(f"  col_counts={ {k: sorted(v) for k,v in col_counts.items()} }")
            emit(f"  id_sample_sub={id_samples.get('sub')!r}")
            emit(f"  id_sample_line={id_samples.get('line')!r}")
            emit(f"  base_dates={sorted(base_dates)}")
            emit(f"  sheet_dates={sorted(sheet_dates)}")
    except Exception as e:
        emit(f"  ERROR: {e}")

with open(OUT, "w", encoding="utf-8") as f:
    f.write("\n".join(lines_out))
print(f"\n=> {OUT}")
