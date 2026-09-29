#!/usr/bin/env bash
# scripts/pr-risk-labels.sh 의 경로 규칙을 표본으로 검사한다.
# 하나라도 기대와 다르면 어느 표본이 무엇을 냈는지 출력하고 종료 코드 1 로 끝난다.

set -uo pipefail

dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fail=0

# check <이름> <입력 경로(줄바꿈 구분)> <기대 출력>
check() {
  local name="$1" input="$2" expected="$3" actual
  actual="$(printf '%s\n' "$input" | bash "$dir/pr-risk-labels.sh")"
  if [ "$actual" != "$expected" ]; then
    echo "실패: $name"
    echo "  기대: [$expected]"
    echo "  실제: [$actual]"
    fail=1
  fi
}

check "UI 컴포넌트" "frontend/src/components/ui/button.tsx" ""
check "Server Action" "frontend/src/actions/expense/create-expense-action.ts" "위험:권한"
check "인증 미들웨어" "frontend/src/proxy.ts" "위험:인증"
check "마이그레이션" "backend/src/main/resources/db/migration/V1__init.sql" "위험:마이그레이션"
check "보안 설정" "backend/src/main/java/com/bifos/accountbook/config/SecurityConfig.java" "위험:보안"
check "Dockerfile 둘" $'frontend/Dockerfile\nbackend/Dockerfile' "위험:배포설정"
check "워크플로" ".github/workflows/frontend-ci.yml" "위험:배포설정"
check "접두사 없는 옛 경로" "src/proxy.ts" ""
check "루트 문서" "docs/adr.md" ""

exit "$fail"
