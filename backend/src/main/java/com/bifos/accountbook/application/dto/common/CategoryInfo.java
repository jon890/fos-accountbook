package com.bifos.accountbook.application.dto.common;

import com.bifos.accountbook.domain.entity.Category;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 카테고리 기본 정보 DTO
 * 지출/수입 응답에서 nested 구조로 사용
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CategoryInfo {

  private String uuid;
  private String name;
  private String color;
  private String icon;

  public static CategoryInfo from(Category category) {
    if (category == null) {
      return null;
    }

    return CategoryInfo.builder()
                       .uuid(category.getUuid().getValue())
                       .name(category.getName())
                       .color(category.getColor())
                       .icon(category.getIcon())
                       .build();
  }
}

