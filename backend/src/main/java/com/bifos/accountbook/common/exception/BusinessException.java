package com.bifos.accountbook.common.exception;

import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

/**
 * 비즈니스 로직 관련 커스텀 예외
 * ErrorCode를 통해 표준화된 예외 처리 제공
 */
@Getter
public class BusinessException extends RuntimeException {

    /**
     * 에러 코드 (ErrorCode enum)
     */
    private final ErrorCode errorCode;

    /**
     * 전달할 파라미터 정보
     * 예: {"userId": "123", "familyId": "456"}
     */
    private final Map<String, Object> parameters;

    /**
     * 디버그용 추가 정보
     * 개발/테스트 환경에서만 노출
     */
    private final Map<String, Object> debugInfo;

    /**
     * 기본 생성자
     *
     * @param errorCode 에러 코드
     */
    public BusinessException(ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
        this.parameters = new HashMap<>();
        this.debugInfo = new HashMap<>();
    }

    /**
     * 메시지 오버라이드 생성자
     *
     * @param errorCode 에러 코드
     * @param message   커스텀 메시지
     */
    public BusinessException(ErrorCode errorCode, String message) {
        super(message);
        this.errorCode = errorCode;
        this.parameters = new HashMap<>();
        this.debugInfo = new HashMap<>();
    }

    /**
     * 원인 예외 포함 생성자
     *
     * @param errorCode 에러 코드
     * @param cause     원인 예외
     */
    public BusinessException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.getMessage(), cause);
        this.errorCode = errorCode;
        this.parameters = new HashMap<>();
        this.debugInfo = new HashMap<>();
    }

    /**
     * 전체 정보 포함 생성자
     *
     * @param errorCode  에러 코드
     * @param message    커스텀 메시지
     * @param parameters 파라미터 정보
     */
    public BusinessException(ErrorCode errorCode, String message, Map<String, Object> parameters) {
        super(message);
        this.errorCode = errorCode;
        this.parameters = parameters != null ? new HashMap<>(parameters) : new HashMap<>();
        this.debugInfo = new HashMap<>();
    }

    /**
     * 파라미터 추가 (빌더 패턴)
     *
     * @param key   파라미터 키
     * @param value 파라미터 값
     * @return this
     */
    public BusinessException addParameter(String key, Object value) {
        this.parameters.put(key, value);
        return this;
    }

    /**
     * 디버그 정보 추가 (빌더 패턴)
     *
     * @param key   디버그 정보 키
     * @param value 디버그 정보 값
     * @return this
     */
    public BusinessException addDebugInfo(String key, Object value) {
        this.debugInfo.put(key, value);
        return this;
    }

    /**
     * 스택 트레이스를 디버그 정보에 추가
     *
     * @return this
     */
    public BusinessException withStackTrace() {
        this.debugInfo.put("stackTrace", getStackTrace());
        return this;
    }

    /**
     * 원인 예외를 디버그 정보에 추가
     *
     * @return this
     */
    public BusinessException withCause() {
        if (getCause() != null) {
            this.debugInfo.put("cause", getCause().getMessage());
            this.debugInfo.put("causeType", getCause().getClass().getName());
        }
        return this;
    }

    /**
     * 편의 메서드: 엔티티를 찾을 수 없을 때
     *
     * @param entityName 엔티티 이름
     * @param id         엔티티 ID
     * @return BusinessException
     */
    public static BusinessException entityNotFound(String entityName, Object id) {
        return new BusinessException(ErrorCode.ENTITY_NOT_FOUND,
                String.format("%s를 찾을 수 없습니다", entityName))
                .addParameter("entityName", entityName)
                .addParameter("id", id);
    }

    /**
     * 편의 메서드: 접근 권한 없음
     *
     * @param resource 리소스 이름
     * @param userId   사용자 ID
     * @return BusinessException
     */
    public static BusinessException accessDenied(String resource, String userId) {
        return new BusinessException(ErrorCode.ACCESS_DENIED,
                String.format("%s에 접근할 권한이 없습니다", resource))
                .addParameter("resource", resource)
                .addParameter("userId", userId);
    }

    /**
     * 편의 메서드: 잘못된 입력값
     *
     * @param fieldName 필드 이름
     * @param value     입력값
     * @param reason    이유
     * @return BusinessException
     */
    public static BusinessException invalidInput(String fieldName, Object value, String reason) {
        return new BusinessException(ErrorCode.INVALID_INPUT_VALUE,
                String.format("%s의 입력값이 올바르지 않습니다: %s", fieldName, reason))
                .addParameter("fieldName", fieldName)
                .addParameter("value", value)
                .addParameter("reason", reason);
    }
}

