#!/usr/bin/env python3
"""
glossary relatedTerms 付替え候補 抽出（読み取り専用・microCMS 0）。
- 301マップ: src/middleware.ts の GLOSSARY_301（'/glossary/旧': '/glossary/正'）をパース。
- relatedTerms: src/lib/generated/glossary-detail-index.json（precompute済、runtime と同一解決）を参照。
  各エントリの relatedTerms[{term,slug}] のうち slug が 301元（旧）を指すものを検出。
解決方式は term 完全一致（csvTermsToTermList）。relatedTerm.term = CSV原値、slug = 解決先。
"""
import json, re, sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

MW = "src/lib/glossary-301.ts"  # stage-2A: GLOSSARY_301 を共有モジュールへ移設
IDX = "src/lib/generated/glossary-detail-index.json"

# 1) GLOSSARY_301 パース（/glossary/旧 → /glossary/正）
mw = open(MW, encoding="utf-8").read()
pairs = re.findall(r"'/glossary/([^']+)':\s*'/glossary/([^']+)'", mw)
old_to_canon = {old: canon for old, canon in pairs}
old_slugs = set(old_to_canon.keys())
print(f"# GLOSSARY_301: {len(old_to_canon)} redirects（旧slug種類）")

# 2) precompute index ロード
idx = json.load(open(IDX, encoding="utf-8"))
print(f"# glossary-detail-index: {len(idx)} entries")

# 旧entryが index に残っているか（=microCMSに保持されているか）
old_in_index = [s for s in old_slugs if s in idx]
print(f"# 旧slug のうち index にエントリが残存: {len(old_in_index)}/{len(old_slugs)}")

# canonical slug → term名（付替え先の表示名）
canon_term = {}
for canon in set(old_to_canon.values()):
    e = idx.get(canon)
    if e:
        canon_term[canon] = e["term"]["term"]

# 3) 突合: relatedTerms.slug が 301元(旧) を指すエントリ
rows = []
affected_entries = set()
old_slug_hits = {}
for slug, entry in idx.items():
    for rt in entry.get("relatedTerms", []):
        rslug = rt.get("slug", "")
        if rslug in old_slugs:
            canon = old_to_canon[rslug]
            rows.append({
                "entry": slug,
                "rt_value": rt.get("term", ""),   # CSV原値（term名）
                "old_slug": rslug,
                "canon_slug": canon,
                "canon_term": canon_term.get(canon, "(canonical不明/index外)"),
            })
            affected_entries.add(slug)
            old_slug_hits[rslug] = old_slug_hits.get(rslug, 0) + 1

# 4) レポート
print("\n## 付替え対象 relatedTerms（relatedTerm.slug が 301元=旧 を指す）\n")
print("| # | エントリ slug | 現 relatedTerm 値(旧) | 旧slug | canonical slug | canonical term | 解決 |")
print("|--:|---|---|---|---|---|---|")
for i, r in enumerate(sorted(rows, key=lambda x: (x["old_slug"], x["entry"])), 1):
    print(f"| {i} | {r['entry']} | {r['rt_value']} | {r['old_slug']} | {r['canon_slug']} | {r['canon_term']} | term一致 |")

print("\n## 旧slug別 被参照件数")
for s, n in sorted(old_slug_hits.items(), key=lambda x: -x[1]):
    print(f"  {s} → {old_to_canon[s]}: {n}件")

# 付替え方式の内訳: CSV値==canonical term名（=map解決の問題、CSV置換では直らない）か、別名（CSV置換で直る）か
same_name = [r for r in rows if r["rt_value"] == r["canon_term"]]
diff_name = [r for r in rows if r["rt_value"] != r["canon_term"]]
print("\n## stage-2 方式内訳（重要）")
print(f"  A. CSV値 == canonical term名（同名・map解決がold優先）: {len(same_name)}件")
print(f"     → CSV置換では直らない。old entry 削除 or term→slug map で 301元を除外する方式が必要。")
print(f"  B. CSV値 != canonical term名（旧エイリアス/英名等）: {len(diff_name)}件")
print(f"     → relatedTerms CSV の値を canonical term名へ置換すれば解決（純粋な付替え）。")
print("  B の例（先頭10）:")
for r in diff_name[:10]:
    print(f"     {r['entry']}: 「{r['rt_value']}」→「{r['canon_term']}」（{r['old_slug']}→{r['canon_slug']}）")

print("\n## 件数サマリ")
print(f"  影響エントリ数(relatedTerms付替えが必要なglossaryエントリ): {len(affected_entries)}")
print(f"  付替え対象 relatedTerm 数(総数): {len(rows)}（A同名 {len(same_name)} / B別名 {len(diff_name)}）")
print(f"  旧slug 種類数(被参照): {len(old_slug_hits)}")
print(f"  ※ 解決方式 = term 完全一致（csvTermsToTermList）。relatedTerm.slug は precompute(runtime同一)解決先。")
