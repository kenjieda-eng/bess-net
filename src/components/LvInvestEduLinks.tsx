/**
 * LvInvestEduLinks — 低圧投資家ガイドから EIC Data（data.eic-jp.org）教材クラスタへの
 * 発リンク（相互リンク・リン連携）を「さらに学ぶ」ブロックとして描画する。
 *
 * - 記事本文（microCMS body）末尾の「次に読む」の後段に、内部→外部の順で配置する想定。
 * - href は素URLで受け取り、ここで共通 UTM（EIC_EDU_UTM）を一括付与（二重付与回避・単一ソース）。
 * - 外部リンクは target=_blank ＋ rel=noopener noreferrer、文言末尾は「（EIC Data）」で外部明示。
 * - UI はセカンダリ扱い（.lv-invest-related）。件数0なら何も描画しない。
 */
import type { LvInvestExternalLink } from '@/lib/lv-invest';
import { EIC_EDU_UTM } from '@/lib/lv-invest';

export default function LvInvestEduLinks({ links }: { links?: LvInvestExternalLink[] }) {
  if (!links || links.length === 0) return null;
  return (
    <section className="article-section lv-invest-edu">
      <h3 className="related-h3">さらに学ぶ（EIC Data の教材）</h3>
      <ul className="lv-invest-related">
        {links.map((l) => (
          <li key={l.href}>
            <a href={`${l.href}${EIC_EDU_UTM}`} target="_blank" rel="noopener noreferrer">
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
