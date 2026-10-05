# -*- coding: utf-8 -*-
"""四国（ydn-*）の既存レコードを microCMS から GET してローカル保存（読取専用・書込ゼロ）。
static JSON は表示に不要なフィールドを落としているため、差分の baseline は必ず実データで取る（#113）。
ページングは同着の無い orders（-publishedAt）＋ id 重複除去（#124 ページング版）。

実行（リポジトリ直下）: set -a && . ./.env.local && set +a && python scripts/experimental/shikoku/fetch_baseline.py
"""
import json, os, sys, time, urllib.parse, urllib.request
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
DOMAIN, KEY = os.environ.get("MICROCMS_SERVICE_DOMAIN"), os.environ.get("MICROCMS_API_KEY")
if not DOMAIN or not KEY:
    sys.exit("env 未設定（set -a && . ./.env.local && set +a で読み込んでから実行）")

PREFIX = sys.argv[1] if len(sys.argv) > 1 else "ydn-"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else Path("scripts/experimental/shikoku/baseline_live.json")

out, offset, total = [], 0, None
while True:
    q = urllib.parse.urlencode({
        "limit": 100, "offset": offset, "orders": "-publishedAt",
        "filters": f"slug[begins_with]{PREFIX}",
    })
    req = urllib.request.Request(f"https://{DOMAIN}.microcms.io/api/v1/substations?{q}",
                                 headers={"X-MICROCMS-API-KEY": KEY})
    with urllib.request.urlopen(req, timeout=60) as r:
        j = json.loads(r.read().decode("utf-8"))
    total = j["totalCount"]
    out += j["contents"]
    if offset + 100 >= total:
        break
    offset += 100
    time.sleep(0.4)

seen, uniq = set(), []
for c in out:
    if c["id"] in seen:
        continue
    seen.add(c["id"])
    uniq.append(c)
if len(uniq) != total:
    sys.exit(f"件数不一致: totalCount {total} / 取得（重複除去後） {len(uniq)} — 保存しない")
uniq.sort(key=lambda c: c["slug"])
OUT.write_text(json.dumps(uniq, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"取得 {len(uniq)} 件（totalCount {total}・重複 {len(out) - len(uniq)}）→ {OUT}")
keys = set()
for c in uniq:
    keys |= set(c.keys())
print("フィールド:", sorted(keys))
