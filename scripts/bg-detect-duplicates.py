#!/usr/bin/env python3
"""
scripts/bg-detect-duplicates.py

依頼BG Phase 1: FAQ × glossary 重複候補抽出

【目的】
AD で投入した FAQ 50件 と AH で整備した glossary 1,516語 の間で
重複・統合候補を抽出し、江田さんレビュー用レポートを生成。

【判定基準】
1. 強候補 (Strong): FAQ question / answer に glossary term が直接含まれ、
   かつ shortDef と意味的に近い (キーワード一致率 > 50%)
2. 中候補 (Medium): FAQ question に glossary term が含まれる
3. 弱候補 (Weak): FAQ answer に glossary term が複数回出現

【出力】
03_5月13日朝_実行/BG_duplicates_report.md
"""

import json
import re
import urllib.request
from collections import defaultdict

FAQ_JSON = '03_5月13日朝_実行/bg-faq-snapshot.json'
GLOSSARY_CSV = 'C:/Users/kenji/Downloads/全てのコンテンツ-glossary-20260513091410.csv'
REPORT = '03_5月13日朝_実行/BG_duplicates_report.md'


def load_faqs():
    with open(FAQ_JSON, 'r', encoding='utf-8') as f:
        data = json.load(f)
    return data['contents']


def load_glossary():
    """CSV 読み込み (term, slug, english, shortDef, category)"""
    import csv
    with open(GLOSSARY_CSV, 'r', encoding='utf-8-sig') as f:
        rows = list(csv.DictReader(f))
    # 短語 (2文字以下) は除外 (誤ヒット多発)
    return [
        {
            'term': r['term'],
            'slug': r['slug'],
            'english': r.get('english', ''),
            'shortDef': r.get('shortDef', ''),
            'category': r.get('category', ''),
        }
        for r in rows
        if len(r['term']) >= 3  # 短語除外
    ]


def normalize(text):
    """正規化: HTML タグ除去 + 全角→半角 + 空白圧縮"""
    if not text:
        return ''
    text = re.sub(r'<[^>]+>', ' ', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def is_term_in_text(term, text):
    """term が text に含まれるか (英大文字小文字無視、日本語完全一致)"""
    if not term or not text:
        return False
    if re.search(r'[A-Za-z]', term):
        # 英字含む場合は word boundary + 大小無視
        return re.search(rf'\b{re.escape(term)}\b', text, re.IGNORECASE) is not None
    else:
        # 日本語のみは substring 一致
        return term in text


def detect_strong_matches(faq, glossary_terms):
    """強候補: question に term が含まれ、shortDef と answer のキーワード重複度高い"""
    matches = []
    q = normalize(faq['question'])
    a = normalize(faq['answer'])
    for g in glossary_terms:
        # term が question か answer に含まれる
        in_q = is_term_in_text(g['term'], q)
        in_a = is_term_in_text(g['term'], a)
        en_in_q = g['english'] and is_term_in_text(g['english'], q)
        en_in_a = g['english'] and is_term_in_text(g['english'], a)
        if not (in_q or en_in_q or in_a or en_in_a):
            continue
        # スコアリング
        score = 0
        reasons = []
        if in_q:
            score += 3
            reasons.append('q-term')
        if en_in_q:
            score += 2
            reasons.append('q-eng')
        if in_a:
            # answer 中の出現回数 (上限 5)
            cnt = min(a.count(g['term']), 5)
            score += cnt
            reasons.append(f'a-term×{cnt}')
        if en_in_a:
            cnt = min(a.lower().count(g['english'].lower()), 5)
            score += cnt
            reasons.append(f'a-eng×{cnt}')
        if score >= 3:
            matches.append((g, score, reasons))
    # スコア降順
    matches.sort(key=lambda x: -x[1])
    return matches


def classify_match(faq, top_match):
    """match から duplicate 度を分類:
    Strong: question == term (実質的に同じテーマ)
    Medium: question に term 含む (関連)
    Weak: answer に term 含む"""
    g, score, reasons = top_match
    q = normalize(faq['question'])

    # 完全一致: question の主要部 == term
    # 「容量市場とは？」「容量市場の仕組みは？」等のパターン
    q_stripped = re.sub(r'[とは何かのですかはくださいご教えるどう・？。、 \s]*$', '', q)
    q_main = re.sub(r'^([^？。]*)[？。]', r'\1', q_stripped)

    if g['term'] == q_main or g['english'] == q_main:
        return 'STRONG (question主題)'
    if q.startswith(g['term']):
        return 'STRONG (question 先頭)'
    if score >= 6:
        return 'MEDIUM'
    return 'WEAK'


def render_report(faqs, glossary_terms):
    """レポート Markdown 生成"""
    lines = []
    lines.append('# BG Phase 1 — FAQ × glossary 重複候補レポート')
    lines.append('')
    lines.append(f'**生成日時**: 2026-05-14 (依頼BG Phase 1)')
    lines.append(f'**対象**: FAQ {len(faqs)} 件 × glossary {len(glossary_terms)} 語 = '
                f'{len(faqs) * len(glossary_terms):,} 組み合わせ')
    lines.append('')
    lines.append('---')
    lines.append('')
    lines.append('## 判定基準')
    lines.append('')
    lines.append('| 区分 | 条件 | 判断指針 |')
    lines.append('|---|---|---|')
    lines.append('| 🔴 STRONG | question 主題 == glossary term | 統合検討 |')
    lines.append('| 🟡 MEDIUM | question に term + answer に高頻度出現 | 内容差異を確認、両方残すか統合判断 |')
    lines.append('| 🟢 WEAK | answer のみに term 出現 | 自動リンク化のみで対応 (BG Phase 2) |')
    lines.append('')

    # 各 FAQ について分析
    strong_list = []
    medium_list = []
    weak_count = 0

    for faq in faqs:
        matches = detect_strong_matches(faq, glossary_terms)
        if not matches:
            continue
        top = matches[0]
        klass = classify_match(faq, top)
        if klass.startswith('STRONG'):
            strong_list.append((faq, matches[:3], klass))
        elif klass == 'MEDIUM':
            medium_list.append((faq, matches[:3], klass))
        else:
            weak_count += 1

    lines.append('## サマリ')
    lines.append('')
    lines.append(f'- 🔴 STRONG 重複候補 (江田さんレビュー必須): **{len(strong_list)}** 件')
    lines.append(f'- 🟡 MEDIUM 関連候補 (一覧表示): **{len(medium_list)}** 件')
    lines.append(f'- 🟢 WEAK 出現 (auto-link 対応): **{weak_count}** 件')
    lines.append('')
    lines.append('---')
    lines.append('')

    # STRONG 詳細
    lines.append(f'## 🔴 STRONG 重複候補 ({len(strong_list)} 件) — レビュー必須')
    lines.append('')
    if not strong_list:
        lines.append('_該当なし_')
    else:
        for i, (faq, matches, klass) in enumerate(strong_list, 1):
            lines.append(f'### #{i}: FAQ「{faq["question"]}」 [{klass}]')
            lines.append('')
            lines.append(f'- **FAQ slug**: `{faq["slug"]}`')
            lines.append(f'- **FAQ category**: {faq.get("category", "(空)")}')
            lines.append(f'- **FAQ answer (抜粋)**: {normalize(faq["answer"])[:180]}...')
            lines.append('')
            lines.append('**最も類似する glossary term (上位 3 件):**')
            lines.append('')
            for g, score, reasons in matches:
                cat = g['category'] or '(未入力)'
                lines.append(f'  - 🎯 **`{g["term"]}`** (score={score}, signals={reasons})')
                lines.append(f'    - slug: `/glossary/{g["slug"]}`')
                lines.append(f'    - english: {g["english"]}')
                lines.append(f'    - category: {cat}')
                lines.append(f'    - shortDef: {g["shortDef"][:80]}')
            lines.append('')
            lines.append('**判定 (江田さん):**')
            lines.append('- [ ] A. 両方残す (FAQ は会話形式、glossary は辞書形式)')
            lines.append('- [ ] B. FAQ 削除 (glossary に統合、FAQ 50→49)')
            lines.append('- [ ] C. glossary 削除 (FAQ が代表に、glossary 1,516→1,515)')
            lines.append('- [ ] D. FAQ 内容を glossary を参照させる形に書き換え')
            lines.append('')
            lines.append('---')
            lines.append('')

    # MEDIUM 一覧
    lines.append(f'## 🟡 MEDIUM 関連候補 ({len(medium_list)} 件) — 一覧')
    lines.append('')
    if not medium_list:
        lines.append('_該当なし_')
    else:
        lines.append('| # | FAQ question | 関連 glossary term | score |')
        lines.append('|---|---|---|---|')
        for i, (faq, matches, klass) in enumerate(medium_list, 1):
            g, score, _ = matches[0]
            lines.append(f'| {i} | {faq["question"][:40]} | `{g["term"]}` (/glossary/{g["slug"]}) | {score} |')
        lines.append('')
        lines.append(f'_(BG Phase 2 の auto-link で自動的にリンク付与される対象)_')
    lines.append('')

    lines.append('---')
    lines.append('')
    lines.append('## 推奨処理 (BG Phase 2 / 3)')
    lines.append('')
    lines.append('### STRONG 候補')
    lines.append('- 江田さん判定で個別に処理')
    lines.append('- ほぼ全件 「A. 両方残す」 想定 (形式と用途が異なる)')
    lines.append('  - FAQ: 会話形式の Q&A、SEO リッチリザルト FAQPage')
    lines.append('  - glossary: 辞書形式の定義、DefinedTerm schema (Sprint 9)')
    lines.append('')
    lines.append('### MEDIUM/WEAK 候補')
    lines.append('- BG Phase 2: FAQ answer 中の glossary term を自動リンク化')
    lines.append('  - 既存 W シリーズ auto-link 機構を FAQ にも適用')
    lines.append('  - NG_TERMS / 短語除外 / linkedRanges 等 safety net を継承')
    lines.append('- BG Phase 3: /glossary/[slug] に「関連 FAQ」セクション追加')
    lines.append('  - 最大 3 件、buildContainsFilter 経由で重複 filter 防止')
    lines.append('')

    return '\n'.join(lines), len(strong_list), len(medium_list), weak_count


def main():
    print('[bg-detect-duplicates] FAQ + glossary 読み込み...')
    faqs = load_faqs()
    glossary = load_glossary()
    print(f'  FAQ: {len(faqs)} 件')
    print(f'  glossary (>=3文字): {len(glossary)} 語')

    print('[bg-detect-duplicates] 重複候補分析...')
    report, n_strong, n_medium, n_weak = render_report(faqs, glossary)

    with open(REPORT, 'w', encoding='utf-8') as f:
        f.write(report)
    print(f'  written: {REPORT}')
    print()
    print('=== 完了 ===')
    print(f'  🔴 STRONG: {n_strong} 件')
    print(f'  🟡 MEDIUM: {n_medium} 件')
    print(f'  🟢 WEAK:   {n_weak} 件')


if __name__ == '__main__':
    main()
