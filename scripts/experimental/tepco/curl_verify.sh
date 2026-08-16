#!/bin/bash
# Phase 2c deploy後 curl検証: Vercelデプロイ完了を待ってから本番を確認。
UA="Mozilla/5.0"
BASE="https://bess-net.jp"

echo "=== Vercelデプロイ完了待ち（/grid に 8,225 が出るまで、最大15分）==="
for i in $(seq 1 90); do
  body=$(curl -s -A "$UA" "$BASE/grid" 2>/dev/null)
  if echo "$body" | grep -q "8,225"; then
    echo "デプロイ完了を検知（${i}回目のポーリング）"
    break
  fi
  sleep 10
done

echo ""
echo "=== 1. /grid トップ ==="
g=$(curl -s -A "$UA" "$BASE/grid")
echo "  10送配電: $(echo "$g" | grep -oE '10送配電事業者' | head -1)"
echo "  総件数8,225: $(echo "$g" | grep -oE '8,225' | head -1)"
echo "  10/10カード: $(echo "$g" | grep -oE '10 / 10' | head -1)"
echo "  旧6,507残存: $(echo "$g" | grep -oE '6,507' | head -1) (空ならOK)"

echo ""
echo "=== 2. /grid/tokyo（エリアデータページ）==="
t=$(curl -s -A "$UA" "$BASE/grid/tokyo")
echo "  HTTP: $(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/grid/tokyo")"
echo "  エリア見出し: $(echo "$t" | grep -oE '東京エリア｜系統空き容量' | head -1)"
echo "  変電所数表示: $(echo "$t" | grep -oE '管内の[0-9,]+変電所' | head -1)"
echo "  都道府県別: $(echo "$t" | grep -oE '都道府県別ブレークダウン' | head -1)"
echo "  status導線: $(echo "$t" | grep -oE '/grid/tokyo/status' | head -1)"

echo ""
echo "=== 3. /grid/tokyo/status（経緯・404でないこと）==="
echo "  HTTP: $(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/grid/tokyo/status")"

echo ""
echo "=== 4. /grid/prefecture/東京都（件数）==="
echo "  HTTP: $(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/grid/prefecture/%E6%9D%B1%E4%BA%AC%E9%83%BD")"

echo ""
echo "=== 5. 衝突4県（他社＋TEPCO混在、200であること）==="
for penc in "%E9%9D%99%E5%B2%A1%E7%9C%8C:静岡県" "%E7%A6%8F%E5%B3%B6%E7%9C%8C:福島県" "%E9%95%B7%E9%87%8E%E7%9C%8C:長野県" "%E6%96%B0%E6%BD%9F%E7%9C%8C:新潟県"; do
  enc="${penc%%:*}"; nm="${penc##*:}"
  echo "  ${nm}: $(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/grid/prefecture/${enc}")"
done

echo ""
echo "=== 6. 既存個別変電所URL（404になっていないこと）==="
for slug in cb-2001 kyu-879 hkd-1; do
  echo "  /grid/${slug}: $(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/grid/${slug}")"
done

echo ""
echo "=== 7. 新規TEPCO個別変電所URL（ISR生成）==="
for slug in tpg-0001 tpg-1316; do
  echo "  /grid/${slug}: $(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/grid/${slug}")"
done

echo ""
echo "=== 8. 既存エリアページ（不変・200）==="
for a in chubu kansai hokkaido kyushu; do
  echo "  /grid/${a}: $(curl -s -o /dev/null -w '%{http_code}' -A "$UA" "$BASE/grid/${a}")"
done
echo ""
echo "=== curl検証 完了 ==="
