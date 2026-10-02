# N-1電制 三値化 計画便（書込なし）— 2026-10-02

microCMS は **GET のみ**（substations 全 8,352 件の N-1 関連フィールド・約 85 リクエスト）。スキーマ変更・PATCH・POST・DELETE・コード変更なし。commit は報告ファイルだけ。
調査は読取専用 4 本（workflow `wf_e4e278af-c34`: 消費側・設計案・取込・revalidate）と、私の GET・集計。全所見は `.data.json` の `survey`。

**結論の要約**
1. **microCMS のデータだけでは「未算定」と「不可」を見分けられない。** 全 8,352 件が true か false で（null 0）、未算定 273 件は全件 false・可能量 null。未算定ではない不可にも同じ形（false・可能量 null）が 7,236 件ある。どの案でも、未算定は**外部の一覧**（いまの `n1_undetermined.json`）か、**新しい選択欄**のどちらかに持つしかない。
2. **「可」の件数はどの案でも動かない**（全国 790）。動くのは行ごとの「不可」表示だけ: 不可 7,555 → 7,282、未算定 0 → 273（北陸 222・東北 20・東京 13・中国 7・北海道 7・関西 2・九州 2）。
3. **実害は北陸に集中**: `/grid/hokuriku` の初期DOMの「不可」40 件のうち **39 件が実は未算定**。「空容量プラス TOP20」は **20/20 が未算定**（空容量が大きい有望な候補ほど誤って「不可」）。個別ページは 273 件すべて「不可」と表示。
4. **一覧は 273 件ではなく 278 件**（新設時に false で入った 5 件が漏れている）。ほかに、空欄（名称非公開など）を未算定に数えている 15 件、沖縄で N-1 列そのものが無い 113 件（「公表なし」が false）、四国 10 月版の「－」28 件（すでに false）がある。三値の定義（未算定・非公開・公表なし）の裁定が要る。
5. **CC の推奨（裁定は EDAさん・ユウ）**: **案C（段階移行）**。四国 BS の本実行前に案B 一式（一覧を src/data に移して TS・Python 共用、表示側の全経路が通るヘルパ 1 か所、as_of で古い一覧の上書きを止める）を入れ、案A（select 新設＋全件投入）は webhook 停止を伴う単独タスクにする。

---

## (0) 読んだパス

| 何を | 絶対パス |
|---|---|
| 便ファイル | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\N1三値化_計画便_書込なし_Claude_Code投入_2026-10-01_ユウ.md` |
| `_QUEUE.md` | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\_QUEUE.md` |
| 参考に読んだ READY 便（実行していない） | 同フォルダの `BS+BT_四国・沖縄_dry-run_…_2026-09-19_ユウ.md`・`BS+BT_追補_四国10月版対応_…_2026-10-01_ユウ.md`（取込シャードが四国・沖縄の N-1 表記を確かめるためだけに読んだ） |

---

## 1. 現状調査

### 1a. substations の N-1 関連フィールド

| フィールド | 型（実データ） | 値の分布（全 8,352 件） |
|---|---|---|
| `n1_eligible` | boolean | true 791・false 7,561・null 0 |
| `n1_capacity_mw` | 数値 or null | int 842・float 1・null 7,509 |

管理 API（スキーマ GET）はこの鍵では **403**。選択肢の定義・null を保存できるかは確かめられない。`n1_eligible` は boolean で、`scripts/experimental/_common/build_n1_undetermined.py` の注記も「boolean（null不可）のため、取込時に未算定が false に潰れている」。

### 1b. 未算定リスト（`n1_undetermined.json`・8/20 記録）

| 社 | 件数（8/20） | microCMS の現在値（10/2） |
|---|---:|---|
| 北陸 | 222 | 全件 false |
| 東北 | 20 | 全件 false |
| 東京 | 13 | 全件 false |
| 中国 | 7 | 全件 false |
| 北海道 | 7 | 全件 false |
| 関西 | 2 | 全件 false |
| 九州 | 2 | 全件 false |
| 計 | **273** | **273/273 が実在・全件 false・可能量 null・凍結との重なり 0** |

**漏れ 5 件**（一覧の作り方が「突合できた既存行」だけのため、新設時に false で入った行が入っていない）: 北陸 `rkd-toyama-tss0074`（早月第一・CSV「-」）・`tss0075`（常願寺川第三・「-」）・`tss0076`（名称非公開・空欄）、北海道 `hkd-kikan-0230`（富村・「―」）、関西 `ksi-kikan-bu`（名称「変電所」・全列「－」）。最新版 CSV の未算定行は No.ホワイトリスト後で 278 行＝273＋5。

### 1c. N-1 を読む消費側（全列挙）

経路は 2 系統。**静的**（`precompute-substations.ts` → `grid-area-lists.json`・`index.json`・県別 JSON）と、**runtime microCMS**（変電所個別ページ・`/grid/chubu/map`・`/tracker/grid`）。三値が失われる最初の地点は `scripts/precompute-substations.ts:131` の `n1_eligible: s.n1_eligible === true`。

| 消費箇所 | ファイル:行 | false/null の扱い | 画面の文言 |
|---|---|---|---|
| precompute（静的化の起点） | `scripts/precompute-substations.ts:131,133,327,333-340` | `=== true` で null→false。n1_ok・注目変電所も `=== true` | （書き出し） |
| 静的リストの型 | `src/lib/grid-static-lists.ts:30,32,96,98` | boolean 型で三値を持てない | — |
| エリア stat | `src/app/grid/[slug]/AreaPage.tsx:89,356-357` | `=== true` の件数 | 「N-1電制適用可」N 件 |
| エリア 空容量プラス TOP20 | `AreaPage.tsx:485-491` | true→可／false→不可／その他→—（静的が boolean なので「—」は通らない） | 北陸は 20 行すべて「不可」・20 行とも未算定 |
| エリア N-1 TOP20 | `AreaPage.tsx:174-183,534` | true かつ可能量 > 0 だけ | 可能量の数値 |
| 全変電所リスト | `src/components/SubstationsBrowser.tsx:49-50,169-175` | TOP20 と同じ三分岐（実質二値） | 北陸の初期 20 行: 不可 20（未算定 19） |
| **変電所個別（runtime）** | `src/app/grid/[slug]/page.tsx:98-103,294,505-520` | true→可／false→不可／**null→情報なし**（三値の分岐を既に持つ唯一の箇所） | 未算定は false なので「不可」＋可能量「情報なし」 |
| /grid 集計カード | `src/app/grid/page.tsx:67,246-257` | `=== true`（凍結除外） | 「N-1電制適用可 790」「9% / ノンファーム接続候補」 |
| /grid 注目変電所 | `src/app/grid/page.tsx:512-546` | 空容量 > 0 かつ true | 12 件すべて関西の基幹系 |
| 県ページ | `src/app/grid/prefecture/[prefecture]/page.tsx:87,201-205,267` | stat は `=== true`、一覧は true のときだけ付記 | 富山・石川・福井は 0（0%）。未算定 216 件は無表示 |
| /grid/search | `src/lib/grid-search-core.ts:169,178,189`・`search/page.tsx:168-172,532-534` | true だけで絞る | 「／ N-1電制可」 |
| 連系診断ツール | `src/lib/grid-connection-checker.ts:37,153-157`・`GridConnectionChecker.tsx:93,106,540-552` | truthy で +15 点。CSV は YES/NO | 未算定は CSV で NO |
| 中部マップ（runtime） | `src/lib/microcms.ts:1737`・`ChubuMap.tsx:195` | `=== true` に変換後の二値 | 「可／不可」（中部の未算定は 0） |
| /tracker/grid（runtime） | `src/app/tracker/grid/page.tsx:49`・`grid-refresh-log.ts` | truthy のときだけタグ | サイトで唯一「未算定」が出る（更新ログの注記） |
| glossary の件数焼き込み | `scripts/precompute-glossary-detail.ts:80-97` | `=== true`（凍結を含む） | 「N-1電制可 約791件」（/grid は 790 で 1 件ずれ・#121 型） |
| verify:grid-fields | `scripts/verify-grid-list-fields.ts:22-28,31,65-68` | キーの有無だけ。値域は見ない | — |
| 表示しない／呼ばれない | `microcms.ts:675・1956・2308・1986` | `=== true` | なし |

### 1d. 本番の表示（素URL・2026-10-02 13:40〜13:44 GMT）

| ページ | cache / age | 可 | 不可 | 未算定 | 備考 |
|---|---|---:|---:|---:|---|
| `/grid/hokuriku` | HIT / 233 | 0 | 40 | 0 | 不可 40 ＝ TOP20 の 20（全件未算定）＋一覧 20（未算定 19）。便ファイルの実測（未算定 0・不可 40）と一致 |
| `/grid/tokyo` | HIT / 221 | 0 | 40 | 0 | 40 行とも算定済み |
| `/grid` | HIT / 232 | – | 0 | 0 | カード 790（9%） |
| `/grid/rkd-ishikawa-iss0019` | MISS / 0 | – | 1 | 0 | 空容量 33MW・可能量「情報なし」 |
| `/grid/rkd-kikan-hss0014` | MISS / 0 | – | 1 | 0 | 同上 |

---

## 2. 設計案

| 案 | 変更箇所 | microCMS 書込 | 作業量 | 集計の変化 | リスク |
|---|---|---|---|---|---|
| **A**: select `n1_status`（可／不可／未算定）を新設し全件投入、boolean は後日廃止 | スキーマ追加（管理 API 403 のため EDAさんが管理画面で）。コード 11 ファイル（ヘルパ 1・表示 5・運搬 4・verify）。取込 8 社 | PATCH **8,352**（可 791・不可 7,288・未算定 273）。webhook 停止必須。試算 約 2.3 時間 | 大 | 可 790 不変・不可 −273・未算定 +273 | #106（未定義の選択肢は黙って落ちる＝canary の PATCH→GET 必須）。併存期間は同義の 2 フィールド（#121） |
| **A'**: select を新設し未算定 273 件だけ投入（空は boolean にフォールバック） | A と同じ | PATCH 273（約 4.6 分）。webhook 停止要 | 中 | 同上 | 「空なら boolean」が恒久化。値が落ちても黙って「不可」に戻り検知できない。廃止には結局 8,079 件の追加 PATCH |
| **B**: microCMS は触らず、一覧を src/data に移してヘルパで重ねる | コード 11 ファイル。一覧を `src/data/` へ（凍結リスト `substations-frozen.json` と同型・TS と Python が同じ JSON を読む・#119）。`as_of`（その時点の `last_updated`）を持たせ、microCMS と一致するときだけ適用。verify に軸（true との矛盾・as_of 不一致・件数） | 0 | 小〜中・webhook 停止不要 | 同上 | microCMS（false）とサイト（未算定）の**恒常的な二重管理**。個別ページ・中部マップ（runtime）にも同じヘルパを通さないと「一覧は未算定・個別は不可」（#119・L-EIC-028 の配置規則）。一覧の external_id は 223 件が不正確なのでキーは slug に限定 |
| **C**: 段階移行（B を四国 BS の前に先行 → A を単独タスク → 完了時に一覧を撤去） | 段1 は B 一式、段2 は A 一式（ヘルパと表示 5 箇所は再利用し、データ源だけ差し替え） | 段1 は 0・段2 は A と同じ | 最大（ただし段2 はデータ源の差し替えに限る） | 同上 | 二重管理は期限つき。段2 で一覧と n1_status を全件突合しないと #118 型の静かな欠落 |

**エリア別の試算**（凍結 7 件を除いた母数 8,345＝サイトと同じ。どの案でも同じ値）

| エリア | 総数 | 可（不変） | うち 0MW可 | 不可 現在→三値後 | 未算定 |
|---|---:|---:|---:|---|---:|
| 北海道 | 459 | 24 | 5 | 435→428 | 7 |
| 東北 | 884 | 100 | 7 | 784→764 | 20 |
| 東京 | 1,718 | 188 | 8 | 1,530→1,517 | 13 |
| 中部 | 1,107 | 148 | 15 | 959→959 | 0 |
| 北陸 | 274 | 28 | 6 | 246→24 | 222 |
| 関西 | 1,702 | 141 | 6 | 1,561→1,559 | 2 |
| 中国 | 873 | 69 | 4 | 804→797 | 7 |
| 四国 | 294 | 19 | 2 | 275→275 | 0 |
| 九州 | 883 | 69 | 20 | 814→812 | 2 |
| 沖縄 | 151 | 4 | 0 | 147→147 | 0 |
| 計 | 8,345 | 790 | 73 | 7,555→7,282 | 273 |

（漏れ 5 件を足すと未算定 278・不可 7,277。）

**「0MW可」は選択肢に入れない**: 10 社の現行 CSV に「0MW可」という文字列は無い（中部 8/17 版の N-1 欄は「不可 ＃３」915・「可」148・「不可 ＃２」34・「不可 」10 の 4 種）。「可」かつ可能量 0 の組み合わせ（全国 73 件）から導ける値で、select に入れると可能量と二か所で同じ意味を持つ（#121）。逆に可能量 0 だけで判定すると、東北 51・中国 1 の「不可×可能量 0」を誤分類する。

**どの案も runtime microCMS は増えない**（鉄則 #2/#3・#102）。案A は precompute の取得フィールドに 1 列足すだけ（約 84 リクエストのまま）。ただし `FETCH_FIELDS`・`LiteSubstation`・`GridListItem`・`toSubstationShape` のどれかで足し忘れると #118 と同じく一覧が黙って「不可」に戻るので、`verify-grid-list-fields` の `REQUIRED_FOR_LIST`・`MUST_HAVE_SOME_VALUE`・`SHAPE_CRITICAL` に新フィールドを足すことが前提（案B も同じ）。

**L-EIC-028 との関係**: 同規則は「公表元の原値という契約を持つフィールドに合成値を書くな」。未算定は公表原値（「－」）で、表示用の導出区分ではない。いま 273 件に false が入っているのは原値の契約から外れた状態で、**案A は契約を回復する方向**。案B は原値ではない false を microCMS に残したまま表示だけを直す。

---

## 3. 今後の取込への組込み

**全社共通の現状**: 8 社のパーサは同じ作りで、値を NFKC してから「不可」で始まれば false、「可」で始まれば true、**それ以外は None（＝未算定）**。ハイフン・空欄だけでなく、想定外の表記（注記・未知の記号）も黙って None に落ちる。既存レコードの更新では None なら送らず現値維持（件数は版ごとの固定値で検査）、**新設では None が false に変換される**（`!!`・`=== true`・`is True`・`bool()` と社ごとにばらばら）。

| 社 | 案A の変更点 | 案B の変更点 |
|---|---|---|
| 東京 | 全行の PATCH に n1_status。新設も明示。**`fetch_baseline.py` が無い**（いまは 6/22 の static を baseline にしている＝#113 の状態）ので新設。固定値 13 をやめる。未知の表記は停止 | 社別一覧を出力（いまは build が 2607 のパスを直書き）。baseline を本番 GET に。新設の未算定も一覧へ |
| 北陸 | 同上。漏れ 3 件を埋め戻し。空欄（非公開）の扱いを裁定 | 社別ファイルを出力。新設 3 件を入れる。空欄に reason（非公開）を付けるか決める |
| 東北・中国・北海道・関西・九州 | 計画生成時に n1_status を全行へ。照合 GET に追加 | 一覧の作成対象を「突合済み＋振り直し＋新設」に揃える（北海道・関西の漏れ各 1 件） |
| 中部 | 同上。スキップ件数の検査を追加 | build に中部ファイル（0 件）を統合 |
| **四国（BS）** | **スクリプト未作成**。10 月版（10/2 取得・cp932・17 列・N-1 は idx11）: kikan00 は 可 19・不可♯1 4・不可♯4 2、local01〜04 は 不可＃２ 155・不可 #3 86・**「－」28**。「－」28 行は同じ No.の 2 行目（66/22kV 側）で、external_id を本体と -2 が共有するため **電圧面で slug を決める必要がある（#115）**。該当 slug は本体・-2 とも現在 false＝既に潰れている。注記行『*1〜*3』は No.ホワイトリストで外す | 新規パーサが `n1_undetermined_shikoku.json`（電圧面で解決した 28 件）を出力し build に統合 |
| **沖縄（BT）** | **スクリプト未作成**。N-1 列があるのは `con_res_map01_02.csv`（本島 66kV 変電所 38 行: 可 4・不可 34）だけ。残り 5 本（113 件）は**列そのものが無い**のに microCMS は false。第 4 値「公表なし」を作るか未算定に寄せるかを裁定 | 一覧に「列なし（no_column）」区分を持たせるか、別一覧にする |
| 共通（`_common/build_n1_undetermined.py`） | 一覧は埋め戻しの入力に縮める。選択肢の実在を投入前に確認・投入後 GET で照合（#106） | 社別ファイルを glob して社単位で置換。真実源を src/data の 1 か所に（frozen.json と同型）。各パーサの期待件数は一覧から導出 |

---

## 4. 付帯（設計案だけ・実装しない）: grid ルート限定の保護付き on-demand revalidate

**現状の ISR**（4 ルートとも `revalidate = 3600`）

| ルート | ファイル | 生成方式 | on-demand 時の対象パス |
|---|---|---|---|
| `/grid` | `src/app/grid/page.tsx:42` | 静的 prerender | `/grid` |
| `/grid/[area]`（9 エリア） | `src/app/grid/[slug]/page.tsx:47,53,55-67` | generateStaticParams で 9 件 | `/grid/hokkaido` 等（type 指定なし） |
| `/grid/tokyo` | `src/app/grid/tokyo/page.tsx:13` | 静的セグメント | `/grid/tokyo`（'layout' 指定は禁止＝/grid/tokyo/status を巻き込む） |
| `/grid/prefecture/[prefecture]` | `…/[prefecture]/page.tsx:34,38-49`（dynamicParams 既定 true） | 41 県を prerender | `/grid/prefecture/${encodeURIComponent(県)}`（生の県名はタグが一致せず効かない＝#101 と同型） |
| `/grid/[slug]`（変電所詳細） | `page.tsx:47,53,137,177` | 座標ありの 1,082 件だけ prerender・残り約 7,270 件は初回アクセスで ISR | 変更した slug のみ。1 回 64 件まで・60 秒以上の間隔 |

API ルートはリポジトリに 1 本も無く、`revalidatePath`・`revalidateTag` の呼び出しも 0。

**設計案**: `src/app/api/revalidate-grid/route.ts`（POST のみ・`runtime='nodejs'`・`dynamic='force-dynamic'`）。
- 保護: ヘッダ `x-grid-revalidate-secret` を環境変数 `GRID_REVALIDATE_SECRET` と `timingSafeEqual` で比較。未設定なら 503（fail closed）。シークレットはクエリに載せない。Vercel の環境変数への登録は EDAさんの手作業。
- 許可リスト（静的データだけから作る＝microCMS 0）: lists スコープ 52 パス（/grid・10 エリア・41 県）、details スコープは実在 slug のみ・1 回 1〜64 件。`/grid/prefecture` 一覧・`/grid/chubu/map`・`/tracker/grid` は runtime でページング取得するので入れない。
- 旧 deployment で呼ばない門: body に `min_generated_at`（取込本実行の最終 PATCH 時刻）を必須にし、バンドル済み `grid-area-lists.json` の `generated_at` がそれより古ければ 409。
- 呼ぶタイミング: 取込の最終 PATCH → webhook ビルドの Ready を待つ → dry_run で 409 でないことを確認 → details を 64 件ずつ 60 秒間隔。lists は原則不要。**webhook の送り先にはしない**（一覧は再ビルドしないと新データにならない・273 PATCH なら 273 回呼ばれる・シークレットを microCMS に置くことになる）。
- 負荷（鉄則 #4）: details 64 件×2 req×10 並列 = 1,280 req/分（5,000 以下）。**禁止**: `revalidatePath('/grid/[slug]','page')` は 8,361 件×2×10 ≒ 16.7 万 req/分（NG 帯）。type を渡さない形で封じる。
- 失効の成否は応答で分からない（Next は 429 を黙ってスキップする）ので、素URL で 2 回取得して判定（鉄則 #5）。

**#116 との関係**: 一覧系 3 ルートは precompute 済みで Data Cache の影響外（エリアの関連事業者 1 本だけ例外）。runtime fetch の残りは変電所詳細・中部マップ・県一覧・/tracker/grid。`revalidatePath('/grid/{slug}')` は、その slug のページと、描画で読んだ fetch（soft tag）を同時に失効させるので、no-store を使わずに #116 の窓を対象 slug に限って閉じられる。案A は詳細ページが runtime で値を読むため details の失効（273 件＝5 回）が要る。案B は値がバンドルに入るので不要。

---

## 5. 便ファイル・既存記録との違い（新しく分かったこと）

1. **未算定は 273 件ではなく 278 件**（1b の漏れ 5 件）。
2. **「未算定」に空欄（非公開）15 件が混ざっている**（北陸 12・関西 2・中国 1）。三値で「空欄＝未算定」とするか「非公開」と分けるか。
3. **沖縄の 113 件は「公表なし」が false に潰れている**（N-1 列そのものが無い）。四国の「－」28 件も既に false（BS 依頼書の「四国は 0 件」は再取込前の値）。
4. **落とし穴 #112 の前提と Vercel の現行ドキュメントが食い違う**: Vercel の ISR ドキュメント（2026-10-02 取得）は「each new deployment uses its own ISR cache and does not reuse the cache from a previous deployment」。deploy を跨いで残るのは Data Cache（fetch キャッシュ）のほう。#112 の実測（STALE・age 4,144）は観測時刻が記録されておらず、旧 deployment 由来かは判定できない。CLAUDE.md の記述の見直しを提案する（本便では触っていない）。
5. **glossary の焼き込み「約791件」と /grid の 790 が 1 件ずれる**（glossary は凍結を含めて数える・prebuild の順序で 1 ビルド遅れの県別 JSON を読む＝#121 型）。
6. **/grid のカードの副題「9% / ノンファーム接続候補」**は N-1 電制とノンファーム接続を同じものとして書いている（文言の問題）。
7. 便ファイルの背景「北陸は 222 件が未算定なのに『不可』側に潰れている」は正しい。加えて、TOP20（空容量プラス）が 20/20 未算定で、有望な候補ほど誤表示になっている。

---

## 6. 申告

- 停止条件: rm／rmdir／Remove-Item／git push --force／.env の内容表示 なし。microCMS は GET のみ（substations 全件の N-1 関連フィールド約 85 回・1 件の全フィールド 1 回・管理 API の試行 2 回＝403）。スキーマ変更・PATCH・POST・DELETE・PUT 0。
- 読取専用の調査役 4 本（workflow `wf_e4e278af-c34`）。ファイル書込・microCMS アクセスなし。うち 1 本は本番の北陸の個別ページ 2 件を素URLで取得し、MISS（on-demand ISR の生成）を 2 回起こした（各回 getSubstationBySlug 1 リクエスト）。
- 一時物（snapshot `n1_substations_snapshot.json`・集計 `n1_counts.json`・調査結果 `n1_survey.json`）は scratchpad に残している。
- コード変更 0。commit は本報告と `.data.json` だけ。
