package com.bifos.accountbook.application.event.listener;

import com.bifos.accountbook.application.event.ExpenseCreatedEvent;
import com.bifos.accountbook.application.event.ExpenseUpdatedEvent;
import com.bifos.accountbook.application.service.BudgetAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * 예산 알림 이벤트 리스너
 * 지출 생성/수정 이벤트를 구독하여 예산 알림 체크를 트리거합니다.
 * <p>
 * TransactionalEventListener를 사용하여 트랜잭션 커밋 후에 이벤트를 처리합니다.
 * 이를 통해 데이터 일관성을 보장하고 테스트에서도 예측 가능한 동작을 제공합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BudgetAlertEventListener {

  private final BudgetAlertService budgetAlertService;

  /**
   * 지출 생성 이벤트 처리
   * 트랜잭션 커밋 후에 예산 상태를 체크합니다.
   */
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void handleExpenseCreated(ExpenseCreatedEvent event) {
    try {
      budgetAlertService.checkAndCreateBudgetAlert(event.familyUuid(), event.date());
    } catch (Exception e) {
      log.error("Failed to check budget alert for expense created event", e);
      // 예외를 삼킴 - 알림 생성 실패가 지출 생성을 방해하지 않도록
    }
  }

  /**
   * 지출 수정 이벤트 처리
   * 트랜잭션 커밋 후에 예산 상태를 재체크합니다.
   */
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void handleExpenseUpdated(ExpenseUpdatedEvent event) {
    try {
      budgetAlertService.checkAndCreateBudgetAlert(event.familyUuid(), event.date());
    } catch (Exception e) {
      log.error("Failed to check budget alert for expense updated event", e);
      // 예외를 삼킴 - 알림 생성 실패가 지출 수정을 방해하지 않도록
    }
  }
}

