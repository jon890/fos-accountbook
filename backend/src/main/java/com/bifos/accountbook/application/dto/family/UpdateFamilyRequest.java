package com.bifos.accountbook.application.dto.family;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateFamilyRequest {

  @NotBlank(message = "가족 이름은 필수입니다")
  @Size(min = 1, max = 100, message = "가족 이름은 1-100자 사이여야 합니다")
  private String name;

  @DecimalMin(value = "0.0", message = "월 예산은 0 이상이어야 합니다")
  private BigDecimal monthlyBudget;
}

