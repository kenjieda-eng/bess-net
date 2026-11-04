# 毎朝の再ビルド便 報告（日付で変わる表示を毎朝作り直す・GitHub Actions）

実施 2026-11-04 13:13〜13:35 JST。commit `f1895cc`（コードのみ・microCMS 0）。**IndexNow の後段は既定オフのまま**（リポジトリ変数 `INDEXNOW_DAILY` は未設定）。deploy hook の URL は表示も記録もしていない。

## (0) 絶対パス

`C:\Users\kenji\Documents\GitHub\bess-net\reports\daily-rebuild-2026-11-04.md`

## 結果（先に）

- `.github/workflows/daily-rebuild.yml` を足した。毎日 00:10 JST に deploy hook へ POST する。
- 手動実行は 1 回成功した（13:24・HTTP 201）。Vercel に新しいデプロイが 1 本でき、13:32 に Ready になった。
- 13:32:56 の `/subsidies`（素の URL・PRERENDER・age 0）は、「本日締切」が今日 11/4 締切の 1 件だけだった。
- **直す前の実例を本番で見た。** 13:16 の `/subsidies` は 11/3 22:16 JST に作られたまま（HIT・age 53,951 秒）で、今日締切の補助金を「あと1日」と出していた。

## (1) 日付で表示が変わるのに、ビルド・ISR の時点で固まるページ

方式はページの `revalidate`／`dynamic` の値。ISR は最初の訪問者に古い版を返してから作り直す。新しいデプロイは自分の ISR を持つ（#112）ので、毎朝のデプロイで全部その日の日付になる。

| ページ | 日付で変わる表示 | 方式 | 毎朝の再ビルドがないと |
|---|---|---|---|
| `/subsidies` | 公募中・本日締切・あと N 日・受付終了 | ISR 1 日 | **最大 1 日古い**（10/31 と今日 11/4 の実例） |
| `/industry`・`/market/jepx`・`/dashboard/market` | JEPX の最新日の頭打ち（`todayJst`） | ISR 1 日 | 最大 1 日古い |
| お知らせバナー（`layout.tsx`・全ページ） | 掲載期間の開始・終了（`renderedJstDate`） | 静的ページ（`/lv/*`・`/start/*`・`/milestones`・`/corrections`・`/tools` の一部・`/industry/top50`・`/info` の一部）の HTML は次のビルドまで固定 | HTML だけ古い（JS 実行後は日付どおり・10/15 のセミナーの件） |
| `/info/seminar-bess-investment-2026-10-14` | 開催前・後の切替（TimeSwitch） | 静的＋1 時間 | HTML だけ古い（JS 実行後は日付どおり） |
| ビルド時の生成物 | 予定日超過のリスト（`precompute-projects-maintenance`）・EIC の頭打ち（`precompute-eic-data`） | prebuild | 次のビルドまで固定 |
| `/tracker/subsidy`・`/ops/freshness` | 補助金の状態・鮮度 | ISR 1 時間 | 1 時間以内に直る |
| `/subsidies/[slug]`・`/policy-calendar`・`/policy-calendar/[slug]`・`/events`・`/faq` | 状態・予定→終了・開催日 | ISR 10 分 | 10 分以内に直る |
| `/`（トップ） | 60 日以内の締切など | ISR 1 分 | 1 分以内に直る |

## (2) ワークフローの中身

`.github/workflows/daily-rebuild.yml`:

- **起動**
  - `schedule: '10 15 * * *'`（00:10 JST）の再ビルド
  - `schedule: '0 16 * * *'`（01:00 JST）の IndexNow の後段
  - `workflow_dispatch`（手動）
- **job `rebuild`**（00:10 の schedule と手動のとき）
  - secret `VERCEL_DEPLOY_HOOK_URL` に `curl -X POST` する。
  - secret が無いときは「secret VERCEL_DEPLOY_HOOK_URL が無いので何もしない」と 1 行出して成功で終わる。
  - 表示するのは HTTP コードと応答の `job.state` だけ。2xx 以外は失敗にする。`set -x` は使わない。
- **job `indexnow`**（01:00 の schedule、かつ `vars.INDEXNOW_DAILY == 'on'` のときだけ）
  - checkout と Node 20 を用意し、`npx tsx@4.21.0 scripts/indexnow-submit.ts --since <前日 JST> --apply` を流す。
  - 生成時刻の lastmod と変電所の詳細は、道具の側で外れる。送る URL が 0 件なら送らない（道具の作り）。
- `permissions: contents: read`。
- README の「デプロイ」の節に 3 行を足した（毎朝の再ビルド・IndexNow の後段のオンオフ・止め方）。

## (3) 手動実行の結果とデプロイ

| 時刻（JST） | 出来事 |
|---|---|
| 13:16 | push（`f1895cc`）。この push のデプロイ `bess-1nygfcy25` が 13:24 に Ready（commit status success 13:24:23） |
| 13:24:37 | `gh workflow run daily-rebuild.yml`（run 41773028183） |
| 13:24:53 | ログ「deploy hook: HTTP 201・job.state PENDING」。rebuild=success・indexnow=skipped。ログの env の行は `HOOK: ***`（伏せ字） |
| 13:24:54 | Vercel に新しいデプロイ `bess-5hsgwi7s6`（production・main）ができた |
| 13:32:46 | `bess-5hsgwi7s6` が Ready（8 分） |
| 13:32:56 | `/subsidies` 200・PRERENDER・age 0。「本日締切」は「令和7年度補正 系統用蓄電システム等導入支援事業（締切 2026-11-04）」の 1 件だけ（一覧とカードで 2 か所に出る）。11/6 締切は「あと2日」 |

`/tracker/subsidy` と `/` も 200・PRERENDER・age 0。

**注意**: 直したのは push のデプロイ（13:24）が先。手動実行で確かめられたのは「hook でデプロイが 1 本でき、Ready になり、それが今の本番になったこと」まで。**夜の定時の起動（11/5 00:10 JST）はまだ見ていない。**

## (4) IndexNow の後段の dry run（本番の sitemap・送っていない）

| `--since` | 送る URL | 外した件数 |
|---|---|---|
| 2026-11-03（今夜 01:00 に流れる場合の「前日」と同じ） | **0 件** | 生成時刻・空の lastmod 417 件／変電所の詳細 0 件 |
| 2026-11-02（参考） | 38 件（11/2 投入の news 38 件） | 同じ 417 件 |

本番の鍵のファイルは HTTP 200・中身一致（鍵は先頭 4 文字 `605d` だけ記録）。

## (5) 申告

- **夜の定時起動は未確認**: 最初の定時の起動は 11/5 00:10 JST。GitHub の schedule は混雑で数分〜数十分遅れることがある。
- **毎日 01:00 にも run が 1 本できる**: `INDEXNOW_DAILY` がオフのあいだは、01:00 の run は job が skipped のまま成功で終わる。Actions の一覧に毎日 2 本並ぶ。
- **60 日の停止**: 公開リポジトリでは、60 日間 commit が無いと schedule が自動で止まる（GitHub の仕様）。今の更新頻度では当たらない。
- **負荷**: ビルドが 1 日 1 本増える（約 8 分）。prebuild の microCMS の読み込みは通常の push のビルドと同じ量で、runtime の microCMS は増えない。
- **IndexNow の後段を流す方法**: `npm ci` はせず、`npx tsx@4.21.0`（package-lock と同じ版）で流す。道具が使うのは Node 標準の fetch と fs だけ。
- **オンにするとき**: ユウの裁定の後、GitHub の Settings → Variables に `INDEXNOW_DAILY=on` を足す。CC は足していない。
- **便の §2-3 の置き場所**: 運用の 3 行は、CLAUDE.md ではなく README の「デプロイ」の節に入れた（便は「README か CLAUDE.md」）。
- **一時物**（消していない・リポジトリの外）:
  - `C:\Users\kenji\AppData\Local\Temp\claude\C--Users-kenji-Documents-GitHub-bess-net\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\subsidies-before.html`
  - `C:\Users\kenji\AppData\Local\Temp\claude\C--Users-kenji-Documents-GitHub-bess-net\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\after.html`
  - `C:\Users\kenji\AppData\Local\Temp\claude\C--Users-kenji-Documents-GitHub-bess-net\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\h.txt`
  - `C:\Users\kenji\AppData\Local\Temp\claude\C--Users-kenji-Documents-GitHub-bess-net\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\indexnow-dry-2026-11-04.txt`

停止条件に触れた操作なし。microCMS 0。IndexNow の送信 0。
