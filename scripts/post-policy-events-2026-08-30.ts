#!/usr/bin/env tsx
/**
 * scripts/post-policy-events-2026-08-30.ts — 週次政策投入（2026-08-30 遅延実施分・3件）
 *
 * 原稿: OneDrive 03_5月13日朝_実行/週次政策_policy-calendar投入_2026-08-30.md §2（ユウ・一次確認済み）
 *  - 旧・追加②（次世代蓄電池・次世代モーター）は既存 meti-next-gen-battery-rd-plan-pubcomm-2026-07 と
 *    重複のため取り下げ済み → 投入しない
 *  - select は実在値へマッピング（#106）:
 *      追加① eventType=重要会議 status=予定 category=[容量市場,重要会議]（前例 kentoukai-74）
 *      追加③ eventType=パブコメ status=進行中 category=[パブコメ,法改正]（前例 renewable-energy-act-amendment）
 *      追加④ eventType=パブコメ status=進行中 category=[パブコメ]
 *  - description は原稿の値をそのまま（改変しない）
 *  - POST 前に sourceUrl 3 本の HTTP 200 を確認（特に追加④はパターン構成 URL のため必須）
 *  - 冪等: findBySlug で既存 skip。POST 後 GET 全 field 照合（#106）
 */
const DOMAIN = process.env.MICROCMS_SERVICE_DOMAIN ?? 'bess-net';
const KEY = process.env.MICROCMS_API_KEY;
if (!KEY) {
  console.error('MICROCMS_API_KEY 未設定');
  process.exit(1);
}
const BASE = `https://${DOMAIN}.microcms.io/api/v1/policy-events`;
const DRY = process.argv.includes('--dry-run');

type Ev = {
  slug: string;
  title: string;
  eventDate: string;
  eventType: string[];
  issuer: string;
  description: string;
  sourceUrl: string;
  status: string[];
  category: string[];
};

const EVENTS: Ev[] = [
  {
    slug: 'occto-capacity-kentoukai-76-20260901',
    title: '第76回 容量市場の在り方等に関する検討会（OCCTO）',
    eventDate: '2026-09-01',
    eventType: ['重要会議'],
    issuer: '電力広域的運営推進機関（OCCTO）',
    description:
      '9/1（火）13:30〜15:30、Web開催（傍聴に代え終了後に音声ファイル等を一定期間公開）。議題：(1) 容量市場 追加オークション約定結果（対象実需給年度2027年度）(2) 長期脱炭素電源オークション募集要綱に関する意見募集の結果 (3) 2025年度包括的検証後の取り組みと各課題における検討の方向性（電源等区分と需給ひっ迫時に対応するリクワイアメント・ペナルティ）。蓄電池の容量市場収益・長期脱炭素第4回募集（2027年1月想定）の条件に直結。',
    sourceUrl: 'https://www.occto.or.jp/iinkai/youryou_kentoukai/76.html',
    status: ['予定'],
    category: ['容量市場', '重要会議'],
  },
  {
    slug: 'pubcom-fit-fip-rule-amendment-202608',
    title: 'パブコメ：再生可能エネルギー特措法施行規則の改正案',
    eventDate: '2026-09-12',
    eventType: ['パブコメ'],
    issuer: '経済産業省 資源エネルギー庁（新エネルギー課）',
    description:
      // ★2026-08-30 是正（patch-fix-2026-08-30b.ts）: 旧文は「改正案PDFに併設蓄電池の記載欄が含まれる」
      //   とだけ書いており「蓄電池に関わる改正」と読めた。意見公募要領PDF（seqNo=0000319480）の
      //   「1．意見公募の趣旨・目的・背景」を一次確認した結果、趣旨は風力の廃棄等費用積立制度に伴う
      //   様式改正で蓄電池は対象外（2026-08-21 週次政策便 §3 の「登録しない」判定と同一根拠）。
      '案件番号 620340004。公示 2026-08-14、受付締切 2026-09-12 23:59。意見公募要領 1．意見公募の趣旨・目的・背景（逐語）は「資源エネルギー庁では、再生可能エネルギー電気の利用の促進に関する特別措置法施行規則の一部を改正する省令（令和８年経済産業省令第２９号）のうち、風力発電設備への廃棄等費用積立制度の導入に係る改正規定の施行に伴い、必要な様式改正に向けた検討を行いました。」。改正案の様式には蓄電池の位置・区分計量の可否・系統からの充電の有無といった記載欄が含まれるが、これは既存様式の踏襲であり、本改正の対象ではない（意見公募要領の趣旨で確認）。系統用蓄電池事業者に直接の影響はない見込み。',
    sourceUrl: 'https://public-comment.e-gov.go.jp/servlet/Public?CLASSNAME=PCMMSTDETAIL&id=620340004&Mode=0',
    status: ['進行中'],
    category: ['パブコメ', '法改正'],
  },
  {
    slug: 'pubcom-baseload-market-guideline-202608',
    title: 'パブコメ：ベースロード市場ガイドライン（案）',
    eventDate: '2026-09-24',
    eventType: ['パブコメ'],
    issuer: '経済産業省 資源エネルギー庁',
    description:
      '案件番号 620340006。公示 2026-08-26、受付締切 2026-09-24 23:59。7月募集分（案件番号 620226018、8/7 締切）に続く意見募集。蓄電池への直接関連は薄いが電力市場制度全般として掲載。',
    sourceUrl: 'https://public-comment.e-gov.go.jp/servlet/Public?CLASSNAME=PCMMSTDETAIL&id=620340006&Mode=0',
    status: ['進行中'],
    category: ['パブコメ'],
  },
];

async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { 'X-MICROCMS-API-KEY': KEY! };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} → HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json() as T;
}

async function main(): Promise<void> {
  console.log(`[policy-0830] mode=${DRY ? 'DRY-RUN' : 'EXECUTE'} 3件`);

  // sourceUrl 生死確認（3件とも 200 必須）
  for (const ev of EVENTS) {
    const r = await fetch(ev.sourceUrl, { method: 'GET', redirect: 'follow' });
    console.log(`  [url] ${ev.slug}: HTTP ${r.status}`);
    if (!r.ok) {
      console.error(`  ✗ sourceUrl が 200 でない → 停止（e-Gov 一覧から正しい URL を特定して差し替えること）`);
      process.exit(1);
    }
    await new Promise((x) => setTimeout(x, 400));
  }

  let ok = 0, skip = 0, err = 0;
  for (const ev of EVENTS) {
    const dup = await api<{ totalCount: number; contents: Array<{ id: string }> }>(
      'GET',
      `${BASE}?filters=slug[equals]${encodeURIComponent(ev.slug)}&fields=id&limit=1`
    );
    if (dup.totalCount > 0) {
      console.log(`  [skip] ${ev.slug} — 既存 (id=${dup.contents[0].id})`);
      skip++;
      await new Promise((x) => setTimeout(x, 400));
      continue;
    }
    if (DRY) {
      console.log(`  [dry-run] POST ${ev.slug} | ${ev.eventDate} | ${ev.eventType[0]}/${ev.status[0]}/${ev.category.join('+')}`);
      ok++;
      continue;
    }
    try {
      const res = await api<{ id: string }>('POST', BASE, ev);
      await new Promise((x) => setTimeout(x, 700));
      const after = await api<{ contents: Array<Record<string, unknown>> }>(
        'GET',
        `${BASE}?filters=slug[equals]${encodeURIComponent(ev.slug)}&limit=1`
      );
      const rec = after.contents[0];
      const diffs: string[] = [];
      for (const [k, v] of Object.entries(ev)) {
        if (JSON.stringify(rec?.[k]) !== JSON.stringify(v)) diffs.push(`${k}: 送信=${JSON.stringify(v)} 受信=${JSON.stringify(rec?.[k])}`);
      }
      if (diffs.length) {
        console.log(`  [★照合NG] ${ev.slug} id=${res.id}: ${diffs.join(' / ')}`);
        err++;
      } else {
        console.log(`  [ok] ${ev.slug} — created id=${res.id}（#106 全field一致）`);
        ok++;
      }
    } catch (e) {
      console.error(`  [err] ${ev.slug}: ${(e as Error).message}`);
      err++;
    }
    await new Promise((x) => setTimeout(x, 400));
  }
  console.log(`[done] ok=${ok} skip=${skip} err=${err}`);
  const t = await api<{ totalCount: number }>('GET', `${BASE}?limit=0`);
  console.log(`[policy-events 総件数] ${t.totalCount}`);
  process.exit(err > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('FATAL:', e);
  process.exit(1);
});

export {};
