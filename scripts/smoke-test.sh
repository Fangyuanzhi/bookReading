#!/usr/bin/env bash
# 陪读 API 冒烟联调（覆盖 M1–M3 主链路）
set -euo pipefail

API="${API_BASE:-http://localhost:8080/api/v1}"
PASS="TestPass1"
EMAIL="smoke-$(date +%s)@example.com"
USER="smoke$(date +%s | tail -c 6)"

red() { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }
step() { printf '\n▶ %s\n' "$*"; }

json_field() {
  python3 -c "import json,sys; d=json.load(sys.stdin); print(d$1)" 2>/dev/null
}

require_health() {
  step "健康检查"
  curl -sf http://localhost:8080/health >/dev/null || { red "后端未启动，先运行: bash scripts/dev-up.sh"; exit 1; }
  green "  /health OK"
}

register_and_login() {
  step "注册 + 登录"
  REG=$(curl -sf -X POST "$API/auth/register" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASS\",\"username\":\"$USER\",\"display_name\":\"联调用户\"}")
  TOKEN=$(echo "$REG" | json_field "['data']['token']")
  [ -n "$TOKEN" ] || { red "  注册失败: $REG"; exit 1; }
  green "  注册 OK ($EMAIL)"

  ME=$(curl -sf "$API/auth/me" -H "Authorization: Bearer $TOKEN")
  USER_ID=$(echo "$ME" | json_field "['data']['id']")
  green "  /auth/me OK (user=$USER_ID)"
}

test_books_and_reading() {
  step "书库 + 阅读"
  BOOKS=$(curl -sf "$API/books?page=1&page_size=5")
  TOTAL=$(echo "$BOOKS" | json_field "['data']['total'] // 0" || echo 0)
  green "  书库 total=$TOTAL"

  if [ "$TOTAL" = "0" ] || [ -z "$TOTAL" ]; then
    echo "  (书库为空，跳过阅读测试；可用上传或 scripts/update-book.py 导入)"
    return
  fi

  BOOK_ID=$(echo "$BOOKS" | json_field "['data']['items'][0]['id']")
  CHAPTERS=$(curl -sf "$API/books/$BOOK_ID/chapters")
  CH_ID=$(echo "$CHAPTERS" | json_field "['data']['items'][0]['id']" || echo "")
  if [ -n "$CH_ID" ] && [ "$CH_ID" != "None" ]; then
    curl -sf "$API/chapters/$CH_ID" -H "Authorization: Bearer $TOKEN" >/dev/null
    green "  章节阅读 OK"
    curl -sf -X PUT "$API/books/$BOOK_ID/progress" \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{\"chapter_id\":\"$CH_ID\",\"paragraph_index\":0}" >/dev/null
    green "  进度保存 OK"
  fi
}

test_ugc() {
  step "UGC 创作"
  CREATE=$(curl -sf -X POST "$API/books" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"title":"联调原创书","description":"冒烟测试","source":"original"}')
  UGC_BOOK=$(echo "$CREATE" | json_field "['data']['id']")

  CH=$(curl -sf -X POST "$API/books/$UGC_BOOK/chapter" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"title":"第一章","content":"段落一\n\n段落二"}')
  CH_ID=$(echo "$CH" | json_field "['data']['id']")

  curl -sf -X PATCH "$API/books/$UGC_BOOK/status" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"status":"published"}' >/dev/null
  green "  创建 + 发布 OK ($UGC_BOOK)"

  # 草稿权限：未登录应能读已发布书
  curl -sf "$API/books/$UGC_BOOK" >/dev/null
  green "  已发布书公开可读"
}

test_shelf_social_groups_discover() {
  step "书架 + 社交 + 共读 + 发现"
  curl -sf -X POST "$API/shelf" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"book_id\":\"$UGC_BOOK\"}" >/dev/null
  SHELF=$(curl -sf "$API/shelf" -H "Authorization: Bearer $TOKEN")
  green "  书架 OK (count=$(echo "$SHELF" | json_field "['data']['total'] // len(['data']['items'])" 2>/dev/null || echo ?))"

  curl -sf "$API/discover" >/dev/null
  green "  发现页 OK"

  GRP=$(curl -sf -X POST "$API/groups" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d "{\"book_id\":\"$UGC_BOOK\",\"name\":\"联调小组\",\"description\":\"test\"}")
  GID=$(echo "$GRP" | json_field "['data']['id']")
  curl -sf -X POST "$API/groups/$GID/posts" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"content":"大家好"}' >/dev/null
  green "  共读小组 OK ($GID)"

  curl -sf "$API/feed" -H "Authorization: Bearer $TOKEN" >/dev/null
  green "  动态流 OK"
}

test_payment() {
  step "商业化 (mock 支付)"
  PRICING=$(curl -sf "$API/pricing")
  green "  定价 OK"

  PAY=$(curl -sf -X POST "$API/payments" \
    -H "Authorization: Bearer $TOKEN" \
    -H 'Content-Type: application/json' \
    -d '{"type":"vip_monthly","provider":"mock"}')
  PID=$(echo "$PAY" | json_field "['data']['id']")
  curl -sf -X POST "$API/payments/$PID/confirm" \
    -H "Authorization: Bearer $TOKEN" >/dev/null
  VIP=$(curl -sf "$API/vip/status" -H "Authorization: Bearer $TOKEN")
  green "  VIP mock 支付 OK (active=$(echo "$VIP" | json_field "['data']['active']"))"
}

main() {
  echo "陪读 smoke test → $API"
  require_health
  register_and_login
  test_books_and_reading
  test_ugc
  test_shelf_social_groups_discover
  test_payment
  green "\n✅ 全部冒烟测试通过"
}

main "$@"
