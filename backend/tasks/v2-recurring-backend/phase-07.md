# Phase 7: 전체 빌드 검증

## 컨텍스트

`fos-accountbook-backend` Spring Boot 백엔드.
Phase 1~6에서 반복 지출 기능 전체 구현 및 테스트가 완료된 상태다.

이 phase는 Checkstyle을 포함한 전체 빌드를 통과시키는 것이 목표다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 코드 스타일 규칙 (들여쓰기 2 spaces, 와일드카드 import 금지 등)

## 목표

`./gradlew build --no-daemon` 전체 빌드 통과.

## 작업 목록

- [ ] 전체 빌드 실행:
  ```bash
  ./gradlew build --no-daemon
  ```

- [ ] Checkstyle 오류 발생 시:
  - `./gradlew checkstyleMain --no-daemon` 실행하여 오류 목록 확인
  - 오류 항목별 수정:
    - 들여쓰기: 2 spaces (연속 4 spaces)
    - 메서드 체이닝: `.`은 새 줄 시작에 위치
    - 와일드카드 import 제거
    - 라인 길이 초과 수정

- [ ] 테스트 실패 발생 시:
  - 실패 테스트 로그 확인
  - 원인 파악 후 수정

## 성공 기준

- `./gradlew build --no-daemon` exit code 0
- BUILD SUCCESSFUL 메시지 확인

## 주의사항

- Checkstyle config: `config/checkstyle/google_checks.xml`
- 한국어 발음 표기 식별자 금지
- 빌드 실패 원인을 정확히 파악하고 수정 — 임의로 코드를 삭제하거나 테스트를 skip하지 않음

## Blocked 조건

이해할 수 없는 빌드 오류가 발생하거나, 의존성 문제로 해결이 어려운 경우:
`PHASE_BLOCKED: 빌드 오류 해결 불가 — {오류 내용}`
