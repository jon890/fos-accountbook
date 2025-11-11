package com.bifos.accountbook.domain.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

/**
 * 수입 상태
 */
@Getter
@RequiredArgsConstructor
public enum IncomeStatus implements CodeEnum {
    /**
     * 활성 상태
     */
    ACTIVE("ACTIVE"),

    /**
     * 삭제됨
     */
    DELETED("DELETED");

    private final String code;
}

