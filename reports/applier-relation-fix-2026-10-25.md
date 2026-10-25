# applier の関連（relation）欄の判定を直す（2026-10-25）

## 結論

- `scripts/lib/microcms-applier.ts` の配列モードで、関連欄の GET の形 `[{"id":"…"}]` を ID の文字列の配列に直してから比べるようにした（`relIds`）。
- 本実行便 10-22 の第 5 版の計画を dry run で流し直した結果は **PATCH 0 / POST 0 / skip 129 / 中止 0 / 失敗 0／生の文字列の不一致 0**（microCMS は GET 255 だけ）。
  10-22 の再実行（改修前）は skip 127・中止 2（`links/kyoto-ondanka`・`links/occto-iinkai` の relatedTerms）だった（reports/main-run-2026-10-22.md (1)）。
- 自己検査 `npx tsx scripts/verify-applier.ts` は 107 件 ok（既存 79 件の判定は変わらない・関連欄の 28 件を追加）。
- microCMS への書込は 0（`--apply` は付けていない）。

## 原因

関連欄は GET（depth=0）で `[{"id":"a"}]` の形で返る。計画の op の `new` と expect_final は ID の文字列の配列 `["a"]` で書いてある。
次の 2 か所が形の違いで一致しなかった。

1. `canSkipByExpectFinal`: `digest(GET の値)` は `[{id}]` の JSON の sha になるので、文字列の配列で計算した expect_final と一致しない。
2. `applyOps` の配列モード: 「適用済み」（現値＝new）の判定が `norm(base) === norm(want)` で一致しない。
   old（10-22 の計画は GET の値を写した `[{id}]` の形）とも一致しないので「中止」になる。

PATCH 後の照合 `sameValue` には、もともと `[{id}]` と文字列の配列を同じと見る分岐がある（今回は触っていない）。

## 改修

| 箇所 | 変更 |
|---|---|
| `relIds`（新設・export） | 要素がすべて `id`（文字列）を持つオブジェクトの空でない配列を、ID の文字列の配列に直す。それ以外（文字列の配列・select・空配列・null・文字列）はそのまま |
| `applyOps` の配列モード | 適用済みの判定（現値＝new）と old の判定を `norm(relIds(…))` で比べる。送る値は計画の new のまま |
| `canSkipByExpectFinal` | `digest(現値)` に加えて `digest(relIds(現値))` が expect_final と一致しても skip する（`[{id}]` の形で expect_final を計算した過去の計画も skip のまま） |
| `rawPlanAfter`・`rawMismatches` | 配列の old の判定と突き合わせを同じく `relIds` を通して比べる |

`digest` 自体は変えていない（既存の計画の expect_final の値を変えないため）。

## 自己検査（scripts/verify-applier.ts の (e)）

old が `[{id}]` の形の計画と、文字列の配列の形の計画の 2 型それぞれで:

- 初回: 当たる（送る値＝new）・expect_final で skip しない・生の突き合わせ 0
- 当てた後の再実行（GET は `[{id}]`）: applyOps で適用済み・payload 空、expect_final（文字列の配列で計算・`[{id}]` の形で計算のどちらでも）で skip、生の突き合わせ 0
- 改修前の applyOps（legacyApplyOps）は再実行で中止になることを前提として確認（old が `[{id}]` の型）
- 現在値が「別の ID」「順序が違う」「空」のとき: 中止・payload 空・expect_final で skip しない

加えて `relIds` の変換範囲（文字列の配列・空配列・`{id}` 以外のオブジェクト・null・文字列は変えない）を 1 件で確認。

順序が違う関連は中止にしている（microCMS の関連は順序を持ち、表示順に効くため同じとは見なさない）。

## 実行の記録

```
npx tsx scripts/verify-applier.ts
[verify:applier] 検査 107 件（見えない差 4 型・その他 15 型・関連欄 2 型）
[verify:applier] ok

set -a && . ./.env.local && set +a && npx tsx scripts/apply-main-run-v5-2026-10-22.ts   # 既定 dry run
■ PATCH links/kyoto-ondanka（vybh4sd1br9）[skip] 最終状態と一致（expect_final 1 field）
■ PATCH links/occto-iinkai（kreo1mm068）[skip] 最終状態と一致（expect_final 5 field）
[done] PATCH 0 / POST 0 / skip 129 / 中止 0 / 失敗 0
[生の文字列の突き合わせ] 送る値と計画の適用後の値の不一致 0
[microCMS 呼び出し] GET 255
```

skip 129 の内訳: PATCH 126 はすべて expect_final（最終状態と一致）で skip、POST 3 は既存ありで skip。
計画の PATCH は 126 件（capacity-output-design は 10-22 に EDAさんの指示で計画から外してある＝`excluded_at_run`）。

## 申告

- dry run のログ（JSON・テキスト）はリポジトリの外の scratchpad に置いた。消していない。
- `.env.local` は worktree に無いので、元のチェックアウトのものを `set -a && . … && set +a` で読み込んだ（内容は表示していない）。
