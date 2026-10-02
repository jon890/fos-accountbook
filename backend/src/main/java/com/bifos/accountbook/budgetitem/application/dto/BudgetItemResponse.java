package com.bifos.accountbook.budgetitem.application.dto;

import com.bifos.accountbook.budgetitem.domain.entity.BudgetItem;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BudgetItemResponse {

  private String uuid;
  private String name;
  private BigDecimal monthlyLimit;
  private List<String> categoryUuids;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static BudgetItemResponse from(BudgetItem item, List<String> categoryUuids) {
    return BudgetItemResponse.builder()
        .uuid(item.getUuid().getValue())
        .name(item.getName())
        .monthlyLimit(item.getMonthlyLimit())
        .categoryUuids(categoryUuids)
        .createdAt(item.getCreatedAt())
        .updatedAt(item.getUpdatedAt())
        .build();
  }
}
