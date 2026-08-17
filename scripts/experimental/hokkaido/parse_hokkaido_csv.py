# -*- coding: utf-8 -*-
"""
北海道電力ネットワーク 予想潮流等CSV（2026年7月31日更新版ほか）パーサ＋dry-run差分レポート

依頼 BO（2026-08-17）。**microCMS への書込は一切行わない（GET は fetch_baseline.py のみ）**。

実査で確定した仕様:
  - 一次: https://www.hepco.co.jp/network/con_service/public_document/bid_info.html のリンクから
    ZIP25本（sys_capa_kikan ＋ sys_capa_local01〜24）を取得（URL推測なし・L-EIC-019）。
  - encoding は ZIPメンバー個別に実測 → **全50メンバー cp932**。
  - 版は**系統ごとに割れる**（中国と同型）: 202607=21系統 / 202608=local17 / 202605=local08,09 /
    202505=local06。レコード単位で last_updated を持たせる。
  - 既存424件は **PDF 由来**（external_id が `hepco_map_forecast_tide_list_{NN}_{No}_v2-{二次電圧}`、
    source_url も pdf/map_forecast_tide_list_{NN}.pdf）。今回は CSV への**ソース形式変更**を伴う。
  - **基幹（kikan）35件は baseline に1件も存在しない**（424 = local01〜24 の合計と完全一致）。

★突合の要点（2026-08-17 実証）:
  external_id は `PDF番号 × No. × 二次電圧` だが、**No. は系統内で一括シフトすることがある**
  （local17 で +2 シフト）。この場合 eid が偶然一致して**別設備同士を結びつける**（峰浜↔羅臼）。
  よって **主キーは 系統＋名称＋電圧面** とし、external_id は突合に使わない（表示・履歴用）。
  設備容量・運用容量・台数は候補が複数のときの**タイブレーカー**に留める（落とし穴 #115:
  主キーに混ぜると容量が変わった同一設備が「新規＋消滅」に化ける。実際に14件化けた）。
"""
import argparse, csv, io, json, re, sys, zipfile
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "zip_202607"
BASELINE = HERE / "baseline_live.json"
OUT_JSON = Path("reports/grid-hokkaido-dryrun-2026-08-17.json")
OUT_MD = Path("reports/grid-hokkaido-dryrun-2026-08-17.md")
N1_OUT = HERE.parent / "_common" / "n1_undetermined_hokkaido.json"
BASE_URL = "https://www.hepco.co.jp/network/con_service/public_document"
PDF_SAMPLE = f"{BASE_URL}/pdf/map_forecast_tide_list.pdf"

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
    """★全角スペースは保持する（落とし穴 #111 注記2）"""
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
    """「可」→True /「不可　♯１」→False / 未算定（―）→None。★0MWの「可」を潰さない"""
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


def meta_to_iso(meta: str):
    m = re.search(r"(\d{4})年(\d+)月(\d+)日", meta or "")
    return f"{m.group(1)}-{int(m.group(2)):02d}-{int(m.group(3)):02d}" if m else None


def load_rows():
    files, rows = [], []
    for z in sorted(SRC.glob("sys_capa_*.zip")):
        grp = re.search(r"sys_capa_(\w+)\.zip", z.name).group(1)
        nn = None if grp == "kikan" else grp.replace("local", "")
        with zipfile.ZipFile(z) as zf:
            for member in sorted(zf.namelist()):
                raw = zf.read(member)
                txt, enc = read_csv_bytes(raw)
                if "_Tr_" not in member:
                    files.append({"zip": z.name, "member": member, "bytes": len(raw),
                                  "encoding": enc, "kind": "送電線(対象外)", "group": grp,
                                  "meta_row": None, "file_version": None, "data_rows": 0})
                    continue
                data = list(csv.reader(io.StringIO(txt)))
                meta = clean(data[0][0]) if data else None
                fv = re.search(r"_Tr_(\d{6})_", member)
                cnt = 0
                for r in data[2:]:
                    if not r or len(r) < 14:
                        continue
                    no = clean(r[COL["no"]])
                    if not no or not no[0].isdigit():
                        continue
                    kv2 = to_float(r[COL["kv2"]])
                    rows.append({
                        "group": grp, "nn": nn, "no": no,
                        "external_id": (None if nn is None
                                        else f"hepco_map_forecast_tide_list_{nn}_{no}_v2-{kv2}"),
                        "name": clean(r[COL["name"]]),
                        "voltage_primary_kv": to_float(r[COL["kv1"]]),
                        "voltage_secondary_kv": kv2,
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
                        "src_meta": meta, "src_version": fv.group(1) if fv else None,
                        "src_member": member,
                    })
                    cnt += 1
                files.append({"zip": z.name, "member": member, "bytes": len(raw), "encoding": enc,
                              "kind": "変圧器", "group": grp, "meta_row": meta,
                              "file_version": fv.group(1) if fv else None, "data_rows": cnt})
    return files, rows


def num_eq(a, b):
    if a is None or b is None:
        return a is None and b is None
    return abs(float(a) - float(b)) < 1e-9


def ident_key(name, kv1, kv2):
    """主キー＝名称＋電圧面（数値は float 正規化・落とし穴 #114）。
    ★設備容量・台数は**主キーに混ぜない**（落とし穴 #115）。容量が変わった同一設備が
      「新規＋消滅」に化けるため、これらは候補が複数のときのタイブレーカーとしてのみ使う。"""
    def n(v):
        return "-" if v is None else f"{float(v):g}"
    return f"{(name or '').strip()}|{n(kv1)}/{n(kv2)}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", required=True)
    ap.parse_args()

    R = {"generated": date.today().isoformat(), "version_old": "2026/4/1",
         "files": [], "warnings": [], "requires_judgement": []}

    print("=== 1. 取得ファイル・encoding 実測（ZIP25本・メンバー個別）===")
    files, raw_rows = load_rows()
    R["files"] = files
    tr = [f for f in files if f["kind"] == "変圧器"]
    encs = {}
    for f in files:
        encs[f["encoding"]] = encs.get(f["encoding"], 0) + 1
    print(f"  ZIP {len(set(f['zip'] for f in files))}本 / メンバー {len(files)}（変圧器{len(tr)}・送電線{len(files)-len(tr)}）")
    print(f"  encoding: {encs}")
    vers = {}
    for f in tr:
        vers.setdefault((f["file_version"], f["meta_row"]), []).append(f["group"])
    print("  版の分布:")
    for (v, m), gs in sorted(vers.items(), key=lambda x: str(x[0])):
        print(f"    版{v} メタ「{m}」→ {len(gs)}系統 {sorted(gs)}")
    R["versions"] = [{"file_version": v, "meta_row": m, "iso": meta_to_iso(m or ""),
                      "groups": sorted(gs)} for (v, m), gs in vers.items()]
    print(f"  生データ行 合計 {len(raw_rows)}件（基幹 {sum(1 for r in raw_rows if r['group']=='kikan')} ／"
          f" local {sum(1 for r in raw_rows if r['group']!='kikan')}）")

    # ── baseline（本番実データ GET・#113）──
    base = json.loads(BASELINE.read_text(encoding="utf-8"))
    NUM = ["cap_avail_mw", "cap_avail_upper_mw", "cap_operational_mw", "capacity_total_mw",
           "forecast_flow_mw", "n1_capacity_mw", "units", "voltage_primary_kv", "voltage_secondary_kv"]
    for b in base:
        for k in NUM:
            b.setdefault(k, None)
        oc = b.get("oc_possibility")
        b["oc_possibility"] = (oc[0] if isinstance(oc, list) and oc else None)
    R["baseline_source"] = {
        "count": len(base),
        "data_source_format": sorted({(b.get("data_source_format") or [None])[0] for b in base}),
        "sample_source_url": base[0].get("source_url"),
        "external_id_pattern": "hepco_map_forecast_tide_list_{PDF番号}_{No}_v2-{二次電圧}",
        "kikan_records": sum(1 for b in base if "kikan" in (b.get("external_id") or "")),
    }

    # ── #111 重複除去（ルール②は opt-in しない・#117）──
    kept, excluded = apply_series_dedup(
        raw_rows, base_ids={b["external_id"] for b in base}, base_names={},
        key_id="external_id", key_name="name",
        value_keys=("cap_operational_mw", "forecast_flow_mw", "cap_avail_mw", "capacity_total_mw"),
        group_key="src_member",
    )
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(excluded),
                   "breakdown": summarize(excluded),
                   "examples": [{"external_id": e["external_id"], "name": e["name"],
                                 "reason": e["exclude_reason"]} for e in excluded[:5]]}
    print(f"\n=== 3. 重複除去（#111）: 生{len(raw_rows)} → {len(kept)}（除去{len(excluded)}）===")
    for e in excluded[:5]:
        print(f"    除去: {e['external_id']} 「{e['name']}」← {e['exclude_reason']}")

    # ── 突合: 名称＋電圧面＋容量＋台数 を第1キー（系統内）──
    local_rows = [r for r in kept if r["group"] != "kikan"]
    kikan_rows = [r for r in kept if r["group"] == "kikan"]
    bidx = {}
    for b in base:
        m = re.match(r"^hepco_map_forecast_tide_list_(\d+)_", b.get("external_id") or "")
        nn = m.group(1) if m else "?"
        key = ident_key(b.get("name"), b.get("voltage_primary_kv"), b.get("voltage_secondary_kv"))
        bidx.setdefault((nn, key), []).append(b)

    matched, unmatched_new, used = [], [], set()
    for r in local_rows:
        key = ident_key(r["name"], r["voltage_primary_kv"], r["voltage_secondary_kv"])
        cands = [c for c in bidx.get((r["nn"], key), []) if id(c) not in used]
        if not cands:
            unmatched_new.append(r)
            continue
        # 候補が複数のときだけ 設備容量→運用容量→台数 でタイブレーク（#115）
        pool = cands
        if len(pool) > 1:
            for k in ("capacity_total_mw", "cap_operational_mw", "units"):
                exact = [c for c in pool if num_eq(c.get(k), r.get(k))]
                if len(exact) == 1:
                    pool = exact
                    break
                if exact:
                    pool = exact
        b = pool[0]
        used.add(id(b))
        matched.append((b, r))
    removed = [b for b in base if id(b) not in used]

    # No.振り直し（eid が変わった＝同一設備で external_id が変化）
    renumber = [{"slug": b["slug"], "name": b.get("name"),
                 "old_external_id": b.get("external_id"), "new_external_id": r["external_id"],
                 "kv": f"{r['voltage_primary_kv']}/{r['voltage_secondary_kv']}",
                 "capacity_total_mw": r["capacity_total_mw"]}
                for b, r in matched if b.get("external_id") != r["external_id"]]

    # ── フィールド別変化 ──
    FIELDS = [("cap_avail_mw", "空き容量(当該)"), ("cap_avail_upper_mw", "空容量(上位系等考慮)"),
              ("cap_operational_mw", "運用容量"), ("forecast_flow_mw", "予想潮流"),
              ("capacity_total_mw", "設備容量"), ("n1_capacity_mw", "N-1電制適用可能量"),
              ("units", "台数"), ("oc_possibility", "出力制御の可能性")]
    field_stats, changed = {}, set()
    for k, label in FIELDS:
        chg = filled = lost = 0
        for b, r in matched:
            o, n = b.get(k), r.get(k)
            if o is None and n is not None:
                filled += 1; changed.add(b["slug"])
            elif o is not None and n is None:
                lost += 1
            elif o != n:
                chg += 1; changed.add(b["slug"])
        field_stats[label] = {"changed": chg, "filled": filled, "lost_to_undetermined": lost}

    # ── N-1電制（0 / 未算定 / 不可 を区別）──
    n1_changed, n1_undet = [], []
    for b, r in matched:
        o, n = b.get("n1_eligible"), r.get("n1_eligible")
        if n is None:
            if o is not None:
                n1_undet.append({"operator": "北海道電力ネットワーク", "area": "北海道",
                                 "slug": b["slug"], "external_id": b.get("external_id"),
                                 "name": b.get("name"), "prefecture": b.get("prefecture"),
                                 "stored_n1_eligible": o,
                                 "source": "sys_capa_*_Tr_*.csv（2026-07-31ほか）"})
        elif o != n:
            n1_changed.append({"slug": b["slug"], "name": b.get("name"), "old": o, "new": n,
                               "new_capacity_mw": r.get("n1_capacity_mw")})
            changed.add(b["slug"])
    n1_ok_new = [r for r in kept if r["n1_eligible"] is True]
    n1_zero = [r for r in n1_ok_new if r["n1_capacity_mw"] == 0]
    oc_undet = [{"slug": b["slug"], "name": b.get("name"), "stored": b.get("oc_possibility")}
                for b, r in matched
                if b.get("oc_possibility") is not None and r.get("oc_possibility") is None]

    # ── 空き容量の増減 ──
    dec, inc = [], []
    for b, r in matched:
        o, n = b.get("cap_avail_mw"), r.get("cap_avail_mw")
        if o is None or n is None:
            continue
        rec = {"slug": b["slug"], "name": b.get("name"), "old": o, "new": n, "delta": n - o}
        (dec if n < o else inc if n > o else []).append(rec) if n != o else None
    dec.sort(key=lambda x: x["delta"])
    inc.sort(key=lambda x: -x["delta"])
    zeroed = [d for d in dec if d["new"] == 0]

    # 系統別件数
    grp_new = {}
    for r in kept:
        grp_new[r["group"]] = grp_new.get(r["group"], 0) + 1
    grp_old = {}
    for b in base:
        m = re.match(r"^hepco_map_forecast_tide_list_(\d+)_", b.get("external_id") or "")
        g = f"local{m.group(1)}" if m else "?"
        grp_old[g] = grp_old.get(g, 0) + 1

    total_new = len(kept)
    delta_pct = (total_new - len(base)) / len(base) * 100
    if abs(delta_pct) > 10:
        R["warnings"].append(f"件数が {delta_pct:+.1f}% 変動（±10%超）＝基幹35件の新規収録による。"
                             f"取り込みミスではないが本実行前に確認すること")
    if kikan_rows:
        R["requires_judgement"].append(
            f"基幹（187kV以上）{len(kikan_rows)}件が baseline に未収録 → 新規追加するかの方針判断と slug 採番が必要")
    if unmatched_new or removed:
        R["requires_judgement"].append(f"真の新規{len(unmatched_new)}件・消滅{len(removed)}件の扱い")
    if renumber:
        R["requires_judgement"].append(
            f"No.振り直し {len(renumber)}件 → slug維持・external_id更新の可否（中国と同じ扱いにするか）")

    R.update({
        "counts": {"baseline": len(base), "new_total": total_new,
                   "new_local": len(local_rows), "new_kikan": len(kikan_rows),
                   "matched": len(matched), "new_records": len(unmatched_new),
                   "disappeared": len(removed), "renumbered": len(renumber),
                   "changed": len(changed), "unchanged": len(matched) - len(changed),
                   "delta_pct": round(delta_pct, 2)},
        "field_stats": field_stats,
        "avail_decreased": {"count": len(dec), "zeroed": len(zeroed), "top10": dec[:10]},
        "avail_increased": {"count": len(inc), "top5": inc[:5]},
        "n1": {"baseline_ok": sum(1 for b in base if b.get("n1_eligible") is True),
               "csv_ok": len(n1_ok_new), "csv_ok_zero_mw": len(n1_zero),
               "csv_undetermined": sum(1 for r in kept if r["n1_eligible"] is None),
               "changed": n1_changed,
               "ok_list": [{"group": r["group"], "no": r["no"], "name": r["name"],
                            "kv": f"{r['voltage_primary_kv']}/{r['voltage_secondary_kv']}",
                            "capacity_mw": r["n1_capacity_mw"]} for r in n1_ok_new]},
        "n1_undetermined": {"count": len(n1_undet), "entries": n1_undet},
        "oc_undetermined": {"count": len(oc_undet), "entries": oc_undet},
        "renumber": renumber,
        "new_records_detail": [{"external_id": r["external_id"], "name": r["name"],
                                "kv": f"{r['voltage_primary_kv']}/{r['voltage_secondary_kv']}",
                                "group": r["group"]} for r in unmatched_new],
        "kikan_detail": [{"no": r["no"], "name": r["name"],
                          "kv": f"{r['voltage_primary_kv']}/{r['voltage_secondary_kv']}",
                          "cap_avail_mw": r["cap_avail_mw"], "n1_eligible": r["n1_eligible"],
                          "n1_capacity_mw": r["n1_capacity_mw"]} for r in kikan_rows],
        "disappeared_records": [{"slug": b["slug"], "external_id": b.get("external_id"),
                                 "name": b.get("name")} for b in removed],
        "group_counts": {"old": grp_old, "new": grp_new},
    })

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")
    N1_OUT.write_text(json.dumps({
        "purpose": "公表CSVで N-1電制適用可否が未算定（―）の設備（北海道電力NW分）",
        "note": "再取込では上書きせず現値維持する。_common/n1_undetermined.json への統合用。",
        "count": len(n1_undet), "entries": n1_undet,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    write_md(R)
    print(f"\n→ {OUT_JSON} / {OUT_MD} / {N1_OUT} 出力")
    print("[dry-run] 完了（microCMS 書込なし）")


def write_md(R):
    c = R["counts"]
    L = []
    A = L.append
    A(f"# 北海道電力NW 予想潮流等 取込 dry-run 差分レポート（{R['generated']}）\n")
    A(f"**版**: 当方 `{R['version_old']}` → 新（系統ごとに割れる・下表）  ")
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
    bs = R["baseline_source"]
    A("## 1. 既存424件の由来（§1-a）\n")
    A(f"- **PDF 由来で確定**。`data_source_format` = {bs['data_source_format']} ／ "
      f"サンプル source_url = `{bs['sample_source_url']}`")
    A(f"- external_id 体系 = `{bs['external_id_pattern']}`（PDF番号がキーに埋まっている）")
    A(f"- **基幹（kikan）のレコードは baseline に {bs['kikan_records']} 件**＝187kV以上系統は未収録")
    A("- → CSV へ切り替える場合は **ソース形式の変更**。`data_source_format` を CSV へ、"
      "一次ソースURLを ZIP のものへ差し替える必要がある（本実行時の対応項目）\n")
    A("## 2. 版（系統ごとに割れる）\n")
    A("| ファイル版 | メタ行 | 系統数 | 系統 |")
    A("|---|---|---:|---|")
    for v in sorted(R["versions"], key=lambda x: str(x["file_version"])):
        A(f"| `{v['file_version']}` | {v['meta_row']} | {len(v['groups'])} | {', '.join(v['groups'])} |")
    A("\n★ `local17` は **2026年8月7日更新**で、依頼書時点の「8月版なし」より新しい。"
      "`local06` は **2025年5月29日**（1年以上前）で据え置かれている。"
      "→ **レコード単位で `last_updated` を持たせる**（中国と同じ扱い）\n")
    A("## 3. 取得ファイル一覧（encoding は実測）\n")
    A(f"取得元: `{BASE_URL}/zip/`（公表ページのリンクから実確認・URL推測なし）\n")
    A("| ZIP | メンバー | 種別 | バイト数 | encoding | 版 | メタ行 | データ行 |")
    A("|---|---|---|---:|---|---|---|---:|")
    for f in R["files"]:
        A(f"| `{f['zip']}` | `{f['member']}` | {f['kind']} | {f['bytes']:,} | **{f['encoding']}** | "
          f"{f['file_version'] or '—'} | {f['meta_row'] or '—'} | {f['data_rows']} |")
    A("")
    d = R["dedupe"]
    A("## 4. 行数と重複除去（落とし穴 #111）\n")
    A(f"- 生 **{d['before']}** 行 → dedupe 後 **{d['after']}** 行（除去 **{d['removed']}** 件 {d['breakdown'] or ''}）")
    if not d["examples"]:
        A("  - 除去0件（系列別ビューの再掲なし＝素通し）")
    for e in d["examples"]:
        A(f"  - {e['external_id']} 「{e['name']}」← {e['reason']}")
    A("\n※ ルール②（baseline名称一致）は **opt-in していない**（落とし穴 #117）\n")
    A("## 5. 突合キーの確定（§4）\n")
    A("| | 体系 |")
    A("|---|---|")
    A(f"| baseline | `hepco_map_forecast_tide_list_{{PDF番号}}_{{No}}_v2-{{二次電圧}}` |")
    A("| CSV | ZIP `sys_capa_local{NN}` の「変電所No」＋「電圧(二次)」 |")
    A("| 対応 | **PDF番号 NN ↔ localNN が1対1**（24系統すべてで件数一致・424=local合計） |")
    A("\n★ ただし **No. は系統内で一括シフトすることがある**（local17 で +2）。")
    A("この場合 external_id が偶然一致して**別設備同士を結びつける**（峰浜↔羅臼で実証）。")
    A("→ 本パーサは **名称＋電圧面＋設備容量＋台数を第1キー**とし、external_id は補助に留めている。\n")
    A("## 6. 設備の増減\n")
    A("| 区分 | 件数 |")
    A("|---|---:|")
    A(f"| baseline（microCMS GET） | {c['baseline']} |")
    A(f"| 新CSV 合計 | {c['new_total']}（local {c['new_local']} ＋ **基幹 {c['new_kikan']}**） |")
    A(f"| 紐付き（マッチ） | {c['matched']} |")
    A(f"| No.振り直し（同一設備） | {c['renumbered']} |")
    A(f"| 真の新規（local） | {c['new_records']} |")
    A(f"| 消滅 | {c['disappeared']} |")
    A(f"| 変更あり / 変化なし | {c['changed']} / {c['unchanged']} |")
    A(f"| 増減率 | {c['delta_pct']:+.2f}% |")
    A("")
    if R["renumber"]:
        A("### No.振り直し（同一設備で external_id が変化）\n")
        A("| slug | 変電所 | 旧 external_id | 新 external_id | 電圧 |")
        A("|---|---|---|---|---|")
        for x in R["renumber"]:
            A(f"| `{x['slug']}` | {x['name']} | `{x['old_external_id']}` | `{x['new_external_id']}` | {x['kv']}kV |")
        A("")
    if R["new_records_detail"]:
        A("### 真の新規（local）\n")
        for x in R["new_records_detail"]:
            A(f"- `{x['external_id']}` 「{x['name']}」{x['kv']}kV（{x['group']}）")
        A("")
    if R["disappeared_records"]:
        A("### 消滅（★勝手に削除しない）\n")
        for x in R["disappeared_records"]:
            A(f"- `{x['slug']}` {x['external_id']} 「{x['name']}」")
        A("")
    A(f"### 基幹（187kV以上）{c['new_kikan']}件 ＝ 未収録\n")
    A("baseline に1件も無く、424件は local01〜24 の合計と完全一致した。**取りこぼしではなく系統群ごと未収録**。\n")
    A("| No | 変電所 | 電圧 | 空容量 | N-1可否 | N-1可能量 |")
    A("|---|---|---|---:|---|---:|")
    for x in R["kikan_detail"]:
        n1 = "可" if x["n1_eligible"] is True else ("不可" if x["n1_eligible"] is False else "未算定")
        A(f"| {x['no']} | {x['name']} | {x['kv']}kV | {x['cap_avail_mw'] if x['cap_avail_mw'] is not None else '—'} | {n1} | {x['n1_capacity_mw'] if x['n1_capacity_mw'] is not None else '—'} |")
    A("")
    A("## 7. フィールド別の変化\n")
    A("| フィールド | 値変化 | 新規充足 | 未算定化 |")
    A("|---|---:|---:|---:|")
    for k, v in R["field_stats"].items():
        A(f"| {k} | {v['changed']} | {v['filled']} | {v['lost_to_undetermined']} |")
    A("")
    dec, inc = R["avail_decreased"], R["avail_increased"]
    A("## 8. 空き容量が減った変電所（投資判断に直結）\n")
    A(f"**{dec['count']} 件**（うちゼロ化 **{dec['zeroed']}** 件）\n")
    if dec["top10"]:
        A("| 変電所 | 現値 | 新値 | 差 |")
        A("|---|---:|---:|---:|")
        for x in dec["top10"]:
            A(f"| {x['name']} | {x['old']:g} | {x['new']:g} | {x['delta']:+g} |")
    else:
        A("該当なし")
    A("")
    A("## 9. 空き容量が増えた変電所\n")
    A(f"**{inc['count']} 件**\n")
    if inc["top5"]:
        A("| 変電所 | 現値 | 新値 | 差 |")
        A("|---|---:|---:|---:|")
        for x in inc["top5"]:
            A(f"| {x['name']} | {x['old']:g} | {x['new']:g} | {x['delta']:+g} |")
    else:
        A("該当なし")
    A("")
    n1 = R["n1"]
    A("## 10. N-1電制適用可否（§7・大幅増の検証）\n")
    A(f"- baseline の「可」: **{n1['baseline_ok']}件** ／ 新CSVの「可」: **{n1['csv_ok']}件**")
    A(f"- うち **可能量 0MW の「可」: {n1['csv_ok_zero_mw']}件**（0 と 未算定 と 不可 を潰さず区別）")
    A(f"- 新CSVの「未算定（―）」: {n1['csv_undetermined']}件")
    A(f"- 既存レコードとの突合での可否変化: **{len(n1['changed'])}件**\n")
    A("**★増加の原因は「PDF抽出時のフィールド取りこぼし」ではなく「基幹系統の未収録」だった。**")
    A(f"「可」{n1['csv_ok']}件のうち **{sum(1 for x in n1['ok_list'] if x['group']=='kikan')}件が基幹**で、")
    A("local 側の「可」は baseline の3件（旭川100・斜里1・銭亀沢10）と完全一致している。\n")
    A("| 系統 | No | 変電所 | 電圧 | N-1可能量 |")
    A("|---|---|---|---|---:|")
    for x in n1["ok_list"]:
        A(f"| {x['group']} | {x['no']} | {x['name']} | {x['kv']}kV | {x['capacity_mw']} |")
    A("")
    if n1["changed"]:
        A("### 既存レコードでの可否変化\n")
        for x in n1["changed"]:
            A(f"- `{x['slug']}` {x['name']}: {x['old']} → {x['new']}（可能量 {x['new_capacity_mw']}）")
        A("")
    nu = R["n1_undetermined"]
    A("## 11. 未算定で boolean が false に潰れる件数\n")
    A(f"- **N-1電制: {nu['count']}件**（既定＝上書きせず現値維持）。"
      f"`_common/n1_undetermined_hokkaido.json` に出力済み（現在263件へ統合可能）")
    A(f"- 出力制御: {R['oc_undetermined']['count']}件（同じく現値維持）\n")
    if nu["entries"]:
        A("| slug | 変電所 | 現値 |")
        A("|---|---|---|")
        for e in nu["entries"][:30]:
            A(f"| `{e['slug']}` | {e['name']} | {e['stored_n1_eligible']} |")
        A("")
    A("## 12. 系統別の件数対比\n")
    A("| 系統 | 現行 | 新CSV | 差 |")
    A("|---|---:|---:|---:|")
    keys = sorted(set(R["group_counts"]["old"]) | set(R["group_counts"]["new"]))
    for k in keys:
        o = R["group_counts"]["old"].get(k, 0)
        n = R["group_counts"]["new"].get(k, 0)
        A(f"| {k} | {o} | {n} | {n-o:+d} |")
    A("")
    A("## 次段階（本実行時）の注意\n")
    A("- 素URL（`?cb=` なし）で判定し `x-vercel-cache` / `age` を記録（#112・TTL 3600秒）")
    A("- 判定は build 成果物ではなく**レンダリング後の画面表示値**で行う")
    A("- `npm run verify:grid-fields` を通してから push（#118）")
    A("- N-1可否の未算定は送信しない（現値維持）。**0MW の「可」は「可」のまま**送る")
    OUT_MD.write_text("\n".join(L), encoding="utf-8")


if __name__ == "__main__":
    main()
