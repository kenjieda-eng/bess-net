import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: 'プライバシーポリシー',
  description: '蓄電所ネット（bess-net.jp）における個人情報の取扱いについて。',
};

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / プライバシーポリシー
          </p>
          <h1 className="page-title">プライバシーポリシー</h1>

          <p className="page-lead">
            {siteConfig.organization.name}（以下「当法人」）は、蓄電所ネット（bess-net.jp、以下「本サービス」）の運営に際し、お客様のプライバシーを尊重し、個人情報の保護に努めます。本プライバシーポリシーは、本サービスにおける個人情報の取扱いについて定めるものです。
          </p>

          <section className="page-section">
            <h2>1. 取得する個人情報</h2>
            <p>当法人は、以下の場合に個人情報を取得します。</p>
            <ul>
              <li>お問い合わせフォームから送信された情報（氏名、メールアドレス、所属、お問い合わせ内容等）</li>
              <li>メールマガジン購読登録時にご提供いただいた情報（メールアドレス等）</li>
              <li>会員登録時にご提供いただいた情報（Phase 2以降の機能。導入時点で本ポリシーに反映）</li>
              <li>本サービスのアクセスログ（IPアドレス、ユーザーエージェント、参照元URL等）</li>
              <li>Cookie・類似技術により取得する情報（後述）</li>
            </ul>
          </section>

          <section className="page-section">
            <h2>2. 個人情報の利用目的</h2>
            <p>取得した個人情報は、以下の目的で利用します。</p>
            <ul>
              <li>お問い合わせへの返答</li>
              <li>メールマガジン・お知らせの配信</li>
              <li>本サービスの提供・改善</li>
              <li>統計的データの作成（個人を特定できない形式）</li>
              <li>法令に基づく対応</li>
            </ul>
          </section>

          <section className="page-section">
            <h2>3. 個人情報の第三者提供</h2>
            <p>当法人は、以下の場合を除き、お客様の同意なく個人情報を第三者に提供しません。</p>
            <ul>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要がある場合</li>
              <li>公衆衛生の向上または児童の健全な育成のために特に必要がある場合</li>
              <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
            </ul>
          </section>

          <section className="page-section">
            <h2>4. Cookie・解析ツールの利用</h2>
            <p>
              本サービスでは、サービス改善および利用状況の把握のため、以下のツールを利用してCookie・類似技術を使用します。
            </p>
            <ul>
              <li>Google Analytics 4：アクセス解析（プライバシー設定に応じてオプトアウト可能）</li>
              <li>Microsoft Clarity：ユーザー体験改善のための行動分析</li>
              <li>Cookieによるセッション管理（必要最小限）</li>
            </ul>
            <p>
              Cookieの使用を希望されない場合は、ブラウザ設定でCookieを無効化していただくことができます。なお、その場合、本サービスの一部機能がご利用いただけない場合があります。
            </p>
          </section>

          <section className="page-section">
            <h2>5. アクセスログ</h2>
            <p>
              当法人は、本サービスへのアクセスに際し、IPアドレス、ユーザーエージェント、参照元URL、アクセス日時等の情報を自動的にサーバーに記録します。これらは個人を特定する目的では使用せず、不正アクセス防止やサービス改善の目的に限定して利用します。
            </p>
          </section>

          <section className="page-section">
            <h2>6. 個人情報の管理</h2>
            <p>
              当法人は、お客様の個人情報を正確かつ最新の状態に保ち、不正アクセス・紛失・破壊・改ざん及び漏洩などを防止するため、適切な安全管理措置を講じます。
            </p>
          </section>

          <section className="page-section">
            <h2>7. 個人情報の開示・訂正・削除</h2>
            <p>
              お客様は、当法人が保有するご自身の個人情報について、開示・訂正・削除・利用停止を求めることができます。下記お問い合わせ窓口までご連絡ください。
            </p>
          </section>

          <section className="page-section">
            <h2>8. お問い合わせ窓口</h2>
            <p>プライバシーポリシーに関するお問い合わせは、以下までご連絡ください。</p>
            <dl className="info-list">
              <dt>運営</dt>
              <dd>{siteConfig.organization.name}</dd>
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
            <h2>9. プライバシーポリシーの変更</h2>
            <p>
              当法人は、必要に応じて本プライバシーポリシーを変更することがあります。変更後のプライバシーポリシーは、本サービス上で通知または公表した時点から効力を生じるものとします。
            </p>
          </section>

          <p className="page-meta">制定日：2026年4月30日</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
