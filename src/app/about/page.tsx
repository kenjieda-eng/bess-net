import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '蓄電所ネットについて',
  description:
    '蓄電所ネット（bess-net.jp）は、系統用蓄電池および低圧リソース事業に関わるすべての方に向けた、日本市場特化の情報ポータルです。',
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 蓄電所ネットについて
          </p>
          <h1 className="page-title">蓄電所ネットについて</h1>

          <section className="page-section">
            <h2>蓄電所ネットとは</h2>
            <p>
              蓄電所ネット（bess-net.jp）は、系統用蓄電池および低圧リソース事業に関わるすべての方に向けた、日本市場特化の情報ポータルです。
            </p>
            <p>
              業界ニュース、プロジェクトデータベース、市場制度解説、補助金カレンダー、変電所別 系統空き容量、事業者一覧、用語集——蓄電所事業の実務に必要な情報を一箇所に集約することを目指しています。
            </p>
          </section>

          <section className="page-section">
            <h2>運営の理念</h2>
            <ul>
              <li>
                <strong>事実基準</strong>：意見と事実を明確に区別し、すべての事実情報には出典を付します
              </li>
              <li>
                <strong>中立性</strong>：特定の事業者・特定の技術を恣意的に持ち上げたり貶めたりしません
              </li>
              <li>
                <strong>実務性</strong>：「読んで業務に使える」情報を最優先します
              </li>
              <li>
                <strong>透明性</strong>：出典・更新日・執筆者を明示し、誤りがあれば訂正履歴を残します
              </li>
              <li>
                <strong>読者への敬意</strong>：業界の中の方が読むことを前提に、不要な前置きを省きます
              </li>
            </ul>
          </section>

          <section className="page-section">
            <h2>提供するコンテンツ</h2>
            <ul>
              <li>
                <strong>解説</strong>：容量市場・需給調整市場・JEPX・FIP・低圧リソースなどの市場制度や、技術・実務の体系的な解説（55本以上を継続公開中）
              </li>
              <li>
                <strong>用語集</strong>：蓄電所事業に関わる業界用語を解説（500語超を収録）
              </li>
              <li>
                <strong>ニュース</strong>：業界の最新動向、新規連系・補助金採択・制度改正・事故報告・オークション結果・市場統計等を継続的に発信
              </li>
              <li>
                <strong>プロジェクトデータベース</strong>：国内の蓄電所プロジェクトを公開情報ベースで一元管理（順次拡充中）
              </li>
              <li>
                <strong>補助金カレンダー</strong>：経産省・エネ庁・NEDO・SII・自治体の蓄電池関連補助金を継続トラック（順次拡充中）
              </li>
              <li>
                <strong>変電所別 系統空き容量</strong>：10電力会社が公表する空き容量情報を集約（公開準備中・Sprint 2）
              </li>
              <li>
                <strong>事業者・サービス一覧</strong>：20カテゴリ・約400社の事業者を体系的に掲載（公開準備中）
              </li>
            </ul>
          </section>

          <section className="page-section">
            <h2>対象とする読者</h2>
            <p>系統用蓄電池および低圧リソース事業に関わるすべての方を対象としています。</p>
            <ul>
              <li>開発事業者・IPP・新規参入企業</li>
              <li>EPC・O&amp;M・遠隔監視サービス事業者</li>
              <li>アグリゲーター・リソースアグリゲーター</li>
              <li>電池メーカー・PCSメーカー</li>
              <li>投資家・ファンド・金融機関</li>
              <li>電力会社（一般送配電・小売）</li>
              <li>自治体・行政・政策担当者</li>
              <li>保険会社・法務・コンサルタント</li>
              <li>その他、蓄電所事業に関心をお持ちのすべての方</li>
            </ul>
          </section>

          <section className="page-section">
            <h2>運営者情報</h2>
            <dl className="info-list">
              <dt>運営</dt>
              <dd>
                {siteConfig.organization.name}（
                <a
                  href={siteConfig.organization.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {siteConfig.organization.url}
                </a>
                ）
              </dd>
              <dt>役員</dt>
              <dd>{siteConfig.organization.representative}</dd>
              <dt>住所</dt>
              <dd>{siteConfig.organization.address}</dd>
              <dt>お問い合わせ</dt>
              <dd>
                <a
                  href={siteConfig.organization.contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {siteConfig.organization.contactUrl}
                </a>
              </dd>
            </dl>
          </section>

          <section className="page-section">
            <h2>お問い合わせ・取材ご依頼</h2>
            <p>
              業界関係者からの情報提供・取材ご協力・サイトへの情報掲載依頼を歓迎します。記事化を保証するものではありませんが、編集部にて拝見の上、適切に検討いたします。
            </p>
            <p>
              <a
                href={siteConfig.organization.contactUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {siteConfig.organization.contactUrl}
              </a>{' '}
              までご連絡ください。
            </p>
          </section>

          <section className="page-section">
            <h2>訂正・削除のご依頼</h2>
            <p>
              当サイトの記事に関して、事実誤認・名誉毀損・権利侵害等のご指摘がございましたら、上記お問い合わせフォームよりご連絡ください。確認の上、必要な対応を取らせていただきます。
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
