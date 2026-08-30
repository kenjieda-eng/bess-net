#!/usr/bin/env tsx
/**
 * scripts/post-projects-2026-08-w4.ts — 金曜ワンセット#4 ⑤ projects 連動（2026-08-30 遅延実施）
 *
 * 新規 14 件 POST ＋ 既存 1 件 PATCH（NC玉名市青野蓄電所: 需給調整市場参入の反映）。
 *  - 冪等: POST は findBySlug で既存 skip（#91）。PATCH は body の marker 文字列で判定（#122）
 *  - 値は一次（PR Times 原文・照合済み）記載のもののみ。非公表の出力/容量は null＋body に明記
 *  - status は select 実在値（稼働中/建設中/計画中）のみ。連系・竣工済みは既存慣行どおり「稼働中」
 *  - PATCH は marketParticipation と body のみ（差分限定）。outputMw 1.988 と原文 1,998kW の
 *    食い違いは勝手に直さず報告のみ
 * 実行: --dry-run で投入内容の確認 → 実行
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1/projects`;
const DRY = process.argv.includes('--dry-run');
const HDR = { 'X-MICROCMS-API-KEY': KEY! };
const NOTE = '<p><em>※本項目は一次情報（出典リンク）に基づく編集部の整理です。</em></p>';

type ProjectPost = {
  slug: string;
  name: string;
  operator: string;
  prefecture: string;
  city: string;
  outputMw?: number;
  capacityMwh?: number;
  status: string[];
  cod?: string;
  sourceUrl: string;
  body: string;
};

const POSTS: ProjectPost[] = [
  {
    slug: 'bluesky-himeji-bess',
    name: '兵庫県姫路市蓄電所（ブルースカイエナジー）',
    operator: 'ブルースカイエナジー株式会社',
    prefecture: '兵庫県', city: '姫路市', outputMw: 2, capacityMwh: 8,
    status: ['稼働中'], cod: '2026年6月',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000016.000175281.html',
    body: '<p><strong>兵庫県姫路市蓄電所</strong>は、ブルースカイエナジーがヒューリックとの提携により開発した系統用蓄電所（定格出力2MW／定格容量8MWh・リチウムイオン電池）。2026年6月に運転を開始した。アドバイザーはみずほ証券、アグリゲーターは Shizen Connect。</p>' + NOTE,
  },
  {
    slug: 'bluesky-osaki-bess',
    name: '宮城県大崎市蓄電所（ブルースカイエナジー）',
    operator: 'ブルースカイエナジー株式会社',
    prefecture: '宮城県', city: '大崎市', outputMw: 2, capacityMwh: 8,
    status: ['稼働中'], cod: '2026年7月',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000016.000175281.html',
    body: '<p><strong>宮城県大崎市蓄電所</strong>は、ブルースカイエナジーがヒューリックとの提携により開発した系統用蓄電所（定格出力2MW／定格容量8MWh・リチウムイオン電池）。2026年7月に運転を開始した。アドバイザーはみずほ証券、アグリゲーターは東芝。</p>' + NOTE,
  },
  {
    slug: 'bluesky-miyaki-bess',
    name: '佐賀県みやき町蓄電所（ブルースカイエナジー）',
    operator: 'ブルースカイエナジー株式会社',
    prefecture: '佐賀県', city: '三養基郡みやき町', outputMw: 2, capacityMwh: 8,
    status: ['稼働中'], cod: '2026年6月',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000016.000175281.html',
    body: '<p><strong>佐賀県みやき町蓄電所</strong>は、ブルースカイエナジーがヒューリックとの提携により開発した系統用蓄電所（定格出力2MW／定格容量8MWh・リチウムイオン電池）。2026年6月に運転を開始した。アドバイザーはみずほ証券、アグリゲーターは Shizen Connect。</p>' + NOTE,
  },
  {
    slug: 'bluesky-nakatsu-bess',
    name: '大分県中津市蓄電所（ブルースカイエナジー）',
    operator: 'ブルースカイエナジー株式会社',
    prefecture: '大分県', city: '中津市', outputMw: 2, capacityMwh: 8,
    status: ['稼働中'], cod: '2026年8月',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000016.000175281.html',
    body: '<p><strong>大分県中津市蓄電所</strong>は、ブルースカイエナジーがヒューリックとの提携により開発した系統用蓄電所（定格出力2MW／定格容量8MWh・リチウムイオン電池）。2026年8月に運転を開始した。アドバイザーはみずほ証券、アグリゲーターは GridBeyond。</p>' + NOTE,
  },
  {
    slug: 'fujitech-kushiro-katsuragoi-bess',
    name: '釧路桂恋蓄電所（富士テクニカルコーポレーション）',
    operator: '株式会社富士テクニカルコーポレーション',
    prefecture: '北海道', city: '釧路市', outputMw: 1.99, capacityMwh: 8.22,
    status: ['建設中'], cod: '2027年2月1日（予定）',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000042.000081547.html',
    body: '<p><strong>釧路桂恋蓄電所</strong>は、太陽光発電事業の富士テクニカルコーポレーション（千葉県匝瑳市）が系統用蓄電所事業の第1号機として北海道釧路市桂恋で建設する系統用蓄電所（定格出力1.99MW／定格容量8.22MWh）。蓄電システムはエレビスタとの売買契約により調達し、2027年2月1日より商業運転開始を予定する。同社は2030年までに全国で累計出力100MW以上の設置を目指す。</p>' + NOTE,
  },
  {
    slug: 'kajiwara-asago-bess',
    name: '兵庫朝来蓄電所（KAJIWARA）',
    operator: '株式会社KAJIWARA',
    prefecture: '兵庫県', city: '朝来市', outputMw: 2, capacityMwh: 8,
    status: ['計画中'], cod: '2027年4月（予定）',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000039.000006241.html',
    body: '<p><strong>兵庫朝来蓄電所</strong>は、KAJIWARA（兵庫県姫路市）が兵庫県朝来市で開発する系統用蓄電所（定格出力2MW／設備容量8MWh）。2027年4月の運転開始を予定し、アグリゲーション業務はスマートエナジーの子会社スマートエナジーサーキュラーが受託（卸売市場・需給調整市場・容量市場への対応から発電計画の策定までを一貫支援）。</p>' + NOTE,
  },
  {
    slug: 'nc-iwami-bess',
    name: 'NC岩美郡岩美町蓄電所',
    operator: '日本蓄電池株式会社',
    prefecture: '鳥取県', city: '岩美郡岩美町', outputMw: 1.999, capacityMwh: 8.146,
    status: ['稼働中'], cod: '2026-08-21',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000103.000161802.html',
    body: '<p><strong>NC岩美郡岩美町蓄電所</strong>は、日本蓄電池が鳥取県岩美郡で運営する系統用蓄電所（出力1,999kW／容量8,146kWh）。蓄電池システムは TMEIC 製（蓄電池は CATL 製）、設計・施工はカンドー。2026年8月21日に受電を開始した。JEPX・需給調整市場・容量市場に対応し、災害時には地域の電力供給を支える防災拠点としての機能も掲げる。</p>' + NOTE,
  },
  {
    slug: 'fujitaka-koka-tsuchiyama-bess',
    name: 'Fujitaka甲賀市土山町蓄電所',
    operator: '株式会社Fujitaka',
    prefecture: '滋賀県', city: '甲賀市', outputMw: 1.999, capacityMwh: 8.128,
    status: ['稼働中'], cod: '2026-07-21',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000022.000086264.html',
    body: '<p><strong>Fujitaka甲賀市土山町蓄電所</strong>は、Fujitaka が滋賀県甲賀市で運営する系統用蓄電所（出力1,999kW／容量8,128kWh）。蓄電池は HUAWEI 製「LUNA2000-2.0MWH」コンテナ型を採用し、2026年7月21日に系統連系を完了。2026年11月を目途に需給調整市場への参入を予定する。</p>' + NOTE,
  },
  {
    slug: 'shizuokagas-hamamatsu-bess',
    name: '浜松市の系統用蓄電所（静岡ガス＆パワー）',
    operator: '静岡ガス＆パワー株式会社',
    prefecture: '静岡県', city: '浜松市', outputMw: 1.999, capacityMwh: 8.584,
    status: ['計画中'], cod: '2028年4月（予定）',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000035.000071823.html',
    body: '<p>静岡ガスの100%子会社・<strong>静岡ガス＆パワー</strong>が静岡県浜松市で計画する系統用蓄電所（定格出力1,999kW／公称容量8,584kWh）。建設はグリーンエナジー＆カンパニーの100%子会社グリーンエナジー・プラスが受注し、用地開発から各種権利の取得、建設工事までを一体で担う。着工は2027年11月、運転開始は2028年4月の予定。</p>' + NOTE,
  },
  {
    slug: 'sustainable-miyawaka-bess',
    name: '宮若蓄電所（サステナブルホールディングス）',
    operator: 'サステナブルホールディングス株式会社',
    prefecture: '福岡県', city: '宮若市',
    status: ['稼働中'], cod: '2026年7月',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000110.000096742.html',
    body: '<p><strong>宮若蓄電所</strong>は、福岡県宮若市の系統用蓄電所で、2026年7月に竣工。サステナブルホールディングスが機器選定および施工を担った。アグリゲーターによる試験を完了し、2026年11月からの需給調整市場参入を予定する。出力・容量はリリースに記載がなく非公表（調査中）。</p>' + NOTE,
  },
  {
    slug: 'taoke-ota-nishinagaoka-bess',
    name: '群馬県太田市西長岡町2MW蓄電所（TAOKE ENERGY）',
    operator: 'TAOKE ENERGY株式会社',
    prefecture: '群馬県', city: '太田市', outputMw: 2, capacityMwh: 8,
    status: ['稼働中'], cod: '2026-08-10',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000041.000103834.html',
    body: '<p><strong>群馬県太田市西長岡町2MW蓄電所</strong>は、TAOKE ENERGY の系統用蓄電所（定格出力2MW／定格容量8MWh）。2026年8月10日に運転を開始した。単独販売案件で、アグリゲーターは子会社の POWER POOL。需給調整市場への参入は2026年12月1日から予定する。</p>' + NOTE,
  },
  {
    slug: 'taoke-imari-bess',
    name: '佐賀県伊万里市2MW蓄電所（TAOKE ENERGY）',
    operator: 'TAOKE ENERGY株式会社',
    prefecture: '佐賀県', city: '伊万里市', outputMw: 2, capacityMwh: 8,
    status: ['稼働中'], cod: '2026-08-10',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000041.000103834.html',
    body: '<p><strong>佐賀県伊万里市2MW蓄電所</strong>は、TAOKE ENERGY の系統用蓄電所（定格出力2MW／定格容量8MWh）。2026年8月10日に運転を開始した。自社投資案件で、アグリゲーターは子会社の POWER POOL。需給調整市場への参入は2026年11月16日から予定する。</p>' + NOTE,
  },
  {
    slug: 'ibeet-miyagi-shiroishi-bess',
    name: '宮城白石蓄電所（IBeeT×東急不動産）',
    operator: '宮城白石蓄電所合同会社（代表: IBeeT・東急不動産が共同出資）',
    prefecture: '宮城県', city: '白石市', outputMw: 20, capacityMwh: 75.2,
    status: ['計画中'], cod: '2028年度（予定）',
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000010.000110152.html',
    body: '<p><strong>宮城白石蓄電所</strong>は、IBeeT が代表を務める宮城白石蓄電所合同会社（2026年6月設立）が宮城県白石市で新設する系統用蓄電所（送電端出力20MW／蓄電容量75.2MWh）。東急不動産が共同出資する。2026年度中の着工、2028年度の運転開始を予定。IBeeT が出資参画する蓄電所事業としては4号案件で、同社はこれまで特別高圧6物件（合計出力約174MW・総事業費約300億円）のコンソーシアムに出資参画している。</p>' + NOTE,
  },
  {
    slug: 'nc-ikeda-yawata-bess',
    name: 'NC池田町八幡蓄電所',
    operator: '日本蓄電池株式会社',
    prefecture: '岐阜県', city: '揖斐郡池田町',
    status: ['建設中'],
    sourceUrl: 'https://prtimes.jp/main/html/rd/p/000000104.000161802.html',
    body: '<p><strong>NC池田町八幡蓄電所</strong>は、日本蓄電池が岐阜県揖斐郡池田町で建設中の系統用蓄電所。2026年8月18日に蓄電池の設置を開始した。設計・施工はカンドー。需給調整市場・JEPX・容量市場への対応と再エネ出力の平準化を想定する。出力・容量はリリースに記載がなく非公表（調査中）。</p>' + NOTE,
  },
];

// ── 既存 PATCH: NC玉名市青野蓄電所（需給調整市場参入の反映）──
const PATCH_SLUG = 'pr-co161802-kumamoto';
const PATCH_MARKER = '2026年8月19日より、デジタルグリッドをアグリゲーターとして需給調整市場';
const PATCH_APPEND =
  '<p><strong>【2026年8月19日追記】</strong>' + PATCH_MARKER + 'での運用を開始した。本施設は日本蓄電池とリミックスポイントが共同で組成したファンドにより開発され、日本蓄電池が開発・運営、リミックスポイントが事業管理・統括を担う。</p>';

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { ...HDR };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${url} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}

async function findBySlug(slug: string): Promise<Record<string, unknown> | null> {
  const d = await api<{ contents: Record<string, unknown>[] }>(
    'GET',
    `${BASE}?filters=slug[equals]${encodeURIComponent(slug)}&limit=1`
  );
  return d.contents[0] ?? null;
}

async function main(): Promise<void> {
  console.log(`[projects-w4] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'}  POST候補=${POSTS.length}件 + PATCH 1件`);
  let ok = 0, skip = 0, err = 0;

  for (const p of POSTS) {
    const existing = await findBySlug(p.slug);
    if (existing) {
      console.log(`  [skip] ${p.slug} — 既存 (id=${existing.id})`);
      skip++;
      await new Promise((r) => setTimeout(r, 400));
      continue;
    }
    if (DRY) {
      console.log(`  [dry-run] POST ${p.slug} | ${p.name} | ${p.prefecture}${p.city} | ${p.outputMw ?? '—'}MW/${p.capacityMwh ?? '—'}MWh | ${p.status[0]} | cod=${p.cod ?? '—'}`);
      ok++;
      continue;
    }
    try {
      const res = await api<{ id: string }>('POST', BASE, p);
      await new Promise((r) => setTimeout(r, 700));
      // #106: GET 全 field 照合
      const after = await findBySlug(p.slug);
      const diffs: string[] = [];
      for (const [k, v] of Object.entries(p)) {
        const got = after?.[k];
        if (JSON.stringify(got) !== JSON.stringify(v)) diffs.push(`${k}: 送信=${JSON.stringify(v)} 受信=${JSON.stringify(got)}`);
      }
      if (diffs.length) {
        console.log(`  [★照合NG] ${p.slug} id=${res.id}: ${diffs.join(' / ')}`);
        err++;
      } else {
        console.log(`  [ok] ${p.slug} — created id=${res.id}（#106 全field一致）`);
        ok++;
      }
    } catch (e) {
      console.error(`  [err] ${p.slug}: ${(e as Error).message}`);
      err++;
    }
    await new Promise((r) => setTimeout(r, 400));
  }

  // ── PATCH（差分限定・marker 冪等 #122）──
  const cur = await findBySlug(PATCH_SLUG);
  if (!cur) {
    console.log(`  [★NG] PATCH対象 ${PATCH_SLUG} が見つからない`);
    err++;
  } else {
    const curBody = String(cur.body ?? '');
    const curMp = (cur.marketParticipation as string[]) ?? [];
    const needBody = !curBody.includes(PATCH_MARKER);
    const needMp = !curMp.includes('需給調整市場');
    if (!needBody && !needMp) {
      console.log(`  [skip] ${PATCH_SLUG} — marker 既存＋需給調整市場 設定済み（冪等）`);
      skip++;
    } else if (DRY) {
      console.log(`  [dry-run] PATCH ${PATCH_SLUG}: body追記=${needBody} marketParticipation=${needMp ? '[需給調整市場] 追加' : '変更なし'}`);
      ok++;
    } else {
      const payload: Record<string, unknown> = {};
      if (needBody) payload.body = curBody + PATCH_APPEND;
      if (needMp) payload.marketParticipation = [...curMp, '需給調整市場'];
      await api('PATCH', `${BASE}/${cur.id}`, payload);
      await new Promise((r) => setTimeout(r, 700));
      const after = await findBySlug(PATCH_SLUG);
      const mpOk = ((after?.marketParticipation as string[]) ?? []).includes('需給調整市場');
      const bodyOk = String(after?.body ?? '').includes(PATCH_MARKER);
      // #106: 対象外フィールドの不変確認
      const others: string[] = [];
      for (const k of ['name', 'operator', 'prefecture', 'city', 'outputMw', 'capacityMwh', 'status', 'cod', 'sourceUrl', 'slug']) {
        if (JSON.stringify(cur[k]) !== JSON.stringify(after?.[k])) others.push(k);
      }
      console.log(`  [${mpOk && bodyOk && !others.length ? 'ok' : '★照合NG'}] PATCH ${PATCH_SLUG}: marker=${bodyOk} 需給調整市場=${mpOk} 他フィールド変化=${others.length ? others.join(',') : '0'}`);
      if (mpOk && bodyOk && !others.length) ok++; else err++;
    }
  }

  console.log(`[done] ok=${ok} skip=${skip} err=${err}`);
  const t = await api<{ totalCount: number }>('GET', `${BASE}?limit=0`);
  console.log(`[projects 総件数] ${t.totalCount}`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});

export {};
