# 補助金 月曜定例 11-16 — 環境省 ストレージパリティ R8 の二次公募の採択結果を反映し「採択結果公表」に（2026-11-17・CC・`_QUEUE.md` 117 行）

microCMS の書込は `subsidies` の **PATCH 1 レコード（3 op）**（POST・DELETE・PUT 0・ほかの API 0）。webhook は止めていない（書込 1）。
訂正履歴は足していない（便 ■3＝一次の新しい掲示への追随＝更新）。資料名の台帳も触っていない（便 ■2）。

## (0) 読んだもの・実行

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\補助金便_月曜定例11-16_ストレージパリティR8の二次採択結果を反映_採択結果公表に_Claude_Code投入_2026-11-16起草_ユウ.md`
  - 17,780 バイト・最終更新 2026-11-16 12:07 JST・sha256 `a85d8256f1e6fda7aea90cdba15416e16443a5cc0dca68289cb460b3110e74dc`
- 計画: 同じフォルダの `subsidies-patch-plan-2026-11-16_月曜定例_一次照合済み_ユウ.json`
  - 5,751 バイト・sha256 `f5b61123eae56295d29aa7e883bb56e88ed63cc09581fa2dfc89e34e7b0b1814`（便の値と一致）
- GO: `_QUEUE.md` 117 行（ユウ 11/17 09:2x・EDAさん 09:19「全て進めて」・1 本目）。
- 実行: 2026-11-17（JST）。一次の取り直し 09:50:52〜09:50:57・dry run 09:51 台・本実行 09:51:46〜09:51:50。main の HEAD `c4fbb85`（origin/main と同じ）。
- **★日付を替えた**（便 §0 ★・実行日が 11/16 でないため）: 計画のコピー `reports/subsidies-weekly-2026-11-16.data.json` の側で、op W1116-03 の new の「【2026-11-16 更新】」→「【2026-11-17 更新】」・「2026年11月16日時点」→「2026年11月17日時点」の 2 か所だけを替えた。
  - 替える前に、(1) の取り直しで三次公募の告知が無いことを確かめた。
  - 置換は W1116-03 の `new` の値の中だけ（同じ文字列は note にもあるが、note は替えていない）。JSON として読んで、替えた値以外が元と同じことを機械で確かめた。
  - 替えた後の sha256: `a68832a49bb73c15a081dbf984f41988ee90de1d67216d9b2a328a98af0143b4`。
- スクリプト: `scripts/apply-subsidies-weekly-2026-11-16.ts`（`runApplier` を呼ぶだけ・11-09 と同じ形・label「補助金 月曜定例 11-16 applier」）。
- 記録: `reports/subsidies-weekly-2026-11-16.data.json`（計画）・`.dry.json`・`.apply.json`・`.dry2.json`。

## (1) 一次の取り直し（素の curl・1 本ずつ・1.5 秒あけ・ブラウザのふりをする UA なし）

| | URL | 取得（JST） | HTTP・バイト | 確かめたこと |
|---|---|---|---|---|
| (a) | https://www.eic.or.jp/eic/topics/2026/st_r08/ | 09:50:52 | 200・14,459 | 先頭「2026.10.28｜【R8】二次公募の採択結果」・続いて 09.24 一次の採択結果／08.27 二次公募のお知らせ／07.09 公募のお知らせ。**「三次」を含む見出し 0** |
| (b) | https://www.eic.or.jp/eic/topics/2026/st_r08/2ndrst/ | 09:50:55 | 200・15,088・sha256 先頭 `44d60e4c8e7a0159`（ユウの取得と同じ） | 「採択案件を別添のとおり決定しましたので、お知らせします。」1 回・「2026.10.28」 |
| (c) | https://www.eic.or.jp/eic/topics/2026/st_r08/1st/ | 09:50:57 | 200・18,544 | 「【公募は終了しました】」1 回・「三次」0 |

- (a)〜(c) とも便の条件どおり → 3 op とも進めた。`result02.pdf` は開いていない（取りもしていない・ユウが 11/16 と 11/17 に 2 者を確かめ済み）。
- 一時物: `C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\sub1117\prim\`（3 本と応答ヘッダ）。

## (2) PATCH（dry run・本実行・冪等）

```
[dry run 09:51]  ■ PATCH subsidies/moe-storage-parity-r08（k3vt2k7favbr）ops 3（適用済み 0）→ status 4→6字・deadline 21→61字・scheme 407→605字
                 [done] PATCH 1 / POST 0 / skip 0 / 中止 0 / 失敗 0・生の文字列の突き合わせの不一致 0・GET 2
[本実行 09:51:46〜09:51:50]
                 ■ PATCH subsidies/moe-storage-parity-r08（k3vt2k7favbr）ops 3（適用済み 0）→ status 4→6字・deadline 21→61字・scheme 407→605字
                    #106/#122: ✓ 送信 3 field 一致・他 field 変化 0
                 [done] PATCH 1 / POST 0 / skip 0 / 中止 0 / 失敗 0・不一致 0・GET 3・PATCH 1
[書込後の dry run] ■ PATCH subsidies/moe-storage-parity-r08（k3vt2k7favbr）[skip] 全 3 op 適用済み（冪等）
                 [done] PATCH 0 / skip 1 / 中止 0 / 失敗 0・GET 2
```

- 書込前の値（dry run の GET）は便 §1 の「当サイトの今の値」と同じ（status `["受付終了"]`・deadline「2026年10月2日（金）正午必着【厳守】」・scheme の末尾「…2026年10月5日時点で三次公募の告知なし。出典: …/1strst/」）。
- 書込後: status `["採択結果公表"]`・deadline「2026年10月2日（金）正午必着【厳守】（二次公募は終了。二次公募の採択結果は2026年10月28日にEIC機構が公表）」・scheme の末尾「…二次公募は2026年10月2日（金）正午で締切。【2026-11-17 更新】二次公募（2026年8月27日〜10月2日正午）の採択結果を2026年10月28日に公表（EIC機構の採択事業者一覧に2者掲載: オンサイトPPAモデル1・自己所有モデル1。件数は編集部集計）。2026年11月17日時点で三次公募の告知なし（EIC機構の公募ページは「【公募は終了しました】」と掲示）。出典: …/1strst/ ／ …/2ndrst/」。
