package com.bifos.accountbook.application.dto.expense;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CreateExpenseRequest {

    @NotNull(message = "카테고리는 필수입니다")
    private String categoryUuid;

    @NotNull(message = "금액은 필수입니다")
    @DecimalMin(value = "0.0", inclusive = false, message = "금액은 0보다 커야 합니다")
    @Digits(integer = 10, fraction = 2, message = "금액은 최대 10자리 정수와 2자리 소수를 가질 수 있습니다")
    private BigDecimal amount;

    @Size(max = 1000, message = "설명은 최대 1000자까지 가능합니다")
    private String description;

    private LocalDateTime date;
}
