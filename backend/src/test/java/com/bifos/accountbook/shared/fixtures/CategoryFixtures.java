package com.bifos.accountbook.shared.fixtures;

import com.bifos.accountbook.category.domain.entity.Category;
import com.bifos.accountbook.family.domain.entity.Family;
import com.bifos.accountbook.category.domain.repository.CategoryRepository;

/**
 * Category 도메인 테스트 Fixture
 *
 * 카테고리 생성 및 관리를 담당
 */
public class CategoryFixtures {

  private final CategoryRepository categoryRepository;
  private final FamilyFixtures familyFixtures;

  // 기본 category (lazy initialization)
  private Category defaultCategory;

  public CategoryFixtures(
      CategoryRepository categoryRepository,
      FamilyFixtures familyFixtures) {
    this.categoryRepository = categoryRepository;
    this.familyFixtures = familyFixtures;
  }

  /**
   * 기본 카테고리 반환 (lazy initialization)
   */
  public Category getDefaultCategory() {
    if (defaultCategory == null) {
      defaultCategory = category(familyFixtures.getDefaultFamily()).build();
    }
    return defaultCategory;
  }

  /**
   * Category Builder 시작점
   *
   * @param family 카테고리가 속할 가족
   */
  public CategoryBuilder category(Family family) {
    return new CategoryBuilder(categoryRepository, family);
  }

  /**
   * 이름으로 카테고리 찾기
   */
  public Category findByName(Family family, String name) {
    return categoryRepository.findAllByFamilyUuid(family.getUuid())
                             .stream()
                             .filter(c -> name.equals(c.getName()))
                             .findFirst()
                             .orElseThrow(() -> new IllegalArgumentException(
                                 "카테고리를 찾을 수 없습니다: " + name));
  }

  /**
   * 캐시 초기화
   */
  public void clear() {
    this.defaultCategory = null;
  }

  /**
   * Category Builder - 카테고리 생성
   */
  public static class CategoryBuilder {
    private String name = "Test Category";
    private String color = "#6366f1";
    private String icon = "🏷️";

    private final CategoryRepository categoryRepository;
    private final Family family;

    CategoryBuilder(CategoryRepository categoryRepository, Family family) {
      this.categoryRepository = categoryRepository;
      this.family = family;
    }

    public CategoryBuilder name(String name) {
      this.name = name;
      return this;
    }

    public CategoryBuilder color(String color) {
      this.color = color;
      return this;
    }

    public CategoryBuilder icon(String icon) {
      this.icon = icon;
      return this;
    }

    public Category build() {
      Category category = Category.builder()
                                  .familyUuid(family.getUuid())
                                  .name(name)
                                  .color(color)
                                  .icon(icon)
                                  .build();
      return categoryRepository.save(category);
    }
  }
}

