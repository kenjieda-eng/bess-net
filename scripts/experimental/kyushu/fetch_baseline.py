# -*- coding: utf-8 -*-
"""九州エリアの既存レコードを microCMS から GET してローカル保存（読取専用・書込ゼロ）。
落とし穴 #113: baseline に static JSON を使わない（欠損フィールドが「新規充足」の偽陽性になる）。
1エンドポイント×ページングのみ・contains検索なし（鉄則#1/#2）。"""
import json, os, re, sys, time, urllib.request, urllib.parse
sys.stdout.reconfigure(encoding="utf-8")

for line in open(".env.local", encoding="utf-8"):
    m = re.match(r"^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$", line)
    if m:
        os.environ.setdefault(m.group(1), m.group(2).strip().strip('"\''))
DOMAIN, KEY = os.environ.get("MICROCMS_SERVICE_DOMAIN"), os.environ.get("MICROCMS_API_KEY")
if not DOMAIN or not KEY:
    sys.exit("env未設定")

AREA = urllib.parse.quote("九州")
out, offset = [], 0
while True:
    # 2026-11-17（BV dry-run）: orders=-publishedAt を足した（#124 offset ページングは一意なキーで並べる。下で id の重複も見る）
    url = (f"https://{DOMAIN}.microcms.io/api/v1/substations?limit=100&offset={offset}"
           f"&filters=area%5Bcontains%5D{AREA}&orders=-publishedAt")
    req = urllib.request.Request(url, headers={"X-MICROCMS-API-KEY": KEY})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.loads(r.read().decode("utf-8"))
    out += j["contents"]
    if offset + 100 >= j["totalCount"]:
        break
    offset += 100
    time.sleep(0.4)
ids = [r["id"] for r in out]
if len(set(ids)) != len(ids) or len(out) != j["totalCount"]:
    sys.exit(f"ページングの重複・欠落: 取得 {len(out)}・id 一意 {len(set(ids))}・totalCount {j['totalCount']}（書き出さない）")
# 出力先は引数で変えられる（2026-11-17 BV: baseline_live_2611.json。既定は従来どおり）
OUT = sys.argv[1] if len(sys.argv) > 1 else "scripts/experimental/kyushu/baseline_live.json"
json.dump(out, open(OUT, "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"取得 {len(out)}件（totalCount {j['totalCount']}）→ {OUT}")
print("フィールド:", sorted(out[0].keys()))
print("slug例:", [r["slug"] for r in out[:5]])
print("external_id例:", [r.get("external_id") for r in out[:5]])
print("source_url例:", out[0].get("source_url"))
