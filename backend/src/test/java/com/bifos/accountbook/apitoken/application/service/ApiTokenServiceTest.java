package com.bifos.accountbook.apitoken.application.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.bifos.accountbook.apitoken.application.dto.CreateApiTokenRequest;
import com.bifos.accountbook.apitoken.application.dto.CreatedApiTokenResponse;
import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import com.bifos.accountbook.apitoken.domain.value.ApiTokenStatus;
import com.bifos.accountbook.apitoken.infra.repository.jpa.ApiTokenJpaRepository;
import com.bifos.accountbook.shared.FosSpringBootTest;
import com.bifos.accountbook.shared.TestFixturesSupport;
import com.bifos.accountbook.shared.value.CustomUuid;
import com.bifos.accountbook.user.domain.entity.User;
import java.time.LocalDateTime;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

@FosSpringBootTest
@DisplayName("연동 토큰 서비스 통합 테스트")
class ApiTokenServiceTest extends TestFixturesSupport {

  private static final LocalDateTime BASE_TIME = LocalDateTime.of(2026, 3, 1, 12, 0, 0);

  @Autowired private ApiTokenService apiTokenService;

  @Autowired private ApiTokenJpaRepository apiTokenJpaRepository;

  private CustomUuid userUuid;
  private String rawToken;
  private String tokenUuid;

  @BeforeEach
  void setUp() {
    User user = fixtures.users.user().build();
    userUuid = user.getUuid();
    CreatedApiTokenResponse created =
        apiTokenService.issue(userUuid, new CreateApiTokenRequest("사용 기록"));
    rawToken = created.getToken();
    tokenUuid = created.getUuid();
  }

  private ApiToken reloadActive() {
    return apiTokenService
        .findActive(rawToken)
        .orElseThrow(() -> new AssertionError("ACTIVE 토큰을 찾지 못했다"));
  }

  @Test
  @DisplayName("해시는 SHA-256 소문자 hex 64자다")
  void hash_IsLowercaseSha256Hex() {
    assertThat(ApiTokenService.hash("abc"))
        .isEqualTo("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  }

  @Test
  @DisplayName("사용 시각은 처음 사용할 때 채우고, 이후에는 5분이 넘게 지났을 때만 갱신한다")
  void recordUsage_UpdatesOnlyAfterFiveMinutes() {
    apiTokenService.recordUsage(reloadActive(), BASE_TIME);
    assertThat(reloadActive().getLastUsedAt()).isEqualTo(BASE_TIME);

    apiTokenService.recordUsage(reloadActive(), BASE_TIME.plusMinutes(4));
    assertThat(reloadActive().getLastUsedAt()).isEqualTo(BASE_TIME);

    apiTokenService.recordUsage(reloadActive(), BASE_TIME.plusMinutes(5));
    assertThat(reloadActive().getLastUsedAt()).isEqualTo(BASE_TIME);

    apiTokenService.recordUsage(reloadActive(), BASE_TIME.plusMinutes(6));
    assertThat(reloadActive().getLastUsedAt()).isEqualTo(BASE_TIME.plusMinutes(6));
  }

  @Test
  @DisplayName("폐기 전에 읽은 엔티티로 사용 시각을 기록해도 폐기 상태는 되돌아가지 않는다")
  void recordUsage_DoesNotRestoreRevokedToken() {
    ApiToken staleToken = reloadActive();

    apiTokenService.revoke(userUuid, CustomUuid.from(tokenUuid));
    apiTokenService.recordUsage(staleToken, BASE_TIME);

    ApiToken stored =
        apiTokenJpaRepository
            .findById(staleToken.getId())
            .orElseThrow(() -> new AssertionError("토큰 행이 없다"));
    assertThat(stored.getStatus()).isEqualTo(ApiTokenStatus.REVOKED);
    assertThat(stored.getLastUsedAt()).isNull();
    assertThat(apiTokenService.findActive(rawToken)).isEmpty();
  }
}
