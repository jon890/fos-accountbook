package com.bifos.accountbook.presentation.controller;

import com.bifos.accountbook.application.dto.expense.CreateExpenseRequest;
import com.bifos.accountbook.application.service.ExpenseService;
import com.bifos.accountbook.domain.entity.Category;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.Notification;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.NotificationRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.FamilyMemberStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;
import org.hamcrest.Matchers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * NotificationController 통합 테스트
 */
@DisplayName("알림 컨트롤러 통합 테스트")
class NotificationControllerTest extends AbstractControllerTest {

  @Autowired
  private ExpenseService expenseService;

  @Autowired
  private NotificationRepository notificationRepository;

  @Autowired
  private FamilyMemberRepository familyMemberRepository;

  private User testUser;
  private Family testFamily;
  private Category testCategory;

  @BeforeEach
  void setUp() {
    doTransactionWithoutResult(() -> {
      testUser = fixtures.getDefaultUser();
      testFamily = fixtures.families.family()
                                    .owner(testUser)
                                    .budget(new BigDecimal("1000000.00"))
                                    .build();
      testCategory = fixtures.categories.category(testFamily)
                                        .build();
    });
  }

  /**
   * 다른 사용자를 생성하고 가족에 추가하는 헬퍼 메서드
   *
   * @param family 가족 엔티티
   * @return 생성된 다른 사용자
   */
  private User createOtherUserAndAddToFamily(Family family) {
    return doTransaction(() -> {
      // 다른 사용자 생성 (fixtures를 통해 자동으로 저장됨)
      User otherUser = fixtures.users.getOtherUser();

      // 가족 멤버로 추가
      FamilyMember otherMember =
          FamilyMember.builder()
                      .uuid(CustomUuid.generate())
                      .familyUuid(family.getUuid())
                      .userUuid(otherUser.getUuid())
                      .status(FamilyMemberStatus.ACTIVE)
                      .build();

      familyMemberRepository.save(otherMember);

      return otherUser;
    });
  }

  @Test
  @DisplayName("가족 알림 목록을 조회할 수 있다")
  void getFamilyNotifications_Success() throws Exception {
    // Given: 알림 생성 (예산 초과 지출)
    CreateExpenseRequest expenseRequest = new CreateExpenseRequest(testCategory.getUuid().getValue(),
                                                                   new BigDecimal("550000.00"),
                                                                   "테스트 지출",
                                                                   LocalDateTime.now(),
                                                                   null
    );
    expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expenseRequest);

    // When & Then
    mockMvc.perform(get("/api/v1/families/{familyUuid}/notifications", testFamily.getUuid().getValue())
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
    // Given: 알림 생성 (예산 초과 지출)
    CreateExpenseRequest expenseRequest = new CreateExpenseRequest(testCategory.getUuid().getValue(),
                                                                   new BigDecimal("550000.00"),
                                                                   "테스트 지출",
                                                                   LocalDateTime.now(),
                                                                   null);
    expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expenseRequest);

    // When & Then
    mockMvc.perform(get("/api/v1/families/{familyUuid}/notifications/unread-count", testFamily.getUuid().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.success").value(true))
           .andExpect(jsonPath("$.data.unreadCount").isNumber());
  }

  @Test
  @DisplayName("알림을 읽음 처리할 수 있다")
  void markAsRead_Success() throws Exception {
    // Given: 알림 생성 (예산 초과 지출)
    CreateExpenseRequest expenseRequest = new CreateExpenseRequest(testCategory.getUuid().getValue(),
                                                                   new BigDecimal("550000.00"),
                                                                   "테스트 지출",
                                                                   LocalDateTime.now(),
                                                                   null);
    expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expenseRequest);

    // 현재 사용자의 알림 조회
    String notificationUuid = notificationRepository
        .findByFamilyAndUser(testFamily.getUuid(), testUser.getUuid())
        .getFirst()
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
    // Given: 알림 생성 (예산 초과 지출)
    CreateExpenseRequest expenseRequest = new CreateExpenseRequest(testCategory.getUuid().getValue(),
                                                                   new BigDecimal("550000.00"),
                                                                   "테스트 지출",
                                                                   LocalDateTime.now(),
                                                                   null);
    expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expenseRequest);

    // When & Then
    mockMvc.perform(post("/api/v1/families/{familyUuid}/notifications/mark-all-read", testFamily.getUuid().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.success").value(true))
           .andExpect(jsonPath("$.message").value("모든 알림을 읽음 처리했습니다"));

    // Then: 읽지 않은 알림 수가 0이 되었는지 확인
    mockMvc.perform(get("/api/v1/families/{familyUuid}/notifications/unread-count", testFamily.getUuid().getValue())
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
    // Given: 알림 생성 (예산 초과 지출)
    CreateExpenseRequest expenseRequest = new CreateExpenseRequest(testCategory.getUuid().getValue(),
                                                                   new BigDecimal("550000.00"),
                                                                   "테스트 지출",
                                                                   LocalDateTime.now(),
                                                                   null);
    expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expenseRequest);

    // 알림 조회
    String notificationUuid = notificationRepository
        .findByFamilyAndUser(testFamily.getUuid(), testUser.getUuid())
        .getFirst()
        .getNotificationUuid()
        .getValue();

    // When & Then
    mockMvc.perform(get("/api/v1/notifications/{notificationUuid}", notificationUuid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.success").value(true))
           .andExpect(jsonPath("$.data.notificationUuid").value(notificationUuid))
           .andExpect(jsonPath("$.data.familyUuid").value(testFamily.getUuid().getValue()))
           .andExpect(jsonPath("$.data.type").exists())
           .andExpect(jsonPath("$.data.title").exists())
           .andExpect(jsonPath("$.data.message").exists());
  }

  @Test
  @DisplayName("현재 사용자의 알림만 조회된다")
  void getFamilyNotifications_ReturnsOnlyCurrentUserNotifications() throws Exception {
    // Given: 다른 사용자 생성 및 가족에 추가
    User otherUser = createOtherUserAndAddToFamily(testFamily);

    // testUser와 otherUser 모두에게 알림이 생성되도록 지출 생성 (80% 초과)
    // otherUser가 추가된 후 지출을 생성하면 두 사용자 모두에게 알림이 생성됨
    CreateExpenseRequest expenseRequest = new CreateExpenseRequest(testCategory.getUuid().getValue(),
                                                                   new BigDecimal("850000.00"),
                                                                   "80% 초과 지출",
                                                                   LocalDateTime.now(),
                                                                   null);
    expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expenseRequest);

    // When: testUser의 알림 조회
    mockMvc.perform(get("/api/v1/families/{familyUuid}/notifications", testFamily.getUuid().getValue())
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
           .andExpect(status().isOk())
           .andExpect(jsonPath("$.success").value(true))
           .andExpect(jsonPath("$.data.notifications").isArray())
           .andExpect(jsonPath("$.data.notifications[*].userUuid").value(Matchers.everyItem(
               Matchers.equalTo(testUser.getUuid().getValue()))));

    // Then: otherUser의 알림은 조회되지 않아야 함 (직접 확인)
    List<Notification> testUserNotifications = notificationRepository.findByFamilyAndUser(testFamily.getUuid(), testUser.getUuid());
    List<Notification> otherUserNotifications = notificationRepository.findByFamilyAndUser(testFamily.getUuid(), otherUser.getUuid());

    // testUser의 알림은 존재해야 하고, 모두 testUser의 것임
    assertThat(testUserNotifications).isNotEmpty();
    assertThat(testUserNotifications).allMatch(n -> n.getUserUuid().equals(testUser.getUuid()));

    // otherUser의 알림도 존재해야 함 (가족 구성원이므로)
    assertThat(otherUserNotifications).isNotEmpty();
  }

  @Test
  @DisplayName("다른 사용자의 알림을 읽으려고 하면 실패한다")
  void markAsRead_Fails_WhenNotificationBelongsToOtherUser() throws Exception {
    // Given: 다른 사용자 생성 및 가족에 추가
    final User otherUser = createOtherUserAndAddToFamily(testFamily);

    // testUser와 otherUser 모두에게 알림이 생성되도록 지출 생성 (80% 초과)
    // otherUser가 추가된 후 지출을 생성하면 두 사용자 모두에게 알림이 생성됨
    CreateExpenseRequest expenseRequest = new CreateExpenseRequest(testCategory.getUuid().getValue(),
                                                                   new BigDecimal("850000.00"),
                                                                   "80% 초과 지출",
                                                                   LocalDateTime.now(),
                                                                   null);
    expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expenseRequest);

    // 다른 사용자의 알림 조회 (반드시 존재해야 함)
    List<Notification> otherUserNotifications = notificationRepository.findByFamilyAndUser(testFamily.getUuid(), otherUser.getUuid());
    assertThat(otherUserNotifications).isNotEmpty();

    // otherUser의 알림임을 확인
    Notification otherUserNotification = otherUserNotifications.getFirst();
    assertThat(otherUserNotification.getUserUuid()).isEqualTo(otherUser.getUuid());
    assertThat(otherUserNotification.getUserUuid()).isNotEqualTo(testUser.getUuid());

    String otherUserNotificationUuid = otherUserNotification.getNotificationUuid()
                                                            .getValue();

    // When & Then: testUser가 otherUser의 알림을 읽으려고 하면 실패
    mockMvc.perform(patch("/api/v1/notifications/{notificationUuid}/read", otherUserNotificationUuid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
           .andExpect(status().isNotFound());
  }

  @Test
  @DisplayName("한 사용자가 읽어도 다른 사용자의 알림은 영향받지 않는다")
  void markAsRead_DoesNotAffectOtherUserNotifications() throws Exception {
    // Given: 다른 사용자 생성 및 가족에 추가
    final User otherUser = createOtherUserAndAddToFamily(testFamily);

    // testUser와 otherUser 모두에게 알림이 생성되도록 지출 생성 (80% 초과)
    // otherUser가 추가된 후 지출을 생성하면 두 사용자 모두에게 알림이 생성됨
    CreateExpenseRequest expenseRequest = new CreateExpenseRequest(testCategory.getUuid().getValue(),
                                                                   new BigDecimal("850000.00"),
                                                                   "80% 초과 지출",
                                                                   LocalDateTime.now(),
                                                                   null);
    expenseService.createExpense(testUser.getUuid(), testFamily.getUuid(), expenseRequest);

    // testUser의 알림 조회 (반드시 존재해야 함)
    List<Notification> testUserNotifications = notificationRepository.findByFamilyAndUser(testFamily.getUuid(), testUser.getUuid());
    assertThat(testUserNotifications).isNotEmpty();
    String testUserNotificationUuid = testUserNotifications.getFirst()
                                                           .getNotificationUuid()
                                                           .getValue();

    // When: testUser의 알림 읽음 처리
    mockMvc.perform(patch("/api/v1/notifications/{notificationUuid}/read", testUserNotificationUuid)
                        .contentType(MediaType.APPLICATION_JSON)
                        .header("X-User-UUID", testUser.getUuid().getValue()))
           .andExpect(status().isOk());

    // Then: otherUser의 알림은 여전히 읽지 않음 상태여야 함
    List<Notification> otherUserNotifications = notificationRepository.findByFamilyAndUser(testFamily.getUuid(), otherUser.getUuid());
    assertThat(otherUserNotifications).isNotEmpty();
    Long otherUserUnreadCount = otherUserNotifications.stream()
                                                      .filter(n -> !n.getIsRead())
                                                      .count();
    assertThat(otherUserUnreadCount).isGreaterThan(0);
  }
}
