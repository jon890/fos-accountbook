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

    public static FamilyMemberStatus fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("가족 구성원 상태 코드는 null일 수 없습니다");
        }

        try {
            return valueOf(code);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 가족 구성원 상태 코드: " + code);
        }
    }
}

