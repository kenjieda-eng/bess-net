# -*- coding: utf-8 -*-
"""
scripts/experimental/kansai/build_prefecture_map.py — 関西の変電所 No. → 府県 の対応表を、関西電力送配電の公表図から作る
（関西の府県の割り当て便・2026-11-07。11/4 の裁定 §3 の条件 1〜5・調べの報告 reports/kansai-prefecture-investigation-2026-11-04.md）

一次:
  - 「マッピング（154kV未満）」の一覧 https://www.kansai-td.co.jp/consignment/disclosure/distribution-equipment/mapping.html
    府県の見出し（h2）の下に、市町村の組ごとの PDF（154kv_less_mapping_NN.pdf・各 2 ページ・2 ページ目が図）。
    図の中に変電所の No.（「京A」「北CU」）が文字として入っている。
  - 「供給可能エリアマップ」 https://www.kansai-td.co.jp/consignment/welcome-zone-map/pdf/area_map.pdf
    変電所ごとの頁に住所（「大阪府富田林市別井２丁目付近」）。基幹系統の府県と、頭の字の合わない記号の確かめに使う。
★図に「所在地」とは書かれていない。府県は「その府県の図に No. が出る」ことによる（当サイトが所在地を確かめたのではない）。

割り当てる: ローカル系の No. が 1 つの府県の図にだけ出るもの。
割り当てない（府県なしのまま）:
  1. 2 府県以上の図に出る No.
  2. PDF 23（高島市／長浜市／米原市／関ケ原町（岐阜県））の記号のうち、図の中の「関ケ原町」の文字に、滋賀県の市の文字
     （高島市・長浜市・米原市）より近いもの。差が 10pt 未満のものも割り当てない。
  3. 頭の字の地域と見出しの府県が合わない記号（頭の字ごとに「1 府県だけに出る」件数を数え、5 件未満しか出ない府県との組）。
     別の一次（供給可能エリアマップの住所）で府県が確かめられたものだけ割り当てる。
  4. 文字の位置から組み立てないと拾えない記号・図で見つからない記号。
  基幹系統: 154kV 未満の図の対象外。供給可能エリアマップの住所で府県が決まるものだけ割り当てる。
版: 図と当サイトの両方にある No. だけ（当サイトは --site の詳細 JSON の凍結を除くレコード）。図にだけある記号は数えて報告する。

実行（リポジトリ直下・ネットワークは使わない。一次は先に curl で取っておく）:
  python -P scripts/experimental/kansai/build_prefecture_map.py --mapping-html=<mapping.html> --pdf-dir=<m_01.pdf…m_31.pdf>
      --area-map=<area_map.pdf> [--site=src/lib/generated/grid-detail/kansai.json] [--out=src/data/kansai-prefecture-map.json]
      [--detail=<詳細の判定 JSON（報告用・リポに入れない）>]
"""
import argparse, collections, html, json, math, os, re, sys, unicodedata
from datetime import datetime, timezone
import pdfplumber

sys.stdout.reconfigure(encoding="utf-8")
N = lambda s: unicodedata.normalize("NFKC", s or "").strip()  # noqa: E731
HEADS = "北南京神奈滋和姫"
CODE = re.compile(r"^[北南京神奈滋和姫][A-Z]{1,3}\d{0,2}$")  # 頭の字＋英字（＋数字。姫F1 など）。11/4 は英字だけ
MAPPING_URL = "https://www.kansai-td.co.jp/consignment/disclosure/distribution-equipment/mapping.html"
PDF_URL = "https://www.kansai-td.co.jp/interchange/takusou/pdf/154kv_less_mapping_{:02d}.pdf"
AREA_MAP_URL = "https://www.kansai-td.co.jp/consignment/welcome-zone-map/pdf/area_map.pdf"
SEKIGAHARA_PDF = 23
SHIGA_CITY_LABELS = ("高島市", "長浜市", "米原市")
SEKI_LABEL = "関ケ原"
MARGIN_PT = 10.0
HEAD_MIN = 5
KANSAI_PREFS = ("大阪府", "京都府", "兵庫県", "奈良県", "滋賀県", "和歌山県", "福井県", "三重県")


def parse_mapping(path):
    t = open(path, "rb").read().decode("utf-8", "replace")
    t = re.sub(r"<!--.*?-->", "", t, flags=re.S)
    figs, pref = {}, None
    for m in re.finditer(r"<h2[^>]*>(.*?)</h2>|<a[^>]*href=\"[^\"]*154kv_less_mapping_(\d+)\.pdf\"[^>]*>(.*?)</a>", t, re.S):
        if m.group(1) is not None:
            h = re.sub(r"\s+", "", html.unescape(re.sub(r"<[^>]+>", "", m.group(1))))
            pref = re.sub(r"（一部）$", "", h)
            continue
        no = int(m.group(2))
        title = re.sub(r"\s*\[[^\]]*\]\s*$", "", re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", m.group(3)))).strip())
        if pref not in KANSAI_PREFS:
            raise SystemExit(f"見出しが想定の外: {pref}（PDF {no}）")
        figs[no] = {"pref": pref, "title": title, "url": PDF_URL.format(no)}
    if sorted(figs) != list(range(1, 32)):
        raise SystemExit(f"PDF の本数が 31 でない: {sorted(figs)}")
    return figs


def center(w):
    return ((w["x0"] + w["x1"]) / 2, (w["top"] + w["bottom"]) / 2)


def read_figures(pdf_dir, figs):
    clean = collections.defaultdict(set)      # No. → PDF 番号
    pos = collections.defaultdict(list)       # (PDF 番号, No.) → 中心の座標
    built = collections.defaultdict(set)
    asof, labels = {}, {}
    for no in figs:
        with pdfplumber.open(os.path.join(pdf_dir, f"m_{no:02d}.pdf")) as p:
            words = []
            for pg in p.pages[1:]:
                ws = pg.extract_words()
                words += ws
                cs = [c for c in pg.chars if c["text"].strip()]
                letters = [c for c in cs if re.fullmatch(r"[A-ZＡ-Ｚ]", c["text"])]
                for c in cs:  # 文字の位置から組み立てる（横書き・縦書き）＝ 11/4 の map2.py と同じ。数えるだけで割り当てには使わない
                    if c["text"] not in HEADS:
                        continue
                    sz = max(c["size"], 4)
                    for mode in ("h", "v"):
                        code, cur = c["text"], c
                        while len(code) < 4:
                            if mode == "h":
                                nx = [l for l in letters if abs(l["top"] - cur["top"]) < sz * 0.4 and 0 <= l["x0"] - cur["x1"] < sz * 0.6]
                            else:
                                nx = [l for l in letters if abs(l["x0"] - cur["x0"]) < sz * 0.6 and 0 <= l["top"] - cur["bottom"] < sz * 0.6]
                            if len(nx) != 1:
                                break
                            cur = nx[0]
                            code += N(cur["text"])
                        if len(code) >= 2:
                            built[N(code)].add(no)
            txt = " ".join(w["text"] for w in words)
            ds = sorted(set(re.sub(r"\s", "", d) for d in re.findall(r"（(\d{4}年\s*\d{1,2}月\s*\d{1,2}日)\s*時点）", txt)))
            asof[no] = ds
            for w in words:
                t = N(w["text"])
                if CODE.match(t):
                    clean[t].add(no)
                    pos[(no, t)].append(center(w))
            if no == SEKIGAHARA_PDF:
                labels = {k: [center(w) for w in words if k in w["text"]] for k in SHIGA_CITY_LABELS + (SEKI_LABEL,)}
    return clean, pos, built, asof, labels


def read_area_map(path):
    """供給可能エリアマップ: 頁ごとに「〇〇変電所」と「府県…付近」の住所（11/4 の check.py と同じ取り方）"""
    addr = {}
    with pdfplumber.open(path) as p:
        for i, pg in enumerate(p.pages):
            t = pg.extract_text() or ""
            m = re.search(r"([^\s　「」【】（）]{1,10})変電所", t)
            a = re.search(r"((?:大阪府|京都府|兵庫県|奈良県|滋賀県|和歌山県|福井県|三重県|岐阜県)[^\s]{2,22}付近)", t)
            if a and m and m.group(1) not in addr:
                addr[m.group(1)] = {"address": a.group(1), "pref": re.match(r"(大阪府|京都府|兵庫県|奈良県|滋賀県|和歌山県|福井県|三重県|岐阜県)", a.group(1)).group(1), "page": i + 1}
    return addr


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--mapping-html", required=True)
    ap.add_argument("--pdf-dir", required=True)
    ap.add_argument("--area-map", required=True)
    ap.add_argument("--site", default="src/lib/generated/grid-detail/kansai.json")
    ap.add_argument("--frozen", default="src/data/substations-frozen.json")
    ap.add_argument("--out", default="src/data/kansai-prefecture-map.json")
    ap.add_argument("--detail", default=None)
    a = ap.parse_args()

    figs = parse_mapping(a.mapping_html)
    clean, pos, built, asof, labels = read_figures(a.pdf_dir, figs)
    all_asof = sorted({d for ds in asof.values() for d in ds})
    if len(all_asof) != 1:
        raise SystemExit(f"図の時点が 1 つでない: {all_asof}")
    addr = read_area_map(a.area_map)

    frozen = set(json.load(open(a.frozen, encoding="utf-8"))["frozen"])
    site = [r for r in json.load(open(a.site, encoding="utf-8")).values() if r["slug"] not in frozen and r.get("area") and "関西" in r["area"]]
    eid = lambda r: N(r.get("external_id"))  # noqa: E731
    local = [r for r in site if "_local_" in eid(r)]
    kikan = [r for r in site if "_kikan_" in eid(r)]
    no_of = lambda r: eid(r).split("_", 2)[-1]  # noqa: E731
    site_nos = {no_of(r) for r in local}

    # ── 判定（1 No. ずつ。同じ No. の行は同じ判定）──
    judge, detail = {}, {}
    seki = []
    for no in sorted(site_nos):
        pdfs = clean.get(no, set())
        if not pdfs:
            judge[no] = "組み立て" if no in built else "見つからない"
            continue
        prefs = {figs[i]["pref"] for i in pdfs}
        if len(prefs) >= 2:
            judge[no] = "2府県以上"
            detail[no] = {"pdfs": sorted(pdfs), "prefs": sorted(prefs)}
            continue
        pref = prefs.pop()
        detail[no] = {"pdfs": sorted(pdfs), "pref": pref}
        if SEKIGAHARA_PDF in pdfs:
            pts = pos[(SEKIGAHARA_PDF, no)]
            d_seki = min(math.dist(p, q) for p in pts for q in labels[SEKI_LABEL]) if labels[SEKI_LABEL] else math.inf
            d_city = {k: min(math.dist(p, q) for p in pts for q in labels[k]) if labels[k] else math.inf for k in SHIGA_CITY_LABELS}
            d_shiga = min(d_city.values())
            row = {"no": no, "d_seki": round(d_seki, 1), **{f"d_{k}": round(v, 1) for k, v in d_city.items()}, "margin": round(d_shiga - d_seki, 1)}
            # 関ケ原町の文字のほうが近い、または差（の大きさ）が 10pt 未満なら割り当てない
            if d_seki < d_shiga or abs(d_shiga - d_seki) < MARGIN_PT:
                row["judge"] = "関ケ原（割り当てない）"
                judge[no] = "関ケ原"
            else:
                row["judge"] = "滋賀県（割り当てる候補）"
            seki.append(row)
            if judge.get(no) == "関ケ原":
                continue
        judge[no] = "候補"
    # 頭の字と府県の組（候補だけで数える）
    pair = collections.Counter((no[0], detail[no]["pref"]) for no, j in judge.items() if j == "候補")
    names = collections.defaultdict(set)
    for r in local:
        names[no_of(r)].add(r["name"])
    head_fixed = []
    for no, j in list(judge.items()):
        if j != "候補":
            continue
        if pair[(no[0], detail[no]["pref"])] < HEAD_MIN:
            hit = [addr[n] for n in names[no] if n in addr]
            if hit and all(h["pref"] == detail[no]["pref"] for h in hit):
                judge[no] = "割り当て（図＋住所）"
                head_fixed.append({"no": no, "names": sorted(names[no]), "pref": detail[no]["pref"], "address": hit[0]["address"], "page": hit[0]["page"]})
            else:
                judge[no] = "頭の字が合わない"
        else:
            judge[no] = "割り当て（図）"

    # 図にだけある記号（版のずれ・凍結・頭の字の違う記号の拾い違いを含む）
    fig_only = sorted(set(clean) - site_nos)

    # ── 基幹系統: 住所で決まるもの ──
    kikan_assign = {}
    for r in kikan:
        h = addr.get(r["name"])
        if h:
            kikan_assign[eid(r)] = {"slug": r["slug"], "name": r["name"], **h}

    # ── 出力 ──
    fig_meta = {str(i): {"pref": f["pref"], "title": f["title"], "url": f["url"]} for i, f in figs.items()}
    asof_iso = datetime.strptime(all_asof[0], "%Y年%m月%d日").strftime("%Y-%m-%d")
    entries = {}
    for r in local:
        no = no_of(r)
        j = judge.get(no, "")
        if j.startswith("割り当て"):
            pdfs = detail[no]["pdfs"]
            entries[eid(r)] = {"p": detail[no]["pref"], "b": "図" if j == "割り当て（図）" else "図＋住所", "f": pdfs}
    for k, v in kikan_assign.items():
        entries[k] = {"p": v["pref"], "b": "住所", "a": v["address"], "pg": v["page"]}
    by_pref = collections.Counter(e["p"] for e in entries.values())
    by_pref_records = collections.Counter(entries[eid(r)]["p"] for r in local + kikan if eid(r) in entries)
    cats = collections.Counter(judge[no_of(r)] for r in local)
    out = {
        "_purpose": "関西電力送配電の変電所の府県（表示用）。microCMS の prefecture は書き換えない（L-EIC-028）。"
                    "表示の府県は src/lib/grid-prefecture.ts の normalizeSubstationPlace の 1 か所で、この表から導出する（#119）。"
                    "ローカル系は関西電力送配電『マッピング（154kV未満）』の府県別の図に No. が 1 つの府県の図にだけ出るもの、"
                    "基幹系統は同社『供給可能エリアマップ』の住所で府県が決まるものだけ。図に「所在地」とは書かれていない。",
        "_rebuild": "python -P scripts/experimental/kansai/build_prefecture_map.py --mapping-html=… --pdf-dir=… --area-map=…（一次は curl で先に取る）",
        "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": {
            "mapping": {"url": MAPPING_URL, "asof": asof_iso, "label": f"（{all_asof[0]}時点）"},
            "area_map": {"url": AREA_MAP_URL, "asof_label": "2026年9月時点"},
        },
        "figures": fig_meta,
        "counts": {
            "local_records": len(local),
            "local_assigned_records": sum(1 for r in local if eid(r) in entries),
            "kikan_records": len(kikan),
            "kikan_assigned_records": sum(1 for r in kikan if eid(r) in entries),
            "by_category_records": dict(sorted(cats.items())),
            "by_pref_records": dict(sorted(by_pref_records.items())),
            "entries": len(entries),
            "figure_only_codes": len(fig_only),
        },
        "excluded": {k: sorted({no_of(r) for r in local if judge[no_of(r)] == k})
                     for k in ("2府県以上", "関ケ原", "頭の字が合わない", "組み立て", "見つからない")},
        "entries": dict(sorted(entries.items())),
    }
    json.dump(out, open(a.out, "w", encoding="utf-8", newline="\n"), ensure_ascii=False, indent=1)
    open(a.out, "a", encoding="utf-8", newline="\n").write("\n")
    if a.detail:
        json.dump({"seki": seki, "labels": {k: [list(map(lambda x: round(x, 1), p)) for p in v] for k, v in labels.items()},
                   "pair": {f"{h}→{p}": n for (h, p), n in sorted(pair.items())}, "head_fixed": head_fixed,
                   "fig_only": {c: sorted(clean[c]) for c in fig_only}, "asof": asof, "addr": addr,
                   "kikan_assign": kikan_assign, "detail": detail, "judge": judge},
                  open(a.detail, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print(f"図の時点 {all_asof}・図の記号 {len(clean)} 種・図にだけある記号 {len(fig_only)} {fig_only}")
    print(f"ローカル系 {len(local)} 行（No. {len(site_nos)} 種）: {dict(sorted(cats.items()))}")
    print(f"割り当て: ローカル系 {out['counts']['local_assigned_records']} 行・基幹系統 {out['counts']['kikan_assigned_records']} 行（{len(kikan_assign)} 種）")
    print(f"府県別（行）: {dict(sorted(by_pref_records.items()))}")
    print(f"頭の字と府県の組: {dict(sorted((f'{h}→{p}', n) for (h, p), n in pair.items()))}")
    print(f"関ケ原の判定 {len(seki)} 件: 割り当てない {sum(1 for s in seki if s['judge'].startswith('関ケ原'))}")
    print(f"頭の字が合わないうち住所で確かめた {len(head_fixed)}: {head_fixed}")
    print(f"-> {a.out}")


if __name__ == "__main__":
    main()
