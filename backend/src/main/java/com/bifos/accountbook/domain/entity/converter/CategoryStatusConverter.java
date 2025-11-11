package com.bifos.accountbook.domain.entity.converter;

import com.bifos.accountbook.domain.value.CategoryStatus;
import jakarta.persistence.Converter;

/**
 * CategoryStatus Enum을 DB 코드값으로 변환하는 Converter
 */
@Converter(autoApply = true)
public class CategoryStatusConverter extends AbstractCodeEnumConverter<CategoryStatus> {

    public CategoryStatusConverter() {
        super(CategoryStatus.class);
    }
}

