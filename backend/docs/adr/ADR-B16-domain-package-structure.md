# ADR-B16: 도메인 기반 패키지 리팩토링 (2026-04-05)

**결정**: 레이어 중심 패키지 구조(`presentation/application/domain/infra`)를 도메인 중심 구조(`expense/`, `category/` 등)로 전환한다. 각 도메인 패키지 내에 레이어 구조를 유지한다.

**이유**:

- 도메인이 10개로 증가하면서 하나의 기능을 수정하려면 4개 레이어 패키지를 넘나들어야 함 → 코드 탐색 비용 증가
- 도메인별 응집도를 높여 "이 패키지만 보면 전체 흐름을 파악할 수 있는" 구조 지향
- 향후 MSA 전환 시 도메인 패키지를 그대로 독립 모듈로 추출 가능한 구조적 기반 마련

**구조**:

```
com.bifos.accountbook
├── shared/       공통 (CustomUuid, ErrorCode, Auth, AOP, 공통 DTO)
├── expense/      지출 (presentation/application/domain/infra)
├── income/       수입
├── category/     카테고리
├── family/       가족, 멤버십
├── recurring/    반복 지출, 스케줄러
├── invitation/   초대
├── notification/ 알림, 예산 알림
├── dashboard/    대시보드 (read model)
├── user/         사용자, 인증, 프로필
└── config/       Spring 설정 (최상위 유지)
```

**핵심 배치 규칙**:

| 구성 요소               | 배치                        |
| ----------------------- | --------------------------- |
| Status enum + Converter | 해당 도메인의 `domain/`     |
| 이벤트 클래스           | 발행자 도메인               |
| 이벤트 리스너           | 구독자 도메인               |
| CategoryInfo DTO        | `category/application/dto/` |
| FamilyValidationService | `family/application/access/` (2026-10-02 이동, #419) |
| CodeEnum, CustomUuid    | `shared/value/`             |

**전략**: Big Bang (1 PR). import 경로만 변경, 로직 변경 없음. 테스트도 동일 구조로 이동.

**범위 제한 (Option A)**:

- ✅ 패키지 구조 변경
- ❌ JPA 연관관계 제거 (Expense↔Family 등) — 향후 별도 이니셔티브. Family 의 지출, 수입 컬렉션은 [ADR-B24](ADR-B24-family-without-transaction-collections.md) 로 없앴다
- ❌ 동기 호출 → 이벤트 전환 — 향후 별도 이니셔티브
- ❌ Gradle 멀티모듈 분리

**트레이드오프**:

- JPA `@ManyToOne` 관계가 유지되므로 진정한 MSA 독립 배포는 불가 → 이 단계에서는 코드 응집도 개선에 집중
- Big Bang PR은 diff가 크지만 로직 변경 없이 import만 바뀌므로 과도기 상태(old/new 혼재)보다 안전

---

