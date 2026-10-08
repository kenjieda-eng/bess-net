/**
 * /tools/asset-ledger — 系統用蓄電所 資産台帳テンプレート（xlsx）の配布ページ（T3 台帳便・2026-10-08）
 *
 * 設計:
 *   - 配布のみ。アップロード・保存・送信の機能は作らない（当サイトは利用者の台帳データを受け取らない）。
 *   - シート一覧・項目の説明・行の配置・件数は src/lib/asset-ledger-spec.ts から描く（xlsx の生成と同じ定義＝#119）。
 *   - SSG（force-static）。ファイルの大きさはビルド時に public/dl の実物から読む（焼き込まない・読めなければ出さない）。
 *     fs の読み取りがあるため、Next のファイルトレースはこのページの関数に public/ を同梱する（静的ページなので応答には影響しない）。
 *   - 鉄則 #2: 外部 API 0。
 *   - 便 §0: 制度に触れる文は一次（電気事業法・e-Gov 2026-10-08）で確かめた範囲だけ。指標は「この台帳での定義」と明記（定義側）。
 *   - 日本語の文の途中に JSX の改行由来の半角空白を入れないよう、段落は 1 行か文字列で書く。
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';
import {
  LEDGER_TITLE,
  LEDGER_VERSION,
  LEDGER_RELEASED,
  LEDGER_FILE_NAME,
  LEDGER_PUBLIC_PATH,
  LEDGER_SITE,
  LEDGER_GLOSSARY,
  LEDGER_ROW,
  LEDGER_FORMULA_ROWS,
  LEDGER_CHECKLIST_ITEMS,
  LEDGER_CHECKLIST_SHEET,
  LEDGER_SHEETS,
  LEDGER_SHEET_NAMES,
  ledgerDataSheets,
  ledgerSheetCount,
  ledgerSheetLabels,
  ledgerRecordSheetRange,
  checklistColumnLabel,
} from '@/lib/asset-ledger-spec';

export const dynamic = 'force-static';

const PAGE_PATH = '/tools/asset-ledger';
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** 配布物の大きさ（KB・ビルド時に実物から）。読めなければ null（表示しない） */
const FILE_KB: number | null = (() => {
  try {
    return Math.max(1, Math.round(fs.statSync(path.join(process.cwd(), 'public', LEDGER_PUBLIC_PATH)).size / 1024));
  } catch {
    return null;
  }
})();

const SHEETS = ledgerDataSheets();
const COLUMN_COUNT = SHEETS.reduce((n, s) => n + s.columns.length, 0);
const SN = LEDGER_SHEET_NAMES;

export const metadata: Metadata = {
  title: `${LEDGER_TITLE}（xlsx・無料・登録不要）`,
  description:
    `系統用（高圧・特別高圧）蓄電所の運用の記録を 1 ファイルにまとめる Excel 形式（xlsx）の台帳テンプレート。${ledgerSheetLabels()}の ${LEDGER_SHEETS.length} シートと、売却や借入の相談で確かめられそうな項目の一覧つき。無料・登録不要、入力データは手元に残ります。`,
  alternates: { canonical: PAGE_PATH },
  openGraph: {
    title: `${LEDGER_TITLE}（xlsx・無料・登録不要）`,
    description: '系統用蓄電所の運用の記録を 1 ファイルにまとめる xlsx テンプレート。台帳に入力した内容は当サイトに送られません。',
    type: 'website',
    images: ['/og-image.png'],
  },
};

const linkStyle = { color: 'var(--color-accent)' } as const;

/** 表の中の用語集リンクの文字（用語集の見出しどおり。src/lib/generated/glossary-detail-index.json の term で確認） */
const GLOSSARY_LABEL: Record<string, string> = {
  [LEDGER_GLOSSARY.n1]: 'N-1電制',
  [LEDGER_GLOSSARY.nonFirm]: 'ノンファーム接続',
  [LEDGER_GLOSSARY.generationBusiness]: '発電事業者',
  [LEDGER_GLOSSARY.specifiedWholesale]: '特定卸供給事業者',
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** 説明文の中の当サイトの URL。<slug> のような雛形を含むものは文字のまま出す */
const SITE_URL_RE = new RegExp(`(${escapeRe(LEDGER_SITE)}/[A-Za-z0-9\\-._~/%<>]*[A-Za-z0-9\\-_~/%<>])`, 'g');

/** 説明文の中の当サイトの URL（https://bess-net.jp/...）を内部リンクに置き換えて描く */
function DescText({ text }: { text: string }) {
  const parts = text.split(SITE_URL_RE);
  return (
    <>
      {parts.map((p, i) => {
        if (i % 2 === 1 && !p.includes('<')) {
          const href = p.slice(LEDGER_SITE.length);
          const label = GLOSSARY_LABEL[href.replace(/^\/glossary\//, '')] ?? href;
          return (
            <Link key={i} href={href} style={linkStyle}>
              {label}
            </Link>
          );
        }
        return <span key={i}>{p}</span>;
      })}
    </>
  );
}

export default function AssetLedgerPage() {
  const url = `${siteConfig.url}${PAGE_PATH}`;
  const pageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `${LEDGER_TITLE}（xlsx）`,
    url,
    inLanguage: 'ja-JP',
    isAccessibleForFree: true,
    publisher: { '@type': 'Organization', name: siteConfig.organization.name, url: siteConfig.organization.url },
    mainEntity: {
      '@type': 'DigitalDocument',
      name: `${LEDGER_TITLE} v${LEDGER_VERSION}`,
      url: `${siteConfig.url}${LEDGER_PUBLIC_PATH}`,
      encodingFormat: XLSX_MIME,
      inLanguage: 'ja-JP',
      isAccessibleForFree: true,
      version: LEDGER_VERSION,
    },
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'トップ', item: `${siteConfig.url}/` },
      { '@type': 'ListItem', position: 2, name: 'ツール', item: `${siteConfig.url}/tools` },
      { '@type': 'ListItem', position: 3, name: '資産台帳テンプレート', item: url },
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
            <Link href="/">トップ</Link> / <Link href="/tools">ツール</Link> / 資産台帳テンプレート
          </p>
          <div className="section-label">xlsx · 無料 · 登録不要</div>
          <h1 className="section-title">{LEDGER_TITLE}（xlsx・無料・登録不要）</h1>
          <p className="section-desc text-base lg:text-lg" style={{ marginBottom: 16, lineHeight: 1.8 }}>
            {'系統用（高圧・特別高圧）蓄電所の運用の記録を、Excel 形式（xlsx）の台帳にまとめておくためのテンプレートです。' +
              '売却や借入の相談に備えて、運転開始日・SOH・保証・アグリゲーター契約・直近の収益と停止の記録などを一か所に揃えておけます。' +
              'アグリゲーターや O&M 事業者を替えても、記録が手元に残ります。'}
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 20 }}>
            {`${ledgerRecordSheetRange()} は記録の種類ごとのシートです。` +
              `「${LEDGER_CHECKLIST_SHEET.name}」には、売却や借入の相手（買い手・貸し手）が確かめそうな項目を、確かめられそうな順に当サイトが想定して ${LEDGER_CHECKLIST_ITEMS.length} 個並べ、値を入れるシートと列を添えました（実際の項目と順は相手によって違うことがあります。下の一覧）。` +
              `「${SN.site}」には、接続条件（`}
            <Link href={`/glossary/${LEDGER_GLOSSARY.n1}`} style={linkStyle}>N-1電制</Link>
            {'・'}
            <Link href={`/glossary/${LEDGER_GLOSSARY.nonFirm}`} style={linkStyle}>ノンファーム接続</Link>
            {'）や、電気事業法の届出（'}
            <Link href={`/glossary/${LEDGER_GLOSSARY.generationBusiness}`} style={linkStyle}>発電事業</Link>
            {'・'}
            <Link href={`/glossary/${LEDGER_GLOSSARY.specifiedWholesale}`} style={linkStyle}>特定卸供給事業</Link>
            {'）の有無を記録する列があります。'}
          </p>

          {/* ダウンロード（GA4 の file_download で計測されるよう、download 属性なしの通常のリンク＝/lv/invest の配布物と同じ） */}
          <section
            style={{
              margin: '0 0 28px',
              padding: 20,
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 8,
            }}
          >
            <a
              href={LEDGER_PUBLIC_PATH}
              style={{
                display: 'inline-block',
                padding: '12px 24px',
                background: 'var(--color-accent, #0066cc)',
                color: '#fff',
                borderRadius: 6,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              xlsx をダウンロード
            </a>
            <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '10px 0 0', lineHeight: 1.7 }}>
              {`${LEDGER_FILE_NAME}${FILE_KB !== null ? `・約 ${FILE_KB} KB` : ''}・v${LEDGER_VERSION}（${LEDGER_RELEASED}）・シート ${ledgerSheetCount()}（README を含む）・列 ${COLUMN_COUNT}`}
              <br />
              登録・メールアドレスは不要です。マクロは含みません。
            </p>
          </section>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>使い方</h2>
          <ol style={{ fontSize: 15, lineHeight: 1.8, paddingLeft: 22, marginBottom: 28 }}>
            <li>ダウンロードしたファイルを表計算ソフトで開き、README シートを読みます。</li>
            <li>{`1 ファイルに 1 サイトを記録します。各シートの ${LEDGER_ROW.header} 行目が列名、${LEDGER_ROW.desc} 行目が説明で、${LEDGER_ROW.firstInput} 行目から入力します。`}</li>
            <li>{`選択肢のある列はプルダウンから選びます。「${SN.monthly}」の合計収益と営業利益は数式で計算されます（${LEDGER_ROW.firstInput}〜${LEDGER_ROW.firstInput + LEDGER_FORMULA_ROWS - 1} 行目）。`}</li>
            <li>{`月次実績は毎月 1 行ずつ足します。契約が替わったら「${SN.contract}」に行を足して履歴を残します。`}</li>
            <li>{`売却や借入の相談の前に「${LEDGER_CHECKLIST_SHEET.name}」で整備状況（済／未／不要）を確かめます。`}</li>
          </ol>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{`売却や借入の相談で確かめられそうな ${LEDGER_CHECKLIST_ITEMS.length} 項目（${LEDGER_CHECKLIST_SHEET.name}）`}</h2>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12, lineHeight: 1.7 }}>
            {'項目と並びは当サイトの想定です（評価や点数は入れていません）。xlsx では各行の「整備状況（済／未／不要）」をプルダウンで記録できます。'}
          </p>
          <div style={{ overflowX: 'auto', marginBottom: 28 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--color-border)', whiteSpace: 'nowrap' }}>項目</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--color-border)', whiteSpace: 'nowrap' }}>シート</th>
                  <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--color-border)' }}>値を入れる列</th>
                </tr>
              </thead>
              <tbody>
                {LEDGER_CHECKLIST_ITEMS.map((it) => (
                  <tr key={it.item}>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', verticalAlign: 'top' }}>{it.item}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', verticalAlign: 'top', whiteSpace: 'nowrap' }}>{it.sheet}</td>
                    <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', verticalAlign: 'top', lineHeight: 1.6 }}>{checklistColumnLabel(it.sheet, it.columns)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>シートと列</h2>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', marginTop: 0, marginBottom: 12, lineHeight: 1.7 }}>
            {`各シートの列名と説明（xlsx の ${LEDGER_ROW.header}・${LEDGER_ROW.desc} 行目の内容。選択肢と用語集へのリンクを添えています）。単位は列名に入れています。`}
          </p>
          {SHEETS.map((s) => (
            <details key={s.name} style={{ marginBottom: 10, border: '1px solid var(--color-border)', borderRadius: 6, padding: '8px 12px' }}>
              <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: 15 }}>
                {`${s.name}（${s.columns.length} 列）— ${s.purpose}`}
              </summary>
              <p style={{ fontSize: 14, color: 'var(--color-muted)', margin: '8px 0' }}>{s.rowUnit}</p>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--color-border)', whiteSpace: 'nowrap' }}>列名</th>
                      <th style={{ textAlign: 'left', padding: '6px 8px', borderBottom: '2px solid var(--color-border)' }}>説明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.columns.map((c) => (
                      <tr key={c.name}>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', verticalAlign: 'top' }}>{c.name}</td>
                        <td style={{ padding: '6px 8px', borderBottom: '1px solid var(--color-border)', verticalAlign: 'top', lineHeight: 1.6 }}>
                          <DescText text={c.desc} />
                          {c.type === 'list' && c.options ? `（選択肢: ${c.options.length === 47 ? '47 都道府県' : c.options.join('・')}）` : ''}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ))}

          <h2 style={{ fontSize: 20, fontWeight: 700, margin: '28px 0 8px' }}>データの扱いと免責</h2>
          <p style={{ fontSize: 15, lineHeight: 1.8, marginBottom: 24 }}>
            {'このページにはアップロード・保存・送信の機能はなく、当サイトはテンプレートに入力された内容を受け取りません。ファイルは利用者の手元で使います。' +
              '当サイトは資産の評価者ではなく、このテンプレートは評価や点数を出すものではありません。項目は例であり、法令・契約上の義務を網羅するものではありません。'}
          </p>

          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>関連</h2>
          <ul style={{ fontSize: 15, lineHeight: 1.9, paddingLeft: 22, marginBottom: 12 }}>
            <li>
              <Link href="/tools/fire-risk-check" style={linkStyle}>蓄電池火災リスク自己診断</Link>
              {`（「${SN.equipment}」「${SN.incident}」の記録と合わせて）`}
            </li>
            <li>
              <Link href="/incidents" style={linkStyle}>火災・トラブル事例DB</Link>
              {`（「${SN.incident}」の記録の参考に）`}
            </li>
            <li>
              <Link href="/grid" style={linkStyle}>変電所 系統空き容量データベース</Link>
              {`（「${SN.site}」の接続変電所は、変電所ページの URL 末尾で記録できます）`}
            </li>
          </ul>
          <p style={{ fontSize: 14, color: 'var(--color-muted)', lineHeight: 1.7 }}>
            {'低圧の蓄電池投資を検討している方向けの PDF 資料は、'}
            <Link href="/lv/invest" style={linkStyle}>低圧系統用蓄電池の投資ガイド</Link>
            {'の「登録不要の資料」にあります。'}
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
