package com.bifos.accountbook.application.aspect;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.application.service.NotificationService;
import com.bifos.accountbook.common.FosSpringBootTest;
import com.bifos.accountbook.common.TestFixturesSupport;
import com.bifos.accountbook.domain.entity.Family;
import com.bifos.accountbook.domain.entity.FamilyMember;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.value.CustomUuid;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * FamilyAccessAspect 통합 테스트
 * AOP가 Service 메서드 호출 시 권한 검증을 자동으로 수행하는지 테스트
 *
 */
@FosSpringBootTest
@DisplayName("FamilyAccessAspect 통합 테스트")
class FamilyAccessAspectTest extends TestFixturesSupport {

  @Autowired
  private NotificationService notificationService;

  @Test
  @DisplayName("@ValidateFamilyAccess - 가족 멤버인 경우 권한 검증 통과")
  void validateFamilyAccess_WithValidMember_Success() {
    // Given: 가족과 멤버 생성 (family() 생성 시 자동으로 owner가 멤버로 추가됨)
    User user = fixtures.getDefaultUser();
    Family family = fixtures.families.family().owner(user).build();

    // When & Then: AOP가 자동으로 권한 검증하고 통과해야 함
    assertDoesNotThrow(() ->
        notificationService.getUnreadCount(user.getUuid(), family.getUuid())
    );
  }

  @Test
  @DisplayName("@ValidateFamilyAccess - 가족 멤버가 아닌 경우 권한 검증 실패")
  void validateFamilyAccess_WithNonMember_ThrowsException() {
    // Given: 가족은 있지만 멤버가 아닌 사용자
    User nonMember = fixtures.users.user().email("nonmember@test.com").build();
    Family family = fixtures.getDefaultFamily(); // 다른 사용자가 owner

    // When & Then: AOP가 자동으로 권한 검증하고 실패해야 함
    assertThatThrownBy(() ->
        notificationService.getUnreadCount(nonMember.getUuid(), family.getUuid())
    )
        .isInstanceOf(BusinessException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FAMILY_MEMBER);
  }

  @Test
  @DisplayName("@ValidateFamilyAccess - 존재하지 않는 가족 UUID인 경우 권한 검증 실패")
  void validateFamilyAccess_WithInvalidFamilyUuid_ThrowsException() {
    // Given: 사용자는 있지만 존재하지 않는 가족 UUID
    User user = fixtures.getDefaultUser();
    CustomUuid invalidFamilyUuid = CustomUuid.generate();

    // When & Then: AOP가 자동으로 권한 검증하고 실패해야 함
    assertThatThrownBy(() ->
        notificationService.getUnreadCount(user.getUuid(), invalidFamilyUuid)
    )
        .isInstanceOf(BusinessException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FAMILY_MEMBER);
  }

  @Test
  @DisplayName("@ValidateFamilyAccess - 여러 가족이 있을 때 각자의 가족에만 접근 가능")
  void validateFamilyAccess_WithMultipleFamilies_OnlyAccessOwnFamily() {
    // Given: 두 개의 독립적인 가족
    User user1 = fixtures.users.user().email("user1@test.com").build();
    User user2 = fixtures.users.user().email("user2@test.com").build();

    Family family1 = fixtures.families.family().name("Family 1").owner(user1).build();
    Family family2 = fixtures.families.family().name("Family 2").owner(user2).build();

    // When & Then: user1은 family1에만 접근 가능
    assertDoesNotThrow(() ->
        notificationService.getUnreadCount(user1.getUuid(), family1.getUuid())
    );

    assertThatThrownBy(() ->
        notificationService.getUnreadCount(user1.getUuid(), family2.getUuid())
    )
        .isInstanceOf(BusinessException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FAMILY_MEMBER);

    // user2는 family2에만 접근 가능
    assertDoesNotThrow(() ->
        notificationService.getUnreadCount(user2.getUuid(), family2.getUuid())
    );

    assertThatThrownBy(() ->
        notificationService.getUnreadCount(user2.getUuid(), family1.getUuid())
    )
        .isInstanceOf(BusinessException.class)
        .hasFieldOrPropertyWithValue("errorCode", ErrorCode.NOT_FAMILY_MEMBER);
  }
}

