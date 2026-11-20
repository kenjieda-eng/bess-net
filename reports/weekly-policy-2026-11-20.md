# 週次政策 2026-11-20 の報告（policy-events POST 3・PATCH 2）

## (0) 読んだ原稿

| 項目 | 値 |
|---|---|
| 原稿 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\週次政策_policy-calendar投入_2026-11-20.md`（59,716 バイト・最終更新 2026-11-20 11:51 JST） |
| 値の正 | 同フォルダの `週次政策_policy-calendar投入_2026-11-20.data.json`（11,931 バイト・最終更新 11:50 JST・sha256 `a9ca801a360b664479c8795e56d6487f04231ef18684d3d88d8b956109a5e6dc`＝先頭 16 桁 `a9ca801a360b6644` と一致）。リポには `reports/weekly-policy-2026-11-20.data.json` として写した（中身は同じ） |
| 正本の確認 | OneDrive の正本を読んだ（リポ直下の `03_5月13日朝_実行` フォルダではない） |
| 開始 | 2026-11-20 21:16 JST・HEAD `e671676`・`_QUEUE.md` 127 行（GO: ユウ 11/20 21:14・EDAさん「２本ともOK　入れる」＝任意の ③ も入れる） |
| スクリプト | `scripts/post-policy-events-2026-11-20.ts`（11/13 の型。既定 dry run・`--apply`・`--skip-optional`・`--only`・`--exclude`・`--asof`） |
| 記録 | `reports/weekly-policy-2026-11-20.dry.json`（dry run）・`reports/weekly-policy-2026-11-20.apply.json`（本実行） |
| 停止条件 | rm 系 0・push --force 0・.env 表示 0・microCMS は policy-events の POST 3・PATCH 2 と GET だけ（DELETE・PUT 0）・webhook は止めていない（書込 5 件） |

## 一次の取り直し（21:16〜21:18 JST・素の curl・1 本ずつ・2 秒あけ・ブラウザのふりをする UA なし）

| URL | HTTP | title | 見たもの |
|---|---|---|---|
| `https://www.occto.or.jp/iinkai/youryou_kentoukai/78.html` | 200 | 第78回 容量市場の在り方等に関する検討会 | 更新日・掲載開始日 2026年11月18日・2026年11月25日（水）・「書面審議といたします」・議題 3 件・**配布資料の節なし**（開催案内のみ）・議事録は「…取りまとめが完了次第、掲載いたします」 |
| `https://www.occto.or.jp/iinkai/chousei_jukyu/124.html` | 200 | 第124回　調整力及び需給バランス評価等に関する委員会 | 更新日 2026年11月19日・11月30日 13:00～15:00・**資料は「議事次第」（92KB）だけ**・「議題資料は委員会の前日に公開予定です。」 |
| `https://www.occto.or.jp/news/013907.html` | 200 | 容量市場 メインオークション・追加オークションに係る市場退出の表明…について | 件名の回・期限が本文にある |
| `https://www.occto.or.jp/iinkai/jukyuchousei/64.html` | 200 | 第64回需給調整市場検討小委員会（第81回…作業会と合同開催） | 更新日 2026年11月17日・録画配信（YouTube）あり・**議事録なし** |
| `https://www.occto.or.jp/iinkai/youryou_kentoukai/77.html` | 200 | 第77回 容量市場の在り方等に関する検討会 | 更新日 2026年11月18日・**議事録（1006KB）あり** |
| `…/chousei_jukyu/121.html`・`122.html`・`news/013615.html` | 200 | 第121回・第122回・長期脱炭素電源オークション（応札年度：2026年度）の参加登録・応札等の… | ② が引く 121・122 の議題名と日付（8月24日・9月29日）、① が引く 013615 の掲載開始日 2026年10月09日・12月9日〜15日・2027年1月19日〜26日が本文にある |

- POST 3 件の「」の引用（① 4・② 10・③ 6）を機械で一次の本文と突き合わせた: ①・③ は 78／013907 のページに全部ある。② の 2 つ（「中長期の需給見通しを踏まえた供給力確保策について」「今後の供給信頼度評価の課題整理について（報告）」）は 124 のページではなく、本文どおり第121回・第122回の議題で、121・122 のページにある。
- 実行日は 2026-11-20（JST）なので、「…時点」の日付は替えていない（①「配布資料は2026年11月20日時点で未掲載（開催案内のみ）。」・②「配布資料は2026年11月20日時点で資料「議事次第」のみ掲載」・PATCH A「議事録は2026年11月20日時点で未掲載。」とも、ページの状態が文のとおりだった）。

## POST・PATCH の件数

- **POST 3 件・skip 0**: ① `occto-capacity-kentoukai-78-2026-11`（id `t_opuzk9x46`・12 field 一致）／② `occto-chousei-iinkai-124-hokan-auction-2026-11`（id `ccz9i2r5md`・12 field 一致）／③（任意）`occto-capacity-shijo-taishutsu-ltdc-teikyoukaishi-henkou-2026-11`（id `oebx_fab_fx`・endDate 2027-03-31 を含む 13 field 一致）。status は ①② ["予定"]・③ ["進行中"]。kind・relatedTopics・eventTopics は []。
- **PATCH 2 件・skip 0**: A `occto-balancing-committee-64-2026-11`（id `m417bjl3j`＝原稿と一致・updatedAt・status・sourceUrl・description 963 字が期待値どおり → 置換 1 回 → **1,003 字**＝`_afterLen` 一致）／B `occto-capacity-kentoukai-77-2026-10`（id `92bepjkx8q6`＝原稿と一致・期待値どおり → 置換 1 回 → **965 字**＝`_afterLen` 一致）。どちらも送ったのは description だけで、ほかの field の変化 0（#106／#122）。
- select（eventType・status・category）は v4 スキーマの選択肢に実在（「公表」「長期脱炭素オークション」を含む）・配列で送った。registrationDeadline は送っていない。
- 実行: dry run 21:18〜21:19（GET 8）→ 本実行 21:19:24〜21:19:37（GET 16・POST 3・PATCH 2）。

## 原稿からの変更点

- 値（title・description・日付・select・置換の文）の変更は **なし**（JSON のまま送った）。
- **重複確認の語（手順 1(b)）**: ①の「第78回」だけで GET 全件を照らすと、`occto-balancing-committee-61-2026-06`「第61回 需給調整市場検討小委員会（第78回 調整力の細分化・広域調達作業会と合同開催）」に当たった（21:18 の dry run で ① が中止）。これは 2026 年 6 月の別の会議（需給調整市場検討小委員会と、作業会の第78回の合同開催）で、第78回 容量市場の在り方等に関する検討会の重複ではない。同じ会議を見つけるための確認なので、①の語を「第78回」＋「容量市場」の組にして照らし直し、0 件を確かめて作った（11/13 の便の ['第5回','電力事業環境整備'] と同じ形）。②「第124回」・③「市場退出」「013907」は語 1 つずつで 0 件。原稿の手順の字面（「第78回」を含む既存があれば作らない）とは違えた判断なので、ここに書く。

## policy-events の総件数

- 前 **154**（kind 未設定 106・業界 48）＝原稿の期待どおり → 後 **157**（kind 未設定 109・業界 48）＝期待どおり。全件 GET で id の重複 0。

## 本番の確認（素の URL・クエリなし）

- commit `aeb9773`（スクリプトと記録）→ Vercel の status success 21:27:13 JST。
- `https://bess-net.jp/policy-calendar` 21:27:22 JST: HTTP 200・**x-vercel-cache PRERENDER・age 0**。
  - JSON-LD `numberOfItems` **99**（96 → 99・原稿の期待どおり）。
  - ①②③ の title が初期 DOM（script を除き `<!-- -->` を剥がしたもの）に文字どおりある。
  - PATCH A の置換後の文「委員会当日の録画（YouTube）が配信されている（更新日 2026年11月17日）。議事録は2026年11月20日時点で未掲載。」がある・置換前の「録画・議事録は2026年11月13日時点で未掲載。」は無い。
  - PATCH B の置換後の文「議事録は同ページに掲載された（更新日 2026年11月18日）。」がある・置換前の「議事録掲載までの間は委員会当日の録画（Webex）が公開されている（更新日 2026年10月28日）。」は無い。
- 30 分後の確かめはユウがする（CC は待たない）。

## 申告・一時物

- 一時物は scratchpad（リポの外）: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\wp1120\`（OCCTO の 8 ページと応答ヘッダ・dry run の記録 2 本・`pc.html`／`pc.hdr`）。消していない。
- commit は名前を指定して入れた。
