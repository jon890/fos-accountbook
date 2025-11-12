package com.bifos.accountbook.application.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 에러 코드 및 메시지 정의
 * 비즈니스 예외 발생 시 사용할 에러 정보를 관리
 */
@Getter
@AllArgsConstructor
public enum ErrorCode {

    // ============================================
    // Common Errors (1000~1999)
    // ============================================
    INVALID_INPUT_VALUE(HttpStatus.BAD_REQUEST, "C001", "입력값이 올바르지 않습니다"),
    INVALID_TYPE_VALUE(HttpStatus.BAD_REQUEST, "C002", "타입이 올바르지 않습니다"),
    ENTITY_NOT_FOUND(HttpStatus.NOT_FOUND, "C003", "엔티티를 찾을 수 없습니다"),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "C004", "허용되지 않은 메서드입니다"),
    ACCESS_DENIED(HttpStatus.FORBIDDEN, "C005", "접근 권한이 없습니다"),
    INTERNAL_SERVER_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "C006", "서버 내부 오류가 발생했습니다"),
    INVALID_UUID_FORMAT(HttpStatus.BAD_REQUEST, "C007", "UUID 형식이 올바르지 않습니다"),

    // ============================================
    // User Errors (2000~2999)
    // ============================================
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "U001", "사용자를 찾을 수 없습니다"),
    DUPLICATE_USER_EMAIL(HttpStatus.CONFLICT, "U002", "이미 존재하는 이메일입니다"),
    USER_ALREADY_EXISTS(HttpStatus.CONFLICT, "U003", "이미 존재하는 사용자입니다"),

    // ============================================
    // Authentication & Authorization Errors (3000~3999)
    // ============================================
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "A001", "인증이 필요합니다"),
    INVALID_TOKEN(HttpStatus.UNAUTHORIZED, "A002", "유효하지 않은 토큰입니다"),
    EXPIRED_TOKEN(HttpStatus.UNAUTHORIZED, "A003", "만료된 토큰입니다"),
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "A004", "인증 정보가 올바르지 않습니다"),
    FORBIDDEN(HttpStatus.FORBIDDEN, "A005", "접근 권한이 없습니다"),

    // ============================================
    // Family Errors (4000~4999)
    // ============================================
    FAMILY_NOT_FOUND(HttpStatus.NOT_FOUND, "F001", "가족을 찾을 수 없습니다"),
    FAMILY_ALREADY_EXISTS(HttpStatus.CONFLICT, "F002", "이미 존재하는 가족입니다"),
    NOT_FAMILY_MEMBER(HttpStatus.FORBIDDEN, "F003", "해당 가족의 구성원이 아닙니다"),
    FAMILY_MEMBER_NOT_FOUND(HttpStatus.NOT_FOUND, "F004", "가족 구성원을 찾을 수 없습니다"),
    CANNOT_LEAVE_FAMILY_AS_OWNER(HttpStatus.BAD_REQUEST, "F005", "가족 소유자는 탈퇴할 수 없습니다"),

    // ============================================
    // Category Errors (5000~5999)
    // ============================================
    CATEGORY_NOT_FOUND(HttpStatus.NOT_FOUND, "CT001", "카테고리를 찾을 수 없습니다"),
    CATEGORY_ALREADY_EXISTS(HttpStatus.CONFLICT, "CT002", "이미 존재하는 카테고리입니다"),
    CANNOT_DELETE_CATEGORY_IN_USE(HttpStatus.BAD_REQUEST, "CT003", "사용 중인 카테고리는 삭제할 수 없습니다"),

    // ============================================
    // Expense Errors (6000~6999)
    // ============================================
    EXPENSE_NOT_FOUND(HttpStatus.NOT_FOUND, "E001", "지출을 찾을 수 없습니다"),
    INVALID_EXPENSE_AMOUNT(HttpStatus.BAD_REQUEST, "E002", "지출 금액이 올바르지 않습니다"),
    INVALID_EXPENSE_DATE(HttpStatus.BAD_REQUEST, "E003", "지출 날짜가 올바르지 않습니다"),
    EXPENSE_ALREADY_EXISTS(HttpStatus.CONFLICT, "E004", "이미 존재하는 지출입니다"),

    // ============================================
    // Income Errors (6500~6599)
    // ============================================
    INCOME_NOT_FOUND(HttpStatus.NOT_FOUND, "IC001", "수입을 찾을 수 없습니다"),
    INVALID_INCOME_AMOUNT(HttpStatus.BAD_REQUEST, "IC002", "수입 금액이 올바르지 않습니다"),
    INVALID_INCOME_DATE(HttpStatus.BAD_REQUEST, "IC003", "수입 날짜가 올바르지 않습니다"),
    INCOME_ALREADY_EXISTS(HttpStatus.CONFLICT, "IC004", "이미 존재하는 수입입니다"),

    // ============================================
    // Invitation Errors (7000~7999)
    // ============================================
    INVITATION_NOT_FOUND(HttpStatus.NOT_FOUND, "I001", "초대장을 찾을 수 없습니다"),
    INVITATION_EXPIRED(HttpStatus.BAD_REQUEST, "I002", "만료된 초대장입니다"),
    INVITATION_ALREADY_USED(HttpStatus.BAD_REQUEST, "I003", "이미 사용된 초대장입니다"),
    INVALID_INVITATION_TOKEN(HttpStatus.BAD_REQUEST, "I004", "유효하지 않은 초대 토큰입니다"),
    ALREADY_FAMILY_MEMBER(HttpStatus.CONFLICT, "I005", "이미 해당 가족의 구성원입니다"),

    // ============================================
    // Notification Errors (8000~8999)
    // ============================================
    NOTIFICATION_NOT_FOUND(HttpStatus.NOT_FOUND, "N001", "알림을 찾을 수 없습니다");

    private final HttpStatus httpStatus;
    private final String code;
    private final String message;

    /**
     * HTTP 상태 코드 반환
     */
    public int getStatusCode() {
        return httpStatus.value();
    }
}

