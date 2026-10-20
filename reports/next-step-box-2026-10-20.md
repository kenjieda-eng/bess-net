# 次の一歩便 — ツール・変電所・案件・解説・ニュースに「運営元からのご案内」を置いた（2026-10-20）

**結論**: 共通の部品 `NextStepBox`（運営元からのご案内）を作り、次の所に置いた。

- ツール 7 ページ
- 変電所の詳細（全件）
- アグリゲーター一覧
- 案件の詳細
- ニュース（category が「投資」「開発計画」のもの）
- 解説 11 本

枠の中のリンクのクリックを、GA4 の `next_step_click`（step_variant・step_to）で数える（枠の表示は数えない）。

画面の文は便に書いた文のままにした。ビルドした HTML の枠 1,661 個を機械で比べ、文とリンクの行き先は全部一致した。

**置かなかった所**:

- §3 の 7 ページと、入口のページ: 枠は 0。
- 解説 2 本・ニュース 21 本・案件 73 本: 理由は (2)。
  - EPRX の数値で外したのは 33 本。
    - 便に書いてある「EPRX の資料の数値（落札単価・約定量・上限価格の数など）を本文に出している記事」に当たるもの: 解説 1・ニュース 1。
    - 同じページの関連カード（「この解説の先へ」「関連解説」）の題・導入文に出るもの: 解説 1・ニュース 16・案件 14。
  - 便に無い除外で外したのは 63 本: 編集部のお知らせ 1・noindex のニュース 3・noindex の案件 59。
  - 題・導入文・出典も判定に入れた。いまのデータで、これだけが理由で外れたページは 0。

- commit: `7639cd5`（21 ファイル）
- microCMS: 書込 0（調べ役の GET だけ）

---

## (0) 前提

- 読んだ便ファイル: `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\次の一歩便_ツール・変電所・案件・解説・ニュースに運営元からのご案内_EPRXの6ページは保留_コードのみ_Claude_Code投入_2026-10-17起草_ユウ.md`
  - 9,705 バイト
  - 更新 2026-10-17 19:00:55 JST
  - sha256 `b19f41525a4d6129124fb20725cc51d843638f4d83966e6c22c7f2de50074a43`
- 依存（「運営者の入口と紹介の依頼便」の後）: 満たしている。
  - 行き先の `/start/operate` は `1c5538f` で本番に出ている（2026-10-20 09:18 の Vercel success）。
- 進め方:
  1. 下調べ（調べ役）: 解説 13 本の本文、ニュースの対象 327 件、案件の status、置く位置を調べた。
  2. 反証役: 下調べの判定を確かめ直した。
  3. 実装・ビルド。
  4. 読取専用のレビュー: 便 §4 の観点を「文」「置き場所」「コード」の 3 つに分け、各指摘を反証役が確かめた。
  5. 指摘を反映して、作り直してビルド（2 回目）。
  6. 2 回目のビルドの後に、asset-check の台帳 D7 の行番号を直した（(7)）。ビルドはしていない。単体の `verify:asset-check` で確かめた。
  7. push。本番のビルドの prebuild で、直した台帳が通ることを確かめた（(4)）。

---

## (1) 置いたページ

数は、ローカルのビルド（2 回目・2026-10-20 09:49〜09:53）で事前生成された HTML の数（HTML の走査は 10:10）。都度描画のページ（事前生成されない案件・ニュース）も、同じ判定で枠が付く。

**ツール 7**（どれも「ツールの結果は、評価や査定ではありません。」の 1 文つき）

| ページ | 種類 | 置いた位置 |
|---|---|---|
| `/tools/asset-ledger` | sell | シートと列の後・「データの扱いと免責」の前 |
| `/tools/asset-check` | asset | 関連の後・「出典（主の一次）」の前 |
| `/tools/grid-connection-check` | land | 使い方の後・訂正履歴の前（出典・免責の節が無い） |
| `/tools/noise-check` | land | 関連の後・出典の前 |
| `/tools/fire-risk-check` | operate | 参考規格・法令の後・「重要な注意事項」の前 |
| `/tools/subsidy-match` | buy | 使い方の後・訂正履歴の前（出典・免責の節が無い） |
| `/tools/lcoe-lcos` | buy | 結果の後・「出典・前提・免責」の前 |

**変電所・一覧・案件・ニュース**

| ページ | 種類 | 数 | 他社の 1 行 |
|---|---|---|---|
| `/grid/[slug]`（変電所の詳細） | land | 1,082 | なし |
| `/operators/aggregators` | operate | 1 | なし |
| `/projects/[slug]` | introduce（稼働中）139・land（それ以外）155 | 294 | 294 ページとも |
| `/news/[slug]`（投資・開発計画） | introduce | 266 | 266 ページとも |

- 案件の 294 のうち 42（introduce 22・land 20）は 301 の元（`src/lib/projects-301.ts` の左辺 46 本のうち）。
  - 本番では正規の URL へ 301 するので、訪問者には出ない。
  - 訪問者に出る事前生成の案件ページは 252（introduce 117・land 135）。

- `grid` 直下の HTML は 1,093 本。そのうち枠の無い 11 本は詳細ではない。
  - エリアのページ 10（chubu〜tokyo）と、都道府県別の一覧 `/grid/prefecture` の 1 本。
  - 県ごとのページ（`/grid/prefecture/<県>` 41）・`/grid/chubu/map`・`/grid/tokyo/status` も枠 0。
- 案件の「稼働中」は、既存の status の先頭が「稼働中」かどうか（`isCodRealized`）で判定した。
  - レビューで 367 ページの status・バッジ・種類を突き合わせ、取り違えは 0 だった。

**解説 11 本**（表 13 本のうち、保留の 2 本を除く全部）

| slug | 種類 |
|---|---|
| bess-ma-valuation | asset |
| bess-investment-funds | introduce |
| dscr-llcr-bess-pf | introduce |
| bess-pf-merchant-vs-multiuse | introduce |
| debt-service-reserve-account | introduce |
| pf-sponsor-guarantee | introduce |
| bess-irr-sensitivity | introduce |
| bess-business-decision-tree | buy |
| om-service-selection | operate |
| bess-degradation-monitoring-operations | operate |
| bess-insurance-guide | operate |

- 解説の表は `src/data/next-step-explainers.ts` の 1 か所に置いた。
- 非表示の解説（`explainer-excluded`）は 3 本で、表の 13 本はどれも入っていない。

---

## (2) 置かなかった解説・ニュース・案件と理由

**解説 2 本**

| slug | 理由 |
|---|---|
| multi-use-operation-strategy | 本文が EPRX の ΔkW 上限価格の金額を出している（第2節「15.00円/ΔkW・30分」「10.00円/ΔkW・30分」「7.21円/ΔkW・30分」） |
| bess-depreciation-tax | 本文には EPRX の数値が無い。ただし、本文の後の「この解説の先へ」に出る関連解説の題に、上限価格の数（「19.51円→15円→10円」）がある |

**ニュース 21 本**（投資・開発計画で、詳細ページが表示される 287 本のうち）

| 理由 | 本数 | slug |
|---|---|---|
| 本文に EPRX の数値（「15円/ΔkW」） | 1 | pr-2026-04-22-co30719-100 |
| 関連解説のカードに EPRX の数値（balancing-price-cap-10yen-explainer の題「19.51円→15円→10円」・導入文「15.00円/ΔkW・30分から10.00円/ΔkW・30分」） | 16 | pr-2026-05-07-taokeenergy-25・pr-2026-05-01-co14485-695・pr-2026-03-27-co176494-12・pr-2026-02-24-co57160-11・pr-2026-01-13-co99591-13・pr-2025-11-13-gridbeyond-21・pr-2025-09-01-ntt-62・pr-2025-08-20-co76147-199・pr-2025-08-06-co67590-488・pr-2025-05-23-ntt-56・pr-2025-03-04-daigas-100・pr-2025-02-25-co86244-44-2・pr-2025-02-25-co86244-44・pr-2025-02-07-co3442-6118・pr-2024-11-29-daigas-77・pr-2022-09-21-co32407-2185 |
| サイト自身のお知らせ（category に「編集部」） | 1 | news-2026-003-projects |
| noindex の記事（news-excluded） | 3 | pr-2026-04-16-enne-231・pr-2025-10-29-co136212-94・pr-2025-10-14-co111100-119 |

- 投資・開発計画のニュースは全部で 327 本ある。そのうち 40 本は、主題ゲートで詳細ページが 404 になる（表示されない）。

**案件 73 本**（事前生成された 367 本のうち）

| 理由 | 本数 | slug |
|---|---|---|
| noindex の除外案件（`EXCLUDED_PROJECT_SLUGS`） | 59 | （一覧は src/lib/projects-excluded.ts） |
| 関連解説のカードに EPRX の数値（同じ balancing-price-cap-10yen-explainer。枠のすぐ上・間に他の節なし） | 14 | 稼働中 8＝hirasol-izumizaki-bess・pr-co149815-bess・pr-co161802-bess-4・pr-co175281-bess・pr-co53091-chiba・pr-co86244-mie-tsu・pr-taokeenergy-mie-2mw・tamba-megapower／それ以外 6＝pr-co116500-bess-2・pr-co13775-bess・pr-co16325-bess・pr-co70816-bess-2・taoke-kakamigahara-no2・taoke-tahara-mutsure |

- 14 本のうち 4 本（pr-co116500-bess-2・pr-co16325-bess・pr-co175281-bess・pr-co70816-bess-2）は 301 の元で、本番では表示されない。表示されるのは 10 本。

**判定のしくみ**

- 判定は `src/lib/next-step.ts` で、ビルド時と描画時の文字だけで行う。runtime の microCMS は足していない。
- ISR で描き直すたびに同じ判定が走るので、関連カードが入れ替わってもその場で効く。
- 判定に入れる文:
  - 解説: 題・導入文・本文・出典と、「この解説の先へ」に実際に出す行
  - ニュース: 題・導入文・タグ・本文・出典名と、関連解説のカード
  - 案件: 名前・本文と、関連解説・関連ニュースのカード
- 文の判定のほかに、確かめて保留にした 3 件（解説 2・ニュース 1）は、`src/data/next-step-explainers.ts` の `NEXT_STEP_HELD` に slug で固定した。
  - この 3 件は、文や関連カードが変わっても置かない。
  - bess-depreciation-tax の理由は、関連カードの題だけ。見直すときは一覧から外す。

**置いたが、境目のもの**（報告だけ。迷ったら外す側には倒していない）

| ページ | 何があるか | 置いた理由 |
|---|---|---|
| `/tools/asset-ledger` | 列の見出し「平均落札単価(円/ΔkW・30分)」 | 単位の表記だけで、数値は無い。便 §2 が置く所に明記している |
| `/tools/asset-check` | EPRX の取引ガイドの定義の逐語（ΔkW約定量・アセスメントⅠ／Ⅱ） | 数値は無い。便 §2 が置く所に明記している |
| ニュース pr-2026-04-20-tsp-20 | 需給調整市場を収益源に挙げた自社の試算（想定総売上 約8,300万円など） | EPRX が公表した値ではなく、自社の想定 |
| 解説 bess-ma-valuation（asset） | 本文「4. 典型的取引価格」の金額 | EPRX の数値ではない。ただし出典が特定できない（同じ日の売買事例の研究便 `reports/deals-research-2026-10-20.md` で、一次で裏づかないと判定）。本実行便でこの節を外す予定と便にある |

---

## (3) 文の機械比較

1. **便の表と部品の比較**（レビューの文の役）
   - 便 §1 の表 6 行と 4 つの文（小さな一行・共通の 1 行・他社の 1 行・ツールの 1 文）を、`NextStepBox.tsx` の定数と完全一致で比べた。
   - 結果は全部一致。空白も同じ字で、違いは「2 機目」の半角スペース 1 か所（便と部品の両方に同じくある）。
2. **ビルドした HTML の比較**（2 回目のビルド）
   - `.next/server/app` の HTML を全部走査した。`<!-- -->`・script・style を外し、枠の中の文の並びとリンクを、便から組んだ期待値と比べた。
     - 文の並び: 運営元からのご案内 → 見出し → 本文〔＋ツールの 1 文〕→ リンクの文 →〔他社の 1 行＋〕共通の 1 行
     - リンク: 文・href・data-next-step
   - 枠 **1,661 個で不一致 0**。
   - 「運営元からのご案内」の出現数は、どのページでも枠の数の 2 倍（aria-label と小さな一行）で、枠の外には 0。
3. **ページごとの確認**（`nextstep_check.py local`）
   - ツール 7・アグリゲーター一覧・解説 11 本は、種類・文・リンク・切り替えの 1 文がすべて OK。
   - 置かない所 21 ページは「運営元からのご案内」0。§3 の 7 ページ・入口のページ・保留の解説 2 本を含む。

---

## (4) 検査

- `npm run type-check`: エラー 0。
- `npm run build`: BUILD EXIT 0。
  - 1 回目は 09:16〜09:19。
  - 2 回目はレビューの反映後で、09:49〜09:53（ログの最終書込 09:53:29）。
  - 枠の集計と文の比較は 10:10。
- `npm run verify:next-step`（新しく作り、prebuild に入れた）: 拾う形 19・拾わない形 8・判定 18 の試験が、すべて通った。
- `verify:asset-check` の WARN 1 件のほかは、prebuild の検査（`verify:contact-links`・`verify:corrections` ほか）はすべて OK。
- `verify:asset-check`: WARN 1 件（D7 の行番号のずれ）が、1 回目と 2 回目のビルドの両方で出た（build_ns2.log 686 行）。
  - 台帳は、2 回目のビルドの後（09:57）に直した（(7)）。
  - 直した後に単体で `npm run verify:asset-check` を回し、「ok 設問・採点・前提・一次・禁止語・保存なし」になった（09:58）。
  - 本番のビルド（`9d282cf`・Vercel のログ 2026-10-20T01:13:01Z）の prebuild でも ok（WARN 0）。同じビルドで `verify:next-step` も ok。
- **枠と EPRX の数値が同じページに出ないか**:
  - ビルド HTML の見える文を、判定と同じ整え方と式で走査した。
  - 当たったのは `/tools/asset-ledger` の列の見出し 1 件だけ（(2) の境目）。ニュース・解説・案件・変電所では 0。

**読取専用のレビュー**（ワークフロー・12 体）

- 観点は 3 つ（文・置き場所・コード）で、指摘は 17 件。
- 反証役が実在を確かめたのは 9 件（中身は 5 つ）。全部直してから push した。

| 指摘 | 直したこと |
|---|---|
| 解説の判定を直した後のコードでビルドしていなかった（1 回目のビルドでは解説の枠が 5 本だけで、6 本が画面に出ない関連の題で外れていた） | 作り直してビルドした。解説は 11 本、bess-ma-valuation の asset も文の比較を通った |
| 案件は関連カードの EPRX の数値を見ていなかった（14 ページ） | `projectNextStep` を足し、関連解説・関連ニュースのカードと本文を判定に入れた |
| EPRX の数値の式が 3 形だけで、すり抜ける書き方があった（∆・⊿・全角・タグや実体参照を挟んだもの・「15円から10円」・Δ の無い「円/kW・30分」など） | 判定の前に、タグを空白にし、実体参照を戻し、NFKC をかけるようにした。式も広げ、試験に固定した。いまのデータで置く・置かないが変わったページは 0 |
| 題・導入文・タグ（ニュース）を判定に入れていなかった | 入れた。あわせて出典（解説）・出典名（ニュース）も入れた（いまのデータで変わったページは 0） |
| 「この解説の先へ」の組み立てが、表示と判定の 2 か所にあった（#119・#121 と同じ型） | `explainerNextStepView` に 1 つだけ置き、表示と判定が同じ結果を使うようにした |

- 報告に回した注記: 置いた位置のずれ・境目のツール 2・便に無い除外・`--color-border` が未定義など。
  - 枠線の色は、サイトの線の色 `--color-line` に直した。
  - 背景（#f8fafc）は変えていない。

**375px と PC**

- 1 回目のビルドを `next start` で開き、内蔵ブラウザで 375px と PC の幅にして見た。
- 枠は折り返し、はみ出しは無い。
- 案件とニュースの詳細には 375px で横のはみ出し（約 460px）があるが、これは前からのもので、枠の外。
  - 案件: 情報欄の dt/dd。ニュース: 長い URL のリンク。
  - 本番（枠を置く前）でも同じだったことを確かめた。この便の範囲の外として残した。
- asset-check の横のはみ出しは、overflow:auto の表の中に収まっている。

**`next_step_click`**

- 掃除便で置いた `ContactClickTracker` に足した。
  - `data-next-step` の付いたリンクのクリック（中クリックを含む）で、`next_step_click`（`step_variant`・`step_to`）を送る。
  - `gtag` が無ければ何もしない。
- 本番で実際に送られるかは (5) で確かめた。

---

## (5) 本番 curl

- push: `7639cd5`（コード）と `9d282cf`（売買事例の研究便の報告）を 1 回で push した。
- Vercel success: 2026-10-20 10:19:41 JST（`9d282cf`）。
- 照合: 10:20:00〜10:21:08 JST（35 ページは 10:20:00〜10:20:54、関連カードで外した 2 ページは 10:21:07〜10:21:08）。素 URL（クエリ無し・キャッシュ回避のヘッダ無し）を使い、`<!-- -->`・script・style を外した初期 DOM で見た。

**便 §4 の「本番で確かめること」**

1. 各種類から 1 ページずつ、枠が初期 DOM にある。文・リンクの行き先・切り替えの 1 文が、便と一致した（`nextstep_check.py prod`・RESULT OK）。

   | ページ | 種類 | HTTP | x-vercel-cache | age |
   |---|---|---|---|---|
   | ツール 7（asset-ledger・asset-check・grid-connection-check・noise-check・fire-risk-check・subsidy-match・lcoe-lcos） | sell・asset・land・land・operate・buy・buy | 200 | PRERENDER | 0 |
   | `/grid/cb-1` | land | 200 | PRERENDER | 0 |
   | `/operators/aggregators` | operate | 200 | PRERENDER | 0 |
   | `/projects/arao-bess`（稼働中） | introduce | 200 | PRERENDER | 0 |
   | `/projects/adw-higashiura-bess`（それ以外） | land | 200 | PRERENDER | 0 |
   | `/news/correc-okayama-sannyu-2026-08` | introduce | 200 | PRERENDER | 0 |
   | `/explainer/bess-ma-valuation` | asset | 200 | PRERENDER | 0 |
   | `/explainer/bess-irr-sensitivity` | introduce | 200 | PRERENDER | 0 |

2. §3 の 7 ページに「運営元からのご案内」は 0。どれも 200・PRERENDER・age 0。
   - 対象: balancing-benchmark・balancing-revenue・residual-value・irr-simulator・tracker/balancing-rules・tracker/imbalance・capacity-market-bid
   - 入口のページ（/start の 4・/anken・稼働中蓄電所のご紹介・/contact・/contact/buyer・/buyer/investor・/seller/developer・/lv・トップ）も 0。
   - 保留の解説 2 本も 0。
   - トップだけは HIT・age 35 で、ほかは PRERENDER・age 0。
3. 他社の案件のページ（案件 2・ニュース 1）に「このページの案件の売買を仲介・紹介するものではありません。」が 1 回ずつある。
4. 関連カードを理由に外したページでも、本番で枠が 0 になっていることを確かめた。関連解説の題「19.51円→15円→10円」が出ているのは確認済み。
   - `/projects/hirasol-izumizaki-bess`: 200・PRERENDER・age 0
   - `/news/pr-2025-09-01-ntt-62`: 200・PRERENDER・age 0
5. **`next_step_click`**: 内蔵ブラウザで本番の `/tools/asset-check` を開いた。
   - `gtag` を記録用の関数に差し替えて、GA には送らないようにした。そのうえで枠のリンク 2 本をクリックし、遷移は止めた。
   - 結果: `next_step_click` が `{step_variant: "asset", step_to: "/start/sell"}` と `{step_variant: "asset", step_to: "/info/operating-bess-introduction"}` の 2 回送られた。
   - 枠の外の普通のリンク（`/`）のクリックでは送られない。

**30 分監視**（2026-10-20 10:50:00 JST・Vercel success 10:19:41 の 30 分後・素 URL）: 上の照合を同じ 35 ページでもう一度通し、**RESULT OK**（置く所 14・置かない所 21）。

| ページ | HTTP | x-vercel-cache | age |
|---|---|---|---|
| `/tools/asset-check` | 200 | HIT | 1799 |
| `/tools/subsidy-match` | 200 | HIT | 1796 |
| `/grid/cb-1` | 200 | HIT | 1771 |
| `/projects/arao-bess` | 200 | HIT | 452 |
| `/projects/adw-higashiura-bess` | 200 | STALE | 1770 |
| `/news/correc-okayama-sannyu-2026-08` | 200 | STALE | 1769 |
| `/explainer/bess-ma-valuation` | 200 | STALE | 770 |
| `/explainer/bess-irr-sensitivity` | 200 | STALE | 1769 |
| `/operators/aggregators` | 200 | HIT | 1795 |

- STALE は、ISR の作り直しの間に前の版を返したもの。前の版も同じ deploy（10:19）の HTML なので、枠と文は一致している（照合は返った HTML で行った）。
- `vercel ls` の Production は、上から 3 本（39 分前・1 時間前・2 時間前）とも Ready。Error は無い。
- microCMS からの警告メールと、EDAさんからの連絡があったかどうかは、CC からは確かめられない。

---

## (6) 私（ユウ）の前提違い（逐語で）

1. 便 §2「ニュースだけは「出典」の後、関連記事の前（記事と出典を続けて読めるように）」
   - ニュースのテンプレートでは、関連の節（本文で言及された事業者・関連プロジェクト・関連解説・このニュースの先へ）が全部「出典」より前にある。
   - 出典の後に続くのは、タグ・訂正履歴・一覧へ戻るリンクだけ。
   - 「出典の後」と「関連記事の前」は両立しないので、**出典の後・タグの前**に置いた。
2. 便 §2「本文（結果・説明）の後、「出典」「データの扱いと免責」の前」
   - 次のページは、文字どおりには置けなかった。既存の並びは変えていない。
     - `/tools/grid-connection-check`・`/tools/subsidy-match`: 出典・免責の節が無い → ページの末（訂正履歴の前）に置いた。
     - `/tools/fire-risk-check`: 出典にあたる「参考文献・関連情報」が client 部品の中にある → その後、「重要な注意事項」の前に置いた。
     - `/tools/asset-ledger`: 出典の節が無い → 「データの扱いと免責」の前に置いた。
     - `/projects/[slug]`: 出典は情報欄の中（本文より前）にある → 関連の群の後・免責の前に置いた。
3. 便 §2「解説とニュースは、置く前に本文を確かめる: EPRX の資料の数値…を本文に出している記事には置かない」
   - EPRX の数値は、本文の外にも出る。同じページの関連カードに出るのは、ニュース 16 本・解説 1 本・案件 14 本。
   - §0「迷う所は置かずに報告へ」に従い、関連カード・題・導入文・出典も判定に入れた。案件は便に「本文を確かめる」の指示が無いが、同じ扱いにした。
4. 便「いま」の「変電所の詳細（約 8,300 ページ）」
   - 事前生成される詳細は 1,082 ページ。残りは都度描画で、同じ枠が付く。

---

## (7) 申告・一時物

- **掃除便の取りこぼしを直した**: 掃除便（`e68e4e2`・10/17）で `src/app/grid/[slug]/page.tsx` に行を足したため、`verify:asset-check` の台帳（`reports/tool-asset-check-questions-2026-10-10.data.json`）の D7 が指す行番号がずれていた。
  - それ以来、本番のビルドでも WARN 1 件が出ていた（prebuild は警告だけで止まらない）。
  - この便では import 1 行（39 行目）と枠 3 行（748〜750 行目）を足した。
    - D7 の 8 行のうち、前の 5 行はさらに 1 行、後ろの 3 行はさらに 4 行ずれた（e68e4e2 の分と合わせて +2 と +5）。
  - 行の中身で写像して `[469, 473, 509, 513, 515, 759, 761, 767]` に直した。
    - 単体の `verify:asset-check` と、本番のビルドの prebuild で ok（(4)）。
- **調べ役の誤ったドメインへの取得**: 本番の取得で、最初に `https://chikudenchi.net/explainer/<slug>` へ 13 回 GET した。
  - ドメインを確かめずに推測したもので、全件 404。クエリも本文も付けていない。
  - そのあと `bess-net.jp` で取り直した。
- **microCMS**: GET だけ。書込 0。数は scratchpad/ns1017/cms の保存物と各役の申告から数えた（ローカルのビルド 2 回の取得は含めない）。
  - 解説: 計 20 リクエスト。
    - 10/17: 13 本を 1 本ずつ（13）と、全 263 件（4）。
    - 10/20: 全 263 件（3）。
  - ニュース: 計 86 リクエスト。
    - 10/17: 全件 15 リクエストを 2 回（本文つき・category だけ）。
    - 10/20: 全件 15 リクエストを 3 回（調べ役 2 体と反証役）と、slug で 1 件ずつ 11 回。
  - 案件: 計 9 回（10/17 に 5 回・10/20 に 4 回）。
  - レビュー役 12 体は、microCMS 0。
  - `.env.local` は `set -a` で読み込んで使っただけで、値は表示していない。
- **ブラウザ**: 内蔵ブラウザを CC が使った。
  - ローカルの `next start` で 375px と PC の確認をした。
  - 本番で `next_step_click` の確認をした（(5)）。
  - 調べ役・レビュー役は、ブラウザを使っていない。Claude in Chrome は誰も使っていない。PDF は開いていない。
- **本番への curl**（読むだけ）: CC の照合のほかにもある。microCMS の書込は 0 なので、#127 には当たらない。
  - 調べ役: 解説 13（10/17 21:52・chikudenchi.net の 13 回の後）とニュース 6（10/20 08:57〜08:59）
  - 下調べの反証役: 37 ページ（09:02〜09:08）
  - レビューの反証役: 18（09:40〜09:44）
  - 文と置き場所のレビュー役: 0
- **事実確認**: この報告そのものを、読取専用のワークフロー（6 体）でビルド・リポ・本番の保存物と突き合わせた。
  - 指摘は 20 件で、反証役が全部を実在と確かめた。全部この報告に反映した。
  - 主なもの: ビルドの時刻、asset-check の WARN が 2 回目のビルドにも出ていたこと、置かなかった理由の内訳、microCMS の GET の回数。
- **git**: 新しい 4 ファイルを差分に入れるため `git add -N` を使った。そのあと名前を指定して commit した。
  - prebuild の生成物（`src/data/substations/*.json` など）は commit していない。
- **削除**: 0。
- **一時物**（消していない）:
  - `scratchpad/ns1017/` の下: `cms/`（GET の保存物）、`tools/`（調べ役・レビュー役・CC のスクリプト）、`build_ns1.log`・`build_ns2.log`・`diff_ns.patch`・`diff_ns2.patch`・`boxes_build2.json`・`boxes_html2.json`・`review_result.raw`・`factcheck_result.raw`・`vercel_9d282cf.log`・`grid_old.tsx`・`prod2/`・`prod30/` ほか
  - 開いていた `next start` のプレビューは、2 回目のビルドの前に止めた。
  - 0 バイトのファイルは、下の残骸のほかに 15 個ある。どれも消していない。
    - `cms/prod_explainer/*.html` の 13 個: 誤ったドメイン chikudenchi.net の 404 で、本文が 0 バイト。
    - `tools/rv_code/tsc.log`・`tools/f2/tsc.log`: レビュー役の型検査。エラー 0 で出力 0。
  - 本番の照合の 1 回目で、Git Bash がパスの引数（`/grid/cb-1` など）を Windows のパスに書き換えた。
    - その結果、curl が URL として受け付けず失敗し、0 バイトの残骸 `scratchpad/ns1017/prod2/__Program Files__Git__grid__cb-1.hdr` が 1 つできた。消していない。
    - 外への送信は無い（curl は URL の段階で止まった）。
    - `MSYS_NO_PATHCONV=1` を付けて取り直した。
