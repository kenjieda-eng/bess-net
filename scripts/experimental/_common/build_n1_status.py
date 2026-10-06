# -*- coding: utf-8 -*-
"""
scripts/experimental/_common/build_n1_status.py — N-1電制の「未算定／公表なし」一覧（三値化 段1）を作る（N1b・2026-10-03）

★出力は src/data/n1-status.json の 1 ファイル（TypeScript と Python の唯一の真実源・#119。凍結リストと同じ型）。
  TS 側は src/lib/n1-status.ts、Python 側は scripts/experimental/_common/n1_status.py が同じ JSON を読む。
  前身の build_n1_undetermined.py / n1_undetermined.json は消さずに残す（後継は本スクリプトと n1-status.json）。

背景: microCMS の n1_eligible は boolean（null 不可）のため、公表 CSV の N-1 欄が「－」「―」「-」（未算定）・
      空欄・列なしの設備が false（＝「不可」表示）に潰れている。段1 では microCMS を触らず、リポ側の一覧で
      表示だけを直す（裁定 2026-10-02 案C・段2＝select 新設は EDAさん判断）。

reason（裁定 §2・便ファイル §1）:
  undetermined … N-1 欄に「－」「―」「-」等（公表元が未算定と明示）→ 表示「未算定」
  blank        … N-1 欄が空欄（名称非公開行など）              → 表示「未算定」
  no_column    … 公表 CSV に N-1 列そのものが無い（沖縄）       → 表示「公表なし」
  四国 10 月版の「－」28 行は BS 便（2026-10-04）で §7 に足した（slug は電圧面で決める #115・parse_shikoku.py の一覧）。
  ★四国の as_of は microCMS の現在値（5月版 2026-05-01）ではなく 10月版の版日付 2026-10-01。「－」を確かめたのは 10月版で、
    5月版の CSV は公表元で 404（確かめられない）。再取込で last_updated が 2026-10-01 になった時点から表示に効く。

入力（読取のみ）:
  - 前身の一覧 _common/n1_undetermined.json（273 件・社別ファイルの統合）
  - 北陸の公表 CSV（hokuriku/csv_2608）… 全行を読んで未算定・空欄を機械的に判定（新設 3 件の漏れもここで拾う）
  - 関西の更新計画 kansai/update_plan_2608.json の creates_n1_false_as_undetermined（新設時に false で入った 1 件）
  - 北海道の更新計画 hokkaido/update_plan_202607.json の基幹の新設＋基幹 CSV（N-1 欄が「―」の新設 1 件）
  - 関西・中国・北海道の公表 CSV（ローカル）… 空欄か「－」かの判定（raw を entry に残す）
  - 沖縄: microCMS の source_url（どの公表 CSV 由来か）＋ 沖縄電力の公表 CSV 6 本のヘッダ（N-1 列の有無を GET で確認）
  - microCMS substations の GET（as_of＝その時点の last_updated・n1_eligible・名称・external_id）
書込: src/data/n1-status.json だけ。microCMS への書込は無い（GET のみ）。

実行（リポジトリ直下）: set -a && . ./.env.local && set +a && python scripts/experimental/_common/build_n1_status.py
"""
import csv
import io
import json
import os
import sys
import time
import unicodedata
import urllib.parse
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")
ROOT = Path("scripts/experimental")
OUT = Path("src/data/n1-status.json")
FROZEN = Path("src/data/substations-frozen.json")
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"

DASHES = {"-", "－", "―", "ー", "—", "‐", "−"}


def N(s):
    return unicodedata.normalize("NFKC", s or "").strip()


def classify(raw):
    """CSV の N-1 欄の原文 → reason（None は可・不可など＝一覧に入れない）"""
    if raw is None:
        return None
    v = raw.strip()
    if v == "":
        return "blank"
    if v in DASHES or N(v) in {N(d) for d in DASHES}:
        return "undetermined"
    return None


def read_csv_bytes(b):
    for enc in ("utf-8-sig", "cp932"):
        try:
            return list(csv.reader(io.StringIO(b.decode(enc))))
        except UnicodeDecodeError:
            continue
    raise SystemExit("CSV を読めない")


# ── microCMS GET（as_of と現在値）──────────────────────────────
K, D = os.environ.get("MICROCMS_API_KEY"), os.environ.get("MICROCMS_SERVICE_DOMAIN")
if not K or not D:
    raise SystemExit("MICROCMS_API_KEY / MICROCMS_SERVICE_DOMAIN が未設定（.env.local をシェルで読み込んで実行）")
GETS = 0


def cms_list(filters=None, fields="slug,name,operator,area,external_id,source_url,last_updated,n1_eligible"):
    global GETS
    out, off = [], 0
    while True:
        q = {"limit": 100, "offset": off, "fields": fields, "orders": "-publishedAt"}
        if filters:
            q["filters"] = filters
        u = f"https://{D}.microcms.io/api/v1/substations?" + urllib.parse.urlencode(q)
        r = json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={"X-MICROCMS-API-KEY": K}), timeout=90).read().decode("utf-8"))
        GETS += 1
        out += r["contents"]
        off += 100
        if off >= r["totalCount"]:
            return out
        time.sleep(0.1)


print("microCMS substations を全件 GET（N-1 関連フィールド）…")
LIVE = {x["slug"]: x for x in cms_list()}
print(f"  {len(LIVE)} 件（GET {GETS}）")
frozen = set(json.loads(FROZEN.read_text(encoding="utf-8"))["frozen"].keys())

entries = {}   # slug -> entry
log = []


def add(slug, reason, source, raw=None, raw_checked=False, note=None, as_of=None):
    rec = LIVE.get(slug)
    if rec is None:
        log.append(f"★microCMS に無い slug: {slug}（入れない）")
        return
    if slug in frozen:
        log.append(f"凍結のため入れない: {slug}")
        return
    if rec.get("n1_eligible") is True:
        log.append(f"★microCMS が true（可）なので入れない: {slug}")
        return
    e = {
        "area": (rec.get("area") or [None])[0],
        "operator": (rec.get("operator") or [None])[0],
        "external_id": rec.get("external_id"),
        "name": rec.get("name"),
        "reason": reason,
        "source": source,
        # as_of は原則 microCMS の現在の last_updated。公表 CSV の版が取込済みの版より新しい社（四国）は、その版の日付を渡す
        "as_of": as_of or rec.get("last_updated"),
    }
    if raw_checked:
        e["raw"] = raw
    if note:
        e["note"] = note
    entries[slug] = e


# ── 1. 前身の一覧（273 件）を土台に ──────────────────────────
base = json.loads((ROOT / "_common" / "n1_undetermined.json").read_text(encoding="utf-8"))["entries"]
for b in base:
    add(b["slug"], "undetermined", b.get("source"))
print(f"前身の一覧: {len(base)} 件 → {len(entries)} 件を採用")

# ── 2. 北陸: 公表 CSV（2026-08-05）を全行読み、未算定・空欄を機械的に（新設 3 件の漏れもここで拾う）──
sys.path.insert(0, str(ROOT / "hokuriku"))
HK_FILES = [
    ("sys_capa_kikan01_tr_202608_05.csv", "kikan"),
    ("sys_capa_local01_tr_202608_05.csv", "toyama"),
    ("sys_capa_local02_tr_202608_05.csv", "ishikawa"),
    ("sys_capa_local03_tr_202608_05.csv", "fukui"),
]
import re  # noqa: E402

HK_ID = re.compile(r"^([A-Z]{3})(\d{3})$")
hk_seen = set()
for fname, region in HK_FILES:
    rows = read_csv_bytes((ROOT / "hokuriku" / "csv_2608" / fname).read_bytes())
    for r in rows:
        if not r:
            continue
        no = (r[0] or "").strip()
        m = HK_ID.match(no)
        if not m:
            continue
        slug = f"rkd-{region}-{m.group(1).lower()}{int(m.group(2)):04d}"
        raw = r[10] if len(r) > 10 else None
        reason = classify(raw)
        if reason is None:
            continue
        hk_seen.add(slug)
        add(slug, reason, "sys_capa_*_tr_202608_05.csv（2026-08-05公表）", raw=raw, raw_checked=True)
hk_base = {b["slug"] for b in base if b.get("area") == "北陸"}
print(f"北陸: CSV の未算定・空欄 {len(hk_seen)} 行（前身の一覧 {len(hk_base)}・CSV にだけある {sorted(hk_seen - hk_base)}・一覧にだけある {sorted(hk_base - hk_seen)}）")

# ── 3. 関西: 新設時に false で入った未算定（更新計画のフラグ）＋ 空欄の判定 ──
kp = json.loads((ROOT / "kansai" / "update_plan_2608.json").read_text(encoding="utf-8"))
ks_rows = {}
for fname in ("154kv_less_trans.csv", "154kv_more_trans.csv"):
    kind = "local" if "less" in fname else "kikan"
    for r in read_csv_bytes((ROOT / "kansai" / "src" / fname).read_bytes())[2:]:
        if r and r[0].strip():
            ks_rows.setdefault((kind, N(r[0])), []).append(r)


def kansai_raw(ext_id):
    m = re.match(r"^kansai_(local|kikan)_(.+)$", ext_id or "")
    if not m:
        return None, False
    rows = ks_rows.get((m.group(1), N(m.group(2))), [])
    return (rows[0][11], True) if len(rows) == 1 and len(rows[0]) > 11 else (None, False)


for c in kp.get("creates", []):
    if c.get("n1_undetermined_as_false"):
        add(c["slug"], "undetermined", "154kv_{more,less}_trans.csv（2026-08-17公表）・新設時に false で投入")
for slug, e in list(entries.items()):
    if e["area"] != "関西":
        continue
    raw, ok = kansai_raw(e["external_id"])
    if ok:
        e["raw"] = raw
        e["reason"] = classify(raw) or e["reason"]
    else:
        log.append(f"関西: CSV で一意に引けない {slug} {e['external_id']}（reason は {e['reason']} のまま）")

# ── 4. 中国: 空欄か「－」かの判定（zip の *_tr_*.csv を No. の原文で引く）──
cg_rows = {}
for z in sorted((ROOT / "chugoku" / "zip_202608").glob("*.zip")):
    with zipfile.ZipFile(z) as Z:
        for n in Z.namelist():
            if "_tr_" not in n:
                continue
            for r in read_csv_bytes(Z.read(n))[2:]:
                if r and r[0].strip():
                    cg_rows.setdefault(N(r[0]), []).append(r)
for slug, e in list(entries.items()):
    if e["area"] != "中国":
        continue
    m = re.match(r"^energia_[a-z0-9]+_(.+)$", e["external_id"] or "")
    rows = cg_rows.get(N(m.group(1)), []) if m else []
    if len(rows) == 1 and len(rows[0]) > 11:
        e["raw"] = rows[0][11]
        e["reason"] = classify(rows[0][11]) or e["reason"]
    else:
        log.append(f"中国: CSV で一意に引けない {slug} {e['external_id']}（{len(rows)} 行・reason は {e['reason']} のまま）")

# ── 5. 北海道: 基幹の新設で N-1 欄が「―」のもの（前身の一覧から漏れていた）──
hp = json.loads((ROOT / "hokkaido" / "update_plan_202607.json").read_text(encoding="utf-8"))
with zipfile.ZipFile(ROOT / "hokkaido" / "zip_202607" / "sys_capa_kikan.zip") as Z:
    hk_kikan = read_csv_bytes(Z.read("sys_capa_kikan01_Tr_202607_01.csv"))[2:]
for c in hp.get("creates", []):
    ext = (c.get("content") or {}).get("external_id") or ""
    m = re.match(r"^hepco_sys_capa_kikan_(\d+)_v2-([\d.]+)$", ext)
    if not m:
        continue
    rows = [r for r in hk_kikan if r and N(r[0]) == m.group(1) and N(r[3]) and float(N(r[3])) == float(m.group(2))]
    if len(rows) == 1 and classify(rows[0][11]):
        add(c["slug"], classify(rows[0][11]), "sys_capa_kikan01_Tr_202607_01.csv（2026-07-31公表）・新設時に false で投入",
            raw=rows[0][11], raw_checked=True)

# ── 6. 沖縄: N-1 列そのものが無い公表 CSV 由来の設備 → no_column ──
OKI_BASE = "https://www.okiden.co.jp/shared/csv/business-support/service/rule/plan/"
oki_has_n1 = {}
for fn in ("con_res_map01_02.csv", "con_res_map01_03.csv", "con_res_map02_02.csv", "con_res_map02_03.csv",
           "con_res_map03_02.csv", "con_res_map03_03.csv"):
    b = urllib.request.urlopen(urllib.request.Request(OKI_BASE + fn, headers={"User-Agent": UA}), timeout=60).read()
    rows = read_csv_bytes(b)
    hdr = " ".join(" ".join(r) for r in rows[:4])
    oki_has_n1[fn] = "N-1" in N(hdr)
print("沖縄の公表 CSV の N-1 列:", oki_has_n1)
for slug, rec in LIVE.items():
    if (rec.get("area") or [None])[0] != "沖縄":
        continue
    fn = (rec.get("source_url") or "").rsplit("/", 1)[-1]
    if fn in oki_has_n1 and not oki_has_n1[fn]:
        add(slug, "no_column", f"{fn}（N-1 列なし・沖縄電力の公表 CSV・2026-10-03 ヘッダを確認）")

# ── 7. 四国: 10月版（_202610_08）の N-1 欄が「－」の行（BS dry-run・parse_shikoku.py の一覧）──
# as_of は 10月版の版日付（再取込後の last_updated）。2026-10-05 の再取込（BS+BT 本実行）で一致＝表示に効いている。
# Ck2g §9（2026-10-06）: source の「取込は5月版のまま」を事実（2026-10-05 取込）に直した。
sk = json.loads((ROOT / "_common" / "n1_undetermined_shikoku.json").read_text(encoding="utf-8"))
SK_AS_OF = f"{sk['version']}T00:00:00.000Z"
for x in sk["matched"]:
    add(x["slug"], x["reason"], "sys_capa_*_tr_202610_08.csv（2026-10-01公表）・2026-10-05 取込", raw=x["raw"], raw_checked=True,
        note="as_of は 10月版の版日付（再取込で last_updated が一致した時点から効く）", as_of=SK_AS_OF)
for x in sk["new_rows"]:
    log.append(f"四国の新規行（未取込）で未算定: {x['external_id']} {x['name']}（取込後に足す）")
print(f"四国: 10月版の未算定 {len(sk['matched'])} 行（as_of {SK_AS_OF}）")

# ── 出力 ──
from collections import Counter  # noqa: E402

by_reason = Counter(e["reason"] for e in entries.values())
by_area = {}
for e in entries.values():
    by_area.setdefault(e["area"], Counter())[e["reason"]] += 1
out = {
    "_purpose": "N-1電制適用可否の「未算定（公表元が「－」等で明示）」「空欄」「公表なし（N-1 列が無い）」の設備。"
                "microCMS の n1_eligible は boolean のため false（不可）に潰れているので、表示はこの一覧で直す（三値化 段1）。"
                "TypeScript（src/lib/n1-status.ts）と Python（scripts/experimental/_common/n1_status.py）の唯一の真実源（#119）。",
    "_note": "as_of はその設備の microCMS last_updated（一覧を作った時点）。表示側は as_of が microCMS の現在値と一致するときだけ"
             "この一覧を当てる（再取込で値が更新された行に古い一覧を当てない）。microCMS が true（可）なら可が勝つ。"
             "再生成: scripts/experimental/_common/build_n1_status.py（前身 build_n1_undetermined.py は残置）。"
             "四国（10月版の「－」）の as_of は 10月版の版日付で、再取込までは表示に効かない。",
    "generated_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
    "generated_from": [
        "scripts/experimental/_common/n1_undetermined.json（前身・273 件）",
        "scripts/experimental/hokuriku/csv_2608（2026-08-05 公表 CSV）",
        "scripts/experimental/kansai/update_plan_2608.json・src/154kv_{less,more}_trans.csv",
        "scripts/experimental/chugoku/zip_202608",
        "scripts/experimental/hokkaido/update_plan_202607.json・zip_202607/sys_capa_kikan.zip",
        "okiden con_res_map0{1,2,3}_0{2,3}.csv のヘッダ（GET）",
        "scripts/experimental/_common/n1_undetermined_shikoku.json（四国 10月版・parse_shikoku.py）",
        "microCMS substations（GET・as_of）",
    ],
    "count": len(entries),
    "count_by_reason": dict(sorted(by_reason.items())),
    "count_by_area": {a: dict(sorted(c.items())) for a, c in sorted(by_area.items())},
    "entries": dict(sorted(entries.items())),
}
OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
print(f"\n出力 {OUT}: {len(entries)} 件 reason={dict(by_reason)}")
for a, c in sorted(by_area.items()):
    print(f"  {a}: {dict(c)}")
print(f"microCMS GET {GETS}")
for l in log:
    print("  " + l)
