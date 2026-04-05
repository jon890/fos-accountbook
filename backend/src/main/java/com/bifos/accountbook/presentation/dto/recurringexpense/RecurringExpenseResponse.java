package com.bifos.accountbook.presentation.dto.recurringexpense;

import com.bifos.accountbook.application.dto.common.CategoryInfo;
import com.bifos.accountbook.application.dto.recurringexpense.RecurringExpenseDto;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecurringExpenseResponse {

  private String uuid;
  private String familyUuid;
  private String categoryUuid;
  private CategoryInfo category;
  private String userUuid;
  private String name;
  private BigDecimal amount;
  private int dayOfMonth;
  private String status;
  private boolean generatedThisMonth;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static RecurringExpenseResponse from(RecurringExpenseDto.Response dto) {
    return RecurringExpenseResponse.builder()
        .uuid(dto.getUuid())
        .familyUuid(dto.getFamilyUuid())
        .categoryUuid(dto.getCategoryUuid())
        .category(dto.getCategory())
        .userUuid(dto.getUserUuid())
        .name(dto.getName())
        .amount(dto.getAmount())
        .dayOfMonth(dto.getDayOfMonth())
        .status(dto.getStatus().name())
        .generatedThisMonth(dto.isGeneratedThisMonth())
        .createdAt(dto.getCreatedAt())
        .updatedAt(dto.getUpdatedAt())
        .build();
  }
}
