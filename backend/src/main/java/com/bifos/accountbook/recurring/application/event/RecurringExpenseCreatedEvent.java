package com.bifos.accountbook.recurring.application.event;

public record RecurringExpenseCreatedEvent(
    String familyUuid,
    String recurringExpenseName,
    int count) {
}
