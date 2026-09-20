#!/usr/bin/env tsx
/**
 * scripts/patch-lc2-eprx-links-2026-09-20.ts — EPRX の深いリンクをトップへ寄せる（Lc-2 ■3）
 *
 * 根拠（2026-09-20 に実機取得した条文の逐語）:
 *   EPRX 利用規約 §3「リンクについて」
 *     「本サイトへのリンクは原則としてトップページ（https://www.eprx.or.jp/）とし、
 *       当法人のサイトである旨を明示してください。」
 *   Lc-1 で JEPX に適用したのと同じ形（出所はテキストで明示・リンク先はトップ）を EPRX にも適用する。
 *
 * 対象（microCMS 全エンドポイント走査の結果、EPRX の深い URL は 5 箇所。うち PATCH するのは <a href> の 3 箇所）:
 *   1) glossary/power-market-price-trend.detail            … richEditor の <a href>   → 是正
 *   2) explainer/balancing-market-fcr-detail.body          … richEditor の <a href>   → 是正
 *   3) explainer/balancing-market-cap-cut-2026.body        … richEditor の <a href>   → 是正（リンク文字列が 2 字違い）
 *   4) explainer/balancing-price-cap-10yen-explainer.sources … textArea の「地の文の URL」→ 対象外
 *        dangerouslySetInnerHTML で描画されるが自動リンクはされないため、リンクではなく出典の記載。
 *        条文が定めているのは「リンクの設定方法」なので、テキストとしての URL 記載は是正しない。
 *   5) policy-events/…-2026-09.sourceUrl                   … URL そのものがフィールド値 → 対象外
 *        データ側は出所の正確な所在として残し、表示側（policy-calendar の 2 箇所）で
 *        normalizeSourceLinkHref を通してトップに寄せた。全レコードに効くのでこちらが恒久策。
 *
 * ★#122: richEditor は保存時に正規化される（見出し id の再採番・rel の補完）。
 *   したがって「送信した本文と GET した本文の全文一致」を冪等キーにしてはいけない。
 *   ここでは「深い URL が消え、トップの href が 1 回ある」を完了条件（marker）にする。
 * ★#106: PATCH 後に GET して全フィールドを照合（対象フィールド以外の変化 0 を確認）。
 *
 * 実行: set -a && . ./.env.local && set +a && npx tsx scripts/patch-lc2-eprx-links-2026-09-20.ts [--dry-run]
 */
export {};

const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const DRY = process.argv.includes('--dry-run');
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);
const EPRX_TOP = 'https://www.eprx.or.jp/';
const DEEP = 'https://www.eprx.or.jp/information/post.php';

type Rec = Record<string, unknown> & { id: string };
const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);
const count = (s: string, w: string) => (w ? s.split(w).length - 1 : 0);

type Target = { endpoint: string; slug: string; field: string; old: string; next: string };

/** 置換: <a href="深い URL">機関名「資料名」</a> → <a href="トップ">機関名</a>「資料名」 */
const TARGETS: Target[] = [
  {
    endpoint: 'glossary',
    slug: 'power-market-price-trend',
    field: 'detail',
    old: `<a href="${DEEP}" target="_blank" rel="noopener noreferrer">電力需給調整力取引所「需給調整市場のΔkW上限価格について」（2026年7月30日更新）</a>`,
    next: `<a href="${EPRX_TOP}" target="_blank" rel="noopener noreferrer">電力需給調整力取引所</a>「需給調整市場のΔkW上限価格について」（2026年7月30日更新）`,
  },
  {
    endpoint: 'explainer',
    slug: 'balancing-market-fcr-detail',
    field: 'body',
    old: `<a href="${DEEP}" target="_blank" rel="noopener noreferrer">電力需給調整力取引所「需給調整市場のΔkW上限価格について」（2026年7月30日更新）</a>`,
    next: `<a href="${EPRX_TOP}" target="_blank" rel="noopener noreferrer">電力需給調整力取引所</a>「需給調整市場のΔkW上限価格について」（2026年7月30日更新）`,
  },
  {
    // ★上の 2 件と 2 字だけ違う（「更新」が無い）。一括置換にせず別パターンとして持つ。
    endpoint: 'explainer',
    slug: 'balancing-market-cap-cut-2026',
    field: 'body',
    old: `<a href="${DEEP}" target="_blank" rel="noopener noreferrer">電力需給調整力取引所「需給調整市場のΔkW上限価格について」（2026年7月30日）</a>`,
    next: `<a href="${EPRX_TOP}" target="_blank" rel="noopener noreferrer">電力需給調整力取引所</a>「需給調整市場のΔkW上限価格について」（2026年7月30日）`,
  },
];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(`${method} ${url} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}

const bySlug = async (endpoint: string, slug: string): Promise<Rec | null> =>
  (
    await api<{ contents: Rec[] }>(
      'GET',
      `https://${DOMAIN}.microcms.io/api/v1/${endpoint}?filters=slug[equals]${slug}&limit=1`,
    )
  ).contents[0] ?? null;

async function main(): Promise<void> {
  console.log(`[Lc-2 ■3 EPRX リンク] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} / 対象 ${TARGETS.length} 件`);

  // 書込直前に一次を確認: EPRX トップが生きていること
  const top = await fetch(EPRX_TOP, { headers: { 'User-Agent': 'Mozilla/5.0' } }).catch(() => null);
  console.log(`   一次確認: ${EPRX_TOP} → ${top ? top.status : '取得失敗'}`);
  if (!top || !top.ok) {
    console.error('   [中止] リンク先の生存を確認できない');
    process.exit(1);
  }

  let applied = 0;
  let already = 0;
  let bad = 0;

  for (const t of TARGETS) {
    const label = `${t.endpoint}/${t.slug}.${t.field}`;
    const before = await bySlug(t.endpoint, t.slug);
    if (!before) {
      console.log(`   ★NG ${label}: レコード不在`);
      bad++;
      continue;
    }
    const cur = String(before[t.field] ?? '');
    const nOld = count(cur, t.old);
    const nNew = count(cur, t.next);

    if (nOld === 0 && nNew >= 1) {
      console.log(`   ${label}: 適用済み（冪等・marker あり）`);
      already++;
      continue;
    }
    if (nOld !== 1) {
      console.log(`   [見送り] ${label}: 置換元が ${nOld} 箇所（一意でない）`);
      bad++;
      continue;
    }

    const next = cur.replace(t.old, t.next);
    console.log(`   ${label}: ${cur.length} → ${next.length} 字`);
    console.log(`      前「${t.old}」`);
    console.log(`      後「${t.next}」`);
    if (DRY) continue;

    await api('PATCH', `https://${DOMAIN}.microcms.io/api/v1/${t.endpoint}/${before.id}`, {
      [t.field]: next,
    });
    await new Promise((r) => setTimeout(r, 900));

    const after = await bySlug(t.endpoint, t.slug);
    let recBad = 0;
    for (const k of new Set([...Object.keys(before), ...Object.keys(after ?? {})])) {
      if (SYS.has(k)) continue;
      if (k === t.field) {
        const av = String(after?.[k] ?? '');
        const okOld = count(av, t.old) === 0;
        const okNew = count(av, t.next) === 1;
        const deepLeft = av.includes(`href="${DEEP}"`);
        if (!okOld || !okNew || deepLeft) {
          recBad++;
          console.log(`      ✗ ${k}: 置換元なし=${okOld} 置換後1回=${okNew} 深いリンク残存=${deepLeft}`);
        } else {
          console.log(
            `      ✓ ${k}: 置換元 0・置換後 1 回・深い EPRX リンク 0` +
              `（送信値と全文一致=${av === next}／richEditor の正規化で false でも失敗としない）`,
          );
        }
        continue;
      }
      if (norm(after?.[k]) !== norm(before[k])) {
        recBad++;
        console.log(`      ✗ ${k}: 変化した（期待: 不変）`);
      }
    }
    if (recBad === 0) console.log(`      #106: ✓ ${t.field} のみ変更・他フィールド変化 0`);
    else bad += recBad;
    applied++;
  }

  console.log(`\n[done] 適用 ${applied} / 適用済み ${already} / 問題 ${bad}`);
  process.exit(bad > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});
