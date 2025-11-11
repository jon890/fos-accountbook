package com.bifos.accountbook.domain.value;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("UserStatus 단위 테스트")
class UserStatusTest {

    @Test
    @DisplayName("getCode() - 코드값을 반환한다")
    void getCode() {
        // Given & When & Then
        assertThat(UserStatus.ACTIVE.getCode()).isEqualTo("ACTIVE");
        assertThat(UserStatus.DELETED.getCode()).isEqualTo("DELETED");
    }

    @Test
    @DisplayName("fromCode() - 유효한 코드로 Enum을 찾는다")
    void fromCode_Success() {
        // Given
        String activeCode = "ACTIVE";
        String deletedCode = "DELETED";

        // When
        UserStatus active = UserStatus.fromCode(activeCode);
        UserStatus deleted = UserStatus.fromCode(deletedCode);

        // Then
        assertThat(active).isEqualTo(UserStatus.ACTIVE);
        assertThat(deleted).isEqualTo(UserStatus.DELETED);
    }

    @Test
    @DisplayName("fromCode() - 유효하지 않은 코드는 예외를 발생시킨다")
    void fromCode_InvalidCode() {
        // Given
        String invalidCode = "INVALID";

        // When & Then
        assertThatThrownBy(() -> UserStatus.fromCode(invalidCode))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("유효하지 않은 사용자 상태 코드");
    }

    @Test
    @DisplayName("fromCode() - null 코드는 예외를 발생시킨다")
    void fromCode_NullCode() {
        // Given
        String nullCode = null;

        // When & Then
        assertThatThrownBy(() -> UserStatus.fromCode(nullCode))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("null일 수 없습니다");
    }

    @Test
    @DisplayName("CodeEnum 인터페이스를 구현한다")
    void implementsCodeEnum() {
        // Given & When
        UserStatus status = UserStatus.ACTIVE;

        // Then
        assertThat(status).isInstanceOf(CodeEnum.class);
    }
}

