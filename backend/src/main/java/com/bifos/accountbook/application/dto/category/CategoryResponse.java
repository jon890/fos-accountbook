package com.bifos.accountbook.application.dto.category;

import com.bifos.accountbook.application.dto.common.CategoryInfo;
import com.bifos.accountbook.domain.entity.Category;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryResponse {

  private String uuid;
  private String familyUuid;
  private String name;
  private String color;
  private String icon;
  private boolean excludeFromBudget;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  public static CategoryResponse from(Category category) {
    return CategoryResponse.builder()
                           .uuid(category.getUuid().getValue())
                           .familyUuid(category.getFamilyUuid().getValue())
                           .name(category.getName())
                           .color(category.getColor())
                           .icon(category.getIcon())
                           .excludeFromBudget(category.isExcludeFromBudget())
                           .createdAt(category.getCreatedAt())
                           .updatedAt(category.getUpdatedAt())
                           .build();
  }

  /**
   * CategoryResponse를 CategoryInfo로 변환
   * IncomeService, ExpenseService에서 사용됩니다.
   */
  public CategoryInfo toCategoryInfo() {
    return CategoryInfo.builder()
                       .uuid(this.uuid)
                       .name(this.name)
                       .color(this.color)
                       .icon(this.icon)
                       .build();
  }
}
