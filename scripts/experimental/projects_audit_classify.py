#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
/projects 品質監査ステージ1 分類（読み取り専用・microCMS 0）。
入力: tmp/projects-raw.json（projects-audit-fetch.ts が getAllProjects 1回で生成）。
出力: tmp/projects-audit-report.md（UTF-8）＋ stdout に ASCII サマリ。
分類 A〜G。書き込み/PATCH/push なし。捏造なし（提案は揃ったデータのみ＝L-EIC-019）。

v2 改良:
  - B は generic-only（厳密 regex＋exact）。place-named（七本木/千里/琵琶湖 等）は除外。
  - D は「真の重複候補（specific 同名・place+operator）」と「量産同名（generic・B再掲）」を分離。
  - E は接尾辞欠落（群馬→群馬県）/重複/異常文字列を別ラベル化。
"""
import json, re, sys, collections
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

SRC = "tmp/projects-raw.json"
OUT = "tmp/projects-audit-report.md"
data = json.load(open(SRC, encoding="utf-8"))
N = len(data)

PREF47 = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県",
"群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県",
"長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県",
"和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県",
"福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"]
PREF_SET = set(PREF47)
PREF_BARE = {p[:-1]: p for p in PREF47 if p.endswith(("県","府"))}  # 群馬→群馬県, 大阪→大阪府
PREF_BARE.update({"東京":"東京都","北海道":"北海道"})

def core_name(s):
    return re.sub(r'[（(][^（）()]*[)）]\s*$', '', s or '').strip()

def has_place(s):
    return any(p in s or p[:-1] in s for p in PREF47)

def has_cap_token(s):
    return bool(re.search(r'\d', s or ''))

def emptyish(v):
    return v is None or str(v).strip() in ("", "—", "-", "ー", "－")

# ───────────────────────── A. 破損タイトル ─────────────────────────
START_PARTICLE = ("との","社との")
START_CHARS = set("をのとが、・")
END_TOKENS = ("との","資本")
END_CHARS = set("がとを")
A = []
for p in data:
    nm = (p["name"] or "").strip()
    reasons = []
    if not nm:
        reasons.append("title空")
    else:
        if nm.startswith(START_PARTICLE) or nm[0] in START_CHARS:
            reasons.append(f"文頭が助詞/接続（'{nm[:3]}…'）")
        m = re.match(r'^([A-Za-z][A-Za-z ]*)(株式会社との|社との|との|が|を)', nm)
        if m and len(m.group(1)) <= 12:
            reasons.append(f"文頭欠落疑い（'{m.group(1).strip()}{m.group(2)}…'）")
        if nm.endswith(END_TOKENS) or (nm[-1] in END_CHARS):
            reasons.append(f"末尾が助詞/途中切れ（'…{nm[-3:]}'）")
        if re.search(r'(?<!\d)0\d{1,}\s*(?:kWh|kW|MWh|MW|Wh|kw|mwh|mw)\b', nm):
            reasons.append("容量表記の桁欠落疑い（先頭0）")
    if reasons:
        A.append((p, reasons))

# ───────────────────────── B. 量産・同名（generic-only 厳密） ─────────────────────────
GENERIC_EXACT = {"系統用蓄電池","系統用蓄電所","蓄電所","蓄電池","日本蓄電池",
"系統用蓄電池プロジェクト","系統用蓄電所プロジェクト","系統用蓄電池事業","蓄電所プロジェクト",
"系統蓄電所","次世代蓄電池","大型蓄電池"}
GENERIC_RE = re.compile(r'^(低圧)?(系統用?)?(再エネ併設型|次世代|大型)?蓄電(池|所|システム)(事業|プロジェクト)?$')
B = []
for p in data:
    cn = core_name(p["name"] or "")
    if (cn in GENERIC_EXACT) or bool(GENERIC_RE.match(cn)):
        B.append(p)
generic_titles = set((p["name"] or "") for p in B)

# 同一 title 件数（generic=量産 / specific=真の重複候補 に分離）
title_counts = collections.Counter((p["name"] or "") for p in data)
dup_titles = {t: c for t, c in title_counts.items() if c >= 2}
dup_generic = {t: c for t, c in dup_titles.items() if t in generic_titles}
dup_specific = {t: c for t, c in dup_titles.items() if t not in generic_titles}

# ───────────────────────── C. 非プロジェクト疑い ─────────────────────────
C_WORDS = ["セミナー","ウェビナー","出資","資本","業務提携","提携","締結","認定","お知らせ","参画"]
C = []
for p in data:
    nm = p["name"] or ""
    hit = [w for w in C_WORDS if w in nm]
    if hit:
        C.append((p, hit))

# ───────────────────────── D. 重複疑い ─────────────────────────
def norm_name(s):
    return re.sub(r'\s+', '', core_name(s)).lower()
def slug_kind(s):
    if s.startswith(("pr-co","pr-")): return "PR"
    if s.startswith("agg-"): return "AGG"
    return "curated"
by_name = collections.defaultdict(list)
by_pref_op = collections.defaultdict(list)
for p in data:
    by_name[norm_name(p["name"] or "")].append(p)
    by_pref_op[(p["prefecture"] or "", (p["operator"] or "").strip())].append(p)
D_name = {k: v for k, v in by_name.items() if k and len(v) >= 2}
# 真の重複候補（specific 同名のみ）／量産同名（generic）を分離
D_specific = {k: v for k, v in D_name.items() if (v[0]["name"] or "") not in generic_titles}
D_generic  = {k: v for k, v in D_name.items() if (v[0]["name"] or "") in generic_titles}
# curated⇔PR 併存（specific を重点）
D_curated_pr = []
for k, v in D_specific.items():
    kinds = set(slug_kind(x["slug"]) for x in v)
    if "curated" in kinds and "PR" in kinds:
        D_curated_pr.append((k, v))
# (place+operator) 強重複（両方非空）／同一事業者多発（place空）
D_prefop_strong = {k: v for k, v in by_pref_op.items() if len(v) >= 2 and k[0] and k[1]}
D_op_only = {k: v for k, v in by_pref_op.items() if len(v) >= 2 and (not k[0]) and k[1]}

# ───────────────────────── E. 所在地崩れ ─────────────────────────
def propose_pref(raw):
    if not raw or raw in PREF_SET: return None
    for p in PREF47:
        if raw.count(p) >= 2 or raw.count(p[:-1]) >= 2: return p
    if raw in PREF_BARE: return PREF_BARE[raw]
    for p in PREF47:
        if p in raw and raw != p: return p
    for b, full in PREF_BARE.items():
        if raw.startswith(b): return full
    return None
E = []
for p in data:
    raw = p["prefecture"]
    if emptyish(raw): continue
    raw = str(raw)
    if raw in PREF_SET: continue  # 正規
    dup = any(raw.count(x) >= 2 or (len(x) > 2 and raw.count(x[:-1]) >= 2) for x in PREF47)
    if dup:
        reason = "都道府県名の重複"
    elif raw in PREF_BARE:
        reason = "都道府県の接尾辞欠落（県/都/府なし・bare表記）"
    elif any(raw.startswith(p) for p in PREF47) or any(raw.startswith(b) for b in PREF_BARE):
        reason = "都道府県値に付随文字（市区名等の混入疑い）"
    else:
        reason = "先頭が都道府県名でない/異常文字列"
    E.append((p, reason, propose_pref(raw)))

# ───────────────────────── F. 事業者欠落 ─────────────────────────
F = [p for p in data if emptyish(p["operator"])]

# ───────────────────────── G. 容量・出力欠落 ─────────────────────────
def zero(v): return (v is None) or (isinstance(v, (int, float)) and v == 0)
G = [p for p in data if zero(p["outputMw"]) and zero(p["capacityMwh"])]
def status_label(p): return p["status"][0] if p["status"] else "(無)"
G_by_status = collections.Counter(status_label(p) for p in G)

# ───────────────────────── 提案 title ─────────────────────────
def propose_title(p):
    pref, op, mwh = p["prefecture"], p["operator"], p["capacityMwh"]
    if (not emptyish(pref)) and (not emptyish(op)) and mwh not in (None, 0):
        city = "" if emptyish(p.get("city")) else str(p["city"])
        return f"{pref}{city}{mwh:g}MWh蓄電所（{op}）"
    return "要一次情報"

# ───────────────────────── レポート出力 ─────────────────────────
L = []
w = L.append
w("# /projects 品質監査レポート（ステージ1・読み取り専用）")
w("")
w(f"- データ源: `getAllProjects()` 全件1回スキャン（contains不使用・鉄則#1/#97/#98）。総件数 **{N}**。")
w("- 本レポートは分類のみ。microCMS 書き込み 0・git push 0。提案titleは揃ったデータのみ（無い場合『要一次情報』＝捏造なし／L-EIC-019）。")
w("- カテゴリは重複しうる（例: 破損title かつ 非プロジェクト）。ステージ2の編集判断は ユウ が行う。")
w("")
w("## 件数サマリー")
w("| 区分 | 内容 | 件数 |")
w("|---|---|---:|")
w(f"| A | 破損タイトル（最優先） | {len(A)} |")
w(f"| B | 量産・同名タイトル（generic-only） | {len(B)} |")
w(f"| C | 非プロジェクト疑い | {len(C)} |")
w(f"| D | 真の重複候補（specific同名グループ） | {len(D_specific)}（うち curated⇔PR併存 {len(D_curated_pr)}） |")
w(f"| E | 所在地崩れ | {len(E)} |")
w(f"| F | 事業者欠落 | {len(F)} |")
w(f"| G | 容量・出力欠落(MW=0&MWh=0) | {len(G)} |")
w("")
w("（参考: 量産同名グループ generic={}、同一事業者多発(所在地空)={}、(所在地+事業者)強重複={}）".format(
    len(D_generic), len(D_op_only), len(D_prefop_strong)))
w("")

# A 全件
w(f"## A. 破損タイトル（最優先・全{len(A)}件）")
w("| slug | 現title | 所在地 | 容量MWh | 事業者 | 判定理由 | 提案 |")
w("|---|---|---|---|---|---|---|")
for p, rs in A:
    w(f"| {p['slug']} | {p['name']} | {p['prefecture']} | {p['capacityMwh']} | {p['operator']} | {'；'.join(rs)} | {propose_title(p)} |")
w("")

# B
w(f"## B. 量産・同名タイトル（generic-only・全{len(B)}件）")
w("### B-1. 量産で同一titleが2件以上（title｜件数）= タイトル正規化の主対象")
for t, c in sorted(dup_generic.items(), key=lambda x: -x[1]):
    w(f"- 「{t}」 ｜ {c}件")
w(f"### B-2. 汎用名エントリ一覧（全{len(B)}件・先頭30）")
w("| slug | 現title | 所在地 | 容量MWh | 事業者 | 提案 |")
w("|---|---|---|---|---|---|")
for p in B[:30]:
    w(f"| {p['slug']} | {p['name']} | {p['prefecture']} | {p['capacityMwh']} | {p['operator']} | {propose_title(p)} |")
w("")

# C 全件
w(f"## C. 非プロジェクト疑い（全{len(C)}件）→ /news 移設 or 除外候補")
w("| slug | 現title | 含有語 |")
w("|---|---|---|")
for p, hit in C:
    w(f"| {p['slug']} | {p['name']} | {'、'.join(hit)} |")
w("")

# D
w("## D. 重複疑い")
w(f"### D-1. curated⇔PR 併存ペア（重点・specific同名・全{len(D_curated_pr)}グループ）")
for k, v in D_curated_pr:
    w(f"- 同名核「{v[0]['name']}」:")
    for x in v:
        w(f"    - [{slug_kind(x['slug'])}] {x['slug']} ｜ {x['prefecture']} ｜ {x['capacityMwh']}MWh ｜ {x['operator']}")
w(f"### D-2. 真の重複候補（specific 同名グループ・全{len(D_specific)}）→ 301統合の検討対象")
for k, v in sorted(D_specific.items(), key=lambda x: -len(x[1])):
    slugs = ", ".join(f"{x['slug']}({slug_kind(x['slug'])},{x['prefecture']},{x['capacityMwh']}MWh)" for x in v)
    w(f"- 「{v[0]['name']}」×{len(v)}: {slugs}")
w(f"### D-3. （所在地＋事業者）が一致する強重複（両方非空・全{len(D_prefop_strong)}）")
for k, v in sorted(D_prefop_strong.items(), key=lambda x: -len(x[1])):
    w(f"- {k[0]} / {k[1]} ×{len(v)}: {', '.join(x['slug'] for x in v)}")
w(f"### D-4. 同一事業者で複数エントリ・所在地未設定（PR量産の疑い・全{len(D_op_only)}・先頭15）")
for k, v in list(sorted(D_op_only.items(), key=lambda x: -len(x[1])))[:15]:
    w(f"- {k[1]} ×{len(v)}: {', '.join(x['slug'] for x in v)}")
w("### 注: generic同名（系統用蓄電池×23 等）は「同じ案件の重複」ではなく量産命名（B）。301統合ではなくtitle正規化で対応。")
w("")

# E 全件
w(f"## E. 所在地崩れ（全{len(E)}件）")
w("| slug | 現所在地 | 理由 | 提案（都道府県） | 現title |")
w("|---|---|---|---|---|")
for p, reason, prop in E:
    w(f"| {p['slug']} | {p['prefecture']} | {reason} | {prop or '要一次情報'} | {p['name']} |")
w("")

# F 全件（12件なので全件）
w(f"## F. 事業者欠落（全{len(F)}件）")
w("| slug | 現title | 所在地 | 容量MWh |")
w("|---|---|---|---|")
for p in F:
    w(f"| {p['slug']} | {p['name']} | {p['prefecture']} | {p['capacityMwh']} |")
w("")

# G 件数+status内訳+先頭30
w(f"## G. 容量・出力欠落（MW=0 かつ MWh=0／全{len(G)}件・{len(G)*100//N}%）")
w("### status 別内訳")
for s, c in G_by_status.most_common():
    w(f"- {s}: {c}件")
w("### 先頭30")
w("| slug | 現title | 所在地 | 事業者 | status |")
w("|---|---|---|---|---|")
for p in G[:30]:
    w(f"| {p['slug']} | {p['name']} | {p['prefecture']} | {p['operator']} | {status_label(p)} |")
w("")

open(OUT, "w", encoding="utf-8").write("\n".join(L))

# ASCII サマリ
print(f"[OK] {N} projects classified -> {OUT}")
print(f"A_broken_title      = {len(A)}")
print(f"B_generic_title     = {len(B)}  (dup_generic_titles={len(dup_generic)})")
print(f"C_non_project       = {len(C)}")
print(f"D_specific_groups   = {len(D_specific)}  (curated_x_PR={len(D_curated_pr)}, prefop_strong={len(D_prefop_strong)}, op_only={len(D_op_only)}, generic_groups={len(D_generic)})")
print(f"E_location_broken   = {len(E)}")
print(f"F_operator_missing  = {len(F)}")
print(f"G_capacity_missing  = {len(G)}  status={dict(G_by_status)}")
ok_pref = sum(1 for p in data if p["prefecture"] in PREF_SET)
none_pref = sum(1 for p in data if emptyish(p["prefecture"]))
print(f"[sanity] prefecture canonical-47={ok_pref}, None/empty={none_pref}, other={N-ok_pref-none_pref}")
