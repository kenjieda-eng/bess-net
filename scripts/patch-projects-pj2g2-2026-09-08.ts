/**
 * scripts/patch-projects-pj2g2-2026-09-08.ts — Pj2-G 追修便（ユウ裁定 2026-09-08）
 *
 * ★全行、実行直前に一次を再取得して逐語を取り直した値のみを送る（Pj2-G ■0 と同じ大原則）。
 *   再取得で食い違った項目は SKIPPED に理由つきで退避し PATCH しない。
 *
 * 実行: npx tsx --env-file=.env.local scripts/patch-projects-pj2g2-2026-09-08.ts [--dry-run]
 */
export {};
const SERVICE_DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN;
const API_KEY = process.env.MICROCMS_API_KEY;
const DRY_RUN = process.argv.includes('--dry-run');
if (!SERVICE_DOMAIN || !API_KEY) { console.error('ERROR: env required'); process.exit(1); }
const BASE = `https://${SERVICE_DOMAIN}.microcms.io/api/v1/projects`;
const SYS = new Set(['id', 'createdAt', 'updatedAt', 'publishedAt', 'revisedAt']);

type Row = { slug: string; patch: Record<string, unknown>; why: string; marker?: { field: string; text: string } };

/** 非重複メモ（#122 marker 方式・A と C の body 末尾へ追記） */
const NODUP_MARK = '※同一地区の別施設';
const NODUP_A =
  `<p>${NODUP_MARK}: 本施設「NC仙台市上愛子B蓄電所」と「NC仙台市青葉区上愛子蓄電所」は、` +
  '宮城県仙台市・上愛子地区にある別々の系統用蓄電所です。定格出力1,988kW・定格容量8,146kWh・' +
  '蓄電システムTMEIC（蓄電池：CATL）・設計施工 株式会社ミライト・ワンが同値のため重複と誤認されやすいものの、' +
  '受電の告知は別リリース（本施設 2026年4月3日公表／青葉区上愛子 同年4月1日公表）で、' +
  '需給調整市場の運用開始日も 2026年6月30日／同年6月23日と異なります。重複登録ではありません。' +
  'なお事業者は本施設を「NC青葉区上愛子B蓄電所」とも表記します。</p>';
const NODUP_C =
  `<p>${NODUP_MARK}: 本施設「NC仙台市青葉区上愛子蓄電所」と「NC仙台市上愛子B蓄電所」は、` +
  '宮城県仙台市・上愛子地区にある別々の系統用蓄電所です。定格出力1,988kW・定格容量8,146kWh・' +
  '蓄電システムTMEIC（蓄電池：CATL）・設計施工 株式会社ミライト・ワンが同値のため重複と誤認されやすいものの、' +
  '受電の告知は別リリース（本施設 2026年4月1日公表／上愛子B 同年4月3日公表）で、' +
  '需給調整市場の運用開始日も 2026年6月23日／同年6月30日と異なります。重複登録ではありません。</p>';

/** kyuden-omuta-reuse body §1 第2文の置換（前回案A・差分最小） */
const OMUTA_FROM = 'リユース（中古EV）電池を採用したサーキュラーエコノミー実装事例として、2022年8月に発表されました。';
const OMUTA_TO =
  '電動フォークリフトで使用した電池パックを再利用したリユース蓄電池（リチウムイオン電池）を採用する' +
  'サーキュラーエコノミー実装事例で、2022年8月5日に運用を開始しました。';

const ROWS: Row[] = [
  // ── ■1 name 3件
  { slug: 'pr-co160356-bess', patch: { name: 'ADW三重松阪市蓄電所' },
    why: 'PR054（本レコードの sourceUrl・本連系稼働）で「ADW三重松阪市蓄電所」×19・「ADW三重松阪蓄電所」（市なし）×0。'
       + 'タイトル／本文2箇所／画像キャプションの逐語。正式名の先頭 ADW は同PRが「以下「ADW」」と定義した略称のため事業者名を重ね付けしない' },
  { slug: 'pr-co140317-bess', patch: { name: '和歌山県和歌山市松江蓄電所', city: '和歌山市', operator: 'エネルギーパワー株式会社' },
    why: 'name: ★一次PR034 に施設の固有名は存在しない（「メガパワー」「Mega Power」ともに0件）ことを再取得で確認。裁定の名無し規則（県＋市町村＋蓄電所）＋大字で一意化した記述的名称で、'
       + '構成要素はすべて逐語「和歌山県和歌山市松江に設備容量約8.2MWhの系統用蓄電所を建設・運営する事業を計画しています。」に由来。'
       + 'city: 同逐語（★本社は大阪府大阪市中央区・PR TIMES の locations メタは東京都港区で、いずれも設備所在地ではない）。'
       + 'operator: 事業概要欄「（1）事業者　エネルギーパワー株式会社」＋タイトル「…エネルギーパワー株式会社の開発する系統用蓄電所事業…」。'
       + 'capacityMwh は既に 8.2 で一次「約8.2MWh」と一致するため送らない' },
  { slug: 'pr-co166651-bess', patch: { name: '（仮称）松江市宍道蓄電所' },
    why: 'PR111「２．蓄電所の概要」名称欄の逐語（全角括弧・全文で4回。半角版は0）。計画中案件のため「（仮称）」を落とさない' },

  // ── ■2 仙台 A の是正
  { slug: 'pr-co161802-miyagi',
    patch: { name: 'NC仙台市上愛子B蓄電所（日本蓄電池）', city: '仙台市青葉区', cod: '2026-04-01', sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000056.000161802.html' },
    why: 'name: PR056 タイトル・本文・施設概要表「施設名｜NC仙台市上愛子B蓄電所」＋自社 news/1593 同文言＋日経BP。'
       + 'city: 所在地欄は全4リリースとも「宮城県仙台市」までだが、区は事業者自身の別題「NC青葉区上愛子B蓄電所」（news/1552・news/1795）由来で外部推定ではない。兄弟レコード C と粒度を揃える。'
       + 'cod: 施設概要表「運転開始日｜2026年4月1日」（現値 2026-04-03 は PR 配信日）。sourceUrl: 現値は企業トップで案件を指していない' },

  // ── ■2 非重複メモ（body 末尾追記・#122 marker）
  { slug: 'pr-co161802-miyagi', patch: { __appendBody: NODUP_A }, marker: { field: 'body', text: NODUP_MARK },
    why: '非重複メモ。A と C は諸元・所在地・EPC が同値の別施設で、機械的な重複検知が誤判定するため根拠を本文に残す' },
  { slug: 'nc-sendai-kamiayashi', patch: { __appendBody: NODUP_C }, marker: { field: 'body', text: NODUP_MARK },
    why: '同上（C 側）。C のフィールドは一次と全項目一致のため body 追記以外は触らない' },

  // ── ■3 kyuden-omuta-reuse
  { slug: 'kyuden-omuta-reuse', patch: { __replaceBody: [OMUTA_FROM, OMUTA_TO], sourceUrl: 'https://www.kyuden.co.jp/press/2022/h220805-1.html' },
    why: '一次（別紙PDF）逐語「※ NExT-eSが独自に開発した電池パック108個をトヨタ自動車九州株式会社宮田工場の電動フォークリフトで使用した後、大牟田蓄電所で再利用」'
       + '＋本文「電動フォークリフトで使用した蓄電池を再利用しており」。一次全文に「EV」「電気自動車」は0件。'
       + '「2022年8月に発表」も一次は「本日から…運用を開始しました」（発信日 2022年8月5日）。'
       + 'sourceUrl: 旧 press_h220805-1.html は HTTP 301 → 新 press/2022/h220805-1.html が 200' },
];

/** 一次再取得で食い違い、または本便のスコープ外として送らなかった項目（報告用） */
const SKIPPED: Array<{ slug: string; field: string; reason: string }> = [
  { slug: 'kyuden-omuta-reuse', field: 'body §2「EV由来電池」',
    reason: '★同じ誤りが §2 にも実在（一次照合で「EV由来電池の系統用二次利用は…千歳蓄電所と並ぶ…先行事例の一つです」は大牟田を EV 由来と述べている＝是正必要と判定）。'
          + 'ただし本便の指示が「置換は当該1文のみ・前後の文は不変」のため実行しない。置換案:「EV由来電池」→「リユース電池」（4文字・最小差分）。要裁定' },
  { slug: 'pr-co140317-bess', field: 'outputMw',
    reason: '一次PR034 に出力の記載が皆無（「出力」「kW」とも0件）。現値 0 は「0MW と公表された」ではなく「未記載」。null 化の可否は要裁定（本便では触らない）' },
  { slug: 'pr-co69153-ibaraki-3', field: 'capacityMwh',
    reason: '一次逐語は「4887.6kWh」＝4.8876MWh。現値 -3=4.887（切り捨て）・-2=4.888（四捨五入）でどちらも一次そのままではない。301 の移植対象ではないため本便では触らない（要裁定）' },
];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': API_KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}
async function bySlug(slug: string): Promise<Record<string, unknown> | null> {
  const d = await api<{ contents: Array<Record<string, unknown>> }>('GET', `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`);
  return d.contents[0] ?? null;
}
let done = 0, skipped = 0, failed = 0;

async function runRow(row: Row): Promise<void> {
  const before = await bySlug(row.slug);
  if (!before) { console.log(`\n■ ${row.slug}: ★NG 不在`); failed++; return; }
  console.log(`\n■ ${row.slug} (id=${before.id})`);

  const payload: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row.patch)) {
    if (k === '__appendBody') {
      const cur = String(before.body ?? '');
      if (row.marker && cur.includes(row.marker.text)) { console.log(`   [skip] body: marker「${row.marker.text}」既出（冪等）`); continue; }
      payload.body = cur + String(v);
      console.log(`   body: 末尾へ追記（${cur.length}→${String(payload.body).length}字）`);
    } else if (k === '__replaceBody') {
      const [from, to] = v as [string, string];
      const cur = String(before.body ?? '');
      if (cur.includes(to) && !cur.includes(from)) { console.log('   [skip] body: 置換済み（冪等）'); continue; }
      const n = cur.split(from).length - 1;
      if (n !== 1) { console.log(`   [停止] body: 置換元が ${n} 箇所（一意でない）→ 書込まず`); failed++; return; }
      payload.body = cur.replace(from, to);
      console.log(`   body: 1文置換（${cur.length}→${String(payload.body).length}字）`);
      console.log(`      before: ${from}`);
      console.log(`      after : ${to}`);
    } else if (JSON.stringify(before[k]) !== JSON.stringify(v)) {
      payload[k] = v;
      console.log(`   ${k}: ${JSON.stringify(before[k])} → ${JSON.stringify(v)}`);
    } else {
      console.log(`   ${k}: ${JSON.stringify(v)} [同値]`);
    }
  }
  if (Object.keys(payload).length === 0) { console.log('   [skip] 変更なし（冪等）'); skipped++; return; }
  console.log(`   根拠: ${row.why}`);
  if (DRY_RUN) { console.log(`   [dry-run] ${Object.keys(payload).join(',')} を送信予定`); done++; return; }

  await api('PATCH', `${BASE}/${before.id}`, payload);
  await new Promise((r) => setTimeout(r, 700));
  const after = await bySlug(row.slug);
  let bad = 0;
  for (const k of new Set([...Object.keys(before), ...Object.keys(after ?? {}), ...Object.keys(payload)])) {
    if (SYS.has(k)) continue;
    if (k in payload) {
      // body は richEditor のため送信値との全文一致で判定しない（#122）。marker / 置換後文字列の存在で判定
      if (k === 'body') {
        const ab = String(after?.body ?? '');
        const ok = row.marker ? ab.includes(row.marker.text) : ab.includes(OMUTA_TO) && !ab.includes(OMUTA_FROM);
        if (!ok) { bad++; console.log('   ✗ body: marker/置換後文字列が見当たらない'); }
        else console.log(`   ✓ body: ${row.marker ? `marker「${row.marker.text}」あり` : '置換後の文あり・置換前の文なし'}（送信値と全文一致=${ab === payload.body}／false でも失敗としない）`);
      } else if (JSON.stringify(after?.[k]) !== JSON.stringify(payload[k])) {
        bad++; console.log(`   ✗ ${k}: 保存=${JSON.stringify(after?.[k])}`);
      }
    } else if (JSON.stringify(after?.[k]) !== JSON.stringify(before[k])) {
      bad++; console.log(`   ✗ ${k}: 意図しない変化 ${JSON.stringify(before[k])} → ${JSON.stringify(after?.[k])}`);
    }
  }
  console.log(`   #106: ${bad === 0 ? `✓ 送信 ${Object.keys(payload).length} field 一致・他フィールド変化 0` : `★NG 不一致 ${bad}`}`);
  if (bad === 0) done++; else failed++;
  await new Promise((r) => setTimeout(r, 300));
}

async function main(): Promise<void> {
  console.log(`[Pj2-G 追修便] mode=${DRY_RUN ? 'DRY-RUN' : 'EXECUTE'}`);
  for (const row of ROWS) await runRow(row);
  console.log('\n════════ 送らなかった項目（要裁定・報告用） ════════');
  for (const s of SKIPPED) console.log(`  ・${s.slug} [${s.field}]\n      ${s.reason}`);
  console.log(`\n[Pj2-G 追修便] 実行 ${done} / 冪等スキップ ${skipped} / 失敗 ${failed} / 未送信 ${SKIPPED.length}`);
  if (failed) process.exitCode = 1;
}
main().catch((e) => { console.error(e); process.exit(1); });
