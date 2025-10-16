package com.bifos.accountbook.presentation.dto;

import com.bifos.accountbook.domain.value.CustomUuid;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * 로그인한 사용자 정보를 담는 DTO
 * ArgumentResolver에서 Authentication 객체로부터 추출한 사용자 정보를 전달합니다.
 */
@Getter
@AllArgsConstructor
public class LoginUserDto {

    /**
     * 사용자 UUID (CustomUuid 형태)
     */
    private final CustomUuid userUuid;
}
