package com.bifos.accountbook.installment.application.dto;

import com.bifos.accountbook.installment.domain.entity.Installment;
import com.bifos.accountbook.installment.domain.value.InstallmentSchedule;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InstallmentResponse {

  private String uuid;
  private String userUuid;
  private String name;
  private BigDecimal totalAmount;
  private int installmentMonths;
  private String startMonth;
  private String endMonth;
  private String memo;
  private BigDecimal monthlyAmount;
  private BigDecimal firstMonthAmount;
  private int currentRound;
  private BigDecimal thisMonthAmount;
  private BigDecimal remainingAmount;
  private String progress;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static InstallmentResponse from(Installment installment, InstallmentSchedule schedule) {
    return InstallmentResponse.builder()
        .uuid(installment.getUuid().getValue())
        .userUuid(installment.getUserUuid().getValue())
        .name(installment.getName())
        .totalAmount(installment.getTotalAmount().setScale(0, RoundingMode.DOWN))
        .installmentMonths(installment.getInstallmentMonths())
        .startMonth(installment.getStartMonth())
        .endMonth(schedule.endMonth().toString())
        .memo(installment.getMemo())
        .monthlyAmount(schedule.monthlyAmount())
        .firstMonthAmount(schedule.firstMonthAmount())
        .currentRound(schedule.currentRound())
        .thisMonthAmount(schedule.thisMonthAmount())
        .remainingAmount(schedule.remainingAmount())
        .progress(schedule.progress().name())
        .createdAt(installment.getCreatedAt())
        .updatedAt(installment.getUpdatedAt())
        .build();
  }
}
