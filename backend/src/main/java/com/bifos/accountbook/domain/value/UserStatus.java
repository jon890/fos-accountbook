package com.bifos.accountbook.domain.value;

/**
 * 사용자 상태
 */
public enum UserStatus {
    /**
     * 활성 상태 - 정상적으로 서비스 이용 중
     */
    ACTIVE,

    /**
     * 삭제됨 - 탈퇴 처리된 사용자
     */
    DELETED
}

