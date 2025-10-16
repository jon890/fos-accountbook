package com.bifos.accountbook.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

/**
 * API 에러 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    @Builder.Default
    private boolean success = false;

    private String message;
    private ErrorDetails error;
    private List<ErrorDetails> errors;  // 여러 에러를 담을 수 있도록 (validation 에러 등)

    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * 단일 에러 메시지 응답
     */
    public static ApiErrorResponse of(String message) {
        return ApiErrorResponse.builder()
                .success(false)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 에러 메시지와 상세 정보를 포함한 응답
     */
    public static ApiErrorResponse of(String message, ErrorDetails error) {
        return ApiErrorResponse.builder()
                .success(false)
                .message(message)
                .error(error)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 에러 메시지와 여러 상세 정보를 포함한 응답 (Validation 에러 등)
     */
    public static ApiErrorResponse of(String message, List<ErrorDetails> errors) {
        return ApiErrorResponse.builder()
                .success(false)
                .message(message)
                .errors(errors)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 에러 상세 정보
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ErrorDetails {
        private String code;
        private String field;
        private Object rejectedValue;
    }
}

