#!/usr/bin/env tsx
/**
 * scripts/post-day3-explainer-glossary-2026-09-02.ts
 * Day 3（月次バッチ 9/1）: 解説記事2本 POST ＋ glossary 新規6語 POST
 *
 * 原稿:
 *   02_計画・運営/記事草稿_需給調整市場上限価格10円_2026-09-02_ユウ.md
 *   02_計画・運営/記事草稿_候補地から系統を調べる手順_2026-09-02_ユウ.md
 *
 * ■ 各草稿末尾「投入時の CC への注意」の実施結果
 *   記事1:
 *     (1) 【CC確定】WG4 資料6 スライド22 の逐語 → METI が 403 で一次取得不可 → **文ごと落とした**
 *     (2) 【CC確定】FY2025 の VPP 平均実値 → balancing-price-tertiary-2-vpp.json より 53.59 円で確定
 *     (3) 【CC確定】関連リンクの実 slug → 全数照合して確定（下記 RELATED）
 *     (4) EPRX 現行 PDF を再取得し SHA-256 が 8/22 取得分と完全一致＝改定なし・表の3行とも一致
 *     (5) 年度表現は使わず実需給日の期間で記述（見出し・本文・lead すべて）
 *   記事2:
 *     (1) 【CC確定】用語集 slug → ノンファーム接続（non-firm-connection）は実在。
 *         **N-1電制は用語集に存在しない**ため、その句は落とした
 *     (2) 【CC確定】接続検討の検討料・標準回答期間 → 一次で取得できず **文ごと落とした**
 *     (3) 例示の実数は投入時点で再実測（8,345 / 1,142 / 41 / 1,702 / 長崎7件 いずれも原稿と一致）
 *         本文に「2026年9月時点」を明記
 *     (4) 内部リンクは全数 200 確認済み
 *
 * ■ glossary: 9語のうち 3語（追加オークション・エリアプライス・容量拠出金）は既存のためスキップ。
 *   残り 6語を POST。参照URLは全て実在確認済み（404 のものは落とした）。
 *
 * POST のみ。PATCH / DELETE は使用しない。投入後 GET 全field照合（#106）。
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const DRY = process.argv.includes('--dry-run');
const EX = `https://${DOMAIN}.microcms.io/api/v1/explainer`;
const GL = `https://${DOMAIN}.microcms.io/api/v1/glossary`;

// ─── 記事1 ────────────────────────────────────────────────────────────────
const ART1 = {
  slug: 'balancing-price-cap-10yen-explainer',
  title: '需給調整市場の上限価格が10円に ── 「19.51円→15円→10円」の3年間と、蓄電池収益への意味',
  category: ['市場制度'],
  lead:
    '2026年9月1日の実需給分から、需給調整市場の一次調整力・二次調整力①・複合商品のΔkW上限価格が、15.00円/ΔkW・30分から10.00円/ΔkW・30分に引き下げられた（電力需給調整力取引所〈EPRX〉が2026年7月30日に公表。適用終了は「当面の間」）。二次調整力②・三次調整力①は7.21円/ΔkW・30分のまま、三次調整力②は引き続き上限なし。系統用蓄電池の主戦場である調整力市場で、収入の「天井」がまた一段下がったことになる。',
  body: [
    '<h2 id="h-cap-history">1. 何がどう変わったか ── 上限価格の全履歴</h2>',
    '<table><thead><tr><th>公表</th><th>適用期間（実需給日）</th><th>複合・一次・二次①</th><th>二次②・三次①</th><th>三次②</th></tr></thead><tbody>',
    '<tr><td>2024/03/15</td><td>2024/04/01 〜 2026/03/13</td><td>19.51円</td><td>7.21円</td><td>上限なし</td></tr>',
    '<tr><td>2026/02/05</td><td>2026/03/14 〜 2026/08/31</td><td>15.00円</td><td>7.21円</td><td>上限なし</td></tr>',
    '<tr><td>2026/07/30</td><td><strong>2026/09/01 〜 当面の間</strong></td><td><strong>10.00円</strong></td><td>7.21円</td><td>上限なし</td></tr>',
    '</tbody></table>',
    '<p>単位はすべて 円/ΔkW・30分。出典: EPRX「需給調整市場のΔkW上限価格について」2026年7月30日更新版。</p>',
    '<p>見落とされやすいのは、<strong>15円の時代は2026年3月14日から8月31日までの約5.5か月しかなかった</strong>ことだ。約2年続いた19.51円から見れば、この半年で天井はほぼ半分になった。なお本記事では意図的に「年度」で書いていない。上限価格の適用は実需給日の期間で定義されており、年度で丸めると誤りになるためである。</p>',
    '<h2 id="h-why">2. なぜ下がるのか</h2>',
    '<p>上限価格は「異常な高値約定を防ぐ安全弁」であると同時に、事実上の価格シグナルとして機能してきた。参入が薄かった時期には上限近辺での約定が珍しくなく、蓄電池の事業計画も上限水準を前提に組まれがちだった。国の電力安定供給ワーキンググループ（第4回・2026年7月14日）で蓄電池の収益性を踏まえた適切な水準が議論され、これを受けて EPRX が7月30日に10円への引き下げを確定させた。</p>',
    '<p>背景にあるのは供給側の急増だ。三次調整力②における蓄電池の平均落札単価は、参入が本格化した結果、2024年度の109.43円から<strong>2025年度は19.31円</strong>まで急落した。同じ2025年度のVPP（DR等）の平均は53.59円で、<strong>蓄電池がVPPを下回る逆転</strong>が起きている（いずれもEPRX約定結果にもとづく当サイト集計・円/ΔkW・30分）。「上限の引き下げ」と「競争による単価下落」は別々の現象ではなく、同じ市場成熟の両面と読むべきだろう。</p>',
    '<h2 id="h-impact">3. 蓄電池事業への意味</h2>',
    '<ul>',
    '<li><strong>ΔkW収入の天井が下がる</strong>: 一次・二次①・複合で上限約定を前提にした計画は、19.51円だった期間と比べ単価が約半分になった。応札戦略は「上限で待つ」から「限界費用で取りにいく」へ。</li>',
    '<li><strong>商品間の選択が重くなる</strong>: 上限なしの三次②は単価が急落し、上限ありの一次・二次①は天井が低下した。ΔkW（需給調整）・kW（容量市場）・kWh（卸市場）の<strong>組み合わせ最適化</strong>が収益設計の中心になる。</li>',
    '<li><strong>「当面の間」は固定ではない</strong>: 過去2回の改定はいずれも公表から適用まで1〜2か月だった。次の見直しも同じ経路（ワーキンググループでの議論 → EPRX 公表）で来る可能性が高い。</li>',
    '</ul>',
    '<h2 id="h-related">4. あわせて読む</h2>',
    '<ul>',
    '<li><a href="/explainer/balancing-market-cap-cut-2026">2026年度 需給調整市場 上限価格引下げ ── 一次・二次調整力①の19.51→15円</a>（前回改定の解説）</li>',
    '<li><a href="/explainer/balancing-market-fcr-detail">需給調整市場 一次調整力（FCR）詳解</a>／<a href="/explainer/balancing-market-practical">需給調整市場の実務：応札から精算まで</a></li>',
    '<li><a href="/tools/balancing-revenue">需給調整市場の収益試算ツール</a></li>',
    '<li><a href="/policy-calendar">政策カレンダー</a>: 「需給調整市場 上限価格改定 ── 一次・二次①・複合商品を15円→10円に引下げ（2026/9/1実需給分から）」</li>',
    '</ul>',
    '<p><em>※本記事は公表資料にもとづく編集部の整理です。応札・契約の判断は必ず一次情報をご確認ください。</em></p>',
  ].join(''),
  relatedTerms:
    '需給調整市場,一次調整力,二次調整力①,三次調整力②,ΔkW,アグリゲーター,系統用蓄電池,VPP,容量市場,JEPX,マルチユース運用,調整力,kW価値,kWh価値,EPRX',
  sources:
    'EPRX「需給調整市場のΔkW上限価格について」（2026年7月30日更新版） https://www.eprx.or.jp/information/post.php ／ 第4回 電力安定供給ワーキンググループ 資料6（2026年7月14日） ／ 第96回 制度検討作業部会 資料3（2024年9月27日・二次調整力②/三次調整力①の7.21円の根拠） ／ EPRX 約定結果にもとづく当サイト集計',
};

// ─── 記事2 ────────────────────────────────────────────────────────────────
const ART2 = {
  slug: 'how-to-check-grid-from-site',
  title: '蓄電池の候補地が決まったら ── 変電所と空き容量を自分で調べる手順',
  category: ['基礎'],
  lead:
    '系統用蓄電池の事業性は「土地」と「系統」の掛け算で決まる。土地が良くても、つなぐ先の変電所に空きがなければ計画は進まない。この記事では、候補地の住所しか分かっていない段階から、公表データだけで接続先の当たりを付ける手順を、順を追って説明する。',
  body: [
    '<h2 id="h-step1">手順1: 候補地の都道府県とエリアを確かめる</h2>',
    '<p>まず候補地がどの一般送配電事業者のエリアかを確定する。県境近くは要注意で、行政区分と供給エリアは一致しないことがある。<strong>なお関西電力送配電の公表データ（1,702件）には都道府県の区分がなく</strong>、関西圏の候補地は「エリア: 関西」で絞り込むことになる。</p>',
    '<h2 id="h-step2">手順2: 近傍の変電所を空き容量つきで一覧にする</h2>',
    '<p>当サイトの<a href="/grid/search">変電所検索</a>で、都道府県（データに区分がある41都道府県・件数つき）と空き容量の下限を指定する。結果は空き容量の大きい順に最大200件。たとえば「長崎県 × 66kV以上 × 空き容量22MW以上」なら7件、といった当たりの付け方ができる。全国では8,345件の変電所・開閉所を収録している（いずれも2026年9月時点）。</p>',
    '<p><strong>未公表に注意</strong>: 空き容量が未公表の設備が全国に1,142件ある。空き容量の条件を付けると未公表の設備は結果から外れるため、<strong>取りこぼしたくない場合は一度条件なしで件数（「うち未公表 N 件」）を見る</strong>とよい。</p>',
    '<h2 id="h-step3">手順3: 電圧階級と「同名の変電所」を読み分ける</h2>',
    '<ul>',
    '<li>表記「66/6kV」は一次側66kV・二次側6kVの意味。特別高圧（66kV以上）に連系するのか、高圧かで、必要な設備も手続きも変わる。</li>',
    '<li><strong>同じ名前の変電所は珍しくない</strong>。二次電圧や設備の規模で見分ける（例: 同名でも「66/6kV・28MW」と「66/22kV・9MW」は別の設備）。</li>',
    '</ul>',
    '<h2 id="h-step4">手順4: 「空き容量」を過信しない</h2>',
    '<ul>',
    '<li>空き容量は各社の<strong>公表時点の目安</strong>であり、接続を保証する数字ではない。実際の可否と工事負担金は接続検討の回答で決まる。</li>',
    '<li><strong>負の値が表示される設備もある</strong>（N-1電制の適用可否やN-1電制適用可能量の欄をあわせて見る。詳細は公表元の注記を必ず確認）。</li>',
    '<li>ノンファーム型接続の適用状況によっても意味合いが変わる（→ <a href="/glossary/non-firm-connection">ノンファーム接続</a>）。</li>',
    '</ul>',
    '<h2 id="h-step5">手順5: 「いつ時点の数字か」を必ず控える</h2>',
    '<p>空き容量は改定される。当サイトの検索結果には<strong>出典（事業者名）・公表日・検索用データの生成日</strong>が明記され、印刷・PDF保存にも同じヘッダが付く。社内共有には「この条件のURLをコピー」を使えば、同じ条件を誰でも再現できる。候補地の稟議書に数字を書くときは、公表日をセットで書くのが事故を防ぐ最短の方法だ。</p>',
    '<h2 id="h-step6">手順6: 次の一歩 ── 接続検討へ</h2>',
    '<p>当たりを付けたら、一般送配電事業者への<strong>接続検討の申込み</strong>に進む。なお2026年8月からは<strong>接続検討数の事業者別上限</strong>の運用が始まっており（空押さえ対策）、同一エリアで同時に多数の検討を抱える進め方は取りにくくなっている。<a href="/policy-calendar">政策カレンダー</a>の該当レコードを参照してほしい。</p>',
    '<h2 id="h-step7">手順7: 土地側の条件と突き合わせる</h2>',
    '<p>系統に空きがあっても、地目・造成・接道・ハザードで案件は止まる。用地側のチェックリストは別記事に譲るが、<strong>「系統から探して土地を当てる」逆順の探し方</strong>も、41都道府県の県別ページ（例: <a href="/grid/prefecture/長崎県">長崎県の変電所一覧</a>）から検索条件つきで入れる。</p>',
    '<p><strong>この記事で使ったデータ</strong>: 全国8,345件の変電所・開閉所（各一般送配電事業者の公表データ。出典と公表日は各ページに明記・月次で取込。件数は2026年9月時点）。</p>',
    '<p><em>※本記事は公表データにもとづく編集部の整理です。連系の可否・工事負担金は接続検討の回答で確定します。</em></p>',
  ].join(''),
  relatedTerms:
    '系統連系,ノンファーム接続,変電所,空き容量,N-1電制,接続検討,系統用蓄電池,特別高圧,高圧,工事負担金,空押さえ,一般送配電事業者',
  sources:
    '各一般送配電事業者の系統情報公表データ（当サイトが月次で取込・出典と公表日は各変電所ページに明記） ／ 当サイト 変電所検索 https://bess-net.jp/grid/search',
};

// ─── glossary 新規6語（既存3語はスキップ） ──────────────────────────────
type GlossaryPost = {
  slug: string; term: string; english: string; reading: string;
  category: string[]; subcategory: string; shortDef: string; detail: string; relatedTerms: string;
};
const GLOSSARY: GlossaryPost[] = [
  {
    slug: 'net-cone', term: 'Net CONE', english: 'Net Cost of New Entry', reading: 'ねっとこーん',
    category: ['市場制度'], subcategory: '容量市場',
    shortDef: '新設電源の年間コストから容量市場以外の期待収益を差し引いた純コスト。容量市場の需要曲線の基準点（指標価格）として約定価格の水準を方向づける',
    detail: '<h3 id="h-netcone-1">1. Net CONE とは</h3><p>Net CONE（Net Cost of New Entry）は、新設電源の建設・維持に必要な年間コスト（CONE）から、卸電力市場など容量市場以外で得られる期待収益を差し引いた純コストです。容量市場の需要曲線の基準点（指標価格）として用いられ、約定価格の水準を方向づけます。</p><h3 id="h-netcone-2">2. 実務での見方</h3><p>約定価格が Net CONE を下回るか上回るかは、応札価格の分布を読むうえでの目安になります。2026年度に実施された追加オークション（対象実需給2027年度）では指標価格 Net CONE が10,343円/kW、エリアプライスは全エリア10,361円/kWでした。</p><p>出典: OCCTO 容量市場 メインオークション約定結果 https://www.occto.or.jp/capacity-market/yoryoshijyo/main/data/</p>',
    relatedTerms: '需要曲線,メインオークション,約定価格,容量市場,エリアプライス,追加オークション',
  },
  {
    slug: 'expected-capacity', term: '期待容量', english: 'Expected Capacity', reading: 'きたいようりょう',
    category: ['市場制度'], subcategory: '容量市場',
    shortDef: '各電源が容量市場で供給力として見込める量（kW）。設備容量に電源種別ごとの係数を適用して算定し、応札できる容量の上限になる',
    detail: '<h3 id="h-expcap-1">1. 期待容量とは</h3><p>期待容量は、各電源が容量市場で供給力として見込める量（kW）です。設備容量に電源種別ごとの係数を適用して算定し、応札できる容量の上限になります。蓄電池は運転継続時間に応じた扱いが定められています。</p><h3 id="h-expcap-2">2. 手続き上の位置づけ</h3><p>メインオークションへの参加には、応札前に期待容量の登録が必要です。たとえば2026年度メインオークション（対象実需給2030年度）では、期待容量の登録受付が2026年9月8日〜9月17日、応札の受付が10月13日〜10月23日というスケジュールで進みます。</p><p>出典: OCCTO 容量市場 2026年度メインオークション（対象実需給年度：2030年度）参加登録・応札等のスケジュールについて https://www.occto.or.jp/news/012742.html</p>',
    relatedTerms: '応札容量,アセスメント,リクワイアメント,メインオークション,容量市場,容量確保契約',
  },
  {
    slug: 'power-trading', term: '電力トレーディング', english: 'Power Trading', reading: 'でんりょくとれーでぃんぐ',
    category: ['事業'], subcategory: '市場制度_一般',
    shortDef: '卸電力市場・需給調整市場・容量市場など複数市場を対象に、価格予測に基づいて売買・入札を最適化する業務。蓄電池では充放電計画と入札配分の最適化が収益の中核',
    detail: '<h3 id="h-trading-1">1. 電力トレーディングとは</h3><p>電力トレーディングは、卸電力市場（JEPX）・需給調整市場・容量市場など複数の市場を対象に、価格予測に基づいて売買・入札を最適化する業務です。系統用蓄電池では、充放電計画と各市場への入札配分の最適化が収益の中核になります。</p><h3 id="h-trading-2">2. 支援サービスの広がり</h3><p>複数市場をまたぐ運用は巧拙が収益を左右するため、事業者向けの支援サービスも登場しています。2026年8月には、特別高圧帯の系統用蓄電池事業者向けに、市場価格予測から入札計画・OCCTOへ提出する計画の自動生成までを支援する協業（日立製作所×三菱総合研究所）が発表されました。</p><p>関連: <a href="/news/hitachi-mri-bess-trading-2026-08">日立と三菱総研、特別高圧の系統用蓄電池向け「電力トレーディング高度化支援」で協業</a></p>',
    relatedTerms: 'アグリゲーター,VPP,マルチユース運用,JEPX,需給調整市場,容量市場,インバランス',
  },
  {
    slug: 'fip-colocated-battery', term: 'FIP併設型蓄電池', english: 'Co-located Battery (FIP)', reading: 'ふぃっぷへいせつがたちくでんち',
    category: ['事業'], subcategory: '市場制度_一般',
    shortDef: 'FIP認定を受けた再エネ発電設備に併設される蓄電池。出力変動の平準化や高価格帯への売電シフトに使われ、需給調整市場への参入も進む',
    detail: '<h3 id="h-fipco-1">1. FIP併設型蓄電池とは</h3><p>FIP併設型蓄電池は、FIP（フィード・イン・プレミアム）認定を受けた再エネ発電設備に併設される蓄電池です。出力変動の平準化や、市場価格の高い時間帯への売電シフトに使われます。出力制御が行われる時間帯に充電し、供給量が少ない時間帯に放電することで、これまで活用できなかった電気を収入に変える設計が中心です。</p><h3 id="h-fipco-2">2. 需給調整市場への参入</h3><p>天候により変動する発電出力の影響を受けながら約定した調整力を確保し続ける必要があるため、参入には一般送配電事業者による審査を通る必要があります。2026年8月には、FITからFIPへ移行した太陽光発電所に併設した蓄電池が需給調整市場の参入審査に合格し、同月から調整力の提供を開始した事例が公表されました。</p><p>関連: <a href="/news/marubeni-fip-solar-bess-balancing-2026-08">丸紅新電力ら4社、FIP太陽光併設型蓄電池が需給調整市場の参入審査に合格</a></p>',
    relatedTerms: 'FIP,アグリゲーション,インバランス,需給調整市場,出力制御,自家消費,系統用蓄電池',
  },
  {
    slug: 'expected-unserved-energy', term: '供給信頼度（EUE）', english: 'Expected Unserved Energy', reading: 'きょうきゅうしんらいど',
    category: ['市場制度'], subcategory: '容量市場',
    shortDef: '供給力不足により需要を満たせない電力量の期待値。容量市場ではkWh/kW・年でエリア別に評価され、目標値を上回るエリアは市場分断・追加調達の判断対象になる',
    detail: '<h3 id="h-eue-1">1. 供給信頼度（EUE）とは</h3><p>供給信頼度（EUE: Expected Unserved Energy）は、供給力不足により需要を満たせない電力量の期待値です。容量市場では kWh/kW・年 の形でエリア別に評価され、目標値を上回るエリアは市場分断や追加調達の判断対象になります。</p><h3 id="h-eue-2">2. 実際の使われ方</h3><p>2026年度に実施された追加オークション（対象実需給2027年度）では、目標とする供給信頼度が0.059 kWh/kW・年、約定処理後の全国の供給信頼度が0.088 kWh/kW・年でした。北海道は0.265 kWh/kW・年で不足ブロック（エリア）となり、北海道とそれ以外のブロックに区分した集計が行われています。</p><p>出典: OCCTO 容量市場追加オークション約定結果（対象実需給年度：2027年度）の公表について https://www.occto.or.jp/news/012931.html</p>',
    relatedTerms: 'エリアプライス,市場分断,アデカシー,容量市場,追加オークション,需要曲線',
  },
  {
    slug: 'jc-star', term: 'JC-STAR', english: 'JC-STAR (Labeling Scheme Based on Japan Cyber-Security Technical Assessment Requirements)', reading: 'じぇいしーすたー',
    category: ['技術'], subcategory: '品質規格・認証',
    shortDef: 'IPAが運用する「セキュリティ要件適合評価及びラベリング制度」。IoT製品のセキュリティ要件への適合を評価し★1〜★4のラベルで表示する',
    detail: '<h3 id="h-jcstar-1">1. JC-STAR とは</h3><p>JC-STAR は、独立行政法人情報処理推進機構（IPA）が運用する「セキュリティ要件適合評価及びラベリング制度」です。IoT製品のセキュリティ要件への適合を評価し、ラベル（★1〜★4）で表示します。</p><h3 id="h-jcstar-2">2. 補助金要件としての採用</h3><p>令和8年度の環境省「ストレージパリティの達成に向けた太陽光発電設備等の価格低減促進事業」では、二次公募から、IP通信機能を有する機器のうち JC-STAR の取得対象となる機器について、★1以上の適合ラベル取得製品を使用することが要件となりました。蓄電池・PCS などの通信機能を持つ機器を補助金で導入する場合、製品選定の段階で確認が必要です。</p><p>出典: IPA セキュリティ要件適合評価及びラベリング制度（JC-STAR） https://www.ipa.go.jp/security/jc-star/index.html ／ 関連: <a href="/subsidies/moe-storage-parity-r08">ストレージパリティの達成に向けた太陽光発電設備等の価格低減促進事業（令和8年度当初予算）</a></p>',
    relatedTerms: 'ストレージパリティ,サイバーセキュリティ,HEMS,PCS,IoT,補助金',
  },
];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 400)}`);
  return r.json() as T;
}

const strip = (s: string) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, '');

/** #106 照合。richEditor（body/detail）はタグ除去で比較（#122） */
function diffOf(sent: Record<string, unknown>, got: Record<string, unknown> | null, rich: string[]): string[] {
  const out: string[] = [];
  if (!got) return ['GET で取得できない'];
  for (const [k, v] of Object.entries(sent)) {
    const g = got[k];
    if (Array.isArray(v)) {
      const ga = Array.isArray(g) ? g : null;
      if (!ga) out.push(`${k}: 配列でない（受信=${JSON.stringify(g)}）★drop の疑い`);
      else if (ga.length !== v.length) out.push(`${k}: 要素数 送信${v.length}→受信${ga.length}（落ちた値=${JSON.stringify(v.filter((x) => !ga.includes(x)))}）`);
      else if (JSON.stringify(ga) !== JSON.stringify(v)) out.push(`${k}: ${JSON.stringify(v)} → ${JSON.stringify(ga)}`);
    } else if (rich.includes(k)) {
      if (strip(String(g ?? '')) !== strip(String(v))) out.push(`${k}: 本文がタグ除去後も不一致`);
    } else if (g !== v) {
      out.push(`${k}: 送信=${JSON.stringify(v)?.slice(0, 60)} 受信=${JSON.stringify(g)?.slice(0, 60)}`);
    }
  }
  return out;
}

async function postOne(base: string, payload: Record<string, unknown>, rich: string[], label: string): Promise<'ok' | 'skip' | 'err'> {
  const slug = String(payload.slug);
  const dup = await api<{ totalCount: number; contents: Array<{ id: string }> }>(
    'GET',
    `${base}?filters=slug[equals]${encodeURIComponent(slug)}&fields=id&limit=1`
  );
  if (dup.totalCount > 0) {
    console.log(`  [skip] ${label} ${slug} — 既存 (id=${dup.contents[0].id})`);
    return 'skip';
  }
  if (DRY) {
    console.log(`  [dry-run] ${label} POST ${slug}`);
    return 'ok';
  }
  const res = await api<{ id: string }>('POST', base, payload);
  await new Promise((r) => setTimeout(r, 900));
  const got = (await api<{ contents: Array<Record<string, unknown>> }>('GET', `${base}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`)).contents[0];
  const d = diffOf(payload, got, rich);
  if (d.length) {
    console.log(`  [★照合NG] ${label} ${slug} (id=${res.id})`);
    d.forEach((x) => console.log(`      - ${x}`));
    return 'err';
  }
  console.log(`  [ok] ${label} ${slug} — id=${res.id}（#106 全field一致）`);
  return 'ok';
}

async function main(): Promise<void> {
  console.log(`[day3] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}`);
  let ok = 0, skip = 0, err = 0;
  const tally = (v: 'ok' | 'skip' | 'err') => { if (v === 'ok') ok++; else if (v === 'skip') skip++; else err++; };

  const exBefore = await api<{ totalCount: number }>('GET', `${EX}?limit=0`);
  const glBefore = await api<{ totalCount: number }>('GET', `${GL}?limit=0`);
  console.log(`  explainer 現在=${exBefore.totalCount} / glossary 現在=${glBefore.totalCount}`);

  console.log('\n■ A. 解説記事 2本');
  tally(await postOne(EX, ART1 as unknown as Record<string, unknown>, ['body'], '[記事1]'));
  tally(await postOne(EX, ART2 as unknown as Record<string, unknown>, ['body'], '[記事2]'));

  console.log('\n■ B. glossary 新規6語（既存3語は事前照合でスキップ済み）');
  for (const gterm of GLOSSARY) {
    tally(await postOne(GL, gterm as unknown as Record<string, unknown>, ['detail'], `[${gterm.term}]`));
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log(`\n[done] ok=${ok} skip=${skip} err=${err}`);
  const exAfter = await api<{ totalCount: number }>('GET', `${EX}?limit=0`);
  const glAfter = await api<{ totalCount: number }>('GET', `${GL}?limit=0`);
  console.log(`[件数] explainer ${exBefore.totalCount}→${exAfter.totalCount} / glossary ${glBefore.totalCount}→${glAfter.totalCount}`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1); });

export {};
