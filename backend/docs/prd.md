# PRD — fos-accountbook-backend

> 가족 가계부 백엔드 서비스의 제품 요구사항 문서.
> 기술 구현 세부사항은 `code-architecture.md`, 기술 결정은 `adr.md` 참고.

---

## 제품 개요

**fos-accountbook**: 가족 단위 가계부 서비스. 가족 구성원이 공동으로 수입/지출을 기록하고, 예산을 관리하며, 반복 지출을 자동화한다.

**핵심 가치**: 가족 구성원 간 재무 투명성과 공동 관리

**사용자**: 가족 단위 (2~6명). 1인이 Owner로 가족을 생성하고, 초대 링크로 구성원을 추가한다.

---

## 도메인 구조

| 도메인           | 핵심 책임                                    | 엔티티               |
| ---------------- | -------------------------------------------- | -------------------- |
| **user**         | 사용자 인증, 프로필 관리                     | User, UserProfile    |
| **family**       | 가족 생성/관리, 멤버십, 역할(OWNER/MEMBER)   | Family, FamilyMember |
| **category**     | 지출/수입 분류 체계, 기본 카테고리 관리      | Category             |
| **expense**      | 지출 기록, 검색, 예산 제외 플래그            | Expense              |
| **income**       | 수입 기록, 검색                              | Income               |
| **recurring**    | 반복 지출 템플릿, 자동 생성 스케줄러         | RecurringExpense     |
| **invitation**   | 가족 초대 링크 생성/수락                     | Invitation           |
| **notification** | 예산 알림, 반복 지출 알림                    | Notification         |
| **dashboard**    | 월별/일별 통계, 카테고리별 집계 (read model) | —                    |

---

## 기능 요구사항

### F1. 인증

- 소셜 로그인 (Google, Naver) → 백엔드 JWT 발급
- Access Token 15분 / Refresh Token 7일
- 모든 API는 `Authorization: Bearer <token>` 필수 (공개 엔드포인트 제외)

### F2. 가족 관리

- 가족 생성 시 기본 카테고리 자동 생성 (미분류, 식비, 카페, 간식, 생활비, 교통비, 쇼핑, 의료, 문화생활, 교육, 기타)
- OWNER: 가족 수정/삭제, 초대장 관리
- MEMBER: 데이터 등록/조회 (가족 내 모든 데이터 열람 가능)
- 월 예산 설정 (0 = 미설정)

### F3. 지출/수입

- 가족 범위 내 CRUD
- 카테고리, 날짜 범위, 사용자별 필터링 (페이징)
- 지출: `exclude_from_budget` 플래그로 예산 집계 제외 가능
- Soft Delete (ACTIVE → DELETED)

### F4. 카테고리

- 가족별 카테고리 관리 (색상, 아이콘)
- `is_default=true`: 삭제 불가. 카테고리 삭제 시 해당 지출/반복지출이 기본 카테고리로 이동 (수입은 미구현)
- `exclude_from_budget`: 해당 카테고리의 지출은 예산 집계에서 제외
- Caffeine 캐시 (TTL 10분, ADR-B05/B06)

### F5. 반복 지출

- 템플릿 등록 (이름, 금액, 매월 N일)
- day_of_month: 1~28만 허용 (월말 불일치 방지)
- 매일 새벽 1시 스케줄러 → 해당일 템플릿의 Expense 자동 생성
- 멱등성: `(recurring_expense_uuid, year_month)` UNIQUE constraint
- 수정 시 즉시 전체 반영 (ADR-B13)

### F6. 예산 알림

- 월 예산 대비 지출 비율 알림: 50%, 80%, 100% 초과 시
- 반복 지출 자동 생성 시 알림
- `(familyUuid, type, yearMonth)` 기준 중복 방지
- 이벤트 기반 (ADR-B08): 지출 생성/수정 → 알림 체크

### F7. 초대

- OWNER가 초대 링크 생성 (UUID 기반 토큰, 만료 기한)
- 비로그인 사용자도 토큰으로 초대장 조회 가능
- 수락 시 해당 가족에 MEMBER로 가입

### F8. 대시보드

- 월별 통계: 총 지출, 총 수입, 예산 대비 비율
- 일별 통계: 날짜별 지출 추이
- 카테고리별 지출 비중

---

## 비기능 요구사항

| 항목     | 현재              | 비고                                             |
| -------- | ----------------- | ------------------------------------------------ |
| 배포     | 단일 서버         | MSA 전환 시 도메인별 분리 가능하도록 설계        |
| 캐시     | Caffeine 로컬     | 분산 환경 시 Redis 전환 (ADR-B06)                |
| DB       | MySQL 8.4 LTS     | 도메인별 스키마 분리는 하지 않음 (단일 DB)       |
| 인증     | JWT HS512         | 다중 서버 시 RS256 + JWKS 전환 검토              |
| 스케줄러 | Spring @Scheduled | 분산 환경 시 ShedLock 또는 Quartz 검토 (ADR-B12) |

---

## 현재 이니셔티브: 도메인 기반 패키지 리팩토링

### 목표

레이어 중심(`presentation/application/domain/infra`) → 도메인 중심(`expense/`, `category/` 등) 패키지 구조로 전환. 각 도메인 패키지 내에 레이어 구조를 유지한다.

### 동기

- 도메인이 10개로 증가 → "지출 수정하려면 4개 패키지를 넘나들어야 함" 문제
- 도메인 단위 코드 응집도 향상 → 해당 도메인만 보면 전체 흐름 파악 가능
- 향후 MSA 전환 시 도메인 패키지를 그대로 독립 모듈로 추출 가능

### 범위

- **In Scope**: 패키지 구조 변경 (import 경로만 변경, 로직 변경 없음)
- **Out of Scope**: JPA 연관관계 제거, 이벤트 전환, Gradle 멀티모듈 분리

### 성공 기준

1. 전체 빌드 + 테스트 통과
2. 각 도메인 패키지가 자체 레이어(presentation/application/domain/infra) 보유
3. 도메인 간 의존은 `shared/` 또는 타 도메인의 public interface를 통해서만

### 제약

- Big Bang 방식 (1 PR)
- DB 스키마 변경 없음
- Spring `@ComponentScan` 범위 변경 없음 (`com.bifos.accountbook` 하위 전체 스캔)
