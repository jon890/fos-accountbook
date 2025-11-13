package com.bifos.accountbook.domain.entity.converter;

import com.bifos.accountbook.domain.value.CodeEnum;
import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * CodeEnum을 DB 코드값으로 변환하는 추상 Converter
 * <p>
 * 사용 예시:
 * <pre>
 * &#64;Converter(autoApply = true)
 * public class UserStatusConverter extends AbstractCodeEnumConverter&lt;UserStatus&gt; {
 *     public UserStatusConverter() {
 *         super(UserStatus.class);
 *     }
 * }
 * </pre>
 *
 * @param <E> CodeEnum을 구현한 Enum 타입
 */
@Converter
public abstract class AbstractCodeEnumConverter<E extends Enum<E> & CodeEnum>
    implements AttributeConverter<E, String> {

  private final Class<E> enumClass;

  protected AbstractCodeEnumConverter(Class<E> enumClass) {
    this.enumClass = enumClass;
  }

  @Override
  public String convertToDatabaseColumn(E attribute) {
    if (attribute == null) {
      return null;
    }
    return attribute.getCode();
  }

  @Override
  public E convertToEntityAttribute(String dbData) {
    if (dbData == null || dbData.isEmpty()) {
      return null;
    }

    try {
      return Enum.valueOf(enumClass, dbData);
    } catch (IllegalArgumentException e) {
      throw new IllegalArgumentException(
          String.format("DB 값 '%s'를 %s로 변환할 수 없습니다", dbData, enumClass.getSimpleName()),
          e
      );
    }
  }
}

