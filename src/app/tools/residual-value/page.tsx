/**
 * /tools/residual-value — 蓄電所 残存価値の試算（T7 実装便・2026-10-15）
 *
 * 便: OneDrive 03_5月13日朝_実行/T7_実装便_残存価値の試算_residual-value_…（2026-10-15 起草）。
 *   - 入力した前提で、残りの運転期間のキャッシュフローを割り引いた値を並べるだけ（冒頭 1 行）。鑑定・査定・売買価格の目安ではない。
 *   - 既定値を置かない（入力欄は空・placeholder は単位だけ・入力例なし）。上限価格は参考欄に出すだけで計算に入れない。
 *   - 上限価格の値・期間・出典は src/lib/balancing-cap.ts からサーバで組み立てる（焼き込まない・カタログ JSON をクライアントに入れない）。
 *   - 式の一次（国土交通省の技術指針）は 2026-10-15 に取り直して逐語と頁を確かめ、台帳 src/data/source-documents.json に登録。
 *   - force-static。冒頭 1 行・入力欄のラベル・前提・参考・出典は初期 DOM に載せる（#107）。外部 API 0（鉄則 #2）。
 *   - 日本語の文の途中に JSX の改行由来の半角空白を入れないよう、段落は文字列で書く。
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import ResidualValueCalculator from '@/components/ResidualValueCalculator';
import { siteConfig } from '@/lib/site-config';
import { capNoteValues, capRevisionCitationText, capSegments, capSourceLines, CAP_SOURCE_NAME } from '@/lib/balancing-cap';
import { PRODUCT_LABEL } from '@/lib/balancing-rules';
import { PV_FORMULA_SOURCE, rangeText } from '@/lib/residual-value-calc';
import { normalizeSourceLinkHref } from '@/lib/eic-license';

export const dynamic = 'force-static';

const PAGE_PATH = '/tools/residual-value';
const TITLE = '蓄電所 残存価値の試算（入力した前提の割引現在価値の幅）';
const LEAD = '入力した前提で、残りの運転期間のキャッシュフローを割り引いた値の幅を並べる計算です。鑑定・査定・売買価格の目安ではありません。入力は保存も送信もしません。';

export const metadata: Metadata = {
  title: TITLE,
  description:
    '蓄電所の残りの運転年数・直近 12 か月の収入と費用と、シナリオごとの収入の変化・使える容量の減り・費用の変化・割引率を入れると、残りの期間のキャッシュフローを割り引いた値（割引現在価値）を 3 列で並べる計算。値はすべて利用者が入れます（既定値なし）。鑑定・査定・売買価格の目安ではありません。入力は保存も送信もしません。',
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: TITLE,
    description: '入力した前提で、残りの運転期間のキャッシュフローを割り引いた値の幅を並べる計算。鑑定・査定・売買価格の目安ではありません。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

// ─── 参考（計算に使わない）: 需給調整市場の ΔkW 上限価格の推移（値・期間・出典は balancing-cap.ts の 1 か所から） ───
const CAP_SEGMENTS = capSegments();
const CAP_SOURCE = capSourceLines().join('／');
const CAP_SOURCE_TEXT = `${CAP_SOURCE ? `（${CAP_SOURCE}）` : ''}の「落札単価の分布」ページの上限価格表${
  CAP_SOURCE_NAME ? `（EIC カタログの上限価格系列・カタログの出典表記: ${CAP_SOURCE_NAME}）` : '（EIC カタログの上限価格系列）'
}${capRevisionCitationText(capNoteValues())}`;
const jaDateOf = (iso: string) => `${Number(iso.slice(0, 4))}年${Number(iso.slice(5, 7))}月${Number(iso.slice(8, 10))}日`;

const CAP_FIRST_FROM = jaDateOf([...CAP_SEGMENTS.map((x) => x.from)].sort()[0] ?? '');
const linkStyle = { color: 'var(--color-accent)' } as const;
/** 出典欄の括弧（ソースに「」を直接書くと verify:source-names が `${…}` を資料名と誤って拾うため。台帳との照合は verify:residual-value） */
const OPEN = '「';
const CLOSE = '」';
const th = { textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--color-border, #cbd5e1)', fontSize: 14, whiteSpace: 'nowrap' } as const;
const td = { padding: '6px 8px', borderBottom: '1px solid var(--color-border, #cbd5e1)', fontSize: 14, verticalAlign: 'top' } as const;
const p15 = { fontSize: 15, lineHeight: 1.8, marginBottom: 12 } as const;
const h2 = { fontSize: 20, fontWeight: 700, margin: '28px 0 8px' } as const;

export default function ResidualValuePage() {
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
      { '@type': 'ListItem', position: 3, name: '残存価値の試算', item: url },
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
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 残存価値の試算
          </p>
          <div className="section-label">計算 · ブラウザ内 · 保存しない</div>
          <h1 className="section-title">{TITLE}</h1>
          <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.8, margin: '0 0 12px' }}>{LEAD}</p>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 20, lineHeight: 1.8 }}>
            {'残りの運転年数・直近 12 か月の収入と費用と、シナリオ A／B／C ごとの収入の年あたりの変化・使える容量の年あたりの減り・費用の年あたりの変化・割引率を入れると、年ごとのキャッシュフロー（CF）とその割引現在価値を列ごとに並べ、計算できた列の最小〜最大を出します。値はすべて利用者が入れます（当サイトは既定値を置きません）。'}
          </p>

          <ResidualValueCalculator />

          <h2 style={h2}>計算のしかたと前提</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 22, marginBottom: 12 }}>
            <li>{'t 年目（t＝1〜N、N は残りの運転年数）の容量係数: k_t ＝ (1 − d)^t。d は使える容量の年あたりの減り。'}</li>
            <li>{'収入_t ＝ 収入₀ × (1 + g)^t × k_t。収入₀ は直近 12 か月の収入、g は収入の年あたりの変化。使える容量の減りが収入にそのまま効くという前提です（実際の収入と容量の関係は、運用・契約・市場で変わります）。'}</li>
            <li>{'費用_t ＝ 費用₀ × (1 + c)^t。費用₀ は直近 12 か月の費用（まとめた額に内訳を足した額）、c は費用の年あたりの変化。'}</li>
            <li>{'CF_t ＝ 収入_t − 費用_t − その年の任意の支出（増設・交換など）。最後の年（t＝N）は撤去・原状回復の費用も引きます。'}</li>
            <li>{'割引現在価値 PV ＝ Σ CF_t ÷ (1 + r)^t（t＝1〜N）。r は割引率。直近 12 か月の後の 1 年目を t＝1 として 1 年分割り引きます。時点の取り方は当サイトの前提です（国土交通省の技術指針は、評価を実施する年度を t＝1 として指数を t−1 としています。出典欄を参照）。'}</li>
            <li>{'税・減価償却・借入の返済・物価の扱いは入れていません。収入・費用に何を含めるか（税の前か後か、補助金を含めるか）は、入れた値のとおりに計算します。'}</li>
            <li>{'容量の保証の欄は参考の照合だけで、計算には使いません。'}</li>
          </ul>
          <h3 style={{ fontSize: 17, fontWeight: 700, margin: '16px 0 6px' }}>入力の扱い</h3>
          <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 22, marginBottom: 12 }}>
            <li>{'全角の数字と、3 桁ごとの桁区切りのカンマは読みます。負の数は先頭に -（全角の －・長音の ー・− も先頭の 1 文字なら読みます）。先頭の + は外して読みます。'}</li>
            <li>{'単位を付けた値（円・% などの文字を付けたもの）や、数として読めないものは「数として読めません」と出し、計算に入れません。'}</li>
            <li>{`範囲の外の値は計算に入れず、その欄の下と結果の欄に注意を出します（残りの運転年数は ${rangeText('years')}、収入・費用の変化は ${rangeText('change')}、容量の減りは ${rangeText('fade')}、割引率は ${rangeText('discount')}、金額は各欄 ${rangeText('yen')}）。任意の支出・撤去の費用は、その欄だけを外して計算します。`}</li>
            <li>{'表示は千円未満を四捨五入しています。計算は丸める前の値で行います。'}</li>
          </ul>

          <h2 style={h2}>参考（計算には使いません）: 需給調整市場の ΔkW 上限価格の推移</h2>
          <p style={p15}>
            {'上限価格は計算に掛けていません。約定価格は上限より下のことがあり、上限の変化が収入にどう効くかは一次に書かれていないためです。自分の収入と市場の公表値の距離は、下の関連ツールで確かめられます。'}
          </p>
          <div style={{ overflowX: 'auto', marginBottom: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <caption style={{ textAlign: 'left', fontSize: 14, padding: '0 0 6px' }}>{'ΔkW 上限価格（円/ΔkW・30分）と適用期間（実需給日）'}</caption>
              <thead>
                <tr>
                  <th scope="col" style={th}>上限価格</th>
                  <th scope="col" style={th}>適用期間</th>
                  <th scope="col" style={th}>商品</th>
                </tr>
              </thead>
              <tbody>
                {CAP_SEGMENTS.map((s) => (
                  <tr key={`${s.value}-${s.from}`}>
                    <td style={{ ...td, whiteSpace: 'nowrap' }}>{`${s.value.toFixed(2)} 円/ΔkW・30分`}</td>
                    <td style={td}>{`${jaDateOf(s.from)}〜${s.to ? jaDateOf(s.to) : ''}`}</td>
                    <td style={td}>{s.products.map((p) => PRODUCT_LABEL[p]).join('・')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, marginBottom: 12 }}>{`表はデータカタログの上限価格の系列の最初の点（${CAP_FIRST_FROM}）から並べています（それより前の上限価格はこの表に入れていません）。三次調整力②には上限価格の設定がありません。改定の経緯と一次は、需給調整市場 制度変更トラッカーに並べています。`}</p>

          <h2 style={h2}>関連</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22, marginBottom: 20 }}>
            <li>
              <Link href="/tools/balancing-benchmark" style={linkStyle}>需給調整 入札ベンチマーク（蓄電池）</Link>
              {'（自分の収入と、市場の公表値との距離）'}
            </li>
            <li>
              <Link href="/tools/irr-simulator#lender-view-title" style={linkStyle}>蓄電池IRRシミュレーター</Link>
              {'（貸し手の見方: 借入・DSCR・上限価格のシナリオ）'}
            </li>
            <li>
              <Link href="/tracker/balancing-rules" style={linkStyle}>需給調整市場 制度変更トラッカー</Link>
              {'（上限価格・募集量・商品仕様などの改定と一次）'}
            </li>
            <li>
              <Link href="/tools/asset-ledger" style={linkStyle}>系統用蓄電所 資産台帳テンプレート</Link>
              {'（設備の容量保証の列と、月ごとの SOH の列に、保証書と測定の値を記録できます）'}
            </li>
            <li>
              <Link href="/tools/asset-check" style={linkStyle}>蓄電所 評価軸セルフチェック</Link>
            </li>
          </ul>

          <section className="article-sources">
            <h3>出典</h3>
            <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
              <li>
                {`${PV_FORMULA_SOURCE.publisher}${OPEN}`}
                <a href={normalizeSourceLinkHref(PV_FORMULA_SOURCE.href)} target="_blank" rel="noopener noreferrer" style={linkStyle}>{PV_FORMULA_SOURCE.name}</a>
                {`${CLOSE}${PV_FORMULA_SOURCE.detail}`}
              </li>
              <li>
                {`ΔkW 上限価格（参考欄）: 一般社団法人 電力需給調整力取引所（EPRX）${OPEN}`}
                <a href={normalizeSourceLinkHref('https://www.eprx.or.jp/information/summary.php')} target="_blank" rel="noopener noreferrer" style={linkStyle}>取引実績の取りまとめ結果</a>
                {`${CLOSE}${CAP_SOURCE_TEXT}。`}
              </li>
            </ul>
          </section>

          <h2 style={h2}>データの扱いと免責</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
            {'このページには保存・送信の機能はなく、当サイトは入力を受け取りません。画面を閉じるか再読み込みすると入力は消えます。' +
              'この計算は、入力した前提で残りの期間のキャッシュフローを割り引いた値を並べるもので、資産の価格や、売買・融資ができるかどうかを示すものではありません。鑑定・査定の代わりにはなりません。'}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
