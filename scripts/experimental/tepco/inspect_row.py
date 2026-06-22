import sys, json
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
import pdfplumber

# 栃木の変電所ページ p23-25 を調べ、新栃木 行の生セルを見る
with pdfplumber.open("scripts/experimental/tepco/pdfs/tochigi_yosochoryu.pdf") as pdf:
    for i in range(22, 26):  # p23..p26
        page = pdf.pages[i]
        text = (page.extract_text() or "")[:60]
        if "予想潮流等一覧表（変電所）" not in (page.extract_text() or "")[:200]:
            continue
        tables = page.extract_tables()
        if not tables:
            continue
        for row in tables[0]:
            c0 = (row[0] or "").strip() if row else ""
            if "新栃木" in c0 or ("154kV 1" in c0) or ("154kV 2" in c0) or ("154kV 3" in c0):
                print(f"p{i+1} cols={len(row)}:")
                for j, c in enumerate(row):
                    print(f"   [{j}] {c!r}")
                print()

# JSONの該当エントリ
with open("scripts/experimental/tepco/out/tochigi.json", encoding="utf-8") as f:
    d = json.load(f)
print("=== JSON 新栃木関連 ===")
for s in d["substations"]:
    if "新栃木" in (s["name"] or ""):
        print(json.dumps({k:s[k] for k in ["external_id","name","voltage_primary_kv","voltage_secondary_kv","units","capacity_equip_mw","capacity_op_mw","forecast_flow_mw","cap_avail_mw","n1_eligible","n1_capacity_mw"]}, ensure_ascii=False))
