#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
scripts/experimental/eprx/extract_monthly_battery.py
EPRX 年次取りまとめ PDF から「需給調整市場 6 商品 × 蓄電池 × 月次の平均落札単価」を抽出する（Lc-2 ■4(d)）。

なぜ必要か
----------
EIC カタログ（src/data/eic/balancing-price-*-battery.json）は **年平均しか持たない**（frequency: annual・points 2 点）。
上流は月次から年平均を作る過程で月次を捨てている。一方 /tools/balancing-revenue は年平均だけを出しており、
三次調整力②は FY2024 の年度内で 9.81〜234.89（24 倍）動くため、年平均の単独表示が最も誤導する。
→ 月次を PDF から転記し、「年平均 ＋ 年度内の幅」を同じ視野に出すためのデータを作る。

設計上の約束
------------
1. 出力 JSON には **どの PDF の何ページ・どの見出しから取ったか** を必ず記録する（依頼者が後から検算できる形）。
   PDF の sha256 も記録する（差し替えられたら気づける）。
2. 未約定月は PDF 上「ー」。**0 円ではない**（同じ PDF 内で「落札なしの場合、0円で表示しています」と注記された
   ページもあるが、蓄電池行の実データはダッシュだった＝2026-09-20 実測）。null で記録し、平均から除外する。
   これはカタログ notes の「約定月のみ: FY2024 11ヶ月」等と件数が一致することで裏づけた。
3. **平均の再計算はこのスクリプトでは行わない。** 月次平均がカタログの年平均と一致するかの検査は
   scripts/verify-eprx-monthly.ts（prebuild で毎回実行）に持たせる。データ生成と検査を分けることで、
   「生成時に辻褄を合わせて通す」ことができないようにする。

実行方法（手動・年 1 回程度）
---------------------------
  1) PDF を取得（https://www.eprx.or.jp/information/summary.php の一覧から）
       curl -A "Mozilla/5.0" -o /tmp/summary_2024.pdf https://www.eprx.or.jp/information/docs/summary_2024.pdf
       curl -A "Mozilla/5.0" -o /tmp/summary_2025.pdf https://www.eprx.or.jp/information/summary_2025.pdf
  2) pip install pdfplumber
  3) python scripts/experimental/eprx/extract_monthly_battery.py \
         FY2024=/tmp/summary_2024.pdf FY2025=/tmp/summary_2025.pdf
  4) 出力された src/data/eprx-monthly-battery.json を commit し、
     npm run verify:eprx-monthly が PASS することを確認する。

★Windows で実行するときは PYTHONIOENCODING=utf-8 を付ける（cp932 のままだと日本語の出力で落ちる）。
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

try:
    import pdfplumber
except ImportError:  # pragma: no cover
    sys.exit("pdfplumber が要ります: pip install pdfplumber")

REPO_ROOT = Path(__file__).resolve().parents[3]
OUT_PATH = REPO_ROOT / "src" / "data" / "eprx-monthly-battery.json"

# PDF 見出しの商品名 → カタログ系列の product key。
# ★長い方から順に判定する（「二次調整力①」は「二次調整力」を含むため）。
PRODUCTS: list[tuple[str, str]] = [
    ("一次調整力", "primary"),
    ("二次調整力①", "secondary-1"),
    ("二次調整力②", "secondary-2"),
    ("三次調整力①", "tertiary-1"),
    ("三次調整力②", "tertiary-2"),
    ("複合商品", "composite"),
]
PRODUCTS_BY_LEN = sorted(PRODUCTS, key=lambda x: -len(x[0]))

# 公表元の URL とファイル名（出典欄にはこちらを出す）。
# ★手元の作業ファイル名を出典に書いてはいけない。読者も依頼者も辿れない名前になる
#   （2026-09-20 に一度 eprx_2024.pdf と表示してしまい是正）。
PUBLISHED_PDF: dict[str, str] = {
    "FY2024": "https://www.eprx.or.jp/information/docs/summary_2024.pdf",
    "FY2025": "https://www.eprx.or.jp/information/summary_2025.pdf",
}

CATALOG_SERIES = {
    "primary": "balancing-price-primary-battery",
    "secondary-1": "balancing-price-secondary-1-battery",
    "secondary-2": "balancing-price-secondary-2-battery",
    "tertiary-1": "balancing-price-tertiary-1-battery",
    "tertiary-2": "balancing-price-tertiary-2-battery",
    "composite": "balancing-price-composite-battery",
}

# 年度は 4 月始まり。PDF の表ヘッダもこの順で並ぶ。
MONTH_ORDER = ["4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月", "1月", "2月", "3月"]

# 未約定を表す表記（PDF によって揺れるため複数許容する）
DASHES = {"ー", "―", "－", "-", "‐", "—", ""}

HEADING_RE = re.compile(r"電源種別別の平均落札単価")


def cell(value) -> str:
    return "" if value is None else str(value).replace("\n", "").strip()


def product_of(heading: str) -> str | None:
    for ja, key in PRODUCTS_BY_LEN:
        if ja in heading:
            return key
    return None


def sha256_of(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def extract_fy(pdf_path: Path) -> dict:
    """1 年度分の PDF から 6 商品の蓄電池行を取り出す。"""
    products: dict[str, dict] = {}
    with pdfplumber.open(str(pdf_path)) as pdf:
        for pno, page in enumerate(pdf.pages, 1):
            text = page.extract_text() or ""
            if not HEADING_RE.search(text):
                continue
            heading = text.split("\n")[0].strip()
            key = product_of(heading)
            if key is None:
                continue
            for table in page.extract_tables():
                if not table:
                    continue
                header = [cell(c) for c in table[0]]
                months = [h for h in header[1:] if h]
                if months != MONTH_ORDER:
                    # ヘッダが想定と違う表は触らない（別の表を誤って拾わないため）
                    continue
                for row in table:
                    cells = [cell(c) for c in row]
                    if not cells or cells[0] != "蓄電池":
                        continue
                    values: dict[str, float | None] = {}
                    for m, raw in zip(MONTH_ORDER, cells[1:]):
                        if raw in DASHES:
                            values[m] = None
                        else:
                            try:
                                values[m] = float(raw.replace(",", ""))
                            except ValueError:
                                # 想定外の表記は「読めなかった」ことを残す（黙って落とさない）
                                raise SystemExit(
                                    f"[中止] p{pno} {heading} の {m} が数値として読めない: {raw!r}"
                                )
                    if key in products:
                        raise SystemExit(f"[中止] 商品 {key} の蓄電池行が複数ページで見つかった（p{pno}）")
                    products[key] = {
                        "product_ja": next(ja for ja, k in PRODUCTS if k == key),
                        "catalog_series": CATALOG_SERIES[key],
                        "pdf_page": pno,
                        "page_heading": heading,
                        "months": values,
                        "awarded_months": sum(1 for v in values.values() if v is not None),
                    }
    missing = [k for _, k in PRODUCTS if k not in products]
    if missing:
        raise SystemExit(f"[中止] {pdf_path.name} で見つからなかった商品: {missing}")
    return products


def main() -> None:
    args = [a for a in sys.argv[1:] if "=" in a]
    if not args:
        sys.exit(__doc__)

    fiscal_years: dict[str, dict] = {}
    for arg in args:
        fy, raw_path = arg.split("=", 1)
        path = Path(raw_path)
        if not path.exists():
            sys.exit(f"[中止] PDF が無い: {path}")
        print(f"[extract] {fy} ← {path}")
        published = PUBLISHED_PDF.get(fy)
        if not published:
            sys.exit(f"[中止] {fy} の公表 PDF の URL が PUBLISHED_PDF に未登録")
        fiscal_years[fy] = {
            "pdf": {
                "published_file_name": published.rsplit("/", 1)[-1],
                "published_url": published,
                "local_file_name": path.name,
                "sha256": sha256_of(path),
                "source_page": "https://www.eprx.or.jp/information/summary.php",
            },
            "products": extract_fy(path),
        }
        for key, p in fiscal_years[fy]["products"].items():
            print(f"    {p['product_ja']:<8} p{p['pdf_page']:<3} 約定 {p['awarded_months']:>2} か月")

    out = {
        "_meta": {
            "description": "EPRX 需給調整市場 6 商品 × 蓄電池の月次平均落札単価（年度内の幅を表示するための転記データ）",
            "unit": "円/ΔkW・30分",
            "source_name": "一般社団法人 電力需給調整力取引所（EPRX）「取引実績の取りまとめ結果」",
            "source_top": "https://www.eprx.or.jp/",
            "source_index": "https://www.eprx.or.jp/information/summary.php",
            "generated_by": "scripts/experimental/eprx/extract_monthly_battery.py",
            "null_means": "未約定（PDF 上は「ー」）。平均には含めない。",
            "averaging": "約定月の単純平均（約定量で加重しない）。カタログの年平均と同じ定義。",
            "verified_by": "npm run verify:eprx-monthly（月次平均＝カタログ年平均・約定月数の一致を検査）",
            "license_note": "EPRX 利用規約 §4 に従い、出典と加工（PDF からの転記）を明記して利用。リンクは §3 によりトップページ。",
        },
        "fiscal_years": fiscal_years,
    }
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUT_PATH.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"[write] {OUT_PATH}")


if __name__ == "__main__":
    main()
