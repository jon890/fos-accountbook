# Phase 5: recurring + invitation + notification + dashboard 도메인 이동

## 컨텍스트

`fos-accountbook-backend`는 Spring Boot 3 + Java 21 기반 가족 가계부 백엔드다.
프로젝트 루트: `/Users/nhn/personal/fos-accountbook-backend`
소스 루트: `src/main/java/com/bifos/accountbook/`

Phase 1~4 완료 상태: `shared/`, `user/`, `family/`, `category/`, `expense/`, `income/` 패키지가 구성되어 있다.
이제 나머지 4개 도메인(`recurring/`, `invitation/`, `notification/`, `dashboard/`)을 일괄 이동한다.

반드시 먼저 읽을 문서:
- `CLAUDE.md` — 코딩 컨벤션
- `docs/code-architecture.md` — 도메인별 소유 원칙 (이벤트 리스너는 구독자 도메인)

## 목표

나머지 4개 도메인 패키지를 생성하고 관련 파일을 이동한 후, 전체 코드베이스의 import를 수정한다. 이 phase 완료 후 old 레이어 패키지(`presentation/`, `application/`, `domain/`, `infra/`)에는 파일이 남아있지 않아야 한다.

## 작업 목록

### recurring 도메인 이동 (old → new)

**recurring/domain/entity/**
- `domain/entity/RecurringExpense.java` → `recurring/domain/entity/RecurringExpense.java`
- `domain/entity/RecurringExpenseStatus.java` → `recurring/domain/value/RecurringExpenseStatus.java`

**recurring/domain/converter/**
- `domain/entity/converter/RecurringExpenseStatusConverter.java` → `recurring/domain/converter/RecurringExpenseStatusConverter.java`

**recurring/domain/repository/**
- `domain/repository/RecurringExpenseRepository.java` → `recurring/domain/repository/RecurringExpenseRepository.java`

**recurring/infra/repository/impl/**
- `infra/persistence/repository/impl/RecurringExpenseRepositoryImpl.java` → `recurring/infra/repository/impl/RecurringExpenseRepositoryImpl.java`

**recurring/infra/repository/jpa/**
- `infra/persistence/repository/jpa/RecurringExpenseJpaRepository.java` → `recurring/infra/repository/jpa/RecurringExpenseJpaRepository.java`

**recurring/application/service/**
- `application/service/RecurringExpenseService.java` → `recurring/application/service/RecurringExpenseService.java`
- `application/service/RecurringExpenseScheduler.java` → `recurring/application/service/RecurringExpenseScheduler.java`

**recurring/application/dto/**
- `application/dto/recurringexpense/RecurringExpenseDto.java` → `recurring/application/dto/RecurringExpenseDto.java`

**recurring/application/event/** (발행자 원칙)
- `application/event/RecurringExpenseCreatedEvent.java` → `recurring/application/event/RecurringExpenseCreatedEvent.java`

**recurring/presentation/controller/**
- `presentation/controller/RecurringExpenseController.java` → `recurring/presentation/controller/RecurringExpenseController.java`

**recurring/presentation/dto/**
- `presentation/dto/recurringexpense/CreateRecurringExpenseRequest.java` → `recurring/presentation/dto/CreateRecurringExpenseRequest.java`
- `presentation/dto/recurringexpense/GetRecurringExpensesResponse.java` → `recurring/presentation/dto/GetRecurringExpensesResponse.java`
- `presentation/dto/recurringexpense/RecurringExpenseResponse.java` → `recurring/presentation/dto/RecurringExpenseResponse.java`
- `presentation/dto/recurringexpense/UpdateRecurringExpenseRequest.java` → `recurring/presentation/dto/UpdateRecurringExpenseRequest.java`

### invitation 도메인 이동 (old → new)

**invitation/domain/entity/**
- `domain/entity/Invitation.java` → `invitation/domain/entity/Invitation.java`

**invitation/domain/value/**
- `domain/value/InvitationStatus.java` → `invitation/domain/value/InvitationStatus.java`

**invitation/domain/converter/**
- `domain/entity/converter/InvitationStatusConverter.java` → `invitation/domain/converter/InvitationStatusConverter.java`

**invitation/domain/repository/**
- `domain/repository/InvitationRepository.java` → `invitation/domain/repository/InvitationRepository.java`

**invitation/infra/repository/impl/**
- `infra/persistence/repository/impl/InvitationRepositoryImpl.java` → `invitation/infra/repository/impl/InvitationRepositoryImpl.java`

**invitation/infra/repository/jpa/**
- `infra/persistence/repository/jpa/InvitationJpaRepository.java` → `invitation/infra/repository/jpa/InvitationJpaRepository.java`

**invitation/application/service/**
- `application/service/InvitationService.java` → `invitation/application/service/InvitationService.java`

**invitation/application/dto/**
- `application/dto/invitation/AcceptInvitationRequest.java` → `invitation/application/dto/AcceptInvitationRequest.java`
- `application/dto/invitation/CreateInvitationRequest.java` → `invitation/application/dto/CreateInvitationRequest.java`
- `application/dto/invitation/InvitationResponse.java` → `invitation/application/dto/InvitationResponse.java`

**invitation/presentation/controller/**
- `presentation/controller/InvitationController.java` → `invitation/presentation/controller/InvitationController.java`

### notification 도메인 이동 (old → new)

**notification/domain/entity/**
- `domain/entity/Notification.java` → `notification/domain/entity/Notification.java`

**notification/domain/value/**
- `domain/value/NotificationType.java` → `notification/domain/value/NotificationType.java`

**notification/domain/converter/**
- `domain/entity/converter/NotificationTypeConverter.java` → `notification/domain/converter/NotificationTypeConverter.java`

**notification/domain/repository/**
- `domain/repository/NotificationRepository.java` → `notification/domain/repository/NotificationRepository.java`

**notification/infra/repository/impl/**
- `infra/persistence/repository/impl/NotificationRepositoryImpl.java` → `notification/infra/repository/impl/NotificationRepositoryImpl.java`

**notification/infra/repository/jpa/**
- `infra/persistence/repository/jpa/NotificationJpaRepository.java` → `notification/infra/repository/jpa/NotificationJpaRepository.java`

**notification/application/service/**
- `application/service/NotificationService.java` → `notification/application/service/NotificationService.java`
- `application/service/BudgetAlertService.java` → `notification/application/service/BudgetAlertService.java`

**notification/application/event/** (리스너는 구독자 도메인에 배치)
- `application/event/listener/BudgetAlertEventListener.java` → `notification/application/event/BudgetAlertEventListener.java`
- `application/event/listener/RecurringExpenseEventListener.java` → `notification/application/event/RecurringExpenseEventListener.java`

**notification/application/dto/**
- `application/dto/notification/NotificationListResponse.java` → `notification/application/dto/NotificationListResponse.java`
- `application/dto/notification/NotificationResponse.java` → `notification/application/dto/NotificationResponse.java`

**notification/presentation/controller/**
- `presentation/controller/NotificationController.java` → `notification/presentation/controller/NotificationController.java`

### dashboard 도메인 이동 (old → new)

**dashboard/domain/repository/**
- `domain/repository/DashboardRepository.java` → `dashboard/domain/repository/DashboardRepository.java`

**dashboard/infra/repository/impl/**
- `infra/persistence/repository/impl/DashboardRepositoryImpl.java` → `dashboard/infra/repository/impl/DashboardRepositoryImpl.java`

**dashboard/application/service/**
- `application/service/DashboardService.java` → `dashboard/application/service/DashboardService.java`

**dashboard/application/dto/**
- `application/dto/dashboard/DailyStat.java` → `dashboard/application/dto/DailyStat.java`
- `application/dto/dashboard/DailyStatsResponse.java` → `dashboard/application/dto/DailyStatsResponse.java`
- `application/dto/dashboard/MonthlyStatsResponse.java` → `dashboard/application/dto/MonthlyStatsResponse.java`

**dashboard/presentation/controller/**
- `presentation/controller/DashboardController.java` → `dashboard/presentation/controller/DashboardController.java`

### 이동 절차

1. 새 디렉터리 구조 생성 (`mkdir -p`)
2. `git mv`로 모든 파일 이동
3. 이동된 파일의 `package` 선언 수정
4. **전체 코드베이스**(src/main + src/test)에서 old import → new import 일괄 수정

### import 매핑 핵심

각 파일의 old 패키지 경로 → new 패키지 경로를 기계적으로 매핑. 패턴:
```
com.bifos.accountbook.domain.entity.{Class} → com.bifos.accountbook.{domain}.domain.entity.{Class}
com.bifos.accountbook.domain.value.{Enum} → com.bifos.accountbook.{domain}.domain.value.{Enum}
com.bifos.accountbook.domain.repository.{Repo} → com.bifos.accountbook.{domain}.domain.repository.{Repo}
com.bifos.accountbook.application.service.{Service} → com.bifos.accountbook.{domain}.application.service.{Service}
com.bifos.accountbook.application.dto.{sub}.{Dto} → com.bifos.accountbook.{domain}.application.dto.{Dto}
com.bifos.accountbook.application.event.{Event} → com.bifos.accountbook.{domain}.application.event.{Event}
com.bifos.accountbook.application.event.listener.{Listener} → com.bifos.accountbook.notification.application.event.{Listener}
com.bifos.accountbook.presentation.controller.{Controller} → com.bifos.accountbook.{domain}.presentation.controller.{Controller}
com.bifos.accountbook.presentation.dto.recurringexpense.{Dto} → com.bifos.accountbook.recurring.presentation.dto.{Dto}
com.bifos.accountbook.infra.persistence.repository.impl.{Impl} → com.bifos.accountbook.{domain}.infra.repository.impl.{Impl}
com.bifos.accountbook.infra.persistence.repository.jpa.{Jpa} → com.bifos.accountbook.{domain}.infra.repository.jpa.{Jpa}
```

## 성공 기준

- 모든 파일이 `recurring/`, `invitation/`, `notification/`, `dashboard/` 하위 올바른 위치에 존재
- old 레이어 패키지(`presentation/`, `application/`, `domain/`, `infra/`)에 이동 대상 파일이 남아있지 않음
- `./gradlew build -x test -x checkstyleMain -x checkstyleTest --no-daemon` 성공

## 주의사항

- `RecurringExpenseStatus.java`는 현재 `domain/entity/` 에 있지만, 도메인 구조상 `recurring/domain/value/`로 이동
- 이벤트 리스너(`BudgetAlertEventListener`, `RecurringExpenseEventListener`)는 notification 도메인에 배치 (구독자 원칙). 이 리스너들은 expense, recurring 도메인의 이벤트 클래스를 import하게 됨 (의도된 cross-domain 참조)
- `RecurringExpenseScheduler`는 `ExpenseRepository`를 직접 참조 — cross-domain 참조 허용 (향후 이벤트 전환 후보)
- `BudgetAlertService`는 `ExpenseRepository`, `FamilyRepository`, `NotificationRepository`, `FamilyMemberRepository`를 직접 참조 — 이벤트 구독자로서 허용
- `Invitation` 엔티티의 `@ManyToOne Family`, `@ManyToOne User`는 유지
- `git mv` 사용하여 git history 보존
- 테스트 파일의 import도 반드시 수정

## Blocked 조건

4개 도메인 디렉터리 중 하나라도 이미 존재하고 파일이 있으면:
`PHASE_BLOCKED: recurring/invitation/notification/dashboard 패키지 중 이미 존재하는 것이 있음 — 기존 구조 확인 필요`
