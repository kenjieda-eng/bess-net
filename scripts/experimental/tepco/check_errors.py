import json, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")
with open("scripts/experimental/tepco/tepco_all.json", encoding="utf-8") as f:
    d = json.load(f)
for st in d["per_prefecture"]:
    if st["errors"]:
        print(f"### {st['region']} ({len(st['errors'])} errors)")
        for e in st["errors"][:6]:
            print(f"   {e}")
