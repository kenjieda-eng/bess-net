# -*- coding: utf-8 -*-
"""
北陸電力送配電 予想潮流・空容量CSV（2026年8月5日更新版）パーサ＋dry-run差分レポート

入力: scripts/experimental/hokuriku/csv_2608/sys_capa_{kikan01|local01|local02|local03}_tr_202608_05.csv
      （変圧器＝変電所バンク単位。送電線CSVは既存271件と粒度が異なるため対象外）
出力: scripts/experimental/hokuriku/hokuriku_csv_2608_normalized.json

実査で確定した仕様（2026-08-16）:
  - 一次情報: https://www.rikuden.co.jp/nw_notification/U_154seiyaku.html（「予想潮流等の情報公開」）
    からリンクを辿って実URLを取得（推測URLなし・L-EIC-019）。
  - エンコーディングは**決め打ちしない**。strict utf-8-sig → cp932 で実測した結果、
    北陸は4本とも **cp932**（TEPCOはUTF-8 BOM主体＋一部CP932の混在だった＝社ごとに違う）。
  - メタ行「2026年8月5日更新」は L0。ファイル名 202608_05 と一致するため
    **データ時点そのもの**（TEPCOではフォーマット改定日だった＝社ごとに意味が違う点に注意）。
  - レイアウトは4本とも共通の16列（L1がヘッダ、L2以降がデータ）。
  - 未算定は「-」「－」「ー」「—」→ None。N-1可否は「可」/「不可　#n」。
  - 変電所No（HSS001/TSS001/ISS001/FSS001）→ 既存slug規約 rkd-{地域}-{no小文字4桁}。

使い方:
  python scripts/experimental/hokuriku/parse_hokuriku_csv.py --dry-run
※ 本スクリプトは microCMS への書込を一切行わない（--emit-ready は承認後の準備用）。
"""
import argparse, csv, io, json, re, sys
from datetime import date
from pathlib import Path

HERE = Path(__file__).parent
sys.path.insert(0, str(HERE.parent / "_common"))
from series_dedup import apply_series_dedup, summarize  # noqa: E402

sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = HERE / "csv_2608"
OUT_NORM = HERE / "hokuriku_csv_2608_normalized.json"
BASE_DIR = Path("src/data/substations")

# ファイル → (地域slug, ファイル系統キー, 県名)。
# external_id は既存実データの規則 `rikuden_{ファイル系統}_{No}`（例 rikuden_local03_FSS062）に合わせる。
# 名称非公開行のプレースホルダも既存規則「(名称非公開) {external_id}」に合わせる（2026-08-16 実データで確認）。
FILES = [
    ("sys_capa_kikan01_tr_202608_05.csv", "kikan", "kikan01", None),   # 基幹（県跨ぎ・既存も prefecture=None）
    ("sys_capa_local01_tr_202608_05.csv", "toyama", "local01", "富山県"),
    ("sys_capa_local02_tr_202608_05.csv", "ishikawa", "local02", "石川県"),
    ("sys_capa_local03_tr_202608_05.csv", "fukui", "local03", "福井県"),
]

COL = dict(no=0, name=1, kv1=2, kv2=3, units=4, cap_total=5, cap_op=6, constraint=7,
           flow=8, avail=9, n1=10, n1_mw=11, oc=12, oc_self=13, oc_upper=14, notes=15)

ID_RE = re.compile(r"^[A-Z]{3}\d{3}$")


def clean(v):
    """未算定（ハイフン3種）→ None。★全角スペースは保持する
    （既存名称「北金沢　77/6kV」と同一性を保つため。半角化すると名称不一致を量産する）"""
    if v is None:
        return None
    v = str(v).strip()
    if v in ("-", "－", "", "ー", "—"):
        return None
    return v


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
    """「可」→True /「不可　#4」→False / 「-」→None（未算定）"""
    v = clean(v)
    if v is None:
        return None
    v = v.replace("　", " ").strip()
    if v.startswith("可"):
        return True
    if v.startswith("不可"):
        return False
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


def slug_of(no: str, region: str) -> str:
    m = re.match(r"^([A-Z]{3})(\d+)$", no)
    return f"rkd-{region}-{m.group(1).lower()}{int(m.group(2)):04d}"


def load_rows(path: Path):
    raw = path.read_bytes()
    try:
        txt, enc = raw.decode("utf-8-sig"), "utf-8-sig"
    except UnicodeDecodeError:
        txt, enc = raw.decode("cp932"), "cp932"
    return enc, list(csv.reader(io.StringIO(txt)))


def parse_file(fname: str, region: str, filekey: str, pref):
    enc, rows = load_rows(SRC / fname)
    meta = clean(rows[0][0]) if rows else None
    out = []
    for r in rows:
        if not r:
            continue
        no = clean(r[COL["no"]]) or ""
        if not ID_RE.match(no):
            continue
        ext = f"rikuden_{filekey}_{no}"
        nm = clean(r[COL["name"]])
        out.append({
            "external_id": ext,
            "slug": slug_of(no, region),
            # 名称非公開は既存規則のプレースホルダに合わせる（空欄のまま入れない）
            "name": nm if nm else f"(名称非公開) {ext}",
            "name_disclosed": bool(nm),
            "prefecture": pref,
            "region": region,
            "voltage_primary_kv": to_float(r[COL["kv1"]]),
            "voltage_secondary_kv": to_float(r[COL["kv2"]]),
            "units": to_int(r[COL["units"]]),
            "capacity_total_mw": to_float(r[COL["cap_total"]]),
            "cap_operational_mw": to_float(r[COL["cap_op"]]),
            "constraint": clean(r[COL["constraint"]]),
            "forecast_flow_mw": to_float(r[COL["flow"]]),
            "cap_avail_mw": to_float(r[COL["avail"]]),
            "n1_eligible": parse_n1(r[COL["n1"]]),
            "n1_capacity_mw": to_float(r[COL["n1_mw"]]),
            "oc_possibility": parse_oc(r[COL["oc"]]),
            "notes": clean(r[COL["notes"]]),
            "src_file": fname,
            "src_encoding": enc,
            "src_meta": meta,
        })
    return enc, meta, out


def load_baseline():
    """既存の北陸レコード。★static JSON ではなく microCMS 実データ（fetch_baseline.py の出力）を使う。
    static は units 等の一部フィールドを持たず、差分が偽陽性（「新規充足271件」等）になるため
    （2026-08-16 北陸パイロットで実証）。"""
    p = HERE / "baseline_live.json"
    if not p.exists():
        sys.exit("baseline_live.json がありません。先に fetch_baseline.py を実行してください（GET専用）")
    rows = json.loads(p.read_text(encoding="utf-8"))
    # microCMS のリスト応答は null フィールドを省略するため、欠損キーは None として扱う
    keys = ["cap_avail_mw", "cap_operational_mw", "capacity_total_mw", "forecast_flow_mw",
            "n1_capacity_mw", "units", "voltage_primary_kv", "voltage_secondary_kv"]
    for r in rows:
        for k in keys:
            r.setdefault(k, None)
        oc = r.get("oc_possibility")
        r["oc_possibility"] = (oc[0] if isinstance(oc, list) and oc else None)
    return rows


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--emit-ready", action="store_true", help="本実行用JSON生成（承認後のみ）")
    args = ap.parse_args()
    if not args.dry_run and not args.emit_ready:
        ap.error("--dry-run を指定してください")

    print("=== パース（変圧器CSV ×4） ===")
    rows = []
    for fname, region, filekey, pref in FILES:
        enc, meta, out = parse_file(fname, region, filekey, pref)
        rows.extend(out)
        print(f"  {region:9s} {len(out):3d}件  enc={enc}  メタ行={meta}")
    print(f"  合計 {len(rows)}件")

    base = load_baseline()
    base_by_slug = {b["slug"]: b for b in base}
    base_ids = {b["slug"] for b in base}
    base_names = {}
    for b in base:
        nm = (b.get("name") or "").strip()
        # 名称非公開のプレースホルダは同名判定に使わない（別設備同士が一致してしまう）
        if nm and not nm.startswith("(名称非公開)"):
            base_names.setdefault(nm, f"{b['slug']}")

    # ── #111 系列別ビュー重複の除去（共通関数） ──
    # 北陸のNoは地域内で一意・電圧面ごとに別Noのため、同名同値の判定は「同一ファイル内」で行う。
    rows_for_dedup = [{**r, "external_id": r["slug"]} for r in rows]
    kept, excluded = apply_series_dedup(
        rows_for_dedup, base_ids=base_ids, base_names=base_names,
        key_id="external_id", key_name="name",
        value_keys=("cap_operational_mw", "forecast_flow_mw", "cap_avail_mw"),
        group_key="src_file",
    )
    print(f"\n=== #111 系列別ビュー重複の除去 ===")
    print(f"  除外 {len(excluded)}件（内訳: {summarize(excluded) or 'なし'}） / 取込対象 {len(kept)}件")
    for e in excluded[:8]:
        print(f"    除外: {e['external_id']} {e['name']} ← {e['exclude_reason']}")

    # ── 差分 ──
    matched, new_rows = [], []
    for r in kept:
        b = base_by_slug.get(r["slug"])
        (matched.append((b, r)) if b else new_rows.append(r))
    removed = [b for b in base if b["slug"] not in {r["slug"] for r in kept}]

    print("\n=== dry-run 差分レポート（旧=2026-05取込 / 新=2026-08-05公表CSV） ===")
    print(f"件数: 旧 {len(base)} → 新 {len(kept)}（{len(kept)-len(base):+d}）")
    print(f"slug紐付け: マッチ {len(matched)} / 未マッチ(真正新規) {len(new_rows)} / 消滅 {len(removed)}")

    fields = [("cap_avail_mw", "空き容量"), ("cap_operational_mw", "運用容量"),
              ("forecast_flow_mw", "予想潮流"), ("n1_eligible", "N-1電制適用可否"),
              ("n1_capacity_mw", "N-1電制適用可能量"), ("oc_possibility", "出力制御の可能性"),
              ("capacity_total_mw", "設備容量"), ("units", "台数")]
    print("\nフィールド別変化数:")
    filled_total = 0
    n1_keep = []
    for key, label in fields:
        chg = filled = lost = 0
        for b, r in matched:
            o, n = b.get(key), r.get(key)
            if o is None and n is not None:
                filled += 1
            elif o is not None and n is None:
                lost += 1
                if key == "n1_eligible":
                    n1_keep.append((b, r))
            elif o != n:
                chg += 1
        filled_total += filled
        print(f"  {label:16s} 値変化 {chg:3d} / 新規充足 {filled:3d} / 欠落化(未算定) {lost:3d}")

    # 空き容量の増減
    dec, zero, inc = [], [], []
    for b, r in matched:
        o, n = b.get("cap_avail_mw"), r.get("cap_avail_mw")
        if o is None or n is None:
            continue
        if n < o:
            (zero if n == 0 else dec).append((b, r, o, n))
        elif n > o:
            inc.append((b, r, o, n))
    dec_all = dec + zero
    print(f"\n空き容量が減った変電所: {len(dec_all)}件（うちゼロ化 {len(zero)}件）")
    for b, r, o, n in sorted(dec_all, key=lambda x: x[3] - x[2])[:5]:
        print(f"    {b['slug']} {b['name']}（{b.get('prefecture')}）: {o:g} → {n:g} MW")
    print(f"空き容量が増えた変電所: {len(inc)}件")
    for b, r, o, n in sorted(inc, key=lambda x: x[2] - x[3])[:5]:
        print(f"    {b['slug']} {b['name']}（{b.get('prefecture')}）: {o:g} → {n:g} MW")

    # 名称不一致（同一Noで名称が変わった行）＝ 行の差し替え疑い
    mism = []
    for b, r in matched:
        bn = (b.get("name") or "").strip()
        rn = (r.get("name") or "").strip()
        if bn != rn:
            mism.append((b, r))
    print(f"\n名称不一致（同一Noで名称変更）: {len(mism)}件")
    for b, r in mism:
        bn = (b.get("name") or "").strip()
        elsewhere = [x["slug"] for x in kept if (x.get("name") or "").strip() == bn and x["slug"] != b["slug"]]
        verdict = f"旧名称の他行: {elsewhere}" if elsewhere else "旧名称は新CSVに不在（★差し替え疑い・上書きしない）"
        print(f"    {b['slug']}: 「{b.get('name')}」→「{r.get('name')}」/ {verdict}")

    print(f"\nN-1可否が未算定化（現値維持の対象）: {len(n1_keep)}件")
    for b, r in n1_keep[:20]:
        print(f"    {b['slug']} {b['name']} 現値 n1_eligible={b.get('n1_eligible')}")

    print(f"\n真正新規 {len(new_rows)}件:")
    for r in new_rows:
        print(f"    {r['slug']} 「{r['name']}」 {r.get('voltage_primary_kv')}/{r.get('voltage_secondary_kv')}kV "
              f"空容量={r.get('cap_avail_mw')} 運用={r.get('cap_operational_mw')}")
    print(f"消滅 {len(removed)}件:")
    for b in removed[:10]:
        print(f"    {b['slug']} {b['name']}（{b.get('prefecture')}）")

    changed_pages = {b["slug"] for b, r in matched
                     if any(b.get(k) != r.get(k) for k, _ in fields)}
    print(f"\n既存欠落値の新規充足 合計: {filled_total}件")
    print(f"想定再生成ページ数: 詳細 約{len(changed_pages)}＋新規{len(new_rows)}＋県3＋エリア/検索等3 ≒ {len(changed_pages)+len(new_rows)+6}")

    OUT_NORM.write_text(json.dumps({
        "source": "北陸電力送配電 予想潮流・空容量CSV（2026年8月5日更新）",
        "source_url": "https://www.rikuden.co.jp/nw_notification/U_154seiyaku.html",
        "last_updated_candidate": "2026-08-05",
        "fetched_at": date.today().isoformat(),
        "count": len(kept), "rows": kept,
        "excluded_count": len(excluded), "excluded": excluded,
    }, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"\n→ {OUT_NORM.name} 書出し")
    print("[dry-run] 完了（microCMS 書込なし）")


def bn_of(b):
    return (b.get("name") or "").strip()


if __name__ == "__main__":
    main()
