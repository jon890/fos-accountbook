package com.bifos.accountbook.application.dto.income;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateIncomeRequest {

    private String categoryUuid;

    @DecimalMin(value = "0.0", inclusive = false, message = "금액은 0보다 커야 합니다")
    @Digits(integer = 10, fraction = 2, message = "금액은 최대 10자리 정수와 2자리 소수를 가질 수 있습니다")
    private BigDecimal amount;

    @Size(max = 1000, message = "설명은 최대 1000자까지 가능합니다")
    private String description;

    private LocalDateTime date;
}

