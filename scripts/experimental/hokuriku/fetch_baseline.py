# -*- coding: utf-8 -*-
"""北陸の既存レコードを microCMS から GET してローカル保存（読取専用・書込ゼロ）。
static JSON には units 等の一部フィールドが無く差分が偽陽性になるため、必ず実データで照合する。"""
import json, os, re, sys, time, urllib.request
sys.stdout.reconfigure(encoding="utf-8")

for line in open(".env.local", encoding="utf-8"):
    m = re.match(r"^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$", line)
    if m:
        os.environ.setdefault(m.group(1), m.group(2).strip().strip('"\''))
DOMAIN, KEY = os.environ.get("MICROCMS_SERVICE_DOMAIN"), os.environ.get("MICROCMS_API_KEY")
if not DOMAIN or not KEY:
    sys.exit("env未設定")

out, offset = [], 0
while True:
    url = (f"https://{DOMAIN}.microcms.io/api/v1/substations?limit=100&offset={offset}"
           f"&filters=slug%5Bbegins_with%5Drkd-")
    req = urllib.request.Request(url, headers={"X-MICROCMS-API-KEY": KEY})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.loads(r.read().decode("utf-8"))
    out += j["contents"]
    if offset + 100 >= j["totalCount"]:
        break
    offset += 100
    time.sleep(0.4)
json.dump(out, open("scripts/experimental/hokuriku/baseline_live.json", "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"取得 {len(out)}件 → baseline_live.json")
print("フィールド:", sorted(out[0].keys()))
