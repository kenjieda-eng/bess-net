# BY 中国 本実行便 — 中国電力ネットワークの予想潮流を 10/28 の版に更新した（2026-11-17・CC・`_QUEUE.md` 119 行）

## (0) 絶対パス・読んだもの・時刻・HEAD

- 便: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\BY_中国_本実行便_予想潮流を10月28日版に更新_裁定どおり_Claude_Code投入_2026-11-16起草_ユウ.md`
  - 8,074 バイト・最終更新 2026-11-16 10:07 JST・sha256 `b49785af3a4da121c4c866fe7ef6f7540cc2586d6496c1bfeca44a8b38edb543`
- 裁定: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\02_計画・運営\検証記録_BX中部・BY中国dry-run_確かめと裁定の案_2026-11-15_ユウ.md` の「BY 中国」1〜5（10,853 バイト・sha256 `6e626a945551d6eb…`・EDAさん 11/16 10:03「任せます」）
- GO: `_QUEUE.md` 119 行（ユウ 11/17 09:2x・EDAさん 09:19「全て進めて」・3 本目）。118 行（BX）は版が新しかったため書込せず停止＝DONE にしてから、この便の書込に入った。
- 報告: `C:\Users\kenji\Documents\GitHub\bess-net\reports\grid-chugoku-2026-11-17.md`（本書）
- 計画: `scripts/experimental/chugoku/update_plan_202611.json`・書込の記録: `reports/grid-chugoku-2026-11-17.apply.json`・`.apply.jsonl`
- 解析: `scripts/experimental/chugoku/parse_chugoku_csv_2611.py`（`--emit-plan`・`--baseline`・`--out-json`・`--n1-out`・`--plan-out`・`--fetched-on` を足した。11/15 の dry run の記録は上書きしていない）
- baseline: `scripts/experimental/chugoku/baseline_live_2611b.json`（11/17 10:07 の GET）
- HEAD: 計画を作った時点 `5f05131`（118 行の commit・origin/main と同じ）。

## (1) 版の確認（11/17 10:04:59〜10:05:14・素の curl・1 本ずつ・2 秒あけ・ブラウザのふりをする UA なし・書込の前）

- 公表ページ `https://www.energia.co.jp/nw/service/retailer/keitou/access/`: HTTP 200・30,114 B・`<title>`「系統アクセス情報の公開 | 中国電力ネットワーク」。「系統の予想潮流等に関する情報」の欄は「**2026年10月28日更新**」のまま。ZIP の href は `zip/csv_{220kv,tori,shima,oka,hiro,yama}.zip` の 6 本（11/15 と同じ）。
- ZIP 6 本を取り直した（どれも HTTP 200・Last-Modified 2026-10-28 10:00 JST）。**6 本とも、リポの `scripts/experimental/chugoku/zip_202611/`（11/15 の取得物）と sha256 が同じ**:

| ZIP | バイト | sha256 先頭 16 桁 |
|---|---:|---|
| csv_220kv | 3,206 | `16af7a4b978cdf50` |
| csv_tori | 6,146 | `f82a3626b7890c83` |
| csv_shima | 10,736 | `a5c5ac823ea4cb78` |
| csv_oka | 14,857 | `b7601ba0a90b8759` |
| csv_hiro | 17,174 | `8d361a16d8fd8dbb` |
| csv_yama | 11,977 | `d01e9ad753f6192c` |

- tr のメンバー 27 本とも、1 行目は「2026年10月28日更新」（割れなし）。→ **10/28 より新しい版は出ていない** → 書込に進んだ。版の日付は全レコード 2026-10-28（#121）。
- 取得物と応答ヘッダは scratchpad（`…\scratchpad\by1117\`）。リポの `zip_202611/` はそのまま使った（同じバイト）。

## (2) 計画と 11/15 の dry run との差

- baseline: 11/17 10:07 の GET（`fetch_baseline.py`・`orders=-publishedAt` と id の重複検査を足した〔#124〕）874 件・totalCount 一致・id の重複 0。**11/15 の baseline（`baseline_live_2611.json`）とレコードの中身まで差 0**。凍結 1 件（`egz-kikan-x`）を除いて 873。
- 計画は `parse_chugoku_csv_2611.py --emit-plan` で作った（出力の dry run の記録は scratchpad）。裁定の想定（振り直し 2・西市 1・新規 3・凍結 1）や 11/15 の件数と 1 つでも違えば、計画を作らずに止める作りにした。
- 西市(変) の 66/6 の行は、前の版（`zip_202608`・7/27 版）・baseline・10/28 版のどれも **1 行だけ**（裁定 1 の条件・機械で確かめた）。

**差は 0**（西市の扱いだけ、便の見込みどおり「消滅＋新規」から「同じ設備の更新」に移った）:

| 項目 | 計画 | 11/15 の dry run・便の見込み |
|---|---:|---:|
| 新 CSV の行（注記行 30 を除外） | 875 | 875 |
| PATCH | **872**（マッチ 869＋振り直し 2＋西市 1） | 872 |
| うち値の変化 | **128** | 127＋西市 1 |
| うち external_id だけ（大原） | 1 | — |
| うち日付だけ | 743 | — |
| POST | **3** | 3 |
| 凍結（書込なし） | 1（`egz-okayama-s80004`） | 1 |
| 取込後の件数 | 875 | 875 |
| N-1 可（取込後・凍結を除く） | **69** | 69 |
| N-1 可否の変化・出力制御の変化・制約要因の変化 | 0・0・0 | 0・0・0 |
| 未算定で現値維持（N-1） | 6 | 6 |

- 列ごとの変化: 空容量（当該）62（dry run 61＋西市）・予想潮流 53・空容量（上位系等考慮）24・運用容量 3・設備容量 2・台数 2・external_id 3。N-1 量・N-1 可否・出力制御・制約要因・名称・電圧・県・notes は 1 件も書かない。
- PATCH の中身は 8/16 の `--emit-plan` と同じ作り: 数値 7 欄は CSV に値があるときだけ・N-1 と出力制御の未算定は現値維持・出力制御は「有り」を足すだけ。全件に `last_updated` 2026-10-28・`fetched_at` 2026-11-17・`source_url`（ZIP の URL）。
- **計画の機械検査**（scratchpad の `check_plan.py`）: **NG 0**。
  - パーサーを通さず、ZIP の `*_tr_*.csv` を直接読み（No. はホワイトリストの正規表現で受理）、計画を当てた後の値が CSV と一致することを全数で確かめた（875 行がちょうど 1 つずつ PATCH か POST に対応）。
  - id は baseline の id（#113）・before は baseline と同じ・送らない欄が patch に無い・last_updated／fetched_at は全件同じ・新規の slug は全国の slug と凍結に衝突しない・新規に notes が無い。
  - 故障注入 10 通り（空容量を 1 ずらす・西市の external_id を旧のままにする・西市の台数を落とす・新規の空容量をずらす・新規の slug を既存にする・新規に notes を入れる・凍結を PATCH に入れる・last_updated をずらす・N-1 未算定の現値を反転・名称を patch に入れる）は**全部落ちた**。
  - 検査を作る途中で、検査側の思い込みを 2 つ直した（名称非公開の行は CSV の名称が「-」で microCMS は「(名称非公開) energia_…」／未算定の 6 件は現値が false なので「false に潰す」故障は no-op＝「反転」に変えた）。計画は変えていない。

## (3) 振り直し 2 件・西市・新規 3 件・凍結 1 件

**No. の振り直し 2 件（裁定 3・8/16 裁定 1 と同じ）**: slug を保ち、external_id だけを更新した。旧 No. は `scripts/experimental/_common/external_id_history.json` に退避（19 → 22 件）。

| slug | 名称（電圧） | external_id | 値 |
|---|---|---|---|
| `egz-okayama-s0005-3` | 久世変電所（66/6） | `energia_okayama_岡⑤S5` → `…岡⑤S5-2` | 空容量 4 → **8**（ほかは同じ・3 台・38／33） |
| `egz-okayama-s0001-2` | 大原変電所（66/6） | `energia_okayama_岡⑥S1` → `…岡⑥S1-2` | 変化なし（1 台・9／9・空容量 7） |

**西市(変)（裁定 1・同じ設備として slug を保つ）**: `egz-yamaguchi-s0009-2`（66/6）の external_id を `energia_yamaguchi_山⑤S9` → `…山⑤S9-1` にし、値を 10/28 版にした: 台数 1 → **2**・設備容量 9 → **23**・運用容量 9 → **23**・空容量 0 → **2**。旧 No. は履歴に退避。備考（notes）は「※４」のまま（10/28 版の山⑤S9-1 も「※４」）。

**新規 3 件（裁定 4・どれも 66/22）**: slug は今の体系（`egz-{県}-s{番号}{枝番 4 桁}`・使用済みなら `-2`, `-3` …）で採番した。8/16 の玉造（`egz-shimane-s60001-2`）と同じ決め方。

| slug | 名称 | external_id | 中身（CSV のとおり） | 衝突を避けた理由 |
|---|---|---|---|---|
| `egz-okayama-s50001-3` | 久世変電所 | `energia_okayama_岡⑤S5-1` | 66/22・1 台・設備容量 9・運用容量 6・空容量 6・上位系 0・熱容量・N-1「不可 ♯３」→ false・出力制御 有り | `s50001` は国府市場（岡②S5-1）・`-2` は金光（岡④S5-1） |
| `egz-okayama-s10001-5` | 大原変電所 | `energia_okayama_岡⑥S1-1` | 66/22・1 台・9／6・空容量 6・上位系 0・熱容量・N-1 false・有り | `s10001`〜`-4` は草壁・三蟠・玉島ハーバーアイランド・御津 |
| `egz-yamaguchi-s90002-4` | 西市(変) | `energia_yamaguchi_山⑤S9-2` | 66/22・1 台・14／6・空容量 2・上位系 0・熱容量・N-1「不可 ♯２」→ false・有り | `s90002`〜`-3` は川棚・牟礼・末武 |

- 3 件とも prefecture（岡山県・山口県）・voltage_class「66kV系」・non_firm_eligible false・data_source_format CSV・source_url（ZIP）。
- **備考（notes）は入れていない**（便「備考は 8/16 と同じ扱い」＝8/16 の新規〔玉造〕も notes なし）。CSV の備考は 久世 S5-1「※５」・大原 S1-1「※４,※５」・西市 S9-2「※４,※５」。

**凍結 1 件（裁定 2）**: `egz-okayama-s80004` 湯原第一変電所（岡⑤S8-4）を `src/data/substations-frozen.json` に足した（9 → 10 件）。DELETE・301 はしない。microCMS は書いていない。
- reason: 10/28 版で公表対象外（同じ名称の S8-1〜S8-3 は掲載あり）・7/27 版でも値の無い行だった・名寄せで不在を確認・2026-11-16 裁定。
- **詳細の注記（note）は、ほかの凍結と違って「（〇年〇月〇日公表時点の値のまま）」を付けなかった**: 「この設備は中国電力ネットワークの2026年10月28日更新版の公表データに掲載がないため、更新を停止しています。最新の連系可否は中国電力ネットワークの事前相談窓口でご確認ください。」
  - 理由: このレコードの値（11/6 kV・1 台・空容量 4 MW）は 2026-05-07 の最初の取込のもので、last_updated（2026-07-27）の版では値が空欄だった（裁定 2「古い取込の値が残ったもの」）。「7月27日公表時点の値のまま」と書くと事実と合わない。ほかの日付を推測で書くこともしなかった（frozen の `_note_field`「原因を推測した表現を足さない」）。

## (4) 書込と照合

```
applier の dry run（10:11:49〜10:18:22・GET のみ）
[done] {"patched":0,"dry":872,"skip_done":0,"skip_changed":0,"failed":0,"posted":0,"post_dry":3,"post_skip":0}
[microCMS 呼び出し] GET 875・再送 0

本実行（10:18:35〜10:46:13・逐次 400ms・並列なし・reports/grid-chugoku-2026-11-17.apply.json／.apply.jsonl）
  POST egz-okayama-s50001-3 → id=e6s8mq29b5rf（全 22 field 一致・slug 1 件）
  POST egz-okayama-s10001-5 → id=gjexgvl2xv6（全 22 field 一致・slug 1 件）
  POST egz-yamaguchi-s90002-4 → id=3n-52ir2o（全 22 field 一致・slug 1 件）
[done] {"patched":872,"dry":0,"skip_done":0,"skip_changed":0,"failed":0,"posted":3,"post_dry":0,"post_skip":0}
[microCMS 呼び出し（HTTP 送信・再送込み）] GET 1753・PATCH 872・POST 3・再送 0
```

- PATCH は 1 件ごとに前後の GET で照合した（送った欄は送信値と一致・ほかの欄の変化 0・取り直し 0 件）。DELETE・PUT は 0。この API に webhook は無い。
- **GET 全件照合**（10:46:28・scratchpad の `verify_after.py`・GET 9）: **不一致 0**。
  - 877 件（書込前 874＋新規 3）・slug の重複 0。
  - 計画の 872 件は、送った欄が計画どおりで、送っていない欄は書込前と同じ（書込前に無かった欄に値が入ったもの 0）。
  - 書込の外の 2 件（凍結の `egz-kikan-x`・`egz-okayama-s80004`）は、中身も updatedAt も書込前と同じ。
  - last_updated: 2026-10-28 が 875 件（PATCH 872＋POST 3）。fetched_at: 2026-11-17 が 872 件（POST 3 件も 2026-11-17）。
  - N-1 可: 書いた 875 件のうち 69（計画どおり）。
- **新規 3 件は id ≠ slug**（POST の自動採番）。CLAUDE.md #113 の「増えたら、ここにも足す」のとおり、`next.config.js` の redirects に 3 件（`/grid/e6s8mq29b5rf` → `/grid/egz-okayama-s50001-3`・`/grid/gjexgvl2xv6` → `/grid/egz-okayama-s10001-5`・`/grid/3n-52ir2o` → `/grid/egz-yamaguchi-s90002-4`・permanent）を足し、CLAUDE.md #113 の件数を 3 → 6 件に直した（更新履歴にも 1 行）。

## (5) N-1 の三値

- `scripts/experimental/_common/build_n1_status.py` を回し直し、`src/data/n1-status.json` を更新した（10:4x・microCMS GET 84）。
  - §4（中国）の空欄か「－」かの判定を 10/28 版の ZIP（`chugoku/zip_202611`）で行うようにした（8/06・7/27 版は `zip_202608` に残置）。
  - §10 を足した（中国 10/28 版の未算定の一覧 `n1_undetermined_chugoku_2611.json` の 6 件を照らし、source を 10/28 版の取込にする。足りない行があれば足す）。
  - ★あわせて、§6（沖縄の公表 CSV のヘッダを GET で確かめるところ）がブラウザのふりをする UA（Chrome）を付けていたのを外した（2026-11-13 からの決まり）。既定の UA でも素の curl でも HTTP 200 で取れることを確かめてから外した。沖縄の結果（N-1 列の有無 6 本）は前と同じ。
- 変わったのは中国の 7 件だけ。件数 424 → **423**（湯原第一 S8-4 が凍結で外れた）。ほかの社の entry は変化 0:

| slug | 名前 | 変化 |
|---|---|---|
| `egz-okayama-s80004` | 湯原第一変電所 | **外れた**（凍結のため add() が入れない・ログ「凍結のため入れない: egz-okayama-s80004」） |
| `egz-kikan-s0006`・`egz-kikan-s0008`・`egz-kikan-s0016` | 新小野田・柳井火力・名称非公開（基S16） | as_of 2026-08-06 → **2026-10-28**・source を 10/28 版の取込に |
| `egz-shimane-s0001-3`・`egz-shimane-s0002`・`egz-shimane-s0003-3` | 西郷発電所・黒木発電所・海士変電所 | as_of 2026-07-27 → **2026-10-28**・source を 10/28 版の取込に |

- 6 件とも reason は undetermined のまま（10/28 版の CSV で N-1 欄が「－」等）。microCMS の n1_eligible は false のまま（boolean を潰していない）。as_of が last_updated（2026-10-28）と一致するので、表示は「未算定」のまま効く。
