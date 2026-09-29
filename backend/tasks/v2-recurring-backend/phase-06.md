# Phase 6: 통합 테스트

## 컨텍스트

`fos-accountbook-backend` Spring Boot 백엔드. 반복 지출 기능 구현 중.
Phase 5에서 Controller까지 구현이 완료된 상태다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 테스트 원칙 (AbstractControllerTest, Fixtures, @Transactional 금지)
- `docs/data-schema.md` — API 엔드포인트 명세

기존 코드 참조 (패턴 파악용):
- `src/test/java/com/bifos/accountbook/` 디렉터리 구조 파악
- 기존 `*ControllerTest.java` 파일 하나를 읽어 AbstractControllerTest 상속 패턴, fixtures 사용법 파악
- `src/test/java/.../fixtures/` 또는 유사 디렉터리에서 Fixture 빌더 패턴 파악

## 목표

`RecurringExpenseControllerTest`를 작성하여 핵심 시나리오를 검증한다.

## 작업 목록

- [ ] 기존 테스트 구조 파악 (`Glob`으로 `*ControllerTest.java` 패턴 검색, 하나 읽기)

- [ ] Fixture 빌더에 `RecurringExpense` 생성 헬퍼 추가 (기존 패턴 따름)

- [ ] `RecurringExpenseControllerTest.java` 생성
  - 위치: `src/test/java/com/bifos/accountbook/presentation/controller/`
  - `extends AbstractControllerTest`
  - `@DisplayName("반복 지출 API 통합 테스트")`
  - **테스트 케이스** (핵심 시나리오):
    1. `등록_성공` — POST 요청, 201/200 확인, uuid 반환 확인
    2. `등록_dayOfMonth_29이상_실패` — dayOfMonth=29, 400 응답 확인
    3. `목록_조회_성공` — 등록 후 GET, totalMonthlyAmount 확인, generatedThisMonth=false 확인
    4. `수정_성공` — 등록 → PUT → GET 재조회, 변경값 반영 확인
    5. `삭제_성공` — 등록 → DELETE → GET 재조회, 목록에서 사라짐 확인
    6. `다른_가족_접근_403` — 다른 가족 UUID로 접근 시 403 확인

## 성공 기준

- `./gradlew test --tests "*RecurringExpenseControllerTest*" --no-daemon` 성공
- 모든 테스트 케이스 PASS

## 주의사항

- `@Transactional` 테스트 사용 금지 — 실제 커밋 검증 필요
- Service/Repository 모킹 금지 — 실제 H2 DB 사용
- DB 정리: `DatabaseCleanupListener` 또는 `DatabaseCleanupExtension` 기존 방식 따름
- 테스트는 독립적이어야 함 — 순서에 의존하지 않음
- 기존 ControllerTest 패턴을 그대로 따름, 독자적 방식 도입 금지
