/**
 * LvInvestTrustBlock — 低圧投資家ガイド共通トラストブロック（W1 Stage1・2026-07-20）
 * StartTrustBlock 型のページ内共用ブロック。文言はEDAさん承認済み・原文どおり（誇張ゼロ・投資助言でない旨を明示）。
 * ページ末尾に配置し、⑤「無料で相談したい」カードのアンカー先（id="invest-trust"）にもなる。
 */
export default function LvInvestTrustBlock() {
  return (
    <section
      id="invest-trust"
      style={{
        margin: '32px 0 0',
        padding: 20,
        background: 'var(--color-bg)',
        border: '1px solid var(--color-border)',
        borderRadius: 8,
        scrollMarginTop: 80,
      }}
    >
      <h2 style={{ fontSize: 17, fontWeight: 700, marginTop: 0, marginBottom: 10 }}>安心してお読みいただくために</h2>
      <ol style={{ paddingLeft: 20, lineHeight: 1.9, margin: 0, fontSize: 15 }}>
        <li>本ガイドは一般的な情報提供であり、特定の案件や販売会社をおすすめするものではありません。投資助言ではなく、最終的なご判断はご自身でお願いします。</li>
        <li>「今は買わない」という結論も選択肢です。ご相談いただいても、何かを購入する義務は一切ありません。</li>
        <li>無料相談では、分からないところを一緒に整理します。営業電話はいたしません。</li>
      </ol>
    </section>
  );
}
