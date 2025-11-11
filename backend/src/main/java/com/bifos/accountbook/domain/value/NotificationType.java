package com.bifos.accountbook.domain.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 알림 타입
 */
@Getter
@RequiredArgsConstructor
public enum NotificationType implements CodeEnum {
    /**
     * 예산 50% 초과 경고
     */
    BUDGET_50_EXCEEDED("BUDGET_50_EXCEEDED", "예산 50% 초과", "이번 달 예산의 50%를 초과했습니다."),

    /**
     * 예산 80% 초과 경고
     */
    BUDGET_80_EXCEEDED("BUDGET_80_EXCEEDED", "예산 80% 초과", "이번 달 예산의 80%를 초과했습니다."),

    /**
     * 예산 100% 초과 (예산 초과)
     */
    BUDGET_100_EXCEEDED("BUDGET_100_EXCEEDED", "예산 100% 초과", "이번 달 예산을 초과했습니다.");

    private final String code;
    private final String displayName;
    private final String defaultMessage;
}

