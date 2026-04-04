package com.bifos.accountbook.application.dto.recurringexpense;

import com.bifos.accountbook.domain.entity.RecurringExpense;
import com.bifos.accountbook.domain.entity.RecurringExpenseStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

public class RecurringExpenseDto {

  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Create {
    private String categoryUuid;
    private String name;
    private BigDecimal amount;
    private int dayOfMonth;
  }

  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Update {
    private String categoryUuid;
    private String name;
    private BigDecimal amount;
    private Integer dayOfMonth;
  }

  @Getter
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Response {
    private String uuid;
    private String familyUuid;
    private String categoryUuid;
    private String userUuid;
    private String name;
    private BigDecimal amount;
    private int dayOfMonth;
    private RecurringExpenseStatus status;
    private boolean generatedThisMonth;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static Response from(RecurringExpense entity, boolean generatedThisMonth) {
      return Response.builder()
          .uuid(entity.getUuid().getValue())
          .familyUuid(entity.getFamilyUuid())
          .categoryUuid(entity.getCategoryUuid())
          .userUuid(entity.getUserUuid())
          .name(entity.getName())
          .amount(entity.getAmount())
          .dayOfMonth(entity.getDayOfMonth())
          .status(entity.getStatus())
          .generatedThisMonth(generatedThisMonth)
          .createdAt(entity.getCreatedAt())
          .updatedAt(entity.getUpdatedAt())
          .build();
    }
  }
}
