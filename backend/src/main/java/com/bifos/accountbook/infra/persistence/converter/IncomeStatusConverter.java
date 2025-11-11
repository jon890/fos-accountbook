package com.bifos.accountbook.infra.persistence.converter;

import com.bifos.accountbook.domain.value.IncomeStatus;
import jakarta.persistence.Converter;

/**
 * IncomeStatus Enum을 DB 코드값으로 변환하는 Converter
 */
@Converter(autoApply = true)
public class IncomeStatusConverter extends AbstractCodeEnumConverter<IncomeStatus> {

    public IncomeStatusConverter() {
        super(IncomeStatus.class);
    }
}

