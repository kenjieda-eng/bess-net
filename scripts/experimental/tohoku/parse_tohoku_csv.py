# -*- coding: utf-8 -*-
"""
東北電力ネットワーク 予想潮流・空容量CSV（2026年7月版）パーサ＋dry-run差分レポート

依頼 BK（2026-08-16）。**microCMS への書込は一切行わない（GET は fetch_baseline.py のみ）**。

実査で確定した仕様:
  - 一次: https://nw.tohoku-epco.co.jp/consignment/system/announcement/ からリンクを辿って取得
    （URLの推測なし・L-EIC-019）。変圧器(tr)8本＝kikan01＋local01〜local07。送電線(line)は対象外。
  - 版: 当方 202603 → 最新 **202607**。
  - エンコーディングは**決め打ちしない**（utf-8-sig → cp932 を errors="strict" で実測）。
  - レイアウトは8本とも共通17列（L0=作成日メタ行, L1=ヘッダ, L2以降データ）。
  - 値の先頭に Excel のテキスト強制引用符 `'` が付く（No・名称）。
  - 突合キー: external_id = `tohoku_{ファイル}_{No}`（既存実データの規則）。
    同一 No. に複数の電圧面があるため（86件重複）、電圧(一次/二次)を第2キーにする。

使い方:
  python scripts/experimental/tohoku/parse_tohoku_csv.py --dry-run
"""
import argparse, csv, io, json, re, sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "csv_202607"
BASELINE = HERE / "baseline_live.json"
OUT_JSON = Path("reports/grid-tohoku-dryrun-2026-08-16.json")
OUT_MD = Path("reports/grid-tohoku-dryrun-2026-08-16.md")
VERSION_NEW, VERSION_OLD = "202607", "202603"
BASE_URL = "https://nw.tohoku-epco.co.jp/consignment/system/announcement/data"

# ファイルキー → 県（既存 baseline の prefecture 実値に合わせる。kikan は None）
FILES = [
    ("kikan01", None), ("local01", "青森県"), ("local02", "岩手県"), ("local03", "秋田県"),
    ("local04", "宮城県"), ("local05", "山形県"), ("local06", "福島県"), ("local07", "新潟県"),
]
COL = dict(no=0, name=1, kv1=2, kv2=3, units=4, cap_total=5, cap_op=6, constraint=7,
           flow=8, avail=9, avail_upper=10, n1=11, n1_mw=12, oc=13, notes=16)
# 未算定を表す記号（ハイフン3種＋全角/長音の揺れ）
UNDETERMINED = {"-", "‐", "−", "－", "ー", "—", "―", ""}


def read_csv_bytes(b: bytes):
    """encoding は必ず実測。errors='ignore'/'replace' は使わない（文字化けを黙って通さない）"""
    for enc in ("utf-8-sig", "cp932"):
        try:
            return b.decode(enc, errors="strict"), enc
        except UnicodeDecodeError:
            continue
    raise RuntimeError("encoding 判定不能：レポートに記載して停止")


def clean(v):
    """先頭の Excel 引用符を外し、未算定記号は None。★全角スペースは保持する（落とし穴#111 注記2）"""
    if v is None:
        return None
    v = str(v)
    if v.startswith("'"):
        v = v[1:]
    v = v.strip()
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
    """「可」→True /「不可 #1」→False / 未算定→None（False に潰さない）"""
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


def parse_file(key: str, pref):
    path = SRC / f"sys_capa_{key}_tr_{VERSION_NEW}_02.csv"
    raw = path.read_bytes()
    txt, enc = read_csv_bytes(raw)
    rows = list(csv.reader(io.StringIO(txt)))
    meta = clean(rows[0][0]) if rows else None
    out = []
    for r in rows[2:]:
        if not r or len(r) < 13:
            continue
        no = clean(r[COL["no"]])
        if not no or not re.match(r"^[0-9A-Z]{3,6}$", no):
            continue
        out.append({
            "external_id": f"tohoku_{key}_{no}",
            "no": no, "file": key,
            "name": clean(r[COL["name"]]),
            "prefecture": pref,
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
            "notes": clean(r[COL["notes"]]) if len(r) > COL["notes"] else None,
            "src_file": path.name, "src_encoding": enc, "src_meta": meta,
        })
    return enc, meta, len(rows), out


def vkey(v1, v2):
    """電圧面の比較キー。★baseline は int（500）、CSV パースは float（500.0）で入るため
    必ず float に正規化してから比較する（未正規化だと全多面設備が紐付かず「消滅」に化ける）。"""
    def n(v):
        return "-" if v is None else f"{float(v):g}"
    return f"{n(v1)}/{n(v2)}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", required=True)
    ap.add_argument("--emit-plan", action="store_true",
                    help="本実行用の patch 計画を出力（承認後のみ。microCMS へは書き込まない）")
    args = ap.parse_args()

    R = {"generated": date.today().isoformat(), "version_old": VERSION_OLD, "version_new": VERSION_NEW,
         "files": [], "warnings": [], "requires_judgement": []}

    print("=== 1. 取得ファイル一覧・encoding 実測 ===")
    raw_rows, total_lines = [], 0
    for key, pref in FILES:
        enc, meta, nlines, rows = parse_file(key, pref)
        raw_rows.extend(rows)
        total_lines += nlines
        size = (SRC / f"sys_capa_{key}_tr_{VERSION_NEW}_02.csv").stat().st_size
        R["files"].append({"file": f"sys_capa_{key}_tr_{VERSION_NEW}_02.csv",
                           "url": f"{BASE_URL}/sys_capa_{key}_tr_{VERSION_NEW}_02.csv",
                           "bytes": size, "encoding": enc, "meta_row": meta,
                           "lines": nlines, "data_rows": len(rows), "prefecture": pref})
        print(f"  {key:9s} {enc:10s} {size:7d}B 行{nlines:4d} データ{len(rows):4d}件 メタ={meta} 県={pref}")
    print(f"  生データ行 合計 {len(raw_rows)}件")

    # ── baseline（本番実データ GET・落とし穴#113）──
    base = json.loads(BASELINE.read_text(encoding="utf-8"))
    NUMKEYS = ["cap_avail_mw", "cap_avail_upper_mw", "cap_operational_mw", "capacity_total_mw",
               "forecast_flow_mw", "n1_capacity_mw", "units", "voltage_primary_kv", "voltage_secondary_kv"]
    for b in base:
        for k in NUMKEYS:
            b.setdefault(k, None)
        oc = b.get("oc_possibility")
        b["oc_possibility"] = (oc[0] if isinstance(oc, list) and oc else None)
    base_ids = {b.get("external_id") for b in base}
    base_names = {}
    for b in base:
        nm = (b.get("name") or "").strip()
        if nm and not nm.startswith("(名称非公開)"):
            base_names.setdefault(nm, b["slug"])

    # ── 3. 重複行の除去（落とし穴#111・共通関数）──
    kept, excluded = apply_series_dedup(
        raw_rows, base_ids=base_ids, base_names=base_names,
        key_id="external_id", key_name="name",
        value_keys=("cap_operational_mw", "forecast_flow_mw", "cap_avail_mw"),
        group_key="file",
    )
    R["dedupe"] = {"before": len(raw_rows), "after": len(kept), "removed": len(excluded),
                   "breakdown": summarize(excluded),
                   "examples": [{"external_id": e["external_id"], "name": e["name"],
                                 "reason": e["exclude_reason"]} for e in excluded[:5]]}
    print(f"\n=== 3. 重複行の除去（#111）===")
    print(f"  dedupe 前 {len(raw_rows)} 行 → 後 {len(kept)} 行、除去 {len(excluded)} 件 {summarize(excluded) or ''}")
    for e in excluded[:5]:
        print(f"    除去: {e['external_id']} 「{e['name']}」← {e['exclude_reason']}")

    # ── 突合（external_id ＋ 電圧面）──
    bidx = {}
    for b in base:
        bidx.setdefault(b.get("external_id"), []).append(b)

    def pick(cands, row, used_ids):
        """同一 No. に複数の変圧器バンクがあるため、電圧面→設備容量→台数の順で一意化する。
        東北では同一No.・同一電圧面で容量だけが違う組（船川 66/33 の 10MW と 6MW 等）があり、
        電圧面だけでは一意にならない（2026-08-16 実測）。未使用の候補のみを対象にする。"""
        free = [c for c in cands if id(c) not in used_ids]
        if not free:
            return None
        if len(free) == 1 and len(cands) == 1:
            return free[0]
        want_v = vkey(row.get("voltage_primary_kv"), row.get("voltage_secondary_kv"))
        same_v = [c for c in free
                  if vkey(c.get("voltage_primary_kv"), c.get("voltage_secondary_kv")) == want_v]
        pool = same_v or ([] if len(cands) > 1 else free)
        if not pool:
            return None
        def num_eq(a, b):
            if a is None or b is None:
                return a is None and b is None
            return abs(float(a) - float(b)) < 1e-9
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

    # ── 5. 同一No.で名称変更 → 上書きせず停止 ──
    kept_names = {(x.get("name") or "").strip() for x in kept}
    renamed_hard, renumbered = [], []
    for b, r in matched:
        bn = (b.get("name") or "").strip()
        rn = (r.get("name") or "").strip()
        if bn and rn and bn != rn:
            if bn in kept_names:
                other = [x["external_id"] for x in kept if (x.get("name") or "").strip() == bn]
                renumbered.append({"slug": b["slug"], "external_id": b.get("external_id"),
                                   "old_name": bn, "new_name": rn, "old_name_now_at": other})
            else:
                renamed_hard.append({"slug": b["slug"], "external_id": b.get("external_id"),
                                     "old_name": bn, "new_name": rn})

    # ── フィールド別変化 ──
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

    # ── 7. 未算定で boolean が false に潰れる件数（n1_eligible）──
    n1_undetermined, n1_changed = [], []
    for b, r in matched:
        o, n = b.get("n1_eligible"), r.get("n1_eligible")
        if n is None:
            if o is not None:
                n1_undetermined.append({"slug": b["slug"], "external_id": b.get("external_id"),
                                        "name": b.get("name"), "prefecture": b.get("prefecture"),
                                        "stored": o})
        elif o != n:
            n1_changed.append({"slug": b["slug"], "name": b.get("name"),
                               "prefecture": b.get("prefecture"), "old": o, "new": n})
            changed_slugs.add(b["slug"])

    # 出力制御の可能性も未算定化する（select・boolean ではないが同じ「現値維持」対象）
    oc_undetermined = [
        {"slug": b["slug"], "name": b.get("name"), "prefecture": b.get("prefecture"), "stored": b.get("oc_possibility")}
        for b, r in matched if b.get("oc_possibility") is not None and r.get("oc_possibility") is None
    ]

    # ── 5/6. 空き容量の増減 ──
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

    # ── 10. 県別件数の対比 ──
    def pref_count(rows, getter):
        c = {}
        for x in rows:
            p = getter(x) or "（基幹系）"
            c[p] = c.get(p, 0) + 1
        return c
    pref_old = pref_count(base, lambda x: x.get("prefecture"))
    pref_new = pref_count(kept, lambda x: x.get("prefecture"))

    delta_pct = (len(kept) - len(base)) / len(base) * 100 if base else 0
    if abs(delta_pct) > 10:
        R["warnings"].append(f"件数が {delta_pct:+.1f}% 変動（±10%超）。取り込みミスを疑うこと")
    if renamed_hard:
        R["requires_judgement"].append(f"同一No.名称変更（旧名称が新CSVに不在）{len(renamed_hard)}件 → 本実行ブロック")
    if ambiguous:
        R["requires_judgement"].append(f"電圧面で一意に紐付かない行 {len(ambiguous)}件")

    R.update({
        "counts": {"baseline": len(base), "new_after_dedupe": len(kept),
                   "matched": len(matched), "new_records": len(new_rows),
                   "disappeared": len(removed), "ambiguous": len(ambiguous),
                   "changed": len(changed_slugs),
                   "unchanged": len(matched) - len(changed_slugs), "delta_pct": round(delta_pct, 2)},
        "field_stats": field_stats,
        "avail_decreased": {"count": len(dec), "zeroed": len(zeroed), "top10": dec[:10]},
        "avail_increased": {"count": len(inc), "top5": inc[:5]},
        "n1_undetermined": {"count": len(n1_undetermined), "entries": n1_undetermined},
        "oc_undetermined": {"count": len(oc_undetermined), "entries": oc_undetermined},
        "n1_changed": {"count": len(n1_changed), "examples": n1_changed[:10]},
        "renamed_blocking": renamed_hard, "renumbered": renumbered,
        "ambiguous_rows": [{"external_id": a["external_id"], "name": a["name"],
                            "kv": vkey(a["voltage_primary_kv"], a["voltage_secondary_kv"])} for a in ambiguous],
        "new_records": [{"external_id": r["external_id"], "name": r["name"], "prefecture": r["prefecture"],
                         "kv": vkey(r["voltage_primary_kv"], r["voltage_secondary_kv"]),
                         "cap_avail_mw": r["cap_avail_mw"], "cap_operational_mw": r["cap_operational_mw"]}
                        for r in new_rows],
        "disappeared_records": [{"slug": b["slug"], "external_id": b.get("external_id"),
                                 "name": b.get("name"), "prefecture": b.get("prefecture")} for b in removed],
        "pref_counts": {"old": pref_old, "new": pref_new},
    })

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(R, ensure_ascii=False, indent=1), encoding="utf-8")
    write_md(R)

    if args.emit_plan:
        # 本実行用の patch 計画（承認済み・2026-08-16）。microCMS への書込はこのスクリプトでは行わない。
        # last_updated=2026-07-03（メタ行「2026年7月3日作成」。他にデータ時点の公表がないため
        # この版の唯一の日付根拠。従来は版 YYYYMM の月初を当てる旧方式だった＝見え方の系統が変わる）
        APPROVED = ["cap_avail_mw", "cap_avail_upper_mw", "cap_operational_mw", "forecast_flow_mw",
                    "capacity_total_mw", "n1_capacity_mw", "units"]
        plan, n1_skipped, oc_skipped = [], 0, 0
        for b, r in matched:
            patch = {"last_updated": "2026-07-03T00:00:00.000Z",
                     "source_url": f"{BASE_URL}/{r['src_file']}"}
            changed = []
            for k in APPROVED:
                o, n = b.get(k), r.get(k)
                if n is not None and o != n:
                    patch[k] = n
                    changed.append(k)
            if r.get("n1_eligible") is None:
                if b.get("n1_eligible") is not None:
                    n1_skipped += 1
            elif r["n1_eligible"] != b.get("n1_eligible"):
                patch["n1_eligible"] = r["n1_eligible"]
                changed.append("n1_eligible")
            if r.get("oc_possibility") is None:
                if b.get("oc_possibility") is not None:
                    oc_skipped += 1
            elif r["oc_possibility"] == "有り" and b.get("oc_possibility") != "有り":
                patch["oc_possibility"] = ["有り"]
                changed.append("oc_possibility")
            plan.append({"slug": b["slug"], "patch": patch, "changed": changed})
        PLAN_OUT = HERE / "update_plan_202607.json"
        PLAN_OUT.write_text(json.dumps({
            "generated": date.today().isoformat(), "version": VERSION_NEW,
            "last_updated": "2026-07-03T00:00:00.000Z",
            "n1_undetermined_skipped": n1_skipped, "oc_undetermined_skipped": oc_skipped,
            "count": len(plan), "changed_count": sum(1 for p in plan if p["changed"]),
            "plan": plan,
        }, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"\n→ {PLAN_OUT.name}: {len(plan)}件（値変化 {sum(1 for p in plan if p['changed'])}件 / "
              f"N-1未算定スキップ {n1_skipped} / 出力制御未算定スキップ {oc_skipped}）")
    print(f"\n→ {OUT_JSON} / {OUT_MD} 出力")
    print("[dry-run] 完了（microCMS 書込なし）")


def write_md(R):
    c = R["counts"]
    L = []
    A = L.append
    A(f"# 東北電力NW 予想潮流等 取込 dry-run 差分レポート（{R['generated']}）\n")
    A(f"**版**: 当方 `{R['version_old']}` → 最新 **`{R['version_new']}`**（2026年7月版）  ")
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
    A("## 1. 取得ファイル一覧（encoding は実測）\n")
    A("| ファイル | バイト数 | encoding | メタ行 | データ行 | 県 |")
    A("|---|---:|---|---|---:|---|")
    for f in R["files"]:
        A(f"| `{f['file']}` | {f['bytes']:,} | **{f['encoding']}** | {f['meta_row']} | {f['data_rows']} | {f['prefecture'] or '（基幹系）'} |")
    A(f"\n取得元: `{R['files'][0]['url'].rsplit('/',1)[0]}/`（公表ページのリンクから取得・URL推測なし）\n")
    d = R["dedupe"]
    A("## 2. 行数と重複除去（落とし穴 #111）\n")
    A(f"- 生 **{d['before']}** 行 → dedupe 後 **{d['after']}** 行（除去 **{d['removed']}** 件 {d['breakdown'] or ''}）")
    if d["examples"]:
        for e in d["examples"]:
            A(f"  - {e['external_id']} 「{e['name']}」← {e['reason']}")
    else:
        A("  - 除去0件（系列別ビューの再掲なし＝素通し）")
    A("")
    A("## 3. 設備の増減\n")
    A("| 区分 | 件数 |")
    A("|---|---:|")
    A(f"| baseline（現行・microCMS GET） | {c['baseline']} |")
    A(f"| 新CSV（dedupe後） | {c['new_after_dedupe']} |")
    A(f"| 紐付き（マッチ） | {c['matched']} |")
    A(f"| 新規 | {c['new_records']} |")
    A(f"| 消滅 | {c['disappeared']} |")
    A(f"| 変更あり | {c['changed']} |")
    A(f"| 変化なし | {c['unchanged']} |")
    A(f"| 増減率 | {c['delta_pct']:+.2f}%（±10%超で警告） |")
    A("")
    if R["new_records"]:
        A("### 新規の内訳\n")
        for r in R["new_records"][:20]:
            A(f"- `{r['external_id']}` 「{r['name']}」{r['prefecture'] or '（基幹系）'} {r['kv']}kV 空容量={r['cap_avail_mw']} 運用={r['cap_operational_mw']}")
        A("")
    if R["disappeared_records"]:
        A("### 消滅の内訳\n")
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
    A(f"**{n1u['count']} 件**。既定の扱い＝**上書きせず現値維持**（false で潰さない）。\n")
    if n1u["entries"]:
        A("<details><summary>一覧（先頭30件）</summary>\n")
        A("| slug | 変電所 | 県 | 現値 |")
        A("|---|---|---|---|")
        for e in n1u["entries"][:30]:
            A(f"| `{e['slug']}` | {e['name']} | {e['prefecture'] or '（基幹系）'} | {e['stored']} |")
        A("\n</details>\n")
    ocu = R["oc_undetermined"]
    A(f"### （参考）出力制御の可能性が未算定化する件数: **{ocu['count']} 件**\n")
    A("boolean ではないが同じ「上書きせず現値維持」の対象。\n")
    if ocu["entries"]:
        A("| slug | 変電所 | 県 | 現値 |")
        A("|---|---|---|---|")
        for e in ocu["entries"][:15]:
            A(f"| `{e['slug']}` | {e['name']} | {e['prefecture'] or '（基幹系）'} | {e['stored']} |")
        A("")
    n1c = R["n1_changed"]
    A("## 8. N-1電制適用可否の変化\n")
    A(f"**{n1c['count']} 件**\n")
    for x in n1c["examples"]:
        A(f"- {x['name']}（{x['prefecture'] or '基幹系'}）: {x['old']} → {x['new']}")
    A("")
    A("## 9. 同一No.で名称が変わった行\n")
    if R["renamed_blocking"]:
        A(f"### ⚠ 旧名称が新CSVに不在 = **行の差し替え疑い**（{len(R['renamed_blocking'])}件・上書き禁止）\n")
        A("| slug | external_id | 旧名称 | 新名称 |")
        A("|---|---|---|---|")
        for x in R["renamed_blocking"]:
            A(f"| `{x['slug']}` | {x['external_id']} | {x['old_name']} | {x['new_name']} |")
        A("")
    else:
        A("- 旧名称が新CSVに不在のもの: **0件**\n")
    if R["renumbered"]:
        A(f"### No.振り直しの可能性（旧名称が別Noに存在）{len(R['renumbered'])}件\n")
        for x in R["renumbered"]:
            A(f"- `{x['slug']}` {x['old_name']} → {x['new_name']}（旧名称は {x['old_name_now_at']} にあり）")
        A("")
    if R["ambiguous_rows"]:
        A(f"### 電圧面で一意に紐付かない行 {len(R['ambiguous_rows'])}件\n")
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
    A("- N-1可否の未算定は**送信しない**（現値維持）")
    A("- `/grid` の集計は `index.json.summary` が単一ソース（runtime microCMS を増やさない・鉄則#3）")
    OUT_MD.write_text("\n".join(L), encoding="utf-8")


if __name__ == "__main__":
    main()
