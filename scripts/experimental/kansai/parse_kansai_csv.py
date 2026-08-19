# -*- coding: utf-8 -*-
"""
scripts/experimental/kansai/parse_kansai_csv.py

関西電力送配電 予想潮流等 最新版（2026-08-17公表）の dry-run 差分レポート。
★microCMS への書込は一切行わない（baseline は fetch_baseline.py が GET 済みのローカルJSON）。

使い方:
  python scripts/experimental/kansai/parse_kansai_csv.py --dry-run

── 実データで確定させた設計（推測しない・BP依頼書 §4）──
[取得元] 公表ページのリンクを辿って実在確認済（L-EIC-019）
  154kv_more_trans.csv（基幹・154kV以上） / 154kv_less_trans.csv（ローカル・154kV未満）
  ※ フェンスは 154kv_more_fence.csv という**別ファイル**。本スクリプトは読まない。

[encoding] 決め打ち禁止。utf-8-sig → cp932 を errors="strict" で実測 → 両者とも cp932

[版] CSV 1行目「2026年08月17日更新」／PDF「2026年8月17日時点」（more 全6ページ・less）
  → more/less で割れていないため、レコード単位の last_updated は不要（単一日付）

[突合キー] external_id = `kansai_{kikan|local}_{No.原文}`
  実証: No.＋名称の一致率は more 48/48・less 1,570/1,571（名称不一致1件は要判断）
  → 北海道と違い external_id は安全に使える。ただし**一意ではない**
    （less で268種・537件が重複＝同一No.の電圧面違い）。
  → 主キー = external_id ＋ 電圧面（#114: float正規化して比較）
     タイブレーク = 設備容量 → 運用容量 → 台数（#115: 主キーに混ぜない）

[空容量] more と less で公表のしかたが違う（BP依頼書 §2 の指示どおり実データで確認）
  more: 空容量カラムは 0/127 行が実値 → 全行 `運用容量 − |予想潮流|` で算出（PDF留意事項(2)）
  less: 空容量カラム 1,296 行が実値／予想潮流のみ 279 行。**完全に排他**（両方0・欠落0）
        → カラムがあれば直読、無ければ同じ式で算出
  予想潮流の符号は無視して絶対値（留意事項(2)に「正負に依らない」と明記）

[#120 注記行] ホワイトリスト方式。No.欄が設備Noの形をしている行だけ通す。
  ★依頼書 §3 の「フェンス管理箇所 A1〜A6・B・C の8件を弾く」は**採用しない**。
    実データでは more_trans の `Ｂ`＝北摂（500/275kV・3台・2850MW）、`Ｃ`＝猪名川（同）で、
    いずれも実在の変電所。fence.csv 側の B/C は「Bフェンス(北河内線+南近江線＋北大和線)」
    という別物であり、trans CSV には混入していない。
    No. の文字が同じというだけで弾くと実在の500kV変電所2件を消す（#120(2) と同型の過剰除去）。

[#117] series_dedup のルール②（baseline名称一致で除外）は使わない。
  関西は同名が極めて多い（西播A/AF・猪名川C/L・西京都F/M/BA・新生駒H/O/BK ほか）。
"""
import argparse, csv, io, json, re, sys, unicodedata
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402
from frozen import drop_frozen  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "src"
BASELINE = HERE / "baseline_live.json"
BASE_URL = "https://www.kansai-td.co.jp/interchange/takusou/pdf"
REPORT_MD = Path("reports/grid-kansai-dryrun-2026-08-17.md")
REPORT_JSON = Path("reports/grid-kansai-dryrun-2026-08-17.json")
N1_OUT = HERE.parent / "_common" / "n1_undetermined_kansai.json"

# 区分 → (CSVファイル, external_id接頭辞, slug接頭辞, 公表PDF)
SETS = [
    ("more", "154kv_more_trans.csv", "kansai_kikan_", "ksi-kikan-", "154kv_more_space.pdf"),
    ("less", "154kv_less_trans.csv", "kansai_local_", "ksi-local-", "154kv_less_space.pdf"),
]
COL = dict(no=0, name=1, kv1=2, kv2=3, units=4, cap_total=5, cap_op=6, constraint=7,
           flow=8, avail=9, avail_upper=10, n1=11, n1_mw=12, oc=13, oc_self=14,
           oc_upper=15, note=16)

# ── #120 ホワイトリスト: No.欄が設備Noの形をしている行だけ通す ──
# 実データの全パターン: A / AA / AI-1 / 陸A / 海A（more）、北A / 姫GE / 姫F1（less）
NO_RE = re.compile(r"^(?:海|陸|北|神|京|姫|南|滋|和|奈)?[A-Z]{1,3}\d*(?:-\d+)?$")

NFKC = lambda s: unicodedata.normalize("NFKC", (s or "")).strip()  # noqa: E731
# #111 注記2: 名称の全角スペースは半角化しない。前後 trim のみ
clean_name = lambda s: (s or "").strip()  # noqa: E731


def read_csv_bytes(raw: bytes):
    """encoding は決め打ちしない（BP依頼書 §6-1）"""
    for enc in ("utf-8-sig", "cp932", "utf-8"):
        try:
            return raw.decode(enc, errors="strict"), enc
        except UnicodeDecodeError:
            continue
    raise SystemExit("encoding 判定不能")


def to_float(v):
    s = NFKC(v)
    return float(s) if re.fullmatch(r"-?\d+(\.\d+)?", s) else None


def to_int(v):
    f = to_float(v)
    return int(f) if f is not None else None


def parse_n1(v):
    """『可』→True／『不可』→False／未算定（－・ー）→None（現値維持の対象）"""
    s = NFKC(v)
    if not s or s in ("-", "ー", "―", "‐"):
        return None
    if s.startswith("不可"):
        return False
    if s.startswith("可"):
        return True
    return None


def parse_oc(v):
    s = NFKC(v)
    if not s or s in ("-", "ー", "―", "‐"):
        return None
    if "有" in s:
        return "有り"
    if "無" in s or "な" in s:
        return "なし"
    return None


def vkey(a, b):
    """電圧面キー。#114: int と float を文字列比較しない（500 と 500.0 を同一に）"""
    f = lambda x: f"{float(x):g}" if x is not None else "-"  # noqa: E731
    return f"{f(a)}/{f(b)}"


def load_rows():
    """CSV 2本を読み、ホワイトリストで注記行を弾いて正規化レコードにする"""
    files, rows, skipped = [], [], []
    for tag, fname, eid_prefix, slug_prefix, pdf in SETS:
        raw = (SRC / fname).read_bytes()
        txt, enc = read_csv_bytes(raw)
        data = list(csv.reader(io.StringIO(txt)))
        version = NFKC(data[0][0]) if data and data[0] else None
        cnt = 0
        for r in data[2:]:
            if not r or len(r) < 17:
                continue
            no_raw = (r[COL["no"]] or "").strip()
            no = NFKC(no_raw)
            if not no:
                continue  # 末尾の空行。注記ではないのでログに載せない
            if not NO_RE.match(no):
                skipped.append({"set": tag, "no": no[:60], "name": clean_name(r[COL["name"]]),
                                "reason": "No.欄が設備Noの形をしていない（注記行）"})
                continue
            flow = to_float(r[COL["flow"]])
            cap_op = to_float(r[COL["cap_op"]])
            avail_col = to_float(r[COL["avail"]])
            avail_up_col = to_float(r[COL["avail_upper"]])
            # ── 空容量 ──
            if avail_col is not None:
                avail, avail_src = avail_col, "カラム直読"
            elif cap_op is not None and flow is not None:
                # PDF留意事項(2): 空容量 = 運用容量値 − |予想潮流値|（符号は無視）
                avail, avail_src = round(cap_op - abs(flow), 3), "運用容量−|予想潮流|"
            else:
                avail, avail_src = None, "算出不能（運用容量または予想潮流が未公表）"
            if avail_up_col is not None:
                avail_up = avail_up_col
            elif avail_src == "運用容量−|予想潮流|":
                avail_up = avail  # 上位系も公表が無い（more は全行 '-'）。当該と同値で持つ
            else:
                avail_up = None
            rows.append({
                "set": tag, "external_id": f"{eid_prefix}{no_raw}", "no": no, "no_raw": no_raw,
                "slug_prefix": slug_prefix,
                "name": clean_name(r[COL["name"]]),
                "voltage_primary_kv": to_float(r[COL["kv1"]]),
                "voltage_secondary_kv": to_float(r[COL["kv2"]]),
                "units": to_int(r[COL["units"]]),
                "capacity_total_mw": to_float(r[COL["cap_total"]]),
                "cap_operational_mw": cap_op,
                "op_constraint": NFKC(r[COL["constraint"]]) or None,
                "forecast_flow_mw": flow,
                "cap_avail_mw": avail,
                "cap_avail_upper_mw": avail_up,
                "avail_source": avail_src,
                "n1_eligible": parse_n1(r[COL["n1"]]),
                "n1_capacity_mw": to_float(r[COL["n1_mw"]]),
                "oc_possibility": parse_oc(r[COL["oc"]]),
                "src_encoding": enc, "src_version": version,
            })
            cnt += 1
        files.append({"file": fname, "url": f"{BASE_URL}/{fname}", "bytes": len(raw),
                      "encoding": enc, "version_row": version, "pdf": f"{BASE_URL}/{pdf}",
                      "data_rows": cnt})
    return files, rows, skipped


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.parse_args()

    R = {"generated_on": str(date.today()), "area": "関西", "operator": "関西電力送配電",
         "scope": "dry-run（差分レポートのみ・microCMS 書込ゼロ）",
         "files": [], "warnings": [], "requires_judgement": []}

    print("=== 1. 取得ファイル・encoding 実測 ===")
    files, raw_rows, skipped = load_rows()
    R["files"] = files
    for f in files:
        print(f"  {f['file']:24s} {f['encoding']:9s} {f['bytes']:7d}B 版={f['version_row']} 行{f['data_rows']:5d}")
    print(f"  生データ行 合計 {len(raw_rows)}件")

    print(f"\n=== 2. #120 注記行の除外（ホワイトリスト方式）: {len(skipped)}件 ===")
    for s in skipped:
        print(f"    - [{s['set']}] 『{s['no']}』← {s['reason']}")
    R["excluded_note_rows"] = {"count": len(skipped), "rows": skipped,
                               "method": "No.欄が設備Noの形をしている行だけ通すホワイトリスト（#120）",
                               "fence_note": "フェンスは 154kv_more_fence.csv という別ファイルにあり、"
                                             "trans CSV には混入しない。more_trans の Ｂ=北摂・Ｃ=猪名川は"
                                             "実在の500kV変電所のため除外しない（#120(2) の過剰除去回避）"}

    print("\n=== 3. 空容量の算出方式（more / less 別）===")
    avail_stat = {}
    for tag in ("more", "less"):
        c = {}
        for r in raw_rows:
            if r["set"] == tag:
                c[r["avail_source"]] = c.get(r["avail_source"], 0) + 1
        avail_stat[tag] = c
        print(f"  {tag}: {c}")
    R["avail_calculation"] = avail_stat


    print("\n=== 4. 重複除去（#111・ルール②は使わない #117）===")
    base = json.load(open(BASELINE, encoding="utf-8"))
    base = drop_frozen(base)
    NUMKEYS = ["cap_avail_mw", "cap_avail_upper_mw", "cap_operational_mw", "capacity_total_mw",
               "n1_capacity_mw", "units", "voltage_primary_kv", "voltage_secondary_kv"]
    for b in base:
        for k in NUMKEYS:
            b.setdefault(k, None)
        b.setdefault("prefecture", None)
        oc = b.get("oc_possibility")
        b["oc_possibility"] = (oc[0] if isinstance(oc, list) and oc else None)

    kept, removed_dup = apply_series_dedup(
        raw_rows, {b.get("external_id") for b in base},
        enable_baseline_name_rule=False,   # #117: 関西は同名が極めて多いので絶対に使わない
        key_id="external_id", key_name="name",
        # ★電圧面を必ず含める（2026-08-17 実証）。名称＋数値だけだと
        #   北大阪 ＡＢ(275/154kV) と ＢＢ(275/77kV) が、設備容量665・運用容量570・台数3・
        #   予想潮流60 の偶然一致で「同名同値」と判定され、正当な別バンクを誤除去した。
        #   関西は同名が極めて多い社なので、複合判定に電圧面まで入れないと成立しない（#111）。
        value_keys=("voltage_primary_kv", "voltage_secondary_kv",
                    "cap_operational_mw", "forecast_flow_mw", "capacity_total_mw", "units"),
        group_key="set",
    )
    print(f"  dedupe 前 {len(raw_rows)} -> 後 {len(kept)}（除去 {len(removed_dup)} 件 {summarize(removed_dup)}）")
    for e in removed_dup[:5]:
        print(f"    除去: {e.get('external_id')} 「{e.get('name')}」<- {e.get('exclude_reason')}")
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(removed_dup),
                   "rule2_baseline_name": "使用しない（#117・関西は同名が極めて多い）",
                   "breakdown": summarize(removed_dup),
                   "examples": [{"external_id": e.get("external_id"), "name": e.get("name"),
                                 "voltage": vkey(e.get("voltage_primary_kv"), e.get("voltage_secondary_kv")),
                                 "reason": e.get("exclude_reason")} for e in removed_dup[:5]]}

    # ===== 5. 突合（external_id + 電圧面。容量・台数はタイブレーカー #115）=====
    print("\n=== 5. 突合（主キー: external_id + 電圧面／タイブレーク: 設備容量->運用容量->台数）===")
    bidx = {}
    for b in base:
        bidx.setdefault(NFKC(b.get("external_id")), []).append(b)

    def numeq(x, y):
        if x is None and y is None:
            return True
        if x is None or y is None:
            return False
        return abs(float(x) - float(y)) < 1e-6

    used, matched, new_rows, ambiguous = set(), [], [], []
    for r in kept:
        cands = [b for b in bidx.get(NFKC(r["external_id"]), []) if id(b) not in used]
        if not cands:
            new_rows.append(r)
            continue
        face = [b for b in cands
                if vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"])
                == vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])]
        if not face:
            new_rows.append(r)   # 同No.だが電圧面が違う -> 後段の「新規×消滅」突合へ
            continue
        if len(face) > 1:        # #115: 電圧面だけでは一意にならない組をタイブレーク
            for k in ("capacity_total_mw", "cap_operational_mw", "units"):
                nar = [b for b in face if numeq(b.get(k), r.get(k))]
                if len(nar) == 1:
                    face = nar
                    break
                if nar:
                    face = nar
            if len(face) > 1:
                ambiguous.append({"external_id": r["external_id"], "name": r["name"],
                                  "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                                  "candidates": [b["slug"] for b in face]})
        b = face[0]
        used.add(id(b))
        matched.append((b, r))
    removed = [b for b in base if id(b) not in used]
    print(f"  マッチ {len(matched)} / 新規候補 {len(new_rows)} / 消滅候補 {len(removed)} / 曖昧 {len(ambiguous)}")

    # ===== 6. 枝番・No.の振り直し（新規×消滅で 名称+電圧面+設備容量 が一致する組）=====
    renumber = []
    for r in list(new_rows):
        for b in list(removed):
            if (clean_name(b.get("name")) == r["name"]
                    and vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"])
                    == vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])
                    and numeq(b.get("capacity_total_mw"), r.get("capacity_total_mw"))):
                renumber.append({"slug": b["slug"], "name": r["name"],
                                 "old_external_id": b.get("external_id"),
                                 "new_external_id": r["external_id"],
                                 "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])})
                new_rows.remove(r)
                removed.remove(b)
                matched.append((b, r))
                break
    if renumber:
        print(f"  ★No./枝番の振り直し {len(renumber)}件（slug維持・external_id 更新が必要＝要判断）")
        for x in renumber[:10]:
            print(f"    {x['slug']} 「{x['name']}」 {x['old_external_id']} -> {x['new_external_id']}")

    # ===== 6-2. 同一No.・同一名称で「電圧面」が変わった組（上書き危険＝要判断）=====
    # 名称変更（§5）の鏡像。No.も名称も同じなのに電圧面だけ違うため、
    # 主キー（external_id＋電圧面）では新規×消滅に割れる。機械的に上書きすると
    # 別バンクへ値を書き込む危険があるので、独立カテゴリで報告する。
    face_changed = []
    for r in list(new_rows):
        for b in list(removed):
            if (NFKC(b.get("external_id")) == NFKC(r["external_id"])
                    and clean_name(b.get("name")) == r["name"]):
                face_changed.append({
                    "slug": b["slug"], "external_id": b.get("external_id"), "name": r["name"],
                    "old_voltage": vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"]),
                    "new_voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                    "old_cap_avail_mw": b.get("cap_avail_mw"), "new_cap_avail_mw": r.get("cap_avail_mw"),
                })
                new_rows.remove(r)
                removed.remove(b)
                break
    if face_changed:
        print(f"  ★同一No.・同一名称で電圧面が変化 {len(face_changed)}件（上書きせず要判断）")
        for x in face_changed:
            print(f"    {x['slug']} {x['external_id']} 「{x['name']}」 "
                  f"{x['old_voltage']} -> {x['new_voltage']}kV")

    # ===== 7. 同一No.で名称が変わった行（上書きせず報告して停止）=====
    renamed = []
    for b, r in matched:
        bn, rn = clean_name(b.get("name")), r["name"]
        if bn and rn and bn != rn:
            renamed.append({"slug": b["slug"], "external_id": b.get("external_id"),
                            "old_name": bn, "new_name": rn,
                            "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"])})
    if renamed:
        print(f"  ★同一No.で名称変更 {len(renamed)}件（本実行ブロック＝要判断）")
        for x in renamed:
            print(f"    {x['slug']} {x['external_id']} 『{x['old_name']}』->『{x['new_name']}』 {x['voltage']}")

    # ===== 8. フィールド差分 =====
    FIELDS = [("cap_avail_mw", "空き容量(当該)"), ("cap_avail_upper_mw", "空容量(上位系等考慮)"),
              ("cap_operational_mw", "運用容量"), ("capacity_total_mw", "設備容量"),
              ("n1_capacity_mw", "N-1電制適用可能量"), ("units", "台数")]
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
        print(f"  {label:22s} 変化{chg:5d} 新規充足{filled:5d} 欠落(現値維持){lost:5d}")

    # ===== 9. 空き容量の増減 =====
    dec, inc, zeroed = [], [], []
    for b, r in matched:
        ov, nv = b.get("cap_avail_mw"), r.get("cap_avail_mw")
        if ov is None or nv is None or numeq(ov, nv):
            continue
        rec = {"slug": b["slug"], "name": clean_name(b.get("name")),
               "prefecture": b.get("prefecture"), "external_id": b.get("external_id"),
               "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
               "from": ov, "to": nv, "delta": round(nv - ov, 3)}
        (dec if nv < ov else inc).append(rec)
        if nv <= 0 < ov:
            zeroed.append(rec)
    dec.sort(key=lambda x: x["delta"])
    inc.sort(key=lambda x: -x["delta"])
    print(f"\n=== 9. 空き容量: 減少 {len(dec)}件（うちゼロ化 {len(zeroed)}）／増加 {len(inc)}件 ===")
    for x in dec[:10]:
        print(f"    down {x['name']}（{x['prefecture'] or '-'}・{x['voltage']}）{x['from']} -> {x['to']} MW")

    # ===== 10. N-1 未算定（現値維持）=====
    n1_und = [{"operator": "関西電力送配電", "area": "関西", "slug": b["slug"],
               "external_id": b.get("external_id"), "name": clean_name(b.get("name")),
               "prefecture": b.get("prefecture"), "stored_n1_eligible": b.get("n1_eligible"),
               "source": "154kv_{more,less}_trans.csv（2026-08-17公表）"}
              for b, r in matched if r.get("n1_eligible") is None and b.get("n1_eligible") is not None]
    oc_und = sum(1 for b, r in matched
                 if r.get("oc_possibility") is None and b.get("oc_possibility") is not None)
    n1_chg = [{"slug": b["slug"], "name": clean_name(b.get("name")),
               "from": b.get("n1_eligible"), "to": r.get("n1_eligible")}
              for b, r in matched
              if r.get("n1_eligible") is not None and b.get("n1_eligible") != r.get("n1_eligible")]
    print(f"=== 10. 未算定（現値維持）: N-1 {len(n1_und)}件 / 出力制御 {oc_und}件 ／ N-1可否の変化 {len(n1_chg)}件 ===")
    N1_OUT.write_text(json.dumps({"count": len(n1_und), "entries": n1_und}, ensure_ascii=False, indent=1),
                      encoding="utf-8")

    # ===== 11. 区分別件数 =====
    by_set = {t: sum(1 for r in kept if r["set"] == t) for t in ("more", "less")}
    base_by = {"基幹系統": sum(1 for b in base if "kikan" in b["slug"]),
               "関西ローカル系": sum(1 for b in base if "local" in b["slug"])}
    total_after = len(base) + len(new_rows) - len(removed)
    pct = (total_after - len(base)) / len(base) * 100
    print("\n=== 11. 区分別 ===")
    print(f"  現行 基幹系統 {base_by['基幹系統']} / 関西ローカル系 {base_by['関西ローカル系']} = {len(base)}")
    print(f"  新CSV more {by_set['more']} / less {by_set['less']} = {sum(by_set.values())}")
    print(f"  取込後の想定総数 {total_after}（{pct:+.1f}%）{'★±10%超' if abs(pct) > 10 else ''}")

    dup_eid = len([1 for v in bidx.values() if len(v) > 1])
    R.update({
        "version": {"当方(現行)": "2026-04-01", "新(more)": "2026-08-17", "新(less)": "2026-08-17",
                    "版割れ": False,
                    "根拠": "CSV1行目『2026年08月17日更新』／PDF『2026年8月17日時点』"},
        "join_key": {
            "確定": "external_id = kansai_{kikan|local}_{No.原文} + 電圧面",
            "tiebreak": "設備容量 -> 運用容量 -> 台数（#115・主キーに混ぜない）",
            "external_idは安全か": "安全。No.+名称の一致は more 48/48・less 1,570/1,571"
                                   "（不一致1件は名称変更として要判断に計上）。北海道のような一括シフトは無い",
            "一意性": f"一意ではない。baseline で {dup_eid}種の external_id が複数レコードを持つ（同一No.の電圧面違い）",
            "more対応": "No.= A..EA / 陸A..陸K / 海A..海F / 枝番 AI-1,AI-2,AJ-1,AJ-2,AL-1,AL-2"
                        " -> kansai_kikan_{No原文（全角）}",
            "less対応": "No.= 北/神/京/姫/南/滋/和/奈 + 英字（+数字/枝番） -> kansai_local_{No原文（半角）}",
            "全角半角": "NFKC で正規化してから突合（baseline は more=全角・less=半角のまま保持）",
        },
        "counts": {"baseline": len(base), "csv_raw": len(raw_rows), "csv_dedup": len(kept),
                   "matched": len(matched), "new": len(new_rows), "removed": len(removed),
                   "ambiguous": len(ambiguous), "changed_records": len(changed_slugs),
                   "total_after": total_after, "pct": round(pct, 2)},
        "by_set": by_set, "baseline_by_class": base_by,
        "field_stats": field_stats,
        "cap_avail": {"decreased": len(dec), "zeroed": len(zeroed), "increased": len(inc),
                      "top_decreases": dec[:10], "top_increases": inc[:5]},
        "n1_undetermined": {"count": len(n1_und), "entries": n1_und,
                            "file": "scripts/experimental/_common/n1_undetermined_kansai.json"},
        "oc_undetermined": oc_und,
        "n1_changed": {"count": len(n1_chg), "examples": n1_chg[:10]},
        "renamed_same_no": renamed,
        "renumbered": renumber,
        "voltage_face_changed": face_changed,
        "ambiguous_rows": ambiguous,
        "new_records_detail": [{"external_id": r["external_id"], "name": r["name"], "set": r["set"],
                                "voltage": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                                "cap_operational_mw": r["cap_operational_mw"],
                                "cap_avail_mw": r["cap_avail_mw"]} for r in new_rows],
        "disappeared_records": [{"slug": b["slug"], "external_id": b.get("external_id"),
                                 "name": clean_name(b.get("name")),
                                 "voltage": vkey(b["voltage_primary_kv"], b["voltage_secondary_kv"]),
                                 "cap_avail_mw": b.get("cap_avail_mw")} for b in removed],
    })
    if renamed:
        R["requires_judgement"].append(
            f"同一No.で名称変更 {len(renamed)}件 -> 上書きせず要判断（行の差し替えの可能性）")
    if renumber:
        R["requires_judgement"].append(
            f"No./枝番の振り直し {len(renumber)}件 -> slug維持のまま external_id を更新するか要判断")
    if face_changed:
        R["requires_judgement"].append(
            f"同一No.・同一名称で電圧面が変化 {len(face_changed)}件 -> 設備更新か公表記載変更かの確認が必要"
            "（機械的に上書きすると別バンクへ書き込む）")
    if ambiguous:
        R["requires_judgement"].append(f"電圧面+タイブレークでも一意にならない組 {len(ambiguous)}件")
    if removed:
        R["requires_judgement"].append(f"消滅（新CSVに不在）{len(removed)}件 -> 301/凍結の方針判断が必要")
    if abs(pct) > 10:
        R["warnings"].append(f"★総数が現行から {pct:+.1f}%（±10%超）")

    REPORT_JSON.parent.mkdir(parents=True, exist_ok=True)
    REPORT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")

    L = []
    A = L.append
    A(f"# 関西電力送配電 予想潮流等 取込 dry-run（{R['generated_on']}）\n")
    A("**microCMS への書込はゼロ**（baseline は GET のみ）。本実行は未実施。\n")
    base_kikan_null = sum(1 for b in base if "kikan" in b["slug"] and b.get("cap_avail_mw") is None)
    base_local_null = sum(1 for b in base if "local" in b["slug"] and b.get("cap_avail_mw") is None)
    A("## 0. 依頼書の前提と実測が食い違った点（3件）\n")
    A("| # | 依頼書の記載 | 2026-08-17 の実測 |")
    A("|---|---|---|")
    A("| 1 | 版は「2026年08月13日時点」 | **2026年08月17日**。CSV1行目「2026年08月17日更新」／"
      "more PDF 全6ページ「2026年8月17日時点」。公表側が更新した可能性 |")
    A("| 2 | フェンス管理箇所（A1〜A6・B・C の8件）が確実に混入する | **混入なし**。"
      "フェンスは `154kv_more_fence.csv` という別ファイル。`154kv_more_trans.csv` の `Ｂ`＝**北摂**、"
      "`Ｃ`＝**猪名川**（いずれも500/275kV・3台・2850MW の実在変電所）。"
      "指示どおり弾くと実在の500kV変電所2件を消すため**除外しませんでした** |")
    A(f"| 3 | 当方の基幹49件は空容量が「全て0」 | **全て未設定（null）**。0 ではない。"
      f"ローカル側も1,575件中 {base_local_null}件が null（1,297件に値あり）。"
      f"サイトの「空容量プラス 1,174」は 1,624 − null {base_kikan_null + base_local_null} − ゼロ 123 と整合 |")
    A("")
    A("## 1. 取得ファイル・encoding（決め打ちなし・errors=strict で実測）\n")
    A("| ファイル | URL | バイト数 | encoding | CSV1行目 |")
    A("|---|---|---:|---|---|")
    for f in files:
        A(f"| {f['file']} | {f['url']} | {f['bytes']:,} | **{f['encoding']}** | {f['version_row']} |")
    A("\n## 2. 版\n")
    A("当方 **2026/4/1** → 新 **2026/8/17**（more / less とも同一・版割れなし）\n")
    A("根拠: CSV1行目「2026年08月17日更新」／`154kv_more_space.pdf` 全6ページ「2026年8月17日時点」"
      "／`154kv_less_space.pdf`「2026年8月17日」。**割れていないためレコード単位の last_updated は不要**。")
    A("\n> 依頼書は「2026年08月13日時点」でしたが、2026-08-17 の実測では more の全6ページが"
      "「2026年8月17日時点」でした（CSV の更新日表記とも一致）。公表側が更新した可能性があります。\n")
    A("## 3. 空容量の算出方式（more / less 別）\n")
    A("| 区分 | 方式 | 件数 |")
    A("|---|---|---:|")
    for tag in ("more", "less"):
        for k, v in sorted(avail_stat[tag].items(), key=lambda x: -x[1]):
            A(f"| {tag} | {k.replace(chr(124), chr(92)+chr(124))} | {v} |")
    A("\n- **more（基幹）**: 空容量カラムは全127行が `-` で実値なし → 全行 `運用容量 − |予想潮流|` で算出"
      "（PDF留意事項(2)。符号は無視して絶対値）")
    A("- **less（ローカル）**: 空容量カラムに実値がある行が 1,296、予想潮流のみの行が 279。"
      "**両方ある行・どちらも無い行は 0 件＝完全に排他**。カラムがあれば直読、無ければ同じ式で算出")
    A("- 上位系等考慮空容量: less はカラム直読（1,296行）。more は公表がないため当該設備の算出値と同値で保持\n")
    A("## 4. 除外した注記行（#120 ホワイトリスト方式）\n")
    A(f"除外 **{len(skipped)}件**\n")
    if skipped:
        A("| 区分 | No.欄 | 理由 |")
        A("|---|---|---|")
        for s in skipped:
            A(f"| {s['set']} | `{s['no'][:50]}` | {s['reason']} |")
    A("\n> ★依頼書 §3 の「フェンス管理箇所（A1〜A6・B・C の8件）が確実に混入する」は、"
      "実データでは**発生しませんでした**。フェンスは `154kv_more_fence.csv` という別ファイルにあり、"
      "本スクリプトはそれを読みません。`154kv_more_trans.csv` の `Ｂ` は **北摂**（500/275kV・3台・2850MW）、"
      "`Ｃ` は **猪名川**（同）で、いずれも実在の変電所です。"
      "No. の文字が同じというだけで弾くと実在の500kV変電所2件を消すため除外していません"
      "（#120(2) と同型の過剰除去）。fence.csv 側の B は「Bフェンス(北河内線+南近江線＋北大和線)」で別物です。\n")
    A("## 5. 行数\n")
    A(f"生 **{len(raw_rows)}** 行 → dedupe 後 **{len(kept)}** 行（除去 **{len(removed_dup)}** 件"
      f"{'・内訳 ' + str(summarize(removed_dup)) if removed_dup else ''}）"
      "／ `series_dedup` ルール②は **使用せず**（#117・関西は同名が極めて多い）\n")
    if removed_dup:
        A("| external_id | 名称 | 電圧面 | 除去理由 |")
        A("|---|---|---|---|")
        for e in removed_dup[:5]:
            A(f"| {e.get('external_id')} | {e.get('name')} | "
              f"{vkey(e.get('voltage_primary_kv'), e.get('voltage_secondary_kv'))} | {e.get('exclude_reason')} |")
        A("")
    A("## 6. 突合キーの確定\n")
    for k, v in R["join_key"].items():
        A(f"- **{k}**: {v}")
    A("\n## 7. 設備の増減\n")
    A("| 区分 | 件数 |")
    A("|---|---:|")
    A(f"| baseline（microCMS GET・#113） | {len(base)} |")
    A(f"| 新CSV（dedupe後） | {len(kept)} |")
    A(f"| マッチ | {len(matched)} |")
    A(f"| 新規 | {len(new_rows)} |")
    A(f"| 消滅 | {len(removed)} |")
    A(f"| 値が変わったレコード | {len(changed_slugs)} |")
    A(f"| 取込後の想定総数 | **{total_after}**（{pct:+.1f}%）{' ★±10%超' if abs(pct) > 10 else ''} |")
    A("\n### フィールド別\n")
    A("| フィールド | 変化 | 新規充足 | 新CSVで欠落(現値維持) |")
    A("|---|---:|---:|---:|")
    for label, s in field_stats.items():
        A(f"| {label} | {s['変化']} | {s['新規充足']} | {s['新CSVで欠落(現値維持)']} |")
    A(f"\n## 8. 空き容量が減った変電所（{len(dec)}件・うちゼロ化 {len(zeroed)}件）\n")
    A("| 変電所 | 府県／設備区分 | 電圧面 | 変化 |")
    A("|---|---|---|---|")
    for x in dec[:10]:
        A(f"| {x['name']} | {x['prefecture'] or '—'} | {x['voltage']} | {x['from']} → **{x['to']}** MW |")
    A(f"\n## 9. 空き容量が増えた変電所（{len(inc)}件）\n")
    A("| 変電所 | 府県／設備区分 | 電圧面 | 変化 |")
    A("|---|---|---|---|")
    for x in inc[:5]:
        A(f"| {x['name']} | {x['prefecture'] or '—'} | {x['voltage']} | {x['from']} → **{x['to']}** MW |")
    A("\n## 10. 未算定で boolean が false に潰れる件数（既定は現値維持）\n")
    A(f"- N-1電制適用可否: **{len(n1_und)}件** → "
      "`scripts/experimental/_common/n1_undetermined_kansai.json` に出力"
      "（`_common/n1_undetermined.json` へ統合可能な形式）")
    A(f"- 平常時出力制御の可能性: **{oc_und}件**\n")
    A("## 11. 同一No.名称変更・枝番振り直し\n")
    if renamed or renumber:
        A(f"**★要判断（本実行をブロック）: 名称変更 {len(renamed)}件 / 振り直し {len(renumber)}件**\n")
        if renamed:
            A("| slug | external_id | 旧名称 | 新名称 | 電圧面 |")
            A("|---|---|---|---|---|")
            for x in renamed:
                A(f"| {x['slug']} | {x['external_id']} | {x['old_name']} | **{x['new_name']}** | {x['voltage']} |")
            A("")
        if renumber:
            A("| slug | 名称 | 旧external_id | 新external_id | 電圧面 |")
            A("|---|---|---|---|---|")
            for x in renumber:
                A(f"| {x['slug']} | {x['name']} | {x['old_external_id']} | {x['new_external_id']} | {x['voltage']} |")
            A("")
    else:
        A("なし\n")
    A(f"## 12. N-1電制適用可否の変化（{len(n1_chg)}件）\n")
    if n1_chg:
        A("| slug | 名称 | 変化 |")
        A("|---|---|---|")
        for x in n1_chg[:10]:
            A(f"| {x['slug']} | {x['name']} | {x['from']} → **{x['to']}** |")
        A("")
    else:
        A("なし\n")
    A("## 13. 区分別件数\n")
    A("| 区分 | 現行 | 新CSV |")
    A("|---|---:|---:|")
    A(f"| 基幹系統（more・154kV以上） | {base_by['基幹系統']} | {by_set['more']} |")
    A(f"| 関西ローカル系（less・154kV未満） | {base_by['関西ローカル系']} | {by_set['less']} |")
    A(f"| 合計 | {len(base)} | {sum(by_set.values())} |")
    if R["requires_judgement"]:
        A("\n## ★要判断（本実行前に裁定が必要）\n")
        for x in R["requires_judgement"]:
            A(f"- {x}")
    if R["warnings"]:
        A("\n## ⚠ 警告\n")
        for x in R["warnings"]:
            A(f"- {x}")
    REPORT_MD.write_text("\n".join(L) + "\n", encoding="utf-8")
    print(f"\n-> {REPORT_MD} / {REPORT_JSON} / {N1_OUT} 出力")
    print("[dry-run] 完了（microCMS 書込なし）")


if __name__ == "__main__":
    main()
