# /grid/search 切替前突合（現行 runtime microCMS vs 新 precompute コア）

実施: 2026-08-25 ／ クエリ 86本 ／ 母集団 precompute=8345件

## 一致条件と結果

- 件数（凍結期待差分を考慮）: **86 / 86 一致**
- 上位20行の並び一致: **26 / 86**（tie の並びは microCMS 内部順に依存していたため「空容量降順 → 名称 → slug」へ固定。差分は tie のみか個別確認）
- live 取得失敗（再試行で回復）: 0回

## 凍結7件による説明可能な差分
現行は totalCount に凍結を数えつつ表示行からは隠す（自己不整合）。新実装は母集団から凍結を除外し件数と表示が一貫する。

| クエリ | 現行 totalCount | 新 totalCount | 凍結期待差 | 件数一致 | 上位20一致 | 最初の差 |
|---|---:|---:|---:|:-:|:-:|---|
| op=北海道電力ネットワーク | 459 | 459 | 0 | ✓ | tie差 | 位置1: live=hkd-main-0109 core=hkd-main-0133 |
| op=北海道電力ネットワーク cap>=0 | 377 | 377 | 0 | ✓ | tie差 | 位置1: live=hkd-main-0109 core=hkd-main-0133 |
| op=北海道電力ネットワーク cap>=10 | 136 | 136 | 0 | ✓ | tie差 | 位置1: live=hkd-main-0109 core=hkd-main-0133 |
| op=北海道電力ネットワーク cap>=50 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=北海道電力ネットワーク cap>=100 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=東北電力ネットワーク | 884 | 884 | 0 | ✓ | tie差 | 位置1: live=thk-iwate-2203 core=thk-miyagi-4601-2 |
| op=東北電力ネットワーク cap>=0 | 675 | 675 | 0 | ✓ | tie差 | 位置1: live=thk-iwate-2203 core=thk-miyagi-4601-2 |
| op=東北電力ネットワーク cap>=10 | 369 | 369 | 0 | ✓ | tie差 | 位置1: live=thk-iwate-2203 core=thk-miyagi-4601-2 |
| op=東北電力ネットワーク cap>=50 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=東北電力ネットワーク cap>=100 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=東京電力パワーグリッド | 1719 | 1718 | 1 | ✓ | tie差 | 位置2: live=tpg-0851 core=tpg-0831 |
| op=東京電力パワーグリッド cap>=0 | 1521 | 1521 | 0 | ✓ | tie差 | 位置2: live=tpg-0851 core=tpg-0831 |
| op=東京電力パワーグリッド cap>=10 | 992 | 992 | 0 | ✓ | tie差 | 位置2: live=tpg-0851 core=tpg-0831 |
| op=東京電力パワーグリッド cap>=50 | 52 | 52 | 0 | ✓ | tie差 | 位置2: live=tpg-0851 core=tpg-0831 |
| op=東京電力パワーグリッド cap>=100 | 1 | 1 | 0 | ✓ | ✓ |  |
| op=中部電力パワーグリッド | 1107 | 1107 | 0 | ✓ | tie差 | 位置1: live=cb-1124 core=cb-6126 |
| op=中部電力パワーグリッド cap>=0 | 914 | 914 | 0 | ✓ | tie差 | 位置1: live=cb-1124 core=cb-6126 |
| op=中部電力パワーグリッド cap>=10 | 702 | 702 | 0 | ✓ | tie差 | 位置1: live=cb-1124 core=cb-6126 |
| op=中部電力パワーグリッド cap>=50 | 47 | 47 | 0 | ✓ | tie差 | 位置1: live=cb-1124 core=cb-6126 |
| op=中部電力パワーグリッド cap>=100 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=北陸電力送配電 | 274 | 274 | 0 | ✓ | tie差 | 位置2: live=rkd-toyama-tss0037 core=rkd-ishikawa-iss0028 |
| op=北陸電力送配電 cap>=0 | 212 | 212 | 0 | ✓ | tie差 | 位置2: live=rkd-toyama-tss0037 core=rkd-ishikawa-iss0028 |
| op=北陸電力送配電 cap>=10 | 117 | 117 | 0 | ✓ | tie差 | 位置2: live=rkd-toyama-tss0037 core=rkd-ishikawa-iss0028 |
| op=北陸電力送配電 cap>=50 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=北陸電力送配電 cap>=100 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=関西電力送配電 | 1707 | 1702 | 5 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| op=関西電力送配電 cap>=0 | 1687 | 1683 | 4 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| op=関西電力送配電 cap>=10 | 938 | 938 | 0 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| op=関西電力送配電 cap>=50 | 188 | 188 | 0 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| op=関西電力送配電 cap>=100 | 91 | 91 | 0 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| op=中国電力ネットワーク | 874 | 873 | 1 | ✓ | tie差 | 位置1: live=egz-okayama-s130004 core=egz-hiroshima-s90002 |
| op=中国電力ネットワーク cap>=0 | 728 | 728 | 0 | ✓ | tie差 | 位置1: live=egz-okayama-s130004 core=egz-hiroshima-s90002 |
| op=中国電力ネットワーク cap>=10 | 221 | 221 | 0 | ✓ | tie差 | 位置1: live=egz-okayama-s130004 core=egz-hiroshima-s90002 |
| op=中国電力ネットワーク cap>=50 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=中国電力ネットワーク cap>=100 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=四国電力送配電 | 294 | 294 | 0 | ✓ | tie差 | 位置2: live=ydn-kochi-0014 core=ydn-ehime-0023 |
| op=四国電力送配電 cap>=0 | 221 | 221 | 0 | ✓ | tie差 | 位置2: live=ydn-kochi-0014 core=ydn-ehime-0023 |
| op=四国電力送配電 cap>=10 | 161 | 161 | 0 | ✓ | tie差 | 位置2: live=ydn-kochi-0014 core=ydn-ehime-0023 |
| op=四国電力送配電 cap>=50 | 21 | 21 | 0 | ✓ | tie差 | 位置2: live=ydn-kochi-0014 core=ydn-ehime-0023 |
| op=四国電力送配電 cap>=100 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=九州電力送配電 | 883 | 883 | 0 | ✓ | tie差 | 位置3: live=kyu-831 core=kyu-607 |
| op=九州電力送配電 cap>=0 | 741 | 741 | 0 | ✓ | tie差 | 位置3: live=kyu-831 core=kyu-607 |
| op=九州電力送配電 cap>=10 | 283 | 283 | 0 | ✓ | tie差 | 位置3: live=kyu-831 core=kyu-607 |
| op=九州電力送配電 cap>=50 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=九州電力送配電 cap>=100 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=沖縄電力 | 151 | 151 | 0 | ✓ | tie差 | 位置1: live=oki-honto-66kv-100001 core=oki-honto-66kv-330001 |
| op=沖縄電力 cap>=0 | 113 | 113 | 0 | ✓ | tie差 | 位置1: live=oki-honto-66kv-100001 core=oki-honto-66kv-330001 |
| op=沖縄電力 cap>=10 | 74 | 74 | 0 | ✓ | tie差 | 位置1: live=oki-honto-66kv-100001 core=oki-honto-66kv-330001 |
| op=沖縄電力 cap>=50 | 0 | 0 | 0 | ✓ | ✓ |  |
| op=沖縄電力 cap>=100 | 0 | 0 | 0 | ✓ | ✓ |  |
| area=北海道 | 459 | 459 | 0 | ✓ | tie差 | 位置1: live=hkd-main-0109 core=hkd-main-0133 |
| area=東北 | 884 | 884 | 0 | ✓ | tie差 | 位置1: live=thk-iwate-2203 core=thk-miyagi-4601-2 |
| area=東京 | 1719 | 1718 | 1 | ✓ | tie差 | 位置2: live=tpg-0851 core=tpg-0831 |
| area=中部 | 1107 | 1107 | 0 | ✓ | tie差 | 位置1: live=cb-1124 core=cb-6126 |
| area=北陸 | 274 | 274 | 0 | ✓ | tie差 | 位置2: live=rkd-toyama-tss0037 core=rkd-ishikawa-iss0028 |
| area=関西 | 1707 | 1702 | 5 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| area=中国 | 874 | 873 | 1 | ✓ | tie差 | 位置1: live=egz-okayama-s130004 core=egz-hiroshima-s90002 |
| area=四国 | 294 | 294 | 0 | ✓ | tie差 | 位置2: live=ydn-kochi-0014 core=ydn-ehime-0023 |
| area=九州 | 883 | 883 | 0 | ✓ | tie差 | 位置3: live=kyu-831 core=kyu-607 |
| area=沖縄 | 151 | 151 | 0 | ✓ | tie差 | 位置1: live=oki-honto-66kv-100001 core=oki-honto-66kv-330001 |
| voltage>=22 | 6734 | 6728 | 6 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| voltage>=66 | 5693 | 5690 | 3 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| voltage>=77 | 3447 | 3444 | 3 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| voltage>=110 | 1392 | 1390 | 2 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| voltage>=154 | 830 | 828 | 2 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| voltage>=275 | 320 | 320 | 0 | ✓ | ✓ |  |
| voltage>=500 | 98 | 98 | 0 | ✓ | tie差 | 位置19: live=ydn-kikan-0003 core=kyu-585 |
| n1=true | 791 | 790 | 1 | ✓ | tie差 | 位置2: live=tpg-1718 core=tpg-0109 |
| cap 10〜20 | 2675 | 2675 | 0 | ✓ | tie差 | 位置1: live=ydn-kochi-0042 core=thk-yamagata-5308 |
| cap>=22 | 1251 | 1251 | 0 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| cap>=100 | 92 | 92 | 0 | ✓ | tie差 | 位置18: live=ksi-kikan-ap core=ksi-kikan-cw |
| q=賑橋 | 2 | 2 | 0 | ✓ | ✓ |  |
| q=新地 | 2 | 2 | 0 | ✓ | ✓ |  |
| q=宮の下 | 1 | 1 | 0 | ✓ | ✓ |  |
| q=富士見 | 4 | 4 | 0 | ✓ | ✓ |  |
| q=御坊 | 1 | 1 | 0 | ✓ | ✓ |  |
| q=柏台 | 2 | 2 | 0 | ✓ | ✓ |  |
| q=築地 | 5 | 5 | 0 | ✓ | ✓ |  |
| q=佐世保 | 3 | 3 | 0 | ✓ | ✓ |  |
| q=大久保 | 6 | 6 | 0 | ✓ | tie差 | 位置2: live=ksi-local-dc-3 core=ksi-local-dq-4 |
| q=日宇 | 2 | 2 | 0 | ✓ | ✓ |  |
| q=山田 | 18 | 18 | 0 | ✓ | tie差 | 位置4: live=tpg-1384 core=cb-5145 |
| q=大野 | 16 | 16 | 0 | ✓ | tie差 | 位置4: live=tpg-1393 core=tpg-1421 |
| q=新庄 | 8 | 8 | 0 | ✓ | tie差 | 位置6: live=thk-yamagata-0502 core=thk-kikan-0014 |
| q=久留米 | 6 | 6 | 0 | ✓ | ✓ |  |
| q=川崎 | 10 | 10 | 0 | ✓ | tie差 | 位置8: live=tpg-1298 core=tpg-1299 |
## 並び不一致の内訳（tie 検証）

- 上位20行が完全一致: **26 / 86**
- ソートキー値の列は同一で tie 内の順序だけが異なる: **60**（宣言済みの変更＝「空容量降順 → 名称 → slug」に固定した影響。microCMS の tie 順は内部順で未定義だった）
- ソートキー値の列まで異なる（意味の差）: **0**

## 同名の識別（Gr11-② 0-c）— 二次電圧でも公式Noでも一意にならない 35 組の区別方法

集計（母集団 8,345・凍結除外済み）: 同名グループ: 1228 / 二次電圧で一意: 1051 / 公式Noで一意: 827 / 両方: 685 / どちらでも不一意: 35

区別の優先順は「二次電圧（常時表示） → 公式Noの枝番 → 変圧器台数／設備容量 → slug」。
下記の「識別子=」が行に併記される追加識別子（二次電圧で見分く行には付けない）。
電圧が未公表の行（東京電力PG の一部）は電圧表記自体を出さず、識別子で見分ける。

```
「7307」(2行): thk-niigata-7307[66/6.6kV]→識別子=8MW / thk-niigata-7307-2[66/6.6kV]→識別子=4MW
「7308」(2行): thk-niigata-7308[66/6.6kV]→識別子=4MW / thk-niigata-7308-2[66/6.6kV]→識別子=2MW
「久留米」(6行): thk-fukushima-6809[66/22kV]→識別子=1台 / thk-fukushima-6809-2[66/6.6kV]→二次電圧で区別(6.6kV) / kyu-104[220/66kV]→二次電圧で区別(66kV) / kyu-105[66/6kV]→二次電圧で区別(6kV) / kyu-106[66/22kV]→識別子=(3) / tpg-1206[null/nullkV]→二次電圧で区別(nullkV)
「錦」(3行): thk-fukushima-6d0009[66/6.6kV]→識別子=52MW / ksi-local-cf-3[77/6.6kV]→識別子=57MW / ksi-local-cf-4[77/22kV]→二次電圧で区別(22kV)
「高田」(5行): thk-niigata-7h0003[66/6.6kV]→識別子=3台 / ksi-local-aj-5[77/6.6kV]→識別子=2台 / ksi-local-aj-6[77/22kV]→二次電圧で区別(22kV) / kyu-77[66/6kV]→二次電圧で区別(6kV) / tpg-1383[null/nullkV]→二次電圧で区別(nullkV)
「山田」(7行): thk-iwate-2810[66/6.6kV]→識別子=2台 / ksi-local-cf-7[22/6.6kV]→識別子=1台 / ksi-local-t[77/6.6kV]→識別子=3台 / ksi-local-t-2[77/22kV]→二次電圧で区別(22kV) / kyu-342[22/6kV]→識別子=1台 / kyu-803[66/6kV]→識別子=3台 / tpg-0441[null/nullkV]→二次電圧で区別(nullkV)
「小松」(4行): thk-yamagata-5505[66/33kV]→二次電圧で区別(33kV) / thk-yamagata-5505-2[66/6.6kV]→識別子=28MW / rkd-ishikawa-iss0033[77/6.6kV]→識別子=3台 / ksi-local-ck[77/6.6kV]→識別子=47MW
「城東」(3行): thk-fukushima-6f0009[66/6.6kV]→識別子=thk-fukushima-6f0009 / ksi-local-bo-10[77/33kV]→二次電圧で区別(33kV) / ksi-local-bo-9[77/6.6kV]→識別子=ksi-local-bo-9
「新庄」(6行): thk-kikan-0014[275/154kV]→二次電圧で区別(154kV) / thk-yamagata-0502[154/66kV]→二次電圧で区別(66kV) / thk-yamagata-5101[154/33kV]→識別子=1台 / thk-yamagata-5101-2[66/6.6kV]→識別子=18MW / ksi-local-av-5[77/6.6kV]→識別子=38MW / ksi-local-av-6[77/33kV]→識別子=2台
「船川」(3行): thk-akita-3304[66/33kV]→識別子=10MW / thk-akita-3304-2[66/33kV]→識別子=6MW / thk-akita-3304-3[66/6.6kV]→二次電圧で区別(6.6kV)
「大山」(4行): thk-yamagata-5904[66/33kV]→二次電圧で区別(33kV) / thk-yamagata-5904-2[66/6.6kV]→識別子=2台 / ksi-local-el-5[22/6.6kV]→識別子=1台 / kyu-213[110/6kV]→二次電圧で区別(6kV)
「白河」(3行): thk-fukushima-6a0002[66/33kV]→二次電圧で区別(33kV) / thk-fukushima-6a0002-2[66/6.6kV]→識別子=3台 / ksi-local-cl-9[33/6.6kV]→識別子=1台
「飯坂」(3行): thk-fukushima-6102[66/33kV]→二次電圧で区別(33kV) / thk-fukushima-6102-2[66/6.6kV]→識別子=3台 / ksi-local-ek-5[33/6.6kV]→識別子=1台
「本郷」(4行): thk-fukushima-6f0002[66/33kV]→二次電圧で区別(33kV) / thk-fukushima-6f0002-2[66/6.6kV]→識別子=33MW / ksi-local-f-2[33/6.6kV]→識別子=19MW / tpg-1006[null/nullkV]→二次電圧で区別(nullkV)
「広田」(3行): rkd-toyama-tss0031[66/6.6kV]→識別子=2台 / ksi-local-bc-4[77/6.6kV]→識別子=3台 / ksi-local-bc-5[77/22kV]→二次電圧で区別(22kV)
「三国」(3行): rkd-fukui-fss0003[77/6.6kV]→識別子=2台 / ksi-local-cy[77/6.6kV]→識別子=3台 / ksi-local-cy-2[77/22kV]→二次電圧で区別(22kV)
「大浜」(3行): rkd-ishikawa-iss0082[22/6.6kV]→識別子=1台 / ksi-local-au-4[77/6.6kV]→識別子=3台 / ksi-local-au-5[77/22kV]→二次電圧で区別(22kV)
「八尾」(4行): rkd-toyama-tss0043[66/6.6kV]→識別子=3台 / ksi-kikan-dd[154/77kV]→二次電圧で区別(77kV) / ksi-local-bm-2[77/6.6kV]→識別子=2台 / ksi-local-bm-3[77/22kV]→二次電圧で区別(22kV)
「三津変電所」(4行): ydn-ehime-0022[66/6kV]→識別子=2台 / ydn-ehime-0022-2[66/22kV]→識別子=1台 / egz-hiroshima-s140001-4[110/22kV]→識別子=2台 / egz-hiroshima-s140002-4[110/6kV]→識別子=1台
「竹原変電所」(5行): ydn-ehime-0026[66/6kV]→識別子=3台 / ydn-ehime-0026-2[66/22kV]→識別子=2台 / egz-hiroshima-s110001-2[110/22kV]→識別子=28MW / egz-hiroshima-s110002-2[110/22kV]→識別子=19MW / egz-hiroshima-s110003[110/6kV]→識別子=2台
「土居変電所」(3行): ydn-ehime-0068[66/6kV]→識別子=2台 / ydn-ehime-0068-2[66/22kV]→二次電圧で区別(22kV) / egz-hiroshima-s0032-3[110/6kV]→識別子=1台
「豊浜変電所」(3行): ydn-kagawa-0044[66/22kV]→二次電圧で区別(22kV) / ydn-kagawa-0044-2[66/6.6kV]→識別子=3台 / cb-1310[33/6.6kV]→識別子=2台
「愛別変電所」(2行): hkd-main-0058[110/6.6kV]→識別子=hkd-main-0058 / hkd-main-0059[6.6/6.6kV]→識別子=hkd-main-0059
「大雪変電所」(2行): hkd-main-0053[110/6.6kV]→識別子=22MW / hkd-main-0054[6.6/6.6kV]→識別子=1MW
「塩屋」(5行): ksi-local-ad-8[77/6.6kV]→二次電圧で区別(6.6kV) / ksi-local-ad-9[77/33kV]→二次電圧で区別(33kV) / kyu-722[22/6kV]→識別子=1台 / kyu-793[66/6kV]→識別子=(1) / kyu-794[66/22kV]→二次電圧で区別(22kV)
「花園」(4行): ksi-local-ch-10[33/6.6kV]→識別子=1台 / ksi-local-z-2[77/6.6kV]→識別子=3台 / ksi-local-z-3[77/22kV]→二次電圧で区別(22kV) / tpg-1008[null/nullkV]→二次電圧で区別(nullkV)
「彩都」(3行): ksi-local-fy[22/6.6kV]→識別子=1台 / ksi-local-gk[77/6.6kV]→識別子=2台 / ksi-local-gk-2[77/22kV]→二次電圧で区別(22kV)
「三田」(4行): ksi-local-al-9[33/6.6kV]→識別子=1台 / ksi-local-n-5[77/6.6kV]→識別子=2台 / ksi-local-n-6[77/22kV]→二次電圧で区別(22kV) / tpg-1450[null/nullkV]→二次電圧で区別(nullkV)
「篠原」(4行): ksi-local-br-5[77/6.6kV]→二次電圧で区別(6.6kV) / ksi-local-br-6[77/22kV]→識別子=2台 / kyu-199[66/22kV]→識別子=(1) / kyu-200[66/6kV]→二次電圧で区別(6kV)
「小倉」(5行): ksi-local-ce-5[22/6.6kV]→識別子=1台 / ksi-local-cp-4[77/6.6kV]→識別子=3台 / ksi-local-cp-5[77/22kV]→二次電圧で区別(22kV) / kyu-262[22/6kV]→識別子=1台 / kyu-362[66/6kV]→識別子=2台
「飾磨港」(4行): ksi-kikan-ai0001[275/77kV]→識別子=2台 / ksi-kikan-ai0002[275/77kV]→識別子=1台 / ksi-local-by-10[77/22kV]→二次電圧で区別(22kV) / ksi-local-by-9[77/6.6kV]→二次電圧で区別(6.6kV)
「多田」(3行): ksi-local-ci-4[22/6.6kV]→識別子=1台 / ksi-local-w-4[77/6.6kV]→識別子=2台 / ksi-local-w-5[77/22kV]→二次電圧で区別(22kV)
「長野」(4行): ksi-local-co-6[22/6.6kV]→識別子=ksi-local-co-6 / ksi-local-eg-7[33/6.6kV]→識別子=ksi-local-eg-7 / ksi-local-ep-2[77/6.6kV]→識別子=2台 / ksi-local-ep-3[77/22kV]→二次電圧で区別(22kV)
「尾崎」(3行): ksi-local-ff-2[77/6.6kV]→識別子=3台 / ksi-local-ff-3[77/22kV]→二次電圧で区別(22kV) / ksi-local-ht[22/6.6kV]→識別子=1台
「富田」(3行): ksi-local-cw-6[33/6.6kV]→識別子=1台 / ksi-local-h[77/6.6kV]→識別子=3台 / ksi-local-h-2[77/22kV]→二次電圧で区別(22kV)
```
