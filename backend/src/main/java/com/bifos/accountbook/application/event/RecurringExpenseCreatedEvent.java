package com.bifos.accountbook.application.event;

public record RecurringExpenseCreatedEvent(
    String familyUuid,
    String recurringExpenseName,
    int count) {
}
