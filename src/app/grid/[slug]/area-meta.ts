// area-meta.ts
// /grid/[slug] のエリアスラグ ↔ 表示名マップ。
// page.tsx は default 以外のオブジェクト export を許さないため別ファイルに分離。
import type { AreaMeta } from './AreaPage';

export const AREA_META: Record<string, AreaMeta> = {
  tohoku: {
    slug: 'tohoku',
    areaJp: '東北',
    operator: '東北電力ネットワーク',
    landingUrl: 'https://nw.tohoku-epco.co.jp/consignment/system/announcement/',
    description:
      '東北エリア（東北電力ネットワーク）の変電所別系統空き容量・連系条件・出力制御情報を、青森・岩手・秋田・宮城・山形・福島・新潟の7県＋基幹系について一元化。',
  },
  hokuriku: {
    slug: 'hokuriku',
    areaJp: '北陸',
    operator: '北陸電力送配電',
    landingUrl: 'https://www.rikuden.co.jp/nw_notification/U_154seiyaku.html',
    description:
      '北陸エリア（北陸電力送配電）の変電所別系統空き容量・連系条件・出力制御情報を、富山・石川・福井の3県＋基幹系について一元化。',
  },
  shikoku: {
    slug: 'shikoku',
    areaJp: '四国',
    operator: '四国電力送配電',
    landingUrl: 'https://www.yonden.co.jp/nw/line_access/data.html',
    description:
      '四国エリア（四国電力送配電）の変電所別系統空き容量・連系条件・出力制御情報を、香川・愛媛・徳島・高知の4県＋基幹系について一元化。',
  },
};

// 日本語エリア名 → エリアスラグ
export const AREA_JP_TO_SLUG: Record<string, string> = {
  東北: 'tohoku',
  北陸: 'hokuriku',
  四国: 'shikoku',
};
