package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.dto.auth.AuthResponse;
import com.bifos.accountbook.application.dto.auth.LoginRequest;
import com.bifos.accountbook.application.dto.auth.RegisterRequest;
import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.UserStatus;
import com.bifos.accountbook.infra.security.JwtTokenProvider;
import java.util.Collections;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

  private final UserRepository userRepository;
  private final UserService userService; // 사용자 조회
  private final JwtTokenProvider jwtTokenProvider;

  /**
   * 사용자 등록 또는 로그인 (OAuth 로그인 시 사용)
   */
  @Transactional
  public AuthResponse register(RegisterRequest request) {
    // provider + providerId로 기존 사용자 확인
    if (userRepository.existsByProviderAndProviderId(request.getProvider(), request.getProviderId())) {
      // 이미 존재하면 로그인 처리
      return loginExistingUserByProvider(request.getProvider(), request.getProviderId());
    }

    User user = User.builder()
                    .provider(request.getProvider())
                    .providerId(request.getProviderId())
                    .email(request.getEmail())
                    .name(request.getName())
                    .image(request.getImage())
                    .build();

    user = userRepository.save(user);

    return generateAuthResponse(user);
  }

  /**
   * 로그인 (이메일로 사용자 조회 후 JWT 발급)
   */
  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.getEmail())
                              .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                                  .addParameter("email", request.getEmail()));

    if (user.getStatus() == UserStatus.DELETED) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND, "삭제된 사용자입니다")
          .addParameter("userUuid", user.getUuid().getValue());
    }

    return generateAuthResponse(user);
  }

  /**
   * 기존 사용자 로그인 (provider + providerId로 조회)
   */
  private AuthResponse loginExistingUserByProvider(String provider, String providerId) {
    User user = userRepository.findByProviderAndProviderId(provider, providerId)
                              .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                                  .addParameter("provider", provider)
                                  .addParameter("providerId", providerId));

    if (user.getStatus() == UserStatus.DELETED) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND, "삭제된 사용자입니다")
          .addParameter("userUuid", user.getUuid().getValue());
    }

    return generateAuthResponse(user);
  }

  /**
   * Refresh 토큰으로 새 Access 토큰 발급
   */
  @Transactional(readOnly = true)
  public AuthResponse refreshToken(String refreshToken) {
    if (!jwtTokenProvider.validateToken(refreshToken)) {
      throw new BusinessException(ErrorCode.INVALID_TOKEN, "유효하지 않은 refresh 토큰입니다");
    }

    String userUuid = jwtTokenProvider.getUserIdFromToken(refreshToken);
    if (userUuid == null) {
      throw new BusinessException(ErrorCode.INVALID_TOKEN, "토큰에서 사용자 UUID를 추출할 수 없습니다");
    }

    User user = userService.getUser(CustomUuid.from(userUuid));

    if (user.getStatus() == UserStatus.DELETED) {
      throw new BusinessException(ErrorCode.USER_NOT_FOUND, "삭제된 사용자입니다")
          .addParameter("userUuid", user.getUuid().getValue());
    }

    return generateAuthResponse(user);
  }

  /**
   * 현재 사용자 정보 조회 (UUID 기반)
   */
  @Transactional(readOnly = true)
  public AuthResponse.UserInfo getCurrentUser(String userUuid) {
    User user = userService.getUser(CustomUuid.from(userUuid));

    return AuthResponse.UserInfo.builder()
                                .id(user.getId().toString())
                                .uuid(user.getUuid().getValue())
                                .email(user.getEmail())
                                .name(user.getName())
                                .image(user.getImage())
                                .build();
  }

  /**
   * JWT 토큰 및 사용자 정보 응답 생성
   *
   * JWT의 sub (subject)에는 user.uuid를 사용하여 내부 ID 노출을 방지합니다.
   */
  private AuthResponse generateAuthResponse(User user) {
    var authorities = Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));

    String userUuid = user.getUuid().getValue();
    String accessToken = jwtTokenProvider.generateToken(userUuid, user.getEmail(), authorities);
    String refreshToken = jwtTokenProvider.generateRefreshToken(userUuid);

    return AuthResponse.builder()
                       .accessToken(accessToken)
                       .refreshToken(refreshToken)
                       .tokenType("Bearer")
                       .expiresIn(86400L) // 24시간 (초 단위)
                       .user(AuthResponse.UserInfo.builder()
                                                  .id(user.getId().toString())
                                                  .uuid(userUuid)
                                                  .email(user.getEmail())
                                                  .name(user.getName())
                                                  .image(user.getImage())
                                                  .build())
                       .build();
  }
}
