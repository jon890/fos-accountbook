#!/usr/bin/env bash
# 바뀐 파일 경로를 받아 PR 에 붙일 위험 라벨을 한 줄에 하나씩 낸다.
#
# 판정은 경로 규칙만으로 한다. LLM 이 매기는 점수는 같은 PR 에서도 실행마다 달라져
# 머지 기준으로 쓸 수 없다. 규칙이 틀렸으면 이 파일을 고친다.
#
# 사용법:
#   git diff --name-only origin/main...HEAD | scripts/pr-risk-labels.sh
#   gh pr diff 12 --name-only | scripts/pr-risk-labels.sh
#
# 라벨이 하나도 없으면 아무것도 내지 않고 종료 코드 0 으로 끝난다.
# 워크플로가 공백으로 나눠 읽으므로 라벨 이름에 공백을 넣지 않는다.

set -euo pipefail

src=src/main/java/com/bifos/accountbook

migration=0
security=0
async=0
deploy=0

while IFS= read -r path; do
  [ -z "$path" ] && continue
  # 엔티티는 테스트의 H2 가 스키마를 만들어 주므로 마이그레이션 누락이 테스트로 드러나지 않는다.
  case "$path" in
    src/main/resources/db/migration/* | \
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
  case "$path" in
    Dockerfile | docker/* | \
    src/main/resources/application*.yml | \
    src/main/resources/logback-spring.xml | \
    build.gradle.kts | settings.gradle.kts | gradle/libs.versions.toml | \
    .github/workflows/*)
      deploy=1 ;;
  esac
done

[ "$migration" = 1 ] && echo "위험:마이그레이션"
[ "$security" = 1 ] && echo "위험:보안"
[ "$async" = 1 ] && echo "위험:이벤트캐시"
[ "$deploy" = 1 ] && echo "위험:배포설정"
exit 0
