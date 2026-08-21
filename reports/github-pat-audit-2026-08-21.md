# GITHUB_PAT の棚卸し（読み取りのみ・2026-08-21）

※ トークン値・ヘッダ内容は本書にも作業ログにも一切出していない。

## 2-1. 参照箇所（全数）

| ファイル | 行 | 用途 |
|---|---|---|
| `scripts/precompute-eic-data.ts` | 19 | `process.env.GITHUB_PAT` の読み取り |
| 同 | 68 | 取得ヘッダに `Authorization: Bearer` を付与（PAT があるときのみ） |
| 同 | 77 | 認証付きで 401/403/404 のとき無認証で1回リトライ（2026-08-14 追加のフォールバック） |
| 同 | 132-133 | PAT 未設定時の警告「using unauthenticated 60 req/h limit」 |

ほかに参照なし（src/・docs/・.github/・CLAUDE.md・OneDrive 01_最初に読む: 0件）。`.env.local` と Vercel 環境変数に値が設定されている（値は未確認・未表示）。

## 2-2. アクセス先と無認証取得の実測

- **取得先は `raw.githubusercontent.com`**（`api.github.com` ではない）。リポジトリはコード上 **`kenjieda-eng/eic-data-pipeline`**（依頼書の「eic-data-web」とは異なる）
- GitHub API（無認証）で `private=false / visibility=public` を確認
- raw の catalog（`data/catalog/indicators.json`）を無認証で取得: **HTTP 200（1,063,039B）**
- **無認証で precompute を1回完走: 602系列 成功／失敗0**。`src/data/eic/` の出力は**認証あり版とバイト同一**（diff なし）
- 補足: コードの警告文「60 req/h limit」は api.github.com の制限であり、raw.githubusercontent.com の取得には当てはまらない（文言が実態と合っていない）

## 2-3. 結論: **(a) PAT 廃止可**

根拠: ①リポジトリが public ②取得先が raw（認証不要）③無認証で全602系列が認証あり版と同一に取得できた ④失効PATは**取得を壊す側**に働いた（2-4）。PAT を持ち続けることは利益がなくリスク（失効・漏えい）だけが残る。

### 廃止手順ドラフト（実行は別便・承認後）
1. コード: `scripts/precompute-eic-data.ts` から GITHUB_PAT の読み取り・Bearer 付与・フォールバック・誤解を招く警告を削除し、`User-Agent` のみのプレーン取得にする（tsc → ローカル precompute で 602/602 を確認）
2. `.env.local` の `GITHUB_PAT` 行を削除（**EDAさんが手動**。CC は値を表示しない）
3. Vercel → Project Settings → Environment Variables から `GITHUB_PAT` を削除（**手動**）
4. GitHub → Settings → Developer settings → Personal access tokens で当該トークンを **Revoke**（手動）
5. 検証: 次の Vercel ビルドログで `[eic-data] Done: N succeeded, 0 failed` を確認。メモリの `github-pat-expired` を「廃止済み」に更新

## 2-4. Vercel デプロイ 772c4ed（8/14）の Error 原因（ビルドログ実物）

`bess-l64bxp5s2`（Commit 772c4ed・02:51:59 開始・44s）:
```
02:52:42.168Z  [eic-data] Starting precompute...
02:52:42.260Z  [eic-data] FATAL: cannot fetch catalog: Error: Fetch failed:
               https://raw.githubusercontent.com/kenjieda-eng/eic-data-pipeline/main/data/catalog/indicators.json (HTTP 404)
02:52:42.348Z  Error: Command "npm run build" exited with 1
```
→ **PAT失効由来で確定**。失効した Bearer を付けた raw 取得が 404 を返し（GitHub は無効認証を 404 で返す）、当時はフォールバック未実装のため prebuild が即時終了。同日 02:5x〜 に同型の Error が**連続十数件**（44s前後）並んでおり、microCMS 更新 webhook によるリビルドが失効PATで次々失敗していた形。本番配信は前回の正常版が継続していたため影響なし。

## 2-5. 8/14 以降のビルドの認証状況（ログ実物）

| デプロイ | Commit | 日時 | eic-data の結果 |
|---|---|---|---|
| bess-55g3dcrpr | 1e6512f | 08-14 03:00 | `⚠ HTTP 404 with PAT → retrying unauthenticated` が全件で発生 → **旧PATのまま、フォールバックで救済** |
| bess-8y3japtx1 | 20f00ff | 08-20 15:03 | `Done: 602 succeeded, 0 failed`・警告ゼロ → **新PATで認証成功** |

つまり 8/14 時点では Vercel の PAT は未更新（フォールバックが無ければ失敗していた）、その後の差し替えで認証成功に転じている。ただし 2-2 のとおり認証の有無で結果は変わらないため、廃止が合理的。
