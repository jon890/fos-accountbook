package com.bifos.accountbook.category.domain.converter;

import com.bifos.accountbook.category.domain.value.CategoryType;
import com.bifos.accountbook.shared.converter.AbstractCodeEnumConverter;
import jakarta.persistence.Converter;

/** CategoryType을 데이터베이스 코드값으로 변환합니다. */
@Converter(autoApply = true)
public class CategoryTypeConverter extends AbstractCodeEnumConverter<CategoryType> {

  public CategoryTypeConverter() {
    super(CategoryType.class);
  }
}
