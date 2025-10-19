package com.bifos.accountbook.common.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * API 에러 응답 DTO
 * 클라이언트에게 전달할 에러 정보를 담는 응답 객체
 */
@Getter
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // null 값은 JSON에 포함하지 않음
public class ErrorResponse {

    /**
     * 에러 발생 시간
     */
    private final LocalDateTime timestamp;

    /**
     * HTTP 상태 코드
     */
    private final int status;

    /**
     * 에러 코드 (ErrorCode enum의 code)
     */
    private final String code;

    /**
     * 에러 메시지
     */
    private final String message;

    /**
     * 요청 경로
     */
    private final String path;

    /**
     * 전달된 파라미터 정보
     * 클라이언트가 어떤 값으로 요청했는지 확인 가능
     */
    private final Map<String, Object> parameters;

    /**
     * 디버그 정보 (개발/테스트 환경에서만 포함)
     */
    private final Map<String, Object> debugInfo;

    /**
     * 필드별 검증 오류 (Validation 실패 시)
     */
    private final Map<String, String> fieldErrors;

    /**
     * BusinessException으로부터 ErrorResponse 생성
     *
     * @param exception BusinessException
     * @param path      요청 경로
     * @return ErrorResponse
     */
    public static ErrorResponse of(BusinessException exception, String path) {
        return ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(exception.getErrorCode().getStatusCode())
                .code(exception.getErrorCode().getCode())
                .message(exception.getMessage())
                .path(path)
                .parameters(exception.getParameters().isEmpty() ? null : exception.getParameters())
                .debugInfo(exception.getDebugInfo().isEmpty() ? null : exception.getDebugInfo())
                .build();
    }

    /**
     * ErrorCode로부터 ErrorResponse 생성
     *
     * @param errorCode ErrorCode
     * @param path      요청 경로
     * @return ErrorResponse
     */
    public static ErrorResponse of(ErrorCode errorCode, String path) {
        return ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(errorCode.getStatusCode())
                .code(errorCode.getCode())
                .message(errorCode.getMessage())
                .path(path)
                .build();
    }

    /**
     * 일반 예외로부터 ErrorResponse 생성
     *
     * @param exception Exception
     * @param path      요청 경로
     * @return ErrorResponse
     */
    public static ErrorResponse of(Exception exception, String path) {
        return ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(ErrorCode.INTERNAL_SERVER_ERROR.getStatusCode())
                .code(ErrorCode.INTERNAL_SERVER_ERROR.getCode())
                .message(exception.getMessage())
                .path(path)
                .build();
    }

    /**
     * Validation 오류로부터 ErrorResponse 생성
     *
     * @param fieldErrors 필드별 에러 메시지
     * @param path        요청 경로
     * @return ErrorResponse
     */
    public static ErrorResponse ofValidationError(Map<String, String> fieldErrors, String path) {
        return ErrorResponse.builder()
                .timestamp(LocalDateTime.now())
                .status(ErrorCode.INVALID_INPUT_VALUE.getStatusCode())
                .code(ErrorCode.INVALID_INPUT_VALUE.getCode())
                .message("입력값 검증에 실패했습니다")
                .path(path)
                .fieldErrors(fieldErrors)
                .build();
    }
}

