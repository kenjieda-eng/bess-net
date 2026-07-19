/**
 * StartTrustBlock — 「安心してご相談いただける理由」共用ブロック（/start 3LP増補 A案・2026-07-19）
 * operating-bess-introduction の承認済み3点ブロック（2026-07-12 ノブ案・EIC公式/自サイトで出典が
 * 取れた事実のみ L-EIC-019）を原文のまま転用・コンポーネント化。
 * ※ 文言を変える場合は operating-bess-introduction 側（inline 原本）と同時に見直すこと。
 * 変電所数は substations INDEX から動的導出（焼き込み禁止・microCMS 0 req）。
 */
import Link from 'next/link';
import { siteConfig } from '@/lib/site-config';
import substationsIndex from '@/data/substations/index.json';

const SUBSTATION_TOTAL_STR = (substationsIndex as { total: number }).total.toLocaleString('en-US');

export default function StartTrustBlock() {
  return (
    <>
      <h2>安心してご相談いただける理由</h2>
      <ul style={{ paddingLeft: 20, lineHeight: 1.9 }}>
        <li>
          <strong>電力業界の専門家チームが対応</strong> —
          『2時間でわかる 蓄電池ビジネスの未来』ほか蓄電池・エネルギー分野の著書を持つ理事・江田健二をはじめ、EIC の専門家チームがご相談に対応します。
        </li>
        <li>
          <strong>業界データ基盤の運営元</strong> —
          蓄電所ネットは全国10社・{SUBSTATION_TOTAL_STR}変電所の系統情報DB、540社超の事業者ナビ、
          <Link href="/reports/2026">業界レポート2026</Link> 等を運営しており、案件を評価するためのデータ基盤を持っています。
        </li>
        <li>
          <strong>中立的な業界メディアとしての運営実績</strong> —
          運営元の{siteConfig.organization.name}（EIC）は、電力・エネルギーの会員制総合情報サイト「新電力ネット」の運営、セミナーの主催・講演会の開催・書籍の出版・講師派遣を行う法人です（2026年7月の台湾SEETEL×JC-STARセミナーにも協力）。
        </li>
      </ul>
    </>
  );
}
