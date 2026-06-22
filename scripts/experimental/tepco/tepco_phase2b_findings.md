# TEPCO Phase 2b Findings — dedup ＋ 本番スキーマ統合設計（staging）

**作成日**: 2026-06-22
**前提**: Phase 2a 完了（commit f8e9eba、1,777変電所＋1,411送電線・独立検証済）
**ステータス**: Phase 2b 完了（dedup＋投入候補データ＋設計。本番 `/grid` のページ・データは未変更＝2c）
**成果物**: `tepco_dedup.json`（サイト単位）＋ `tepco_grid_ready.json`（本番schema投入候補）

---

## 0. 結論（先出し）

- dedup後 **ユニークサイト 1,602** ／ 本番投入候補レコード **1,718**（1レコード=1電圧面＝/grid 行数見込み）。
- **東京都 = 470サイト ／ 516レコード**（= /grid 東京の実件数見込み）。
- 既存16フィールドschemaへの写像は **過不足なく可能（ブロッカーなし）**。slug一意・型互換・全コア充足。
- 値の劣化なし: grid_ready 1,718件すべてが Phase 2a の PDF検証済値と完全一致（trace 0不一致）。
- 残課題は2c（本番投入）: ①4県の他社データとの追加マージ、②`/grid/tokyo` slug衝突、③緯度経度の後付け。

---

## 1. dedup後ユニークサイト数＋内訳（完了報告①）

| 指標 | 値 |
|------|----|
| raw変電所（Phase 2a） | 1,777 |
| クロスリスト collapse（154/66面 同一TR二重掲載を統合） | −59 |
| **連系点レコード（本番投入候補）** | **1,718** |
| **ユニークサイト（name＋grid_pref）** | **1,602** |
| └ distribution（実空容量あり）含むサイト | 1,463 |
| └ bulkのみサイト | 139 |
| 複数電圧面サイト（voltage_levels>1） | 107 |

### 県別（grid_pref）件数

| 県 | レコード（/grid行数見込み） | ユニークサイト |
|----|------:|------:|
| **東京都** | **516** | **470** |
| 神奈川県 | 255 | 230 |
| 埼玉県 | 229 | 219 |
| 千葉県 | 202 | 195 |
| 茨城県 | 133 | 129 |
| 群馬県 | 116 | 109 |
| 栃木県 | 107 | 101 |
| 静岡県 | 77 | 76 |
| 山梨県 | 75 | 67 |
| 福島県 | 3 | 1 |
| 長野県 | 3 | 3 |
| 新潟県 | 2 | 2 |
| **合計** | **1,718** | **1,602** |

> **「/grid 東京の実件数見込み」= 516レコード（470物理サイト）**。
> 既存8社の /grid は「1レコード=1行」で表示（例: 中部1,107レコード）。TEPCOも同方式なら東京は516行で、うち空容量を持つ actionable な配電用/22kVが大半。

---

## 2. 名寄せ・バンク合算の処理結果（完了報告②）

### 2-1. クロスリスト collapse（−59件）
154kV面と66kV面に **同一変圧器が全数値一致で二重掲載** される TEPCO PDF構造を統合。
- 例（茨城）: 水戸北部・石岡・茨城・西水戸・霞ヶ浦 が各2件→1件。
- 判定キー: (region, name) グループ内で `(電圧, 台数, 設備, 運用, 潮流, 空容量, N1可否, N1可能量)` 完全一致を1件に collapse。
- merged元の external_id は `merged_from[]` に保持（トレーサビリティ）。

### 2-2. 基幹（kikan）×県 名寄せ（10サイト）
基幹PDFの 500/275kV変電所と、県PDFの同名154kV面を **1サイトの別電圧面（voltage_levels[]）** に統合。

| サイト | 統合された面 | grid_pref |
|--------|------------|-----------|
| 新栃木 | 栃木154kV ＋ 基幹275kV(3-1,3-2) | 栃木県 |
| 新岡部 | 群馬154kV ＋ 基幹275kV(8-1,8-2) | 群馬県 |
| 新新田 | 群馬154kV ＋ 基幹275kV(7-1) | 群馬県 |
| 新筑波 | 茨城154kV ＋ 基幹275kV(4-1) | 茨城県 |
| 新坂戸 | 埼玉66kV ＋ 基幹275kV(20-1) | 埼玉県 |
| 新京葉 | 千葉154/66kV ＋ 基幹275kV(14-1) | 千葉県 |
| 房総 | 千葉154kV ＋ 基幹275kV(12-1) | 千葉県 |
| 新豊洲 | 東京23区66kV ＋ 基幹275kV(23-1) | 東京都 |
| 新秦野 | 神奈川154kV ＋ 基幹275kV(18-1,18-2) | 神奈川県 |
| 新福島 | 福島66kV ＋ 基幹275kV(1-1,1-2) | 福島県 |

- **23区↔多摩の誤マージは0件**（複数region サイトは上記10件＝すべて基幹×県の正当な統合のみ）。

### 2-3. grid_pref 補完（未解決0件）
- 県側レコード: 既設の grid_pref（東京23区/多摩→東京都、静岡富士川以東→静岡県 等）。
- kikan: 同名県マッチ10件は県を継承。kikan-only 13件は地理マップで付与（新茂木→栃木、東山梨→山梨 等）。
- **kikan grid_pref 未解決 = 0**。

### 2-4. バンク合算行のフラグ化
- `notes` に「合算」を含む行（新栃木 運用3,204＝500/154・500/275バンク合算 等）に `bank_aggregated=true` を付与。
- **容量集計時の注意**: `capacity_total_mw` をサイトの voltage_levels で素朴に合算すると過大計上。空容量(`cap_avail_mw`)は bulk=null のため `cap_avail_mw` の単純合計は二重計上しない（安全）。

### 2-5. 副産物: external_id は一意でない（重要）
- `変埼玉県 66kV 11`（京北）が **154/66バンクと275/66バンクの2本**で同一No.を共有。
- → 名寄せキーに external_id は使えない（task所見どおり）。**(name＋grid_pref) を採用済**。slug(`tpg-NNNN`)で一意性を担保。

---

## 3. 既存スキーマへのマッピング可否＋不足フィールド（完了報告③）

### 3-1. 写像可否: ✅ 過不足なく可能（ブロッカーなし）
既存 static schema（`src/data/substations/<県>.json`、全6,507件で共通の16フィールド）に全1,718件をマッピング。

| 検証 | 結果 |
|------|------|
| コア16フィールド全件存在 | ✅ YES |
| 型互換（既存 vs grid_ready） | ✅ 一致（null許容フィールドのみ差） |
| slug 一意性 | ✅ 1,718/1,718 |
| 値の劣化（PDF検証値との一致） | ✅ trace 0不一致 |

**マッピング規則**:
```
id/slug              = tpg-0001 … tpg-1718（新規プレフィックス tpg）
name                 = サイト名（複数面サイトは (1)(2)(3) サフィックス、中部「遠江(1)」慣習踏襲）
operator             = 東京電力パワーグリッド
area                 = 東京
prefecture           = grid_pref
voltage_primary/secondary_kv = 電圧1次/2次（配電用/22kVは1次null）
capacity_total_mw    = 設備容量
cap_operational_mw   = 運用容量値
cap_avail_mw         = 空容量(当該)　← distributionのみ実数、bulkはnull(N-1可能量で表現)
n1_eligible          = N-1電制可否
oc_possibility       = 平常時出力制御（有り/なし）
latitude/longitude   = null（地図は2c+）
last_updated         = 2026-04-23T00:00:00.000Z
```

### 3-2. 不足フィールド一覧

**(a) TEPCOが埋められない既存フィールド（データ欠）**
| フィールド | 欠落件数 | 理由・対応 |
|-----------|--------:|-----------|
| latitude / longitude | 1,718/1,718 | TEPCO PDFに座標なし。地図はPhase 2c+でジオコーディング（北海道と同様「地図は将来対応」）。/grid一覧・診断ツールは座標なしで動作。 |
| voltage_primary_kv | 1,521/1,718 | 配電用変電所・22kVは1次電圧を非掲載（TEPCO仕様）。表示は条件分岐で無害。 |
| oc_possibility | 414/1,718 | 一部行で「-」。null許容。 |

**(b) 既存16フィールドに「枠がない」TEPCO固有データ（情報損失リスク）**
16フィールドschemaには下記の枠がなく、static格納だと脱落する。**microCMS full型（`Substation`）にはすべて枠がある**ため、microCMS投入なら保持可能。grid_ready には非破壊の拡張キーとして同梱済（staticコンシューマは無視）。

| 拡張フィールド | 内容 | microCMS full型 |
|--------------|------|:--:|
| forecast_flow_mw | 予想潮流 | ✅ あり |
| n1_capacity_mw | N-1電制可能量 | ✅ あり |
| cap_avail_upper_mw | 空容量(上位系考慮) | ✅ あり |
| units | 台数 | ✅ あり |
| voltage_class | 電圧クラス | ✅ あり(配列) |
| external_id | TEPCO位置ID | ✅ あり |
| notes | 備考（バンク合算注記等） | ✅ あり |
| source_url | 出典 | ✅ あり(必須) |
| bank_aggregated | 合算フラグ（独自） | （notesで代替可） |

→ **不足は実質「緯度経度」のみ（後回し可）。** 他は16フィールドschemaの表現力の問題で、microCMS full型なら全保持。

### 3-3. 既存prefecture ファイルとの衝突（2c要対応）
TEPCOの13県のうち **4県は既に他社データのファイルが存在** → 追加マージ（上書き禁止）。

| 県 | TEPCO件数 | 既存ファイル |
|----|------:|------|
| 静岡県 | 77 | ★中部電力PG（富士川以西）。TEPCOは富士川以東を追加 |
| 福島県 | 3 | ★東北電力NW。TEPCOは一部を追加 |
| 長野県 | 3 | ★中部電力PG。TEPCOは一部を追加 |
| 新潟県 | 2 | ★東北電力NW。TEPCOは一部を追加 |
| 他9県（東京/神奈川/埼玉/千葉/茨城/群馬/栃木/山梨） | 1,633 | 新規ファイル |

各レコードは `operator` フィールドで区別されるため共存可。マージは **append**（既存他社レコードを消さない）。

---

## 4. 投入方式の推奨＋2c手順案（完了報告④）

### 4-1. データストア構成（現状把握）
- **microCMS `substations` endpoint**: `/grid` ページが build時に `getSubstationsByPrefecture`（microCMS）で読む。既存8社6,507件はここ。
- **static `src/data/substations/<県>.json`**: 連系診断ツール（`GridConnectionChecker`）が `import('@/data/substations/${prefecture}.json')` で読む。
- 両者は並行ストア。**他8社と同方式 = 両方に投入**。

### 4-2. 推奨投入方式
**既存8社と同一方式（microCMS substations endpoint ＋ static per-prefecture JSON の二重投入）**。
- microCMS: full型で投入すれば forecast_flow / n1_capacity / notes 等も保持（情報損失なし）。
- static: 16フィールド（＋拡張キー）で per-prefecture JSON生成。4県は append マージ。
- 負荷（鉄則#2/#3）: `/grid` 各県・エリアページは **SSG/ISR（build時読み・revalidate=3600）** でcrawler同時アクセスではない。+1,718件はbuild時読みが増えるのみで鉄則の「build時事前計算」パターン内。**2cでは microCMS への一括 import（書き込み1回）＋ build再生成** で完結。

### 4-3. 2c（本番投入）手順案
```
1. area-meta.ts に tokyo エントリ追加
   { slug:'tokyo', areaJp:'東京', operator:'東京電力パワーグリッド',
     landingUrl:'https://www.tepco.co.jp/pg/consignment/system/',
     description:'東京エリア…13都県＋基幹系…' }
   AREA_JP_TO_SLUG に 東京:'tokyo' 追加
   ⚠ slug衝突: 既存 static route /grid/tokyo（公開停止/再開の解説ページ、本セッションで更新済）が
     /grid/[slug] の tokyo を shadow する。→ 既存 /grid/tokyo をエリアランディングへ転用 or 別slug。

2. microCMS substations へ tepco_grid_ready の1,718件を一括import（full型、PATCH冪等）。
   - slug=tpg-NNNN を contentId に。operator/area/voltage_class/oc_possibility は配列化（microCMSのselect仕様）。

3. static per-prefecture JSON 生成/マージ
   - 新規9県: src/data/substations/<県>.json を新規作成。
   - 既存4県（静岡/福島/長野/新潟）: 既存配列に TEPCO レコードを append。
   - index.json の total/by_pref を再計算（6,507 → 8,225）。

4. 検証（鉄則#5）: build PASS、/grid/prefecture/東京都・/grid/tokyo・診断ツールの curl目視、
   主要サイト（横浜・新豊洲）の空容量がPDF一致を確認。

5. 緯度経度・送電線・地図は Phase 2d 以降（北海道と同じく「地図は将来対応」で先行公開可）。
```

### 4-4. サンプル目視（東京23区・神奈川 主要サイト、空容量正当性）
| サイト | 県 | 電圧 | 設備MW | 空容量MW | N-1 | 備考 |
|--------|----|------|------:|------:|----|------|
| 新豊洲(1) | 東京都 | 500/275 | 3,000 | null(基幹) | 可 | n1可能量1,140 |
| 横浜(1) | 神奈川県 | 154/66 | 600 | null(基幹) | 可 | n1可能量117 |
| 横浜(2) | 神奈川県 | 22kV | 171 | **57** | 不可 | 配電網22kV |
| 横浜(3) | 神奈川県 | 配電用 | 57 | **19** | 不可 | |
| 川崎(2) | 神奈川県 | 22kV | 85 | **51** | 不可 | |
| 塩浜(3) | 神奈川県 | 配電用 | 33 | **14** | 不可 | |

すべて Phase 2a の PDF検証値と一致（横浜22kV=57, 川崎22kV=51 等）。サイトは name で1件に束ねられ、電圧面ごとに正しい空容量を保持。

---

## 5. 成果物ファイル

```
scripts/experimental/tepco/
├── dedup_tepco.py        … dedup+正規化（クロスリスト collapse / kikan名寄せ / grid_pref補完）
├── phase_b_map.py        … 本番16フィールドschemaへの写像
├── validate_schema.py    … schema互換・不足フィールド・県衝突 検証
├── verify_dedup.py       … dedup正当性（誤マージ検出・サンプル目視）
├── trace_check.py        … grid_ready値がPDF検証値と一致するか追跡
├── investigate_dedup.py  … 電圧面クロスリスト/既存事業者慣習の実態調査
├── tepco_dedup.json      … ★サイト単位（voltage_levels[]）＋統計
├── tepco_grid_ready.json … ★本番投入候補（1,718レコード、16コア＋拡張）
└── tepco_phase2b_findings.md … 本ファイル
```

2c はこの `tepco_grid_ready.json` を入力に、microCMS import ＋ static JSON マージ ＋ area-meta追加を行う。
