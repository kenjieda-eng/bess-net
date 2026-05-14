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

deploy 後 30分監視:
  ☐ microCMS から警告メール受信なし
  ☐ Vercel エラー率 0%
  ☐ 異常検知時は即 江田さん 連絡
```

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
- （将来）: 新規セッションで追記、更新時刻 + 更新者を末尾に
