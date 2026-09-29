#!/usr/bin/env bash
# 바뀐 파일 경로를 받아 PR 에 붙일 위험 라벨을 한 줄에 하나씩 낸다.
#
# 판정은 경로 규칙만으로 한다. LLM 이 매기는 점수는 같은 PR 에서도 실행마다 달라져
# 머지 기준으로 쓸 수 없다. 규칙이 틀렸으면 이 파일을 고친다.
#
# 경로 규칙은 frontend/, backend/ 를 앞에 붙여 쓴다. 접두사 없는 옛 경로는 맞지 않는다.
# .github/workflows/* 는 루트에 있어 접두사 없이 쓴다.
#
# 사용법:
#   git diff --name-only origin/main...HEAD | scripts/pr-risk-labels.sh
#   gh pr diff 12 --name-only | scripts/pr-risk-labels.sh
#
# 라벨이 하나도 없으면 아무것도 내지 않고 종료 코드 0 으로 끝난다.
# 라벨 이름에 공백을 넣지 않는다. 워크플로가 공백으로 라벨을 나눈다.

set -euo pipefail

src=backend/src/main/java/com/bifos/accountbook

auth=0
permission=0
migration=0
security=0
async=0
deploy=0

while IFS= read -r path; do
  [ -z "$path" ] && continue
  # 세션, 토큰 갱신, 401 처리, 인증 미들웨어. 틀리면 로그인이 풀리거나 남의 세션이 섞인다.
  case "$path" in
    frontend/src/lib/server/auth/* | \
    frontend/src/app/api/auth/* | \
    frontend/src/proxy.ts | \
    frontend/src/lib/server/api/* | \
    frontend/src/types/next-auth.d.ts)
      auth=1 ;;
  esac
  # Server Action 은 가족 단위 권한 검증(ADR-F25)을 하는 자리다.
  case "$path" in
    frontend/src/actions/*)
      permission=1 ;;
  esac
  # 엔티티는 테스트의 H2 가 스키마를 만들어 주므로 마이그레이션 누락이 테스트로 드러나지 않는다.
  case "$path" in
    backend/src/main/resources/db/migration/* | \
    "$src"/*/domain/entity/*)
      migration=1 ;;
  esac
  case "$path" in
    "$src"/config/security/* | \
    "$src"/config/SecurityConfig.java | \
    "$src"/config/CorsProperties.java | \
    "$src"/shared/auth/* | \
    "$src"/shared/aop/* | \
    "$src"/shared/filter/* | \
    "$src"/user/presentation/controller/AuthController.java | \
    "$src"/user/application/service/AuthService.java | \
    "$src"/invitation/*)
      security=1 ;;
  esac
  case "$path" in
    "$src"/*/application/event/* | \
    "$src"/config/AsyncConfig.java | \
    "$src"/config/CacheConfig.java | \
    "$src"/recurring/application/service/RecurringExpenseScheduler.java)
      async=1 ;;
  esac
  # 빌드와 기동을 바꾸는 파일. 틀리면 배포가 실패하거나 비밀값이 새거나 기동이 멈춘다.
  case "$path" in
    frontend/Dockerfile | frontend/.dockerignore | \
    frontend/next.config.ts | \
    frontend/package.json | \
    frontend/src/instrumentation.ts | \
    frontend/src/lib/env/* | \
    frontend/.env.example | \
    backend/Dockerfile | backend/docker/* | \
    backend/src/main/resources/application*.yml | \
    backend/src/main/resources/logback-spring.xml | \
    backend/build.gradle.kts | backend/settings.gradle.kts | backend/gradle/libs.versions.toml | \
    .github/workflows/*)
      deploy=1 ;;
  esac
done

[ "$auth" = 1 ] && echo "위험:인증"
[ "$permission" = 1 ] && echo "위험:권한"
[ "$migration" = 1 ] && echo "위험:마이그레이션"
[ "$security" = 1 ] && echo "위험:보안"
[ "$async" = 1 ] && echo "위험:이벤트캐시"
[ "$deploy" = 1 ] && echo "위험:배포설정"
exit 0
