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
           実証: 2026-08-16 東北再取込。index.json は 2026-07-03/884件で正しいのに、
                 /grid/tohoku の本文「データ最終更新日（代表）」は 2026/3/1、七戸の空容量も旧値10
                 （新値2）のままビルドされていた（前回ビルドから1時間以内だったため）。
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
- 2026-08-16（CC・中国本実行）: 落とし穴 #117（series_dedup ルール②は既定OFF・社ごとopt-in）を追加。No.振り直しは slug 維持＋external_id 更新＋履歴（_common/external_id_history.json）で扱う。last_updated はレコード単位（県により版が異なる社があるため）
- （将来）: 新規セッションで追記、更新時刻 + 更新者を末尾に
