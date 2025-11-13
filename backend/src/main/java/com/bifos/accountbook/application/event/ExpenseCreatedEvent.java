package com.bifos.accountbook.application.event;

import com.bifos.accountbook.domain.value.CustomUuid;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 지출 생성 이벤트
 * 지출이 생성되면 발행되어 예산 알림 체크를 트리거합니다.
 */
public record ExpenseCreatedEvent(CustomUuid expenseUuid,
                                  CustomUuid familyUuid,
                                  CustomUuid userUuid,
                                  BigDecimal amount,
                                  LocalDateTime date) {
}

