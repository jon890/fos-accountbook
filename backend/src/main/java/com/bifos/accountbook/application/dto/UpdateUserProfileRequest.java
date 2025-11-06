package com.bifos.accountbook.application.dto;

import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 사용자 프로필 수정 요청 DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserProfileRequest {

    /**
     * 시간대 (예: "UTC", "Asia/Seoul", "America/New_York")
     * 선택 사항
     */
    @Pattern(regexp = "^[A-Za-z_/]+$", message = "유효한 시간대 형식이 아닙니다")
    private String timezone;

    /**
     * 언어 코드 (예: "ko", "en", "ja")
     * 선택 사항
     */
    @Pattern(regexp = "^[a-z]{2}$", message = "언어 코드는 2자리 소문자여야 합니다")
    private String language;

    /**
     * 통화 코드 (예: "KRW", "USD", "JPY")
     * 선택 사항
     */
    @Pattern(regexp = "^[A-Z]{3}$", message = "통화 코드는 3자리 대문자여야 합니다")
    private String currency;
}

