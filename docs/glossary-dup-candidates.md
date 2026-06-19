# Glossary 重複候補レポート（P1 Stage1）

> **READ ONLY レポート。301リダイレクト・削除は Stage2（ユウ監査後）に実施。**

## サマリー

| 項目 | 値 |
|------|-----|
| 全エントリ数 | 1522 |
| 重複グループ数 | 134 |
| Rule A（slug-detail） | 34 |
| Rule B（term正規化） | 92 |
| Rule C（english正規化） | 8 |
| 301候補総数 | 145 |
| 生成日時 | 2026-06-19T12:46:15.463Z |

## 重複グループ詳細

各グループの確認事項:
- `canonicalSlug` が正しい canonical か確認
- `redirectSlugs` の内容が duplicate／旧スタブか確認
- 問題なければ Stage2 で `middleware.ts` に 301 追加

### 1. 🔴 [A_slug_detail] capex

**信頼度**: high | **ルール**: A_slug_detail

> "capex-detail" は "-detail" サフィックスを持ち、"capex" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `capex` ✅ canonical | CAPEX | Capital Expenditure | 事業 | 2026-05-13 |
| `capex-detail` 🔁 301候補 | CAPEX | Capital Expenditure | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/capex-detail'] = '/glossary/capex'`

---

### 2. 🔴 [A_slug_detail] ccs

**信頼度**: high | **ルール**: A_slug_detail

> "ccs-detail" は "-detail" サフィックスを持ち、"ccs" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ccs` ✅ canonical | CCS | Carbon Capture and Storage | 技術/市場制度 | 2026-05-13 |
| `ccs-detail` 🔁 301候補 | CCS | Carbon Capture and Storage | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ccs-detail'] = '/glossary/ccs'`

---

### 3. 🔴 [A_slug_detail] ce-marking

**信頼度**: high | **ルール**: A_slug_detail

> "ce-marking-detail" は "-detail" サフィックスを持ち、"ce-marking" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ce-marking` ✅ canonical | CE適合性宣言 | CE Conformity Declaration | 技術/安全 | 2026-05-13 |
| `ce-marking-detail` 🔁 301候補 | CE Marking | CE Marking | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ce-marking-detail'] = '/glossary/ce-marking'`

---

### 4. 🔴 [A_slug_detail] curtailment

**信頼度**: high | **ルール**: A_slug_detail

> "curtailment-detail" は "-detail" サフィックスを持ち、"curtailment" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `curtailment` ✅ canonical | 出力制御 | Output Curtailment | 市場制度 | 2026-05-13 |
| `curtailment-detail` 🔁 301候補 | Curtailment | Curtailment | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/curtailment-detail'] = '/glossary/curtailment'`

---

### 5. 🔴 [A_slug_detail] c-rate

**信頼度**: high | **ルール**: A_slug_detail

> "c-rate-detail" は "-detail" サフィックスを持ち、"c-rate" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `c-rate` ✅ canonical | Cレート | C-rate | 技術 | 2026-05-13 |
| `c-rate-detail` 🔁 301候補 | Cレート | C-Rate | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/c-rate-detail'] = '/glossary/c-rate'`

---

### 6. 🔴 [A_slug_detail] dscr

**信頼度**: high | **ルール**: A_slug_detail

> "dscr-detail" は "-detail" サフィックスを持ち、"dscr" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `dscr` ✅ canonical | DSCR | Debt Service Coverage Ratio | 事業 | 2026-05-13 |
| `dscr-detail` 🔁 301候補 | DSCR | Debt Service Coverage Ratio | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/dscr-detail'] = '/glossary/dscr'`

---

### 7. 🔴 [A_slug_detail] eu-ets

**信頼度**: high | **ルール**: A_slug_detail

> "eu-ets-detail" は "-detail" サフィックスを持ち、"eu-ets" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `eu-ets` ✅ canonical | EU ETS（欧州排出量取引制度） | EU Emissions Trading System | 市場制度 | 2026-06-10 |
| `eu-ets-detail` 🔁 301候補 | EU ETS | EU Emissions Trading System | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/eu-ets-detail'] = '/glossary/eu-ets'`

---

### 8. 🔴 [A_slug_detail] eu-battery-regulation

**信頼度**: high | **ルール**: A_slug_detail

> "eu-battery-regulation-detail" は "-detail" サフィックスを持ち、"eu-battery-regulation" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `eu-battery-regulation` ✅ canonical | EU電池規則 | EU Battery Regulation | 市場制度/法務 | 2026-05-13 |
| `eu-battery-regulation-detail` 🔁 301候補 | EU電池規則 | EU Battery Regulation | 市場制度/法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/eu-battery-regulation-detail'] = '/glossary/eu-battery-regulation'`

---

### 9. 🔴 [A_slug_detail] iec

**信頼度**: high | **ルール**: A_slug_detail

> "iec-detail" は "-detail" サフィックスを持ち、"iec" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `iec` ✅ canonical | IEC | International Electrotechnical Commission | 技術 | 2026-05-13 |
| `iec-detail` 🔁 301候補 | IEC | International Electrotechnical Commission | 市場制度/法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/iec-detail'] = '/glossary/iec'`

---

### 10. 🔴 [A_slug_detail] ieee

**信頼度**: high | **ルール**: A_slug_detail

> "ieee-detail" は "-detail" サフィックスを持ち、"ieee" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ieee` ✅ canonical | IEEE | Institute of Electrical and Electronics Engineers | 技術 | 2026-05-13 |
| `ieee-detail` 🔁 301候補 | IEEE | Institute of Electrical and Electronics Engineers | 市場制度/法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ieee-detail'] = '/glossary/ieee'`

---

### 11. 🔴 [A_slug_detail] iot

**信頼度**: high | **ルール**: A_slug_detail

> "iot-detail" は "-detail" サフィックスを持ち、"iot" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `iot` ✅ canonical | IoT | Internet of Things | 技術 | 2026-05-13 |
| `iot-detail` 🔁 301候補 | IoT | Internet of Things | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/iot-detail'] = '/glossary/iot'`

---

### 12. 🔴 [A_slug_detail] mezzanine

**信頼度**: high | **ルール**: A_slug_detail

> "mezzanine-detail" は "-detail" サフィックスを持ち、"mezzanine" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `mezzanine` ✅ canonical | メザニン | Mezzanine Finance | 事業 | 2026-05-13 |
| `mezzanine-detail` 🔁 301候補 | Mezzanine | Mezzanine | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/mezzanine-detail'] = '/glossary/mezzanine'`

---

### 13. 🔴 [A_slug_detail] npv

**信頼度**: high | **ルール**: A_slug_detail

> "npv-detail" は "-detail" サフィックスを持ち、"npv" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `npv` ✅ canonical | NPV | Net Present Value | 事業 | 2026-05-13 |
| `npv-detail` 🔁 301候補 | NPV | Net Present Value | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/npv-detail'] = '/glossary/npv'`

---

### 14. 🔴 [A_slug_detail] opex

**信頼度**: high | **ルール**: A_slug_detail

> "opex-detail" は "-detail" サフィックスを持ち、"opex" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `opex` ✅ canonical | OPEX | Operating Expenditure | 事業 | 2026-05-13 |
| `opex-detail` 🔁 301候補 | OPEX | Operating Expenditure | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/opex-detail'] = '/glossary/opex'`

---

### 15. 🔴 [A_slug_detail] ppa

**信頼度**: high | **ルール**: A_slug_detail

> "ppa-detail" は "-detail" サフィックスを持ち、"ppa" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ppa` ✅ canonical | PPA | Power Purchase Agreement | 事業 | 2026-05-13 |
| `ppa-detail` 🔁 301候補 | PPA（電力受給契約） | Power Purchase Agreement | 法務/市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ppa-detail'] = '/glossary/ppa'`

---

### 16. 🔴 [A_slug_detail] re100

**信頼度**: high | **ルール**: A_slug_detail

> "re100-detail" は "-detail" サフィックスを持ち、"re100" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `re100` ✅ canonical | RE100 | RE100 | 市場制度 | 2026-05-13 |
| `re100-detail` 🔁 301候補 | RE100 | RE100 | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/re100-detail'] = '/glossary/re100'`

---

### 17. 🔴 [A_slug_detail] scada

**信頼度**: high | **ルール**: A_slug_detail

> "scada-detail" は "-detail" サフィックスを持ち、"scada" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `scada` ✅ canonical | SCADA | Supervisory Control and Data Acquisition | 技術 | 2026-05-13 |
| `scada-detail` 🔁 301候補 | SCADA | Supervisory Control and Data Acquisition | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/scada-detail'] = '/glossary/scada'`

---

### 18. 🔴 [A_slug_detail] spinning-reserve

**信頼度**: high | **ルール**: A_slug_detail

> "spinning-reserve-detail" は "-detail" サフィックスを持ち、"spinning-reserve" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `spinning-reserve` ✅ canonical | 瞬動予備力 | Spinning Reserve | 市場制度/技術 | 2026-05-13 |
| `spinning-reserve-detail` 🔁 301候補 | Spinning Reserve | Spinning Reserve | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/spinning-reserve-detail'] = '/glossary/spinning-reserve'`

---

### 19. 🔴 [A_slug_detail] v2l

**信頼度**: high | **ルール**: A_slug_detail

> "v2l-detail" は "-detail" サフィックスを持ち、"v2l" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `v2l` ✅ canonical | V2L | Vehicle-to-Load | 技術 | 2026-05-13 |
| `v2l-detail` 🔁 301候補 | V2L | Vehicle to Load | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/v2l-detail'] = '/glossary/v2l'`

---

### 20. 🔴 [A_slug_detail] aggregator

**信頼度**: high | **ルール**: A_slug_detail

> "aggregator-detail" は "-detail" サフィックスを持ち、"aggregator" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `aggregator` ✅ canonical | アグリゲーター | Aggregator | 低圧 | 2026-05-13 |
| `aggregator-detail` 🔁 301候補 | アグリゲーター | Aggregator | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/aggregator-detail'] = '/glossary/aggregator'`

---

### 21. 🔴 [A_slug_detail] operating-lease

**信頼度**: high | **ルール**: A_slug_detail

> "operating-lease-detail" は "-detail" サフィックスを持ち、"operating-lease" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `operating-lease` ✅ canonical | オペレーティングリース | Operating Lease | 事業 | 2026-05-13 |
| `operating-lease-detail` 🔁 301候補 | オペレーティングリース | Operating Lease | 法務/市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/operating-lease-detail'] = '/glossary/operating-lease'`

---

### 22. 🔴 [A_slug_detail] carbon-pricing

**信頼度**: high | **ルール**: A_slug_detail

> "carbon-pricing-detail" は "-detail" サフィックスを持ち、"carbon-pricing" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `carbon-pricing` ✅ canonical | カーボンプライシング | Carbon Pricing | 市場制度 | 2026-06-10 |
| `carbon-pricing-detail` 🔁 301候補 | カーボンプライシング（旧・統合済） | Carbon Pricing | 市場制度 | 2026-06-10 |

**301実装メモ**: `GLOSSARY_301['/glossary/carbon-pricing-detail'] = '/glossary/carbon-pricing'`

---

### 23. 🔴 [A_slug_detail] green-bond

**信頼度**: high | **ルール**: A_slug_detail

> "green-bond-detail" は "-detail" サフィックスを持ち、"green-bond" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `green-bond` ✅ canonical | グリーンボンド | Green Bond | 事業 | 2026-05-13 |
| `green-bond-detail` 🔁 301候補 | グリーンボンド | Green Bond | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/green-bond-detail'] = '/glossary/green-bond'`

---

### 24. 🔴 [A_slug_detail] container-bess

**信頼度**: high | **ルール**: A_slug_detail

> "container-bess-detail" は "-detail" サフィックスを持ち、"container-bess" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `container-bess` ✅ canonical | コンテナBESS | Container BESS | 技術 | 2026-05-13 |
| `container-bess-detail` 🔁 301候補 | コンテナ型BESS | Container BESS | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/container-bess-detail'] = '/glossary/container-bess'`

---

### 25. 🔴 [A_slug_detail] corporate-ppa

**信頼度**: high | **ルール**: A_slug_detail

> "corporate-ppa-detail" は "-detail" サフィックスを持ち、"corporate-ppa" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `corporate-ppa` ✅ canonical | コーポレートPPA | Corporate PPA | 事業 | 2026-05-13 |
| `corporate-ppa-detail` 🔁 301候補 | コーポレートPPA | Corporate PPA | 法務/市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/corporate-ppa-detail'] = '/glossary/corporate-ppa'`

---

### 26. 🔴 [A_slug_detail] finance-lease

**信頼度**: high | **ルール**: A_slug_detail

> "finance-lease-detail" は "-detail" サフィックスを持ち、"finance-lease" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `finance-lease` ✅ canonical | ファイナンスリース | Finance Lease | 事業 | 2026-05-13 |
| `finance-lease-detail` 🔁 301候補 | ファイナンスリース | Finance Lease | 法務/市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/finance-lease-detail'] = '/glossary/finance-lease'`

---

### 27. 🔴 [A_slug_detail] microgrid

**信頼度**: high | **ルール**: A_slug_detail

> "microgrid-detail" は "-detail" サフィックスを持ち、"microgrid" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `microgrid` ✅ canonical | マイクログリッド | Microgrid | 低圧 | 2026-05-13 |
| `microgrid-detail` 🔁 301候補 | マイクログリッド | Microgrid | 技術/市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/microgrid-detail'] = '/glossary/microgrid'`

---

### 28. 🔴 [A_slug_detail] substation

**信頼度**: high | **ルール**: A_slug_detail

> "substation-detail" は "-detail" サフィックスを持ち、"substation" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `substation` ✅ canonical | 変電所 | Substation | 系統連系 | 2026-05-13 |
| `substation-detail` 🔁 301候補 | 変電所 | Substation | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/substation-detail'] = '/glossary/substation'`

---

### 29. 🔴 [A_slug_detail] response-time

**信頼度**: high | **ルール**: A_slug_detail

> "response-time-detail" は "-detail" サフィックスを持ち、"response-time" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `response-time` ✅ canonical | 駆けつけ時間 | Response Time / Call-out Time | 事業/技術 | 2026-05-13 |
| `response-time-detail` 🔁 301候補 | 応動時間 | Response Time | 技術/市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/response-time-detail'] = '/glossary/response-time'`

---

### 30. 🔴 [A_slug_detail] tokyo-subsidy

**信頼度**: high | **ルール**: A_slug_detail

> "tokyo-subsidy-detail" は "-detail" サフィックスを持ち、"tokyo-subsidy" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `tokyo-subsidy` ✅ canonical | 東京都補助金 | Tokyo Metropolitan Subsidy | 補助金 | 2026-05-13 |
| `tokyo-subsidy-detail` 🔁 301候補 | 東京都補助金 | Tokyo Subsidy | 補助金 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/tokyo-subsidy-detail'] = '/glossary/tokyo-subsidy'`

---

### 31. 🔴 [A_slug_detail] offshore-wind

**信頼度**: high | **ルール**: A_slug_detail

> "offshore-wind-detail" は "-detail" サフィックスを持ち、"offshore-wind" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `offshore-wind` ✅ canonical | 洋上風力 | Offshore Wind | 基礎 | 2026-05-13 |
| `offshore-wind-detail` 🔁 301候補 | 洋上風力 | Offshore Wind Power | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/offshore-wind-detail'] = '/glossary/offshore-wind'`

---

### 32. 🔴 [A_slug_detail] grid-scale-battery

**信頼度**: high | **ルール**: A_slug_detail

> "grid-scale-battery-detail" は "-detail" サフィックスを持ち、"grid-scale-battery" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `grid-scale-battery` ✅ canonical | 系統用蓄電池 | Grid-scale Battery | 事業/技術 | 2026-05-13 |
| `grid-scale-battery-detail` 🔁 301候補 | 系統用蓄電池 | Grid Scale Battery | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/grid-scale-battery-detail'] = '/glossary/grid-scale-battery'`

---

### 33. 🔴 [A_slug_detail] decarbonization-leading-region

**信頼度**: high | **ルール**: A_slug_detail

> "decarbonization-leading-region-detail" は "-detail" サフィックスを持ち、"decarbonization-leading-region" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `decarbonization-leading-region` ✅ canonical | 脱炭素先行地域 | Decarbonization Leading Region | 補助金 | 2026-05-13 |
| `decarbonization-leading-region-detail` 🔁 301候補 | 脱炭素先行地域 | Decarbonization Leading Region | 補助金 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/decarbonization-leading-region-detail'] = '/glossary/decarbonization-leading-region'`

---

### 34. 🔴 [A_slug_detail] battery-passport

**信頼度**: high | **ルール**: A_slug_detail

> "battery-passport-detail" は "-detail" サフィックスを持ち、"battery-passport" が canonical 候補

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `battery-passport` ✅ canonical | 電池パスポート | Battery Passport | 技術/市場制度/法務 | 2026-05-13 |
| `battery-passport-detail` 🔁 301候補 | 電池パスポート | Battery Passport | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/battery-passport-detail'] = '/glossary/battery-passport'`

---

### 35. 🟠 [B_term_norm] ah-ampere-hour

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ah" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ah-detail` 🔁 301候補 | Ah | Ampere Hour | 技術 | 2026-05-13 |
| `ah-ampere-hour` ✅ canonical | Ah（アンペア時） | Ampere-hour | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ah-detail'] = '/glossary/ah-ampere-hour'`

---

### 36. 🟠 [B_term_norm] business-continuity-plan

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "bcp" が 3 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `bcp-detail` 🔁 301候補 | BCP | Business Continuity Plan | 法務/安全 | 2026-05-13 |
| `business-continuity-plan` ✅ canonical | BCP（事業継続計画） | Business Continuity Plan | 事業 | 2026-05-13 |
| `bcp-business-continuity-plan` 🔁 301候補 | BCP（事業継続計画） | Business Continuity Plan | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/bcp-business-continuity-plan'] = '/glossary/business-continuity-plan'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/bcp-detail'] = '/glossary/business-continuity-plan'`

---

### 37. 🟠 [B_term_norm] building-energy-management-system

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "bems" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `building-energy-management-system` ✅ canonical | BEMS | Building Energy Management System | 低圧 | 2026-05-13 |
| `bems` 🔁 301候補 | BEMS | Building Energy Management System | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/bems'] = '/glossary/building-energy-management-system'`

---

### 38. 🟠 [B_term_norm] battery-energy-storage-system

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "bess" が 3 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `battery-energy-storage-system` ✅ canonical | BESS | Battery Energy Storage System | 技術 | 2026-05-13 |
| `bess-battery-energy-storage-system` 🔁 301候補 | BESS | Battery Energy Storage System | 基礎 | 2026-05-13 |
| `bess-detail-2` 🔁 301候補 | BESS | Battery Energy Storage System | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/bess-battery-energy-storage-system'] = '/glossary/battery-energy-storage-system'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/bess-detail-2'] = '/glossary/battery-energy-storage-system'`

---

### 39. 🟠 [B_term_norm] battery-management-system

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "bms" が 3 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `battery-management-system` ✅ canonical | BMS | Battery Management System | 技術 | 2026-05-13 |
| `bms-detail` 🔁 301候補 | BMS（バッテリーマネジメントシステム） | Battery Management System | 技術 | 2026-05-13 |
| `bms-battery-management-system` 🔁 301候補 | BMS（電池管理システム） | Battery Management System | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/bms-battery-management-system'] = '/glossary/battery-management-system'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/bms-detail'] = '/glossary/battery-management-system'`

---

### 40. 🟠 [B_term_norm] black-start

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "blackstart" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `black-start` ✅ canonical | Black Start | Black Start | 市場制度 | 2026-05-13 |
| `blackstart-detail` 🔁 301候補 | BlackStart | BlackStart | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/blackstart-detail'] = '/glossary/black-start'`

---

### 41. 🟠 [B_term_norm] bloombergnef

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "bloombergnef" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `bloomberg-nef` 🔁 301候補 | BloombergNEF | BloombergNEF | 市場制度 | 2026-05-13 |
| `bloombergnef` ✅ canonical | BloombergNEF | BloombergNEF | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/bloomberg-nef'] = '/glossary/bloombergnef'`

---

### 42. 🟠 [B_term_norm] caiso

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "caiso" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `caiso` ✅ canonical | CAISO | California Independent System Operator | 事業 | 2026-05-13 |
| `caiso-california` 🔁 301候補 | CAISO | California ISO | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/caiso-california'] = '/glossary/caiso'`

---

### 43. 🟠 [B_term_norm] distributed-energy-resource-2

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "der" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `der-detail` 🔁 301候補 | DER | Distributed Energy Resources | 市場制度/技術 | 2026-05-13 |
| `distributed-energy-resource-2` ✅ canonical | DER（分散電源） | Distributed Energy Resource | 低圧 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/der-detail'] = '/glossary/distributed-energy-resource-2'`

---

### 44. 🟠 [B_term_norm] der-management-system

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "derms" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `der-management-system` ✅ canonical | DERMS | Distributed Energy Resource Management System | 技術 | 2026-05-13 |
| `derms-detail` 🔁 301候補 | DERMS | Distributed Energy Resources Management System | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/derms-detail'] = '/glossary/der-management-system'`

---

### 45. 🟠 [B_term_norm] depth-of-discharge

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "dod" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `depth-of-discharge` ✅ canonical | DOD | Depth of Discharge | 技術 | 2026-05-13 |
| `dod-depth-of-discharge` 🔁 301候補 | DOD（Depth of Discharge） | Depth of Discharge | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/dod-depth-of-discharge'] = '/glossary/depth-of-discharge'`

---

### 46. 🟠 [B_term_norm] demand-response

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "dr" が 3 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `demand-response` ✅ canonical | DR（デマンドレスポンス） | Demand Response | 低圧 | 2026-05-13 |
| `dr-demand-response` 🔁 301候補 | DR（デマンドレスポンス） | Demand Response | 低圧 | 2026-05-13 |
| `dr-detail` 🔁 301候補 | DR（デマンドレスポンス） | Demand Response | 市場制度/技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/dr-demand-response'] = '/glossary/demand-response'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/dr-detail'] = '/glossary/demand-response'`

---

### 47. 🟠 [B_term_norm] energy-management-system

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ems" が 3 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `energy-management-system` ✅ canonical | EMS | Energy Management System | 技術 | 2026-05-13 |
| `ems-detail` 🔁 301候補 | EMS（エネルギーマネジメントシステム） | Energy Management System | 技術 | 2026-05-13 |
| `ems-energy-management-system` 🔁 301候補 | EMS（エネルギーマネジメントシステム） | Energy Management System | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ems-energy-management-system'] = '/glossary/energy-management-system'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/ems-detail'] = '/glossary/energy-management-system'`

---

### 48. 🟠 [B_term_norm] ercot

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ercot" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ercot` ✅ canonical | ERCOT | Electric Reliability Council of Texas | 事業 | 2026-05-13 |
| `ercot-texas` 🔁 301候補 | ERCOT | Electric Reliability Council of Texas | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ercot-texas'] = '/glossary/ercot'`

---

### 49. 🟠 [B_term_norm] ess-energy-storage-system

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ess" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ess-detail` 🔁 301候補 | ESS | Energy Storage System | 技術 | 2026-05-13 |
| `ess-energy-storage-system` ✅ canonical | ESS | Energy Storage System | 基礎 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ess-detail'] = '/glossary/ess-energy-storage-system'`

---

### 50. 🟠 [B_term_norm] enerc

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "enerc" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `enerc-catl-product` 🔁 301候補 | EnerC | EnerC | 技術 | 2026-05-13 |
| `enerc` ✅ canonical | EnerC | CATL EnerC | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/enerc-catl-product'] = '/glossary/enerc'`

---

### 51. 🟠 [B_term_norm] ferc

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ferc" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ferc` ✅ canonical | FERC | Federal Energy Regulatory Commission | 市場制度 | 2026-05-13 |
| `ferc-usa` 🔁 301候補 | FERC | Federal Energy Regulatory Commission | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ferc-usa'] = '/glossary/ferc'`

---

### 52. 🟠 [B_term_norm] fast-frequency-response

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ffr" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `fast-frequency-response` ✅ canonical | FFR | Fast Frequency Response | 市場制度 | 2026-05-13 |
| `ffr` 🔁 301候補 | FFR（高速周波数応答） | Fast Frequency Response | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ffr'] = '/glossary/fast-frequency-response'`

---

### 53. 🟠 [B_term_norm] frt-fault-ride-through

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "frt" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `frt` 🔁 301候補 | FRT | Fault Ride Through | 技術/系統連系 | 2026-05-13 |
| `frt-fault-ride-through` ✅ canonical | FRT（事故時運転継続） | Fault Ride-Through | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/frt'] = '/glossary/frt-fault-ride-through'`

---

### 54. 🟠 [B_term_norm] gwh-gigawatt-hour

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "gwh" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `gwh-detail` 🔁 301候補 | GWh | Gigawatt Hour | 技術 | 2026-05-13 |
| `gwh-gigawatt-hour` ✅ canonical | GWh（ギガワット時） | Gigawatt-hour | 基礎 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/gwh-detail'] = '/glossary/gwh-gigawatt-hour'`

---

### 55. 🟠 [B_term_norm] home-energy-management-system

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "hems" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `hems` 🔁 301候補 | HEMS | Home Energy Management System | 低圧 | 2026-05-13 |
| `home-energy-management-system` ✅ canonical | HEMS | Home Energy Management System | 低圧 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/hems'] = '/glossary/home-energy-management-system'`

---

### 56. 🟠 [B_term_norm] iea

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "iea" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `iea-international` 🔁 301候補 | IEA | International Energy Agency | 市場制度 | 2026-05-13 |
| `iea` ✅ canonical | IEA（国際エネルギー機関） | International Energy Agency | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/iea-international'] = '/glossary/iea'`

---

### 57. 🟠 [B_term_norm] ira-us

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ira" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ira-us` ✅ canonical | IRA | Inflation Reduction Act | 市場制度/法務 | 2026-05-13 |
| `ira-usa-detail` 🔁 301候補 | IRA | Inflation Reduction Act | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ira-usa-detail'] = '/glossary/ira-us'`

---

### 58. 🟠 [B_term_norm] internal-rate-of-return

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "irr" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `internal-rate-of-return` ✅ canonical | IRR | Internal Rate of Return | 事業 | 2026-05-13 |
| `irr` 🔁 301候補 | IRR | Internal Rate of Return | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/irr'] = '/glossary/internal-rate-of-return'`

---

### 59. 🟠 [B_term_norm] j-credit

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "jクレジット" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `j-credit` ✅ canonical | J-クレジット | J-Credit | 市場制度 | 2026-05-13 |
| `j-credit-japan` 🔁 301候補 | J-クレジット | J-Credit | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/j-credit-japan'] = '/glossary/j-credit'`

---

### 60. 🟠 [B_term_norm] jera

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "jera" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `jera` ✅ canonical | JERA | JERA Co., Inc. | 事業 | 2026-05-13 |
| `jera-japan` 🔁 301候補 | JERA | JERA Co Inc | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/jera-japan'] = '/glossary/jera'`

---

### 61. 🟠 [B_term_norm] lithium-iron-phosphate

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "lfp電池" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `lfp-battery-detail` 🔁 301候補 | LFP電池 | Lithium Iron Phosphate Battery | 技術 | 2026-05-13 |
| `lithium-iron-phosphate` ✅ canonical | LFP電池 | Lithium Iron Phosphate Battery (LFP) | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/lfp-battery-detail'] = '/glossary/lithium-iron-phosphate'`

---

### 62. 🟠 [B_term_norm] mtbf

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "mtbf" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `mtbf` ✅ canonical | MTBF | Mean Time Between Failures | O&M | 2026-05-13 |
| `mtbf-mean-time-between-failures` 🔁 301候補 | MTBF | Mean Time Between Failures | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/mtbf-mean-time-between-failures'] = '/glossary/mtbf'`

---

### 63. 🟠 [B_term_norm] mttr

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "mttr" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `mttr` ✅ canonical | MTTR | Mean Time To Repair | O&M | 2026-05-13 |
| `mttr-mean-time-to-repair` 🔁 301候補 | MTTR | Mean Time To Repair | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/mttr-mean-time-to-repair'] = '/glossary/mttr'`

---

### 64. 🟠 [B_term_norm] megawatt-hour

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "mwh" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `mwh-detail` 🔁 301候補 | MWh | Megawatt Hour | 技術 | 2026-05-13 |
| `megawatt-hour` ✅ canonical | MWh | Megawatt-hour | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/mwh-detail'] = '/glossary/megawatt-hour'`

---

### 65. 🟠 [B_term_norm] new-energy-and-industrial-technology-development-organization

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "nedo" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `nedo` 🔁 301候補 | NEDO | New Energy and Industrial Technology Development Organization | 補助金 | 2026-05-13 |
| `new-energy-and-industrial-technology-development-organization` ✅ canonical | NEDO | New Energy and Industrial Technology Development Organization | 補助金 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/nedo'] = '/glossary/new-energy-and-industrial-technology-development-organization'`

---

### 66. 🟠 [B_term_norm] operation-maintenance

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "o&m" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `om-operation-maintenance` 🔁 301候補 | O&M | Operation & Maintenance | O&M | 2026-05-13 |
| `operation-maintenance` ✅ canonical | O&M | Operation and Maintenance | 事業/技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/om-operation-maintenance'] = '/glossary/operation-maintenance'`

---

### 67. 🟠 [B_term_norm] organization-for-cross-regional-coordination-of-transmission-operators

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "occto" が 3 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `organization-for-cross-regional-coordination-of-transmission-operators` ✅ canonical | OCCTO | Organization for Cross-regional Coordination of Transmission Operators | 法務 | 2026-05-13 |
| `occto-japan-org` 🔁 301候補 | OCCTO | Organization for Cross-regional Coordination of Transmission Operators | 市場制度 | 2026-05-13 |
| `occto` 🔁 301候補 | OCCTO | Organization for Cross-regional Coordination of Transmission Operators | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/occto'] = '/glossary/organization-for-cross-regional-coordination-of-transmission-operators'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/occto-japan-org'] = '/glossary/organization-for-cross-regional-coordination-of-transmission-operators'`

---

### 68. 🟠 [B_term_norm] pbt-payback-time

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "pbt" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `pbt` 🔁 301候補 | PBT | Payback Time | 事業 | 2026-05-13 |
| `pbt-payback-time` ✅ canonical | PBT（投資回収期間） | Payback Time | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/pbt'] = '/glossary/pbt-payback-time'`

---

### 69. 🟠 [B_term_norm] power-conditioning-system

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "pcs" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `power-conditioning-system` ✅ canonical | PCS | Power Conditioning System | 技術 | 2026-05-13 |
| `pcs-detail` 🔁 301候補 | PCS（パワーコンディショナー） | Power Conditioning System | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/pcs-detail'] = '/glossary/power-conditioning-system'`

---

### 70. 🟠 [B_term_norm] pjm

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "pjm" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `pjm` ✅ canonical | PJM | PJM Interconnection | 事業 | 2026-05-13 |
| `pjm-interconnection` 🔁 301候補 | PJM | PJM Interconnection | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/pjm-interconnection'] = '/glossary/pjm'`

---

### 71. 🟠 [B_term_norm] powertitan

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "powertitan" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `powertitan` ✅ canonical | PowerTitan | Sungrow PowerTitan | 技術 | 2026-05-13 |
| `powertitan-sungrow` 🔁 301候補 | PowerTitan | PowerTitan | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/powertitan-sungrow'] = '/glossary/powertitan'`

---

### 72. 🟠 [B_term_norm] repowereu

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "repowereu" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `repower-eu` 🔁 301候補 | REPower EU | REPower EU | 市場制度 | 2026-05-13 |
| `repowereu` ✅ canonical | REPowerEU | REPowerEU Plan | 市場制度/法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/repower-eu'] = '/glossary/repowereu'`

---

### 73. 🟠 [B_term_norm] rul

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "rul" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `rul-remaining-life` 🔁 301候補 | RUL | Remaining Useful Life | 技術 | 2026-05-13 |
| `rul` ✅ canonical | RUL | Remaining Useful Life | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/rul-remaining-life'] = '/glossary/rul'`

---

### 74. 🟠 [B_term_norm] sustainable-open-innovation-initiative

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "sii" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `sii` 🔁 301候補 | SII | Sustainable open Innovation Initiative | 補助金 | 2026-05-13 |
| `sustainable-open-innovation-initiative` ✅ canonical | SII（環境共創イニシアチブ） | Sustainable Open Innovation Initiative | 補助金 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/sii'] = '/glossary/sustainable-open-innovation-initiative'`

---

### 75. 🟠 [B_term_norm] sla-service-level-agreement

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "sla" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `sla-service-level-agreement` ✅ canonical | SLA | Service Level Agreement | 事業 | 2026-05-13 |
| `sla-detail` 🔁 301候補 | SLA | Service Level Agreement | 法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/sla-detail'] = '/glossary/sla-service-level-agreement'`

---

### 76. 🟠 [B_term_norm] state-of-charge

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "soc" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `state-of-charge` ✅ canonical | SOC | State of Charge | 技術 | 2026-05-13 |
| `soc-state-of-charge` 🔁 301候補 | SOC | State of Charge | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/soc-state-of-charge'] = '/glossary/state-of-charge'`

---

### 77. 🟠 [B_term_norm] state-of-health

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "soh" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `state-of-health` ✅ canonical | SOH | State of Health | 技術 | 2026-05-13 |
| `soh-state-of-health` 🔁 301候補 | SOH | State of Health | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/soh-state-of-health'] = '/glossary/state-of-health'`

---

### 78. 🟠 [B_term_norm] special-purpose-company

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "spc" が 3 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `special-purpose-company` ✅ canonical | SPC | Special Purpose Company | 事業 | 2026-05-13 |
| `spc` 🔁 301候補 | SPC | Special Purpose Company | 事業 | 2026-05-13 |
| `spc-special-purpose` 🔁 301候補 | SPC（特別目的会社） | Special Purpose Company | 市場制度/法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/spc'] = '/glossary/special-purpose-company'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/spc-special-purpose'] = '/glossary/special-purpose-company'`

---

### 79. 🟠 [B_term_norm] sustech

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "sustech" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `sustech-japan-ems` 🔁 301候補 | Sustech | Sustech | 技術 | 2026-05-13 |
| `sustech` ✅ canonical | Sustech | Sustech Inc. | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/sustech-japan-ems'] = '/glossary/sustech'`

---

### 80. 🟠 [B_term_norm] tcfd

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "tcfd" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `tcfd` ✅ canonical | TCFD | Task Force on Climate-related Financial Disclosures | 事業 | 2026-05-13 |
| `tcfd-disclosure` 🔁 301候補 | TCFD | Task Force on Climate-related Financial Disclosures | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/tcfd-disclosure'] = '/glossary/tcfd'`

---

### 81. 🟠 [B_term_norm] tensor-energy

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "tensorenergy" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `tensor-energy` ✅ canonical | Tensor Energy | Tensor Energy | 事業 | 2026-05-13 |
| `tensor-energy-ems` 🔁 301候補 | Tensor Energy | Tensor Energy | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/tensor-energy-ems'] = '/glossary/tensor-energy'`

---

### 82. 🟠 [B_term_norm] ul-9540a

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ul9540a" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ul-9540a` ✅ canonical | UL 9540A | UL 9540A | 安全 | 2026-05-13 |
| `ul-9540a-standard` 🔁 301候補 | UL9540A | UL 9540A | 技術/安全 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ul-9540a-standard'] = '/glossary/ul-9540a'`

---

### 83. 🟠 [B_term_norm] ul-9540

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ul9540" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ul-9540-standard` 🔁 301候補 | UL9540 | UL 9540 | 技術/安全 | 2026-05-13 |
| `ul-9540` ✅ canonical | UL9540 | UL 9540 | 安全 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ul-9540-standard'] = '/glossary/ul-9540'`

---

### 84. 🟠 [B_term_norm] vehicle-to-grid

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "v2g" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `vehicle-to-grid` ✅ canonical | V2G | Vehicle to Grid | 技術/事業 | 2026-05-13 |
| `v2g-detail` 🔁 301候補 | V2G | Vehicle to Grid | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/v2g-detail'] = '/glossary/vehicle-to-grid'`

---

### 85. 🟠 [B_term_norm] vehicle-to-home

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "v2h" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `v2h-detail` 🔁 301候補 | V2H | Vehicle to Home | 技術 | 2026-05-13 |
| `vehicle-to-home` ✅ canonical | V2H | Vehicle-to-Home | 低圧 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/v2h-detail'] = '/glossary/vehicle-to-home'`

---

### 86. 🟠 [B_term_norm] v2x

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "v2x" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `v2x` ✅ canonical | V2X | Vehicle-to-Everything | 技術 | 2026-05-13 |
| `v2x-vehicle-to-x` 🔁 301候補 | V2X | Vehicle to Everything | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/v2x-vehicle-to-x'] = '/glossary/v2x'`

---

### 87. 🟠 [B_term_norm] virtual-power-plant

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "vpp" が 3 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `vpp-detail` 🔁 301候補 | VPP | Virtual Power Plant | 市場制度/技術 | 2026-05-13 |
| `virtual-power-plant` ✅ canonical | VPP | Virtual Power Plant | 技術/事業 | 2026-05-13 |
| `vpp-virtual-power-plant` 🔁 301候補 | VPP（仮想発電所） | Virtual Power Plant | 低圧 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/vpp-virtual-power-plant'] = '/glossary/virtual-power-plant'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/vpp-detail'] = '/glossary/virtual-power-plant'`

---

### 88. 🟠 [B_term_norm] kilowatt-hour

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "kwh" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `kilowatt-hour` ✅ canonical | kWh | Kilowatt-hour | 技術 | 2026-05-13 |
| `kwh-unit-detail` 🔁 301候補 | kWh | Kilowatt Hour | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/kwh-unit-detail'] = '/glossary/kilowatt-hour'`

---

### 89. 🟠 [B_term_norm] imbalance-charge

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "インバランス料金" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `imbalance-fee-detail` 🔁 301候補 | インバランス料金 | Imbalance Fee | 市場制度 | 2026-05-13 |
| `imbalance-charge` ✅ canonical | インバランス料金 | Imbalance Charge | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/imbalance-fee-detail'] = '/glossary/imbalance-charge'`

---

### 90. 🟠 [B_term_norm] infrastructure-fund

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "インフラファンド" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `infrastructure-fund` ✅ canonical | インフラファンド | Infrastructure Fund | 事業 | 2026-05-13 |
| `infra-fund` 🔁 301候補 | インフラファンド | Infrastructure Fund | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/infra-fund'] = '/glossary/infrastructure-fund'`

---

### 91. 🟠 [B_term_norm] gas-release

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ガス放出" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `gas-venting` 🔁 301候補 | ガス放出 | Gas Venting | 技術/安全 | 2026-05-13 |
| `gas-release` ✅ canonical | ガス放出 | Gas Release | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/gas-venting'] = '/glossary/gas-release'`

---

### 92. 🟠 [B_term_norm] cobalt

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "コバルト" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `cobalt` ✅ canonical | コバルト | Cobalt | 技術 | 2026-05-13 |
| `cobalt-resource` 🔁 301候補 | コバルト | Cobalt | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/cobalt-resource'] = '/glossary/cobalt'`

---

### 93. 🟠 [B_term_norm] day-ahead-market

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "スポット市場" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `spot-market` 🔁 301候補 | スポット市場 | Spot Market | 市場制度 | 2026-05-13 |
| `day-ahead-market` ✅ canonical | スポット市場（日々） | Day-Ahead Spot Market | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/spot-market'] = '/glossary/day-ahead-market'`

---

### 94. 🟠 [B_term_norm] nickel

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ニッケル" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `nickel` ✅ canonical | ニッケル | Nickel | 技術 | 2026-05-13 |
| `nickel-resource` 🔁 301候補 | ニッケル | Nickel | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/nickel-resource'] = '/glossary/nickel'`

---

### 95. 🟠 [B_term_norm] peak-cut

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ピクカット" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `peak-cut` ✅ canonical | ピークカット | Peak Cut | 事業 | 2026-05-13 |
| `peak-cutting` 🔁 301候補 | ピークカット | Peak Cutting | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/peak-cutting'] = '/glossary/peak-cut'`

---

### 96. 🟠 [B_term_norm] peak-shift

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "ピクシフト" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `peak-shift` ✅ canonical | ピークシフト | Peak Shift | 事業 | 2026-05-13 |
| `peak-shifting` 🔁 301候補 | ピークシフト | Peak Shifting | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/peak-shifting'] = '/glossary/peak-shift'`

---

### 97. 🟠 [B_term_norm] main-auction

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "メインオクション" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `main-auction-jp` 🔁 301候補 | メインオークション | Main Auction | 市場制度 | 2026-05-13 |
| `main-auction` ✅ canonical | メインオークション | Main Auction | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/main-auction-jp'] = '/glossary/main-auction'`

---

### 98. 🟠 [B_term_norm] lithium

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "リチウム" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `lithium` ✅ canonical | リチウム | Lithium | 技術 | 2026-05-13 |
| `lithium-resource` 🔁 301候補 | リチウム | Lithium | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/lithium-resource'] = '/glossary/lithium'`

---

### 99. 🟠 [B_term_norm] general-transmission-distribution

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "一般送配電事業者" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `tso-japan-detail` 🔁 301候補 | 一般送配電事業者 | Transmission and Distribution Operator | 市場制度 | 2026-05-13 |
| `general-transmission-distribution` ✅ canonical | 一般送配電事業者 | General Transmission and Distribution Business | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/tso-japan-detail'] = '/glossary/general-transmission-distribution'`

---

### 100. 🟠 [B_term_norm] mitsubishi-corp

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "三菱商事" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `mitsubishi-corporation` 🔁 301候補 | 三菱商事 | Mitsubishi Corporation | 市場制度 | 2026-05-13 |
| `mitsubishi-corp` ✅ canonical | 三菱商事 | Mitsubishi Corporation | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/mitsubishi-corporation'] = '/glossary/mitsubishi-corp'`

---

### 101. 🟠 [B_term_norm] marubeni

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "丸紅" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `marubeni-japan` 🔁 301候補 | 丸紅 | Marubeni Corporation | 市場制度 | 2026-05-13 |
| `marubeni` ✅ canonical | 丸紅 | Marubeni Corporation | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/marubeni-japan'] = '/glossary/marubeni'`

---

### 102. 🟠 [B_term_norm] itochu

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "伊藤忠商事" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `itochu` ✅ canonical | 伊藤忠商事 | ITOCHU Corporation | 事業 | 2026-05-13 |
| `itochu-corporation` 🔁 301候補 | 伊藤忠商事 | Itochu Corporation | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/itochu-corporation'] = '/glossary/itochu'`

---

### 103. 🟠 [B_term_norm] sumitomo-corp

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "住友商事" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `sumitomo-corp` ✅ canonical | 住友商事 | Sumitomo Corporation | 事業 | 2026-05-13 |
| `sumitomo-corporation` 🔁 301候補 | 住友商事 | Sumitomo Corporation | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/sumitomo-corporation'] = '/glossary/sumitomo-corp'`

---

### 104. 🟠 [B_term_norm] renewable-energy-special-measures-act

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "再エネ特措法" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `renewable-energy-special-measures-act` ✅ canonical | 再エネ特措法 | Act on Special Measures Concerning Procurement of Renewable Energy | 法務 | 2026-05-13 |
| `renewable-special-law` 🔁 301候補 | 再エネ特措法 | Renewable Energy Special Law | 法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/renewable-special-law'] = '/glossary/renewable-energy-special-measures-act'`

---

### 105. 🟠 [B_term_norm] renewable-energy-surcharge

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "再エネ賦課金" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `renewable-surcharge` 🔁 301候補 | 再エネ賦課金 | Renewable Energy Surcharge | その他 | 2026-05-13 |
| `renewable-energy-surcharge` ✅ canonical | 再エネ賦課金 | Renewable Energy Surcharge | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/renewable-surcharge'] = '/glossary/renewable-energy-surcharge'`

---

### 106. 🟠 [B_term_norm] frequency-converter

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "周波数変換設備" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `fc-frequency-conv` 🔁 301候補 | 周波数変換設備 | Frequency Converter | 技術 | 2026-05-13 |
| `frequency-converter` ✅ canonical | 周波数変換設備（FC） | Frequency Converter | 系統連系 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/fc-frequency-conv'] = '/glossary/frequency-converter'`

---

### 107. 🟠 [B_term_norm] capacity-contract-payment

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "容量確保契約金額" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `capacity-procurement-contract-amount` 🔁 301候補 | 容量確保契約金額 | Capacity Procurement Contract Amount | 市場制度 | 2026-05-13 |
| `capacity-contract-payment` ✅ canonical | 容量確保契約金額（kW価値） | Capacity Contract Payment | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/capacity-procurement-contract-amount'] = '/glossary/capacity-contract-payment'`

---

### 108. 🟠 [B_term_norm] performance-guarantee

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "性能保証" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `performance-guarantee` ✅ canonical | 性能保証 | Performance Guarantee | 事業/技術 | 2026-05-13 |
| `performance-warranty` 🔁 301候補 | 性能保証 | Performance Warranty | 法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/performance-warranty'] = '/glossary/performance-guarantee'`

---

### 109. 🟠 [B_term_norm] fire-service-act

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "消防法" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `fire-service-act` ✅ canonical | 消防法 | Fire Service Act | 安全 | 2026-05-13 |
| `fire-service-law` 🔁 301候補 | 消防法 | Fire Service Law | 法務/安全 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/fire-service-law'] = '/glossary/fire-service-act'`

---

### 110. 🟠 [B_term_norm] specified-wholesale-supply

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "特定卸供給事業者" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `specified-wholesale-supply-business` 🔁 301候補 | 特定卸供給事業者 | Specified Wholesale Supply Business | 法務 | 2026-05-13 |
| `specified-wholesale-supply` ✅ canonical | 特定卸供給事業者 | Specified Wholesale Supply Business | 法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/specified-wholesale-supply-business'] = '/glossary/specified-wholesale-supply'`

---

### 111. 🟠 [B_term_norm] ministry-of-the-environment

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "環境省" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `ministry-of-the-environment` ✅ canonical | 環境省 | Ministry of the Environment | 法務 | 2026-05-13 |
| `ministry-of-environment` 🔁 301候補 | 環境省 | Ministry of the Environment | 法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/ministry-of-environment'] = '/glossary/ministry-of-the-environment'`

---

### 112. 🟠 [B_term_norm] dispatch-resource

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "発動指令電源" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `dispatch-resource` ✅ canonical | 発動指令電源 | Dispatch Resource | 市場制度 | 2026-05-13 |
| `dispatch-command-source` 🔁 301候補 | 発動指令電源 | Dispatch Command Source | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/dispatch-command-source'] = '/glossary/dispatch-resource'`

---

### 113. 🟠 [B_term_norm] generation-business-operator

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "発電事業者" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `power-generation-business` 🔁 301候補 | 発電事業者 | Power Generation Business | 事業 | 2026-05-13 |
| `generation-business-operator` ✅ canonical | 発電事業者 | Generation Business Operator | 法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/power-generation-business'] = '/glossary/generation-business-operator'`

---

### 114. 🟠 [B_term_norm] availability

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "稼働率" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `availability` ✅ canonical | 稼働率 | Availability | 事業/技術 | 2026-05-13 |
| `availability-rate` 🔁 301候補 | 稼働率 | Availability Rate | 技術/市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/availability-rate'] = '/glossary/availability'`

---

### 115. 🟠 [B_term_norm] grid-interconnection-code

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "系統連系規程" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `grid-interconnection-code` ✅ canonical | 系統連系規程 | Grid Interconnection Code | 系統連系 | 2026-05-13 |
| `jeac-9701` 🔁 301候補 | 系統連系規程 | JEAC 9701 | 法務/技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/jeac-9701'] = '/glossary/grid-interconnection-code'`

---

### 116. 🟠 [B_term_norm] ministry-of-economy-trade-and-industry

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "経済産業省" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `meti` 🔁 301候補 | 経済産業省 | Ministry of Economy, Trade and Industry | 法務 | 2026-05-13 |
| `ministry-of-economy-trade-and-industry` ✅ canonical | 経済産業省 | Ministry of Economy, Trade and Industry | 法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/meti'] = '/glossary/ministry-of-economy-trade-and-industry'`

---

### 117. 🟠 [B_term_norm] seismic-design

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "耐震設計" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `earthquake-resistant-design` 🔁 301候補 | 耐震設計 | Earthquake Resistant Design | 技術/安全 | 2026-05-13 |
| `seismic-design` ✅ canonical | 耐震設計 | Seismic Design | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/earthquake-resistant-design'] = '/glossary/seismic-design'`

---

### 118. 🟠 [B_term_norm] local-government-subsidy

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "自治体補助金" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `local-government-subsidy` ✅ canonical | 自治体補助金 | Local Government Subsidy | 補助金 | 2026-05-13 |
| `local-subsidy` 🔁 301候補 | 自治体補助金 | Local Subsidy | 補助金 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/local-subsidy'] = '/glossary/local-government-subsidy'`

---

### 119. 🟠 [B_term_norm] battery-storage-site

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "蓄電所" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `battery-storage-site` ✅ canonical | 蓄電所 | Battery Storage Site | 事業 | 2026-05-13 |
| `chikudensho` 🔁 301候補 | 蓄電所 | Battery Storage Site | 基礎 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/chikudensho'] = '/glossary/battery-storage-site'`

---

### 120. 🟠 [B_term_norm] commissioning

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "試運転" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `commissioning` ✅ canonical | 試運転 | Commissioning | EPC | 2026-05-13 |
| `trial-operation` 🔁 301候補 | 試運転 | Trial Operation | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/trial-operation'] = '/glossary/commissioning'`

---

### 121. 🟠 [B_term_norm] additional-auction

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "追加オクション" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `additional-auction-jp` 🔁 301候補 | 追加オークション | Additional Auction | 市場制度 | 2026-05-13 |
| `additional-auction` ✅ canonical | 追加オークション | Additional Auction | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/additional-auction-jp'] = '/glossary/additional-auction'`

---

### 122. 🟠 [B_term_norm] kepco

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "関西電力" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `kansai-electric` 🔁 301候補 | 関西電力 | Kansai Electric Power | 市場制度 | 2026-05-13 |
| `kepco` ✅ canonical | 関西電力 | Kansai Electric Power | 事業 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/kansai-electric'] = '/glossary/kepco'`

---

### 123. 🟠 [B_term_norm] setback-distance

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "離隔距離" が 3 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `separation-distance` 🔁 301候補 | 離隔距離 | Separation Distance | 安全 | 2026-05-13 |
| `fire-separation-distance` 🔁 301候補 | 離隔距離 | Fire Separation Distance | 技術/安全 | 2026-05-13 |
| `setback-distance` ✅ canonical | 離隔距離 | Setback Distance | 安全 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/separation-distance'] = '/glossary/setback-distance'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/fire-separation-distance'] = '/glossary/setback-distance'`

---

### 124. 🟠 [B_term_norm] chief-electrical-engineer

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "電気主任技術者" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `chief-electrical-engineer` ✅ canonical | 電気主任技術者 | Chief Electrical Engineer | 法務 | 2026-05-13 |
| `chief-engineer-elec` 🔁 301候補 | 電気主任技術者 | Chief Electrical Engineer | 法務/安全 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/chief-engineer-elec'] = '/glossary/chief-electrical-engineer'`

---

### 125. 🟠 [B_term_norm] electricity-business-act

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "電気事業法" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `electricity-business-act` ✅ canonical | 電気事業法 | Electricity Business Act | 法務 | 2026-05-13 |
| `electricity-business-law` 🔁 301候補 | 電気事業法 | Electricity Business Law | 法務 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/electricity-business-law'] = '/glossary/electricity-business-act'`

---

### 126. 🟠 [B_term_norm] non-fossil-certificate-market

**信頼度**: medium | **ルール**: B_term_norm

> term 正規化後 "非化石価値取引市場" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `non-fossil-certificate-market` ✅ canonical | 非化石価値取引市場 | Non-Fossil Certificate Market | 市場制度 | 2026-05-13 |
| `non-fossil-value-market` 🔁 301候補 | 非化石価値取引市場 | Non-fossil Value Trading Market | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/non-fossil-value-market'] = '/glossary/non-fossil-certificate-market'`

---

### 127. 🟠 [C_english_norm] cbi-standard

**信頼度**: medium | **ルール**: C_english_norm

> english 正規化後 "climatebondsinitiativestandard" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `cbi-standard-2` 🔁 301候補 | CBI Standard | Climate Bonds Initiative Standard | 市場制度 | 2026-05-13 |
| `cbi-standard` ✅ canonical | CBI基準 | Climate Bonds Initiative Standard | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/cbi-standard-2'] = '/glossary/cbi-standard'`

---

### 128. 🟠 [C_english_norm] feed-in-tariff

**信頼度**: medium | **ルール**: C_english_norm

> english 正規化後 "feedintariff" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `feed-in-tariff` ✅ canonical | FIT | Feed-in Tariff | 補助金 | 2026-05-13 |
| `fit-feed-in-tariff` 🔁 301候補 | FIT制度 | Feed-in Tariff | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/fit-feed-in-tariff'] = '/glossary/feed-in-tariff'`

---

### 129. 🟠 [C_english_norm] lithium-iron-phosphate-material

**信頼度**: medium | **ルール**: C_english_norm

> english 正規化後 "lithiumironphosphate" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `lfp` 🔁 301候補 | LFP | Lithium Iron Phosphate | 技術 | 2026-05-13 |
| `lithium-iron-phosphate-material` ✅ canonical | リン酸鉄 | Lithium Iron Phosphate (LFP) | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/lfp'] = '/glossary/lithium-iron-phosphate-material'`

---

### 130. 🟠 [C_english_norm] megapack

**信頼度**: medium | **ルール**: C_english_norm

> english 正規化後 "teslamegapack" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `megapack` ✅ canonical | Megapack | Tesla Megapack | 技術 | 2026-05-13 |
| `tesla-megapack-product` 🔁 301候補 | Tesla Megapack | Tesla Megapack | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/tesla-megapack-product'] = '/glossary/megapack'`

---

### 131. 🟠 [C_english_norm] re100

**信頼度**: medium | **ルール**: C_english_norm

> english 正規化後 "re100" が 4 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `re100-detail-2` 🔁 301候補 | RE100 | RE100 | 市場制度 | 2026-05-13 |
| `re100` ✅ canonical | RE100 | RE100 | 市場制度 | 2026-05-13 |
| `re100-detail` 🔁 301候補 | RE100 | RE100 | 市場制度 | 2026-05-13 |
| `re100-japan` 🔁 301候補 | 再エネ100 | RE100 | 市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/re100-japan'] = '/glossary/re100'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/re100-detail-2'] = '/glossary/re100'`
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`GLOSSARY_301['/glossary/re100-detail'] = '/glossary/re100'`

---

### 132. 🟠 [C_english_norm] transformer

**信頼度**: medium | **ルール**: C_english_norm

> english 正規化後 "transformer" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `transformer-ai` 🔁 301候補 | Transformer | Transformer | 技術 | 2026-05-13 |
| `transformer` ✅ canonical | 変圧器 | Transformer | 技術 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/transformer-ai'] = '/glossary/transformer'`

---

### 133. 🟠 [C_english_norm] non-firm-connection

**信頼度**: medium | **ルール**: C_english_norm

> english 正規化後 "nonfirmconnection" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `non-firm-detail` 🔁 301候補 | ノンファーム | Non-Firm Connection | 市場制度 | 2026-05-13 |
| `non-firm-connection` ✅ canonical | ノンファーム接続 | Non-firm Connection | 系統連系 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/non-firm-detail'] = '/glossary/non-firm-connection'`

---

### 134. 🟠 [C_english_norm] multi-use-operation

**信頼度**: medium | **ルール**: C_english_norm

> english 正規化後 "multiuseoperation" が 2 エントリで一致

| slug | term | english | category | 更新日 |
|------|------|---------|----------|--------|
| `multi-use-detail` 🔁 301候補 | マルチユース | Multi-Use Operation | 市場制度 | 2026-05-13 |
| `multi-use-operation` ✅ canonical | マルチユース運用 | Multi-Use Operation | 事業/市場制度 | 2026-05-13 |

**301実装メモ**: `GLOSSARY_301['/glossary/multi-use-detail'] = '/glossary/multi-use-operation'`

---
