# 運営者の入口と紹介の依頼便 — /start/operate の新設・入口 4 か所・取得の「あると話が早い」条件（2026-10-20）

**結論**: 蓄電所を運営している人の入口 `/start/operate`（蓄電所を運営している方へ）を新設した。あわせて次の入口と節を足した。

- 入口
  - トップ「あなたに合った入口へ」の 4 枚目
  - ヘッダー「はじめての方へ」の「運営している」
  - `/contact` の先頭の 2 枚（蓄電所の紹介を希望する方・蓄電所を運営している方）
  - `/start/sell` の「さらに詳しく」の 1 本
- 取得を考える人の「あると話が早い」条件
  - `/start/buy` に 6 点
  - `/info/operating-bess-introduction` に 5 点

画面の文は、便に書いた文のままにした（機械比較 68 本で全部一致）。

- commit: `1c5538f`（10 ファイル）
- microCMS: 書込 0（GET も 0）

---

## (0) 読んだ便

- `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\運営者の入口と紹介の依頼便_start-operate新設・トップとヘッダーと問い合わせに入口・取得の条件6点_コードのみ_Claude_Code投入_2026-10-17起草_ユウ.md`
  - 11,379 バイト・最終更新 2026-10-17 19:00:55 JST
  - sha256 `413a29d9acaeb78c2cba8a0d2f6ffaaa931826858012bc06a4d4fd0c749231a7`
- OneDrive の正本を読んだ。
- 依存の「入口の掃除と計測便」は DONE（`e68e4e2`・報告 `1ed94e6`）。相談のリンクは、その便で作った `src/lib/contact-link.ts` の `contactUrl` で作った。

---

## (1) 足したページと節

| 便 | ファイル | 位置・中身 |
|---|---|---|
| §1 | `src/app/start/operate/page.tsx`（新規） | `/start/sell` と同じ形（`force-static`・外部 API 0・`StartTrustBlock`・1 ページ＝1 CTA）。title／description・LEAD／パンくず「トップ / 運営している」／区分ラベル「はじめての方へ」／h1。続けて、こんな方へ（4）・できること（3・太字）・無料・情報（6 点）・そろっていなくても（前半太字）・資産台帳の文（「系統用蓄電所 資産台帳テンプレート」を `/tools/asset-ledger` へのリンクに）・流れ（3）・義務なし・StartTrustBlock・FAQ（3）・CTA の枠（上の文・ボタン・枠の下の法人名は `siteConfig.organization.name`）・さらに詳しく（5 本）。相談は `contactUrl({ campaign: 'funnel_operate', position: 'cta' })` |
| §1 | `src/app/sitemap.ts` | `/start/sell` の次に `/start/operate`（monthly・0.8＝ほかの `/start` と同じ） |
| §2(a) | `src/app/page.tsx` | 入口の配列を定数 `START_ENTRANCES` にし、`/start/sell` の次に 1 枚（title「蓄電所を運営している」・desc・href）。上の文は `{`立場に合わせて、${START_ENTRANCES.length}つの入口を用意しています。`}`＝「4つの入口」。並びは `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4`（(5)-2） |
| §2(b) | `src/components/SiteHeader.tsx` | `START_DROPDOWN` の「売りたい・案件がある」の次に `{ label: '運営している', href: '/start/operate' }` |
| §2(c) | `src/data/contact-pages-configs.ts`・`src/app/contact/page.tsx` | `CONTACT_INDEX_CONFIG.categories` の先頭に 2 枚（🤝 蓄電所の紹介を希望する方 → `/info/operating-bess-introduction`・⚡ 蓄電所を運営している方 → `/start/operate`）。最小の型の変更として `type` を任意にし、カードの key を `cat.url` にした。`/contact/[type]` のページは増えない（`generateStaticParams` は 5 区分のまま） |
| §2(d) | `src/app/start/sell/page.tsx` | 「さらに詳しく」の末尾に「蓄電所を運営している方へ」（`/start/operate`） |
| §3(a) | `src/app/start/buy/page.tsx` | 「できること」の節の後・「ご相談でよくあるテーマ」の前に、h2「蓄電所の取得・ご紹介を希望されるときに「あると話が早い」条件（6点）」・6 点・続く文（前半太字） |
| §3(b) | `src/app/info/operating-bess-introduction/page.tsx` | 「ご紹介の流れ」の節の後・「よくあるご質問」の前に、h2「ご紹介を希望されるときに「あると話が早い」条件」・5 点・続く文。冒頭のコメントに 10/17 の追加を 1 行。ほかの文は変えていない（本番の変更前と比べて、増えたのはこの節だけ） |
| — | `src/lib/contact-link.ts` | 既存名の一覧のコメントに `funnel_operate` を追記（コメントだけ） |

---

## (2) 文の機械比較の結果

- 便 §1〜§3 の文を逐語のまま一覧にした（scratchpad の `ent1017/tools/operate_textcheck.py`）。その 68 本を、ビルドした HTML の見える本文（`<!-- -->` を剥がし、script・style を除き、タグを外した文字の並び）と、部分一致で比べた。
- **68/68 一致**。ページ別の内訳は次のとおり。

  | ページ | 一致 |
  |---|---|
  | `/start/operate` | 45 |
  | トップ | 3 |
  | `/contact` | 4 |
  | `/start/sell` | 1 |
  | `/start/buy` | 8 |
  | `/info/operating-bess-introduction` | 7 |

- 細かな文字（「2 機目」「1 機目」「直近 12 か月」の半角空白・「O&M の」・「kW／kWh」の全角スラッシュ・「──」・「上の6点」）も一致した。
- 読取専用のレビュー役（便の文の観点）が、便ファイルから直接文を取り出して独立に比べた。結果は一致 65・不一致 0（「本文の最初: LEAD」という指示の行は比べる文ではない）。
- 同じレビュー役が、太字の範囲・番号つきと箇条の別・節の位置・/info のほかの文が不変であることも確かめた。
- 本番（素 URL）での同じ比較は (4)。

---

## (3) 検査

| 検査 | 結果 |
|---|---|
| `npm run type-check` | OK |
| `npm run build`（`.env.local` を読み込んで 2 回） | 2 回とも `BUILD EXIT 0`。`/start/operate` は ○（Static） |
| `scripts/verify-contact-links.ts --html .next/server/app` | 5,590 ページ・6,227 本が全部 UTM つき（`funnel_operate` 1 本が増えた） |
| 入口の掃除と計測便の検査（`cleanup_check.py`・ビルド HTML） | OK のまま（トップの 4 枚・ヘッダーの 1 行を足しても、禁止語などは 0） |
| リンク切れ（ローカルの next start・`/start/operate` の内部リンク 7 本） | 7 本とも 200（/・/operators/aggregators・/reports/2026・/start/sell・/tools/asset-check・/tools/asset-ledger・/tracker/balancing-rules） |
| 375px（内蔵ブラウザ） | `/start/operate`・トップ・`/contact`・`/start/buy` で、はみ出す要素 0（scrollWidth 375）。トップの 4 枚は 1 列 |
| PC | トップの 4 枚は、1024px と 1200px で 2 枚＋2 枚、1300px で 4 枚が 1 列。`/contact` のカード 7 枚は 1280px で 3 列（先頭が紹介・運営の 2 枚） |
| GA4 の発火（gtag の身代わり） | `/start/operate` の相談ボタンで `contact_click`（cta_campaign `funnel_operate`・cta_position `cta`）が 1 回 |
| 読取専用レビュー 2 観点（便の文・コード）＋反証 | 便の文の不一致 0。コードの指摘 3 件（low 1・info 2）。low（トップの 4 枚が 936〜1,255px で 3 枚＋1 枚に分かれる・反証で実在）は並びを直した。info 2 件のうちコメント 3 か所は直した。もう 1 件（作業ツリーに prebuild の出力など別の変更がある）は、commit を 10 ファイルの名前指定にして対応した |

---

## (4) 本番 curl（素 URL・x-vercel-cache と age）

**commit `1c5538f`**: push 2026-10-20 09:10:22 JST・Vercel success 09:18:24 JST。

**09:18:43 JST**（success の直後）:

| URL | HTTP | x-vercel-cache | age |
|---|---:|---|---:|
| `/` | 200 | PRERENDER | 0 |
| `/start/operate` | 200 | PRERENDER | 0 |
| `/contact` | 200 | PRERENDER | 0 |
| `/start/buy` | 200 | PRERENDER | 0 |
| `/start/sell` | 200 | PRERENDER | 0 |
| `/info/operating-bess-introduction` | 200 | PRERENDER | 0 |

便 §4 の「本番で確かめること」:

1. `/start/operate` が 200。初期 DOM（`<!-- -->` を剥がした見える本文）に、h1・6 点・FAQ 3 問・CTA がある。便の文 45 本が全部一致。相談のリンクは `utm_campaign=funnel_operate&utm_content=cta`。
2. トップの入口が 4 枚で、「立場に合わせて、4つの入口を用意しています。」。並びのクラス `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4` も本番の HTML に出ている。
3. ヘッダーに「運営している」（`/start/operate`）がある。
4. `/contact` の先頭に 2 枚がある（便の文 4 本が一致）。
5. `/start/buy`（8 本）と `/info/operating-bess-introduction`（7 本）に新しい節がある。
6. sitemap に `/start/operate` がある（`<loc>` 1 件）。

- 便の文の機械比較は、本番でも **68/68 一致**。
- 相談リンクは、6 ページの 12 本が全部 UTM つき（`funnel_operate` 1・`site_footer` 6・`contact_index`・`operating_bess_intro`・`funnel_buy`・`funnel_sell`・`top`）。

**30 分監視**（2026-10-20 09:49:00 JST・Vercel success 09:18:24 の 30 分後・素 URL）: 便の文は本番でも **68/68 一致**のまま。6 ページとも HTTP 200。

| URL | HTTP | x-vercel-cache | age |
|---|---|---|---|
| `/` | 200 | STALE | 64 |
| `/start/operate` | 200 | HIT | 1816 |
| `/contact` | 200 | HIT | 1814 |
| `/start/buy` | 200 | HIT | 1812 |
| `/start/sell` | 200 | HIT | 1813 |
| `/info/operating-bess-introduction` | 200 | HIT | 1811 |

- トップの STALE は、裏で作り直している間に前の版を返したもの。返った HTML でも、入口 4 枚の文は一致している。
- `vercel ls` では、Production の 2 本（39 分前・59 分前）がどちらも Ready。Error はない。
- microCMS からの警告メールと、EDAさんからの連絡があったかどうかは、CC からは確かめられない。

---

## (5) 私（ユウ）の前提違い（逐語で）と、足さなかったが要りそうな所

**前提違い**

1. **4 枚の並び**: §2(a)「4 枚になっても、375px と PC で崩れないこと」について。既存の並び（`repeat(auto-fit, minmax(280px, 1fr))`）のままだと、横幅がおよそ 936〜1,255px（iPad の横向き 1024px・1200px のウィンドウなど）で 3 枚＋1 枚に分かれ、4 枚目だけが 2 行目に残った（重なり・はみ出しは無い。レビューで指摘・反証で実在）。文は変えずに、並びだけを 1 列（640px 未満）→ 2 列 → 4 列（1280px 以上）に指定した。
2. **カードの型**: §2(c)「型は、`PlayerType` でないカードを持てるように最小の変更で」について。消費者は `/contact` だけで、`type` を使っていたのは React の key だけだった。`type` を任意にし、key を `url` にした。`/contact/[type]` の `generateStaticParams` は 5 区分の一覧（`ALL_PLAYER_TYPES`）から作るので、ページは増えない。
3. **/info のほかの文**: §3(b)「ほかの文は変えない」について。このページの「業界データ基盤の運営元」の文の件数（「540社超」→「577社」・「全国10社」の自動化）は、前の便（入口の掃除と計測便・`e68e4e2`）で変わっている。この便で変えたのは節 1 つとコメント 1 行だけ。

**足さなかったが要りそうな所**（便の「足さない」に従い、足していない）

- `/start/operate` の twitter:title は、サイトの既定の文のまま（`/start/sell` も同じ）。
- `/contact` の description の列挙に、新しい 2 つは無い（便が「変えない」とした）。
- `/start/partner` には、運営者の入口へのリンクが無い（`/start/sell` だけに足した）。
- 新しい campaign `funnel_operate` は、GA4 の探索では「相談リンクの種類」に自動で出る（入口の掃除と計測便の報告 (6) の手順のまま）。

---

## (6) 申告・一時物

- **停止条件**: `rm` などの削除・`git push --force`・`.env` の表示は 0。microCMS は書込 0・GET 0。
- **commit の範囲**: 作業ツリーには、prebuild の出力（`src/data/substations/*.json` など）や、ほかの未追跡ファイルがある。そのため、この便の 10 ファイルを名前で指定して commit した（`git diff --cached --stat` で 10 ファイルだけであることを確かめた）。
- **ローカルの確認**: 内蔵ブラウザで `next start`（`.claude/launch.json` の next-start）を 3 回起動し、確認の後で止めた。ビルドは 2 回。
- **レビュー**: 読取専用のレビュー役 2・反証役 1（ワークフロー `wf_56d9c9c6-a2d`・失敗 0）。
  - 便の文の観点のレビュー役が、scratchpad の外に `C:\Users\kenji\AppData\Local\Temp\x_cur.patch`（差分の照合用・bash の /tmp に出力したもの）を作った（申告どおり・消していない）。
- **一時物**（scratchpad の `ent1017/` の下・消していない）:
  - `diff_operate.patch`
  - `tools/operate_edit.py`・`tools/operate_textcheck.py`
  - レビュー役が作った `tools/rv_op_*`
  - ビルドのログ `build_op1.log`・`build_op2.log`
  - 本番の取得物 `prodOp/`・`prodOp30/`
- **並行**: この便のビルドとレビューのあいだに、次の一歩便の下調べ・実装（push はこの便の本番確認の後）と、売買事例の研究便の仕上げ（読取のみ）を進めた。
