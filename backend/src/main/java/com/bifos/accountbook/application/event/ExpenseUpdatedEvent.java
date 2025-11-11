package com.bifos.accountbook.application.event;

import com.bifos.accountbook.domain.value.CustomUuid;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 지출 수정 이벤트
 * 지출이 수정되면 발행되어 예산 알림 체크를 트리거합니다.
 */
@Getter
public class ExpenseUpdatedEvent {
    private final CustomUuid expenseUuid;
    private final CustomUuid familyUuid;
    private final CustomUuid userUuid;
    private final BigDecimal newAmount;
    private final BigDecimal oldAmount;
    private final LocalDateTime date;

    public ExpenseUpdatedEvent(
            CustomUuid expenseUuid,
            CustomUuid familyUuid,
            CustomUuid userUuid,
            BigDecimal newAmount,
            BigDecimal oldAmount,
            LocalDateTime date) {
        this.expenseUuid = expenseUuid;
        this.familyUuid = familyUuid;
        this.userUuid = userUuid;
        this.newAmount = newAmount;
        this.oldAmount = oldAmount;
        this.date = date;
    }
}

