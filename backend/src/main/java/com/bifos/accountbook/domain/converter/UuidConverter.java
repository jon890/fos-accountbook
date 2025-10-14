package com.bifos.accountbook.domain.converter;

import com.bifos.accountbook.domain.value.CustomUuid;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA AttributeConverter for CustomUuid
 * 
 * CustomUuid <-> VARCHAR(36) 자동 변환
 * @Converter(autoApply = true)로 설정하면 모든 CustomUuid 필드에 자동 적용
 */
@Converter(autoApply = true)
public class UuidConverter implements AttributeConverter<CustomUuid, String> {
    
    /**
     * Entity -> Database
     * CustomUuid를 String으로 변환하여 DB에 저장
     */
    @Override
    public String convertToDatabaseColumn(CustomUuid attribute) {
        if (attribute == null) {
            return null;
        }
        return attribute.getValue();
    }
    
    /**
     * Database -> Entity
     * DB의 String을 CustomUuid로 변환
     */
    @Override
    public CustomUuid convertToEntityAttribute(String dbData) {
        if (dbData == null || dbData.trim().isEmpty()) {
            return null;
        }
        return CustomUuid.from(dbData);
    }
}

