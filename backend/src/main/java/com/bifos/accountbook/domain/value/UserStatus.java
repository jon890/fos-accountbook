package com.bifos.accountbook.domain.value;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import java.util.Arrays;

/**
 * 사용자 상태
 */
@Getter
@RequiredArgsConstructor
public enum UserStatus implements CodeEnum {
    /**
     * 활성 상태 - 정상적으로 서비스 이용 중
     */
    ACTIVE("ACTIVE"),

    /**
     * 삭제됨 - 탈퇴 처리된 사용자
     */
    DELETED("DELETED");

    private final String code;

    /**
     * 코드값으로부터 UserStatus를 찾아 반환합니다.
     *
     * @param code 코드값
     * @return UserStatus
     * @throws IllegalArgumentException 유효하지 않은 코드값이거나 null인 경우
     */
    public static UserStatus fromCode(String code) {
        if (code == null) {
            throw new IllegalArgumentException("사용자 상태 코드는 null일 수 없습니다");
        }

        try {
            return valueOf(code);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("유효하지 않은 사용자 상태 코드: " + code);
        }
    }
}

