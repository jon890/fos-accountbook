package com.bifos.accountbook.domain.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

/**
 * 가족 상태
 */
@Getter
@RequiredArgsConstructor
public enum FamilyStatus implements CodeEnum {
    /**
     * 활성 상태
     */
    ACTIVE("ACTIVE"),

    /**
     * 삭제됨
     */
    DELETED("DELETED");

    private final String code;

    public static FamilyStatus fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("가족 상태 코드는 null일 수 없습니다");
        }

        try {
            return valueOf(code);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 가족 상태 코드: " + code);
        }
    }
}

