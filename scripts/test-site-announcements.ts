#!/usr/bin/env tsx
/**
 * scripts/test-site-announcements.ts
 *
 * 全ページ告知バナーの日付判定の単体テスト（An-1・2026-09-21）
 *
 * ★何を確かめるか
 *   本番では日付を進められないため、「10/15 以降に自動でセミナーが消え、稼働中紹介に戻る」ことを
 *   判定関数（src/lib/announcement-schedule.ts）に日付を与えて確かめる。
 *   AnnouncementBanner はこの関数を「サーバの描画日」と「閲覧日」の 2 回呼ぶだけなので、
 *   この関数が正しければ、閲覧日での表示は正しい。
 *
 * 実行: npx tsx scripts/test-site-announcements.ts
 */
import { SITE_ANNOUNCEMENTS } from '../src/data/site-announcements';
import { selectActiveAnnouncement, toJstDate } from '../src/lib/announcement-schedule';
import { ENDS_AT, SEMINAR_SLUG, STARTS_AT } from '../src/app/info/seminar-bess-investment-2026-10-14/seminar';
export {};

const SEMINAR = 'seminar-bess-investment-2026-10-14';
const OPERATING = 'operating-bess-introduction';

let pass = 0;
let fail = 0;
function assert(label: string, cond: boolean, detail?: string) {
  if (cond) {
    pass++;
    console.log(`  ✅ ${label}`);
  } else {
    fail++;
    console.log(`  ❌ ${label}${detail ? ` — ${detail}` : ''}`);
  }
}
const idOn = (d: string) => selectActiveAnnouncement(SITE_ANNOUNCEMENTS, d)?.id ?? null;

/** YYYY-MM-DD を 1 日ずつ進める（UTC 正午基準で DST の影響を受けない） */
function* days(from: string, to: string) {
  for (let t = Date.parse(`${from}T12:00:00Z`); t <= Date.parse(`${to}T12:00:00Z`); t += 86_400_000) {
    yield new Date(t).toISOString().slice(0, 10);
  }
}

console.log('━━━ Group 1: JST の暦日（日付の境界は日本時間の 0 時）━━━');
assert('UTC 2026-10-14 14:59:59 → JST 10-14', toJstDate(new Date('2026-10-14T14:59:59Z')) === '2026-10-14');
assert('UTC 2026-10-14 15:00:00 → JST 10-15', toJstDate(new Date('2026-10-14T15:00:00Z')) === '2026-10-15');
assert('UTC 2026-09-20 15:00:00 → JST 09-21', toJstDate(new Date('2026-09-20T15:00:00Z')) === '2026-09-21');

console.log('\n━━━ Group 2: 期間の前後 ━━━');
assert(`9/20（開始前日）は稼働中紹介`, idOn('2026-09-20') === OPERATING, `actual=${idOn('2026-09-20')}`);
assert(`9/21（開始日）はセミナー`, idOn('2026-09-21') === SEMINAR, `actual=${idOn('2026-09-21')}`);
assert(`10/14（開催当日・endAt）はセミナー`, idOn('2026-10-14') === SEMINAR, `actual=${idOn('2026-10-14')}`);
assert(`10/15（endAt 翌日）は稼働中紹介に戻る`, idOn('2026-10-15') === OPERATING, `actual=${idOn('2026-10-15')}`);
{
  const bad = [...days('2026-09-21', '2026-10-14')].filter((d) => idOn(d) !== SEMINAR);
  assert(`9/21〜10/14 の全 24 日でセミナー`, bad.length === 0, `外れ: ${bad.join(',')}`);
}
{
  const bad = [...days('2026-10-15', '2027-03-31')].filter((d) => idOn(d) !== OPERATING);
  assert(`10/15〜2027/3/31 の全日で稼働中紹介`, bad.length === 0, `外れ: ${bad.slice(0, 5).join(',')}`);
}

console.log('\n━━━ Group 3: 設定の整合 ━━━');
{
  const ids = SITE_ANNOUNCEMENTS.map((a) => a.id);
  assert('id が重複しない', new Set(ids).size === ids.length);
  const re = /^\d{4}-\d{2}-\d{2}$/;
  assert('startAt・endAt が YYYY-MM-DD', SITE_ANNOUNCEMENTS.every((a) => re.test(a.startAt) && re.test(a.endAt)));
  assert('startAt <= endAt', SITE_ANNOUNCEMENTS.every((a) => a.startAt <= a.endAt));
  const s = SITE_ANNOUNCEMENTS.find((a) => a.id === SEMINAR);
  const o = SITE_ANNOUNCEMENTS.find((a) => a.id === OPERATING);
  assert('セミナーの priority > 稼働中紹介', !!s && !!o && s.priority > o.priority, `seminar=${s?.priority} operating=${o?.priority}`);
  assert('セミナーの href は内部案内ページ（バナー→案内→pps-net の 3 段）', s?.href === `/info/${SEMINAR}`, `actual=${s?.href}`);
  assert('セミナーは×で閉じられる（稼働中紹介と同じ）', s?.dismissible === true && o?.dismissible === true);
  assert('モバイル用の短縮文言がある', !!s?.titleShort && s.titleShort.length < s.title.length);
}

console.log('\n━━━ Group 4: 案内ページの切替時刻（page.tsx が TimeSwitch に渡す実際の値）━━━');
{
  const at = Date.parse(ENDS_AT);
  const start = Date.parse(STARTS_AT);
  assert(`ENDS_AT（${ENDS_AT}）が日時として読める`, Number.isFinite(at));
  assert('ENDS_AT = 一次の終了時刻 10/14 14:00 JST（UTC 05:00）', at === Date.parse('2026-10-14T05:00:00Z'));
  assert('STARTS_AT = 一次の開始時刻 10/14 13:00 JST', start === Date.parse('2026-10-14T04:00:00Z') && start < at);
  const s = SITE_ANNOUNCEMENTS.find((a) => a.id === SEMINAR);
  assert(
    'バナーの endAt ＝ 開催終了日（JST）＝ 案内ページが「終了」に切り替わる日',
    s?.endAt === toJstDate(new Date(at)),
    `endAt=${s?.endAt} / ENDS_AT の JST 日付=${toJstDate(new Date(at))}`,
  );
  assert('案内ページの slug ＝ バナーの href 先', s?.href === `/info/${SEMINAR_SLUG}`);
}

console.log(`\n━━━ 結果: ${pass}/${pass + fail} PASS ━━━`);
process.exit(fail > 0 ? 1 : 0);
