# Ck2c コード便 — EPRX 利用条件（license_notice 2・3 行目）の表示解禁（2026-10-02 実施）

commit `2448fe9`（22:20 push・22:28 デプロイ完了）。src 3 ファイル＋verify 1 ファイル。**microCMS 書込 0・GET 0**。

## (0) 読んだパス

| 何を | 絶対パス |
|---|---|
| 便ファイル | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\Ck2c_コード便_EPRX利用条件2-3行目の表示解禁_Claude_Code投入_2026-09-30起草_ユウ.md` |
| `_QUEUE.md` | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\_QUEUE.md` |

## (1) 変更

| ファイル | 変更 |
|---|---|
| `src/lib/eic-license.ts` | **`eprxNoticeLinesForDisplay(notice)`** を追加（#121: 2 ページから呼ぶ 1 か所）。2 行目に「サイトのご利用にあたって」を含み、全行に「利用規約」「非商用」を含まないときだけ全行、それ以外は 1 行目だけ。語句・順序・句読点は変えない。コメントに 3 行の逐語と「2026-09-29 nightly で上流が修正・9/30 確認」 |
| `src/app/tools/balancing-revenue/page.tsx` | 上の関数を使い、全行を `<br />` 区切りで表示（+14／−6 行）。ラベルは全行のとき「出典表記・利用条件（EIC カタログ license_notice の逐語）」、1 行目だけのとき従来の「出典表記（EIC カタログ license_notice 1 行目の逐語）」。「★2 行目…表示しない」のコメントを「上流は修正済み → ガード付きで全行表示」に更新（旧 2 行目の説明は履歴として残した） |
| `src/app/tracker/imbalance/page.tsx` | 同上（+14／−4 行） |
| `scripts/verify-eic-license.ts` | **軸5**（WARN・ビルドは止めない）: `balancing-price-*` の license_notice に「利用規約」「非商用」を含む系列の件数 |

既存の文「…当サイトの利用が該当するかは EPRX に照会中です。」はそのまま。`licenseNoticeLines()` と他ページ（`/industry`・`/market/*`）は触っていない。

## (2) カタログ

- precompute 時点の catalog `generated_at` = **2026-10-02T11:11:54+09:00**。
- `balancing-price-*` は **40 系列**。license_notice は 40 本とも同一で、2 行目は新文（「EPRX「サイトのご利用にあたって」４．著作権等について に従い、…」）＝**40 / 40**。
- ビルドのログ: `[verify:eic-license] ok   EPRX 系列（balancing-price-* 40 本）の license_notice に「利用規約」「非商用」: 0 件`。

## (3) 本番（素URL・22:37・HTTP 200・PRERENDER・age 0・script を除いた初期DOM）

| ページ | 「サイトのご利用にあたって」 | 「自動的な大量取得は事前承諾が必要」 | 「EPRX 利用規約」 | 「非商用」 | 1 行目の出典逐語 |
|---|---:|---:|---:|---:|---:|
| `/tools/balancing-revenue` | 3（従来 2＋2 行目の 1） | 1 | 0 | 0 | 1 |
| `/tracker/imbalance` | 3（同） | 1 | 0 | 0 | 1 |

表示（`/tracker/imbalance`）: 「出典表記・利用条件（EIC カタログ license_notice の逐語）:「出典: 一般社団法人 電力需給調整力取引所「取引実績の取りまとめ結果」／EPRX「サイトのご利用にあたって」４．著作権等について に従い、出典と、編集・加工等を行った旨を記載して利用。年次取りまとめ PDF より転記・編集。／商用利用は事前契約、自動的な大量取得は事前承諾が必要。」 ／ 利用条件: EPRX「サイトのご利用にあたって」」（／は `<br />`）。
両ページとも「利用規約」の文字列は 1 件あるが、サイト共通フッタの当サイトの「利用規約」リンクで、EPRX の表記ではない。

## (4) 検証と申告

- `npm run type-check` PASS／`npm run build` exit 0（静的 5,565・動的は `/grid/search` のみ）／`verify:no-301-links` 軸0 PASS／`verify:source-names:src` 台帳に無い資料名 0。
- 便ファイルとの違い: 便の行番号（`eb0b303` 時点）は ATB 便と②の push でずれていたので実物で探した。ほかの逸脱なし。
- 停止条件: rm／rmdir／Remove-Item／git push --force／.env の内容表示 なし。microCMS へのアクセス 0。
- 既存の未コミット変更 2 ファイルは触っていない（コミットはパス指定）。
