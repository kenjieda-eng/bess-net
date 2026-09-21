/**
 * src/lib/capacity-market-types.ts
 *
 * 容量市場（メインオークション約定結果）の型と表示ラベル（Nv-0b ■2・2026-09-21）
 *
 * ★なぜこのファイルがあるか
 *   以前は src/data/capacity-market-history.ts（モック）が型・ラベル・データをまとめて持っており、
 *   実データ（EIC カタログ＝OCCTO 公表値）を使う経路も、型を取るためだけにモックを import していた。
 *   そのモックは「AM/AO で 2025 標準 8,000 円採用と整合」（同 :80）と書かれ、既定値に合わせて作られていた。
 *   モックを参照ゼロにして退役させるため、型とラベルだけをモックの外へ移した。
 *
 * ★区分（新設/既設/経過措置）の欄は持たない
 *   OCCTO の約定結果 CSV は 5 列（対象実需給年度/エリア/約定価格/約定容量/約定総額）で、区分の列が無い。
 *   約定価格はエリア単位で区分非依存。一次に無い軸を型に持たせると、ダミー値を入れる箇所が生まれる
 *   （実際に page.tsx が category: 'existing' をダミーで入れていた）。
 */

export type Area =
  | 'hokkaido'
  | 'tohoku'
  | 'tokyo'
  | 'chubu'
  | 'hokuriku'
  | 'kansai'
  | 'chugoku'
  | 'shikoku'
  | 'kyushu';

/** 容量市場メインオークションの約定結果 1 件（エリア × 対象実需給年度） */
export interface CapacityMarketRecord {
  /** 対象実需給年度（例 2025 ＝ 2025 年 4 月〜2026 年 3 月）。実施年度ではない */
  fiscal_year: number;
  area: Area;
  clearing_price_yen_per_kw_year: number;
  cleared_capacity_mw: number;
  note?: string;
}

export const AREA_LABELS: Record<Area, string> = {
  hokkaido: '北海道',
  tohoku: '東北',
  tokyo: '東京',
  chubu: '中部',
  hokuriku: '北陸',
  kansai: '関西',
  chugoku: '中国',
  shikoku: '四国',
  kyushu: '九州',
};
