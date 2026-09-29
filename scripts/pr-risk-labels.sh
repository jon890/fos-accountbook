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
# 라벨 이름에 공백을 넣지 않는다. 워크플로가 공백으로 라벨을 나눈다.

set -euo pipefail

auth=0
permission=0
deploy=0

while IFS= read -r path; do
  [ -z "$path" ] && continue
  # 세션, 토큰 갱신, 401 처리, 인증 미들웨어. 틀리면 로그인이 풀리거나 남의 세션이 섞인다.
  case "$path" in
    src/lib/server/auth/* | \
    src/app/api/auth/* | \
    src/proxy.ts | \
    src/lib/server/api/* | \
    src/types/next-auth.d.ts)
      auth=1 ;;
  esac
  # Server Action 은 가족 단위 권한 검증(ADR-F25)을 하는 자리다.
  case "$path" in
    src/actions/*)
      permission=1 ;;
  esac
  # 빌드와 기동을 바꾸는 파일. 틀리면 배포가 실패하거나 비밀값이 클라이언트 번들로 샌다.
  case "$path" in
    Dockerfile | .dockerignore | \
    next.config.ts | \
    package.json | \
    src/instrumentation.ts | \
    src/lib/env/* | \
    .env.example | \
    .github/workflows/*)
      deploy=1 ;;
  esac
done

[ "$auth" = 1 ] && echo "위험:인증"
[ "$permission" = 1 ] && echo "위험:권한"
[ "$deploy" = 1 ] && echo "위험:배포설정"
exit 0
