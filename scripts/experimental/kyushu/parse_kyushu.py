# -*- coding: utf-8 -*-
"""
scripts/experimental/kyushu/parse_kyushu.py

九州電力送配電 予想潮流等 最新版の dry-run 差分レポート。
★microCMS への書込は一切行わない（baseline は fetch_baseline.py が GET 済みのローカルJSON）。

使い方:
  python scripts/experimental/kyushu/parse_kyushu.py --dry-run

── 実データで確定させた設計（BR依頼書・推測しない）──
[取得元] 公表ページのリンクを実確認（L-EIC-019）。九州はURLが更新ごとに変わる社。
  2026-08-19 実確認: 変圧器CSV = /var/rev0/0900/4948/td_rHc7Jd0i.zip（33,496B・アンカー
  「変圧器CSV（zipファイル）（33KB）」で特定）。送電線CSV（td_Ldi9oHd7.zip）は対象外。
  旧リンク td_cdujh4te.zip は 404（area-meta のサンプル直リンク更新が本実行で必要）。

[ZIP構造] 31メンバー構成を維持（地区1〜30＋離島①〜④統合1本・全て cp932）。
  初期取込の「31地区」と同一。ディレクトリentry 1つを除き 31 CSV。

[版] メンバーのメタ行（行0）が実版: 07-27更新×14・07-28更新×17 の**2種に割れる**
  → last_updated はレコード単位（中国・北海道の前例）。公表ページの「7月31日更新」は掲載日。

[突合キー] external_id = kyuden_{NN}_{No原文}。NN はメンバー列挙順（01..31）。
  実証: 初期取込の地区番号は「ZIPメンバーの列挙順」で、現行ZIPも同順（名前集合の重なりで
  旧31↔新31 の完全な全単射を確認、旧16=★22熊本 に南関 No45 が実在）。
  eid再構成での一致 876/877（名称不一致は待金→侍金の1件のみ・要判断）。
  eid は両側で一意（枝番 (1)(2) 込みで重複0）→ eid を主キー、名称(NFKC)クロスチェック。

[名称] 括弧付き電圧（一の勢(22kV)・人吉（110ｋＶ）等・全半角混在）は**中身を保持**。
  格納は原文 trim のみ。突合の比較のみ NFKC（括弧の全半角を吸収・中身は残る）。

[#120] ホワイトリスト: No.欄が `数字` または `数字(数字)` の行だけ通す。
  「全項目null」を除外条件にしない（kyu-500 南関＝全欄空の実在変電所を守る）。
  ★実測で No.欄「-」の行が1件（地区12 武雄 110/66・値全て空）→ 除外し要判断に計上。

[#111/#117] dedupe はルール①のみ・電圧面込み複合判定。ルール②不使用。
"""
import argparse, csv, io, json, re, sys, unicodedata, zipfile
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402
from frozen import drop_frozen  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "src"
ZIP_NAME = "td_rHc7Jd0i.zip"
ZIP_URL = "https://www.kyuden.co.jp/var/rev0/0900/4948/td_rHc7Jd0i.zip"
BASELINE = HERE / "baseline_live.json"
REPORT_MD = Path("reports/grid-kyushu-dryrun-2026-08-19.md")
REPORT_JSON = Path("reports/grid-kyushu-dryrun-2026-08-19.json")
N1_OUT = HERE.parent / "_common" / "n1_undetermined_kyushu.json"

NO_RE = re.compile(r"^\d+(\(\d+\))?$")
NFKC = lambda s: unicodedata.normalize("NFKC", (s or "")).strip()  # noqa: E731
clean_name = lambda s: (s or "").strip()  # noqa: E731  # 格納は原文（括弧の中身・全半角を保持）


def to_float(v):
    s = NFKC(v).replace(",", "")
    return float(s) if re.fullmatch(r"-?\d+(\.\d+)?", s) else None


def to_int(v):
    f = to_float(v)
    return int(f) if f is not None else None


def parse_n1(v):
    s = NFKC(v)
    if not s or s in ("-", "―", "ー"):
        return None
    if s.startswith("不可"):
        return False
    if s.startswith("可"):
        return True
    return None


def parse_oc(v):
    s = NFKC(v)
    if not s or s in ("-", "―", "ー"):
        return None
    if "有" in s:
        return "有り"
    if "無" in s or "な" in s:
        return "なし"
    return None


def vkey(a, b):
    f = lambda x: f"{float(x):g}" if x is not None else "-"  # noqa: E731
    return f"{f(a)}/{f(b)}"


def parse_version(s):
    m = re.search(r"(\d{4})年(\d{1,2})月(\d{1,2})日", NFKC(s))
    return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}" if m else None


def member_disp(n):
    try:
        return n.encode("cp437").decode("cp932")
    except Exception:
        return n


def load_zip():
    zf = zipfile.ZipFile(SRC / ZIP_NAME)
    names = [n for n in zf.namelist() if n.endswith(".csv")]
    files, rows, skipped = [], [], []
    for idx, n in enumerate(names, 1):
        nn = f"{idx:02d}"
        raw = zf.read(n)
        enc = None
        for e in ("utf-8-sig", "cp932", "utf-8"):
            try:
                t = raw.decode(e, errors="strict")
                enc = e
                break
            except UnicodeDecodeError:
                continue
        rs = list(csv.reader(io.StringIO(t)))
        ver = parse_version(rs[0][0]) if rs and rs[0] else None
        cnt = 0
        for r in rs[1:]:
            if not r or len(r) < 14:
                continue
            no_raw = (r[0] or "").strip()
            no = NFKC(no_raw)
            if not no or no == "変電所No":
                continue
            if not NO_RE.fullmatch(no):
                skipped.append({"district": nn, "member": member_disp(n)[8:40], "no": no[:30],
                                "name": clean_name(r[1]),
                                "voltage": f"{NFKC(r[2])}/{NFKC(r[3])}",
                                "reason": "No.欄が設備No（数字・数字(枝番)）の形をしていない"})
                continue
            rows.append({
                "district": nn, "no": no, "external_id": f"kyuden_{nn}_{no}",
                "member": member_disp(n),
                "name": clean_name(r[1]),
                "voltage_primary_kv": to_float(r[2]),
                "voltage_secondary_kv": to_float(r[3]),
                "units": to_int(r[4]),
                "capacity_total_mw": to_float(r[5]),
                "cap_operational_mw": to_float(r[6]),
                "op_constraint": (lambda v: None if v in ("", "-", "―", "ー") else v)(NFKC(r[7])),
                "forecast_flow_mw": to_float(r[8]),
                "cap_avail_mw": to_float(r[9]),
                "cap_avail_upper_mw": to_float(r[10]) if len(r) > 10 else None,
                "n1_eligible": parse_n1(r[11]) if len(r) > 11 else None,
                "n1_capacity_mw": to_float(r[12]) if len(r) > 12 else None,
                "oc_possibility": parse_oc(r[13]) if len(r) > 13 else None,
                "last_updated": ver,
            })
            cnt += 1
        files.append({"district": nn, "member": member_disp(n), "bytes": len(raw),
                      "encoding": enc, "version": ver, "data_rows": cnt})
    return files, rows, skipped


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--emit-plan", action="store_true")
    args = ap.parse_args()

    R = {"generated_on": str(date.today()), "area": "九州", "operator": "九州電力送配電",
         "scope": "dry-run（差分レポートのみ・microCMS 書込ゼロ）",
         "zip": {"url": ZIP_URL, "note": "公表ページのアンカー「変圧器CSV（zipファイル）」を実確認して特定。"
                                          "旧リンク td_cdujh4te.zip は 404（本実行で area-meta 更新要）"},
         "files": [], "warnings": [], "requires_judgement": []}

    print("=== 1. 取得ZIP・メンバー構成・encoding 実測 ===")
    files, raw_rows, skipped = load_zip()
    R["files"] = files
    zip_bytes = (SRC / ZIP_NAME).stat().st_size
    print(f"  {ZIP_URL}  {zip_bytes:,}B")
    vers = {}
    for f in files:
        vers.setdefault(f["version"], []).append(f["district"])
    for f in files[:6]:
        print(f"  地区{f['district']} {f['member'][8:36]:<30} {f['bytes']:5d}B {f['encoding']} 版={f['version']} 行{f['data_rows']}")
    print(f"  … 計{len(files)}メンバー（31地区構成を維持・初期取込と同一）")
    print(f"  生データ行 合計 {len(raw_rows)}件")
    print(f"  版の分布: " + " / ".join(f"{v}×{len(d)}地区" for v, d in sorted(vers.items())))
    R["zip"]["bytes"] = zip_bytes
    R["zip"]["members"] = len(files)
    R["version"] = {"当方(現行)": "2026-04-28", "新": sorted(vers),
                    "split": {v: d for v, d in sorted(vers.items())},
                    "メンバー割れ": len(vers) > 1,
                    "扱い": "レコード単位の last_updated（中国・北海道の前例）。ページ表記の7/31は掲載日",
                    }

    print(f"\n=== 2. #120 注記行の除外（ホワイトリスト）: {len(skipped)}件 ===")
    for s_ in skipped:
        print(f"    - 地区{s_['district']} No=『{s_['no']}』 名={s_['name']} 電圧={s_['voltage']} ← {s_['reason']}")
    R["excluded_note_rows"] = {"count": len(skipped), "rows": skipped}

    # ── baseline（#113）──
    base = json.load(open(BASELINE, encoding="utf-8"))
    base = drop_frozen(base)
    for b in base:
        for k in ("cap_avail_mw", "cap_avail_upper_mw", "cap_operational_mw", "capacity_total_mw",
                  "forecast_flow_mw", "n1_capacity_mw", "units",
                  "voltage_primary_kv", "voltage_secondary_kv"):
            b.setdefault(k, None)
        oc = b.get("oc_possibility")
        b["oc_possibility"] = (oc[0] if isinstance(oc, list) and oc else None)

    kept, removed_dup = apply_series_dedup(
        raw_rows, {b.get("external_id") for b in base},
        enable_baseline_name_rule=False,   # #117
        key_id="external_id", key_name="name",
        value_keys=("voltage_primary_kv", "voltage_secondary_kv",
                    "cap_operational_mw", "forecast_flow_mw", "capacity_total_mw", "units"),
        group_key="district",
    )
    print(f"\n=== 3. 重複除去（#111・電圧面込み複合判定）: {len(raw_rows)} -> {len(kept)}"
          f"（除去 {len(removed_dup)}件 {summarize(removed_dup)}）===")
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(removed_dup),
                   "rule2": "不使用（#117）",
                   "examples": [{"external_id": e.get("external_id"), "name": e.get("name")}
                                for e in removed_dup[:5]]}

    # ── 突合（主キー: 再構成eid。名称(NFKC)クロスチェック）──
    print("\n=== 4. 突合（主キー: kyuden_{列挙順NN}_{No}／名称クロスチェック）===")
    numeq = lambda x, y: (x is None and y is None) or (  # noqa: E731
        x is not None and y is not None and abs(float(x) - float(y)) < 1e-6)
    bidx = {NFKC(b.get("external_id")): b for b in base}
    used, matched, new_rows, renamed = set(), [], [], []
    for r in kept:
        b = bidx.get(NFKC(r["external_id"]))
        if b is None or id(b) in used:
            new_rows.append(r)
            continue
        used.add(id(b))
        matched.append((b, r))
        if NFKC(b.get("name")) != NFKC(r["name"]):
            renamed.append({"slug": b["slug"], "external_id": b.get("external_id"),
                            "old_name": clean_name(b.get("name")), "new_name": r["name"],
                            "prefecture": b.get("prefecture"),
                            "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])})
    removed = [b for b in base if id(b) not in used]
    print(f"  マッチ {len(matched)} / 新規候補 {len(new_rows)} / 消滅候補 {len(removed)} / 名称変更 {len(renamed)}")
    for x in renamed:
        print(f"    ★同一No.で名称変更（要判断・ブロック）: {x['slug']} {x['external_id']} "
              f"『{x['old_name']}』->『{x['new_name']}』（{x['prefecture']}・{x['voltage']}）")

    # ── 枝番の振り直し（関西 滋D型）: 新規×消滅で 名称＋電圧面＋設備容量 が一致 ──
    renumber = []
    for r in list(new_rows):
        for b in list(removed):
            if (NFKC(b.get("name")) == NFKC(r["name"])
                    and vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"])
                    == vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])):
                renumber.append({"slug": b["slug"], "name": r["name"],
                                 "old_external_id": b.get("external_id"),
                                 "new_external_id": r["external_id"],
                                 "prefecture": b.get("prefecture"),
                                 "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])})
                new_rows.remove(r)
                removed.remove(b)
                matched.append((b, r))
                break
    if renumber:
        print(f"  ★枝番/No.の振り直し {len(renumber)}件（slug維持・external_id更新＝要判断）")
        for x in renumber:
            print(f"    {x['slug']} 「{x['name']}」 {x['old_external_id']} -> {x['new_external_id']}（{x['voltage']}）")

    # ── §3-a 南関の残存確認 ──
    nankan = [(b, r) for b, r in matched if b["slug"] == "kyu-500"]
    print("\n=== 5. kyu-500 南関の残存確認（§3-a・#120の由来設備）===")
    if nankan:
        b, r = nankan[0]
        allnull = all(r.get(k) is None for k in
                      ("voltage_primary_kv", "voltage_secondary_kv", "units", "capacity_total_mw",
                       "cap_operational_mw", "cap_avail_mw", "n1_capacity_mw"))
        print(f"  残存 OK: 地区16 No45 名称=南関 新CSVでも全設備値が空（{allnull}）→ ホワイトリストが名称ありの行を保護")
        R["nankan"] = {"survives": True, "all_values_null_in_new": allnull,
                       "external_id": b.get("external_id")}
    else:
        print("  ★南関がマッチしていない（要調査）")
        R["nankan"] = {"survives": False}
        R["warnings"].append("★kyu-500 南関がマッチしていない")

    # ── フィールド差分 ──
    FIELDS = [("cap_avail_mw", "空き容量(当該)"), ("cap_avail_upper_mw", "空容量(上位系等)"),
              ("cap_operational_mw", "運用容量"), ("capacity_total_mw", "設備容量"),
              ("forecast_flow_mw", "予想潮流"), ("n1_capacity_mw", "N-1電制適用可能量"),
              ("units", "台数")]
    field_stats, changed_slugs = {}, set()
    for key, label in FIELDS:
        chg = filled = lost = 0
        for b, r in matched:
            ov, nv = b.get(key), r.get(key)
            if nv is None and ov is not None:
                lost += 1
                continue
            if ov is None and nv is not None:
                filled += 1
                changed_slugs.add(b["slug"])
                continue
            if ov is not None and nv is not None and not numeq(ov, nv):
                chg += 1
                changed_slugs.add(b["slug"])
        field_stats[label] = {"変化": chg, "新規充足": filled, "新CSVで欠落(現値維持)": lost}
    print("\n=== 6. フィールド差分 ===")
    for label, s_ in field_stats.items():
        print(f"  {label:18s} 変化{s_['変化']:5d} 新規充足{s_['新規充足']:5d} 欠落(現値維持){s_['新CSVで欠落(現値維持)']:5d}")

    dec, inc, zeroed = [], [], []
    for b, r in matched:
        ov, nv = b.get("cap_avail_mw"), r.get("cap_avail_mw")
        if ov is None or nv is None or numeq(ov, nv):
            continue
        rec = {"slug": b["slug"], "name": clean_name(b.get("name")),
               "prefecture": b.get("prefecture"),
               "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
               "from": ov, "to": nv, "delta": round(nv - ov, 3)}
        (dec if nv < ov else inc).append(rec)
        if nv <= 0 < ov:
            zeroed.append(rec)
    dec.sort(key=lambda x: x["delta"])
    inc.sort(key=lambda x: -x["delta"])
    print(f"\n=== 7. 空き容量: 減少 {len(dec)}件（うちゼロ化 {len(zeroed)}）／増加 {len(inc)}件 ===")
    for x in dec[:10]:
        print(f"    down {x['name']}（{x['prefecture']}・{x['voltage']}）{x['from']} -> {x['to']} MW")

    # ── N-1・出力制御 ──
    n1_und = [{"operator": "九州電力送配電", "area": "九州", "slug": b["slug"],
               "external_id": b.get("external_id"), "name": clean_name(b.get("name")),
               "prefecture": b.get("prefecture"), "stored_n1_eligible": b.get("n1_eligible"),
               "source": f"td_rHc7Jd0i.zip（{r.get('last_updated')}更新）"}
              for b, r in matched if r.get("n1_eligible") is None and b.get("n1_eligible") is not None]
    oc_und = sum(1 for b, r in matched if r.get("oc_possibility") is None and b.get("oc_possibility") is not None)
    n1_chg = [{"slug": b["slug"], "name": clean_name(b.get("name")),
               "from": b.get("n1_eligible"), "to": r.get("n1_eligible")}
              for b, r in matched
              if r.get("n1_eligible") is not None and b.get("n1_eligible") != r.get("n1_eligible")]
    n1_ok_new = sum(1 for r in kept if r.get("n1_eligible") is True)
    n1_zero_ok = sum(1 for r in kept if r.get("n1_eligible") is True and (r.get("n1_capacity_mw") or 0) == 0)
    print(f"=== 8. N-1: 新データ可 {n1_ok_new}件（うち0MW可 {n1_zero_ok}）／可否変化 {len(n1_chg)}件 "
          f"／未算定(現値維持) {len(n1_und)}件 ／出力制御未算定 {oc_und}件 ===")
    N1_OUT.write_text(json.dumps({"count": len(n1_und), "entries": n1_und}, ensure_ascii=False, indent=1),
                      encoding="utf-8")

    # ── 県別（matched ベース。新規は県未確定＝裁定事項）──
    by_pref = {}
    for b, r in matched:
        p = b.get("prefecture") or "（未設定）"
        by_pref[p] = by_pref.get(p, 0) + 1
    total_after = len(base) + len(new_rows) - len(removed)
    pct = (total_after - len(base)) / len(base) * 100
    print(f"\n=== 9. 県別（matched）: {by_pref} ／ 取込後想定 {total_after}（{pct:+.1f}%）===")

    # ── 新規の県候補（地区の多数決・裁定資料）──
    dist_pref = {}
    for b in base:
        m = re.match(r"kyuden_(\d+)_", b.get("external_id") or "")
        if m:
            dist_pref.setdefault(m.group(1), {}).setdefault(b.get("prefecture"), 0)
            dist_pref[m.group(1)][b.get("prefecture")] += 1
    new_detail = []
    for r in new_rows:
        cands = dist_pref.get(r["district"], {})
        maj = max(cands.items(), key=lambda x: x[1])[0] if cands else None
        new_detail.append({"external_id": r["external_id"], "name": r["name"],
                           "district": r["district"], "member": r["member"][8:30],
                           "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                           "units": r["units"], "capacity_total_mw": r["capacity_total_mw"],
                           "cap_avail_mw": r["cap_avail_mw"],
                           "prefecture_candidate": maj,
                           "district_pref_mix": cands})
    print("\n=== 10. 新規（追加は裁定事項）===")
    for x in new_detail:
        print(f"  {x['external_id']:<20} {x['name']:<12} {x['voltage']:>8} 県候補={x['prefecture_candidate']}"
              f"{'（地区に複数県あり: ' + str(x['district_pref_mix']) + '）' if len(x['district_pref_mix']) > 1 else ''}")

    if renamed:
        R["requires_judgement"].append(
            f"同一No.で名称変更 {len(renamed)}件（待金→侍金・字修正の可能性）→ 上書きせず要判断（ブロック）")
    if renumber:
        R["requires_judgement"].append(
            f"枝番の振り直し {len(renumber)}件（バンク分割掲載に伴う No→No(1)）→ slug維持で external_id 更新するか")
    if new_rows:
        R["requires_judgement"].append(
            f"新規 {len(new_rows)}件（枝番分割の新バンク2＋真正新規4）→ 追加と県の付与は裁定事項")
    if skipped:
        R["requires_judgement"].append(
            f"No.欄が『-』の行 {len(skipped)}件（地区12 武雄 110/66・全設備値空）→ 参照行と推定・取り込まない扱いでよいか")
    if removed:
        R["requires_judgement"].append(f"消滅 {len(removed)}件 → 301/凍結の方針判断")
    if abs(pct) > 10:
        R["warnings"].append(f"★総数が現行から {pct:+.1f}%（±10%超）")

    R.update({
        "join_key": {
            "確定": "external_id = kyuden_{NN}_{No原文}（NN=メンバー列挙順01..31）。名称(NFKC)クロスチェック",
            "地区番号の変化": "★番号（ファイル名の地区番号）とは不一致だが、初期取込の付番は"
                              "『メンバー列挙順』であり現行ZIPも同順＝旧31↔新31の完全な全単射を"
                              "名前集合の重なりで確認（旧16=★22熊本・南関No45で実証）。eidはそのまま使える",
            "一意性": "両側とも重複0（枝番 (1)(2) 込み）",
            "名称の正規化": "格納は原文trim（括弧付き電圧・全半角を保持）。比較のみ NFKC",
        },
        "counts": {"baseline": len(base), "raw": len(raw_rows), "dedup": len(kept),
                   "matched": len(matched), "new": len(new_rows), "removed": len(removed),
                   "renamed": len(renamed), "renumbered": len(renumber),
                   "changed_records": len(changed_slugs), "total_after": total_after,
                   "pct": round(pct, 2)},
        "by_pref_matched": by_pref,
        "field_stats": field_stats,
        "cap_avail": {"decreased": len(dec), "zeroed": len(zeroed), "increased": len(inc),
                      "top_decreases": dec[:10], "top_increases": inc[:5]},
        "n1": {"ok_new": n1_ok_new, "zero_ok": n1_zero_ok, "changed": len(n1_chg),
               "changes": n1_chg[:12], "undetermined": len(n1_und)},
        "oc_undetermined": oc_und,
        "renamed_same_no": renamed,
        "renumbered": renumber,
        "new_records_detail": new_detail,
        "disappeared_records": [{"slug": b["slug"], "external_id": b.get("external_id"),
                                 "name": clean_name(b.get("name")),
                                 "prefecture": b.get("prefecture"),
                                 "cap_avail_mw": b.get("cap_avail_mw")} for b in removed],
        "missing_groups": {
            "conclusion": "北海道・関西型の『丸ごと欠け』なし。現行ZIPの31メンバーは初期取込の31地区と"
                          "完全な全単射で、当方に無いのは個別9行（枝番分割4＋真正新規4＋No.『-』の武雄1）のみ。"
                          "500kV系12件（苓北等）も県付きで収録済み・全件マッチ。"},
    })

    REPORT_JSON.parent.mkdir(parents=True, exist_ok=True)
    REPORT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")

    # ── Markdown ──
    L = []
    A = L.append
    A(f"# 九州電力送配電 予想潮流等 取込 dry-run（{R['generated_on']}）\n")
    A("**microCMS への書込はゼロ**（baseline は GET のみ）。本実行は未実施。\n")
    A("## 1. 取得ZIP（実確認した現行URL）・メンバー構成\n")
    A(f"- URL: `{ZIP_URL}`（**{zip_bytes:,}B**・公表ページのアンカー「変圧器CSV（zipファイル）」を実確認して特定）")
    A("- 旧リンク `td_cdujh4te.zip` は **404**（本実行で area-meta のサンプル直リンク更新が必要）")
    A(f"- メンバー: **31 CSV**（地区1〜30＋離島①〜④統合1本）＝初期取込の31地区構成を**維持**。encoding は全メンバー cp932（strict実測）\n")
    A("## 2. 版\n")
    A(f"当方 **2026/4/28** → 新 **2026/7/27（14地区）・2026/7/28（17地区）の2種**（メンバーのメタ行が実版）。")
    A("**メンバー割れあり → last_updated はレコード単位**（中国・北海道の前例）。公表ページの「2026年7月31日更新」は掲載日。\n")
    A("## 3. 行数・除外\n")
    A(f"生 **{len(raw_rows)}** 行 → dedupe 後 **{len(kept)}** 行（除去 {len(removed_dup)}件）"
      f"／`series_dedup` ルール②不使用（#117）")
    A(f"\n注記行の除外 **{len(skipped)}件**（#120 ホワイトリスト）:\n")
    if skipped:
        A("| 地区 | No.欄 | 名称 | 電圧 | 理由 |")
        A("|---|---|---|---|---|")
        for s_ in skipped:
            A(f"| {s_['district']} | `{s_['no']}` | {s_['name']} | {s_['voltage']} | {s_['reason']} |")
        A("\n> 地区12（★19武雄）の No.『-』行は名称=武雄・110/66kV・全設備値空。既存の武雄（複数バンク収録済み）"
          "への参照行と推定されるが、取り込まない扱いでよいかは要判断に計上。")
    A("\n## 4. 突合キー\n")
    for k, v in R["join_key"].items():
        A(f"- **{k}**: {v}")
    A("\n## 5. 増減\n")
    A("| 区分 | 件数 |")
    A("|---|---:|")
    A(f"| baseline（microCMS GET・#113） | {len(base)} |")
    A(f"| 新CSV（dedupe後） | {len(kept)} |")
    A(f"| マッチ | {len(matched)} |")
    A(f"| 新規 | {len(new_rows)} |")
    A(f"| 消滅 | {len(removed)} |")
    A(f"| 同一No.名称変更（★ブロック） | {len(renamed)} |")
    A(f"| 枝番の振り直し（★要判断） | {len(renumber)} |")
    A(f"| 値が変わったレコード | {len(changed_slugs)} |")
    A(f"| 取込後の想定総数 | **{total_after}**（{pct:+.1f}%）{' ★±10%超' if abs(pct) > 10 else ''} |")
    A("\n### フィールド別\n")
    A("| フィールド | 変化 | 新規充足 | 新CSVで欠落(現値維持) |")
    A("|---|---:|---:|---:|")
    for label, s_ in field_stats.items():
        A(f"| {label} | {s_['変化']} | {s_['新規充足']} | {s_['新CSVで欠落(現値維持)']} |")
    A("\n## 6. 当方に無い設備群（§3-c 基幹欠け確認）\n")
    A(R["missing_groups"]["conclusion"] + "\n")
    A("### 新規9件の内訳（追加は裁定事項）\n")
    A("| external_id | 名称 | 電圧面 | 台数 | 設備容量 | 空容量 | 県候補（地区多数決） |")
    A("|---|---|---|---|---|---|---|")
    for x in new_detail:
        mix = "★地区に複数県" if len(x["district_pref_mix"]) > 1 else ""
        A(f"| {x['external_id']} | {x['name']} | {x['voltage']} | {x['units']} | "
          f"{x['capacity_total_mw']} | {x['cap_avail_mw']} | {x['prefecture_candidate']} {mix} |")
    A("\n## 7. kyu-500 南関の残存確認（§3-a）\n")
    A(f"**残存 OK**。地区16（★22熊本）No45 に名称「南関」で存在し、新CSVでも全設備値が空欄"
      f"（all_null={R['nankan']['all_values_null_in_new']}）。#120 のホワイトリスト（No.欄と名称で判定）が"
      "名称ありの行を保護するため、除外されない。dedupe も名称＋電圧面＋数値の複合判定のため誤除去なし。\n")
    A(f"## 8. 空き容量が減った変電所（{len(dec)}件・うちゼロ化 {len(zeroed)}件）\n")
    A("| 変電所 | 県 | 電圧面 | 変化 |")
    A("|---|---|---|---|")
    for x in dec[:10]:
        A(f"| {x['name']} | {x['prefecture']} | {x['voltage']} | {x['from']} → **{x['to']}** MW |")
    A(f"\n## 9. 空き容量が増えた変電所（{len(inc)}件）\n")
    A("| 変電所 | 県 | 電圧面 | 変化 |")
    A("|---|---|---|---|")
    for x in inc[:5]:
        A(f"| {x['name']} | {x['prefecture']} | {x['voltage']} | {x['from']} → **{x['to']}** MW |")
    A("\n## 10. N-1・未算定（三値を潰さない）\n")
    A(f"- N-1可否: 新データ 可 **{n1_ok_new}件**（うち **0MW可 {n1_zero_ok}件**・潰さない）／可否変化 **{len(n1_chg)}件**（現行69件）")
    if n1_chg:
        A("")
        A("| slug | 名称 | 変化 |")
        A("|---|---|---|")
        for x in n1_chg[:12]:
            A(f"| {x['slug']} | {x['name']} | {x['from']} → **{x['to']}** |")
        A("")
    A(f"- N-1未算定（現値維持）: **{len(n1_und)}件** → `scripts/experimental/_common/n1_undetermined_kyushu.json`"
      "（`n1_undetermined.json` へ統合可能な形式）")
    A(f"- 出力制御の未算定（現値維持）: **{oc_und}件**\n")
    A("## 11. 同一No.名称変更・振り直し\n")
    if renamed:
        A(f"**★名称変更 {len(renamed)}件（要判断・本実行ブロック）**\n")
        A("| slug | external_id | 旧名称 | 新名称 | 県 | 電圧面 |")
        A("|---|---|---|---|---|---|")
        for x in renamed:
            A(f"| {x['slug']} | {x['external_id']} | {x['old_name']} | **{x['new_name']}** | {x['prefecture']} | {x['voltage']} |")
        A("\n> 「待金」→「侍金」は字の修正（誤植訂正）の可能性が高いが、裁定なしに上書きしない。")
    if renumber:
        A(f"\n**★枝番の振り直し {len(renumber)}件（要判断）** — バンク分割掲載（No → No(1)・(2)バンク新設）\n")
        A("| slug | 名称 | 旧external_id | 新external_id | 県 | 電圧面 |")
        A("|---|---|---|---|---|---|")
        for x in renumber:
            A(f"| {x['slug']} | {x['name']} | {x['old_external_id']} | {x['new_external_id']} | {x['prefecture']} | {x['voltage']} |")
    if not renamed and not renumber:
        A("なし\n")
    A("\n## 12. 県別件数（matched ベース・現行との対比）\n")
    A("| 県 | 現行 | matched |")
    A("|---|---:|---:|")
    cur = {"福岡県": 252, "鹿児島県": 156, "長崎県": 140, "熊本県": 122, "大分県": 118, "宮崎県": 55, "佐賀県": 36}
    for p, c in cur.items():
        A(f"| {p} | {c} | {by_pref.get(p, 0)} |")
    if R["requires_judgement"]:
        A("\n## ★要判断（本実行前に裁定が必要）\n")
        for x in R["requires_judgement"]:
            A(f"- {x}")
    if R["warnings"]:
        A("\n## ⚠ 警告\n")
        for x in R["warnings"]:
            A(f"- {x}")
    REPORT_MD.write_text("\n".join(L) + "\n", encoding="utf-8")

    # =========================================================================
    # --emit-plan: 本実行用の update_plan（microCMS 書込はしない）
    # 裁定（2026-08-20 承認）:
    #   1. kyu-764 待金→侍金（4項目一致＋「待金」不在を証明済）→ 名称更新・履歴保持
    #   2. 振り直し2件（大口 21_4→21_4(1)・ｱｲﾗﾝﾄﾞｼﾃｨ 27_11→27_11(1)）→ (1)側一致を
    #      フィールド突合で証明済（(2)は電圧面が異なり判別可能）→ slug維持・eid更新・履歴
    #   3. 新規6件のうち県が確定した4件のみ投入（null投入は厳禁＝基幹導出ヘルパの誤発火防止）:
    #        大口4(2)=鹿児島県（同名継承）・宮人23=鹿児島県（GSI: 伊佐市「大口宮人」muni46224）
    #        枕崎20(3)=鹿児島県（同名継承）・ｱｲﾗﾝﾄﾞｼﾃｨ11(2)=福岡県（同名継承）
    #      ★保留2件: 志和池13(3)（GSIで宮崎県都城市 muni45202 と確定したが、既存13(1)/(2)が
    #        鹿児島県で収録されており同時修正は裁定外＝3件まとめて要判断）・
    #        原田39（都城市と霧島市の両方に実在・地区マップPDFは画像で判定不能＝確定不能）
    #   4. 武雄 No『-』行は取り込まない（除外1件としてレポート残置）
    #   ＋ last_updated はレコード単位（7/27=14地区・7/28=17地区）
    #   ＋ source_url を現行URL（td_rHc7Jd0i.zip）へ全件更新（旧URLは404実測済み）
    # =========================================================================
    if args.emit_plan:
        VC_MAP = {500: "500kV系", 220: "220kV系", 110: "110kV系", 66: "66kV系", 22: "22kV系"}
        vclass = lambda kv: VC_MAP.get(kv, "その他") if kv is not None else "その他"  # noqa: E731
        iso = lambda d: f"{d}T00:00:00.000Z"  # noqa: E731

        NEW_PREF = {  # 県が確定した新規のみ（確定方法つき）
            "kyuden_21_4(2)": ("鹿児島県", "同名既存 kyu-619 大口（鹿児島県）から継承"),
            "kyuden_21_23": ("鹿児島県", "GSI地名検索: 伊佐市「大口宮人」「宮人」muni=46224"),
            "kyuden_23_20(3)": ("鹿児島県", "同名既存 kyu-708/709 枕崎（鹿児島県）から継承"),
            "kyuden_27_11(2)": ("福岡県", "同名既存 kyu-798 ｱｲﾗﾝﾄﾞｼﾃｨ（福岡県）から継承"),
        }
        HOLD = {
            "kyuden_22_13(3)": "志和池: GSIで宮崎県都城市（muni=45202）と確定したが、既存13(1)/(2)が"
                               "鹿児島県で収録済み。同時修正は裁定外のため3件まとめて要判断（今回保留）",
            "kyuden_22_39": "原田: 都城市（宮崎）と霧島市（鹿児島）の両方に実在し、地区マップPDFは"
                            "画像ベースで判定不能＝県を確定できず保留（次回更新待ち）",
        }

        RENUM_BY_SLUG = {x["slug"]: x for x in renumber}
        RENAME_BY_SLUG = {x["slug"]: x for x in renamed}
        NUMF = ["units", "capacity_total_mw", "cap_operational_mw", "forecast_flow_mw",
                "cap_avail_mw", "cap_avail_upper_mw", "n1_capacity_mw"]
        updates, value_changed, n1_skip, oc_skip = [], 0, 0, 0
        for b_, r_ in matched:
            patch, changed = {}, []
            for k in NUMF:
                ov, nv = b_.get(k), r_.get(k)
                if nv is None:
                    continue
                if ov is None or abs(float(ov) - float(nv)) > 1e-6:
                    patch[k] = nv
                    changed.append(k)
            if r_.get("op_constraint") and (b_.get("op_constraint") or "") != r_["op_constraint"]:
                patch["op_constraint"] = r_["op_constraint"]
                changed.append("op_constraint")
            if r_.get("n1_eligible") is None:
                if b_.get("n1_eligible") is not None:
                    n1_skip += 1
            elif bool(b_.get("n1_eligible")) != r_["n1_eligible"]:
                patch["n1_eligible"] = r_["n1_eligible"]
                changed.append("n1_eligible")
            if r_.get("oc_possibility") is None:
                if b_.get("oc_possibility") is not None:
                    oc_skip += 1
            elif (b_.get("oc_possibility") or None) != r_["oc_possibility"]:
                patch["oc_possibility"] = [r_["oc_possibility"]]
                changed.append("oc_possibility")
            if any(c in NUMF for c in changed):
                value_changed += 1
            rn = RENUM_BY_SLUG.get(b_["slug"])
            if rn:
                patch["external_id"] = rn["new_external_id"]
                changed.append("external_id")
            nm = RENAME_BY_SLUG.get(b_["slug"])
            if nm:
                patch["name"] = nm["new_name"]
                changed.append("name")
            patch["last_updated"] = iso(r_["last_updated"])
            patch["source_url"] = ZIP_URL          # 旧URLは404（全件更新）
            updates.append({"slug": b_["slug"], "patch": patch, "changed": changed})

        creates, held = [], []
        next_no = 880
        for r_ in sorted(new_rows, key=lambda x: (x["district"], x["no"])):
            eid = r_["external_id"]
            if eid in HOLD:
                held.append({"external_id": eid, "name": r_["name"], "reason": HOLD[eid]})
                continue
            pref, evidence = NEW_PREF[eid]
            slug = f"kyu-{next_no}"
            next_no += 1
            content = {
                "name": r_["name"], "slug": slug,
                "operator": ["九州電力送配電"], "area": ["九州"],
                "prefecture": pref,                 # ★null投入は厳禁（基幹導出ヘルパの誤発火）
                "voltage_primary_kv": r_["voltage_primary_kv"],
                "voltage_secondary_kv": r_["voltage_secondary_kv"],
                "voltage_class": [vclass(r_["voltage_primary_kv"])],
                "units": r_["units"],
                "capacity_total_mw": r_["capacity_total_mw"],
                "cap_operational_mw": r_["cap_operational_mw"],
                "op_constraint": r_["op_constraint"],
                "forecast_flow_mw": r_["forecast_flow_mw"],
                "cap_avail_mw": r_["cap_avail_mw"],
                "cap_avail_upper_mw": r_["cap_avail_upper_mw"],
                "n1_eligible": bool(r_["n1_eligible"]),
                "n1_capacity_mw": r_["n1_capacity_mw"],
                "external_id": eid,
                "non_firm_eligible": False,
                "source_url": ZIP_URL,
                "data_source_format": ["CSV"],
                "last_updated": iso(r_["last_updated"]),
            }
            if r_["oc_possibility"] is not None:
                content["oc_possibility"] = [r_["oc_possibility"]]
            content = {k: v for k, v in content.items() if v is not None}
            creates.append({"slug": slug, "external_id": eid, "name": r_["name"],
                            "prefecture": pref, "evidence": evidence, "content": content,
                            "n1_undetermined_as_false": r_["n1_eligible"] is None})

        plan = {
            "generated_on": R["generated_on"],
            "update_count": len(updates), "value_changed": value_changed,
            "create_count": len(creates), "held": held,
            "n1_undetermined_skipped": n1_skip, "oc_undetermined_skipped": oc_skip,
            "renumber": renumber, "renamed": renamed,
            "source_url_new": ZIP_URL,
            "updates": updates, "creates": creates,
        }
        Path("scripts/experimental/kyushu/update_plan_2607.json").write_text(
            json.dumps(plan, ensure_ascii=False, indent=1), encoding="utf-8")
        lu = {}
        for u in updates:
            d = str(u["patch"]["last_updated"])[:10]
            lu[d] = lu.get(d, 0) + 1
        print("\n=== emit-plan ===")
        print(f"  更新PATCH: {plan['update_count']}（数値変化 {value_changed}・名称修正 {len(renamed)}・eid更新 {len(renumber)}）")
        print(f"  last_updated（レコード単位）: {lu}")
        print(f"  新規POST: {plan['create_count']}件（保留 {len(held)}件）")
        for c in creates:
            print(f"    + {c['slug']} {c['name']} {c['prefecture']} ← {c['evidence']}")
        for h in held:
            print(f"    保留: {h['external_id']} {h['name']}")
        print(f"  現値維持: N-1 {n1_skip} / 出力制御 {oc_skip}")
        print("  -> scripts/experimental/kyushu/update_plan_2607.json")

    print(f"\n-> {REPORT_MD} / {REPORT_JSON} / {N1_OUT} 出力")
    print("[dry-run] 完了（microCMS 書込なし）")


if __name__ == "__main__":
    main()
