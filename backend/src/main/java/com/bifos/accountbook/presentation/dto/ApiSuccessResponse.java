package com.bifos.accountbook.presentation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * API 성공 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiSuccessResponse<T> {

    @Builder.Default
    private boolean success = true;
    
    private String message;
    private T data;
    
    @Builder.Default
    private LocalDateTime timestamp = LocalDateTime.now();

    /**
     * 데이터만 포함한 성공 응답
     */
    public static <T> ApiSuccessResponse<T> of(T data) {
        return ApiSuccessResponse.<T>builder()
                .success(true)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 메시지와 데이터를 포함한 성공 응답
     */
    public static <T> ApiSuccessResponse<T> of(String message, T data) {
        return ApiSuccessResponse.<T>builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }

    /**
     * 메시지만 포함한 성공 응답 (data가 null인 경우)
     */
    public static <T> ApiSuccessResponse<T> of(String message) {
        return ApiSuccessResponse.<T>builder()
                .success(true)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
}

