package com.bifos.accountbook.domain.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

/**
 * 가족 구성원 상태
 */
@Getter
@RequiredArgsConstructor
public enum FamilyMemberStatus implements CodeEnum {
    /**
     * 활성 상태 - 가족 구성원으로 활동 중
     */
    ACTIVE("ACTIVE"),

    /**
     * 탈퇴 - 가족에서 나감
     */
    LEFT("LEFT");

    private final String code;
}

