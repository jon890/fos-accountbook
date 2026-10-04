package com.bifos.accountbook.installment.application.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 할부 생성과 수정이 함께 쓰는 요청. 수정도 다섯 필드를 통째로 받는다. */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class InstallmentRequest {

  // 길이는 trim 뒤 기준이라 InstallmentService 가 검사한다
  @NotBlank(message = "할부 이름은 필수입니다")
  private String name;

  @NotNull(message = "총 금액은 필수입니다")
  @DecimalMin(value = "1", message = "총 금액은 1 이상이어야 합니다")
  @Digits(integer = 10, fraction = 0, message = "총 금액은 10자리 이하 정수여야 합니다")
  private BigDecimal totalAmount;

  @NotNull(message = "할부 개월 수는 필수입니다")
  @Min(value = 2, message = "할부 개월 수는 2 이상이어야 합니다")
  @Max(value = 60, message = "할부 개월 수는 60 이하여야 합니다")
  private Integer installmentMonths;

  @NotBlank(message = "첫 결제 월은 필수입니다")
  @Pattern(regexp = "^\\d{4}-(0[1-9]|1[0-2])$", message = "첫 결제 월은 YYYY-MM 형식이어야 합니다")
  private String startMonth;

  @Size(max = 200, message = "메모는 200자 이하여야 합니다")
  private String memo;
}
