package com.bifos.accountbook.category.domain.value;

/**
 * 카테고리 색상 형식. #RRGGBB 와 프론트 팔레트가 보내는 oklch(L C H) 를 받는다. OKLCH 는 소수 세 개를 공백 하나로 나눈 형식만 받고 %, deg,
 * 알파는 받지 않는다.
 */
public final class CategoryColor {

  public static final String PATTERN =
      "^(#[0-9A-Fa-f]{6}|oklch\\(\\d*\\.?\\d+ \\d*\\.?\\d+ \\d*\\.?\\d+\\))$";

  public static final String MESSAGE = "색상은 #RRGGBB 또는 oklch(L C H) 형식이어야 합니다";

  private CategoryColor() {}

  public static boolean isValid(String color) {
    return color.matches(PATTERN);
  }
}
