# 公式サイト欄の直し便 — 事業者一覧の「公式サイト」が本人のサイトでない 9 レコードを直した（2026-10-20）

**便ファイル（読んだ絶対パス）**: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\公式サイト欄の直し便_事業者一覧9レコードの公式サイトを確かめて直す・オンラインカジノのページへのリンクを外す_Claude_Code投入_2026-10-20起草_ユウ.md`

**結論**: operators の `websiteUrl` を 9 レコードで PATCH しました（2026-10-20 16:38:53〜16:39:14 JST）。
- **差し替え 7**: 候補の URL を curl で取り直しました。サイト上の社名・所在地が、国税庁 法人番号公表サイトの商号・本店所在地と一致したものです。
- **空にする 2**:
  - `global-engineering`: いまもオンラインカジノの紹介ページで、候補がありません。
  - `centrica-jp`: 日本法人の公式サイトを特定できませんでした。

確認と結果:
- 9 件とも、送る前と後に GET して照合しました。送った欄は送信値と一致し、ほかの欄の変化は 0 です。
- 全 583 レコードの `websiteUrl` を前後で比べ、変わったのはこの 9 件だけでした。
- 同じ便をもう一度 dry run で流すと、9 件とも skip になりました（冪等）。
- body・description に旧 URL の言及は無く、触っていません（便 §1-5）。
- コードの変更は 0 です。`websiteUrl` が空のレコードは、もともと詳細に「公式サイト」の行が出ない作りです（`src/app/operators/[slug]/page.tsx` の `operator.websiteUrl &&`）。
- microCMS への書き込みは operators の PATCH 9 件だけで、DELETE・PUT・POST は 0 です。

## (1) 9 レコードの結果

確認日時は 2026-10-20 16:34〜16:36 JST（curl、国税庁 法人番号公表サイトは 16:36 時点の情報）。逐語は `reports/operators-website-fix-2026-10-20.data.json` の `records[]` に全文があります。

| slug | 事業者名 | 変更前（GET） | 変更後 | 分岐 | 確認の要点（逐語） | 国税庁（商号／本店） |
|---|---|---|---|---|---|---|
| global-engineering（★急ぎ） | 株式会社グローバルエンジニアリング | https://www.global-eng.jp/ | （空） | 空にする | 現 URL は https://global-eng.jp/ に転送され、title「オンラインカジノ完全ガイド｜2026年最新おすすめランキングと安全な始め方 \| Global Eng」。本文に社名は 0 件 | 株式会社グローバルエンジニアリング／福岡県福岡市東区香椎１丁目１番１号… |
| centrica-jp | Centrica Business Solutions Japan | https://www.centricabusinesssolutions.com/ | （空） | 空にする | 現 URL の title は「Sustainable Business Energy Services \| Centrica Business Solutions」で、本文に「Japan」「日本」「Tokyo」は 0 件。/jp は 404。検索 2 回でも日本法人の公式サイトは出なかった。特定卸供給・EPRX・JEPX の一覧にも無い | 法人番号の手がかりなし |
| agg-sustech-0957 | 株式会社Sustech | https://www.sustech.co.jp | https://sustech-inc.co.jp/ | 一致 → 差し替え | 現 URL は「株式会社サステック」（大阪市中央区久太郎町。別法人）。候補の title は「株式会社Sustech（サステック）」、/about/ に「本社所在地 〒105-0014 東京都港区芝3丁目1番14号 芝公園阪神ビル5階」 | 株式会社Ｓｕｓｔｅｃｈ／東京都港区芝３丁目１番１４号芝公園阪神ビル５階 |
| agg-hse-0606 | HSE株式会社 | https://www.hse.com | https://www.h-sustainable-energy.co.jp/ | 一致 → 差し替え | 現 URL は hse.de（ドイツの通販「HSE - einfach online shoppen」）。候補の title は「HSE株式会社」、本文に「〒317-0073 茨城県日立市幸町三丁目2番2号 HSE株式会社」。/company/ は「Request Rejected」で読めなかった | ＨＳＥ株式会社／茨城県日立市幸町３丁目２番２号（旧商号 日立サステナブルエナジー株式会社） |
| pacifico-energy | パシフィコ・エナジー株式会社 | https://www.pacifico-energy.com/ | https://www.pacificoenergy.jp/ | 一致 → 差し替え | 現 URL は証明書の名前が不一致（curl 60）で、http は「Welcome to nginx!」。候補の title は「パシフィコ・エナジー株式会社 \| 再生可能エネルギー発電事業のプロフェッショナル」、所在地は「〒106-0032 東京都港区六本木3-2-1 六本木グランドタワー33階」 | パシフィコ・エナジー株式会社／東京都港区六本木３丁目２番１号六本木グランドタワー |
| agg-q-enest-2883 | Q.ENESTでんき株式会社 | https://www.q-enest.com | https://www.qenest-denki.com/corp | 一致 → 差し替え | 現 URL は TLS の接続に失敗（curl 35）し、http は「Welcome to nginx!」。候補に「会社名 Q.ENEST（キューエネス）でんき株式会社」「東京本社 〒108-0014 東京都港区芝四丁目10番1号 ハンファビル3階」 | Ｑ．ＥＮＥＳＴでんき株式会社／東京都港区芝４丁目１０番１号 |
| energy-pool-jp | エナジープールジャパン株式会社 | https://energypool.jp/ | https://energy-pool.co.jp/ | 一致 → 差し替え | 現 URL は BrandShelter のドメイン預かりページ（title「Registered - BrandShelter™」）。候補の /company/ に「所在地 〒105-0012 東京都港区芝大門1-3-4 グランファースト芝大門9階」。グループの World offices の Japan 欄「Energy Pool Japan KK 1-3-4 Shiba Daimon, Minato-ku」とも一致 | エナジープールジャパン株式会社／東京都港区芝大門１丁目３番４号 |
| kawasaki-green | カワサキグリーンエナジー株式会社 | https://www.khi.co.jp/ | https://kgen.co.jp/ | 一致 → 差し替え | 現 URL は親会社（「川崎重工業株式会社」）。候補の /company/ に「会社名 カワサキグリーンエナジー株式会社」「本店：兵庫県神戸市中央区東川崎町三丁目1番1号（川崎重工 神戸工場内）」 | カワサキグリーンエナジー株式会社／兵庫県神戸市中央区東川崎町３丁目１番１号 |
| agg-fps-4015 | 株式会社FPS | https://www.fps.co.jp | https://fps-inc.jp/ | 一致 → 差し替え | 現 URL は fps.co.jp に転送され、「フジヤマパックシステム株式会社」（別法人）。候補の title は「【株式会社FPS】再エネ・新電力の小売・卸売業」。/company/ は 403 だったので、自社のプレスリリース（/pressrelease/20260831/）の「株式会社FPS(本社:東京都港区、代表取締役:洞洋平…)」で照合した | 株式会社ＦＰＳ／東京都港区赤坂１丁目８番１号（令和7年9月5日に移転） |

- 便 §1-3 の「転送先だけで同一性が確かめられない」場合への該当: FPS は、旧 URL の転送先（fps.co.jp）が別法人でした。候補 fps-inc.jp は、自社のプレスリリースの本社（港区）と国税庁の本店（港区赤坂）が一致したので、こちらを採りました。番地まで書いた会社概要（/company/）は 403 で読めず、照合は区までです。
- HSE も会社概要は読めませんでした（WAF の「Request Rejected」）。トップページにある郵送先の住所が、国税庁の本店と番地まで一致しています。
- 法人番号は T6 の data.json（特定卸供給の一覧の行）から取りました。centrica-jp は一覧に行が無く、法人番号もありません。

## (2) PATCH の照合（#106）

- applier: `scripts/apply-operators-website-2026-10-20.ts`（中身は共通の `scripts/lib/microcms-applier.ts`）。計画は `reports/operators-website-fix-2026-10-20.data.json` の `plan`（9 patches・各 1 op・expect_final つき）。
- dry run（16:38 前）: PATCH 9／中止 0／生の文字列の突き合わせの不一致 0。microCMS は GET 18 だけです。
- 本実行（16:38:53〜16:39:14）: 9 件とも「#106/#122: ✓ 送信 1 field 一致・他 field 変化 0」でした。microCMS の呼び出しは GET 27・PATCH 9 です。ログは `reports/operators-website-fix-2026-10-20.apply-log.json`（before・after つき）。
- 冪等の確認（本実行の後に dry run）: skip 9／PATCH 0。
- 全件の比較: 本実行の前後に operators 全件（583）の id・websiteUrl を GET しました（各 6 GET）。変わったのは上の 9 件だけで、残り 574 件は変化 0 です。websiteUrl を持つレコードは 310 → 308 になりました（空にした 2 件ぶん）。

## (3) 本番の確認

- **ビルド**: 書込 9 件の webhook で、Production のビルドが 9 本できました。
  - 最後の `bess-npwp9we0c`（作成 16:39:19＝最後の PATCH 16:39:14 の後・所要 8 分）が Ready になりました。
  - 最初の `bess-cdcc4psfg` も Ready です。途中の 7 本は自動で Canceled になりました。
  - 全部の決着は 17:03:36 の `vercel ls` で確認しました。
- **本番の確認（17:04:41 JST・bess-net.jp）**: 9 ページを素 URL と `?v=<時刻>` の 2 通りで取り、18/18 で OK でした。
  - 9 ページとも HTTP 200 です。
  - 素 URL は `x-vercel-cache: PRERENDER`・`age: 0`（新しい deploy のプリレンダー）、`?v=` は `HIT`・`age: 0` でした。
  - 詳細の「公式サイト」は次のとおりです。
    - 差し替えた 7 件: 新しい URL になっていました。
    - global-engineering・centrica-jp: 「公式サイト」の行そのものが無くなっていました（HTML 中の「公式サイト」0 件）。
  - 旧 URL の文字列は、9 ページとも HTML 全体で 0 件でした。
  - global-engineering の HTML では、「カジノ」「global-eng.jp」とも 0 件です。
  - 構造化データ（JSON-LD の Organization.url）: 差し替えた 7 件は新しい URL、空にした 2 件は url 無しです。
- **TTL の窓**: 詳細ページは事前計算の JSON を読むので、runtime の microCMS 取得はありません（#112・#116 の Data Cache の窓は無し）。素 URL で新しい内容が出ていることを上で確かめました。
- 結果のファイルは scratchpad の `prod/run1.txt` と、各ページの HTML・ヘッダです。

## (4) 申告

- **使った道具**: curl、Python（標準ライブラリ）、tsx（applier）、Web 検索 2 回（centrica-jp）、Vercel CLI（`vercel ls`）。内蔵ブラウザと Chrome の拡張機能は使っていません。サブエージェントも使っていません。
- **書込前に対象の URL を開いていない（#127）**: 書く前に開いたのは、外部の公式サイト候補と国税庁のページだけです。`/operators/<slug>` は書込後のデプロイ完了まで開いていません。
- **一時物**: すべて scratchpad（リポジトリの外）に置き、消していません。中身は次のとおりです。
  - 取得物: `probe/`（取得した HTML・ヘッダ・国税庁の HTML・抜き出したテキスト）、`before/`（9 件の GET）
  - スクリプト: `probe.py`、`nta.py`、`snap.py`、`mkplan.py`
  - 入力と結果: `jobs1.json`、`jobs2.json`、`snap-before.json`、`snap-after.json`、`dry1.json`、`dry2.json`、`tsc.txt`
- **.env.local** は `set -a && . ./.env.local && set +a` で読み込んだだけです。途中で一度、変数名だけを grep しようとしたコマンドは許可されず、実行されていません。
- **webhook**: operators には webhook があります。書込 9 件でビルドが 9 本キューに入りました（便のとおり許容）。
- **触っていないもの**: bessRelation の「登録」表記など、websiteUrl 以外の欄（便 §1-6）。作業ツリーにある 44 個の生成物も触っておらず、commit もしていません。
