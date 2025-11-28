package com.bifos.accountbook.application.service;

import com.bifos.accountbook.application.exception.BusinessException;
import com.bifos.accountbook.application.exception.ErrorCode;
import com.bifos.accountbook.config.security.AccessToken;
import com.bifos.accountbook.config.security.JwtTokenProvider;
import com.bifos.accountbook.domain.entity.User;
import com.bifos.accountbook.domain.repository.UserRepository;
import com.bifos.accountbook.domain.value.CustomUuid;
import com.bifos.accountbook.domain.value.UserStatus;
import com.bifos.accountbook.presentation.dto.auth.AuthResponse;
import com.bifos.accountbook.presentation.dto.auth.SocialLoginRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
   * 소셜 로그인
   */
  @Transactional
  public AuthResponse socialLogin(SocialLoginRequest request) {
    User user;

    if (userRepository.existsByProviderAndProviderId(request.getProvider(), request.getProviderId())) {
      user = userRepository.findByProviderAndProviderId(request.getProvider(), request.getProviderId())
                           .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND)
                               .addParameter("provider", request.getProvider())
                               .addParameter("providerId", request.getProviderId()));
    } else {
      user = User.builder()
                 .provider(request.getProvider())
                 .providerId(request.getProviderId())
                 .email(request.getEmail())
                 .name(request.getName())
                 .image(request.getImage())
                 .build();

      user = userRepository.save(user);
    }

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
   * JWT 토큰 및 사용자 정보 응답 생성
   * JWT의 sub (subject)에는 user.uuid를 사용하여 내부 ID 노출을 방지합니다.
   */
  private AuthResponse generateAuthResponse(User user) {
    String userUuid = user.getUuid().getValue();
    AccessToken accessToken = jwtTokenProvider.generateToken(user);
    String refreshToken = jwtTokenProvider.generateRefreshToken(user);

    return AuthResponse.builder()
                       .accessToken(accessToken.getToken())
                       .refreshToken(refreshToken)
                       .issuedAt(accessToken.getIssuedAt())
                       .expiredAt(accessToken.getExpiresAt())
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
