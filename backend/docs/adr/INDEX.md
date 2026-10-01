# ADR 목록 (백엔드)

백엔드 결정은 여기, 프론트엔드는 `frontend/docs/adr/INDEX.md`, 저장소 전체는 `docs/adr/INDEX.md` 가 소유한다.
새 결정은 파일 하나를 만들고 아래 표에 한 줄을 더한다(ADR-M02).

| 번호 | 결정 | 상태 |
| --- | --- | --- |
| [ADR-B01](ADR-B01-java-spring-mysql.md) | Java 21 + Spring Boot + MySQL 8.4 LTS | accepted |
| [ADR-B02](ADR-B02-uuid-dual-key.md) | UUID 이중 키 전략 | accepted |
| [ADR-B03](ADR-B03-soft-delete-strategy.md) | Soft Delete 전략 | accepted |
| [ADR-B04](ADR-B04-jwt-authentication.md) | JWT 인증 | accepted |
| [ADR-B05](ADR-B05-category-cache-strategy.md) | Category 캐시 전략 | accepted |
| [ADR-B06](ADR-B06-caffeine-local-cache.md) | Caffeine 로컬 캐시 | accepted |
| [ADR-B07](ADR-B07-bigdecimal-money-handling.md) | BigDecimal 금액 처리 | accepted |
| [ADR-B08](ADR-B08-event-budget-notifications.md) | 이벤트 기반 예산 알림 | accepted |
| [ADR-B09](ADR-B09-family-member-roles.md) | FamilyMember 역할 기반 권한 | accepted |
| [ADR-B10](ADR-B10-querydsl-dynamic-queries.md) | QueryDSL 동적 쿼리 | accepted |
| [ADR-B11](ADR-B11-api-versioning-strategy.md) | API 버전 관리 전략 | accepted |
| [ADR-B12](ADR-B12-recurring-expense-scheduler.md) | 반복 지출 스케줄러 | accepted |
| [ADR-B13](ADR-B13-recurring-expense-update.md) | 반복 지출 수정 전략 | accepted |
| [ADR-B14](ADR-B14-ci-code-review.md) | CI 코드 리뷰 워크플로 (대체됨) | superseded |
| [ADR-B15](ADR-B15-flyway-backtick-convention.md) | Flyway SQL 백틱 컨벤션 | accepted |
| [ADR-B16](ADR-B16-domain-package-structure.md) | 도메인 기반 패키지 리팩토링 | accepted |
| [ADR-B17](ADR-B17-social-login-signature.md) | 소셜 로그인 서명 | accepted |
| [ADR-B18](ADR-B18-agent-integration-token.md) | 외부 에이전트 연동 토큰 | accepted |
| [ADR-B19](ADR-B19-jwt-token-type-claim.md) | access token 과 refresh token 을 typ 클레임으로 구분한다 | accepted |
| [ADR-B20](ADR-B20-log-body-policy.md) | 운영 로그에 요청과 응답 본문을 남기지 않는다 | accepted |
| [ADR-B21](ADR-B21-business-date-asia-seoul.md) | 업무 날짜 판정은 Asia/Seoul로 하고 기본 Clock은 유지한다 | accepted |
| [ADR-B22](ADR-B22-static-analysis-tools.md) | 코드 규칙은 도구 설정이 갖고 기존 위반은 기준 파일에 얼린다 | accepted |
