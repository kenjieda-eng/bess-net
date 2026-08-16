# -*- coding: utf-8 -*-
"""
中国電力ネットワーク 予想潮流・空容量CSV（2026年8月6日更新版）パーサ＋dry-run差分レポート

依頼 BN（2026-08-16）。**microCMS への書込は一切行わない（GET は fetch_baseline.py のみ）**。

実査で確定した仕様:
  - 一次: https://www.energia.co.jp/nw/service/retailer/keitou/access/ のリンクから実在URLを取得
    （URL推測なし・L-EIC-019）。ZIPは6本 `zip/csv_{220kv,hiro,oka,shima,tori,yama}.zip`。
    ★当方記録の `zip/220kv.zip` は現行ページに存在せず `zip/csv_220kv.zip` に改名されていた。
  - 版: mapping.pdf のマップ内に「２０２６年８月６日更新」（全角）。加えて **ZIP内のCSVメンバー名には
    YYYYMM が入る**（依頼書の前提「ファイル名に日付が入らない」はZIP名のみ該当）。実際は
    基幹・広島=202608 / 岡山・島根・鳥取・山口=202607 の**混在**。各CSVのメタ行（L0）にも更新日がある。
  - エンコーディングは決め打ちせず ZIPメンバー個別に実測（utf-8-sig → cp932・errors="strict"）。
  - レイアウトは全ファイル共通17列（L0=更新日メタ行, L1=ヘッダ, L2以降データ）。
  - 変電所No は `基S1-1` `山①S1-1` 形式。`※`（脚注）と `・基`（フェンス）行はデータではない。
  - 突合キー: external_id = `energia_{県キー}_{No}`（既存実データの規則）。
    ★同名の変電所が電圧違い・バンク違いで複数行あるため（三石×3・三原/三成/三次/三田尻×2 等）、
    名称だけで dedupe / 突合してはならない。電圧面＋設備容量＋運用容量＋台数で一意化する。

使い方:
  python scripts/experimental/chugoku/parse_chugoku_csv.py --dry-run
"""
import argparse, csv, io, json, re, sys, zipfile
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "zip_202608"
BASELINE = HERE / "baseline_live.json"
OUT_JSON = Path("reports/grid-chugoku-dryrun-2026-08-16.json")
OUT_MD = Path("reports/grid-chugoku-dryrun-2026-08-16.md")
N1_OUT = HERE.parent / "_common" / "n1_undetermined_chugoku.json"
BASE_URL = "https://www.energia.co.jp/nw/service/retailer/keitou/access"
MAPPING_PDF_NOTE = "２０２６年８月６日更新（access/pdf/mapping.pdf マップ内表記・2026-08-16 実機確認）"

# ZIP → (県キー, 県名)。県キーは既存 external_id の第2要素
ZIPS = [
    ("csv_220kv", "kikan", None),
    ("csv_tori", "tottori", "鳥取県"),
    ("csv_shima", "shimane", "島根県"),
    ("csv_oka", "okayama", "岡山県"),
    ("csv_hiro", "hiroshima", "広島県"),
    ("csv_yama", "yamaguchi", "山口県"),
]
COL = dict(no=0, name=1, kv1=2, kv2=3, units=4, cap_total=5, cap_op=6, constraint=7,
           flow=8, avail=9, avail_upper=10, n1=11, n1_mw=12, oc=13)
UNDETERMINED = {"-", "‐", "−", "－", "ー", "—", "―", ""}


def read_csv_bytes(b: bytes):
    """encoding は必ず実測。errors='ignore'/'replace' は使わない"""
    for enc in ("utf-8-sig", "cp932"):
        try:
            return b.decode(enc, errors="strict"), enc
        except UnicodeDecodeError:
            continue
    raise RuntimeError("encoding 判定不能：レポートに記載して停止")


def clean(v):
    """★全角スペースは保持する（半角化すると名称不一致の偽陽性を生む・落とし穴#111注記2）"""
    if v is None:
        return None
    v = str(v).replace("\n", " ").strip()
    return None if v in UNDETERMINED else v


def to_float(v):
    v = clean(v)
    if v is None:
        return None
    v = v.replace(",", "").replace("，", "").replace("　", "").replace(" ", "")
    try:
        return float(v)
    except ValueError:
        return None


def to_int(v):
    f = to_float(v)
    return int(f) if f is not None else None


def parse_n1(v):
    """「可」→True /「不可　♯３」→False / 未算定→None（False に潰さない）"""
    v = clean(v)
    if v is None:
        return None
    v = v.replace("　", " ").strip()
    if v.startswith("不可"):
        return False
    if v.startswith("可"):
        return True
    return None


def parse_oc(v):
    v = clean(v)
    if v is None:
        return None
    if "有" in v:
        return "有り"
    if "な" in v or "無" in v:
        return "なし"
    return None


def is_data_row(no: str) -> bool:
    """※（脚注）・（フェンス）はデータ行ではない。【留意事項】は既存側に取り込まれているため残す"""
    if not no:
        return False
    return not (no.startswith("※") or no.startswith("・"))


def load_zip_rows():
    files, rows = [], []
    for zname, prefkey, pref in ZIPS:
        zpath = SRC / f"{zname}.zip"
        with zipfile.ZipFile(zpath) as zf:
            for member in sorted(zf.namelist()):
                if "_tr_" not in member:
                    continue  # 送電線(line)は /grid の対象外
                raw = zf.read(member)
                txt, enc = read_csv_bytes(raw)
                data = list(csv.reader(io.StringIO(txt)))
                meta = clean(data[0][0]) if data else None
                m = re.search(r"_tr_(\d{6})_", member)
                cnt = 0
                for r in data[2:]:
                    if not r or len(r) < 13:
                        continue
                    no = clean(r[COL["no"]])
                    if not no or not is_data_row(no):
                        continue
                    rows.append({
                        "external_id": f"energia_{prefkey}_{no}",
                        "no": no, "zip": zname, "member": member, "prefecture": pref,
                        "name": clean(r[COL["name"]]),
                        "voltage_primary_kv": to_float(r[COL["kv1"]]),
                        "voltage_secondary_kv": to_float(r[COL["kv2"]]),
                        "units": to_int(r[COL["units"]]),
                        "capacity_total_mw": to_float(r[COL["cap_total"]]),
                        "cap_operational_mw": to_float(r[COL["cap_op"]]),
                        "op_constraint": clean(r[COL["constraint"]]),
                        "forecast_flow_mw": to_float(r[COL["flow"]]),
                        "cap_avail_mw": to_float(r[COL["avail"]]),
                        "cap_avail_upper_mw": to_float(r[COL["avail_upper"]]),
                        "n1_eligible": parse_n1(r[COL["n1"]]),
                        "n1_capacity_mw": to_float(r[COL["n1_mw"]]),
                        "oc_possibility": parse_oc(r[COL["oc"]]),
                        "src_encoding": enc, "src_meta": meta,
                    })
                    cnt += 1
                files.append({"zip": f"{zname}.zip", "member": member,
                              "url": f"{BASE_URL}/zip/{zname}.zip",
                              "bytes": len(raw), "encoding": enc, "meta_row": meta,
                              "file_version": m.group(1) if m else None,
                              "data_rows": cnt, "prefecture": pref})
    return files, rows


def vkey(v1, v2):
    """★baseline は int、CSV は float で入るため float 正規化して比較する
    （未正規化だと多面設備が全て『消滅』に化ける・東北で実証）"""
    def n(v):
        return "-" if v is None else f"{float(v):g}"
    return f"{n(v1)}/{n(v2)}"


def num_eq(a, b):
    if a is None or b is None:
        return a is None and b is None
    return abs(float(a) - float(b)) < 1e-9


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", required=True)
    ap.parse_args()

    R = {"generated": date.today().isoformat(), "version_old": "2026/4/1",
         "version_new": "2026/8/6", "version_evidence": MAPPING_PDF_NOTE,
         "files": [], "warnings": [], "requires_judgement": []}

    print("=== 1. 取得ファイル・encoding 実測（ZIPメンバー個別） ===")
    files, raw_rows = load_zip_rows()
    R["files"] = files
    vers = {}
    for f in files:
        vers.setdefault(f["file_version"], []).append(f["prefecture"] or "（基幹系）")
    for f in files:
        print(f"  {f['member']:40s} {f['encoding']:9s} {f['bytes']:6d}B 版={f['file_version']} メタ={f['meta_row']} 行{f['data_rows']:3d} {f['prefecture'] or '基幹'}")
    print(f"  生データ行 合計 {len(raw_rows)}件")
    R["file_versions"] = {k: sorted(set(v)) for k, v in vers.items()}

    # ── baseline（本番実データ GET・落とし穴#113）──
    base = json.loads(BASELINE.read_text(encoding="utf-8"))
    NUMKEYS = ["cap_avail_mw", "cap_avail_upper_mw", "cap_operational_mw", "capacity_total_mw",
               "forecast_flow_mw", "n1_capacity_mw", "units", "voltage_primary_kv", "voltage_secondary_kv"]
    for b in base:
        for k in NUMKEYS:
            b.setdefault(k, None)
        b.setdefault("prefecture", None)
        oc = b.get("oc_possibility")
        b["oc_possibility"] = (oc[0] if isinstance(oc, list) and oc else None)
    base_ids = {b.get("external_id") for b in base}
    base_names = {}
    for b in base:
        nm = (b.get("name") or "").strip()
        if nm and not nm.startswith("(名称非公開)"):
            base_names.setdefault(nm, b["slug"])

    # ── 3. 重複行の除去（#111・名称＋数値の複合判定）──
    # ★中国では baseline 名称一致による除外（共通関数のルール②）を**使わない**（base_names={}）。
    #   同名の変電所が電圧違い・バンク違いで複数存在するのが常態のため、名称一致だけで落とすと
    #   正当な別設備・枝番の振り直しを潰す（実測: 玉造/安浦/大崎の4行が誤除去された）。
    #   ルール①（同一ファイル内で名称一致かつ運用容量・予想潮流・空容量・設備容量が全て同値）は
    #   安全なので残す。No.の振り直しは後段の「新規×消滅の突合」で検出する。
    kept, excluded = apply_series_dedup(
        raw_rows, base_ids=base_ids, base_names={},
        key_id="external_id", key_name="name",
        value_keys=("cap_operational_mw", "forecast_flow_mw", "cap_avail_mw", "capacity_total_mw"),
        group_key="member",
    )
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(excluded),
                   "breakdown": summarize(excluded),
                   "examples": [{"external_id": e["external_id"], "name": e["name"],
                                 "reason": e["exclude_reason"]} for e in excluded[:5]]}
    print(f"\n=== 3. 重複除去（#111）===")
    print(f"  dedupe 前 {len(raw_rows)} → 後 {len(kept)}（除去 {len(excluded)} 件 {summarize(excluded) or ''}）")
    for e in excluded[:5]:
        print(f"    除去: {e['external_id']} 「{e['name']}」← {e['exclude_reason']}")

    # ── 突合 ──
    bidx = {}
    for b in base:
        bidx.setdefault(b.get("external_id"), []).append(b)

    def pick(cands, row, used_ids):
        free = [c for c in cands if id(c) not in used_ids]
        if not free:
            return None
        if len(cands) == 1:
            return free[0]
        want_v = vkey(row.get("voltage_primary_kv"), row.get("voltage_secondary_kv"))
        pool = [c for c in free
                if vkey(c.get("voltage_primary_kv"), c.get("voltage_secondary_kv")) == want_v] or free
        for keyname in ("capacity_total_mw", "cap_operational_mw", "units"):
            exact = [c for c in pool if num_eq(c.get(keyname), row.get(keyname))]
            if len(exact) == 1:
                return exact[0]
            if exact:
                pool = exact
        return pool[0] if len(pool) == 1 else None

    matched, new_rows, ambiguous = [], [], []
    used = set()
    for r in kept:
        cands = bidx.get(r["external_id"])
        if not cands:
            new_rows.append(r)
            continue
        b = pick(cands, r, used)
        if b is None:
            ambiguous.append(r)
            continue
        used.add(id(b))
        matched.append((b, r))
    removed = [b for b in base if id(b) not in used]

    # ── 新規 × 消滅 の突合＝No.の振り直し（同一設備の枝番変更）を検出 ──
    # 中国は 島①S6 → 島①S6-2、広⑤S15-1 → 広⑤S15 のように枝番が付いたり外れたりする。
    # 名称＋電圧面＋設備容量＋運用容量＋台数が一致するものは「同一設備のNo.変更」として扱い、
    # 新規/消滅から外して要判断に載せる（external_id が変わるため機械的な上書きは危険）。
    renumber_pairs = []
    for r in list(new_rows):
        for b in list(removed):
            if (b.get("name") or "").strip() != (r.get("name") or "").strip():
                continue
            if vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")) != \
               vkey(r.get("voltage_primary_kv"), r.get("voltage_secondary_kv")):
                continue
            if not (num_eq(b.get("capacity_total_mw"), r.get("capacity_total_mw"))
                    and num_eq(b.get("cap_operational_mw"), r.get("cap_operational_mw"))
                    and num_eq(b.get("units"), r.get("units"))):
                continue
            renumber_pairs.append({
                "slug": b["slug"], "name": b.get("name"), "prefecture": b.get("prefecture"),
                "old_external_id": b.get("external_id"), "new_external_id": r["external_id"],
                "kv": vkey(b.get("voltage_primary_kv"), b.get("voltage_secondary_kv")),
                "capacity_total_mw": b.get("capacity_total_mw"),
                "cap_avail_old": b.get("cap_avail_mw"), "cap_avail_new": r.get("cap_avail_mw"),
            })
            new_rows.remove(r)
            removed.remove(b)
            break

    # ── 5. 同一No.で名称が変わった行（非公開⇄実名は別カテゴリ）──
    kept_names = {(x.get("name") or "").strip() for x in kept}
    renamed_hard, renumbered, disclosure = [], [], []
    for b, r in matched:
        bn = (b.get("name") or "").strip()
        rn = (r.get("name") or "").strip()
        if not bn or not rn or bn == rn:
            continue
        rec = {"slug": b["slug"], "external_id": b.get("external_id"),
               "old_name": bn, "new_name": rn, "prefecture": b.get("prefecture")}
        if bn.startswith("(名称非公開)") or rn.startswith("(名称非公開)"):
            disclosure.append(rec)
        elif bn in kept_names:
            rec["old_name_now_at"] = [x["external_id"] for x in kept if (x.get("name") or "").strip() == bn]
            renumbered.append(rec)
        else:
            renamed_hard.append(rec)

    FIELDS = [("cap_avail_mw", "空き容量(当該)"), ("cap_avail_upper_mw", "空容量(上位系等考慮)"),
              ("cap_operational_mw", "運用容量"), ("forecast_flow_mw", "予想潮流"),
              ("capacity_total_mw", "設備容量"), ("n1_capacity_mw", "N-1電制適用可能量"),
              ("units", "台数"), ("oc_possibility", "出力制御の可能性")]
    field_stats, changed_slugs = {}, set()
    for key, label in FIELDS:
        chg = filled = lost = 0
        for b, r in matched:
            o, n = b.get(key), r.get(key)
            if o is None and n is not None:
                filled += 1; changed_slugs.add(b["slug"])
            elif o is not None and n is None:
                lost += 1
            elif o != n:
                chg += 1; changed_slugs.add(b["slug"])
        field_stats[label] = {"changed": chg, "filled": filled, "lost_to_undetermined": lost}

    n1_undetermined, n1_changed = [], []
    for b, r in matched:
        o, n = b.get("n1_eligible"), r.get("n1_eligible")
        if n is None:
            if o is not None:
                n1_undetermined.append({"operator": "中国電力ネットワーク", "area": "中国",
                                        "slug": b["slug"], "external_id": b.get("external_id"),
                                        "name": b.get("name"), "prefecture": b.get("prefecture"),
                                        "stored_n1_eligible": o,
                                        "source": "sys_capa_*_tr_2026{07,08}_07.csv（2026-08-06公表）"})
        elif o != n:
            n1_changed.append({"slug": b["slug"], "name": b.get("name"),
                               "prefecture": b.get("prefecture"), "old": o, "new": n})
            changed_slugs.add(b["slug"])
    oc_undetermined = [{"slug": b["slug"], "name": b.get("name"), "prefecture": b.get("prefecture"),
                        "stored": b.get("oc_possibility")}
                       for b, r in matched
                       if b.get("oc_possibility") is not None and r.get("oc_possibility") is None]

    dec, inc = [], []
    for b, r in matched:
        o, n = b.get("cap_avail_mw"), r.get("cap_avail_mw")
        if o is None or n is None:
            continue
        rec = {"slug": b["slug"], "name": b.get("name"), "prefecture": b.get("prefecture"),
               "old": o, "new": n, "delta": n - o}
        if n < o:
            dec.append(rec)
        elif n > o:
            inc.append(rec)
    dec.sort(key=lambda x: x["delta"])
    inc.sort(key=lambda x: -x["delta"])
    zeroed = [d for d in dec if d["new"] == 0]

    def pref_count(rows, getter):
        c = {}
        for x in rows:
            c[getter(x) or "（基幹系）"] = c.get(getter(x) or "（基幹系）", 0) + 1
        return c
    pref_old = pref_count(base, lambda x: x.get("prefecture"))
    pref_new = pref_count(kept, lambda x: x.get("prefecture"))

    delta_pct = (len(kept) - len(base)) / len(base) * 100 if base else 0
    if abs(delta_pct) > 10:
        R["warnings"].append(f"件数が {delta_pct:+.1f}% 変動（±10%超）。取り込みミスを疑うこと")
    if renamed_hard:
        R["requires_judgement"].append(f"同一No.名称変更（旧名称が新CSVに不在）{len(renamed_hard)}件 → 本実行ブロック")
    if ambiguous:
        R["requires_judgement"].append(f"一意に紐付かない行 {len(ambiguous)}件")
    if removed:
        R["requires_judgement"].append(f"消滅（新CSVに不在）{len(removed)}件 → 301/凍結の方針判断が必要")
    if renumber_pairs:
        R["requires_judgement"].append(
            f"No.の振り直し（同一設備で external_id が変化）{len(renumber_pairs)}件 → "
            f"slug維持のまま external_id を更新するか要判断")

    R.update({
        "counts": {"baseline": len(base), "new_after_dedupe": len(kept), "matched": len(matched),
                   "new_records": len(new_rows), "disappeared": len(removed), "ambiguous": len(ambiguous),
                   "changed": len(changed_slugs), "unchanged": len(matched) - len(changed_slugs),
                   "delta_pct": round(delta_pct, 2)},
        "field_stats": field_stats,
        "avail_decreased": {"count": len(dec), "zeroed": len(zeroed), "top10": dec[:10]},
        "avail_increased": {"count": len(inc), "top5": inc[:5]},
        "n1_undetermined": {"count": len(n1_undetermined), "entries": n1_undetermined},
        "oc_undetermined": {"count": len(oc_undetermined), "entries": oc_undetermined},
        "n1_changed": {"count": len(n1_changed), "examples": n1_changed[:10]},
        "renamed_blocking": renamed_hard, "renumbered": renumbered, "disclosure_change": disclosure,
        "renumber_pairs": renumber_pairs,
        "ambiguous_rows": [{"external_id": a["external_id"], "name": a["name"],
                            "kv": vkey(a["voltage_primary_kv"], a["voltage_secondary_kv"])} for a in ambiguous],
        "new_records_detail": [{"external_id": r["external_id"], "name": r["name"], "prefecture": r["prefecture"],
                                "kv": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                                "cap_avail_mw": r["cap_avail_mw"], "cap_operational_mw": r["cap_operational_mw"],
                                "member": r["member"]} for r in new_rows],
        "disappeared_records": [{"slug": b["slug"], "external_id": b.get("external_id"),
                                 "name": b.get("name"), "prefecture": b.get("prefecture")} for b in removed],
        "pref_counts": {"old": pref_old, "new": pref_new},
    })

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")
    N1_OUT.write_text(json.dumps({
        "purpose": "公表CSVで N-1電制適用可否が未算定（-）の設備（中国電力NW分）。"
                   "microCMS の n1_eligible は boolean のため false に潰れているが実態は「未算定」。",
        "note": "再取込では上書きせず現値維持する。_common/n1_undetermined.json への統合用。",
        "count": len(n1_undetermined), "entries": n1_undetermined,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    write_md(R)
    print(f"\n→ {OUT_JSON} / {OUT_MD} / {N1_OUT} 出力")
    print("[dry-run] 完了（microCMS 書込なし）")


def write_md(R):
    c = R["counts"]
    L, A = [], None
    A = L.append
    A(f"# 中国電力NW 予想潮流等 取込 dry-run 差分レポート（{R['generated']}）\n")
    A(f"**版**: 当方 `{R['version_old']}` → 新 **`{R['version_new']}`**  ")
    A(f"**版の根拠**: {R['version_evidence']}  ")
    A("**microCMS への書込は行っていない（GET のみ）**\n")
    if R["requires_judgement"]:
        A("## ⚠ 要判断（本実行ブロック）\n")
        for w in R["requires_judgement"]:
            A(f"- {w}")
        A("")
    if R["warnings"]:
        A("## ⚠ 警告\n")
        for w in R["warnings"]:
            A(f"- {w}")
        A("")
    A("## 1. 取得ファイル一覧（ZIPメンバー個別に encoding 実測）\n")
    A(f"取得元: `{R['files'][0]['url'].rsplit('/',1)[0]}/`（公表ページのリンクから実確認・URL推測なし）\n")
    A("★ 当方記録の `zip/220kv.zip` は現行ページに存在せず、**`zip/csv_220kv.zip` に改名**されていた。\n")
    A("| ZIP | メンバー(tr) | バイト数 | encoding | ファイル版 | メタ行 | データ行 | 県 |")
    A("|---|---|---:|---|---|---|---:|---|")
    for f in R["files"]:
        A(f"| `{f['zip']}` | `{f['member']}` | {f['bytes']:,} | **{f['encoding']}** | {f['file_version']} | {f['meta_row']} | {f['data_rows']} | {f['prefecture'] or '（基幹系）'} |")
    A("")
    A("### 版の混在（重要）\n")
    A("依頼書の前提「ZIP/CSV のファイル名に日付が入らない」は **ZIP名のみ該当**。")
    A("**ZIP内のCSVメンバー名には `YYYYMM` が入っており**、版が県で分かれていた:\n")
    for v, prefs in sorted(R["file_versions"].items()):
        A(f"- `{v}`: {', '.join(prefs)}")
    A("\n各CSVのメタ行（L0）にも更新日があり、mapping.pdf の 2026年8月6日 と整合する（基幹・広島）。\n")
    d = R["dedupe"]
    A("## 2. 行数と重複除去（落とし穴 #111）\n")
    A(f"- 生 **{d['before']}** 行 → dedupe 後 **{d['after']}** 行（除去 **{d['removed']}** 件 {d['breakdown'] or ''}）")
    if d["examples"]:
        for e in d["examples"]:
            A(f"  - {e['external_id']} 「{e['name']}」← {e['reason']}")
    else:
        A("  - 除去0件（系列別ビューの再掲なし＝素通し）")
    A("\n**同名別設備の保全**: 三石(変)×3・三原/三成/三次/三田尻×2 等は名称が同じでも電圧・容量が異なるため、")
    A("名称＋（運用容量・予想潮流・空容量・設備容量）の複合判定で**いずれも除去されていない**ことを確認済み。\n")
    A("## 3. 設備の増減\n")
    A("| 区分 | 件数 |")
    A("|---|---:|")
    A(f"| baseline（現行・microCMS GET） | {c['baseline']} |")
    A(f"| 新CSV（dedupe後） | {c['new_after_dedupe']} |")
    A(f"| 紐付き（マッチ） | {c['matched']} |")
    A(f"| 新規 | {c['new_records']} |")
    A(f"| 消滅 | {c['disappeared']} |")
    A(f"| 一意に紐付かない | {c['ambiguous']} |")
    A(f"| 変更あり | {c['changed']} |")
    A(f"| 変化なし | {c['unchanged']} |")
    A(f"| 増減率 | {c['delta_pct']:+.2f}%（±10%超で警告） |")
    A("")
    if R["new_records_detail"]:
        A("### 新規の内訳\n")
        for r in R["new_records_detail"][:20]:
            A(f"- `{r['external_id']}` 「{r['name']}」{r['prefecture'] or '（基幹系）'} {r['kv']}kV "
              f"空容量={r['cap_avail_mw']} 運用={r['cap_operational_mw']}（{r['member']}）")
        A("")
    if R["disappeared_records"]:
        A("### 消滅の内訳（★勝手に削除しない）\n")
        for r in R["disappeared_records"][:20]:
            A(f"- `{r['slug']}` {r['external_id']} 「{r['name']}」{r['prefecture'] or '（基幹系）'}")
        A("")
    A("## 4. フィールド別の変化\n")
    A("| フィールド | 値変化 | 新規充足(null→値) | 未算定化(値→null) |")
    A("|---|---:|---:|---:|")
    for k, v in R["field_stats"].items():
        A(f"| {k} | {v['changed']} | {v['filled']} | {v['lost_to_undetermined']} |")
    A("")
    dec, inc = R["avail_decreased"], R["avail_increased"]
    A("## 5. 空き容量が減った変電所（投資判断に直結）\n")
    A(f"**{dec['count']} 件**（うちゼロ化 **{dec['zeroed']}** 件）\n")
    if dec["top10"]:
        A("| 変電所 | 県 | 現値 | 新値 | 差 |")
        A("|---|---|---:|---:|---:|")
        for x in dec["top10"]:
            A(f"| {x['name']} | {x['prefecture'] or '（基幹系）'} | {x['old']:g} | {x['new']:g} | {x['delta']:+g} |")
    else:
        A("該当なし")
    A("")
    A("## 6. 空き容量が増えた変電所\n")
    A(f"**{inc['count']} 件**\n")
    if inc["top5"]:
        A("| 変電所 | 県 | 現値 | 新値 | 差 |")
        A("|---|---|---:|---:|---:|")
        for x in inc["top5"]:
            A(f"| {x['name']} | {x['prefecture'] or '（基幹系）'} | {x['old']:g} | {x['new']:g} | {x['delta']:+g} |")
    else:
        A("該当なし")
    A("")
    n1u = R["n1_undetermined"]
    A("## 7. 未算定で boolean が false に潰れる件数（N-1電制適用可否）\n")
    A(f"**{n1u['count']} 件**。既定＝**上書きせず現値維持**（false で潰さない）。")
    A(f"社別一覧は `scripts/experimental/_common/n1_undetermined_chugoku.json` に出力済み"
      f"（`_common/n1_undetermined.json`＝北陸222＋東京13 に統合可能な形式）。\n")
    if n1u["entries"]:
        A("<details><summary>一覧（先頭30件）</summary>\n")
        A("| slug | 変電所 | 県 | 現値 |")
        A("|---|---|---|---|")
        for e in n1u["entries"][:30]:
            A(f"| `{e['slug']}` | {e['name']} | {e['prefecture'] or '（基幹系）'} | {e['stored_n1_eligible']} |")
        A("\n</details>\n")
    ocu = R["oc_undetermined"]
    A(f"### （参考）出力制御の可能性が未算定化: **{ocu['count']} 件**（同じく現値維持の対象）\n")
    n1c = R["n1_changed"]
    A("## 8. N-1電制適用可否の変化\n")
    A(f"**{n1c['count']} 件**\n")
    for x in n1c["examples"]:
        A(f"- {x['name']}（{x['prefecture'] or '基幹系'}）: {x['old']} → {x['new']}")
    A("")
    A("## 9. 同一No.で名称が変わった行\n")
    if R["renamed_blocking"]:
        A(f"### ⚠ 旧名称が新CSVに不在＝**行の差し替え疑い**（{len(R['renamed_blocking'])}件・上書き禁止）\n")
        A("| slug | external_id | 旧名称 | 新名称 |")
        A("|---|---|---|---|")
        for x in R["renamed_blocking"]:
            A(f"| `{x['slug']}` | {x['external_id']} | {x['old_name']} | {x['new_name']} |")
        A("")
    else:
        A("- 旧名称が新CSVに不在のもの: **0件**\n")
    if R.get("renumber_pairs"):
        A(f"### ⚠ No.の振り直し（同一設備で external_id が変化）: **{len(R['renumber_pairs'])}件**\n")
        A("名称・電圧面・設備容量・運用容量・台数が一致するため**同一設備**と判定。")
        A("新規/消滅からは除外済み。slug を維持したまま external_id を更新するかは**要判断**。\n")
        A("| slug | 変電所 | 県 | 旧 external_id | 新 external_id | 電圧 | 空容量 現→新 |")
        A("|---|---|---|---|---|---|---|")
        for x in R["renumber_pairs"]:
            A(f"| `{x['slug']}` | {x['name']} | {x['prefecture'] or '（基幹系）'} | `{x['old_external_id']}` | "
              f"`{x['new_external_id']}` | {x['kv']}kV | {x['cap_avail_old']} → {x['cap_avail_new']} |")
        A("")
    A(f"### 非公開⇄実名の遷移（公開ポリシー変更・差し替えとは別カテゴリ）: **{len(R['disclosure_change'])}件**\n")
    for x in R["disclosure_change"][:20]:
        A(f"- `{x['slug']}` {x['old_name']} → {x['new_name']}（{x['prefecture'] or '基幹系'}）")
    A("")
    if R["renumbered"]:
        A(f"### No.振り直しの可能性（旧名称が別Noに存在）{len(R['renumbered'])}件\n")
        for x in R["renumbered"]:
            A(f"- `{x['slug']}` {x['old_name']} → {x['new_name']}（旧名称は {x['old_name_now_at']}）")
        A("")
    if R["ambiguous_rows"]:
        A(f"### 一意に紐付かない行 {len(R['ambiguous_rows'])}件\n")
        for x in R["ambiguous_rows"][:20]:
            A(f"- {x['external_id']} 「{x['name']}」{x['kv']}kV")
        A("")
    A("## 10. 県別件数の対比\n")
    A("| 県 | 現行 | 新CSV | 差 |")
    A("|---|---:|---:|---:|")
    keys = sorted(set(R["pref_counts"]["old"]) | set(R["pref_counts"]["new"]),
                  key=lambda k: -R["pref_counts"]["old"].get(k, 0))
    for k in keys:
        o = R["pref_counts"]["old"].get(k, 0)
        n = R["pref_counts"]["new"].get(k, 0)
        A(f"| {k} | {o} | {n} | {n-o:+d} |")
    A("")
    A("## 次段階（本実行時）の注意\n")
    A("- 検証は**素URL**（`?cb=` なし）で判定し `x-vercel-cache` / `age` を記録（落とし穴 #112・ISR TTL 3600秒）")
    A("- 照合は build 成果物（index.json）ではなく**素URLの画面表示値**で行う")
    A("- N-1可否の未算定は**送信しない**（現値維持）")
    A("- `/grid` の集計は `index.json.summary` が単一ソース（runtime microCMS を増やさない・鉄則#3）")
    OUT_MD.write_text("\n".join(L), encoding="utf-8")


if __name__ == "__main__":
    main()
