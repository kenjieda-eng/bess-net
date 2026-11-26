# フッターの「EICグループ」に データセンター（DC）ネット へのリンクを足す（2026-11-26）

コードのみ（`src/components/SiteFooter.tsx` に 4 行）。microCMS の書込 0。IndexNow は送っていない（便 §2-3・本文の変更でないため）。

## (0) 実行の記録

| 項目 | 値 |
|---|---|
| 便 | `C:\Users\kenji\OneDrive\デスクトップ\AI2026\蓄電所ネット\03_5月13日朝_実行\サイトの小さな直し便_フッターのEICグループにデータセンターネットを足す_コードのみ_Claude_Code投入_2026-11-26起草_ユウ.md`（3,104 バイト・sha256 の先頭 16 桁 `ea214611c0bfb360`＝`_QUEUE.md` と一致） |
| 開始 | 2026-11-26 09:47 JST・HEAD `9c3df23` |
| `_QUEUE.md` | 142 行（GO: ユウ 11/26 09:0x・EDAさん 08:49「サイトからリンク追加お願いします。データセンター（DC）ネット」） |
| commit | `6450d1b`（1 ファイル・push 09:57:48）・報告は別の commit |
| 停止条件 | rm 系 0・push --force 0・.env 表示 0（build のための読み込みのみ）・microCMS 書込 0 |

## (1) 書く前の確かめ（dc-site.jp）

- 素の curl（ブラウザのふりをする UA なし）で 1 回取った（09:47:34）: **HTTP 200**・52,426 バイト・title「**データセンター（DC）ネット | データセンターの電気・設備・立地の実務情報ポータル**」。
- ページに「運営: 一般社団法人エネルギー情報センター」「相談・お問い合わせ」の運営者も同じ。ページのフッターの「関連サイト」に「蓄電所ネット （系統用蓄電池）」がある。

## (2) 直したこと

`src/components/SiteFooter.tsx` の EIC Data のリンクの後に、便 §1 のとおり足した:

```diff
               EIC Data（エネルギー×金融データ）
             </a>
+            {' '}·{' '}
+            <a href="https://dc-site.jp/" target="_blank" rel="noopener noreferrer">
+              データセンター（DC）ネット
+            </a>
           </div>
```

- 文言は相手のサイトの名前のまま。`rel` は今の 2 本と同じ（`noopener noreferrer`・`nofollow` なし）。ほかのファイル・`siteConfig` は変えていない。
- type-check ok。build（`BUILD EXIT 0`）の prebuild の verify は全部 ok。build した HTML（`/`・`/projects`）のフッターに `https://dc-site.jp/` のリンクが 1 本ずつ。
- **スマホ幅**: build したものをローカルの `next start` で開き（内蔵ブラウザ・localhost）、390×844 で `/projects` のフッターを見た。「EICグループ：eic-jp.org · EIC Data（エネルギー×金融データ） · データセンター（DC）ネット」が 2 行に折り返し、文書の横幅は 390（横はみ出しなし）。新しいリンクは 1 行に収まる。「EIC Data（エネルギー×金融データ）」が行の境目で「…デー／タ）」と折れるのは、この 3 本目を足す前からある折れ方（同じ箱の幅 342px で、そこまでの文字は変わっていない）。確かめた後、表示の幅を元に戻し、ローカルのサーバーは止めた。

## (3) 本番の確認

Vercel: `6450d1b` success 2026-11-26 10:04:28 JST（push 09:57:48）。素の URL を curl（ブラウザの UA なし・キャッシュ回避ヘッダなし）で 10:04:57〜10:05:04 に 3 本。前は 09:47:36〜09:47:41 に同じ 3 本を取っておいた。

| URL | x-vercel-cache・age | フッターの dc-site.jp | title・description・canonical・h1 | フッターの外（script を除く HTML） |
|---|---|---|---|---|
| `/` | HIT・4（新しい deploy の内容） | 1 本「データセンター（DC）ネット」 | 前と同じ | 前とバイト単位で同じ |
| `/projects` | PRERENDER・0 | 1 本 | 前と同じ | 前とバイト単位で同じ（`<main>` 163,981 バイトのまま） |
| `/grid/kyu-836` | MISS・0 | 1 本 | 前と同じ（title「亀山変電所（福岡県・九州電力送配電）の系統空き容量・蓄電池連系条件 \| 蓄電所ネット」・h1「亀山変電所」） | 前とバイト単位で同じ（`<main>` 10,062 バイトのまま） |

- フッターの中の差は 3 本とも同じで、`</a> <!-- -->·<!-- --> <a href="https://dc-site.jp/" target="_blank" rel="noopener noreferrer">データセンター（DC）ネット` が足されただけ。
- `/` には `<main>` の要素が無いので、`<main>` の比べ方の代わりに、フッターの外の HTML を比べた。

## (4) 申告

- 停止条件の操作 0。一時物は scratchpad（`C:\Users\kenji\AppData\Local\Temp\claude\76d4d28da6870112\c7db94e8-ce59-46b9-aa85-de5390184ac4\scratchpad\ft1126\`）にだけ作った。消していない。
- 内蔵ブラウザで開いたのはローカル（localhost:3000）だけ。dc-site.jp は curl で 1 回取っただけで、ブラウザでは開いていない。
- IndexNow は送っていない（便のとおり）。
