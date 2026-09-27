import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '編集方針',
  description:
    '蓄電所ネットの編集方針。事実基準・中立性・実務性・透明性・読者への敬意を5原則として、業界の意思決定に資する情報を提供します。',
  alternates: { canonical: '/editorial-policy' },
};

export default function EditorialPolicyPage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 編集方針
          </p>
          <h1 className="page-title">編集方針</h1>

          <p className="page-lead">
            蓄電所ネットでは、業界の意思決定に資する情報を提供するため、以下の編集方針に基づき記事を執筆・掲載しています。本ページは、読者の皆様に当サイトの編集姿勢をご理解いただくために公開しています。
          </p>

          <section className="page-section">
            <h2>編集の5原則</h2>
            <ul>
              <li>
                <strong>事実基準</strong>：意見と事実を明確に区別し、すべての事実情報には一次ソースまたは複数の信頼できる二次ソースを付します
              </li>
              <li>
                <strong>中立性</strong>：特定の事業者・特定の技術を恣意的に持ち上げたり貶めたりしません。比較記事では、すべての対象に同じ評価軸を適用します
              </li>
              <li>
                <strong>実務性</strong>：「読んで業務に使える」記事を書きます。具体的な数字・型式・条件・判断軸を含めます
              </li>
              <li>
                <strong>透明性</strong>：出典・更新日・執筆者を必ず明記します。誤りがあれば訂正履歴を残します
              </li>
              <li>
                <strong>読者への敬意</strong>：業界の中の方が読むことを前提に、不要な前置きを省きます。同時に、初学者向け記事では用語に必ずリンクを張ります
              </li>
            </ul>
          </section>

          <section className="page-section">
            <h2>掲載判断</h2>
            <ul>
              <li>すべての事実主張には出典を要求します。出典なき記述は掲載しません</li>
              <li>
                個別企業・人物に関する批判的記述は、複数の独立したソースに基づき、当該主体への取材・確認を試みた上で掲載します
              </li>
              <li>取材・確認に対する回答が得られない場合、その旨を記事内に明示します</li>
            </ul>
          </section>

          <section className="page-section">
            <h2>広告・PR記事の表示</h2>
            <ul>
              <li>スポンサー記事・PR記事には、記事冒頭に「PR」「Sponsored」の表示を必須とします</li>
              <li>記事の体裁を取った広告（ステマ）は禁止します</li>
              <li>商品・サービスの優良誤認・有利誤認に該当する表現は使用しません</li>
            </ul>
          </section>

          <section className="page-section">
            <h2>訂正・削除ポリシー</h2>
            <ul>
              <li>事実誤認が判明した場合、原則として24時間以内に訂正記事を出すか、オリジナル記事に訂正情報を追記します</li>
              <li>
                訂正の透明性：何を、いつ訂正したかを記事末「訂正履歴」に残します。記事を消去して書き換えることはしません
              </li>
              <li>記事の削除は原則行いません。例外的に削除する場合も「削除しました」のページを残します</li>
              <li>
                記事で名指しした主体から反論があった場合、合理的な範囲で反論記事の掲載または記事内追記を検討します
              </li>
            </ul>
          </section>

          <section className="page-section">
            <h2>読者からのご指摘</h2>
            <p>
              当サイトの記事内容に関して、事実誤認・名誉毀損・権利侵害・改善のご指摘がございましたら、
              <a
                href={siteConfig.organization.contactUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {siteConfig.organization.contactUrl}
              </a>{' '}
              までご連絡ください。確認の上、必要な対応を取らせていただきます。
            </p>
          </section>

          {/* 2026-09-27 Ck-2 実行便① ■6（裁定 R22・案A）。出典元からの要請に応じる旨を明文化する。
              時間の約束は書かない（上の「訂正・削除ポリシー」の 24 時間と /incidents の 48 時間 SOP との
              整合が未裁定のため「速やかに」に留める）。「削除」ではなく「表示を停止」の語を使うのは、
              同ポリシーの「記事の削除は原則行いません」と衝突させないため。
              ★この文言が正（/terms 第4条は本ページを参照するだけ＝二重管理にしない・#119）。 */}
          <section className="page-section">
            <h2>出典元（データ提供元）からのご要請</h2>
            <p>
              当サイトは、公的機関・業界団体等が公表するデータを、各提供元の利用条件に従い、出典と、編集・加工等を行った旨を明記したうえで掲載しています。出典元から掲載内容の修正・削除のご要請をいただいた場合は、
              <a
                href={siteConfig.organization.contactUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {siteConfig.organization.contactUrl}
              </a>{' '}
              にて承り、速やかに対応します。対応が完了するまでの間、該当箇所の表示を停止する場合があります。対応の内容と日付は、上記「訂正・削除ポリシー」に従い記事末の「訂正履歴」に残します。
            </p>
          </section>

          <section className="page-section">
            <h2>編集体制</h2>
            <p>
              本サイトは少数の編集者・執筆者により運営されています。記事ごとの執筆者・編集者を記事末に明示します。
            </p>
          </section>

          <section className="page-section">
            <h2>スポンサー・広告主との関係</h2>
            <p>
              Phase 1（〜1年間）は広告・スポンサーシップを一切受け付けていません。今後の方針については、本ページにて随時お知らせします。
            </p>
          </section>

          <p className="page-meta">初版公開：2026年4月30日</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
