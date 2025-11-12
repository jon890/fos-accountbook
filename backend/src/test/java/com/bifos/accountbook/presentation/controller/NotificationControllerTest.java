package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.dto.family.CreateFamilyRequest;
import com.bifos.accountbook.application.dto.family.FamilyResponse;
import com.bifos.accountbook.application.service.ExpenseService;
import com.bifos.accountbook.application.service.FamilyService;
import com.bifos.accountbook.common.AbstractControllerTest;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.CategoryRepository;
import com.bifos.accountbook.domain.repository.NotificationRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * NotificationController 통합 테스트
 */
@DisplayName("알림 컨트롤러 통합 테스트")
class NotificationControllerTest extends AbstractControllerTest {

    @Autowired
    private FamilyService familyService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    private User testUser;
    private FamilyResponse testFamily;
    private Category testCategory;

    @BeforeEach
    void setUp() {
        // TestFixtures로 기본 유저 생성
        testUser = fixtures.getDefaultUser();

        // 예산이 설정된 가족 생성
        CreateFamilyRequest familyRequest = CreateFamilyRequest.builder()
                .name("알림 테스트 가족")
                .monthlyBudget(new BigDecimal("1000000.00"))
                .build();
        testFamily = familyService.createFamily(testUser.getUuid(), familyRequest);

        // 테스트 카테고리 조회
        List<Category> categories = categoryRepository.findAllByFamilyUuid(
                CustomUuid.from(testFamily.getUuid()));
        testCategory = categories.get(0);

        // 테스트용 알림 생성 (예산 초과 지출 생성)
        CreateExpenseRequest expenseRequest = new CreateExpenseRequest(
                testCategory.getUuid().getValue(),
                new BigDecimal("550000.00"),
                "테스트 지출",
                LocalDateTime.now()
        );
        expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expenseRequest);

        // 비동기 알림 생성 대기 (Awaitility 사용)
        await()
                .atMost(3, TimeUnit.SECONDS)
                .untilAsserted(() -> {
                    List<com.bifos.accountbook.domain.entity.Notification> notifications =
                            notificationRepository.findAllByFamilyUuidOrderByCreatedAtDesc(
                                    CustomUuid.from(testFamily.getUuid()));
                    assertThat(notifications).isNotEmpty();
                });
    }

    @Test
    @DisplayName("가족 알림 목록을 조회할 수 있다")
    void getFamilyNotifications_Success() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/families/{familyUuid}/notifications", testFamily.getUuid())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.notifications").isArray())
                .andExpect(jsonPath("$.data.unreadCount").isNumber())
                .andExpect(jsonPath("$.data.totalCount").isNumber());
    }

    @Test
    @DisplayName("읽지 않은 알림 수를 조회할 수 있다")
    void getUnreadCount_Success() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/families/{familyUuid}/notifications/unread-count", testFamily.getUuid())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.unreadCount").isNumber());
    }

    @Test
    @DisplayName("알림을 읽음 처리할 수 있다")
    void markAsRead_Success() throws Exception {
        // Given: 알림 조회
        String notificationUuid = notificationRepository
                .findAllByFamilyUuidOrderByCreatedAtDesc(CustomUuid.from(testFamily.getUuid()))
                .get(0)
                .getNotificationUuid()
                .getValue();

        // When & Then
        mockMvc.perform(patch("/api/v1/notifications/{notificationUuid}/read", notificationUuid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("알림을 읽음 처리했습니다"))
                .andExpect(jsonPath("$.data.isRead").value(true));
    }

    @Test
    @DisplayName("모든 알림을 읽음 처리할 수 있다")
    void markAllAsRead_Success() throws Exception {
        // When & Then
        mockMvc.perform(post("/api/v1/families/{familyUuid}/notifications/mark-all-read", testFamily.getUuid())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.message").value("모든 알림을 읽음 처리했습니다"));

        // Then: 읽지 않은 알림 수가 0이 되었는지 확인
        mockMvc.perform(get("/api/v1/families/{familyUuid}/notifications/unread-count", testFamily.getUuid())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.unreadCount").value(0));
    }

    @Test
    @DisplayName("존재하지 않는 알림을 조회하면 404 에러가 발생한다")
    void getNotification_NotFound() throws Exception {
        // Given: 존재하지 않는 UUID
        String nonExistentUuid = CustomUuid.generate().getValue();

        // When & Then
        mockMvc.perform(get("/api/v1/notifications/{notificationUuid}", nonExistentUuid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("알림 상세 조회가 정상적으로 동작한다")
    void getNotification_Success() throws Exception {
        // Given: 알림 조회
        String notificationUuid = notificationRepository
                .findAllByFamilyUuidOrderByCreatedAtDesc(CustomUuid.from(testFamily.getUuid()))
                .get(0)
                .getNotificationUuid()
                .getValue();

        // When & Then
        mockMvc.perform(get("/api/v1/notifications/{notificationUuid}", notificationUuid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.notificationUuid").value(notificationUuid))
                .andExpect(jsonPath("$.data.familyUuid").value(testFamily.getUuid()))
                .andExpect(jsonPath("$.data.type").exists())
                .andExpect(jsonPath("$.data.title").exists())
                .andExpect(jsonPath("$.data.message").exists());
    }
}
