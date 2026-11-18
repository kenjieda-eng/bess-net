# -*- coding: utf-8 -*-
"""
scripts/experimental/kyushu/build_prefecture_map.py — 九州電力送配電の変電所の県の対応表を作る（九州の県の直し便・2026-11-18・_QUEUE.md 125 行）

入力:
  --plan      ユウの計画（kyushu-prefecture-plan-2026-11-17_一次照合済み_ユウ.json）。一次＝供給余力マップ（系統用変電所）の
              8 枚の地図の絵を人が読んだ名前（maps）と、その名前を当サイトのレコードに当てた結果（verified・corrections）、
              国土地理院の地名検索（手がかり・一次ではない）で選んだ「確認中」（unconfirmed）。
  --baseline  microCMS の九州の全件（GET・scripts/experimental/kyushu/fetch_baseline.py の出力）。slug ↔ external_id と収録の県を取る。
出力:
  src/data/kyushu-prefecture-map.json（表示用。microCMS の prefecture は書き換えない＝L-EIC-028）

★推測で県を付け替えない。県が変わるのは一次で確かめたもの（verified）だけ。確認中は県を出さない（別の県に移さない）。
★計画の数（verified 105・確認中 70・県別の件数）と合わなければ書かずに止める。

使い方（リポジトリ直下）:
  python -I -X utf8 scripts/experimental/kyushu/build_prefecture_map.py --plan=<計画.json> --baseline=scripts/experimental/kyushu/baseline_live_2611.json
"""
import argparse, collections, hashlib, json, sys
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
OUT = Path("src/data/kyushu-prefecture-map.json")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--plan", required=True)
    ap.add_argument("--baseline", required=True)
    a = ap.parse_args()
    plan_bytes = Path(a.plan).read_bytes()
    plan = json.loads(plan_bytes.decode("utf-8"))
    base = json.load(open(a.baseline, encoding="utf-8"))
    by_slug = {r["slug"]: r for r in base}
    stop = []

    maps = [{"pref": m["pref"], "title": m["title"], "url": m["url"], "names": m["names"]} for m in plan["maps"]]
    map_idx = {m["title"]: i for i, m in enumerate(maps)}

    verified = {}
    for v in plan["verified"]:
        r = by_slug.get(v["slug"])
        if not r:
            stop.append(f"verified の {v['slug']} が baseline に無い")
            continue
        if (r.get("prefecture") or None) != v["site_pref"]:
            stop.append(f"{v['slug']}: 収録の県 {r.get('prefecture')}・計画 {v['site_pref']}")
        verified[v["slug"]] = {"eid": r["external_id"], "name": r["name"], "p": v["primary_pref"], "was": r.get("prefecture"),
                               "map": map_idx[v["map_title"]], "on_map": v["map_name"]}
    pending = {}
    for u in plan["unconfirmed"]:
        r = by_slug.get(u["slug"])
        if not r:
            stop.append(f"unconfirmed の {u['slug']} が baseline に無い")
            continue
        if u["slug"] in verified:
            stop.append(f"{u['slug']} が確かめたものと確認中の両方にある")
        if (r.get("prefecture") or None) != u["site_pref"]:
            stop.append(f"{u['slug']}: 収録の県 {r.get('prefecture')}・計画 {u['site_pref']}")
        pending[u["slug"]] = {"eid": r["external_id"], "name": r["name"], "was": r.get("prefecture"), "district": u["district"],
                              "other": u["other_pref"], "hits": [u["site_pref_hits"], u["other_pref_hits"]]}

    corrections = [{"slug": c["slug"], "name": c["name"], "old": c["old"], "new": c["new"]} for c in plan["corrections"]]
    got_corr = sorted((s, e["was"], e["p"]) for s, e in verified.items() if e["was"] != e["p"])
    if got_corr != sorted((c["slug"], c["old"], c["new"]) for c in corrections):
        stop.append(f"県が変わるものが計画の corrections と違う: {got_corr}")

    before = collections.Counter(r.get("prefecture") for r in base)
    after = collections.Counter()
    for r in base:
        s = r["slug"]
        after["確認中" if s in pending else (verified[s]["p"] if s in verified else r.get("prefecture"))] += 1
    if dict(before) != plan["counts_before"]:
        stop.append(f"県別（前）が計画と違う: {dict(before)}")
    if dict(after) != plan["counts_after"]:
        stop.append(f"県別（後）が計画と違う: {dict(after)}")
    if len(verified) != plan["verified_count"] or len(pending) != plan["unconfirmed_count"]:
        stop.append(f"件数 verified {len(verified)}・確認中 {len(pending)}（計画 {plan['verified_count']}・{plan['unconfirmed_count']}）")
    if stop:
        print("★止める（書かない）:")
        for x in stop:
            print("  -", x)
        sys.exit(2)

    out = {
        "_purpose": ("九州電力送配電の変電所の県（表示用）。microCMS の prefecture は書き換えない（L-EIC-028）。表示の県は src/lib/grid-prefecture.ts の "
                     "normalizeSubstationPlace の 1 か所で、この表から導出する（#119）。verified＝同社「供給余力マップ（系統用変電所）」の県ごとの地図に"
                     "名前が出る変電所（一次）。pending＝県を出さない（確認中）もの。どちらにも無い九州のレコードは、収録の県を「当サイトの推定」として出す。"),
        "_rebuild": ("① 一次を素の curl で取る: 入口 https://www.kyuden.co.jp/td/application/firm-location/capacity-map.html と 8 枚の県のページ"
                     "（source.maps の url）と、各ページの地図の絵（img の src）。② 地図の絵を人が読み、名前を計画の maps に書く（文字の層が無い絵＝機械で読めない）。"
                     "③ 名前（「変電所」・括弧の中・末尾の数字を外す）で当サイトのレコードに当て、同じ名前が複数の地区にあるときは一次電圧がいちばん高い地区だけを採る"
                     "（verified）。④ 県をまたぐ 8 地区の、③で当たらなかったレコードの名前を国土地理院の地名検索に当て、規則（source.pending_rule.flag）で確認中を選ぶ"
                     "（手がかり・一次ではない）。⑤ python -I -X utf8 scripts/experimental/kyushu/build_prefecture_map.py --plan=<計画.json> "
                     "--baseline=<fetch_baseline.py の出力>。⑥ npm run verify:kyushu-prefecture の EXPECT を新しい数に直す。"),
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "plan_sha256": hashlib.sha256(plan_bytes).hexdigest(),
        "source": {
            "primary": {"name": plan["primary"]["name"], "publisher": plan["primary"]["publisher"], "entry": plan["primary"]["entry"],
                        "title_verbatim": "九州電力送配電　供給余力マップ（系統用変電所）", "asof_label": plan["primary"]["asof_label"]},
            "maps": maps,
            "pending_rule": {k: plan["unconfirmed_rule"][k] for k in ("scope", "candidates", "query", "flag", "run")},
        },
        "verified": dict(sorted(verified.items(), key=lambda kv: int(kv[0].split("-")[1]))),
        "pending": dict(sorted(pending.items(), key=lambda kv: int(kv[0].split("-")[1]))),
        "corrections": corrections,
        "excluded_same_name": plan["excluded_same_name"],
        "near_miss_keep_label": [{k: n[k] for k in ("slug", "name", "district", "site_pref", "other_pref", "site_pref_hits", "other_pref_hits")}
                                 for n in plan["near_miss_keep_label"]],
        "counts": {"records": len(base), "verified": len(verified), "pending": len(pending),
                   "estimated": len(base) - len(verified) - len(pending), "corrections": len(corrections),
                   "verified_by_pref": dict(collections.Counter(e["p"] for e in verified.values())),
                   "by_pref_before": dict(before), "by_pref_after": dict(after)},
    }
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    print(f"-> {OUT}  verified {len(verified)}・確認中 {len(pending)}・推定 {out['counts']['estimated']}・県が変わる {len(corrections)}")
    print("  県別（後）", dict(after))


if __name__ == "__main__":
    main()
