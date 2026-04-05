# Data Schema — fos-accountbook-backend (Canonical)

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

### users

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

### user_profiles

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

### families

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

### family_members

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

### categories

```sql
CREATE TABLE categories (
    id                  BIGINT      PRIMARY KEY AUTO_INCREMENT,
    uuid                VARCHAR(36) NOT NULL UNIQUE,
    family_uuid         VARCHAR(36) NOT NULL,
    name                VARCHAR(50) NOT NULL,
    color               VARCHAR(7)  NOT NULL DEFAULT '#6366f1',  -- hex color
    icon                VARCHAR(50),
    exclude_from_budget BOOLEAN     NOT NULL DEFAULT FALSE,
    is_default          BOOLEAN     NOT NULL DEFAULT FALSE,       -- TRUE = 삭제 불가
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_at          DATETIME(3) NOT NULL,
    updated_at          DATETIME(3) NOT NULL,
    INDEX idx_categories_family_uuid (family_uuid)
);
```

### expenses

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

### incomes

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

### invitations

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

### notifications

```sql
CREATE TABLE notifications (
    id                BIGINT       PRIMARY KEY AUTO_INCREMENT,
    notification_uuid VARCHAR(36)  NOT NULL UNIQUE,
    family_uuid       VARCHAR(36)  NOT NULL,
    user_uuid         VARCHAR(36),                    -- NULL = 가족 전체
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

### recurring_expenses

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

---

## API 엔드포인트 전체 목록

```
Base: /api/v1

# 인증
POST   /auth/social-login          소셜 로그인 (공개)
POST   /auth/refresh               토큰 갱신 (공개)

# 가족
POST   /families                   가족 생성
GET    /families                   내 가족 목록
GET    /families/{uuid}            가족 상세
PUT    /families/{uuid}            가족 수정 (OWNER)
DELETE /families/{uuid}            가족 삭제 (OWNER)

# 카테고리
POST   /families/{uuid}/categories            카테고리 생성
GET    /families/{uuid}/categories            목록
GET    /families/{uuid}/categories/{uuid}     상세
PUT    /families/{uuid}/categories/{uuid}     수정
DELETE /families/{uuid}/categories/{uuid}     삭제 (기본 카테고리 불가)

# 지출
POST   /families/{uuid}/expenses              등록
GET    /families/{uuid}/expenses              목록 (페이징, 필터)
GET    /families/{uuid}/expenses/{uuid}       상세
PUT    /families/{uuid}/expenses/{uuid}       수정
DELETE /families/{uuid}/expenses/{uuid}       삭제 (Soft Delete)

# 수입
POST   /families/{uuid}/incomes               등록
GET    /families/{uuid}/incomes               목록 (페이징, 필터)
GET    /families/{uuid}/incomes/{uuid}        상세
PUT    /families/{uuid}/incomes/{uuid}        수정
DELETE /families/{uuid}/incomes/{uuid}        삭제 (Soft Delete)

# 대시보드
GET    /families/{uuid}/dashboard/stats/monthly          월별 통계
GET    /families/{uuid}/dashboard/daily-stats            일별 통계
GET    /families/{uuid}/dashboard/expenses/by-category   카테고리별 지출

# 초대
POST   /invitations/families/{uuid}           초대장 생성 (OWNER)
GET    /invitations/families/{uuid}           초대장 목록
GET    /invitations/token/{token}             초대장 조회 (공개)
POST   /invitations/accept                    초대 수락
DELETE /invitations/{uuid}                    초대장 삭제

# 알림
GET    /families/{uuid}/notifications                         알림 목록
GET    /families/{uuid}/notifications/unread-count            읽지 않은 수
PATCH  /families/{uuid}/notifications/{uuid}/read             읽음 처리
POST   /families/{uuid}/notifications/mark-all-read           전체 읽음

# 반복 지출
POST   /families/{uuid}/recurring-expenses                    템플릿 등록
GET    /families/{uuid}/recurring-expenses                    목록 (month=YYYY-MM, generatedThisMonth 포함)
GET    /families/{uuid}/recurring-expenses/monthly-total      이번달 합계
PUT    /families/{uuid}/recurring-expenses/{uuid}             수정 (즉시 전체 반영, ADR-B13)
DELETE /families/{uuid}/recurring-expenses/{uuid}             종료 (ENDED, Soft Delete)

# 사용자 프로필
GET    /users/me/profile            프로필 조회
PUT    /users/me/profile            프로필 수정
```
