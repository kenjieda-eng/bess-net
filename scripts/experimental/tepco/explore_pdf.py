"""TEPCOの茨城PDFページ構成を探索する"""
import pdfplumber, json, re, sys

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

PDF = "scripts/experimental/tepco/ibaraki_yosochoryu.pdf"

lines = []
with pdfplumber.open(PDF) as pdf:
    total = len(pdf.pages)
    lines.append(f"Total pages: {total}")
    for i, page in enumerate(pdf.pages):
        text = (page.extract_text() or "")[:300].replace("\n", " ")
        tables = page.extract_tables()
        n_tables = len(tables)
        rows0 = len(tables[0]) if tables else 0
        lines.append(f"  p{i+1:3d} | tables={n_tables} rows0={rows0:3d} | {text[:150]}")

# 全ページ summary を出力
for l in lines:
    print(l)

# 変電所一覧ページの詳細テキストをファイルに保存
OUT = "scripts/experimental/tepco/explore_output.txt"
with pdfplumber.open(PDF) as pdf, open(OUT, "w", encoding="utf-8") as f:
    f.write(f"Total pages: {len(pdf.pages)}\n\n")
    for i, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        tables = page.extract_tables()
        f.write(f"=== p{i+1} | tables={len(tables)} ===\n")
        f.write(text[:2000])
        f.write("\n\n")
print(f"\nFull output written to {OUT}")
