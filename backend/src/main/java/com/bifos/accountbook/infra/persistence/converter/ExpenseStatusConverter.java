package com.bifos.accountbook.infra.persistence.converter;

import com.bifos.accountbook.domain.value.ExpenseStatus;
import jakarta.persistence.Converter;

/**
 * ExpenseStatus Enum을 DB 코드값으로 변환하는 Converter
 */
@Converter(autoApply = true)
public class ExpenseStatusConverter extends AbstractCodeEnumConverter<ExpenseStatus> {

    public ExpenseStatusConverter() {
        super(ExpenseStatus.class);
    }
}

