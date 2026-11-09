# 補助金便 月曜定例 11-09b（追い便）— 業務産業用（小規模）の概要の欄の「（公募中）」を公募終了に（2026-11-09・CC）

**結論**: microCMS `subsidies` に PATCH 1 レコード・1 op を書いた（POST・DELETE・PUT 0）。#106／#122 の照合は ✓（送った 1 欄が一致・ほかの欄の変化 0）。もう一度 dry run を流すと skip だった。`subsidies.json` の差分は当該レコードの `scheme`・`updatedAt` の 2 行だけ。`applicable_prefs`（47）・`applicable_use_cases`・`applicable_entities` は変わっていない（#110）。本番の `/subsidies/sii-syoukibo-gyousan-ess-07r` は「（公募中）」0 回（meta description・og:description・本文のどれも）、「2026年10月30日に公募終了」は各 1 回。IndexNow 1 URL は HTTP 200。

- commit: `f781920`（applier・計画・書込の記録・`subsidies.json`）・報告の commit は本ファイル。

## (0) 読んだ絶対パス

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\補助金便_月曜定例11-09b_小規模の概要の欄の公募中_Claude_Code投入_2026-11-09起草_ユウ.md`
- 計画 JSON: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\subsidies-patch-plan-2026-11-09b_月曜定例_一次照合済み_ユウ.json`（1,708 バイト・sha256 `c19a98f564bcd44aca73fb77a98e5a7b2d303aebcba3c436064463bc744779c7`＝便の記載と一致）
  - リポへのコピー `reports/subsidies-weekly-2026-11-09b.data.json` も同じ sha256（中身は変えていない）。
- 前の便の報告（出どころ）: `C:\Users\kenji\Documents\GitHub\bess-net\reports\subsidies-weekly-2026-11-09.md`
- `_QUEUE.md`: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\_QUEUE.md`（103 行目）
- この報告: `C:\Users\kenji\Documents\GitHub\bess-net\reports\subsidies-weekly-2026-11-09b.md`（＋ `.data.json`・`.dry.json`・`.apply.json`・`.dry2.json`・`.prod.json`・`.indexnow-urls.txt`・`.indexnow.json`）

## (1) 書込の記録

**一次の取り直し**（2026-11-09 17:12 JST・curl・1 URL）

- https://sii.or.jp/DRchikudenchi_gyousan07r/ → HTTP 200・37,995 バイト・sha256 `1f223020aee6f302…`。
- 12:00 の取得（前の便）とバイト単位で同じ（`cmp` で一致）。
- 新着の先頭は「令和8年10月30日（金）「令和7年度補正 業務産業用蓄電システム導入支援事業」の公募は終了しました。」のまま。
- 公募の再開・2 次公募・追加公募の新着は無い。止める条件には当たらない。

**PATCH**（`scripts/apply-subsidies-weekly-2026-11-09b.ts`・11-09 の applier と同じ形）

| 段 | 時刻 | 結果 | ログ |
|---|---|---|---|
| dry run | 17:13 | PATCH 1・op 1・skip 0・中止 0・失敗 0・生の突き合わせの不一致 0（scheme 369→382 字） | `.dry.json` |
| `--apply`（1 回） | 17:13:31〜35 | PATCH 1・**#106/#122: ✓ 送信 1 field 一致・他 field 変化 0**（GET 3・PATCH 1） | `.apply.json` |
| dry run（冪等） | 17:14 | PATCH 0・**skip 1**（全 1 op 適用済み） | `.dry2.json` |

| レコード | field | 前 | 後 |
|---|---|---|---|
| `subsidies/sii-syoukibo-gyousan-ess-07r`（id `fexb5t8o48p`） | scheme（部分） | 公募期間2026-03-24〜10-30（公募中）。 | 公募期間2026-03-24〜10-30（2026年10月30日に公募終了）。 |

- scheme のほかの文は変えていない。前の値の old の出現は 1 回で、前の値に置き換えを 1 回当てたものが後の値と完全一致する（`subsidies.json` の前後で確認）。後の値に「公募中」は 0 回。

**検査とビルド**

- `npm run verify:source-names:src` → 台帳に無い資料名 0 種。
- `npm run type-check` → EXIT 0。
- `set -a && . ./.env.local && set +a && npm run build` → BUILD EXIT 0（★WARN なし）。

## (2) `src/data/subsidies.json` の差分

```
 src/data/subsidies.json | 4 ++--
@@ -1884,2 +1884,2 @@
-    "updatedAt": "2026-11-09T03:01:31.143Z",
-    "scheme": "DR（ディマンドリスポンス）に活用可能な…Jグランツ（GビズID必須）で電子申請。公募期間2026-03-24〜10-30（公募中）。予算＝…"
+    "updatedAt": "2026-11-09T08:13:33.887Z",
+    "scheme": "DR（ディマンドリスポンス）に活用可能な…Jグランツ（GビズID必須）で電子申請。公募期間2026-03-24〜10-30（2026年10月30日に公募終了）。予算＝…"
```

（scheme は長いので中ほどを「…」で略した。全文は `.apply.json` の before／after）

- 件数 80 → 80・slug の集合は同じ・変わったレコードは `sii-syoukibo-gyousan-ess-07r` の 1 件だけ・変わったキーは `scheme`・`updatedAt` の 2 つだけ。
- **#110**: `applicable_prefs` 47 件・`applicable_use_cases` 1 件・`applicable_entities` 1 件で、前後とも同じ値。status は `採択結果公表` のまま。

## (3) 本番照合（素の URL・script を除き `<!-- -->` を剥がした初期 DOM・`.prod.json`）

- deploy: `f781920` の commit status が Vercel success（2026-11-09 17:30:59 JST）。
- 17:31:10 に `/subsidies/sii-syoukibo-gyousan-ess-07r` を 2 回取得。

| 回 | HTTP | x-vercel-cache・age | 状態のバッジ | 「（公募中）」 meta／og／本文 | 「2026年10月30日に公募終了」 meta／og／本文 |
|---|---|---|---|---|---|
| 1 | 200 | PRERENDER・0 | 採択結果公表 | 0／0／0 | 1／1／1 |
| 2 | 200 | HIT・2 | 採択結果公表 | 0／0／0 | 1／1／1 |

- 便の基準（「（公募中）」0 回・「2026年10月30日に公募終了」1 回以上）を満たす。新しい deploy の版（PRERENDER のあと HIT）で、TTL 内の旧い版ではない。

## (4) IndexNow

- `reports/subsidies-weekly-2026-11-09b.indexnow-urls.txt` の 1 URL（`https://bess-net.jp/subsidies/sii-syoukibo-gyousan-ess-07r`）。
- dry run（鍵ファイル HTTP 200・中身一致）→ 17:31:22 に `--urls … --apply` を 1 回 → **HTTP 200（受理）**（`.indexnow.json`）。鍵は先頭 4 文字 605d だけ記録。

## (5) 申告

1. **ローカルのビルドの詳細ページは旧い文のまま**（`.next/server/app/subsidies/sii-syoukibo-gyousan-ess-07r.html` で「（公募中）」3 回）。
   - 詳細ページの本文は実行時に microCMS から取る経路で、ローカルの fetch キャッシュに書込前の応答が残っていたため。
   - precompute の `subsidies.json` は新しい値。前の便（102 行）と同じ現象で、本番（(3)）は新しい値。
2. microCMS の `subsidies` には webhook があるので、17:13 の PATCH で Vercel のビルドが 1 本走ったはず（push のビルドで中間は自動 Canceled になる運用）。本番の照合は push の commit `f781920` の deploy で行った。
3. 書込前に書込先の URL は開いていない（#127）。開いたのは deploy 後の (3) だけ。
4. 消したファイルは無い。一時物は scratchpad（リポの外）に置いた。リポの未追跡ファイルは触っていない。
5. 30 分の監視（microCMS の警告メール・Vercel のエラー率）は EDAさんにお願いしたい（deploy 完了 17:30:59 → 18:01 ごろまで。報告の push でもう 1 本ビルドが走る＝中身は報告だけ）。
