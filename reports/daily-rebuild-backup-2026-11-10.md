# 毎朝の再ビルドの予備便 — 取りこぼしたら 2 時間おきにやり直す・ビルドの日付の印（2026-11-10・CC）

**結論**: ビルドの日付の印 `https://bess-net.jp/build-info.json` を作り、`.github/workflows/daily-rebuild.yml` に予備を 4 回（02:10・04:10・06:10・09:10 JST）足した。microCMS の書込 0。
- 本番の印: 200・`dateJst` は今日・2 回読んで同じ値・`X-Robots-Tag: noindex`・サイトマップに無い。
- 手動実行 2 回（GitHub の Actions・CC が `gh workflow run` で実行）:
  - (a) `check_only=true`: 判定の 1 行は「今日の日付でビルド済み。何もしない」。hook の手順は skipped で、デプロイは増えていない。GitHub の実行環境から印は HTTP 200 で読めた。
  - (b) 入力なし: hook HTTP 201。デプロイが 1 本でき、Ready になった。印の `builtAt` は 10:13:19 → 10:23:52 に新しくなった。
- IndexNow は送っていない（便どおり）。

**★前提の訂正（先に読んでほしい）: 11/10 の 00:10 の分は「始まらなかった」のではなく、8 時間 35 分遅れて 08:45 JST に始まっていた。** 定時の実行は、11/5 の 1 回目から毎日 3〜6 時間遅れている（(5) 1）。
- commit: `1c8e218`（印・ワークフロー・README・next.config.js）・報告の commit は本ファイル。

## (0) 読んだ絶対パス

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\毎朝の再ビルドの予備便_取りこぼしたら2時間おきにやり直す・ビルドの日付の印_GitHub_Actions_コードのみ_Claude_Code投入_2026-11-10起草_ユウ.md`
- 根拠の記録: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\02_計画・運営\検証記録_毎朝の再ビルド便_2026-11-04_ユウ.md`（11/10 07:5x・08:1x の追記）
- 前の便の報告: `C:\Users\kenji\Documents\GitHub\bess-net\reports\daily-rebuild-2026-11-04.md`
- `_QUEUE.md`: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\_QUEUE.md`（104 行目）
- この報告: `C:\Users\kenji\Documents\GitHub\bess-net\reports\daily-rebuild-backup-2026-11-10.md`（＋ `.tests.txt`〔判定の試し 13 通り〕・`.prod.json`〔本番の印 4 回〕）

## (1) 印の作り方と URL

- URL: **`https://bess-net.jp/build-info.json`** → `{"dateJst":"2026-11-10","builtAt":"2026-11-10T10:23:52+09:00"}`
- 作り方: 静的な route handler `src/app/build-info.json/route.ts`。
  - `dynamic = 'force-static'`・`revalidate = false`。値はビルドのときに決まり、実行時には計算しない。ISR にもしていない。
  - ビルドの出力で `○ /build-info.json`（静的）。`.next/server/app/build-info.json.body` に値が焼き込まれる。
  - デプロイごとに作り直されるので、ビルドのたびに `builtAt` が変わる（下の (4) で 10:13:19 → 10:23:52）。
- `dateJst` は `getTodayJST()`（`src/lib/subsidies-meta.ts`）をそのまま呼ぶ。/subsidies の「本日締切」と同じ出し方。`builtAt` は同じ時刻の JST（秒まで・`+09:00`）。
- microCMS を読まない（import は `subsidies-meta.ts` だけで、このファイルは import を持たない）。
- `X-Robots-Tag: noindex` は `next.config.js` の `headers()` に `/build-info.json` の 1 項を足して付けた。本番の応答に出ていることを確かめた。
- サイトマップ（`src/app/sitemap.ts`）は URL を列挙して作る形なので、何もしなくても載らない。本番の `/sitemap.xml`（12,586 件）に `build-info` は 0 回。
- middleware の matcher にも入っていない（触っていない）。
- `public/` に書く形にはしていないので、`.gitignore` の変更は無い。

## (2) ワークフローの中身（`.github/workflows/daily-rebuild.yml`）

| 役目 | JST | cron（UTC） | 動き |
|---|---|---|---|
| 再ビルド（今のまま） | 00:10 | `10 15 * * *` | 印を見ずに必ず hook を叩く |
| 予備 1 | 02:10 | `10 17 * * *` | 印を見て決める |
| 予備 2 | 04:10 | `10 19 * * *` | 印を見て決める |
| 予備 3 | 06:10 | `10 21 * * *` | 印を見て決める（印が読めないときは叩く） |
| 予備 4 | 09:10 | `10 0 * * *` | 印を見て決める |
| IndexNow の後段（今のまま） | 01:00 | `0 16 * * *` | 変えていない（`INDEXNOW_DAILY` も触っていない） |

- 手動実行（`workflow_dispatch`）に入力 `check_only` を足した（boolean・既定 false）。
  - false: 今までどおり、印を見ずに必ず叩く。
  - true: 予備と同じ判定の 1 行を出すだけで、叩かない。
- job `rebuild` の `if`: `workflow_dispatch`、または `schedule` で `0 16 * * *` 以外のとき。
- 手順は 2 つ。
  1. **叩くかを決める**（`id: decide`・`shell: bash`）。
     - 値は env だけで受け取る（`EVENT`・`SCHEDULE`・`CHECK_ONLY`・`MARKER_URL`）。run の中に `${{ }}` は書いていない。
     - 00:10 の定時と、手動の check_only でない回は、印を見ずに `fire=true`。
     - それ以外（予備の 4 回・check_only）は、次の順で決める。
       - `curl -s --max-time 20` で印を取る。HTTP の番号を記録し、接続できない・時間切れは 000 とする。
       - 200 のときだけ、node で JSON を読み、`dateJst`（`YYYY-MM-DD`）を取り出す。
       - 取り出した日付が今日と同じなら何もしない。前の日付なら叩く。読めないときは 06:10 の回だけ叩く。
       - check_only の回は、叩く判定でも叩かない。
     - 判定の 1 行（今日・枠・印の HTTP・`dateJst`・叩く／叩かない）を出し、`fire` を `$GITHUB_OUTPUT` に書く。
  2. **Vercel の deploy hook に POST する**。
     - 今までの手順のままで、`if: steps.decide.outputs.fire == 'true'` を足しただけ。
     - シークレットは `VERCEL_DEPLOY_HOOK_URL`（名前だけ記す）。ログは HTTP の番号と `job.state` だけを出す。
- concurrency は今のまま（`daily-rebuild-${{ github.event.schedule || 'manual' }}`＝時刻ごとに別の組）。
- 予備の 4 回と check_only の回は、実行の部品を増やしていない。checkout も setup-node も使わない（ubuntu-latest に入っている node・curl だけ）。00:10 と手動の経路は、判定の 1 行が先に出る以外は前と同じ。
- 先頭のコメントと README の「デプロイ」の節を、予備の時刻・印の URL・「印が今日ならやり直さない」・check_only・止め方（Disable で全部止まる）に直した。

## (3) 判定の試し（ローカル・`.tests.txt`）

**やり方**
- ワークフローの YAML から、`decide` の手順の `run` をそのまま取り出した（PyYAML）。
- env を差し替えて `bash -eo pipefail` で流した。Actions の bash と同じオプション。
- 印は scratchpad の 127.0.0.1 の使い捨ての HTTP サーバから返した。curl から判定までを丸ごと通している。
- hook は叩いていない（判定の手順だけを流した）。

**便の 4 通り**

```
[1 印が今日・02:10]       判定: 今日 2026-11-10・枠 02:10・印 HTTP 200・dateJst 2026-11-10 → 今日の日付でビルド済み。何もしない（hook: 叩かない） | fire=false
[2 印が昨日・02:10]       判定: 今日 2026-11-10・枠 02:10・印 HTTP 200・dateJst 2026-11-09 → 前の日付のビルドなので叩く（hook: 叩く） | fire=true
[3 壊れた JSON・02:10]    判定: 今日 2026-11-10・枠 02:10・印 HTTP 200・dateJst （読めない） → 印が読めないので、この回は何もしない（hook: 叩かない） | fire=false
[4 壊れた JSON・06:10]    判定: 今日 2026-11-10・枠 06:10・印 HTTP 200・dateJst （読めない） → 印が読めないので、06:10 の回として叩く（hook: 叩く） | fire=true
```

**追加の 9 通り**（便の表の残りの経路）

| # | 条件 | 結果 |
|---|---|---|
| 5 | 印が昨日・09:10 | 叩く |
| 6 | HTTP 404・04:10 | 読めない → 何もしない |
| 7 | `dateJst` 無し・06:10 | 読めない → 叩く |
| 8 | つながらない（HTTP 000）・02:10 | 読めない → 何もしない |
| 9 | 00:10 の定時（印は今日） | 印を見ずに叩く |
| 10 | 手動・入力なし | 印を見ずに叩く |
| 11 | 手動・check_only・印が今日 | 何もしない |
| 12 | 手動・check_only・印が昨日 | 「前の日付のビルドなので叩く（check_only なので叩かない）」 |
| 13 | 手動・check_only・壊れた JSON | 何もしない |

- 13 通りとも、手順は exit 0（成功で終わる）。

## (4) 本番の印と、手動実行 2 回の結果

**push のデプロイ**
- `1c8e218` を 10:10:14 に push した。commit status の Vercel success は 10:17:36（デプロイ `bess-9w9udgi2f`・作成 10:10:15）。

**本番の印（素の URL・`.prod.json`）**

| 時刻 | HTTP | x-vercel-cache・age | 本文 |
|---|---|---|---|
| 10:17:52 | 200 | PRERENDER・0 | `{"dateJst":"2026-11-10","builtAt":"2026-11-10T10:13:19+09:00"}` |
| 10:17:56 | 200 | HIT・3 | 同じ |
| 15:18:43（(b) の後） | 200 | HIT・389 | `{"dateJst":"2026-11-10","builtAt":"2026-11-10T10:23:52+09:00"}` |
| 15:18:46 | 200 | HIT・392 | 同じ |

- 4 回とも `X-Robots-Tag: noindex`・`Content-Type: application/json`・`Cache-Control: public, max-age=0, must-revalidate`。
- 同じデプロイの中では、2 回読んで値が同じだった（実行時に計算していない）。`builtAt` は、ビルドの静的生成の時刻（push 10:10 → Ready 10:17 のあいだ）。

**手動実行 2 回**（CC が `gh workflow run daily-rebuild.yml` で実行・権限で止まらなかった）

| 回 | run | 入力 | 判定の 1 行（ログ） | hook | デプロイ |
|---|---|---|---|---|---|
| (a) | #15 `42735009816`（10:19:52） | `check_only=true` | `判定: 今日 2026-11-10・枠 手動（check_only）・印 HTTP 200・dateJst 2026-11-10 → 今日の日付でビルド済み。何もしない（hook: 叩かない）` | 手順は skipped | 増えていない（10:20:21 の `vercel ls` の先頭は push の `bess-9w9udgi2f` のまま） |
| (b) | #16 `42735095895`（10:20:32） | なし | `判定: 今日 2026-11-10・手動実行なので印を見ずに叩く` → `deploy hook: HTTP 201・job.state PENDING（2026-11-10 10:20:43 JST）` | 叩いた（ログの env は `HOOK: ***`） | `bess-2d5c98fik`（作成 10:20:44・Ready・8 分）→ 印の `builtAt` が 10:23:52 に |

- (a) で、GitHub の実行環境から印が HTTP 200 で読めることも確かめた。
- ほかのページ（15:18・素の URL）: `/subsidies` 200 HIT・`/` 200 STALE（age 100）・`/grid` 200 HIT。

## (5) 申告

1. **★前提の訂正: 定時の実行は、毎日 3〜6 時間（11/10 は 8 時間半）遅れて始まっている。**
   - GitHub の実行履歴（`gh run list`）の開始時刻（JST）は次のとおり。

     | run | 予定 | 開始 | 遅れ |
     |---|---|---|---|
     | #2 | 11/5 00:10 再ビルド | 11/5 06:15 | 6h05m |
     | #4 | 11/6 00:10 | 11/6 06:27 | 6h17m |
     | #6 | 11/7 00:10 | 11/7 05:51 | 5h41m |
     | #8 | 11/8 00:10 | 11/8 04:23 | 4h13m |
     | #10 | 11/9 00:10 | 11/9 04:35 | 4h25m |
     | **#13** | **11/10 00:10** | **11/10 08:45** | **8h35m** |

     01:00 の IndexNow の後段（#3・5・7・9・11・14）も同じように 4〜8 時間遅れ。どれも skipped で、`INDEXNOW_DAILY` がオフなので正しい動き。
   - 11/10 の 07:5x にユウが見たときに記録が無かったのは、まだ始まっていなかったため。#13 は 08:45 に始まって成功している。hook のデプロイ `bess-8zf34i3yt`（作成 08:45:25）がそれ。EDAさんの手動実行 #12 のデプロイは `bess-5kdwvzg5w`（作成 08:00:08）。この 2 本は `vercel inspect` で確かめた。11/10 の朝はビルドが 2 本走った。
   - 意味するところ:
     - 普段の日でも、/subsidies が今日の見え方になるのは 00:10 ではなく 04〜06 時ごろ。検証記録の「09:00 の確認で OK」は、この遅れを見分けられない。
     - 予備の 4 回にも、同じように遅れがかかると思われる。
       - 予備の方が早く始まり、00:10 の分が後から来た日は、ビルドが 2 本になる（便の §2 で「害は無い」としたとおり）。
       - 全部が大きく遅れた日は、予備でも早くはならない。
     - 遅れの理由は確かめていない。GitHub の文書は、Actions が混む時間帯（毎時の始まりなど）には定時の実行が遅れ、混み方によっては落ちることもあると説明している。
   - どうするか（時刻を変える・Actions 以外から叩く 等）は、この便の範囲外として何もしていない。裁定はユウにお願いしたい。
2. **ローカルの試しの「今日」**:
   - Git Bash の `date` は `TZ=Asia/Tokyo` を効かせない（zoneinfo が無く、UTC のまま）。
   - 試しは 10:0x JST に流した。UTC と JST の日付が同じ時間帯なので、「今日 2026-11-10」は正しい。
   - Actions（ubuntu）では効く。(b) のログの「10:20:43 JST」が、UTC 01:20:43 から 9 時間ずれていることで確かめた。
3. **便に無い分岐を 1 つ足した**:
   - 印の `dateJst` が今日より後の日付のときは「時計のずれ」として何もしない。
   - ビルドと判定がどちらも JST で日付を出すので、普通は起きない。
4. **00:10 のビルド自体が失敗した日**（Vercel のビルドのエラー）:
   - 印が前の日付のまま残るので、予備の 4 回がそれぞれ叩き直す（最大で 1 日 4 本）。
   - 便に定めが無いので、そのままにした。ビルドが直るまで同じ失敗を繰り返す可能性がある。
5. **site-history に足していない**:
   - `/build-info.json` は機械が読む印で、読者向けのページ・データベース・ツールではない（noindex・サイトマップ外）。
   - 受け入れ基準の「新しいページ…を公開する便」には当たらないと判断した。違うならユウの指示で足す。
6. **待ちの手順が 1 回、出力なしの exit 4 で終わった**:
   - (b) のデプロイが Ready になるのを `vercel ls` で待つループ。
   - Ready は 15:18 に `vercel inspect`（status Ready）と `vercel ls` で確かめ直した。デプロイは 10:20:44 作成・8 分で、その時点でもいちばん新しい本番。
   - (b) の後の印の確認が 15:18 になったのはこのため（10:2x〜15:1x のあいだに別のデプロイは無い）。
7. **デプロイの本数**: この便で本番のデプロイは 3 本。push 1・(b) 1・報告の push 1（報告だけ）。(a) では 0。
8. **ファイルと一時物**:
   - 消したファイルは無い。
   - 一時物（試しの印・取り出した判定の手順・ログ）は scratchpad（リポの外）にある。
   - 使い捨ての HTTP サーバは TaskStop で止めた。
   - リポの未追跡ファイルと `src/data/substations/*.json` は触っていない・commit していない。
   - ビルドで `subsidies.json` は変わらなかった。
9. microCMS の書込 0・IndexNow 0。deploy hook の URL はログ・報告・チャットに出していない。
10. **次の自動の回**:
    - 11/11 00:10 の再ビルド（遅れて始まる見込み）と、02:10〜09:10 の予備。
    - 予備のログに出る判定の 1 行で、本番の動きを確かめられる。
    - 11/11 09:10 の予約の確認では、Actions の一覧に予備の run（成功・hook skipped）が並ぶはず。
