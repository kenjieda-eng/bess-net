# -*- coding: utf-8 -*-
"""
TEPCO 系統の予想潮流等 CSV版（2026年7月16日公開）パーサ＋dry-run差分レポート

入力: scripts/experimental/tepco/csv_2607/csv_yosochoryu_{area}.zip ×14（13都県＋基幹）
      各ZIPに hendensyo（変電所）/ soudensen（送電線）の2CSV。本パーサは変電所のみ扱う
      （既存 tpg-* 1,718件は全て変電所単位。送電線は取込対象外＝従来どおり）。
出力: scripts/experimental/tepco/tepco_csv_2607_normalized.json（正規化行）
      --emit-grid-ready 時のみ tepco_grid_ready_2607.json（本実行用・承認後）

実査で確定した仕様（2026-08-15）:
  - エンコーディングは**ファイル毎に混在**: UTF-8(BOM付) or CP932 → strict utf-8-sig を試し
    失敗時 cp932（依頼書の CP932 前提は半分のみ正、前提訂正）。
  - 先頭メタ行「＜送電線_予想潮流・空容量のフォーマット＞2026年06月22日更新」は
    **フォーマット改定日**（変電所ファイルにも「送電線_」表記＝TEPCO側の流用）。データ公表日ではない。
  - レイアウト2種:
      県別19列: No(0) 名(1) 電圧(2) 台数(3) 設備容量(4) 運用容量(5) 制約(6) 潮流方向(7-9)
                予想潮流(10) 空容量当該(11) 空容量上位系(12) N-1可否(13) N-1量(14)
                OC可能性(15) OC当該(16) OC上位系(17) 備考(18)
      基幹24列: ﾏｽｷﾝｸﾞ(0-1) No(2) 名(3) 設備名称定義(4) 電圧(5) 台数(6) 設備容量(7)
                電制適用前運用容量(8) 既設OLR量(9) 運用容量(10) 制約(11) 潮流方向(12-14)
                予想潮流(15) 空容量当該(16) 空容量上位系(17) N-1可否(18) N-1量(19)
                OC可能性(20) OC当該(21) OC上位系(22) 備考(23)
  - No.列は既存 external_id（「変栃木県 154kV 1」「変東京都（23区） 154kV 1」）と同一表記＝直結キー。
  - 未算定は「-」「－」「ー」「—」→ None。数値はカンマ除去。

使い方:
  python scripts/experimental/tepco/parse_tepco_csv_2607.py --dry-run
  python scripts/experimental/tepco/parse_tepco_csv_2607.py --dry-run --last-updated 2026-07-10
  python scripts/experimental/tepco/parse_tepco_csv_2607.py --emit-grid-ready   # 本実行準備（承認後）
※ 本スクリプトは microCMS への書込を一切行わない。
"""
import argparse, csv, io, json, re, sys, zipfile
from datetime import date
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

HERE = Path(__file__).parent
SRC = HERE / "csv_2607"
BASELINE = HERE / "tepco_grid_ready.json"
OUT_NORM = HERE / "tepco_csv_2607_normalized.json"
OUT_READY = HERE / "tepco_grid_ready_2607.json"

AREAS = ["kikan", "tochigi", "gunma", "ibaraki", "saitama", "chiba", "tokyo",
         "tama", "kanagawa", "yamanashi", "shizuoka", "fukushima", "niigata", "nagano"]

ID_RE = re.compile(r"^変.+?\s+(?:\d+(?:\.\d+)?kV|配電用変電所)\s+\d+(?:-\d+)?$")


def clean(v):
    if v is None:
        return None
    v = str(v).replace("　", " ").strip()
    if v in ("-", "－", "", "ー", "—"):
        return None
    return v


def to_float(v):
    v = clean(v)
    if v is None:
        return None
    v = v.replace(",", "").replace("，", "")
    try:
        return float(v)
    except ValueError:
        return None


def to_int(v):
    f = to_float(v)
    return int(f) if f is not None else None


def parse_n1(v):
    v = clean(v)
    if v is None:
        return None
    if v.startswith("可"):
        return True
    if v.startswith("不可"):
        return False
    return None


def parse_oc(v):
    v = clean(v)
    if v is None:
        return None
    return "有り" if "有" in v else ("なし" if "な" in v or "無" in v else v)


def norm_id(v):
    """No.セルの正規化: 全角空白→半角・連続空白圧縮"""
    return re.sub(r"\s+", " ", str(v).replace("　", " ")).strip()


def load_csv(zpath: Path, part: str):
    with zipfile.ZipFile(zpath) as z:
        names = [n for n in z.namelist() if part in n]
        if not names:
            raise SystemExit(f"{zpath.name}: {part} CSVなし")
        raw = z.read(names[0])
        try:
            txt, enc = raw.decode("utf-8-sig"), "utf-8-sig"
        except UnicodeDecodeError:
            txt, enc = raw.decode("cp932"), "cp932"
        return enc, names[0], list(csv.reader(io.StringIO(txt)))


# レイアウト別カラム写像（idx）
LAYOUT_PREF = dict(id=0, name=1, voltage=2, units=3, cap_total=4, cap_op=5, constraint=6,
                   flow=10, avail=11, avail_upper=12, n1=13, n1_mw=14, oc=15, notes=18)
LAYOUT_KIKAN = dict(id=2, name=3, voltage=5, units=6, cap_total=7, cap_op=10, constraint=11,
                    flow=15, avail=16, avail_upper=17, n1=18, n1_mw=19, oc=20, notes=23)


def parse_area(area: str):
    zpath = SRC / f"csv_yosochoryu_{area}.zip"
    enc, fname, rows = load_csv(zpath, "hendensyo")
    ncols = max(len(r) for r in rows)
    layout = LAYOUT_KIKAN if ncols >= 24 else LAYOUT_PREF
    out = []
    for r in rows:
        if not r:
            continue
        rid = norm_id(r[layout["id"]] if layout["id"] < len(r) else "")
        if not ID_RE.match(rid):
            continue
        rec = {
            "external_id": rid,
            "name": clean(r[layout["name"]]),
            "voltage": clean(r[layout["voltage"]]),
            "units": to_int(r[layout["units"]]),
            "capacity_total_mw": to_float(r[layout["cap_total"]]),
            "cap_operational_mw": to_float(r[layout["cap_op"]]),
            "constraint": clean(r[layout["constraint"]]),
            "forecast_flow_mw": to_float(r[layout["flow"]]),
            "cap_avail_mw": to_float(r[layout["avail"]]),
            "cap_avail_upper_mw": to_float(r[layout["avail_upper"]]),
            "n1_eligible": parse_n1(r[layout["n1"]]),
            "n1_capacity_mw": to_float(r[layout["n1_mw"]]),
            "oc_possibility": parse_oc(r[layout["oc"]]),
            "notes": clean(r[layout["notes"]]) if layout["notes"] < len(r) else None,
            "src_area": area,
            "src_file": fname,
            "src_encoding": enc,
        }
        out.append(rec)
    return out


def apply_series_dedup(new_rows, base_ids, base_names):
    """
    フェーズ2裁定3の除去ルール（2026-08-16）。
    公表CSVは「系列別ビュー」であり行数＝設備数ではない:
      - 154/66kV等のバンクが 66kV系列のNo.でも再掲される（同名・運用容量・予想潮流が同値）
      - 23区ファイルは多摩地区・埼玉の局を自ファイルの66kV系列で再掲する（他地区局の相互参照）
    よって「既存external_idに無い行」のうち、
      (1) 同一CSV内に同名の非66kV行があり運用容量・予想潮流が同値 → 重複ビューとして除外
      (2) 名称が既存レコード（他系列・他地区）に一致 → 既存external_idへの写像として除外
    を適用する。除外は取込対象からの除外であり、既存レコードの更新には影響しない。
    """
    kept, excluded = [], []
    byname = {}
    for r in new_rows:
        byname.setdefault((r["src_area"], r.get("name")), []).append(r)
    for r in new_rows:
        if r["external_id"] in base_ids:
            kept.append(r)
            continue
        twins = [p for p in byname.get((r["src_area"], r.get("name")), [])
                 if p is not r and "66kV" not in p["external_id"]]
        same_twin = [p for p in twins
                     if p.get("cap_operational_mw") == r.get("cap_operational_mw")
                     and p.get("forecast_flow_mw") == r.get("forecast_flow_mw")]
        if same_twin:
            excluded.append({**r, "exclude_reason": f"同一CSV内の {same_twin[0]['external_id']} と同名同値（系列別ビューの再掲）"})
            continue
        mapped = base_names.get(r.get("name"))
        if mapped:
            excluded.append({**r, "exclude_reason": f"既存 {mapped} の再掲（他地区局の相互参照）"})
            continue
        kept.append(r)  # どの規則にも該当しない真正新規（現CSVでは 0 件の想定）
    return kept, excluded


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true", help="差分レポートのみ（必須運用）")
    ap.add_argument("--emit-grid-ready", action="store_true",
                    help="本実行用 grid_ready JSON を生成（承認後のみ使用・microCMS書込はしない）")
    ap.add_argument("--last-updated", default="2026-07-10",
                    help="公表日（last_updated に採用。既定=系統構成・予想潮流の更新公表日 2026-07-10）")
    args = ap.parse_args()
    if not args.dry_run and not args.emit_grid_ready:
        ap.error("--dry-run を指定してください（本実行系フラグは承認後のみ）")

    # ── 1. パース ─────────────────────────────────────────
    new_rows = []
    print("=== パース（変電所CSV ×14） ===")
    for a in AREAS:
        rows = parse_area(a)
        new_rows.extend(rows)
        enc = rows[0]["src_encoding"] if rows else "-"
        print(f"  {a:10s} {len(rows):4d}件  enc={enc}")
    print(f"  合計 {len(new_rows)}件")

    # ── 1.5 系列別ビューの重複除去（裁定3） ────────────────
    _base_for_dedup = json.loads(BASELINE.read_text(encoding="utf-8"))["substations"]
    _base_ids = {b["external_id"] for b in _base_for_dedup}
    _base_names = {}
    for b in _base_for_dedup:
        nm = re.sub(r"[（(]\d+[）)]$", "", b.get("name") or "")
        _base_names.setdefault(nm, f"{b['slug']}({b['external_id']})")
    new_rows, excluded_rows = apply_series_dedup(new_rows, _base_ids, _base_names)
    from collections import Counter
    ex_c = Counter(("同名同値" if "同名同値" in e["exclude_reason"] else "他地区写像") for e in excluded_rows)
    print(f"\n=== 系列別ビュー重複の除外（裁定3・行数＝設備数ではない） ===")
    print(f"  除外 {len(excluded_rows)}件（内訳: {dict(ex_c)}） / 取込対象 {len(new_rows)}件")
    for e in excluded_rows[:8]:
        print(f"    除外: {e['external_id']} {e['name']} ← {e['exclude_reason']}")
    truly_new = [r for r in new_rows if r["external_id"] not in _base_ids]
    if truly_new:
        print(f"  ★除外後も残る新規行 {len(truly_new)}件: {[r['external_id'] for r in truly_new][:5]}")

    # CSV側 external_id 重複
    seen, dups = {}, []
    for r in new_rows:
        k = r["external_id"]
        if k in seen:
            dups.append(k)
        seen.setdefault(k, []).append(r)
    if dups:
        print(f"  ★CSV側 external_id 重複 {len(dups)}件: {dups[:5]}")

    OUT_NORM.write_text(json.dumps(
        {"source": "TEPCO CSV 2026-07-16公開", "format_note": "メタ行の6/22はフォーマット改定日",
         "last_updated_candidate": args.last_updated, "fetched_at": date.today().isoformat(),
         "count": len(new_rows), "rows": new_rows,
         "excluded_count": len(excluded_rows), "excluded": excluded_rows},
        ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  → {OUT_NORM.name} 書出し（excluded {len(excluded_rows)}件を含む）")

    # ── 2. 差分（baseline = 6/22取込の grid_ready = 現行本番） ──
    base = json.loads(BASELINE.read_text(encoding="utf-8"))["substations"]
    bidx = {}
    for b in base:
        bidx.setdefault(b["external_id"], []).append(b)

    def pick(bl, row):
        """既存側の同id複数（変埼玉県 66kV 11）を電圧で解消"""
        if len(bl) == 1:
            return bl[0]
        v = row.get("voltage") or ""
        for b in bl:
            pv = f"{b.get('voltage_primary_kv')}/{b.get('voltage_secondary_kv')}".replace("None", "")
            if v and pv.startswith(v.split("/")[0]):
                return b
        return bl[0]

    matched, unmatched_new = [], []
    used = set()
    for r in new_rows:
        bl = bidx.get(r["external_id"])
        if not bl:
            unmatched_new.append(r)
            continue
        b = pick(bl, r)
        used.add(id(b))
        matched.append((b, r))
    removed = [b for b in base if id(b) not in used]

    print("\n=== dry-run 差分レポート（旧=2026-06-22取込 / 新=CSV版） ===")
    print(f"件数: 旧 {len(base)} → 新 {len(new_rows)}（{len(new_rows)-len(base):+d}）")
    print(f"external_id 紐付け: マッチ {len(matched)} / 新規（既存なし） {len(unmatched_new)} / 消滅（CSVになし） {len(removed)}")

    fields = [("cap_avail_mw", "空き容量(当該)"), ("cap_avail_upper_mw", "上位系等考慮空容量"),
              ("n1_eligible", "N-1電制適用可否"), ("n1_capacity_mw", "N-1電制適用可能量"),
              ("oc_possibility", "出力制御の可能性"), ("forecast_flow_mw", "予想潮流"),
              ("cap_operational_mw", "運用容量"), ("units", "台数"), ("capacity_total_mw", "設備容量")]
    print("\nフィールド別変化数:")
    filled_total = 0
    for key, label in fields:
        chg = filled = lost = 0
        for b, r in matched:
            o, n = b.get(key), r.get(key)
            if key == "oc_possibility":
                o = o if o in ("有り", "なし") else (None if o in (None, "") else o)
            if o is None and n is not None:
                filled += 1
            elif o is not None and n is None:
                lost += 1
            elif o != n:
                chg += 1
        filled_total += filled
        print(f"  {label:14s} 値変化 {chg:4d} / 新規充足(null→値) {filled:4d} / 欠落化(値→null) {lost:4d}")

    # 空き容量の減少・ゼロ化 / 増加（当該・上位系等考慮の両方を見る）
    for key, label in [("cap_avail_mw", "空き容量(当該)"), ("cap_avail_upper_mw", "上位系等考慮空容量")]:
        dec, zero, inc = [], [], []
        for b, r in matched:
            o, n = b.get(key), r.get(key)
            if o is None or n is None:
                continue
            if n < o:
                (zero if n == 0 else dec).append((b, r, o, n))
            elif n > o:
                inc.append((b, r, o, n))
        dec_all = dec + zero
        print(f"\n{label} が減った変電所: {len(dec_all)}件（うちゼロ化 {len(zero)}件）")
        for b, r, o, n in sorted(dec_all, key=lambda x: x[3] - x[2])[:5]:
            print(f"    {b['slug']} {b['name']}（{b['prefecture']}）: {o:g} → {n:g} MW")
        print(f"{label} が増えた変電所: {len(inc)}件")
        for b, r, o, n in sorted(inc, key=lambda x: x[2] - x[3])[:5]:
            print(f"    {b['slug']} {b['name']}（{b['prefecture']}）: {o:g} → {n:g} MW")

    # 接合の健全性: id一致だが名称不一致（No.振り直し・改称の検知）
    mism = []
    for b, r in matched:
        bn = re.sub(r"[（(]\d+[）)]$", "", b.get("name") or "")
        if bn != (r.get("name") or ""):
            mism.append((b, r))
    print(f"\nidマッチかつ名称不一致: {len(mism)}件（改称/差し替え疑い・本実行時に個別確認）")
    for b, r in mism[:8]:
        print(f"    {b['slug']} {b['external_id']}: {b['name']} → {r['name']}")

    print(f"\n新規追加候補（CSVにあり既存なし）: {len(unmatched_new)}件")
    for r in unmatched_new[:5]:
        print(f"    {r['external_id']} {r['name']}（{r['src_area']}）")
    print(f"消滅候補（既存にありCSVなし）: {len(removed)}件（★あれば301方針の要否を判断。勝手に削除しない）")
    for b in removed[:5]:
        print(f"    {b['slug']} {b['external_id']} {b['name']}（{b['prefecture']}）")

    # 再生成ページ数の見積り
    changed_pages = set()
    for b, r in matched:
        for key, _ in fields:
            o, n = b.get(key), r.get(key)
            if o != n:
                changed_pages.add(b["slug"])
                break
    prefs = {b["prefecture"] for b in base}
    est = len(changed_pages) + len(unmatched_new) + len(prefs) + 3  # 詳細+新規+都県+(/grid,/grid/tokyo,status)
    print(f"\n既存欠落値の新規充足 合計: {filled_total}件（PDF→CSV化の品質改善）")
    print(f"想定再生成ページ数: 変電所詳細 約{len(changed_pages)}＋新規{len(unmatched_new)}＋都県{len(prefs)}＋エリア/status 3 ≒ {est}")

    if args.emit_grid_ready:
        print("\n--emit-grid-ready は本実行承認後に使用します（今回未実行扱い）。")

    print("\n[dry-run] 完了（microCMS 書込なし）")


if __name__ == "__main__":
    main()
