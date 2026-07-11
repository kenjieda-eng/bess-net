/**
 * Report2026Body.tsx — 業界レポート2026「本編」本文10章（/reports/2026）。
 *
 * Server Component（静的テキスト＋ライブ集計値を props 受け）。SSR維持（鉄則#103）。
 * 数値は当サイトDB登録分（ライブ集計・props）＋ doc4 で確定した一次情報（170MW/113GW/166.9万kW 等）。
 * 断定回避・出所明示・誇大回避（L-EIC-019）。内部リンクは全て 200 検証済（2026-07-02）。
 * 本文出所: 02_計画・運営/業界レポート2026_本文*_2026-07-02_ユウ.md（doc1-4）。
 */
import Link from 'next/link';

export type Report2026BodyProps = {
  projectCount: number;
  totalMW: number;
  totalMWh: number;
  operatorCount: number;
  subsidyCount: number;
  substationCount: number;
  statusMap: Record<string, number>;
  topPrefs: Array<[string, number]>;
  playersCount: number;
  relationsCount: number;
  categoryCount: number;
  globalTotal2025: number;
  globalTotal2030: number;
};

const H2: React.CSSProperties = { fontSize: 20, fontWeight: 700, marginTop: 40, marginBottom: 12, paddingBottom: 6, borderBottom: '2px solid var(--color-border)' };
const H3: React.CSSProperties = { fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 8 };
const P: React.CSSProperties = { fontSize: 14, lineHeight: 1.9, marginBottom: 12 };
const NOTE: React.CSSProperties = { fontSize: 13, lineHeight: 1.8, color: 'var(--color-muted)', background: 'var(--color-bg)', borderLeft: '3px solid var(--color-border)', padding: '8px 12px', margin: '12px 0' };
const LINKS: React.CSSProperties = { fontSize: 13, lineHeight: 1.9, marginTop: 8, marginBottom: 4 };

function n(v: number): string { return v.toLocaleString(); }

export default function Report2026Body(props: Report2026BodyProps) {
  const {
    projectCount, totalMW, totalMWh, operatorCount, subsidyCount, substationCount,
    statusMap, topPrefs, playersCount, relationsCount, categoryCount, globalTotal2025, globalTotal2030,
  } = props;
  const st = (k: string) => statusMap[k] ?? 0;
  const pipeline = st('計画中') + st('建設中');
  const pref = (i: number) => (topPrefs[i] ? `${topPrefs[i][0]}${topPrefs[i][1]}` : '');

  return (
    <div className="report-body" style={{ marginTop: 40 }}>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 4 }}>本編</h2>
      <p style={{ fontSize: 13, color: 'var(--color-muted)', marginBottom: 8 }}>
        以下は編集部が当サイトの一次データ機能で蓄積した情報を統合した本編（全10章）です。数値は当サイトDB登録分（公開情報ベース、国内全体の実数とは異なる）と、公的一次情報を出所明示のうえ用いています。
      </p>

      {/* 1. 序章 */}
      <section>
        <h2 style={H2}>1. 序章 ── 蓄電所事業 2025-2026 の見取り図</h2>
        <p style={P}>
          2020年代前半、日本の系統用蓄電池は「制度をつくる時期」だった。容量市場が立ち上がり（2020年度初回オークション）、需給調整市場が段階的に開設され、2023年度には長期脱炭素電源オークションが始まった。これらにより、蓄電池は「実証・補助頼み」から「市場で稼ぐ事業」へと性格を変えた。
        </p>
        <p style={P}>
          2025-2026は、その制度が実際の投資と建設に結びつく<strong>本格導入の入口</strong>である。当サイトのプロジェクトDBには{n(projectCount)}件が登録され、稼働（{n(st('稼働中'))}件）と計画・建設（{n(pipeline)}件）が並走する。担い手も、上場企業・電力会社・商社・通信・独立系・海外資本・地域企業へと多様化した。
        </p>
        <p style={P}>
          本レポートは、当サイトが独自機能（プロジェクトDB・事業者ナビ・系統空き容量・補助金カレンダー・用語集・火災事例DB・海外市場ハブ等）で蓄積したデータを編集統合し、市場・政策・プレイヤー・系統・補助金・安全・海外・展望を1冊に束ねたものである。<strong>分析</strong>：本質は「変動する安い再エネを、必要なときに使える電力へ変える」こと。この一点に、蓄電所事業のすべての収益機会と社会的意義が集約される。
        </p>
        <p style={LINKS}>
          関連：<Link href="/projects">プロジェクトDB</Link>・<Link href="/industry">業界分析ハブ</Link>・解説<Link href="/explainer/lcoe-and-power-mix">LCOEと電源構成</Link>
        </p>
      </section>

      {/* 2. 市場概況 */}
      <section>
        <h2 style={H2}>2. 市場概況 ── 導入量・年次推移・地域偏在</h2>
        <h3 style={H3}>2-1. 全体像</h3>
        <p style={P}>
          当サイトが公開情報をもとに整備したプロジェクトデータベース（DB）には、{n(projectCount)}件の系統用蓄電池プロジェクトが登録されており、その累積は<strong>出力 約{n(totalMW)}MW・容量 約{n(totalMWh)}MWh</strong>にのぼる（いずれも当サイトDB登録分。公開情報に基づくため、国内全体の実数とは異なる）。ステータスの内訳は<strong>稼働中{n(st('稼働中'))}件・計画中{n(st('計画中'))}件・建設中{n(st('建設中'))}件・その他{n(st('その他'))}件</strong>で、すでに動いている案件とこれから立ち上がる案件がほぼ拮抗する立ち上がり局面にある。
        </p>
        <p style={NOTE}>
          公的統計では、系統用蓄電池の稼働は2024年12月時点で約<strong>170MW</strong>。一方、系統への接続検討申込は2025年3月に約<strong>113GW</strong>と2023年初頭の約12倍に急増しており、稼働（実装）と申込（期待）の間に大きな開きがある。2030年の導入見通しは累計<strong>14.1〜23.8GWh</strong>（資源エネルギー庁）。当サイトDBの登録 約{n(totalMW)}MW（計画・建設を含む）は、この稼働170MWと申込113GWの中間＝「公表済みの具体案件」を捕捉した数字と位置づけられる。（出所：経済産業省・資源エネルギー庁／OCCTO）
        </p>
        <h3 style={H3}>2-2. 地域偏在</h3>
        <p style={P}>
          プロジェクトの所在地は特定エリアへの集中が顕著で、登録件数の上位5都道府県は {pref(0)}・{pref(1)}・{pref(2)}・{pref(3)}・{pref(4)}（件）。<strong>分析</strong>：この偏在は各エリアの系統事情と再エネ導入状況を反映する。<strong>北海道</strong>＝風力の大量連系と出力制御リスクが最も高く、系統安定化の蓄電池価値が突出（Helios I 50MW/104MWh 等の海外資本含む大型案件が集中）。<strong>九州（福岡・熊本）</strong>＝太陽光集積で昼間の出力制御が頻発し、余剰吸収・需給調整の需要が大きい（RED大牟田・武雄など連携型）。<strong>群馬</strong>＝東京電力パワーグリッド管内で上場企業（ポート）・独立系（fantasista・オリンピア）等の中規模案件が集積。<strong>埼玉</strong>＝関東近郊立地（坂東蓄電所1号ほか）。系統の空き容量が逼迫する再エネ集積エリアほど蓄電池ニーズが高い構造が読み取れる（第5章 系統データと接続）。
        </p>
        <p style={LINKS}>
          関連：<Link href="/projects">プロジェクトDB</Link>・<Link href="/grid">系統空き容量</Link>・解説<Link href="/explainer/hokkaido-bess-outlook">北海道の動向</Link>・<Link href="/explainer/gunma-bess-outlook">群馬の動向</Link>
        </p>
      </section>

      {/* 3. 政策・制度 */}
      <section>
        <h2 style={H2}>3. 政策・制度 ── 容量市場・長期脱炭素電源オークション・需給調整市場</h2>
        <p style={P}>
          系統用蓄電池の事業性は、単一の収益源ではなく<strong>複数市場のマルチユース（組合せ）</strong>で成り立つ。柱となるのは、卸電力市場（JEPXスポット）に加えた次の3制度である。
        </p>
        <h3 style={H3}>3-1. 容量市場（kW価値）</h3>
        <p style={P}>
          将来の供給力（kW）をあらかじめ確保する制度で、電力広域的運営推進機関（OCCTO）が運営する。初回メインオークションは2020年度に実施され、2024年度から実需給（受け渡し）が始まった。蓄電池も供給力として参加でき、固定的な容量収入を得られる。<strong>分析</strong>：単独では投資回収に不十分だが、他市場と組み合わせる「収益の下支え」として機能する。
        </p>
        <h3 style={H3}>3-2. 長期脱炭素電源オークション（投資回収の柱）</h3>
        <p style={P}>
          2023年度に始まった、脱炭素電源の新規投資を促す制度。落札した電源は<strong>長期（20年間）にわたり固定的な収入</strong>を得られ、大型蓄電所の投資回収に道筋を付けた。第1回（応札2023年度）は蓄電池・揚水で<strong>166.9万kW</strong>（蓄電池単独 約<strong>1.09GW</strong>・落札率24%）が落札され、競争が激化。第2回（応札2024年度）は蓄電池・揚水（3〜6時間）で<strong>96.1万kW</strong>が落札され、応札は募集上限の5倍超に達した。20年の固定収入を前提とした大型案件の投資判断を後押ししている（出所：OCCTO 約定結果／日経エネルギーNext／PVeye）。上場企業や独立系（しろくま電力等）が大型案件に踏み込む「呼び水」となっている。
        </p>
        <h3 style={H3}>3-3. 需給調整市場（kWh・ΔkW価値）</h3>
        <p style={P}>
          周波数維持・需給バランス調整のための調整力を取引する市場で、応答速度に応じて<strong>一次〜三次調整力の商品区分</strong>がある。蓄電池は数十ミリ秒級の高速応答が可能で、とりわけ高速性が要求される一次・二次調整力に適性が高い（解説<Link href="/explainer/response-time-vs-reserves">応答時間と一次・二次・三次調整力</Link>）。<strong>分析</strong>：JEPXスポットの価格裁定（安く充電し高く放電）と需給調整の調整力提供を、蓄電池は同一設備で切り替えて収益化する。日々の収益の中心である。
        </p>
        <p style={P}>
          <strong>まとめ（分析）</strong>：「長期脱炭素オークション（投資回収の保証）」が参入ハードルを下げ、「容量市場（下支え）＋需給調整＋JEPX（日々の収益）」が運転期の事業性を支える。この3市場＋スポットの重ね合わせが、2025-2026の蓄電所事業を成立させている核心である。
        </p>
        <p style={LINKS}>
          関連：<Link href="/glossary/capacity-market">容量市場</Link>・<Link href="/glossary/balancing-market">需給調整市場</Link>・<Link href="/policy-calendar">政策カレンダー</Link>・<Link href="/buyer/capacity-market">容量市場 収益解説</Link>・<Link href="/buyer/balancing-market">需給調整市場 収益解説</Link>
        </p>
      </section>

      {/* 4. 主要プレイヤー */}
      <section>
        <h2 style={H2}>4. 主要プレイヤー ── デベロッパー / EPC / セル / PCS / EMS / 電力</h2>
        <p style={P}>
          当サイト事業者ナビには<strong>{n(operatorCount)}社</strong>が登録され、うち主要{n(playersCount)}社を業界カオスマップで{n(categoryCount)}カテゴリ・{n(relationsCount)}関係（出資／EPC／セル供給／オフテイク等）に構造化している。
        </p>
        <p style={P}>
          <strong>分析（編集部・カテゴリ別）</strong>：
        </p>
        <ul style={{ ...P, paddingLeft: 20 }}>
          <li><strong>デベロッパー／事業者</strong>：上場企業（ポート＝群馬3拠点をグリーンローンで展開）、電力会社系（東北電力・四国電力・関西電力系）、独立系（fantasista・オリンピア・しろくま電力〔旧afterFIT〕）、商社（住友商事・丸紅・三菱商事）、通信系（KDDI系auリニューアブル）まで業種横断で参入。</li>
          <li><strong>EPC／システム統合</strong>：JFEエンジニアリング等の重工・エンジ勢が設備一括を担う。</li>
          <li><strong>セル／モジュール</strong>：LFP（リン酸鉄）が主流化。中国のCATL・BYDがグローバルで上位（2024年 車載電池搭載量シェア CATL約37%・BYD約17%）を占め、日本の系統用でもLFP採用が拡大（例：ノーバル・ソーラー常総＝CATL製LFP）。国内はGSユアサ、パワーエックス（自社セル・PCS・EMS一体の「Mega Power」）等。※日本の系統用に限った各社シェアの公的統計は乏しく、本稿では具体シェアの断定を避ける。</li>
          <li><strong>PCS／EMS／アグリゲーター</strong>：パワーエックス、ニシム電子工業、エナリス、GridBeyond、Shizen Connect（自然電力系）等が運用最適化・市場取引を担う。</li>
          <li><strong>電力会社／送配電</strong>：TSO機能を持つ電力グループが自らも蓄電所を展開（東北電力の坂東1号3拠点等）。</li>
          <li><strong>金融機関／PF</strong>：三菱UFJ銀行等のグリーンローン・プロジェクトファイナンスが資金供給。みずほリース系ML Powerが事業会社運営を支援する例も。</li>
        </ul>
        <p style={LINKS}>
          関連：<Link href="/operators">事業者ナビ</Link>・<Link href="/map/industry-chaos">業界カオスマップ</Link>
        </p>
      </section>

      {/* 5. 系統データ */}
      <section>
        <h2 style={H2}>5. 系統データ ── 9エリア別 空き容量 / N-1電制 / ノンファーム</h2>
        <p style={P}>
          立地選定の出発点は「系統に繋げるか」である。当サイトは9送配電エリア<strong>{n(substationCount)}変電所</strong>の系統空き容量・運用容量・予想潮流・N-1電制適用可否・ノンファーム接続可否を収録する、当サイト独自の統合データベースを提供している（関東＝東京電力パワーグリッドは系統情報公開停止の経緯があり、代替アクセスの解説を別途用意）。
        </p>
        <p style={P}>
          <strong>分析（編集部）</strong>：実務では「空き容量ゼロ」でも諦める必要はない。N-1電制（送電線1回線故障時に瞬時に出力を制御する前提で接続枠を拡大）やノンファーム接続（混雑時の出力抑制を受け入れる代わりに接続）を使えば、逼迫エリアでも連系余地が生まれる。再エネ集積エリアほど空き容量は逼迫するため、変電所単位での空き容量・N-1電制可否の確認が、立地戦略の巧拙を直接左右する。
        </p>
        <p style={LINKS}>
          関連：<Link href="/grid">系統空き容量（{n(substationCount)}変電所）</Link>・解説<Link href="/explainer/grid-capacity-map-reading">空き容量マップの読み方</Link>・<Link href="/explainer/tepco-pg-grid-info-suspension-2026">TEPCO PG 公開停止の影響と代替</Link>・<Link href="/tools/grid-connection-check">系統連系診断</Link>
        </p>
      </section>

      {/* 6. 補助金 */}
      <section>
        <h2 style={H2}>6. 補助金・公募動向 ── SII / NEDO / 経産省 / 自治体</h2>
        <p style={P}>
          当サイト補助金一覧には<strong>{n(subsidyCount)}件</strong>を収録。国（SII〔環境共創イニシアチブ〕の「系統用蓄電池・水電解装置導入支援事業」、NEDO、経済産業省）と自治体（東京都「系統用大規模蓄電池導入促進事業」等）の二層構造で、初期投資（CAPEX）の一部を補助する。
        </p>
        <p style={P}>
          <strong>分析（編集部）</strong>：補助金（初期費用補助）と長期脱炭素電源オークション（20年の収入保証）は排他ではなく、<strong>組合せ設計</strong>が要点。公募は時期が限られるため、当サイトでは「公募開始日＞本日→公募予定」を自動判定し、<strong>公募予定を前出し</strong>して事業者の準備を支援している（鮮度をコードで自動管理）。各補助金の最新公募状況・要件はSII・自治体の公式で都度確認を。
        </p>
        <p style={LINKS}>
          関連：<Link href="/subsidies">補助金一覧（{n(subsidyCount)}件）</Link>・<Link href="/tools/subsidy-match">補助金マッチング</Link>
        </p>
      </section>

      {/* 7. 火災・トラブル */}
      <section>
        <h2 style={H2}>7. 火災・トラブル事例 ── 国内外の代表事例と教訓</h2>
        <p style={P}>
          大規模化に伴い、安全設計の重要性が増している。当サイトは火災・トラブル事例データベースを整備し、国内外の代表事例と教訓を集約している。国内では2024年3月、鹿児島県伊佐市の太陽光併設蓄電設備（<strong>三元系・6,400kWh</strong>）が全焼し、排煙作業中の爆発で消防隊員4名が負傷、鎮火に20時間以上を要した。同型の三元系電池は2023年12月の横浜市の事例でも発火しており、経済産業省・電力安全課も対応資料を公表している（出所：PVeye／経産省 電力安全課「蓄電池設備における爆発・火災事故及びその対応」2024-09-10）。
        </p>
        <p style={P}>
          <strong>分析（編集部）</strong>：これらは三元系電池の事例であり、近年主流化するLFP（リン酸鉄）への移行は熱暴走リスク低減の観点で合理性がある。ただし大型化・高密度化に伴う離隔距離・延焼防止・消防連携は引き続き実務課題。認証面ではIEC 62619（産業用蓄電池の安全要求）、UL9540A（熱暴走の延焼試験）等が事業計画の前提となり、電池パスポート等のトレーサビリティも今後の論点。事業者は初期段階から火災リスクを織り込む必要がある。
        </p>
        <p style={LINKS}>
          関連：<Link href="/incidents">火災・トラブル事例DB</Link>・<Link href="/tools/fire-risk-check">火災リスク自己診断</Link>・<Link href="/glossary/iec-62619-standard">IEC 62619</Link>・<Link href="/glossary/ul-9540a">UL9540A</Link>
        </p>
      </section>

      {/* 8. 海外比較 */}
      <section>
        <h2 style={H2}>8. 海外比較 ── 米国 / EU / 中国 / インド / 豪州</h2>
        <p style={P}>
          当サイト海外5市場ハブの集計では、5大市場の蓄電容量は<strong>2025年累積 約{n(globalTotal2025)}GWh → 2030年予測 約{n(globalTotal2030)}GWh</strong>（公開予測ベース）。市場別の数値・出典は本ページ上部の「海外比較」表および<Link href="/global">海外5市場ハブ</Link>を参照。
        </p>
        <p style={P}>
          <strong>分析（編集部・市場別）</strong>：<strong>米国</strong>＝FERC Order 841による市場参加ルール整備とIRA（インフレ抑制法）の税額控除が導入を牽引。<strong>EU</strong>＝電池規則・REPowerEU がサプライチェーンと導入を後押し（イタリアMACSE等の容量報酬型が始動）。<strong>中国</strong>＝CATL・BYDを軸とする圧倒的な製造基盤で最大規模。<strong>インド</strong>＝低い基点からの急拡大で最高CAGR（目安約60%）。<strong>豪州</strong>＝NEM／FCAS市場での蓄電池運用が先行し大型案件が続く。日本は市場規模では中国・米国に見劣りするが、容量市場・長期脱炭素オークション・需給調整市場という制度設計は海外先行事例に学びつつ独自進化している。技術・サプライチェーン・金融・規制が国際的に連動するため、海外動向の把握は国内事業の前提である。
        </p>
        <p style={LINKS}>
          関連：<Link href="/global">海外5市場ハブ</Link>・<Link href="/global/us">米国</Link>・<Link href="/global/eu">EU</Link>・<Link href="/global/cn">中国</Link>
        </p>
      </section>

      {/* 9. 今後の展望 */}
      <section>
        <h2 style={H2}>9. 今後の展望 ── 2030までの市場と参入機会</h2>
        <p style={P}>
          以下は当サイトのデータと制度動向を踏まえた<strong>編集部の見解</strong>であり、確定的な予測ではなく前提付きの展望として提示する。
        </p>
        <p style={P}><strong>9-1. 5つの潮流</strong></p>
        <ol style={{ ...P, paddingLeft: 22 }}>
          <li><strong>大型パイプラインの厚み増</strong>：長期脱炭素電源オークションの継続で、20年収入を前提とした大型案件の計画が積み上がる。DBの「計画中{n(st('計画中'))}＋建設中{n(st('建設中'))}」がその先行指標。</li>
          <li><strong>収益源の安定化</strong>：容量市場の実需給定着と需給調整市場の商品拡充で、マルチユース収益の見通しが立てやすくなる。</li>
          <li><strong>CAPEXの改善</strong>：LFP電池の価格低下と、国内メーカー（パワーエックス等）・海外大手（CATL・BYD）の供給拡大で初期費用が低減。</li>
          <li><strong>系統制約が立地戦略を分ける</strong>：再エネ集積エリアの空き容量逼迫が進むなか、N-1電制・ノンファーム接続の活用と立地選定の巧拙が事業成否を左右する。</li>
          <li><strong>裾野の拡大</strong>：リユース電池の系統利用、VPP・DR、EV連携など大型系統用以外の展開も広がる。</li>
        </ol>
        <p style={P}><strong>9-2. 参入機会（層別）</strong></p>
        <ul style={{ ...P, paddingLeft: 20 }}>
          <li><strong>新規参入事業者</strong>：制度が出揃い、参入の道筋が明確に（<Link href="/buyer/new-entry">これから参入する事業者</Link>、<Link href="/tools/irr-simulator">IRRシミュレーター</Link>）。</li>
          <li><strong>投資家・ファンド</strong>：長期脱炭素オークションの固定収入を前提としたPF機会（<Link href="/buyer/investor">投資家・ファンド</Link>、<Link href="/tools/capacity-market-bid">容量市場応札試算</Link>）。</li>
          <li><strong>土地保有者・地主</strong>：系統近接地の価値上昇。空き容量情報を起点とした立地マッチング（<Link href="/buyer/landowner">土地保有者</Link>、<Link href="/grid">系統空き容量</Link>）。</li>
          <li><strong>メーカー・EPC</strong>：需要拡大に伴う受注機会（<Link href="/seller/manufacturer">メーカー</Link>・<Link href="/seller/epc">EPC</Link>）。</li>
        </ul>
        <p style={P}>
          <strong>結び（分析）</strong>：「安い再エネを、必要なときに使える電力へ変える装置」としての蓄電池の役割は、再エネ拡大が進むほど高まる（解説<Link href="/explainer/lcoe-and-power-mix">LCOEと電源構成</Link>）。2030年に向けて、制度・技術・資金の3条件が揃いつつあるいま、日本の系統用蓄電池は普及の本格局面に入る。
        </p>
      </section>

      {/* 10. 付録 */}
      <section>
        <h2 style={H2}>10. 付録 ── 一次データへ</h2>
        <p style={P}>
          本レポートの各数値・記述は、当サイトの以下の一次データ機能に接続している。引用・転載の際は当サイト名（蓄電所ネット／bess-net.jp）の明記をお願いする。
        </p>
        <ul style={{ ...P, paddingLeft: 20 }}>
          <li><Link href="/operators">主要事業者一覧（{n(operatorCount)}社）</Link></li>
          <li><Link href="/projects">プロジェクトDB（{n(projectCount)}件）</Link></li>
          <li><Link href="/grid">系統空き容量（{n(substationCount)}変電所）</Link></li>
          <li><Link href="/subsidies">補助金一覧（{n(subsidyCount)}件）</Link></li>
          <li><Link href="/faq">業界用語よくある質問（FAQ）</Link>・<Link href="/policy-calendar">政策・法制度カレンダー</Link></li>
          <li><Link href="/incidents">火災・トラブル事例DB</Link>・<Link href="/global">海外5市場ハブ</Link>・<Link href="/map/industry-chaos">業界カオスマップ</Link></li>
        </ul>
      </section>

      {/* 出典脚注 */}
      <section>
        <h2 style={H2}>出典</h2>
        <ul style={{ fontSize: 12, lineHeight: 1.8, color: 'var(--color-muted)', paddingLeft: 20 }}>
          <li>資源エネルギー庁「系統用蓄電池の現状と課題」（2024-05-29）ほか meti.go.jp 各資料</li>
          <li>OCCTO「長期脱炭素電源オークション約定結果（応札2023年度）落札電源一覧」（2024-04-26）</li>
          <li>日経エネルギーNext「系統用蓄電池が殺到、長期脱炭素電源オークション初回入札結果」</li>
          <li>PVeye WEB「脱炭素電源競売で蓄電池1GW強落札」「鹿児島で大型蓄電池が全焼」</li>
          <li>経済産業省 産業保安・安全グループ 電力安全課「蓄電池設備における爆発・火災事故及びその対応」（2024-09-10）</li>
        </ul>
        <p style={{ fontSize: 12, color: 'var(--color-muted)', marginTop: 8, lineHeight: 1.8 }}>
          ※ 本レポートの数値は当サイトDB登録分（公開情報を編集部が構造化・集計）であり、国内全体の実数とは異なります。全国推計・将来予測は出所を明示した参考値です。引用時は出典として当サイト名（蓄電所ネット／bess-net.jp）を明記してください。
        </p>
      </section>
    </div>
  );
}
