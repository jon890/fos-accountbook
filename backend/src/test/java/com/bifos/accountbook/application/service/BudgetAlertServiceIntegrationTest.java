package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.dto.family.CreateFamilyRequest;
import com.bifos.accountbook.application.dto.family.FamilyResponse;
import com.bifos.accountbook.common.FosSpringBootTest;
import com.bifos.accountbook.common.TestFixtures;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.Notification;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.NotificationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * BudgetAlertService 통합 테스트
 * 실제 지출 생성을 통해 예산 알림이 정상적으로 생성되는지 검증합니다.
 */
@FosSpringBootTest
@DisplayName("예산 알림 서비스 통합 테스트")
class BudgetAlertServiceIntegrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private FamilyService familyService;

    @Autowired
    private NotificationRepository notificationRepository;
    
    private TestFixtures fixtures;

    @BeforeEach
    void setUp() {
        // TestFixtures 초기화
        this.fixtures = new TestFixtures(applicationContext);
    }
    
    @AfterEach
    void tearDown() {
        // SecurityContext 정리
        SecurityContextHolder.clearContext();
        
        // Fixtures 캐시 정리
        if (fixtures != null) {
            fixtures.clear();
        }
    }
    
    /**
     * 예산이 설정된 가족 + 기본 카테고리 생성 헬퍼 메서드
     * @return {testUser, testFamily, testCategory}
     */
    private TestData createTestFamilyWithBudget() {
        User testUser = fixtures.getDefaultUser();
        
        CreateFamilyRequest familyRequest = CreateFamilyRequest.builder()
                .name("예산 알림 테스트 가족")
                .monthlyBudget(new BigDecimal("1000000.00"))  // 월 예산 100만원
                .build();
        FamilyResponse testFamily = familyService.createFamily(testUser.getUuid(), familyRequest);
        
        // FamilyService는 기본 카테고리 10개를 자동 생성하므로 첫 번째 카테고리를 사용
        java.util.List<com.bifos.accountbook.domain.entity.Category> categories = 
            applicationContext.getBean(com.bifos.accountbook.domain.repository.CategoryRepository.class)
                .findAllByFamilyUuid(com.bifos.accountbook.domain.value.CustomUuid.from(testFamily.getUuid()));
        Category testCategory = categories.getFirst();
        
        return new TestData(testUser, testFamily, testCategory);
    }
    
    // 헬퍼 레코드
    private record TestData(User testUser, FamilyResponse testFamily, Category testCategory) {}

    @Test
    @DisplayName("예산의 50%를 초과하면 50% 알림이 생성된다")
    void shouldCreateNotification_When50PercentExceeded() {
        // Given: TestFixtures로 예산 설정된 가족 + 카테고리 생성
        TestData data = createTestFamilyWithBudget();
        
        // 예산의 50%를 초과하는 지출
        CreateExpenseRequest request = new CreateExpenseRequest(
                data.testCategory.getUuid().getValue(),
                new BigDecimal("550000.00"),  // 55만원 (예산의 55%)
                "50% 초과 테스트 지출",
                LocalDateTime.now()
        );

        // When: 지출 생성
        expenseService.createExpense(
                data.testUser.getUuid(),
                data.testFamily.getUuid(),
                request
        );

        // Then: 비동기 알림 생성을 기다림 (Awaitility 사용)
        await()
                .atMost(3, TimeUnit.SECONDS)
                .pollInterval(100, TimeUnit.MILLISECONDS)
                .untilAsserted(() -> {
                    List<Notification> notifications = notificationRepository
                            .findAllByFamilyUuidOrderByCreatedAtDesc(com.bifos.accountbook.domain.value.CustomUuid.from(data.testFamily.getUuid()));

                    assertThat(notifications).isNotEmpty();
                    assertThat(notifications).anyMatch(n ->
                            n.getTitle().contains("50%") && n.getType().getCode().equals("BUDGET_50_EXCEEDED")
                    );
                });
    }

    @Test
    @DisplayName("예산의 80%를 초과하면 80% 알림이 생성된다")
    void shouldCreateNotification_When80PercentExceeded() {
        // Given: TestFixtures로 예산 설정된 가족 + 카테고리 생성
        TestData data = createTestFamilyWithBudget();
        
        CreateExpenseRequest request = new CreateExpenseRequest(
                data.testCategory.getUuid().getValue(),
                new BigDecimal("850000.00"),  // 85만원 (예산의 85%)
                "80% 초과 테스트 지출",
                LocalDateTime.now()
        );

        // When: 지출 생성
        expenseService.createExpense(
                data.testUser.getUuid(),
                data.testFamily.getUuid(),
                request
        );

        // Then: 비동기 알림 생성을 기다림
        await()
                .atMost(3, TimeUnit.SECONDS)
                .pollInterval(100, TimeUnit.MILLISECONDS)
                .untilAsserted(() -> {
                    List<Notification> notifications = notificationRepository
                            .findAllByFamilyUuidOrderByCreatedAtDesc(com.bifos.accountbook.domain.value.CustomUuid.from(data.testFamily.getUuid()));

                    assertThat(notifications).isNotEmpty();
                    assertThat(notifications).anyMatch(n ->
                            n.getTitle().contains("80%") && n.getType().getCode().equals("BUDGET_80_EXCEEDED")
                    );
                });
    }

    @Test
    @DisplayName("예산의 100%를 초과하면 100% 알림이 생성된다")
    void shouldCreateNotification_When100PercentExceeded() {
        // Given: TestFixtures로 예산 설정된 가족 + 카테고리 생성
        TestData data = createTestFamilyWithBudget();
        
        CreateExpenseRequest request = new CreateExpenseRequest(
                data.testCategory.getUuid().getValue(),
                new BigDecimal("1050000.00"),  // 105만원 (예산의 105%)
                "100% 초과 테스트 지출",
                LocalDateTime.now()
        );

        // When: 지출 생성
        expenseService.createExpense(
                data.testUser.getUuid(),
                data.testFamily.getUuid(),
                request
        );

        // Then: 비동기 알림 생성을 기다림
        await()
                .atMost(3, TimeUnit.SECONDS)
                .pollInterval(100, TimeUnit.MILLISECONDS)
                .untilAsserted(() -> {
                    List<Notification> notifications = notificationRepository
                            .findAllByFamilyUuidOrderByCreatedAtDesc(com.bifos.accountbook.domain.value.CustomUuid.from(data.testFamily.getUuid()));

                    assertThat(notifications).isNotEmpty();
                    assertThat(notifications).anyMatch(n ->
                            n.getTitle().contains("100%") && n.getType().getCode().equals("BUDGET_100_EXCEEDED")
                    );
                });
    }

    @Test
    @DisplayName("같은 월에 동일한 타입의 알림은 중복 생성되지 않는다")
    void shouldNotCreateDuplicateNotification_InSameMonth() {
        // Given: TestFixtures로 예산 설정된 가족 + 카테고리 생성
        TestData data = createTestFamilyWithBudget();
        
        CreateExpenseRequest firstRequest = new CreateExpenseRequest(
                data.testCategory.getUuid().getValue(),
                new BigDecimal("550000.00"),
                "첫 번째 지출",
                LocalDateTime.now()
        );

        expenseService.createExpense(data.testUser.getUuid(), data.testFamily.getUuid(), firstRequest);

        // 첫 번째 알림 생성 대기
        await()
                .atMost(3, TimeUnit.SECONDS)
                .untilAsserted(() -> {
                    List<Notification> notifications = notificationRepository
                            .findAllByFamilyUuidOrderByCreatedAtDesc(com.bifos.accountbook.domain.value.CustomUuid.from(data.testFamily.getUuid()));
                    assertThat(notifications).isNotEmpty();
                });

        // When: 두 번째 지출 (여전히 50% 초과 구간)
        CreateExpenseRequest secondRequest = new CreateExpenseRequest(
                data.testCategory.getUuid().getValue(),
                new BigDecimal("50000.00"),
                "두 번째 지출",
                LocalDateTime.now()
        );

        expenseService.createExpense(data.testUser.getUuid(), data.testFamily.getUuid(), secondRequest);

        // Then: 잠시 대기 후 50% 알림은 여전히 1개만 존재해야 함
        await()
                .atMost(2, TimeUnit.SECONDS)
                .untilAsserted(() -> {
                    List<Notification> notifications = notificationRepository
                            .findAllByFamilyUuidOrderByCreatedAtDesc(com.bifos.accountbook.domain.value.CustomUuid.from(data.testFamily.getUuid()));

                    long count50 = notifications.stream()
                            .filter(n -> n.getType().getCode().equals("BUDGET_50_EXCEEDED"))
                            .count();

                    assertThat(count50).isEqualTo(1);
                });
    }

    @Test
    @DisplayName("예산이 설정되지 않은 가족은 알림이 생성되지 않는다")
    void shouldNotCreateNotification_WhenBudgetNotSet() {
        // Given: TestFixtures로 사용자 생성 + 예산 미설정 가족 생성
        User testUser = fixtures.getDefaultUser();

        CreateFamilyRequest familyRequest = CreateFamilyRequest.builder()
                .name("예산 미설정 가족")
                .build();
        FamilyResponse noBudgetFamily = familyService.createFamily(testUser.getUuid(), familyRequest);

        java.util.List<com.bifos.accountbook.domain.entity.Category> categories = 
            applicationContext.getBean(com.bifos.accountbook.domain.repository.CategoryRepository.class)
                .findAllByFamilyUuid(com.bifos.accountbook.domain.value.CustomUuid.from(noBudgetFamily.getUuid()));
        Category category = categories.getFirst();

        // When: 지출 생성
        CreateExpenseRequest request = new CreateExpenseRequest(
                category.getUuid().getValue(),
                new BigDecimal("999999.00"),  // 아무리 큰 금액이어도
                "예산 미설정 가족 지출",
                LocalDateTime.now()
        );

        expenseService.createExpense(testUser.getUuid(), noBudgetFamily.getUuid(), request);

        // Then: 잠시 대기 후에도 알림이 생성되지 않아야 함
        await()
                .during(1, TimeUnit.SECONDS)
                .atMost(2, TimeUnit.SECONDS)
                .until(() -> {
                    List<Notification> notifications = notificationRepository
                            .findAllByFamilyUuidOrderByCreatedAtDesc(com.bifos.accountbook.domain.value.CustomUuid.from(noBudgetFamily.getUuid()));
                    return notifications.isEmpty();
                });
    }

    @Test
    @DisplayName("여러 단계를 순차적으로 초과하면 각 단계의 알림이 생성된다")
    void shouldCreateMultipleNotifications_WhenExceedingMultipleThresholds() {
        // Given: TestFixtures로 예산 설정된 가족 + 카테고리 생성
        TestData data = createTestFamilyWithBudget();
        
        // Given & When: 50% 초과
        CreateExpenseRequest request1 = new CreateExpenseRequest(
                data.testCategory.getUuid().getValue(),
                new BigDecimal("550000.00"),
                "50% 초과",
                LocalDateTime.now()
        );
        expenseService.createExpense(data.testUser.getUuid(), data.testFamily.getUuid(), request1);

        // 50% 알림 생성 대기
        await().atMost(3, TimeUnit.SECONDS).untilAsserted(() ->
                assertThat(notificationRepository.findAllByFamilyUuidOrderByCreatedAtDesc(
                        com.bifos.accountbook.domain.value.CustomUuid.from(data.testFamily.getUuid()))).hasSize(1));

        // When: 추가 지출로 80% 초과
        CreateExpenseRequest request2 = new CreateExpenseRequest(
                data.testCategory.getUuid().getValue(),
                new BigDecimal("300000.00"),
                "80% 초과",
                LocalDateTime.now()
        );
        expenseService.createExpense(data.testUser.getUuid(), data.testFamily.getUuid(), request2);

        // 80% 알림 생성 대기
        await().atMost(3, TimeUnit.SECONDS).untilAsserted(() ->
                assertThat(notificationRepository.findAllByFamilyUuidOrderByCreatedAtDesc(
                        com.bifos.accountbook.domain.value.CustomUuid.from(data.testFamily.getUuid()))).hasSize(2));

        // When: 추가 지출로 100% 초과
        CreateExpenseRequest request3 = new CreateExpenseRequest(
                data.testCategory.getUuid().getValue(),
                new BigDecimal("200000.00"),
                "100% 초과",
                LocalDateTime.now()
        );
        expenseService.createExpense(data.testUser.getUuid(), data.testFamily.getUuid(), request3);

        // Then: 3개의 알림이 모두 생성되어야 함
        await()
                .atMost(3, TimeUnit.SECONDS)
                .untilAsserted(() -> {
                    List<Notification> notifications = notificationRepository
                            .findAllByFamilyUuidOrderByCreatedAtDesc(com.bifos.accountbook.domain.value.CustomUuid.from(data.testFamily.getUuid()));

                    assertThat(notifications).hasSize(3);
                    assertThat(notifications).anyMatch(n -> n.getType().getCode().equals("BUDGET_50_EXCEEDED"));
                    assertThat(notifications).anyMatch(n -> n.getType().getCode().equals("BUDGET_80_EXCEEDED"));
                    assertThat(notifications).anyMatch(n -> n.getType().getCode().equals("BUDGET_100_EXCEEDED"));
                });
    }
}
