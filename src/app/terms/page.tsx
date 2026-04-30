import Link from 'next/link';
import type { Metadata } from 'next';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';
import { siteConfig } from '@/lib/site-config';

export const metadata: Metadata = {
  title: '利用規約',
  description: '蓄電所ネット（bess-net.jp）の利用規約。',
};

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main className="page">
        <div className="page-inner">
          <p className="article-breadcrumb">
            <Link href="/">トップ</Link> / 利用規約
          </p>
          <h1 className="page-title">利用規約</h1>

          <p className="page-lead">
            本利用規約（以下「本規約」）は、{siteConfig.organization.name}（以下「当法人」）が運営する蓄電所ネット（bess-net.jp、以下「本サービス」）の利用条件を定めるものです。本サービスをご利用いただく場合、本規約に同意いただいたものとみなします。
          </p>

          <section className="page-section">
            <h2>第1条（適用）</h2>
            <p>
              本規約は、本サービスの利用に関するすべての関係に適用されます。当法人が本サービス上で掲載する個別規定がある場合、当該規定も本規約の一部を構成します。
            </p>
          </section>

          <section className="page-section">
            <h2>第2条（利用登録）</h2>
            <p>
              Phase 1期間中は、利用登録なしで全コンテンツを閲覧可能です。今後、メールマガジン購読・会員機能を導入する場合は、本規約に詳細を反映します。
            </p>
          </section>

          <section className="page-section">
            <h2>第3条（禁止事項）</h2>
            <p>利用者は、本サービスの利用にあたり、以下の行為を禁止します。</p>
            <ul>
              <li>法令または公序良俗に違反する行為</li>
              <li>本サービスのコンテンツを無断で複製・再配布する行為</li>
              <li>本サービスの運営を妨害する行為</li>
              <li>他者の個人情報・著作権・その他の権利を侵害する行為</li>
              <li>不正アクセス・サーバーへの過剰負荷をかける行為</li>
              <li>商業目的でのスクレイピング・自動取得</li>
              <li>その他、当法人が不適切と判断する行為</li>
            </ul>
          </section>

          <section className="page-section">
            <h2>第4条（コンテンツの利用）</h2>
            <ul>
              <li>本サービスのコンテンツ（記事、データ、図表、写真等）の著作権は、当法人または各権利者に帰属します</li>
              <li>個人的な閲覧・引用範囲を超える複製・転載・再配布を行う場合は、事前に当法人の許諾を得てください</li>
              <li>報道・教育・学術目的での引用は、著作権法第32条の範囲内であれば、出典を明示の上ご利用いただけます</li>
              <li>本サービスのデータを商業目的で利用する場合は、別途お問い合わせください</li>
            </ul>
          </section>

          <section className="page-section">
            <h2>第5条（免責事項）</h2>
            <ul>
              <li>本サービスに掲載される情報は、執筆時点での公開情報・取材内容に基づきますが、その正確性・完全性・最新性を保証するものではありません</li>
              <li>本サービスの情報を基に行われた判断・行為について、当法人は一切の責任を負いません</li>
              <li>系統空き容量、補助金情報、市場価格などの数値は、各執行機関・電力会社の公表資料を集約したものです。最新情報は必ず一次ソースでご確認ください</li>
              <li>掲載企業・人物・プロジェクトに関する情報は、当該主体の公式情報とは独立した情報として発信しています</li>
              <li>本サービスへのアクセス障害・データ消失等によって生じた損害について、当法人は責任を負いません</li>
            </ul>
          </section>

          <section className="page-section">
            <h2>第6条（外部リンク）</h2>
            <p>
              本サービスから他のウェブサイトへリンクが設定されている場合、リンク先の内容は当法人の管理外であり、リンク先の正確性・安全性について当法人は責任を負いません。
            </p>
          </section>

          <section className="page-section">
            <h2>第7条（規約の変更）</h2>
            <p>
              当法人は、必要に応じて本規約を変更できるものとします。変更後の規約は、本サービス上で通知または公表した時点から効力を生じます。
            </p>
          </section>

          <section className="page-section">
            <h2>第8条（準拠法と管轄）</h2>
            <ul>
              <li>本規約の解釈は日本法に基づきます</li>
              <li>本サービスに関する紛争は、当法人所在地を管轄する地方裁判所を専属的合意管轄とします</li>
            </ul>
          </section>

          <section className="page-section">
            <h2>お問い合わせ窓口</h2>
            <p>
              本規約に関するお問い合わせは、
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

          <p className="page-meta">制定日：2026年4月30日</p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
