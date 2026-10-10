# 週次政策 2026-10-09 実施分 — policy-events 投入記録

原稿（ユウ・2026-10-09 11:10 起草・窓 9/26〜10/9＋翌週）に従い、microCMS `policy-events` に **POST 10・PATCH 9**（うち任意 POST 2＝⑨⑩・任意 PATCH 2＝F・G）を投入した。
**書込は policy-events の POST／PATCH のみ**（DELETE／PUT 0・他エンドポイント 0・スキーマ変更 0）。本実行は 1 回（2026-10-10 11:48:03〜11:48:41 JST）。

---

## (0) 読んだ原稿

| 項目 | 値 |
|---|---|
| 原稿 .md | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\週次政策_policy-calendar投入_2026-10-09.md`（70,815 バイト・最終更新 **2026-10-09 11:56:01 JST**・sha256 先頭 `3d2db691b7ca8100`） |
| 値の正 .data.json | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\週次政策_policy-calendar投入_2026-10-09.data.json`（34,895 バイト・最終更新 **2026-10-09 11:56:01 JST**・sha256 先頭 `79f5ecbb531db125`） |
| 正本の確認 | **OneDrive の正本を読んだ**。リポ直下の同名フォルダ `bess-net\03_5月13日朝_実行` に本便の原稿は 0 本 |
| リポに写した値 | `reports/weekly-policy-2026-10-09.data.json`＝原稿の .data.json を写し、(3) の 1 か所だけ一次の逐語に是正（sha256 先頭 `354c625eac299554`。他のバイトは不変を機械で確認） |
| スクリプト | `scripts/post-policy-events-2026-10-09.ts`（9/28 便と同型・JSON を読む・`--skip-optional`／`--i-title-only`）。★#125 に合わせ**既定 dry run・本実行は `--apply`**（9/28 便までは `--dry-run` を付けたときだけ dry run の型だった） |

指示: `_QUEUE.md` の GO 行（「週次政策_policy-calendar投入_2026-10-09.md（値の正は同名 .data.json）」）。任意行は EDAさんから「入れない」の指示が無く、既定どおり**投入した**。PATCH I は「title だけ」の指示が無く、**fullDescription も投入した**。

---

## (1) 件数

| 種別 | 件数 | skip | 中止 | 失敗 |
|---|---:|---:|---:|---:|
| POST | **10**（任意 ⑨⑩ を含む） | 0 | — | 0 |
| PATCH | **9**（任意 F・G を含む） | 0 | 0 | 0 |

| 種別 | slug | id | 内容 |
|---|---|---|---|
| POST ① | `occto-ltdc2026-sanka-touroku-2026-10` | `8ox_7t_ulj` | LTDC（応札年度2026年度）参加登録の受付開始。eventDate 10/13・endDate 10/23。全 13 field 送信値どおり |
| POST ② | `meti-der-wg4-2026-10` | `9vchyg4h3k` | 第4回 分散型エネルギー推進戦略WG（10/13）。全 12 field |
| POST ③ | `occto-capacity-requirement-penalty-setsumeikai-fy2027-2026-10` | `70syrpdawra` | 容量市場 実務説明会（リクワイアメント/ペナルティ・容量確保契約金額対応）（10/14）。全 12 field |
| POST ④ | `egov-keitou-renkei-gijutsu-youken-gl-pubcomm-2026-10` | `xr9b7urq09` | 系統連系技術要件ガイドライン改定案の意見公募（620340012・10/6〜11/6）。status 進行中。全 13 field |
| POST ⑤ | `occto-ltdc2026-ousatsu-2027-01` | `z4mjnfvbi2` | LTDC（応札年度2026年度）応札の受付期間（2027/1/19〜1/26）。全 13 field |
| POST ⑥ | `occto-access-tochi-shiyokengen-youkenka-2026-10` | `u_hk_xuyiiex` | 系統アクセス: 事業用地の使用権原の書類提出の要件化（10/1〜）。status 終了。全 12 field |
| POST ⑦ | `meti-jisedai-grid-wg13-2026-10` | `z6inlzo80` | 第13回 次世代電力系統WG（10/6）。全 12 field |
| POST ⑧ | `egov-chikudenchi-torikumi-houshin-pubcomm-2026-09` | `t4axezwag51` | 蓄電池の安定供給確保の取組方針 改正案の意見公募（595320021・9/4〜10/5）。全 13 field |
| POST ⑨（任意） | `meti-stable-supply-wg7-2026-10` | `pzmc_b03o` | 電力安定供給WG 第7回（10/7）。全 12 field |
| POST ⑩（任意） | `egc-seido-kanshi-24-2026-09` | `v0jm81zc4k3l` | 第24回 制度設計・監視専門会合（9/29）。全 12 field。**description は (3) の是正後の値** |
| PATCH A | `meti-saiene-shuryoku-shoi-5-2026-09` | `t23kv-my60v` | status 予定→終了・sourceUrl を開催結果ページ `saiene_shuryoku/005.html` へ・置換 2（466→743 字） |
| PATCH B | `occto-chousei-iinkai-122-hokan-auction-2026-09` | `u63xq484k` | status 予定→終了・置換 2（402→517 字） |
| PATCH C | `occto-ltdc2026-jitsumu-setsumeikai-2026-10` | `04mgg-aaejt5` | status 予定→終了・置換 2（510→678 字） |
| PATCH D | `occto-capacity-outage-plan-briefing-fy2028-2027-2026-09` | `3m8y5vvxwn` | status 予定→終了・置換 2（548→640 字。置換元の半角空白・置換後の全角空白 U+3000 は JSON のまま） |
| PATCH E | `ltdc-gyoumu-manual-pubcom-2026-09` | `m94e-kpfys1x` | status 進行中→終了・置換 2（132→214 字） |
| PATCH F（任意） | `occto-capacity-teishi-keikaku-manual-pubcomm-2026-09` | `e6hw_d5vd` | 置換 2（436→525 字）。set なし |
| PATCH G（任意） | `occto-teikan-kitei-henkou-pubcomm-2026-09` | `6i1u2sgun-k4` | 置換 2（530→709 字）。set なし |
| PATCH H | `occto-capacity-kentoukai-76-20260901` | `y9jkk9c-82` | status 予定→終了・置換 1（366→387 字） |
| PATCH I | `capacity-main-auction-2026-09` | `5g5xnv4yz` | title「容量市場メインオークション（2030年度実需給）応札期間」→「容量市場 2026年度メインオークション（対象実需給年度：2030年度）応札の受付期間（10/13〜10/23）」・description 全文置換（102→451 字。現在値が from と完全一致を確認してから） |

**policy-events 総件数: 126（kind 未設定 78・業界 48）→ 136（kind 未設定 88・業界 48）**。原稿の期待値（136〔88〕）どおり。

---

## (2) 事前確認（#87・#106）

- policy-events を全件 GET（**2026-10-09 12:59 JST**・GET のみ・この全件を (5) の突き合わせの「書込前」に使った）: **126 件（kind 未設定 78・業界 48）**＝原稿の記録（10/9 11:28）と一致。
- 本実行の直前（2026-10-10 11:48:03 JST）にスクリプトが改めて数えて **126 件（78・48）**・PATCH 9 件の updatedAt も原稿どおり（10/9 の GET から本実行までに policy-events への書込は無かった＝(5) の突き合わせでも本便以外の変化 0）。
- (a) post[] の 10 slug はいずれも不存在。
- (b) 原稿の title 判定語 11 組（「分散型エネルギー推進戦略」／「第13回」かつ「次世代電力系統」／「電力安定供給」かつ「第7回」／「制度設計・監視専門会合」／「使用権原」（meti-grid-wg11-bess-connection-2026-06 を除く）／「参加登録の受付」／「応札の受付」かつ「長期脱炭素」／「取組方針」／「620340012」／「595320021」／「リクワイアメント」かつ「2027年度」）はすべて **0 件**。
- (c) patch[] 9 件は slug から id を解決し、**原稿の id と 9/9 一致**。updatedAt も 9/9 一致。status・sourceUrl・description の文字数・I の title も原稿の expected と一致。置換元は 9 件すべて description 内で**ちょうど 1 回**、I の現在の description は from と**完全一致**。
- #106: eventType／status／category は v4 スキーマ（`scripts/microcms-schema-policy-events-v4-2026-08-27.json`）の選択肢に全値実在・配列で送信。kind／relatedTopics／eventTopics は `[]`。endDate は JSON にある ①④⑤⑧ だけ。registrationDeadline は送っていない。

---

## (3) 原稿からの変更点（逐語）

投入前に一次を再取得し（読取専用サブエージェント 4 本・workflow `wf_bf999c58-ae3`＝OCCTO の POST 担当／OCCTO の PATCH 担当／METI／e-Gov・監視等委）、POST 10・PATCH 9 の文を一次と 1 文ずつ、鉤括弧の中は 1 字ずつ照合した。
**事実の誤り（must-fix）は 0 件**。一次と意味が食い違う箇所が **1 点**あったので、その箇所だけ一次の語で是正した。

| # | 対象 | 原稿 | 投入した値 | 理由 |
|---|---|---|---|---|
| 1 | POST ⑩ description（末尾の 1 文） | 「今後は当該年度分の固定費の回収を完了した電源について一定額（0.33円/ΔkW・30分）＋逸失利益（機会費用）を超える応札が行われていないかを厳格に監視し、第１四半期の応札実績が年間想定応札量の１/４を大きく上回るなど実績と計画に著しい乖離がある事業者には想定応札量に基づく応札価格の見直しを要請するとした。」 | 「今後は当該年度分の固定費の回収を完了した電源について一定額（0.33円/ΔkW・30分）＋逸失利益（機会費用）を超える応札が行われていないかを**引き続き**厳格に監視し、**合理的な理由なく**第１四半期の応札実績が年間想定応札量の１/４を大きく上回るなど実績と計画に著しい乖離が**認められた**事業者には**実態を踏まえた**想定応札量に基づく応札価格**への**見直しを要請するとした。」 | 一次（監視等委 第24回 資料4「需給調整市場の運用等について」印字 p.25「今後の監視方針」）の逐語は「1. 当該年度分の固定費の回収を完了した電源に関しては、一定額（0.33円/ΔkW・30分）＋逸失利益（機会費用）を超える応札が行われていないかどうか、引き続き厳格に監視を行う。」「2. 合理的な理由なく、第１四半期の応札実績が年間想定応札量の１/４を大きく上回るなど、実績と計画に著しい乖離が認められた事業者に対しては、実態を踏まえた想定応札量に基づく応札価格への見直しを要請する。」。同頁は「当初の想定応札量及び一定額を見直さずに応札を継続している事例」を問題としており、原稿の「想定応札量に基づく応札価格の見直し」は**当初の想定応札量に戻す意味にも読め、一次と逆になりうる**。足した語はすべて一次の語（機械照合 4/4）。606→629 字 |

**変更しなかったもの（一次と食い違わない・提案として記録）**

| 対象 | 所見（検証者） | 扱い |
|---|---|---|
| POST ⑨ description | 原稿の文「第4回WG（7月14日）で示した還付水準8,000円/kW/年の事務局案に…改めて議論するとしている」は資料3 p.5 の逐語どおり。ただ資料3 の本体（p.12〜20）は新しい事務局案（試算条件の見直し・システムプライスの採用・「還付水準額は５年固定で9,800円/kW/年、10年固定で8,300円/kW/年となる」・2031年度の再評価）を出しており、description に残る数値は旧案の 8,000円だけ | 食い違いではなく本体の欠落。**追記はしていない**（原稿にない内容を足すのは「是正」の範囲外）。次便で追記するなら上の逐語（資料3 p.19）が使える |
| PATCH A 置換 2 の置換後の文 | 「…類型を整理するとしている」で止まり、資料1 の類型ごとの事務局案（対象とする 4・対象とはしない 3・営農型は次年度に継続検討）が無い | 誤りではない。追記はしていない（同上） |
| POST ⑧ title | 「経済安全保障推進法・サイバーセキュリティ対応の追加」は「法律そのものを追加」とも読める。一次（意見公募要領 p.1）が追加するのは「法律の改正に伴う事項」。description 側は正しい | 事実の誤りではないので原稿どおり |
| POST ⑥ description | 「資源エネルギー庁の次世代電力系統ワーキンググループ」— 一次（METI 011.html）の正式な帰属は総合資源エネルギー調査会の WG で、資源エネルギー庁は問合せ先 | 簡略化した書き方で誤りではない。⑦ の書き方とも揃っているので原稿どおり |
| PATCH I title | 「容量市場 2026年度…」の空白は半角。一次（OCCTO 012742）は全角 U+3000 | 鉤括弧の外なので逐語の規則はかからない。原稿どおり |
| PATCH C・D の「開催した」 | 開催案内（013496・013408）に「開催済」の記載はまだ無い（予定日 10/7・10/1 を過ぎたことによる過去形）。説明会資料・動画ページにも動画はまだ無い | 一次と食い違ってはいない。原稿どおり |
| POST ④ の課名「電力基盤整備課」 | 意見公募要領の冒頭は「電力整備基盤課」（一次側の誤記）。提出先住所と e-Gov の問合せ先は「電力基盤整備課」 | 原稿が正しい。原稿どおり |
| POST ② 資料名 | 委員会ページの掲載名「分散型エネルギーリソースに関する政策の方向性及び具体的施策」とは一致。PDF p.1 の見出しは「…施策の方向性及び具体策」 | 掲載名で一致しているので原稿どおり |
| 原稿の照合記録（description には影響なし） | PATCH I の「蓄電池の区分は同要綱 p.10」→ 表は印字 p.10〜11（(オ)蓄電池は p.11）。POST ⑧ の「第６章第３節（p.32）」→ 推奨事項（１）〜（４）は p.33 | 原稿 §2・§3 の照合記録の頁の訂正だけ |

照合の範囲: OCCTO の POST 担当は鉤括弧 9 か所を EXACT（U+3000／U+0020 を個別に記録）・①⑤ の 5 区間の日付と曜日を 3 資料（013615・募集要綱 p.9・業務マニュアル表1-1）で一致。METI・e-Gov・監視等委の担当も日付・回次・資料名・数値の食い違い 0（上の表を除く）。

---

## (4) sourceUrl の生死（手順 3）

2026-10-10 11:43 JST に Chrome UA の curl で取得（PATCH A の新 URL だけは METI の WAF が curl に 202・本文 0 B を返したので、内蔵ブラウザで開いて本文を確認）。

| 対象 | URL | 結果 |
|---|---|---|
| ①⑤ | `https://www.occto.or.jp/news/013615.html` | 200・`容量市場　長期脱炭素電源オークション（応札年度：2026年度）参加登録・応札等のスケジュールについて` |
| ② | `https://www.meti.go.jp/shingikai/information/2026/20261013_3k.html` | 200（分散型エネルギー推進戦略WG 第4回の開催案内） |
| ③ | `https://www.occto.or.jp/news/013518.html` | 200・`容量市場 実務説明会（リクワイアメント/ペナルティ・容量確保契約金額対応）（対象実需給年度：2027年度）の開催のご案内について` |
| ④ | e-Gov 案件詳細 `id=620340012` | 200・「「電力品質確保に係る系統連系技術要件ガイドライン」改定案に対する意見公募」 |
| ⑥ | `https://www.occto.or.jp/news/access_oshirase_2026_260928_1_1.html` | 200・「発電設備等に関する系統アクセスの流れの更新について」 |
| ⑦ | `https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saisei_kano/smart_power_grid_wg/013.html` | 200・第13回 次世代電力系統ワーキンググループ |
| ⑧ | e-Gov 案件詳細 `id=595320021` | 200・「…蓄電池に係る安定供給確保を図るための取組方針の改正案に対する意見の公募について」 |
| ⑨ | `https://www.meti.go.jp/shingikai/enecho/denryoku_gas/jisedai_kiban/stable_power_supply_wg/007.html` | 200・電力安定供給ワーキンググループ（第7回） |
| ⑩ | `https://www.egc.meti.go.jp/activity/emsc_systemsurveillance/024_haifu.html` | 200・「制度設計・監視専門会合（第24回）‐配布資料」 |
| PATCH A（新） | `https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saiene_shuryoku/005.html` | curl は 202・0 B（WAF）×4 回 → **内蔵ブラウザで本文を確認**: h1「…再生可能エネルギー主力電源化小委員会（第5回）」・開催日 2026年9月30日・資料1・最終更新日 2026年9月30日（検証者の curl でも同日 200・7,514 B） |

---

## (5) 投入後の GET 照合（#106・#122）

- スクリプト内: POST 10 件は POST 直後に id で GET し**全 field が送信値どおり**（日付は日付部分で比較）。PATCH 9 件は送信 field が送信値どおり・**送っていない field の変化 0**（9/9）。
- 独立の照合（書込後に全件 GET し、書込前の全件 GET と突き合わせ・GET のみ）: 全 **136** 件（id 一意 136）。既存 126 件のうち**変化したのは PATCH の 9 件だけ**で、変化した field は set と description に限る（想定外 0・消えた 0）。新規は **POST の 10 slug だけ**（それ以外 0）。新規 10 件の title／eventType／issuer／description／sourceUrl／status／category／kind／relatedTopics／eventTopics／eventDate／endDate は data.json と不一致 0・registrationDeadline 無し。
- 冪等確認（**dry run**・#125）: 書込後にもう一度流すと **POST 10 件 skip（既存あり）・PATCH 9 件 skip（全項目が適用済み）**・書込 0。

**microCMS への呼び出しの内訳**: 本実行 GET 51・POST 10・PATCH 9（DELETE 0・PUT 0）。
ほかに GET のみ: 事前確認 1 回（全件）・dry run 3 回（是正前・是正後・書込後の冪等確認。各 GET 30）・書込後の全件照合 1 回。

---

## (6) 本番反映（素URL・x-vercel-cache と age を記録）

**webhook**: 書込 19 件に対して Vercel の本番ビルドが **19 本**起動（11:48:13〜11:48:45 JST）。決着は **Ready 2 本**（1 本目 `bess-mnccxlcrg`・最終 `bess-4rv3vbmup`＝最後の書込 11:48:41 の後 11:48:45 に起動・ビルドキャッシュのアップロード完了 12:03:43 JST）・**Canceled 17 本**（中間分）・**Error 0**。

書込前は `/policy-calendar` を本番で開いていない（#127。書込前の取得が Data Cache に旧データを残すのを避けた）。

| 時刻（JST） | URL | HTTP | x-vercel-cache | age | 備考 |
|---|---|---:|---|---:|---|
| 12:30:18 | `/policy-calendar`（素URL） | 200 | HIT | 346 | 12:24:32 生成のコピー＝最終ビルドの Ready（12:03）の後。256,447 字 |

12:30:18 のコピーの照合（初期DOM＝`<!-- -->` を剥がし script／style を除いた見える本文、#107）:

| 確認 | 結果 |
|---|---|
| 件数（JSON-LD `numberOfItems`） | **68 → 78**（＋10）。原稿の期待値どおり |
| ①〜⑩ の title | 10 件とも **1 件ずつ**表示 |
| 「容量市場　」（U+3000） | 見える本文に 5 件（① ③ ⑤ の description・PATCH C・D の置換後の文）。①③⑤ は description の全文が文字どおり 1 件ずつ |
| 「CCS の」（U+0020） | 1 件（⑤ の description 全文が文字どおり） |
| PATCH I の新 title | **1 件**（旧 title 0 件）・新 description の全文 1 件 |
| PATCH E の状態 | カードの状態表示が「**終了**」（パブコメ） |
| PATCH A の出典リンク | `href="https://www.meti.go.jp/shingikai/enecho/denryoku_gas/saiene_shuryoku/005.html"` が 1 件・旧 URL（20260930_4k.html）0 件 |
| PATCH A〜H の置換後の文 | すべて表示（各 1 件。F・G の置換 1 は末尾の共通句「について意見募集を実施した（募集期間」が F と G の 2 枚に出るため 2 件＝正しい） |
| PATCH A〜H の状態表示 | A・B・C・D・E・F・G・H すべて「終了」。I は「予定」（eventDate 10/13） |
| PATCH B の置換元の文「配布資料・議事録は開催後に同ページで公開。」 | ページに 1 件残るが、**B ではなく別レコード** `occto-balancing-committee-63-2026-09` の文（B の description からは消えている＝API で確認）。下の (9) 範囲外を参照 |

---

## (7) deploy 後 30 分監視（鉄則 #5）

最終ビルドの完了（12:03:43 JST）の 30 分後、**12:34:46 JST** に素URL で再取得した。

| URL | HTTP | x-vercel-cache | age | 備考 |
|---|---:|---|---:|---|
| `/policy-calendar` | 200 | STALE | 615 | revalidate 600 秒を過ぎたコピー（裏で再生成）。**256,447 字（初回照合と同一）・件数 78・(6) の照合項目すべて同一**（照合結果の差分 0） |
| `/policy-calendar`（12:35:22 に取り直し） | 200 | HIT | 35 | **再生成後のコピー（12:34:47 生成）も 256,447 字・件数 78・照合結果の差分 0** |
| `/` | 200 | HIT | 20 | |
| `/events` | 200 | HIT | 89 | 本便で業界イベントは触っていない（業界 48 不変） |
| `/news` | 200 | HIT | 87 | |
| `/subsidies` | 200 | HIT | 90 | |
| `/explainer` | 200 | HIT | 88 | |
| `/glossary` | 200 | STALE | 301 | ISR の stale-while-revalidate（本便で触っていないページ） |
| `/tools/irr-simulator` | 200 | HIT | 89 | |

- 件数・title・本文とも**巻き戻りなし**（12:30:18・12:33:15・12:33:31・12:34:46・12:35:22 の 5 回とも照合結果が同一）。
- Vercel: 12:03 以降に新しいデプロイは無く、本便の 19 本は **Ready 2・Canceled 17・Error 0** のまま。
- microCMS からの警告メール・EDAさんからの連絡の有無は、CC からは確認できない（ユウ／EDAさん側で確認のこと）。

---

## (8) 申告

- **停止条件**: `rm`／`rmdir`／`Remove-Item` 未発行。`git push --force` なし。`.env.local` は `set -a && . ./.env.local && set +a` で読み込んだだけで内容は表示していない。microCMS の DELETE／PUT は 0。
- **1 便 1 回**: 本実行は 1 回だけ（11:48:03〜11:48:41 JST）。dry run は 3 回でいずれも GET のみ。
- **サブエージェント**: 読取専用 4 本（Write／Edit 不使用・git 0・microCMS 0）。取得した一次（HTML／PDF／抽出テキスト）と作業用の .py・.ts は scratchpad の `wp1009/` に**消さずに残している**。
- **一時物（リポの外）**: 生死確認の 1 回目で、URL 一覧・結果・本文を `C:\Users\kenji\AppData\Local\Temp\`（Git Bash の `/tmp`）に `urls_wp.txt`・`live_wp.txt`・`wp_body.bin` として作ってしまった（scratchpad ではない）。消さずに残している。なお 1 回目は URL 一覧が CRLF で書かれ、curl が全件 000（URL 末尾の `\r`）になった＝生死の判定には使っていない。取り直しは scratchpad の `live_check.py` で行った（上の (4) の結果）。
- **並行**: 本便の書込・照合・最終ビルドの Ready（12:03）の後、30 分監視の待ち時間（12:29〜）に、次の GO 行（T2 設問研究便）の**読取専用の調査**（サブエージェント 8 本）を始めた（microCMS 0・本番サイト 0・git 書込 0）。push は本便の報告を先に、T2 の報告は後で別に行う（push の衝突なし）。
- **実行が日付を跨いだ**: 事前確認（全件 GET・一次の下調べ）は 2026-10-09 12:59 JST、一次の再照合と本実行は 2026-10-10。原稿の「10/13 朝までに入ると ①・PATCH I が効く」には間に合っている。
- **`_QUEUE.md`**: 本便の行を DONE に（報告パス付き）。

---

## (9) 範囲外の所見（触っていない）

- `occto-balancing-committee-63-2026-09`（第63回 需給調整市場検討小委員会・9/15・status 終了）の description に、開催前の文「…開催する（…）。」「配布資料・議事録は開催後に同ページで公開。」が残ったまま、末尾に「9月15日に開催され、配布資料4点（資料2 …、資料3 …、資料4 …）が公開された。」と追記されている。**「4点」と書いて 3 点しか挙げていない**。次の週次便で一次（OCCTO `iinkai/jukyuchousei/63.html`）を見て是正の要否を判断してほしい。
