# -*- coding: utf-8 -*-
"""関西エリアの既存レコードを microCMS から GET してローカル保存（読取専用・書込ゼロ）。
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

AREA = urllib.parse.quote("関西")
out, offset = [], 0
while True:
    url = (f"https://{DOMAIN}.microcms.io/api/v1/substations?limit=100&offset={offset}"
           f"&filters=area%5Bcontains%5D{AREA}")
    req = urllib.request.Request(url, headers={"X-MICROCMS-API-KEY": KEY})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.loads(r.read().decode("utf-8"))
    out += j["contents"]
    if offset + 100 >= j["totalCount"]:
        break
    offset += 100
    time.sleep(0.4)
json.dump(out, open("scripts/experimental/kansai/baseline_live.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"取得 {len(out)}件 → baseline_live.json")
print("フィールド:", sorted(out[0].keys()))
print("slug例:", [r["slug"] for r in out[:5]])
print("external_id例:", [r.get("external_id") for r in out[:5]])
print("source_url例:", out[0].get("source_url"))
