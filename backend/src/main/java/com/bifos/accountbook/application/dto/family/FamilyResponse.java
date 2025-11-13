package com.bifos.accountbook.application.dto.family;

import com.bifos.accountbook.domain.entity.Family;
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
public class FamilyResponse {

  private String uuid;
  private String name;
  private BigDecimal monthlyBudget;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private Integer memberCount;
  private Integer expenseCount;
  private Integer categoryCount;

  public static FamilyResponse from(Family family) {
    return FamilyResponse.builder()
                         .uuid(family.getUuid().getValue())
                         .name(family.getName())
                         .monthlyBudget(family.getMonthlyBudget())
                         .createdAt(family.getCreatedAt())
                         .updatedAt(family.getUpdatedAt())
                         .memberCount(family.getMembers() != null ? family.getMembers().size() : 0)
                         .expenseCount(0)
                         .categoryCount(0)
                         .build();
  }

  public static FamilyResponse fromWithMemberCount(Family family, int memberCount) {
    return FamilyResponse.builder()
                         .uuid(family.getUuid().getValue())
                         .name(family.getName())
                         .monthlyBudget(family.getMonthlyBudget())
                         .createdAt(family.getCreatedAt())
                         .updatedAt(family.getUpdatedAt())
                         .memberCount(memberCount)
                         .expenseCount(0)
                         .categoryCount(0)
                         .build();
  }

  public static FamilyResponse fromWithCounts(Family family, int memberCount, int expenseCount, int categoryCount) {
    return FamilyResponse.builder()
                         .uuid(family.getUuid().getValue())
                         .name(family.getName())
                         .monthlyBudget(family.getMonthlyBudget())
                         .createdAt(family.getCreatedAt())
                         .updatedAt(family.getUpdatedAt())
                         .memberCount(memberCount)
                         .expenseCount(expenseCount)
                         .categoryCount(categoryCount)
                         .build();
  }
}
