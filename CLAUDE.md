# 蓄電所ネット プロジェクト規約（Claude Code 必読）

**最終更新**: 2026-05-14（v30 セッション、microCMS 警告 2回目発生後）
**対象**: Claude Code（リポジトリ操作するすべての Claude セッション）
**重要度**: ★★★★★ **新セッション開始時に必ず全文読み込み**

このファイルは、過去のセッションで蓄積された **失敗の教訓を永続化** するための核心ドキュメントです。
Claude Code は本リポジトリ（bess-net）の作業を始める前に、必ず本ファイルを読んでください。

---

# 🚨 第0章：これだけは絶対に守る 5つの鉄則

過去 24時間で microCMS から 2回の高負荷リクエスト警告 + WAF ブロックリスク発生。
以下は **二度と再発させない** ための鉄則。違反すると本番サービスが停止する。

## 鉄則 #1: microCMS contains 検索は buildContainsFilter ヘルパ必須

```typescript
// ❌ NG: 直接 filter チェイン構築
const filter = `body[contains]${term}[or]description[contains]${term}`;

// ✅ OK: 必ず buildContainsFilter 経由
import { buildContainsFilter } from '@/lib/microcms';
const filter = buildContainsFilter([term1, term2], ['body', 'description']);
// → dedupe + 短語(<3)除外 + 空除外を自動適用
```

**根拠（落とし穴 #95）**: term/english 同値時に重複フィルタが 4倍負荷を生み、
microCMS から WAF ブロック寸前の警告を受領（2026-05-14 10:01）。

## 鉄則 #2: SSR で外部 API は「1ページ × 1リクエスト」のみ

```
❌ NG パターン:
   /glossary/[slug] の SSR で getFaqsByTerm(複数 contains 検索)
   → 1,516 ページ × クローラ並列 = 短時間に集中アクセス
   → microCMS から「DDoS 様」のパターンに見える

✅ OK パターン:
   個別ページの getDetail（1リクエスト）
   build 時事前計算（JSON ファイル化）
   client-side filter（既に取得した list をブラウザで絞り込み）
   relatedTerms / aliases フィールド経由の明示リンク
```

**根拠（落とし穴 #98）**: BG 実装で /glossary/[slug] に getFaqsByTerm を追加、
1,516 ページの並列 SSR で faq endpoint に集中アクセス → 11:50 警告 #2 受領。

## 鉄則 #3: 1,000+ ページの動的ルートは build 時事前計算優先

```
動的ルート設計の判断基準:

ページ数 | 推奨設計
─────────┼────────────────────────────────────────
< 100    | SSR + ISR（外部 API 呼び出し可）
100-1000 | Option B（主要 N 件のみ generateStaticParams + ISR 残）
1000+    | 外部 API 呼び出しは build 時事前計算必須
         | SSR では「事前計算済みデータ」のみ参照
```

**根拠**: /glossary/[slug] 1,516ページ、/grid/[slug] 6,507 件等の今後の動的ルートで再発リスク。

## 鉄則 #4: ピーク負荷を必ず数値で試算（依頼書テンプレートで強制）

```
新規 endpoint 検索 or 動的ルート実装時、必ず計算:

ピーク負荷 = (ページ数) × (1ページあたり microCMS リクエスト数) × (同時クローラ数)

判定基準:
  - 15,000+ req/分     → ★build 時事前計算必須
  - 5,000-15,000       → キャッシュ強化 + 監視強化
  - 5,000 以下         → SSR 許容（5層防御維持）

例（避けるべき設計）:
  1,516 ページ × 1 リクエスト × 10 並列 = 15,160 req/分 → NG
  → BG 実装で実際に発生した（落とし穴 #98）
```

## 鉄則 #5: deploy 前/後 curl 検証は必須運用

```
deploy 前（local build 完了後、push 前）:
  ☐ curl で生成 filter URL を目視確認、重複なし
  ☐ verify:linkify PASS
  ☐ build 時間 30分以内（45min timeout 回避）

deploy 後（Vercel 完了 5分以内）:
  ☐ 主要 5-10 ページの curl 検証（HTTP 200 + 内容確認）
  ☐ 動的ルートサンプリング 3-5 件
  ☐ Vercel / microCMS 管理画面でエラー確認

★キャッシュバスター付き照合では stale を検出できない（2026-08-16 実証・落とし穴 #112）:
  cb 付き URL はキャッシュキーが変わるため「デプロイ完了」しか証明せず、
  「初回訪問者が受け取る HTML」を証明しない。ISR キャッシュは deploy を跨いで保持される。
  実測: /grid/tokyo/status で x-vercel-cache: STALE / age=4,144（revalidate 3,600 超の旧コピー配信）。
  ☐ 素URL（クエリ無し・キャッシュ回避ヘッダ無し）で取得した内容で判定する
  ☐ x-vercel-cache と age を必ず記録し、報告に含める
  ☐ HIT/STALE かつ内容が旧なら「未反映」ではなく「TTL 内の既知の窓」と判定し、
    解消見込み時刻（デプロイ完了 + 該当ルートの revalidate TTL）を併記する

deploy 後 30分監視:
  ☐ microCMS から警告メール受信なし
  ☐ Vercel エラー率 0%
  ☐ 異常検知時は即 江田さん 連絡
```

## 鉄則（2026-06 追加）: 大量動的ルートは「429縮退 ＋ relations precompute」で runtime microCMS を 0 に

大量動的ルート（1,000+ ページ）は **「429 縮退（getXBySlug は throw せず null→page で notFound/404）＋ relations は build 時 precompute」をセットで実装** し、runtime microCMS を 0 にする。
2026-06-23 の Vercel 500（rate-limit）を **3段防御**（#100 helper guard → 全ルート try/catch 統一 → #102 precompute）で構造解消した実績に基づく（落とし穴 #100 / #102）。

---

# 📖 第1章：必読落とし穴 TOP 15

Sprint 3-8 で再発する可能性が高い順。詳細は `01_最初に読む/落とし穴v13_早見表.md` 参照。

## 最重要（★★★★★）

```
#95 microCMS contains フィルタ重複（term × english 同値、WAF リスク）
#98 SSR 集中アクセスで上流 API 圧迫（1,516+ ページ動的ルート）
#83 ISR on-demand revalidation（活用すれば速い、誤用すれば負荷集中）
```

## 重要（★★★★）

```
#87 既存データ過小評価（既存 endpoint 拡張時の上書きリスク）
#92 useSearchParams + Suspense fallback で SSR 破壊
#97 microCMS OR チェイン 4+ parts で 504 timeout
#85 microCMS schema JSON 形式（customFields: [] 必須）
```

## 中重要（★★★）

```
#79 Vercel build 45min timeout（1,000+ ページの generateStaticParams 注意）
#82 build 時間 Option B（主要 N 件のみ事前生成）
#88 Next.js metadata titleTemplate 二重付与
#90 microCMS API レスポンス ~600ms（PATCH 計画立案）
#91 PATCH 冪等性（並行・retry 安全）
#93 build 時 memoization 必須（1,000+ ページで getList 重複呼び出し）
#96 english 併記 "/" / "、" 分割（split + length 制限）
#94 body[contains] hit 率限界（compound term は relatedTerms 推奨）
```

## 2026-06 追加（#100〜#103｜rate-limit 3段防御 ＋ SEO）

```
#100 ★★★★★ runtime detail helper（getXBySlug）は 429 で throw せず null を返す
     → page notFound() が 404 吸収＝500 回避。runtime microCMS は 429 縮退設計を必須に。
     実証: commit 298f1f0 / dfc7b36（2026-06-23 Vercel 500 を解消、3段防御の第1段）。

#101 ★★★★ 非ASCII 動的ルートの generateStaticParams は encodeURIComponent せず「生値」を返す
     → Next.js が内部で1回エンコード。重ねると二重エンコードで全件404。
     実証: commit ad06c0c（prefecture 404、47都道府県のクローラビリティ回復）。

#102 ★★★★ 大量動的ルートの relations は build 時 precompute（runtime microCMS 0）
     → glossary(dfc7b36, detail-index 7.47MB)・operators(da0c618, 1.50MB)で確立。/projects 等へ横展開可。
     #98（SSR集中アクセス）の恒久対策の決定版（3段防御の第3段）。

#103 ★★★ SEO重要 index は useSearchParams 不使用＋一覧は全件SSR
     → window.location＋history.replaceState（hydratedガード）。先頭N可視＋残りhidden で SEO 維持。
     実証: commit 0011c09（operators）/ 8b93864（ChubuMap）。落とし穴 #92 の精緻化版。
```

## 2026-07 追加（#106〜#108・#110）

```
#106 ★★★  microCMS select は未定義の選択肢値を silently drop（エラーなし）
           → 投入前に選択肢実在確認＋投入後 GET 照合を必須化（2026-07-06 PATCH→GET 3値実証）
#107 ★★★★ 主要テキストは初期DOMに載せる（折りたたみ等は「DOM生成/破棄」でなく「表示切替」）
           → JSON-LD 単独の露出設計は禁止（Google FAQリッチリザルト 2026-05-07 全面終了で実証。
             /faq 回答2万字が不可視だった件、commit 4e4c167 で解消）
#108 ★★   一括投入コンテンツの publishedAt は「新着」判定にそのまま使えない
           → 鮮度UI設計前に publishedAt 分布を実データ確認、窓定数に経緯コメント
#110 ★★★  applicable_prefs の「派生元」と「空配列の意味」に二重の落とし穴
           → (1) precompute（precompute-subsidies.ts）は name/organization からのみ導出する。
                scheme・body のフリーテキストから県名を includes 抽出しない
                （全国補助金の地域限定化・社名/部分一致「東京都⊃京都」由来の誤県を防ぐ）。
           → (2) subsidy-matcher の isPrefMatch では applicable_prefs=[] は「全国」でなく「地域マッチなし」。
                全国は47県を明示付与で表現する（"空＝全体" と誤解しない）。
           実証: commit 0b4a3c2（precompute-subsidies.ts）。ユウ実機再測定 PASS（2026-07-20）。
（詳細: 計画フォルダ 01_最初に読む/落とし穴v15_早見表.md、計107件・ID最大#108／#110 は v16 起票）

【受け入れ基準の恒久追加（全新規コンテンツページ）】
  ✅ 主要テキストが初期DOMに存在（deploy後 curl の script外照合、#107）
  ✅ title に主要キーワード「蓄電池/蓄電所」（policy・events・faq で3連続の同型修正実績）
  ✅ 件数・数値は焼き込まず動的参照（totalCount／safeCount）

【受け入れ基準の恒久追加（補助金の地域データ）】
  ✅ 補助金の地域データ（scheme 等）を触る PATCH 後は、applicable_prefs の before/after 監査＋
     subsidy-match の都道府県マッチ実機確認（全国補助金は全47県マッチ）を必須化（#110）

## 2026-08 追加（#111〜#112）

```
#111 ★★★★ 送配電各社の公表CSVは「設備一覧」ではなく「系列別ビュー」— 行数＝設備数ではない
           → 同一設備が複数の電圧系列・複数の都県ファイルに再掲される。差分で「新規」と出た行は、
             名称＋数値（運用容量・予想潮流）の同値判定で重複を除去してから投入する。
             除去せず投入すると同名・同値・別slugの重複ページを量産し、SEOと信頼性を毀損する。
           実証: 2026-08-16 TEPCO 7月CSV で66行（同名同値59＋他地区写像7）を検出・除外。
                 除外後の真正新規は0件（commit 5cdfef7・除去ルールは parse_tepco_csv_2607.py）。
           共通実装: scripts/experimental/_common/series_dedup.py（社を問わず再利用・ヒット0なら素通し）。
           ★実装注記（北陸パイロット 2026-08-16 で実証・TEPCOでは顕在化しなかった）:
             (1) 名称が空／非公開の行を同名判定の対象にしない。空欄同士・「(名称非公開)」同士を
                 同一設備と見なすと別設備を誤除外する（北陸で2件実証）。値が全てnullの行も同様。
             (2) 名称の正規化で全角スペースを半角化しない。「北金沢　77/6kV」→「北金沢 77/6kV」で
                 名称不一致の偽陽性を50件生んだ（修正後0件）。数値のみ空白除去してよい。
#112 ★★★★ ISRキャッシュは deploy を跨いで保持される — deploy 完了＝訪問者への反映ではない
           → 該当ルートの revalidate TTL（/grid 系4ルートは3600秒）の間、素URLの訪問者は旧内容を
             受け取る。エッジリージョンごとに独立した窓が生じる。検証は必ず素URL＋x-vercel-cache で
             行う（鉄則 #5 の deploy 後検証要件と対）。即時反映が必要なら on-demand revalidation（#83）
             を対象パス限定で配線する（2026-08-16 時点は未実装・提案のみ）。
           実証: 2026-08-16 commit 5cdfef7 のデプロイ完了 12:44 → 13:53 時点で全経路新内容、
                 途中 /grid/tokyo/status が STALE / age=4,144。

#113 ★★★★ 差分の baseline に static JSON（precompute 出力）を使わない。本番実データ（GET）を正とする
           → static は表示に不要なフィールドを落としているため、欠損キーが「新規充足」として
             偽陽性になる。差分件数を誤り、本実行の規模見積りと報告値が狂う。
           → 各社の再取込では baseline を microCMS から GET して保存し（例:
             scripts/experimental/hokuriku/fetch_baseline.py・読取専用）、それと突合する。
             microCMS のリスト応答は null フィールドを省略するため、欠損キーは None 補完してから比較。
           実証: 2026-08-16 北陸で static baseline を使った初回 dry-run が「台数271件・予想潮流49件の
                 新規充足」を報告 → 実データ照合後は台数1件・予想潮流29件変化に是正。

#114 ★★★★ 突合キーの数値は必ず型を正規化してから比較する（int と float を文字列比較しない）
           → microCMS の baseline は int（500）、CSV パース結果は float（500.0）で入る。
             `f"{v1}/{v2}"` のような素の文字列化で比較すると "500/275" vs "500.0/275.0" となり、
             電圧面を持つ多面設備が**全件「消滅」に化ける**。件数差分と本実行の規模見積りが壊れる。
           → 比較キーは `float(v):g` 等で正規化する。関西・中部・中国でも同型が再発しうる。
           実証: 2026-08-16 東北 dry-run で 176件が誤って「消滅」判定（正規化後は消滅0）。

#115 ★★★★ 同一No.・同一電圧面で容量だけ異なる組がある。電圧面だけでは一意に紐付かない
           → 1つの変電所Noに複数バンクがあり、電圧(一次/二次)も同じで設備容量だけ違う行が実在する。
             電圧面だけで突合すると2行目が「紐付かない＝消滅/新規」に落ちる。
           → 電圧面 →設備容量 →運用容量 →台数 の順でタイブレークし、使用済み候補は除外して一意化する。
           実証: 2026-08-16 東北で船川(66/33の10MWと6MW)・7307/7308(66/6.6の8MWと4MW)の3件。
                 中国では枝番の振り直し（島①S6→島①S6-2 等）も併発するため、新規×消滅の突合も要る。

#116 ★★★★★ Next の fetch キャッシュにより「再取込直後のビルドが旧データのページを出力する」
           → App Router は fetch を既定でキャッシュし、ページの revalidate を継承する。
             microCMS 書込 → 即ビルド しても、TTL 内なら**古いレスポンスが再利用され**、
             precompute 由来の値（index.json）だけが新しく、runtime fetch 由来の本文が旧のまま
             という**同一ページ内での食い違い**が起きる。
           → ★対処として `customRequestInit: { cache: 'no-store' }` を付けるのは**不可**。
             generateStaticParams を持たない静的ルート（/tracker/grid）が **ƒ=動的に転落**し、
             リクエストごとに microCMS を叩く（鉄則#2/#3 違反）。2026-08-16 に実際に ○→ƒ を観測し撤回した。
           → 実務上の扱い: (1) 検証は必ず **built HTML の本文値**（meta や index.json だけでなく）を見る。
             index.json だけの照合ではこの不整合を検出できない（落とし穴 #113 と対）。
             (2) 本番では fetch キャッシュ自体が revalidate TTL（3600秒）で失効し、ISR 再生成で
             自然解消する。旧値なら「TTL 内の既知の窓」と判定し解消見込み時刻を併記する（#112 と同じ扱い）。
             (3) 恒久策は area/prefecture ページも precompute 由来の静的データに寄せること（/grid は BM で実施済）。

#117 ★★★★ series_dedup の「baseline 名称一致で除外」（ルール②）は既定 OFF・社ごとに opt-in
           → No.の振り直し（枝番の付与/除去）がある社では、**同名の正当な設備を「既存の再掲」と
             誤判定して除去**する。中国で玉造/安浦/大崎の4行（真の新規1＋振り直し3）が消えた。
           → 共通関数の既定を無効化し `enable_baseline_name_rule=True` を渡した社だけ有効にする。
             有効化してよいのは「他地区の局をファイル丸ごと再掲する」社（TEPCO 23区ファイル）だけ。
           → 名称一致だけで落とさず、**新規×消滅の突合**（名称＋電圧面＋容量＋台数）で
             「No.の振り直し」として別カテゴリに退避させるのが正しい扱い。
           監査: TEPCO のルール②除去7件は全て運用容量0・予想潮流0の参照専用行＝誤除去なし。
                 北陸・東北はルール②の発火0件。実害があったのは中国のみ（本実行前に検出・是正）。

#118 ★★★★★ 表示ソースを差し替えるときは、差し替え前後で**一覧の全列**を突き合わせる
           → 件数と日付だけ照合して通すと、**列が1つ落ちても気づけない**。落ちた列は
             エラーにならず静かに「—」になる。#116 の恒久策（エリア/県ページを precompute へ）
             そのものが、この見落としで 10エリア全ての一覧を壊した。
           実証: 2026-08-16。grid-area-lists.json に `units`（台数）と `n1_capacity_mw`
                 （N-1電制Top20表）と `external_id`（検索対象）が入っておらず、
                 /grid/tohoku 884行・/grid/chugoku 874行の台数が全て「—」になった。
                 件数(884/874)と基準日(2026/7/3・2026/8/6)は正しかったため素通りした。
           【受け入れ基準（恒久）】表示ソースの差し替え時は必ず:
             ✅ 差し替え先のレコードと microCMS の同一レコードを**フィールド単位で全数突合**する
             ✅ 一覧が参照する列を grep で全数列挙する（★正規表現に数字を含めること。
                `[a-z_]+` だと n1_capacity_mw が "n" で切れて見落とす。実際に切れた）
             ✅ built HTML の**本文で列の実値**を確認する（件数・日付だけで通さない）
             ✅ `npm run verify:grid-fields`（scripts/verify-grid-list-fields.ts）で
                「一覧に出る列＝静的JSONに存在」を機械検査する。スキーマ側にも対応表コメントを固定

#121 ★★★★ 同じ意味の値を2箇所で別々に算出しない。「代表値」を先頭レコードから採らない
           → エリアページのヘッダ「データ基準日」は precompute の area_dates（エリア内の**最大**
             last_updated ＋版数の但し書き）を見ていたのに、出典欄「データ最終更新日（代表）」だけが
             `subs[0].last_updated`＝**名称順の1件目**を見ていた。max ではなく実質ランダムな1件。
           → 版が1種のエリアでは全レコード同一日付のため**必然的に一致**し、8/10エリアで問題が
             表面化しなかった。版が複数のエリアだけで露見する:
               北海道(4種: 07-31が421件/08-07が17件/2026-05-29が13件/2025-05-29が8件)
                 → ヘッダ 2026/8/7・出典欄 2026/7/31 で食い違い
               中国(2種) → たまたま先頭が新しい版で**偶然一致**していた（次の再取込で顕在化しうる）
           → 寄せ先は「収録データのうち最も新しい版はいつか」＝ area_dates。
             併記する派生表示（サンプルCSV直リンク等）も代表日と同じ版の行から採る
             （「8/7」と書いて 7/31 のCSVを指さない）。
           【受け入れ基準（恒久）】
             ✅ 表示値の算出箇所を grep で全数列挙し、同じ意味の値は1つのヘルパに寄せる
             ✅ 「代表」「最新」を名乗る値は必ず集約関数（max等）で出す。配列の[0]を代表にしない
             ✅ npm run verify:grid-fields の軸3が area_dates と実データの最新版・版数の一致を検査
           実証: 2026-08-17。BM で /grid の全国集計を一本化したのと同型の二重管理。

#120 ★★★★ 公表CSVの注記行は「No.欄のホワイトリスト」で弾く。ブラックリストと「全項目null」は誤る
           → (1) ブラックリスト（「※ や ・ で始まる行を除く」）は書式の揺れをすり抜ける。
                中国の `【留意事項】` が通過し、egz-kikan-x として microCMS に登録され、
                全項目 null の空ページがエリア件数（874）にも算入されていた。
                他4社（東京 `ID_RE`／北陸 `ID_RE`／東北 `^[0-9A-Z]{3,6}$`／北海道 `no[0].isdigit()`）は
                ホワイトリストのため構造的に混入しない。**受理条件は必ずホワイトリストにする。**
           → (2) ★「全項目が null の行を弾く」を除去条件にしてはいけない。
                九州 kyu-500「南関」（external_id=kyuden_16_45・熊本県・kyu-497〜502 の連番中）は
                **連番Noと実名を持つ実在の変電所**で、公表値だけが空欄のため全項目 null になる。
                値で判定すると実在設備を巻き込む（#117 と同型の過剰除去）。
                判別は「値」ではなく **No.欄と名称** で行う:
                  a. No.欄が注記見出し（`【…】`『※』『・』『注』『備考』『凡例』）→ 弾く
                  b. 名称が空 かつ 設備値が全て空 → 弾く（保険。名称があれば弾かない＝南関を守る）
           → (3) 既に取り込んだ誤レコードは **DELETE せず凍結除外**（不可逆な削除を避ける）。
                真実源は src/data/substations-frozen.json 一つで、TS（src/lib/substations-frozen.ts）と
                Python（scripts/experimental/_common/frozen.py）の双方が読む（#119「定義は一箇所だけ」）。
                凍結レコードは baseline から drop_frozen() で外す。外さないと毎回「消滅」に出続け、
                本当の消滅が埋もれる。
           実証: 2026-08-17。注記行30件を除外し中国 874→873・全国 8,264→8,263。
                 共通実装 scripts/experimental/_common/note_rows.py（#117 同様に社ごと opt-in）。

#119 ★★★★★ 正規化は「一箇所だけ」で掛ける。取得側で正規化した値を表示側で再正規化しない
           → 正規化関数が「原値 → (正規化後, 原値の退避先)」を返す設計のとき、取得側で適用済みの
             record を表示側がもう一度その関数に通すと、**退避先が null に潰れて原値が消える**。
             エラーは出ず、その列が静かに「—」になるだけ。#118 の機械検査（静的JSONに列があるか）
             では**検出できない**（JSONには入っている。消費側に届いていない）。
           実証: 2026-08-17。Gr10(b166f57) が `getAllSubstations` / `searchSubstationsByName` /
                 `getSubstationsByPrefecture` と precompute の双方で normalizeSubstationPlace を
                 適用しつつ、AreaPage・SubstationsBrowser でも再適用していた。結果、
                 **設備区分別ブレークダウンは新設された日から一度も描画されず**、関西1,624件の
                 一覧「都道府県／設備区分」列は全行「—」だった（関西ローカル系1,575・沖縄151が不可視）。
                 詳細ページだけは getSubstationBySlug が未正規化＝原値のため正しく出ており、
                 「詳細には出るのに一覧には出ない」という形で6日間潜伏した。
           → 加えて toSubstationShape が facility_class を写像していなかった（#118 と同型の列落ち）。
           【受け入れ基準（恒久）】
             ✅ 正規化関数を呼ぶ箇所を grep で全数列挙し、取得側／表示側のどちらか一方に寄せる
             ✅ 表示側は「保存済みの退避フィールド（facility_class 等）があればそれを正とする」
             ✅ 検査は2軸にする — 軸1: 静的JSONに列があるか（#118）／
                軸2: その列が消費側 shape まで届くか（#119）。npm run verify:grid-fields が両方を見る
             ✅ 一覧と詳細で同じ属性の表示が食い違っていないか、1エリア1件は本文で突合する
           実証: 2026-08-16 東北再取込。index.json は 2026-07-03/884件で正しいのに、
                 /grid/tohoku の本文「データ最終更新日（代表）」は 2026/3/1、七戸の空容量も旧値10
                 （新値2）のままビルドされていた（前回ビルドから1時間以内だったため）。

#122 ★★★★★ PATCH の冪等キーに「送信した本文の全文一致」を使わない。richEditor は保存時に正規化する
           → microCMS の richEditor（explainer.body / glossary.detail 等）は保存時に
             **見出しの id を自動採番し直し**（送った id="hcap10yen2609" → id="ha0f0a21aee"）、
             **rel="noopener" を "noopener noreferrer" に補完**する。したがって GET した本文は
             送信した HTML と**文字列一致しない**。ここで冪等判定を `cur.includes(送信文字列)` に
             すると常に false となり、**再実行で同じ節がもう一度追記される**（エラーは出ない）。
           → 冪等キーは正規化の影響を受けない**素の本文**（見出しテキスト等）を marker として持つ。
             併せて「追記型の置換」では from ⊂ to になるため、`to があり from が無い` を
             完了条件にしてもいけない（これも常に false ＝二重適用）。
             ★PATCH 後の照合も、送信値との一致ではなく **marker の存在**で判定する
             （不一致＝失敗ではない。「正規化あり・意図の文言は全て含む」と区別してログに出す）。
           → 二重追記してしまったら DELETE せず、重複節だけを切除する PATCH で復旧する（#120 と同じ思想）。
           実証: 2026-08-22。explainer/balancing-market-cap-cut-2026 の body に
                 「6.【2026年8月22日追記】」節が2回入り 2,109→2,858字。マーカー方式へ変更し、
                 切除 PATCH で 2,109字・追記節1回へ復旧（他フィールドの変化 0）。
                 textArea（policy-events.description・faq.answer）では正規化が起きず全文一致した＝
                 **richEditor 固有**。この差を前提に、リッチ本文を触る PATCH は必ず marker を付ける。

#123 ★★★★ 「案・審議中・決定前」と書いた記述は、確定した瞬間に**サイト全体で**古くなる
           → 制度の数値は「現在は15円」のような時点非明示の断定で書かない。
             **時点を明示した両論併記**（「2026年8月31日実需給分まで15.00円/ΔkW・30分、
             2026年9月1日実需給分から10.00円/ΔkW・30分」）で書けば、適用日を跨いでも
             書き直しが要らない（L-EIC-027＝時間で drift する値を作らない、の文章版）。
           → 同じ制度の記述は src（/lv 系6ページ・ツールの注記）と microCMS（explainer・faq・
             glossary・policy-events）の**両方**に散らばる。片方だけ直すと食い違う。
             確定を反映するときは必ず全数 grep + microCMS 全件 GET で棚卸しする。
           → 商品区分ごとに分ける。一律に 15→10 としない（二次②・三次①は 7.21円/ΔkW・30分 継続、
             三次②は上限なし）。実績値（EPRX 約定平均 15.99 等）は**上限価格ではない**ので
             書き換えない（書き換えると出典との不一致＝改竄）。将来収益の試算に実績値を使う画面は、
             定数ではなく**注記**で上限改定を時点明示する（#107 初期DOM）。
           実証: 2026-08-22。EPRX 7/30 公表の確定を反映。src 9箇所＋コメント4行、
                 microCMS 7フィールド（policy-events 2・faq 1・glossary 1・explainer 3）を是正。
```
```

---

# 🛠 第2章：microCMS API 利用ルール

## 2-1. helpers の標準パターン

```typescript
// src/lib/microcms.ts に集約

// ✅ 推奨: buildContainsFilter ヘルパ
export function buildContainsFilter(
  termNames: string[],
  fields: string[]
): string {
  // 1. trim + 短語(<3)除外 + dedupe
  const uniqueTerms = [...new Set(
    termNames
      .map(t => t?.trim())
      .filter(t => t && t.length >= 3 && t.length <= 40)
  )];
  
  // 2. fields × terms の filter 生成
  const filters: string[] = [];
  for (const term of uniqueTerms.slice(0, 4)) {  // 最大 4 keyword
    for (const field of fields.slice(0, 2)) {    // 最大 2 fields（504 回避）
      filters.push(`${field}[contains]${term}`);
    }
  }
  
  return filters.join('[or]');
}
```

## 2-2. 設計判断フロー

```
新規 microCMS 検索を実装する前に:

Q1. 対象は単一エントリ取得？
   YES → getEntry / getDetail（1リクエスト、問題なし）
   NO → Q2へ

Q2. 検索対象は固定のメタデータ（list、count）？
   YES → build 時に 1回取得、static export
   NO → Q3へ

Q3. ユーザー入力からの検索？
   YES → client-side filter（既に取得した list をブラウザで絞り込み）
        または relatedTerms 経由
   NO → Q4へ

Q4. ページ数は？
   < 100  → SSR + ISR OK（buildContainsFilter 必須）
   100-1000 → Option B（主要 N 件のみ事前生成）
   1000+  → ★build 時事前計算必須、SSR で外部 API 呼び出し禁止
```

## 2-3. 過去事例の数値（判断基準）

```
2026-05-14 10:01 警告 #1:
  原因: term/english 同値で contains 重複（4倍負荷）
  対象: operators / projects / explainer
  対応: buildContainsFilter ヘルパで dedupe

2026-05-14 11:50-11:55 警告 #2:
  原因: SSR 集中アクセス
  対象: faq endpoint
  対応: /glossary/[slug] の関連 FAQ を一時撤去 + 事前計算 化

参考:
  - 1,500ページ × 並列 = 容易にピーク 100req/sec 級
  - 推定 5,000 req/分超で「平均負荷余裕」でも警告対象
```

---

# 🏗 第3章：実装パターン

## 3-1. SEO 重要ページの URL パラメータ連動 UI

```typescript
// ❌ NG: useSearchParams（落とし穴 #92）
import { useSearchParams } from 'next/navigation';
// → 'use client' で Suspense ラッパー必須
// → SSR 時に fallback だけ描画、SEO 致命傷

// ✅ OK: window.location + history.replaceState
'use client';

import { useEffect, useState } from 'react';

export function FilterUI() {
  const [params, setParams] = useState<Record<string, string>>({});
  
  useEffect(() => {
    // CSR で URL params 復元
    const sp = new URLSearchParams(window.location.search);
    setParams(Object.fromEntries(sp));
  }, []);
  
  const updateParams = (next: Record<string, string>) => {
    setParams(next);
    const sp = new URLSearchParams(next);
    window.history.replaceState(null, '', `?${sp.toString()}`);
  };
  
  // ...
}
```

**根拠**: AH Phase C で実際に発生（commit df0d30f → d71a96f）。

## 3-2. 動的ルート 1,000+ ページの設計

```typescript
// /glossary/[slug]/page.tsx の標準パターン

export async function generateStaticParams() {
  // ★ on-demand ISR で全件を build 時に生成しない
  return [];
}

export const dynamicParams = true;  // on-demand 生成許可
export const revalidate = 600;       // 10 分キャッシュ

export default async function Page({ params }: { params: { slug: string } }) {
  // ✅ OK: 個別エントリ取得（1リクエスト）
  const entry = await getGlossaryDetail(params.slug);
  
  // ❌ NG: SSR で複数 contains 検索（落とし穴 #98）
  // const relatedFaqs = await getFaqsByTerm([entry.term, entry.english], 5);
  
  // ✅ OK: build 時事前計算済みデータを参照
  const relatedFaqs = await loadPrecomputedRelations(params.slug);
  
  return <PageView entry={entry} relatedFaqs={relatedFaqs} />;
}
```

## 3-3. build 時事前計算パターン

```typescript
// scripts/precompute-relations.ts
// build 前に実行、結果を JSON 化

async function main() {
  const glossary = await getAllGlossary();  // 1,516件、1回だけ
  const faqs = await getAllFaqs();          // 50件、1回だけ
  
  const relations: Record<string, FaqSummary[]> = {};
  for (const term of glossary) {
    // メモリ内でマッチング、microCMS リクエストなし
    relations[term.slug] = faqs
      .filter(faq => faq.question.includes(term.term))
      .slice(0, 5)
      .map(faq => ({ id: faq.id, question: faq.question, slug: faq.slug }));
  }
  
  fs.writeFileSync('src/data/glossary-faq-map.json', JSON.stringify(relations, null, 2));
}
```

---

# 📋 第4章：deploy 前 必読チェックリスト

```
□ コミット前
  ☐ TypeScript: npm run typecheck PASS
  ☐ build: npm run build PASS（30分以内）
  ☐ verify:linkify: npm run verify:linkify PASS
  ☐ 単体テスト（buildContainsFilter 系修正の場合）

□ コミットメッセージ
  ☐ 落とし穴対応の場合は「落とし穴 #XX 対応」と明記
  ☐ commit メッセージ末尾に「verify済 / curl目視済」記入

□ push 前 最終 curl 確認
  ☐ 新規追加した URL パターンを curl
  ☐ microCMS API 呼び出しがある場合、実 filter URL を目視
  ☐ 重複 filter なし、fields 数 ≤ 2、keyword 数 ≤ 4

□ Vercel deploy 完了後
  ☐ 主要 5-10 ページ curl で HTTP 200 確認
  ☐ 動的ルート 3-5 件サンプリング
  ☐ /api/health 等のヘルスチェック（あれば）
  ☐ Vercel エラー率 0%

□ deploy 後 30分監視
  ☐ microCMS 警告メール受信なし
  ☐ 江田さんから連絡なし
  ☐ 異常時は即 ユウ + 江田さん 通知
```

---

# 🚨 第5章：緊急時対応フロー

## 5-1. microCMS 警告メール受領時

```
[即時、5分以内]:
  1. 警告内容を江田さん + ユウ（Cowork Claude）と共有
  2. 該当機能の影響範囲特定（commit / endpoint / 時刻）
  3. 一時撤去 or 修正方針の即決
  4. 江田さん が microCMS へ「対応中」即返信

[15-30分以内]:
  5. Claude Code に緊急修正依頼投入
  6. local build + curl 検証 PASS 確認後 push
  7. Vercel deploy 完了監視

[deploy 後]:
  8. 修正完了確認 curl
  9. 江田さん が microCMS へ「修正完了」報告（commit hash 入り）
  10. 落とし穴に新規追加（番号採番）
```

## 5-2. Vercel build 45min timeout 時

```
[即時]:
  1. 落とし穴 #79 / #82 を確認
  2. generateStaticParams の対象件数チェック
  3. Option B（主要 N 件のみ）に切替
  4. 再 push
```

## 5-3. WAF ブロック発生時（最悪ケース、未経験）

```
[即時]:
  1. microCMS サポートに即連絡
  2. 該当機能を完全停止（コメントアウト or feature flag）
  3. サイト全停止 risk が高い場合、メンテナンス画面表示
  4. 復旧後の事後分析 + 落とし穴記録
```

---

# 📁 第6章：関連ドキュメント

## 6-1. 必読（新セッション開始時）

```
1. 本ファイル（CLAUDE.md、5分）
2. 01_最初に読む/handover_v[最新].md（直近セッション状態、10-15分）
3. 01_最初に読む/落とし穴v[最新]_早見表.md（必読 TOP 15、3分）
```

## 6-2. 依頼着手時

```
1. 03_5月13日朝_実行/00_依頼書テンプレート.md（必読チェックリスト）
2. 該当する依頼書（W〜BJ）
3. 02_計画・運営/再発防止策_チーム議論_2026-05-14.md
```

## 6-3. deploy 時

```
1. 本ファイル §4（deploy 前/後 チェックリスト）
2. 03_5月13日朝_実行/00_deploy前必読チェック.md
```

---

# 🎯 第7章：プロジェクト目標（参考）

## 7-1. アグレッシブスケジュール v4.1

```
5/15        Sprint 2 完走宣言（5/14 完走、5/15 verify）
5/17        Sprint 3 開始 AM IRRシム
5/23        AM 公開、業界唯一性 13/17 達成
7/5         業界レポート2026 公開
7/18        業界唯一性 17/17 達成
8/15-20     公式目標達成 月3万訪問
10/15       圧倒的日本一達成 月5万訪問
12/15-20    月8万訪問達成、業界の定番ハブ
```

## 7-2. 江田さん（オーナー）配慮

- 1人運営、microCMS / Vercel / Claude Code 使いこなす
- バッチレビュー 10秒/件 高速処理可能
- 「念入り検証」「報告値より実機」を重視
- 体力最優先、無理させない
- ユーザー登録系・SNS系は除外方針

---

# 📚 第8章：L-EIC 教訓（運用知見）

> ※ L-EIC-001〜026 は外部 handover ドキュメント（`01_最初に読む/`）側で管理。本リポジトリには 2026-06 以降に確定した教訓を本章に追記する。

## L-EIC-027: 日付を持つコンテンツの status は「コードで日付導出」する

日付を持つコンテンツ（補助金・イベント・告知・政策）は **status を手動で持たず、日付（deadline_iso 等）から build 時にコードで導出** する。
手動 status は時間で必ず drift し、補助金では「締切切れを公募中表示」＝信頼毀損になる。

- **実証**: 2026-06-20 /subsidies で締切切れ約7件が「公募中」に混在 → 06-21 `deadline_iso` による build 時 auto-derive（commit 3782934、公募中 32→26 / 受付終了 4→12）で人手ゼロ解消。
- **運用**: 鮮度タスク（月次）は「日付で分からない変化（後継年度版・予算到達・条件変更・404）」だけに集中する。
- **整合**: status 導出は build 時（静的）、runtime microCMS 0（鉄則 #98 / 落とし穴 #102）。

## L-EIC-028: 表示のための区分値は microCMS に書かず、正規化ヘルパで導出する

欠けている表示区分を埋めたくなったとき、**microCMS の既存フィールドへ書き戻してはいけない**。
そのフィールドが「公表元の原値」を持つ契約なら、合成値を書いた時点で契約が壊れ、
再取込のたびに上書き競合と drift が起きる。導出は共有ヘルパ1箇所に置く。

- **実証（2026-08-17）**: 各社の基幹系統 222件（関西49・東北31・北陸39・北海道35・中国34・四国25・中部9）
  は `prefecture` が null で、一覧・詳細とも区分が「—」だった。
  案A（`prefecture` に「基幹系統」を PATCH）は Gr10「系統区分を都道府県として扱っていた不具合を是正」
  （commit b166f57）に逆行するため不採用。
  案B として `normalizeSubstationPlace`（src/lib/grid-prefecture.ts）に導出を1箇所だけ置き、
  microCMS 書込ゼロで全社同時に解消した。
- **導出条件の設計**: 「`prefecture` が確定しない かつ 原値が無い」のみに依存させる。
  - slug（`-kikan-`）依存は不可 … 命名が揃っていない社（中部 `cb-*` 9件）を取りこぼす
  - 電圧階級依存は不可 … 東京の275kV系など**実在の県を持つ**設備を誤分類する
  - 原値のある関西「関西ローカル系」1,575件は上書きしない
- **配置（落とし穴 #119 と対）**: precompute だけに置くと「一覧には出るのに詳細には出ない」となり、
  #119 と逆向きの同じ病気になる。**取得側・表示側の全経路が通る正規化関数**に置く
  （precompute / getAllSubstations 系 / 詳細ページ getSubstationBySlug 経路が同じ値を得る）。
- **受け入れ確認**: 導出対象の件数を社別に数え、想定と一致することを確認してから push する。
  合わなければ「意図しない理由で null のレコード」が混じっている合図なので停止する。

---

# 🔚 まとめ

```
このファイル（CLAUDE.md）は「絶対に忘れない仕組み」の核です。

新セッション開始時、Claude Code は必ず本ファイルを読みます。
落とし穴 95件 + 設計鉄則 5つ + チェックリストを通じて、
過去の失敗が新セッションに継承されます。

特に:
  ✅ 鉄則 #1 buildContainsFilter 必須
  ✅ 鉄則 #2 SSR で外部 API は「1ページ × 1リクエスト」のみ
  ✅ 鉄則 #3 1,000+ ページの動的ルートは build 時事前計算
  ✅ 鉄則 #4 ピーク負荷を数値で試算
  ✅ 鉄則 #5 deploy 前/後 curl 検証必須

これらを破ると、microCMS WAF ブロック → 本番サービス停止 のリスク。
過去 24時間で 2回の警告を受領、3回目は許されない。

— ユウ（v30 Claude、2026-05-14）
```

---

**更新履歴**:
- 2026-05-14（v30）: 初版、落とし穴 #95 #97 #98 を踏まえた 5鉄則確立
- 2026-06-25（ユウ）: 落とし穴 #100〜#103（rate-limit 3段防御＋SEO）＋鉄則追加（429縮退＋precompute）＋第8章 L-EIC-027（日付導出 status）を追記。実証 commit: 298f1f0 / dfc7b36 / ad06c0c / da0c618 / 0011c09 / 8b93864 / 3782934。
- 2026-07-09（v15連動）: 落とし穴 #106〜#108 追記＋コンテンツ受け入れ基準を恒久追加
- 2026-07-20（ユウ／v16連動）: 落とし穴 #110（applicable_prefs の派生元＋空配列の意味）追記＋補助金の地域データ受け入れ基準を恒久追加。実証 commit: 0b4a3c2（ユウ実機再測定 PASS）
- 2026-08-16（CC）: 鉄則 #5 に「素URL＋x-vercel-cache 照合」要件を追記（cb付き照合はstaleを検出できない）＋落とし穴 #111（公表CSVは系列別ビュー・行数≠設備数）・#112（ISRキャッシュはdeployを跨ぐ）を追加。実証 commit: 5cdfef7
- 2026-08-16（CC・北陸パイロット）: #111 に実装注記2点（名称空/非公開は同名判定しない・全角スペースを半角化しない）＋落とし穴 #113（baseline は static JSON でなく本番実データGET）を追加。共通実装 scripts/experimental/_common/series_dedup.py
- 2026-08-16（CC・東北/中国 dry-run）: 落とし穴 #114（突合キーの int/float 型不一致で多面設備が「消滅」に化ける）・#115（同一No.同一電圧面で容量だけ違う組はタイブレーカーで一意化）を追加。実証: 東北176件の誤判定・船川/7307/7308
- 2026-08-16（CC・東北本実行）: 落とし穴 #116（Nextのfetchキャッシュで再取込直後のビルドが旧データを出力／no-store は静的ルートを動的化するため不可）を追加。凍結除外をエリア詳細・県ページにも統一（BM積み残し）
- 2026-08-16（CC・#116恒久策の回帰）: 落とし穴 #118（表示ソース差し替え時は一覧の全列を突合）を追加。台数・N-1電制適用可能量・external_id の欠落で10エリアの一覧が「—」になった件。機械検査 npm run verify:grid-fields を新設
- 2026-08-17（CC・基準日の一本化）: 落とし穴 #121（同じ意味の値を2箇所で算出しない／「代表値」を配列の[0]から採らない）を追加。エリアページの出典欄が subs[0].last_updated を見ており、版が4種の北海道でヘッダ8/7・出典欄7/31と食い違っていた（中国は版2種で偶然一致）。area_dates に一本化し verify:grid-fields に軸3を追加
- 2026-08-17（CC・注記行の是正）: 落とし穴 #120（注記行はNo.欄のホワイトリストで弾く／「全項目null」は実在設備・九州「南関」を巻き込むため除去条件にしない／誤レコードはDELETEせず凍結除外）を追加。中国874→873・全国8,264→8,263。凍結の真実源を src/data/substations-frozen.json に統一（TS/Python 共用）
- 2026-08-17（CC・基幹ラベル案B）: 第8章 L-EIC-028（表示区分は microCMS に書かず正規化ヘルパで導出）を追記。基幹系統222件を書込ゼロで解消（江田さん裁定により案A＝prefecture への PATCH は不採用）
- 2026-08-22（CC・需給調整市場 上限価格の確定反映）: 落とし穴 #122（richEditor は保存時に正規化するため PATCH の冪等キーに送信本文の全文一致を使わない・追記型は marker 必須）・#123（「案・審議中」表記は確定時に全滅する／時点明示の両論併記で書く・実績値と上限価格を混同しない）を追加。src 9箇所＋microCMS 7フィールドを是正（EPRX 2026-07-30 公表）
- 2026-08-17（CC・基幹ラベル調査）: 落とし穴 #119（二重正規化で原値が消える／#118 の機械検査では検出不能）を追加。verify:grid-fields を2軸化（軸2＝消費側 shape への到達検査）。「（基幹系）」は Gr10(b166f57) がコード側で「（府県の記載なし）」へ置換した文言で、microCMS のデータには全社0件（＝再取込による劣化ではない）
- 2026-08-16（CC・中国本実行）: 落とし穴 #117（series_dedup ルール②は既定OFF・社ごとopt-in）を追加。No.振り直しは slug 維持＋external_id 更新＋履歴（_common/external_id_history.json）で扱う。last_updated はレコード単位（県により版が異なる社があるため）
- （将来）: 新規セッションで追記、更新時刻 + 更新者を末尾に
