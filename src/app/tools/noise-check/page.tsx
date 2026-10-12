/**
 * /tools/noise-check — 蓄電所の騒音・離隔の目安チェッカー（T5 騒音便・2026-10-12）
 *
 * 便: OneDrive 03_5月13日朝_実行/T5_騒音便_騒音・離隔の目安チェッカー_noise-check_…（2026-10-10 起草）。
 *   - 目安であって設計の代替ではない（冒頭 1 行）。入力は画面の中だけ（保存しない・送らない）。
 *   - 焼き込む数値は告示の範囲（src/lib/noise-check.ts の NOTICE_RANGES）と施行令 別表第一 第二号の 7.5kW だけ。自治体の値は確認先へ。
 *   - 式・告示・法令の一次は 2026-10-12 に取り直して逐語を確かめ、台帳 src/data/source-documents.json に登録（verify:source-names）。
 *   - force-static。前提・告示の範囲の表・出典は初期 DOM に載せる（#107）。外部 API 0（鉄則 #2）。
 *   - 日本語の文の途中に JSX の改行由来の半角空白を入れないよう、段落は文字列で書く。
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import NoiseChecker from '@/components/NoiseChecker';
import { siteConfig } from '@/lib/site-config';
import {
  MAX_SOURCE_ROWS,
  NOISE_SOURCES,
  NOTICE_PERIODS,
  NOTICE_RANGES,
  NOTICE_ZONES,
  SCHOOL_PROVISO_DB,
  SPECIFIED_FACILITY_MOTOR_KW,
  ITEM2_COMPRESSOR_VERBATIM,
  ITEM2_FAN_VERBATIM,
} from '@/lib/noise-check';

export const dynamic = 'force-static';

const PAGE_PATH = '/tools/noise-check';
const TITLE = '蓄電所の騒音・離隔の目安チェッカー（距離減衰と騒音規制法の規制基準の範囲）';
const LEAD = '簡易な距離減衰の計算と、騒音規制法の規制基準の範囲を並べる目安です。実際の値は地形・反射・気象・機器の特性で変わります。設計・測定・自治体への確認の代わりにはなりません。';

export const metadata: Metadata = {
  title: TITLE,
  description: `蓄電所の PCS・変圧器・空調・送風機などの騒音レベル（仕様の値と測定距離）から、敷地の境界線などでの合成レベルを距離減衰で概算し、騒音規制法の規制基準の範囲（告示の区域・時間の区分）と並べる目安。施行令 別表第一の特定施設の注記つき。入力は保存も送信もしません。`,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: TITLE,
    description: '距離減衰の概算と、騒音規制法の規制基準の範囲（告示）を並べる目安。設計・測定・自治体への確認の代わりにはなりません。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

const linkStyle = { color: 'var(--color-accent)' } as const;
/** 出典欄の括弧（ソースに「」を直接書くと verify:source-names が `${…}` を資料名と誤って拾うため。台帳との照合は verify:noise-check） */
const OPEN = '「';
const CLOSE = '」';
const th = { textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--color-border)', fontSize: 14, whiteSpace: 'nowrap' } as const;
const td = { padding: '6px 8px', borderBottom: '1px solid var(--color-border)', fontSize: 14, verticalAlign: 'top' } as const;
const p15 = { fontSize: 15, lineHeight: 1.8, marginBottom: 12 } as const;

export default function NoiseCheckPage() {
  const url = `${siteConfig.url}${PAGE_PATH}`;
  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: TITLE,
    url,
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: `${siteConfig.url}/` },
      { '@type': 'ListItem', position: 2, name: 'ツール', item: `${siteConfig.url}/tools` },
      { '@type': 'ListItem', position: 3, name: '騒音・離隔の目安チェッカー', item: url },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <SiteHeader />
      <main className="section">
        <div className="section-inner" style={{ maxWidth: 1080 }}>
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 騒音・離隔の目安チェッカー
          </p>
          <div className="section-label">目安 · ブラウザ内 · 保存しない</div>
          <h1 className="section-title">{TITLE}</h1>
          <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.8, margin: '0 0 6px' }}>{LEAD}</p>
          <p style={{ fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>{'入力はこの画面の中だけで使い、保存も送信もしません。'}</p>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 20, lineHeight: 1.8 }}>
            {`蓄電所の PCS・変圧器・空調の室外機・送風機などの騒音レベル（仕様書の値とその測定距離）と台数を最大 ${MAX_SOURCE_ROWS} 行入れると、受音点（敷地の境界線など）での合成レベルを距離減衰の式で概算し、騒音規制法にもとづく告示の範囲（区域の区分 × 時間の区分）のどこにあるかと、範囲の上限・下限まで下がる距離を並べます。` +
              '送風機・空気圧縮機には、騒音規制法の特定施設（施行令 別表第一）との関係を条文の語で注記します。'}
          </p>

          <NoiseChecker />

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>計算のしかたと前提</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 22, marginBottom: 12 }}>
            <li>{'1 台の受音点レベル: L(d) = L(r0) − 20 log10(d ÷ r0)。L(r0) は 1 台の騒音レベル、r0 はその測定距離、d は受音点までの距離（m）。発生源を点音源と見なせる場合の式です（距離が 2 倍になると 20 log10 2 ≒ 6 dB 下がる）。'}</li>
            <li>{'同じ機器 n 台: L + 10 log10(n)。合成の式を同じ値 n 個に当てたもので、宮城県「騒音の尺度」の表（同じ発生源 2 台で約 +3 デシベル、10 台で約 +10 デシベル）と同じ値になります。'}</li>
            <li>{'複数の音源の合成: L = 10 log10 Σ 10^(Li ÷ 10)。'}</li>
            <li>{'全部の音源が受音点から同じ距離 d にあるものとして計算します。音源の位置の違いは入れていません（受音点にいちばん近い音源からの距離を入れると、大きめの側に出ます。当サイトの扱い）。'}</li>
            <li>{'防音壁などの減衰量は、入れた値をそのまま引きます（空欄は 0）。回折の近似式（周波数の前提が要る）は入れていません。'}</li>
            <li>{'地面での吸収・空気による吸収・建物での反射・機器の指向性・地形・気象は入れていません。吸収を入れないぶん実際より大きめに出やすい一方、反射があると実際の値が大きくなることもあります。'}</li>
            <li>{'区分の判定と表示は 0.1 dB に丸めた値で行います。合成レベルは受音点 1 点の値で、敷地の境界線のどの点で測るかや、騒音の測り方（変動する騒音の決め方）は扱っていません。'}</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>告示の範囲（規制基準はこの範囲内で自治体が定める）</h2>
          <p style={p15}>
            {'騒音規制法では、都道府県知事（市の区域内の地域については、市長）が規制する地域を指定し、環境大臣が定める基準の範囲内で、時間の区分と区域の区分ごとの規制基準を定めます（騒音規制法第3条第1項・第4条第1項）。規制基準は、特定施設を設置する工場・事業場（特定工場等）の敷地の境界線における騒音の大きさの許容限度です（騒音規制法第2条第2項）。下の表は、環境大臣が定める範囲（告示）です。所在地の規制基準そのものではありません。'}
          </p>
          <div style={{ overflowX: 'auto', marginBottom: 12 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <caption style={{ textAlign: 'left', fontSize: 14, padding: '0 0 6px' }}>{'告示 第一条第1項の表（単位: デシベル。朝・夕は 1 つの列）'}</caption>
              <thead>
                <tr>
                  <th scope="col" style={th}>区域の区分</th>
                  {NOTICE_PERIODS.map((p) => (
                    <th key={p.key} scope="col" style={th}>{p.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {NOTICE_ZONES.map((z) => (
                  <tr key={z.key}>
                    <th scope="row" style={{ ...td, textAlign: 'left', fontWeight: 400, whiteSpace: 'nowrap' }}>{z.label}</th>
                    {NOTICE_PERIODS.map((p) => {
                      const r = NOTICE_RANGES[z.key][p.key];
                      return <td key={p.key} style={{ ...td, whiteSpace: 'nowrap' }}>{`${r.min}〜${r.max} デシベル`}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <dl style={{ fontSize: 14, lineHeight: 1.7, margin: '0 0 12px' }}>
            {NOTICE_ZONES.map((z) => (
              <div key={z.key} style={{ marginBottom: 4 }}>
                <dt style={{ display: 'inline', fontWeight: 600 }}>{`${z.label}: `}</dt>
                <dd style={{ display: 'inline', margin: 0 }}>{z.definition}</dd>
              </div>
            ))}
            {NOTICE_PERIODS.map((p) => (
              <div key={p.key} style={{ marginBottom: 4 }}>
                <dt style={{ display: 'inline', fontWeight: 600 }}>{`${p.label}: `}</dt>
                <dd style={{ display: 'inline', margin: 0 }}>{p.hours}</dd>
              </div>
            ))}
          </dl>
          <ul style={{ fontSize: 14, lineHeight: 1.7, paddingLeft: 22, marginBottom: 12 }}>
            <li>{'時刻は告示が候補を示し、どの時刻にするかは規制基準を定める都道府県知事・市長が決めます。朝と夕は時刻の範囲が別で、基準の範囲は同じ 1 つです。'}</li>
            <li>{`第二種〜第四種区域にある学校・保育所・病院・入院施設のある診療所・図書館・特別養護老人ホーム・幼保連携型認定こども園の敷地の周囲おおむね 50m の区域内では、都道府県知事（市の区域内は市長）が規制基準として定める値以下、その値から ${SCHOOL_PROVISO_DB} デシベルを減じた値以上とすることができます（告示 第一条第1項ただし書）。`}</li>
            <li>{'町村は、指定地域の自然的・社会的条件に特別の事情があり、知事が定めた規制基準では住民の生活環境を保全するのに十分でないと認めるときは、条例で、告示の範囲の下限値以上で規制基準を代えて定めることができます（騒音規制法第4条第2項・告示 第二条）。都道府県・市の条例で、法とは別の規制基準や対象（例: 東京都の環境確保条例の工場・指定作業場の基準）を定めていることもあります。'}</li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>特定施設と届出</h2>
          <p style={p15}>
            {`騒音規制法の特定施設は、施行令 別表第一に掲げる施設です（全 11 号）。蓄電所の機器と語が重なるのは第二号の「${ITEM2_COMPRESSOR_VERBATIM}及び${ITEM2_FAN_VERBATIM}」です（チェッカーは 1 台の原動機の定格出力 ${SPECIFIED_FACILITY_MOTOR_KW}kW を境に注記の文を変えます）。別表第一に「パワーコンディショナ」「変圧器」「空気調和」「冷凍機」「蓄電池」の語はありません。`}
          </p>
          <p style={p15}>
            {'指定地域内の工場・事業場（特定施設が設置されていないもの）に特定施設を設置しようとする者は、設置の工事の開始の日の三十日前までに市町村長に届け出ます（騒音規制法第6条第1項。既に届け出た特定施設の数や騒音の防止の方法を変えるときは第8条）。ただし、電気事業法の電気工作物である特定施設を設置する者には、騒音規制法の第6条から第11条までの規定などを適用せず、電気事業法の相当規定によります（騒音規制法第21条第1項）。規制基準を守る義務（騒音規制法第5条）は、この適用除外に入っていません。'}
          </p>
          <p style={p15}>
            {'具体的な施設が特定施設に当たるか、所在地が指定地域か、規制基準の値はいくつかは、所在地の市町村・特別区・都道府県で確かめます（環境省のパンフレットも、特定施設かどうかは市町村または特別区に、規制基準や指定地域は市・特別区または都道府県に問い合わせるよう案内しています）。'}
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>規制基準と環境基準は別のもの</h2>
          <p style={p15}>
            {'騒音に係る環境基準は、環境基本法第16条第1項にもとづいて、地域の類型と時間の区分ごとに定められた基準です。環境省のパンフレットは、環境基準を「行政上の政策目標」とし、騒音規制法の規制基準とは異なるものと説明しています（規制基準は、特定工場等の敷地の境界線における騒音の大きさの許容限度＝騒音規制法第2条第2項）。このチェッカーが並べるのは規制基準の範囲だけです。'}
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>確認先</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22, marginBottom: 20 }}>
            <li>
              <a href="https://www.env.go.jp/air/noise/low-gaiyo.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>環境省 騒音規制法の概要</a>
              {'（制度の仕組み・パンフレット）'}
            </li>
            <li>
              <a href="https://www.kankyo.metro.tokyo.lg.jp/noise/noise_vibration/rules/workplace_factory" target="_blank" rel="noopener noreferrer" style={linkStyle}>東京都環境局 工場・事業場等に対する騒音・振動の規制</a>
              {'（都道府県のページの例。区・市の窓口と、環境確保条例の基準）'}
            </li>
            <li>
              <a href="https://www.pref.osaka.lg.jp/o120080/kotsukankyo/oto/koujou.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>大阪府 工場・事業場の規制について</a>
              {'（都道府県のページの例。規制基準の表と届出先。府内の規制地域は市町村の環境担当課に問い合わせるよう案内）'}
            </li>
            <li>
              <a href="https://www.soumu.go.jp/kouchoi/complaint/soudan_madoguchi.html" target="_blank" rel="noopener noreferrer" style={linkStyle}>総務省 公害等調整委員会 公害苦情相談窓口</a>
              {'（全国の市区町村・都道府県の環境の担当窓口を探す入口。苦情相談の窓口の一覧で、届出の窓口の一覧ではありません）'}
            </li>
          </ul>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>関連</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22, marginBottom: 20 }}>
            <li>
              <Link href="/tools/asset-check" style={linkStyle}>蓄電所 評価軸セルフチェック</Link>
              {'（'}
              <Link href="/tools/asset-check#q-A5" style={linkStyle}>A5</Link>
              {'＝設備の騒音源ごとの仕様・測定記録、'}
              <Link href="/tools/asset-check#q-C6" style={linkStyle}>C6</Link>
              {'＝騒音規制法の指定地域）'}
            </li>
            <li>
              <Link href="/tools/asset-ledger" style={linkStyle}>系統用蓄電所 資産台帳テンプレート</Link>
              {'（02_設備の「騒音仕様(dB)」「騒音の測定距離(m)」の列に、このチェッカーに入れる値を記録できます）'}
            </li>
            <li>
              <Link href="/glossary" style={linkStyle}>用語集</Link>
            </li>
          </ul>

          <section className="article-sources">
            <h3>出典</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8 }}>{'各資料は 2026-10-12 に取り直して、条文・表・式の逐語を確かめました。'}</p>
            <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
              {NOISE_SOURCES.map((s) => (
                <li key={s.name}>
                  {`${s.publisher}${OPEN}`}
                  <a href={s.href} target="_blank" rel="noopener noreferrer" style={linkStyle}>{s.name}</a>
                  {`${CLOSE}${s.detail}`}
                </li>
              ))}
            </ul>
          </section>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>データの扱いと免責</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
            {'このページには保存・送信の機能はなく、当サイトは入力を受け取りません。画面を閉じるか再読み込みすると入力は消えます。' +
              'このチェッカーは距離減衰の簡易な計算と告示の範囲を並べる目安で、所在地の規制基準を満たすかどうかや、特定施設に当たるかどうかを判定するものではありません。騒音の予測・対策の設計、測定、自治体への確認の代わりにはなりません。'}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
