#!/usr/bin/env bash
# scripts/review-checklist.sh 의 점검 목록 선택을 표본으로 검사한다.
# 하나라도 기대와 다르면 어느 표본이 무엇을 냈는지 출력하고 종료 코드 1 로 끝난다.

set -uo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fail=0

# check <이름> <입력 경로(줄바꿈 구분)> <기대 출력>
check() {
  local name="$1" input="$2" expected="$3" actual
  actual="$(printf '%s' "$input" | bash "$dir/review-checklist.sh")"
  if [ "$actual" != "$expected" ]; then
    echo "실패: $name"
    echo "  기대: [$expected]"
    echo "  실제: [$actual]"
    fail=1
  fi
}

check "프론트엔드만" "frontend/src/proxy.ts" "frontend"
check "백엔드만" "backend/build.gradle.kts" "backend"
check "둘 다" $'frontend/package.json\nbackend/build.gradle.kts' $'frontend\nbackend'
check "루트 문서만" "docs/adr.md" $'frontend\nbackend'
check "빈 입력" "" $'frontend\nbackend'

exit "$fail"
