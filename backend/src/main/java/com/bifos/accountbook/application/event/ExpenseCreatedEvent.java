package com.bifos.accountbook.application.event;

import com.bifos.accountbook.domain.value.CustomUuid;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 지출 생성 이벤트
 * 지출이 생성되면 발행되어 예산 알림 체크를 트리거합니다.
 */
@Getter
public class ExpenseCreatedEvent {
    private final CustomUuid expenseUuid;
    private final CustomUuid familyUuid;
    private final CustomUuid userUuid;
    private final BigDecimal amount;
    private final LocalDateTime date;

    public ExpenseCreatedEvent(
            CustomUuid expenseUuid,
            CustomUuid familyUuid,
            CustomUuid userUuid,
            BigDecimal amount,
            LocalDateTime date) {
        this.expenseUuid = expenseUuid;
        this.familyUuid = familyUuid;
        this.userUuid = userUuid;
        this.amount = amount;
        this.date = date;
    }
}

