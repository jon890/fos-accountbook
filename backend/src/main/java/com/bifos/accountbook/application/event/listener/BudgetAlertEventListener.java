package com.bifos.accountbook.application.event.listener;

import com.bifos.accountbook.application.event.ExpenseCreatedEvent;
import com.bifos.accountbook.application.event.ExpenseUpdatedEvent;
import com.bifos.accountbook.application.service.BudgetAlertService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

/**
 * 예산 알림 이벤트 리스너
 * 지출 생성/수정 이벤트를 구독하여 예산 알림 체크를 트리거합니다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class BudgetAlertEventListener {

    private final BudgetAlertService budgetAlertService;

    /**
     * 지출 생성 이벤트 처리
     * 새로운 지출이 추가되면 예산 상태를 체크합니다.
     */
    @Async
    @EventListener
    public void handleExpenseCreated(ExpenseCreatedEvent event) {
        log.info("Received ExpenseCreatedEvent - Expense: {}, Family: {}, Amount: {}",
                event.getExpenseUuid(), event.getFamilyUuid(), event.getAmount());

        try {
            budgetAlertService.checkAndCreateBudgetAlert(
                    event.getFamilyUuid(),
                    event.getDate()
            );
        } catch (Exception e) {
            log.error("Failed to check budget alert for expense created event", e);
            // 예외를 삼킴 - 알림 생성 실패가 지출 생성을 방해하지 않도록
        }
    }

    /**
     * 지출 수정 이벤트 처리
     * 지출이 수정되면 예산 상태를 재체크합니다.
     */
    @Async
    @EventListener
    public void handleExpenseUpdated(ExpenseUpdatedEvent event) {
        log.info("Received ExpenseUpdatedEvent - Expense: {}, Family: {}, Old: {}, New: {}",
                event.getExpenseUuid(), event.getFamilyUuid(),
                event.getOldAmount(), event.getNewAmount());

        try {
            budgetAlertService.checkAndCreateBudgetAlert(
                    event.getFamilyUuid(),
                    event.getDate()
            );
        } catch (Exception e) {
            log.error("Failed to check budget alert for expense updated event", e);
            // 예외를 삼킴 - 알림 생성 실패가 지출 수정을 방해하지 않도록
        }
    }
}

