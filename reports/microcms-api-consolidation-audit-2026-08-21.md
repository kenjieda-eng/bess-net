# microCMS API 統合の事前監査（読み取りのみ・2026-08-21）

対象: 「政策イベント」`policy-events` ＋「業界イベント」`industry-events` → 1 API に統合し、コンテンツAPI数を 11→10（Team 上限内）に戻す計画の**前提調査**。本書は読み取りと報告のみで、統合・削除は行っていない。

## 0. 現在のAPI数（コードから実測）

`src/lib/microcms.ts` の `endpoint:` は **11種**: substations / glossary / projects / operators / news / explainer / subsidies / links / faq / **policy-events** / **industry-events** → 請求の「11個（10個＋追加1）」と一致。

## 1-1. スキーマ全項目（公開API GET の実値から）

※ コンテンツAPIは**公開コンテンツのみ**返す。下書き件数・必須フラグ・選択肢の定義順は管理画面でのみ確認できる（下記「管理画面で要確認」）。

| 項目 | policy-events（49件） | industry-events（41件） | 備考 |
|---|---|---|---|
| id / slug / title | ✓ | ✓ | 共通 |
| eventDate | ✓（YYYY-MM-DD） | ✓ | 共通 |
| endDate | — | ✓（22/41件に値） | **industry のみ**（期間イベント） |
| eventType（select・配列） | 重要会議15／公表19／パブコメ9／法改正2／オークション4 | セミナー14／展示会18／シンポジウム4／学会2／業界団体総会3 | **同名フィールドで選択肢が完全に異なる** |
| status（select・配列） | 終了38／進行中6／予定5 | 予定30／終了11 | **「進行中」は policy のみ** |
| category（select・配列） | 重要会議19／容量市場10／公表9／パブコメ9／LTDC5／需給調整市場7／法改正8／補助金5 | — | **policy のみ** |
| issuer（text） | ✓ | — | industry では organizer が同義 |
| organizer（text） | — | ✓ | |
| description | ✓ | ✓ | 共通 |
| sourceUrl | ✓ | — | industry では officialUrl が同義 |
| officialUrl | — | ✓ | |
| venue / location | — | ✓ | industry のみ |
| relatedTopics（配列） | — | ✓（40件に値） | industry のみ |
| registrationDeadline | — | 型定義にあるが**実データ0件** | 表示コードは存在（EventsCalendarClient 364行） |

## 1-2. 件数・日付

| API | 公開件数 | 最古 publishedAt | 最新 publishedAt | 下書き |
|---|---:|---|---|---|
| policy-events | 49 | 2026-05-11 | 2026-08-06 | 管理画面で要確認 |
| industry-events | 41 | 2026-05-12 | 2026-07-05 | 管理画面で要確認 |

## 1-3. 参照コード箇所（全数）

**ページ（4ルート・URLは `/events` `/policy-calendar` `/policy-calendar/[slug]` ＋トップ）**
- `src/app/events/page.tsx`（getAllIndustryEvents）／`src/app/events/EventsCalendarClient.tsx`
- `src/app/policy-calendar/page.tsx`／`PolicyCalendarClient.tsx`／`[slug]/page.tsx`（getAllPolicyEvents・詳細11件は `POLICY_DETAIL_SLUGS`）
- `src/app/page.tsx`（トップ: getAllPolicyEvents）
- `src/app/sitemap.ts`（/policy-calendar・詳細11・/events）

**ライブラリ**: `src/lib/microcms.ts`（型 PolicyEvent / IndustryEvent・fetch 2本・policy は memoize）／`src/lib/policy-utils.ts`（deriveDisplayStatus・POLICY_DETAIL_SLUGS・タイムライン）

**投入スクリプト（17本・すべて過去便の一回物）**: post-policy-events*.ts（2026-06〜08・11本）・patch-policy-events-2026-06.ts・batch5-friday2-2026-08-14.ts・post-industry-events.ts・post-subsidy-chikudenchi07r.ts（コメント参照のみ）＋ログJSON 2本

**SOP/依頼書（OneDrive）**: 36ファイルが API名に言及（01_最初に読む／02_計画・運営）→ 統合時に一括更新が必要

## 1-4. deriveDisplayStatus（L-EIC-027）の依存

`deriveDisplayStatus(ev)` は **eventDate / endDate / eventType / status** の4項目だけを見る（`src/lib/policy-utils.ts:61`）。
- 両APIで共通のフィールド名（eventDate・eventType・status）＋ industry のみの endDate
- 規則: 格納「予定」かつ基準日（endDate ?? eventDate）< 今日 → 「終了」。**eventType「パブコメ」は例外**（policy 固有値）
- → **統合後も壊れない**。ただし eventType の選択肢が 1 つの select に同居するため、「パブコメ」判定は統合後の選択肢にも値が残ることが条件
- 呼び出し: events 3箇所・policy-calendar 2箇所・詳細1箇所（計6箇所、いずれも同関数）

## 1-5. イベント系固有の運用機能への依存

- 募集締切（registrationDeadline）: **実データ0件**。型と表示コードのみ → 統合スキーマに含めなくても表示は壊れない（任意フィールドとして残してもよい）
- 予約公開（microCMS の予約機能）: コードに draftKey / 予約参照なし → 依存なし
- microCMS リレーション: 両APIとも**他APIからの参照なし**（operators/news の relatedX に含まれない）→ 統合の移行対象はコンテンツ本体のみ

## 1-6. 統合先の比較と推奨

| 観点 | (a) policy-events に寄せる | (b) industry-events に寄せる | (c) 新規 `events` を新設して両方を移す |
|---|---|---|---|
| 移行件数 | 41（industry→policy） | 49（policy→industry） | 90（両方） |
| スキーマ改変量 | policy に endDate/venue/location/organizer/officialUrl/relatedTopics を**追加**（6項目）＋ eventType/status の選択肢追加 | industry に issuer/sourceUrl/category を追加（3項目）＋選択肢追加 | 新規に全項目を設計（最も自由・**API数は一時的に12**になる＝旧2つを消すまで超過が続く） |
| コード修正箇所 | industry 側: fetch 1本＋型1＋page/Client 2 ＋ organizer→issuer 等の名寄せ | policy 側: fetch 1本（memoize付き）＋型1＋page/Client 3＋トップ＋sitemap＋POLICY_DETAIL_SLUGS の参照 | 両側すべて（約10ファイル） |
| URL/slug への影響 | **なし**（slug は項目値・ページURLはAPI名と無関係） | なし | なし |
| ロールバック | 容易（旧 industry を消すまで両立可） | 容易 | 最も容易だが**3 API 並立中は追加課金が続く** |
| 備考 | policy は memoize 済み・詳細11件・トップ参照あり＝**動かさない側**にする方が安全 | 参照が多い policy 側を移す＝リスク高 | 「種別」フィールド（policy/industry）を新設する前提なら最も綺麗 |

**推奨: (a) policy-events に寄せる。**
理由: ①参照が多く詳細ページ・トップ・sitemap・memoize を抱える policy 側を**動かさない** ②industry は参照が events 1ルートのみで移行影響が最小 ③追加項目は全て任意（endDate 等）で既存49件は無変更で通る ④API数が一時的にも 11 を超えない。
前提: 統合後の区別のため **`kind`（select: 政策／業界）を1項目追加**し、`/events` は kind=業界、`/policy-calendar` は kind=政策 でフィルタする（eventType の値で推定しない）。

## 1-7. URL影響

- ページURL（`/events`・`/policy-calendar`・`/policy-calendar/[slug]`）はルーティングで決まり、API名に依存しない → **変えない前提で設計可能**
- slug はコンテンツの項目値で、両APIの slug に重複がないことを移行前に機械確認する（本日 GET の範囲で重複0）
- sitemap の URL も不変（policy 詳細11件は `POLICY_DETAIL_SLUGS` 定数）

## 1-8. 実行便の手順書ドラフト（旧APIの削除操作は含めない）

1. **バックアップ**: 両APIを GET 全件で JSON 退避（本日分: `scripts/experimental/_common/{policy-events,industry-events}_live.json`）。管理画面で下書き件数も控える
2. **スキーマ**（policy-events 側・管理画面）: `kind`（select: 政策／業界・必須）／`endDate`（日付・任意）／`venue`・`location`・`organizer`・`officialUrl`（text・任意）／`relatedTopics`（複数select or text・任意）を追加。`eventType` の選択肢にセミナー・展示会・シンポジウム・学会・業界団体総会を**追加**（既存値は残す）。`status` は現状維持（進行中を含む）
   - ★#106: select の未定義値は無言で落ちる → 追加直後に GET で選択肢の実在を確認してから移行
3. **既存49件に kind=政策 を PATCH**（1フィールドのみ・前後GET照合 #106）
4. **industry 41件を policy-events へ POST**（kind=業界・organizer/officialUrl はそのまま別項目に・slug 重複ゼロを事前確認・逐次400ms）→ 全件 GET 照合
5. **参照替え（コード）**: `getAllIndustryEvents` を policy-events の kind=業界 フィルタに変更（型 IndustryEvent は当面維持し、マッピングで吸収）。`/events` 側の deriveDisplayStatus 呼び出しは不変
6. **SOP更新**: OneDrive 36ファイル＋ CLAUDE.md の該当記述を「policy-events（kind で区別）」へ
7. **検証**: tsc → build → 素URLで `/events`（41件・status 分布 予定30/終了11 の無退行）・`/policy-calendar`（49件）・詳細11件 200・トップの政策枠・sitemap 増減0 → 30分監視
8. **旧 industry-events が空であること**を GET で確認（件数0）。**削除は EDAさんが管理画面で手動実施**

### 管理画面で要確認（コンテンツAPIでは取れない）
下書き件数／各フィールドの必須フラグ／select の選択肢定義（順序・未使用値）／APIスキーマのフィールドID 表記
