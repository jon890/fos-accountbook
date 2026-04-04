package com.bifos.accountbook.presentation.dto.recurringexpense;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRecurringExpenseRequest {

  private String categoryUuid;

  private String name;

  @DecimalMin(value = "0.0", inclusive = false, message = "금액은 0보다 커야 합니다")
  @Digits(integer = 10, fraction = 2, message = "금액은 최대 10자리 정수와 2자리 소수를 가질 수 있습니다")
  private BigDecimal amount;

  @Min(value = 1, message = "결제일은 1 이상이어야 합니다")
  @Max(value = 28, message = "결제일은 28 이하여야 합니다")
  private Integer dayOfMonth;
}
