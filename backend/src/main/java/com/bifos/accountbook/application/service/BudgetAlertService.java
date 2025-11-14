package com.bifos.accountbook.application.service;

import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.Notification;
import com.bifos.accountbook.domain.repository.ExpenseRepository;
import com.bifos.accountbook.domain.repository.FamilyMemberRepository;
import com.bifos.accountbook.domain.repository.FamilyRepository;
import com.bifos.accountbook.domain.repository.NotificationRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.NotificationType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * 예산 알림 서비스
 * 예산 초과 여부를 체크하고 알림을 생성합니다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetAlertService {

  private final FamilyRepository familyRepository;
  private final ExpenseRepository expenseRepository;
  private final NotificationRepository notificationRepository;
  private final FamilyMemberRepository familyMemberRepository;

  /**
   * 예산 알림 체크 및 생성
   * 지출이 생성/수정될 때 호출되어 예산 상태를 체크하고 필요시 알림을 생성합니다.
   * <p>
   * REQUIRES_NEW: TransactionalEventListener에서 호출되므로 새로운 트랜잭션 필요
   *
   * @param familyUuid 가족 UUID
   * @param date       지출 날짜
   */
  @Transactional(propagation = Propagation.REQUIRES_NEW)
  public void checkAndCreateBudgetAlert(CustomUuid familyUuid, LocalDateTime date) {
    // 1. 가족 조회
    Family family = familyRepository.findActiveByUuid(familyUuid).orElse(null);
    if (family == null) {
      log.debug("Family not found or inactive: {}", familyUuid);
      return;
    }

    // 2. 예산 미설정 시 알림 불필요
    if (family.getMonthlyBudget() == null ||
        family.getMonthlyBudget().compareTo(BigDecimal.ZERO) == 0) {
      log.debug("Monthly budget not set for family: {}", familyUuid);
      return;
    }

    // 3. 해당 월의 지출 합계 계산
    YearMonth targetMonth = YearMonth.from(date);
    LocalDateTime startOfMonth = targetMonth.atDay(1).atStartOfDay();
    LocalDateTime endOfMonth = targetMonth.atEndOfMonth().atTime(23, 59, 59);

    BigDecimal totalExpense = expenseRepository.sumAmountByFamilyUuidAndDateBetween(
        familyUuid,
        startOfMonth,
        endOfMonth
    );

    if (totalExpense == null) {
      totalExpense = BigDecimal.ZERO;
    }

    // 4. 예산 대비 사용률 계산
    BigDecimal percentage = calculatePercentage(totalExpense, family.getMonthlyBudget());

    log.info("Budget check - Family: {}, Month: {}, Expense: {}, Budget: {}, Percentage: {}%",
             familyUuid, targetMonth, totalExpense, family.getMonthlyBudget(), percentage);

    // 5. 알림 타입 결정
    NotificationType alertType = determineAlertType(percentage);

    if (alertType == null) {
      log.debug("No alert needed - Percentage: {}%", percentage);
      return;
    }

    // 6. 중복 알림 체크 및 생성
    createAlertIfNotExists(family, targetMonth, alertType, percentage, totalExpense);
  }

  /**
   * 예산 대비 사용률 계산
   */
  private BigDecimal calculatePercentage(BigDecimal totalExpense, BigDecimal budget) {
    if (budget.compareTo(BigDecimal.ZERO) == 0) {
      return BigDecimal.ZERO;
    }

    return totalExpense
        .divide(budget, 4, RoundingMode.HALF_UP)
        .multiply(BigDecimal.valueOf(100))
        .setScale(2, RoundingMode.HALF_UP);
  }

  /**
   * 예산 사용률에 따른 알림 타입 결정
   */
  private NotificationType determineAlertType(BigDecimal percentage) {
    if (percentage.compareTo(BigDecimal.valueOf(100)) > 0) {
      return NotificationType.BUDGET_100_EXCEEDED;
    } else if (percentage.compareTo(BigDecimal.valueOf(80)) > 0) {
      return NotificationType.BUDGET_80_EXCEEDED;
    } else if (percentage.compareTo(BigDecimal.valueOf(50)) > 0) {
      return NotificationType.BUDGET_50_EXCEEDED;
    }
    return null; // 알림 불필요
  }

  /**
   * 중복되지 않은 경우에만 알림 생성
   * 가족의 모든 활성 구성원에게 각각 알림을 생성합니다.
   */
  private void createAlertIfNotExists(
      Family family,
      YearMonth month,
      NotificationType alertType,
      BigDecimal percentage,
      BigDecimal totalExpense) {

    String yearMonth = Notification.formatYearMonth(month);

    // 가족의 모든 활성 구성원 조회
    List<FamilyMember> members = familyMemberRepository.findAllByFamilyUuid(family.getUuid());

    if (members.isEmpty()) {
      log.debug("No active members found for family: {}", family.getUuid());
      return;
    }

    // 각 구성원별로 중복 체크 및 알림 생성
    for (FamilyMember member : members) {
      // 중복 체크: 해당 사용자에게 같은 달에 같은 타입의 알림이 이미 있는지 확인
      List<Notification> existingNotifications = notificationRepository
          .findByFamilyAndType(family.getUuid(), alertType);

      boolean userHasNotification = existingNotifications.stream()
          .anyMatch(n -> n.getUserUuid() != null
              && n.getUserUuid().equals(member.getUserUuid())
              && n.getYearMonth().equals(yearMonth));

      if (userHasNotification) {
        log.debug("Alert already exists for user: {} - Family: {}, Type: {}, Month: {}",
                  member.getUserUuid(), family.getUuid(), alertType, yearMonth);
        continue;
      }

      // 각 구성원별로 알림 생성
      Notification notification = Notification.builder()
                                              .familyUuid(family.getUuid())
                                              .userUuid(member.getUserUuid()) // 각 구성원별 알림
                                              .type(alertType)
                                              .title(generateTitle(alertType))
                                              .message(generateMessage(family, alertType, percentage, totalExpense))
                                              .referenceType("BUDGET")
                                              .yearMonth(yearMonth)
                                              .isRead(false)
                                              .build();

      notificationRepository.save(notification);

      log.info("Budget alert created for user: {} - Family: {}, Type: {}, Percentage: {}%",
               member.getUserUuid(), family.getUuid(), alertType, percentage);
    }
  }

  /**
   * 알림 제목 생성
   */
  private String generateTitle(NotificationType type) {
    return type.getDisplayName();
  }

  /**
   * 알림 메시지 생성
   */
  private String generateMessage(
      Family family,
      NotificationType type,
      BigDecimal percentage,
      BigDecimal totalExpense) {

    String familyName = family.getName();
    String budgetStr = formatCurrency(family.getMonthlyBudget());
    String expenseStr = formatCurrency(totalExpense);
    String percentageStr = percentage.setScale(1, RoundingMode.HALF_UP).toString();

    return switch (type) {
      case BUDGET_50_EXCEEDED -> String.format("%s의 이번 달 예산이 50%%를 초과했습니다. " +
                                                   "현재 %s원 중 %s원(%s%%)을 사용했습니다.",
                                               familyName, budgetStr, expenseStr, percentageStr);
      case BUDGET_80_EXCEEDED -> String.format("%s의 이번 달 예산이 80%%를 초과했습니다. " +
                                                   "현재 %s원 중 %s원(%s%%)을 사용했습니다. 예산 초과에 주의하세요!",
                                               familyName, budgetStr, expenseStr, percentageStr);
      case BUDGET_100_EXCEEDED -> String.format("%s의 이번 달 예산을 초과했습니다! " +
                                                    "예산 %s원 중 %s원(%s%%)을 사용했습니다.",
                                                familyName, budgetStr, expenseStr, percentageStr);
    };
  }

  /**
   * 금액 포맷팅 (천 단위 콤마)
   */
  private String formatCurrency(BigDecimal amount) {
    return String.format("%,d", amount.longValue());
  }
}

