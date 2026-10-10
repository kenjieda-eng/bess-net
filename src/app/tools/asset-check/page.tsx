/**
 * /tools/asset-check — 蓄電所 評価軸セルフチェック（8 軸の棚卸し）（T2 実装便・2026-10-10）
 *
 * 仕様: reports/tool-asset-check-questions-2026-10-10.md の (1)〜(3) と裁定 R1〜R9（便 OneDrive 03_5月13日朝_実行/T2_実装便_…）。
 *   - 当サイトは評価者ではない。冒頭 1 行で明記し、値は「整備済みの割合」。順位・格付け・良し悪しの語と、比較の対象になりうる事業者名を出さない。
 *   - 設問の文・一次・なぜ・次にやることは src/data/asset-check-questions.ts（data.json から生成・手で写さない）。
 *   - force-static。40 問の文は初期 DOM に載せる（#107・AssetChecker が全問を描く）。外部 API 0（鉄則 #2）。
 *   - 入力は画面の中だけ（保存しない・送らない）。
 *   - 出典欄の資料名は一次の表題を 2026-10-10 に確かめ、台帳 src/data/source-documents.json に登録（verify:asset-check が照合）。
 *   - 日本語の文の途中に JSX の改行由来の半角空白を入れないよう、段落は文字列で書く。
 */

import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import AssetChecker from '@/components/AssetChecker';
import { siteConfig } from '@/lib/site-config';
import { ASSET_CHECK_AXES, ASSET_CHECK_QUESTIONS } from '@/data/asset-check-questions';
import { DELEGATED_TO_FIRE_RISK_CHECK, FIRE_RISK_DISCLAIMER, PREMISES } from '@/lib/asset-check';

export const dynamic = 'force-static';

const PAGE_PATH = '/tools/asset-check';
const N_Q = ASSET_CHECK_QUESTIONS.length;
const N_AX = ASSET_CHECK_AXES.length;
const N_NA = ASSET_CHECK_QUESTIONS.filter((q) => q.allowsNotApplicable).length;
// 軸名の中に「・」がある（施工・EPC など）ので、区切りは「／」
const AXIS_LABELS = ASSET_CHECK_AXES.map((a) => a.label).join('／');
const TITLE = `蓄電所 評価軸セルフチェック（${N_AX} 軸 ${N_Q} 問の棚卸し）`;

/** 出典欄の括弧（ソースに「」を直接書くと verify:source-names が `${…}` を資料名と誤って拾うため） */
const OPEN = '「';
const CLOSE = '」';

/** 出典欄: 主の一次の資料名（重複を除く・設問の順） */
const SOURCES = (() => {
  const seen = new Map<string, { docName: string; issuer: string; href: string; ids: string[] }>();
  for (const q of ASSET_CHECK_QUESTIONS) {
    const p = q.primary;
    if (!p.docName) continue;
    const cur = seen.get(p.docName);
    if (cur) cur.ids.push(q.id);
    else seen.set(p.docName, { docName: p.docName, issuer: p.issuer, href: p.href, ids: [q.id] });
  }
  return [...seen.values()];
})();
const SITE_DEFINITION_IDS = ASSET_CHECK_QUESTIONS.filter((q) => q.primary.siteDefinition).map((q) => q.id);

export const metadata: Metadata = {
  title: TITLE,
  description: `系統用蓄電所の買い手・貸し手・保険者が確かめる項目を、${AXIS_LABELS}の ${N_AX} 軸 ${N_Q} 問で棚卸しするセルフチェック。各問に法令・公的資料などの一次と「次にやること」。評価・格付けではありません。入力は保存も送信もしません。`,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: TITLE,
    description: `買い手・貸し手・保険者が確かめる項目の棚卸し（${N_AX} 軸 ${N_Q} 問・一次つき）。評価・格付けではありません。`,
    type: 'website',
    images: ['/og-image.png'],
  },
};

const linkStyle = { color: 'var(--color-accent)' } as const;

export default function AssetCheckPage() {
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
      { '@type': 'ListItem', position: 3, name: '評価軸セルフチェック', item: url },
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
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 評価軸セルフチェック
          </p>
          <div className="section-label">棚卸し · ブラウザ内 · 保存しない</div>
          <h1 className="section-title">{TITLE}</h1>
          <p style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.8, margin: '0 0 6px' }}>
            {'評価・格付けではありません。買い手・貸し手・保険者が確かめる項目の棚卸しです。'}
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.8, margin: '0 0 16px' }}>
            {'入力はこの画面の中だけで使い、保存も送信もしません。'}
          </p>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 20, lineHeight: 1.8 }}>
            {`系統用蓄電所の売却・借入・保険の相談では、相手（買い手・貸し手・保険者）から書類や記録がそろっているかを確かめられます。${AXIS_LABELS}の ${N_AX} 軸 ${N_Q} 問について、手元で整っているかを「はい／いいえ／不明」で答えると、軸ごとの整備済みの割合と、未整備・不明の問いの「次にやること」が出ます。` +
              `各問には、なぜ確かめられるのかと、その根拠（法令・公的資料など）を付けています。`}
          </p>

          <AssetChecker axes={ASSET_CHECK_AXES} questions={ASSET_CHECK_QUESTIONS} />

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>使い方と数え方</h2>
          <ol style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 22, marginBottom: 20 }}>
            <li>{`はじめに前提の質問（${PREMISES.length} 問・採点しません）に答えると、当てはまらない問いが「該当しない」になります。答えなくてもかまいません。`}</li>
            <li>{`各問に「はい（整っている・確かめた）／いいえ／不明」で答えます。当てはまる条件がある ${N_NA} 問には「該当しない」もあります。条件に当たるか分からないときは「不明」を選んでください。`}</li>
            <li>{'「無い・要らないと確かめた」場合も「はい」です（たとえば容量保証が無いと確かめた・届出が要らないと確かめた）。この棚卸しは、確かめられる状態かを問うもので、容量保証や保険の有無そのものは評価しません。'}</li>
            <li>{'軸の値は、はい＝1・不明＝0.5・いいえ＝0 の合計を、該当する問いの数で割った割合です。「該当しない」は数えません。まだ答えていない問いは 0 として数えるので、全問に答えるまでは途中経過です（軸ごとに「回答 k／該当 n」を出します）。1 問も答えていない軸は「未回答」、全問が「該当しない」の軸は「対象外」と出ます。重み付けはしていません。'}</li>
            <li>{'「未整備・不明の一覧」の「次にやること」と一次を手がかりに、書類をそろえます。記録の置き場には資産台帳テンプレートが使えます。'}</li>
          </ol>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>この棚卸しで聞かないこと（火災リスク自己診断で扱う項目）</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 4 }}>
            {'次の項目は火災リスク自己診断で聞いているので、ここでは聞きません（保険は、証券・約款が手元にあるかだけを G1 で問います）。'}
          </p>
          <ul style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 22, marginTop: 0, marginBottom: 8 }}>
            {DELEGATED_TO_FIRE_RISK_CHECK.map((d) => (
              <li key={d.label}>{`${d.label}「${d.question}」`}</li>
            ))}
          </ul>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.7, marginBottom: 20 }}>
            {FIRE_RISK_DISCLAIMER}
            {' → '}
            <Link href="/tools/fire-risk-check" style={linkStyle}>蓄電池火災リスク自己診断</Link>
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>関連</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22, marginBottom: 20 }}>
            <li>
              <Link href="/tools/asset-ledger" style={linkStyle}>系統用蓄電所 資産台帳テンプレート</Link>
              {`（整備した書類や記録の置き場。主たる裏づけが当サイトの定義の問い＝${SITE_DEFINITION_IDS.join('・')}は、この台帳の項目にもとづきます）`}
            </li>
            <li>
              <Link href="/incidents" style={linkStyle}>火災・トラブル事例DB</Link>
              {'（運転実績の軸の出来事の記録の参考に）'}
            </li>
            <li>
              <Link href="/grid" style={linkStyle}>変電所 系統空き容量データベース</Link>
              {'（系統の軸の D7・変電所ごとの公表値）'}
            </li>
            <li>
              <Link href="/tools/fire-risk-check" style={linkStyle}>蓄電池火災リスク自己診断</Link>
            </li>
            <li>
              <Link href="/glossary" style={linkStyle}>用語集</Link>
            </li>
          </ul>

          <section className="article-sources">
            <h3>出典（主の一次）</h3>
            <p style={{ fontSize: 14, lineHeight: 1.8 }}>
              {'各問の一次は 2026-10-10 に取り直して逐語を確かめたものです（設問ごとの該当箇所と逐語は、各問の開閉欄に載せています）。'}
            </p>
            <ul style={{ fontSize: 14, lineHeight: 1.8, paddingLeft: 20 }}>
              {SOURCES.map((s) => (
                <li key={s.docName}>
                  {`${s.issuer} ${OPEN}`}
                  <a href={s.href} target="_blank" rel="noopener noreferrer" style={linkStyle}>{s.docName}</a>
                  {`${CLOSE}（${s.ids.join('・')}）`}
                </li>
              ))}
              <li>
                {`蓄電所ネット ${OPEN}`}
                <Link href="/tools/asset-ledger" style={linkStyle}>系統用蓄電所 資産台帳テンプレート</Link>
                {`${CLOSE}の定義（${SITE_DEFINITION_IDS.join('・')}・当サイトの想定）`}
              </li>
            </ul>
          </section>

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>データの扱いと免責</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
            {'このページには保存・送信の機能はなく、当サイトは入力を受け取りません。画面を閉じるか再読み込みすると入力は消えます。' +
              '当サイトは資産の評価者ではなく、このチェックは評価・格付けや融資・保険の可否を示すものではありません。設問は公開の一次で確かめられる項目に限った例で、法令・契約上の義務や相手が確かめる項目を網羅するものではありません。'}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
