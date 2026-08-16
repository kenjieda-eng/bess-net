#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
agora(Electrical Japan) 蓄電43件 × /projects 突合（読み取り専用・microCMS書き込み0）。
入力: tmp/projects-raw.json（getAllProjects 1スキャン）。候補スコアリングを出力し、人手で4分類。
"""
import json, re, sys, unicodedata
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

proj = json.load(open("tmp/projects-raw.json", encoding="utf-8"))

# 301元→canonical（src/lib/projects-301.ts と同一）
P301 = {
  'pr-co76147-bess':'osakagas-suita','pr-co139670-bess':'osakagas-suita',
  'pr-co173175-saitama-5mwh':'kaminara-bess','pr-co85927-bess-2':'pr-co18049-bess',
  'gunma-ota':'ota-bess','pr-2mw-4mwh-bess-3':'pr-2mw-4mwh-bess-2',
}
EXCLUDED = {'pr-50-cxo-2-bess','pr-iqg-second-foundation-bess','pr-co134284-bess','pr-co175281-bess-2',
  'pr-co138114-bess-2','pr-jaxa-where-bess','pr-co109041-bess-2','pr-100mw-bess'}

# agora 43件: (name, operator, MW)
AGORA = [
 ("北豊富変電所蓄電池設備","北海道北部風力送電",240),("室蘭事業所系統用蓄電池","ENEOS Power",50),
 ("しんかわ蓄電所","合同会社DAX",50),("紀の川蓄電所","紀の川蓄電所合同会社",48),
 ("田川蓄電所","ヘキサ・エネルギーサービス合同会社",29.97),("姫路蓄電所","合同会社姫路蓄電所",15),
 ("遠野松崎蓄電所","J&A Energy合同会社",14.5),("松山蓄電所","松山みかんエナジー合同会社",12),
 ("宮古第二発電所供給用蓄電池","沖縄電力",12),("津蓄電所","東邦ガス",11.4),
 ("千里蓄電所","千里蓄電所株式会社",11),("仙台パワーステーション系統用蓄電所","関電エネルギーソリューション",10.7),
 ("EVバッテリー・ステーション千歳","住友商事",6),("テラスエナジー長崎香焼エナジーストレージ","テラスエナジー",2),
 ("小金井蓄電池プロジェクト","パシフィコ・エナジー",2),("群馬伊勢崎第一蓄電所","ポート",2),
 ("群馬大田蓄電所","ポート",2),("足利市堀込町字中島蓄電システム","上州太田蓄電所合同会社",2),
 ("太田市新田赤堀町蓄電システム","上州太田蓄電所合同会社",2),("太田市亀岡町蓄電システム","上州太田蓄電所合同会社",2),
 ("第一系統用蓄電所","中川商事",2),("三峰川伊那蓄電所","丸紅新電力",2),
 ("嬬恋蓄電所","嬬恋蓄電所合同会社",2),("小角田蓄電所","株式会社城洋",2),
 ("境野蓄電所","株式会社城洋商事",2),("武雄蓄電所","武雄蓄電所合同会社",2),
 ("小山蓄電所","auリニューアブルエナジー",1.999),("相模原蓄電所","東急建設",1.999),
 ("千葉君津蓄電所","クリハラント",1.999),("JAPEX美浜蓄電所","石油資源開発",1.999),
 ("OLYPowerstorage緑町","オリンピア",1.998),("OLYPowerstorage三室町","オリンピア",1.998),
 ("韮塚蓄電所","坂東蓄電所1号合同会社",1.96),("小角田蓄電所","坂東蓄電所1号合同会社",1.96),
 ("弥藤吾蓄電所","坂東蓄電所1号合同会社",1.96),("ノーバル・パワーC2","合同会社ノーバル・ソーラー",1.9272),
 ("ノーバル・パワーC3","合同会社ノーバル・ソーラー",1.9272),("西鉄自然電力バッテリーハブ宇美","西鉄自然電力合同会社",1.92),
 ("リエネ東松山蓄電所","東急不動産",1.799),("ユーラス白鳥バッテリーパーク","ユーラスエナジーホールディングス",1.5),
 ("田川蓄電所","NTTアノードエナジー／九州電力／三菱商事",1.4),("大牟田蓄電所","NExT-e Solutions",1),
 ("系統用蓄電所","シナネン",1),
]

GENERIC = ['系統用蓄電所','系統用蓄電池','蓄電システム','蓄電設備','蓄電池設備','供給用蓄電池','エナジーストレージ',
 'エネルギーストレージ','バッテリーパーク','バッテリーハブ','蓄電所','蓄電池','発電所','変電所','事業所','系統用',
 'プロジェクト','ステーション','設備','株式会社','合同会社','有限会社','（株）','(株)']
def norm(s):
    s = unicodedata.normalize('NFKC', s or '')
    return re.sub(r'\s+','', s).lower()
def core(s):
    s = unicodedata.normalize('NFKC', s or '')
    s = re.sub(r'[（(][^（）()]*[)）]', '', s)  # 括弧（事業者名等）を除去
    for g in GENERIC: s = s.replace(g,'')
    return re.sub(r'[\s・,，、/／「」]','', s)
def op_core(s):
    s = unicodedata.normalize('NFKC', s or '')
    for g in ['株式会社','合同会社','有限会社','（株）','(株)','ホールディングス','グループ','合同会社']:
        s = s.replace(g,'')
    return re.sub(r'\s','', s)

def score(ag_name, ag_op, ag_mw, p):
    pn = p['name'] or ''; po = p['operator'] or ''; pmw = p.get('outputMw') or 0
    s = 0.0; why=[]
    acn, pcn = core(ag_name), core(pn)
    # 名称コアの相互部分一致
    if acn and pcn:
        if acn==pcn: s+=5; why.append('名核一致')
        elif acn in pcn or pcn in acn: s+=3.5; why.append('名核部分一致')
        else:
            # 文字bigram overlap
            ab=set(acn[i:i+2] for i in range(len(acn)-1)); pb=set(pcn[i:i+2] for i in range(len(pcn)-1))
            if ab and pb:
                ov=len(ab&pb)/max(1,min(len(ab),len(pb)))
                if ov>=0.5: s+=2*ov; why.append(f'名bigram{ov:.0%}')
    # MW近似
    if ag_mw and pmw:
        d=abs(ag_mw-pmw)/max(ag_mw,pmw)
        if d<=0.05: s+=2; why.append(f'MW一致({pmw})')
        elif d<=0.2: s+=1; why.append(f'MW近({pmw})')
    elif ag_mw and not pmw: why.append('bess-MW=0/欠')
    # 事業者ヒント
    aoc,poc=op_core(ag_op),op_core(po)
    if aoc and poc and (aoc in poc or poc in aoc or aoc==poc): s+=2; why.append('事業者一致')
    elif aoc and poc:
        ab=set(aoc[i:i+2] for i in range(len(aoc)-1)); pb=set(poc[i:i+2] for i in range(len(poc)-1))
        if ab and pb and len(ab&pb)/max(1,min(len(ab),len(pb)))>=0.5: s+=1; why.append('事業者近似')
    return s, why

def canon(slug):
    return P301.get(slug, slug)

print(f"projects={len(proj)} agora={len(AGORA)}\n")
for i,(an,ao,amw) in enumerate(AGORA,1):
    cands=[]
    for p in proj:
        sc,why=score(an,ao,amw,p)
        if sc>0: cands.append((sc,p,why))
    cands.sort(key=lambda x:-x[0])
    print(f"[{i:2d}] agora「{an}」/ {ao} / {amw}MW")
    if not cands or cands[0][0]<2.5:
        print("     → 候補なし（未掲載 候補）")
    for sc,p,why in cands[:3]:
        cslug=canon(p['slug']); tag=''
        if p['slug'] in P301: tag=f' [301→{cslug}]'
        if p['slug'] in EXCLUDED: tag=' [除外8]'
        print(f"     ◇{sc:.1f} {p['slug']}{tag} 「{p['name']}」 op={p['operator']} MW={p.get('outputMw')} MWh={p.get('capacityMwh')} pref={p.get('prefecture')} | {','.join(why)}")
    print()
