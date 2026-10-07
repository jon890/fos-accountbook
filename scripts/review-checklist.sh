#!/usr/bin/env bash
# 바뀐 파일 경로를 받아 리뷰 프롬프트에 붙일 점검 목록 이름을 한 줄에 하나씩 낸다.
#
# 이름은 .github/claude-review-prompt-<이름>.txt 와 대응한다.
# frontend/ 아래 파일이 있으면 frontend, backend/ 아래 파일이 있으면 backend 를 이 순서로 낸다.
# 어느 쪽도 없으면(루트 파일만 바뀐 경우) 둘 다 낸다.
# 의존성 버전 파일이 바뀌었으면 마지막에 deps 를 더 낸다.
#
# 사용법:
#   gh pr diff 12 --name-only | scripts/review-checklist.sh
#
# 점검 목록 선택은 보안 경계가 아니다. 워크플로가 PR head 의 이 스크립트를 그대로 쓴다.

set -euo pipefail

frontend=0
backend=0
deps=0

while IFS= read -r path || [ -n "$path" ]; do
  [ -z "$path" ] && continue
  case "$path" in
    frontend/package.json | frontend/pnpm-lock.yaml | backend/gradle/libs.versions.toml | backend/build.gradle.kts) deps=1 ;;
    backend/gradle/wrapper/gradle-wrapper.properties | backend/Dockerfile) deps=1 ;;
  esac
  case "$path" in
    frontend/*) frontend=1 ;;
    backend/*) backend=1 ;;
  esac
done

if [ "$frontend" = 0 ] && [ "$backend" = 0 ]; then
  frontend=1
  backend=1
fi

[ "$frontend" = 1 ] && echo "frontend"
[ "$backend" = 1 ] && echo "backend"
[ "$deps" = 1 ] && echo "deps"
exit 0
