package com.bifos.accountbook.infra.persistence.converter;

import com.bifos.accountbook.domain.value.UserStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("UserStatusConverter 단위 테스트")
class UserStatusConverterTest {

    private UserStatusConverter converter;

    @BeforeEach
    void setUp() {
        converter = new UserStatusConverter();
    }

    @Test
    @DisplayName("convertToDatabaseColumn() - Enum을 코드값으로 변환한다")
    void convertToDatabaseColumn() {
        // Given
        UserStatus active = UserStatus.ACTIVE;
        UserStatus deleted = UserStatus.DELETED;

        // When
        String activeCode = converter.convertToDatabaseColumn(active);
        String deletedCode = converter.convertToDatabaseColumn(deleted);

        // Then
        assertThat(activeCode).isEqualTo("ACTIVE");
        assertThat(deletedCode).isEqualTo("DELETED");
    }

    @Test
    @DisplayName("convertToDatabaseColumn() - null을 null로 변환한다")
    void convertToDatabaseColumn_Null() {
        // Given
        UserStatus nullStatus = null;

        // When
        String result = converter.convertToDatabaseColumn(nullStatus);

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("convertToEntityAttribute() - 코드값을 Enum으로 변환한다")
    void convertToEntityAttribute() {
        // Given
        String activeCode = "ACTIVE";
        String deletedCode = "DELETED";

        // When
        UserStatus active = converter.convertToEntityAttribute(activeCode);
        UserStatus deleted = converter.convertToEntityAttribute(deletedCode);

        // Then
        assertThat(active).isEqualTo(UserStatus.ACTIVE);
        assertThat(deleted).isEqualTo(UserStatus.DELETED);
    }

    @Test
    @DisplayName("convertToEntityAttribute() - null을 null로 변환한다")
    void convertToEntityAttribute_Null() {
        // Given
        String nullCode = null;

        // When
        UserStatus result = converter.convertToEntityAttribute(nullCode);

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("convertToEntityAttribute() - 빈 문자열을 null로 변환한다")
    void convertToEntityAttribute_EmptyString() {
        // Given
        String emptyCode = "";

        // When
        UserStatus result = converter.convertToEntityAttribute(emptyCode);

        // Then
        assertThat(result).isNull();
    }

    @Test
    @DisplayName("convertToEntityAttribute() - 유효하지 않은 코드는 예외를 발생시킨다")
    void convertToEntityAttribute_InvalidCode() {
        // Given
        String invalidCode = "INVALID";

        // When & Then
        assertThatThrownBy(() -> converter.convertToEntityAttribute(invalidCode))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("DB 값")
                .hasMessageContaining("UserStatus");
    }

    @Test
    @DisplayName("양방향 변환 - Enum → DB → Enum 변환이 일관성을 유지한다")
    void bidirectionalConversion() {
        // Given
        UserStatus original = UserStatus.ACTIVE;

        // When
        String dbValue = converter.convertToDatabaseColumn(original);
        UserStatus restored = converter.convertToEntityAttribute(dbValue);

        // Then
        assertThat(restored).isEqualTo(original);
    }
}

