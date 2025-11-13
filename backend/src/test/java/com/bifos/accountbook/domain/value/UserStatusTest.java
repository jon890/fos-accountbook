package com.bifos.accountbook.domain.value;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

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
  @DisplayName("CodeEnum 인터페이스를 구현한다")
  void implementsCodeEnum() {
    // Given & When
    UserStatus status = UserStatus.ACTIVE;

    // Then
    assertThat(status).isInstanceOf(CodeEnum.class);
  }
}

