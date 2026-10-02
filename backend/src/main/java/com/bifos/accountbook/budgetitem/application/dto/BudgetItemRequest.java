package com.bifos.accountbook.budgetitem.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 예산 항목 생성과 수정이 함께 쓰는 요청. 수정은 카테고리 묶음을 통째로 바꾼다. */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class BudgetItemRequest {

  // 길이는 trim 뒤 기준이라 BudgetItemService 가 검사한다
  @NotBlank(message = "예산 항목 이름은 필수입니다")
  private String name;

  @NotNull(message = "월 한도는 필수입니다")
  @DecimalMin(value = "0", message = "월 한도는 0 이상이어야 합니다")
  @Digits(integer = 13, fraction = 0, message = "월 한도는 13자리 이하 정수여야 합니다")
  private BigDecimal monthlyLimit;

  @NotEmpty(message = "카테고리를 하나 이상 선택해야 합니다")
  private List<String> categoryUuids;
}
