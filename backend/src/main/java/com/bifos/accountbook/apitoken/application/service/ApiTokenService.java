package com.bifos.accountbook.apitoken.application.service;

import com.bifos.accountbook.apitoken.application.dto.ApiTokenResponse;
import com.bifos.accountbook.apitoken.application.dto.CreateApiTokenRequest;
import com.bifos.accountbook.apitoken.application.dto.CreatedApiTokenResponse;
import com.bifos.accountbook.apitoken.domain.entity.ApiToken;
import com.bifos.accountbook.apitoken.domain.repository.ApiTokenRepository;
import com.bifos.accountbook.shared.exception.BusinessException;
import com.bifos.accountbook.shared.exception.ErrorCode;
import com.bifos.accountbook.shared.value.CustomUuid;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ApiTokenService {

  private static final int MAX_ACTIVE_TOKENS = 5;
  private static final String TOKEN_PREFIX = "fab_";
  private static final int TOKEN_RANDOM_BYTES = 32;
  private static final int DISPLAY_PREFIX_LENGTH = 12;
  private static final SecureRandom SECURE_RANDOM = new SecureRandom();

  private final ApiTokenRepository apiTokenRepository;
  private final Clock clock;

  @Transactional
  public CreatedApiTokenResponse issue(CustomUuid userUuid, CreateApiTokenRequest request) {
    if (apiTokenRepository.countActiveByUserUuid(userUuid) >= MAX_ACTIVE_TOKENS) {
      throw new BusinessException(ErrorCode.API_TOKEN_LIMIT_EXCEEDED);
    }

    String rawToken = generateRawToken();
    ApiToken apiToken = ApiToken.builder()
        .userUuid(userUuid)
        .name(request.getName())
        .tokenHash(hash(rawToken))
        .tokenPrefix(rawToken.substring(0, DISPLAY_PREFIX_LENGTH))
        .build();

    ApiToken saved = apiTokenRepository.save(apiToken);
    return CreatedApiTokenResponse.of(saved, rawToken);
  }

  public List<ApiTokenResponse> list(CustomUuid userUuid) {
    return apiTokenRepository.findAllActiveByUserUuid(userUuid).stream()
        .map(ApiTokenResponse::from)
        .toList();
  }

  /**
   * 남의 토큰도 없는 토큰과 같은 404 로 답해 존재 여부를 드러내지 않는다.
   */
  @Transactional
  public void revoke(CustomUuid userUuid, CustomUuid tokenUuid) {
    ApiToken apiToken = apiTokenRepository.findActiveByUuidAndUserUuid(tokenUuid, userUuid)
        .orElseThrow(() -> new BusinessException(ErrorCode.API_TOKEN_NOT_FOUND));
    apiToken.revoke(LocalDateTime.now(clock));
  }

  public Optional<ApiToken> findActive(String rawToken) {
    return apiTokenRepository.findActiveByTokenHash(hash(rawToken));
  }

  @Transactional
  public void recordUsage(ApiToken token, LocalDateTime now) {
    if (token.needsUsageUpdate(now)) {
      apiTokenRepository.updateLastUsedAt(token.getId(), now);
    }
  }

  public static String hash(String rawToken) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-256");
      byte[] hashed = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hashed);
    } catch (NoSuchAlgorithmException e) {
      throw new IllegalStateException("SHA-256 을 쓸 수 없습니다", e);
    }
  }

  private static String generateRawToken() {
    byte[] bytes = new byte[TOKEN_RANDOM_BYTES];
    SECURE_RANDOM.nextBytes(bytes);
    return TOKEN_PREFIX + Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
  }
}
