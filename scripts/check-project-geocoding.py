#!/usr/bin/env python3
"""
依頼AA前段: projects 緯度経度成功率調査

- microCMS から全 269 projects を取得
- prefecture / city フィールドから住所構築
- Nominatim (OSM) で geocoding
- 1 req/sec rate limit 遵守
- 結果集計してレポート出力

実行:
  MICROCMS_API_KEY=xxx MICROCMS_SERVICE_DOMAIN=bess-net python3 scripts/check-project-geocoding.py
"""

import os
import re
import sys
import time
import json
import urllib.parse
import urllib.request

API_KEY = os.environ.get('MICROCMS_API_KEY')
SERVICE_DOMAIN = os.environ.get('MICROCMS_SERVICE_DOMAIN')
if not API_KEY or not SERVICE_DOMAIN:
    print('ERROR: MICROCMS_API_KEY and MICROCMS_SERVICE_DOMAIN required', file=sys.stderr)
    sys.exit(1)

BASE = f'https://{SERVICE_DOMAIN}.microcms.io/api/v1/projects'
NOMINATIM = 'https://nominatim.openstreetmap.org/search'
# Nominatim policy: identify yourself, rate-limit 1 req/sec
USER_AGENT = 'bess-net-research/1.0 (kenji.eda@gmail.com)'


def fetch_all_projects():
    """全 projects (paginated) を取得"""
    out = []
    limit = 100
    offset = 0
    while True:
        url = f'{BASE}?limit={limit}&offset={offset}&fields=slug,name,prefecture,city,operator'
        req = urllib.request.Request(url, headers={'X-MICROCMS-API-KEY': API_KEY})
        with urllib.request.urlopen(req) as r:
            d = json.loads(r.read().decode('utf-8'))
        contents = d.get('contents', [])
        out.extend(contents)
        if len(contents) < limit:
            break
        offset += limit
    return out


def looks_like_address(s):
    """文字列が住所っぽいか判定。市/区/町/村 を含み、説明文っぽい記号を含まない"""
    if not s or not isinstance(s, str):
        return False
    s = s.strip()
    if len(s) > 60:  # 住所として長すぎる → 説明文の可能性
        return False
    # 説明文によくある記号で除外
    if any(c in s for c in '【】「」（）()『』〜～:：MWh%・'):
        return False
    # 数字だらけは弾く
    if re.match(r'^\d+', s):
        return False
    # 市・区・町・村・郡 を含めば住所
    if any(suffix in s for suffix in ['市', '区', '町', '村', '郡', '都', '府', '県']):
        return True
    return False


def build_address(project):
    """project から住所文字列を構築。Returns (address, source)"""
    pref = (project.get('prefecture') or '').strip()
    city = (project.get('city') or '').strip()
    # city が住所っぽければ city 優先（既に prefecture を含むことが多い）
    if looks_like_address(city):
        if pref and not city.startswith(pref):
            return (f'{pref} {city}', 'pref+city')
        return (city, 'city')
    # prefecture のみ
    if pref:
        return (pref, 'pref-only')
    return ('', 'none')


def geocode(address):
    """Nominatim で geocoding。Returns (lat, lng) or None"""
    q = urllib.parse.urlencode({
        'q': address,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'jp',
    })
    url = f'{NOMINATIM}?{q}'
    req = urllib.request.Request(url, headers={'User-Agent': USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read().decode('utf-8'))
        if not data:
            return None
        first = data[0]
        return (float(first['lat']), float(first['lon']))
    except Exception:
        return None


def classify_failure(project, address, addr_source):
    """失敗ケースを分類"""
    if addr_source == 'none':
        return 'no-address'
    if addr_source == 'pref-only':
        return 'prefecture-only'
    if not looks_like_address(project.get('city') or ''):
        return 'city-is-description'  # city フィールドが説明文
    # それ以外
    return 'geocoding-failed'


def main():
    print('[1/3] Fetching all projects from microCMS...', file=sys.stderr)
    projects = fetch_all_projects()
    print(f'  Got {len(projects)} projects', file=sys.stderr)

    results = []
    print(f'[2/3] Geocoding {len(projects)} projects (~{len(projects)} sec at 1 req/sec)...', file=sys.stderr)
    last_call = 0.0
    for i, p in enumerate(projects):
        address, source = build_address(p)
        result = {
            'slug': p.get('slug'),
            'name': p.get('name'),
            'prefecture': p.get('prefecture'),
            'city': p.get('city'),
            'operator': p.get('operator'),
            'address': address,
            'addr_source': source,
            'status': 'pending',
            'lat': None,
            'lng': None,
            'failure_category': None,
        }
        if source == 'none':
            result['status'] = 'failed'
            result['failure_category'] = 'no-address'
        else:
            # rate limit
            elapsed = time.time() - last_call
            if elapsed < 1.05:
                time.sleep(1.05 - elapsed)
            last_call = time.time()
            geo = geocode(address)
            if geo:
                result['status'] = 'ok'
                result['lat'] = geo[0]
                result['lng'] = geo[1]
            else:
                result['status'] = 'failed'
                result['failure_category'] = classify_failure(p, address, source)
        results.append(result)
        if (i + 1) % 20 == 0:
            ok_so_far = sum(1 for r in results if r['status'] == 'ok')
            print(f'  ... {i+1}/{len(projects)} (ok={ok_so_far})', file=sys.stderr)

    print(f'[3/3] Aggregating results...', file=sys.stderr)

    ok = [r for r in results if r['status'] == 'ok']
    failed = [r for r in results if r['status'] == 'failed']

    print(f'\nTotal: {len(results)}', file=sys.stderr)
    print(f'  ok: {len(ok)}', file=sys.stderr)
    print(f'  failed: {len(failed)}', file=sys.stderr)
    print(f'  success rate: {len(ok)/len(results)*100:.1f}%', file=sys.stderr)

    # write JSON output for further processing
    with open('scripts/geocoding-results.json', 'w', encoding='utf-8') as f:
        json.dump({
            'total': len(results),
            'ok': len(ok),
            'failed': len(failed),
            'success_rate_pct': round(len(ok)/len(results)*100, 1),
            'results': results,
        }, f, ensure_ascii=False, indent=2)
    print(f'\nDetails written to scripts/geocoding-results.json', file=sys.stderr)


if __name__ == '__main__':
    main()
