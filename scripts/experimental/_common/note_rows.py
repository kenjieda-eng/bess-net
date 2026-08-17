# -*- coding: utf-8 -*-
"""
scripts/experimental/_common/note_rows.py — 公表CSVの「注記行」を設備行として取り込まないためのガード

背景（2026-08-17 実証）:
  中国電力NWの csv_220kv.zip に含まれる「【留意事項】」の見出し行を設備行としてパースし、
  microCMS に egz-kikan-x として登録していた（全項目 null の空ページ・エリア件数にも算入）。

★条件の設計 — 「全項目が null」だけを条件にしてはいけない:
  九州 kyu-500「南関」（external_id=kyuden_16_45・熊本県）は、連番の設備Noと実名を持つ
  **実在の変電所**だが、公表値が全て空欄のため全項目 null になる。
  「全項目 null」で弾くと、この実在設備を取りこぼす（落とし穴 #117 と同型の過剰除去）。

  そこで判別は「値」ではなく「No.欄と名称」で行う:
    (1) No.欄が設備番号でない（【…】等の注記見出し・※・・ で始まる）→ 注記行
    (2) 名称が空 かつ 設備値が全て空 → 実体のない行（保険。単独では弾かない）
  南関は (1)(2) いずれにも該当しないため残る。

★#117 と同じ方針で「社ごと opt-in」。共通関数として置くが、各社のパーサが明示的に呼ぶ。
"""
import re

# No.欄が設備番号ではなく注記見出しであることを示すマーカー
NOTE_NO_PATTERN = re.compile(r"[【〔\[]|^※|^・|^注|^備考|^凡例")


def is_note_no(no) -> bool:
    """No.（設備番号）欄が注記見出しなら True。値には一切依存しない。"""
    s = (no or "").strip()
    if not s:
        return False
    return bool(NOTE_NO_PATTERN.search(s))


def is_empty_artifact(name, values) -> bool:
    """名称が空 かつ 設備値が全て空 なら True（保険。名称があれば False＝南関を守る）。"""
    if (name or "").strip():
        return False
    return all(v is None or (isinstance(v, str) and not v.strip()) for v in values)


def skip_reason(no, name, values):
    """弾く理由（弾かないなら None）。呼び出し側は必ず件数と理由をログに出すこと。"""
    if is_note_no(no):
        return f"No.欄が注記見出し（{(no or '').strip()}）"
    if is_empty_artifact(name, values):
        return "名称が空かつ設備値が全て空"
    return None
