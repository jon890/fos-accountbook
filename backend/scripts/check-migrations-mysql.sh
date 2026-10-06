#!/usr/bin/env bash
# Flyway 마이그레이션을 실제 MySQL 8.4 에 적용하고, 운영과 같은 스키마 검증 모드로 앱이 기동하는지 본다.
#
# 테스트는 H2 에서 ddl-auto: create-drop 으로 스키마를 만들어 마이그레이션 SQL 과
# 운영의 ddl-auto: validate 를 검증하지 못한다. 엔티티와 마이그레이션이 어긋나면 운영 기동이 실패한다.
#
# 사용법: backend/scripts/check-migrations-mysql.sh
# 종료 코드: 0 기동 성공, 1 마이그레이션이나 기동 실패, 2 docker 가 없거나 MySQL 이 뜨지 않음
set -u

BACKEND_DIR="$(cd "$(dirname "$0")/.." && pwd -P)"
CONTAINER="accountbook-migcheck-$$"
DB_PORT="${MIGCHECK_DB_PORT:-13399}"
APP_PORT="${MIGCHECK_APP_PORT:-18089}"
# BSD 와 GNU mktemp 가 함께 받는 형식이다. -t 접두사만 주면 GNU 에서 실패한다
LOG="$(mktemp "${TMPDIR:-/tmp}/accountbook-migcheck.XXXXXX")" || exit 2
APP_PID=""

cleanup() {
  [ -n "$APP_PID" ] && kill "$APP_PID" 2>/dev/null
  pkill -f "server.port=${APP_PORT}" 2>/dev/null
  docker stop "$CONTAINER" >/dev/null 2>&1
}
trap cleanup EXIT

if ! docker info >/dev/null 2>&1; then
  echo "docker 에 접속할 수 없다" >&2
  exit 2
fi

# backend/docker/compose.yml 과 같은 계정과 서버 collation 을 쓴다
docker run -d --rm --name "$CONTAINER" \
  -e MYSQL_ROOT_PASSWORD=rootpassword -e MYSQL_DATABASE=accountbook \
  -e MYSQL_USER=accountbook_user -e MYSQL_PASSWORD=accountbook_password \
  -p "127.0.0.1:${DB_PORT}:3306" mysql:8.4 \
  --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci >/dev/null || exit 2

ready=""
for _ in $(seq 1 60); do
  if docker exec "$CONTAINER" mysql -uaccountbook_user -paccountbook_password -e "select 1" accountbook >/dev/null 2>&1; then
    ready=1
    break
  fi
  sleep 2
done
if [ -z "$ready" ]; then
  echo "MySQL 이 120초 안에 뜨지 않았다" >&2
  exit 2
fi

URL="jdbc:mysql://localhost:${DB_PORT}/accountbook?useSSL=false&serverTimezone=Asia/Seoul&characterEncoding=UTF-8&allowPublicKeyRetrieval=true"
(cd "$BACKEND_DIR" && ./gradlew bootRun --no-daemon --console=plain \
  --args="--spring.profiles.active=local --server.port=${APP_PORT} --spring.datasource.url=${URL}" >"$LOG" 2>&1) &
APP_PID=$!

result=1
for _ in $(seq 1 120); do
  if grep -q "Started AccountBookApplication" "$LOG"; then
    result=0
    break
  fi
  if grep -q -E "APPLICATION FAILED|BUILD FAILED|FlywayException|Schema-validation" "$LOG"; then
    break
  fi
  if ! kill -0 "$APP_PID" 2>/dev/null; then
    break
  fi
  sleep 3
done

grep -E "Successfully applied|Schema .* is up to date|Started AccountBookApplication|APPLICATION FAILED|Schema-validation|FlywayException|Caused by" "$LOG" | tail -10
if [ "$result" -ne 0 ]; then
  echo "기동 실패. 전체 로그: $LOG" >&2
fi
exit "$result"
