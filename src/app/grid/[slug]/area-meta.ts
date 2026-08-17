// area-meta.ts
// データ基準日は src/lib/grid-data-date.ts が microCMS 実値（precompute の area_dates）から供給する。
// ハードコードは 2026-08-08 に撤去（9/10エリアで実値とズレていたため）。
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
    sourceFormat: 'CSV',
    description:
      '北陸エリア（北陸電力送配電）の変電所別系統空き容量・連系条件・出力制御情報を、富山・石川・福井の3県＋基幹系について一元化。予想潮流・空容量（変圧器）CSVから抽出。',
  },
  shikoku: {
    slug: 'shikoku',
    areaJp: '四国',
    operator: '四国電力送配電',
    landingUrl: 'https://www.yonden.co.jp/nw/line_access/data.html',
    description:
      '四国エリア（四国電力送配電）の変電所別系統空き容量・連系条件・出力制御情報を、香川・愛媛・徳島・高知の4県＋基幹系について一元化。',
  },
  // ===== Phase 2B 追加 =====
  hokkaido: {
    slug: 'hokkaido',
    areaJp: '北海道',
    operator: '北海道電力ネットワーク',
    landingUrl:
      'https://www.hepco.co.jp/network/con_service/public_document/bid_info.html',
    // 裁定4(2026-08-17): PDF抽出 → 公表CSV(ZIP)へソース形式を変更。基幹（187kV以上）35件を新規収録。
    sourceFormat: 'CSV',
    description:
      '北海道エリア（北海道電力ネットワーク）の変電所別系統空き容量・連系条件・出力制御情報を、基幹系（187kV以上）＋110kV以下24系統の公表CSVから抽出・統合。送電線情報は将来対応。',
  },
  // ===== Phase 2-C-1 追加 =====
  chubu: {
    slug: 'chubu',
    areaJp: '中部',
    operator: '中部電力パワーグリッド',
    landingUrl: 'https://gridmap.powergrid.chuden.co.jp/',
    description:
      '中部エリア（中部電力パワーグリッド）の変電所別系統空き容量・連系条件・出力制御情報を、愛知・静岡・三重・岐阜・長野の5県＋基幹系について一元化。GeoJSON 由来の緯度経度を約97.7%の変電所に付与（地図表示の基盤）。',
  },
  // ===== Phase 2A 追加 =====
  kansai: {
    slug: 'kansai',
    areaJp: '関西',
    operator: '関西電力送配電',
    landingUrl:
      'https://www.kansai-td.co.jp/consignment/disclosure/distribution-equipment/',
    description:
      '関西エリア（関西電力送配電）の変電所別系統空き容量・連系条件・出力制御情報を、154kV以上の基幹系統と154kV以下のローカル系統について一元化。',
  },
  chugoku: {
    slug: 'chugoku',
    areaJp: '中国',
    operator: '中国電力ネットワーク',
    landingUrl:
      'https://www.energia.co.jp/nw/service/retailer/keitou/access/',
    description:
      '中国エリア（中国電力ネットワーク）の変電所別系統空き容量・連系条件・出力制御情報を、鳥取・島根・岡山・広島・山口の5県＋基幹系について一元化。',
  },
  okinawa: {
    slug: 'okinawa',
    areaJp: '沖縄',
    operator: '沖縄電力',
    landingUrl:
      'https://www.okiden.co.jp/business-support/service/rule/plan/index.html',
    description:
      '沖縄エリア（沖縄電力）の変電所別系統空き容量・連系条件・出力制御情報を、本島132/66kV系・本島22/13.8kV系・離島の各系統について一元化。',
  },
  // ===== Phase 3 追加 =====
  kyushu: {
    slug: 'kyushu',
    areaJp: '九州',
    operator: '九州電力送配電',
    landingUrl: 'https://www.kyuden.co.jp/td/service/wheeling/disclosure.html',
    description:
      '九州エリア（九州電力送配電）の変電所別系統空き容量・連系条件・出力制御情報を、福岡・佐賀・長崎・大分・熊本・宮崎・鹿児島の7県＋離島について一元化。31地区の変圧器CSV ZIPを集約。',
  },
  // ===== Phase 2c 追加（東京電力PG、10社目）=====
  tokyo: {
    slug: 'tokyo',
    areaJp: '東京',
    operator: '東京電力パワーグリッド',
    landingUrl: 'https://www.tepco.co.jp/pg/consignment/system/',
    sourceFormat: 'CSV',
    description:
      '東京エリア（東京電力パワーグリッド）の変電所別系統空き容量・連系条件・出力制御情報を、東京・神奈川・埼玉・千葉・茨城・群馬・栃木・山梨＋静岡（富士川以東）・福島/長野/新潟（一部）＋基幹系の13都県について一元化。TEPCO公表の予想潮流等CSV（2026年7月10日公表）から抽出。空容量は逆潮流側、緯度経度・地図表示は今後対応。',
  },
};

// 日本語エリア名 → エリアスラグ
export const AREA_JP_TO_SLUG: Record<string, string> = {
  東北: 'tohoku',
  北陸: 'hokuriku',
  四国: 'shikoku',
  関西: 'kansai',
  中国: 'chugoku',
  沖縄: 'okinawa',
  北海道: 'hokkaido',
  中部: 'chubu',
  九州: 'kyushu',
  東京: 'tokyo',
};
