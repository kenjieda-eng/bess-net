# -*- coding: utf-8 -*-
"""
scripts/experimental/kansai/sample_prefecture_check.py — 関西の府県の割り当ての抜き取り（11/4 の裁定 §3 条件 3）
府県ごとに 10 件・計 60 件を固定の種で無作為に選び、変電所の名前（地名）を国土地理院の住所検索に当てて、府県が合うかを見る。
★地名検索は手がかりで一次ではない。合わなくても表は変えない。食い違いは原因を調べて報告に書く。
食い違いの見分けに、図の中でその記号に一番近い市町村名の文字（図の題の市町村）も出す。
国土地理院: 住所検索 https://msearch.gsi.go.jp/address-search/AddressSearch?q=…（府県の付かない候補は逆ジオコーダで市町村コードから府県）。
1.5 秒あけて逐次。書込はしない。

実行: python -P scripts/experimental/kansai/sample_prefecture_check.py --map=src/data/kansai-prefecture-map.json --pdf-dir=<図の PDF> --out=<結果 JSON> [--seed=20261107]
"""
import argparse, json, math, os, random, re, sys, time, unicodedata, urllib.parse, urllib.request
import pdfplumber

sys.stdout.reconfigure(encoding="utf-8")
N = lambda s: unicodedata.normalize("NFKC", s or "").strip()  # noqa: E731
PREF_CODE = {"25": "滋賀県", "26": "京都府", "27": "大阪府", "28": "兵庫県", "29": "奈良県", "30": "和歌山県", "18": "福井県", "24": "三重県"}
PREFS47 = ["北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
           "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
           "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
           "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"]
UA = "bess-net data check"


def get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode("utf-8"))


def pref_of_title(t):
    return next((p for p in PREFS47 if t.startswith(p)), None)


def base_name(n):
    n = re.sub(r"（.*?）|\(.*?\)", "", N(n))
    return re.sub(r"[0-9]+$", "", n).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--map", default="src/data/kansai-prefecture-map.json")
    ap.add_argument("--site", default="src/lib/generated/grid-detail/kansai.json")
    ap.add_argument("--pdf-dir", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--seed", type=int, default=20261107)
    a = ap.parse_args()
    m = json.load(open(a.map, encoding="utf-8"))
    site = json.load(open(a.site, encoding="utf-8"))
    by_eid = {}
    for r in site.values():
        by_eid.setdefault(N(r.get("external_id")), []).append(r)
    rng = random.Random(a.seed)
    rows = []
    for pref in ("大阪府", "京都府", "兵庫県", "奈良県", "滋賀県", "和歌山県"):
        cands = sorted(k for k, e in m["entries"].items() if e["p"] == pref and e["b"] == "図")
        for k in rng.sample(cands, 10):
            r = by_eid[k][0]
            rows.append({"pref": pref, "eid": k, "no": k.split("_", 2)[-1], "slug": r["slug"], "name": r["name"], "figs": m["entries"][k]["f"]})
    rev_cache = {}
    for i, row in enumerate(rows):
        q = base_name(row["name"])
        row["query"] = q
        res = get_json("https://msearch.gsi.go.jp/address-search/AddressSearch?q=" + urllib.parse.quote(q))
        time.sleep(1.5)
        hits = []
        for f in res:
            t = f["properties"].get("title", "")
            if q not in t:
                continue  # 部分一致で別の地名を拾わない（題に検索語を含むものだけ）
            p = pref_of_title(t)
            if not p:
                lon, lat = f["geometry"]["coordinates"]
                key = (round(lon, 4), round(lat, 4))
                if key not in rev_cache and len([h for h in hits if h.get("rev")]) < 5:
                    try:
                        rv = get_json(f"https://mreversegeocoder.gsi.go.jp/reverse-geocoder/LonLatToAddress?lat={lat}&lon={lon}")
                        rev_cache[key] = PREF_CODE.get(str(rv.get("results", {}).get("muniCd", ""))[:2]) or ("他県" if rv.get("results") else None)
                    except Exception:  # noqa: BLE001
                        rev_cache[key] = None
                    time.sleep(1.5)
                p = rev_cache.get(key)
                hits.append({"title": t, "pref": p, "rev": True})
            else:
                hits.append({"title": t, "pref": p})
        prefs = sorted({h["pref"] for h in hits if h["pref"]})
        row["hit_prefs"] = prefs
        row["hits"] = [h["title"] + (f"〔逆ジオ→{h['pref']}〕" if h.get("rev") else "") for h in hits[:8]]
        row["judge"] = "判別不能（候補なし）" if not prefs else ("合う" if row["pref"] in prefs else "食い違い")
        print(f"{i + 1:2} {row['pref']} {row['no']:5} {row['name']}（検索「{q}」）→ {row['judge']} {prefs}")
    # 食い違い・判別不能: 図の中で記号に一番近い市町村名の文字
    for row in rows:
        if row["judge"] == "合う":
            continue
        fig = row["figs"][0]
        title_munis = [x for x in re.split(r"[／/]", m["figures"][str(fig)]["title"]) if x]
        with pdfplumber.open(os.path.join(a.pdf_dir, f"m_{fig:02d}.pdf")) as p:
            ws = [w for pg in p.pages[1:] for w in pg.extract_words()]
        cpos = [((w["x0"] + w["x1"]) / 2, (w["top"] + w["bottom"]) / 2) for w in ws if N(w["text"]) == row["no"]]
        labels = [w for w in ws if re.search(r"(市|町|村|区)$", w["text"]) and len(w["text"]) >= 2]
        near = sorted(((min(math.dist(c, ((w["x0"] + w["x1"]) / 2, (w["top"] + w["bottom"]) / 2)) for c in cpos), w["text"]) for w in labels), key=lambda x: x[0])[:3] if cpos else []
        row["nearest_labels"] = [(t, round(d, 1)) for d, t in near]
        row["figure_title_munis"] = title_munis
        print(f"   ↳ {row['no']} {row['name']}: 図 {fig}（{m['figures'][str(fig)]['title'][:40]}）・近い文字 {row['nearest_labels']}・候補 {row['hits'][:5]}")
    json.dump({"seed": a.seed, "rows": rows}, open(a.out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    from collections import Counter
    print(Counter(r["judge"] for r in rows))


if __name__ == "__main__":
    main()
