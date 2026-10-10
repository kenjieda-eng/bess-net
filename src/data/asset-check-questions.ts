/**
 * src/data/asset-check-questions.ts — /tools/asset-check（蓄電所 評価軸セルフチェック）の設問定義
 *
 * ★自動生成（scripts/gen-asset-check-questions.ts）。手で編集しない。
 *   出どころ: reports/tool-asset-check-questions-2026-10-10.data.json（T2 設問研究便・一次は 2026-10-10 に取り直して照合済み）
 *   直すときは data.json か生成スクリプトの対応表を直し、`npx tsx scripts/gen-asset-check-questions.ts` で再生成する。
 *   検査 `npm run verify:asset-check` が、この出力と data.json からの再生成の一致を確かめる。
 */

export type AssetCheckAxisKey = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H';

export type AssetCheckPrimary = {
  /** 一次の名称（条・節まで） */
  name: string;
  issuer: string;
  /** 読み手が開けるリンク（当サイトの定義は当サイトの公開ページ） */
  href: string;
  /** 該当箇所（当サイトの定義は空） */
  where: string;
  /** 一次の逐語（当サイトの定義は null） */
  quote: string | null;
  /** 主たる裏づけが当サイトの定義（当サイトの想定）か */
  siteDefinition: boolean;
  /** 出典欄に「」で出す資料名（当サイトの定義は null） */
  docName: string | null;
};

export type AssetCheckQuestion = {
  id: string;
  axis: AssetCheckAxisKey;
  question: string;
  /** 「該当しない」を選べるか（当てはまる条件がある 19 問） */
  allowsNotApplicable: boolean;
  appliesWhen: string;
  answerNote: string | null;
  why: string;
  nextAction: string;
  /** 主の一次の種類（法令・系統と市場の運営機関の規程と様式・当サイトの定義 など） */
  strength: string;
  primary: AssetCheckPrimary;
  others: { name: string; href: string }[];
};

export const ASSET_CHECK_AXES: { key: AssetCheckAxisKey; label: string }[] = [
  {
    "key": "A",
    "label": "設備"
  },
  {
    "key": "B",
    "label": "施工・EPC"
  },
  {
    "key": "C",
    "label": "立地・災害"
  },
  {
    "key": "D",
    "label": "系統"
  },
  {
    "key": "E",
    "label": "運転実績"
  },
  {
    "key": "F",
    "label": "契約"
  },
  {
    "key": "G",
    "label": "保険"
  },
  {
    "key": "H",
    "label": "許認可・届出"
  }
];

export const ASSET_CHECK_QUESTIONS: AssetCheckQuestion[] = [
  {
    "id": "A1",
    "axis": "A",
    "question": "セル・モジュール・電池システム・蓄電システム・BMS（電池管理システム）・EMS（エネルギー管理システム）・PCS（パワーコンディショナ）の部位ごとに、メーカー名と型番（型番の無い部位はその旨）を書いた一覧が手元にある",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト",
    "answerNote": null,
    "why": "長期脱炭素電源オークションの様式４（蓄電池に係る事業計画）は、セルから PCS までの部位ごとにメーカー名と型番を書かせ、登録時の内容が変わる場合は落札後に計画を出し直して審査に合格するよう求めている。当サイトの資産台帳も、セルと PCS のメーカー・型式を売却時に聞かれる項目に挙げている（並びは当サイトの想定）。",
    "nextAction": "EPC かメーカーに、部位ごとのメーカー名と型番の一覧（様式４の「２．導入予定の蓄電池のメーカー・型番」と同じ項目立て）を求める",
    "strength": "系統・市場の運営機関の規程・様式",
    "primary": {
      "name": "容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）様式４ 蓄電池に係る事業計画",
      "issuer": "電力広域的運営推進機関（OCCTO）",
      "href": "https://www.occto.or.jp/assets/260902_boshuyoukou_long_2026.pdf",
      "where": "PDF 59 頁・様式４ 冒頭の注記（同頁の「２．導入予定の蓄電池のメーカー・型番」から PDF 61 頁まで、セル・モジュール・電池システム・蓄電システム・BMS・EMS・PCS のメーカー名・型番欄）",
      "quote": "電源等情報登録時に提出した以下の２～９の内容に変更が生じた場合には、落札後に再度本計画を提出し、以下の審査に合格しない限り変更は認められない。",
      "siteDefinition": false,
      "docName": "容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）"
    },
    "others": [
      {
        "name": "同 様式４ ２．の見出し",
        "href": "https://www.occto.or.jp/assets/260902_boshuyoukou_long_2026.pdf"
      },
      {
        "name": "同 様式４ ２．（型番が無い場合）",
        "href": "https://www.occto.or.jp/assets/260902_boshuyoukou_long_2026.pdf"
      }
    ]
  },
  {
    "id": "A2",
    "axis": "A",
    "question": "BMS（電池管理システム）・EMS（エネルギー管理システム）・PCS（パワーコンディショナ）など制御システムの主要な機器について、JC-STAR（IoT 製品のセキュリティ適合ラベル制度）★1 の適合ラベルの登録番号と、機器と取得内容の対応を示すシステム構成図が手元にある",
    "allowsNotApplicable": true,
    "appliesWhen": "長期脱炭素電源オークションに応札した蓄電所、または SII の系統用蓄電システム等導入支援事業（令和7年度補正）の補助を受ける蓄電所。それ以外の蓄電所については、JC-STAR の書類を出すよう定めた一次は見つかっていない",
    "answerNote": null,
    "why": "長期脱炭素電源オークションの様式４ ６．と SII 補助金の公募要領 1-6 ⑨ は、BMS・PCS・EMS などの JC-STAR ★1 の適合ラベルと、機器と取得内容の整合を示すシステム構成図を出すよう求めている。様式４ ２．にも BMS・EMS・PCS ごとに「JC-STAR 適合ラベル登録番号」の欄がある。",
    "nextAction": "BMS・EMS・PCS の各メーカーから JC-STAR ★1 の適合ラベルの登録番号を受け取り、機器と取得内容の対応を示すシステム構成図を EPC に作ってもらう",
    "strength": "系統・市場の運営機関の規程・様式",
    "primary": {
      "name": "容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）様式４ ６．セキュリティ対策 ①",
      "issuer": "電力広域的運営推進機関（OCCTO）",
      "href": "https://www.occto.or.jp/assets/260902_boshuyoukou_long_2026.pdf",
      "where": "PDF 62 頁・様式４ ６．セキュリティ対策 ①（②は IP 通信機能の無い機器の扱い、③はシステム構成図。①〜③は添付資料７）。様式４ ２．の BMS・EMS・PCS 欄は PDF 60〜61 頁",
      "quote": "導入する蓄電システムが採用するすべての制御システムのセキュリティに関する主要な構成製品（BMS, PCS, EMS 等※1）について、「セキュリティ要件適合評価及びラベリング制度（JC-STAR 制度）」における★１（レベル１）を取得していることを示す適合ラベル。",
      "siteDefinition": false,
      "docName": "容量市場 長期脱炭素電源オークション募集要綱（応札年度：2026年度）"
    },
    "others": [
      {
        "name": "令和７年度補正 系統用蓄電システム等導入支援事業 公募要領（2026年9月）1-6 補助対象設備 ⑨ 1.",
        "href": "https://sii.or.jp/chikudenchi07r/uploads/R7r_kess_kouboyouryou.pdf"
      },
      {
        "name": "同 ⑨ 3.（システム構成図）",
        "href": "https://sii.or.jp/chikudenchi07r/uploads/R7r_kess_kouboyouryou.pdf"
      },
      {
        "name": "長期脱炭素電源オークション募集要綱 様式４ ２．（BMS・EMS・PCS 欄）",
        "href": "https://www.occto.or.jp/assets/260902_boshuyoukou_long_2026.pdf"
      },
      {
        "name": "セキュリティ要件適合評価及びラベリング制度（JC-STAR）（IPA）",
        "href": "https://www.ipa.go.jp/security/jc-star/index.html"
      },
      {
        "name": "電気設備に関する技術基準を定める省令 第15条の2（サイバーセキュリティの確保）",
        "href": "https://laws.e-gov.go.jp/law/409M50000400052"
      },
      {
        "name": "電気設備の技術基準の解釈 第37条の2 第二号",
        "href": "https://www.meti.go.jp/policy/safety_security/industrial_safety/law/files/dengikaishaku.pdf"
      }
    ]
  },
  {
    "id": "A3",
    "axis": "A",
    "question": "容量保証の有無を確かめ、ある場合は保証書（保証容量の割合・保証期間と、SOH（電池の健全度）の測り方やサイクル数の上限などの条件が書かれたもの）が手元にある",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト",
    "answerNote": "容量保証が無いと確かめた場合も「はい」（容量保証が無いこと自体は評価しない）",
    "why": "当サイトの資産台帳は、容量保証の割合・期間・条件を、売却時に聞かれる項目に挙げている（並びは当サイトの想定）。SII の系統用蓄電システム補助金（令和7年度補正）も、補助を受ける事業者に、想定使用期間・保証期間等を通じた容量劣化データ（カタログ値）を実績報告までに出すよう求めている。",
    "nextAction": "メーカー（または EPC）に容量保証の保証書の写しを求め、保証容量の割合・期間・条件を書き出す",
    "strength": "当サイトの定義",
    "primary": {
      "name": "当サイト 資産台帳テンプレートの定義 02_設備（容量保証の条件の列）",
      "issuer": "蓄電所ネット（当サイト）",
      "href": "/tools/asset-ledger",
      "where": "",
      "quote": null,
      "siteDefinition": true,
      "docName": null
    },
    "others": [
      {
        "name": "令和７年度補正 系統用蓄電システム等導入支援事業 公募要領（2026年9月）1-5 補助対象事業者 13）",
        "href": "https://sii.or.jp/chikudenchi07r/uploads/R7r_kess_kouboyouryou.pdf"
      },
      {
        "name": "SII 公募要領（令和７年度補正 系統用蓄電システム等導入支援事業）1-5 13）の柱書",
        "href": "https://sii.or.jp/chikudenchi07r/uploads/R7r_kess_kouboyouryou.pdf"
      },
      {
        "name": "長期脱炭素電源オークション募集要綱 期待容量等算定諸元一覧の記載要領 2.",
        "href": "https://www.occto.or.jp/assets/260902_boshuyoukou_long_2026.pdf"
      }
    ]
  },
  {
    "id": "A5",
    "axis": "A",
    "question": "PCS（パワーコンディショナ）・空調機・送風機・空気圧縮機など騒音源ごとの出力（kW）と騒音値（dB と測定距離）が載った機器仕様書か、騒音の測定記録が手元にある",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト",
    "answerNote": null,
    "why": "電技省令第19条第11項は、騒音規制法の特定施設（原動機の定格出力 7.5kW 以上の空気圧縮機・送風機など）を設けた蓄電所が指定地域内にある場合、規制基準（敷地の境界線での騒音の許容限度）に適合するよう求めている。SII の系統用蓄電システム補助金も、交付申請時に出力（kW）・騒音（dB）を示した機器仕様書を出すよう求めている。",
    "nextAction": "EPC・メーカーに、騒音源ごとの出力（kW）と騒音値（dB・測定距離）が載った機器仕様書を求める（運転後に測った記録があればそれも揃える）",
    "strength": "法令",
    "primary": {
      "name": "令和７年度補正 系統用蓄電システム等導入支援事業 公募要領（2026年9月）1-5 補助対象事業者 9）",
      "issuer": "環境共創イニシアチブ（SII）",
      "href": "https://sii.or.jp/chikudenchi07r/uploads/R7r_kess_kouboyouryou.pdf",
      "where": "PDF 11 頁（印刷頁 10）・１－５．補助対象事業者 ９）の注記（審査項目 5-③ 騒音対策は PDF 40 頁）",
      "quote": "※交付申請時には、出力（kW）・騒音（dB）等の騒音規制に係る項目が示された機器仕様書を提出すること（特に空気圧縮機・送風機） 。",
      "siteDefinition": false,
      "docName": "令和７年度補正 系統用蓄電システム等導入支援事業 公募要領"
    },
    "others": [
      {
        "name": "電気設備に関する技術基準を定める省令 第19条第11項",
        "href": "https://laws.e-gov.go.jp/law/409M50000400052"
      },
      {
        "name": "騒音規制法施行令 別表第一 二",
        "href": "https://laws.e-gov.go.jp/law/343CO0000000324"
      },
      {
        "name": "騒音規制法 第2条第2項（規制基準の定義）",
        "href": "https://laws.e-gov.go.jp/law/343AC0000000098"
      },
      {
        "name": "騒音規制法 第5条",
        "href": "https://laws.e-gov.go.jp/law/343AC0000000098"
      }
    ]
  },
  {
    "id": "A6",
    "axis": "A",
    "question": "蓄電池のコンテナ・建屋が建築基準法上の建築物に当たるかを確かめた記録（特定行政庁・指定確認検査機関とのやり取り、建築物に当たる場合は確認済証）が手元にある",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト",
    "answerNote": null,
    "why": "国交省の技術的助言（国住指第4846号）は、土地に自立して設置する蓄電池専用のコンテナで、内部が機能に必要な最小限の空間だけ、稼働時は無人で、機器の重大な障害発生時等を除いて内部に人が立ち入らないものを建築物に当たらないとし、複数積み重ねる場合は建築物として扱うとしている。建築物に当たる場合、規模や区域によっては、工事の前に建築基準法第6条の確認を受けて確認済証の交付を受ける。",
    "nextAction": "国住指第4846号の条件（土地に自立・内部は必要最小限の空間・稼働時は無人・重大な障害時等を除き人が立ち入らない・積み重ねない）と設置の状況を照らし、所在地の特定行政庁か指定確認検査機関に扱いを確かめて記録を残す",
    "strength": "官公庁の資料",
    "primary": {
      "name": "蓄電池を収納する専用コンテナに係る建築基準法の取扱いについて（技術的助言）国住指第4846号",
      "issuer": "国土交通省住宅局建築指導課長",
      "href": "https://www.mlit.go.jp/common/000993022.pdf",
      "where": "記（本文 2 段落目のただし書き）",
      "quote": "ただし、複数積み重ねる場合にあっては、貯蔵槽その他これらに類する施設ではなく、建築物に該当するものとして取り扱うこととする。",
      "siteDefinition": false,
      "docName": "蓄電池を収納する専用コンテナに係る建築基準法の取扱いについて（技術的助言）"
    },
    "others": [
      {
        "name": "同 記（本文 1 段落目）",
        "href": "https://www.mlit.go.jp/common/000993022.pdf"
      },
      {
        "name": "建築基準法 第2条第1号（建築物の定義）",
        "href": "https://laws.e-gov.go.jp/law/325AC0000000201"
      },
      {
        "name": "建築基準法 第6条第4項（確認済証の交付）",
        "href": "https://laws.e-gov.go.jp/law/325AC0000000201"
      }
    ]
  },
  {
    "id": "B3",
    "axis": "B",
    "question": "施工した EPC（設計・調達・建設を請け負った元請）が建設業の許可を受けていることを、許可番号・許可業種（電気工事業など）・有効期間で確かめた",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト",
    "answerNote": null,
    "why": "建設業法第3条は、軽微な建設工事（1 件の請負代金 500 万円未満など）だけを請け負う者を除いて建設業の許可を求めている。許可は建設工事の種類ごとに与えられ、5 年ごとに更新しないと効力を失う。国交省の業種区分は、電気工事を「発電設備、変電設備、送配電設備、構内電気設備等を設置する工事」としている。",
    "nextAction": "国交省の建設業者・宅建業者等企業情報検索システム（https://etsuran2.mlit.go.jp/TAKKEN/）で EPC の許可番号・許可業種・有効期間を確かめ、結果を控える",
    "strength": "法令",
    "primary": {
      "name": "建設業法 第3条第2項",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/324AC0000000100",
      "where": "第三条第二項",
      "quote": "前項の許可は、別表第一の上欄に掲げる建設工事の種類ごとに、それぞれ同表の下欄に掲げる建設業に分けて与えるものとする。",
      "siteDefinition": false,
      "docName": "建設業法"
    },
    "others": [
      {
        "name": "建設業法 第3条第1項ただし書",
        "href": "https://laws.e-gov.go.jp/law/324AC0000000100"
      },
      {
        "name": "建設業法施行令 第1条の2第1項",
        "href": "https://laws.e-gov.go.jp/law/331CO0000000273"
      },
      {
        "name": "建設業法 第3条第3項（許可の有効期間）",
        "href": "https://laws.e-gov.go.jp/law/324AC0000000100"
      },
      {
        "name": "業種区分、建設工事の内容、例示、区分の考え方(H29.11.10改正）（国土交通省）",
        "href": "https://www.mlit.go.jp/common/001209751.pdf"
      },
      {
        "name": "建設業者・宅建業者等企業情報検索システム（国土交通省）",
        "href": "https://etsuran2.mlit.go.jp/TAKKEN/"
      }
    ]
  },
  {
    "id": "B4",
    "axis": "B",
    "question": "EPC 契約書（変更契約を含む）の写しが手元にあり、完成を確かめる検査の時期・方法と引渡しの時期の定めを確かめた",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト",
    "answerNote": null,
    "why": "建設業法第19条第1項は、建設工事の請負契約の当事者に、注文者が完成を確かめる検査の時期・方法と引渡しの時期（第11号）などを書面に書き、署名又は記名押印して相互に交付するよう求めている。契約の内容を変えるときも、変更の内容を書面で交付する（同条第2項）。",
    "nextAction": "発注者（設置者）の保管分から、EPC 契約書と変更契約の書面を集める",
    "strength": "法令",
    "primary": {
      "name": "建設業法 第19条第1項第11号",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/324AC0000000100",
      "where": "第十九条第一項第十一号",
      "quote": "注文者が工事の全部又は一部の完成を確認するための検査の時期及び方法並びに引渡しの時期",
      "siteDefinition": false,
      "docName": "建設業法"
    },
    "others": [
      {
        "name": "建設業法 第19条第1項 柱書",
        "href": "https://laws.e-gov.go.jp/law/324AC0000000100"
      },
      {
        "name": "建設業法 第19条第2項（変更の書面）",
        "href": "https://laws.e-gov.go.jp/law/324AC0000000100"
      }
    ]
  },
  {
    "id": "B5",
    "axis": "B",
    "question": "引渡し前の検査（EPC 契約で定めた完成の検査）の記録と試験成績書の写しが手元にあり、書類名・発行者・保管場所を一覧にしている",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（出力1万kW以上又は容量8万kWh以上の蓄電所の使用前自主検査の記録は、許認可の軸の H5 で問う）",
    "answerNote": null,
    "why": "当サイトの資産台帳は書類の種別に「試験成績書」を置き、売却時に聞かれる項目に「許認可・契約書類の所在」を挙げている（並びは当サイトの想定）。当サイトの低圧蓄電所の売買契約チェックシートも、図面・検査記録・保証書の引渡しが義務になっているかを確認項目にしている。",
    "nextAction": "EPC に引渡し前の検査の記録と試験成績書の写しを求め、書類名・発行者・日付・保管場所を一覧にする",
    "strength": "当サイトの定義",
    "primary": {
      "name": "当サイト 資産台帳テンプレートの定義（06_書類 の種別）",
      "issuer": "蓄電所ネット（当サイト）",
      "href": "/tools/asset-ledger",
      "where": "",
      "quote": null,
      "siteDefinition": true,
      "docName": null
    },
    "others": [
      {
        "name": "建設業法 第19条第1項第11号（検査の定め）",
        "href": "https://laws.e-gov.go.jp/law/324AC0000000100"
      }
    ]
  },
  {
    "id": "B6",
    "axis": "B",
    "question": "工事の完成図（いわゆる竣工図。工事の目的物が完成したときの状況を表した図）の写しが手元にある",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（建設業法の保存義務がかかるのは、元請が建設業の許可を受けた建設業者で、完成図を作成または受領した場合）",
    "answerNote": null,
    "why": "建設業法施行規則は、発注者から直接請け負った建設業者が施工上の必要に応じて作成した完成図、または発注者から受け取った完成図を、営業に関する図書として保存すると定めている（第26条第5項第1号）。保存期間は目的物の引渡しから10年間（第28条第2項）。発注者に渡す義務は条文に無い。",
    "nextAction": "元請（EPC）に完成図の写しを求める（元請が建設業者で完成図を作成・受領していれば、引渡しから10年間の保存義務がある＝建設業法施行規則第28条第2項）",
    "strength": "法令",
    "primary": {
      "name": "建設業法施行規則 第26条第5項第1号",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/324M50004000014",
      "where": "第二十六条第五項第一号（柱書は「法第四十条の三の国土交通省令で定める図書は、発注者から直接建設工事を請け負つた建設業者（作成建設業者を除く。）にあつては第一号、第二号、第四号及び第五号に掲げるもの又はその写し…」）",
      "quote": "建設工事の施工上の必要に応じて作成し、又は発注者から受領した完成図（建設工事の目的物の完成時の状況を表した図をいう。）",
      "siteDefinition": false,
      "docName": "建設業法施行規則"
    },
    "others": [
      {
        "name": "建設業法施行規則 第28条第2項（図書の保存期間）",
        "href": "https://laws.e-gov.go.jp/law/324M50004000014"
      },
      {
        "name": "建設業法 第40条の3（帳簿の備付け等）",
        "href": "https://laws.e-gov.go.jp/law/324AC0000000100"
      }
    ]
  },
  {
    "id": "B7",
    "axis": "B",
    "question": "系統連系申込みで一般送配電事業者に出した技術資料（単線結線図・系統連系保護リレーの仕様・逆変換装置（PCS、パワーコンディショナ）の仕様、非認証品の PCS なら工場試験成績書など）の控えが手元にある",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（一般送配電事業者の系統に連系するもの）。出す書類の範囲は、連系先の会社と電圧（低圧・高圧・特別高圧）で違う",
    "answerNote": null,
    "why": "東北電力ネットワークの高圧の申込書類一覧では、蓄電池の列で単線結線図（様式５の４）と系統連系保護リレーの仕様（様式３の３）に、接続検討申込みと系統連系申込みの両方で提出が要る印（◎）が付き、非認証品の PCS を使う場合は工場試験成績書の提出が要るとされている。JET（電気安全環境研究所）は、認証を受けた装置なら連系協議での個別の性能確認試験などを省略できるとしている。",
    "nextAction": "系統連系申込みの申込者から提出書類一式の控えを受け取る（どの書類を出したかは連系先の申込書類一覧で確かめる）",
    "strength": "系統・市場の運営機関の規程・様式",
    "primary": {
      "name": "接続検討申込および系統連系申込に必要な様式および資料【高圧】（申込みに必要な様式および資料一覧）",
      "issuer": "東北電力ネットワーク",
      "href": "https://nw.tohoku-epco.co.jp/consignment/request/emit/pdf/zz1.pdf",
      "where": "表の凡例。蓄電池の列の行「様式５の４ 単線結線図」「様式３の３ 主要設備仕様（系統連系保護リレー）」「様式３の５ 発電設備仕様（逆変換装置）」「ＰＣＳの工場試験成績書（代表機）／（実機）」（備考「非認証品ＰＣＳを用いる場合提出が必要」）「保護継電器の取扱説明書」。PDF 1 頁",
      "quote": "◎：接続検討申込および系統連系申込の両方で提出が必要な書類",
      "siteDefinition": false,
      "docName": "接続検討申込および系統連系申込に必要な様式および資料【高圧】"
    },
    "others": [
      {
        "name": "系統連系保護装置等認証（一般財団法人 電気安全環境研究所 JET）",
        "href": "https://www.jet.or.jp/renewable/power_conditioner/protection/"
      },
      {
        "name": "系統連系・発電量調整供給・電力売電に関するお申込み（東北電力ネットワーク）",
        "href": "https://nw.tohoku-epco.co.jp/consignment/request/emit/"
      }
    ]
  },
  {
    "id": "C1",
    "axis": "C",
    "question": "所在地の区域区分（市街化区域・市街化調整区域・区域区分の定めのない都市計画区域〔いわゆる非線引き〕・都市計画区域外のどれか）と用途地域（定めが無ければその旨）を都市計画図で確かめ、記録している",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（都市計画区域外や用途地域の定めが無い土地は、それを確かめて記録していれば「はい」）",
    "answerNote": null,
    "why": "都市計画法は、計画図・計画書を、土地の権利者が自分の土地が市街化区域・市街化調整区域のどちらに入るか、用途地域などの地域地区に入るかを容易に判断できるものにするよう定め（第14条第2項）、その図書を公衆の縦覧に供するとしている（第20条第2項）。市街化調整区域は市街化を抑制すべき区域で（第7条第3項）、用途地域ごとに目的（第9条）と建築物の容積率・建蔽率など（第8条第3項）が定められる。",
    "nextAction": "市町村（または都道府県）の都市計画の窓口で計画図を閲覧するか、公開されている都市計画図で区域区分と用途地域を確かめる（都市計画法第20条第2項）",
    "strength": "法令",
    "primary": {
      "name": "都市計画法 第14条第2項（都市計画の図書）",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/343AC0000000100",
      "where": "第十四条第二項（文頭は「計画図及び計画書における区域区分の表示又は次に掲げる区域の表示は、」。第三号が「地域地区の区域」）",
      "quote": "土地に関し権利を有する者が、自己の権利に係る土地が区域区分により区分される市街化区域若しくは市街化調整区域のいずれの区域に含まれるか又は次に掲げる区域に含まれるかどうかを容易に判断することができるものでなければならない。",
      "siteDefinition": false,
      "docName": "都市計画法"
    },
    "others": [
      {
        "name": "都市計画法 第20条第2項（都市計画の図書の縦覧）",
        "href": "https://laws.e-gov.go.jp/law/343AC0000000100"
      },
      {
        "name": "都市計画法 第7条第3項（市街化調整区域）",
        "href": "https://laws.e-gov.go.jp/law/343AC0000000100"
      },
      {
        "name": "不動産情報ライブラリ API操作説明（国土交通省）",
        "href": "https://www.reinfolib.mlit.go.jp/help/apiManual/"
      }
    ]
  },
  {
    "id": "C2",
    "axis": "C",
    "question": "所在地が水防法の浸水想定区域（洪水・雨水出水・高潮）に入るかと、入る場合の想定水深を、市町村の図面で確かめ、記録している",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（区域外を確かめて記録していれば「はい」）",
    "answerNote": null,
    "why": "水防法は、国土交通大臣・都道府県知事・市町村長が、想定最大規模の降雨・高潮で浸水が想定される区域を、区域と浸水した場合に想定される水深を明らかにして指定・公表すると定めている（第14条〜第14条の3）。市町村長はその図面を各世帯に提供し（同法施行規則第11条第1号）、図面上の所在地は宅地建物取引業者が重要事項として説明する事項でもある（宅建業法施行規則第16条の4の3第3号の2）。",
    "nextAction": "市町村の浸水想定区域の図面（水防法施行規則第11条。ハザードマップポータルサイト https://disaportal.gsi.go.jp/ の「わがまちハザードマップ」から開ける）で所在地と想定水深を確かめる",
    "strength": "法令",
    "primary": {
      "name": "水防法 第14条第3項",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/324AC0000000193",
      "where": "第十四条第三項（洪水浸水想定区域。第十四条の二第三項〔雨水出水〕も同文、第十四条の三第二項〔高潮〕は「前項の規定による指定は、」で始まる）",
      "quote": "前二項の規定による指定は、指定の区域、浸水した場合に想定される水深その他の国土交通省令で定める事項を明らかにしてするものとする。",
      "siteDefinition": false,
      "docName": "水防法"
    },
    "others": [
      {
        "name": "水防法施行規則 第11条第1号（図面の各世帯への提供）",
        "href": "https://laws.e-gov.go.jp/law/412M50004000044"
      },
      {
        "name": "水防法 第15条第3項（市町村長による周知）",
        "href": "https://laws.e-gov.go.jp/law/324AC0000000193"
      },
      {
        "name": "宅地建物取引業法施行規則 第16条の4の3第3号の2",
        "href": "https://laws.e-gov.go.jp/law/332M50004000012"
      },
      {
        "name": "ハザードマップポータルサイト（国土交通省・国土地理院）",
        "href": "https://disaportal.gsi.go.jp/"
      }
    ]
  },
  {
    "id": "C3",
    "axis": "C",
    "question": "所在地が土砂災害警戒区域・土砂災害特別警戒区域に入るかを確かめ、記録している",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（区域外を確かめて記録していれば「はい」）",
    "answerNote": null,
    "why": "都道府県知事は、急傾斜地の崩壊等が起きたときに住民等の生命・身体に危害が生ずるおそれがある区域を土砂災害警戒区域に、そのうち建築物に損壊が生じ著しい危害が生ずるおそれがある区域を特別警戒区域に指定して公示する（土砂災害防止法第7条・第9条）。警戒区域内にあることは、宅地建物取引業者が重要事項として説明する事項でもある（宅建業法施行規則第16条の4の3第2号）。",
    "nextAction": "都道府県の公示（土砂災害防止法第7条第4項・第9条第4項）か、市町村が配る区域を表示した図面（同法第8条第3項・同法施行規則第5条第1号）で所在地を確かめる",
    "strength": "法令",
    "primary": {
      "name": "土砂災害警戒区域等における土砂災害防止対策の推進に関する法律 第7条第1項",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/412AC0000000057",
      "where": "第七条第一項",
      "quote": "急傾斜地の崩壊等が発生した場合には住民等の生命又は身体に危害が生ずるおそれがあると認められる土地の区域",
      "siteDefinition": false,
      "docName": "土砂災害警戒区域等における土砂災害防止対策の推進に関する法律"
    },
    "others": [
      {
        "name": "同法 第9条第1項（特別警戒区域）",
        "href": "https://laws.e-gov.go.jp/law/412AC0000000057"
      },
      {
        "name": "同法 第9条第7項（図書の縦覧）",
        "href": "https://laws.e-gov.go.jp/law/412AC0000000057"
      },
      {
        "name": "同法施行規則 第5条第1号（第8条第3項の周知の措置＝区域を表示した図面）",
        "href": "https://laws.e-gov.go.jp/law/413M60000800071"
      },
      {
        "name": "宅地建物取引業法施行規則 第16条の4の3第2号",
        "href": "https://laws.e-gov.go.jp/law/332M50004000012"
      }
    ]
  },
  {
    "id": "C4",
    "axis": "C",
    "question": "所在地の津波浸水想定（浸水の区域と水深）と、津波災害警戒区域に入るかを確かめ、記録している",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（内陸などで浸水想定の外にあることを確かめて記録していれば「はい」）",
    "answerNote": null,
    "why": "都道府県知事は、津波浸水想定（津波があったときに想定される浸水の区域と水深）を設定して公表し（津波防災地域づくりに関する法律第8条）、津波災害警戒区域を基準水位とともに指定・公示する（第53条）。警戒区域内にあることは、宅地建物取引業者が重要事項として説明する事項でもある（宅建業法施行規則第16条の4の3第3号）。",
    "nextAction": "都道府県が公表した津波浸水想定（津波防災地域づくりに関する法律第8条第4項）と津波災害警戒区域の公示（第53条第4項）で所在地を確かめる",
    "strength": "法令",
    "primary": {
      "name": "津波防災地域づくりに関する法律 第8条第1項",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/423AC0000000123",
      "where": "第八条第一項",
      "quote": "都道府県知事は、基本指針に基づき、かつ、基礎調査の結果を踏まえ、津波浸水想定（津波があった場合に想定される浸水の区域及び水深をいう。以下同じ。）を設定するものとする。",
      "siteDefinition": false,
      "docName": "津波防災地域づくりに関する法律"
    },
    "others": [
      {
        "name": "同法 第8条第4項（公表）",
        "href": "https://laws.e-gov.go.jp/law/423AC0000000123"
      },
      {
        "name": "同法 第53条第4項（警戒区域の公示）",
        "href": "https://laws.e-gov.go.jp/law/423AC0000000123"
      },
      {
        "name": "宅地建物取引業法施行規則 第16条の4の3第3号",
        "href": "https://laws.e-gov.go.jp/law/332M50004000012"
      },
      {
        "name": "ハザードマップポータルサイト（重ねるハザードマップ）",
        "href": "https://disaportal.gsi.go.jp/"
      }
    ]
  },
  {
    "id": "C6",
    "axis": "C",
    "question": "所在地が騒音規制法の指定地域に入るか（入る場合は区域の区分と規制基準）を確かめ、記録している",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（指定地域外を確かめて記録していれば「はい」）",
    "answerNote": null,
    "why": "騒音規制法の指定地域では、特定施設（送風機・空気圧縮機で原動機の定格出力7.5kW以上など＝施行令別表第一）を置く工場・事業場が、敷地の境界線での騒音の規制基準を守る義務を負い（第2条第2項・第5条）、特定施設を新たに置くときは工事開始の30日前までに市町村長への届出が要る（第6条）。蓄電池・PCS そのものは別表第一に無いので、規制がかかるかは設備の構成で決まる。",
    "nextAction": "都道府県（市の区域では市）が公示した騒音規制法の指定地域と規制基準で所在地を確かめる（騒音規制法第3条第1項・第3項、第4条）",
    "strength": "法令",
    "primary": {
      "name": "騒音規制法 第3条第1項（地域の指定）",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/343AC0000000098",
      "where": "第三条第一項（指定するのは都道府県知事、市の区域内は市長）",
      "quote": "住居が集合している地域、病院又は学校の周辺の地域その他の騒音を防止することにより住民の生活環境を保全する必要があると認める地域を、特定工場等において発生する騒音及び特定建設作業に伴つて発生する騒音について規制する地域として指定しなければならない。",
      "siteDefinition": false,
      "docName": "騒音規制法"
    },
    "others": [
      {
        "name": "騒音規制法 第2条第2項（規制基準の定義）",
        "href": "https://laws.e-gov.go.jp/law/343AC0000000098"
      },
      {
        "name": "騒音規制法 第5条（規制基準の遵守義務）",
        "href": "https://laws.e-gov.go.jp/law/343AC0000000098"
      },
      {
        "name": "騒音規制法 第3条第3項（指定地域の公示）",
        "href": "https://laws.e-gov.go.jp/law/343AC0000000098"
      },
      {
        "name": "騒音規制法施行令 別表第一（特定施設）第二号",
        "href": "https://laws.e-gov.go.jp/law/343CO0000000324"
      }
    ]
  },
  {
    "id": "D1",
    "axis": "D",
    "question": "接続検討の回答書（最大受電電力に対する連系可否・工事費負担金概算・所要工期・運用上の制約などが書かれたもの）が、充電（順潮流側）の検討結果も含めて手元にある",
    "allowsNotApplicable": true,
    "appliesWhen": "高圧又は特別高圧の送電系統に連系する（した）サイト。接続検討の申込みが義務なのは高圧・特別高圧への連系（送配電等業務指針 第79条第1項）で、低圧連系には当てはまらない",
    "answerNote": null,
    "why": "接続検討の回答は、一般送配電事業者等が最大受電電力に対する連系可否・工事費負担金概算・所要工期・接続検討の前提条件・運用上の制約（制約の根拠を含む）などを書面又は電磁的方法で示すもので（送配電等業務指針 第85条）、系統用蓄電設備では充電時（順潮流側）も考慮して検討される（OCCTO）。契約申込み前の案件では、回答日から1年を過ぎると契約申込みが受け付けられない（同 第89条第1項第6号）。",
    "nextAction": "回答書が見当たらなければ、連系先の一般送配電事業者の託送供給サービス窓口（OCCTO の一覧 https://www.occto.or.jp/institution/access/link/takuso.html）に問い合わせ、見つかったら最大受電電力（台帳では「契約容量(kW)」の欄。語の違いは備考に）・連系電圧・接続変電所名を台帳の 01_サイト基本に写す",
    "strength": "系統・市場の運営機関の規程・様式",
    "primary": {
      "name": "発電設備等系統アクセスの流れ",
      "issuer": "電力広域的運営推進機関（OCCTO）",
      "href": "https://www.occto.or.jp/institution/access/kentou/access_process.html",
      "where": "「４．接続検討のご回答」（主な回答内容の一覧の直前の有効期限の段落）",
      "quote": "なお、接続検討回答書は、送配電等業務指針第89条第1項第6号の規定により有効期限が1年となっていますので、1年以上経過して契約申込みの手続きを行う場合には、再度の接続検討が必要となります。",
      "siteDefinition": false,
      "docName": "発電設備等系統アクセスの流れ"
    },
    "others": [
      {
        "name": "送配電等業務指針（令和８年８月１日変更）第85条第1項柱書",
        "href": "https://www.occto.or.jp/assets/occto/article/index/shishin2608.pdf"
      },
      {
        "name": "送配電等業務指針 第85条第1項第8号",
        "href": "https://www.occto.or.jp/assets/occto/article/index/shishin2608.pdf"
      },
      {
        "name": "送配電等業務指針 第79条第1項（接続検討の申込み）",
        "href": "https://www.occto.or.jp/assets/occto/article/index/shishin2608.pdf"
      },
      {
        "name": "送配電等業務指針 第89条第1項第6号",
        "href": "https://www.occto.or.jp/assets/occto/article/index/shishin2608.pdf"
      },
      {
        "name": "発電設備等に関する系統アクセスの流れ（２０２６年9月）p.9 ※6",
        "href": "https://www.occto.or.jp/assets/access_nagare_20260928.pdf"
      },
      {
        "name": "発電設備等に関する系統アクセスの流れ（２０２６年9月）p.22",
        "href": "https://www.occto.or.jp/assets/access_nagare_20260928.pdf"
      },
      {
        "name": "具体的な系統アクセス手続き等について",
        "href": "https://www.occto.or.jp/grid/business/access.html"
      }
    ]
  },
  {
    "id": "D2",
    "axis": "D",
    "question": "連系承諾の通知（系統連系の承諾のお知らせ）と、工事費負担金契約書・その支払の記録が手元にある（契約申込みの受付が2026年10月1日以降で、FIT・FIP 電源になる予定のない案件は、用地の使用権原を証する書類の提出控えも）",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト。用地の使用権原を証する書類の提出控えは、契約申込みの受付が2026年10月1日以降の案件だけ（FIT・FIP 電源となる予定の設備と、出力増加等の系統影響が無い既設設備の変更申込みは提出不要）",
    "answerNote": null,
    "why": "接続検討は系統連系を確約せず、契約申込み後の連系承諾で系統連系が確定する（OCCTO）。連系承諾後1か月を超えて工事費負担金契約を結ばない、工事費負担金を払わない、連系承諾後2か月を超えて用地の使用権原を証する書類を出さない（FIT・FIP 電源となる予定の設備を除く）場合は、確定した連系予約が取り消される（送配電等業務指針 第97条第2項）。",
    "nextAction": "連系先の一般送配電事業者から届いた系統連系の承諾のお知らせ・工事費負担金契約書・入金の記録を揃え、見当たらなければ同社の託送供給サービス窓口に問い合わせる",
    "strength": "系統・市場の運営機関の規程・様式",
    "primary": {
      "name": "送配電等業務指針（令和８年８月１日変更）第97条第2項第1号",
      "issuer": "電力広域的運営推進機関（OCCTO）",
      "href": "https://www.occto.or.jp/assets/occto/article/index/shishin2608.pdf",
      "where": "第97条（連系予約の確定）第2項第1号（PDF 45頁・印字41頁）。同項第2号＝工事費負担金の不払い、第4号＝用地の使用権原を証する書類の不提出",
      "quote": "一 系統連系希望者が、連系承諾後１か月を超えて第１０３条第１項に定める工事費負担金契約を締結しない場合",
      "siteDefinition": false,
      "docName": "送配電等業務指針"
    },
    "others": [
      {
        "name": "発電設備等系統アクセスの流れ（注3）",
        "href": "https://www.occto.or.jp/institution/access/kentou/access_process.html"
      },
      {
        "name": "発電設備等系統アクセスの流れ（６．契約申込みと連系承諾）",
        "href": "https://www.occto.or.jp/institution/access/kentou/access_process.html"
      },
      {
        "name": "送配電等業務指針 第97条第2項第2号",
        "href": "https://www.occto.or.jp/assets/occto/article/index/shishin2608.pdf"
      },
      {
        "name": "送配電等業務指針 第97条第2項第4号",
        "href": "https://www.occto.or.jp/assets/occto/article/index/shishin2608.pdf"
      },
      {
        "name": "送配電等業務指針 附則（令和８年７月２１日）第2条",
        "href": "https://www.occto.or.jp/assets/occto/article/index/shishin2608.pdf"
      },
      {
        "name": "発電設備等に関する系統アクセスの流れ（２０２６年9月）p.15 本文",
        "href": "https://www.occto.or.jp/assets/access_nagare_20260928.pdf"
      },
      {
        "name": "同 p.15 ※17",
        "href": "https://www.occto.or.jp/assets/access_nagare_20260928.pdf"
      },
      {
        "name": "同 p.15 ※15",
        "href": "https://www.occto.or.jp/assets/access_nagare_20260928.pdf"
      },
      {
        "name": "託送供給等約款（令和 8 年 10 月 1 日実施）東京電力パワーグリッド 8(2)ル",
        "href": "https://www.tepco.co.jp/pg/consignment/notification/pdf/takusou_yakkan20260722.pdf"
      },
      {
        "name": "同 8(2)ル（提出の期限）",
        "href": "https://www.tepco.co.jp/pg/consignment/notification/pdf/takusou_yakkan20260722.pdf"
      }
    ]
  },
  {
    "id": "D4",
    "axis": "D",
    "question": "特別高圧で連系している場合、自設備が N-1 電制（設備が1つ故障したときにリレーで瞬時に電源の出力を制限する仕組み）の対象か（N-1 電制装置を設置しているか）を、一般送配電事業者との書面で確かめた",
    "allowsNotApplicable": true,
    "appliesWhen": "特別高圧の系統に連系しているサイト（高圧系統以下に接続される電源は N-1 電制の対象外＝OCCTO）",
    "answerNote": null,
    "why": "特別高圧の系統に接続する電源は既設も含め全て N-1 電制対象電源の候補で、一般送配電事業者から N-1 電制装置の設置を求められた発電契約者等はこれに応じる必要がある（OCCTO）。高圧系統以下に接続される電源は電制対象としない（同）。なお、OCCTO の考え方は電源・発電所について書かれていて、蓄電所への当てはめは明記されていない（このため一般送配電事業者との書面で確かめる）。",
    "nextAction": "接続検討の回答書・接続契約などで N-1 電制装置の扱いを確かめ、書面で分からなければ連系先の一般送配電事業者に問い合わせる",
    "strength": "系統・市場の運営機関の規程・様式",
    "primary": {
      "name": "流通設備の整備計画の策定（送配電等業務指針第５５条関連）におけるＮ－１電制の考え方について（2025年1月23日変更）",
      "issuer": "電力広域的運営推進機関（OCCTO）",
      "href": "https://www.occto.or.jp/assets/access/oshirase/2018/files/20250123_n-1densei.pdf",
      "where": "1.6 Ｎ－１電制の対象電源選定の考え方 脚注8（印字9頁・PDF 10頁）",
      "quote": "発電事業者は、正当な理由がない限り、効率的設備形成の観点からのＮ－１電制装置の設置について応じる必要がある。",
      "siteDefinition": false,
      "docName": "流通設備の整備計画の策定（送配電等業務指針第５５条関連）におけるＮ－１電制の考え方について"
    },
    "others": [
      {
        "name": "同上 1.5 Ｎ－１電制対象電源",
        "href": "https://www.occto.or.jp/assets/access/oshirase/2018/files/20250123_n-1densei.pdf"
      },
      {
        "name": "同上 1.5（高圧以下は対象外）",
        "href": "https://www.occto.or.jp/assets/access/oshirase/2018/files/20250123_n-1densei.pdf"
      },
      {
        "name": "同上 1.6 本文（設置の求めに応じる必要）",
        "href": "https://www.occto.or.jp/assets/access/oshirase/2018/files/20250123_n-1densei.pdf"
      },
      {
        "name": "同上 脚注14（回答書への記載）",
        "href": "https://www.occto.or.jp/assets/access/oshirase/2018/files/20250123_n-1densei.pdf"
      },
      {
        "name": "同上 用語（Ｎ－１電制の説明）",
        "href": "https://www.occto.or.jp/assets/access/oshirase/2018/files/20250123_n-1densei.pdf"
      },
      {
        "name": "系統の接続および利用ルールについて（N-1電制）",
        "href": "https://www.occto.or.jp/grid/business/setsuzoku.html"
      }
    ]
  },
  {
    "id": "D5",
    "axis": "D",
    "question": "ノンファーム型接続（混雑時の出力制御を前提に、設備の増強を待たずに接続する方式）が自設備に適用されているかと、その条件（混雑時の出力制御・主な混雑設備）を、接続検討の回答書・同意書の控え・接続契約で確かめた",
    "allowsNotApplicable": true,
    "appliesWhen": "10kW未満の低圧を除く全サイト（2023年3月31日以前に接続検討の受付をした案件は、適用されていないこともある）",
    "answerNote": null,
    "why": "2023年4月1日以降に接続検討の受付を行った案件は、接続先の電圧階級や空き容量の有無に関わらず原則としてノンファーム型接続が適用され、混雑が見込まれる場合は接続検討の回答に主な混雑設備の名称が書かれる（OCCTO）。ノンファーム型接続の電源は、系統の混雑が生じると出力制御を受ける可能性がある（資源エネルギー庁）。",
    "nextAction": "接続検討の回答書で「主な混雑設備」の記載を、同意書の控えか接続契約で適用の有無を確かめ、分からなければ連系先の一般送配電事業者に問い合わせる",
    "strength": "系統・市場の運営機関の規程・様式",
    "primary": {
      "name": "系統の接続および利用ルールについて ～ノンファーム型接続～",
      "issuer": "電力広域的運営推進機関（OCCTO）",
      "href": "https://www.occto.or.jp/grid/assets/NF_setuzokuriyou_20260710.pdf",
      "where": "スライド7「系統アクセス手続きの基本的な進め方について」（PDF 8頁）",
      "quote": "ノンファーム型接続での契約申込み（10kW未満の低圧を除く）に際しては、同意書の提出が必要となります。",
      "siteDefinition": false,
      "docName": "系統の接続および利用ルールについて ～ノンファーム型接続～"
    },
    "others": [
      {
        "name": "同上 スライド7（2023年4月1日以降は原則適用）",
        "href": "https://www.occto.or.jp/grid/assets/NF_setuzokuriyou_20260710.pdf"
      },
      {
        "name": "同上 スライド7（主な混雑設備の記載）",
        "href": "https://www.occto.or.jp/grid/assets/NF_setuzokuriyou_20260710.pdf"
      },
      {
        "name": "同上 スライド7（同意書の廃止予定）",
        "href": "https://www.occto.or.jp/grid/assets/NF_setuzokuriyou_20260710.pdf"
      },
      {
        "name": "系統情報の公表の考え方（令和８年４月改定）",
        "href": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/pdf/keitou_kangaekata_20260401.pdf"
      },
      {
        "name": "日本版コネクト＆マネージの検討",
        "href": "https://www.occto.or.jp/gyomusyokai/no7.html"
      }
    ]
  },
  {
    "id": "D7",
    "axis": "D",
    "question": "接続変電所の公表値（空容量・N-1電制適用可否と適用可能量・ノンファーム接続適用可否）を、公表元のデータ基準日とあわせて記録している（自設備の接続条件ではなく変電所ごとの公表値。当サイト /grid で見られる）",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（接続変電所が当サイト /grid に無いときは、連系先の一般送配電事業者の公表ページで確かめる）",
    "answerNote": null,
    "why": "資源エネルギー庁「系統情報の公表の考え方」は、発電所又は蓄電所の立地を決めるときの予見可能性を高める情報として、送変電設備の予想潮流・N-1電制適用可否・N-1電制適用可能量（配電用変電所変圧器等は空容量）を一般送配電事業者等が公開するとしている。空容量は特定の条件下の値で、熱容量以外の電圧面・系統安定度の制約は個別の接続検討で回答される（同・脚注10・13）。",
    "nextAction": "当サイト /grid で接続変電所のページを開き、各表示値と「データ最終更新日」を写す（最新値はページの「一次ソース（公表ページ）」で確かめる）",
    "strength": "官公庁の資料",
    "primary": {
      "name": "系統情報の公表の考え方（令和８年４月改定）",
      "issuer": "資源エネルギー庁",
      "href": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/pdf/keitou_kangaekata_20260401.pdf",
      "where": "２．公表されるべき系統情報の整理（3頁）。公開項目の列挙は 6 頁「① 公開情報」○系統の予想潮流等に関する情報、脚注10・13",
      "quote": "発電等設備設置者は、発電所又は蓄電所の立地地点を決めるに当たり、立地候補地点付近の系統に連系することから、当該系統について発電等設備設置者の予見可能性を高めることに資する情報が必要となる。",
      "siteDefinition": false,
      "docName": "系統情報の公表の考え方"
    },
    "others": [
      {
        "name": "同上 6 頁「① 公開情報」○系統の予想潮流等に関する情報",
        "href": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/pdf/keitou_kangaekata_20260401.pdf"
      },
      {
        "name": "同上 脚注13",
        "href": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/pdf/keitou_kangaekata_20260401.pdf"
      },
      {
        "name": "同上 脚注10",
        "href": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electric/summary/regulations/pdf/keitou_kangaekata_20260401.pdf"
      }
    ]
  },
  {
    "id": "E1",
    "axis": "E",
    "question": "直近 12 か月（運転開始から 12 か月未満なら運転開始から）の月ごとの停止日数と停止理由（故障・系統事象など）を記録している",
    "allowsNotApplicable": true,
    "appliesWhen": "運転を開始しているサイト",
    "answerNote": null,
    "why": "当サイトの資産台帳 v1.1 は、直近 12 か月の停止日数と稼働可能率（この台帳での定義: 暦時間のうち運転できた時間の割合）を、買い手・貸し手が確かめそうな項目（当サイトの想定）に挙げている。電気事業者でない設置者が出力千kW以上の蓄電用の自家用電気工作物を系統に接続している場合は、法定の自家用発電所等運転半期報（電気関係報告規則 様式第９ 第2表）にも「運転停止期間及び停止理由」の欄がある。",
    "nextAction": "停止のあった月ごとに停止日数と停止理由を台帳の 04_月次実績に入れ、理由は 05_インシデントの記録と揃える",
    "strength": "当サイトの定義",
    "primary": {
      "name": "系統用蓄電所 資産台帳テンプレート v1.1 の定義（08_売却時に聞かれる項目「直近 12 か月の停止日数」）",
      "issuer": "蓄電所ネット（当サイト）",
      "href": "/tools/asset-ledger",
      "where": "",
      "quote": null,
      "siteDefinition": true,
      "docName": null
    },
    "others": [
      {
        "name": "電気関係報告規則 第2条第1項の表 五（自家用発電所等運転半期報）",
        "href": "https://laws.e-gov.go.jp/law/340M50000400054"
      },
      {
        "name": "電気関係報告規則 様式第９ 第2表",
        "href": "https://laws.e-gov.go.jp/law/340M50000400054"
      },
      {
        "name": "電気事業法 第28条の3第1項（特定自家用電気工作物の届出の主体）",
        "href": "https://laws.e-gov.go.jp/law/339AC0000000170"
      },
      {
        "name": "電気事業法施行規則 第45条の27（特定自家用電気工作物）",
        "href": "https://laws.e-gov.go.jp/law/407M50000400077"
      }
    ]
  },
  {
    "id": "E3",
    "axis": "E",
    "question": "需給調整市場に参加している場合、月ごとの容量約定率（約定量÷（提供容量×当月のコマ数））と平均落札単価を記録している",
    "allowsNotApplicable": true,
    "appliesWhen": "需給調整市場に参加している（いた）サイト",
    "answerNote": null,
    "why": "容量約定率は当サイトの資産台帳での定義で、/tools/balancing-benchmark の「約定率（容量ベース）」と同じ（EPRX の取引ガイドが定めるのは「ΔkW約定量」までで、「約定率」の定義は無い）。台帳の 08 は「直近 12 か月の約定率」を、買い手・貸し手が確かめそうな項目（当サイトの想定）に挙げている。",
    "nextAction": "アグリゲーターの月次報告などから、月ごとの容量約定率と平均落札単価を台帳の 04_月次実績に写す（応札約定率とは分母が違うので混ぜない）",
    "strength": "当サイトの定義",
    "primary": {
      "name": "系統用蓄電所 資産台帳テンプレート v1.1 の約定率の定義",
      "issuer": "蓄電所ネット（当サイト）",
      "href": "/tools/asset-ledger",
      "where": "",
      "quote": null,
      "siteDefinition": true,
      "docName": null
    },
    "others": [
      {
        "name": "EPRX 取引ガイド（全商品）第10版 1-2 リソース等が満たすべき要件 a. 運用に関する要件①",
        "href": "https://www.eprx.or.jp/outline/docs/guide_ver.10_260701.pdf"
      }
    ]
  },
  {
    "id": "E4",
    "axis": "E",
    "question": "月ごとの SOH（電池の健全度）を、その測り方（保証書の容量保証の条件に書かれた測り方かどうか）を添えて記録している",
    "allowsNotApplicable": true,
    "appliesWhen": "運転を開始しているサイト（容量保証が無い設備は、測り方を添えて記録しているかだけで答える）",
    "answerNote": null,
    "why": "当サイトの資産台帳 v1.1 は、02_設備の「容量保証の条件（SOH等）」に SOH の測り方やサイクル数の上限など保証書の記載を入れ、04_月次実績の SOH は「測り方は備考に」と定めている。08 は「容量保証の条件」と「直近の SOH」を、買い手・貸し手が確かめそうな項目（当サイトの想定）に挙げている。",
    "nextAction": "保証書の容量保証の条件（SOH の測り方）を台帳の 02_設備に写し、月ごとの SOH を 04_月次実績に測り方を備考に添えて入れる",
    "strength": "当サイトの定義",
    "primary": {
      "name": "系統用蓄電所 資産台帳テンプレート v1.1 の定義（04_月次実績 SOH(%)）",
      "issuer": "蓄電所ネット（当サイト）",
      "href": "/tools/asset-ledger",
      "where": "",
      "quote": null,
      "siteDefinition": true,
      "docName": null
    },
    "others": []
  },
  {
    "id": "E6",
    "axis": "E",
    "question": "停止・故障・火災などの出来事を 1 件ごとに記録していて、そのうち電気関係報告規則第3条の事故報告に当たったものは、速報の記録と様式第十三の報告書の控えが手元にある",
    "allowsNotApplicable": true,
    "appliesWhen": "運転を開始しているサイト（第3条の報告義務は、電気事業者の電気工作物と自家用電気工作物が対象。蓄電所の主要電気工作物の破損事故は容量20kWh超、放電支障事故は出力10万kW以上で7日間以上）",
    "answerNote": "出来事の 1 件ごとの記録と、事故報告に当たったものの控えがそろって「はい」。出来事が無かったと確かめていれば「はい」。事故報告に当たる出来事が無ければ、記録があれば「はい」。片方だけなら「いいえ」",
    "why": "電気関係報告規則第3条は、容量20kWh超の蓄電所の主要電気工作物の破損事故、電気火災事故（工作物は半焼以上）、出力10万kW以上の蓄電所の7日間以上の放電支障事故などを、設置場所を管轄する産業保安監督部長へ、事故を知った時から24時間以内の電話等による速報と30日以内の様式第十三の報告書で報告するよう定める。当サイトの台帳は 05_インシデントに出来事を 1 件ずつ（日付・種別・概要・原因・対応・復旧日・報告先など）記録する欄を置き、08 に「インシデントの記録」を挙げている（当サイトの想定）。",
    "nextAction": "出来事を台帳の 05_インシデントに 1 件ずつ記録し、e-Gov の電気関係報告規則第3条の表で報告対象に当たるかを確かめ、当たったものは報告書の控えを 06_書類に登録する",
    "strength": "法令",
    "primary": {
      "name": "電気関係報告規則 第3条第2項（事故報告の方法）",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/340M50000400054",
      "where": "第3条第2項 本文の後段",
      "quote": "事故の発生を知つた日から起算して三十日以内に様式第十三の報告書を提出して行わなければならない。",
      "siteDefinition": false,
      "docName": "電気関係報告規則"
    },
    "others": [
      {
        "name": "電気関係報告規則 第3条第2項（速報）",
        "href": "https://laws.e-gov.go.jp/law/340M50000400054"
      },
      {
        "name": "電気関係報告規則 第3条第1項の表 四 ト",
        "href": "https://laws.e-gov.go.jp/law/340M50000400054"
      },
      {
        "name": "電気関係報告規則 第3条第1項の表 七",
        "href": "https://laws.e-gov.go.jp/law/340M50000400054"
      },
      {
        "name": "電気関係報告規則 第3条第1項の表 二",
        "href": "https://laws.e-gov.go.jp/law/340M50000400054"
      },
      {
        "name": "電気関係報告規則 第3条第1項 後段（報告先が経済産業大臣になる場合）",
        "href": "https://laws.e-gov.go.jp/law/340M50000400054"
      },
      {
        "name": "電気関係報告規則 第1条第2項第11号（放電支障事故の定義）",
        "href": "https://laws.e-gov.go.jp/law/340M50000400054"
      },
      {
        "name": "電気関係報告規則 第1条第2項第4号（電気火災事故の定義）",
        "href": "https://laws.e-gov.go.jp/law/340M50000400054"
      },
      {
        "name": "電気関係報告規則 様式第13（電気関係事故報告）",
        "href": "https://laws.e-gov.go.jp/law/340M50000400054"
      },
      {
        "name": "経済産業省「電力貯蔵装置（蓄電池）・蓄電所を設置する場合の手引き」",
        "href": "https://www.meti.go.jp/policy/safety_security/industrial_safety/sangyo/electric/detail/denryokucyozousouchi.html"
      }
    ]
  },
  {
    "id": "E7",
    "axis": "E",
    "question": "需給調整市場や容量市場に参加している場合、市場側のアセスメント（約定した量・供給力を出せたかの確認）の月ごとの結果とペナルティの有無、出せなかったときに提出した書類（需給調整市場の様式23・容量市場の容量停止計画）の写しを受け取って保管している",
    "allowsNotApplicable": true,
    "appliesWhen": "需給調整市場に参加している、または容量市場の容量確保契約がある場合（どちらも無ければ該当なし）。容量市場の容量停止計画のリクワイアメントは、安定電源・変動電源（単独）が対象。発動指令電源として契約している場合の記録の扱いは、一次でまだ確かめていない",
    "answerNote": null,
    "why": "EPRX（電力需給調整力取引所）の取引ガイドでは、属地の一般送配電事業者（TSO）が、約定した調整力（ΔkW）を出せる状態だったか（アセスメントⅠ）と指令どおり調整したか（アセスメントⅡ）を確かめ、不適合ならペナルティ料金を算定する。容量市場でも OCCTO（電力広域的運営推進機関）が、容量停止計画をもとに供給力を提供できる状態を維持したかをアセスメントし、対象実需給月ごとに結果を確定して知らせる。",
    "nextAction": "アグリゲーター（取引会員）や容量提供事業者に、月ごとのアセスメント結果・ペナルティ料金の明細と、提出した様式23・容量停止計画の写しを求める",
    "strength": "系統・市場の運営機関の規程・様式",
    "primary": {
      "name": "取引ガイド（全商品）第10版（2026年7月1日）2-9 アセスメント（共通）a. アセスメント 概要",
      "issuer": "電力需給調整力取引所（EPRX）",
      "href": "https://www.eprx.or.jp/outline/docs/guide_ver.10_260701.pdf",
      "where": "PDF 480 頁（スライド内の参照表記「取引規程 第8章 第39条」）",
      "quote": "アセスメントは、 ΔkWの供出可否を確認する「アセスメントⅠ」と属地エリアにおけるTSOの指令に従って調整を実施したか応動実績を確認する「アセスメントⅡ」に分けて実施します。",
      "siteDefinition": false,
      "docName": "取引ガイド（全商品）"
    },
    "others": [
      {
        "name": "同 取引ガイド 2-7 トラブル時の対応 a. リソーストラブル時（1/15）",
        "href": "https://www.eprx.or.jp/outline/docs/guide_ver.10_260701.pdf"
      },
      {
        "name": "同 取引ガイド 2-10 ペナルティ a.（1/2）",
        "href": "https://www.eprx.or.jp/outline/docs/guide_ver.10_260701.pdf"
      },
      {
        "name": "同 取引ガイド（補足スライド）基準パターン指定におけるアセスメント結果の参照期間",
        "href": "https://www.eprx.or.jp/outline/docs/guide_ver.10_260701.pdf"
      },
      {
        "name": "容量市場 業務マニュアル 実需給期間中リクワイアメント対応（安定電源）編（対象実需給年度：2026年度）第2版 第6章 6.1 注2",
        "href": "https://www.occto.or.jp/assets/various/capacity-market/jitsujukyukanren/2026_jitsujukyu_kanren/260427_2026_gyoumumanual_rikuwaiamento_antei.pdf"
      },
      {
        "name": "同マニュアル 1.4.1.2 容量停止計画の提出（注）",
        "href": "https://www.occto.or.jp/assets/various/capacity-market/jitsujukyukanren/2026_jitsujukyu_kanren/260427_2026_gyoumumanual_rikuwaiamento_antei.pdf"
      },
      {
        "name": "同マニュアル 6.1.4.1 確定したアセスメント結果の受領",
        "href": "https://www.occto.or.jp/assets/various/capacity-market/jitsujukyukanren/2026_jitsujukyu_kanren/260427_2026_gyoumumanual_rikuwaiamento_antei.pdf"
      },
      {
        "name": "同マニュアル 第6章 注1（対象となる電源）",
        "href": "https://www.occto.or.jp/assets/various/capacity-market/jitsujukyukanren/2026_jitsujukyu_kanren/260427_2026_gyoumumanual_rikuwaiamento_antei.pdf"
      }
    ]
  },
  {
    "id": "F1",
    "axis": "F",
    "question": "アグリゲーター（運用委託）契約書の写しが手元にあり、契約終了日・自動更新の有無・中途解約の条件（通知期間・違約金）・手数料の決め方（成功報酬か固定か、率ならば何に対する率か）・報告の頻度を確かめた",
    "allowsNotApplicable": true,
    "appliesWhen": "アグリゲーターに運用を委託している場合（自社で市場取引をしていて委託していなければ該当なし）",
    "answerNote": null,
    "why": "当サイトの資産台帳は、売却や借入の相手（買い手・貸し手）が確かめそうな項目（当サイトの想定）として、アグリゲーター契約の残期間・解約条件・手数料の型を挙げ、03_契約に報告頻度の列を置いている。E3・E7 の記録は、この契約で決まる報告から写す。",
    "nextAction": "契約書から契約終了日・自動更新・解約条件・手数料の型・報告の頻度を書き出し、読み取れない点はアグリゲーターに問い合わせる",
    "strength": "当サイトの定義",
    "primary": {
      "name": "系統用蓄電所 資産台帳テンプレート 定義（08_売却時に聞かれる項目）",
      "issuer": "蓄電所ネット（当サイト）",
      "href": "/tools/asset-ledger",
      "where": "",
      "quote": null,
      "siteDefinition": true,
      "docName": null
    },
    "others": []
  },
  {
    "id": "F3",
    "axis": "F",
    "question": "アグリゲーター契約で、契約が終わるときの運転データの扱い（引継ぎ・切替への協力の定めの有無）を確かめた",
    "allowsNotApplicable": true,
    "appliesWhen": "アグリゲーターに運用を委託している場合",
    "answerNote": "データの扱いの定めが無いと確かめた場合も「はい」（定めの有無そのものは評価しない）",
    "why": "当サイトの資産台帳は「データ引継ぎ条項」（契約終了時に運転データを受け取れる条項）を、買い手・貸し手が確かめそうな項目（当サイトの想定）に挙げている。台帳は、アグリゲーターや O&M（運転・保守）事業者を替えても記録が手元に残るよう、所有者自身が持つものとして作っている。",
    "nextAction": "契約書で契約終了時の運転データの引渡し・切替への協力の定めを探し、無ければアグリゲーターに契約終了時にデータを渡してもらえるかを問い合わせる",
    "strength": "当サイトの定義",
    "primary": {
      "name": "系統用蓄電所 資産台帳テンプレート 定義（03_契約）",
      "issuer": "蓄電所ネット（当サイト）",
      "href": "/tools/asset-ledger",
      "where": "",
      "quote": null,
      "siteDefinition": true,
      "docName": null
    },
    "others": []
  },
  {
    "id": "F5",
    "axis": "F",
    "question": "O&M（運転・保守）契約書の写しが手元にあり、委託の範囲（点検・遠隔監視・駆け付けなど）・SLA（駆け付け時間や稼働率などの約束）・契約終了日を確かめた",
    "allowsNotApplicable": true,
    "appliesWhen": "O&M を外部に委託している場合（自社で保守していれば該当なし）",
    "answerNote": null,
    "why": "当サイトの資産台帳は「O&M 契約の範囲と終了日」を買い手・貸し手が確かめそうな項目（当サイトの想定）に挙げ、範囲・SLA・終了日を契約書の記載どおりに入れる列を置いている。公開のプロジェクトファイナンス（PF）の事例（三菱UFJ銀行・2025年5月7日）でも、建設・保守メンテナンス・市場での運用・運営管理を別々の事業者が担っている。",
    "nextAction": "O&M 事業者から契約書の写しを受け取り、委託の範囲・SLA・終了日を資産台帳（03_契約の O&M 列）に書き写す",
    "strength": "当サイトの定義",
    "primary": {
      "name": "系統用蓄電所 資産台帳テンプレート 定義（03_契約）",
      "issuer": "蓄電所ネット（当サイト）",
      "href": "/tools/asset-ledger",
      "where": "",
      "quote": null,
      "siteDefinition": true,
      "docName": null
    },
    "others": [
      {
        "name": "本邦系統用蓄電池設備によりフルマーチャントを前提に行う事業に対する本邦初のプロジェクトファイナンス組成について（2025年5月7日・株式会社三菱UFJ銀行）",
        "href": "https://www.bk.mufg.jp/info/pdf/full_merchant.pdf"
      }
    ]
  },
  {
    "id": "F7",
    "axis": "F",
    "question": "土地を借りている場合、土地の契約書で、賃借権の譲渡・転貸についての定め（地主の承諾の要否・事前承諾の条項の有無）を確かめた",
    "allowsNotApplicable": true,
    "appliesWhen": "土地を賃借している場合（自己所有なら該当なし。地上権の譲渡は民法第612条の対象外で、地上権の譲渡の扱いは一次でまだ確かめていない）",
    "answerNote": "譲渡・転貸についての定めが無いと確かめた場合も「はい」（定めの有無そのものは評価しない）",
    "why": "民法第612条第1項は、賃借人は賃貸人（地主）の承諾がなければ賃借権を譲り渡せないと定める。蓄電所を売るときに土地の賃借権も移すなら、契約書の定めで承諾の要否が分かる。",
    "nextAction": "土地の契約書の譲渡・転貸の条項を読み、承諾が要るなら地主の承諾書か事前承諾の条項の有無を書き出す",
    "strength": "法令",
    "primary": {
      "name": "民法 第612条（賃借権の譲渡及び転貸の制限）第1項",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/129AC0000000089",
      "where": "第612条第1項（第2項＝無断で第三者に使用・収益させたときの解除）",
      "quote": "賃借人は、賃貸人の承諾を得なければ、その賃借権を譲り渡し、又は賃借物を転貸することができない。",
      "siteDefinition": false,
      "docName": "民法"
    },
    "others": []
  },
  {
    "id": "F8",
    "axis": "F",
    "question": "土地を借りている場合、土地の契約書（賃貸借・地上権設定など）の写しが手元にあり、契約の終了日と、終了時の設備の撤去・原状回復の範囲と費用負担の定めを確かめた",
    "allowsNotApplicable": true,
    "appliesWhen": "土地を借りている場合（自己所有地なら該当なし）",
    "answerNote": null,
    "why": "土地を賃貸借で借りている場合、民法第604条は存続期間を最長50年とし、第621条は賃貸借が終わったときに賃借人が損傷を原状に戻す義務を、第622条が準用する第599条第1項は借主が附属させた物を収去する義務を定める。地上権では、地上権者は工作物を収去できる（義務ではなく権利）が、土地の所有者が時価で買い取る旨を通知したときは正当な理由がなければ拒めない（民法第269条）。建物の所有を目的とする借地権なら借地借家法（存続期間 第3条・建物買取請求 第13条）が掛かる。どの規定が当たるかは契約の形で違うので、契約書の定めを確かめる。当サイトの資産台帳も「土地の権利と契約終了日」を買い手・貸し手が確かめそうな項目（当サイトの想定）に挙げている。",
    "nextAction": "土地の契約書で終了日と、終了時の設備の撤去（収去）・原状回復の範囲と費用負担の条項を確かめ、終了日を資産台帳（01_サイト基本「土地契約の終了日」）に書き写す",
    "strength": "法令",
    "primary": {
      "name": "民法 第621条（賃借人の原状回復義務）",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/129AC0000000089",
      "where": "第621条（本文。ただし書の前まで）。あわせて第622条（使用貸借の規定の準用）→第599条第1項（借主による収去）",
      "quote": "賃借人は、賃借物を受け取った後にこれに生じた損傷（通常の使用及び収益によって生じた賃借物の損耗並びに賃借物の経年変化を除く。以下この条において同じ。）がある場合において、賃貸借が終了したときは、その損傷を原状に復する義務を負う。",
      "siteDefinition": false,
      "docName": "民法"
    },
    "others": [
      {
        "name": "民法 第604条（賃貸借の存続期間）第1項",
        "href": "https://laws.e-gov.go.jp/law/129AC0000000089"
      },
      {
        "name": "民法 第622条（使用貸借の規定の準用）",
        "href": "https://laws.e-gov.go.jp/law/129AC0000000089"
      },
      {
        "name": "民法 第599条（借主による収去等）第1項",
        "href": "https://laws.e-gov.go.jp/law/129AC0000000089"
      },
      {
        "name": "民法 第269条（工作物等の収去等）第1項",
        "href": "https://laws.e-gov.go.jp/law/129AC0000000089"
      },
      {
        "name": "借地借家法 第3条（借地権の存続期間）",
        "href": "https://laws.e-gov.go.jp/law/403AC0000000090"
      },
      {
        "name": "借地借家法 第13条（建物買取請求権）第1項",
        "href": "https://laws.e-gov.go.jp/law/403AC0000000090"
      }
    ]
  },
  {
    "id": "G1",
    "axis": "G",
    "question": "加入している保険を確かめ、加入している保険（火災（財物）・事業中断（利益）・賠償責任など）ごとに、保険証券と約款・特約が手元にあり、保険会社・保険金額・免責・満期日と、契約後に保険会社へ通知が要る事項（設備の変更・譲渡など約款で定めたもの）を一覧にしている",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（保険に加入していないと確かめた場合も「はい」）",
    "answerNote": "加入していないと確かめた場合も「はい」（未加入そのものは評価しない）。その場合 G2〜G5 は「該当しない」",
    "why": "保険法第6条第1項は、損害保険契約を結んだ保険者に、保険事故・期間・保険金額・保険の目的物と、契約後の通知義務を定めたときはその旨を書いた書面の交付を義務づけており、契約の中身は約款・特約で決まる（日本損害保険協会の重要事項説明の標準例・家庭用）。上場インフラ投資法人の 1 例（東京インフラ・エネルギー投資法人）は、保険契約などによる保全を投資基準に掲げている。",
    "nextAction": "保険会社・代理店から各保険の証券と約款・特約（Web 約款なら版と URL）を取り寄せ、資産台帳テンプレートの「03_契約」の保険列（保険会社・保険金額・免責・満期日）と「06_書類」（種別「保険証券」）に記録し、約款の通知事項を書き出す",
    "strength": "法令",
    "primary": {
      "name": "保険法（平成二十年法律第五十六号）第6条第1項",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/420AC0000000056",
      "where": "第六条第一項 柱書（各号: 第四号 保険事故・第五号 てん補の対象となる期間・第六号 保険金額・第七号 保険の目的物・第八号 約定保険価額・第十号 第二十九条第一項第一号の通知をすべき旨）",
      "quote": "保険者は、損害保険契約を締結したときは、遅滞なく、保険契約者に対し、次に掲げる事項を記載した書面を交付しなければならない。",
      "siteDefinition": false,
      "docName": "保険法"
    },
    "others": [
      {
        "name": "保険法 第6条第1項第10号",
        "href": "https://laws.e-gov.go.jp/law/420AC0000000056"
      },
      {
        "name": "保険法 第29条第1項第1号（危険増加による解除）",
        "href": "https://laws.e-gov.go.jp/law/420AC0000000056"
      },
      {
        "name": "火災保険 標準例 家庭用火災保険をご契約いただくお客さまへ 重要事項のご説明（日本損害保険協会）",
        "href": "https://www.sonpo.or.jp/about/guideline/keiyaku_guideline/ctuevu0000005hpl-att/kasai2024.pdf"
      },
      {
        "name": "同 標準例（日本損害保険協会・家庭用）",
        "href": "https://www.sonpo.or.jp/about/guideline/keiyaku_guideline/ctuevu0000005hpl-att/kasai2024.pdf"
      },
      {
        "name": "東京インフラ・エネルギー投資法人 有価証券報告書 第12期（EDINET・2024年3月28日提出）",
        "href": "https://disclosure2dl.edinet-fsa.go.jp/searchdocument/pdf/S100T65O.pdf"
      }
    ]
  },
  {
    "id": "G2",
    "axis": "G",
    "question": "電気的・機械的事故（電池・PCS（パワーコンディショナ）・変圧器などの故障）による損害と停止が、財物と事業中断（利益）の補償に入っているか（特約の有無と対象の設備）を、保険証券・特約で確かめた",
    "allowsNotApplicable": true,
    "appliesWhen": "財物（火災保険など）または事業中断（利益）の保険に入っている場合",
    "answerNote": null,
    "why": "事業中断の保険の公開の商品説明に、電気的・機械的事故を特約で補償し、その場合は対象の機械・設備を証券に明記する型がある（三井住友海上・2017年版）。日本損害保険協会の重要事項説明の標準例（家庭用）でも、破損・汚損の補償で電気的・機械的事故（故障）による損害は支払わない場合に挙がっている。",
    "nextAction": "保険証券・特約の一覧で、電気的・機械的事故の補償（特約）の有無と対象の設備の記載を確かめ、分からなければ保険会社・代理店に照会する",
    "strength": "保険会社の公開資料",
    "primary": {
      "name": "企業費用・利益総合保険のご案内（２０１７年１０月１日以降始期契約用）",
      "issuer": "三井住友海上火災保険",
      "href": "https://www.ms-ins.com/pdf/business/cost/kigyo-hiyou.pdf",
      "where": "印刷頁 8（PDF 9 頁）「５．企業費用・利益総合保険の概要②」保険の対象（１）の注。同じ頁の「保険金をお支払いする主な場合」で ⑧電気的事故・機械的事故＝△",
      "quote": "※電気的事故・機械的事故を補償する場合には、その対象となる機械・設備を保険証券に明記する必要があります。",
      "siteDefinition": false,
      "docName": "企業費用・利益総合保険のご案内"
    },
    "others": [
      {
        "name": "同 案内（三井住友海上・2017年版）の凡例",
        "href": "https://www.ms-ins.com/pdf/business/cost/kigyo-hiyou.pdf"
      },
      {
        "name": "火災保険 標準例 重要事項のご説明（日本損害保険協会・家庭用）",
        "href": "https://www.sonpo.or.jp/about/guideline/keiyaku_guideline/ctuevu0000005hpl-att/kasai2024.pdf"
      },
      {
        "name": "東京インフラ・エネルギー投資法人 有価証券報告書 第12期",
        "href": "https://disclosure2dl.edinet-fsa.go.jp/searchdocument/pdf/S100T65O.pdf"
      }
    ]
  },
  {
    "id": "G3",
    "axis": "G",
    "question": "地震・噴火・津波による損害（財物・事業中断）が補償に入っているか（地震危険補償特約などの有無と、入っていれば支払方式・支払限度額）を、保険証券・特約で確かめた",
    "allowsNotApplicable": true,
    "appliesWhen": "財物または事業中断（利益）の保険に入っている場合",
    "answerNote": null,
    "why": "日本損害保険協会は、企業向け火災保険の基本補償では地震・噴火・津波による損害は補償対象外で、補償は地震危険補償特約によると説明している。政府が再保険する地震保険は居住用の建物・生活用動産だけが対象で（地震保険に関する法律 第2条第2項第1号）、事業用の設備は入れない。協会が地震を補償対象外と明記しているのは財物（企業向け火災保険）の基本補償で、事業中断（利益）の扱いは証券・特約で確かめる（協会の事業中断のページに地震の記述は無い）。",
    "nextAction": "保険証券・特約の一覧で、地震危険補償特約（または同等の特約）の有無、支払方式（支払限度額方式・縮小支払方式）、支払限度額を確かめる",
    "strength": "保険会社の公開資料",
    "primary": {
      "name": "企業のための保険ナビ「企業財産のリスク」",
      "issuer": "日本損害保険協会（企業のための保険ナビ）",
      "href": "https://www.sonpo.or.jp/sme_insurance/corporate-property/",
      "where": "「企業財産のリスクに備える保険」企業向け火災保険の説明",
      "quote": "基本補償では、直接間接問わず、地震・噴火・津波によって生じた損害は補償対象外です。",
      "siteDefinition": false,
      "docName": "企業財産のリスク"
    },
    "others": [
      {
        "name": "地震保険に関する法律（昭和四十一年法律第七十三号）第2条第2項第1号",
        "href": "https://laws.e-gov.go.jp/law/341AC0000000073"
      },
      {
        "name": "同ページ（地震危険補償特約の節）",
        "href": "https://www.sonpo.or.jp/sme_insurance/corporate-property/"
      },
      {
        "name": "同ページ（主な補償内容・地震危険補償特約の注）",
        "href": "https://www.sonpo.or.jp/sme_insurance/corporate-property/"
      },
      {
        "name": "東京インフラ・エネルギー投資法人 有価証券報告書 第12期",
        "href": "https://disclosure2dl.edinet-fsa.go.jp/searchdocument/pdf/S100T65O.pdf"
      }
    ]
  },
  {
    "id": "G4",
    "axis": "G",
    "question": "風災・雹（ひょう）災・雪災・水災（洪水・高潮・土砂崩れなど）による損害と停止が、財物と事業中断（利益）の補償に入っているかを、保険証券・特約で確かめた",
    "allowsNotApplicable": true,
    "appliesWhen": "財物または事業中断（利益）の保険に入っている場合",
    "answerNote": null,
    "why": "上場インフラ投資法人の 1 例（東京インフラ・エネルギー投資法人）は、付保方針で火災保険に「風水害、機械的事故を含みます」と明記している。事業中断の保険の公開の商品説明では水災が「特約をセットする場合に補償」の区分にあり（三井住友海上・2017年版）、日本損害保険協会も補償内容は各社で異なるとしている。",
    "nextAction": "保険証券・特約の一覧で、風災・雹災・雪災・水災それぞれの補償の有無（水災が特約かどうか）と支払の条件を確かめる",
    "strength": "公開の融資・投資資料",
    "primary": {
      "name": "有価証券報告書（内国投資証券）第12期（自2023年7月1日 至2023年12月31日）",
      "issuer": "東京インフラ・エネルギー投資法人（EDINET）",
      "href": "https://disclosure2dl.edinet-fsa.go.jp/searchdocument/pdf/S100T65O.pdf",
      "where": "（チ）付保方針（PDF 66 頁／364）",
      "quote": "災害の事故等による発電設備等の損害又は第三者への損害賠償を担保するため、運用資産について火災保険（風水害、機械的事故を含みます。）、賠償責任保険を付保します。",
      "siteDefinition": false,
      "docName": "有価証券報告書（内国投資証券）第12期"
    },
    "others": [
      {
        "name": "企業費用・利益総合保険のご案内（三井住友海上・2017年版）",
        "href": "https://www.ms-ins.com/pdf/business/cost/kigyo-hiyou.pdf"
      },
      {
        "name": "企業のための保険ナビ「企業財産のリスク」（日本損害保険協会）",
        "href": "https://www.sonpo.or.jp/sme_insurance/corporate-property/"
      },
      {
        "name": "企業のための保険ナビ「事業中断・利益減少のリスク」（日本損害保険協会）",
        "href": "https://www.sonpo.or.jp/sme_insurance/business-interruption/"
      },
      {
        "name": "火災保険 標準例 重要事項のご説明（日本損害保険協会・家庭用）",
        "href": "https://www.sonpo.or.jp/about/guideline/keiyaku_guideline/ctuevu0000005hpl-att/kasai2024.pdf"
      }
    ]
  },
  {
    "id": "G5",
    "axis": "G",
    "question": "事業中断（利益）保険の証券・約款から、補償期間（てん補期間）・免責時間（待機期間）と、保険金の算定の基になる収益の定義（需給調整市場・容量市場・卸電力取引など蓄電所の収益が含まれるか）を書き出している",
    "allowsNotApplicable": true,
    "appliesWhen": "事業中断（利益）保険に入っている場合",
    "answerNote": null,
    "why": "事業中断の保険では、事故の種類ごとの免責時間と、支払の対象になる期間（補償期間）の上限を契約で決める例がある（三井住友海上・2017年版）。収益の定義も契約で決まり、一般の休業補償（主契約）では太陽光発電の売電収入を補償対象外として別の補償で扱う商品がある（東京海上日動）。",
    "nextAction": "証券・約款から補償期間・免責時間・収益の定義を書き出して資産台帳「03_契約」の「事業中断（利益）保険 免責」列に記録し、蓄電所の収益が含まれるか分からなければ保険会社・代理店に照会する",
    "strength": "保険会社の公開資料",
    "primary": {
      "name": "企業費用・利益総合保険のご案内（２０１７年１０月１日以降始期契約用）",
      "issuer": "三井住友海上火災保険",
      "href": "https://www.ms-ins.com/pdf/business/cost/kigyo-hiyou.pdf",
      "where": "印刷頁 11（PDF 12 頁）「５．企業費用・利益総合保険の概要④」免責時間の設定",
      "quote": "利益条項では、事故の種類ごとに免責時間（事故発生の日の午前０時から保険上の損失補償が開始されるまでの時間）を設定していただきます。",
      "siteDefinition": false,
      "docName": "企業費用・利益総合保険のご案内"
    },
    "others": [
      {
        "name": "同 案内（三井住友海上・2017年版）",
        "href": "https://www.ms-ins.com/pdf/business/cost/kigyo-hiyou.pdf"
      },
      {
        "name": "利益保険の基本（Chubb）",
        "href": "https://www.chubb.com/jp-jp/resources2021/business-interruption-insurance-coverage-basics.html"
      },
      {
        "name": "超ビジネス保険「休業に関する補償 お支払いする主な保険金と算出方法」（東京海上日動）",
        "href": "https://www.tokiomarine-nichido.co.jp/hojin/jigyo/cho_business/hosho/kyugyo_tokucho04.html"
      }
    ]
  },
  {
    "id": "H1",
    "axis": "H",
    "question": "発電事業の届出（電気事業法第27条の27）が要るかを、施行規則第3条の4の要件で確かめた。要る場合は、発電事業届出書と、電力広域的運営推進機関（OCCTO）の加入届出書・毎年度の供給計画届出書の控えが手元にある",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（要否の確認）。控えは、施行規則第3条の4の要件（出力1,000kW以上などをすべて満たす設備で、小売電気事業等に使う接続最大電力の合計が1万kW超）に当たり届出が要る場合だけ",
    "answerNote": "届出が要らないと確かめた場合も「はい」",
    "why": "発電事業には放電する事業も入り（法第2条第1項第14号）、施行規則第3条の4の要件（出力1,000kW以上・出力に占める小売電気事業等向けの接続最大電力が5割超・放電量に占める小売電気事業等向けが5割超の見込み、をすべて満たす設備で、その接続最大電力の合計が1万kW超）に当たれば届出が義務になる。届け出た発電事業者は電気事業者として、推進機関への加入（第28条の11）と毎年度の供給計画の届出（第29条）の義務も負う。",
    "nextAction": "資源エネルギー庁「発電事業について」p.3 の要件①〜③で要否を確かめ、要なら同 p.4 の表の届出書（発電事業届出書・広域的運営推進機関加入届出書・供給計画届出書）の控えを揃える",
    "strength": "法令",
    "primary": {
      "name": "電気事業法（昭和三十九年法律第百七十号）第27条の27第1項",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/339AC0000000170",
      "where": "第二十七条の二十七（事業の届出）第一項 柱書（第三号ロに蓄電用の設置の場所・周波数・出力・容量）",
      "quote": "発電事業を営もうとする者は、経済産業省令で定めるところにより、次に掲げる事項を経済産業大臣に届け出なければならない。",
      "siteDefinition": false,
      "docName": "電気事業法"
    },
    "others": [
      {
        "name": "電気事業法 第2条第1項第14号（発電事業の定義）",
        "href": "https://laws.e-gov.go.jp/law/339AC0000000170"
      },
      {
        "name": "電気事業法施行規則 第3条の4第1項",
        "href": "https://laws.e-gov.go.jp/law/407M50000400077"
      },
      {
        "name": "資源エネルギー庁「発電事業について」（令和５年５月）",
        "href": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electricity_measures/004/pdf/hatsuden.pdf"
      },
      {
        "name": "電気事業法 第29条第1項（供給計画）",
        "href": "https://laws.e-gov.go.jp/law/339AC0000000170"
      },
      {
        "name": "電気事業法 第28条の11第1項（加入義務）",
        "href": "https://laws.e-gov.go.jp/law/339AC0000000170"
      }
    ]
  },
  {
    "id": "H3",
    "axis": "H",
    "question": "自社の蓄電所の電気を集めて市場などへ供給しているアグリゲーターについて、資源エネルギー庁の「特定卸供給事業者一覧」に載っているかを確かめた（自社が届け出ている場合は、その控えが手元にある）",
    "allowsNotApplicable": true,
    "appliesWhen": "アグリゲーターが自社の蓄電所の電気を集めて供給している場合で、自社が発電事業者（電気事業法第27条の27 の届出をした者）でない場合。自社が発電事業者なら、その蓄電所からの集約は特定卸供給の定義（法第2条第1項第15号の2「発電事業者を除く」）に当たらないので該当なし",
    "answerNote": null,
    "why": "電気事業法は、他の者（発電事業者を除く）から集約する電力が1,000kW（キロワット）を超える見込みの特定卸供給事業に経済産業大臣への届出を求め（第27条の30・施行規則第3条の4の3）、届出の受理から30日を経過するまで事業を始められないとしている（同条第3項）。資源エネルギー庁は届出をした事業者の一覧を名称と法人番号つきで公表している。",
    "nextAction": "資源エネルギー庁「特定卸供給事業者一覧」で、契約しているアグリゲーターの名称と法人番号を探す",
    "strength": "法令",
    "primary": {
      "name": "電気事業法 第27条の30（事業の届出）第1項",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/339AC0000000170",
      "where": "第二十七条の三十 第一項柱書（第三項＝受理から30日）",
      "quote": "特定卸供給事業を営もうとする者は、経済産業省令で定めるところにより、次に掲げる事項を経済産業大臣に届け出なければならない。",
      "siteDefinition": false,
      "docName": "電気事業法"
    },
    "others": [
      {
        "name": "電気事業法 第2条第1項第15号の2（特定卸供給の定義）",
        "href": "https://laws.e-gov.go.jp/law/339AC0000000170"
      },
      {
        "name": "電気事業法施行規則 第3条の4の3（特定卸供給事業に係る供給能力の要件）",
        "href": "https://laws.e-gov.go.jp/law/407M50000400077"
      },
      {
        "name": "資源エネルギー庁 特定卸供給事業にかかる届出義務について（最終更新日：2026年10月8日）",
        "href": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electricity_measures/009/009.html"
      },
      {
        "name": "資源エネルギー庁 特定卸供給事業者一覧",
        "href": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electricity_measures/009/list/aguri-list.html"
      },
      {
        "name": "資源エネルギー庁 特定卸供給事業 Q&A No.3（ライセンス要件）",
        "href": "https://www.enecho.meti.go.jp/category/electricity_and_gas/electricity_measures/009/shiryou/pdf/20220315QA.pdf"
      }
    ]
  },
  {
    "id": "H4",
    "axis": "H",
    "question": "保安規程（電気事業法第42条）の本文と、使用開始前に届け出た控え（変更したときは変更の届出の控えも）が手元にある",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（蓄電所（専ら電力の貯蔵を目的とする蓄電用の電気工作物）は出力・容量にかかわらず。発電所・需要設備などに附属する電力貯蔵装置は、附属先の設備全体として扱われる（経済産業省の手引き①））",
    "answerNote": null,
    "why": "事業用電気工作物を設置する者は、保安規程を定めて使用開始前に届け出、変更したときも届け出る義務がある（法第42条第1項・第2項）。経済産業省の手引きの表は、蓄電所の保安規程の届出を出力・容量にかかわらず「要」としている。",
    "nextAction": "保安規程の本文と届出（変更の届出を含む）の控えを揃える。無ければ所在地の産業保安監督部 電力安全課（経済産業省の手引きの「お問合せ先」）に手続を確かめる",
    "strength": "法令",
    "primary": {
      "name": "電気事業法 第42条第1項（保安規程）",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/339AC0000000170",
      "where": "第四十二条第一項（小規模事業用電気工作物を除く）",
      "quote": "保安規程を定め、当該組織における事業用電気工作物の使用（第五十一条第一項又は第五十二条第一項の自主検査を伴うものにあつては、その工事）の開始前に、主務大臣に届け出なければならない。",
      "siteDefinition": false,
      "docName": "電気事業法"
    },
    "others": [
      {
        "name": "電気事業法 第42条第2項",
        "href": "https://laws.e-gov.go.jp/law/339AC0000000170"
      },
      {
        "name": "経済産業省「電力貯蔵装置（蓄電池）・蓄電所を設置する場合の手引き」",
        "href": "https://www.meti.go.jp/policy/safety_security/industrial_safety/sangyo/electric/detail/denryokucyozousouchi.html"
      },
      {
        "name": "電気事業法施行規則 第50条第3項第5号",
        "href": "https://laws.e-gov.go.jp/law/407M50000400077"
      },
      {
        "name": "同 手引き「お問合せ先」",
        "href": "https://www.meti.go.jp/policy/safety_security/industrial_safety/sangyo/electric/detail/denryokucyozousouchi.html"
      }
    ]
  },
  {
    "id": "H5",
    "axis": "H",
    "question": "工事計画の届出（電気事業法第48条）が要る規模か（出力1万kW以上または容量8万kWh以上の蓄電所か）を確かめた。要る場合は、工事計画（変更）届出書の控えと、使用前自主検査の記録・使用前安全管理審査の結果の通知（同法第51条）の写しが手元にある",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（規模の確認）。控え・記録は、出力1万kW以上または容量8万kWh以上の蓄電所の設置と、その規模の電力貯蔵装置の出力・容量を20%以上変える改造など（施行規則 別表第二 蓄電所の欄）の場合だけ",
    "answerNote": "工事計画の届出が要る規模に当たらないと確かめた場合も「はい」",
    "why": "施行規則の別表第二は、出力1万kW以上または容量8万kWh以上の蓄電所の設置を工事計画の事前届出が要る工事に挙げ、届出が受理されて30日を過ぎるまで工事を始められない（法第48条第2項）。この規模の蓄電所は、使用開始前に自主検査を行って結果を記録・保存し、その実施体制の審査と評定の結果が通知される（法第51条第1項・第7項、施行規則第73条の2の2第1項第5号）。",
    "nextAction": "経済産業省「電力貯蔵装置（蓄電池）・蓄電所を設置する場合の手引き」の表で規模の区分を確かめ、要なら設置者（EPC・前の所有者を含む）から工事計画（変更）届出書（様式第四十九）の控え・使用前自主検査の記録・審査の結果の通知の写しを受け取る",
    "strength": "法令",
    "primary": {
      "name": "電気事業法 第48条第1項（工事計画の事前届出）",
      "issuer": "e-Gov 法令検索",
      "href": "https://laws.e-gov.go.jp/law/339AC0000000170",
      "where": "第四十八条第一項 前段",
      "quote": "事業用電気工作物の設置又は変更の工事（前条第一項の主務省令で定めるものを除く。）であつて、主務省令で定めるものをしようとする者は、その工事の計画を主務大臣に届け出なければならない。",
      "siteDefinition": false,
      "docName": "電気事業法"
    },
    "others": [
      {
        "name": "電気事業法施行規則 別表第二（第六十二条・第六十五条関係）",
        "href": "https://laws.e-gov.go.jp/law/407M50000400077"
      },
      {
        "name": "電気事業法 第48条第2項",
        "href": "https://laws.e-gov.go.jp/law/339AC0000000170"
      },
      {
        "name": "電気事業法 第51条第1項（使用前安全管理検査）",
        "href": "https://laws.e-gov.go.jp/law/339AC0000000170"
      },
      {
        "name": "電気事業法 第51条第7項",
        "href": "https://laws.e-gov.go.jp/law/339AC0000000170"
      },
      {
        "name": "電気事業法施行規則 第73条の2の2第1項第5号",
        "href": "https://laws.e-gov.go.jp/law/407M50000400077"
      },
      {
        "name": "電気事業法施行規則 第73条の5第1項（使用前自主検査の結果の記録）",
        "href": "https://laws.e-gov.go.jp/law/407M50000400077"
      },
      {
        "name": "電気事業法施行規則 第66条第1項",
        "href": "https://laws.e-gov.go.jp/law/407M50000400077"
      },
      {
        "name": "経済産業省「電力貯蔵装置（蓄電池）・蓄電所を設置する場合の手引き」",
        "href": "https://www.meti.go.jp/policy/safety_security/industrial_safety/sangyo/electric/detail/denryokucyozousouchi.html"
      },
      {
        "name": "同 手引き ①電力貯蔵装置（蓄電池）",
        "href": "https://www.meti.go.jp/policy/safety_security/industrial_safety/sangyo/electric/detail/denryokucyozousouchi.html"
      }
    ]
  },
  {
    "id": "H8",
    "axis": "H",
    "question": "所在の市町村に、系統用蓄電池（蓄電所）の設置に関する条例・要綱・ガイドラインがあるかを確かめた。ある場合は、それが求める届出（事業計画・工事着手・運用開始・地位を承継したときの変更届など）の控えが手元にある",
    "allowsNotApplicable": false,
    "appliesWhen": "全サイト（定めが無い市町村なら、確かめた時点で「はい」）",
    "answerNote": null,
    "why": "浜松市の要綱は、特定蓄電事業者に事業計画（第6条）・工事着手（第8条）・設置完了（第9条）・運用開始（第10条）などの届出を求め、売買などで地位を承継した者にも届出または変更届を求めている（第6条第4項・第8条第3項と第4項・第10条第2項）。福島市のガイドラインも、計画立案から廃止までの各段階で届出を求めている。",
    "nextAction": "市町村のホームページや担当課で系統用蓄電池の設置に関する条例・要綱・ガイドラインの有無を確かめ、あれば求められた届出の控えを揃える",
    "strength": "官公庁の資料",
    "primary": {
      "name": "浜松市適正な蓄電池設備の設置等に関する要綱 第6条第1項（事業計画の届出）",
      "issuer": "浜松市",
      "href": "https://www.city.hamamatsu.shizuoka.jp/documents/13411/youkou.pdf",
      "where": "第６条第１項（PDF 2 頁）。附則 1「この要綱は、令和７年１２月１日から施行する。」（PDF 5 頁）",
      "quote": "特定蓄電事業者は、市内において特定蓄電池設備の設置に関する事業を開始しようとするときは、第７条に規定する近隣関係者への説明等を行う前までに",
      "siteDefinition": false,
      "docName": "浜松市適正な蓄電池設備の設置等に関する要綱"
    },
    "others": [
      {
        "name": "同 要綱 第6条第4項（承継）",
        "href": "https://www.city.hamamatsu.shizuoka.jp/documents/13411/youkou.pdf"
      },
      {
        "name": "同 要綱 第10条第2項（運用開始の届出事項の変更）",
        "href": "https://www.city.hamamatsu.shizuoka.jp/documents/13411/youkou.pdf"
      },
      {
        "name": "同 要綱 附則 4（既に事業を実施している事業者）",
        "href": "https://www.city.hamamatsu.shizuoka.jp/documents/13411/youkou.pdf"
      },
      {
        "name": "福島市系統用蓄電池設備に関するガイドラインの概要",
        "href": "https://www.city.fukushima.fukushima.jp/material/files/group/22/guidegaiyou.pdf"
      }
    ]
  }
];
