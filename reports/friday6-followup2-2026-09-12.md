# 金曜#6 追修便② 報告（2026-09-12）

出典リンクの不一致・和歌山の取りこぼし・ADW cod の再逆転・追加オークションの同定・TMEIC 5 件・301 元リンク。
書込は microCMS PATCH（差分限定・件別提示・#106）とコード修正のみ。POST・DELETE・PUT なし。rm 系・force push なし。

---

## 0. 先に確認してほしいこと

1. **■1 の前提（本番の href が -2.pdf）は再現しなかった**。本番 HTML・RSC ペイロード・microCMS の生値の 3 経路とも、表示名「エネルギーパワー「子会社設立に関するお知らせ」」の href は **ir_20260414-1.pdf**。書込は不要だった（§1）。
2. **■4 は依頼の前提（最新＝8/6 資料）が崩れた**。8/6 決算説明資料 p.46 は同資料 p.25「企業価値向上に向けた成長戦略 （2026年2月12日公表資料 引用）」配下の**再掲頁**で、より新しい一次は **2026-08-31 付 ADWG 資料 p.9**（3号「稼働準備中」「（2027年稼働予定）」）。
   依頼の恒久ルール（一次同士が食い違えば最新を採る）どおりに 8/31 を採り、**cod は null のまま**（年精度）、**sourceUrl を 8/31 資料へ**、本文を時点明示で是正した。cod=2026-12-01 にはしていない（§4）。
3. **■2 は依頼の「body に 1 文」を第 1 段落の置き換えで実現した**。和歌山レコードの body は取込器テンプレ（「プロジェクト概要」見出し＋「発表企業：」）で、第 1 段落は表示時に field から作り直される（`src/lib/projects-body.ts`）。
   そのため 1 文を足しても表示されず、cod を入れると「ステータス：稼働中（**発表日：2026-03-01**）」と運転開始日を発表日として誤表示する。朝来（金曜#6）と同じく、**第 1 段落だけ**を一次に基づく文に置き換えた（出典ブロック以下は不変）。
4. **POST はしていない**。依頼冒頭の「POST は ■3 のみ」は ■3（朝来 marketParticipation＝PATCH）と対応しないため、本便に POST 対象は無いと読んだ。■2(c) の 4 件は候補表のみ（§2.4）。9/17 LTDC 説明会の POST 値（前便 §6）も未実行のまま。

---

## 1. ■1 出典の表示名とリンク先（朝来・丹波）

### 1.1 (a) 実態の確認 — 書込不要

| 経路 | 取得時刻 | 表示名「エネルギーパワー「子会社設立に関するお知らせ」」の href |
|---|---|---|
| 本番 HTML（素 URL・/projects/pr-co109041-hyogo・tamba-megapower） | 2026-09-12 04:48Z（x-vercel-cache STALE・age 2745） | `https://kenep.co.jp/pdf/ir_20260414-1.pdf` |
| 同ページの RSC ペイロード（`<a href=\"…\"`） | 同上 | `https://kenep.co.jp/pdf/ir_20260414-1.pdf` |
| microCMS の生値（全件 GET） | 2026-09-12 | `https://kenep.co.jp/pdf/ir_20260414-1.pdf` |

両レコードの `updatedAt` は 2026-09-11T12:52Z（前便の PATCH 時刻）で、以後の更新は無い。
`ir_20260414-2.pdf` は同じ段落の末尾の出典列挙に、表示名「2026年8月期 中間決算短信（2026年4月14日）」で別にリンクされている（表示名と一致）。

### 1.2 (b) 食い違いの原因

**転記でも後続コミットでの差し替えでもない**。前便の報告の curl は実態どおりで、本番・RSC・microCMS の値は PATCH 以降変わっていない。
依頼者の取り直しで -2 が見えた経路は再現できなかった。同じ段落に 2026年4月14日付の IR が 2 本（-1 と -2）並んでいるため、本文抽出の段階で表示名と別リンクの対応がずれた可能性がある（web_fetch 系の抽出で偽陽性が出た前例あり・7/15 /industry）。

### 1.3 (c) 表示名とリンク先の機械照合

**方法**: microCMS 全件（projects 344・news 1,385・explainer 263・glossary 1,535・faq 62・policy-events 107）の本文系 field から `<a href>` を全数抽出し、表示名とリンク先を機械で突き合わせた。

| 段階 | 件数 | 扱い |
|---|---|---|
| 本文のリンク | 5,607（外部 4,537・一意の URL 2,304） | — |
| 表示名＝URL そのもの | 4,196 | 照合対象外（表示名と href が同一） |
| 汎用ラベルのみ（「こちら」等） | 25 | 照合対象外 |
| **文書・対象を名指しする表示名** | **316**（一意の URL 227） | リンク先を取得し、表示名がリンク先の題名・本文（PDF は先頭 2 頁）に現れる割合で採点 |
| └ 採点 0.7 以上かつ日付も一致 | 144 | 一致とみなす |
| └ 採点 0.7 未満・取得不能・日付不一致 | **172** | 全件をエージェントが一次を取り直して判定（下表）。A/C/D は別エージェントが反証（72/72 件実施・confirmed 71・refuted 1） |

| 判定 | 件数 |
|---|---|
| A 表示名が別文書・別対象を名指し（朝来で疑われた型） | 1 |
| C 表示名がリンク先の一部（頁見出し・社名等） | 10 |
| D リンク先の変質（404・ドメイン失効・無関係頁） | 60 |
| B 汎用ラベル（照合対象外） | 45 |
| E 一致（機械検出の誤検知） | 56 |
| F 判定不能 | 0 |

**朝来で疑われた型（A）は 1 件**で、それも PR TIMES 本文の逐語転載（news/pr-2025-01-22-fluenceenergyinc-1）に元リリース側のリンクがそのまま入っていたもの。編集部が付けた出典で表示名と href が別文書を指すものは **0 件**。


**A 表示名が別文書・別対象を名指し（朝来で疑われた型）（1 件・1 通り）**

| 表示名 | リンク先 | 該当レコード | 判定の理由（要約） |
|---|---|---|---|
| 2030年までに温室効果ガス排出量を46%削減すること | https://www.isep.or.jp/archives/library/14885 | news/pr-2025-01-22-fluenceenergyinc-1 | 表示名は政府の温室効果ガス 46% 削減目標（2030年）を名指ししているが、リンク先は ISEP の 2024-09-17 付速報「国内の2023年度の自然エネルギー電力の割合と導入状況」（自然エネ比率 26.1% と導入量の統計）で、別の対象。本文に 温室・削減・46%・46％・地球温暖化対策・ |

**C 表示名がリンク先の一部（頁見出し・社名等）（10 件・4 通り）**

| 表示名 | リンク先 | 該当レコード | 判定の理由（要約） |
|---|---|---|---|
| ５．蓄電所保有状況／用地取得状況 | https://contents.xj-storage.jp/xcontents/32500/40efed6c/ebab/492a/8caf/26e0fdfd5862/140120 | projects/adw-higashiura-bess・projects/adw-imari-bess・projects/adw-kagoshima-bess・projects/adw-kumamoto-bess・projects/adw-nichinan-bess・projects/adw-nikko-bess・projects/adw-taki-bess | The PDF is ADWG's 2026年６月24日 release (12 pages; cover title = PDF metadata Title). The link text is not the document name: it is the heading of page 8 |
| 系統用蓄電池用地　EXITファンド#2 | https://yamawake-estate.jp/announcements/387 | news/pr-2026-02-19-co129930-36 | curl got only the SPA shell (200, site name only). Rendered in the browser, the page is the fund's redemption notice, dated 2025-09-29 and titled 「第22 |
| Voltaiyo株式会社 | https://www.icgam.com/2025/04/01/icg-asia-pacific-infrastructure-partners-with-obton-for-i | news/pr-2026-01-22-icgplc-1 | リンク先は ICG の 2025-04-01 付発表で、Obton A/S の日本事業（本文での呼称は Obton Japan）との提携を伝えるもの。この頁に Voltaiyo の語は一度も出てこない。一方、ICG 自身の Ray8 提携リリース（英語版・日本語版とも 2026-01-22）が「Vo |
| 日本政府は2030年までに温室効果ガスを46％削減 | https://www.isep.or.jp/archives/library/14990 | news/pr-2025-02-20-fluenceenergyinc-2 | リンク先は ISEP の 2025-01-07 付「第7次エネルギー基本計画への提言」。要旨に「温室効果ガスを2013年比で46%削減(さらに50%の高みを目指す)」とあり、表示の内容は頁の中にある。ただしこの頁は第三者（ISEP）の提言で、政府の計画そのものではない。表示名は頁内の一つの記述を指し |

**D リンク先の変質（404・ドメイン失効・無関係頁）（60 件・24 通り）**

| 表示名 | リンク先 | 該当レコード | 判定の理由（要約） |
|---|---|---|---|
| 関西電力送配電 公式プレスリリース | https://www.kepco.co.jp/network/news/ | explainer/hyogo-bess-outlook・explainer/kyoto-bess-outlook・explainer/osaka-bess-outlook・explainer/wakayama-bess-outlook | href は 404（関西電力の Not Found ページ）。/network/ 自体も 404。kepco.co.jp は親会社・関西電力のドメインで、関西電力送配電は自社ドメイン kansai-td.co.jp を持つ。候補 URL は kansai-td.co.jp トップページの「プレスリ |
| 九州電力送配電 公式プレスリリース | https://www.kyuden.co.jp/td/news/list.html | explainer/kagoshima-bess-outlook・explainer/kumamoto-bess-outlook | href は 404（九州電力の「お探しのページが見つかりません」）。九州電力送配電のホーム（/td.html）の「プレスリリース一覧を見る」リンク先 /td/press.html は 200 で、2026年のリリースを21件掲載（最新は2026-09-11付）。 |
| ひろしまバリューシフトプログラム | https://eikei.ac.jp/sdc/activities/other/ | news/pr-2026-03-31-co51586-568 | The target returns HTTP 404 (叡啓大学's 「ページが見つかりませんでした」 page). In the site's current navigation (SDC top and 産学官連携の取組), the ひろしまバリューシフトプログラム page lives a |
| 出典・関連情報 | https://www.toshiba-energy.com/index_j.htm | news/pr-2019-04-26-co32322-47 | The label is generic, but the target is dead. www.toshiba-energy.com does not exist in DNS (NXDOMAIN via 8.8.8.8), and the apex domain has only SOA/NS |
| 【第2弾】地域共生への取り組み 『【太陽光がダメは本当？】土地問題・地元反対を信頼で乗り越える「地域共生」というレノバの | https://youtu.be/iV1ZeawHytk | news/pr-2025-12-12-co54933-48 | The video has been made private. curl redirects to the watch page (200), but the title is just '- YouTube' and playabilityStatus=LOGIN_REQUIRED. oEmbe |
| 【第1弾】洋上風力と市場展望 『【再エネ急拡大】洋上風力について今思うこと－レノバが挑む風力・太陽光・蓄電池の巨大市場と | https://youtu.be/xqq9RtjK7i0 | news/pr-2025-12-12-co54933-48 | The video has been made private. curl redirects to the watch page (200), but the title is just '- YouTube' and playabilityStatus=LOGIN_REQUIRED. oEmbe |
| 東京電力パワーグリッド 公式プレスリリース | https://www.tepco.co.jp/pg/news/index-j.html | explainer/chiba-bess-outlook・explainer/gunma-bess-outlook・explainer/kanagawa-bess-outlook・explainer/saitama-bess-outlook・explainer/tochigi-bess-outlook・explainer/yamanashi-bess-outlook | [field=sources] The link now returns 404 (re-fetched 2026-09-12). The body is TEPCO PG's standard 'page not found' text: 'お客さまがアクセスしようとしたページが見つかりません。  |
| 東京電力リニューアブルパワー 公式プレスリリース | https://www.tepco.co.jp/rp/news/ | explainer/tepco-rp-bess | [field=body] The link returns 404 and shows TEPCO RP's standard 'page not found' page ('Page Not Found'). /rp/news/index-j.html also returns 404. TEPC |
| 東北電力ネットワーク 公式プレスリリース | https://www.tohokuepco.co.jp/news/index.html | explainer/akita-bess-outlook・explainer/aomori-bess-outlook・explainer/fukushima-bess-outlook・explainer/iwate-bess-outlook・explainer/miyagi-bess-outlook・explainer/yamagata-bess-outlook | href のホスト www.tohokuepco.co.jp は存在しないドメイン（ハイフン抜け。実在は tohoku-epco.co.jp）。curl exit 6（名前解決不可）、nslookup はローカル DNS と 8.8.8.8 の両方で Non-existent domain、ブラウザ |
| 優れた機能性を有する太陽光発電システムの基準」 | https://www.tokyo-co2down.jp/wp-content/uploads/2024/02/kinousei-pv_kizyun_r5.pdf | news/pr-2024-04-04-co119780-11 | href は HTTP 404（本文はクール・ネット東京の404ページ）。サイトが Kuroco へ移行し、旧 wp-content 配下の URL が消えた。元記事（PR Times 000000011.000119780、ソーラーエッジの東京都「優れた機能性を有する太陽光発電システム」認定のお知 |
| Worldwide Household Photovoltaic Power Generation System Mar | https://pmarketresearch.com/worldwide-household-photovoltaic-power-generation-system-marke | news/pr-2026-03-10-pwconsultinglimited-14 | リンク先は HTTP 404（WordPress の「Page not found – PW Consulting」）。2024年版レポートの URL が失効している。同じサイトの検索（?s=）で、同名レポートの現行頁 /worldwide-household-photovoltaic-power- |
| Worldwide Photovoltaic Meter Market | https://pmarketresearch.com/worldwide-photovoltaic-meter-market-research-2024-by-type-appl | news/pr-2026-03-10-pwconsultinglimited-14 | リンク先は HTTP 404（「Page not found – PW Consulting」）。2024年版の URL が失効している。サイト内検索で、同名レポートの現行頁 /worldwide-photovoltaic-meter-market-research/ が 200 で存在することを確 |
| 住友電気工業 公式プレスリリース | https://sumitomoelectric.com/jp/press | explainer/sumitomo-redox-flow-2025 | The target returns HTTP 404 (Error 404 ／ 住友電工). /jp/press-release, /jp/newsroom and /jp/news also return 404. The site's own navigation links ニュース＆プレス |
| 企業公式サイト: | https://www.amazon.co.jp/dp/B0FXFZ1T4S | news/pr-2025-10-30-co111100-134 | Broken anchor. The URL after 【Amazonサイト】 is cut off at 'https://www.a', so the Amazon link swallows the labels 出典・関連情報 / 企業元リリース / 企業公式サイト / PR TIMES. |
| 企業公式サイト: | https://www.amazon.co.jp/dp/B0G19M8JNS | news/pr-2025-11-18-co111100-137 | Two problems. The target returns 404 (ページが見つかりません); the product page is gone. And the anchor is broken: the URL after 【Amazonサイト】 is cut off at 'https |
| 出典・関連情報 | http://www2.panasonic.biz/es/souchikuene/chikuden/souchiku/souchiku465.html | news/pr-2013-08-20-co3442-811 | ラベルは汎用だが、本文では「＜関連URL＞▼創蓄連携システム」の直後に置かれたパナソニックの製品ページ。現在は /es/→/jp/ に転送されたうえで404。上位パスも /jp/souchikuene/chikuden/ が403、/souchiku/ が404。/jp/souchikuene/ は |
| 北海道電力ネットワーク 公式プレスリリース | https://www.hepco.co.jp/network/news/ | explainer/canadian-solar-naebo・explainer/hokkaido-bess-outlook | /network/news/ は廃止されており、ほくでんネットワーク自身の 404 ページ（削除またはリンク設定誤り）を返す。現行のプレスリリース一覧は、同社トップの「プレスリリース」リンク先 /network/info/index.html#INFO_PRESS（見出し「プレスリリース」、200） |
| 出典・関連情報 | https://www.jpi.co.jp/seminar/17033 | news/pr-2024-09-12-co42328-1076 | 表示名は汎用ラベルだが、リンク先が変質している。HTTP 200 なのに本文は「セミナーが存在しません。URLをお確かめください。」だけで、題名もセミナー名が空の「【セミナー】 () 開催セミナー」になっている（ソフト404）。2024-10-04 開催の「系統側蓄電池ビジネスのバイブルver3」の |
| 北海道電力管内での系統用蓄電池事業について（2024年8月6日）.pdf | https://www.mitsubishi-hc-capital.com/investors/library/pressrelease/pdf/2024080601.pdf | news/pr-2025-02-04-co86244-43 | The old PDF path now returns a 404 page. The same file number exists under the new path /news/assets/pdf/2024080601.pdf (200, 4 pages). That PDF is da |
| 第17回 2025地球温暖化防止展 | https://www.n-expo.jp/ | news/pr-2025-05-20-co70390-64 | The link is the exhibition's evergreen top page, which has rolled over to the 2027 edition (page title 「2027NEW環境展・地球温暖化防止展」), so the 2025 edition nam |
| Birdmanの適時開示（2026年7月2日） | https://www.release.tdnet.info/inbs/140120260702586749.pdf | news/birdman-sakaiminato-bess-unten-2026-07 | The TDnet PDF returns 404; TDnet only keeps disclosure PDFs for a limited period, so this link has expired. Birdman's own IR news page (https://birdma |
| セミナー詳細はこちら | https://gentosha-go.com/ud/seminar/id/69cb4607b576226425000000 | news/pr-2026-04-22-co30719-100 | 汎用ラベルだがリンク先が 404（「お探しのページが見つかりません」）。元 PR（ゴールドオンライン 2026-04-28 開催の系統用蓄電池投資セミナー）の個別セミナーページが削除済み。PR 記載の https://gentosha-go.com/ud/seminar は一覧ページで同一セミナーで |
| The 41st International and 7th Asian Conference on Thermo-el | https://ict2025.jp/ | news/pr-2025-06-09-co156400-2 | ドメインが別サイト化している。現在の ict2025.jp はオンラインカジノの比較・誘導サイト（ランキング・ボーナス案内）で、学会とは無関係。Wayback の 2024-12-06 版では正規の学会サイト（題名 'ICT/ACT 2025 (The 41st International Conf |
| K-Line株式会社 | https://k-line-inc.com/ | news/pr-2025-08-12-co149386-6 | ドメインが名前解決できない。Google・Cloudflare の DoH とも SERVFAIL（権威 NS 153.121.55.89／49.212.154.50／180.131.139.43 が応答せず、EDE 22/23）、curl は 000。Chrome はこのドメインへの遷移をポリシー |

反証で訂正したのは 1 件: news/pr-2025-12-10-co111100-143 の「企業公式サイト:」→ 楽天市場の商品頁は、元リリース（スリーアール・2025-12-10）が【楽天サイト】として載せた販売頁そのもので変質していない（D→E）。

**取込器テンプレのラベル（参考・別の型）**: 本文末尾の出典ブロックで「🎯 企業元リリース:」とラベルされたリンクのうち、リンク先がサイトのトップページのもの projects 59／90・news 348／655（ラベルは外、表示名＝URL のため上の照合では対象外）。和歌山レコードの「企業元リリース: https://www.jicn.co.jp/」もこの型。

是正は依頼どおり件数を見てから。優先度の案: ① `news/pr-2025-06-09-co156400-2` の ict2025.jp（**学会ドメインがオンラインカジノ誘導サイトに変質**）のリンク解除、② explainer の送配電各社「公式プレスリリース」ハブ（東北電力NW はホスト名のハイフン抜け `www.tohokuepco.co.jp`＝存在しないドメイン、東電PG・関西送配電・九電送配電・北海道NW・東電RP・住友電工は一覧 URL の移転で 404）を現行一覧へ付け替え、③ ADW 6 件の頁見出しの表示名（鹿児島は本便で是正済み）、④ TDnet の保存期限切れ（news/birdman-sakaiminato-bess-unten-2026-07）を会社 IR の同文書へ。

---

## 2. ■2 和歌山メガパワー蓄電所

### 2.1 (a) 同定 — 一次で確定（same・反証も支持）

| 根拠 | 一次（逐語） |
|---|---|
| 同じ日に同じ支援を名指し | JICN（株式会社脱炭素化支援機構）の PR TIMES（2025-10-14・本レコードの sourceUrl）「エネルギーパワー株式会社（…）が開発する系統用蓄電所事業（以下、本事業）に対して3億円の支援を行うことを決定しました。」／EP の同日開示 [ir_20251014-3](https://kenep.co.jp/pdf/ir_20251014-3.pdf)「株式会社脱炭素化支援機構から…**和歌山メガパワー蓄電所の建設のための支援（資金借入）**を受けることを決定しました」（借入金額 300 百万円） |
| 所在地 | PR TIMES「和歌山県和歌山市松江に設備容量約8.2MWhの系統用蓄電所を建設・運営する事業を計画しています。」／EP [ir_20250812-3](https://kenep.co.jp/pdf/ir_20250812-3.pdf)「（１）名称 和歌山メガパワー蓄電所 …（３）所在地 和歌山県和歌山市松江字仁嶋」（一致は大字「松江」の水準。字「仁嶋」は EP 開示のみ） |
| 融資元 | PR TIMES のスキーム図「紀陽銀行 / 商工組合中央金庫」「脱炭素化支援機構」／ir_20250812-3 の借入①紀陽銀行 300 百万円・借入②商工組合中央金庫 300 百万円 |
| 唯一性 | EP が開示した蓄電所のうち和歌山市にあるのは和歌山メガパワーだけ（県内のもう 1 基・有田湯浅町は有田郡湯浅町）。DB（344 件）に別名の重複なし |

子会社との関係は無い（北岐阜・三重霞は「今後取得する系統用蓄電池」用。和歌山は EP 単体の設備として計上＝ir_20260529-1 p.13）。

### 2.2 (b) 実施した PATCH（#106 ✓・他 field 変化 0・再実行は冪等 skip）

| field | 前値 | 後値 |
|---|---|---|
| name | 和歌山県和歌山市松江蓄電所 | 和歌山メガパワー蓄電所 |
| status | [計画中] | [稼働中]（一次「商業運転を開始しております」・選択肢は実在） |
| cod | null | 2026-03-01（一次「2026年３月から」＝月精度の慣行値。日付は開示に無い） |
| body（第 1 段落のみ） | 「<strong>株式会社脱炭素化支援機構がエネルギーパワー株式会社の開発する系統用蓄電所</strong>は、に立地する系統用蓄電所。発表企業：脱炭素化支援機構。ステータス：計画中（発表日：2025-10-14）。」（テンプレ） | 下記（697→1,297 字） |

後値（第 1 段落）:
> **和歌山メガパワー蓄電所**は、エネルギーパワー株式会社が和歌山県和歌山市松江字仁嶋に整備・保有する系統用蓄電所。同社は2025年8月12日に取得を決議したと開示し（固定資産の取得及び資金の借入に関するお知らせ（2025年8月12日）→ ir_20250812-3.pdf）、2025年10月14日には株式会社脱炭素化支援機構が、同社が和歌山県和歌山市松江で計画する設備容量約8.2MWhの系統用蓄電所事業に3億円の支援を行うことを決定したと発表した（同日の同社開示: （開示事項の経過）資金借入に関するお知らせ（2025年10月14日）→ ir_20251014-3.pdf）。「朝来メガパワー蓄電所及び丹波メガパワー蓄電所は2025年12月から、和歌山メガパワー蓄電所は2026年３月から商業運転を開始しております。」（出典: エネルギーパワー「子会社設立に関するお知らせ」→ **ir_20260414-1.pdf**, 2026年4月14日）。運転開始日は月精度（2026年3月）で、日付は開示資料に記載がない。

各リンクの表示名は、リンク先 PDF の 1 頁目の表題どおり（■1(c) の観点）。書込直前に 8 つの逐語を一次から取り直して全部あることを確認した。

### 2.3 触っていない field（表のみ・承認後）

| field | 現値 | 案 | 根拠と留保 |
|---|---|---|---|
| outputMw | null | 1.979 | kenep 発電所一覧「定格出力1,979kW予定」・ir_20250812-3（原文はラベルと単位が入れ替わった書式）。**ただし** 2025 年の発行者情報の（注）は朝来・丹波（ir_20250530-1 p.16）・和歌山（ir_20251128-4 p.19）とも「出力で1,976kW」。一次の中で食い違いは解消していない（1,976 を誤記と断定しない） |
| capacityMwh | 8.2 | 8.226 | ir_20251128-4 p.19「蓄電容量で8,226kWh」・kenep 一覧。8.2 は PR TIMES の「約8.2MWh」 |
| marketParticipation | [] | 要判断 | EP 開示の用途は「需給調整市場等における調整力等の取引」（施設別の運用実績の記載は無い） |
| sourceUrl | JICN の PR TIMES | 据え置き | 所在地・支援の一次。運転開始の一次（ir_20260414-1）は本文に引用済み |

出典ブロックの「🎯 企業元リリース: https://www.jicn.co.jp/」（トップページ）は取込器テンプレ由来の表示名とリンク先の食い違い（§1.3 の B 群）で、本便では触れていない。

### 2.4 (c) 同じ IR が挙げる未掲載 4 件（調査のみ・POST しない）

依頼の前提の訂正: ir_20260414-1 の文言は「…兵庫南あわじメガパワー蓄電所及び有田湯浅町メガパワー蓄電所を**取得することをお知らせしておりました**」で、取得（引渡）の完了は述べていない。

| 候補 | name 案 | slug 案 | status 案 | cod | 出力／容量 | 所在地（一次の逐語） | sourceUrl 候補 | 一次で取れない項目 |
|---|---|---|---|---|---|---|---|---|
| 兵庫南あわじ | 兵庫南あわじメガパワー蓄電所 | minamiawaji-megapower | 建設中（2026-02-28 時点で建設仮勘定＝総額の約98%支払済み。竣工・運転の実績は未開示） | null（目標「2026 年８月期中の商業運転開始」） | 1,979kW／8,226kWh | 兵庫県南あわじ市市小井 | [ir_20251014-2](https://kenep.co.jp/pdf/ir_20251014-2.pdf)（固定資産の取得に関するお知らせ・2025-10-14。着工 2026年1月〜4月予定・引渡 2026年4月予定・支払先 イースト・エンジニアリング） | 番地以下・竣工/運転の実績・メーカー |
| 有田湯浅町 | 有田湯浅町メガパワー蓄電所 | arita-yuasa-megapower | **計画中**（一次は工事予定のみ・掲載画像は CG。反証で「建設中」は不可と判定） | null（目標「2027 年８月期中」） | 1,979kW／7,740kWh | 和歌山県有田郡湯浅町大字湯浅字梨子本 | [ir_20251114-2](https://kenep.co.jp/pdf/ir_20251114-2.pdf)（固定資産の取得及び譲渡並びに賃借・2025-11-14。着工 2026年3月〜7月予定。**セールアンドリースバック**＝設備は MUFG ファイナンス＆リーシングへ譲渡後に賃借、物件引渡 2026-11-17 予定） | 着工・竣工の実績・メーカー |
| 北岐阜（合同会社北岐阜メガパワー） | 北岐阜メガパワー蓄電所 | kitagifu-megapower | 計画中（着工 2026年8月〜2027年2月予定） | null（目標「2027 年８月期中」） | 1,979kW／7,521kWh | 岐阜県岐阜市大字太郎丸字寺洞 | [ir_20260714-1](https://kenep.co.jp/pdf/ir_20260714-1.pdf)（連結子会社における固定資産の取得及び資金借入・2026-07-14。借入 紀陽銀行 700 百万円・EP が連帯保証） | 着工の実績・kenep 一覧に未掲載 |
| 三重霞（合同会社三重霞メガパワー） | （未開示） | — | — | — | — | 一次に施設の所在地なし（子会社の本店＝EP 本社と同一住所） | — | **蓄電所名・所在地・能力・取得日程のすべて**（社名から「三重霞メガパワー蓄電所」「四日市市霞」と類推するのは推測のため不可）→ **POST 不可** |

DB 照合: 4 件とも別名の既存レコードなし。岐阜市大字太郎丸には `pr-co161802-gifu`（NC岐阜市太郎丸蓄電所・日本蓄電池・1,988kW／8,146kWh）があるが別施設。

---

## 3. ■3 朝来の marketParticipation（#106 ✓）

| slug | field | 前値 | 後値 |
|---|---|---|---|
| pr-co109041-hyogo | marketParticipation | [] | [需給調整市場]（丹波と同値。選択肢は丹波で実在） |

根拠: [ir_20260414-2.pdf](https://kenep.co.jp/pdf/ir_20260414-2.pdf) PDF p.4（印刷 -2-）「当中間会計期間から朝来メガパワー蓄電所及び丹波メガパワー蓄電所が商業運転を開始し、主に需給調整市場を通じた需給調整力の提供を始めました。」
本文には同趣旨の文（「…主に需給調整市場を通じた需給調整力の提供を始めたとしている。」）と同 PDF への出典リンクが既にあるため、追記していない。

---

## 4. ■4 ADW 鹿児島（第 3 号）の cod

### 4.1 (a) 8/6 資料 p.46 の逐語（前後つき）と URL

[ADWG「2026年12月期 第2四半期 決算説明資料」（2026年8月6日）](https://contents.xj-storage.jp/xcontents/32500/599513f5/3101/42ab/a276/cecaa9963f9d/140120260806512121.pdf) PDF p.46「08 系統用蓄電所事業」:

> 約1年で運用開始準備が整う比較的小規模の拠点を中心にスピーディに展開し成長初期段階のマーケットへの早期進出による地位確立・事業機会の獲得を図る。
> 2026年１月に１号案件が竣工（同年３月以降稼働）。取得済みの２号拠点と３号拠点も運用開始に向け推進。（年内に計10拠点の確保を目指す）
> 将来的にはファンド化によるノンアセットビジネスへの展開も見据える。
> 第１号拠点 三重県松阪市にて 2026年1月竣工／第２号拠点 熊本県益城町にて 2026年8月稼働開始予定／**第３号拠点 鹿児島県鹿児島市にて 2026年12月稼働開始予定**

- 図の 3 ブロックは語座標で各拠点のラベルと一続き（第 3 号を名指ししている）。
- ただし同資料 p.25 は「**企業価値向上に向けた成長戦略 （2026年2月12日公表資料 引用）**」、p.26 は表紙「2026年2月12日」で、p.46 はその引用区間の頁。2/12 原本 p.21 と図キャプションの座標まで一致（違いは句点 3 つ）。5/14 付 1Q 資料 p.49・8/6 英文資料にも同じ頁が再掲されている。

### 4.2 最新の一次 — 2026-08-31 付 ADWG 資料 p.9

[エー・ディー・ワークスの系統用蓄電所事業、第２号「ADW熊本益城町蓄電所」が竣工・稼働開始（2026年8月31日）](https://contents.xj-storage.jp/xcontents/32500/4e70bc3a/61ad/4235/9598/07d55a68f006/140120260831528488.pdf) p.9「〈更新〉2026年8月31日付 ５．蓄電所保有状況／用地取得状況」: 3号「鹿児島県鹿児島市」「約2MW／約8MWh」「**稼働準備中**」「**（2027年稼働予定）**」（行の帰属は語座標と pdftotext -raw で確定。-layout は行をずらす）。

### 4.3 判定と実施

- 依頼の分岐 (b) は「最新は 8/6」が前提だったが、最新は 8/31。恒久ルールで 8/31 を採る → 「2027年」は年精度のため **cod は null のまま**。status 建設中は据え置き。
- 実施した PATCH（#106 ✓・再実行は冪等 skip）:

| field | 前値 | 後値 |
|---|---|---|
| sourceUrl | https://prtimes.jp/main/html/rd/p/000000036.000160356.html（2025-12-23） | 8/31 付 ADWG 資料 PDF（最新の一次を表示出典に） |
| body（2 文目〜6/24 資料の文） | 「…取得したと発表し、…としていた。その後、…2026年6月24日付で公表した資料（５．蓄電所保有状況／用地取得状況）では「3号」として掲載され、…ステータスは「工事中」、稼働時期は「2027年稼働予定」と記載されている（年までの表記）。」 | 12/23 発表（PR036 へのリンクを本文に残す）→ 6/24 資料「工事中」「2027年稼働予定」（過去形）→ **最新の 8/31 資料「稼働準備中」「2027年稼働予定」** → 8/6 決算説明資料 p.46 の「2026年12月稼働開始予定」は「2026年2月12日公表資料 引用」で 8/31 と食い違う、を時点明示で併記（583→1,432 字）。6/24 資料のリンク表示名は「５．蓄電所保有状況／用地取得状況」（頁見出し）から PDF の表題へ是正 |

### 4.4 (d) 8/31 付 p.9 の拠点表と DB（PATCH は承認後）

| 号 | 所在地 | 8/31 付の記載 | DB | 食い違い |
|---|---|---|---|---|
| 1号 | 三重県松阪市 | 稼働済み（需給調整市場参入済み） | pr-co160356-bess 稼働中・cod 2026-03-31 | なし |
| 2号 | 熊本県益城町 | 稼働済み（2026年11月末頃 需給調整市場 参入予定） | pr-co160356-bess-2 稼働中・cod 2026-08-31 | なし |
| 3号 | 鹿児島県鹿児島市 | 稼働準備中（2027年稼働予定） | adw-kagoshima-bess 建設中・cod null | なし（本便で本文・出典を是正） |
| 4号 | 熊本県熊本市 | 稼働準備中（2027年稼働予定） | adw-kumamoto-bess 計画中・null | status の語が違う（稼働準備中↔計画中） |
| 5号 | 宮崎県日南市 | 稼働準備中（2027年稼働予定） | adw-nichinan-bess 建設中・null | なし |
| 6号 | 三重県多気町 | 稼働準備中（2027年稼働予定） | adw-taki-bess 計画中・null | status の語が違う |
| 7号 | 佐賀県伊万里市 | 稼働準備中（**2028年**稼働予定） | adw-imari-bess 計画中・**cod 2027-05-01** | **cod が最新の一次と食い違う**（6/22 の「2027年５月（予定）」から 8/31 で 2028 年へ）→ 案: null（年精度）＋本文の時点明示 |
| 8号 | 栃木県日光市 | 稼働準備中（2027年稼働予定） | adw-nikko-bess 計画中・cod 2027-09-01 | 年は一致（月は 6/22 のみ） |
| 9号 | 愛知県東浦町 | 稼働準備中（2028年稼働予定） | adw-higashiura-bess 計画中・cod 2028-02-01 | 年は一致（月は 6/24 のみ） |

8/31 付では停止条件の注記が「※7号及び8号…」から「※ 8 号に係る取得契約は…」に変わり、目標は「2026年中に15か所の蓄電所（用地含む）を確保する目標。累計９か所を確保済み（２か所稼働済み）。」。

---

## 5. ■5 追加オークション（capacity-additional-auction-2026-03）

### 5.1 (a) レコードの逐語

- title: 「容量市場追加オークション（2026年度向け）」
- description: 「メインオークション後の不足分を補完する追加オークション。直前の需要見通し更新を踏まえた追加調達で、蓄電所事業者には短期参入のチャンス。」
- eventDate 2026-03-15（日曜）・eventType [オークション]・issuer OCCTO・status [終了]・createdAt 2026-05-11（commit e2987f9「Phase A で生成した 26件の draft」のバッチ。投入元 scripts/ab-policy-events-drafts.json に意図の注記なし）

### 5.2 判定 — 「容量市場2025年度追加オークション（対象実需給年度：2026年度）」を指す（反証も支持）

- OCCTO は「YYYY年度向け」を実需給年度の意味で使う（例: 2026_jitsujukyu.html「募集要綱 様式2（調達オークション 期待容量等算定諸元一覧 2026年度向け）」）。開催年度は「2026年度追加オークション（対象実需給年度：2027年度）」のように書き分ける。
- 同バッチの姉妹 `capacity-main-auction-2026-09`（「容量市場メインオークション（2030年度実需給）応札期間」・eventDate＝応札開始・endDate＝応札終了）も実需給年度で命名し、eventType オークション＝応札期間。
- 2026 年 3 月前後の対象実需給 2027 年度の工程（参加登録 3/2〜・第72回容量市場検討会 3/27 の開催要否検討）は、題名「2026年度向け」とも eventType とも合わない。2027 年度向けと読むと既存 `occto-capacity-tsuika-2027-result-2026-08` とも重なる。
- 2026-03-15 はどの一次の工程日でもない仮置き（同バッチ 26 件中 21 件が 1 日・15 日）。

### 5.3 (b) 実施した PATCH（#106 ✓）

| field | 前値 | 後値 | 一次 |
|---|---|---|---|
| eventDate | 2026-03-15 | **2025-06-04**（応札受付開始） | 開催告知（sourceUrl）「「オークション参加資格通知書」の発行された電源等毎に、応札の受付期間（6月4日～16日）に応札情報の登録※が可能となります。」 |

sourceUrl（前便で差し替えた開催告知）は確定。表のみ: endDate＝2025-06-16（姉妹の規則なら入れる）／slug の「-2026-03」は誤った年月だが URL 変更を伴うため据え置き／姉妹 `ltdc-3-application-2026-01` の sourceUrl（/market-board/market/youryou-ltdc/）も 404。
前便報告 §8.1 の「容量確保契約の結果公表 2026-01-07」は、反証側が「新着一覧に無い＝根拠不明」としたが、一次 PDF（…/yoryokakuhokeiyaku/tsuikaauction_keiyakukekka_2026.pdf）の表紙「容量市場 容量確保契約の結果 追加オークション（対象実需給年度：2026年度） 2026年1月7日」で確認できた（ハブ頁掲載の PDF で新着一覧には出ない）。

---

## 6. ■6 TMEIC 製 5 件（承認分・#106 ✓・再実行は冪等 skip）

| endpoint/slug | field | 前値 | 後値 |
|---|---|---|---|
| news/nc-iwami-juden-2026-08 | body | 蓄電池システムは TMEIC 製（蓄電池は CATL 製）、 | 蓄電池システムは TMEIC（蓄電池は CATL）、 |
| news/nc-tamana-aono-balancing-entry-2026-08 | body | 蓄電池システムは TMEIC 製（蓄電池は CATL 製）を採用する。 | 蓄電池システムは TMEIC（蓄電池は CATL）を採用する。 |
| news/nc-choshi-kasugacho-unten-2026-08 | body | 蓄電池システムはTMEIC製（電池はCATL製）、 | 蓄電池システムは TMEIC（蓄電池は CATL）、 |
| projects/nc-iwami-bess | body | 蓄電池システムは TMEIC 製（蓄電池は CATL 製）、 | 蓄電池システムは TMEIC（蓄電池は CATL）、 |
| projects/nc-choshi-kasugacho-bess | body | 蓄電池システムはTMEIC製（電池セルはCATL製）、 | 蓄電池システムは TMEIC（蓄電池は CATL）、 |

実行: `scripts/patch-friday6-followup-2026-09-11.ts --include-held --only=TMEIC`（承認された行だけを書くため `--only` を追加。丹波の座標の hold 行は書いていない）。

---

## 7. ■7 301 元リンク

### 7.1 (a) 除外が「語の消失」でないことの機械検査

`npm run verify:no-301-links` に軸3を追加: /glossary 一覧に出ていない 301 元それぞれについて、301 の最終宛先（チェーンは `canonicalGlossarySlug`）が一覧に出ていることを主張（宛先不在なら FAIL・slug 列挙）。
結果: **301 元 143 件 → 宛先が一覧に無いもの 0 件**（一覧の語数 1,392）。1,534→1,392 の −142 はすべて重複の解消。

### 7.2 (b) /grid の固定リンクは宛先へ差し替え（6 語を保つ）

`src/app/grid/[slug]/related-terms.ts`: 「ノンファーム」non-firm-detail → **non-firm-connection**、「出力制御」output-control → **curtailment**（6 語のまま）。
`verify:no-301-links` 軸1b: 固定リンクに 301 元が残れば FAIL。built HTML で /grid 配下の 301 元リンク **2,184 → 0**（詳細ページ全体 2,476 → 292）。
方針: **生成一覧は除外・キュレーション済み固定リンクは宛先へ差し替え**。

### 7.3 (c) ほかに 301 元を「固定で」参照している箇所（列挙のみ）

| 種別 | 箇所 | 301 元 → 宛先 | 本数（built HTML） | 扱いの案 |
|---|---|---|---|---|
| コード（固定リンク） | src/components/IRRSimulator.tsx:1270 `<Link href="/glossary/irr">` | irr → internal-rate-of-return | /tools 1 | 宛先へ差し替え（1 行） |
| コード（判定用リスト・リンクではない） | src/app/glossary/[slug]/page.tsx:35-36 `GRID_RELATED_GLOSSARY_SLUGS` の 'non-firm-detail'・'output-control' | — | 0（301 元の頁は描画されないので死に行） | 削除して可（宛先は同リストに既にある） |
| コード（除外用・正しい） | src/app/sitemap.ts の denylist（repower-eu 等） | — | 0 | 変更不要 |
| microCMS（キュレーション済み参照） | links.relatedTerms（/links 各頁の関連用語） | repower-eu 63・ul-9540a-standard 57・multi-use-detail 29・lfp 18・non-firm-detail 18・cbi-standard-2 16 | /links 201 | 表示側で `canonicalGlossarySlug` を通す（links/[slug]/page.tsx:96・1 行）か、microCMS の参照を宛先へ付け替え |
| microCMS（同） | news.relatedTerms | tesla-megapack-product（news-2026-1-ando-hazama 等 5）・low-voltage-resource（news-2026-1-op-01101380 等 5）・iea-international（news-2026-1-jema・jbra） | /news 12 | 同上 |
| microCMS（同） | faq/faq-seido-07.relatedGlossary | output-control | /faq 1 | 同上 |
| microCMS（本文） | glossary/capacity-contribution.detail | capacity-procurement-contract-amount → capacity-contract-payment | /glossary 1 | 本文リンクの付け替え |
| 生成（precompute） | 関連プロジェクト（news・glossary 詳細・tracker・explainer）が PROJECTS_301 の元を指す | pr-co76147-bess → osakagas-suita ほか 29 slug | 約 75 | 生成一覧なので**除外**（近隣カードと同じ `isListExcludedProject` を生成器に配線） |

---

## 8. ■8 「運転開始／運転開始予定」の数え上げ（規則は追認どおり据え置き）

- (a) **稼働中かつ cod が未来: 0 件**（判定日 2026-09-12・`normalizeCod` で解釈した日付）。
- (b) 一覧で元から「（予定）」で終わっていた 18 件と Pj2-H 承認表の「書式不正 cod」28 件の突合: **17 件が Pj2-H の 28 件に含まれる**。含まれないのは `chikuzenmachi-bess`（建設中・「2028年1月（予定）」）の 1 件。

| slug | status | cod（現値） | Pj2-H 28 件 |
|---|---|---|---|
| ibeet-miyagi-shiroishi-bess | 計画中 | 2028年度（予定） | ◯ |
| shizuokagas-hamamatsu-bess | 計画中 | 2028年4月（予定） | ◯ |
| kajiwara-asago-bess | 計画中 | 2027年4月（予定） | ◯ |
| fujitech-kushiro-katsuragoi-bess | 建設中 | 2027年2月1日（予定） | ◯ |
| nc-nagano-city | 建設中 | 2026年10月（予定） | ◯ |
| nc-ibigawa | 計画中 | 2026年10月（予定） | ◯ |
| mikimori-yame-bess | 計画中 | 2027年3月（予定） | ◯ |
| mikimori-kamimashiki-bess | 計画中 | 2027年2月（予定） | ◯ |
| mikimori-otawara-bess | 計画中 | 2027年2月（予定） | ◯ |
| mikimori-nishimorokata-bess | 計画中 | 2027年2月（予定） | ◯ |
| mikimori-tamana-gun-bess | 計画中 | 2026年12月（予定） | ◯ |
| mikimori-kuma-bess | 計画中 | 2026年12月（予定） | ◯ |
| mikimori-katta-bess | 計画中 | 2026年12月（予定） | ◯ |
| mikimori-kakogawa-bess | 計画中 | 2026年11月（予定） | ◯ |
| mikimori-hachioji-bess | 計画中 | 2026年10月（予定） | ◯ |
| will-bungoono | 建設中 | 2026年6月（予定） | ◯ |
| will-yamaga | 建設中 | 2026年7月（予定） | ◯ |
| chikuzenmachi-bess | 建設中 | 2028年1月（予定） | ×（Pj2-H の対象外） |

Pj2-H 28 件のうち 18 件に入らない 11 件は、稼働中で非 ISO 文字列の cod（bluesky-himeji/miyaki/nakatsu/osaki・nc-choshi-kasugacho・ota・pr-000kwh・sunvillage-chubu・sustainable-miyawaka・will-kinokawa＝一覧では「（予定）」を付けない）と、renova-kikugawa（建設中・「2028年度」＝「予定」を含まないので今回の 64 件側で「（予定）」が付く）。是正は Pj2-H 実行便で。

---

## 9. デプロイ後の本番 curl

デプロイ: 630c775・c697a8c（push 2026-09-12 13:00:55Z）→ `gh api repos/kenjieda-eng/bess-net/commits/c697a8c/status` = **success**（Vercel・updated_at 2026-09-12T13:11:08Z）。
素 URL（クエリ・キャッシュ回避ヘッダなし）で取得。STALE が返った場合は再取得する設定で実行し、今回は全 URL が初回から HIT／PRERENDER（STALE 0）。

### https://bess-net.jp/projects（x-vercel-cache: HIT・2026-09-12T13:11:28Z）

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects"
HTTP/1.1 200 OK
Age: 8
Cache-Control: public, max-age=0, must-revalidate
Content-Length: 345418
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 13:11:18 GMT
Etag: "17oo6qu7it56gev"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects
X-Vercel-Cache: HIT
X-Vercel-Id: hnd1::iad1::tfwch-1789218686663-4d799a6f0223

200
```

- 列見出し: <th>運転開始</th>／「運開予定」0 件
- pr-co140317-bess の行: —｜8.2 MWh｜エネルギーパワー株式会社｜2026-03-01
- pr-co109041-hyogo の行: 1.979 MW｜8.226 MWh｜エネルギーパワー株式会社｜2025-12-01
- tamba-megapower の行: 1.979 MW｜8.226 MWh｜エネルギーパワー株式会社｜2025-12-01
- adw-kagoshima-bess の行: 2 MW｜8 MWh｜株式会社エー・ディー・ワークス｜—

### https://bess-net.jp/projects/pr-co109041-hyogo（x-vercel-cache: PRERENDER・2026-09-12T13:11:29Z）

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/pr-co109041-hyogo"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 55025
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 13:11:27 GMT
Etag: "7d1c2086deb42b57681a6b8530853c61"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/pr-co109041-hyogo
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::tfwch-1789218687948-a980bfff1234

200
```

- <h1>朝来メガパワー蓄電所</h1>
- <dt>運転開始</dt><dd>2025-12-01</dd>
- IR 逐語の出典: href=https://kenep.co.jp/pdf/ir_20260414-1.pdf 表示名=エネルギーパワー「子会社設立に関するお知らせ」
- 「発表日：」0 件
- 市場参加: 需給調整市場

### https://bess-net.jp/projects/tamba-megapower（x-vercel-cache: PRERENDER・2026-09-12T13:11:30Z）

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/tamba-megapower"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 55859
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 13:11:29 GMT
Etag: "0fc0aeda6a4009c6d797b9de6e3568ed"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/tamba-megapower
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::24gcl-1789218689053-38f28ae3843f

200
```

- <h1>丹波メガパワー蓄電所</h1>
- <dt>運転開始</dt><dd>2025-12-01</dd>
- IR 逐語の出典: href=https://kenep.co.jp/pdf/ir_20260414-1.pdf 表示名=エネルギーパワー「子会社設立に関するお知らせ」
- 「発表日：」0 件

### https://bess-net.jp/projects/pr-co140317-bess（x-vercel-cache: PRERENDER・2026-09-12T13:11:31Z）

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/pr-co140317-bess"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 53354
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 13:11:30 GMT
Etag: "03ad3796ef2c3b5212aa8136df857759"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/pr-co140317-bess
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::4nrhf-1789218690129-9e0b7147651e

200
```

- <h1>和歌山メガパワー蓄電所</h1>
- <dt>運転開始</dt><dd>2026-03-01</dd>
- IR 逐語の出典: href=https://kenep.co.jp/pdf/ir_20260414-1.pdf 表示名=エネルギーパワー「子会社設立に関するお知らせ」
- 「発表日：」0 件
- status バッジ: 稼働中

### https://bess-net.jp/grid/cb-1（x-vercel-cache: PRERENDER・2026-09-12T13:11:32Z）

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/grid/cb-1"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 62034
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 13:11:31 GMT
Etag: "13618b3d8201626e0cf83df705b4ddae"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /grid/cb-1
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::cs97b-1789218690754-f8cff7cb71d2

200
```

- <h1>西部変電所</h1>
- 関連用語: 蓄電所とは→battery-storage-site / 系統連系→grid-interconnection / 系統空き容量→grid-available-capacity / ノンファーム接続→non-firm-connection / ノンファーム→non-firm-connection / 出力制御→curtailment / 変電所→substation

### https://bess-net.jp/projects/adw-kagoshima-bess（x-vercel-cache: PRERENDER・2026-09-12T13:11:32Z）

```
$ curl -s --http1.1 -D - -o /dev/null -w "%{http_code}\n" "https://bess-net.jp/projects/adw-kagoshima-bess"
HTTP/1.1 200 OK
Accept-Ranges: bytes
Access-Control-Allow-Origin: *
Age: 0
Cache-Control: public, max-age=0, must-revalidate
Content-Disposition: inline
Content-Length: 56750
Content-Type: text/html; charset=utf-8
Date: Sat, 12 Sep 2026 13:11:31 GMT
Etag: "e041ff38c57b9e1dfb200f0c21b25efe"
Permissions-Policy: camera=(), microphone=(), geolocation=()
Referrer-Policy: strict-origin-when-cross-origin
Server: Vercel
Strict-Transport-Security: max-age=63072000
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-Matched-Path: /projects/adw-kagoshima-bess
X-Vercel-Cache: PRERENDER
X-Vercel-Id: hnd1::89tqg-1789218691663-0a7e9a7de017

200
```

- <h1>鹿児島県鹿児島市蓄電所（エー・ディー・ワークス）</h1>
- 「最新の2026年8月31日付資料」あり
- 出典（sourceUrl）8/31 PDF へのリンク: 6 箇所


---

## 10. 検証

ローカルビルド 2 回（fetch-cache 退避 #116・BUILD EXIT 0）。2 回目は本便の PATCH 後のデータで実施。

- tsc 0 エラー／verify:linkify 15/15 clean／verify:projects-body 28 PASS（テンプレ指紋一致 172 件＝和歌山がテンプレから外れた）／verify:nearby-cards PASS／verify:operators PASS／verify:no-301-links PASS（軸1b・軸3 を含む）
- maintenance: 掲載 253・調査中 38・予定日超過 54（判定日 2026-09-12）
- built HTML:
  - projects/pr-co140317-bess.html: `<h1 class="page-title">和歌山メガパワー蓄電所</h1>`・`<dt>運転開始</dt><dd>2026-03-01</dd>`・IR 逐語＋`<a href="https://kenep.co.jp/pdf/ir_20260414-1.pdf">` あり・「発表日：」0 件（テンプレ再生成が掛からない）
  - projects/adw-kagoshima-bess.html: 「最新の2026年8月31日付資料」あり・運転開始行なし（cod null）
  - projects/pr-co109041-hyogo.html: marketParticipation に「需給調整市場」
  - projects.html の行: 和歌山「—｜8.2 MWh｜エネルギーパワー株式会社｜2026-03-01」（稼働中＝「（予定）」なし）・鹿児島「2 MW｜8 MWh｜…｜—」
  - grid/cb-1.html の関連用語: 系統連系・系統空き容量・ノンファーム接続・ノンファーム（→ non-firm-connection）・出力制御（→ curtailment）・変電所の 6 語

---

## 11. 触らなかった行とその理由

| 項目 | 理由 |
|---|---|
| 朝来・丹波の href | 既に ir_20260414-1.pdf（§1.1）。書込不要 |
| ■1(c) の是正 | 依頼どおり件数を見てから（§1.3） |
| 和歌山の outputMw・capacityMwh・marketParticipation | 依頼範囲外（表のみ・§2.3）。outputMw は 1,976/1,979 の一次内の食い違いが残る |
| 未掲載 4 件の POST | 依頼どおり金曜#7 ⑤枠（候補表のみ・§2.4）。三重霞は一次に施設情報が無く POST 不可 |
| 鹿児島の cod | 最新の一次（8/31）が年精度のため null 維持（§4.3） |
| ADW 他 6 件（伊万里の cod 2027-05-01 ほか） | 依頼どおり承認後（§4.4） |
| 追加オークションの endDate・slug | endDate は提案のみ／slug は URL 変更を伴う |
| 丹波の座標 | 前便の hold のまま（今回の承認は TMEIC 5 件のみ） |
| 9/17 LTDC 説明会の POST・9/25 レコード | 本便に POST 対象なし（§0-4）／9/25 は一次に無いが削除しない |
| ■7(c) の各所 | 依頼どおり列挙のみ（§7.3） |
| ビルドで generated_at だけ変わる生成物 | 内容が同一のものはコミットしない |
