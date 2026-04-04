# Phase 1: Flyway 마이그레이션 (V13, V14)

## 컨텍스트

`fos-accountbook-backend`는 Spring Boot 3 + Java 21 + JPA + QueryDSL 기반 가족 가계부 백엔드다.
프로젝트 루트: `/Users/nhn/personal/fos-accountbook-backend`

반복 지출(recurring expense) 기능을 위해 DB 스키마를 확장한다:

- `expenses` 테이블에 `recurring_expense_uuid`, `year_month` 컬럼 추가
- `recurring_expenses` 테이블 신규 생성

반드시 먼저 읽을 문서:

- `CLAUDE.md` — 코딩 컨벤션, Flyway 규칙
- `docs/data-schema.md` — 확정된 스키마 명세

기존 마이그레이션 파일 확인:

- `src/main/resources/db/migration/` 디렉터리의 최신 버전 파악

## 목표

Flyway 마이그레이션 파일 2개를 생성한다.

## 작업 목록

- [ ] `src/main/resources/db/migration/V13__add_recurring_expense_columns_to_expenses.sql` 생성

  ```sql
  ALTER TABLE expenses
    ADD COLUMN recurring_expense_uuid VARCHAR(36)  NULL,
    ADD COLUMN year_month             VARCHAR(7)   NULL,
    ADD UNIQUE KEY uq_recurring_month (recurring_expense_uuid, year_month);
  ```

  주의: `recurring_expense_uuid`가 NULL인 경우 MySQL에서 NULL != NULL이므로 UNIQUE 제약이 수동 등록 지출에 영향을 주지 않는다.

- [ ] `src/main/resources/db/migration/V14__create_recurring_expenses_table.sql` 생성

  ```sql
  CREATE TABLE recurring_expenses (
      id            BIGINT         NOT NULL AUTO_INCREMENT,
      uuid          VARCHAR(36)    NOT NULL,
      family_uuid   VARCHAR(36)    NOT NULL,
      category_uuid VARCHAR(36)    NOT NULL,
      user_uuid     VARCHAR(36)    NOT NULL,
      name          VARCHAR(100)   NOT NULL,
      amount        DECIMAL(12, 2) NOT NULL,
      day_of_month  TINYINT        NOT NULL,
      status        VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',
      created_at    DATETIME(3)    NOT NULL,
      updated_at    DATETIME(3)    NOT NULL,
      PRIMARY KEY (id),
      UNIQUE KEY uq_recurring_uuid (uuid),
      CONSTRAINT fk_recurring_family FOREIGN KEY (family_uuid) REFERENCES families (uuid),
      INDEX idx_recurring_family_uuid (family_uuid),
      INDEX idx_recurring_day (day_of_month)
  );
  ```

## 성공 기준

- 두 파일이 올바른 경로에 존재
- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공 (SQL 파싱 오류 없음)

## 주의사항

- Flyway 파일명 형식: `V{N}__{snake_case_description}.sql` (언더스코어 2개)
- 기존 V12 이후 번호 확인 후 작성
- H2 테스트 DB 호환성: `TINYINT`은 H2에서 지원됨. `AUTO_INCREMENT`도 H2 호환
- `docs/data-schema.md`의 스키마 명세를 canonical source로 사용

## Blocked 조건

기존 마이그레이션 파일에서 V13 또는 V14가 이미 존재하면:
`PHASE_BLOCKED: V13 또는 V14 마이그레이션 파일이 이미 존재함 — 버전 번호 확인 필요`
