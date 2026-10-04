# fos-accountbook-backend 데이터 구조 (Canonical)

> 이 파일이 DB 스키마·API 스펙의 **canonical 소스**다.
> 프론트엔드는 `fos-accountbook/docs/data-schema.md`에서 TypeScript 타입으로 파생한다.

---

## 공통 규칙

| 규칙           | 내용                                              |
| -------------- | ------------------------------------------------- |
| **PK**         | BIGINT auto-increment (내부용, 외부 노출 금지)    |
| **외부 ID**    | UUID v4 VARCHAR(36) (API 노출)                    |
| **금액**       | DECIMAL(12, 2) / DECIMAL(15, 2) — BigDecimal      |
| **날짜시간**   | DATETIME(3) — LocalDateTime (서버 UTC 기준)       |
| **삭제**       | Soft Delete — `status` Enum (ACTIVE \| DELETED)   |
| **타임스탬프** | JPA Auditing — `createdAt`, `updatedAt` 자동 관리 |

---

## 엔티티 스키마

> 도메인별로 그룹핑. 패키지 구조와 일치한다 (`docs/code-architecture.md` 참고).

### [user] users

```sql
CREATE TABLE users (
    id             BIGINT       PRIMARY KEY AUTO_INCREMENT,
    uuid           VARCHAR(36)  NOT NULL UNIQUE,
    provider       VARCHAR(50)  NOT NULL,           -- google | naver
    provider_id    VARCHAR(255) NOT NULL,
    name           VARCHAR(255),
    email          VARCHAR(255) NOT NULL UNIQUE,
    email_verified DATETIME(3),
    image          VARCHAR(500),
    status         VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | DELETED
    created_at     DATETIME(3)  NOT NULL,
    updated_at     DATETIME(3)  NOT NULL,
    UNIQUE KEY uq_provider (provider, provider_id),
    INDEX idx_users_email (email),
    INDEX idx_users_uuid (uuid)
);
```

### [user] user_profiles

```sql
CREATE TABLE user_profiles (
    id                  BIGINT      PRIMARY KEY AUTO_INCREMENT,
    user_uuid           VARCHAR(36) NOT NULL UNIQUE,
    timezone            VARCHAR(50) NOT NULL DEFAULT 'Asia/Seoul',
    language            VARCHAR(10) NOT NULL DEFAULT 'ko',
    currency            VARCHAR(10) NOT NULL DEFAULT 'KRW',
    default_family_uuid VARCHAR(36),
    created_at          DATETIME(3) NOT NULL,
    updated_at          DATETIME(3) NOT NULL
);
```

### [family] families

```sql
CREATE TABLE families (
    id              BIGINT          PRIMARY KEY AUTO_INCREMENT,
    uuid            VARCHAR(36)     NOT NULL UNIQUE,
    name            VARCHAR(100)    NOT NULL,
    monthly_budget  DECIMAL(15, 2)  NOT NULL DEFAULT 0,  -- 0 = 미설정
    status          VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    created_at      DATETIME(3)     NOT NULL,
    updated_at      DATETIME(3)     NOT NULL
);
```

### [family] family_members

```sql
CREATE TABLE family_members (
    id          BIGINT      PRIMARY KEY AUTO_INCREMENT,
    uuid        VARCHAR(36) NOT NULL UNIQUE,
    family_uuid VARCHAR(36) NOT NULL,
    user_uuid   VARCHAR(36) NOT NULL,
    role        VARCHAR(20) NOT NULL,    -- OWNER | MEMBER
    status      VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | LEFT
    joined_at   DATETIME(3) NOT NULL,
    UNIQUE KEY uq_family_user (family_uuid, user_uuid),
    FOREIGN KEY (family_uuid) REFERENCES families(uuid),
    FOREIGN KEY (user_uuid)   REFERENCES users(uuid)
);
```

### [category] categories

```sql
CREATE TABLE categories (
    id                  BIGINT      PRIMARY KEY AUTO_INCREMENT,
    uuid                VARCHAR(36) NOT NULL UNIQUE,
    family_uuid         VARCHAR(36) NOT NULL,
    name                VARCHAR(50) NOT NULL,
    color               VARCHAR(50),                             -- #RRGGBB 또는 oklch(L C H). 기본값 #6366f1 은 엔티티가 채운다
    icon                VARCHAR(50),
    exclude_from_budget BOOLEAN     NOT NULL DEFAULT FALSE,
    type                VARCHAR(20) NOT NULL DEFAULT 'EXPENSE', -- EXPENSE | INCOME (ADR-B23)
    is_default          BOOLEAN     NOT NULL DEFAULT FALSE,       -- TRUE = 삭제 불가. 종류마다 하나
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          DATETIME(3) NOT NULL,
    updated_at          DATETIME(3) NOT NULL,
    INDEX idx_categories_family_uuid (family_uuid)
);
```

### [expense] expenses

```sql
CREATE TABLE expenses (
    id                       BIGINT          PRIMARY KEY AUTO_INCREMENT,
    uuid                     VARCHAR(36)     NOT NULL UNIQUE,
    family_uuid              VARCHAR(36)     NOT NULL,
    category_uuid            VARCHAR(36)     NOT NULL,   -- FK 없음 (캐시 활용, ADR-B05)
    user_uuid                VARCHAR(36)     NOT NULL,   -- FK 없음
    amount                   DECIMAL(12, 2)  NOT NULL,
    description              TEXT,
    date                     DATETIME(3)     NOT NULL,
    exclude_from_budget      BOOLEAN         NOT NULL DEFAULT FALSE,
    recurring_expense_uuid   VARCHAR(36),               -- NULL = 수동 등록, 참조만 (FK 없음)
    year_month               VARCHAR(7),                -- YYYY-MM, 자동 생성 중복 방지용
    status                   VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    created_at               DATETIME(3)     NOT NULL,
    updated_at               DATETIME(3)     NOT NULL,
    FOREIGN KEY (family_uuid) REFERENCES families(uuid),
    UNIQUE KEY uq_recurring_month (recurring_expense_uuid, year_month),  -- NULL 허용 (MySQL NULL != NULL)
    INDEX idx_expense_family_date  (family_uuid, date),
    INDEX idx_expense_category_uuid (category_uuid)
);
```

### [income] incomes

```sql
CREATE TABLE incomes (
    id            BIGINT          PRIMARY KEY AUTO_INCREMENT,
    uuid          VARCHAR(36)     NOT NULL UNIQUE,
    family_uuid   VARCHAR(36)     NOT NULL,
    category_uuid VARCHAR(36)     NOT NULL,   -- FK 없음 (캐시 활용, ADR-B05)
    user_uuid     VARCHAR(36)     NOT NULL,   -- FK 없음
    amount        DECIMAL(12, 2)  NOT NULL,
    description   TEXT,
    date          DATETIME(3)     NOT NULL,
    status        VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',
    created_at    DATETIME(3)     NOT NULL,
    updated_at    DATETIME(3)     NOT NULL,
    FOREIGN KEY (family_uuid) REFERENCES families(uuid),
    INDEX idx_income_family_date   (family_uuid, date),
    INDEX idx_income_category_uuid (category_uuid)
);
```

### [invitation] invitations

```sql
CREATE TABLE invitations (
    id                  BIGINT       PRIMARY KEY AUTO_INCREMENT,
    uuid                VARCHAR(36)  NOT NULL UNIQUE,
    family_uuid         VARCHAR(36)  NOT NULL,
    inviter_user_uuid   VARCHAR(36)  NOT NULL,
    token               VARCHAR(255) NOT NULL UNIQUE,  -- UUID 기반 256bit 랜덤
    status              VARCHAR(50)  NOT NULL DEFAULT 'PENDING',  -- PENDING | ACCEPTED
    expires_at          DATETIME(3)  NOT NULL,
    created_at          DATETIME(3)  NOT NULL,
    FOREIGN KEY (family_uuid)       REFERENCES families(uuid),
    FOREIGN KEY (inviter_user_uuid) REFERENCES users(uuid),
    INDEX idx_invitation_token      (token),
    INDEX idx_invitation_family_uuid (family_uuid)
);
```

### [notification] notifications

```sql
CREATE TABLE notifications (
    id                BIGINT       PRIMARY KEY AUTO_INCREMENT,
    notification_uuid VARCHAR(36)  NOT NULL UNIQUE,
    family_uuid       VARCHAR(36)  NOT NULL,
    user_uuid         VARCHAR(36),                    -- 수신자 UUID (레거시 행 호환을 위해 nullable)
    type              VARCHAR(50)  NOT NULL,           -- BUDGET_50_EXCEEDED | BUDGET_80_EXCEEDED | BUDGET_100_EXCEEDED | RECURRING_EXPENSE_CREATED
    title             VARCHAR(200) NOT NULL,
    message           TEXT         NOT NULL,
    reference_uuid    VARCHAR(36),
    reference_type    VARCHAR(50),                    -- EXPENSE | CATEGORY
    year_month        VARCHAR(7)   NOT NULL,           -- YYYY-MM (중복 방지 키)
    is_read           BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at        DATETIME(3)  NOT NULL,
    INDEX idx_notif_family_uuid        (family_uuid),
    INDEX idx_notif_family_type_month  (family_uuid, type, year_month),
    INDEX idx_notif_family_user_created (family_uuid, user_uuid, created_at),
    INDEX idx_notif_user_is_read       (user_uuid, is_read)
);
```

현재 알림은 ACTIVE 구성원마다 `user_uuid` 를 채워 저장한다. `user_uuid` 가 NULL 인 레거시 행은 사용자별 알림 목록에 표시하지 않는다.
중복은 애플리케이션에서 `(family_uuid, user_uuid, type, year_month)` 로 판단한다. `idx_notif_family_type_month` 는 조회 인덱스이며 사용자별 중복을 막는 UNIQUE 제약이 아니다.

### [recurring] recurring_expenses

```sql
CREATE TABLE recurring_expenses (
    id            BIGINT         PRIMARY KEY AUTO_INCREMENT,
    uuid          VARCHAR(36)    NOT NULL UNIQUE,
    family_uuid   VARCHAR(36)    NOT NULL,
    category_uuid VARCHAR(36)    NOT NULL,   -- FK 없음 (ADR-B05)
    user_uuid     VARCHAR(36)    NOT NULL,   -- FK 없음, 최초 등록자
    name          VARCHAR(100)   NOT NULL,
    amount        DECIMAL(12, 2) NOT NULL,
    day_of_month  TINYINT        NOT NULL,   -- 1~28 (29~31 불가, ADR-B13)
    status        VARCHAR(20)    NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | ENDED
    created_at    DATETIME(3)    NOT NULL,
    updated_at    DATETIME(3)    NOT NULL,
    FOREIGN KEY (family_uuid) REFERENCES families(uuid),
    INDEX idx_recurring_family_uuid (family_uuid),
    INDEX idx_recurring_day (day_of_month)
);
```

### [apitoken] api_tokens

외부 에이전트가 사용자 대신 가계부를 부를 때 쓰는 연동 토큰이다 (ADR-B18).

```sql
CREATE TABLE api_tokens (
    id           BIGINT       PRIMARY KEY AUTO_INCREMENT,
    uuid         VARCHAR(36)  NOT NULL UNIQUE,
    user_uuid    VARCHAR(36)  NOT NULL,   -- 토큰 주인. users(uuid) FK
    name         VARCHAR(50)  NOT NULL,   -- 사용자가 붙인 이름 (예: fos-assistant)
    token_hash   VARCHAR(64)  NOT NULL UNIQUE,  -- 원문의 SHA-256 hex. 원문은 저장하지 않는다
    token_prefix VARCHAR(12)  NOT NULL,   -- 목록 표시용 앞부분 (fab_ + 8자)
    status       VARCHAR(20)  NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | REVOKED
    last_used_at DATETIME(3),             -- 인증에 쓰인 마지막 시각. 5분 단위로 갱신
    revoked_at   DATETIME(3),
    created_at   DATETIME(3)  NOT NULL,
    updated_at   DATETIME(3)  NOT NULL,
    FOREIGN KEY (user_uuid) REFERENCES users(uuid),
    INDEX idx_api_tokens_user_uuid (user_uuid)
);
```

- 만료는 없다. 폐기하면 `status = REVOKED` 가 되고 다시 살릴 수 없다
- 사용자 한 명이 가질 수 있는 ACTIVE 토큰은 5개까지다

### [budgetitem] budget_items

가족이 만든 예산 항목이다 (ADR-B25).

```sql
CREATE TABLE budget_items (
    id            BIGINT          PRIMARY KEY AUTO_INCREMENT,
    uuid          VARCHAR(36)     NOT NULL UNIQUE,
    family_uuid   VARCHAR(36)     NOT NULL,   -- FK 없음
    name          VARCHAR(30)     NOT NULL,   -- 가족의 ACTIVE 항목 안에서 중복 불가 (서비스가 검사)
    monthly_limit DECIMAL(15, 2)  NOT NULL DEFAULT 0,  -- 0 = 한도 없음
    status        VARCHAR(20)     NOT NULL DEFAULT 'ACTIVE',  -- ACTIVE | DELETED
    created_at    DATETIME(3)     NOT NULL,
    updated_at    DATETIME(3)     NOT NULL,
    INDEX idx_budget_items_family_uuid (family_uuid)
);
```

- 가족당 ACTIVE 항목은 10개까지다
- 두 테이블은 `utf8mb4_unicode_ci` 로 만든다. `category_uuid` 를 `expenses`, `categories` 와 비교하므로 collation 이 같아야 한다
- 목록과 예산 요약은 만든 순서(`id` 오름차순)로 준다

### [budgetitem] budget_item_categories

항목이 세는 지출 카테고리다.

```sql
CREATE TABLE budget_item_categories (
    id               BIGINT      PRIMARY KEY AUTO_INCREMENT,
    budget_item_uuid VARCHAR(36) NOT NULL,   -- FK 없음
    category_uuid    VARCHAR(36) NOT NULL,   -- FK 없음. EXPENSE 카테고리만
    UNIQUE KEY uq_budget_item_categories_category (category_uuid),  -- 카테고리 하나는 항목 하나에만
    INDEX idx_budget_item_categories_item (budget_item_uuid)
);
```

- `status` 가 없다. 항목을 지우거나 카테고리를 지우거나 항목의 카테고리 묶음을 바꾸면 행을 실제로 지운다
- 그래서 이 테이블에 행이 있는 카테고리는 항상 ACTIVE 항목에 속한다. 생활비 합계 쿼리는 항목의 `status` 를 보지 않고 이 테이블만 본다

---

## 마이그레이션 이력 (Flyway)

| 버전 | 설명                                                                            |
| ---- | ------------------------------------------------------------------------------- |
| V1   | 초기 스키마: users, families, family_members, categories, expenses, invitations |
| V2   | incomes 테이블 추가                                                             |
| V3   | users에 default_family_uuid 추가 (이후 V5에서 user_profiles로 이관)             |
| V4   | user_profiles 테이블 생성                                                       |
| V5   | user_profiles에 default_family_uuid 이관                                        |
| V6   | users에 status 컬럼 추가                                                        |
| V7   | deleted_at → status Enum으로 전환 (Soft Delete 통일)                            |
| V8   | families에 monthly_budget 추가                                                  |
| V9   | notifications 테이블 생성                                                       |
| V10  | notifications 인덱스 추가                                                       |
| V11  | expenses/categories에 exclude_from_budget 추가                                  |
| V12  | categories에 is_default 추가                                                    |
| V13  | expenses에 recurring_expense_uuid, year_month 추가 + UNIQUE constraint          |
| V14  | recurring_expenses 테이블 생성                                                  |
| V20260930_1400 | api_tokens 테이블 생성 (이후 타임스탬프 버전, backend CLAUDE.md 「Database」) |
| V20261001_1200 | categories 에 type 추가, 기존 카테고리 분류, 수입 기본 카테고리 생성 (ADR-B23) |
| V20261002_1200 | budget_items, budget_item_categories 테이블 생성 (ADR-B25) |

---

## API 엔드포인트 전체 목록

> 도메인별로 그룹핑. `Base: /api/v1`

```
# [user] 인증
POST   /auth/social-login          소셜 로그인 (프론트엔드 서버 서명 필요, ADR-B17)
POST   /auth/refresh               토큰 갱신 (공개)

# [user] 사용자 프로필
GET    /users/me/profile            프로필 조회
PUT    /users/me/profile            프로필 수정

# [apitoken] 연동 토큰 (JWT 로만 부른다. 연동 토큰으로는 부를 수 없다)
POST   /users/me/api-tokens            발급. 응답에만 토큰 원문이 한 번 실린다
GET    /users/me/api-tokens            내 ACTIVE 토큰 목록
DELETE /users/me/api-tokens/{uuid}     폐기

# [family] 가족
POST   /families                   가족 생성
GET    /families                   내 가족 목록
GET    /families/{uuid}            가족 상세
GET    /families/{uuid}/members    구성원 목록 (가입 순서)
PUT    /families/{uuid}            가족 수정 (OWNER)
DELETE /families/{uuid}            가족 삭제 (OWNER)

# [category] 카테고리
POST   /families/{uuid}/categories            카테고리 생성
GET    /families/{uuid}/categories            목록
GET    /families/{uuid}/categories/{uuid}     상세
PUT    /families/{uuid}/categories/{uuid}     수정
DELETE /families/{uuid}/categories/{uuid}     삭제 (기본 카테고리 불가)

# [budgetitem] 예산 항목 (ADR-B25)
POST   /families/{uuid}/budget-items          항목 생성
GET    /families/{uuid}/budget-items          ACTIVE 항목 목록 (만든 순서)
PUT    /families/{uuid}/budget-items/{uuid}   수정 (카테고리 묶음은 통째로 바꾼다)
DELETE /families/{uuid}/budget-items/{uuid}   삭제 (Soft Delete)

# [expense] 지출
POST   /families/{uuid}/expenses              등록
GET    /families/{uuid}/expenses              목록 (페이징, 필터)
GET    /families/{uuid}/expenses/{uuid}       상세
PUT    /families/{uuid}/expenses/{uuid}       수정
DELETE /families/{uuid}/expenses/{uuid}       삭제 (Soft Delete)

# [income] 수입
POST   /families/{uuid}/incomes               등록
GET    /families/{uuid}/incomes               목록 (페이징, 필터)
GET    /families/{uuid}/incomes/{uuid}        상세
PUT    /families/{uuid}/incomes/{uuid}        수정
DELETE /families/{uuid}/incomes/{uuid}        삭제 (Soft Delete)

# [recurring] 반복 지출
POST   /families/{uuid}/recurring-expenses                    템플릿 등록
GET    /families/{uuid}/recurring-expenses                    목록 (month=YYYY-MM, generatedThisMonth 포함)
GET    /families/{uuid}/recurring-expenses/monthly-total      이번달 합계
PUT    /families/{uuid}/recurring-expenses/{uuid}             수정 (즉시 전체 반영, ADR-B13)
DELETE /families/{uuid}/recurring-expenses/{uuid}             종료 (ENDED, Soft Delete)

# [invitation] 초대
POST   /invitations/families/{uuid}           초대장 생성 (OWNER)
GET    /invitations/families/{uuid}           초대장 목록
GET    /invitations/token/{token}             초대장 조회 (공개)
POST   /invitations/accept                    초대 수락
DELETE /invitations/{uuid}                    초대장 삭제

# [notification] 알림
GET    /families/{uuid}/notifications                         알림 목록
GET    /families/{uuid}/notifications/unread-count            읽지 않은 수
PATCH  /families/{uuid}/notifications/{uuid}/read             읽음 처리
POST   /families/{uuid}/notifications/mark-all-read           전체 읽음

# [dashboard] 대시보드
GET    /families/{uuid}/dashboard/stats/monthly               월별 통계
GET    /families/{uuid}/dashboard/daily-stats                 일별 통계
GET    /families/{uuid}/dashboard/expenses/by-category        카테고리별 지출
GET    /families/{uuid}/dashboard/stats/monthly-trend         월별 지출 추이 (from/to)
GET    /families/{uuid}/dashboard/stats/category-breakdown    카테고리 분포 + 전월 delta
GET    /families/{uuid}/dashboard/budget-summary              생활비와 예산 항목별 쓴 금액과 한도 (year, month 필수)
```

### 예산 항목 요청과 응답

생성과 수정의 요청 본문은 같다.

| 필드 | 타입 | 규칙 |
|---|---|---|
| `name` | 문자열 | 필수. 앞뒤 공백을 뺀 1~30자. 가족의 ACTIVE 항목 안에서 중복 불가 |
| `monthlyLimit` | 숫자 | 필수. 0 이상 정수, 13자리까지. 0 은 한도 없음 |
| `categoryUuids` | 문자열 배열 | 필수. 1개 이상. 중복 없이. 그 가족의 ACTIVE `EXPENSE` 카테고리만 |

응답 `BudgetItemResponse` 는 `uuid`, `name`, `monthlyLimit`, `categoryUuids`, `createdAt`, `updatedAt` 을 담는다.
생성은 201, 수정과 삭제는 200 이다. 삭제의 `data` 는 null 이다.

| 에러 코드 | HTTP | 뜻 |
|---|---|---|
| `BI001` `BUDGET_ITEM_NOT_FOUND` | 404 | 항목이 없거나 다른 가족의 항목이다 |
| `BI002` `BUDGET_ITEM_CATEGORY_CONFLICT` | 409 | 카테고리가 이미 다른 항목에 속한다 |
| `BI003` `BUDGET_ITEM_LIMIT_EXCEEDED` | 400 | 가족의 ACTIVE 항목이 이미 10개다 |
| `BI004` `BUDGET_ITEM_ALREADY_EXISTS` | 409 | 같은 이름의 ACTIVE 항목이 있다 |
| `CT001`, `CT005` | 404, 400 | 카테고리가 없다, 수입 카테고리다 |
| `C001` | 400 | 본문 검증 실패 |

### 예산 요약과 생활비 합계

`budget-summary` 의 응답 `BudgetSummaryResponse` 다.

| 필드 | 타입 | 뜻 |
|---|---|---|
| `year`, `month` | 숫자 | 요청한 연월 |
| `total.spent` | 숫자 | 그 달 예산 합계 |
| `total.limit` | 숫자 | `families.monthly_budget`(전체 예산). 0 = 미설정 |
| `living.spent` | 숫자 | 그 달 생활비 합계 |
| `living.limit` | 숫자 | `total.limit` 에서 ACTIVE 항목 `limit` 의 합을 뺀 값. 0 보다 작으면 0 |
| `allocationExceeded` | 불리언 | `total.limit` 이 0 보다 크고 항목 `limit` 의 합이 그보다 크면 true |
| `items[]` | `{ budgetItemUuid, name, limit, spent }` | ACTIVE 항목. 만든 순서. `limit` 0 = 한도 없음 |

합계 규칙은 ADR-B25 와 ADR-B26 이 정한다.
고정지출은 지출의 예산 제외 표시가 있거나, 카테고리가 예산 제외이거나, `recurring_expense_uuid` 가 있는 지출이다.

| 합계 | 더하는 지출 |
|---|---|
| 예산 | 그 달 ACTIVE 지출 가운데 고정지출이 아닌 것. 항목 카테고리의 지출도 포함한다 |
| 생활비 | 예산 합계의 지출 가운데 카테고리가 `budget_item_categories` 에 없는 것 |
| 항목 | 그 달 ACTIVE 지출 가운데 카테고리가 그 항목에 속하고 지출의 예산 제외 표시가 없는 것. 카테고리의 예산 제외 표시와 반복 지출 여부는 보지 않는다 |

`stats/monthly` 의 `monthlyExpense` 와 예산 알림의 기준 금액은 예산 합계다. `remainingBudget` 은 `budget - monthlyExpense` 다.
지난달을 조회해도 지금의 항목 구성으로 계산한다.

### 응답에 담는 등록자

지출과 수입의 응답(`ExpenseResponse`, `IncomeResponse`)은 등록한 사용자의 `userUuid` 를 담는다.
이름과 사진은 담지 않는다. 화면은 `GET /families/{uuid}/members` 로 받은 구성원 목록에서 `userUuid` 로 찾는다.
가족을 떠난 구성원의 기록도 `userUuid` 는 남으므로, 화면은 목록에서 찾지 못한 경우를 따로 표시한다.

구성원 목록 응답의 `data`는 `userUuid`, `name`, `email`, `image`, `role`, `joinedAt`을 담은 배열이다.
`name`과 `image`는 null일 수 있고, `email`은 사용자에게 있으면 담는다.
`ACTIVE` 구성원만 가입 시각 오름차순으로 반환하며 가족 구성원만 조회할 수 있다.

`daily-stats` 는 날짜별 합계와 함께 날짜마다 등록자별 지출을 준다.

| 필드 | 타입 | 뜻 |
|---|---|---|
| `dailyStats[].date` | `YYYY-MM-DD` | 거래가 있는 날만. 날짜 오름차순 |
| `dailyStats[].income`, `dailyStats[].expense` | 숫자 | 그날 가족 전체 합계 |
| `dailyStats[].memberExpenses[]` | `{ userUuid, amount }` | 그날 지출이 있는 등록자만. `userUuid` 오름차순 |
| `totalIncome`, `totalExpense` | 숫자 | 그 달 가족 전체 합계 |

합계는 삭제되지 않은(`ACTIVE`) 지출과 수입을 모두 더한다. 예산 제외 표시는 보지 않는다.
그 달 등록자별 누적 합계와 등록자별 수입 합계는 담지 않는다. 홈은 누적 금액 대신 예산 카드를 보여 준다. 달력은 등록자별로 지출만 비교하고, 수입은 날짜를 눌러 목록에서 본다.
