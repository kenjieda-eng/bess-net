#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
/links ステージ1 分析（読み取り専用・microCMS書き込み0）。
入力: tmp/links-raw.json（getAllLinks 1スキャン）。出力: tmp/links-stage1-report.md（UTF-8）。
P1-a 説明文重複バグ／P1-b 定型文／P2 カテゴリ重複／P3 薄ページ を dry-run。適用なし。
"""
import json, re, sys, collections
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

d = json.load(open("tmp/links-raw.json", encoding="utf-8"))
N = len(d)
OUT = "tmp/links-stage1-report.md"

def head(s, n=120):
    s = (s or "").replace("\n\n", "⏎⏎").replace("\n", "⏎")
    return s[:n]

# ───────── P1-a 重複バグ検出＋修正案 ─────────
def fix_dup(title, desc):
    """先頭の繰り返し『【T とは】\\n\\nTは、』を1つに畳む。"""
    T = title
    unit = f"【{T} とは】\n\n{T}は、"
    # 先頭の (unit)+ を 1つに
    m = re.match("(" + re.escape(unit) + ")+", desc)
    if not m:
        return desc, 0
    run = m.group(0)
    k = run.count(unit)  # 連続出現数
    if k <= 1:
        return desc, 0
    fixed = unit + desc[len(run):]
    return fixed, k - 1  # 除去した重複数

dup_rows = []
for l in d:
    title = l["title"]; desc = l.get("description", "") or ""
    cnt = desc.count(f"【{title} とは】")
    fixed, removed = fix_dup(title, desc)
    if cnt >= 2 or removed >= 1:
        dup_rows.append((l["slug"], title, desc, fixed, cnt, removed))

# ───────── P1-b 定型ボイラープレート ─────────
sent_counter = collections.Counter()
for l in d:
    desc = l.get("description", "") or ""
    # 見出し【...】・URL行を除き、。で文分割
    body = re.sub(r"【[^】]*】", " ", desc)
    body = re.sub(r"公式URL：\S+", " ", body)
    for s in re.split(r"[。\n]", body):
        s = s.strip()
        if len(s) >= 16:  # 長め定型のみ
            sent_counter[s] += 1
boiler = [(s, c) for s, c in sent_counter.most_common(40) if c >= 3]

# ───────── P2 カテゴリ重複 ─────────
total_slots = sum(len(l.get("category") or []) for l in d)
multi_cat = [l for l in d if len(l.get("category") or []) > 1]
cat_dist = collections.Counter()
for l in d:
    for c in (l.get("category") or []):
        cat_dist[c] += 1
# URL 重複（同一サイトが別slugで複数掲載）
url_map = collections.defaultdict(list)
for l in d:
    u = re.sub(r"/$", "", (l.get("url") or "").strip())
    if u:
        url_map[u].append(l["slug"])
dup_urls = {u: ss for u, ss in url_map.items() if len(ss) > 1}

# ───────── P3 薄ページ（参考） ─────────
def imp(l):
    iv = l.get("importance") or []
    return iv[0] if iv else "(無)"
imp_dist = collections.Counter(imp(l) for l in d)
ref_links = [l for l in d if "参考" in imp(l)]
no_tags = [l for l in d if not (l.get("tags") or "").strip()]

# ───────── レポート ─────────
L = []
w = L.append
w("# /links 改善 ステージ1 調査レポート（読み取り専用・dry-run）\n")
w("- データ源: **microCMS `links` endpoint**（`getAllLinks()` 1スキャン・contains不使用）。説明文フィールド=**`description`**（段落 `\\n\\n` 区切り・`【見出し】`をh3化）。")
w("- フィールド: slug/title/url/siteNameEn/**description**/category[]/country[]/language[]/importance[]/accessType[]/contentTypes[]/tags/relatedTerms[]/relatedOperators[]/displayOrder。")
w("- 個別ページ: `/links/[slug]`（generateStaticParams=getAllLinkSlugs 全件SSG・ISR600）。title=`{name}｜お役立ちサイト一覧`＋layout titleTemplate `| 蓄電所ネット`。")
w("- **microCMS 書き込み0・静的データ編集0・git push 0（読み取りのみ）。** 適用は全てステージ2。\n")
w(f"- 総件数 **{N}**。\n")

# P1-a
w(f"## P1-a 説明文の重複バグ（最優先）— **{len(dup_rows)} 件**")
w("パターン: 先頭で `【{名} とは】⏎⏎{名}は、` が2〜3回繰り返され、本文の前に重複表示される（テンプレ h3 と本文冒頭が二重〜三重）。")
w("修正案: 先頭の繰り返しを **1つに畳む**（`【{名} とは】⏎⏎{名}は、{本文}`）。⏎=改行。\n")
w("| # | slug | 除去数 | 現説明文(先頭120) | 提案(先頭120) |")
w("|--:|---|--:|---|---|")
for i, (slug, title, desc, fixed, cnt, removed) in enumerate(sorted(dup_rows, key=lambda x:-x[5]), 1):
    w(f"| {i} | {slug} | {removed} | {head(desc)} | {head(fixed)} |")
w("")

# P1-b
w(f"## P1-b 定型ボイラープレート（出現3回以上・ユウ編集判断用）— {len(boiler)} 種")
w("| 出現回数 | 定型文（先頭60） |")
w("|--:|---|")
for s, c in boiler:
    w(f"| {c} | {s[:60]} |")
w("")

# P4
w("## P4 タイトル #88（二重サフィックス）")
w("- titleTemplate=`%s | 蓄電所ネット`。index title=`お役立ちサイト一覧` → **「お役立ちサイト一覧 | 蓄電所ネット」（単一・二重なし）**。")
w("- 個別: `{名}｜お役立ちサイト一覧` → **「{名}｜お役立ちサイト一覧 | 蓄電所ネット」（蓄電所ネットは1回・二重なし）**。")
w("- **結論: 「お役立ちサイト一覧｜蓄電所ネット | 蓄電所ネット」型の二重サフィックスは存在しない（#88該当なし）。**\n")

# P2
w("## P2 カテゴリ跨ぎ重複")
w(f"- ユニーク link（slug）数 = **{N}**。カテゴリ掲載スロット合計（Σlen(category)）= **{total_slots}**。")
w(f"- 複数カテゴリに掲載される link = **{len(multi_cat)} 件**（=同一サイトが複数カテゴリ枠に出現）。")
w(f"- 別slugで同一URLが重複掲載（真のサイト重複）= **{len(dup_urls)} 組**。")
if dup_urls:
    for u, ss in list(dup_urls.items())[:15]:
        w(f"    - {u} : {', '.join(ss)}")
w("- カテゴリ別件数: " + " / ".join(f"{c}={n}" for c, n in cat_dist.most_common()))
w("")

# P3
w("## P3 個別ページの薄さ（参考）")
w(f"- importance 分布: " + " / ".join(f"{k}={v}" for k, v in imp_dist.most_common()))
w(f"- ★参考（importance に「参考」を含む）= **{len(ref_links)} 件**。")
w(f"- tags 空（関連タグなし→内部リンク薄い疑い）= **{len(no_tags)} 件**。")
w("- 個別ページの内部リンク: relatedTerms/relatedOperators バッジ＋tags→glossaリンク＋5slugにgrid誘導バナー。※relatedTerms/Operators は lite スキャンに含まれないため件数は別途 depth=1 取得が必要（本dry-runではtags空件数を代理指標として提示）。")
w("")

open(OUT, "w", encoding="utf-8").write("\n".join(L))

# ASCII サマリ
print(f"[OK] {N} links analyzed -> {OUT}")
print(f"P1a_dup_bug      = {len(dup_rows)}")
print(f"P1b_boilerplate  = {len(boiler)} kinds (>=3)")
print(f"P2_multi_cat     = {len(multi_cat)}  total_slots={total_slots}  dup_url_groups={len(dup_urls)}")
print(f"P3_ref           = {len(ref_links)}  no_tags={len(no_tags)}")
print(f"imp_dist         = {dict(imp_dist)}")
